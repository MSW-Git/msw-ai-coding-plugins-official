# Targeting & Judgment Timing

When the real damage judgment fires, who it targets, and how multi-hit judgment is shared. Player skills apply damage via a direct manual call (`target.Monster:TakeDamage(...)`), not `AttackComponent:Attack()` — see [divergence-declarations.md](divergence-declarations.md) and [damage-presentation.md](damage-presentation.md)'s Manual Damage & Damage-Skin Rule. The Runtime Sequence below runs inside the Registry Logic's `normal_attack_skill` type handler — one handler shared by every skill of this type, not a per-skill method (see [skill-framework.md](skill-framework.md)). See [../SKILL.md](../SKILL.md) for the Domain Reference Files index. Data field definitions: [skill-data-contract.md](skill-data-contract.md).

## Type 1: Normal Attack Skill

Use `normal_attack_skill` for direct skills that find enemies in an area and attack them immediately.

### Runtime Sequence (default: `judgmentTiming = "delayed"`)

1. On skill use (after the cooldown gate), detect enemies inside the configured area using a snapshot scan — `CollisionSimulator:GetSimulator(entity):OverlapBoxAll(collisionGroupName, position, size, angle)` against the attack hitbox, deduplicated by entity and ranked by distance (see [skill-data-contract.md](skill-data-contract.md) for `maxTargetCount`). This is the SAME detection call used for the real judgment now — there is no separate `Attack()`-based confirm step.
2. Snapshot the target(s) at cast time. The delayed callback (step 5+) must use this snapshot and must not re-scan the area later.
3. Play the caster's attack avatar animation immediately, at cast time.
4. Play the cast effect immediately, at cast time, **attached to the caster** (see [cast-effect-attachment.md](cast-effect-attachment.md)) — a caster-side sound stub may also fire here if the skill has one (no-op until a RUID is assigned).
5. At `hitDelay`, re-check the snapshot target is still valid and not already dead; if so, skip.
6. Apply the real judgment **exactly once**: compute `damage * attackCount` as a single lump sum and call `target.Monster:TakeDamage(attacker, totalDamage, attackCount, damageSkinInterval, skinId)` directly — no `Attack()` call, no `HitEvent`. `skinId` defaults to the attacker's own `DamageSkinSettingComponent.DamageSkinId.DataId`. The defender itself splits the lump sum into `attackCount` damage-skin pops and calls `_DamageSkinService:Play` manually (see [damage-presentation.md](damage-presentation.md)'s Manual Damage & Damage-Skin Rule).
7. If the target wasn't already dead (i.e. the hit "landed"), present in this order: hit effect (once, or `attackCount` times if `hitEffectPolicy = "per_hit"`), hit sound, then the single knockback pulse (with the Face-Attacker-on-Hit turn applied first if the target survived — see [knockback-hit-reaction.md](knockback-hit-reaction.md)).
8. Log the key checkpoints: cast (candidate count), delayed-judgment skip reasons (already dead / evaded), and the final "hit landed, presented as N hits" line.

### Runtime Sequence (opt-in: `judgmentTiming = "immediate"`, only when a skill explicitly needs this split)

1–2. Same cast-time detection/snapshot as above.
3. Apply damage judgment **immediately at cast time**. Roll hit/critical/evasion-style combat judgment once per cast target, then reuse that judgment for all `attackCount` damage instances. `damage` is per-hit damage, not total damage. If `damage = 50` and `attackCount = 3`, the target receives 50 damage three times immediately with the same judgment result (this variant DOES repeat the real judgment `attackCount` times, unlike the default).
4. Play the caster's attack avatar animation immediately.
5. Spawn or play the attack skill cast effect immediately (still attached to the caster).
6. After `hitDelay`, present the snapshot targets.
7. Show damage skins once per `attackCount`, using `damageSkinInterval` between repeated presentations.
8. Apply one light backward knockback pulse per `attackCount`, using `damageSkinInterval` (or a dedicated `knockbackInterval`) between repeated pulses — see the legacy per-pulse variant in [knockback-hit-reaction.md](knockback-hit-reaction.md)'s Knockback Pulse Rule.
9. Play hit effects according to `hitEffectPolicy` (see [damage-presentation.md](damage-presentation.md)).
10. When a target presents its hit, make it face the attacking user (see [knockback-hit-reaction.md](knockback-hit-reaction.md)'s Face-Attacker-on-Hit Rule).
11. If the target died from the immediate damage judgment, keep it visually held until all required hit effect and damage skin presentation is complete (see [death-sequence.md](death-sequence.md)'s Death-Hold Rule — required for this variant only).
12. After the required hit effect and damage skin presentation completes, release death hold and allow the monster Die animation to run.

## Type 2: Projectile Attack Skill

Use `projectile_attack_skill` when a pooled projectile must visually fly to each enemy and the hit presentation should land when the projectile arrives. **Its judgment is the Type 1 `judgmentTiming = "delayed"` sequence verbatim** — same cast-time snapshot, same single lump-sum `TakeDamage`, same Count Ownership / Shared Judgment / knockback / damage-skin / death rules. Only two things change; full behavior lives in [projectile.md](projectile.md):

1. **`hitDelay` is computed per target, not authored:** `hitDelay(target) = (distance(spawnPos, targetBodyCenter) / projectileSpeed) * 0.03`, where `projectileSpeed` is world units advanced per `0.03s` movement tick (not units/second) and `targetBodyCenter` is the monster's body center (bounds center, not raw origin) captured in the cast-time snapshot. An authored `hitDelay` is ignored for this type.
2. **Each snapshot target is scheduled independently** at its own computed `hitDelay` (targets at different distances are hit at different times). This distance-based stagger **replaces** `staggerInterval` — do not also apply the fixed increment.

Optionally, a `launchDelay` (standard default `0.27`; `0` for no windup) delays the projectile's launch after cast; the projectile then spawns at `launchDelay` and the judgment fires at `launchDelay + flightTime` (see [projectile.md](projectile.md)). Cast effect / sound / snapshot stay at cast time.

### Runtime Sequence (`projectile_attack_skill`)

1–2. Same cast-time detection/snapshot as Type 1 delayed, but also cache each target's **body-center** position (used for both the travel target and the distance→`hitDelay` computation).
3. Play the caster's attack avatar animation + cast effect immediately at cast time (attached to the caster).
4. For each snapshot target: compute `hitDelay(target)`, and at `launchDelay` (t=0 if there is no windup) acquire a **pooled** projectile entity (minimal Transform + SpriteRenderer `.model`, `SpriteRUID = projectileRuid`), place it at `spawnPos`, and start it moving toward the cached body-center so it arrives `hitDelay(target)` later — i.e. at absolute time `launchDelay + hitDelay(target)`. Schedule the launch and the judgment as two independent `SetTimerOnce`s (`launchDelay` and `launchDelay + hitDelay(target)`), per [projectile.md](projectile.md).
   - If the snapshot has **no** target, still launch **exactly one** dummy projectile in the caster's facing direction; it travels at `projectileSpeed` and retires to the pool at the far edge of cast range with **no** judgment and **no** hit presentation (full rule in [projectile.md](projectile.md)'s Empty-snapshot behavior).
5. At each target's arrival time (`launchDelay + hitDelay(target)`): re-check that target is still valid and not already dead (skip + log if not, and still retire its projectile). Then run the **exact Type 1 delayed judgment for that one target** — one `target.Monster:TakeDamage(attacker, damage * attackCount, attackCount, damageSkinInterval, skinId)` (HP drops here), then hit effect / hit sound / knockback pulse cycle with the Face-Attacker-on-Hit turn if it survived.
6. Retire that target's projectile **back to the pool (never `Destroy`)** at arrival.
7. Killing-hit rules that hold regardless of `judgmentTiming` still apply (Death Freeze, no knockback on the lethal hit, die animation not before the damage-skin cascade — see [death-sequence.md](death-sequence.md)). Death-Hold (immediate-only) does **not** apply.
8. Log per target: computed `hitDelay` (with distance + `projectileSpeed`), pool acquire/release, judgment fired / skip reason.

## Count Ownership Rule (consolidated judgment)

Real gameplay judgment must NOT be repeated `attackCount` times (default).

- **Real judgment happens exactly once per cast**, at `hitDelay`, using the cast-time target snapshot: one `target.Monster:TakeDamage(attacker, damage * attackCount, attackCount, damageSkinInterval, skinId)` call, one HP subtraction. Knockback is a repeating pulse cycle bound to the damage-skin cascade's total duration, not a single one-shot pulse (see [knockback-hit-reaction.md](knockback-hit-reaction.md)'s Knockback Pulse Rule).
- `attackCount` only controls how many separate hits the **presentation** fakes:
  - Damage skin: pass `attackCount` as `TakeDamage`'s `hitCount` argument, which the defender uses to split the lump sum into that many pops for `_DamageSkinService:Play` (see [damage-presentation.md](damage-presentation.md)'s Manual Damage & Damage-Skin Rule) — there is only ever one call site for this now, so there's no "double-call" risk to guard against.
  - Hit effect count is controlled by `hitEffectPolicy`, independent of the above — default `"once"`.
- Critical hits are not currently modeled for player skills — `TakeDamage` always displays pops as non-critical (`bCritical = false`). Add a critical parameter only when a skill actually needs one.

This separation is required so the same skill type can create both examples:

- `damage = 50`, `attackCount = 3`, `hitEffectPolicy = "once"`: one real judgment for 150 damage, one knockback pulse, damage skin splits into 3 staggered "50" pops, hit effect plays once.
- `damage = 50`, `attackCount = 3`, `hitEffectPolicy = "per_hit"`: same single real judgment and knockback, but the hit effect also replays 3 times (spaced by `damageSkinInterval`) to match the damage-skin cascade.

## Shared Judgment Rule (only meaningful for `judgmentTiming = "immediate"`)

For the default `judgmentTiming = "delayed"`, this rule is automatically satisfied — there is only ONE real damage call (`TakeDamage`), so there is nothing to keep "shared" across. There is no critical/evasion roll to share yet for player skills — see the Count Ownership Rule note above.

For the legacy `judgmentTiming = "immediate"` variant, multi-hit judgment must be shared, not rolled per hit:

- For each cast-time target, determine hit/critical/evasion-style judgment once at skill use time.
- Apply the same judgment result to every hit in `attackCount`.
- Example: if the first judgment is critical, all 3 hits are critical. If it misses/evades, all 3 hits follow that result.
- Do not implement older per-hit random judgment unless the user explicitly requests a new variant.
- Store this as `judgmentPolicy = "shared"` in skill data to avoid ambiguity.
