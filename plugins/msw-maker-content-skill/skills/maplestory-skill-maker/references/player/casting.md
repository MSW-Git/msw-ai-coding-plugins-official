# Casting Input & Animation Lock

**Enforcement:** completion-blocking — `PAP-01`–`PAP-04`. Evidence is the applicable `P0`–`P14` rows of [../verification/player-control-harness.md](../verification/player-control-harness.md).

Every implementation of this contract **MUST** execute [../verification/player-control-harness.md](../verification/player-control-harness.md). Filenames and internal structure may vary; observable input policy, physics preservation, animation/facing ownership, cleanup, and race behavior may not.

Attacker-side input handling, movement lock, and animation-end detection during a skill cast — independent of the damage/judgment logic in [../combat/targeting.md](../combat/targeting.md). This lives entirely on the per-player Player Adapter Component (see [../architecture/framework.md](../architecture/framework.md)) — the damage/judgment logic it's independent of runs in the Registry Logic. See [../../SKILL.md](../../SKILL.md) for the Reference Catalog.

The lock state below is generic (`CastingLockActive`/`CastingSkillId`), not one flag per skill. `CastingSkillId` is the integer `AttackSkillData.id`; resolve its row through `SkillCatalogLogic` to obtain `animationKey`. See [../architecture/framework.md](../architecture/framework.md)'s Casting State Ownership section for why this is one pair of properties, not one pair per skill.

## Contents

- [Cooldown Before Presentation Lock Rule](#cooldown-before-presentation-lock-rule)
- [MUST — Player Skill Animation Dispatch Contract](#must--player-skill-animation-dispatch-contract)
- [Cast Window Resolution](#cast-window-resolution)
- [Cast Instance Ownership Rule (absolute precedence)](#cast-instance-ownership-rule-absolute-precedence)
- [MUST — Player Casting Input & Animation-End Lock Rule (required for every skill)](#must--player-casting-input--animation-end-lock-rule-required-for-every-skill)
- [Extended PlayerController Jump Gate](#extended-playercontroller-jump-gate)
- [Jump-During-Cast and Airborne-Cast Gates (two independent per-skill policies)](#jump-during-cast-and-airborne-cast-gates-two-independent-per-skill-policies)

## Cooldown Before Presentation Lock Rule

An input that is already known to be on cooldown must be a complete local no-op. Check the client-predicted per-skill cooldown **before** generating `castId`, subscribing animation events, disabling State, caching/stopping movement, changing `InputSpeed`, or locking facing.

### Baseline template (required)

- Keep the server cooldown authoritative in the attack Registry.
- Keep a client-only predicted expiry keyed by `skillId` and check it before all presentation/input mutation.
- After all local eligibility gates pass, stamp the predicted cooldown and then apply locks before sending the server request.
- If the server rejects a request for a non-cooldown reason, roll back that request's predicted cooldown and run local cast cleanup. Do not make the player wait for a skill that never executed.
- Never solve this by waiting for server approval before all presentation; that adds round-trip latency to valid casts.

### Authoritative reconciliation (recommended advanced pattern)

Use this when the game needs tight cooldown boundary behavior under latency, rapid repeated input, UI cooldown display, or competitive/server-authoritative timing:

- Store both predicted expiry and the `castId` that stamped it.
- On server success, send `NotifyCastAccepted(castId, skillId, cooldownRemaining)` after authoritative cooldown stamping. Reconcile only if the local prediction still belongs to that id.
- On server cooldown rejection, echo the authoritative remaining duration so the client extends/resynchronizes its prediction.
- On non-cooldown rejection, clear only the matching cast's prediction.
- This project's reference implementation uses the advanced pattern. A simpler project may stop at the baseline, but must still keep known cooldown input side-effect free.

Required regression: hold a movement key and repeatedly press an attack key during its cooldown. There must be no `MovementComponent:Stop()`, `InputSpeed = 0`, State disable, facing lock, or animation subscription until the local cooldown is ready.

## MUST — Player Skill Animation Dispatch Contract

This contract has absolute precedence over `msw-avatar`'s general animation-selection heuristics when implementing this skill pipeline. Implement by **family and capability**, not by requiring reference-project filenames.

### Data preservation

- The catalog/loader **MUST** preserve the raw `animationKey` and **MUST allow a legacy/imported attack row when it is nil or empty**. Empty remains a concrete basic-Attack fallback choice resolved by the Player Adapter, not missing animation data. Which value a row is authored with — the `swingO1` default and the opt-in rule for any other native/custom key — is owned by [../architecture/datasets.md](../architecture/datasets.md#animation-key-authoring-rule).
- Dispatch **MUST** branch first by skill family and then, for attacks, by supported native body-action name vs. custom action id. It MUST NOT branch by `skillId`.

### Attack-family dispatch

- An empty key MUST send one `BodyActionStateChangeEvent` with `ActionState = MapleAvatarBodyActionState.Attack` and `needResetAction = true` to the avatar root. It MUST NOT send an empty custom action and MUST NOT skip animation playback.
- Supported native keys are exactly `stand`, `walk`, `attack`, `hit`, `crouch`, `fall`, `rope`, `ladder`, `dead`, `sit`, `heal`, `alert`, `fly`, and `blink`. Convert the first letter to uppercase, resolve it with `MapleAvatarBodyActionState.CastFrom(...)`, and send one `BodyActionStateChangeEvent` with `needResetAction = true` to the avatar root.
- Every other non-empty key is an explicit custom sprite action id. Send `ActionStateChangedEvent(key, key, 1, SpriteAnimClipPlayType.Onetime)` to `AvatarRendererComponent:GetBodyEntity()`.
- Keep the native-key classifier centralized in the Player Adapter. Do not duplicate slightly different native-name lists in the catalog, Registry, or per-skill methods.

### Movement-family dispatch


- Empty key **MUST** send no animation event.
- A supported non-empty movement key **MUST** use the explicit custom one-shot body-entity path. It MUST NOT inherit the attack family's empty-key fallback.

### Playback and cleanup ownership

- The client presentation owner **MUST** disable `StateComponent` before requesting/playing the cast so locomotion cannot overwrite it, and MUST be the only side that restores State, input speed, facing, and animation handlers.
- Subscribe to `SpriteAnimPlayerEndEvent` only for an effective action proven to be one-shot and only after dispatching that cast's event; subscribing at raw input time is forbidden. Empty/native Attack may resolve to a loop and MUST NOT depend on this event for normal release.
- Every animation notification, end callback, rejection, interruption, and safety release **MUST** carry or capture the same `castId` and MUST be a no-op when it is no longer the active local/server cast.
- Normal end, interruption, rejection, and safety timeout **MUST** converge on one idempotent local cleanup path.
- Do not automatically mutate `AvatarStateAnimationComponent` mappings with `RemoveActionSheet`/`SetActionSheet` for this per-skill pipeline. If the user separately requests a persistent avatar-state remap, treat it as a distinct `msw-avatar` task.

### MUST Acceptance Matrix

| Scenario | Required event/target | Required lifecycle result |
|---|---|---|
| Attack with empty key | One native `BodyActionStateChangeEvent(Attack)` to the avatar root | Basic Attack visibly plays; release through the deterministic cast window even when the effective action loops or emits no end event. |
| Attack with custom key | One `ActionStateChangedEvent(key, key, ..., Onetime)` to body entity | Use animation end only after visible one-shot playback is verified; deterministic cast-id cleanup still exists. |
| Attack with supported native key | One native `BodyActionStateChangeEvent` to the avatar root | Do not assume one-shot playback; deterministic cleanup is primary unless end-event behavior is proven. |
| Movement with empty key | No animation event | Movement execution MUST NOT accidentally play Attack. |
| Late animation RPC for cast A after cast B starts | No event | Cast B state, movement, facing, handlers, and lock remain unchanged. |
| Cast animation ends normally | No replacement animation forced by cleanup | Matching handler disconnects; cached input speed restores when owned, then this pipeline releases State/facing to their normal values once. |
| Cast animation is interrupted/replaced | Interruption path may observe state change instead of animation end | Same matching idempotent cleanup runs; player cannot remain locked. |
| Server rejects or safety timer fires | No stale animation mutation | Only the matching `castId` releases; a newer cast is untouched. |
| Allowed airborne cast | Family-correct animation event | Existing airborne velocity and trajectory remain unchanged. |

## Cast Window Resolution

The cast window is the bounded, `castId`-guarded duration the normal release path waits before restoring input, movement, facing, and State. This section owns how that duration is resolved; [Playback and cleanup ownership](#playback-and-cleanup-ownership) owns what the release then does.

**The window MUST NOT end before the cast animation's visible end.** An early release fails in the same way a release through the server safety timeout fails: the player regains control while the swing is still on screen, locomotion overwrites the remaining frames, and the attack reads as cancelled. A too-short window fails `P13` in [../verification/player-control-harness.md](../verification/player-control-harness.md) even when every cast-id, cleanup, and restore rule passes.

Resolve the duration in this order:

1. The resolved key is `swingO1` — use the project-verified default **`0.81s`**. This is a measured playback duration for this project's clip, not an engine constant; re-verify it whenever the clip changes.
2. Any other non-empty key, native or custom — **must-ask**. Ask the user for the intended window, or measure the actual clip and confirm the measured value with them. Do not infer a duration from the key name, and do not reuse `swingO1`'s value for a different action.
3. Empty key (native basic Attack) — the action that plays depends on the weapon the avatar holds, so its length is not fixed. Measure the effective clip or ask, exactly as in step 2.

Never derive the window from `hitDelay`. A formula such as `hitDelay + a short recovery margin` is a design choice about when damage is presented, not a statement about how long the animation runs; the two are independent and `hitDelay` is frequently much shorter. Never reuse the `cooldown` value either, even when it happens to be of the same magnitude — see the `cooldown` entry in [../architecture/datasets.md](../architecture/datasets.md).

`SpriteAnimPlayerEndEvent` is the preferred completion signal for an action proven to be one-shot, and it fires on `AvatarRendererComponent:GetBodyEntity()`. The measured behavior in this project is that it does **not** fire on the avatar root entity, so a listener armed on the root silently never runs and the cast then depends entirely on the timer. Arm the listener on the body entity, converge it with the resolved timer on the same idempotent `castId` cleanup, and keep the timer correct on its own for the case where the event never arrives.

## Cast Instance Ownership Rule (absolute precedence)

A cast is one semantic operation, but its **client presentation lock** and **server validation lock** have different owners. Never represent both with one `@Sync` property that the client and server both write.

- Client-only presentation state: `CastingLockActive`, `CastingSkillId`, `LocalCastSequence`, `ActiveLocalCastId`, cached `MovementComponent.InputSpeed`, animation handler, State presentation lock, and `FixedLookAt`.
- Server-only validation state: `ServerCastingLockActive`, `ActiveServerCastId`, authoritative cooldown, and the server safety timer.
- `CastingLockActive` and `JumpAllowedDuringCast` are local adapter properties, **not `@Sync` properties**. The server does not set or clear them.
- The server does not lock or unlock the caster's `StateComponent`, `MovementComponent`, `InputSpeed`, or `FixedLookAt`. Those are client presentation/input values and must have one writer.
- Increment `LocalCastSequence` for every locally accepted cast and carry that `castId` through `RequestUseSkill`, animation-play notification, rejection, normal release, and safety release.
- Every asynchronous callback must compare its captured/received `castId` with the currently active id before changing state. A late response from cast A must be a no-op after cast B starts.
- Local cleanup is idempotent for one `castId`: disconnect the animation handler; restore only the State/Movement/facing/jump values actually owned and cached by that cast; clear the active local id; then request server release with the same id. Do not restore fabricated defaults on branches that never captured them.
- Server cleanup only succeeds when `ServerCastingLockActive == true` and `ActiveServerCastId == castId`. An old release must never clear a newer server cast.

Why this is mandatory: an earlier server release can arrive after the client has already started the next cast. With a dual-written `@Sync CastingLockActive`, that stale release can overwrite the new client lock to `false` and re-enable state while the new cast's locally cached `InputSpeed` remains `0`. The visible symptom is a walking animation in place followed by permanent movement loss. This is a client/server message-ordering race, not a shared-memory thread race.

## MUST — Player Casting Input & Animation-End Lock Rule (required for every skill)

These are the foundational **Animation Execution Principles** for every attack skill in this project:

1. **Absolute Physics Integrity (No Floating/Freezing)**:
   - Never disable `PlayerControllerComponent`/`MovementComponent` or zero full Body velocity; preserve gravity and any allowed movement skill's `SetWorldPosition`/`SetForce` path.
   - Gate native jump/down-jump before Body mutation through the verified [extended controller](#extended-playercontroller-jump-gate). An alternative requires native API/code evidence plus every applicable player-control harness row.
   - Grounded lock: cache `InputSpeed`, call `Stop()`, set speed `0`, and restore only when `HasCachedInputSpeed`. Allowed airborne cast: do none of those and preserve its existing Body/Movement trajectory. Movement `allowDuringAttack` remains independent.
   - Do not add `MoveLeft`/`MoveRight` conditions for jump locking. If explicitly required to remove horizontal drift, set only X to `0` and preserve Y.
   - Velocity locking does not lock turning; principle 9 separately owns facing.

2. **MUST — Native State Machine Integration**:
   - Apply the [animation dispatch contract](#must--player-skill-animation-dispatch-contract) exactly; preserve raw `animationKey`, family-first classification, target/event choice, State lock, and client-only cleanup ownership there instead of duplicating its branches here.
   - Carry `castId` in the targeted animation notification and ignore it unless the same local cast is active.
   - Keep State disabled while an `allowDuringAttack = true` movement executes; movement never owns attack cleanup.
   - The discovered per-player attack adapter owns movement lock, dispatch/classification, and the targeted notification; method names are not contractual.

3. **Zero-Latency Client-Side Input Gating**:
   - Follow the [Cast Instance Ownership Rule](#cast-instance-ownership-rule-absolute-precedence): on accepted key-down, allocate `castId`, set local lock plus facing/movement/State locks immediately, and call `RequestUseSkill(skillId, castId)`.
   - Do not subscribe to animation end at raw input time; an ending locomotion clip could release the new cast before its animation notification.
   - An overlap rejection carries its request `castId`; release only when that id is still locally active.

4. **MUST — Zero-Latency Native Animation-End Detection**:
   - Apply [Playback and cleanup ownership](#playback-and-cleanup-ownership): every cast has a bounded, `castId`-guarded normal release; only a proven one-shot may additionally release from `SpriteAnimPlayerEndEvent` connected after dispatch.
   - Capture `castId`; after any required deferred frame, stale callbacks return and the matching callback enters the single local cleanup path.
   - Cleanup disconnects first, restores only owned local values, then requests matching server release; the server never sync-clears the client lock.

5. **Flinch & Hit Interruption Immunity**:
   - If the design requires hit/flinch immunity during attacks, the authoritative hit check reads the server-owned `ServerCastingLockActive`, not the client-local `CastingLockActive`. Client presentation may consult its local flag for immediate visuals, but it cannot authorize immunity.
   - This remains one generic flag read regardless of skill id. Clear it only through the matching server `castId` release so an old callback cannot remove immunity from a newer cast.

6. **MUST — Interrupted Cast Recovery**:
   - Bug: an attack animation may loop, be interrupted/replaced, or fail to emit `SpriteAnimPlayerEndEvent`. An animation-end-only implementation then leaves cached input/state/facing locked.
   - Fix, client side: also subscribe to the native `StateChangeEvent` on `self.Entity` (disconnected in `OnEndPlay`). When the active cast is interrupted, call `ReleaseCastingLockLocally(ActiveLocalCastId)` so normal completion, interruption, rejection, and safety recovery share one idempotent cleanup path.
   - Fix, client side: arm the deterministic normal-release timer for the intended cast window and converge it with verified animation-end/interruption/rejection paths on `ReleaseCastingLockLocally(castId)`. A queued release from cast A must be a no-op after cast B starts.
   - Fix, server side: keep the longer safety timer as last-resort recovery, keyed by active `castId`, not `skillId`. Ordinary casts reaching this timer fail Gate P.
   - Do not let the timer callback set a shared timer id or clear state before its `castId` guard. A queued timer from cast A must do nothing after cast B has replaced it.
   - Required ownership: the player adapter owns idempotent client cleanup and the attack Registry/adapter pair owns the longer server recovery timer, both keyed by the same cast instance id.

7. **MUST — Custom Cast Animation Cutoff**:
   - Native locomotion must not replace a custom one-shot before its final frame: follow the [dispatch and cleanup contract](#must--player-skill-animation-dispatch-contract), disabling State locally before request/play and keeping it disabled through matching release.
   - Emit exactly one mutually exclusive empty/native-root/custom-body branch; never combine the custom event with a competing state/action-sheet mapping. The discovered player adapter owns this lock, classification, and notification.

8. **MUST — Consecutive-Cast Sync Overwrite Race Protection**:
   - The confirmed failure is a delayed cast-A server release overwriting cast B's client lock/State while B retains `InputSpeed = 0`, producing walk-in-place and permanent movement loss. Apply the [Cast Instance Ownership Rule](#cast-instance-ownership-rule-absolute-precedence); this is a message-ordering race, not a shared-memory thread race.
   - Animation, rejection, safety, and release callbacks all carry monotonically increasing `castId`: stale local ids do nothing, rejection/safety converge on local cleanup, and server release clears only its matching active id.
   - Regress by holding direction through repeated attack boundaries, then repeat with an `allowDuringAttack = true` teleport; exact cached speed must restore and no old callback may affect the next cast.

9. **MUST — Facing Lock During Cast**:

   - Bug: principle 1's horizontal-velocity freeze stops the character from *sliding*, but `PlayerControllerComponent` updates facing (`LookDirectionX`) on a same-side direction-key press even while `"ATTACK"` blocks actual movement — turning in place doesn't require velocity. Meanwhile `AttackSkillLogic.OnUseNormalAttackSkill` snapshots `LookDirectionX` once, at cast time, to orient the cast effect / hit effect / hitbox (see [cast-effects.md](cast-effects.md)). A direction change during the cast desyncs the two: the character visibly turns, but the effect stays pointed the original way.
   - Fix: freeze facing itself for the cast duration using `PlayerControllerComponent.FixedLookAt` (`0` = free/native default; a positive/negative sign follows `LookDirectionX`). `LockFacingLocally()` reads the current sign and applies it before the server request; `ReleaseCastingLockLocally(castId)` resets it to `0` only for the matching active cast.
   - Do not mirror these writes from `RequestUseSkill`/`RequestReleaseCastingLock`. Client input and presentation own `FixedLookAt` for this pipeline; a delayed server reset is capable of unlocking a newer cast just like a delayed casting-flag sync.
   - The discovered player adapter owns facing lock and matching cast cleanup.

## Extended PlayerController Jump Gate

**MUST — role separation:** `PlayerSkillInputRouter` owns only shared key binding resolution and family dispatch. `PlayerJumpGateController` is the required default `PlayerControllerComponent` subclass for native jump/down-jump gating. Never merge these roles, never name the router as a controller, and never attach the subclass beside another player-controller implementation.

The verified portable implementation replaces the player's ordinary `PlayerControllerComponent` with one project-specific component extending it. Do not attach both, because parallel components derived from the same base make base-type access and action ownership ambiguous.

This section fixes the required behavior, not the filename. If the project already has a different API-grounded input owner that gates the same native jump/down-jump path before Body mutation, it may be adapted instead of adding a parallel controller — but only after documenting the capability mapping and passing [../verification/player-control-harness.md](../verification/player-control-harness.md). If no such proof exists, this extension-and-replacement shape is mandatory. Merely omitting the subclass without an equivalent gate is a failed implementation.

- Raw Extended Script Format uses `method void ActionJump()` / `method void ActionDownJump()`. The Maker UI label `override` is not a raw `.mlua` declaration keyword; `override void ActionJump()` produces `[LEA-3016] InvalidFormat`.
- Redefine only the parameterless script-overridable entry points. The overloads taking `horizontalInput` are sealed.
- When the cast policy permits a jump, delegate through `__base:ActionJump()` / `__base:ActionDownJump()`. Otherwise return without touching Body physics.
- Do not use `AddCondition("Jump", ...)` as the primary gate for this pipeline; intercept the native action entry point directly.
- Keep custom double jump gating in the movement adapter through `allowDuringAttack`.

## Jump-During-Cast and Airborne-Cast Gates (two independent per-skill policies)

An attack skill's relationship to jumping is governed by two **independent** boolean columns on its `AttackSkillData` row. They control different moments and must never be collapsed into one flag: a skill can forbid jumping mid-cast while still being castable in the air, or allow jumping mid-cast while remaining ground-only. Whenever both a "no jump during cast" and an "attack usable while airborne" requirement exist for the same skill, they are only expressible as two separate flags.

- `allowJumpDuringCast` — whether the player may jump **while this attack's cast/animation lock is active**. It is copied to the local `JumpAllowedDuringCast` adapter property at cast start and read by the extended player controller's `ActionJump()` / `ActionDownJump()` overrides: while a cast is active the native jump is delegated to `__base` only when this is `true`. `false` blocks the native jump for the cast's duration; `true` lets the player jump-cancel/jump during the cast. The double-jump (movement family) is gated separately by the movement row's `allowDuringAttack` — keep that `false` to also block double-jumping mid-cast.
- `allowAirborneCast` — whether this attack may be **started while the caster is airborne** (off the ground). `false` rejects the cast at input time when the caster is not on the ground; `true` allows starting the attack in the air, including immediately after a double jump. This gate applies on MapleTile, where "airborne" is read from the caster's `RigidbodyComponent:IsOnGround()`. When such a cast starts in the air, the movement lock must not call `MovementComponent:Stop()`; allowing the cast must preserve the jump trajectory that was already in progress. `allowJumpDuringCast` still independently decides whether a new jump input may occur after the cast starts.

Both default to `false` for a new skill — the conservative baseline (ground-only, no jump during cast). Set them per skill in the DataSet; neither implies the other. The discovered native-input policy owner handles jump interception, while the player attack adapter owns per-cast jump state and the ground/airborne execution gate.
