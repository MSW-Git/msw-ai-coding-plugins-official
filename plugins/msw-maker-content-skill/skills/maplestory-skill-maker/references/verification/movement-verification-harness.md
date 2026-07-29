# Movement Skill Verification Harness — MUST Contract

Use this harness for **every** movement skill (`double_jump_skill`, `teleport_skill`, and future movement types). It converts the behavior in [../movement/skills.md](../movement/skills.md) into completion-blocking evidence gates, exactly the way [monster-visual-harness.md](monster-visual-harness.md) does for attack presentation. It applies whether the project uses the reference filenames or completely different scripts.

This file does not replace [../movement/skills.md](../movement/skills.md). Read that contract first; this harness proves that the adapted implementation actually satisfies it. It also does not replace [player-control-harness.md](player-control-harness.md): run that one too whenever the movement skill affects attack overlap, jump/cast gating, movement, facing, or player animation.

## Contents

- [Completion Rule — absolute](#completion-rule--absolute)
- [1. Capability Discovery Gate — before editing](#1-capability-discovery-gate--before-editing)
- [2. Static Gate — after editing, before play](#2-static-gate--after-editing-before-play)
- [3. Required Runtime Scenarios](#3-required-runtime-scenarios)
- [4. Runtime Evidence Instrumentation](#4-runtime-evidence-instrumentation)
- [5. Required Handoff Ledger](#5-required-handoff-ledger)

## Completion Rule — absolute

The implementation **MUST NOT** be called complete unless every applicable static row and runtime scenario below has explicit evidence.

- A code path that looks correct is not runtime evidence.
- A move that "usually lands right" is not a pass. Landing, cancel, wall, ledge, and pierce rows require deterministic per-direction evidence, not one lucky cast.
- "No errors in logs" is not a passing result.
- A legacy movement helper, an architecture-specific shortcut, or a post-implementation caveat cannot waive a failed row.
- If runtime tools are unavailable, mark runtime rows `BLOCKED`, report **implemented but verification blocked**, and do not use completion language.
- The single most common way this harness fails is that it was never run: a teleport that relocates the player with a raw `origin + dir * distance` point and no foothold resolution will "work" in flat open space and fail every landing row here. Running these scenarios is the gate that catches it before handoff.

## 1. Capability Discovery Gate — before editing

Discover roles and capabilities from the target project. Never require a specific filename, component script name, or method name. Create this ledger before implementation and fill it with actual paths/symbols.

| Capability | Required evidence | Status |
|---|---|---|
| Active Body type | `MapComponent.TileMapMode` read through `MapBuilder`; the resolved Body (`Rigidbody`/`Kinematic`/`Sideviewbody`) for every target map | OPEN |
| Shared binding router | Code location resolving `SkillBindingData` → `familyId + skillId` with a local-player ownership check; proof the movement input is NOT a hardcoded `KeyboardKey`/`skillId` | OPEN |
| Player Movement Adapter | `@Component` on the player owning local gating, air-jump charge, active-Body calls, and client effect/animation | OPEN |
| Movement Registry | `@Logic` owning movement rows, type dispatch, per-caster cooldown, and server **use validation/accounting only** | OPEN |
| Foothold/landing API | For MapleTile: the `RaycastAll` / `GetCurrentFoothold` / `GetYByX` surface used to resolve landings; proof the resolver exists per axis (horizontal vs vertical) | OPEN |
| Relocation call | Proof relocation uses `MovementComponent:SetWorldPosition(Vector2)` (or the verified forced-jump API), never a `TransformComponent.WorldPosition` write on a physics Body | OPEN |

Any missing per-axis landing resolver, missing ownership check, or unproven forced-jump API is a **hard stop before writing movement code**. Fix the capability first or ask the user for a scoped decision.

## 2. Static Gate — after editing, before play

Prove each invariant with code locations. Method names may differ; ownership and topology may not.

### Client-first execution & forbidden reconciliation

Due to the nature of the MSW engine, the player must move on the client to synchronize with the server. Therefore, it must be operated on the client.

1. The call order is exactly: local gate → resolve from catalog → local `SetWorldPosition`/`SetForce` succeeds → local cooldown/effect/sound → `RequestUseMovementSkill(skillId)` → server sender/state/map/cooldown validation and cooldown stamp only.
2. The server request payload carries **only `skillId`** — no direction, origin, destination, power, distance, or `predictionId`.
3. No server method resolves the teleport destination or calls `SetWorldPosition`/Body force for the player's movement skill; the server does not send an accepted position back.
4. The client has no `PendingPredictionId`, `ApplyTeleportResult`, rollback, or snap-to-server-result logic.
5. A cancelled teleport / failed double jump sends no server request and stamps neither local nor server cooldown.

### Teleport landing resolution (MapleTile)

6. Horizontal and vertical teleport use **separate resolvers**; the vertical path does not reuse the horizontal downward probe.
7. Horizontal precedence is explicit: direct supported target → farthest supported wall near-side (`- dirX * clearance`) → current-foothold edge (`- dirX * clearance`) → cancel. Intermediate walls are pass-through; only a wall within `horizontalLandingClearance` of the raw endpoint moves the endpoint.
8. Vertical selects the **farthest** horizontal foothold within `distance` along the travel direction and snaps Y to `GetYByX(origin.x) + landingSurfaceOffset`; it cancels when none exists.
9. Candidate selection computes signed travel distance explicitly and never trusts `RaycastAll` ordering.
10. The cast is cancelled (no move, no cooldown, no effect) only when every applicable fallback fails.

### Double jump

11. The grounded first jump is left to the native `PlayerControllerComponent`; the forced jump uses the verified per-Body API (`RigidbodyComponent:JustJump` on MapleTile; a runtime-proven Sideview path — never an assumed copy).
12. `PlayerControllerComponent` is never disabled and the whole velocity vector is never zeroed; if horizontal speed is cleared, Y is preserved.
13. A charge is consumed only after the forced movement call succeeds; charges reset on a real airborne→grounded transition, not on a timer.

## 3. Required Runtime Scenarios

> 🚨 **[Important Notice] The 20 scenarios below regarding teleport, double jump, and cast interaction are the highest-quality pass ledgers prescribed for practical runtime verification. Please thoroughly verify the conditions and required pass evidence for each scenario.**
>
> **Run every applicable scenario against each supported map mode. Do not infer a scenario from an unrelated ordinary play session.**

### Teleport

| ID | Scenario | Required pass evidence |
|---|---|---|
| T1 | Each of left / right / up / down | Teleports in the correct direction; a diagonal or no-direction input does nothing and stamps no cooldown. |
| T2 | Full-distance target has floor, walls in the path | Reaches the full-distance supported target **even though one or more intermediate walls are crossed** (wall pass-through). |
| T3 | Full-distance target has no floor, a path wall has floor on its near side | Lands at the **farthest supported wall**, stopping `horizontalLandingClearance` (`0.03`) before it — does not pass through and fall. |
| T4 | Re-cast while already touching that wall | Succeeds at the same position and plays cooldown/effect/sound (a same-position fallback is a successful cast). |
| T5 | No wall fallback, full-distance beyond the current foothold | Moves to the requested-direction foothold **endpoint minus `0.03`** instead of falling or cancelling; does not place the player past the endpoint. |
| T6 | Multiple wall candidates, unordered `RaycastAll` | A farther **unsupported** wall does not displace a nearer **supported** valid fallback. |
| T7 | Vertical up | Lands on the farthest foothold above within `distance`; **does not float above it**; cancels when there is none. |
| T8 | Vertical down (incl. after a jump) | Lands on the farthest foothold below within `distance`; **does not pierce the floor**; cancels when there is none. |
| T9 | Off a cliff / into a gap with no valid landing | The cast is **cancelled** — no relocation into the air, no cooldown, no effect. |
| T10 | Cooldown / remote sync | A re-cast inside the window is rejected; remote clients observe the owning client's final position through engine sync with **no movement-skill destination/reconciliation RPC added**. |

### Double jump

| ID | Scenario | Required pass evidence |
|---|---|---|
| J1 | Grounded jump | Does not consume an air charge. |
| J2 | First airborne use | Succeeds and consumes exactly one charge. |
| J3 | Extra airborne use | Rejected once charges are spent. |
| J4 | Landing | Resets the charge exactly once, on a real airborne→grounded transition. |
| J5 | Ledge fall (walked off, never jumped) | Still permits the configured air jump. |
| J6 | Each supported map mode | MapleTile and SideViewRectTile verified separately; the Sideview forced-jump API is proven by `play` + positive logs, not assumed. |

### Cast interaction (both types)

| ID | Scenario | Required pass evidence |
|---|---|---|
| C1 | `allowDuringAttack = false` while attack-casting | The movement binding is ignored for that row only; other bindings still work. |
| C2 | `allowDuringAttack = true` while attack-casting | Movement executes while the attack animation stays active; the attack adapter still restores its own cached input state at animation end. |
| C3 | Rapidly alternate/overlap attack and movement inputs | No movement-adapter code clears the attack's `ActiveLocalCastId`, animation handler, `StateComponent` lock, or cached `InputSpeed`. |
| C4 | Dead / hit / climbing | Use is gated per the row's `allowWhileDead`/`allowWhileHit`/`allowWhileClimbing` policy. |

## 4. Runtime Evidence Instrumentation

Use focused temporary logs with stable event labels. Remove them after evidence capture unless the user requests retained diagnostics.

| Label | Emit when |
|---|---|
| `MSM_MOVE BINDING_RESOLVED` | The shared router resolves a movement binding; include `skillId`, `familyId`, and local-player ownership result |
| `MSM_MOVE GATE_RESULT` | Local gating decides accept/reject; include dead/hit/climb/attack-interaction/cooldown/charge results |
| `MSM_MOVE TELEPORT_RESOLVE` | A teleport destination is resolved or cancelled; include direction, origin, resolved target (or `CANCELLED`), and which precedence branch won (direct/wall/ledge) |
| `MSM_MOVE RELOCATE_APPLIED` | `SetWorldPosition` runs; include final position and Body type |
| `MSM_MOVE JUMP_APPLIED` | A forced jump force is applied; include charge before/after and the clamped vertical force |
| `MSM_MOVE COOLDOWN_STAMPED` | Local/server cooldown is stamped; include which side and the reason a cancelled cast stamped nothing |
| `MSM_MOVE SERVER_VALIDATE` | The server use-validation runs; include sender-ownership result and that no relocation was executed |

Capture logs from the actual Maker play session. Source inspection or fabricated logs cannot fill these rows.

## 5. Required Handoff Ledger

Include a compact ledger in the final handoff.

| Row | Static location | Runtime evidence | Result |
|---|---|---|---|
| Client-first topology / no reconciliation | path + symbol | T10 + SERVER_VALIDATE evidence | PASS/FAIL/BLOCKED |
| Teleport horizontal landing (pass-through/wall/ledge/cancel) | path + symbol | T2/T3/T4/T5/T6/T9 evidence | PASS/FAIL/BLOCKED/N/A |
| Teleport vertical landing (no float / no pierce / cancel) | path + symbol | T7/T8 evidence | PASS/FAIL/BLOCKED/N/A |
| Direction gating | path + symbol | T1 evidence | PASS/FAIL/BLOCKED/N/A |
| Double-jump charge accounting | path + symbol | J1/J2/J3/J4/J5/J6 evidence | PASS/FAIL/BLOCKED/N/A |
| Cast interaction / state ownership | path + symbol | C1/C2/C3/C4 evidence | PASS/FAIL/BLOCKED |
| Cooldown | path + symbol | T10/J* cooldown evidence | PASS/FAIL/BLOCKED |

Only PASS closes a required row. BLOCKED, NOT RUN, inferred behavior, or a caveat keeps the implementation unfinished. State the blocker and the exact next verification action instead of weakening the conclusion.
