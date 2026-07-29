# Knockback & Hit Reaction

The defender's physical reaction to a landed hit: knockback force, facing, hit-reaction animation, and the physics tuning that keeps it from fighting the target's own AI movement. See [../../SKILL.md](../../SKILL.md) for the Domain Reference Files index.

Every implementation of this contract **MUST** execute the static and runtime gates in [../verification/monster-visual-harness.md](../verification/monster-visual-harness.md). The acceptance matrix below defines behavior; the harness defines the evidence required to claim that behavior works.

## Contents

- [Entity Preflight (mandatory before implementation)](#entity-preflight-mandatory-before-implementation)
- [Portable Reference Implementation Contract (mandatory) (MUST Contract)](#portable-reference-implementation-contract-mandatory-must-contract)
- [Manual Hit Reaction Rule (required since the AttackComponent/HitEvent bypass — see ../architecture/divergences.md)](#manual-hit-reaction-rule-required-since-the-attackcomponenthitevent-bypass--see-architecturedivergencesmd)
- [Lock Ownership Rule (mandatory)](#lock-ownership-rule-mandatory)
- [Face-Attacker-during-Hit-and-Death Rule (default for every landed hit)](#face-attacker-during-hit-and-death-rule-default-for-every-landed-hit)
- [Knockback Direction & API Rule (default for every skill type, Rigidbody/MapleTile maps)](#knockback-direction--api-rule-default-for-every-skill-type-rigidbodymapletile-maps)
- [Knockback Pulse Rule (default)](#knockback-pulse-rule-default)
- [Rigidbody Pulse Velocity Reset & Rollback Rule (default for every skill's knockback)](#rigidbody-pulse-velocity-reset--rollback-rule-default-for-every-skills-knockback)
- [Rigidbody WalkDrag Override Rule (default for every monster entity)](#rigidbody-walkdrag-override-rule-default-for-every-monster-entity)
- [Required Acceptance Matrix](#required-acceptance-matrix)
- [Example Code Guideline](#example-code-guideline)

## Entity Preflight (mandatory before implementation)

Before writing reaction code, verify capabilities instead of assuming a model or filename:

1. The target has the Body component required by the map type; this reference's default force rule assumes MapleTile + `RigidbodyComponent`.
2. `StateComponent` accepts `ChangeState("HIT")`; keep `HitComponent` when it is the component that registers that state.
3. `StateAnimationComponent` has a hit action mapping. State registration alone prevents `[LEA-3005]` but does not guarantee visible hit animation.
4. The Defender exposes HP/death state and a damage entry point.
5. The reaction owner can cache/zero/restore `MoveVelocity`, apply `SetForce`, and acquire/release movement locks.
6. If the monster can attack or cast, identify that action's active flag or lock owner before implementing hit unlock.

## Portable Reference Implementation Contract (mandatory) (MUST Contract)

Implement this behavior by **role and capability**, not by copying project filenames. Existing projects may name the scripts and methods differently; first map the roles below onto the code that already owns each responsibility. Do not create parallel attack or defender scripts merely because the example names in this document are absent.

| Role | Required responsibility |
|---|---|
| Judgment coordinator | Resolve one landed hit, predict lethality, call the Defender's damage method, and start the knockback pulse cycle only if the target survives. |
| Defender damage owner | Own HP mutation, death branching, damage-skin presentation, death freeze, and respawn. It does not start non-lethal HIT reactions. |
| Defender reaction owner | Own facing lock, pulse-window velocity snapshot, knockback force, optional `HIT` state transition, reaction timer, and release of the hit-owned movement lock. This may be the same component as the damage owner. |
| Action/movement lock owner | Report whether an independent protected action such as `ATTACK` still owns movement. Releasing a hit lock must not clear this lock. |
| State/animation registration | Provide a valid `HIT` state and map it to the monster's hit action. In the canonical component pipeline, keep `HitComponent`, `StateComponent`, and `StateAnimationComponent` configured consistently. |

Use the following sequence as a low-freedom implementation contract. Method names are descriptive placeholders; preserve the ordering and ownership even when adapting them to existing APIs. Since this is a guide, refine and adapt it for the current project. You do not need to copy all the logic, as long as the sequence and responsibility of the flow are preserved. The code below is purely illustrative; you do not have to follow all details as long as the behavior is guaranteed. Adapt it to your project's circumstances.

## Manual Hit Reaction Rule (required since the AttackComponent/HitEvent bypass — see [../architecture/divergences.md](../architecture/divergences.md))

The attack pipeline bypasses native `AttackComponent`/`HitEvent`, so the judgment coordinator must ask the project's existing reaction owner to start non-lethal HIT after damage confirms survival. `HitComponent` registration, StateSet/Condition transitions, native state nodes, direct `ChangeState`, and clip playback differ by effective model; discover them through [../player/preflight.md](../player/preflight.md). **The damage/HP method must not invent or start a parallel HIT topology.**

Required shape for the **Defender role** (non-lethal path only; never require a particular script or method filename):
**Eligible locomotion set**: `MOVE`, `STAND`, `IDLE`, `CHASE` etc.
**Protected actions**: `ATTACK`, `HIT`, `SKILL` etc.

- Preserve every existing component/state node that participates in the effective HIT route. Do not add or remove `HitComponent`, StateSet entries, or StateTypes based only on the reference pattern.
- On a non-lethal pulse, inspect the current State and use the discovered eligible locomotion set. Include an effective `CHASE` path when that State exists rather than assuming every moving monster uses `MOVE`. Protected actions keep their current animation while physical knockback/facing and the temporary movement lock may still apply.
- Track whether the pulse entered visible HIT separately from whether its physical movement lock is active. At reaction end, invoke the discovered return owner only if this pulse still owns HIT. Preserve a newer action and audit the destination State's `OnEnter` effects so recovery does not reset an unrelated AI wait cycle.
- **Must not fire on the killing hit.** The judgment coordinator calls the existing reaction capability only after damage returns and the discovered lethal/exclusion capability confirms survival. Recognize that this is explicitly different from hit effects.
- Physics cache/rollback coordinates with the discovered HIT entry/return callbacks; it does not require introducing `ChangeState("HIT")`/`ChangeState("IDLE")` calls where the project uses another owner.
- The Defender's damage entry point owns HP/death branching and damage-skin presentation only. It must not start the hit reaction by itself. After that method returns and the judgment coordinator confirms the hit was non-lethal, the knockback cycle starts pulse 1 by applying `SetForce` and starting the hit reaction together. This prevents duplicate first-pulse timers and keeps physical knockback paired with its optional HIT animation.

## Lock Ownership Rule (mandatory)

Do not model movement as one boolean that every system freely enables and disables. A hit reaction may acquire and release its own lock, but an active monster attack, cast, scripted action, death sequence, or other protected state may still own another lock.

- `BeginHitReaction` acquires the hit-owned lock even when `ATTACK` suppresses the HIT animation.
- `EndHitReaction` releases the hit-owned lock after `0.45s`.
- Re-enable movement/AI only when no independent lock owner remains. The hit-release capability must query the discovered monster attack/action/death owners before restoring Wander/Chase or another AI owner; extend that predicate for additional protected actions rather than inventing a parallel hit script.
- The fixed `0.09s` inter-pulse gap is movement-enabled only when no independent action/death lock remains.
- Never let the hit reaction force `IDLE`, enable AI, or clear a facing lock owned by another action.

## Face-Attacker-during-Hit-and-Death Rule (default for every landed hit)

The default facing rule for every landed hit, independently of whether knockback is allowed.

- Every landed hit, including a killing hit, turns the target to face the attacker. Facing and knockback have separate conditions: lethal hits still face the attacker even though knockback is skipped.
- For a predicted lethal hit, the mandatory order is `FaceAttacker → PreHitReaction → TakeDamage`. `PreHitReaction` must flush both `MoveVelocity` and residual Rigidbody force with `SetForce(Vector2.zero)` on the server **and through its client companion in the same attack tick**; server-only clearing can still leave a visible client-side death slide. Preserve the facing lock through the damage-skin death hold and the DEAD animation. Full absolute rule: [death.md](death.md)'s Pre-Lethal Physics Flush Rule.
- Facing direction: the target sits on the attacker's `dirX` side (that's how the frontal hitbox is built), so the attacker is on the target's opposite side — the target should face **toward** that opposite side, i.e. away from the knockback direction it is about to receive.
- Implementation: monster facing is written through `SpriteRendererComponent.FlipX` with a `SpriteFacesLeftByDefault` convention — reuse that single writer (discover the existing `FlipX` writer through [../player/preflight.md](../player/preflight.md) rather than adding a second one). Reuse the AI's **exact** formula rather than re-deriving a sign convention:

  ```lua
  local goingLeft = attacker.WorldPosition.x < target.WorldPosition.x
  sprite.FlipX = goingLeft ~= ai.SpriteFacesLeftByDefault   -- SpriteFacesLeftByDefault is typically true
  ```

- **Lock that facing for the active physical knockback window.** Store the latest landed hit's direction on the Defender and reapply it through the discovered facing owner while the hit lock remains active. This applies even when a protected action suppresses HIT animation.
- Acquire the Defender reaction's movement lock only while the physical knockback window is active. For non-lethal hits, release the hit-owned facing/movement locks and restore cached velocity in `EndHitReaction`; re-enable AI only if no independent attack/action/death lock remains. The following fixed `0.09s` delay has no hit-owned movement lock. If this pulse entered `HIT` and still owns that reaction at release, invoke the discovered existing return owner instead of forcing `IDLE`; preserve the interrupted locomotion state's cadence and avoid resetting destination `OnEnter` timers. For lethal hits, keep the existing death-freeze behavior through death presentation.
- When another player lands a non-lethal hit before the current reaction ends, replace the stored direction with that latest hit's dirX; the monster must face the most recent attacker for the remainder of the refreshed reaction window.
- Every repeated knockback pulse must call FaceAttacker before ApplyKnockback and PlayHitReaction. EndHitReaction releases the previous pulse's lock, so relying on the first pulse's facing is incorrect.
- Clear the facing lock on non-lethal EndHitReaction and on respawn. Do not clear it in the lethal transition; the killing attacker's direction must remain authoritative until the entity is hidden or respawned.
- Give facing and reapplication their own methods: FaceAttacker stores and locks the direction, and ApplyLockedHitFacing reapplies it.

## Knockback Direction & API Rule (default for every skill type, Rigidbody/MapleTile maps)

The default knockback implementation for all skills unless a skill explicitly requests something else (arc pop, upward launch, etc.).

- **API**: use `RigidbodyComponent:SetForce(Vector2)`, not `AddForce`. `SetForce` replaces the body's force outright, so a knockback pulse is not compounded by residual force from the target's own movement/AI. `AddForce` is only for genuinely additive effects (e.g. a sustained push) and is not the default for a one-shot knockback pulse. See also [../architecture/divergences.md](../architecture/divergences.md).
- **Direction**: horizontal-only by default — `Vector2(dirX * knockbackPower, 0)`. Do not add a vertical component (`y = 0`) unless the skill spec explicitly calls for a pop-up/launch knockback.
- **dirX meaning**: the direction *away from the attacker*, i.e. the same sign as the attack's facing direction (`playerController.LookDirectionX`, or equivalent) that was used to position the attack hitbox in front of the attacker. Since the target is inside that frontal hitbox, "away from attacker" and "the attacker's facing direction" are the same sign — do not derive direction from a separate attacker→target position subtraction; reuse the `dirX` already computed for hitbox placement.
  - Worked example: attacker stands to the right of the target and faces left (`dirX = -1`) to hit it → target is knocked further left → `Vector2(-1 * knockbackPower, 0)`.
- **Magnitude**: `knockbackPower` is the engine force magnitude passed to `RigidbodyComponent:SetForce`; it is not a world-unit distance, speed, or duration. The generic new-skill fallback is `1`; concrete rows may override it after tuning.
- Apply this pattern on every pulse of the Knockback Pulse Rule's repeating cycle above — each pulse re-`SetForce`s using the same cast-time `dirX`, regardless of how many pulses the cycle ends up running.

## Knockback Pulse Rule (default)

Knockback repeats in a pulse cycle **for as long as the damage-skin cascade is still displaying**, by default — not an opt-in variant for special skills, but the standard behavior for every skill going through the Manual Damage & Damage-Skin pipeline ([damage-presentation.md](damage-presentation.md)).

- **Pulse/hold budget**: current code uses `T = hitCount * damageSkinInterval`, the same conservative value used for `dieAnimationStartDelay`. Do not call `T` the literal first-to-last pop span; that span is `max(0, hitCount - 1) * damageSkinInterval` because the first pop has no project-authored initial interval.
- **Pulse 1**: fires immediately and unconditionally at hit time, together with the hit-reaction animation. **Knockback and the hit-reaction animation (`Monster:PlayHitReaction()`) must always fire together, in the same call site, never independently of each other** — this applies to every pulse, not just the first.
- **Pulse cadence**: after each pulse's hit-reaction animation finishes (`Monster.hitAnimationDuration`), wait a **fixed `0.09s`** — not a per-skill tunable, hardcode this the same way the Rigidbody WalkDrag Override Rule hardcodes `0.4` — before attempting the next pulse.
- **Movement-lock boundary**: the hit reaction owns movement/AI suppression only during each pulse's `HitReactionDuration` window. `EndHitReaction` restores the cached velocity and releases the hit-owned lock before the fixed `0.09s` inter-pulse delay begins. Therefore the monster may move or continue its behavior during every inter-pulse delay when no independent attack/action/death lock remains. The full `hitCount * damageSkinInterval` budget controls only whether another pulse is scheduled; it must never become one continuous hit-owned movement lock.
- **Cutoff check**: right before firing pulse 2 or later, compute the damage-skin time remaining at that moment (`T` minus elapsed time since pulse 1). If remaining is **less than a fixed `0.2s`**, skip that pulse entirely and end the cycle — do not fire it, do not schedule another check.
- If remaining ≥ `0.2s`, fire the pulse (knockback `SetForce` + `PlayHitReaction()` together) and schedule the next cadence/cutoff check the same way. This repeats until a cutoff check fails.
- **Never starts at all on a killing hit** — this is already covered by the existing "skip knockback on kill" check (Face-Attacker-during-Hit-and-Death Rule / Death Freeze Rule); the cycle simply never begins for a lethal hit, no separate logic needed.
- Re-validate target validity and the discovered immediate gameplay-exclusion capability on **every** scheduled pulse, not just the first — the target could become lethal from another source mid-cycle. Do not use `Monster.IsDead` as the shared guard; it is meaningful only to `ConditionIsDead` models.
- This makes `attackCount`/`damageSkinInterval` (via the conservative pulse budget `T`) the actual driver of how many pulses occur — there is no separate per-skill pulse-count or pulse-interval field. A short `T` naturally yields only one applied pulse once the cadence+cutoff math is applied.

## Rigidbody Pulse Velocity Reset & Rollback Rule (default for every skill's knockback)

A mandatory physics standard for all knockbacks:

- **Problem**: When a knockback is applied, an AI-fed `MoveVelocity` can fight the force, and restoring that old walking velocity at pulse end makes the monster visibly resume the pre-hit slide instead of cleanly handing movement back to AI.
- **Pulse velocity sequence — preserve this ordering when using this presentation model**:
  1. At every pulse call site, run `ApplyKnockback` first: set `body.MoveVelocity = Vector2.zero`, then `body:SetForce(Vector2(dirX * knockbackPower, 0))`.
  2. Immediately call `BeginHitReaction`/`PlayHitReaction` from the same call site. When no hit pulse is already active, cache the resulting post-clear `MoveVelocity` as the pulse-window rollback value. In the current implementation this is intentionally zero, not the monster's earlier AI walking velocity.
  3. During an active refreshed pulse, keep the first pulse-window snapshot and only refresh the end timer.
  4. At pulse end, restore that pulse-window snapshot before releasing the hit-owned AI/movement lock. AI may then choose fresh movement during the `0.09s` gap.
- Do not move the cache ahead of `ApplyKnockback` when using this pulse presentation model; doing so changes the rollback semantics and can reintroduce post-hit sliding.

## Rigidbody WalkDrag Override Rule (default for every monster entity)

A physics standard for all monster entities:

- **Problem**: The engine's native monster physics (on MapleTile) injects extremely high default ground friction (`WalkDrag` up to 1000), causing knockback forces to stop abruptly without sliding.
- **Solution**: During initialization (`OnBeginPlay()`), explicitly override the target's `RigidbodyComponent.WalkDrag` to **`0.4`**. This reduces ground friction, allowing the target to slide smoothly, fluidly, and naturally when knockback force is applied, perfectly matching classical MapleStory knockback physics.

## Required Acceptance Matrix

Do not consider a new-project implementation complete until all rows behave as follows:

| Scenario | Animation | Physics and movement |
|---|---|---|
| Non-lethal hit during every reachable locomotion state (`IDLE`, `MOVE`, `CHASE`, custom) | Enter visible HIT through the existing owner; return through the prior/declared owner only if the pulse still owns HIT, without restarting an unrelated `OnEnter` wait cycle. | Knock back and lock movement for `0.45s`; allow movement in the following `0.09s` gap. |
| Non-lethal hit during `ATTACK` or another protected action | Preserve the current action; do not display `HIT`. | Apply knockback and the hit-owned temporary lock; do not release the action's own movement lock. |
| Another state starts during a HIT pulse | Preserve the newer state at pulse end. | Release only the hit-owned lock. |
| Another hit refreshes an active pulse | Keep the first pulse-window snapshot; refresh the reaction end timer. | Do not replace the snapshot during the active pulse. |
| Lethal hit | Never enter `HIT`; follow the death sequence. | Flush velocity and residual force before damage; never start knockback. |
| Pulse gap while no protected action is active | No forced animation. | Monster AI/movement may run during the gap. |
| Pulse gap while an attack/action remains active | Preserve that action. | Keep only that action's lock; the hit lock is no longer active. |

## Example Code Guideline

For concrete implementation examples of this system (Logic, Monster script template), please refer to the separate code reference guide file: [hit-reaction-code.md](hit-reaction-code.md).
