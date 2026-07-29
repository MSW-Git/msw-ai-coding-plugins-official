# Skill Framework (Registry & Dispatch Foundation)

How a project turns a data-only skill definition into a usable, hotkey-bound in-game skill, and how many concrete skills coexist without copy-pasting a property/method group per skill. This is the architectural foundation the other domain files plug into — read this FIRST when the request is "add a skill", "add a skill type", "bind a new hotkey", or "let the player use skill X". See [../../SKILL.md](../../SKILL.md) for the Domain Reference Files index.

This reference is the **attack-family** framework. Double jump and teleport use the separate Movement Registry + Player Movement Adapter contract in [../movement/skills.md](../movement/skills.md); do not force them into `AttackSkillLogic` or the Defender pipeline.

A `@Component` reaches a Registry `@Logic` through the name-derived global accessor `_<ScriptName>`, per `msw-scripting`. Names such as `AttackSkillLogic` and `_AttackSkillLogic` below are illustrative role labels; discover or choose the target project's actual names.

## Contents

- [Why @Logic, not @Component, owns the skill foundation](#why-logic-not-component-owns-the-skill-foundation)
- [Responsibility Placement Rule](#responsibility-placement-rule)
- [File Split & Responsibilities](#file-split--responsibilities)
- [Symbol & Asset Collision Preflight](#symbol--asset-collision-preflight)
- [First-Time Bootstrap Map](#first-time-bootstrap-map)
- [DataSet-Backed Skill Catalog](#dataset-backed-skill-catalog)
- [Hotkey / Skill Slot Input Layer ("making a skill usable")](#hotkey--skill-slot-input-layer-making-a-skill-usable)
- [Skill Type Dispatch](#skill-type-dispatch)
- [Casting State Ownership (generic, not per-skill)](#casting-state-ownership-generic-not-per-skill)
- [Cooldown Ownership](#cooldown-ownership)
- [Request / Response Flow](#request--response-flow)
- [Adding a New Concrete Skill (of an existing type)](#adding-a-new-concrete-skill-of-an-existing-type)
- [Adding a New Attack Skill Type](#adding-a-new-attack-skill-type)

## Why `@Logic`, not `@Component`, owns the skill foundation

Per `AGENTS.md`'s own Logic-vs-Component rule of thumb ("should this still be running/defined when the player walks into another map?"): `SkillCatalogLogic` loads and normalizes the DataSet definitions once, while `AttackSkillLogic` owns the world-wide type dispatch and cooldown state. Neither belongs on a per-player `@Component`; doing so would duplicate one property group per integer `skillId` on every player. The DataSet owns tuned row values, `SkillCatalogLogic` owns normalized lookup, and `AttackSkillLogic` owns execution.

What stays on a per-player adapter `@Component`, because it is per-entity state:

- The attack execution adapter for one player
- Client-local casting presentation state and `castId` generation
- Client-side avatar animation playback and local input prediction

## Responsibility Placement Rule

This principle applies strictly across `@Component` and `@Logic`:

1. When designing a capability, properly attribute it to the single role that can fully own the responsibility for its state-preservation cycle, lifetime, asynchronous callback management, and resource reclamation.
2. If there is existing helper code that is well-written and functioning, prioritize reusing it by routing through that path first.
3. If an area shares the same concern, expand it by implementing safe type-based branching or internal helper methods within the existing role. This is a natural and exemplary software integration technique, not an architectural violation.
4. Establish a new independent script only when an independent lifecycle and completely isolated data management are absolutely essential, or when no existing owner exists, making integration impossible. Do not let zombie adapters or duplicate fake Defenders run rampant just under the pretext of filenames being separated in the reference guide.

The names of physical files, method identifiers, and whether to branch using if/elseif or a lookup map structure can be adjusted according to the realities of the project. However, the execution characteristics per type, sequential timing, resource ownership, and idempotency of cleanup must be fully guaranteed.

## File Split & Responsibilities

| Role / asset | Kind | Owns |
|---|---|---|
| Attack skill data | `UserDataSet` | Attack-family rows only; one row per concrete attack skill, using [datasets.md](datasets.md) |
| Movement skill data | `UserDataSet` | Movement-family rows only; one row per double jump/teleport/etc., using [../movement/skills.md](../movement/skills.md) |
| Skill binding data | `UserDataSet` | `keyName + familyId + skillId`; the single key-binding source for both families |
| Catalog owner | `@Logic` | Loads and validates the DataSets, converts key names, and exposes normalized tables |
| Input router | player `@Component` | The single key listener; routes a binding by family and applies cross-family policy |
| Attack Registry | `@Logic` | Attack type dispatch, server judgment/presentation triggers, and per-caster cooldown state |
| Player attack adapter | player `@Component` | Client-local casting/animation/movement lock, `castId`, and server request/response relay |
| Player jump-gate controller | `PlayerControllerComponent` extension; required default | `PlayerJumpGateController` replaces the ordinary controller, intercepts native jump/down-jump without changing Body physics, and delegates allowed paths through `__base`. It is separate from `PlayerSkillInputRouter`. |
| Movement Registry | `@Logic` | Movement type lookup and authoritative movement-skill cooldown validation |
| Player movement adapter | player `@Component` | Local double-jump/teleport execution, collision/landing policy, charges, effects, and prediction |
| Defender | target `@Component` | HP/death/respawn and the generic damage entry point |

The transferable rule is the role split, not these filenames. Discover existing scripts first and map each role once; never create a second catalog/input/executor pipeline alongside an existing one.

## Symbol & Asset Collision Preflight

Every concrete script, method, property, DataSet, and component name shown in examples is a **role label or illustrative name**. It is not a reserved name and is never evidence that the target project contains that file.

Before creating or adding anything, inventory these namespaces in the target workspace:

1. Script-entry names (`@Logic`, `@Component`, `@Event`, etc.) and their generated component type names.
2. Existing methods/properties in the script selected for each role. For every proposed entry-point name, inspect its signature, body, callers, and responsibility; a name-only search is not enough. Directly inspect the target method's signature, internal body flow, other high-level objects calling it, and its overall responsibility at the code level rather than just guessing by a name-only search.
3. Components already attached to the target player/entity, including multiple components derived from the same base type (especially checking for any confusing state of dual-attachment where multiple components are derived from the same parent type).
4. DataSet names, family/type constants, binding keys, model names/ids, and any global accessor derived from a `@Logic` script name (checking for any entanglement of global accessors).

Apply these rules strictly to avoid collisions:

- A `@Logic` accessor is derived from the exact script name (`AttackSkillLogic` → `_AttackSkillLogic`). Reuse an existing Logic that already owns the role; never create another script with the same entry name or assume the accessor can point to two implementations. If there is already a logic script running that partially owns the same responsibility, you must merge and integrate within that logic, rather than doubly modifying or uploading the same accessor or file name, which would break the accessor or cause duplicate conflicts.
- Methods are scoped to their component/script. `PlayerAttack:ExecuteSkill` and `PlayerMovementSkill:ExecuteSkill` do not collide because callers first resolve different component instances. However, if the selected attack component already declares `ExecuteSkill`, the template must never emit a second `ExecuteSkill` declaration in that component. Do not rely on overload-by-parameter behavior.
- Two different components derived from the same base type on one entity can make base-type component access ambiguous. Resolve the exact script component by type name and avoid attaching parallel implementations of the same role. Attaching two different components derived from the same base type on one entity is highly dangerous because the runtime component acquisition routine may malfunction; always search and acquire using the exact target class type and prevent unnecessary parallel attachments.
- When a skill pipeline needs native jump interception, extend `PlayerControllerComponent` and replace the player's ordinary controller with that derived component. Do not add the derived controller alongside the original to avoid dual control conflicts. It must be replaced on `Player.model`. If it is difficult to replace it on `Player.model`, request the user to do so after the implementation of all skills is completed. In raw `.mlua`, redefine script-overridable methods with `method void ActionJump()` / `method void ActionDownJump()` and delegate allowed input through `__base` (explicitly calling the parent `__base` method only upon normal key operation); the Maker UI word `override` is not a valid raw declaration keyword and must not be written directly because it causes a syntax error during raw script text analysis.
- Treat method names in examples (`ExecuteSkill`, `UseSkill`, `RequestUseSkill`, etc.) as placeholders resolved by the role map, not names that the generator is entitled to create.
- Resolve every proposed entry point with this decision table:
  1. **No method with that name exists in the selected component** → the name may be created if it fits the project's naming convention.
  2. **A method exists and already fulfills the same role/contract** → reuse that declaration and integrate through its existing body or helpers; never append another declaration.
  3. **A method exists with the same role but a different signature** → preserve the public method when callers depend on it, add or reuse a uniquely named internal helper, and adapt the existing body to that helper. Do not create a second input listener, cast-lock owner, or parallel attack adapter (do not introduce a duplicate input listener or a second cooldown component).
  4. **A method exists but serves an unrelated responsibility** → leave it untouched. Choose a project-unique role entry point such as `TryExecuteAttackSkill`, record that exact name in the role map, and make the shared router call that name instead of the example name.
- If the same role is already owned by the selected script, modifying that owner's existing entry body to delegate into the generic pipeline is integration, not a reason to create a parallel component. Create another component only when the missing behavior is genuinely a separate responsibility with separate state/lifetime. Do not blindly add a new component and entangle the state and lifecycle just because the filename does not match the reference document guide.
- Never rename or replace user code merely to match names in this reference. Record the discovered role map in the hand-over documentation instead.
- Treat DataSet names as shared project identifiers. Reuse a schema-compatible DataSet; if you must create a new one, assign an easily distinguishable name and register it in the catalog logic information rather than creating a second asset with a confusingly similar role.

Required preflight output before implementation: a small role map of `role → existing/new script → exact existing/new method entry point → DataSet`, plus every detected collision and the chosen reuse/integrate/adapter/rename decision. A patch plan that still contains a duplicate method declaration fails preflight and must not be applied.

## First-Time Bootstrap Map

When building the structure from scratch, follow this order and open the linked reference before implementing each stage:

1. Create the three DataSets and their validation/loading catalog: this file's **DataSet-Backed Skill Catalog** section + [datasets.md](datasets.md) for attack columns + [../movement/skills.md](../movement/skills.md) for movement columns.
2. Create one shared input router and binding DataSet: this file's **Hotkey / Skill Slot Input Layer** section. Do not put string key comparisons (like `"F"`, `"Shift"`) in attack/movement executors.
3. Create the attack Registry/Adapter pair and the extended player controller used by its native jump gate: [../combat/targeting.md](../combat/targeting.md) for execution timing, [../combat/damage-presentation.md](../combat/damage-presentation.md) for output, and [../player/casting.md](../player/casting.md) for client/server ownership, `castId`, airborne motion preservation, and controller replacement.
4. Create the movement Registry/Adapter pair: [../movement/skills.md](../movement/skills.md). Keep movement data/execution separate from attack judgment (maintaining independence so that the movement computation and execution lifecycle is completely isolated from the attack judgment pipeline) while sharing the input router.
5. Add projectile infrastructure only when the first projectile type/spec is confirmed: [../combat/projectile.md](../combat/projectile.md).
6. Verify DataSet loading, binding resolution, family routing, repeated attack casts, attack-during-movement policy, and movement-during-attack policy flawlessly before adding more concrete skill rows.

Minimum dependency flow:

```text
AttackSkillData ─┐
MovementSkillData ├─> SkillCatalogLogic ─> PlayerSkillInputRouter ─┬─> PlayerAttack ─> AttackSkillLogic
SkillBindingData ─┘                                                └─> PlayerMovementSkill ─> MovementSkillLogic
```

## DataSet-Backed Skill Catalog

Concrete skill data and key bindings live in DataSets, not hardcoded Lua tables or inspector property groups. `SkillCatalogLogic.OnBeginPlay` loads them once with `_DataService:GetTable(...)`, validates every required column and family/type value, normalizes rows into runtime tables keyed by integer `skillId`, and exposes read-only getters to both family Registries and the input router.

The three sources have different schemas and must remain separate:

```text
AttackSkillData:   id, name, familyId, type, damage, attackCount, ..., allowMove, allowJumpDuringCast, allowAirborneCast, allowTurn, ...
MovementSkillData: id, name, familyId, type, cooldown, targetMapMode, allowDuringAttack, ..., distance, ...
SkillBindingData:  keyName, familyId, skillId
```

- `familyId` is an enum-like integer (`FamilyAttack`, `FamilyMovement`) owned by `SkillCatalogLogic`; do not compare free-form family strings across scripts.
- `type` values are constants owned by the catalog (`normal_attack_skill`, `projectile_attack_skill`, `double_jump_skill`, `teleport_skill`, etc.). Executors branch by type, never by individual skill id.
- `keyName` is the authoring string stored in `SkillBindingData`, converted once to `KeyboardKey` during catalog initialization. Runtime executors receive the enum key and never hardcode `"LeftShift"`, `"F"`, etc.
- Fail initialization when a DataSet/table/required column is missing, an id is invalid/duplicated, a family does not match its DataSet, a binding references a missing skill, or a key name cannot be converted. Do not silently create a hardcoded fallback skill table.
- Call `EnsureInitialized()` from getters as a defensive guard, but perform the normal first load in `OnBeginPlay` so input components see a complete catalog.
- Keep the `.userdataset` asset and any project-managed CSV representation consistent through the approved DataSet authoring workflow; do not build a second in-script copy.

Adding a concrete skill of an existing type is designed to be a **data-only change**: add one row matching the columns of the dedicated DataSet containing the design value information, and add one corresponding row in the hotkey map `SkillBindingData` to complete the task. Stop creating new Lua files, copying new attributes, and editing files for this creation — because the already completed and running corresponding type's `OnUse` executor branch and consolidated freeze/unfreeze pipeline will query the catalog for the newly entered data and handle it automatically.

## Hotkey / Skill Slot Input Layer ("making a skill usable")

A skill row is inert until `SkillBindingData` maps a key to its family and id. One shared `PlayerSkillInputRouter` owns the `KeyDownEvent` connection and family routing; `PlayerAttack` and `PlayerMovementSkill` execute already-resolved ids and do not each maintain their own key table.

```csv
keyName,familyId,skillId
LeftShift,1,1001
F,2,2002
```

The skill IDs above are illustrative and MUST be allocated in a non-conflicting project range. The key mappings are project-standard defaults: author the baseline `normal_attack_skill` on `LeftShift` and `teleport_skill` on `F`. Do not ask for or invent another key unless the user explicitly requests an override. If an existing binding already owns either default key, do not silently overwrite it; report and resolve the collision before writing `SkillBindingData`. Keep `animationKey = "swingO1"` as the default for basic attack animation. The execution time of `swingO1` is `0.8s`, and in the case of `swingO1` animation, it is impossible to check whether the animation has ended with a specific event. It must be processed with `SpriteAnimPlayerEndEvent` or with time. `SpriteAnimPlayerEndEvent` is recommended.

At catalog load, convert `keyName` through one explicit string→`KeyboardKey` map and store bindings keyed by the enum. On `OnKeyDown(event.key)` (client), resolve the binding, select the family route, read the family data, apply cross-family policy, obtain the executor component, and call the **exact entry point recorded in the discovered role map**. Unknown/unbound keys are ignored without logging every key press.

## Skill Type Dispatch

Use one generic entry point and branch by `data.type`, never by individual `skillId`. An if/elseif chain or lookup table is valid when it preserves the same behavior. Do not require a property named `SkillTypeHandlers`:

```lua
if data.type == AttackTypeNormal then
    OnUseNormalAttackSkill(caster, data)
elseif data.type == AttackTypeProjectile then
    OnUseProjectileAttackSkill(caster, data)
else
    reject unsupported type
end
```

### Projectile lifecycle is a separate capability from judgment

`projectile_attack_skill`'s type branch drives *when* projectiles launch, while pooling and per-projectile travel are separate capabilities. A portable reference split is:

- A **new `@Logic`** (`ProjectilePoolLogic`, accessor `_ProjectilePoolLogic`) — pooled acquire/reuse/release, never `Destroy`. `Launch(...)` acquires then delegates travel to the projectile's own mover.
- A **new `@Component`** (`ProjectileMover`) on the projectile `.model` — owns movement (precompute-time `OnUpdate` lerp) and self-retires to the pool on arrival. Movement lives here, **not** as a central timer loop in the pool `@Logic`.
- A minimal projectile `.model` (Transform + SpriteRenderer + `script.ProjectileMover`).

Do not assume those filenames or that exact split in another project. First map existing pooling/travel owners; create only the missing capabilities. The projectile must still be pooled, travel to the cast-time body center, and retire rather than `Destroy`. Full rules: [../combat/projectile.md](../combat/projectile.md).

The attack Registry's single generic `UseSkill(caster, skillId)`-equivalent resolves normalized data through the catalog and dispatches once by `data.type`. This is the ONE place a skill type is wired in; every domain file's Runtime Sequence describes what that type branch must do internally, never a per-skill-id method.

## Casting State Ownership (generic, not per-skill)

One casting lock per player, not one per `skillId` — a player casts at most one skill at a time by default. (If a future skill needs concurrent-cast, e.g. a dash that doesn't block a separate attack input, that's a new explicit ask — do not assume it silently.)

```lua
-- client-local presentation/input owner (never @Sync)
property boolean CastingLockActive = false
property integer CastingSkillId = 0
property integer LocalCastSequence = 0
property integer ActiveLocalCastId = 0

-- server-only validation owner
property boolean ServerCastingLockActive = false
property integer ActiveServerCastId = 0
```

Skill identity is an integer DataSet id resolved through the catalog, not duplicated as per-skill Component properties. The client and server do not dual-write one synchronized casting flag: the client owns presentation cleanup and the server owns request overlap/cooldown validation. Every asynchronous message carries `castId`; see [../player/casting.md](../player/casting.md)'s Cast Instance Ownership Rule.

## Cooldown Ownership

Authoritative cooldown is per-caster, per-skill — tracked inside `AttackSkillLogic`, keyed by caster entity Id, since the Logic is the one place every request already routes through:

```lua
_T.cooldownExpireAt = {}  -- [callerEntityId][skillId] = expireTimestamp
```

`CanUseSkill(caster, skillId)` reads `_T.cooldownExpireAt[caster.Id] and _T.cooldownExpireAt[caster.Id][skillId]` against `_UtilLogic.ElapsedSeconds`. This avoids adding a `@Sync` cooldown property per skill per player, and avoids per-player cooldown state disappearing on a map transition (a `@Component`'s state would not survive that the same way; `@Logic` does).

The baseline template additionally keeps a client-only predicted expiry solely to reject known cooldown input before movement/animation lock. It is not authoritative and is never `@Sync`. An advanced pattern may also store `LocalCooldownCastId[skillId]`, reconcile from server acceptance/cooldown rejection, and clear only the matching prediction on non-cooldown rejection. Full ordering and selection criteria: [../player/casting.md](../player/casting.md)'s Cooldown Before Presentation Lock Rule.

## Request / Response Flow

1. **Client input router**: resolve `event.key` through `SkillBindingData`, choose the family route, and call the matching executor's `ExecuteSkill(skillId)`.
2. **Client attack adapter**: check the predicted per-skill cooldown before any presentation/input mutation. If ready, reject if locally casting; validate `allowAirborneCast`, increment `LocalCastSequence`, stamp the predicted cooldown with that id, set `ActiveLocalCastId`, copy `allowJumpDuringCast` into the local jump policy, apply local locks, and call `RequestUseSkill(skillId, castId)`. Do not subscribe the animation-end callback at raw input time.
3. **Server attack adapter**: reject overlap using `ServerCastingLockActive`; every rejection echoes `castId + skillId + cooldownRemaining`. On success set `ActiveServerCastId`, arm a safety timer with that id, validate/stamp authoritative cooldown, notify animation with that id, then send an acceptance carrying the remaining duration so the client reconciles its prediction.
4. **Attack Registry**: resolve the normalized attack row and dispatch by `data.type`; run the type Runtime Sequence and stamp authoritative cooldown.
5. **Client completion**: after the matching cast-animation notification sends the animation event, subscribe its animation-end callback with the current `castId`. Animation end/interruption/rejection/safety notification calls the same `ReleaseCastingLockLocally(castId)`. It restores only when the id is still active, then requests `RequestReleaseCastingLock(castId)`.
6. **Server completion**: clear only when `ActiveServerCastId == castId`. A release, rejection, animation RPC, or timer from an older cast is ignored.

## Adding a New Concrete Skill (of an existing type)

1. Run the MANDATORY PROACTIVE QUESTIONING checklist in `../../SKILL.md`.
2. Add one `AttackSkillData` row using the confirmed answers, per [datasets.md](datasets.md).
3. If directly usable, add one `SkillBindingData` row with `keyName`, `FamilyAttack`, and the new `skillId`. For the baseline `normal_attack_skill`, `keyName` MUST default to `LeftShift`; use another key only on explicit user override or after resolving an existing binding collision.
4. No new methods, no new `@Sync` properties, no new file — the existing type's `OnUse` handler and the generic casting-lock/animation flow already cover it.

## Adding a New Attack Skill Type

1. Add a row to [datasets.md](datasets.md)'s Type Design table with real confirmed values, not a placeholder.
2. Add one new `data.type` branch to the existing attack Registry's generic dispatch mechanism.
3. Update the Runtime Sequence description in the relevant domain file(s) (../combat/targeting.md at minimum) for the new type.
4. Extend `AttackSkillData` and `SkillCatalogLogic` validation/normalization together for any new type-specific columns.
5. Any concrete skill of the new type is then just a DataSet row + optional `SkillBindingData` row, per above.
