# MSW Monster — Builder-Only Authoring

This reference is for building a working monster model on MapleTile side-view maps. `.model` JSON is builder-managed; do not inspect or edit raw `.model` internals.

**Read [`animation-state.md`](animation-state.md) §0 first to pick an animation pattern** — Pattern A (script-driven `SpriteRUID`, proven by `Soldier.model`) vs Pattern B (`ActionSheet` auto-swap, `MonsterCanonical.model`). Composition / `IsLegacy` requirement / `ActionSheet` keys all differ. The rest of this doc covers monster-specific composition, AI choices, HP/respawn, spawn, and placement under both patterns.

**Canonical working sample (Pattern A):** a Soldier monster setup — `Soldier/SoldierAI.mlua`, `Soldier/SoldierAttack.mlua`, `Soldier/SoldierSpawner.mlua`, `Monster.mlua`, and `Models/Monsters/Soldier.model`. Full source for all four scripts is inlined in §7 below; refer back to those sections any time the skill output drifts from what visibly works.

```javascript
const { ModelBuilder, vector2, collisionGroup, actionSheet } = require("./scripts/model/msw_model_builder.cjs");
```

## 1. Silent Failures to Avoid

| Symptom | Root cause | Fix |
|---|---|---|
| Monster invisible | Missing or wrong `SpriteRUID` | `value("SpriteRendererComponent", "SpriteRUID", standRuid, "string")` |
| **Nothing animates** — stuck on `stand`, neither move nor die clip plays, no errors | You chose Pattern B (ActionSheet pipeline) but `StateComponent.IsLegacy` is missing from `.model` (defaults to `true` = legacy mode that ignores `ActionSheet`). See [`animation-state.md` §0](animation-state.md). | Either `b.value("StateComponent", "IsLegacy", false, "bool")` (Pattern B path — also reflected in `MonsterCanonical.model`), or switch to Pattern A and drive `SpriteRendererComponent.SpriteRUID` directly from a script (canonical: `script.SoldierAI` — Soldier.model leaves `IsLegacy` unset and works). |
| `[LEA-3022] InvalidExecSpace` on `AddState` / `ChangeState` | Called from the wrong execution space — monster state authority is server-only | Wrap the call in `@ExecSpace("ServerOnly")`. **Do not** also mirror on client (throws on whichever side lacks authority). See [`animation-state.md` §4](animation-state.md). |
| Other animation / state-related bugs | See pitfall table in [`animation-state.md` §7](animation-state.md) | — |
| `[LWA-3019] ... Legacy` on AI/Hit | Legacy defaults | Set `IsLegacy = false` on `AIChase`/`AIWander`/`HitComponent` |
| Monster behind tiles | Wrong sorting layer | Set `SortingLayer = "MapLayer0"` and suitable `OrderInLayer` |
| Hit or attack does nothing | Missing hit box / collision group | Set `HitComponent` box, offset, and monster collision group |
| Monster faces wrong direction | Sprite resources usually face left | Invert `TransformComponent.Scale.x` from movement direction, not `SpriteRendererComponent.FlipX`, so the sprite and collider stay aligned |

## 2. Standard Monster Composition

| Component | Role | Pattern A (Soldier) | Pattern B (MonsterCanonical) |
|---|---|---|---|
| `TransformComponent` | Position, facing (invert `Scale.x` for direction — sprite resources usually face left). | ✅ | ✅ |
| `SpriteRendererComponent` | Visible sprite; needs `SpriteRUID`, `SortingLayer`, `OrderInLayer`. | ✅ | ✅ |
| `StateAnimationComponent` | Pattern B: drives the clip from `ActionSheet` on every `StateChangeEvent`. Pattern A: present in the model but bypassed — script sets `SpriteRUID` directly. | ✅ (decorative) | ✅ (load-bearing) |
| `StateComponent` | State machine. Defaults `IDLE`/`DEAD` only. Pattern A uses it only for `IDLE`/`DEAD` (DeadEvent / IsDead sync). Pattern B also requires `IsLegacy=false` so `ActionSheet` actually runs. | ✅ (`IsLegacy` unset) | ✅ (`IsLegacy=false`) |
| Body (`Rigidbody` / `Kinematicbody` / `Sideviewbody`) | Body for the map type ([`platform.md`](platform.md) §4). Required for MovementComponent / gravity / tile collision. | ✅ | ✅ |
| `MovementComponent` | `InputSpeed`, `JumpForce`, `MoveToDirection`, `Stop`. **Only moves the body — does not change `StateComponent`.** | ✅ | ✅ |
| `AIChaseComponent` *or* `AIWanderComponent` | Toggles `IDLE`↔`MOVE` and overwrites Body velocity from a built-in BehaviorTree. **Mutually exclusive with a custom AI script** — see §5d. | ❌ omitted | ✅ |
| `HitComponent` | Hit collider; receives `HitEvent`. `IsLegacy = false` mandatory. Registers `HIT` state on the entity (built-in HitComponent auto-returns to `IDLE` ~0.5s). | ✅ | ✅ |
| `DamageSkinSpawnerComponent` | Floats damage numbers on `HitEvent`. | ✅ | ✅ |
| `script.Monster` | HP, death, respawn. Calls `ChangeState("DEAD")` on HP=0 then hides/destroys/respawns. | ✅ | ✅ |
| custom AI script (`script.SoldierAI`-style) | Pattern A only — owns its own state variable, sets `SpriteRUID` per state, drives `MovementComponent:MoveToDirection`, gates attack on range. Replaces AIChase/AIWander entirely. | ✅ | — |
| `script.MonsterAttack` / `script.SoldierAttack` | `AttackComponent` subclass — `AttackFast(shape, nil, CollisionGroups.Player)` to deliver hits. MonsterAttack auto-timers `AttackFast` while alive; SoldierAttack exposes `DoAttack()` invoked by the AI script's `ATTACK` state. | ✅ (SoldierAttack: on-demand) | ✅ (MonsterAttack: timer) |

`script.Monster` / `script.MonsterAttack` / `script.SoldierAI` / `script.SoldierAttack` must be registered first. Safe order: write `.mlua` → `refresh` (generates `.codeblock`) → only after `.codeblock` exists, include the script in the `.model` → `refresh`.

> **Pattern A canonical layout** (verbatim from `Soldier.model`'s `Components` array, in order):
> `TransformComponent`, `StateAnimationComponent`, `SpriteRendererComponent`, `RigidbodyComponent`, `MovementComponent`, `StateComponent`, `HitComponent`, `DamageSkinSpawnerComponent`, `script.Monster`, `script.SoldierAI`, `script.SoldierAttack`. No AI component. Eleven entries total.

### Body ↔ map type mapping

| TileMapMode | Body component |
|-------------|----------------|
| MapleTile (0) | `MOD.Core.RigidbodyComponent` |
| RectTile (1) | `MOD.Core.KinematicbodyComponent` |
| SideViewRectTile (2) | `MOD.Core.SideviewbodyComponent` |

Map type check: [`platform.md`](platform.md) §4. Per-Body knockback differences: [`msw-combat-system/SKILL.md`](../../msw-combat-system/SKILL.md) §3-1.

## 3. Action RUID Mapping (`StateAnimationComponent.ActionSheet`)

Lowercase action keys consumed by the engine after `StateStringToAnimationKey` conversion (full table in [`animation-state.md` §6a](animation-state.md)):

| Resource action | Monster action key | State that uses it |
|---|---|---|
| `stand` | `stand` | `IDLE` |
| `move` | `move` | `MOVE` |
| `jump` | `jump` | `JUMP` |
| `attack`, `attack1`, `attack2` | `attack` | `ATTACK` |
| `hit`, `hit1`, `hit2` | `hit` | `HIT` |
| `die`, `die1` | `die` | `DEAD` |

Only set keys you have RUIDs for. Always point `SpriteRUID` at the `stand` RUID so the first pre-state-change frame renders.

**Minimum keys actually required for visible behavior:**

| Pattern | Required keys | Optional |
|---|---|---|
| A (script-driven `SpriteRUID`) | none — ActionSheet is bypassed. The script holds per-state RUIDs as its own properties (e.g. `StandRUID`/`MoveRUID`/`AttackRUID`/`DieRUID`/`Die2RUID` on `SoldierAI`) and assigns `SpriteRUID` directly. Keep ActionSheet filled (e.g. `stand`/`move`/`attack`/`die`) for `Soldier.model` parity, but it does not drive playback. | — |
| B (ActionSheet pipeline) | `stand` (rendered before any state change). `move` if the monster ever enters `MOVE`. `die` if you want a visible death — otherwise the corpse freezes on the last frame and `DeadEvent` still fires. | `hit` (HitComponent auto-enters HIT for ~0.5s — without a key the previous clip simply keeps playing during that window; `Soldier.model` omits `hit` entirely). `attack` only if you register a custom `ATTACK` state and want a distinct clip; the built-in `script.MonsterAttack` damages players without changing state. `jump` only if your controller calls `ChangeState("JUMP")`. |

Use `msw-search` to find animationclip RUIDs. Missing keys fail silently — the previous clip keeps playing.

Example ActionSheet JSON (Pattern A — Soldier.model layout):

```json
{
  "@type": "MOD.Core.StateAnimationComponent",
  "ActionSheet": {
    "stand":  "<stand clip RUID>",
    "move":   "<move clip RUID>",
    "attack": "<attack clip RUID>",
    "die":    "<die clip RUID>"
  },
  "Enable": true
}
```

## 4. HitComponent hitbox

The verified working canonicals (`MonsterCanonical.model` and `Soldier.model`) both use:

```
BoxSize           = (0.67, 1.42)
ColliderOffset    = (-0.005, 0.71)
CollisionGroup.Id = "8992acd1e8cd45838db6f10a7b41df09"   -- UUID for MOD@HitBox
IsLegacy          = false
```

Use these as the starting point for human-sized monsters (Soldier dimensions). Without the correct `CollisionGroup.Id` UUID, `AttackComponent:Attack(..., CollisionGroups.Monster)` will not interact. The value serialized in `.model` JSON is always the **resolved UUID** — not the human-readable name `"MOD@HitBox"`.

For a custom-sized monster, derive from the sprite bounds:

1. Inspect the sprite's actual bounds (sprite size ÷ PPU or via the editor)
2. `BoxSize` = same as bounds.size, or slightly smaller
3. `ColliderOffset` = `(bounds.center.x − position.x, bounds.center.y − position.y)`

```
-- Example: bounds.size=(1.15, 0.87), bounds.center=(-1.80, 1.19), position=(-1.66, 0.77)
BoxSize = (1.15, 0.87)
ColliderOffset = (-1.80 - (-1.66), 1.19 - 0.77) = (-0.14, 0.42)
```

### 4a. Sprite-pivot-based dynamic collider (runtime calculation)

Instead of computing steps 1~3 by hand, derive `BoxSize` and `PositionOffset` automatically in `OnBeginPlay` from the first-frame sprite metadata of the `AnimationClip` — same code reused across monsters of varying size (especially for contact-attack areas like `MonsterAttack` / `SoldierAttack`).

```lua
@ExecSpace("ServerOnly")
method void OnBeginPlay()
    local clip = _ResourceService:LoadAnimationClipAndWait(self.Entity.SpriteRendererComponent.SpriteRUID)
    local sprite = clip.Frames[1].FrameSprite
    local sizePx = Vector2(sprite.Width, sprite.Height)
    local ppu    = sprite.PixelPerUnit

    self.SpriteSize     = sizePx / ppu                                       -- world-unit size
    self.PositionOffset = (sizePx / 2 - sprite.PivotPixel:ToVector2()) / ppu -- pivot correction
    -- Then in AttackNear etc.:
    --   local shape = BoxShape(myPos + self.PositionOffset, self.SpriteSize, 0)
end
```

All APIs used are documented in `.d.mlua` (`_ResourceService:LoadAnimationClipAndWait`, `Sprite.Width/Height/PixelPerUnit/PivotPixel`). Values are normalized to **workspace units (world units)**, so they can be used directly in `BoxShape(position, size, angle)` (use `angle=0` for an axis-aligned rectangle).

> ⚠ `LoadAnimationClipAndWait` is a synchronous load (blocks the server for one frame). Call it once in `OnBeginPlay` and cache in `_T` or a property. Do not re-load every frame inside `OnUpdate`. Wrap in `_ResourceService:PreloadAsync({ruid}, function() ... end)` if you want to avoid the block — `MonsterAttack` does this.

## 5. AI Choice

| Want | Approach |
|---|---|
| Chase nearest player | `AIChaseComponent` (Pattern B) |
| Patrol/wander on footholds | `AIWanderComponent` (Pattern B) |
| Stay still and only attack | Remove both `AIChaseComponent` and `AIWanderComponent`; add a custom timer-driven AttackComponent |
| Chase the attacker instead of nearest player | `AIChaseComponent` with `IsChaseNearPlayer = false`; call `SetTarget(attacker)` from a `HitEvent` handler (Pattern B) |
| Multi-step behavior (patrol → alert → chase → cooldown, attack patterns, talking idle, range-gated attack) | **Custom AI script (Pattern A — Soldier).** Remove both AIChase/AIWander entirely (their built-in BT overwrites velocity every frame and stomps your script). Author a single `@Component script MyAI extends Component` with its own state variable, an `OnBeginPlay` that calls `self:EnterState("ROAM")`, an `EnterState(newState)` that sets the right `SpriteRUID` + duration + facing, and an `OnUpdate(delta)` that ticks state timers, finds the nearest player via `_UserService:GetUsersByMapComponent(map.MapComponent)`, and transitions on range. Death is driven by reading `self.Entity.Monster.IsDead` and playing one die clip once. |
| Multi-step via engine BehaviorTree | Replace AI components with `AIComponent` and author a BehaviorTree from `BTNodeType` scripts. Drive `StateComponent` from nodes so animations still follow [`animation-state.md` §3](animation-state.md). Requires Pattern B setup (`IsLegacy=false`). |

Both AI components need correct Body + Movement + State setup. On MapleTile use `RigidbodyComponent`. AI auto-adds `StateComponent` if missing, but list it in the model anyway so load-time dependencies are stable.

### 5a. `AIChaseComponent` (chaser)

Auto-chases any player inside the detection range. Stops chasing on range exit.

```
property float DetectionRange = 5          -- detection radius (units)
property boolean IsChaseNearPlayer = true  -- true: auto-chase the nearest player
property EntityRef TargetEntityRef         -- fixed target entity
property boolean IsLegacy = false          -- must be false

method Entity GetCurrentTarget()           -- return the current chase target
method void SetTarget(Entity targetEntity) -- set a fixed target (auto-disables IsChaseNearPlayer)
method BTNode CreateLeafNode / CreateNode / SetRootNode  -- BT customization
```

Builder tuning:

```javascript
b.value("AIChaseComponent", "DetectionRange", 6.0, "float")
  .value("AIChaseComponent", "IsChaseNearPlayer", true, "bool")
  .value("AIChaseComponent", "IsLegacy", false, "bool");
```

`DetectionRange` pauses/resumes the chase as the target leaves/re-enters; `IsChaseNearPlayer = true` auto-targets the nearest player in range, overridden by `SetTarget(entity)` / `TargetEntityRef`; read with `GetCurrentTarget()`.

### 5b. `AIWanderComponent` (wanderer)

Wanders autonomously near the spawn position. Ignores the player.

```
property boolean IsLegacy = false          -- must be false
property boolean LogEnabled = false
property UpdateAuthorityType UpdateAuthority = UpdateAuthorityType.Server

method BTNode CreateLeafNode(string nodeName, func<float> -> BehaviourTreeStatus)
method BTNode CreateNode(string nodeType, string nodeName, func<float> -> BehaviourTreeStatus)
method void SetRootNode(BTNode node)
```

Just adding the component (without custom BT nodes) yields default wander behavior. For advanced patrol routes, build a BT directly via `SetRootNode`. For MapleTile patrol use `PredictFootholdEnd` to reverse at edges ([`platform-maple.md`](platform-maple.md) §5).

### 5c. Switching pattern (swap AI from script)

```lua
-- Wander → Chase swap (dynamic swap from script)
entity:RemoveComponent("AIWanderComponent")
entity:AddComponent("AIChaseComponent")
local chase = entity.AIChaseComponent
chase.DetectionRange = 8.0
```

> `.model`-level swap: replace the `AIWanderComponent` entry with an `AIChaseComponent` entry, then Maker Refresh.

### 5d. ⚠ Do not use AIChase/AIWander together with a custom chase/movement script

`AIChaseComponent` / `AIWanderComponent` **run a BehaviorTree every frame in OnUpdate and overwrite the Body velocity directly.**

- Chase node (`Chase`): if the target is within `DetectionRange` (default 5 units), calls `MovementComponent.MoveToDirection(dir)` → `Body.SetVelocity(dir)`
- Stop node (`Stop`): if the target is out of range or absent, every frame calls `MoveToDirection(zero)` → **forces velocity = 0**
- Additionally, on `FinishedConstruct` it force-overwrites Rigidbody properties: `WalkSpeed=0.5, WalkAcceleration=0.5, WalkDrag=1000, IsolatedMove=true` (on MapleTile)

**Symptom**: Even if a custom chase script tries to chase via `body.MoveVelocity = (vx, vy)`, AIChase immediately overwrites it the next frame. Outside 5 units it gets stomped to 0 every frame, so **the monster appears stuck.** Changing Rigidbody settings is ignored (WalkSpeed is pinned to 0.5).

**Resolution**: If you use a custom AI, **completely remove** `AIChaseComponent` / `AIWanderComponent` from the `.model`. Partial use does not work — leaving either of them in causes the conflict above.

Procedure (Maker Inspector):
1. Open the target `.model` in Maker and delete `AIChaseComponent` / `AIWanderComponent` from the Components panel.
2. Explicitly re-set `RigidbodyComponent.WalkSpeed` to the desired value (e.g. `1.4`) — prevents the `0.5` residue from the AIComponent's force-overwrite.
3. Save, then apply the change via MCP `refresh`.

If you want to keep only part of `AIChase`'s BT, you can leave the component but swap the BT root via `SetRootNode` to disable the default Stop/Chase behavior — but **removal is recommended**.

### 5e. Driving the state machine yourself (no AI component)

If you remove `AIChase`/`AIWander` and write your own controller, you have two sub-options for animation:

- **Sub-option A (Soldier — simplest, recommended).** Do **not** register `MOVE`/`ATTACK` on `StateComponent`, do **not** call `ChangeState("MOVE")` / `ChangeState("ATTACK")` at all. Track behavior in the script's own property (`CurrentAIState = "ROAM"/"STAND"/"SAY"/"ATTACK"`). Swap clips by assigning `self.Entity.SpriteRendererComponent.SpriteRUID = <ruid>` inside your `EnterState` method. Reserve `StateComponent` for `IDLE` ↔ `DEAD` only (handled by `script.Monster` on HP=0). This is what the working `SoldierAI` does — `StateComponent.IsLegacy` doesn't need to be set. Full source: §7b below.
- **Sub-option B (StateComponent + marker states).** Drive everything through `StateComponent` so `StateChangeEvent` fires and the ActionSheet pipeline picks the clip. `MOVE`/`ATTACK` are not registered by default (see [`animation-state.md` §1](animation-state.md) — `[LEA-3005]` otherwise), so register first with `AddState("MOVE", MarkerState)` / `AddState("ATTACK", MarkerState)` server-side. Requires `StateComponent.IsLegacy=false`. Use this when other code (other Components, event handlers, debugging logs) needs to read `CurrentStateName`.

Both still need explicit movement calls because `MovementComponent` does not touch StateComponent. Sub-option B skeleton:

```lua
@Component
script MyMonsterController extends AttackComponent

    property number attackTimer = 0
    property number AttackCooldown = 1.0
    property number facing = 1

    @ExecSpace("ServerOnly")
    method void OnBeginPlay()
        local sc = self.Entity.StateComponent
        sc:AddState("MOVE", MarkerState)
        sc:AddState("ATTACK", MarkerState)
        sc:ChangeState("IDLE")
    end

    @ExecSpace("ServerOnly")
    method void EnterMode(string m)
        local sc = self.Entity.StateComponent
        if sc.CurrentStateName == m then return end
        sc:ChangeState(m)   -- triggers StateChangeEvent → animation swap
    end

    @ExecSpace("ServerOnly")
    method void OnUpdate(number delta)
        local target = self:FindPlayerInRange()
        if isvalid(target) then
            self:EnterMode("ATTACK")
            self.attackTimer = self.attackTimer - delta
            if self.attackTimer <= 0 then
                self:DoAttackHitBox()
                self.attackTimer = self.AttackCooldown
            end
            return
        end

        if self:WantsToWalk() then
            self.Entity.MovementComponent:MoveToDirection(Vector2(self.facing, 0), delta)
            self:EnterMode("MOVE")
        else
            self.Entity.MovementComponent:Stop()
            self:EnterMode("IDLE")
        end
    end
end
```

Rules for Sub-option B:

- Every distinct behavior segment is a `StateComponent` state. Don't gate animation on a private `self.mode` string — that doesn't fire `StateChangeEvent`.
- After the attack window, transition out of `ATTACK` — otherwise the attack clip loops and the engine still considers the monster attacking. `script.MonsterAttack` handles this exit automatically; rolling your own means doing it by hand.
- For NPC-style "talk" idle variants, prefer adding a `SAY` custom state with its own `say` action key over re-mapping `stand` at runtime — see [`animation-state.md` §3](animation-state.md) for why mapping-only swaps don't replay.

## 6. Recommended Build Path

### 6a. Pattern A — start from Soldier (no AI component, script-driven)

Faithful to the proven working sample. Use this when behavior needs anything beyond AIChase's nearest-player chase.

```javascript
const { ModelBuilder, vector2, collisionGroup, actionSheet } = require("./scripts/model/msw_model_builder.cjs");

// No template — assemble from scratch with the 11-component Soldier layout.
const b = new ModelBuilder("Slime");

b.component("MOD.Core.TransformComponent")
  .component("MOD.Core.StateAnimationComponent")
  .component("MOD.Core.SpriteRendererComponent")
  .component("MOD.Core.RigidbodyComponent")           // MapleTile — swap per platform.md §4
  .component("MOD.Core.MovementComponent")
  .component("MOD.Core.StateComponent")               // IsLegacy left at default
  .component("MOD.Core.HitComponent")
  .component("MOD.Core.DamageSkinSpawnerComponent")
  .component("script.Monster")                         // HP/death/respawn
  .component("script.MyMonsterAI")                     // your SoldierAI-style controller
  .component("script.MyMonsterAttack");                // your SoldierAttack-style on-demand AttackComponent

b.value("SpriteRendererComponent", "SpriteRUID", standRuid, "string")
  .value("SpriteRendererComponent", "SortingLayer", "MapLayer0", "string")
  .value("SpriteRendererComponent", "OrderInLayer", 2, "int")
  // ActionSheet kept for parity with Soldier.model — bypassed at runtime.
  .value("StateAnimationComponent", "ActionSheet", actionSheet({
    stand: standRuid,
    move: moveRuid,
    attack: attackRuid,
    die: dieRuid,
  }), "action_sheet")
  .value("HitComponent", "BoxSize", vector2(0.67, 1.42), "vector2")
  .value("HitComponent", "ColliderOffset", vector2(-0.005, 0.71), "vector2")
  .value("HitComponent", "CollisionGroup", collisionGroup("8992acd1e8cd45838db6f10a7b41df09"), "collision_group")
  .value("HitComponent", "IsLegacy", false, "bool")
  .value("MovementComponent", "InputSpeed", 1.0, "float")
  .value("MovementComponent", "JumpForce", 6.0, "float")
  .value("script.Monster", "MaxHp", 100.0, "double")
  .value("script.Monster", "RespawnOn", false, "bool");

b.write("RootDesk/MyDesk/Models/Monsters/Slime.model");
```

The AI script holds the per-state RUIDs as its own properties and assigns them on transitions — see §7b. Do **not** add AIChase/AIWander alongside this — the built-in BT overwrites your velocity every frame (§5d).

### 6b. Pattern B — start from MonsterCanonical (AIChase + ActionSheet pipeline)

Use when AIChase's behavior matches your needs exactly. **`StateComponent.IsLegacy = false` is mandatory here.**

```javascript
const b = ModelBuilder.fromTemplate(
  "./skills/msw-general/models/MonsterCanonical.model",
  "Slime"
);

b.value("SpriteRendererComponent", "SpriteRUID", standRuid, "string")
  .value("SpriteRendererComponent", "SortingLayer", "MapLayer0", "string")
  .value("SpriteRendererComponent", "OrderInLayer", 2, "int")
  .value("StateAnimationComponent", "ActionSheet", actionSheet({
    stand: standRuid,
    move: moveRuid,
    attack: attackRuid,
    hit: hitRuid,
    die: dieRuid,
    jump: jumpRuid,
  }), "action_sheet")
  .value("HitComponent", "BoxSize", vector2(0.67, 1.42), "vector2")
  .value("HitComponent", "ColliderOffset", vector2(-0.005, 0.71), "vector2")
  .value("HitComponent", "CollisionGroup", collisionGroup("8992acd1e8cd45838db6f10a7b41df09"), "collision_group")
  .value("HitComponent", "IsLegacy", false, "bool")
  .value("AIChaseComponent", "IsLegacy", false, "bool")
  .value("StateComponent", "IsLegacy", false, "bool")   // mandatory for Pattern B — see animation-state.md §0
  .value("MovementComponent", "InputSpeed", 1.5, "float")
  .value("MovementComponent", "JumpForce", 6.0, "float")
  .value("script.Monster", "MaxHp", 500.0, "double");

b.write("RootDesk/MyDesk/Models/Monsters/Slime.model");
```

Omit any action key whose RUID is missing from the resource pack.

## 7. Canonical Pattern A Scripts (Soldier)

Three `.mlua` files cover HP / AI / attack, plus a fourth for spawning. Write each `.mlua` → Maker Refresh once → `.codeblock` is generated → then include in the `.model` (script-component lifecycle order — see §2 above). Full source for all four scripts (`Monster.mlua`, `SoldierAI.mlua`, `SoldierAttack.mlua`, `SoldierSpawner.mlua`) is inlined verbatim in §7a–§7d.

### 7a. `script.Monster` — HP / Death / Respawn (shared between Pattern A and B)

Uses `double` for HP (`@Sync property number` — `number` in mlua is double-precision; serialized as `System.Double`). Drives `ChangeState("DEAD")` and the `IsDead` sync flag; the AI script reads `IsDead` and plays the die clip itself.

```lua
@Component
script Monster extends Component

    @Sync property number MaxHp = 100
    @Sync property number Hp = 0
    @Sync property boolean RespawnOn = false
    @Sync @HideFromInspector property boolean IsDead = false
    @Sync property number RespawnDelay = 5
    @Sync property number DestroyDelay = 0.6
    property string DamageSkinRUID = "02c22d93421b4038b3c413b3e40b57ec"

    method void OnBeginPlay()
        self.Hp = self.MaxHp
        local skinSetting = self.Entity.DamageSkinSettingComponent
        if isvalid(skinSetting) then
            skinSetting.DamageSkinId = DataRef(self.DamageSkinRUID)   -- DataRef wrap is mandatory
        end
    end

    @ExecSpace("ServerOnly")
    method void Dead()
        self.IsDead = true
        local sc = self.Entity.StateComponent
        if sc then sc:ChangeState("DEAD") end
        local delayHide = function()
            self.Entity:SetVisible(false)
            self.Entity:SetEnable(false)
            if self.RespawnOn == false then self.Entity:Destroy() end
        end
        _TimerService:SetTimerOnce(delayHide, self.DestroyDelay)
    end

    @ExecSpace("ServerOnly")
    method void Respawn()
        self.IsDead = false
        self.Entity:SetVisible(true)
        self.Entity:SetEnable(true)
        self.Hp = self.MaxHp
        local sc = self.Entity.StateComponent
        if sc then sc:ChangeState("IDLE") end
    end

    @ExecSpace("ServerOnly")
    @EventSender("Self")
    handler HandleHitEvent(HitEvent event)
        local originalHp = self.Hp
        self.Hp = self.Hp - event.TotalDamage
        if self.Hp > 0 or originalHp <= 0 then return end
        self:Dead()
        if self.RespawnOn then
            _TimerService:SetTimerOnce(function() self:Respawn() end, self.RespawnDelay)
        end
    end

end
```

Notes:
- The `originalHp <= 0` guard on `HandleHitEvent` makes the handler idempotent — re-entering `Dead()` on an already-dead monster is suppressed.
- No manual `DisconnectEvent` in `OnEndPlay` — `@EventSender("Self")` handlers auto-disconnect with the Component.
- `DamageSkinSettingComponent` is optional; nil-check before assigning. `DamageSkinId` is a `DataRef`, not a string — wrap with `DataRef(...)`.
- Tune via builder values: `b.value("script.Monster", "MaxHp", 500.0, "double").value("script.Monster", "RespawnOn", true, "bool").value("script.Monster", "RespawnDelay", 5.0, "double")`.

### 7b. `script.SoldierAI` — Pattern A AI controller (no built-in AI component)

Owns its own state variable, swaps `SpriteRUID` per state, drives `MovementComponent`, gates `ATTACK` on range. Reads `script.Monster.IsDead` to play one die clip once.

Key shape (full source ≈200 lines):

```lua
@Component
script SoldierAI extends Component

    property string StandRUID = "..."
    property string MoveRUID  = "..."
    property string SayRUID   = "..."
    property string AttackRUID= "..."
    property string DieRUID   = "..."
    property string Die2RUID  = "..."          -- random pick on death

    property number AttackRange    = 1.0
    property number AttackCooldown = 1.0

    @HideFromInspector property string CurrentAIState = "ROAM"
    @HideFromInspector property number StateTimer    = 0
    @HideFromInspector property number MoveDirection = 1
    @HideFromInspector property number AttackTimer   = 0
    @HideFromInspector property boolean DeathPlayed  = false

    @ExecSpace("ServerOnly")
    method void OnBeginPlay()
        self:EnterState("ROAM")
    end

    @ExecSpace("ServerOnly")
    method void EnterState(string newState)
        self.CurrentAIState = newState
        local sprite = self.Entity.SpriteRendererComponent
        if newState == "ROAM" then
            -- random left/right for 2~4 sec
            self.MoveDirection = (_UtilLogic:RandomDouble() < 0.5) and -1 or 1
            self.StateTimer = 2 + _UtilLogic:RandomDouble() * 2
            if isvalid(sprite) then sprite.SpriteRUID = self.MoveRUID end
            -- Sprite faces left by default → moving right (+1) flips Scale.x negative
            local t = self.Entity.TransformComponent
            if isvalid(t) then
                local s = t.Scale
                t.Scale = Vector3(math.abs(s.x) * -self.MoveDirection, s.y, s.z)
            end
        elseif newState == "STAND" then
            self.StateTimer = 1 + _UtilLogic:RandomDouble() * 1.5
            if isvalid(sprite) then sprite.SpriteRUID = self.StandRUID end
            self:StopMovement()
        elseif newState == "SAY" then
            self.StateTimer = 1.5 + _UtilLogic:RandomDouble() * 1.5
            if isvalid(sprite) then sprite.SpriteRUID = self.SayRUID end
            self:StopMovement()
        elseif newState == "ATTACK" then
            self.StateTimer = 0.6
            if isvalid(sprite) then sprite.SpriteRUID = self.AttackRUID end
            self:StopMovement()
            local atk = self.Entity:GetComponent("script.SoldierAttack")
            if isvalid(atk) then atk:DoAttack() end
            self.AttackTimer = self.AttackCooldown
        end
    end

    @ExecSpace("ServerOnly")
    method Entity FindNearestPlayer()
        local map = self.Entity.CurrentMap
        if not isvalid(map) then return nil end
        local mapComp = map.MapComponent
        if not isvalid(mapComp) then return nil end
        local users = _UserService:GetUsersByMapComponent(mapComp)
        if users == nil then return nil end
        -- iterate, return nearest by squared distance
        ...
    end

    @ExecSpace("ServerOnly")
    method void OnUpdate(number delta)
        local monster = self.Entity.Monster
        if isvalid(monster) and monster.IsDead then
            if not self.DeathPlayed then
                self.DeathPlayed = true
                local sprite = self.Entity.SpriteRendererComponent
                if isvalid(sprite) then
                    sprite.SpriteRUID = (_UtilLogic:RandomDouble() < 0.5) and self.DieRUID or self.Die2RUID
                end
                self:StopMovement()
            end
            return
        end
        ...
        -- range check → EnterState("ATTACK"); ROAM timer expiry → PickIdleState()
    end

end
```

Notes:
- `self.Entity.Monster` reads the `script.Monster` Component instance directly via its name (works because scripts attached to the entity expose themselves under their class name).
- Facing direction is set via `TransformComponent.Scale.x` sign, **not** `SpriteRendererComponent.FlipX` — keeps the sprite and any per-entity colliders aligned.
- `_UserService:GetUsersByMapComponent(map.MapComponent)` is the canonical "find players on this map" call. Returns `nil` when no users.
- `script.SoldierAttack` is invoked **on demand** from `EnterState("ATTACK")` via `atk:DoAttack()`. This differs from `script.MonsterAttack` (which uses an `AttackInterval` timer to fire `AttackFast` periodically while alive).

### 7c. `script.SoldierAttack` — on-demand `AttackComponent` subclass

```lua
@Component
script SoldierAttack extends AttackComponent

    property number AttackDamage = 10
    @HideFromInspector property any Shape = nil

    @ExecSpace("ServerOnly")
    method void OnBeginPlay()
        self.Shape = BoxShape(Vector2.zero, Vector2(1.2, 1.2), 0)
    end

    @ExecSpace("ServerOnly")
    method void DoAttack()
        local transform = self.Entity.TransformComponent
        if not isvalid(transform) then return end
        local pos = transform.WorldPosition
        -- Scale.x negative = facing right (sprite default is left)
        local dir = (transform.Scale.x < 0) and 1 or -1
        self.Shape.Position = Vector2(pos.x + 0.4 * dir, pos.y + 0.5)
        self.Shape.Size = Vector2(1.2, 1.2)
        self.Shape.Angle = 0
        self:AttackFast(self.Shape, nil, CollisionGroups.Player)
    end

    method integer CalcDamage(Entity attacker, Entity defender, string attackInfo)
        return self.AttackDamage
    end

    method boolean IsAttackTarget(Entity defender, string attackInfo)
        if isvalid(defender.PlayerComponent) == false then return false end
        return __base:IsAttackTarget(defender, attackInfo)
    end

end
```

### 7d. Spawner (Pattern A — periodic spawn)

`_SpawnService:SpawnByModelId(modelId, name, position, parent)` — `parent` must not be `nil` (pass `self.Entity.CurrentMap`). Returns `nil` for a bad `modelId`; nil-check the return.

```lua
@Component
script SoldierSpawner extends Component

    property string ModelId       = "soldier"
    property number SpawnInterval = 3.0
    property number SpawnY        = 0.4       -- foothold + 0.4 lands cleanly on MapleTile
    property number MinX          = -6.0
    property number MaxX          = 6.0

    @HideFromInspector property integer SpawnIndex = 0
    @HideFromInspector property integer TimerId    = 0

    @ExecSpace("ServerOnly")
    method void OnBeginPlay()
        self.TimerId = _TimerService:SetTimerRepeat(function() self:SpawnOne() end, self.SpawnInterval)
    end

    @ExecSpace("ServerOnly")
    method void OnEndPlay()
        if self.TimerId ~= 0 then
            _TimerService:ClearTimer(self.TimerId)
            self.TimerId = 0
        end
    end

    @ExecSpace("ServerOnly")
    method void SpawnOne()
        local map = self.Entity.CurrentMap
        if not isvalid(map) then return end
        self.SpawnIndex = self.SpawnIndex + 1
        local x = self.MinX + _UtilLogic:RandomDouble() * (self.MaxX - self.MinX)
        local pos = Vector3(x, self.SpawnY, 0)
        local name = "Soldier_" .. tostring(self.SpawnIndex)
        local e = _SpawnService:SpawnByModelId(self.ModelId, name, pos, map)
        if e == nil then log_error("SpawnByModelId returned nil") end
    end

end
```

## 8. HP / Respawn flow

Custom HP logic must drive the state machine — when HP hits 0, call `StateComponent:ChangeState("DEAD")` so `die` plays, `DeadEvent` fires, and `IsAttackTarget` rejects further hits. The canonical implementation is `script.Monster` (§7a):

1. `HandleHitEvent` subtracts `event.TotalDamage` from `Hp` and guards against re-entry (`originalHp <= 0`).
2. On `Hp <= 0`, `Dead()` flips `IsDead = true`, calls `ChangeState("DEAD")`, then schedules `delayHide` after `DestroyDelay` (0.6s) — long enough for the `die` clip / Pattern A's direct SpriteRUID swap to play.
3. `delayHide` hides/destroys (or, if `RespawnOn`, only hides — the second timer calls `Respawn()` after `RespawnDelay`).
4. `Respawn()` re-enables visibility, restores `Hp`, and calls `ChangeState("IDLE")`.

If you skip default `script.Monster` and roll your own, mirror this flow — direct HP subtraction without `ChangeState("DEAD")` skips the damage skin / hit effect / `IsAttackTarget` immunity entirely (see [`msw-combat-system/SKILL.md`](../../msw-combat-system/SKILL.md) §2-3).

## 9. Spawn Position

For MapleTile, spawn above the foothold (`footholdY + 0.4`) so gravity lands the monster cleanly. Spawning below makes the monster fall forever and breaks AI. The canonical `SoldierSpawner` (§7d) uses `SpawnY = 0.4` for this reason.

Runtime: `_SpawnService:SpawnByModelId(modelEntryId, name, position, parent)`. `parent` must not be nil (pass `self.Entity.CurrentMap`); nil-check the return — a bad `modelEntryId` returns `nil` silently.

## 10. Speed / physics reference

Verified working baselines:

| Source | InputSpeed | JumpForce | Body | AI |
|--------|------------|-----------|------|----|
| `Soldier.model` (Pattern A) | `1.0` | `6.0` | `RigidbodyComponent` (defaults — `WalkSpeed` not set) | custom `script.SoldierAI` |
| `MonsterCanonical.model` (Pattern B) | `1.5` | `6.0` | `RigidbodyComponent` (defaults) | `AIChaseComponent` (BT force-overwrites `WalkSpeed=0.5` on FinishedConstruct) |

Aspirational ranges if you need to deviate (not measured against the canonicals):

| Monster type | InputSpeed | Notes |
|--------------|------------|-------|
| Slow field mob | 0.5~1.0 | AIWander or custom AI |
| Standard field mob | 1.0~1.5 | matches Soldier / MonsterCanonical |
| Fast / aggressive | 2.0~3.0 | watch foothold edge prediction |
| Flying | 1.0~2.0 | `Gravity = 0` on the Body |

Actual movement speed = `InputSpeed × WalkSpeed`. When `AIChaseComponent`/`AIWanderComponent` is present, **it pins `WalkSpeed=0.5` on FinishedConstruct** (§5d) — Pattern A avoids this because no AI component is attached. Per-map-type conversion → [`platform.md`](platform.md) §10.

## 11. Placement

After writing the model:

1. Maker `refresh`.
2. Place instances in `.map` via `modelId`; see [`entity.md`](entity.md).
3. Do not partially override a system model through a map `modelId` instance. Bake monster defaults into a dedicated `.model`.
4. For repeated monsters, all instances should share one model and only differ in transform/position.

## 12. Verification + checklist

1. `refresh` → check build logs; `play` → check runtime logs.
2. Walk the **state cycle** (see [`animation-state.md` §8](animation-state.md) for the generic checklist): spawn → `IDLE`/`stand`; move → `MOVE`/`move`; hit → `HIT`/`hit` + damage skin → auto-return `IDLE` ~0.5s; HP=0 → `DEAD`/`die` + no further hits, respawn (if enabled).
3. If animation looks stuck, log `CurrentStateName` per frame — distinguishes "state didn't change" from "ActionSheet key wrong".
4. `stop` before further file changes.

### Checklist (both patterns)

- [ ] Body matches the TileMapMode (MapleTile=Rigidbody, RectTile=Kinematic, SideViewRectTile=Sideview)
- [ ] `SpriteRUID` set (stand clip RUID)
- [ ] `HitComponent.IsLegacy = false`, `CollisionGroup.Id = "8992acd1e8cd45838db6f10a7b41df09"` (UUID, **not** `"MOD@HitBox"`)
- [ ] `HitComponent.BoxSize`/`ColliderOffset` derived from sprite bounds (canonical: `(0.67, 1.42)`/`(-0.005, 0.71)`)
- [ ] `DamageSkinSpawnerComponent` included (auto damage-number display)
- [ ] Custom scripts (`.mlua`) are included in `.model` only **after** one Maker Refresh has generated their `.codeblock`
- [ ] `script.Monster` with `MaxHp` (double) / `RespawnOn` / `IsDead` set

### Pattern A (Soldier — recommended)

- [ ] **No** `AIChaseComponent`/`AIWanderComponent` on the model
- [ ] Custom AI script attached (`script.MyMonsterAI` style), holds per-state RUIDs and sets `SpriteRendererComponent.SpriteRUID` on every transition
- [ ] `StateComponent.IsLegacy` left at the default (not set) — animation is not driven by the pipeline
- [ ] ActionSheet filled with `stand`/`move`/`attack`/`die` for parity (bypassed at runtime)

### Pattern B (MonsterCanonical)

- [ ] Exactly one AI component (`AIChase` **or** `AIWander`, never both); `IsLegacy = false`
- [ ] `StateComponent.IsLegacy = false` — **mandatory**, otherwise the pipeline silently does nothing
- [ ] ActionSheet maps every key whose state will be entered (`stand` always; `move` if monster moves; `die` for visible death; `hit`/`attack`/`jump` as needed)

## 13. Cross-References

| Doc | Why |
|---|---|
| [animation-state.md](animation-state.md) | StateComponent, StateType, ActionSheet, `[LEA-3005]`, `SetActionSheet` vs `ChangeState`, monster/NPC/player differences — read first for any state/animation issue |
| [model.md](model.md) | Builder-only `.model` authoring rules and API |
| [entity.md](entity.md) | Placing a monster in a `.map` |
| [builder-protocol-map.md §1](builder-protocol-map.md) + [builder-protocol.md §4](builder-protocol.md) | Builder-first `.map` inspection + ModelBuilder → MapBuilder placement cross-flow |
| [platform-maple.md](platform-maple.md) | MapleTile physics, `PredictFootholdEnd`, foothold AI patterns |
| [platform.md](platform.md) §4 | TileMapMode ↔ Body mapping, LEA-3004 |
| [troubleshooting.md](troubleshooting.md) | Symptom → cause → fix reference |
| [`msw-combat-system/SKILL.md`](../../msw-combat-system/SKILL.md) | Attack/Hit pipeline, damage model, FSM/BT AI patterns, damage skin, hit effect |
| `msw-search` | Animation packs (`categories: ["mob","npc"]`) |
| `msw-scripting` | Custom monster behaviors (`script.Monster`, `StateType`, `HitEvent`/`StateChangeEvent`/`DeadEvent` handlers) |
| `mlua_api_retriever` MCP | Runtime API for `AIChaseComponent`/`AIWanderComponent`/`AIComponent`/`HitComponent` (state/animation APIs covered in `animation-state.md` §9) |
| [`../models/MonsterCanonical.model`](../models/MonsterCanonical.model) | Pattern B verbatim copy source (paste, then swap RUIDs) |
| Soldier reference (this file, §7a–§7d) | Pattern A verified canonical — full source for `Monster.mlua` + `SoldierAI.mlua` + `SoldierAttack.mlua` + `SoldierSpawner.mlua` inlined; `.model` composition in §2 + §6a |
