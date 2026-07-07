---
name: msw-combat-system
description: "MSW combat system integration guide. Covers the Attack→Hit pipeline, damage model, i-frame, knockback, Hit Stop, Camera Shake, Sprite Flash, SFX, death/revive, damage skin, hit effect, avatar combat motion, custom events, and AI FSM — all based on MSW native APIs for 2D multi-genre coverage. Keywords: attack, hit, damage, combat, monster, hit effect, critical, projectile, damage skin, knockback, hit stop, combo, HP bar, collision, contact hit, TriggerComponent."
---

# msw-combat-system

The full MSW combat pipeline. Covers only items in the common 2D combat layer that have **MSW native API support**, regardless of genre. Excludes formulas/theory. API signatures are based on `Environment/NativeScripts/**/*.d.mlua`.

---

## 0. Coverage matrix

| # | Layer | Native | Custom required |
|---|-------|--------|-----------------|
| 1 | Attack Resolution | `AttackComponent` + `HitComponent` (Box/Circle/Polygon) | Capsule/Cone/Ray, pierce count |
| 2 | Damage Model | `CalcDamage`/`CalcCritical`/`GetCriticalDamageRate`/`GetDisplayHitCount` hooks + `HitEvent.Extra:any` | Element affinity, composite formulas |
| 3 | Hit Reaction | Per-Body knockback API, `IsHitTarget`-based i-frame | Stagger level, status effects |
| 4 | Game Feel | **All 6 native** (Hit Stop, Shake, Zoom, Flash, VFX, SFX) | — |
| 5 | Combat State | `StateComponent` + `DeadEvent`/`ReviveEvent`, `PlayerComponent` HP/revive | MP/Stamina/Rage, aggro |
| 6 | Event Bus | `HitEvent`/`AttackEvent`/`StateChangeEvent`/`PlayerActionEvent` + custom `@Event` | OnKill/OnBlocked |
| 7 | AI | `StateComponent` (FSM) + `AIComponent` (BT, 4 Composite types native) + `AIChaseComponent`/`AIWanderComponent`, `_UserService.UserEntities` | Decorator/Memory(Blackboard), Threat Table |
| + | Damage Skin | 3 `DamageSkin*` components + `DamageSkinService` | — |
| + | Hit Effect | `HitEffectSpawnerComponent` (auto) | — |
| + | Avatar Motion | `AvatarStateAnimationComponent` (State→MapleAvatarBodyActionState) | — |

---

## 0.5 References — where to go

This SKILL.md covers only the **system flow and native API surface**. Actual model JSON, full script code, and variation patterns are in the references/* files below — Read them directly.

| File | Scope | When to read |
|------|-------|--------------|
| [`../msw-general/references/monster.md`](../msw-general/references/monster.md) | Monster `.model` component assembly + ActionSheet + AI choice + canonical Pattern A scripts (Soldier-style) + HP/Respawn + spawn + verification | When building a combat-capable monster |
| [`references/hp-gauge.md`](references/hp-gauge.md) | Full implementation of an overhead HP bar based on `PixelRendererComponent` | When attaching an overhead HP bar |
| [`references/projectile.md`](references/projectile.md) | Projectile (Body-less entity + `OnUpdate Translate`) + homing/pierce/splash variants | When building ranged attacks like arrows, bullets, magic bolts |
| [`references/ai-bt.md`](references/ai-bt.md) | BehaviourTree — `AIComponent` + 4 Composite types + `@BTNode` + custom Decorator/Memory/Threat | When you need BT-based monster/boss AI and multi-layer decision making |

> Priority: **this SKILL.md (concepts + API tables) → the relevant references/* (full implementation)**.

---

## 1. Attack Resolution

### 1-1. Shape & Attack trigger

`HitComponent.ColliderType` supports only **Box / Circle / Polygon**. Other shapes must be approximated by composition.

```
AttackComponent:
  Attack(Vector2 size, Vector2 offset, string attackInfo, CollisionGroup? cg)    → table<Component>
  Attack(Shape shape, string attackInfo, CollisionGroup? cg)                     → table<Component>
  AttackFast(Shape shape, string attackInfo, CollisionGroup? cg)                 → void   (for mass resolution, bullet hell)
  AttackFrom(Vector2 size, Vector2 position, string attackInfo, CollisionGroup? cg) → table<Component>
  emitter EmitAttackEvent(AttackEvent)
```

- Shapes: `CircleShape(position, radius)` / `BoxShape(position, size, angle)` / `PolygonShape(position, points, angle)`. For an axis-aligned rectangle, use `BoxShape(center, size, 0)` — there is no `RectangleShape` type. Pass `angle = 0` to `BoxShape` / `PolygonShape` when no rotation is needed.
- Polygon hit surface: `HitComponent.PolygonPoints: SyncList<Vector2>`
- `AttackFast` does not build a hit table → better performance for bullet hell / mass resolution

### 1-2. Target filter

| Side | Override | Purpose |
|------|----------|---------|
| Attacker | `AttackComponent:IsAttackTarget(defender, attackInfo) → boolean` | Faction / distance / state |
| Defender | `HitComponent:IsHitTarget(attackInfo) → boolean` | Invincibility / immunity |

If either returns false → the hit is excluded. The super call is **`__base:IsAttackTarget(...)`** (mlua-specific).

> ⚠ **Do not add `@ExecSpace` when overriding** — both `IsAttackTarget` and `IsHitTarget` have an unspecified ExecSpace (=All) on the parent. Adding an annotation like `@ExecSpace("ServerOnly")` in the child triggers **LEA-3014 `SignatureMismatch`** at runtime. Even without the annotation, the call path runs through the server-side hit pipeline, so actual execution happens on the server. Details: [`msw-scripting/SKILL.md` §9 "Method override"](../msw-scripting/SKILL.md).

- `HitComponent.CollisionGroup` defaults to `CollisionGroups.HitBox`. The last argument of `Attack(..., cg)` specifies the target group.
- **Duplicate-hit prevention / pierce / max hits**: not native. Manage in script via the table returned by `Attack` + a `table<Entity, boolean>` cache.

### 1-3. `attackInfo` tagging

A string extension point that propagates into `CalcDamage`/`IsHitTarget`/`GetDisplayHitCount`. Value conventions are up to the project. A namespace style such as `"melee.light"`, `"dot.poison"` is recommended.

### 1-4. ⚠️ IsLegacy

`ColliderType`/`ColliderOffset`/`PolygonPoints` are only valid when `HitComponent.IsLegacy = false`. `BoxOffset`/`ColliderName` are deprecated.

### 1-5. Shape mapping per attack form

| Form | Shape construction |
|------|--------------------|
| Frontal melee Box | `BoxShape(pos + LookDirectionX*offset, size, 0)` — see DefaultPlayer `PlayerAttack` |
| Circular AoE | `CircleShape(self.WorldPos, radius)` |
| Projectile | Spawn a **Body-less model** (Sprite+Transform only) + in `OnUpdate(delta)` call `TransformComponent:Translate(speed*delta, 0)` + distance-based hit check + `_EntityService:Destroy`. Movement rules in §1-6, **full implementation → [`references/projectile.md`](references/projectile.md)** |

**There is no MSW-specific projectile system** — implemented as an entity + `AttackComponent` combo.

### 1-6. Continuous movement — common rules for projectiles, monsters, and AI

Continuous movement (chase, flight, auto-move) is **per-frame `OnUpdate(delta)`-based**. Moving via a timer (`SetTimerRepeat(0.1~0.15s)`) produces 6~10Hz teleportation that looks choppy.

#### Recommended API per target

| Target | Body? | Movement API | Rationale |
|--------|:-----:|--------------|-----------|
| **Monster / NPC / AI** | **Yes** (map-type Body + `MovementComponent`) | `MovementComponent:MoveToDirection(dir, 0)` + `MovementComponent.InputSpeed` | `MovementComponent.d.mlua:1` — controls all three of Rigid/Kinematic/Sideview. `InputSpeed` belongs to MovementComponent (`.d.mlua:7`), so it is **not Player-only**. The second arg `0` — deltaTime is **applied only on ladders** (`.d.mlua:32`). Official BT examples `ActionFollow`/`ActionMoveRandom` also use `0`. |
| **Projectile / gem / drop item / effect** | **No** (Sprite+Transform+Trigger) | `self.Entity.TransformComponent:Translate(speed*delta, 0)` every frame | Direct Transform manipulation is safe without a Body. The pattern from the official "Create a Long-Range Projectile" tutorial. |
| **Direct Rigidbody control** (advanced) | Yes | `body:AddForce(...)` — sustained acceleration / impulse | `RigidbodyComponent.d.mlua:71` — `MoveVelocity` is "mainly controlled by MovementComponent", so prefer routing through MovementComponent instead of writing it directly. |

> For the actual velocity conversion of `MovementComponent.InputSpeed` per map type, see [`msw-general/references/platform.md` §10](../msw-general/references/platform.md) (MapleTile=×1, RectTile=÷1.2, SideView=×1.5).

#### Forbidden patterns

| ❌ | Reason |
|---|--------|
| `_TimerService:SetTimerRepeat(move, 0.1~0.15)` for movement | 6~10Hz teleport, no frame interpolation → jerky |
| `body:SetPosition(...)` / `MovementComponent:SetPosition(...)` inside `OnUpdate` | **Both are teleport methods** (`MovementComponent.d.mlua:37`, `SetPosition` on each Body's `.d.mlua`). Using them for continuous movement is choppy. Use only for one-shot spawn/respawn/snap. |
| `self.Entity.TransformComponent.Position = newPos` (entity with active Body) | The physics engine overwrites it next frame and network sync is blocked. |
| Constant-step move without delta, e.g. `Translate(0.009, 0)` | Frame-rate dependent. Speed differs between 60FPS and 30FPS. |

#### ⚠ Be cautious with the official msw-search antipattern

`mlua_Document_Retriever` returns a high-scoring "**Entity Movement Control Using MovementComponent**" document, but the body is an **antipattern** that moves every frame inside `OnUpdate` with `MovementComponent:SetPosition(...)` — **ignore that document** and use `MoveToDirection` / `Translate` from the table above. `FlappyFish Remake`, `Stopping the Taxi`, and `Making a Moving Foothold` also show missing-delta or direct-`Position` assignment, so be careful when referring to them.

#### MovementComponent attachment — monsters / NPCs

**Not included in the monster model by default.** The `.model` must contain all of the following components.

| Component | Notes |
|-----------|-------|
| `MOD.Core.TransformComponent` | Default |
| `MOD.Core.SpriteRendererComponent` | Renderer |
| Body (map type) | `RigidbodyComponent`(MapleTile) / `KinematicbodyComponent`(RectTile) / `SideviewbodyComponent`(SideViewRectTile) |
| `MOD.Core.MovementComponent` | E.g. `InputSpeed = 2.0` — required for movement APIs |

#### Cross references

- **Knockback (1-shot impulse)** is not continuous movement, so use §3-1 directly.
- Body selection per map type / InputSpeed conversion: [`msw-general/references/platform.md` §4·§10](../msw-general/references/platform.md)

---

## 1-7. Collision-based hit — pick the detection method (do not hand-roll distance)

When the request is "collision / contact-based hit" (player↔monster touch damage, hazard zone, trap, overlap), pick by intent. **Per-frame distance math is not the default** — reaching for it when the design asked for collider-based contact is the most common requester↔implementer mismatch.

| Intent | Detection | Why |
|--------|-----------|-----|
| Active attack swing / hitbox / projectile burst | `AttackComponent:Attack`/`AttackFast`/`AttackFrom` → resolves against defender `HitComponent`, emits `HitEvent` | Full pipeline: damage skin, hit effect, `IsHitTarget` i-frame, `OnHit` |
| Body-to-body contact / zone / trap overlap, targets arbitrary or many | `TriggerComponent` + `OnEnterTriggerBody`/`OnStayTriggerBody`/`OnLeaveTriggerBody` (or `TriggerEnter/Stay/LeaveEvent`) + `CollisionGroup` filter, then route damage through the `HitEvent` pipeline | Engine-side overlap: honors real collider shape (Box/Circle/Polygon), `ColliderOffset`, and group filtering |
| Homing / single already-known target | Per-frame `OnUpdate` distance check ([`references/projectile.md`](references/projectile.md)) | Justified only when exactly one target entity is known up front |

- ❌ Per-frame `math.sqrt(dx*dx+dy*dy) < r` for player↔monster or multi-target collision: it silently approximates one circle centered on the transform (ignores each collider's shape / size / `ColliderOffset`), skips `CollisionGroup` filtering, and costs O(attackers × targets) every frame. "Collision-based hit" means native colliders, not distance polling.
- `CollisionGroup` defaults to `CollisionGroups.TriggerBox`. `OnStayTriggerBody` fires **every frame** while overlapping — gate damage with a cooldown, don't apply per tick.
- Detection ≠ damage application: after a native overlap fires, still deal damage through `HitEvent` / `AttackComponent` — never subtract HP directly.

---

## 2. Damage Model

```
AttackComponent:
  method integer CalcDamage(attacker, defender, attackInfo)        -- default 1     (ExecSpace=All)
  method boolean CalcCritical(attacker, defender, attackInfo)      -- default false (ExecSpace=All)
  method float   GetCriticalDamageRate()                           -- default 2.0   (ExecSpace=All)
  method int32   GetDisplayHitCount(attackInfo)                    -- default 1     (ExecSpace=All)
  method void    OnAttack(defender)                                                 -- (ExecSpace=All)

HitComponent:
  method void OnHit(Entity attacker, integer damage, boolean isCritical, string attackInfo, int32 hitCount)
  emitter EmitHitEvent(HitEvent)
```

> ⚠ All hooks above have an unspecified ExecSpace (=All) on the parent. Adding `@ExecSpace("ServerOnly")` etc. when overriding triggers **LEA-3014 `SignatureMismatch`**. Drop the annotation and declare just `method ...`. Details: [`msw-scripting/SKILL.md` §9 "Method override"](../msw-scripting/SKILL.md).

### 2-1. `HitEvent` payload

```
AttackCenter:   Vector2
AttackerEntity: Entity (nilable)
Damages:        List<integer>    -- multi-hit split
Extra:          any              -- ★ extension slot (knockback/stun/element/tags)
IsCritical:     boolean
TotalDamage:    integer
FeedbackAction: HitFeedbackAction  -- ⚠ entire enum deprecated
```

Carry auxiliary info (knockback vector, stagger time, element) on the `Extra` table.

### 2-2. `AttackEvent` payload

A single field, `DefenderEntity: Entity`. The attacker is the handler's `self`.

### 2-3. ⚠️ Antipattern: direct HP subtraction — do not bypass `HitEvent`

Subtracting the defender's HP directly, such as `monster.Hp -= damage` / `target.MonsterAI.HP -= damage`, **does not emit `HitEvent`** — damage skin, hit effect, `IsHitTarget` immunity, and `OnHit` overrides all silently skip.

For **player-side** custom damage (channel / aura / DoT), the bypass also breaks avatar animation: `AvatarStateAnimationComponent` only reacts to `StateChangeEvent`, so the player avatar stays in idle even though the HP bar drops. If you must apply damage without `HitEvent`, also manually call `StateComponent:ChangeState("HIT")` (UPPERCASE key — see §10) and, for death/revive, `PlayerComponent:ProcessDead()` / `ProcessRevive()`. Otherwise hit/dead motions silently miss with no error.

---

## 3. Hit Reaction

### 3-1. Knockback — API per Body

| Body (map type) | Implementation |
|---|---|
| **Rigidbody** (MapleTile) | `body:AddForce(Vector2(dir*5, 3))` ★recommended · `SetForce` · `JustJump(Vector2(0, 4))` (vertical) |
| **Kinematicbody** (RectTile / top-down) | `body.MoveVelocity = Vector2(dir*5, 0)` — no AddForce |
| **Sideviewbody** (SideViewRectTile) | `body.MoveVelocity` + `body.JumpSpeed` |

- Rigidbody is auto-damped by the engine. Kinematic/Sideview must be damped manually inside `OnUpdate` (`MoveVelocity *= 0.9`).
- Wall bounce: subscribe to `FootholdCollisionEvent` and flip the velocity.
- Knockback is a **1-shot impulse** — do not confuse it with continuous movement (chase, flight). For continuous movement see §1-6.
- **⚠ Forbidden**: assigning `TransformComponent.Position` directly on an entity with an active Body → network sync is blocked. `body:SetPosition(...)` is a teleport method, so do not call it inside an `OnUpdate` loop (§1-6).

### 3-2. i-frame

Standard pattern: deadline check based on `_UtilLogic.ElapsedSeconds` + returning false from `HitComponent:IsHitTarget`. The DefaultPlayer default `PlayerHit.mlua` provides this pattern as-is (§9-4).

Alternative: while invincible, swap `HitComponent.CollisionGroup` to a separate group → the resolution itself is excluded. This is better for frame-accurate precision.

### 3-3. Status effects (Buff/Debuff)

**No native support.** Implement a `@Component BuffComponent` directly + tick with `_TimerService:SetTimerRepeat` + broadcast custom `StatusAppliedEvent`/`StatusExpiredEvent`.

For a single simple stun, `StateComponent:ChangeState("STUN")` + input/AI block flags is enough.

---

## 4. Game Feel — all native

| Element | API | ExecSpace |
|---------|-----|-----------|
| Hit Stop (global) | `_UtilLogic:SetClientTimeScale(float)` — 0~100 | ClientOnly |
| Hit Stop (individual) | `renderer.PlayRate = 0` (Sprite/Skeleton/Avatar) | @Sync |
| Slow Motion | `_UtilLogic:SetClientTimeScale(0.3)` + timer to restore | ClientOnly |
| Camera Shake | `cameraComp:ShakeCamera(intensity, duration, targetUserId?)` | Client |
| Camera Zoom | `cameraComp:SetZoomTo(percent, duration, targetUserId?)` · requires `IsAllowZoomInOut=true` first | Client |
| Hit Flash | `spriteRenderer.Color = Color(r,g,b,a)` → timer to restore | @Sync |
| Color HDR overbright | `Color.HSVToRGB(h, s, v, hdr=true)` — values > 1.0 allowed | — |
| VFX fixed | `_EffectService:PlayEffect(clipRUID, instigator, pos, zRot, scale, isLoop?, options?)` → serial | — |
| VFX attached | `_EffectService:PlayEffectAttached(clipRUID, parent, localPos, localZRot, localScale, isLoop?, options?)` | — |
| VFX remove | `_EffectService:RemoveEffect(serial)` | — |
| SFX 2D | `_SoundService:PlaySound(id, volume, targetUserId?)` | Client |
| SFX 3D | `_SoundService:PlaySoundAtPos(id, pos, listener, volume)` | Client |
| SFX loop | `PlayLoopSound` / `PlayLoopSoundAtPos` | Client |
| SFX attached | `SoundComponent:Play()` · pitch randomization via `Pitch` 0~3 | Client |
| BGM | `_SoundService:PlayBGM(id, volume)` / `StopBGM(immediately)` | Client |
| Preload | `_SoundService:LoadSound(id)` | ClientOnly |

`PlayEffect` options keys: `FlipX, FlipY, SortingLayer, OrderInLayer, Alpha, StartFrameIndex, EndFrameIndex, PlayRate, SyncFlip, Color, MaterialID, IgnoreMapLayerCheck, LitMode`

Get the current camera: `_CameraService:GetCurrentCameraComponent()`.

### ParticleService — built-in particles

General-purpose particle effects driven by enum values only, no RUID. 3 categories:

```
-- BasicParticle: general-purpose presets (no RUID needed)
integer _ParticleService:PlayBasicParticle(BasicParticleType, Entity instigator, Vector3 pos, number zRot, Vector3 scale, boolean isLoop, Dictionary options)
integer _ParticleService:PlayBasicParticleAttached(BasicParticleType, Entity parent, Vector3 localPos, number localZRot, Vector3 localScale, boolean isLoop, Dictionary options)

-- SpriteParticle: custom sprite as a particle (spriteRUID required)
integer _ParticleService:PlaySpriteParticle(SpriteParticleType, string spriteRUID, Entity instigator, Vector3 pos, number zRot, Vector3 scale, boolean isLoop, Dictionary options)
integer _ParticleService:PlaySpriteParticleAttached(SpriteParticleType, string spriteRUID, Entity parent, Vector3 localPos, number localZRot, Vector3 localScale, boolean isLoop, Dictionary options)

-- AreaParticle: environmental particles over a wide area (areaSize added)
integer _ParticleService:PlayAreaParticle(AreaParticleType, Vector2 areaSize, Entity instigator, Vector3 pos, number zRot, Vector3 scale, boolean isLoop, Dictionary options)

void _ParticleService:RemoveParticle(integer serial)
```

options keys: `Color, SortingLayer, OrderInLayer, ParticleSize, ParticleCount`

Looping particles (`isLoop=true`) must be cleaned up via `RemoveParticle(serial)`. Store the serial in `self._T` so it can be removed later.

#### Full BasicParticleType list

| Family | Name | Description |
|--------|------|-------------|
| Explosion/impact | `SparkExplosion` | Sparks (one-shot) — general-purpose hit |
| | `SparkLoop` | Continuous sparks |
| | `SparkRadialExplosion` | Sparks scattering radially |
| | `SmallExplosion` | Small explosion + smoke |
| | `BigExplosion` | Big explosion + smoke |
| | `TinyExplosion` | Very small explosion (Color option ignored) |
| | `DustExplosion` | Circular shockwave + smoke (Color option ignored) |
| | `EnergyExplosion` | Circular shockwave then center convergence |
| | `CircleBurst` | Circular light burst |
| | `PillarBurst` | Circular light burst + directional light |
| Fire/flame | `FireField` | Cartoon flames |
| | `FireFieldIntense` | Intense cartoon flames |
| | `FireBall` | Flame at a single point |
| | `FlameThrower` | Flamethrower stream |
| | `LargeFlames` | Large flames from the floor |
| | `MediumFlames` | Medium flames from the floor |
| | `TinyFlames` | Tiny flames from the floor |
| | `WildFire` | Giant pillar of flame (Color option ignored) |
| Lightning/electric | `LightningOrbSharp` | Spherical electric particles |
| | `LightningStrikeSharp` | Lightning bolt |
| | `LightningStrikeSharpTall` | Tall lightning bolt |
| | `LightningOrbSoft` | Electric wave emission |
| | `LightningBlast` | Periodic electric waves |
| | `LightningStrike` | Periodic lightning |
| | `LightningStrikeTall` | Periodic tall lightning |
| Buff/magic | `Aura` | Aurora light from the floor |
| | `Buff` | Strong light rising from the floor |
| | `Charge` | Large particles converging on one point |
| | `ChargeOrb` | Particles converging on one point |
| | `Enchant` | Large light with light/particles around it |
| | `SpinField` | Particles around a rotating circle |
| | `StarVortex` | Starlight converging to the center |
| | `Nova` | Wide circular wave |
| | `UpperCylinder` | Rising pillar from the floor |
| Misc | `Firework` | Fireworks |
| | `FireworkCluster` | Multiple fireworks at once |
| | `FireFlies` | Fireflies |
| | `GoopSpray` | Liquid spray to the side |
| | `GoopSprayEffect` | Liquid spray downwards |
| | `DustStorm` | Wide dust storm |
| | `RisingSteam` | Rising white mist from the floor |
| | `BigSplash` | Large water splash |
| | `Shower` | Water poured on one spot |

#### Full SpriteParticleType list (8)

| Name | Description |
|------|-------------|
| `BurstBig` | Sprite emerges in a radial pattern |
| `SpawnField` | Particles + sprite emerge in a circular area |
| `BurstNova` | Particles + sprite burst in a circular pattern |
| `SimpleSpawn` | Simple particle + sprite appearance |
| `Burst` | Particles + sprite scatter |
| `Stream` | Generated while moving in a specific direction |
| `StreamSharp` | Thin line moving in a specific direction |
| `AdditiveColor` | Color effect applied to the sprite |

#### Full AreaParticleType list (12)

| Name | Description |
|------|-------------|
| `Rain` | Rain |
| `Snow` | Snow |
| `FogCalm` | Fog |
| `FogHeavy` | Heavy descending fog |
| `FogLively` | Rising fog |
| `CalmStarField` | Rising star cluster |
| `StarFieldSimple` | Twinkling star cluster |
| `StarFog` | Star + nebula particles (stationary) |
| `StarFogFlow` | Star + nebula particles (rising) |
| `Windlines` | Thin lines |
| `WindlinesBig` | Thin lines + thick lines |
| `WindlinesSpeedy` | Fast straight lines |

### Choosing between EffectService and ParticleService

| Situation | Recommended |
|-----------|-------------|
| MapleStory skill / hit animations (specific imagery) | `EffectService` (specify RUID) |
| General hit/explosion (fast to implement) | `ParticleService.BasicParticle` |
| Scatter a custom image as particles | `ParticleService.SpriteParticle` |
| Environmental ambience like rain/snow/fog | `ParticleService.AreaParticle` |
| Sustained effects like buff auras | Either with `isLoop=true` |
| Rich, layered effects | Combine EffectService and ParticleService |

> Standard pattern for server event → client effect: `@Sync` property change → detected in `OnSyncProperty(ClientOnly)` → call EffectService/ParticleService.

---

## 5. Death / Revive

| Event | Emission condition | Payload |
|-------|--------------------|---------|
| `DeadEvent` | Auto on `StateComponent:ChangeState("DEAD")` | **none** |
| `ReviveEvent` | Auto on `PlayerComponent:Respawn()` (players only) | **none** |
| `StateChangeEvent` | Auto on every state transition | `CurrentStateName`, `PrevStateName` |

**Tracking the killer**: DeadEvent has no payload → cache `self.LastAttacker = event.AttackerEntity` in `HandleHitEvent` and use it in `HandleDeadEvent`.

For player-specific death/revive, prefer §9-1 `PlayerComponent.Respawn/ProcessDead/ProcessRevive`.

---

## 6. Event Bus

| Logical event | MSW implementation |
|---------------|--------------------|
| OnAttackStart | `OnAttack` hook or custom `AttackStartEvent` |
| OnAttackHit / OnDamageTaken | Native `HitEvent` |
| OnAttackMiss | Custom — SendEvent when `IsAttackTarget` returns false |
| OnCriticalHit | Covered by the `HitEvent.IsCritical` flag |
| OnDeath / OnRevive | Native `DeadEvent`/`ReviveEvent` |
| OnStateChange | Native `StateChangeEvent` |
| OnKill / OnBlocked / OnParry / OnStatusApplied | Custom `@Event` |

### 6-1. Custom event rules

- Definition: `@Event script XxxEvent extends EventType` + `property` declarations
- Receiving: the `handler` keyword (not method), `@EventSender("Self" | "Service","XxxService" | "Logic","XxxLogic")`
- Connect/disconnect: `entity:ConnectEvent(XxxEvent, self.Handler)` / **call `DisconnectEvent` in `OnEndPlay`** (the engine does not auto-disconnect)
- Global: `@Logic CombatEventBusLogic` singleton + `@EventSender("Logic","CombatEventBusLogic")`

---

## 7. AI — FSM(StateComponent) + BT(AIComponent) + custom-script (Pattern A), all native-compatible

| Pattern | Fit | Reference |
|---------|-----|-----------|
| **FSM** (`StateComponent` + `@State`) | Simple enemies (3~5 states), player IDLE/HIT/DEAD, boss phases, animation sync (`AvatarStateAnimationComponent` auto mapping §10). Requires `StateComponent.IsLegacy=false` if you want `StateAnimationComponent` to auto-swap clips. | **[`../msw-general/references/animation-state.md`](../msw-general/references/animation-state.md)** (state-machine + animation pipeline unified) |
| **BT** (`AIComponent` + 4 Composite types + `@BTNode`) | Patrol + chase + attack combos, varied boss patterns, Composite/Decorator reuse, probability-weighted actions. Requires `StateComponent.IsLegacy=false`. | **[`references/ai-bt.md`](references/ai-bt.md)** |
| **Custom script with self-state** (`@Component` holding `CurrentAIState` plus direct `SpriteRUID` assignment — Soldier-style pattern) | Behaviors that don't fit `AIChase`/`AIWander` (roam ↔ stand ↔ say ↔ attack, range-gated attacks, talking idle). **No `AIChaseComponent`/`AIWanderComponent`, no `IsLegacy=false` needed** — the script bypasses the ActionSheet pipeline. Reserve `StateComponent` for `IDLE` ↔ `DEAD` only. | [`../msw-general/references/monster.md` §7 "Canonical Pattern A Scripts (Soldier)"](../msw-general/references/monster.md) |

### 7-1. FSM — `StateComponent` (summary)

`StateComponent` + `@State script XxxStateType extends StateType` (lifecycle `OnEnter`/`OnUpdate`/`OnExit`/`OnConditionCheck`). The only auto-registered states are `IDLE`/`DEAD` (+ `HIT` if a `HitComponent` exists, `MOVE` if an `AIChase`/`AIWander` exists) — `ATTACK`/`PATROL`/`STUN`/`PHASE2` etc. must all be pre-registered via `AddState("name", XxxStateType)` in `OnBeginPlay`. Auto transitions use `AddCondition(from, to)` + per-frame `OnConditionCheck()`.

> ⚠ **State names must be UPPERCASE**; unregistered names immediately produce `[LEA-3005] InvalidArgument : 'stateName'`. Registering a key in `AvatarStateAnimationComponent.StateToAvatarBodyActionSheet` does **not** auto-register it in `StateComponent` — the two are separate.

**Full implementation → [`../msw-general/references/animation-state.md`](../msw-general/references/animation-state.md)** (FSM authoring, `ChangeState` failure matrix, standard `PATROL/CHASE/ATTACK/HIT/DEAD` monster pattern, and the state→animation pipeline live together — the two are the same underlying system viewed from two angles)

### 7-2. BT — `AIComponent` (summary)

`AIComponent` + `SequenceNode`/`SelectorNode`/`RandomSelectorNode`/`ParallelNode` + `@BTNode` Action Nodes + native `AIChaseComponent`/`AIWanderComponent`. **All 4 Composite types are native**; Decorator/Memory(Blackboard)/Threat Table must be implemented by hand.

> ⚠ When using custom BT, remove `AIChaseComponent`/`AIWanderComponent` from the `.model`.

**Full implementation → [`references/ai-bt.md`](references/ai-bt.md)**

> Full monster entity composition → [`../msw-general/references/monster.md`](../msw-general/references/monster.md)
>
> This SKILL.md only covers combat-specific aspects (ATTACK/HIT/DEAD + DeadEvent/ReviveEvent + BT entry point). For general mlua state machine / scripting patterns see [`msw-scripting`](../msw-scripting/SKILL.md).

---

## 8. UI natives

| UI | API |
|----|-----|
| HP bar (screen-fixed) | `SpriteGUIRendererComponent` fill using the HP gauge slice sprite (`image_ruid = "f0911af597259044aa624a11332c0595"`) + left-pivot `UITransformComponent` width resize. Use `SliderComponent` for user-draggable controls, not read-only HP gauges. **⚠ UI entities only** |
| Damage numbers | 3 `DamageSkin*` components + `DamageSkinService` — §11 |
| Crosshair | `SpriteGUIRendererComponent` in `.ui` |
| Combo counter / buff icons | `TextGUIRendererComponent` + `SpriteGUIRendererComponent` |

**Worldspace HP bar** (overhead): no native support. Two implementation options:

| Option | Approach | Fit |
|--------|----------|-----|
| **Lightweight** | Adjust `LocalScale.x = hp/maxHp` on a child entity's `SpriteRendererComponent` or use `TiledSize.x` (with `SpriteDrawMode.Tiled`) | Quick prototype, simple gauge |
| **Full** | Based on `PixelRendererComponent` — **full implementation [`references/hp-gauge.md`](references/hp-gauge.md)** | Production-grade, many monsters shown at once |

---

## 9. DefaultPlayer combat natives

The player entity has HP, revive, and input natively. **Do not create custom `Hp`/`MaxHp` properties** — use `PlayerComponent`.

> The full property/method tables for `PlayerComponent` / `PlayerControllerComponent` are in [`msw-defaultplayer/SKILL.md`](../msw-defaultplayer/SKILL.md). Only combat essentials here.

### 9-1. Core combat APIs

| Item | Usage |
|------|-------|
| HP decrement | `self.Entity.PlayerComponent.Hp -= event.TotalDamage` |
| Death check | `PlayerComponent:IsDead()` |
| Revive | `PlayerComponent:Respawn()` — `RespawnPosition → SpawnLocation → map entry point`. `DeadEvent`/`ReviveEvent` auto-emitted |
| Client-only death processing | `@ExecSpace("Client") ProcessDead(targetUserId?)` / `ProcessRevive(targetUserId?)` |
| Direction check ★ | `PlayerControllerComponent.LookDirectionX` (+1 right, -1 left). Do **not** use `TransformComponent.Scale.x` |
| Action hook override | `ActionAttack` / `ActionJump` / `ActionInteraction(key, isKeyDown)` etc. |
| Action event reception | `EmitPlayerActionEvent(PlayerActionEvent)` → §9-3 |

> ⚠ **Auto-attack / AI-triggered attack must set facing first.** `LookDirectionX` is a **writable** `@Sync` property — assigning `1`/`-1` flips the player avatar to face that way. The default input pipeline only updates it from *movement* input, so an attack fired without movement (auto-battle loop, AI tick, skill button) keeps the **last** facing (default left) — the avatar looks the wrong way **and** the `LookDirectionX`-based attack box (§1-5) resolves on the wrong side. Before such an attack, point it at the target: `controller.LookDirectionX = target.TransformComponent.WorldPosition.x >= self.Entity.TransformComponent.WorldPosition.x and 1 or -1`. Assign the **sign only** (±1), never the raw position delta — the attack offset multiplies `LookDirectionX`, so a non-unit value scales/mislocates the hitbox.

### 9-3. `PlayerActionEvent`

```
property string ActionName       -- "Attack" / "Jump" / "Crouch" / ...
property Entity PlayerEntity
```

The default pattern is `PlayerAttack extends AttackComponent` that receives `@EventSender("Self") handler HandlePlayerActionEvent(...)` and branches on `event.ActionName == "Attack"`.

### 9-4. Default templates (`RootDesk/MyDesk/`)

Copy-paste without modification. Override as needed:

| File | Role | Key points |
|------|------|------------|
| `PlayerAttack.mlua` | Frontal Box attack | `LookDirectionX` for direction, `AttackFast` + `CollisionGroups.Monster`, `CalcDamage=50`, 30% crit |
| `PlayerHit.mlua` | i-frame | `ImmuneCooldown` property, `_UtilLogic.ElapsedSeconds` deadline, `IsHitTarget` override |
| `Monster.mlua` | Monster HP | Custom `@Sync Hp` (no PlayerComponent), `HandleHitEvent` → `Dead/Respawn` |
| `MonsterAttack.mlua` | Sprite-size-based melee | `isvalid(defender.PlayerComponent)` + `__base:IsAttackTarget(...)` super in `IsAttackTarget` |

### 9-5. Time reference

**`_UtilLogic.ElapsedSeconds`** is recommended (world clock, consistent across pause/restore). Do not use `os.clock()`.

### 9-6. Standard CollisionGroups

| Constant | Purpose |
|----------|---------|
| `CollisionGroups.Player` | Monster → Player attack |
| `CollisionGroups.Monster` | Player → Monster attack |
| `CollisionGroups.HitBox` | Default for `HitComponent.CollisionGroup` |

---

## 10. Avatar motion — `AvatarStateAnimationComponent`

Auto-links `StateComponent` transitions to avatar animations.

```
@Sync property SyncDictionary<string, AvatarBodyActionElement> StateToAvatarBodyActionSheet  -- IsLegacy=false
@Sync property SyncDictionary<string, string>                  ActionSheet                    -- IsLegacy=true (deprecated)

method void   SetActionSheet(string key, string animationClipRuid)
method void   RemoveActionSheet(string key)
method string StateStringToAnimationKey(string stateName)
emitter EmitBodyActionStateChangeEvent(BodyActionStateChangeEvent)
```

- `ChangeState("HIT")` → the mapped `MapleAvatarBodyActionState.Hit` plays automatically
- Combat-relevant state values: `Attack`=3, `Hit`=14, `Dead`=10, `Alert`=4, `Heal`=13
- `IsLegacy=false` fixed; use only `StateToAvatarBodyActionSheet`

> The full avatar component coverage (`AvatarRendererComponent` etc.) is in [`msw-defaultplayer`](../msw-defaultplayer/SKILL.md). This section covers only combat motion mapping.

---

## 11. Damage skin (number display)

### Default RUIDs

| Purpose | RUID | Used on |
|---------|------|---------|
| Hit | `3271c3e79bf04ecba9a107d55495970d` | Default for attacker's `DamageSkinSettingComponent.DamageSkinId` |
| Taken hit | `02c22d93421b4038b3c413b3e40b57ec` | Defender-side display — call `_DamageSkinService:Play` manually |
| Heal | `d58b67cf0f3a4eaf9fe1ad87c0ffac8a` | Heal/potion — call `_DamageSkinService:Play` manually |

### 11-1. Auto mode (component-based)

On `Attack/AttackFast`, if all 3 components below are present, damage numbers are displayed **automatically**:

| Side | Component | Role |
|------|-----------|------|
| Attacker | `DamageSkinSettingComponent` | Which skin/style to display |
| Defender | `DamageSkinSpawnerComponent` | Display position offset |
| Defender | `DamageSkinComponent` | Damage number body (over the entity) |

Include all 3 in the `.model` and damage numbers appear with zero script code.

#### `DamageSkinSettingComponent` (attacker)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `DamageSkinId` | DataRef | hit RUID (table above) | Damage number skin RUID |
| `DamageSkinScale` | Vector2 | (1, 1) | Number size |
| `Alpha` | float | 1 | Opacity |
| `PlayRate` | float | 1 | Playback speed |
| `DelayPerAttack` | float | 0.05 | Delay between multi-hits (seconds) |
| `TweenType` | DamageSkinTweenType | Default | Animation style |
| `LitMode` | LitMode | Default | Lighting influence |

`DamageSkinTweenType`: `Default` (popup) / `Volcano` (fan) / `Blade` (overlap) / each `*Mini` (75% scale)

#### `DamageSkinSpawnerComponent` (defender)

| Property | Type | Default |
|----------|------|---------|
| `DamageSkinOffset` | Vector2 | (0,0) |

### 11-2. Manual mode — `DamageSkinService`

Cases not caught by auto mode (heal, Miss/Guard, non-standard damage sources) call `_DamageSkinService` directly.

```
_DamageSkinService:Play(targetEntity, skinRuid, delay, damages:List<int>, tweenType, isCritical, offset, scale, playRate, alpha, litMode)
_DamageSkinService:PlayTextDamage(targetEntity, skinRuid, textType, tweenType)
_DamageSkinService:PreloadAsync(skinRuid, callback(success))    -- ClientOnly
```

`DamageSkinTextType`: `Miss` / `Guard` / `Resist` / `Shot` / `Counter`

> ⚠ `_DamageSkinService:Play` is in the `Client` space — to call it from server logic (HP subtraction, etc.) wrap it in an `@ExecSpace("Client")` method or change a `@Sync` property and trigger from `OnSyncProperty`.

> ⚠ **`Play()` has 6 required parameters. Passing only some of the 5 optional ones triggers LEA-3005 `InvalidArgument`.**

### 11-3. Recipes

#### (a) Critical emphasis — auto mode + dynamic scale

Auto mode renders red font automatically when `IsCritical=true`. To emphasize further, temporarily increase the attacker-side scale:

```lua
-- ⚠ AttackComponent hooks (CalcDamage/CalcCritical/GetCriticalDamageRate/GetDisplayHitCount/
--   IsAttackTarget/IsHitTarget/OnAttack) have an unspecified ExecSpace (=All) on the parent.
--   Adding @ExecSpace when overriding triggers LEA-3014 SignatureMismatch.
--   Details: msw-scripting/SKILL.md §9 "Method override → LEA-3014"
method integer CalcDamage(Entity attacker, Entity defender, string attackInfo)
    return 100
end

method boolean CalcCritical(Entity attacker, Entity defender, string attackInfo)
    return math.random() < 0.3
end

method float GetCriticalDamageRate()
    return 2.5     -- 100 → 250
end
```

Differentiate criticals visually with `DamageSkinSettingComponent.TweenType = Volcano` (fan scatter) or `Blade` (overlap).

#### (b) Heal / recovery — manual call

```lua
local HEAL_RUID = "d58b67cf0f3a4eaf9fe1ad87c0ffac8a"

@ExecSpace("Client")
method void ShowHeal(Entity target, integer amount)
    _DamageSkinService:Play(
        target, HEAL_RUID, 0,
        { amount },                            -- damages
        DamageSkinTweenType.Default,
        false,                                 -- isCritical
        Vector2(0, 0.5),                       -- offset (above head)
        Vector2(1, 1), 1.0, 1.0, LitMode.Default
    )
end
```

#### (c) Miss / Guard / Resist text

```lua
local HIT_RUID = "02c22d93421b4038b3c413b3e40b57ec"

@ExecSpace("Client")
method void ShowMiss(Entity target)
    _DamageSkinService:PlayTextDamage(
        target, HIT_RUID, DamageSkinTextType.Miss, DamageSkinTweenType.Default
    )
end
```

Call this when `AttackComponent:IsAttackTarget` returned false → "miss animation + damage 0".

#### (d) Multi-hit — split into N with a single call

If you pass a List as the `damages` argument of `_DamageSkinService:Play`, the numbers are shown sequentially at `DelayPerAttack` (attacker component value) intervals:

```lua
_DamageSkinService:Play(target, ATTACK_RUID, 0, { 12, 8, 14, 11, 9 },
    DamageSkinTweenType.Default, false, Vector2(0,0), Vector2(1,1), 1, 1, LitMode.Default)
```

Auto mode behaves identically with `HitEvent.Damages` (List) — override `GetDisplayHitCount(attackInfo)` to control the split count.

#### (e) Preload — prevent first-display stutter

The first use of a skin RUID may have texture loading lag. Preload on map entry:

```lua
@ExecSpace("ClientOnly")
method void OnBeginPlay()
    _DamageSkinService:PreloadAsync("3271c3e79bf04ecba9a107d55495970d", function(ok) end)
    _DamageSkinService:PreloadAsync("02c22d93421b4038b3c413b3e40b57ec", function(ok) end)
    _DamageSkinService:PreloadAsync("d58b67cf0f3a4eaf9fe1ad87c0ffac8a", function(ok) end)
end
```

#### (f) TweenType use cases

| TweenType | Recommended situation |
|-----------|-----------------------|
| `Default` | Normal hits |
| `Volcano` | Critical / area hits (upward scatter) |
| `Blade` | Continuous slashes / combos (overlapping numbers) |
| `*Mini` | Small damage like DoT (poison/burn) — less screen clutter |

#### (g) Faction-specific skins

To use different skin RUIDs per side (player vs enemy, PvP factions, etc.), swap `DamageSkinSettingComponent.DamageSkinId` at runtime:

```lua
self.Entity.DamageSkinSettingComponent.DamageSkinId = MY_TEAM_SKIN_RUID
```

---

## 12. Hit effect — `HitEffectSpawnerComponent`

Attach to the defender and a hit effect plays **automatically** on `HitEvent`. No properties — just add the component to the `.model`.

---

## 13. Full combat checklist

- [ ] **Attacker model**: an `AttackComponent`-derived script (+ optional: `DamageSkinSettingComponent`)
- [ ] **Defender model**: `HitComponent` + `HitEffectSpawnerComponent` + (optional: `DamageSkinSpawnerComponent` + `DamageSkinComponent`)
- [ ] **HitComponent**: `IsLegacy=false`, set `ColliderType`/`BoxSize`/`CircleRadius`, set `CollisionGroup`
- [ ] **State motions**: register `ATTACK`/`HIT`/`DEAD` in `StateComponent` + `AvatarStateAnimationComponent.StateToAvatarBodyActionSheet`
- [ ] **HP handling**: player uses `PlayerComponent.Hp`; monster uses custom `@Sync Hp`
- [ ] **Direction check**: `LookDirectionX` (no Scale.x); for auto/AI-triggered attacks, set it (±1) toward the target before attacking — §9-1
- [ ] **Time reference**: `_UtilLogic.ElapsedSeconds` (no os.clock)
- [ ] **Event cleanup**: explicit `DisconnectEvent` in `OnEndPlay`
- [ ] **Body rule**: do not assign `TransformComponent.Position` directly on an entity with an active Body

---

## 14. Custom implementation is required

Buff/Debuff · BT Decorator/Memory(Blackboard) · Aggro/Threat Table · projectile pooling · pierce/max-hits · stagger-level system · resources (MP/Stamina/Rage) · combo/cancel windows · guard/parry · world→screen coordinate conversion · worldspace HP bar

---

## Out of scope

- General player topics (HP/movement/camera/costume aside): [`msw-defaultplayer`](../msw-defaultplayer/SKILL.md)
- General mlua grammar/lifecycle: [`msw-scripting`](../msw-scripting/SKILL.md)
- `.model` authoring rules/templates: [`msw-general`](../msw-general/SKILL.md)
