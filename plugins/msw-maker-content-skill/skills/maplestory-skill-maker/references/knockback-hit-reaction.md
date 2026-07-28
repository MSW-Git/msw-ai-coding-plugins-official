# Knockback & Hit Reaction

The defender's physical reaction to a landed hit: knockback force, facing, hit-reaction animation, and the physics tuning that keeps it from fighting the target's own AI movement. See [../SKILL.md](../SKILL.md) for the Domain Reference Files index.

## Manual Hit Reaction Rule (required since the AttackComponent/HitEvent bypass — see divergence-declarations.md)

The base `msw-general` animation-state rules establish that the `HIT` state is **registered by `HitComponent`**, but the transition into `HIT` and its automatic return to `IDLE` after about 0.5 seconds are driven by a real `HitEvent`. Since player attack skills no longer emit `HitEvent` at all (see [divergence-declarations.md](divergence-declarations.md)), a monster hit by a player skill gets **no hit-reaction animation and no auto-return** unless `TakeDamage` triggers it manually.

Required shape for `Monster.mlua`'s `TakeDamage` (non-lethal path only):

- Keep `HitComponent` attached to monster models even though nothing calls `Attack()` against it anymore — its only remaining job is to keep `HIT` registered as a valid `StateComponent` state name, so `ChangeState("HIT")` doesn't throw `[LEA-3005] InvalidArgument`. Do not remove it as "unused."
- On a non-lethal hit, call `self.Entity.StateComponent:ChangeState("HIT")` directly — **use `ChangeState`, not a raw `SpriteRendererComponent.SpriteRUID` assignment.** This project's `Monster`/`MonsterAttack` already follow the ActionSheet-driven pattern (Pattern B in `animation-state.md` §0), not the custom-script `SpriteRUID` pattern (Pattern A). Do not mix the two paths: a raw sprite assignment bypasses the state transition and its coordinated return to `IDLE`.
- Schedule the return to `IDLE` manually (there is no more auto-return): `_TimerService:SetTimerOnce(function() sc:ChangeState("IDLE") end, hitReactionDuration)`. The native default was a flat `~0.5s` regardless of clip length; this project's confirmed default (`Monster.HitReactionDuration`, plain property) is **`0.45`** — either use that flat value for a first pass, or (preferred, matching this project's own precompute-real-duration convention from the Damage-Skin Overkill Hold Rule) precompute the `"hit"` ActionSheet clip's real duration the same way `Monster.mlua` already precomputes `dieAnimationDuration` for the `"die"` clip, and use that instead of a guessed constant.
- **Must not fire on the killing hit.** The Death Freeze Rule ([death-sequence.md](death-sequence.md)) already forces `ChangeState("IDLE")` directly on a lethal hit specifically to bypass the HIT flinch — `TakeDamage` must branch so the manual `ChangeState("HIT")` call only happens when the hit does NOT kill the target, otherwise this rule and the Death Freeze Rule fight over the state machine.
- This is independent of, but coordinates with, the Rigidbody MoveVelocity Cache & Rollback Rule below — that rule's "upon entering/exiting the HIT state" hooks are exactly the `ChangeState("HIT")` / `ChangeState("IDLE")` calls this rule introduces.
- ⚠ `TakeDamage` only triggers the exposed `Monster:PlayHitReaction()` method for the **first** hit reaction. Every subsequent pulse in the Knockback Pulse Rule's repeating cycle (below) calls `Monster:PlayHitReaction()` again itself — `PlayHitReaction` is a reusable per-pulse method, not a one-shot internal step of `TakeDamage`.

## Knockback Pulse Rule (default)

Knockback repeats in a pulse cycle **for as long as the damage-skin cascade is still displaying**, by default — not an opt-in variant for special skills, but the standard behavior for every skill going through the Manual Damage & Damage-Skin pipeline ([damage-presentation.md](damage-presentation.md)).

- **Total window**: the damage-skin cascade's total display duration is `T = hitCount * damageSkinInterval` — the same value already used for the Damage-Skin Overkill Hold Rule's `dieAnimationStartDelay`.
- **Pulse 1**: fires immediately and unconditionally at hit time, together with the hit-reaction animation. **Knockback and the hit-reaction animation (`Monster:PlayHitReaction()`) must always fire together, in the same call site, never independently of each other** — this applies to every pulse, not just the first.
- **Pulse cadence**: after each pulse's hit-reaction animation finishes (`Monster.hitAnimationDuration`), wait a **fixed `0.09s`** — not a per-skill tunable, hardcode this the same way the Rigidbody WalkDrag Override Rule hardcodes `0.4` — before attempting the next pulse.
- **Cutoff check**: right before firing pulse 2 or later, compute the damage-skin time remaining at that moment (`T` minus elapsed time since pulse 1). If remaining is **less than a fixed `0.2s`**, skip that pulse entirely and end the cycle — do not fire it, do not schedule another check.
- If remaining ≥ `0.2s`, fire the pulse (knockback `SetForce` + `PlayHitReaction()` together) and schedule the next cadence/cutoff check the same way. This repeats until a cutoff check fails.
- **Never starts at all on a killing hit** — this is already covered by the existing "skip knockback on kill" check (Face-Attacker-on-Hit Rule / Death Freeze Rule); the cycle simply never begins for a lethal hit, no separate logic needed.
- Re-validate `target`/`Monster.IsDead` on **every** scheduled pulse, not just the first — the target could die from another source mid-cycle (e.g. another player's hit).
- This makes `attackCount`/`damageSkinInterval` (via the total damage-skin duration `T`) the actual driver of how many pulses occur — there is no separate per-skill pulse-count or pulse-interval field. A short `T` (e.g. `attackCount = 1` with the standard `damageSkinInterval`) naturally yields only one pulse once the cadence+cutoff math is applied — no special-casing for `attackCount == 1` is needed.

## Knockback Direction & API Rule (default for every skill type, Rigidbody/MapleTile maps)

The default knockback implementation for all skills unless a skill explicitly requests something else (arc pop, upward launch, etc.).

- **API**: use `RigidbodyComponent:SetForce(Vector2)`, not `AddForce`. `SetForce` replaces the body's force outright, so a knockback pulse is not compounded by residual force from the target's own movement/AI. `AddForce` is only for genuinely additive effects (e.g. a sustained push) and is not the default for a one-shot knockback pulse. See also [divergence-declarations.md](divergence-declarations.md).
- **Direction**: horizontal-only by default — `Vector2(dirX * knockbackPower, 0)`. Do not add a vertical component (`y = 0`) unless the skill spec explicitly calls for a pop-up/launch knockback.
- **`dirX` meaning**: the direction *away from the attacker*, i.e. the same sign as the attack's facing direction (`playerController.LookDirectionX`, or equivalent) that was used to position the attack hitbox in front of the attacker. Since the target is inside that frontal hitbox, "away from attacker" and "the attacker's facing direction" are the same sign — do not derive direction from a separate attacker→target position subtraction; reuse the `dirX` already computed for hitbox placement.
  - Worked example: attacker stands to the right of the target and faces left (`dirX = -1`) to hit it → target is knocked further left → `Vector2(-1 * knockbackPower, 0)`.
- **Magnitude**: expose `knockbackPower` as its own tunable field (not a hardcoded literal in the knockback method), so skill instances can dial "light" vs "heavy" knockback purely through data. The project-standard default is `1.5`, not `1` — `1` is too weak to feel; do not use `1` as a default (see [skill-data-contract.md](skill-data-contract.md)'s Must-Ask vs Standard-Default Fields).
- Apply this pattern on every pulse of the Knockback Pulse Rule's repeating cycle above — each pulse re-`SetForce`s using the same cast-time `dirX`, regardless of how many pulses the cycle ends up running.

## Face-Attacker-on-Hit Rule (default, unless the hit kills the target)

The default for every skill's knockback.

- If the hit does **not** kill the target (check the target's death flag — e.g. `script.Monster.IsDead` — right before applying knockback, since `TakeDamage` runs synchronously and may already have flipped it), turn the target to face the attacker **before/at the same moment as** the knockback pulse.
- If the hit **does** kill the target, skip the facing turn (it's about to play its death presentation, see [death-sequence.md](death-sequence.md)) — knockback itself may still apply per the death-hold/knockback-on-kill rules there; only the facing turn is conditional.
- Facing direction: the target sits on the attacker's `dirX` side (that's how the frontal hitbox is built), so the attacker is on the target's opposite side — the target should face **toward** that opposite side, i.e. away from the knockback direction it is about to receive.
- Implementation: for monster-class entities, flip **`TransformComponent.Scale.x`** (not `SpriteRendererComponent.FlipX` — see `msw-search/SKILL.md` "Sprite Orientation" for why monsters use Scale, not FlipX, to keep collider alignment). Since most monster art is authored facing left (positive `Scale.x` = left, per the project's left-facing-by-default convention), the target's new `Scale.x` sign ends up equal to `sign(dirX)` — derive this per-skill from the actual `dirX`/attacker-facing convention rather than hardcoding the sign, since it depends on which side of the attacker the hitbox places the target.
- Give this its own method (e.g. `FaceAttacker(target, dirX)`) rather than inlining it into the knockback method, so it can be reused/tuned independently.

## Rigidbody MoveVelocity Cache & Rollback Rule (default for every skill's knockback)

A mandatory physics standard for all knockbacks:

- **Problem**: When a knockback is applied, if the monster is actively walking (AI movement is feeding velocity), its movement will fight and cancel out the knockback force.
- **Solution**:
  1. Upon entering the HIT state or starting the knockback pulse cycle, the target's current `MoveVelocity` must be cached on the server (e.g. mapped by target entity Id in `_T.originalMoveVelocities`) and then immediately set to `Vector2.zero`.
  2. While the pulse cycle is running, any horizontal knockback force `SetForce` must clear `body.MoveVelocity = Vector2.zero` right before applying the force.
  3. Upon exiting the HIT state (when the knockback cycle ends), the cached original `MoveVelocity` must be restored/rolled back right before re-enabling the AI.

## Rigidbody WalkDrag Override Rule (default for every monster entity)

A physics standard for all monster entities:

- **Problem**: The engine's native monster physics (on MapleTile) injects extremely high default ground friction (`WalkDrag` up to 1000), causing knockback forces to stop abruptly without sliding.
- **Solution**: During initialization (`OnBeginPlay()`), explicitly override the target's `RigidbodyComponent.WalkDrag` to **`0.4`**. This reduces ground friction, allowing the target to slide smoothly, fluidly, and naturally when knockback force is applied, perfectly matching classical MapleStory knockback physics.
