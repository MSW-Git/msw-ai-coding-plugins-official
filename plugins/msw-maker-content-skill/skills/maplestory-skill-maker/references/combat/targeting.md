# Targeting & Judgment Timing

When the real damage judgment fires, who it targets, and how multi-hit judgment is shared. Player skills apply damage via a direct manual call (`target.Monster:TakeDamage(...)`), not `AttackComponent:Attack()` — see [../architecture/divergences.md](../architecture/divergences.md) and [damage-presentation.md](damage-presentation.md)'s Manual Damage & Damage-Skin Rule. The Runtime Sequence below runs inside the Registry Logic's `normal_attack_skill` type handler — one handler shared by every skill of this type, not a per-skill method (see [../architecture/framework.md](../architecture/framework.md)). See [../../SKILL.md](../../SKILL.md) for the Domain Reference Files index. Data field definitions: [../architecture/datasets.md](../architecture/datasets.md).

## Count Ownership Rule — consolidated judgment

Real gameplay judgment must **not** be looped `attackCount` times (default behavior).

- **The real judgment happens exactly once per skill, immediately at cast time, using a snapshot of targets at cast time**: call `target.Monster:TakeDamage(attacker, damage * attackCount, attackCount, damageSkinInterval, skinId, presentationDelay)` once for one HP deduction. `presentationDelay` is authored `hitDelay` for a normal attack and `launchDelay + flightTime` for a projectile; it delays damage-skin playback, not judgment.
- `attackCount` only controls the fake hit count for **visual presentation**:
  - Damage skin: pass `attackCount` as `hitCount` and the cast-to-presentation delay as `presentationDelay`. The defender applies HP immediately, then uses those arguments to schedule and split the consolidated damage into multiple pops through `_DamageSkinService:Play` (see [damage-presentation.md](damage-presentation.md)'s Manual Damage & Damage-Skin Rule).
  - The hit effect count is controlled directly by `hitEffectPolicy` (default `"once"`), regardless of the control method above.

This separation is essential to implement both of the following examples using the same skill type:

- `damage = 50`, `attackCount = 3`, `hitEffectPolicy = "once"`: A single real judgment for 150 damage occurs, a knockback pulse cycle bounded by the presentation budget (`attackCount * damageSkinInterval`) is applied, the damage skin is presented as 3 split-aligned "50" pops, and exactly one hit effect is played.
- `damage = 50`, `attackCount = 3`, `hitEffectPolicy = "per_hit"`: The same single real judgment and knockback pulse cycle as the previous example are applied, but the hit effect is also re-played 3 times spaced by `damageSkinInterval` intervals to match the cascading flow of the damage skin.

## Shared Judgment Rule

The current immediate-judgment contract makes exactly one real damage call (`TakeDamage`) per cast-time target. Roll hit/critical/evasion-style results once before that call and reuse the result for every damage-skin pop and hit-effect presentation derived from it; do not reroll during delayed presentation.

- For each cast-time target, determine hit/critical/evasion-style judgment once at skill use time.
- Apply the same judgment result to every hit in `attackCount`.
- Example: if the first judgment is critical, all 3 hits are critical. If it misses/evades, all 3 hits follow that result.
- Do not implement older per-hit random judgment unless the user explicitly requests a new variant.
- The current implementation always uses this shared policy and has no `judgmentPolicy` DataSet column. Do not emit a phantom field. If a future skill needs a different policy, add `judgmentPolicy` atomically to the DataSet, `SkillCatalogLogic` validation/normalization, and the relevant type handler before authoring values.

## Enforcement IDs

Instantiate these IDs under the `PAJ` priority gate before implementing any target-selecting or damaging player attack. The runtime sequences below remain the exact behavior authority.

| ID | Required mapping and proof |
|---|---|
| `PAJ-01` | Map the cast-time candidate query and immutable per-target snapshot, including every value delayed presentation will consume. |
| `PAJ-02` | Map the single synchronous consolidated damage judgment per snapshot target and prove its result or explicit skip. |
| `PAJ-03` | Map every timer, projectile-arrival, and other delayed callback; prove it performs presentation only and never rescans, rerolls, or reapplies damage. |
| `PAJ-04` | Record the candidate count, immediate judgment result/skip, delayed presentation result/skip, and final presented-hit count for every affected attack path. |

No ID may pass from prose inspection alone. Missing runtime checkpoint evidence leaves it `OPEN` or `BLOCKED` under [../execution-core.md](../execution-core.md#priority-enforcement-gates--fail-closed).

## Type 1: Normal Attack Skill

Use `normal_attack_skill` for direct skills that find enemies in an area and attack them immediately.

### Runtime Sequence (current fixed behavior: immediate judgment; no `judgmentTiming` column)

Damage judgment and hit presentation are separate actions. Apply HP judgment first at cast time; schedule hit effects, damage-skin playback, and non-lethal knockback for the presentation delay.

1. On skill use (after the cooldown gate), detect enemies inside the configured area using a snapshot scan — `CollisionSimulator:GetSimulator(entity):OverlapBoxAll(collisionGroupName, position, size, angle)` against the attack hitbox, deduplicated by entity and ranked by distance (see [../architecture/datasets.md](../architecture/datasets.md) for `maxTargetCount`). This is the **SAME** detection call used for the real judgment now — there is no separate `Attack()`-based confirm step.
2. Capture target(s) snapshot at cast time. Delayed callbacks (step 6 and later) MUST use this snapshot, never scanning range again.
3. Apply damage judgment **immediately** at cast time. Check whether the monster is already dead/invalid, compute `damage * attackCount`, and call `target.Monster:TakeDamage(attacker, totalDamage, attackCount, damageSkinInterval, skinId, hitDelay)` exactly once. HP changes synchronously; the final argument schedules the defender-owned damage-skin cascade for presentation time. Roll hit/critical/evasion-style judgment once per target before this call and reuse that result for every later pop/effect.
4. Play the caster's attack avatar animation immediately at cast time.
5. Play the cast effect **attached** to the caster immediately at cast time (see [../player/cast-effects.md](../player/cast-effects.md)). If the skill has caster-side sound, the sound stub can also fire here (does nothing until RUID is assigned).
6. Present snapshot targets after `hitDelay`. At `hitDelay`, re-check if the snapshot target is still valid (e.g. not Destroyed or nil), and skip presentation if not.
7. When the target is hit, force it to face the user who attacked it (see "Face Attacker during Hit and Death Rule" in [hit-reaction.md](hit-reaction.md)).
8. (See "Manual Damage & Damage-Skin Rule" in [damage-presentation.md](damage-presentation.md)).
9. Play hit effects according to `hitEffectPolicy` (see [damage-presentation.md](damage-presentation.md)).
10. Start the delayed standard knockback pulse cycle at presentation time. The conservative budget of this cycle is `attackCount * damageSkinInterval`. Pulse 1 fires immediately, and subsequent pulses fire with a cadence of `HitReactionDuration + 0.09s`, skipping any scheduled pulse if the remaining budget is less than `0.2s`. Do not re-interpret `attackCount` as the literal pulse count, and do not introduce a separate `knockbackInterval` unless both the schema and the complete cycle contract are explicitly extended together — see "Knockback Pulse Rule" in [hit-reaction.md](hit-reaction.md).
11. If immediate damage kills the target, keep the target visually frozen until all required damage skin presentation completes (see "Death-Hold Rule" in [death.md](death.md) — specific to this option).
12. Once required hit effect and damage skin presentation complete, release the death-hold and allow the monster's Die animation to run.
13. Record key checkpoints: cast (candidate count), immediate judgment result or skip reason (already dead / evaded), delayed presentation result or skip reason, and the final "hit succeeded, presented with N hits" line.

## Type 2: Projectile Attack Skill

Use `projectile_attack_skill` when a pooled projectile must fly visually to each enemy and hit presentation is applied upon arrival. Its judgment is **exactly identical to Type 1's current immediate-judgment sequence**: use the cast-time snapshot and apply one lump-sum `TakeDamage` per target at cast time. Projectile travel delays presentation, not HP judgment. The count ownership / shared judgment / damage-skin / death rules remain the same; only travel-driven presentation timing and pooling differ, as described in [projectile.md](projectile.md):

1. `hitDelay` is computed per target rather than fixed by the author: `hitDelay(target) = (distance(spawnPos, targetBodyCenter) / projectileSpeed) * 0.03`. Here, `projectileSpeed` is in world units advanced per `0.03s` travel tick rather than per second, and `targetBodyCenter` is the monster's body center (bounds center, not the raw origin) captured in the cast-time snapshot and must be implemented directly. The written `hitDelay` value is ignored in this type.
2. **Each snapshot target's presentation is scheduled independently** at its own computed `hitDelay` (targets at different distances are presented at different times). This distance-based stagger **replaces** `staggerInterval` — do not also apply the fixed increment.

Optionally, a `launchDelay` (standard default `0.45`, `0` for no windup) delays the projectile's launch after cast; the projectile then spawns at `launchDelay` and the hit presentation runs at `launchDelay + flightTime` (see [projectile.md](projectile.md)). Cast presentation/snapshot stay at cast time.

### Runtime Sequence (projectile_attack_skill)

1–2. Same cast-time detection/snapshot as Type 1 immediate, but also cache each target's **body-center** position (used for both the travel target and the distance→`hitDelay` computation).
3. Play the caster's attack avatar animation + cast effect immediately at cast time (attached to the caster).
4. For each snapshot target: compute `hitDelay(target)`, and at `launchDelay` (t=0 if there is no windup) acquire a **pooled** projectile entity (minimal Transform + SpriteRenderer `.model`, `SpriteRUID = projectileRuid`), place it at `spawnPos`, and start it moving toward the cached body-center so it arrives `hitDelay(target)` later — i.e. at absolute time `launchDelay + hitDelay(target)`. Schedule the launch with `SetTimerOnce` (`launchDelay` and `launchDelay + hitDelay(target)`), per [projectile.md](projectile.md).
   - If the snapshot has **no** target, still launch **exactly one** dummy projectile in the caster's facing direction; it travels at `projectileSpeed` and retires to the pool at the far edge of cast range with **no** judgment and **no** hit presentation (full rule in [projectile.md](projectile.md)'s "Empty-snapshot behavior").
5. At each target's arrival time (`launchDelay + hitDelay(target)`): re-check that target is still valid (skip presentation and log if not, and still retire its projectile). If the target is valid, hit effect / hit sound / knockback pulse cycle with the "Face-Attacker-during-Hit-and-Death" turn is applied.
6. Retire that target's projectile **back to the pool (never `Destroy`)** immediately at arrival.
7. (See [damage-presentation.md](damage-presentation.md)'s "Manual Damage & Damage-Skin Rule").
8. At presentation time, start the standard knockback pulse cycle. Its conservative budget is `attackCount * damageSkinInterval`; pulse 1 fires immediately, later pulses use `HitReactionDuration + 0.09s` cadence, and a scheduled pulse is skipped when less than `0.2s` of budget remains. Do not reinterpret `attackCount` as a literal pulse count and do not introduce a separate `knockbackInterval` unless the schema and the complete cycle contract are explicitly extended together — see [hit-reaction.md](hit-reaction.md)'s Knockback Pulse Rule.
9. Play hit effects according to `hitEffectPolicy` (see [damage-presentation.md](damage-presentation.md)).
10. When a target presents its hit, make it face the attacking user (see [hit-reaction.md](hit-reaction.md)'s Face-Attacker-during-Hit-and-Death Rule).
11. If the target died from the immediate damage judgment, keep it visually held until projectile arrival and all required hit-effect and damage-skin presentation complete (see [death.md](death.md)'s Death-Hold Rule — required by the current immediate-judgment contract).
12. After the required hit effect and damage skin presentation completes, release death hold and allow the monster Die animation to run.
13. Log per target: computed presentation `hitDelay` (with distance + `projectileSpeed`), pool acquire/release, immediate judgment result/skip reason, and delayed presentation result/skip reason.
