---
name: msw-avatar
description: "MSW avatar management — costume (CostumeManagerComponent, 17 slots) + animation 3-layer pipeline (StateComponent → AvatarStateAnimationComponent → AvatarRendererComponent). Four-level distinction: State key (uppercase) / AvatarBodyActionStateName (lowercase) / MapleAvatarBodyActionState enum / sprite action ID (swingO1, shoot1). Two mapping systems via IsLegacy/ActionSheet/StateToAvatarBodyActionSheet. PlayerControllerComponent auto-transition conflicts with ActionStateChangedEvent resolved via RemoveActionSheet/SetActionSheet/BodyActionStateChangeEvent. Applies to any avatar-bearing entity (NPC, monster, etc.), not only DefaultPlayer. Use for costume get/set, 17 equip slots, animation state mapping, action override, weapon-specific attack motion, custom shoot/cast/dance action. Keywords: avatar, costume, animation, state, action, shoot, swing, weapon, equipment, custom action, block auto playback, remap."
---

# MSW Avatar (Costume · Animation)

An avatar is managed along two axes.

- **Costume (appearance)**: `MOD.Core.CostumeManagerComponent` — which items are equipped (17 slots).
- **Animation (motion)**: `AvatarStateAnimationComponent` + `AvatarRendererComponent` — which state clip is played (14 default states + custom actions).

**Edit workspace files directly**, then call the **`maker_refresh_workspace` tool of `msw-maker-mcp`** so the editor picks up the change.

This document covers costume (file-edit based) first, then animation (script based) at the end.

> **Workspace path rule**: maps `./map/`, UI `./ui/`, scripts and other assets `./RootDesk/MyDesk/`, global models such as DefaultPlayer/Player `./Global/`.

---

## Where to edit, by target

| Target | File to edit | Notes |
|--------|--------------|-------|
| **DefaultPlayer** | `./Global/DefaultPlayer.model` | Override `CostumeManagerComponent` properties via the `Values` array |
| **Player (base)** | `./Global/Player.model` | Costume defaults are usually overridden in **DefaultPlayer.model**, not here |
| **Entities placed in a map** (NPC, monster, etc.) | `./map/{mapName}.map` | The `CostumeManagerComponent` block inside that entity's `jsonString.@components` |
| **Entities that reference a custom model only** | The corresponding `.model` (e.g. under `./RootDesk/MyDesk/`) | When the map has no inline component and the entity is bound only by `modelId`, edit the model side |

**Read (equivalent to get)**: read the file above and inspect the `CostumeManagerComponent`-related fields / `Values` entries.

**Apply (equivalent to set)**: write values into the file, then call **`maker_refresh_workspace`**.

---

## Applying changes: MCP `maker_refresh_workspace`

After saving the file you **must** call the **`maker_refresh_workspace`** tool of the `msw-maker-mcp` server to sync Maker and its visual state. (See the tool list in the `msw-general` skill.)

---

## RUID (resource unique ID)

The string written into a costume is an **avatar item RUID** (typically a 32-character hex string).

- Never **guess or fabricate** an RUID. Look it up with the `msw-search` skill — for the avatar RUID workflow (default body/head, item detail, render composition) see [`../msw-search/references/resource/avatar.md`](../msw-search/references/resource/avatar.md); for generic search see [`../msw-search/references/resource/search.md`](../msw-search/references/resource/search.md); for single-item detail see [`../msw-search/references/resource/detail.md`](../msw-search/references/resource/detail.md).
- The script API `SetEquip(MapleAvatarItemCategory, itemRUID)` and the value stored in the editor/model are **the same RUID string**.
- `Custom*Equip` slots only accept a **plain Guid**. Any prefixed form — including `thumbnail://<ruid>` — is silently rejected and the slot is left unequipped (no error, no warning). RUIDs returned by `msw-search` are already plain Guids; do not prepend a scheme. See the `msw-sprite-ruid` skill for the broader thumbnail / icon rule.

---

## CostumeManagerComponent overview

Attached to entities that **use an avatar** (player, NPC, etc.). Equipment slots are exposed as **17 string properties** named `Custom*Equip`, and from scripts you access them via `GetEquip` / `SetEquip` with the `MapleAvatarItemCategory` enum.

### Other synced properties

| Property | Type | Description |
|----------|------|-------------|
| **UseCustomEquipOnly** | `boolean` (default `false`) | When `true`, the **user account's default costume is ignored** and only costumes assigned via script/model are used. Important when you want to lock the appearance inside a world. |
| **DefaultEquipUserId** | `string` | Clones the equipment of the specified user, then applies custom equipment on top. **Users who are not currently online** can also be specified. If that user later changes equipment, the reflected appearance may change. |
| **EquippedItems** | read-only | Actual equipped info at runtime. **Cannot be modified from script.** |

---

## 17 slots ↔ property ↔ MapleAvatarItemCategory

The 17 **equipment string fields** of `CostumeManagerComponent` map to the engine enum **`MapleAvatarItemCategory`** as follows. (Enum definition: see `Environment/NativeScripts/Enum/MapleAvatarItemCategory.d.mlua`.)

| # | Component property (string RUID) | MapleAvatarItemCategory | Notes |
|---|----------------------------------|-------------------------|-------|
| 1 | **CustomBodyEquip** | Body (1) | Skin / body |
| 2 | **CustomHairEquip** | Hair (3) | Hair |
| 3 | **CustomFaceEquip** | Face (4) | Face / face shape |
| 4 | **CustomCapEquip** | Cap (5) | Hat |
| 5 | **CustomCapeEquip** | Cape (6) | Cape |
| 6 | **CustomCoatEquip** | Coat (7) | Coat (top) |
| 7 | **CustomLongcoatEquip** | Longcoat (9) | Longcoat — an item class that **occupies both the top and bottom slots** |
| 8 | **CustomPantsEquip** | Pants (10) | Bottom |
| 9 | **CustomGloveEquip** | Glove (8) | Gloves |
| 10 | **CustomShoesEquip** | Shoes (12) | Shoes |
| 11 | **CustomOneHandedWeaponEquip** | OneHandedWeapon (13) | One-handed weapon |
| 12 | **CustomTwoHandedWeaponEquip** | TwoHandedWeapon (14) | Two-handed weapon — **occupies both the one-handed weapon slot and the sub-weapon slot** |
| 13 | **CustomSubWeaponEquip** | SubWeapon (15) | Sub-weapon |
| 14 | **CustomFaceAccessoryEquip** | FaceAccessory (16) | Face accessory |
| 15 | **CustomEyeAccessoryEquip** | EyeAccessory (17) | Eye accessory |
| 16 | **CustomEarAccessoryEquip** | EarAccessory (18) | Ear accessory |
| 17 | **CustomEarEquip** | Ear (19) | Ear (body part) |

### Enum values without a direct 17-field counterpart

| MapleAvatarItemCategory | Description |
|-------------------------|-------------|
| **Head (2)** | Close to "not used as equipment" — handled **automatically** to match the body color. There is no `CustomHeadEquip` field. |
| **Invalid (0)** | Used to detect error / undefined values. |
| **Shield (11)** | Per the enum comment, it uses the **SubWeapon slot**. In storage it is safest to treat it as mutually exclusive with **CustomSubWeaponEquip**. |

---

## Mutual exclusion / slot occupancy rules (must understand)

1. **Longcoat ↔ Coat + Pants**  
   **Longcoat** is designed to **occupy both the Coat and Pants slots**. When equipping a longcoat, **put the longcoat RUID in `CustomLongcoatEquip`** and **resolve the combination with coat/pants logically** — normally when a longcoat is in use, leave coat/pants empty or avoid conflicting visuals.

2. **Two-handed weapon ↔ One-handed weapon + sub-weapon**  
   **TwoHandedWeapon** **uses both the one-handed weapon slot and the sub-weapon slot**. When using a two-handed weapon, center on **`CustomTwoHandedWeaponEquip`** and make sure values are not also set for one-handed/sub-weapon — avoid double equipping.

3. **Shield ↔ Sub-weapon**  
   **Shield** uses the **sub-weapon slot**. Do not expect another sub-weapon to coexist with **`CustomSubWeaponEquip`**.

4. **Empty string = unequip**  
   Just like `SetEquip(category, "")` in script, leaving the field as **`""`** in a file means the slot is unequipped.

---

## DefaultPlayer.model — putting costume into `Values`

Add or modify an entry in the **`ContentProto.Json.Values`** array of `./Global/DefaultPlayer.model`.

- **TargetType**: `"MOD.Core.CostumeManagerComponent"`
- **Name**: a property name from the table above (e.g. `CustomCapEquip`, `UseCustomEquipOnly`)
- **ValueType**: follow the same pattern as other `Values` entries already in `DefaultPlayer.model`. Strings use `System.String, mscorlib, ...`, booleans use `System.Boolean, mscorlib, ...`
- **Value**: the RUID string or `true` / `false`

If the same `(TargetType, Name)` already exists, **update that entry only**; otherwise **append a new object to the array**.

### String slot example (structure only; replace the RUID via search)

```json
{
  "TargetType": "MOD.Core.CostumeManagerComponent",
  "Name": "CustomCapEquip",
  "ValueType": {
    "$type": "MODNativeType",
    "type": "System.String, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089"
  },
  "Value": "PUT_32_HEX_RUID_HERE"
}
```

### UseCustomEquipOnly example

```json
{
  "TargetType": "MOD.Core.CostumeManagerComponent",
  "Name": "UseCustomEquipOnly",
  "ValueType": {
    "$type": "MODNativeType",
    "type": "System.Boolean, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089"
  },
  "Value": true
}
```

---

## Map entities — edit in the `.map` file

Open the **entity record** of the target map under `./map/`.

1. Find the target entity (by name/path/id) in the `ContentProto.Entities` array.
2. In `jsonString["@components"]`, find the object with **`"@type": "MOD.Core.CostumeManagerComponent"`**.
3. Edit **`Custom*Equip`**, **`UseCustomEquipOnly`**, **`DefaultEquipUserId`**, etc. on that object directly.
4. Confirm that `MOD.Core.CostumeManagerComponent` is also listed in the **`componentNames`** string list, and that this list is consistent with the components array.

> If the map uses binary-only format, the editing tool may differ depending on workspace policy. When the file opens as JSON text, follow the structure above.

---

## Mapping `GET /v3/avatars` results to slots

Map the `category` field of an item returned by `GET /v3/avatars` to a `Custom*Equip` property. For the search method, see the `msw-search` skill → [`references/resource/avatar.md`](../msw-search/references/resource/avatar.md).

| API `category` | `Custom*Equip` property | `MapleAvatarItemCategory` |
|----------------|------------------------|--------------------------|
| `body` | `CustomBodyEquip` | Body (1) |
| `hair` | `CustomHairEquip` | Hair (3) |
| `face` | `CustomFaceEquip` | Face (4) |
| `faceaccessory` | `CustomFaceAccessoryEquip` | FaceAccessory (16) |
| `eyeaccessory` | `CustomEyeAccessoryEquip` | EyeAccessory (17) |
| `earaccessory` | `CustomEarAccessoryEquip` | EarAccessory (18) |
| `cap` | `CustomCapEquip` | Cap (5) |
| `cape` | `CustomCapeEquip` | Cape (6) |
| `longcoat` | `CustomLongcoatEquip` | Longcoat (9) |
| `coat` | `CustomCoatEquip` | Coat (7) |
| `pants` | `CustomPantsEquip` | Pants (10) |
| `glove` | `CustomGloveEquip` | Glove (8) |
| `shoes` | `CustomShoesEquip` | Shoes (12) |
| `weapon` | `CustomOneHandedWeaponEquip` | OneHandedWeapon (13) |
| `twohandweapon` | `CustomTwoHandedWeaponEquip` | TwoHandedWeapon (14) |
| `subweapon` | `CustomSubWeaponEquip` | SubWeapon (15) |
| `shield` | `CustomSubWeaponEquip` | Shield (11) — shares the SubWeapon slot |

---

## Avatar resource search reference

- **`msw-search`** skill → [`references/resource/avatar.md`](../msw-search/references/resource/avatar.md): details on `GET /v3/avatars` (costume search), default body/head, `GET /v3/avatars/{ruid}`, render composition, etc.
- Combine the category search and detail API to collect equipment RUIDs.

---

## Avatar tint / alpha (visual recoloring)

For color and transparency effects (hit flash, ghost fade, palette swap, etc.) on any entity that has `AvatarRendererComponent` attached — DefaultPlayer, avatar-bearing NPCs, monsters — use the renderer's own methods. **`SpriteRendererComponent.Color` and `FlipX` are a silent no-op on an avatar entity** (the avatar renderer paints over the sprite renderer's output even though `isvalid(spriteRenderer)` returns true).

| Method | Signature | Notes |
|--------|-----------|-------|
| `SetColor` | `(r, g, b, a [, targetUserId])` | r/g/b/a are floats in `0~1`. Tints the whole avatar. **Client ExecSpace.** |
| `SetAlpha` | `(a [, targetUserId])` | Float in `0~1`. Independent transparency. **Client ExecSpace.** |
| `SetAvatarPartColor` | `(category, r, g, b, a [, targetUserId])` | Tint only one `MapleAvatarItemCategory` slot. |

```lua
@ExecSpace("Client")
method void FlashRed()
    local renderer = self.Entity.AvatarRendererComponent
    if isvalid(renderer) == false then return end
    renderer:SetColor(1.0, 0.25, 0.25, 1.0)   -- red flash
    wait(0.1)
    renderer:SetColor(1.0, 1.0, 1.0, 1.0)     -- restore
end
```

For **avatar facing/flip**, use the facing API on `MovementComponent` (e.g. `MoveDirection`) instead of writing the sprite-level flip — same silent-no-op reason.

---

## Avatar animation — overall structure

Avatar animation flows through a **3-layer pipeline**. Working on only one layer leads to the other layers overwriting your changes and producing unintended motions.

```
[1] Input / game logic
       │  PlayerControllerComponent · scripts
       ▼
[2] StateComponent       ──── StateChangeEvent ────▶ AvatarStateAnimationComponent
       (e.g. "ATTACK")          (CurrentStateName)        (StateToAvatarBodyActionSheet
                                                            or ActionSheet lookup)
                                                                 │
                                                                 ▼
[3] AvatarRendererComponent ◀── BodyActionStateChange / ActionStateChanged ── body entity
       (actual sprite playback)
```

Key distinctions:

| Term | Format | Example |
|------|--------|---------|
| **State key** | UPPERCASE | `IDLE`, `MOVE`, `ATTACK`, `HIT`, `CROUCH`, `FALL`, `JUMP`, `CLIMB`, `LADDER`, `DEAD`, `SIT`, `ATTACK_WAIT` |
| **AvatarBodyActionStateName (Value side)** | lowercase | `stand`, `walk`, `attack`, `hit`, `crouch`, `fall`, `rope`, `ladder`, `dead`, `sit`, `alert`, `fly`, `blink`, `heal` |
| **MapleAvatarBodyActionState (enum)** | PascalCase | `Stand`, `Walk`, `Attack`, `Hit`, `Crouch`, `Fall`, `Sit`, `Rope`, `Ladder`, `Dead`, `Blink`, `Fly`, `Heal`, `Alert`, `Invalid` |
| **CoreActionName / PartsActionName (actual sprite action ID)** | lowercase + digits | `stand1`, `walk1`, `swingO1`, `shoot1`, `prone`, `jump`, `alert`, etc. |

> Common confusion: `"attack"` is **not a State**. The State is the uppercase `ATTACK`, the mapping Value is the lowercase `attack` (= `MapleAvatarBodyActionState.Attack`), and that Value is then resolved into a sprite action ID such as `swingO1` / `shoot1` depending on the weapon. From script, the call that triggers the state is `StateComponent:ChangeState("ATTACK")` (UPPERCASE string) — `"Attack"` or `"attack"` silently misses (no error, the state simply does not change).

---

## AvatarStateAnimationComponent — state ↔ motion mapping

`MOD.Core.AvatarStateAnimationComponent` holds both systems.

| Property | Used when | Type | Notes |
|----------|-----------|------|-------|
| `IsLegacy` | Switch between the two systems | `boolean` (default `false`) | `true` = use ActionSheet, `false` = use StateToAvatarBodyActionSheet |
| `ActionSheet` | `IsLegacy = true` (old) | `SyncDictionary<string, string>` | State→AnimationKey, e.g. `"ATTACK"` → `"attack"` |
| `StateToAvatarBodyActionSheet` | `IsLegacy = false` (new, default) | `SyncDictionary<string, AvatarBodyActionElement>` | e.g. `"ATTACK"` → `{AvatarBodyActionStateName="attack", PlayRate=1.33}` |

### `StateToAvatarBodyActionSheet` default mapping (the 11 default keys when IsLegacy=false)

| Key (State) | AvatarBodyActionStateName | PlayRate | Trigger condition (when PlayerControllerComponent is present) |
|-------------|--------------------------|----------|---------------------------------------------------------------|
| `IDLE` | `stand` | 1.0 | No input |
| `MOVE` | `walk` | 1.68 | Left/right movement |
| `ATTACK` | `attack` | 1.33 | **Left Ctrl** (Attack action) |
| `HIT` | `hit` | 1.0 | Hit processing by HitComponent |
| `CROUCH` | `crouch` | 1.0 | Down arrow |
| `FALL` | `fall` | 1.0 | Falling in the air |
| `JUMP` | `fall` | 1.0 | Space (Jump action) |
| `CLIMB` | `rope` | 1.0 | Entering a rope |
| `LADDER` | `ladder` | 1.0 | Entering a ladder |
| `DEAD` | `dead` | 1.0 | Death |
| `SIT` | `sit` | 1.0 | C (Sit action) |

> Note that **State keys are uppercase** while `AvatarBodyActionStateName` values are lowercase.

### Default resolution table: `MapleAvatarBodyActionState` → actual action ID

An `AvatarBodyActionStateName` string (`"attack"`, `"stand"`, etc.) is cast to the enum `MapleAvatarBodyActionState`, and the engine then resolves it into the following defaults, synthesizing an `ActionStateChangedEvent`.

| MapleAvatarBodyActionState | CoreActionName | PartsActionName | PlayRate | PlayType |
|----------------------------|----------------|-----------------|----------|----------|
| Stand | `stand1` / `stand2` | same | 1 | ZigzagLoop |
| Walk | `walk1` / `walk2` | same | 1 | Loop |
| Attack | `alert` (default when no weapon) | `alert` | 1 | Loop |
| Crouch | `prone` | `prone` | 1 | Loop |
| Fall | `jump` | `jump` | 1 | Loop |
| Sit | `sit` | `sit` | 1 | Loop |
| Rope | `rope` | `rope` | 1 | Loop |
| Ladder | `ladder` | `ladder` | 1 | Loop |
| Dead | `dead` | `stand1` | 1 | Loop |
| Blink | `blink` | `blink` | 1 | Loop |
| Fly | `fly` | `fly` | 1 | Loop |
| Hit | `alert` | `alert` | 1 | ZigzagLoop |
| Alert | `alert` | `alert` | 1 | ZigzagLoop |
| Heal | `heal` | `heal` | 1 | Loop |

> **When a weapon is equipped, `Attack` is automatically replaced with the sprite action ID matching the weapon type** (see the next table). Holding a one-handed sword produces a sword swing; holding a bow produces a bow shot.

### Per-weapon `attack` resolution — candidate sprite action IDs

When `ATTACK` is triggered, the engine looks at the equipped weapon (`MapleAvatarItemCategory`) and plays one of the following action IDs.

| Weapon class | Candidate CoreActionName / PartsActionName |
|--------------|--------------------------------------------|
| One-handed sword / dagger (`OneHandedWeapon`) | `swingO1`, `swingO2`, `swingO3`, `stabO1`, `stabO2` |
| Two-handed sword / hammer (`TwoHandedWeapon`) | `swingT1`, `swingT2`, `swingT3`, `stabT1`, `stabT2` |
| Bow (`TwoHandedWeapon`, bow family) | `swingT1`, `swingT3`, **`shoot1`** |
| Staff / wand | `swingO1`, `swingO2`, `swingO3` |
| No weapon (default body) | No dedicated attack clip → displayed via `alert` etc. |

> Even within the same class, the set of action IDs used may differ per item metadata. The table above lists the representative candidates used by the SDK guide (`_ActionNameLogic`).

### PlayerControllerComponent and auto state addition

When `MOD.Core.PlayerControllerComponent` is attached to a player entity, the following States are **added automatically** to `StateComponent` and transition automatically on key input:

`MOVE`, `CLIMB`, `LADDER`, `CROUCH`, `JUMP`, `FALL`, `ATTACK`, `ATTACK_WAIT`, `SIT`

So when a DefaultPlayer presses Ctrl, the ATTACK state activates automatically and **the mapped attack body motion (= the per-weapon sword/bow/staff swing) plays automatically** — even with no extra scripting, the sword still swings.

---

## Auto playback ↔ manual ActionStateChangedEvent collision (★ common pitfall)

**Symptom**: Even after sending a custom action like `shoot1` via `ActionStateChangedEvent` from script, **the sword swing (or the weapon's default attack)** still plays, or your custom action shows for a single frame and is immediately overwritten.

**Cause**: While `ATTACK` is active, `AvatarStateAnimationComponent` *continuously* re-sends the mapped `attack` body motion. Your single-shot event is immediately overwritten.

### Resolution strategies

| Strategy | Method | When to use |
|----------|--------|-------------|
| **A. Remove the mapping** | Call `asac:RemoveActionSheet("ATTACK")` to drop the key. Then play the action directly via `ActionStateChangedEvent`. | When you want to **fully replace** the attack motion with a custom one (bow shot, spellcast, etc.) |
| **B. Change the mapping** | Call `asac:SetActionSheet("ATTACK", "<Body Action name>")` or change `StateToAvatarBodyActionSheet["ATTACK"]` to a different `MapleAvatarBodyActionState`. | When you want to switch to a different **built-in state animation** (e.g. ATTACK→heal) |
| **C. Force reset** | Send `BodyActionStateChangeEvent` with `needResetAction=true`. | When you want to **restart** the same state |
| **D. Swap the weapon** | Replace the weapon slot of `CostumeManagerComponent` with a **bow RUID**. | When you simply want to change the **weapon variant** of the attack motion (the most intuitive option) |

#### Strategy A example — turn off sword swing, replace with bow shot

```lua
@Component
script PlayerAttack extends AttackComponent

	@HideFromInspector
	property any Shape = nil

	@ExecSpace("ServerOnly")
	method void OnBeginPlay()
		self.Shape = BoxShape(Vector2.zero, Vector2.one, 0)

		-- Remove the attack(=sword swing) mapping that the engine auto-plays during ATTACK
		local asac = self.Entity.AvatarStateAnimationComponent
		if isvalid(asac) then
			asac:RemoveActionSheet("ATTACK")
		end
	end

	@ExecSpace("ServerOnly")
	method void AttackNormal()
		-- ... damage resolution ...
		self:PlayShootAnimation()
	end

	@ExecSpace("Client")
	method void PlayShootAnimation()
		local body = self.Entity.AvatarRendererComponent:GetBodyEntity()
		if isvalid(body) == false then return end

		local event = ActionStateChangedEvent()
		event.CoreActionName = "shoot1"
		event.PartsActionName = "shoot1"
		event.PlayType = SpriteAnimClipPlayType.Onetime
		body:SendEvent(event)
	end

	@ExecSpace("ServerOnly")
	@EventSender("Self")
	handler HandlePlayerActionEvent(PlayerActionEvent event)
		if event.ActionName == "Attack" then
			self:AttackNormal()
		end
	end
end
```

> `RemoveActionSheet` / `SetActionSheet` must be **called on the server** for the change to sync, because `StateToAvatarBodyActionSheet` is a `@Sync` property.

#### Strategy D example — equip a bow via CostumeManagerComponent

If you add a bow RUID to `Values` in `./Global/DefaultPlayer.model`, the engine will automatically pick the `shoot1` motion during ATTACK without changing the mapping.

```json
{
  "TargetType": "MOD.Core.CostumeManagerComponent",
  "Name": "CustomTwoHandedWeaponEquip",
  "ValueType": {
    "$type": "MODNativeType",
    "type": "System.String, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089"
  },
  "Value": "<bow RUID — obtain via msw-search>"
},
{
  "TargetType": "MOD.Core.CostumeManagerComponent",
  "Name": "UseCustomEquipOnly",
  "ValueType": {
    "$type": "MODNativeType",
    "type": "System.Boolean, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089"
  },
  "Value": true
}
```

---

## 14 states vs custom actions — which do you trigger yourself?

The **14 body motions already known to `AvatarStateAnimationComponent` / `MapleAvatarBodyActionState`** and **arbitrary sprite action IDs outside that set** (e.g. `swingO2`, `shoot1`, `dance`, `cast1`) go through different paths.

### The 14 body motions the engine handles automatically (= members of MapleAvatarBodyActionState)

These are the names usable as the Value of `StateToAvatarBodyActionSheet`/`ActionSheet`. Once you map a State to one of these, it plays automatically.

| Body motion name | Enum | Meaning |
|------------------|------|---------|
| `stand` | Stand | Idle |
| `walk` | Walk | Movement |
| `attack` | Attack | Attack (the sprite ID is auto-selected by weapon) |
| `hit` | Hit | Hit |
| `crouch` | Crouch | Crouch |
| `fall` | Fall | Fall |
| `rope` | Rope | Holding a rope |
| `ladder` | Ladder | Ladder |
| `dead` | Dead | Death |
| `sit` | Sit | Sit |
| `heal` | Heal | Heal |
| `alert` | Alert | Alert |
| `fly` | Fly | Fly |
| `blink` | Blink | Blink |

### Anything else — play directly via `ActionStateChangedEvent`

For arbitrary sprite action IDs outside the 14 enum members (e.g. `shoot1`, `swingO2`, `cast1`, `throw1`, `dance`, `cheer`), use the following procedure.

**Playback pipeline**

1. From the entity's `AvatarRendererComponent`, call **`GetBodyEntity()`** to obtain the **body entity** of the avatar. Animation events go to the **body entity**, not the avatar root.
2. Create an **`ActionStateChangedEvent`** and fill its fields.
3. Send it to the body entity via `body:SendEvent(event)`.
4. Animation only needs to be seen by each client, so this is typically scoped to **`@ExecSpace("Client")`**. Game logic (damage, projectile spawn, etc.) belongs on the `ServerOnly` side.

**Main fields of `ActionStateChangedEvent`** (constructor: `ActionStateChangedEvent(coreActionName, partsActionName, playRate=1, playType=Loop, startFrameIndex=0, endFrameIndex=2147483647)`)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `CoreActionName` | string | `""` | Animation ID to play on the core parts (body). **Required** (e.g. `"shoot1"`, `"swingO1"`) |
| `PartsActionName` | string | `""` | Animation ID to play on the sub-parts. **Required** — usually the same value as `CoreActionName` |
| `PlayRate` | float | `1` | Playback speed multiplier (`1.0` = normal speed, `1.5` = 1.5×) |
| `PlayType` | `SpriteAnimClipPlayType` | `Loop` | `Onetime` / `Loop` / `ZigzagLoop`. For one-shot actions use **`Onetime`** |
| `StartFrameIndex` | int32 | `0` | Start frame (negative values are clamped to 0) |
| `EndFrameIndex` | int32 | `2147483647` | End frame (clamped if it exceeds the total frame count) |

`SpriteAnimClipPlayType`:

| Value | Meaning |
|-------|---------|
| `Onetime` | Plays once, then stops |
| `Loop` | 0→end, repeated |
| `ZigzagLoop` | 0→end→0, repeated |

### `BodyActionStateChangeEvent` — high-level event for the 14 built-in states

Directly specifies a `MapleAvatarBodyActionState` enum value. You don't have to memorize per-weapon action IDs, and you can force-restart the same state via `needResetAction=true`.

Unlike `ActionStateChangedEvent`, `SendEvent` targets the **avatar root entity (`self.Entity`)**, not the body entity.

```lua
local event = BodyActionStateChangeEvent()
event.ActionState = MapleAvatarBodyActionState.Fly
event.needResetAction = true
event.startFrameIndex = 1
event.endFrameIndex = 2
self.Entity:SendEvent(event)
-- Internally converted to ActionStateChangedEvent("fly", "fly", 1, Loop, 1, 2) and dispatched
```

| Field | Description |
|-------|-------------|
| `ActionState` | `MapleAvatarBodyActionState` enum (Stand/Walk/Attack/Hit/...) |
| `needResetAction` | When `true`, force-restarts from the beginning even if the state is already playing |
| `playRate` / `startFrameIndex` / `endFrameIndex` | Same as `ActionStateChangedEvent` |

**Choosing between them**

- **Arbitrary sprite action ID** (`shoot1`, `swingO2`, `dance`, etc.) → `ActionStateChangedEvent` (send to body entity)
- **One of the 14 enum states** (Stand/Walk/Attack/...) → `BodyActionStateChangeEvent` (send to root entity)

### Example — playing the arrow-firing (`shoot`) animation

A typical pattern: on the server, the attack input spawns a projectile; on the client, the `shoot1` action plays.

```lua
@Component
script PlayerAttack extends Component

    property string ArrowModelId = "model://bc9f9d0e-2b5d-4b3b-a115-d857f85e9145"

    @HideFromInspector
    property integer ArrowCount = 0

    @ExecSpace("ServerOnly")
    method void FireArrow()
        if self.ArrowModelId == nil or self.ArrowModelId == "" then
            log_warning("PlayerAttack: ArrowModelId is not set")
            return
        end

        local playerController = self.Entity.PlayerControllerComponent
        local transform = self.Entity.TransformComponent
        if isvalid(playerController) == false or isvalid(transform) == false then
            return
        end

        local dirX = playerController.LookDirectionX
        if dirX == 0 then dirX = 1 end

        local worldPos = transform.WorldPosition
        local spawnPos = Vector3(worldPos.x + 0.35 * dirX, worldPos.y + 0.35, worldPos.z)

        self.ArrowCount += 1
        local arrowName = "PlayerArrow_" .. tostring(self.ArrowCount)

        local parent = self.Entity.CurrentMap
        if isvalid(parent) == false then
            parent = self.Entity.Parent
        end

        local arrow = _SpawnService:SpawnByModelId(self.ArrowModelId, arrowName, spawnPos, parent)
        if isvalid(arrow) == false then
            log_warning("PlayerAttack: failed to spawn arrow")
            return
        end

        local arrowProj = arrow.ArrowProjectile
        if isvalid(arrowProj) then
            arrowProj:Fire(Vector2(dirX, 0))
        end

        self:PlayShootAnimation()
    end

    @ExecSpace("Client")
    method void PlayShootAnimation()
        local avatarRenderer = self.Entity.AvatarRendererComponent
        if isvalid(avatarRenderer) == false then
            return
        end
        local body = avatarRenderer:GetBodyEntity()
        if isvalid(body) == false then
            return
        end

        local event = ActionStateChangedEvent()
        event.CoreActionName = "shoot1"
        event.PartsActionName = "shoot1"
        event.PlayRate = 1.5
        event.PlayType = SpriteAnimClipPlayType.Onetime
        body:SendEvent(event)
    end

    @ExecSpace("ServerOnly")
    @EventSender("Self")
    handler HandlePlayerActionEvent(PlayerActionEvent event)
        local ActionName = event.ActionName

        if ActionName == "Attack" then
            self:FireArrow()
        end
    end

end
```

### Decision flow

1. Is the motion you want to play one of the **14 built-in states** (`stand`, `walk`, `attack`, `hit`, `crouch`, `fall`, `rope`, `ladder`, `dead`, `sit`, `heal`, `alert`, `fly`, `blink`)?
   - **YES** → Just assign the clip in the matching slot of `AvatarStateAnimationComponent`. No script needed.
   - **NO** → continue below.
2. For custom actions (e.g. `shoot1`, `cast1`, `dance`), create an **`ActionStateChangedEvent`** and `SendEvent` it to the **body entity** returned by `AvatarRendererComponent:GetBodyEntity()`.
3. Split execution spaces: input handling and damage resolution on the server (`ServerOnly`), **animation playback on the client (`Client`)**.

### Common mistakes

- **Confusing the State key with AvatarBodyActionStateName (=the enum).** State keys are uppercase (`ATTACK`); mapping Values are lowercase (`attack`). If you swap Key/Value in `StateToAvatarBodyActionSheet`, the mapping silently fails.
- **Sending only ActionStateChangedEvent without disabling auto playback.** When Ctrl is pressed the `ATTACK` state activates automatically, and the mapped attack body motion immediately overwrites your event. To use a custom attack motion you **must** clean up the mapping with `RemoveActionSheet("ATTACK")` or `SetActionSheet("ATTACK", "<desired motion>")`.
- **Wrong SendEvent target for `ActionStateChangedEvent`**: it must be the **body entity** returned by `AvatarRendererComponent:GetBodyEntity()`. Sending it to `self.Entity` (the avatar root) or to a component does not play. (Conversely, `BodyActionStateChangeEvent` goes to the **root entity**.)
- **Writing `AvatarBodyActionSelectorComponent.ActionState` directly on a DefaultPlayer-shaped entity** (running `PlayerControllerComponent` + `StateComponent` + `AvatarStateAnimationComponent`). The controller re-evaluates ground/move/input each tick and calls `ChangeState` on transitions; the resulting `StateChangeEvent → BodyActionStateChangeEvent` repaints the selector, silently dropping your write. Use `StateComponent:ChangeState("UPPERCASE_KEY")` instead. Direct selector writes only stick on NPCs/monsters without that controller stack.
- **Trying to put arbitrary state names into `AvatarStateAnimationComponent`.** Values outside the 14 enum members (`MapleAvatarBodyActionState`) — e.g. `shoot`, `cast`, `dance` — are ignored. Custom IDs must go through `ActionStateChangedEvent`.
- **Forgetting `PartsActionName`.** If you set only `CoreActionName`, the sub-parts (weapon, hat, cape, etc.) won't be resolved, so you can end up with **the upper body moving while the weapon stays frozen**. Use the same value as `CoreActionName`.
- **Leaving `PlayType` unset.** The default is `Loop`, which causes one-shot actions to repeat forever. For one-shot actions, set `SpriteAnimClipPlayType.Onetime` explicitly.
- **Calling `RemoveActionSheet`/`SetActionSheet` on the client.** `StateToAvatarBodyActionSheet` is a `@Sync` property — these must be **called on the server** to reach all clients.
- **Forgetting to separate server/client execution spaces.** Game logic (damage, projectiles) = `ServerOnly`; animation playback = `Client`. Mixing them in one place leads to duplicated playback per client or missing visuals.
- **Expecting a bow motion without equipping a bow.** Firing `shoot1` puts the body in the bow pose, but **if no bow RUID is set in `CustomTwoHandedWeaponEquip`, no bow is drawn in the hand**. For a natural visual, set the motion and the weapon together.

---

## Related skills

| Skill | Purpose |
|-------|---------|
| **msw-defaultplayer** | Structure of `./Global/DefaultPlayer.model` / `Player.model` and `Values` rules |
| **msw-search** | RUID lookup, [`references/resource/avatar.md`](../msw-search/references/resource/avatar.md) |
| **msw-general** | Maker MCP tools — **`maker_refresh_workspace`**, optionally `maker_execute_script` (when combined with runtime tweaks) |

---

## Summary checklist

### Costume

1. Obtain the RUID via the **resource search / avatar reference docs**.
2. **DefaultPlayer / Player** → `Values` in `./Global/*.model` (or the base model definition).
3. **Map entities** → `@components` of the target entity inside `./map/*.map`.
4. Respect the **Longcoat / two-handed weapon / shield ↔ sub-weapon** exclusion rules.
5. Decide whether to ignore the user's account default costume via **`UseCustomEquipOnly`**.
6. After saving, call **`msw-maker-mcp` → `maker_refresh_workspace`**.

### Animation

7. **Distinguish State keys (uppercase) from body motion names (lowercase).** Form: `StateToAvatarBodyActionSheet["ATTACK"] = AvatarBodyActionElement("attack", 1.33)`.
8. If the desired motion is among the **14 enum body motions** (`stand`·`walk`·`attack`·`hit`·`crouch`·`fall`·`rope`·`ladder`·`dead`·`sit`·`heal`·`alert`·`fly`·`blink`), just define the mapping — done.
9. For other action IDs (`shoot1`, `swingT3`, `dance`, etc.), create an **`ActionStateChangedEvent`** and **`SendEvent`** it to the result of `AvatarRendererComponent:GetBodyEntity()`. To restart a state inside the enum, use **`BodyActionStateChangeEvent`** + the root entity.
10. Fill all four fields — `CoreActionName` / `PartsActionName` / `PlayRate` / `PlayType` — and use **`SpriteAnimClipPlayType.Onetime`** for one-shot actions.
11. **Check for conflicts with auto state transitions.** On entities that have PlayerControllerComponent, `MOVE/ATTACK/JUMP/...` fire automatically on input — to use a custom attack, clean up the conflicting key with **`RemoveActionSheet`** or **`SetActionSheet`** (call on the server).
12. Split game logic into `@ExecSpace("ServerOnly")` and animation playback into **`@ExecSpace("Client")`**.
13. If your goal is only to change the weapon variant of the attack motion, the simplest path is to **swap the weapon-slot RUID of `CostumeManagerComponent`** (Strategy D).
