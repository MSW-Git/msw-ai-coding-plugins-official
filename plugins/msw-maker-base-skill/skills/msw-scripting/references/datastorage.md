# DataStorage — Cost, Limits, and Safe Usage Guide

> **⚠️ IMPORTANT — This document is directly tied to billing.**
> DataStorage calls consume **Credit**, and worlds that exceed their Credit budget may have future requests **blocked**.
> Even today, exceeding the threshold is recorded in the **critical report** (for published worlds). When generating code,
> AI **must** follow the rules below to prevent excessive storage usage.

---

## 0. 90-Second Summary — 5 Rules You Must Follow

1. **Never call DataStorage functions inside `OnUpdate`, every frame, or short-interval timers (<1s).** Saves and reads must be **event-driven** only.
2. **Compare against the cache before writing.** If the value has not changed, do not call `SetAsync`/`SetAndWait`.
3. **For multiple keys, always use `Batch*`.** Running `SetAsync` inside a `for` loop consumes Credit linearly.
4. **Design for value strings ≤ 4,000 bytes.** Going over 4,000 bytes consumes **proportionally more Credit**.
5. **Use `Transact*` only when atomicity is truly required.** It costs **2× the Credit** of Batch.

> For player-data systems with multiple domains (basic info / inventory / quest / …), follow the reference architecture in **§8 Multi-Component Persistence Protocol** — one BatchGet on login, one BatchSet on flush, per-domain dirty flags. Do not invent ad-hoc save logic per Component.

---

## 1. Hard Limits (immediate error if exceeded)

| Field | Limit (UTF-8 bytes) |
|------|--------------------|
| DataStorage name | 1 ~ 64 |
| Key | 1 ~ 100 |
| Tag | 0 ~ 64 |
| Version | 0 ~ 64 |
| `Update*` value | 0 ~ 50,000 |
| `Set*` value | 0 ~ 300,000 |

> Actually using the per-Set maximum (300KB) burns **75+ Credits** in a single call. Do not store anywhere near the limit.

---

## 2. Credit Model — What AI Must Understand

Credit accumulates and is consumed **per FunctionGroup**, summed across **all instances** of the world.

| FunctionGroup | Granted/min | Max accumulation | Cost per request |
|---|---|---|---|
| **Set** / **Get** | `100 + (concurrent_users × 10)` | grant × 2 | **1 per 4,000 bytes** |
| **Delete** | `50 + (concurrent_users × 2)` | grant × 2 | **1 per 4,000 bytes** |
| **List** / **List DataStorage** / **Delete DataStorage** | `10 + (concurrent_users × 2)` | grant × 2 | 1 |
| **List Sorted** | `50 + (concurrent_users × 2)` | grant × 2 | 1 |
| **None** (local handles such as `GetGlobalDataStorage`) | — | — | 0 |

### Credit by byte size (Set/Get/Delete)

```
0 ~ 4,000 bytes   → 1 credit
4,001 ~ 8,000     → 2 credit
8,001 ~ 12,000    → 3 credit
... (rounded up in 4,000-byte chunks)
```

Key/Tag/Version sizes have **no effect** on Credit. Only the value size is counted.

### Storage Layout Conventions

When data is keyed by player, pick one of two layouts:

| Layout | Pattern | When to use |
|---|---|---|
| **Per-user container** | `GetUserDataStorage(profileCode)` + storage key = field name (e.g. `"PlayerData"`) | Player-owned data with multiple independent keys per user (basic info, inventory, quests). Each key is independently batched and versioned. |
| **Global with profileCode key** | `GetGlobalDataStorage("YourFeature")` + storage key = `profileCode` | Cross-user data accessed by *another* user (ban list, friendship, social graph). One slot per user inside one global container. |

**The first-party PlayerData reference passes ProfileCode to `GetUserDataStorage(...)`.** The API signature names its parameter `userId`, but the published MSW PlayerData reference consistently passes `self.Entity.PlayerComponent.ProfileCode`. The behavioral difference between passing UserId vs ProfileCode has not been independently verified here, so when implementing cross-session player saves, mirror the first-party pattern (ProfileCode) until your own playtest confirms otherwise.

**Centralize storage names on an owning `@Logic` singleton.** Hard-coded string literals scattered across files are a silent data-loss bug waiting to happen (one typo → new empty container).

```lua
@Logic
script GMPlayerDataToolLogic extends Logic
    property string StorageName = "PlayerData"
end
```

Other scripts then read it via `_GMPlayerDataToolLogic.StorageName`.

### Special Rules

- **Reading a non-existent key still consumes Credit** → do not blindly query when existence is unknown.
- **Batch family**: the first 25 entries are charged immediately at call time; the rest are charged when `MoveToNextPageAndWait()` is invoked.
- **Transact family**: **2× the Credit** of Batch. Use only when atomicity is required. Up to 20 keys per call.
- **`MoveToNextPageAndWait()` after `LoadNextPageAndWait()`**: pages already loaded do not consume additional Credit.

---

## 3. Anti-Patterns — Do Not Generate

### ❌ Saving every frame / on a short repeating timer

```lua
-- Forbidden: OnUpdate runs every frame (typically 30~60Hz). Credit is exhausted instantly.
method void OnUpdate(number dt)
    self.storage:SetAsync("Hp", tostring(self.Hp), nil)
end

-- Forbidden: short-interval repeating timers are equivalent
_TimerService:SetTimerRepeat(function()
    self.storage:SetAsync("Pos", tostring(self.Entity.TransformComponent.WorldPosition), nil)
end, 0.1)
```

### ❌ Per-element Set/Get inside a loop

```lua
-- Forbidden: 10 saves = 10 Credits + 10 network requests
for i, item in ipairs(items) do
    self.storage:SetAsync(item.Key, item.Value, nil)
end
```

→ **Replace with**: `BatchSetAndWait` / `BatchSetAsync` (handled in a single request, Credit per request scales with bytes).

### ❌ Saving an unchanged value every time

```lua
-- Forbidden: identical values still consume Credit.
method void OnHit()
    self.storage:SetAsync("LastHit", os.time(), nil)
end
```

→ **Replace with**: save only when the value changes, or **batch up changes on a periodic flush (debounce)**.

### ❌ Storing an entire table as one giant string

```lua
-- Caution: a 50KB result from TableToString costs 13 Credits in a single Set.
local bigStr = _UtilLogic:TableToString(self.EntireInventory)  -- assume 50KB
self.storage:SetAsync("Inventory", bigStr, nil)
```

→ **Replace with**: **split rarely-changing data and frequently-changing data into separate keys**, or save only the diff.

### ❌ Calling DataStorage from the client

`_DataStorageService:Get*DataStorage` is **Server Only**. Calls from client space will not execute.
→ Use **only inside methods marked `@ExecSpace("ServerOnly")`**.

---

## 4. Recommended Patterns

### 4.1 Read once, then serve from in-memory cache

```lua
@ExecSpace("ServerOnly")
method void OnBeginPlay()
    self.storage = _DataStorageService:GetGlobalDataStorage("PlayerStats")
    local errorCode, raw = self.storage:GetAndWait(self.UserId)
    self.cache = (errorCode == 0 and raw) and _UtilLogic:StringToTable(raw) or {}
end

@ExecSpace("ServerOnly")
method void GetStat(string key)
    return self.cache[key]  -- no DB roundtrip
end
```

### 4.2 Writes use a dirty flag + debounce

```lua
-- Mark dirty only on actual change, and flush on a fixed cadence
@ExecSpace("ServerOnly")
method void SetStat(string key, any value)
    if self.cache[key] == value then return end  -- no change → no save
    self.cache[key] = value
    self.dirty = true
end

@ExecSpace("ServerOnly")
method void OnBeginPlay()
    -- Flush example: every 30 seconds, or only on logout / important events
    self.flushTimer = _TimerService:SetTimerRepeat(function()
        if not self.dirty then return end
        self.dirty = false
        self.storage:SetAsync(self.UserId, _UtilLogic:TableToString(self.cache), nil)
    end, 30.0)
end

@ExecSpace("ServerOnly")
method void OnEndPlay()
    if self.flushTimer then _TimerService:ClearTimer(self.flushTimer) end
    if self.dirty then
        self.storage:SetAndWait(self.UserId, _UtilLogic:TableToString(self.cache))
    end
end
```

### 4.3 Use Batch for multiple keys

```lua
@ExecSpace("ServerOnly")
method void SaveAll()
    local kv = {}
    for k, v in pairs(self.cache) do kv[k] = tostring(v) end
    local errorCode, successKeys = self.storage:BatchSetAndWait(kv)
    if errorCode ~= 0 then
        log_warning("BatchSet partial failure, success key count: " .. tostring(#successKeys))
    end
end
```

### 4.4 Use Increase for SortableDataStorage counters

```lua
-- Forbidden pattern: Get → +1 → Set (2× Credit + race condition). Use Increase for atomic update.
local errorCode, newScore = self.ranking:IncreaseAndWait(userId, delta)
```

### 4.5 Pick the right storage for the job

| Storage | Scope | Type | Use Case |
|---|---|---|---|
| `GlobalDataStorage` | World | string | World-wide settings/state |
| `UserDataStorage` | User | string | Inventory, progression |
| `CreatorDataStorage` | Creator (shared across worlds) | string | Creator-wide values |
| `SortableDataStorage` | World | int | Rankings, cumulative scores |

**Rule**: User data must live in `UserDataStorage`. Do not dump `user_<id>_xxx` keys into Global.

### 4.6 BatchGet returns paged results — drain every page

`BatchGetAndWait(keys)` returns `(errorCode, DataStorageItemPages)`. The pages object is **not** a plain list — you must loop until `IsLastPage` is true. Skipping the loop silently drops keys past the first page.

```lua
@ExecSpace("ServerOnly")
method boolean BatchGetAndWait(string profileCode, table loadKeys, table outLoadedData)
    local ds = _DataStorageService:GetUserDataStorage(profileCode)
    local code, itemPages = ds:BatchGetAndWait(loadKeys)
    if code ~= 0 then
        log_error(string.format("BatchGetAndWait failed. ErrorCode: %d", code))
        return false
    end

    while true do
        local datas = itemPages:GetCurrentPageDatas()
        if datas == nil then break end

        for i = 1, #datas do
            outLoadedData[datas[i].KeyInfo.Key] = datas[i]   -- DataStorageItem
        end

        if itemPages.IsLastPage then break end

        -- Load next page first and check its error code; only then move the cursor.
        -- Skipping LoadNextPageAndWait swallows network/storage errors silently.
        local loadErr = itemPages:LoadNextPageAndWait()
        if loadErr ~= 0 then
            log_error(string.format("LoadNextPageAndWait failed. ErrorCode: %d", loadErr))
            return false
        end
        itemPages:MoveToNextPageAndWait()
    end

    return true
end
```

Each entry is a `DataStorageItem` exposing `.KeyInfo.Key` and `.Value` (the stored string). Decode `.Value` per key as needed (`_HttpService:JSONDecode(item.Value)`).

> If a requested key has never been written, BatchGet **omits** it from the pages instead of returning a NotFound row. Always nil-check `loadedData[key]` before reading `.Value`.

### 4.7 AndWait on user-leave, Async on periodic flush

Two save windows in a typical player session — pick the matching variant for each:

| Window | Variant | Why |
|---|---|---|
| User leaving (`UserLeaveEvent`) | `~AndWait` | Last chance to persist. Block until storage confirms before the session tears down. |
| Periodic auto-save during play | `~Async` + callback | Frame-budget critical. Async never blocks the game loop. Published reference cadence: 5 minutes. |

```lua
@Component
script PlayerDBManager extends Component

    property integer TimerId = 0

    @ExecSpace("ServerOnly")
    method void StartAutoSave()
        local period = 300   -- seconds
        self.TimerId = _TimerService:SetTimerRepeat(function()
            self:SaveToDB(false)            -- false = playing, use Async
        end, period, period)
    end

    @ExecSpace("ServerOnly")
    method void SaveToDB(boolean isLeaving)
        local saveData = {}
        self.Entity.PlayerData:SaveToDB(saveData)
        -- (more components contribute their keys here)

        -- Skip the round-trip entirely when no component had anything to save.
        -- Otherwise empty BatchSet wastes a service call and contradicts the
        -- "unchanged domains cost zero Credit" guarantee.
        if next(saveData) == nil then return end

        local profileCode = self.Entity.PlayerComponent.ProfileCode
        local ds = _DataStorageService:GetUserDataStorage(profileCode)

        if isLeaving then
            -- Block until durable, AND check the result — this is the player's last-chance save.
            local errorCode, successKeys = ds:BatchSetAndWait(saveData)
            if errorCode ~= 0 then
                log_error(string.format(
                    "Logout save failed. ErrorCode: %d, succeeded keys: %d",
                    errorCode, #successKeys))
                -- See §4.8 for the failed-keys resolution pattern.
            end
        else
            ds:BatchSetAsync(saveData, function(errorCode, successKeys)
                if errorCode ~= 0 then
                    log_warning("Periodic save partial failure, success count: " .. tostring(#successKeys))
                end
            end)
        end
    end

    @ExecSpace("ServerOnly")
    @EventSender("Service", "UserService")
    handler HandleUserLeaveEvent(UserLeaveEvent event)
        if event.UserId ~= self.Entity.PlayerComponent.UserId then return end
        _TimerService:ClearTimer(self.TimerId)
        self:SaveToDB(true)                 -- true = leaving, use AndWait
    end
end
```

### 4.8 BatchSet partial failure — `successKeys` is the SUCCEEDED list

`BatchSetAndWait(keyValues) → (errorCode, List<string>)`. When `errorCode ~= 0` (typically `1000006 PartialFailure`), the second return is the **succeeded** keys, not the failed ones. Compute `failed = inputKeys − successKeys` to retry.

```lua
local errorCode, successKeys = ds:BatchSetAndWait(keyValues)
if errorCode ~= 0 then
    local failed = {}
    for k, _ in pairs(keyValues) do failed[k] = true end
    for i = 1, #successKeys do failed[successKeys[i]] = nil end

    -- `failed` now holds keys that need retry / alerting
    for k, _ in pairs(failed) do
        log_warning("BatchSet failed key: " .. k)
    end
end
```

The same shape applies to `BatchSetAsync` (second callback arg is succeeded keys) and `BatchDeleteAndWait` (second return is deleted keys).

### 4.9 Serialize through a `@Struct` mirror, decode with default fallbacks

Don't serialize a Component directly. Mirror its persisted fields into a `@Struct` and route Component ↔ JSON through that struct. This isolates the storage schema from the runtime Component shape, lets you add/rename fields without breaking save files, and keeps serialization unit-testable.

```lua
@Struct
script PlayerBasicInfo

    property integer Level = 0
    property integer Dia = 0
    property integer Meso = 0
    property string  Extra = ""

    method void Init()
        self.Level = 1                  -- new-account defaults go here, not in Deserialize
    end

    method boolean Serialize(table out)
        local t = {}
        out["Basic"] = t                -- nested key namespacing keeps room for future struct versions
        t["Level"] = self.Level
        t["Dia"]   = self.Dia
        t["Meso"]  = self.Meso
        t["Extra"] = self.Extra
        return true
    end

    method boolean Deserialize(table src)
        local t = src["Basic"]
        if t == nil then return true end    -- legacy save before this struct existed → keep Init() defaults

        self.Level = t["Level"] or 1        -- `x or default` covers missing-field forward compat
        self.Dia   = t["Dia"]   or 0
        self.Meso  = t["Meso"]  or 0
        self.Extra = t["Extra"] or ""
        return true
    end

    method void ToComponent(PlayerData comp)
        comp.Level = self.Level
        comp.Dia   = self.Dia
        comp.Meso  = self.Meso
        comp.Extra = self.Extra
    end

    method void FromComponent(PlayerData comp)
        self.Level = comp.Level
        self.Dia   = comp.Dia
        self.Meso  = comp.Meso
        self.Extra = comp.Extra
    end
end
```

The owning Component then calls `_HttpService:JSONEncode(t)` on the table produced by `Serialize`, and `JSONDecode` + `Deserialize` on the way back.

**Why JSON over `_UtilLogic:TableToString`**: JSON has a documented shape, survives external inspection (admin tools, log forensics), preserves **nested** tables, and the `or default` fallback pattern composes naturally with optional fields. `TableToString` is acceptable only for ephemeral / opaque payloads with no schema evolution.

> [!WARNING]
> **`TableToString` / `StringToTable` round-trips only a flat table** whose values are `string` / `number` / `boolean`. If a value is itself a table, it serializes to an opaque reference and is **silently dropped** on `StringToTable` — that field comes back `nil`, with no error. Flatten before storing, or use `_HttpService:JSONEncode` / `JSONDecode` (which preserves nesting).
>
> ```lua
> -- ❌ nested value silently lost on round-trip
> _UtilLogic:TableToString({ profile = { gold = 100 } })   -- `profile` returns nil after StringToTable
> -- ✅ flat, or use JSON for structure
> _UtilLogic:TableToString({ gold = 100, ["o_magic_claw"] = 5 })
> ```

---

## 5. AndWait vs Async — Which to Choose

| Suffix | Behavior | When to Use |
|---|---|---|
| `~AndWait` | Synchronous, blocks the script until completion | Initial load (OnBeginPlay), logout save — moments where **blocking is acceptable** |
| `~Async` + callback | Asynchronous, result handled in callback | In-game live saves. Prevents frame drops |

> Credit cost is **the same**. Only the **performance characteristics** differ.

---

## 6. Error Code Handling (Do Not Ignore)

Every DataStorage call returns `errorCode` as its first value. **Always check it.**

| Code | Name | Action |
|---|---|---|
| 0 | Ok | Normal |
| 1000004 | TimedOut | Retry with backoff or fold into the next flush |
| 1000005 | **ResourceExhausted** | **Credit exceeded.** Reduce call frequency immediately. Log an alert. |
| 1000006 | PartialFailure | Batch had partial failure — retry only the failed keys |
| 1000002 | NotFound | First-time access (assign default value) |
| Other | InternalError/Unknown | Log and retry, or give up |

If `ResourceExhausted` ever appears, treat the offending function as a **cost bug** and redesign its call path.

### NotFound (1000002) — first-time access is not an error

For a brand-new user, the very first `GetAndWait` returns `1000002 NotFound`. Treat it as a normal "initialize defaults" signal — do not return early as an error, and do not blindly call `SetAndWait` first ("write empty just to make it exist" wastes Credit every login).

The example below is for the **§2 layout 2** pattern (Global container, profileCode as the key inside it):

```lua
-- Container = global named "PlayerBan"; key inside = the user's profileCode.
local ds = _DataStorageService:GetGlobalDataStorage("PlayerBan")
local errorCode, raw = ds:GetAndWait(profileCode)
if errorCode == 1000002 then            -- NotFound: this user has no ban record yet
    return SuccessCode                  -- proceed with default (not banned)
end
if errorCode ~= 0 then
    log_error("Get failed: " .. tostring(errorCode))
    return errorCode
end
-- raw is valid string → deserialize
```

For **§2 layout 1** (per-user container, key = field name), the call shape is `ds:GetAndWait("PlayerData")` — the storage key is the field name, not the profileCode again:

```lua
local ds = _DataStorageService:GetUserDataStorage(profileCode)   -- container scoped to this user
local errorCode, raw = ds:GetAndWait("PlayerData")               -- key inside that container
if errorCode == 1000002 then return SuccessCode end              -- first-time user for this field
```

The same NotFound-vs-absent distinction applies inside `BatchGetAndWait`: a never-written key is simply **absent** from the returned pages (no NotFound row). Nil-check `loadedData[key]` before reading `.Value`.

### PartialFailure (1000006) — `successKeys` lists what got through

See §4.8 for the resolution pattern: `failed = inputKeys − successKeys`.

---

## 7. Pre-Generation Checklist (Answer Before Writing Code)

Before adding a DataStorage call to a script, you **must be able to answer all of the following**:

- [ ] Is the method holding this call marked `@ExecSpace("ServerOnly")`?
- [ ] Does this call avoid frames and short timers? (Is it event-driven?)
- [ ] Is the same call repeated inside a loop? If so, can it become a `Batch*`?
- [ ] What is the maximum byte size of the value? If over 4KB, can it be split?
- [ ] Does it save only when the value actually changed? (dirty check)
- [ ] Is `errorCode` branched on? Especially `ResourceExhausted`.
- [ ] Is user data being placed in Global by mistake? (Verify UserDataStorage is used.)
- [ ] If `Transact*` is used, is atomicity actually required? (Otherwise, use Batch.)

---

## 8. Multi-Component Persistence Protocol

When a player carries multiple independent data domains (basic info, inventory, quests, achievements…), don't scatter `Set*` calls across components. Run them all through one `PlayerDBManager` that aggregates into a single `BatchGetAndWait` on login and a single `BatchSet*` on flush. This is the reference architecture used by MSW first-party feature packages.

### The 5-method contract

Every persistent data Component implements five `ServerOnly` methods that the Manager calls in order:

| Method | Called by Manager | Component's job |
|---|---|---|
| `LoadFromDB(table loadKeys) → boolean` | Before BatchGet | Push every key this Component owns into `loadKeys`. Do **not** touch storage here. |
| `OnLoadedDataFromDB(table loadedData) → boolean` | After BatchGet | Look up your keys in `loadedData[key] = DataStorageItem`. Decode `.Value`, populate properties. Return `false` to abort the whole load. |
| `PostOnLoadedDataFromDB() → boolean` | After ALL components finished `OnLoadedDataFromDB` | Cross-component finalization — anything that needs *other* components already populated (apply daily reset, recompute derived fields). |
| `SaveToDB(table saveData, table savedGenerations)` | Before BatchSet | Serialize current state into `saveData[key] = encodedString`. Use a dirty flag to skip if unchanged. **Do not clear the dirty flag here** — the save may still fail. Also write `savedGenerations[key] = self.SaveGeneration` so the round-trip carries the generation that was actually serialized (required for the concurrent-saves race; see below). |
| `OnSavedToDB(table successKeys, table savedGenerations)` | After BatchSet returns | Inspect `successKeys` for keys this Component owns. Compare `savedGenerations[key]` (the generation that was serialized for this specific save) against the current `self.SaveGeneration`. Clear the dirty flag only if both the key appears in `successKeys` **and** the generations match. Otherwise leave the flag dirty so the next save cycle retries. |

### Why three load phases (`Load → OnLoaded → PostOnLoaded`)

`OnLoadedDataFromDB` runs in arbitrary Component order — `PlayerData` cannot assume `QuestData` is already populated. If `PlayerData` needs `QuestData` ready (e.g. to apply pending quest rewards on login), put that logic in `PostOnLoadedDataFromDB`. It is guaranteed to run after every Component has finished its `OnLoadedDataFromDB`.

### Why `SaveToDB` + `OnSavedToDB` are split (and why every save carries its own generation snapshot)

A naive `SaveToDB` that clears its dirty flag immediately after serializing into `saveData[key]` (the pattern in some reference samples) is buggy in three distinct ways:

1. **PartialFailure data loss**: if the subsequent `BatchSet*` returns `PartialFailure` (1000006) and the key was not in `successKeys`, the in-memory change has been "forgotten" — the next save sees a clean dirty flag and skips it, losing the change permanently.
2. **Async-window data loss**: even on full success, periodic saves go through `BatchSetAsync`. Any setter that fires between `SaveToDB` and the async callback re-marks dirty, but if `OnSavedToDB` then clears the dirty flag unconditionally on success, the **new** change is also discarded — dirty is now false and the next cycle skips it. This races whenever a player mutates state during the storage round-trip.
3. **Concurrent-saves data loss**: two saves can be in flight at the same time (logout `AndWait` overlapping with a still-pending periodic `Async`, or — pathologically — two consecutive periodic ticks if the network is slow). If the Component stores a single `LastSerializedGeneration` property, the second save overwrites it and the first save's callback then compares against the wrong generation, declaring a stale write "current" and clearing dirty for changes that were never actually persisted.

The fix is a **per-save generation snapshot threaded through the protocol**, treated as a required part of every persistent Component (not an optional optimization):

- Every setter bumps `self.SaveGeneration` (and sets `IsSaveDB = true`).
- `SaveToDB(saveData, savedGenerations)` stamps `savedGenerations[key] = self.SaveGeneration` — the generation that was actually serialized into `saveData[key]`. The snapshot travels with the save through the round-trip.
- `OnSavedToDB(successKeys, savedGenerations)` clears `IsSaveDB` **only if** the key appears in `successKeys` **and** `savedGenerations[key] == self.SaveGeneration` — i.e. (a) storage confirmed the write and (b) no setter has fired since that particular save's serialization. Anything else leaves dirty true.

Because `savedGenerations` is a local table created fresh in each `SaveToDB` call and captured by the corresponding callback's closure, concurrent saves do not interfere — each carries its own snapshot, and only the save whose snapshot still matches the current generation gets credit for the clear.

This pattern is mandatory whenever `BatchSetAsync` is used (almost always, for periodic saves) and harmless for the blocking `BatchSetAndWait` (logout path), so the same Component logic covers both paths.

### Manager skeleton

```lua
@Component
script PlayerDBManager extends Component

    @TargetUserSync property boolean IsLoadSuccess = false
    property integer TimerId = 0

    @ExecSpace("ServerOnly")
    method boolean LoadFromDB()
        local profileCode = self.Entity.PlayerComponent.ProfileCode

        -- 1. Collect keys from every data component
        local loadKeys = {}
        if not self.Entity.PlayerData:LoadFromDB(loadKeys) then return false end
        -- if not self.Entity.InventoryData:LoadFromDB(loadKeys) then return false end
        -- if not self.Entity.QuestData:LoadFromDB(loadKeys) then return false end

        -- 2. One BatchGet for everything (drains all pages via the helper below)
        local loadedData = {}
        if not self:BatchGetAndWait(profileCode, loadKeys, loadedData) then return false end

        -- 3. Each component deserializes its own keys
        if not self.Entity.PlayerData:OnLoadedDataFromDB(loadedData) then return false end
        -- ...other components...

        -- 4. Cross-component finalization
        if not self.Entity.PlayerData:PostOnLoadedDataFromDB() then return false end
        -- ...other components...

        -- 5. CRITICAL: flip the gate ONLY after every component reports success.
        --    SaveToDB checks this; if it stays false, periodic saves silently skip forever.
        self.IsLoadSuccess = true
        return true
    end

    -- Inlined §4.6 helper. Drains every page; surfaces LoadNext errors instead of swallowing them.
    @ExecSpace("ServerOnly")
    method boolean BatchGetAndWait(string profileCode, table loadKeys, table outLoadedData)
        local ds = _DataStorageService:GetUserDataStorage(profileCode)
        local code, itemPages = ds:BatchGetAndWait(loadKeys)
        if code ~= 0 then
            log_error(string.format("BatchGetAndWait failed. ErrorCode: %d", code))
            return false
        end

        while true do
            local datas = itemPages:GetCurrentPageDatas()
            if datas == nil then break end

            for i = 1, #datas do
                outLoadedData[datas[i].KeyInfo.Key] = datas[i]   -- DataStorageItem
            end

            if itemPages.IsLastPage then break end

            local loadErr = itemPages:LoadNextPageAndWait()
            if loadErr ~= 0 then
                log_error(string.format("LoadNextPageAndWait failed. ErrorCode: %d", loadErr))
                return false
            end
            itemPages:MoveToNextPageAndWait()
        end

        return true
    end

    @ExecSpace("ServerOnly")
    method void SaveToDB(boolean isLeaving)
        if not self.IsLoadSuccess then return end   -- never overwrite with empty before load completed

        -- saveData: payload to BatchSet. savedGenerations: per-key generation snapshot
        -- that travels alongside the payload through the round-trip. Both are LOCALS,
        -- so a concurrent SaveToDB call (logout overlapping a pending periodic, etc.)
        -- gets its own fresh pair — no cross-contamination.
        local saveData = {}
        local savedGenerations = {}
        self.Entity.PlayerData:SaveToDB(saveData, savedGenerations)
        -- self.Entity.InventoryData:SaveToDB(saveData, savedGenerations)
        -- self.Entity.QuestData:SaveToDB(saveData, savedGenerations)

        -- All components clean → no keys to write. Bail out before touching the storage
        -- service so unchanged domains truly cost zero Credit (per §8 "Why this scales").
        if next(saveData) == nil then return end

        local profileCode = self.Entity.PlayerComponent.ProfileCode
        local ds = _DataStorageService:GetUserDataStorage(profileCode)
        if isLeaving then
            -- §6 mandates checking errorCode on every DataStorage call.
            local errorCode, successKeys = ds:BatchSetAndWait(saveData)
            -- Dispatch confirmed-saved keys + the per-save generation snapshot back to every
            -- data component. Inlined per-component fan-out (not a helper) because the
            -- helper's `successKeys` parameter cannot be annotated to match BatchSet*'s
            -- return type (`List<string>`). Component-side params keep plain `table`.
            self.Entity.PlayerData:OnSavedToDB(successKeys, savedGenerations)
            -- self.Entity.InventoryData:OnSavedToDB(successKeys, savedGenerations)
            -- self.Entity.QuestData:OnSavedToDB(successKeys, savedGenerations)
            if errorCode ~= 0 then
                log_error(string.format(
                    "Logout BatchSetAndWait failed. ErrorCode: %d, succeeded keys: %d",
                    errorCode, #successKeys))
                -- See §4.8 for the failed-keys resolution pattern.
            end
        else
            ds:BatchSetAsync(saveData, function(errorCode, successKeys)
                -- The closure captures THIS call's `savedGenerations`. Even if another
                -- SaveToDB starts and finishes before this callback runs, it brings its
                -- own snapshot — no overwrite.
                self.Entity.PlayerData:OnSavedToDB(successKeys, savedGenerations)
                -- self.Entity.InventoryData:OnSavedToDB(successKeys, savedGenerations)
                -- self.Entity.QuestData:OnSavedToDB(successKeys, savedGenerations)
                if errorCode ~= 0 then
                    log_warning(string.format(
                        "Periodic BatchSetAsync failed. ErrorCode: %d, succeeded keys: %d",
                        errorCode, #successKeys))
                end
            end)
        end
    end
end
```


### Component skeleton (per-domain dirty flag)

```lua
@Component
script PlayerData extends Component

    @TargetUserSync property integer Level = 0
    @TargetUserSync property integer Meso  = 0

    property boolean IsSaveDB = false                                -- per-component dirty flag
    property integer SaveGeneration = 0                              -- bumped on every mutation

    @ExecSpace("ServerOnly")
    method boolean LoadFromDB(table loadKeys)
        table.insert(loadKeys, _GMPlayerDataToolLogic.StorageName)   -- "PlayerData"
        return true
    end

    @ExecSpace("ServerOnly")
    method boolean OnLoadedDataFromDB(table loadedData)
        local item = loadedData[_GMPlayerDataToolLogic.StorageName]  -- DataStorageItem | nil

        local basicData = PlayerBasicInfo()
        basicData:Init()                                             -- defaults (§4.9)
        if item ~= nil and not _UtilLogic:IsNilorEmptyString(item.Value) then
            local t = _HttpService:JSONDecode(item.Value)
            if not basicData:Deserialize(t) then return false end
        else
            self.IsSaveDB = true                                     -- first-time user → schedule an initial save
            self.SaveGeneration += 1
        end
        basicData:ToComponent(self)
        return true
    end

    @ExecSpace("ServerOnly")
    method boolean PostOnLoadedDataFromDB()
        return true
    end

    @ExecSpace("ServerOnly")
    method void SaveToDB(table saveData, table savedGenerations)
        if not self.IsSaveDB then return end                         -- nothing changed → skip → save Credit

        local basicData = PlayerBasicInfo()
        basicData:FromComponent(self)
        local t = {}
        basicData:Serialize(t)
        local myKey = _GMPlayerDataToolLogic.StorageName
        saveData[myKey] = _HttpService:JSONEncode(t)
        -- Stamp the generation we just serialized into the per-save snapshot. The matching
        -- OnSavedToDB call (same closure) will compare this against self.SaveGeneration to
        -- detect setters that fired during the BatchSet round-trip.
        savedGenerations[myKey] = self.SaveGeneration
    end

    @ExecSpace("ServerOnly")
    method void OnSavedToDB(table successKeys, table savedGenerations)
        local myKey = _GMPlayerDataToolLogic.StorageName
        for i = 1, #successKeys do
            if successKeys[i] == myKey then
                local snapshot = savedGenerations[myKey]
                if snapshot ~= nil and self.SaveGeneration == snapshot then
                    self.IsSaveDB = false                            -- this exact save matches current state → safe to clear
                end
                -- If SaveGeneration moved forward since serialization (setter raced),
                -- or the snapshot is nil (this Component didn't contribute to this save),
                -- leave IsSaveDB = true so the next cycle re-serializes the newer state.
                return
            end
        end
        -- Key absent from successKeys → BatchSet did not confirm; leave IsSaveDB = true to retry.
    end

    @ExecSpace("ServerOnly")
    method void SetLevel(integer level)
        self.Level = level
        self.IsSaveDB = true                                         -- mark dirty on every setter
        self.SaveGeneration += 1                                     -- and bump generation
    end
end
```

### Why this scales

- One BatchGet per login. Adding a new data domain = a new Component that implements the 5 methods + one line in the Manager → automatically batched.
- One BatchSet per flush. Periodic auto-save (§4.7) and logout save share the same aggregator.
- Per-domain dirty flag means unchanged domains contribute zero bytes to `saveData` → Credit goes only where data actually changed.
- `IsLoadSuccess` gate prevents overwriting saved data with empty defaults if a timer fires before `LoadFromDB` finished (critical safety against data loss on early errors).

### Anti-patterns specific to this architecture

- ❌ Calling `ds:SetAsync` directly from inside a data Component — defeats the batching, multiplies Credit per save.
- ❌ Skipping the dirty flag check in `SaveToDB`. Every periodic flush then re-saves unchanged data → linear Credit burn with online time.
- ❌ **Clearing the dirty flag inside `SaveToDB` (before BatchSet returns).** On `PartialFailure` the in-memory change is lost permanently — the next cycle sees a clean flag and skips. Move the clear into `OnSavedToDB(successKeys)` so it only fires for confirmed-saved keys.
- ❌ **Clearing the dirty flag in `OnSavedToDB` without comparing the per-save generation snapshot.** During `BatchSetAsync`'s round-trip, a setter can mutate state; if `OnSavedToDB` clears `IsSaveDB` unconditionally on success, the newer change is silently lost. Compare `savedGenerations[key]` (carried by the closure / passed by Manager) against the current `self.SaveGeneration` and clear only when they match.
- ❌ **Storing the serialized generation as a Component property** (e.g. `LastSerializedGeneration`). Two saves in flight at the same time (logout `AndWait` overlapping a still-pending periodic `Async`, or two periodic ticks on a slow network) clobber each other's snapshot — the late-arriving callback then sees a generation written by a different save and clears dirty for changes that were never actually persisted. Keep the snapshot as a per-call local table threaded through `SaveToDB(saveData, savedGenerations)` / `OnSavedToDB(successKeys, savedGenerations)`.
- ❌ Building defaults inside `Deserialize`. Put new-account defaults in the `@Struct`'s `Init()`; put missing-field forward compat as `x or default` inside `Deserialize` (§4.9).
- ❌ Reading `loadedData[key].Value` without a nil check on `loadedData[key]`. If the key was never written, BatchGet simply omits it.
- ❌ Periodic flush firing before `IsLoadSuccess` is true. Always gate `SaveToDB` on the load-complete flag.

---

## 9. References

- API signatures: `./Environment/NativeScripts/Service/DataStorageService.d.mlua`, `./Environment/NativeScripts/Misc/UserDataStorage.d.mlua`, `./Environment/NativeScripts/Misc/GlobalDataStorage.d.mlua`, `./Environment/NativeScripts/Misc/SortableDataStorage.d.mlua`, `./Environment/NativeScripts/Misc/DataStorageItem.d.mlua`, `./Environment/NativeScripts/Misc/DataStorageItemPages.d.mlua`.
