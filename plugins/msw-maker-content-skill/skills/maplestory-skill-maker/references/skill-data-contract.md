# Skill Data Contract

The data shape every concrete attack skill is stamped out from, and the fields to capture when a new skill type is defined. See [../SKILL.md](../SKILL.md) for the Domain Reference Files index. This file defines the *shape* of one skill's data; [skill-framework.md](skill-framework.md) defines *where it lives* (one entry per skill key in `AttackSkillLogic.SkillDatabase`) and how a skill of a given `type` gets dispatched to its handler.

## Type Design

| Type | Purpose | Server action | Client visuals | Main tunables |
|---|---|---|---|---|
| `normal_attack_skill` | Direct area attack, single-target-nearest or AoE, with the real judgment and its presentation sharing one timing (default) or intentionally split (opt-in) | Snapshot enemies in range at cast time; at `hitDelay`, run the real judgment exactly once (`damage * attackCount` as one lump sum via a single `TakeDamage` call) against the snapshot target(s) | Play caster avatar attack animation and cast effect immediately at cast time (attached to the caster — see [cast-effect-attachment.md](cast-effect-attachment.md)); at `hitDelay`, present one knockback pulse, hit effect(s) per `hitEffectPolicy`, and the damage-skin cascade (manual `_DamageSkinService:Play` split) | damage, cooldown, attackRangeX, attackRangeY, maxTargetCount, hitDelay, attackCount, judgmentTiming, castEffectRuid, hitEffectRuid, castSoundRuid, hitSoundRuid, hitEffectPolicy, damageSkinInterval, knockbackPower, animationKey, hitEffectOffset |
| `projectile_attack_skill` | Same gameplay judgment as `normal_attack_skill`, but a pooled projectile entity visually flies to each target and the hit presentation coincides with its arrival | Same cast-time `OverlapBox` snapshot and same single lump-sum `TakeDamage` per target — but `hitDelay` is **computed per target at runtime** as `(distance(spawnPos, targetBodyCenter) / projectileSpeed) * 0.03` (`projectileSpeed` = units per `0.03s` tick), and each target is scheduled independently at its own computed time (`judgmentTiming` is effectively `"delayed"`; Death-Hold does not apply) | Play caster avatar attack animation + cast effect at cast time; acquire a **pooled** projectile entity (minimal Transform + SpriteRenderer `.model`, `SpriteRUID = projectileRuid`) and move it from `spawnPos` to the cached target body-center; on arrival, present hit effect / damage skin / knockback exactly as `normal_attack_skill` and **release the projectile back to the pool (never `Destroy`)** | everything from `normal_attack_skill` **except** `hitDelay` (computed, not authored) and `staggerInterval` (unused — distance drives the stagger), **plus** projectileSpeed, projectileRuid, projectileSpawnOffset. Full behavior: [projectile.md](projectile.md) |

Two skill types are defined: `normal_attack_skill` and `projectile_attack_skill`. Add a new row here (with Server action / Client visuals / Main tunables filled in from a real confirmed spec) only once the user defines a further type — do not stub a placeholder type ahead of time.

`judgmentTiming` (default `"delayed"`):

- `"delayed"` (**default**): the real judgment itself waits until `hitDelay` and fires in the SAME callback as the presentation (knockback, hit effect, damage-skin split). There is no gap between HP loss and visuals, so the Death-Hold Rule (see [death-sequence.md](death-sequence.md)) does not apply. Behavioral detail: [targeting-judgment.md](targeting-judgment.md).
- `"immediate"` (legacy/opt-in — only when a skill explicitly needs HP to drop at cast time while visuals lag behind): judgment fires at cast time; presentation is delayed by `hitDelay`. This is the only variant that needs the Death-Hold Rule, since a monster can die before its hit effect/damage skin have played.

## Must-Ask vs Standard-Default Fields

Every field in the Concrete Skill Data Shape below falls into exactly one of these two buckets — treat the split itself as a rule, not just the current numbers:

- **Must-ask (no safe universal default — always ask per skill, per the MANDATORY PROACTIVE QUESTIONING workflow in `../SKILL.md`)**: `damage`, `maxTargetCount`, `cooldown`, `hitDelay`, `attackRangeX`, `attackRangeY`, `hitEffectPolicy` (this is a separate question from `attackCount` — it decides *how many times* a hit effect replays, not how many damage-skin pops appear), `castSoundRuid`, `hitSoundRuid`. Never silently carry over the illustrative example value for these — they are gameplay/feel decisions specific to each skill. **Projectile type only (`type = "projectile_attack_skill"`):** `hitDelay` is **not** must-ask (nor authored at all — it is computed at runtime, see below). `projectileSpeed` is not must-ask either — it has a project-standard default (see next bullet), but it is a feel value, so confirm/override it whenever the skill wants a specific projectile pace.
- **Has a project-standard default (confirm only if the skill needs something unusual)**: `judgmentPolicy`, `castDelay`, `detectRange`, `damageSkinInterval`, `staggerInterval`, `knockbackPower`, `playRate`, `targeting`, `attackCount`, `castEffectRuid`, `hitEffectRuid`, `animationKey`, `hitEffectOffset`, plus (projectile type only) `projectileSpeed`, `launchDelay`, `projectileRuid`, `projectileSpawnOffset`. `projectileSpeed` defaults to `0.25` and is **world units advanced per `0.03s` movement tick, not units/second** (effective units/sec = `projectileSpeed / 0.03`). `launchDelay` defaults to `0.27` — the windup in seconds between cast and the projectile actually launching; the projectile spawns at `launchDelay`, travels `flightTime`, and the real judgment fires at `launchDelay + flightTime`. `projectileSpawnOffset` defaults to `Vector3(0.05, 0.28, 0)` (launch-point nudge from the caster; X flips with facing). `projectileRuid` defaults to `d393500fd23f4537a2dd1f65089fc4a1`. These projectile defaults are the "make it however you want" fallbacks — still override them whenever the skill names a specific pace / art. See [projectile.md](projectile.md). `projectileRuid` is the sprite RUID assigned to the pooled projectile entity's `SpriteRendererComponent.SpriteRUID`; an empty value renders the projectile invisible, so override it whenever the skill has a specific art theme. `projectileSpawnOffset` is a `Vector3` local nudge of the launch point from the caster; its X flips with attack facing like `hitEffectOffset`. `staggerInterval` is **ignored for the projectile type** — the per-target computed `hitDelay` already produces the distance-based stagger; do not also apply it. `hitEffectOffset` defaults to `Vector3.zero` (hit effect attaches at the target's origin) — a `Vector3` local-space nudge for the target-side hit effect whose X flips with attack facing; it is **not** must-ask (never add it to the per-skill questionnaire), only set it when a skill's hit effect visibly needs repositioning (see [damage-presentation.md](damage-presentation.md)'s Hit Effect Offset Rule). `knockbackPower`'s standard default is `1.5`, not `1` — `1` is too weak to feel (see [knockback-hit-reaction.md](knockback-hit-reaction.md)); do not use `1` as an example value anywhere in this skill's docs. `attackCount` defaults to `2`; `castEffectRuid` defaults to `2a0d72e836fb4862aae83087035f3d2a`; `hitEffectRuid` defaults to `598d2d1859e84eaab18ae460a0a1e0a4`. Still ask explicitly (and override the default) whenever the user names a specific skill theme or resource — these are fallbacks for "make it however you want", not a hard rule to always reuse the same effect. `animationKey` defaults to `"attack"` (the native `MapleAvatarBodyActionState` pose) when a skill's data leaves it `nil`/`""` — the Player Adapter's `RequestUseSkill` applies this fallback itself, so omitting the field is safe. Unlike the other fields in this bucket, `animationKey`'s *value* also controls *which code path* plays it: any of the 14 native pose names (`stand`/`walk`/`attack`/`hit`/`crouch`/`fall`/`rope`/`ladder`/`dead`/`sit`/`heal`/`alert`/`fly`/`blink`) goes through the original `SetActionSheet` path automatically, and any other custom action id (a skill-specific clip name) automatically goes through the one-shot `ActionStateChangedEvent` path instead — see [casting-lock.md](casting-lock.md) principle 2 and principle 7 for why both paths are required and how the dispatch works. Still ask explicitly whenever the skill wants a distinct visual motion; the default only covers the "didn't specify one" / "do it however you want" case.
- **"Do it however you want" (whole-skill delegation)**: when the user delegates the entire must-ask questionnaire this way instead of answering it field by field, do not spend effort searching/inventing a bespoke value for every must-ask field. Fill every field that has a project-standard default (this section) with that default, and only use judgment (or a quick `msw-search` pass) for the handful of fields that remain genuinely must-ask with no default (`damage`, `maxTargetCount`, `cooldown`, `hitDelay`, `attackRangeX`, `attackRangeY`, `hitEffectPolicy`, `castSoundRuid`/`hitSoundRuid` — sound can stay `""`).

`hitDelay` in particular has no safe universal number even as an illustrative placeholder: it is the gap between cast and real judgment, and per this project's own precompute-real-duration standard (see [damage-presentation.md](damage-presentation.md)'s Damage-Skin Overkill Hold Rule for the equivalent pattern on death timing), it should be tuned against the actual cast animation's real hit-frame timing rather than guessed. Treat any numeric value shown for it in this doc as a placeholder to be overwritten per skill, not a recommendation. **For `type = "projectile_attack_skill"`, `hitDelay` is not tuned or authored at all — it is computed per target at runtime as `(distance(spawnPos, targetBodyCenter) / projectileSpeed) * 0.03`, where `projectileSpeed` is world units per `0.03s` tick (not units/second). Any authored `hitDelay` on a projectile skill is ignored. Tune `projectileSpeed` instead (see [projectile.md](projectile.md)).**

**Damage-skin RUID is intentionally NOT a field in this data shape at all.** It defaults to the attacker's (Player's) own `DamageSkinSettingComponent.DamageSkinId.DataId`, read at damage-application time — not a per-skill tunable, and not something `Monster`/the defender owns either (see [damage-presentation.md](damage-presentation.md)'s Manual Damage & Damage-Skin Rule). Do not add a `damageSkinRuid`-style field to a new skill's data shape by default; only introduce one if a specific skill is confirmed to need a different damage-skin look than the player's own default.

## Recording a New Skill Type

When the user gives new guide rules for a skill type not yet defined, record the following here before implementing:

- Skill type name.
- Required fields.
- Optional fields.
- Execution side: server, client, or split.
- Hit timing: instant, delayed, repeated tick, or chained hit.
- Visual timing: cast effect, travel effect, hit effect, damage skin, after-effect.
- Damage timing and formula.
- Cooldown and cast delay behavior.
- Animation key and lock release rule.
- Targeting rule.
- Death-hold and delayed death presentation rule.
- Multi-hit damage, shared judgment, damage-skin, knockback, and hit-effect presentation rule.
- Failure cases and logs.

## Concrete Skill Data Shape

Start with this data shape and adjust only when the guide requires it. This table is what goes into one `AttackSkillLogic.SkillDatabase[key]` entry (see [skill-framework.md](skill-framework.md)) — it is not a set of inspector properties on `PlayerAttack.mlua`:

```lua
{
    key = "skill_key",
    type = "normal_attack_skill",
    judgmentTiming = "delayed", -- "delayed" (default) | "immediate" (legacy, needs death-hold)

    -- MUST ASK the user per skill — no safe universal default, do not carry over the placeholder value:
    damage = 5, -- per-hit damage; real judgment uses damage * attackCount as one lump sum (judgmentTiming="delayed")
    maxTargetCount = 1, -- how many simultaneous targets the cast-time snapshot keeps (see targeting-judgment.md)
    cooldown = 1,
    hitDelay = 0.12, -- placeholder only; must be tuned against the real cast animation's hit-frame timing, never guessed
    attackRangeX = 1.0, -- BoxShape half-extent width used for the attack hitbox
    attackRangeY = 1.0, -- BoxShape half-extent height used for the attack hitbox
    hitEffectPolicy = "once", -- "once" | "per_hit" | "custom" — a SEPARATE question from attackCount, do not infer one from the other
    castSoundRuid = "", -- leave "" as a dummy hook until a RUID is assigned; do not block implementation on missing sound
    hitSoundRuid = "",

    -- Has a project-standard default; confirm only if the skill explicitly needs something unusual:
    judgmentPolicy = "shared", -- only meaningful for judgmentTiming="immediate" (one judgment reused per repeated hit)
    castDelay = 0.0,
    detectRange = 20.0,
    damageSkinInterval = 0.12, -- stagger between damage-skin pops (manual _DamageSkinService:Play split) and, if hitEffectPolicy="per_hit", between hit effect replays
    staggerInterval = 0.05, -- sequential delay increment per target (0s, 0.05s, 0.10s, ...) from nearest to furthest for multi-target hits
    knockbackPower = 1.5, -- 1 is too weak to feel — see knockback-hit-reaction.md
    playRate = 1.2,
    attackInfo = "skill.skill_key",
    targeting = "nearest",
    attackCount = 2, -- project-standard default; how many hits the presentation fakes (manual _DamageSkinService:Play split), NOT a repeated real judgment
    castEffectRuid = "2a0d72e836fb4862aae83087035f3d2a", -- project-standard default cast effect
    hitEffectRuid = "598d2d1859e84eaab18ae460a0a1e0a4", -- project-standard default hit effect
    hitEffectOffset = Vector3.zero, -- Vector3 local-space nudge for the target-side hit effect; default zero (target origin).
                                    -- X flips with attack facing (off.x * dirX); nil/omitted behaves as zero. See damage-presentation.md.
    animationKey = "attack", -- project-standard default (native pose, nil/"" also falls back to this).
                              -- Set to a custom clip name (e.g. "CustomSlash") to auto-switch to the one-shot
                              -- ActionStateChangedEvent path instead — see casting-lock.md principle 2 + 7.
}
```

For `judgmentTiming = "immediate"`, `damageSkinInterval` above still covers the damage-skin pop interval; add these legacy per-pulse fields when knockback and hit-effect repeats need their own independent timing instead of sharing `damageSkinInterval`:

```lua
knockbackInterval = 0.08,
hitEffectInterval = 0.08,
```

For `type = "projectile_attack_skill"`, drop the authored `hitDelay` (it is computed at runtime) and `staggerInterval` (unused — distance drives the stagger), and add the projectile fields. Everything else is identical to the shape above. Full behavior: [projectile.md](projectile.md).

```lua
type = "projectile_attack_skill",
-- hitDelay is NOT authored here — computed per target as (distance(spawnPos, targetBodyCenter) / projectileSpeed) * 0.03

projectileSpeed = 0.25, -- world units advanced per 0.03s movement tick (NOT units/sec). Default 0.25; feel value, override per skill.
launchDelay = 0.27,     -- windup (s) before the projectile launches; hit fires at launchDelay + flightTime. Default 0.27.
projectileRuid = "d393500fd23f4537a2dd1f65089fc4a1", -- sprite RUID for the pooled projectile's SpriteRendererComponent.SpriteRUID ("" = invisible)
projectileSpawnOffset = Vector3(0.05, 0.28, 0), -- local launch-point nudge from the caster; X flips with attack facing
-- animationKey stays the generic "attack" fallback -- a projectile skill's custom cast clip is per-skill content
-- the author supplies, never a baked default. If the named clip doesn't exist, it silently falls back to the native pose.
```

For `hitEffectPolicy = "custom"`, extend the data shape only when needed, for example:

```lua
hitEffectTimeline = {
    { delay = 0.12, ruid = "", offset = Vector2(0, 0) },
    { delay = 0.20, ruid = "", offset = Vector2(0.1, 0.05) },
}
```
