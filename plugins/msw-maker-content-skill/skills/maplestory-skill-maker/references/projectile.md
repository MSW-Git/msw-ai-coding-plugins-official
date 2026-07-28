# Projectile Attack Skill

The projectile type (`projectile_attack_skill`). Its **gameplay judgment is identical to `normal_attack_skill`** — cast-time `OverlapBox` snapshot, single lump-sum `TakeDamage`, shared judgment, the same knockback / damage-skin / hit-effect / death rules. It diverges from `normal_attack_skill` in exactly two ways: (1) `hitDelay` is **computed at runtime from a flying projectile's travel time** instead of being an authored constant, and (2) a **pooled projectile entity** visually travels from caster to target so the hit presentation coincides with the projectile arriving. See [../SKILL.md](../SKILL.md) for the Domain Reference Files index. Data fields: [skill-data-contract.md](skill-data-contract.md). Judgment model this reuses: [targeting-judgment.md](targeting-judgment.md).

## Core divergence — computed `hitDelay`, not authored

For `normal_attack_skill`, `hitDelay` is a fixed number tuned against the cast animation's hit frame. **For `projectile_attack_skill`, `hitDelay` is not authored at all — it is computed per target at cast time from a fixed-tick movement model:**

```
PROJECTILE_TICK  = 0.03                                            -- fixed movement tick, seconds
ticks(target)    = distance(spawnPos, targetBodyCenter) / projectileSpeed
hitDelay(target) = ticks(target) * PROJECTILE_TICK
```

- **`projectileSpeed` is world units advanced per `0.03s` movement tick — NOT units per second.** The projectile advances `projectileSpeed` units on each fixed `0.03s` step (a fixed timer, not a per-frame `delta` multiply), and the visual travel and the computed `hitDelay` must use the same tick so arrival and hit presentation coincide. Effective units/sec is therefore `projectileSpeed / 0.03`. Project-standard default is `0.25` (per tick); it is a feel value — confirm/override per skill (a faster bolt uses a larger value, a slow lob a smaller one).
- `spawnPos` = caster position + `projectileSpawnOffset` (the offset's X flips with attack facing, like effect offsets — see [damage-presentation.md](damage-presentation.md)).
- `targetBodyCenter` = the **monster's body center** (collider / renderer bounds center), **not** the entity's raw origin / feet. Resolve the real center at cast time; the cast-time value is cached and used for the whole flight (no live re-scan — same snapshot rule as the delayed model).

This is why "the projectile flying and then the hit effect popping when it lands" needs no real-time collision: the distance and per-tick speed fully determine when the projectile arrives, so the arrival time is known the instant the snapshot is taken.

**Optional `launchDelay` windup (standard default `0.27`; set `0` for no windup).** A skill may delay the projectile's launch by `launchDelay` seconds after cast (e.g. to sync with a cast animation's release frame). The cast effect / sound / snapshot still happen at cast time (t=0); the projectile spawns at `t = launchDelay`, travels `flightTime`, and the real judgment fires at `t = launchDelay + flightTime`. Schedule the launch and the judgment as two independent `SetTimerOnce`s at `launchDelay` and `launchDelay + flightTime`.

## Judgment model — same as `normal_attack_skill`, per-target scheduling

The projectile type is the `judgmentTiming = "delayed"` model (judgment and presentation fire together, so the **Death-Hold Rule does not apply**), with one structural change: because each target sits at a different distance, **each snapshot target is scheduled independently at its own computed `hitDelay`.**

At each target's computed arrival time, run the exact `normal_attack_skill` delayed step for that one target:

1. Re-check the snapshot target is still valid and not already dead; if invalid/dead, skip (log the skip reason) and still retire that target's projectile visual.
2. Apply the real judgment **exactly once** for that target: `damage * attackCount` as one lump sum via a single `target.Monster:TakeDamage(attacker, totalDamage, attackCount, damageSkinInterval, skinId)` (see [targeting-judgment.md](targeting-judgment.md)'s Count Ownership Rule). HP drops at this moment — the same "at the judgment moment" timing `normal_attack_skill` uses, just that the moment is the computed arrival rather than a fixed delay.
3. Present hit effect (per `hitEffectPolicy`), hit sound, then the knockback pulse cycle, with the Face-Attacker-on-Hit turn if the target survived — all identical to `normal_attack_skill` (see [damage-presentation.md](damage-presentation.md), [knockback-hit-reaction.md](knockback-hit-reaction.md)).
4. The killing-hit rules that hold **regardless of `judgmentTiming`** still apply: Death Freeze from the instant `IsDead` becomes true, no knockback on the lethal hit, and the die animation must not start before that target's own damage-skin cascade finishes (see [death-sequence.md](death-sequence.md)).

### Distance-based stagger replaces `staggerInterval`

`normal_attack_skill`'s multi-target ordering uses a fixed `staggerInterval` increment (nearest→furthest). **The projectile type does not use `staggerInterval`** — the per-target computed `hitDelay` already produces a nearest-first, distance-proportional stagger for free. Do not additionally apply `staggerInterval` on top of the computed times.

## Projectile visual — pooled entity, never destroyed

The flying projectile is a spawned **entity from a minimal `.model`**, not an effect:

- The model carries only a **`TransformComponent` + `SpriteRendererComponent` + the `script.ProjectileMover` component** — nothing heavier (no Body, no collider). One generic projectile model is reused across skills; its look is set per skill by assigning the skill's `projectileRuid` to the `SpriteRendererComponent.SpriteRUID` at launch (empty `projectileRuid` → invisible, so treat it like any other RUID field).
- **Movement is owned by a per-projectile `ProjectileMover` `@Component` on the projectile `.model`**, not by a central timer loop in the pool `@Logic`. The mover uses the **precompute-time model**: on `Begin(startPos, targetPos, flightTime)` it caches the endpoints and the flight time, then in `OnUpdate(delta)` it accumulates elapsed time and lerps `startPos → targetPos`; when `elapsed >= flightTime` it snaps to the target and retires. `flightTime` is the same value the type handler computes for `hitDelay`, so the visual arrival and the (separately scheduled) judgment coincide without a shared clock. The mover runs `ServerOnly` (the spawned projectile is server-authoritative; its transform replicates to clients).
- **On arrival the projectile disappears and returns itself to the pool** (the mover calls the pool's `Retire`) — **never `Destroy`ed.** Because a disabled (retired) entity gets no `OnUpdate`, idle pooled projectiles cost nothing.

### Role split: pool `@Logic` + mover `@Component` (both new)

A projectile is spawned and retired many times per second across all casters, so per-shot `SpawnByModelId` + `Destroy` is not acceptable. Per the Reuse-or-New-File Rule (see [skill-framework.md](skill-framework.md)), the two new responsibilities each get their own script:

- **Pool `@Logic`** (world-wide shared infrastructure — not inside the Registry Logic or Player Adapter): `Acquire` hands out an idle pooled projectile (spawns a new one only when the pool is empty), sets its `SpriteRUID` from `projectileRuid`, positions it at `spawnPos`, and flips it to face travel direction; `Launch` acquires then calls the mover's `Begin(...)`; `Retire` (called by the mover on arrival, or on a failed launch) **parks the projectile far off-screen (e.g. `(-9999, -9999)`) before hiding it**, then returns it to the idle set — never `Destroy`. The off-screen park matters: on the next `Acquire` there can be a one-frame gap between re-enabling the entity and writing its new spawn position, during which the projectile would otherwise flash for a frame at its previous (last-hit) location; parking it off-screen keeps that stray frame invisible. Spawn parent must be a real map entity (the caster's `CurrentMap`), never `nil`.
- **`ProjectileMover` `@Component`** (per-projectile behavior, lives on the projectile `.model`): owns the movement + self-retire described above. Because it is a script component on the `.model`, author the `.mlua` and `refresh` **before** patching it onto the `.model`, then `refresh` again (script-before-model order).

The projectile type handler in the Registry Logic drives *when* to launch (cast-time snapshot → compute per-target `flightTime` → at `launchDelay` call the pool's `Launch` → schedule the judgment `SetTimerOnce` at `launchDelay + flightTime`, so it fires exactly when the mover's own `flightTime` travel ends); the pool `@Logic` owns acquire/release; the mover `@Component` owns travel. Record the pool `@Logic`, the mover `@Component`, and the projectile `.model` under Current Project Instantiation once created (they are not instantiated until the first projectile skill is built — do not assume they exist).

## Empty-snapshot behavior (confirmed)

When the cast-time snapshot finds **no** target, still launch **exactly one** projectile in the caster's facing direction. It travels at `projectileSpeed` (same tick model) and retires **back to the pool** when it reaches the far edge of the cast detection range (i.e. max range, derived from the forward extent of the cast hitbox) — with **no** judgment and **no** hit presentation. Only the no-target case fires this single dud; when one or more targets exist, it is one projectile per target as usual (no extra dud).

## Logs

Add checkpoints for: skill key + `type = "projectile_attack_skill"`, the snapshot candidate count, each target's computed `hitDelay` (with its distance and `projectileSpeed`), projectile acquire/release from the pool, per-target judgment fired / skip reason (already dead / invalid), and "hit landed, presented as N hits".
