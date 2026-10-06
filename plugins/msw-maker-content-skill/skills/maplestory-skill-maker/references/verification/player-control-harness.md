# Player Control Verification Harness — MUST Contract

**Enforcement:** evidence source — defines the `P0`–`P14` rows that close `PAP-04`.

Use this harness for every attack skill. Also use it for any movement skill that can overlap an attack, changes jump/cast eligibility, changes player movement or facing, or plays/suppresses a player animation.

Read [../player/casting.md](../player/casting.md) first. This harness does not prescribe filenames or one internal architecture. It proves that the chosen architecture produces the required player behavior without damaging physics or leaving stale locks.

## Contents

- [Completion Rule — absolute](#completion-rule--absolute)
- [1. Capability Discovery Gate — before editing](#1-capability-discovery-gate--before-editing)
- [2. Fixed Observable Behavior Contract](#2-fixed-observable-behavior-contract)
- [3. Required Runtime Scenarios](#3-required-runtime-scenarios)
- [4. Runtime Evidence Instrumentation](#4-runtime-evidence-instrumentation)
- [5. Required Handoff Ledger](#5-required-handoff-ledger)

## Completion Rule — absolute

The implementation **MUST NOT** be called complete until every applicable static row and runtime scenario has explicit evidence.

- Component presence is not behavioral proof. A row explicitly marked `Static:` is closed by cited locations rather than by presence — see the [Evidence Boundary](non-negotiable-presentation-gates.md#evidence-boundary--instrumented-facts-versus-playtest).
- Extending `PlayerControllerComponent` is not a pass unless the active player actually uses that controller and its gates execute.
- “Input seemed locked,” “the animation played,” and “no errors were logged” are not passing evidence.
- If Maker runtime tools or required test inputs are unavailable, mark the affected rows `BLOCKED`, report **implemented but verification blocked**, and do not use completion language.
- An unapproved change to observable policy is a failure even if the replacement behavior appears reasonable.
- Split every row by the [Evidence Boundary](non-negotiable-presentation-gates.md#evidence-boundary--instrumented-facts-versus-playtest): rows marked *Instrumented* are the agent's to close from logs and compared numbers, and a row's on-screen verdict is the user's playtest, reported as pending rather than inferred into `PASS`.

## 1. Capability Discovery Gate — before editing

Map these capabilities onto the target project. Use actual paths and symbols; do not assume the reference filenames exist.

| Capability | Required evidence | Status |
|---|---|---|
| Effective native input owner | The component/path that actually receives ordinary movement, jump, and down-jump input on the player | OPEN |
| Single-controller ownership | Entity/model evidence that no default and custom controller compete for the same base action ownership | OPEN |
| Native jump gate | API-grounded hook that allows or rejects ordinary jump/down-jump during a cast before Body physics changes | OPEN |
| Horizontal movement lock | Owner that caches the exact input speed, stops grounded movement, applies the lock, and restores only its own cached value | OPEN |
| Airborne preservation branch | Ground check and branch proving allowed airborne casts do not call `Stop()`, zero `InputSpeed`, or rewrite the Body trajectory | OPEN |
| Facing lock | Owner that freezes cast-time facing and releases only the matching cast | OPEN |
| Animation/state protection | Owner that prevents locomotion state from replacing the active cast presentation and restores state afterward | OPEN |
| Local/server lock separation | Distinct client presentation/input ownership and server authoritative cast ownership | OPEN |
| Cast-instance identity | Monotonic or otherwise unique cast identity carried through request, acceptance/rejection, animation, release, and safety paths | OPEN |
| Cleanup owners | Normal animation end, interruption, rejection, end-play, and safety recovery all converge on idempotent matching-cast cleanup | OPEN |
| Cooldown no-op gate | Local cooldown rejection occurs before any input, state, facing, movement, or animation mutation | OPEN |

If the native input owner, active player composition, or effective jump hook is unknown, stop before implementing the lock. Inspect the actual model/entity and native API. Do not assume that adding a similarly named component makes it active.

### Default and alternative implementation rule

The verified default is one project-specific component extending `PlayerControllerComponent`, replacing the ordinary controller, and intercepting the parameterless `ActionJump()` / `ActionDownJump()` methods. Use it when no exact alternative is already proven.

An alternative implementation is allowed only when all of the following are demonstrated:

1. It intercepts the same effective native jump and down-jump path before Body mutation.
2. It does not disable `PlayerControllerComponent`, `MovementComponent`, gravity, or the entire Body velocity.
3. It has unambiguous single-owner behavior; no parallel controller also handles the input.
4. It honors `allowJumpDuringCast` and `allowAirborneCast` independently.
5. It passes every applicable runtime scenario below.

An invented event, guessed condition name, or unverified `AddCondition` path is not an alternative.

## 2. Fixed Observable Behavior Contract

The following results are mandatory regardless of internal structure.

### Grounded cast

- A locally eligible cast locks immediately without waiting for server round-trip.
- When the skill locks ordinary movement, cache the exact pre-cast input speed, stop current grounded movement, and prevent new horizontal movement for that cast.
- Preserve gravity and vertical physics. Never disable the whole controller/movement component or zero the full Body velocity. Call `MovementComponent:Stop()` and inject `InputSpeed = 0`.
- Reject native jump and down-jump when `allowJumpDuringCast == false`; delegate normal behavior when it is `true`.
- Lock cast-time facing and prevent locomotion state/animation from replacing the cast animation.

### Airborne cast

- Reject the cast without side effects when `allowAirborneCast == false`.
- When `allowAirborneCast == true`, preserve the existing jump/fall trajectory. Do not call `MovementComponent:Stop()`, set `InputSpeed = 0`, or rewrite Body velocity merely because the cast began.

- Continue to apply `allowJumpDuringCast` independently to any new native jump/down-jump request after cast start.

### Release and recovery

- Normal animation completion, interruption, rejection, and safety recovery use one idempotent cleanup capability keyed by cast identity.
- Restore the exact cached `InputSpeed` only when the cast's grounded movement-lock branch captured it. Release the current pipeline's other owned values to their normal state: `StateComponent.Enable = true`, `MovementComponent.Enable = true`, and `FixedLookAt = 0`; disconnect the matching event subscription and clear the matching local active id.
- Never write a fabricated `InputSpeed` from an airborne-preservation or `allowMove` branch that did not cache it.
- A stale callback, rejection, release, or safety timer from cast A must be a no-op after cast B becomes active.
- An input rejected by the known local cooldown must mutate nothing.

## 3. Required Runtime Scenarios

Run every applicable row for each distinct player controller/adapter composition. Player models sharing the same verified component composition and policy pipeline may form one equivalence class; record the grouping.

| ID | Scenario | Required pass evidence |
|---|---|---|
| P0 | Attack animation dispatch variants | Instrumented: an empty attack key emits one native basic-Attack event to the avatar root, a supported native key emits the matching native root event, and any other key emits one one-shot body event — one event per cast, on the logged target entity. Every branch arms the matching end listener after dispatch and the handler is still connected when the clip end is reached. Whether the resulting action looks correct on screen is a playtest item. |
| P1 | Grounded cast, `allowJumpDuringCast = false`, movement key held | Cast locks immediately; horizontal movement stops; gravity remains active; jump and down-jump are rejected; facing and cast animation remain stable. |
| P2 | Grounded cast, `allowJumpDuringCast = true` | Ordinary jump/down-jump reaches the native/base action and behaves normally while the cast remains correctly owned. |
| P3 | Airborne cast, `allowAirborneCast = false` | Cast is rejected before lock, animation, movement, facing, or cooldown mutation. |
| P4 | Airborne cast, `allowAirborneCast = true` | Pre-cast vertical and horizontal trajectory continues without `Stop()`, `InputSpeed = 0`, controller disable, or full-velocity zeroing. |
| P5 | Normal deterministic cast window | Matching cast-id cleanup runs once within the intended window, restores only owned values, and does not wait for the server safety timeout even when the effective action loops or emits no end event. |
| P6 | Cast animation interrupted/replaced | Interruption cleanup restores control without waiting for the safety timeout; later animation-end callbacks do nothing. |
| P7 | Server rejection | `Static:` the rejection handler carries the request `castId`, compares it against the currently active local id, and releases only on a match; the non-matching branch leaves a newer cast's lock untouched. Cite the handler and the comparison. An induced rejection observed at runtime is optional evidence on top, not a requirement. |
| P8 | Repeated casts while holding movement | Many consecutive casts restore the exact speed every time; no walking-in-place or permanent movement loss occurs. |
| P9 | Repeated cooldown input | Every known-cooldown key press is a complete local no-op: no `Stop()`, speed change, state disable, facing lock, subscription, or cast id allocation. |
| P10 | Old release/timer from cast A arrives during cast B | `Static:` every path that can reach a release — normal window timer, animation end, server rejection, safety timer, end-play — carries a `castId` and no-ops when it is not the active one, emitting `STALE_CALLBACK_IGNORED` on that branch. Cite each path and its comparison; a missing path is a `FAIL`. An induced overlap observed at runtime is optional evidence on top. |
| P11 | `allowDuringAttack` movement skill during an attack, when supported | Movement skill performs only its allowed relocation/force; it does not release the attack's state/facing/animation lock. |
| P12 | End-play/removal while locked | Event handlers/timers are safely disconnected or invalidated and no later callback mutates a destroyed/replaced player. |
| P13 | Cast window versus clip length, once per resolved animation key | Instrumented: the resolved window from [../player/casting.md](../player/casting.md#cast-window-resolution) is greater than or equal to the measured clip duration, and the logged release lands at or after that window and before the safety timeout. Both numbers and their sources appear in `WINDOW_RESOLVED` and `LOCK_RELEASE`. A window shorter than the clip is a `FAIL` even when every cast-id and restore rule passes. Whether the swing then *looks* uncut is a playtest item. |
| P14 | Cast started from a held-direction `MOVE`, not from `IDLE` | Instrumented: no locomotion state transition is logged between `ANIMATION_DISPATCH` and `LOCK_RELEASE` for that `castId`, the cached input speed is restored exactly once at release, and the armed end handler is still connected when the clip end is reached. Passing only from an `IDLE` start does not satisfy this row. Whether a walk animation is visible on screen is a playtest item that this proxy predicts but does not replace. |

## 4. Runtime Evidence Instrumentation

Use focused logs with stable labels. Include player identity, `skillId`, `castId`, grounded/airborne status, current input speed, state enablement, facing lock, and the decision relevant to the event. Do not add per-frame spam.

| Label | Emit when |
|---|---|
| `MSM_PLAYER_HARNESS CAST_ELIGIBLE` | Local eligibility and cooldown gates pass, before lock mutation |
| `MSM_PLAYER_HARNESS LOCK_BEGIN` | The matching cast acquires movement/state/facing ownership |
| `MSM_PLAYER_HARNESS MOVE_LOCKED` | Grounded horizontal lock is applied; include cached and locked speed |
| `MSM_PLAYER_HARNESS AIRBORNE_PRESERVED` | Allowed airborne branch deliberately preserves movement/Body values |
| `MSM_PLAYER_HARNESS JUMP_DECISION` | Jump/down-jump is allowed or rejected; include policy and whether base/native execution was invoked |
| `MSM_PLAYER_HARNESS ANIMATION_DISPATCH` | The matching cast animation is dispatched and its end listener is armed |
| `MSM_PLAYER_HARNESS WINDOW_RESOLVED` | The cast window is resolved for this cast; include the resolved duration, its source (project default, user-confirmed, or measured), and the measured clip duration it was compared against |
| `MSM_PLAYER_HARNESS LOCOMOTION_SUPPRESSED` | A locomotion state change is requested or blocked while a cast owns presentation; include the requesting source and the active `castId` |
| `MSM_PLAYER_HARNESS LOCK_RELEASE` | Matching-cast cleanup restores owned properties; include restored values and reason |
| `MSM_PLAYER_HARNESS STALE_CALLBACK_IGNORED` | A callback/release/rejection/timer is rejected because its cast identity is stale |
| `MSM_PLAYER_HARNESS COOLDOWN_NOOP` | Known local cooldown rejects input before any presentation/input mutation |

Capture these from an actual Maker play session. Remove temporary test-only noise after evidence is captured, then refresh and re-check build logs.

## 5. Required Handoff Ledger

Include this result table in the final handoff:

| Row | Static location/composition | Runtime evidence | Result |
|---|---|---|---|
| Family-aware attack animation dispatch | path + event target | P0 | PASS/FAIL/BLOCKED |
| Effective input owner / no duplicate controller | path + entity/model evidence | P1/P2 | PASS/FAIL/BLOCKED |
| Jump/down-jump policy | path + symbol/API | P1/P2 | PASS/FAIL/BLOCKED |
| Grounded movement/physics lock | path + symbol | P1/P5 | PASS/FAIL/BLOCKED |
| Airborne eligibility and trajectory | path + symbol | P3/P4 | PASS/FAIL/BLOCKED |
| Facing and animation-state protection | path + symbol | P1/P5/P6 | PASS/FAIL/BLOCKED |
| Exact cleanup/restoration | path + symbol | P5/P6/P8 | PASS/FAIL/BLOCKED |
| Cast identity / stale callback safety | path + symbol | P7/P10 | PASS/FAIL/BLOCKED |
| Cooldown no-op | path + symbol | P9 | PASS/FAIL/BLOCKED |
| Movement-skill overlap | path + symbol | P11 | PASS/FAIL/BLOCKED/N/A |
| End-play cleanup | path + symbol | P12 | PASS/FAIL/BLOCKED |

Only `PASS` closes a required row. An absent `PlayerControllerComponent` subclass with no proven equivalent gate fails the first two rows. `BLOCKED`, `NOT RUN`, inferred behavior, or a caveat keeps the implementation unfinished.
