# Fresh Combat Bootstrap — Canonical First Build

Use this reference when a project does not yet have the complete player-attack/monster-defense infrastructure, when one of the required role owners is missing, or when repairing an earlier incomplete bootstrap. This is not the workflow for adding another concrete row to an already-working type.

The recurring failure this reference prevents is a partial first build: damage works, but moving casts lose their animation or wait for a safety timeout; monsters lose HIT playback, AI/state ownership, or death timing. Do not build those capabilities incrementally and call the intermediate state complete.

## Project-local executable source of truth

Read [framework.md](framework.md) for transferable ownership and [../player/preflight.md](../player/preflight.md) for existing State/animation integration. This bootstrap defines completeness and rejection criteria without depending on a particular project's filenames.

## Canonical player cast ownership

Implement the ownership and dispatch contract in [framework.md](framework.md) after completing [../player/preflight.md](../player/preflight.md). Preserve existing State owners; do not reproduce reference State classes. Required static capabilities include distinct local/server cast ownership, a monotonic local sequence, a non-`@Sync` client presentation lock, exact cached-speed ownership, bounded normal release, and cast-id checks on every asynchronous callback.

The server safety timeout is emergency recovery. If ordinary casts reach it, the bootstrap fails Gate P even when movement eventually returns.

## Player animation bootstrap requirements

- Preserve raw `animationKey` through the catalog, but seed every newly created baseline row with `animationKey = "swingO1"`. Never generate a custom key from the skill name or copy one from an example row.
- Empty attack key uses native basic Attack on the avatar root.
- Supported native key uses the corresponding native root event.
- Any other key uses one custom one-shot event on the body entity.
- If repairing an existing row that already has a non-empty custom key, treat it as an opt-in exception rather than a default. Preserve it only when the requested scope requires that custom action and verify that it visibly starts and ends on the effective avatar; the DataSet string alone is not capability evidence.
- Test all three dispatch branches that the project exposes from both `IDLE` and held-direction `MOVE` starts.
- During a movement-locked cast, the player must stop in place, visibly play the cast action, show no walking animation until release, and restore movement within the intended deterministic cast window.
- A missing renderer/body, failed custom action, loop/no-end-event path without deterministic release, or ordinary server-safety-timeout release is a hard bootstrap failure.

## Canonical monster hit/death ownership

Every implementation of this contract **must** execute the static and runtime gates of [../verification/monster-visual-harness.md](../verification/monster-visual-harness.md).

Implement the attack/Defender ordering from [framework.md](framework.md), [../combat/targeting.md](../combat/targeting.md), and [../combat/hit-reaction.md](../combat/hit-reaction.md). Keep judgment, damage, and reaction ownership separate.

The Defender's damage entry point owns HP, damage-skin presentation, and the death branch. Do not implement a non-lethal HIT State itself. The reaction owner uses the project's existing transition owner and discovered available movement states (including `CHASE`, `IDLE`, `MOVE`, etc., or custom states if present), preserves protected actions, and releases only the movement/AI locks owned by the hit.

For all StaticMonster, MoveMonster, ChaseMonster, or other valid setups, adhere to the following:

- Preserve `HitComponent` only when it records `HIT`.
- Ensure that `StateComponent`, `StateAnimationComponent`, and the lowercase ActionSheet mappings correspond to each other.
- Document whether HIT and DEAD are played through a State or via direct clip assignment. Even for the same monster, these can be different.
- Document the conditions of `StateSet` or `StateComponent` and choose one final death transition owner.
- Maintain the previously established character facing rules, and strictly review the `OnEnter` side effects of the return state before hooking up the HIT recovery.
- Prove that the `hit` and `die` RUIDs are non-empty, loadable, and visibly play for a real duration.
- Disable any active `AIWanderComponent` / `AIChaseComponent` and call `MovementComponent:Stop()` to halt movement during the hit-owned pulse. Restore them only when an ATTACK/death owner no longer holds movement authority.
- Do not treat a shared Defender/monster base script as proof of perfect equivalence between models. MoveMonster and ChaseMonster require separate H1/H2 evidence because their AI owners and mapped clips differ.
- StaticMonster requires separate H1 evidence because its AI owner and mapped clips differ from MoveMonster and ChaseMonster.
- Log the state before HIT, whether HIT was entered or deliberately suppressed, the state at reaction end, and the exact suppression reason.

## Forbidden first-build shortcuts

Reject and replace any bootstrap containing one of these patterns:

- Per-skill attack methods/properties instead of one row plus a type handler.
- A hardcoded input router (`if key == F then ExecuteSkill(2002)`) instead of `SkillBindingData` family routing.
- Input handlers attached to every client entity without `_UserService.LocalPlayer == self.Entity` ownership.
- Server RPCs without sender ownership validation.
- Player movement/state locked before a known cooldown gate.
- Animation cleanup that depends normally on a fixed 2–3 second timer.
- Custom animation strings accepted as proof without visible start/end evidence.
- `TakeDamage` directly starting every HIT, including lethal hits.
- HIT attempted without valid state registration/mapping.
- New HIT/DEAD/CHASE States or conditions created before existing State ownership is inventoried.
- Hardcoded `IDLE/MOVE/HIT` eligibility that omits an effective `CHASE`/custom locomotion state.
- Monster facing expressed through signed `Scale.x`, or a `Scale.x`/`FlipX` competing-writer pair, instead of `SpriteRendererComponent.FlipX` as the single facing writer.
- Certifying that all Monsters use `StateSet` based solely on whether a specific Monster uses `StateSet`.
- One successful StaticMonster used to certify MoveMonster or ChaseMonster.
- AI re-enabled by HIT cleanup while ATTACK or death still owns it.

## Bootstrap completeness gate

The first damage-dealing attack is incomplete until all of the following features exist simultaneously:

1. DataSet/catalog loading and validation by integer `skillId` and `type`.
2. A single shared input router dedicated to the local player, using `SkillBindingData` rather than hardcoded keys or skill ids. The baseline `normal_attack_skill` MUST bind to `LeftShift`, and `teleport_skill` MUST bind to `F`, unless the user explicitly overrides the key or an existing collision is reported and resolved.
3. A Player Adapter with client local cast identity, local cooldown prediction, movement/state/facing ownership, avatar animation dispatch, animation end/interruption cleanup, attack rejection handling, and matching server safety release capabilities.
4. One `PlayerJumpGateController` extending `PlayerControllerComponent` and replacing the ordinary controller. It MUST own native `ActionJump()`/`ActionDownJump()` gating, delegate allowed input through `__base`, remain separate from `PlayerSkillInputRouter`, and MUST NOT coexist with another player-controller implementation.
5. A server Registry with exactly one set of sender/cooldown/state validations, a target snapshot at attack cast time, immediate one-shot judgment against that snapshot, delayed presentation scheduling, and Defender damage invocation.
6. A MonsterDefender with separated damage/death ownership and non-lethal reaction ownership.
7. AI/movement locks distinguishing HIT, ATTACK, and DEAD ownership.
8. Gate P and Gate M runtime evidence, including MoveMonster.model and ChaseMonster.model if they are accessible targets.

Completion is withheld if even a single row is missing. A collection of sub-features handling only damage or only animation is not a completed bootstrap.

## Completion evidence

Before reporting the first attack pipeline complete:

1. Record the exact role map and required static symbols.
2. Capture Gate P scenarios P0, P1, P5, P6, P8, P10, and P12 at minimum.
3. Capture Gate M scenarios H1/H2/H2-C/H2-X/H3 and applicable lethal/respawn rows for every effective target class.
4. Prove ordinary player casts, including a loop/no-end-event case, release through the deterministic window or matching interruption/rejection, never the server safety timeout.
5. Prove MoveMonster and ChaseMonster visibly enter HIT from every reachable locomotion state and resume their prior AI cadence without a new multi-second `OnEnter` pause.
6. Check whether each monster uses `StateSet` or relies solely on `StateComponent`, and verify the transition to the DEAD/HIT state. If `StateComponent.StateSetId` is used as empty or nil, direct state transitions must be implemented.
7. If Maker runtime evidence cannot be collected, report **implemented but verification blocked**.
