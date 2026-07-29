# Non-Negotiable Presentation Gates — Absolute Contract

This contract defines the two presentation systems that every damaging player attack must preserve. It has absolute precedence over implementation convenience, existing filenames, architecture reuse, and partial success on a sample entity.

The implementing agent must follow all applicable gates. Missing Maker runtime evidence means **implemented but verification blocked**, never complete.

## Gate P — Player Skill Animation and Cast Control

Gate P applies to **every attack skill**, including an attack row whose `animationKey` is nil or empty. Movement-skill animation remains optional and follows [../movement/skills.md](../movement/skills.md); an empty movement key emits no animation.

Authoring baseline: every new or reconstructed attack row starts with `animationKey = "swingO1"`, while every movement row starts with `animationKey = ""` because movement must not trigger the attack fallback. Do not copy a live custom key, derive a key from `name`, or invent a custom action id. A different native/custom key is allowed only after the user explicitly requests that animation and the referenced action is known to exist and has been verified. Creating a custom avatar action is separate scoped work, not an automatic side effect of creating a skill.

Every attack cast MUST satisfy all of the following:

1. Resolve the raw attack `animationKey` without rejecting or rewriting an empty value in the catalog/Registry.
2. Empty attack key: send `BodyActionStateChangeEvent` with `ActionState = MapleAvatarBodyActionState.Attack` and `needResetAction = true` to the avatar root. This is a real basic Attack animation, not a no-animation path.
3. Supported non-empty native key: send the corresponding `BodyActionStateChangeEvent` to the avatar root.
4. Every other non-empty key: send one `ActionStateChangedEvent(key, key, 1, SpriteAnimClipPlayType.Onetime)` to `AvatarRendererComponent:GetBodyEntity()`.
5. Apply the portable cast-control contract from `../player/casting.md`: immediate local cast ownership, grounded movement stop and exact owned-value caching when movement is disallowed, airborne trajectory preservation when allowed, State presentation lock, facing/jump policy, and cast-id guards.
6. Release through a deterministic cast-id-guarded normal window plus matching interruption/rejection cleanup. Use animation end only as an optional path for verified one-shot actions. The longer server safety timeout is emergency recovery only; ordinary release through it is a failure.
7. Execute every applicable `player-control-harness.md` scenario. The animation merely appearing is not enough; dispatch target, lock duration, cleanup, repeated-cast behavior, and stale-callback safety must pass.

Any attack cast that emits no player animation, uses the wrong event target, is overwritten by locomotion, waits for a fixed timeout on its normal path, or restores control incorrectly fails Gate P and blocks completion.

### Gate P enforcement IDs

Gate P is not one aggregate checkbox. Instantiate `PAP-01` dispatch and animation source, `PAP-02` cast/control ownership, `PAP-03` deterministic release/interruption/stale-callback cleanup, and `PAP-04` applicable `P0`–`P12` runtime evidence as separate ledger rows. Each ID must name its discovered owner and implementation location; `PAP-04` passes only with concrete [player-control-harness.md](player-control-harness.md) observations.

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

## Completion Rule

Every damaging attack implementation MUST report every applicable row with code locations and actual harness evidence:

| Gate | Required result |
|---|---|
| Gate B — Fresh bootstrap, when applicable | PASS |
| Gate P — Player presentation | PASS |
| Gate M — Monster presentation | PASS for every effective target class |

`BLOCKED`, `NOT RUN`, inferred behavior, a fixed fallback, success on only one monster, or an unapproved caveat is not PASS. Do not use completion language until every applicable row passes.
