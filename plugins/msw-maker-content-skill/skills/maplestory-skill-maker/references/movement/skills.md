# Movement Skills — Double Jump & Teleport

Use this reference for player movement skills. It defines two reusable types:

- `double_jump_skill`: spend a limited air-jump charge while airborne.
- `teleport_skill`: relocate the player by a tuned world-unit distance.

These are not attack types. They do not target a defender, create `attackInfo`, or enter the damage/death-presentation pipeline.

## Contents

- [Required Preflight](#required-preflight)
- [Architecture](#architecture)
- [Must-Ask Fields](#must-ask-fields)
- [Shared Data Shape](#shared-data-shape)
- [Movement Numeric Glossary](#movement-numeric-glossary)
- [Movement Animation Rule](#movement-animation-rule)
- [Double Jump](#type-1--double_jump_skill)
- [Teleport](#type-2--teleport_skill)
- [Client-First Execution and Server Use Validation](#client-first-execution-and-server-use-validation)
- [Verification Matrix](#verification-matrix)
## Required Preflight

Before designing or editing a movement skill:

1. Read the target map's numeric `MapComponent.TileMapMode` through `MapBuilder`.
2. Load `msw-general`, `msw-defaultplayer`, `msw-scripting`, and the matching platform reference.
3. Confirm the active player Body:
   - `0` MapleTile → `RigidbodyComponent`
   - `1` RectTile → `KinematicbodyComponent`
   - `2` SideViewRectTile → `SideviewbodyComponent`
4. Inspect existing player input/movement scripts before creating a parallel adapter.

Double jump is a side-view concept. Support it on MapleTile or SideViewRectTile only. On RectTile, classify the request as a dash/teleport unless the user explicitly wants a visual-only hop.

## Architecture

Keep movement state out of the attack Registry and Defender:

| Role | Kind | Owns |
|---|---|---|
| Movement Skill Registry | `@Logic` | Movement skill data, type dispatch, per-caster cooldown, server-side use validation/accounting |
| Player Movement Adapter | `@Component` on the player | Hotkeys, local prediction, air-jump charge, active-Body calls, client effects/animation |

Discover the existing movement Registry/validation owner and per-player movement adapter before creating anything. Keep movement state out of the monster/defender script, and do not bolt movement handlers onto the attack Registry or attack adapter merely because they already process keys.

The only required cross-stack integration is the movement row's `allowDuringAttack` policy. The movement skill owns this decision because different movement types may or may not be legal during the same attack:

- `allowDuringAttack = false`: default value of `double_jump_skill`. The shared input router ignores this movement binding while `PlayerAttack.CastingLockActive` is true.
- `allowDuringAttack = true`: default value of `teleport_skill`. The movement executor may call `SetWorldPosition`/`SetForce` while the attack adapter keeps its animation/state lock active.

Movement skills currently have no separate avatar animation, so an allowed movement skill must not re-enable `StateComponent`, restore attack-cached `InputSpeed`, disconnect the attack animation handler, clear `FixedLookAt`, or mutate any attack cast id. The attack adapter alone releases its own cast. If a future movement skill needs `cancel_cast`, add an explicit attack-adapter cancellation method carrying `ActiveLocalCastId`; never clear attack properties directly from the movement adapter.

## Must-Ask Fields

Ask common fields first:

- name; ask for a hotkey only for double jump or another movement type without a documented default. A new `teleport_skill` MUST default to `F`; do not ask for or invent another key unless the user explicitly requests an override or `F` already has a conflicting binding.
- type: double jump or teleport
- cooldown
- target map mode(s)
- whether this movement row sets `allowDuringAttack = true`
- whether use is allowed while hit/dead/climbing
- animation/effect/sound RUIDs, or whether to recommend them via `msw-search`
- for double jump, the standard defaults are `positionEffectRuid = "ad0cdcdc3bd84b45909d8c9f836afb37"` at the jump start position and `attachedEffectRuid = "db06c95ab32e49e4b90ee4bc66906a65"` attached to the player unless the skill requests different art

Then ask type-specific fields.

Double jump:

- air-jump count
- vertical power
- horizontal boost and direction policy
- whether horizontal velocity is preserved
- fall damping tuning for `SetForce`-based double jumps; `curve` is the standard policy

Teleport:

- distance in world units
- cooldown
- MapleTile landing tuning: how far to search for a foothold, and the surface-snap offset for the player pivot
- whether to override the canonical horizontal landing feel. The default passes through walls when the full-distance target has floor, otherwise falls back to the farthest valid wall face or the current foothold edge with `0.03` world-unit clearance. Keep this default unless the user explicitly requests strict wall blocking or gap cancellation.
- effect / sound RUIDs (or `""` guarded)

Direction is not asked: it is the arrow held at cast time, strictly 4-directional (up / down / left / right), and a diagonal or empty input does not teleport.

## Shared Data Shape

Store movement entries as rows in the target project's movement-skill `UserDataSet`, not in the attack DataSet or an executor-local table. The discovered catalog owner loads and validates them in `OnBeginPlay`; the binding DataSet independently maps keys to `familyId + skillId`.

Canonical columns:

```text
id,name,familyId,type,cooldown,targetMapMode,allowDuringAttack,
allowWhileHit,allowWhileDead,allowWhileClimbing,
animationKey,
airJumpCount,verticalPower,horizontalPower,fallDampingPolicy,fallDampingPower,
fallDampingSoftness,minVerticalForce,maxVerticalForce,
positionEffectRuid,attachedEffectRuid,effectSortingLayer,effectOrderInLayer,
positionEffectOrderOffset,attachedEffectOrderOffset,soundRuid,
distance,landingSearchDistance,footprintHalfHeight,landingSurfaceOffset,effectRuid
```

The normalized runtime row has this common shape:

```lua
{
    id = 2001,
    name = "movement_skill_name",
    familyId = _SkillCatalogLogic.FamilyMovement,
    type = "double_jump_skill", -- or "teleport_skill"
    cooldown = 0,
    targetMapMode = TileMapMode.MapleTile, -- optional per type/row
    allowDuringAttack = false,
    allowWhileHit = false,
    allowWhileDead = false,

    allowWhileClimbing = false,
    animationKey = "",
    effectRuid = "",
    soundRuid = "",
}
```

Empty effect/sound RUIDs are valid guarded hooks. Do not fabricate RUIDs.

## Movement Numeric Glossary

Do not infer physical units from a field name such as `Power`. The current movement implementation uses two different numeric domains:

| Field | Exact meaning / unit |
|---|---|
| `cooldown` | Seconds between accepted uses of the same movement `skillId`. There is no universal movement default: confirm it per skill. The example rows use `0` for double jump and `0.4` for teleport; do not treat either as a cross-type default. |
| `targetMapMode` | Numeric `TileMapMode` enum restriction: `0 = MapleTile`, `1 = RectTile`, `2 = SideViewRectTile`. It is not a power or distance. The current double jump requires `0`; a blank optional value normalizes to `nil` for types that allow multiple modes. |
| `airJumpCount` | Integer number of extra airborne uses restored when grounded; not the total number of jumps including the native ground jump. Default: `1` |
| `horizontalPower` | Raw X magnitude passed to `RigidbodyComponent:SetForce`, with facing sign applied. Not world-unit distance or units/second. Current double jump: `6.0`. |
| `verticalPower` | Base Y force before fall damping and clamping. Not jump height. Current double jump: `4.0`. |
| `fallDampingPower` | Maximum amount subtracted from `verticalPower` as the normalized fall ratio approaches `1`. Current value: `18.0`. |
| `fallDampingSoftness` | Positive denominator softener in `fallAmount / (fallAmount + fallDampingSoftness)`; it controls how quickly damping approaches its maximum. Current value: `0.2`. |
| `minVerticalForce` / `maxVerticalForce` | Final clamp bounds for the Y value passed to `SetForce`. Current values: `-12.0` / `8.0`. |
| `distance` | Teleport displacement in world units (`1 unit = 100 px`), not pixels. Current teleport: `1.8`. |
| `landingSearchDistance` | Downward foothold probe length from the proposed horizontal destination, in world units. Current teleport: `1.3`. It is not added to teleport travel distance. |
| `footprintHalfHeight` | World-unit Y offset used only to start the horizontal-teleport landing probe above the proposed destination. Current teleport: `0.35`; it is not the character's authoritative collider half-height. |
| `landingSurfaceOffset` | World-unit Y correction added after a foothold surface is found. Current teleport: `0.0`. |
| `effectOrderInLayer` / `*OrderOffset` | Integer renderer ordering values. They are not coordinates or time values. |

The canonical MapleTile horizontal teleport also uses an executor-side `horizontalLandingClearance = 0.03` world units. It is deliberately small: it prevents an exact foothold-line overlap while preserving the feel of touching a wall or ledge. This is not currently a `MovementSkillData` column. Keep it in one named helper such as `GetTeleportHorizontalClearance()`; if different teleport rows need different clearance values, extend the DataSet, loader, validation, and normalized row atomically instead of adding per-skill branches.

## Movement Animation Rule

Movement skills do not inherit the attack family's basic-Attack fallback.

- Author every new or reconstructed movement row with `animationKey = ""`. When the key is `nil` or `""`, send no animation event. In particular, do not send `BodyActionStateChangeEvent(MapleAvatarBodyActionState.Attack)` and do not send `ActionStateChangedEvent("", "", ...)`.
- When a movement type supports an animation and the user explicitly requests a verified non-empty `animationKey`, treat it as an explicit custom sprite action id and play it once with `ActionStateChangedEvent(animationKey, animationKey, 1, SpriteAnimClipPlayType.Onetime)` on `AvatarRendererComponent:GetBodyEntity()`. Do not invent or auto-create the custom action as part of ordinary movement-skill creation.
- Preserve the raw empty value through DataSet loading and normalization. Do not replace it with `"attack"` in shared catalog or helper code; doing so would erase the family distinction and make an animation-less movement skill incorrectly swing the player's weapon.

## Type 1 — `double_jump_skill`

### Data

```lua
{
    id = 2001,
    name = "double_jump",
    familyId = _SkillCatalogLogic.FamilyMovement,
    type = "double_jump_skill",
    cooldown = 0,
    targetMapMode = TileMapMode.MapleTile,
    allowDuringAttack = false,
    allowWhileHit = false,
    allowWhileDead = false,
    allowWhileClimbing = false,

    airJumpCount = 1,
    verticalPower = 4.0,
    horizontalPower = 6.0,
    fallDampingPolicy = "curve", -- "curve" is the default for double jump
    fallDampingPower = 18.0,
    fallDampingSoftness = 0.2,
    minVerticalForce = -12.0,
    maxVerticalForce = 8.0,

    animationKey = "",
    positionEffectRuid = "ad0cdcdc3bd84b45909d8c9f836afb37",
    attachedEffectRuid = "db06c95ab32e49e4b90ee4bc66906a65",
    effectSortingLayer = "MapLayer0", -- fallback when the player renderer is unavailable
    effectOrderInLayer = -1, -- fallback when the player renderer is unavailable
    positionEffectOrderOffset = -1,
    attachedEffectOrderOffset = 1,
    soundRuid = "",
}
```

Double jump plays two default effects at the same time: `positionEffectRuid = "ad0cdcdc3bd84b45909d8c9f836afb37"` remains at the jump start position, while `attachedEffectRuid = "db06c95ab32e49e4b90ee4bc66906a65"` is attached to the player. Render the fixed position effect behind the character with `positionEffectOrderOffset = -1`, and render the attached effect in front of the character with `attachedEffectOrderOffset = 1` so transparent attached art stays visible. Use the player `AvatarRendererComponent.SortingLayer` and `AvatarRendererComponent.OrderInLayer + <effect offset>` when available; fall back to `effectSortingLayer` / `effectOrderInLayer` only when the renderer is unavailable. Empty RUIDs are still valid for intentionally silent/no-effect movement skills.

### Runtime Contract

1. Let the native `PlayerControllerComponent` handle the grounded first jump.
2. When the jump key is pressed while airborne, check remaining air-jump charges, cooldown, player state, climb state, and cast interaction.
3. Apply the map-type-specific forced jump.
4. Play guarded visual/audio hooks after the forced movement call succeeds. For double-jump effects, capture the player world position before applying force, play `positionEffectRuid` with `_EffectService:PlayEffect(...)` at that fixed position, and play `attachedEffectRuid` with `_EffectService:PlayEffectAttached(...)` on the player. Use separate options for each effect: the fixed position effect resolves order with `positionEffectOrderOffset`, and the attached effect resolves order with `attachedEffectOrderOffset`.
5. Consume one charge only after the movement call succeeds.
6. Reset charges on a real airborne-to-grounded transition, not on a timer.
7. Log integer `skillId`, map mode, Body type, grounded state, charge before/after, chosen power, effect hook result, and success/failure.

### API Boundary

- `MovementComponent:Jump()` returns a boolean, but its API does not promise an airborne jump. Do not assume it implements double jump.
- MapleTile exposes `RigidbodyComponent:JustJump(Vector2 jumpRate)`, which returns a boolean and is the first API to verify for a forced second jump.
- SideViewRectTile has no documented `JustJump` equivalent. A SideView implementation must be proven against the live `SideviewbodyComponent` behavior; do not copy the MapleTile call or claim success without `play` + positive logs.
- Never disable `PlayerControllerComponent` or zero the whole velocity vector to implement the jump. That can freeze gravity. If horizontal speed must be cleared, preserve Y.
- For a `SetForce`-based double jump with `fallDampingPolicy = "curve"`, calculate vertical force through a reusable helper. The helper reads only downward `RealMoveVelocity.y`, converts it into a normalized fall ratio, subtracts the configured damping power from `verticalPower`, then clamps to the configured vertical force range:

```lua
method number CalculateDoubleJumpVerticalForce(table data, Vector2 realMove)
    local fallAmount = math.max(-realMove.y, 0)
    local fallRatio = 0
    if data.fallDampingPolicy == "curve" and fallAmount > 0 then
        fallRatio = fallAmount / (fallAmount + data.fallDampingSoftness)
    end
    local requestedForceY = data.verticalPower - data.fallDampingPower * fallRatio

    return self:ClampNumber(requestedForceY, data.minVerticalForce, data.maxVerticalForce)
end
```

Because the native docs do not specify `JustJump`'s mid-air eligibility or a SideView forced-jump method, treat both as runtime verification requirements, not assumptions.

## Type 2 — `teleport_skill`

### Teleport enforcement IDs

Before implementation, instantiate `TP-01` preflight/current-role map, `TP-02` direction and horizontal landing, `TP-03` vertical landing and cancellation, `TP-04` success-only side effects/cooldown, `TP-05` client-first authority topology, and `TP-06` runtime evidence as separate ledger rows. Map each ID to the exact section below and to named evidence before editing.

`TP-06` passes only when `T1`–`T10` and every applicable cast-interaction row in [../verification/movement-verification-harness.md](../verification/movement-verification-harness.md) have concrete observations. Missing Maker access is `BLOCKED`, not inferred PASS and not `N/A`. Follow the fail-closed transition in [../execution-core.md](../execution-core.md#priority-enforcement-gates--fail-closed).

**MUST — default binding:** Add the teleport's `SkillBindingData` row with `keyName = "F"`. Keep this value in the binding DataSet rather than hardcoding `KeyboardKey.F` in the executor. Use a different key only when the user explicitly requests it or after an existing `F` binding collision is reported and resolved.

### Data

```lua
{
    id = 2002,
    name = "teleport",
    familyId = _SkillCatalogLogic.FamilyMovement,
    type = "teleport_skill",
    cooldown = 0.4,
    targetMapMode = nil,
    allowDuringAttack = true,
    allowWhileHit = false,
    allowWhileDead = false,
    allowWhileClimbing = false,

    distance = 1.8, -- world units; 1 unit = 100 px

    -- MapleTile landing tuning (ignored on RectTile / SideViewRectTile, which just move):
    landingSearchDistance = 1.3, -- how far to look for a foothold to land on
    footprintHalfHeight = 0.35,  -- horizontal probe start offset above the destination
    landingSurfaceOffset = 0.0,  -- added to the foothold surface Y (pivot tuning)

    -- Executor policy shared by this type (not currently a DataSet column):
    -- horizontalLandingClearance = 0.03,

    animationKey = "",
    effectRuid = "",
    soundRuid = "",
}
```

Direction is not stored in data: it is read from the held arrow key at cast time (4-directional, no diagonal).

### Runtime Contract

1. Resolve the teleport direction from the arrow held at cast time: one of left / right / up / down, strictly 4-directional. No arrow, opposite arrows, or a diagonal combination is treated as no direction and the cast does nothing.
2. Gate the cast on player state (dead / hit / climbing), attack-cast interaction, and a cooldown check.
3. Resolve the destination and its landing per axis, because MapleTile landing differs by axis (see Landing model):
   - a horizontal teleport first tries the full `distance`, may pass through intermediate walls, and falls back to a wall face or the current foothold edge when the full-distance point has no floor;
   - a vertical teleport moves to the farthest horizontal foothold found within the teleport distance above or below;
   - on RectTile / SideViewRectTile there is no foothold system, so the move applies directly.
   Cancel the cast only when the chosen direction has no valid direct landing or axis-specific fallback.
4. Apply relocation through `MovementComponent:SetWorldPosition(Vector2)`, which works regardless of the active Body. Do not write `TransformComponent.WorldPosition` on a physics Body.
5. Stamp the cooldown only after a move actually happens; a cancelled cast must not start the cooldown.
6. Play guarded visual / audio hooks only after the move succeeds.
7. Log the resolved direction, origin, final destination, and the reason a cast was cancelled.

### Landing model (MapleTile)

MapleTile terrain is footholds, not a tile grid, so a teleport lands on a foothold rather than at a raw point. Horizontal and vertical teleport locate that foothold differently because of ray geometry, which is why they stay separate handlers instead of sharing one probe:

- A horizontal teleport uses a path ray for vertical-wall candidates and a downward ray for supported landing candidates. Intermediate walls may be crossed; wall and ledge fallbacks preserve a supported endpoint when the full-distance target has no floor.
- A vertical teleport casts along the travel direction and selects the farthest horizontal foothold within the configured distance. It does not use the horizontal wall/ledge fallback pipeline.

Reusing the horizontal downward probe for an upward teleport is a classic mistake: it searches below a proposed point instead of collecting the platforms crossed by the upward path. When no horizontal foothold is found in the requested vertical direction, cancel the cast.

#### Canonical horizontal feel

The canonical horizontal teleport is permissive along the travel path and conservative at the landing. It should feel like a blink that can cross walls, while still ending flush against a wall or safely at a ledge when the full-distance destination is unsupported.

Resolve left/right in this order:

1. Compute `probeY = origin.y + footprintHalfHeight` and the raw full-distance `targetX = origin.x + dirX * distance`.
2. Cast `RaycastAll(Vector2(origin.x, probeY), Vector2(dirX, 0), distance)` and keep the returned footholds as **path candidates**. Classify only `IsVertical()` results as wall candidates. Do not trust the returned order; compute each wall's signed travel distance explicitly.
3. Intermediate walls do not block the teleport. Only when a wall lies within `horizontalLandingClearance` of the raw endpoint, move the endpoint to the far side of that wall: `wallX + dirX * clearance`. This avoids leaving the player exactly on the wall line without turning the first wall into a hard blocker.
4. From the resolved `targetX`, cast downward by `landingSearchDistance`. Among horizontal foothold candidates, select the closest non-negative surface distance and snap Y to `GetYByX(targetX) + landingSurfaceOffset`.
5. If that direct landing exists, use it even when one or more walls were crossed. This is the wall-pass-through case.
6. If the full-distance point has no floor, inspect the path wall candidates as fallbacks. For each wall, probe downward at its near side, `wallX - dirX * clearance`; among candidates with valid floor, choose the farthest wall in the requested direction. This preserves the feeling of teleporting up to a wall instead of cancelling early.
7. If no wall fallback has floor, resolve the **current platform's terminal edge in the travel direction** (see the Foothold segment-chain note below), and when it is within `distance`, land at that edge minus `dirX * clearance`, with Y from `GetYByX`. This turns an unsupported full-distance target into a safe ledge snap instead of a cancellation or fall. **`RigidbodyComponent:GetCurrentFoothold()` alone returns only the single segment under the player — its endpoint is frequently an interior seam, not the platform's cliff edge.**
8. A wall/ledge fallback may resolve to the player's current position. Treat that as a successful teleport: apply `SetWorldPosition`, cooldown, effect, and sound normally. Repeated casts while already touching a wall or ledge should continue to fire and feel responsive.
9. Cancel only when direct landing, wall fallback, and current-foothold-edge fallback all fail.

> **Foothold segment-chain note (MapleTile) — the current foothold is one segment, not the whole platform.** A MapleTile platform is a **chain of connected foothold segments**, not a single segment. `RigidbodyComponent:GetCurrentFoothold()` returns only the segment directly under the player, so its `StartPoint`/`EndPoint` is frequently an **interior seam** shared with the next connected segment — landing there snaps the player a few units away, or nearly in place, **not** to the platform's cliff edge. To reach the actual cliff edge, walk the connected neighbors in the travel direction until a segment has **no connected continuation** on that side; that segment's outer endpoint is the true edge. This is the single-segment assumption that most often breaks the ledge fallback in practice. Discover and verify the real chain/neighbor API before writing it (e.g. a prev/next link on the foothold object, or an ordered platform foothold list) — do not assume `GetCurrentFoothold()` is the whole platform, and do not infer the chain shape from these docs; dump the actual footholds first and read their real geometry.

Keep candidate roles explicit rather than merging them into an untyped array: path-ray vertical footholds describe walls, while downward-ray horizontal footholds validate support. `RaycastAll` does not document result ordering, so select by calculated distance, never by the first or last table entry.

Canonical selection sketch:

```lua
local wallCandidates = footholdComp:RaycastAll(pathOrigin, Vector2(dirX, 0), data.distance)
local directLanding = ProbeNearestFloor(resolvedTargetX)
if directLanding ~= nil then
    return directLanding -- walls along the path were crossed
end

local wallLanding = SelectFarthestSupportedWallNearSide(wallCandidates)
if wallLanding ~= nil then
    return wallLanding
end

return ResolveCurrentFootholdEdgeOrNil()
```

Recommended helper split:

| Helper responsibility | Selection rule |
| Helper responsibility | Selection rule |
|---|---|
| Horizontal resolver | Owns the precedence: direct supported target → farthest supported wall near-side → current foothold edge → cancel. |
| Endpoint-wall selector | From path candidates, selects only a vertical wall overlapping the raw endpoint; intermediate walls remain pass-through. |
| Nearest-floor selector | From one downward `RaycastAll`, selects the horizontal foothold with the smallest non-negative probe distance. |
| Wall-fallback selector | Evaluates vertical path candidates without relying on table order and returns the farthest wall near-side that has floor below it. |
| Current-edge resolver | Follows the current platform's foothold **chain** in the requested direction to the terminal (unconnected) endpoint — not just `GetCurrentFoothold()`'s single-segment `StartPoint`/`EndPoint`, which may be an interior seam — then applies the small inward clearance. Verify the actual chain/neighbor API; see the Foothold segment-chain note. |
| Clearance helper | Returns the shared `0.03` policy value so wall and ledge tuning cannot silently diverge. |

Do not replace the ledge fallback with a large character-radius inset. The tuned default uses only `0.03` world units, enough to stay off the exact endpoint while remaining visually attached to it.

#### Vertical feel

A vertical teleport casts `RaycastAll` from the origin along up/down and considers horizontal footholds in that direction. Compute signed travel distance for every valid hit and choose the **farthest** foothold within `distance`; do not rely on `RaycastAll` ordering. Snap to `GetYByX(origin.x) + landingSurfaceOffset`. Keep this behavior separate from horizontal wall/ledge fallbacks.

## Client-First Execution and Server Use Validation

Player movement in this project is executed by the owning client first. Treat that as the engine-facing movement contract, not as optional prediction: delaying `SetWorldPosition` / `SetForce` until a server response makes the skill feel unresponsive and does not match the current player-movement pipeline.

1. The Player Movement Adapter performs local input, state, map-mode, attack-interaction, charge, and local-cooldown gating.
2. Resolve direction and all movement values from the normalized catalog row identified by the integer `skillId`. The client computes the destination or force locally and immediately applies it through the active Body / `MovementComponent`.
3. Only after movement succeeds, stamp the local cooldown, play guarded effects/sound, and call the `@ExecSpace("Server")` request with the integer `skillId`.
4. Send only `skillId` to the server. Never send client-supplied distance, power, cooldown, direction, or destination; both sides read the configured values from the catalog row.
5. The server verifies the sender owns the player, resolves the same row, checks dead/HIT/climbing/attack policy, target map mode, and the server cooldown, then stamps the server cooldown. This is server-side **use validation/accounting**, not server-authoritative relocation.
6. Do not re-run the teleport/jump on the server, wait for an acceptance response, roll the client back when validation fails, or add a per-skill destination reconciliation RPC. The engine's player-movement synchronization propagates the owning client's resulting position to other clients.
7. Keep local gating equivalent to the server gates so ordinary casts are not locally executed and then rejected. The server gate protects skill-use accounting and server-owned gameplay interactions; it does not retroactively undo movement already executed by the owning client.
8. Send the server request only after a real movement succeeds. A cancelled teleport or failed double jump must neither stamp local/server cooldown nor play effects/sound.
9. Keep one state owner per value. Air-jump charge belongs to the movement adapter; server cooldown accounting belongs to the Movement Registry; attack-cast state belongs to the attack adapter.

Canonical call order:

```text
client gate → resolve from catalog → SetWorldPosition/SetForce succeeds
→ local cooldown/effect/sound → RequestUseMovementSkill(skillId)
→ server sender/state/map/cooldown validation and cooldown stamp
→ engine player-movement synchronization
```

### Forbidden prediction/reconciliation topology

The call order above is exact for this project. Do not reinterpret "server use validation" as server-authoritative movement prediction or reconciliation.

Reject an implementation when any of these are present:

- The client request sends `direction`, requested origin, destination, power, distance, or a `predictionId` instead of only `skillId`.
- A server method calls the teleport destination resolver or `MovementComponent:SetWorldPosition` / Body force for the player's movement skill.
- The server sends an accepted position back to the client.
- The client has `PendingPredictionId`, `ApplyTeleportResult`, positional confirmation, rollback, or snap-to-server-result logic.
- The client waits for a server result before stamping local cooldown or playing a successful movement effect/sound.
- A pending server response blocks every later movement cast with no local lifecycle cleanup.
- The input component hardcodes `KeyboardKey.F` / `skillId = 2002` instead of resolving `SkillBindingData` through the shared family router.
- The input router lacks a local-player ownership check, or the server request lacks `senderUserId == PlayerComponent.UserId` validation.

The required bootstrap shape is:

```text
local-player shared router resolves binding
→ Player Movement Adapter performs local state/map/cooldown/direction/landing gates
→ local SetWorldPosition/SetForce succeeds
→ local cooldown/effect/sound
→ RequestUseMovementSkill(skillId)
→ server sender/state/map/cooldown validation and cooldown stamp only
```

Static review must confirm there is no movement-position RPC payload and no server-side relocation before runtime verification begins.

## Verification Matrix

This matrix is **completion-blocking**, enforced through [../verification/movement-verification-harness.md](../verification/movement-verification-harness.md): every row below maps to a harness scenario with required runtime evidence, and a movement skill is not complete until each applicable row has captured evidence in the harness ledger. Static inspection or one lucky cast cannot close a landing/cancel/charge row. After implementation, follow `msw-scripting/references/verify-checklist.md` and test positive behavior, not just absence of errors.

Double jump:

- grounded jump does not consume an air charge;
- first airborne use succeeds and consumes exactly one charge;
- extra airborne use is rejected;
- landing resets the charge once;
- ledge fall still permits the configured air jump;
- MapleTile and SideViewRectTile are tested separately if both are supported.

Teleport:

- left / right / up / down each teleport in the correct direction; a diagonal or no-direction input does nothing;
- horizontal teleport reaches the full-distance supported target even when one or more intermediate vertical walls are crossed;
- when the full-distance target has no floor but a path wall has supported ground on its near side, horizontal teleport chooses the farthest supported wall and stops `0.03` world units before it;
- casting again while already touching that wall still succeeds at the same position and plays cooldown/effect/sound;
- when no wall fallback exists and the full-distance target is beyond the current foothold, horizontal teleport moves to the requested-direction foothold endpoint minus `0.03` instead of falling or cancelling;
- casting again while already at that ledge still succeeds without placing the player past the foothold endpoint;
- multiple wall candidates are tested without trusting `RaycastAll` order; an unsupported farther wall does not displace a supported valid fallback;
- vertical teleport lands on the farthest foothold above (up) or below (down) within `distance`, and cancels when there is none;
- down teleport does not pierce the foothold; up teleport does not float above it;
- cooldown rejects a re-cast within the window; a same-position wall/ledge fallback is a successful cast and starts cooldown, while a truly cancelled cast does NOT;
- remote clients observe the owning client's final position through the engine's player-movement synchronization; no movement-skill destination/reconciliation RPC was added.

For both:

- dead, hit, climbing, and attack-casting interaction;
- with `allowDuringAttack = false`, attack casting blocks only that movement row;
- with `allowDuringAttack = true`, the movement executes while the attack animation remains active and the attack adapter still restores its own cached input state at animation end;
- repeatedly alternate/overlap attack and movement inputs and confirm no movement adapter code clears the attack's `ActiveLocalCastId`, animation handler, `StateComponent` lock, or cached `InputSpeed`;
- build logs before play;
- positive runtime logs for handler selection and movement execution;
- the server receives `RequestUseMovementSkill(skillId)` only after successful local movement and stamps its cooldown without executing a second relocation;
- a cancelled teleport and a failed double jump send no server request and stamp neither local nor server cooldown;
- no claim of success without Maker MCP `play` and runtime `logs`.
