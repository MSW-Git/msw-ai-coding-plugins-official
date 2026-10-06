# Non-Negotiable Presentation Gates — Absolute Contract

**Enforcement:** evidence source — defines Gate P, Gate M, and Gate B. The leaf contracts they cite own exact behavior.

This contract defines the two presentation systems that every damaging player attack must preserve. It has absolute precedence over implementation convenience, existing filenames, architecture reuse, and partial success on a sample entity.

The implementing agent must follow all applicable gates. Missing Maker runtime evidence means **implemented but verification blocked**, never complete.

## Gate P — Player Skill Animation and Cast Control

Gate P applies to **every attack skill**, including an attack row whose `animationKey` is nil or empty. Movement-skill animation remains optional and follows [../movement/skills.md](../movement/skills.md); an empty movement key emits no animation.

Authoring baseline: attack-row `animationKey` values follow the [Animation Key Authoring Rule](../architecture/datasets.md#animation-key-authoring-rule), and movement rows follow [../movement/skills.md](../movement/skills.md). Gate P verifies dispatch and cast control for whatever key the row carries, including nil or empty.

Every attack cast MUST satisfy all of the following:

1. Resolve the raw attack `animationKey` without rejecting or rewriting an empty value in the catalog/Registry.
2. Empty attack key: send `BodyActionStateChangeEvent` with `ActionState = MapleAvatarBodyActionState.Attack` and `needResetAction = true` to the avatar root. This is a real basic Attack animation, not a no-animation path.
3. Supported non-empty native key: send the corresponding `BodyActionStateChangeEvent` to the avatar root.
4. Every other non-empty key: send one `ActionStateChangedEvent(key, key, 1, SpriteAnimClipPlayType.Onetime)` to `AvatarRendererComponent:GetBodyEntity()`.
5. Apply the portable cast-control contract from `../player/casting.md`: immediate local cast ownership, grounded movement stop and exact owned-value caching when movement is disallowed, airborne trajectory preservation when allowed, State presentation lock, facing/jump policy, and cast-id guards.
6. Release through a deterministic cast-id-guarded normal window plus matching interruption/rejection cleanup. The window's duration is resolved by [../player/casting.md](../player/casting.md#cast-window-resolution) and MUST NOT end before the animation's visible end; an early release fails Gate P exactly as a safety-timeout release does. Use animation end only as an optional path for verified one-shot actions, armed on the entity that actually emits it. The longer server safety timeout is emergency recovery only; ordinary release through it is a failure.
7. Execute every applicable `player-control-harness.md` scenario. The animation merely appearing is not enough; dispatch target, lock duration, cleanup, repeated-cast behavior, and stale-callback safety must pass.

Any attack cast that emits no player animation, uses the wrong event target, is overwritten by locomotion, releases before its animation reaches the final frame, waits for a fixed timeout on its normal path, or restores control incorrectly fails Gate P and blocks completion.

### Gate P enforcement IDs

Gate P is not one aggregate checkbox. Instantiate `PAP-01` dispatch and animation source, `PAP-02` cast/control ownership, `PAP-03` deterministic release/interruption/stale-callback cleanup, and `PAP-04` applicable `P0`–`P14` runtime evidence as separate ledger rows. Each ID must name its discovered owner and implementation location; `PAP-04` passes only with concrete [player-control-harness.md](player-control-harness.md) observations.

## Gate M — Complete Monster Hit and Death Presentation

Gate M applies to **every player attack skill that can damage a monster** and to every attackable monster model/effective animation configuration reachable by that skill.

Before implementation, complete [../player/preflight.md](../player/preflight.md) and enumerate the effective target classes. Two monsters may share one evidence class only when their transition owner, State/Condition topology, per-state animation owner, facing convention, return-state side effects, mappings, and relevant behavior owners are proven equivalent. Sharing one script name is not equivalence. Do not add reference HIT/DEAD States before this inventory.

Every applicable target class MUST satisfy all of the following:

1. Non-lethal presentation: damage skin, hit effect and sound policy, facing, knockback pulse ordering, hit-owned movement lock, protected-action HIT suppression, HIT return ownership, and the fixed movement-enabled inter-pulse gap.
2. Lethal presentation: immediate gameplay exclusion and server/client physics flush, no killing-hit HIT animation, no killing-hit knockback, and complete freeze during the damage-skin hold. When using a `StateSet`, the exclusion flag and final DEAD transition trigger may differ. Choose exactly one transition owner for each target class and avoid double transition.
3. Every target class MUST visibly play a non-empty, loadable `die` clip, but the playback owner is discovered per class. If each target class uses `StateComponent` and `StateAnimationComponent`, DEAD automatically plays the clip. Otherwise, have the existing death owner start the clip directly. When starting the clip directly, it must be stopped precisely when the clip ends. By default, MSW outputs clips in a loop.
4. The die animation MUST start only after its damage-skin hold and remain visible for its real frame-delay sum adjusted by positive play rate. Hide, disable, destroy, or respawn scheduling cannot begin early.
5. A missing component, missing/empty mapping, failed die resource load, invalid state registration, or invisible die playback is a hard failure. In this case, it falls back to perform a separate presentation.
6. Execute every applicable [monster-visual-harness.md](monster-visual-harness.md) scenario for every effective target class. One passing monster cannot certify a different ActionSheet or state pipeline.

Any target class that misses HIT behavior, knockback timing, damage-skin timing, lethal freeze, die playback, or disappearance timing fails Gate M and blocks completion for the entire attack implementation.

### Gate M enforcement IDs

Gate M is not one aggregate checkbox. Instantiate `MHP-01` effective target-class capability map, `MHP-02` non-lethal presentation, `MHP-03` lethal presentation plus immediate gameplay exclusion, and `MHP-04` applicable `H`/`D`/`E`/`F` runtime evidence as separate ledger rows. Expand `MHP-01`–`MHP-04` per effective target class; one class cannot certify another unless the equivalence criteria above are proven.

`MHP-03` does not make `IsDead` a universal guard. Immediate gameplay exclusion follows [../combat/death.md](../combat/death.md); `IsDead` is valid only as the final transition input for a model proven to use StateSet `ConditionIsDead`.

## Gate B — Fresh Combat Bootstrap Completeness

Gate B applies when the project does not yet have a complete attack Registry, Player Adapter/control, Defender reaction/death, and shared input features, or when recovering an incomplete initial build. Read and follow [../architecture/bootstrap.md](../architecture/bootstrap.md).
The bootstrap must create the complete capability set and canonical ownership/call ordering before it can be evaluated as an attack implementation. A simplified first version that deals damage but omits cast identity, animation-end/interruption cleanup, sender validation, valid monster HIT mapping, AI/action lock ownership, or lethal presentation fails Gate B. Gate P and Gate M still apply in full; Gate B does not replace them.

Gate B passes only with the required static capability map plus the fresh-bootstrap player and monster runtime evidence. Missing runtime access means **implemented but verification blocked**.

## Evidence Boundary — instrumented facts versus playtest

An implementing agent's only runtime instrument is the log stream it emitted plus the state it can read back. That decides which rows it may close and which it may not, and both harnesses split their rows on this line.

**Instrumented facts — the agent verifies these and reports `PASS` or `FAIL`.** Timing values compared against each other, such as a resolved cast window against a measured clip duration or a hold against a computed frame sum. Dispatch target and event identity. Ownership and `castId` ordering. Which state transitions did and did not occur between two logged points. Whether a handler was still connected when it mattered. Anything expressible as two recorded numbers, or as the presence or absence of a labelled line, belongs here — and a row in this class may never be closed by inference from a code path that looks correct.

**On-screen judgment — the agent hands these to the user.** Whether the result actually looks right: a swing that reads as cut off, a die animation the player can see, a hold that feels natural, an effect sitting where it belongs. A state-transition log proves the transition, not the pixels. A duration log proves the schedule, not the rendering. The agent reports what it scheduled and what it measured, names the scenario to look at, and leaves the verdict to the user's playtest.


**Structural facts — the agent verifies these by inspection and cites locations.** Whether every path that can reach a release, transition, or cleanup carries and compares its own identity; whether an owner is single and guarded so a second request is a no-op. This class exists only for invariants whose race cannot be induced from ordinary play, and a row that uses it says so with a `Static:` prefix. The row names the required inspection and gives the file and line of every path; a claim without locations is not evidence, exactly as in the static gates. It is deliberately the weakest of the three: it proves the guard exists on every known path, not that the runtime ordering was observed — so a row in this class records that limitation, and an induced runtime observation is welcome on top of it but never required.

Two rules follow, and they are what keep the split honest:

1. A row phrased as a visual claim is restated as its instrumented proxy wherever one exists, and the proxy is what the agent verifies. "The swing plays to its final frame" becomes "the resolved window is greater than or equal to the measured clip duration, and the logged release lands at or after that window".
2. Where no proxy exists, the row is a playtest item. Reporting it as `PASS` from log evidence alone is a false pass, not a conservative one. Report it as pending user playtest, with the scheduled values that make the judgment easy.

## Completion Rule

Every damaging attack implementation MUST report every applicable row with code locations and actual harness evidence:

| Gate | Required result |
|---|---|
| Gate B — Fresh bootstrap, when applicable | PASS |
| Gate P — Player presentation | PASS |
| Gate M — Monster presentation | PASS for every effective target class |

`BLOCKED`, `NOT RUN`, inferred behavior, a fixed fallback, success on only one monster, or an unapproved caveat is not PASS. Do not use completion language until every applicable row passes.
