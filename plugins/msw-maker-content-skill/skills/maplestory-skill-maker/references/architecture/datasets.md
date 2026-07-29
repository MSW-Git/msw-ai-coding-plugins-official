# Skill Data Contract

The data shape every concrete attack skill is stamped out from, and the fields to capture when a new skill type is defined. See [../../SKILL.md](../../SKILL.md) for the Domain Reference Files index. This file defines one normalized attack row; [framework.md](framework.md) defines how `AttackSkillData` is loaded by `SkillCatalogLogic` and dispatched by type.

## Contents

- [Storage Contract (DataSet first)](#storage-contract-dataset-first)
- [Type Design](#type-design)
- [Timing, Range, and Magnitude Glossary](#timing-range-and-magnitude-glossary)
- [Concrete Skill Data Shape](#concrete-skill-data-shape)
- [Must-Ask vs Standard-Default Fields](#must-ask-vs-standard-default-fields)
- [Recording a New Skill Type](#recording-a-new-skill-type)

## Storage Contract (DataSet first)

Attack skills are authored as rows in the target project's attack-skill `UserDataSet`, not as a hardcoded skill table and not as per-skill properties on the player adapter.

### DATA enforcement IDs

Instantiate these rows from the `SKILL.md` startup gate before editing the target project:

| ID | Required mapping and proof |
|---|---|
| `DATA-01` | Discover the existing DataSet, catalog loader, and binding owners; decide reuse/integrate/create for each. Missing or incomplete infrastructure triggers [bootstrap.md](bootstrap.md). |
| `DATA-02` | Map the canonical schema to the actual `.userdataset` and project-managed CSV representation, or name the exact new assets that will be created. |
| `DATA-03` | Map the concrete attack row and, when directly usable, its `SkillBindingData` row. A script-only or hardcoded skill does not satisfy this ID. |
| `DATA-04` | Name the catalog load, required-column/row validation, family/type dispatch, and binding-resolution evidence. Static existence alone is not catalog evidence. |

Keep every ID `OPEN` until its implementation and required evidence exist. Missing Maker/runtime access may block `DATA-04`; it does not waive `DATA-01`–`DATA-03` or authorize a hardcoded fallback. Follow [../execution-core.md](../execution-core.md#priority-enforcement-gates--fail-closed).

Canonical columns:

```text
id,name,familyId,type,damage,attackCount,maxTargetCount,cooldown,hitDelay,
attackRangeX,attackRangeY,animationKey,hitEffectPolicy,castEffectRuid,hitEffectRuid,
hitEffectOffsetX,hitEffectOffsetY,hitEffectOffsetZ,castSoundRuid,hitSoundRuid,
damageSkinRuid,damageSkinInterval,staggerInterval,knockbackPower,
allowMove,allowJumpDuringCast,allowAirborneCast,allowTurn,
projectileSpeed,launchDelay,projectileRuid,
projectileSpawnOffsetX,projectileSpawnOffsetY,projectileSpawnOffsetZ
```

- Common required fields are validated for every row. `normal_attack_skill` additionally requires `hitDelay`; `projectile_attack_skill` requires projectile speed/launch/RUID/offset fields and computes hit timing at runtime.
- Vector values are stored as scalar X/Y/Z columns and normalized into `Vector3` by `SkillCatalogLogic`.
- Empty optional RUID/sound fields remain guarded no-op hooks. `damageSkinRuid` remains required by the current loader. The `animationKey` column remains part of the attack schema, but its cell may be empty: empty selects the native basic Attack fallback, a supported native name selects the corresponding avatar-root path, and every other non-empty value selects the custom one-shot body path. Movement keeps its separate empty-key/no-animation contract.
- Adding or renaming a field is one atomic schema change: update the DataSet, `SkillCatalogLogic` required-column validation and row normalization, this contract, and every type handler that consumes it. Never add only an in-script fallback.
- Runtime code receives `data = _SkillCatalogLogic:GetAttackSkillData(skillId)` (directly or through `_AttackSkillLogic:GetSkillData`) and does not read DataSet cells during a cast.
- The current project schema follows the natural immediate-judgment path, and there is no explicit `judgmentTiming` column in the DataSet itself.
- For the `hitSoundRuid` column, it may be specific to the skill or it may be configured differently for each monster. By default, it is configured differently for each monster, but the default value is provided filled in.

## Type Design

| Type | Purpose | Server action | Client visuals | Main tunables |
|---|---|---|---|---|
| `normal_attack_skill` | Direct area attack, single-target-nearest or AoE, with immediate real judgment and delayed hit presentation | Snapshot targets in range at cast time and apply `damage * attackCount` exactly once as a lump-sum `TakeDamage` call per accepted target | Play caster animation/effect immediately; at `hitDelay`, present hit effects, start the defender-scheduled damage-skin cascade, and start non-lethal knockback pulses bounded by `attackCount * damageSkinInterval` | damage, cooldown, attackRangeX, attackRangeY, maxTargetCount, hitDelay, attackCount, castEffectRuid, hitEffectRuid, castSoundRuid, hitSoundRuid, hitEffectPolicy, damageSkinInterval, knockbackPower, animationKey, hitEffectOffset |
| `projectile_attack_skill` | Same immediate gameplay judgment as `normal_attack_skill`, but a pooled projectile entity visually flies to each target and the hit presentation coincides with its arrival | Use the same cast-time `OverlapBox` snapshot and apply the same single lump-sum `TakeDamage` per target immediately. Compute each target's presentation delay at runtime as `(distance(spawnPos, targetBodyCenter) / projectileSpeed) * 0.03` (`projectileSpeed` = units per `0.03s` tick), then schedule its visual arrival independently. A lethal result activates Death-Hold until that target's delayed presentation completes | Play caster avatar attack animation + cast effect at cast time; acquire a **pooled** projectile entity (minimal Transform + SpriteRenderer `.model`, `SpriteRUID = projectileRuid`) and move it from `spawnPos` to the cached target body-center; on arrival, present hit effect / damage skin / non-lethal knockback exactly as `normal_attack_skill` and **release the projectile back to the pool (never `Destroy`)** | everything from `normal_attack_skill` **except** authored `hitDelay` (computed for presentation, not authored) and `staggerInterval` (unused — distance drives the stagger), **plus** projectileSpeed, projectileRuid, projectileSpawnOffset. Full behavior: [../combat/projectile.md](../combat/projectile.md) |

Two skill types are defined: `normal_attack_skill` and `projectile_attack_skill`. Add a new row here (with Server action / Client visuals / Main tunables filled in from a real confirmed spec) only once the user defines a further type — do not stub a placeholder type ahead of time.

`judgmentTiming` is a **conceptual extension axis**, not a current DataSet column. Currently, all skills operate with the fixed immediate judgment method below:

- `"immediate"` (**current fixed behavior**): damage is applied at cast time and presentation begins after `hitDelay`. Because lethal HP judgment can precede its visuals, the current contract requires the dedicated Death-Hold capability described in [../combat/death.md](../combat/death.md).

## Timing, Range, and Magnitude Glossary

Every time field below is measured in **seconds** unless explicitly stated otherwise. The numbers are illustrative, not seeded project values or universal defaults.

| Name | Exact meaning | Illustrative value | Common confusion to avoid |
|---|---|---:|---|
| `cooldown` | Server-authoritative minimum time from an accepted cast's cooldown stamp until the same `skillId` may be accepted again. | `0.8s` | Not animation duration or input-lock duration. |
| `hitDelay` | For `normal_attack_skill`, time from immediate cast-time judgment to the target's presentation callback. `TakeDamage` receives this as `presentationDelay`; hit effects, damage-skin playback, and non-lethal knockback begin when it elapses. | `0.45s` | Illustrative only; not `HitReactionDuration`, and `damageSkinInterval` is not added before the first pop. |
| `damageSkinInterval` | Pop-to-pop spacing passed as `_DamageSkinService:Play(..., delayPerAttack, ...)`. The project adds no separate initial-pop timer after `hitDelay`. | `0.24s` | Not the delay from cast to the first damage number. |
| `staggerInterval` | Extra delay per ranked target for a normal multi-target attack: target `i` uses `hitDelay + (i - 1) * staggerInterval`. | `0.05s` | Target 1 gets no stagger offset. Projectile attacks ignore this field. |
| `Monster.HitReactionDuration` | Defender-owned time from visible HIT entry until the discovered return owner releases it. It starts after judgment lands. It is not an attack-skill data column. | `0.45s` | It is unrelated to `hitDelay`, even when example values happen to match. |
| `attackRangeX` / `attackRangeY` | Full `BoxShape.Size` width/height in world units (`1 world unit = 100 px`). The normal handler places the box center `attackRangeX * 0.5` forward so the box starts at the caster and extends forward. | `3.0 × 1.2` | These are full dimensions, not half-extents. |
| `knockbackPower` | Engine `RigidbodyComponent:SetForce` magnitude on X: `Vector2(dirX * knockbackPower, 0)`. | `1` | Tune against the target Body and movement behavior. It is neither a distance nor a duration. |

For multiple damage-skin pops, distinguish two durations:

- **First-to-last pop span**: `max(0, hitCount - 1) * damageSkinInterval`.
- **Current conservative hold/pulse budget used by the implementation**: `hitCount * damageSkinInterval`. This intentionally includes one additional interval after the first-to-last span; call it a hold budget, not the literal pop span.

## Concrete Skill Data Shape

Start with this normalized runtime shape and adjust only when the guide requires it. It is produced from one attack-skill DataSet row by the discovered catalog owner (see [framework.md](framework.md)); it is not a hardcoded Registry entry or a set of inspector properties on the player attack adapter:

```lua
{
    id = 9001, -- illustrative only; discover or allocate a non-conflicting id
    name = "new_skill_name",
    familyId = _SkillCatalogLogic.FamilyAttack,
    type = "normal_attack_skill",

    -- MUST ASK the user per skill — no safe universal default, do not carry over the placeholder value:
    damage = 5, -- per-hit damage; immediate real judgment uses damage * attackCount as one lump sum at cast time
    maxTargetCount = 1, -- how many simultaneous targets the cast-time snapshot keeps (see ../combat/targeting.md)
    cooldown = 1,
    hitDelay = 0.12, -- placeholder only; must be tuned against the real cast animation's hit-frame timing, never guessed
    attackRangeX = 1.0, -- full BoxShape width in world units; handler offsets center by width * 0.5
    attackRangeY = 1.0, -- full BoxShape height in world units
    hitEffectPolicy = "once", -- "once" | "per_hit"; extending the enum requires a catalog/schema change
    castSoundRuid = "", -- leave "" as a dummy hook until a RUID is assigned; do not block implementation on missing sound
    hitSoundRuid = "",

    -- Has a project-standard default; confirm only if the skill explicitly needs something unusual:
    damageSkinInterval = 0.12, -- stagger between damage-skin pops (manual _DamageSkinService:Play split) and, if hitEffectPolicy="per_hit", between hit effect replays
    staggerInterval = 0.05, -- sequential delay increment per target (0s, 0.05s, 0.10s, ...) from nearest to furthest for multi-target hits
    knockbackPower = 1, -- project-standard fallback; concrete skills may intentionally override it
    attackCount = 2, -- project-standard default; how many hits the presentation fakes (manual _DamageSkinService:Play split), NOT a repeated real judgment
    castEffectRuid = "2a0d72e836fb4862aae83087035f3d2a", -- project-standard default cast effect
    hitEffectRuid = "598d2d1859e84eaab18ae460a0a1e0a4", -- project-standard default hit effect
    hitEffectOffset = Vector3.zero, -- Vector3 local-space nudge for the target-side hit effect; default zero (target origin).
                                    -- X flips with attack facing (off.x * dirX); nil/omitted behaves as zero. See ../combat/damage-presentation.md.
    damageSkinRuid = "3271c3e79bf04ecba9a107d55495970d", -- fallback when the attacker has no usable DamageSkinSettingComponent id
    animationKey = "swingO1", -- attack-family default; another verified native/custom action is opt-in.
                       -- Supported non-empty native names use the corresponding native event; all other non-empty
                       -- values are custom sprite action ids played once on the avatar body.
    allowMove = false,
    allowJumpDuringCast = false, -- may the player jump WHILE this attack's cast/animation lock is active
    allowAirborneCast = false, -- may the player cast this in mid-air (jumping or falling trajectory) (MapleTile exclusive)
    allowTurn = false,
}
```

For `type = "projectile_attack_skill"`, drop the authored `hitDelay` (it is computed at runtime) and `staggerInterval` (unused — distance drives the stagger), and add the projectile fields. Everything else is identical to the shape above. Full behavior: [../combat/projectile.md](../combat/projectile.md).

```lua
type = "projectile_attack_skill",
-- hitDelay is NOT authored here — computed per target as (distance(spawnPos, targetBodyCenter) / projectileSpeed) * 0.03

projectileSpeed = 0.25, -- world units advanced per 0.03s movement tick (NOT units/sec). Default 0.25; feel value, override per skill.
launchDelay = 0.45,     -- windup (s) before the projectile launches; hit fires at launchDelay + flightTime. Default 0.45.
projectileRuid = "d393500fd23f4537a2dd1f65089fc4a1", -- sprite RUID for the pooled projectile's SpriteRendererComponent.SpriteRUID ("" = invisible)
projectileSpawnOffset = Vector3(0.05, 0.28, 0), -- local launch-point nudge from the caster; X flips with attack facing
-- animationKey stays empty for the native basic Attack fallback.
-- Supported non-empty native names use the corresponding native path; every remaining non-empty value is a custom body action.
```

`hitEffectPolicy = "custom"` is **not accepted by the current loader**. Add it only as an atomic extension to the DataSet enum validation, catalog normalization, handler branch, and data shape. One possible extended shape is:

```lua
hitEffectTimeline = {
    { delay = 0.12, ruid = "", offset = Vector2(0, 0) },
    { delay = 0.20, ruid = "", offset = Vector2(0.1, 0.05) },
}
```

## Must-Ask vs Standard-Default Fields

Every tunable field after row identity (`id`/`name`/`familyId`/`type`) must be either must-ask or have a documented fallback. Treat the split as a rule, not just the current numbers:

- **Must-ask (no safe universal default — always ask per skill, per the MANDATORY PROACTIVE QUESTIONING workflow in `../../SKILL.md`)**: `damage`, `maxTargetCount`, `cooldown`, `hitDelay`, `attackRangeX`, `attackRangeY`, `hitEffectPolicy` (this is a separate question from `attackCount` — it decides *how many times* a hit effect replays, not how many damage-skin pops appear), `castSoundRuid`, `hitSoundRuid`. Never silently carry over the illustrative example value for these — they are gameplay/feel decisions specific to each skill. **Projectile type only (`type = "projectile_attack_skill"`):** `hitDelay` is **not** must-ask (nor authored at all — it is computed at runtime, see below). `projectileSpeed` is not must-ask either — it has a project-standard default (see next bullet), but it is a feel value, so confirm/override it whenever the skill wants a specific projectile pace.
- **Has a project-standard default (confirm only if the skill needs something unusual)**: only fields that actually exist in the current schema belong here — `damageSkinInterval = 0.12`, `staggerInterval = 0.05`, `knockbackPower = 1`, `attackCount = 2`, `castEffectRuid = "2a0d72e836fb4862aae83087035f3d2a"`, `hitEffectRuid = "598d2d1859e84eaab18ae460a0a1e0a4"`, `damageSkinRuid = "3271c3e79bf04ecba9a107d55495970d"` (fallback when the attacker has no usable DamageSkinSettingComponent id), `animationKey = "swingO1"`, `hitEffectOffset = Vector3.zero`, `castSoundRuid = 96edfa618f6a4fe4a4620a5c56eb93b6`, `hitSoundRuid = 4bd1c1fa96a84ac3858457732ffe9c9c`, and `allowMove`/`allowJumpDuringCast`/`allowAirborneCast`/`allowTurn = false` are standard fallbacks. `animationKey = "swingO1"` also applies when reconstructing a project's baseline/default attack row; never copy a live custom key or derive one from the skill name.
- **Projectile-only defaults**: `projectileSpeed = 0.25` world units per `0.03s` movement tick (effective units/sec = `projectileSpeed / 0.03`), `launchDelay = 0.45s`, `projectileRuid = "d393500fd23f4537a2dd1f65089fc4a1"`, and `projectileSpawnOffset = Vector3(0.05, 0.28, 0)`. `staggerInterval` is ignored for projectile attacks because distance-derived arrival time already staggers targets.
- **Animation default semantics**: always author `animationKey = "swingO1"` unless the user explicitly requests a particular animation and the action is verified. For attacks, an empty value is interpreted as a trigger that plays the basic native `BodyActionStateChangeEvent(Attack)` fallback, which swings the weapon according to the valid weapon type held in the player avatar's hand. Supported non-empty native names and custom sprite action ids remain opt-in execution paths, not generated defaults. Do not claim that this skill created a custom action unless that work was separately requested and verified.
- `judgmentPolicy`, `castDelay`, `detectRange`, `playRate`, and `targeting` are **not current `AttackSkillData` fields**. Do not generate, ask for, or document them as ordinary row values. Introduce any of them only as an atomic DataSet + catalog + handler schema extension.
- **"너 맘대로 만들어줘" / "do it however you want" (whole-skill delegation)**: when the user delegates the entire must-ask questionnaire this way instead of answering it field by field, do not spend effort searching/inventing a bespoke value for every must-ask field. Fill every field that has a project-standard default (this section) with that default, and only use judgment (or a quick `msw-search` pass) for the handful of fields that remain genuinely must-ask with no default (`damage`, `maxTargetCount`, `cooldown`, `hitDelay`, `attackRangeX`, `attackRangeY`, `hitEffectPolicy`, `castSoundRuid`/`hitSoundRuid` — sound can stay `""`).

`hitDelay` in particular has no safe universal number even as an illustrative placeholder: it is the gap between immediate cast-time judgment and hit presentation, and per this project's own precompute-real-duration standard (see [../combat/damage-presentation.md](../combat/damage-presentation.md)'s Damage-Skin Overkill Hold Rule for the equivalent pattern on death timing), it should be tuned against the actual cast animation's real hit-frame timing rather than guessed. Treat any numeric value shown for it in this doc as a placeholder to be overwritten per skill, not a recommendation. **For `type = "projectile_attack_skill"`, `hitDelay` is not tuned or authored at all — it is computed per target at runtime as `(distance(spawnPos, targetBodyCenter) / projectileSpeed) * 0.03`, where `projectileSpeed` is world units per `0.03s` tick (not units/second). Any authored `hitDelay` on a projectile skill is ignored. Tune `projectileSpeed` instead (see [../combat/projectile.md](../combat/projectile.md)).**

`damageSkinRuid` is part of the current `AttackSkillData` schema and is validated as non-empty during catalog loading. The Defender still owns the manual `_DamageSkinService:Play` call and receives the resolved value through the attack data/presentation path; do not move this field onto the monster or read it from an unrelated component during judgment. See [../combat/damage-presentation.md](../combat/damage-presentation.md)'s Manual Damage & Damage-Skin Rule.

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
