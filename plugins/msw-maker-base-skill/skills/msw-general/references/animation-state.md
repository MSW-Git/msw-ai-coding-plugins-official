# Animation State — StateComponent & State-Driven Animation

Cross-entity reference for the **state → animation** pipeline shared by monsters, NPCs, and players. Read this first whenever you see state-change or animation-swap bugs; entity-specific docs (`monster.md`, future `npc.md` etc.) build on top of these rules.

The pipeline is the same for every entity:

```
ChangeState(newState)
  → StateComponent updates CurrentStateName
  → fires StateChangeEvent
  → animation component reads its ActionSheet at this moment
  → raises AnimationClipEvent on the renderer
```

The renderer **does not re-poll** `ActionSheet` between transitions. The currently playing clip is whatever the last `StateChangeEvent` resolved to.

## 0. Two animation patterns — pick one before reading further

Monsters/NPCs drive their visible clip one of two ways. They are mutually exclusive; the rest of this doc and `monster.md` assume you've picked.

### Pattern A — script-driven `SpriteRUID` assignment (proven working canonical)

The verified working sample (`Soldier.model` + `script.SoldierAI`, full source inlined in [`monster.md` §7](monster.md)) takes this route. A custom Component holds its **own** state variable (e.g. `CurrentAIState ∈ {"ROAM","STAND","SAY","ATTACK"}`) and on each transition does `self.Entity.SpriteRendererComponent.SpriteRUID = <clipRUID>` directly. `StateComponent` is used only for `IDLE` ↔ `DEAD` transitions (so `script.Monster.IsDead` syncs and `DeadEvent` fires correctly). `StateAnimationComponent` + `ActionSheet` are still present in the `.model` for completeness, but the pipeline is bypassed.

In this pattern **`StateComponent.IsLegacy` does not need to be set** — Soldier.model leaves it at the default and animations work fine, because the script never relies on `StateChangeEvent → ActionSheet → AnimationClipEvent`.

Prefer Pattern A when:
- Behavior doesn't map cleanly to AIChase/AIWander (e.g. roam ↔ stand ↔ say ↔ attack with random idle picks, range-gated attack triggering).
- You want predictable clip swaps without depending on the `IsLegacy` quirk below.

### Pattern B — `StateChangeEvent` → `ActionSheet` pipeline (auto-swap)

`StateComponent:ChangeState("MOVE")` fires `StateChangeEvent`; `StateAnimationComponent` looks up `ActionSheet[StateStringToAnimationKey(state)]` and raises `AnimationClipEvent`. For this pipeline to actually swap clips, **`StateComponent.IsLegacy = false` must be set on the `.model`** — without it the events still fire but `StateAnimationComponent` ignores them (legacy mode pre-dates this pipeline). `IsLegacy` is a hidden property (not exposed via `mlua_api_retriever`) serialized in the `.model` JSON; default is **`true` (legacy)**.

`MonsterCanonical.model` in `../models/` is configured for Pattern B (sets `StateComponent.IsLegacy=false`, includes `AIChaseComponent`).

Builder call (only relevant if you choose Pattern B):

```javascript
b.value("StateComponent", "IsLegacy", false, "bool");
```

When you see "nothing animates, no errors" with this pattern, this missing flag is the first thing to verify.

> Symptoms of mixing the two patterns: AIChase forces velocity to zero outside its detection range while your custom script also tries to drive movement (see [`monster.md` §5d "Do not use AIChase/AIWander together with a custom chase/movement script"](monster.md)); or you call `ChangeState("MOVE")` but the clip never changes because `IsLegacy` is at its default `true`.

## 0.5. FSM (this doc) vs BT — picking the state-machine engine

This document covers the **FSM** path (`StateComponent` + `@State` StateType). MSW also natively supports a **Behaviour Tree** path (`AIComponent` + `@BTNode`) — see [`../../msw-combat-system/references/ai-bt.md`](../../msw-combat-system/references/ai-bt.md).

| Engine | Fit |
|---------|-----|
| **FSM** (`StateComponent`) | Simple enemies (3~5 states), player IDLE/HIT/DEAD, boss phase branching, **automatic avatar animation sync** (`AvatarStateAnimationComponent`). The pipeline this whole doc describes. |
| **BT** (`AIComponent`) | Patrol + chase + attack composition, varied boss patterns, probability-weighted actions, Composite/Decorator reuse |

Both are native. **If you want to drive behavior with states and bind those states to motion, prefer FSM.** Use BT when the decision tree is deep or node reuse is essential. BT-driven entities still rely on `StateComponent` for animation sync — BT nodes call `ChangeState` to drive the same pipeline this doc describes.

> This axis is **orthogonal to §0's Pattern A/B**. A custom-script monster (Pattern A — Soldier) can hold its own FSM-like state without going through `StateComponent` transitions at all. A `StateComponent`-driven monster (Pattern B) can be powered by either FSM (this doc) or BT (`ai-bt.md`).

## 1. Default states and who registers the rest

### 1.1. StateComponent API surface

```
@Component StateComponent
  readonly @Sync property string CurrentStateName = "IDLE"

  method boolean AddState(string stateName, Type stateType)
  method boolean AddCondition(string stateName, string nextStateName, boolean reverseResult = false)
  method boolean ChangeState(string stateName)
  method void    RemoveState(string name)
  method void    RemoveCondition(string stateName, string nextStateName)
```

`StateChangeEvent` payload: `CurrentStateName`, `PrevStateName`, `IsInitial`. `DeadEvent` / `ReviveEvent` / `StateChangeEvent` are all auto-emitted by the engine — you only need to subscribe (see §5 for chaining). Failure modes of `ChangeState` (lowercase, unregistered, DEAD lock, wrong ExecSpace) are tabulated in §4.5.

### 1.2. Default registration

`StateComponent` ships with **only `IDLE` and `DEAD`**. Every other state name (`MOVE`, `ATTACK`, `HIT`, `JUMP`, …) only exists on an entity if a companion component registered it, or you called `AddState` yourself. Calling `ChangeState("MOVE")` on an entity that never had `MOVE` registered throws `[LEA-3005] InvalidArgument : 'stateName' is not a valid argument`.

| State | Registered by |
|---|---|
| `IDLE`, `DEAD` | StateComponent itself (always) |
| `HIT` | `HitComponent` (raised by `HitEvent`, auto-exits to `IDLE` ~0.5s) |
| `MOVE` | `AIChaseComponent`, `AIWanderComponent`, **or** `PlayerControllerComponent` |
| `ATTACK`, `ATTACK_WAIT`, `JUMP`, `FALL`, `CLIMB`, `LADDER`, `CROUCH`, `SIT` | `PlayerControllerComponent` only (players) |
| Anything else (including `ATTACK` on monsters) | You — via `AddState(name, StateType)` server-side |

> ⚠ **Monsters do not auto-register `ATTACK`.** `script.MonsterAttack` does **not** register an `ATTACK` state — it just timer-attacks (`AttackFast`) while alive, irrespective of `StateComponent`. The two working canonicals both ship with an `attack` key in their `ActionSheet` (Pattern A — Soldier.model has `attack` and the SoldierAI uses it as the direct `SpriteRUID` during its self-managed `ATTACK` state; Pattern B — MonsterCanonical.model has `attack` reserved for a future custom `ATTACK` state), but **the `attack` key alone does not get played by `script.MonsterAttack`**. To actually swap to the attack clip you must either (Pattern A) set `SpriteRendererComponent.SpriteRUID` directly in your script's `ATTACK` branch, or (Pattern B) `AddState("ATTACK", SomeStateType)` yourself and call `ChangeState("ATTACK")` so the ActionSheet pipeline picks the `attack` clip.

If you write a custom controller that strips AI/MonsterAttack/PlayerController, you must register the states you intend to enter:

```lua
-- Reusable no-op state for marker transitions whose only job is to drive ActionSheet.
@State
script MarkerState extends StateType
end
```

```lua
@ExecSpace("ServerOnly")
method void OnBeginPlay()
    local sc = self.Entity.StateComponent
    sc:AddState("MOVE", MarkerState)
    sc:AddState("ATTACK", MarkerState)
    -- IDLE / DEAD always exist; HIT is registered by HitComponent if present.
end
```

## 2. State name casing

State names are **UPPERCASE** at the StateComponent layer (`IDLE`/`MOVE`/`ATTACK`/`HIT`/`DEAD`). The engine uppercases names passed to `AddState`/`ChangeState`, but always pass uppercase yourself — mixed-case is a hidden source of "transition doesn't fire" bugs.

The animation lookup *key* is component-specific (see §6).

## 3. The `SetActionSheet` vs `ChangeState` trap

**The single most common animation bug.** `SetActionSheet(key, ruid)` only edits the mapping table. It does **not** retrigger the clip currently playing.

| Goal | Correct call | Wrong (silent failure) |
|---|---|---|
| Play the walk clip now | `StateComponent:ChangeState("MOVE")` | `SetActionSheet("stand", moveRuid)` while in `IDLE` — mapping updates but `stand` keeps playing |
| Play the attack clip now | `StateComponent:ChangeState("ATTACK")` | Same anti-pattern |
| Randomize next `HIT` clip | Override `StateStringToAnimationKey(stateName)` and call `SetActionSheet("hit", randomRuid)` *inside* it before returning `__base:StateStringToAnimationKey(stateName)` | `SetActionSheet("hit", randomRuid)` from a timer — only affects the next HIT, not the one already playing |
| Permanently swap a clip | `SetActionSheet(key, newRuid)` once, then `ChangeState` to that state when you want it | — |

**Rule:** *`ChangeState` plays animations; `SetActionSheet` only changes which RUID a future state transition will resolve to.*

Reference implementation (random hit pick) lives in the engine API docs for `StateAnimationComponent` — fetch via `mlua_api_retriever`.

## 4. StateType authoring

Custom states (anything beyond the auto-registered set in §1) are written as `StateType` scripts.

1. Both `@State` and `extends StateType` are required. Without either, the script's `.codeblock` isn't generated and `AddState` silently receives a nil type.
2. Available hooks: `OnEnter()` / `OnUpdate()` / `OnExit()` / `OnConditionCheck(string nextStateName) → boolean`.
3. ⚠ `OnUpdate` on a `StateType` receives **no `delta`** (unlike Component/Logic `OnUpdate(number delta)`). Track elapsed time via `_TimerService:GetTime()` deltas or a one-shot timer in `OnEnter`.
4. ⚠ Inside hooks, the owning entity is reached via **`self.ParentComponent.Entity`** — `self.Entity` is nil because StateType is not a Component. Use this path to reach `TransformComponent`, `SpriteRendererComponent`, `MovementComponent`, etc.
5. **Execution space — `AddState` / `AddCondition` / `ChangeState` are authority-restricted:**
   - These calls only succeed on the side that owns state-machine authority for the entity. Calling from the other side throws `[LEA-3022] InvalidExecSpace : The addition and removal of states and conditions are disabled in execution spaces where you have no permission.` — you cannot register on both sides.
   - **Monsters / NPCs**: authority is on the **server**. Use `@ExecSpace("ServerOnly")` (or run inside `[server only]` code).
   - **Player avatar**: authority is on the **client** (each player owns their own avatar). The official avatar custom-state example uses `[client only] OnBeginPlay()` with `AddState`/`ChangeState` for exactly this reason.
   - **Animation on the client still works** even though monster `AddState` is server-only: `StateChangeEvent` is declared `Space: Server, Client` (see the API doc), so a server-side `ChangeState` causes the event to fire on the client too, and the client's `StateAnimationComponent.ReceiveStateChangeEvent` reads the sync'd `ActionSheet` to play the matching clip. The client does **not** need a separate `AddState` registration.
   - Guard `StateChangeEvent` handlers that branch into custom states with `if self:IsServer()` when the branching logic is server-authoritative — but a plain animation-watching handler can read `CurrentStateName` on either side.
6. Wire transitions with `:AddCondition(from, to, reverseResult = false)`. Every frame the engine calls the `from` state's `OnConditionCheck(to)` with each candidate; transitions when it returns true (or false if `reverseResult`).
7. Map an `ActionSheet` action key for the new state — otherwise the state changes but the animation doesn't (see §6 for which `ActionSheet`).

```lua
@State
script WindupState extends StateType
    property boolean done = false

    method void OnEnter()
        self.done = false
        -- Tint sprite during wind-up using ParentComponent.Entity
        -- self.ParentComponent.Entity.SpriteRendererComponent.Color = Color(1, 0.6, 0.6, 1)
        _TimerService:SetTimerOnce(function() self.done = true end, 0.4)
    end

    method boolean OnConditionCheck(string nextStateName)
        return self.done
    end
end
```

```lua
@Component
script WindupSetup extends Component

    -- Monster authority is on the server. AddState/AddCondition/ChangeState must
    -- run server-only — calling from client throws [LEA-3022] InvalidExecSpace.
    -- The client's StateAnimationComponent still plays the matching ActionSheet
    -- clip via the sync'd StateChangeEvent; no client-side AddState required.
    @ExecSpace("ServerOnly")
    method void OnBeginPlay()
        local s = self.Entity.StateComponent
        s:AddState("WINDUP", WindupState)
        s:AddCondition("WINDUP", "ATTACK")
    end

end
```

> For the player avatar, the same calls are **client-only** instead — each player owns their avatar's state on their own client (see the official "Easy Control of Avatar Animation with ActionSheet" example).

> **Deprecated `StateComponent` overloads to watch out for in legacy code:**
> - `AddState(string stateName, func updateFunction)` — replaced by `AddState(string, Type)`. Old samples calling `AddState("NEW_ATTACK")` (single-arg form) still work for pure marker states but go through the deprecated path; prefer a `MarkerState extends StateType` for new code.
> - `AddCondition(string, string, func, boolean)` — replaced by `AddCondition(string, string, boolean)` + `OnConditionCheck` on the `StateType`.
>
> Cleanup methods (mirrors of the above) exist on `StateComponent`/`StateAnimationComponent`: `RemoveState(name)`, `RemoveCondition(from, to)`, `RemoveActionSheet(key)` — use these when tearing down dynamically registered states/clips.

## 4.5. `ChangeState` semantics — return value / failure matrix

| Call | Result |
|------|--------|
| Unregistered name | `[LEA-3005] InvalidArgument : 'stateName'` + returns `false` |
| Lowercase name | `[LEA-3005]` + UPPERCASE warning + returns `false` |
| Same as current state | Returns `false` (no transition, `OnEnter` is **not** re-called) |
| `CurrentStateName == "DEAD"` and target is **not** `"IDLE"` | `InvalidOperation` + returns `false` — the **DEAD lock** |
| Wrong ExecSpace (monster/NPC called on client, or avatar called on server) | `[LEA-3022] InvalidExecSpace` + returns `false` (see §4 point 5) |
| Normal | `OnExit(prev) → OnEnter(new) → EmitStateChangeEvent` in that order. Returns `true` |

### DEAD lock

When `CurrentStateName == "DEAD"`, **no transition to any state other than `IDLE` is allowed**. The revive flow must go through `ChangeState("IDLE")`. A direct `DEAD → REVIVE` jump in a boss revive sequence silently fails — re-enter `IDLE` first, then chain to the revive state from `StateChangeEvent` (§5).

### Auto transitions — `AddCondition` + `OnConditionCheck`

`AddCondition(from, to, reverseResult = false)` registers a per-frame check. Each frame the engine calls `from` state's `OnConditionCheck(to)` with each candidate `to` name and transitions when it returns `true` (or `false` when `reverseResult = true`). Multiple `to`s can be registered for the same `from`; they're checked in registration order and the first one passing wins — branch on `nextStateName` inside the check.

```lua
@State
script Phase1StateType extends StateType
    method boolean OnConditionCheck(string nextStateName)
        local monster = self.ParentComponent.Entity.MonsterScript
        return monster.Hp <= monster.MaxHp * 0.5
    end
end

-- Registration (server-side OnBeginPlay)
sc:AddState("PHASE1", Phase1StateType)
sc:AddState("PHASE2", Phase2StateType)
sc:AddCondition("PHASE1", "PHASE2")   -- Auto-transitions when HP drops below half
```

For a forced transition from script, just call `sc:ChangeState("PHASE2")` directly.

> If the `from` state is the deprecated `AddState(name, func)` form, `AddCondition` is silently rejected — migrate to `AddState(name, XxxStateType)` first.

## 5. Chaining states via `StateChangeEvent`

The canonical way to slot a custom state into the built-in flow (e.g. `HIT` → `WINDUP` → `ATTACK`) is to handle `StateChangeEvent` and force the next transition. Guard server-only because the custom state doesn't exist client-side:

```lua
@ExecSpace("ServerOnly")
@EventSender("Self")
handler HandleStateChangeEvent(StateChangeEvent event)
    if event.CurrentStateName == "HIT" then
        self.Entity.StateComponent:ChangeState("WINDUP")
    end
end
```

`StateChangeEvent` carries `PrevStateName` and `CurrentStateName` and is Space: **Server, Client**. `DeadEvent` (Space: Server, Client) fires additionally when entering `DEAD`. `ReviveEvent` (Space: **Server** only) fires when `PlayerComponent:Respawn()` is called on an entity that has both `StateComponent` and `PlayerComponent` — players use this to re-enter `IDLE`; monsters don't have it, so respawn logic for monsters re-enters `IDLE` manually (see `script.Monster.Respawn` in `monster.md` §6).

Use the modern `handler` syntax with `@ExecSpace`/`@EventSender` attributes (see canonical `script.Monster`'s `HandleHitEvent`) — not the legacy inline `[self] Handle…` block.

## 6. Animation component differences

The state machine is shared. The animation component that reads it differs by entity type.

| Entity | Component | Lookup table | `IsLegacy` |
|---|---|---|---|
| Monster, NPC | `StateAnimationComponent` | `ActionSheet` (`SyncDictionary<string,string>`) — map state-derived key (lowercase) → AnimationClip RUID | `StateAnimationComponent.IsLegacy` is not exposed in builder; both canonicals (Soldier.model, MonsterCanonical.model) leave it unset. The load-bearing flag is `StateComponent.IsLegacy` (Pattern B requires `false`; Pattern A leaves the default — see §0). For Pattern A, ActionSheet is not consulted at runtime — clip swaps come from direct `SpriteRendererComponent.SpriteRUID` assignment in the script. |
| Player (avatar) | `AvatarStateAnimationComponent` (extends StateAnimationComponent) | `StateToAvatarBodyActionSheet` (`SyncDictionary<string,string>`) — map state name (UPPERCASE) → `MapleAvatarBodyActionState` value (e.g. `walk`, `attack`, `rope`, `ladder`, …) | Must be **`false`** for `StateToAvatarBodyActionSheet` to drive animation. `IsLegacy` is `ReadOnly` at runtime — set it on the `.model` JSON (builder side); the engine docs note the legacy ActionSheet path "is no longer supported and will be deleted at a later date". |

> StateAnimationComponent itself is "monster/NPC only" per the engine docs — don't attach it to a player; use `AvatarStateAnimationComponent`.

### 6a. Monster/NPC key conversion (StateAnimationComponent)

State → action key happens via `StateStringToAnimationKey(stateName)`. Default behavior lowercases & maps:

| State | Default action key |
|---|---|
| `IDLE` | `stand` |
| `MOVE` | `move` |
| `JUMP` | `jump` |
| `ATTACK` | `attack` |
| `HIT` | `hit` |
| `DEAD` | `die` |

Custom states fall through to `string.lower(stateName)` unless you override `StateStringToAnimationKey`. Missing or typoed keys fail silently — the previous clip keeps playing.

To remap (e.g. `ATTACK` → `attack2`, random `hit`): either override `StateStringToAnimationKey` (preferred — keeps the swap synchronous with the transition) or call `SetActionSheet(key, clipRuid)` from script. Never edit the `.model` JSON.

### 6b. Player key conversion (AvatarStateAnimationComponent)

State → animation lookup uses the **uppercase state name directly as the key** into `StateToAvatarBodyActionSheet`. Default mapping (do not delete entries — missing keys break their animations):

| Key (state) | Value (`MapleAvatarBodyActionState`) | PlayRate |
|---|---|---|
| `IDLE` | `stand` | 1.0 |
| `MOVE` | `walk` | 1.68 |
| `ATTACK` | `attack` | 1.33 |
| `HIT` | `hit` | 1.0 |
| `CROUCH` | `crouch` | 1.0 |
| `FALL` | `fall` | 1.0 |
| `JUMP` | `fall` | 1.0 |
| `CLIMB` | `rope` | 1.0 |
| `LADDER` | `ladder` | 1.0 |
| `DEAD` | `dead` | 1.0 |
| `SIT` | `sit` | 1.0 |

Avatars don't use animationclip RUIDs here — they use the predefined `MapleAvatarBodyActionState` strings (`stand`/`walk`/`attack`/`alert`/`crouch`/`fall`/`sit`/`rope`/`ladder`/`dead`/`blink`/`fly`/`heal`/`hit`; full enum has 14 non-Invalid members, see `MapleAvatarBodyActionState` via `mlua_api_retriever`). `SetActionSheet(key, ruid)` on the avatar variant inserts an `AvatarBodyActionElement` with `AvatarBodyActionStateName = ruid` and default `PlayRate = 1` — adjust PlayRate by editing the element directly (or by editing the model's StateToAvatarBodyActionSheet entries) rather than re-setting via `SetActionSheet`, which resets it back to 1.

Player models also bring `PlayerControllerComponent` which auto-registers MOVE/ATTACK/CLIMB/LADDER/CROUCH/JUMP/FALL/SIT/ATTACK_WAIT and drives them from input. Removing PlayerControllerComponent breaks the default player flow. Two PlayerControllerComponent flags worth knowing:

- `AlwaysMovingState` (Sync, bool) — when `true`, the walk animation plays unconditionally regardless of input/movement. Useful for cutscene/forced-idle-walk states.
- `UseCustomScript` (ReadOnly, bool) — when `true`, some PlayerControllerComponent features are disabled so your own scripts can take over input → state mapping. Set via the `.model` for fully custom avatar control.

## 7. Pitfall table

| Symptom | Root cause | Fix |
|---|---|---|
| **Nothing animates at all** — sprite stuck on initial `stand`, neither `MOVE`/`move` nor `DEAD`/`die` clips switch, no error logs. State machine logs (`CurrentStateName` print) show transitions are happening. | You picked **Pattern B** (ActionSheet pipeline) but `StateComponent.IsLegacy` is missing/`true` on the `.model`. Legacy mode silently skips the `StateChangeEvent → ActionSheet → AnimationClipEvent` pipeline (see §0). | Either set `StateComponent.IsLegacy = false` on the `.model`, or switch to **Pattern A** and drive `SpriteRUID` directly from a script (canonical: `script.SoldierAI`). |
| `[LEA-3022] InvalidExecSpace : The addition and removal of states and conditions are disabled in execution spaces where you have no permission.` | `AddState` / `AddCondition` / `ChangeState` called on the side that **doesn't** own state-machine authority (see §4). | For monster/NPC: wrap in `@ExecSpace("ServerOnly")`. For player avatar: use `[client only]`. Never call on both sides — one side will always throw. |
| Custom-state animation never plays even though server logs show `ChangeState("MY_STATE")` succeeded | Pattern B: `StateComponent.IsLegacy` missing/`true` on the model (see §0). The pipeline is silently disabled in legacy mode regardless of whether the state is custom or built-in. | Set `StateComponent.IsLegacy = false` on the `.model`, or switch to Pattern A and call `sprite.SpriteRUID = <ruid>` from your `StateType:OnEnter` / handler. **Do not** mirror `AddState` on the client side — that throws `[LEA-3022]`. |
| `[LEA-3005] InvalidArgument : 'stateName' is not a valid argument` | Target state not registered on this entity (see §1) | Add the companion component that registers it, or `AddState(name, MarkerState)` first (on the side calling `ChangeState`) |
| Entity moves but `stand` clip keeps playing | `MovementComponent` was driven without `ChangeState("MOVE")` — and no AI component to auto-toggle | Add `AIChase`/`AIWander`, **or** call `ChangeState("MOVE")` / `ChangeState("IDLE")` from your controller |
| `SetActionSheet(...)` did nothing visible | `SetActionSheet` only edits the mapping; doesn't retrigger the current clip | Call `ChangeState` to a state that resolves to the new mapping (§3) |
| State changes but animation doesn't | Action key missing from ActionSheet, or wrong-cased key for monster/NPC (must be lowercase) | Fix the key; verify with `mlua_api_retriever` for the component |
| Avatar custom state animations broken | `AvatarStateAnimationComponent.IsLegacy` flipped to `true` | Set back to `false` (canonical default) |
| `ChangeState("MY_STATE")` does nothing on client | Custom states exist server-side only | Run from `[server only]`; guard event handlers with `if self:IsServer()` |
| `self.Entity` is nil inside StateType | StateType is not a Component | Use `self.ParentComponent.Entity` |
| HIT state loops forever | Treating HIT as a sticky state | Don't — HitComponent auto-returns to IDLE ~0.5s after entering HIT |
| State change races animation (avatar) | Default state-change condition fired before desired clip showed | If you need exact frames, use the `BodyActionStateChangeEvent` / `ActionStateChangedEvent` path instead of ActionSheet |

## 8. Verification

Don't ask "did it appear" — walk the state cycle:

1. Spawn → `CurrentStateName == "IDLE"`, idle clip plays.
2. Move begins → `CurrentStateName == "MOVE"`, move clip plays.
3. Hit → `CurrentStateName == "HIT"`, hit clip + damage skin → auto-return `IDLE` ~0.5s.
4. HP=0 (or `ChangeState("DEAD")`) → `CurrentStateName == "DEAD"`, die clip, `DeadEvent` fires, `IsAttackTarget` rejects further hits.
5. Each custom state you registered: confirm `ChangeState` succeeds (no `[LEA-3005]`), `CurrentStateName` updates, and the mapped clip plays.

If a clip looks stuck, log `CurrentStateName` per frame from a server script — distinguishes "state didn't change" from "ActionSheet key wrong".

### Pre-flight checklist

- [ ] Custom StateType scripts include **both** `@State` and `extends StateType`
- [ ] After `maker_refresh_workspace`, a `.codeblock` with the same name exists next to the custom StateType `.mlua` — if missing, the annotation or `extends` is missing
- [ ] All state names are **UPPERCASE** at the StateComponent layer (`"ATTACK"` ✓, `"attack"` ✗)
- [ ] Before calling `ChangeState`, `AddState` was called with that name in `OnBeginPlay` (or registered by a companion component per §1.2)
- [ ] FSM operation methods use `@ExecSpace("ServerOnly")` for monster/NPC, **`[client only]` for player avatar** (§4 point 5) — never both sides
- [ ] No direct jumps from `DEAD` to states other than `IDLE` (§4.5 DEAD lock)
- [ ] Keys in `AvatarStateAnimationComponent.StateToAvatarBodyActionSheet` exactly match the state names registered in `StateComponent` (UPPERCASE for avatar; lowercase-converted for monster/NPC ActionSheet, see §6a)
- [ ] **`StateType.OnUpdate()` declared without `delta`** (the engine does not pass one; declaring `OnUpdate(number delta)` silently sets `delta = nil`)
- [ ] **`StateType.OnConditionCheck(string nextStateName)` declared with the argument** (the engine passes the candidate `to` name; omitting it disables `nextStateName`-based branching)
- [ ] When using auto transitions, `OnConditionCheck` is a cheap check even though it runs every frame (heavy work belongs in `OnUpdate`)
- [ ] `DisconnectEvent` external event handlers in `OnEndPlay` (if the StateType subscribed to events)
- [ ] **Pattern B**: `StateComponent.IsLegacy = false` on the `.model` (§0). Default is `true` (legacy) and silently disables the ActionSheet pipeline.

## 9. Reference — standard monster `IDLE/PATROL/CHASE/ATTACK/HIT/DEAD` FSM

A complete custom-FSM monster (Pattern B — uses `ChangeState` to drive `StateAnimationComponent`'s ActionSheet). `IDLE`/`DEAD` always auto-exist; `HIT` is auto-registered by `HitComponent` if attached. The rest is server-side.

```lua
@Component
script MonsterFSM extends Component
    @ExecSpace("ServerOnly")
    method void OnBeginPlay()
        local sc = self.Entity.StateComponent
        sc:AddState("PATROL", PatrolStateType)
        sc:AddState("CHASE",  ChaseStateType)
        sc:AddState("ATTACK", AttackStateType)
        -- IDLE / DEAD always exist; HIT exists if HitComponent is attached.

        -- Auto transitions — each StateType's OnConditionCheck inspects the trigger
        sc:AddCondition("PATROL", "CHASE")     -- player detected
        sc:AddCondition("CHASE",  "ATTACK")    -- entered attack range
        sc:AddCondition("ATTACK", "CHASE")     -- cooldown ended
        sc:AddCondition("CHASE",  "PATROL")    -- target lost (branch via nextStateName or reverseResult)

        sc:ChangeState("PATROL")
    end
end
```

Each StateType's `OnConditionCheck` inspects distance / cooldown / target validity; `OnUpdate` handles in-state behavior. A clean separation:

```lua
@State
script AttackStateType extends StateType
    property number Duration  = 0.6
    property number StartTime = 0

    method void OnEnter()
        self.StartTime = _TimerService:GetTime()
        local entity = self.ParentComponent.Entity
        -- Fire the attack resolution once on enter
        entity.AttackComponent:AttackFast(BoxShape2D(1, 1), "monster_attack", CollisionGroups.Player)
    end

    method void OnUpdate()
        if _TimerService:GetTime() - self.StartTime >= self.Duration then
            self.ParentComponent:ChangeState("IDLE")
        end
    end

    method void OnExit()
        -- Cleanup (remove effects, etc.)
    end
end
```

> The same skeleton scales up to boss phase branching (`PHASE1` / `PHASE2` with `OnConditionCheck` returning `Hp <= MaxHp * 0.5`, see §4.5 example) and down to a 3-state minion (`IDLE` ↔ `CHASE` ↔ `ATTACK`). Match the `ActionSheet` keys (lowercase per §6a) to the state names you register here.

## 10. Cross-references

| Doc | Why |
|---|---|
| [monster.md](monster.md) | Monster-specific composition, AI choices, HP/respawn, spawn, placement |
| [`../../msw-combat-system/references/ai-bt.md`](../../msw-combat-system/references/ai-bt.md) | The BT alternative to FSM (see §0.5) — `AIComponent` + Composite/Decorator + `@BTNode` |
| `mlua_api_retriever` MCP | API for `StateComponent`, `StateType`, `StateAnimationComponent`, `AvatarStateAnimationComponent`, `HitComponent`, `MovementComponent` |
| `mlua_document_retriever` MCP | Concept docs: "Controlling Entity Status", "Easy Control of Avatar Animation with ActionSheet", "Controlling Avatar Animations", "Setting and Controlling Player" |
| `msw-scripting` skill | Authoring `StateType`/Component/event-handler `.mlua` scripts |
