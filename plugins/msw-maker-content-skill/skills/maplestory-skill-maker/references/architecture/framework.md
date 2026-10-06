# Skill Framework (Registry & Dispatch Foundation)

**Enforcement:** mixed — the DataSet/catalog and dispatch-ownership sections carry `DATA-01`–`DATA-04` together with [datasets.md](datasets.md); every other section is implementation discipline.

How a project turns a data-only skill definition into a usable, hotkey-bound in-game skill, and how many concrete skills coexist without copy-pasting a property/method group per skill. This is the architectural foundation the other domain files plug into — read this FIRST when the request is "add a skill", "add a skill type", "bind a new hotkey", or "let the player use skill X". See [../../SKILL.md](../../SKILL.md) for the Reference Catalog.

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

Apply each placement rule across `@Component` and `@Logic`:

| Rule | Required decision |
|---|---|
| Single owner | Place state preservation, lifetime, asynchronous callbacks, and resource reclamation in the one role that can own their full cycle. |
| Reuse | Route through a working existing helper before adding another path. |
| Extend | For the same concern, add safe type dispatch or internal helpers inside the existing owner. |
| Create | Add an independent script only for a genuinely independent lifecycle/data owner or when no integrable owner exists; never create zombie adapters or fake Defenders to match guide filenames. |

Physical names and branch syntax may adapt to the project; per-type behavior, order, ownership, and idempotent cleanup may not.

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
2. Existing methods/properties in each selected owner; inspect every proposed entry point's signature, body, callers, and responsibility because a name-only match is insufficient.
3. Attached components, especially parallel components derived from the same base type.
4. DataSet names, family/type constants, binding keys, model names/ids, and any global accessor derived from a `@Logic` script name (checking for any entanglement of global accessors).

Apply these rules strictly to avoid collisions:

- A `@Logic` accessor derives from the exact script name (`AttackSkillLogic` → `_AttackSkillLogic`) and cannot address two implementations. Reuse/integrate the existing full or partial owner; never create the same entry/accessor twice.
- Methods are scoped to their component/script. `PlayerAttack:ExecuteSkill` and `PlayerMovementSkill:ExecuteSkill` do not collide because callers first resolve different component instances. However, if the selected attack component already declares `ExecuteSkill`, the template must never emit a second `ExecuteSkill` declaration in that component. Do not rely on overload-by-parameter behavior.
- Parallel components derived from the same base type make base-type access ambiguous. Resolve the exact script type and never attach duplicate role implementations.
- For native jump interception, replace the ordinary controller on `Player.model` with one `PlayerControllerComponent` extension; never attach both. If replacement needs user action, request it after implementing the remaining skill work. Raw `.mlua` uses parameterless `method void ActionJump()` / `ActionDownJump()` and allowed-path `__base` delegation; never write the Maker UI label `override` as a raw keyword.
- Treat method names in examples (`ExecuteSkill`, `UseSkill`, `RequestUseSkill`, etc.) as placeholders resolved by the role map, not names that the generator is entitled to create.
- Resolve every proposed entry point with this decision table:
  1. **No method with that name exists in the selected component** → the name may be created if it fits the project's naming convention.
  2. **A method exists and already fulfills the same role/contract** → reuse that declaration and integrate through its existing body or helpers; never append another declaration.
  3. **A method exists with the same role but a different signature** → preserve the public method when callers depend on it, add or reuse a uniquely named internal helper, and adapt the existing body to that helper. Do not create a second input listener, cast-lock owner, or parallel attack adapter (do not introduce a duplicate input listener or a second cooldown component).
  4. **A method exists but serves an unrelated responsibility** → leave it untouched. Choose a project-unique role entry point such as `TryExecuteAttackSkill`, record that exact name in the role map, and make the shared router call that name instead of the example name.
- When the selected script already owns the role, adapt its entry body to the generic pipeline. Add a component only for a genuinely separate responsibility and state/lifetime, never for a filename mismatch.
- Never rename/replace user code to match this guide; record the discovered role map at handoff.
- Treat DataSet names as shared project identifiers. Reuse a schema-compatible DataSet; if you must create a new one, assign an easily distinguishable name and register it in the catalog logic information rather than creating a second asset with a confusingly similar role.

Required preflight output before implementation: a small role map of `role → existing/new script → exact existing/new method entry point → DataSet`, plus every detected collision and the chosen reuse/integrate/adapter/rename decision. A patch plan that still contains a duplicate method declaration fails preflight and must not be applied.

## First-Time Bootstrap Map

When building the structure from scratch, follow this order and open the linked reference before implementing each stage:

1. Create the three DataSets and their validation/loading catalog: this file's **DataSet-Backed Skill Catalog** section + [datasets.md](datasets.md) for attack columns + [../movement/skills.md](../movement/skills.md) for movement columns.
2. Create one shared input router and binding DataSet: this file's **Hotkey / Skill Slot Input Layer** section. Do not put string key comparisons (like `"F"`, `"Shift"`) in attack/movement executors.
3. Create the attack Registry/Adapter pair and the extended player controller used by its native jump gate: [../combat/targeting.md](../combat/targeting.md) for execution timing, [../combat/damage-presentation.md](../combat/damage-presentation.md) for output, and [../player/casting.md](../player/casting.md) for client/server ownership, `castId`, airborne motion preservation, and controller replacement.
4. Create the movement Registry/Adapter pair per [../movement/skills.md](../movement/skills.md); share only the input router and keep movement data/execution lifecycle separate from attack judgment.
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

The three sources remain separate:

| Source | Schema responsibility |
|---|---|
| `AttackSkillData` | `id`, `name`, `familyId`, `type`, damage/count, and attack cast/movement policy columns defined in [datasets.md](datasets.md) |
| `MovementSkillData` | `id`, `name`, `familyId`, `type`, cooldown/map/attack-interaction policy, and type tuning defined in [movement/skills.md](../movement/skills.md) |
| `SkillBindingData` | `keyName`, `familyId`, `skillId` only |

- `familyId` is an enum-like integer (`FamilyAttack`, `FamilyMovement`) owned by `SkillCatalogLogic`; do not compare free-form family strings across scripts.
- `type` values are constants owned by the catalog (`normal_attack_skill`, `projectile_attack_skill`, `double_jump_skill`, `teleport_skill`, etc.). Executors branch by type, never by individual skill id.
- `keyName` is the authoring string stored in `SkillBindingData`, converted once to `KeyboardKey` during catalog initialization. Runtime executors receive the enum key and never hardcode `"LeftShift"`, `"F"`, etc.
- Fail initialization when a DataSet/table/required column is missing, an id is invalid/duplicated, a family does not match its DataSet, a binding references a missing skill, or a key name cannot be converted. Do not silently create a hardcoded fallback skill table.
- Call `EnsureInitialized()` from getters as a defensive guard, but perform the normal first load in `OnBeginPlay` so input components see a complete catalog.
- Keep the `.userdataset` asset and any project-managed CSV representation consistent through the approved DataSet authoring workflow; do not build a second in-script copy.

For an existing type, add its dedicated DataSet row plus the corresponding `SkillBindingData` row when usable. Do not add Lua files, per-skill properties, or methods: the existing type branch and shared cast pipeline resolve the new row. See [Adding a New Concrete Skill](#adding-a-new-concrete-skill-of-an-existing-type).

## Hotkey / Skill Slot Input Layer ("making a skill usable")

A skill row is inert until `SkillBindingData` maps a key to its family and id. That binding layer is a separate owner from this framework: one shared input router holds the key-input subscription and family routing, while the family executors described here receive already-resolved ids and never maintain their own key table.

Binding storage, the required `LeftShift` / `F` project defaults, collision handling, the string→`KeyboardKey` conversion point, and the key-down routing sequence are owned by [hotkeys.md](hotkeys.md). Do not restate them here; the catalog's role is only to expose the resolved binding and normalized row to the router.

## Skill Type Dispatch

Use one generic entry point and branch by `data.type`, never by individual `skillId`. An if/elseif chain or lookup is valid; no `SkillTypeHandlers` property is required. Dispatch known normal/projectile types to their type handler and reject unsupported types.

### Projectile lifecycle is a separate capability from judgment

`projectile_attack_skill`'s type branch drives *when* projectiles launch, while pooling and per-projectile travel are separate capabilities. A portable reference split is:

- A **new `@Logic`** (`ProjectilePoolLogic`, accessor `_ProjectilePoolLogic`) — pooled acquire/reuse/release, never `Destroy`. `Launch(...)` acquires then delegates travel to the projectile's own mover.
- A **new `@Component`** (`ProjectileMover`) on the projectile `.model` — owns movement (precompute-time `OnUpdate` lerp) and self-retires to the pool on arrival. Movement lives here, **not** as a central timer loop in the pool `@Logic`.
- A minimal projectile `.model` (Transform + SpriteRenderer + `script.ProjectileMover`).

Do not assume those filenames or that exact split in another project. First map existing pooling/travel owners; create only the missing capabilities. The projectile must still be pooled, travel to the cast-time body center, and retire rather than `Destroy`. Full rules: [../combat/projectile.md](../combat/projectile.md).

The attack Registry's single generic `UseSkill(caster, skillId)`-equivalent resolves normalized data through the catalog and dispatches once by `data.type`. This is the ONE place a skill type is wired in; every domain file's Runtime Sequence describes what that type branch must do internally, never a per-skill-id method.

## Casting State Ownership (generic, not per-skill)

Use one casting lock per player, not per `skillId`; concurrent casting requires an explicit new design.

| Owner | State |
|---|---|
| Client-local presentation/input (never `@Sync`) | `CastingLockActive`, `CastingSkillId`, `LocalCastSequence`, `ActiveLocalCastId` |
| Server-only validation | `ServerCastingLockActive`, `ActiveServerCastId` |

Skill identity is an integer DataSet id resolved through the catalog, not duplicated as per-skill Component properties. The client and server do not dual-write one synchronized casting flag: the client owns presentation cleanup and the server owns request overlap/cooldown validation. Every asynchronous message carries `castId`; see [../player/casting.md](../player/casting.md)'s Cast Instance Ownership Rule.

## Cooldown Ownership

Authoritative cooldown is per-caster/per-skill in `AttackSkillLogic`, keyed as `[caster.Id][skillId]` and compared with `_UtilLogic.ElapsedSeconds`. This avoids per-skill `@Sync` properties and preserves cooldown across map transitions through the `@Logic` lifetime.

The baseline template additionally keeps a client-only predicted expiry solely to reject known cooldown input before movement/animation lock. It is not authoritative and is never `@Sync`. An advanced pattern may also store `LocalCooldownCastId[skillId]`, reconcile from server acceptance/cooldown rejection, and clear only the matching prediction on non-cooldown rejection. Full ordering and selection criteria: [../player/casting.md](../player/casting.md)'s Cooldown Before Presentation Lock Rule.

## Request / Response Flow

1. **Client input router**: resolve `event.key` through `SkillBindingData`, choose the family route, and call the matching executor's `ExecuteSkill(skillId)`.
2. **Client attack adapter**: check the predicted per-skill cooldown before any presentation/input mutation. If ready, reject if locally casting; validate `allowAirborneCast`, increment `LocalCastSequence`, stamp the predicted cooldown with that id, set `ActiveLocalCastId`, copy `allowJumpDuringCast` into the local jump policy, apply local locks, and call `RequestUseSkill(skillId, castId)`. Do not subscribe the animation-end callback at raw input time.
3. **Server attack adapter**: reject overlap using `ServerCastingLockActive`; every rejection echoes `castId + skillId + cooldownRemaining`. On success set `ActiveServerCastId`, arm a safety timer with that id, validate/stamp authoritative cooldown, notify animation with that id, then send an acceptance carrying the remaining duration so the client reconciles its prediction.
4. **Attack Registry**: resolve the normalized attack row and dispatch by `data.type`; run the type Runtime Sequence and stamp authoritative cooldown.
5. **Client completion**: after the matching cast-animation notification sends the animation event, subscribe its animation-end callback with the current `castId`. Animation end/interruption/rejection/safety notification calls the same `ReleaseCastingLockLocally(castId)`. It restores only when the id is still active, then requests `RequestReleaseCastingLock(castId)`.
6. **Server completion**: clear only when `ActiveServerCastId == castId`. A release, rejection, animation RPC, or timer from an older cast is ignored.

## Adding a New Concrete Skill (of an existing type)

1. Resolve the must-ask fields and non-field decisions in [datasets.md](datasets.md#must-ask-vs-standard-default-fields) per Stage 1 of [../execution-core.md](../execution-core.md).
2. Add one `AttackSkillData` row using the confirmed answers, per [datasets.md](datasets.md).
3. If directly usable, add one `SkillBindingData` row with `keyName`, `FamilyAttack`, and the new `skillId`. For the baseline `normal_attack_skill`, `keyName` MUST default to `LeftShift`; use another key only on explicit user override or after resolving an existing binding collision.
4. No new methods, no new `@Sync` properties, no new file — the existing type's `OnUse` handler and the generic casting-lock/animation flow already cover it.

## Adding a New Attack Skill Type

1. Add a row to [datasets.md](datasets.md)'s Type Design table with real confirmed values, not a placeholder.
2. Add one new `data.type` branch to the existing attack Registry's generic dispatch mechanism.
3. Update the Runtime Sequence description in the relevant domain file(s) (../combat/targeting.md at minimum) for the new type.
4. Extend `AttackSkillData` and `SkillCatalogLogic` validation/normalization together for any new type-specific columns.
5. Any concrete skill of the new type is then just a DataSet row + optional `SkillBindingData` row, per above.
