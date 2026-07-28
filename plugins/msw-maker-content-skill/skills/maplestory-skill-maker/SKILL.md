---
name: maplestory-skill-maker
description: Create advanced MapleStory Worlds attack-skill implementations from reusable skill types, on a Logic-owned skill registry + thin per-player Component adapter foundation. Use when the user wants to design or implement MSW player attack skills with custom timing, delayed hit presentation, immediate damage judgment, death-hold behavior, effects, damage skins, knockback, avatar animation, projectile/direct attack patterns, targeting, attackInfo routing, adding a new skill or skill type, hotkey binding, or updates to the project's attack skill pipeline.
---

# MSW Attack Skill Maker

Use this skill to create advanced attack-skill implementation patterns for this project's MSW player attack stack.

This is not a basic MSW combat-rule summary. Treat it as a project-specific implementation guide for skills whose gameplay timing and visual timing may intentionally diverge from the default MSW presentation flow.

The intended design is type-driven: define a small number of attack skill *types*, then stamp out many concrete skills by tuning effect RUID, per-hit damage, delay, cooldown, range, animation, hitbox size, hit count, shared judgment, hit-effect policy, death-hold timing, and target policy.

## Current Goal

Create advanced attack-skill implementation patterns from reusable skill types. Concrete skills are stamped out by changing tuning values such as effect, per-hit damage, delay, cooldown, range, animation, hit count, death-hold timing, and target strategy.

This is a guide for implementing advanced combat behavior where authoritative gameplay judgment, HP/death state, and visual hit presentation may occur at different times — not a basic MSW combat-rule reference.

## Required Context

Before editing project files, load the normal MSW foundation for the task:

- `msw-general`
- `msw-ui-system`
- `msw-scripting` and `references/verify-checklist.md` for any `.mlua` edits
- `msw-combat-system` for hit/damage/projectile work
- `msw-avatar` for attack animation or avatar action changes
- `msw-search` when an effect, sprite, animation, sound, projectile image, or avatar item RUID is needed

Then read the Domain Reference Files table below and read whichever domain files the current skill actually touches before making design or code changes.

## Domain Reference Files

| Domain | File | Covers |
|---|---|---|
| Skill framework (registry & dispatch) | [references/skill-framework.md](references/skill-framework.md) | Registry-Logic vs Player-Adapter-Component split, skill-data table / type-handler registry pattern, hotkey binding, casting-state ownership, cooldown ownership, adding a skill vs adding a skill type — read this FIRST for any "add a skill" / "add a skill type" / "bind a hotkey" request |
| Divergence from generic combat rules | [references/divergence-declarations.md](references/divergence-declarations.md) | Where this project's rules override `msw-combat-system` defaults (SetForce vs AddForce, manual hit-effect dispatch, manual monster hit reaction, no monster i-frame) — read this first when something here seems to contradict the general combat skill |
| Skill data contract | [references/skill-data-contract.md](references/skill-data-contract.md) | Type Design table, `judgmentTiming` field meaning, what to record for a new skill type, the concrete skill data shape (Lua table) |
| Targeting & judgment timing | [references/targeting-judgment.md](references/targeting-judgment.md) | Runtime sequence (delayed vs immediate `judgmentTiming`), Count Ownership Rule, Shared Judgment Rule — when the real damage judgment fires and who it hits. Also Type 2 (`projectile_attack_skill`) runtime sequence |
| Projectile attack skill | [references/projectile.md](references/projectile.md) | `projectile_attack_skill` type — same judgment as `normal_attack_skill` but `hitDelay` computed per target (`distance / projectileSpeed`), per-target independent scheduling (distance-based stagger replaces `staggerInterval`), pooled projectile entity (Transform + SpriteRenderer `.model`, never `Destroy`ed), the separate pool `@Logic`. Read when the request involves a flying projectile / bullet / arrow skill |
| Damage presentation | [references/damage-presentation.md](references/damage-presentation.md) | Manual Damage & Damage-Skin Rule, Hit Effect Policy Rule, Hit Effect Attachment / Offset / Direction Flip Rules, Damage-Skin Overkill Hold Rule — how one real judgment renders as pops/effects |
| Knockback & hit reaction | [references/knockback-hit-reaction.md](references/knockback-hit-reaction.md) | Manual Hit Reaction Rule, Knockback Pulse Rule, Knockback Direction & API Rule, Face-Attacker-on-Hit Rule, MoveVelocity Cache & Rollback, WalkDrag Override |
| Death sequence | [references/death-sequence.md](references/death-sequence.md) | Death-Hold Rule (immediate-only), Death Freeze Rule (every skill) — what happens to a monster from lethal hit to disappearance |
| Cast effect attachment | [references/cast-effect-attachment.md](references/cast-effect-attachment.md) | Cast Effect Attachment Rule — caster-side effect anchoring, distinct from target-side hit effects |
| Multi-target staggered presentation | [references/multi-target-presentation.md](references/multi-target-presentation.md) | Multi-Target Staggered Hit Presentation Rule — sequencing simultaneous multi-target hits |
| Casting input & animation lock | [references/casting-lock.md](references/casting-lock.md) | Player Casting Input & Animation-End Lock Rule (9 principles) — movement lock, native ATTACK state, native-pose vs custom-action animation dispatch (`animationKey`), animation-end detection, hit immunity during cast, interrupted-cast recovery, custom cast animation cutoff fix, first-cast animation race fix, facing lock during cast (`FixedLookAt`) |
| Confirmed editor pitfalls | [references/platform-pitfalls.md](references/platform-pitfalls.md) | MLUA refresh failure / component detachment — not a design rule, an editor gotcha |

A new concrete skill of an existing type touches skill-framework.md (data + hotkey entry only) plus at least targeting-judgment, damage-presentation, knockback-hit-reaction, death-sequence, and casting-lock. A new skill *type* additionally touches skill-data-contract.md's Type Design table and skill-framework.md's type-handler registry. A concrete `projectile_attack_skill` additionally touches projectile.md (and, at first implementation, requires creating the projectile pool `@Logic` + projectile `.model`).

## Divergence — Absolute Precedence Rule (summary)

**If there is any overlap, similarity, or conflict between `msw-combat-system` and this skill, follow this skill's files.** Full list of deliberate reversals (knockback API, hit-effect dispatch, manual monster hit reaction, monster i-frame): [references/divergence-declarations.md](references/divergence-declarations.md).

## Architecture — Roles, not filenames

This project splits a player attack skill across three **roles**. The roles are the transferable design; the filenames that currently fill them (see Current Project Instantiation below) are just this project's instantiation. When adapting this pattern, reason in terms of roles first and map them onto whatever scripts already exist — do not assume a specific filename exists until you have checked (see Workflow step 2).

| Role | Kind | Owns |
|---|---|---|
| **Skill Registry** | `@Logic` (world-wide, one per session) | The skill-data table (every concrete skill's tuned data, keyed by skill key, per [references/skill-data-contract.md](references/skill-data-contract.md)); the type→handler dispatch table (one `OnUse` per skill *type*, not per skill key); the `ServerOnly` methods those handlers run (cast-time target snapshot, `hitDelay` scheduling, judgment, presentation triggers); per-caster cooldown state. |
| **Player Usage Adapter** | `@Component` on the player | Hotkey → skill-key binding; client key-input handling; generic casting-lock sync state (`CastingLockActive`/`CastingSkillKey`, one lock per player — not one flag per skill); cooldown-gated request relay into the Registry; client-side avatar animation playback. Holds **no** per-skill data and **no** per-skill methods. |
| **Defender** | `@Component` on the target | HP / death / respawn state; a generic `TakeDamage(attacker, totalDamage, hitCount, damageSkinInterval, skinId)` entry point (see [references/damage-presentation.md](references/damage-presentation.md)'s Manual Damage & Damage-Skin Rule). Called the same way regardless of which script the attacker's judgment code lives in. |

Key rules that hold regardless of filenames:

- **A `@Logic`'s global accessor is derived from its script name** (`_<ScriptName>`). The Registry's name is therefore not cosmetic — whatever the Registry Logic is called, every caller references it by that derived accessor. Pick one and keep it consistent; if you rename the script you rename the accessor.
- **Skill definitions live only in the Registry's data table**, never as inspector properties or per-skill property groups on the Adapter Component.
- **Judgment dispatch branches by skill `type`, never by individual skill key** (except a genuinely bespoke one-off skill).
- Player attack skills bypass `AttackComponent:Attack()` / `HitComponent` / `HitEvent` entirely: judgment uses manual `CollisionSimulator:OverlapBoxAll` detection + a direct `TakeDamage(...)` call on the Defender. Reasons (full detail in [references/divergence-declarations.md](references/divergence-declarations.md)): `Attack()`'s `CollisionGroup` filter depends on target `HitComponent.CollisionGroup` values this project never sets, and the native path cannot give per-skill damage-skin timing. The Adapter Component therefore extends plain `Component`, not `AttackComponent`.

Add a script beyond the three roles only when a skill's requirements genuinely outgrow them — per the Reuse-or-New-File Rule below.

## Workflow

1. **Classify the request**: existing skill type variant vs new skill type; and new-file vs modify-existing.
2. **Map roles to existing scripts (discover, then map — do this before creating anything).** Search the workspace (`RootDesk`) for the scripts that already fill the three roles above — a skill-registry `@Logic`, a player-attack `@Component`, a monster/defender `@Component`. Edit whichever script already fills a role. **Only create a new script for a role that has no existing home**, and when you do, name it and record it under Current Project Instantiation. This step is what lets the skill adapt to a project whose combat scripts are named differently or already partly built — never assume the instantiation names below exist without checking, and never create a parallel structure alongside an existing one.
3. If the user gives new guide rules, update the matching domain file under `references/` first (see the Domain Reference Files table) — add a new domain file (and a new table row) only when the rule genuinely doesn't fit an existing domain.
4. **MANDATORY PROACTIVE QUESTIONING**: whenever a user requests to create a new skill or modify an existing one, you MUST NOT proceed autonomously. Ask for the specs below individually — do not bundle them into a vague "gameplay specs" catch-all, since silently defaulting fields this way is how docs drift (see [references/skill-data-contract.md](references/skill-data-contract.md)'s Must-Ask vs Standard-Default Fields). (If the user explicitly delegates the whole spec — "make it however you want" — fill every field that has a project-standard default with that default, and only exercise judgment on the handful of must-ask fields with no default, per that same reference.)
   - Basic specs: name, hotkey
   - Attack type: sequential vs simultaneous hits
   - Damage
   - AttackCount (presentation pop count, not a repeated real judgment)
   - Cooldown
   - MaxTargetCount
   - AttackRangeX / AttackRangeY (attack hitbox size)
   - HitDelay (must be tuned to the skill's actual cast animation — never carry over another skill's value)
   - Avatar animation / `animationKey`
   - Hit effect repeat policy / `hitEffectPolicy` — ask as its own question, distinct from AttackCount (`"once"` / `"per_hit"` / `"custom"`)
   - Casting lock / movement lock behavior (the lock's *duration* is animation-driven, not a manual number — see [references/casting-lock.md](references/casting-lock.md))
   - Cast Effect RUID / Hit Effect RUID (ask if they have specific ones or want recommendations via `msw-search`)
   - Cast Sound RUID / Hit Sound RUID (same — ask or recommend; `""` is a valid "not yet decided" answer)
5. **Preserve the role split** unless the requested timing genuinely needs a new script:
   - The **Registry Logic** holds skill data as one entry per skill key, plus one `OnUse` handler per skill *type* (cast-time `OverlapBoxAll`, `hitDelay` scheduling, `Defender:TakeDamage(...)`), plus per-caster cooldown state.
   - The **Player Adapter Component** does hotkey binding, client input, generic casting-lock sync state, cooldown-gated request relay into the Registry, and client-side avatar action playback — no per-skill data or methods.
   - Optional advanced adapters (add only when a skill's timing needs one): delayed presentation queue, death-hold controller, custom damage-skin/effect dispatcher, or knockback sequencer — as a new script per the Reuse-or-New-File Rule, not bolted onto an existing role.
6. Do **not** route player attack skills through the native `AttackComponent` / `HitComponent` / `HitEvent` path — this project bypasses it entirely (the `CollisionGroup` pairing it depends on is never set on monsters, and it cannot give per-skill damage-skin timing; see [references/divergence-declarations.md](references/divergence-declarations.md)). Judgment is always manual `CollisionSimulator:OverlapBoxAll` + a direct `Defender:TakeDamage(...)`; when native presentation would conflict with the guide, build the controlled advanced path on that manual pipeline, never by falling back to `Attack()`.
7. Split execution spaces:
   - Server: validation, target snapshot, damage/HP judgment, death-hold state, authoritative knockback decisions.
   - Client: avatar animation, visual-only cast effects, delayed hit effects, delayed damage skins, sound, camera feedback.
8. Add focused `log()` calls for skill key, type, target snapshot, per-hit damage value, shared judgment result, damage timing/count, hit-effect policy/count, damage-skin count, knockback pulse count, death-hold start/release, and delayed presentation execution.
9. Run the MSW verification loop after code changes: refresh, build logs, play, runtime logs, stop.

## Skill Type Contract

Each concrete attack skill is representable as data plus a type handler. The full field list, the Must-Ask vs Standard-Default split, and the canonical example table live in [references/skill-data-contract.md](references/skill-data-contract.md) — that file is the single authoritative copy of this schema. Do not keep a second inline copy of the shape here or anywhere else; read `skill-data-contract.md` directly so there is only one place to keep in sync.

## Reuse-or-New-File Rule (binary test, not a judgment call)

Applies equally to the `@Component` and `@Logic` sides (full statement in [references/skill-framework.md](references/skill-framework.md)):

1. Check whether the exact logic a new skill needs already exists in a script filling one of the three roles (an existing type handler, an existing helper, the existing casting-lock/animation flow, etc.).
2. **Exists** → reuse it as-is; do not duplicate it under a new name.
3. **Does not exist** → do not retrofit it into a role script's scope. Create a brand-new script sized to that one responsibility — a new `@Component` for per-entity behavior, a new `@Logic` for world-wide/shared logic — and record it under Current Project Instantiation.

There is no middle option ("extend an existing file a little"). Found → reuse; not found → new file.

## Non-Negotiable Rules (cross-cutting checklist)

- Player attack skills do their own hit detection: manual `CollisionSimulator:OverlapBoxAll` + a direct `Defender:TakeDamage(...)` call, not `AttackComponent:Attack()`/`HitComponent`/`HitEvent` (see Architecture + [references/divergence-declarations.md](references/divergence-declarations.md)).
- Do not assume the native pipeline alone can satisfy advanced delayed presentation or death-hold behavior. If native damage/hit presentation conflicts with the guide, design an adapter or custom presentation queue and document the tradeoff before implementing.
- Use `attackInfo` to identify the skill in damage and hit/presentation hooks.
- Default `judgmentTiming = "delayed"`: the real damage judgment fires once, at `hitDelay`, in the same callback as presentation. Only use `judgmentTiming = "immediate"` when the user explicitly asks for that split. (→ [references/targeting-judgment.md](references/targeting-judgment.md))
- Delayed judgment/presentation must use the cast-time target snapshot, never a later re-scan. (→ [references/targeting-judgment.md](references/targeting-judgment.md))
- `damage` is per-hit damage; for the default `judgmentTiming = "delayed"`, the real judgment applies `damage * attackCount` as ONE lump sum via a single `Defender:TakeDamage(...)` call. (→ [references/targeting-judgment.md](references/targeting-judgment.md))
- `attackCount` controls the **presentation** count by default (`TakeDamage`'s `hitCount` argument, and `hitEffectPolicy = "per_hit"`) — and, indirectly via the total damage-skin duration `hitCount * damageSkinInterval`, how many knockback pulses the repeating cycle gets through. (→ [references/damage-presentation.md](references/damage-presentation.md), [references/knockback-hit-reaction.md](references/knockback-hit-reaction.md))
- Damage-skin display goes through the **manual** `_DamageSkinService:Play` call inside the Defender's `TakeDamage` — not a native `GetDisplayHitCount`/`HitEvent` path. `skinId` defaults to the attacker's own `DamageSkinSettingComponent.DamageSkinId.DataId`. (→ [references/damage-presentation.md](references/damage-presentation.md))
- The Defender's `HIT` state and its return to `IDLE` are driven manually: `TakeDamage`'s non-lethal path calls `ChangeState("HIT")` then `ChangeState("IDLE")`, and must never do so on the hit that kills the target. (→ [references/knockback-hit-reaction.md](references/knockback-hit-reaction.md)'s Manual Hit Reaction Rule)
- Hit effect repetition is controlled by `hitEffectPolicy`, not by `attackCount` alone, and must be explicitly asked per skill (must-ask, not a silent default). (→ [references/damage-presentation.md](references/damage-presentation.md))
- Killed monsters must be visually held until required presentation completes — **only for `judgmentTiming = "immediate"`**. (→ [references/death-sequence.md](references/death-sequence.md))
- **Regardless of `judgmentTiming`**, a killing hit's die animation must not start before its own damage-skin pop cascade finishes, and the entity must not hide/destroy before its die clip's own real duration has played. (→ [references/damage-presentation.md](references/damage-presentation.md), [references/death-sequence.md](references/death-sequence.md))
- **Regardless of `judgmentTiming`**, a killing hit must freeze the target completely from the instant `IsDead` becomes `true` until the die animation actually starts. Knockback must never fire for the hit that killed the target. (→ [references/death-sequence.md](references/death-sequence.md))
- Knockback repeats in a pulse cycle bound to the damage-skin cascade's total duration (`hitCount * damageSkinInterval`) by default — not a single one-shot pulse. Each pulse uses `RigidbodyComponent:SetForce(Vector2(dirX * knockbackPower, 0))` — not `AddForce` — and fires together with the Defender's hit reaction. Pulse cadence is a fixed `0.09s` after the hit-reaction animation ends; a pulse is skipped (ending the cycle) once less than a fixed `0.2s` of damage-skin display time remains. (→ [references/knockback-hit-reaction.md](references/knockback-hit-reaction.md)'s Knockback Pulse Rule)
- Unless the hit kills the target, turn the target to face the attacker right before/at the knockback — flip `TransformComponent.Scale.x` for monster-class entities, not `SpriteRendererComponent.FlipX`. (→ [references/knockback-hit-reaction.md](references/knockback-hit-reaction.md))
- A skill's cast effect (caster-side) defaults to `_EffectService:PlayEffectAttached(...)` on the caster, not `PlayEffect(...)` at a fixed world point, and passes `options = { FlipX = dirX > 0 }` since cast effect art defaults to facing left. (→ [references/cast-effect-attachment.md](references/cast-effect-attachment.md))
- The hit effect (target-side) is **attached to the target** via `_EffectService:PlayEffectAttached(hitEffectRuid, target, localPos, ...)`, not played at a fixed world point, so it tracks the target through knockback. Its anchor is `hitEffectOffset` (default `Vector3.zero`, X flips with `dirX`), and it passes `options = { FlipX = dirX > 0 }`, same condition and `dirX` as the cast effect. (→ [references/damage-presentation.md](references/damage-presentation.md)'s Hit Effect Attachment / Offset / Direction Flip Rules)
- Multi-target hits must be staggered nearest-to-furthest, not resolved simultaneously. (→ [references/multi-target-presentation.md](references/multi-target-presentation.md))
- Movement/animation lock during casting must follow the Animation Execution Principles — no hard controller disable of the wrong kind, native ATTACK state mapping, zero-latency client prediction, animation-end event detection, hit-flinch immunity. (→ [references/casting-lock.md](references/casting-lock.md))
- Sound RUIDs that aren't decided yet stay as `""`-guarded dummy hook methods (no-op when empty), not blocked or stubbed out entirely — implement the call site now, fill in the RUID later.
- Use `self.Entity.CurrentMap` as the parent for spawned effects that require an entity parent; never pass `nil`.
- Add logs that prove the selected skill key, type, target snapshot, per-hit damage value, shared judgment result, damage timing/count, hit-effect policy/count, death-hold start/release (when `judgmentTiming = "immediate"`), die-animation request, and the delayed judgment/presentation path executed (skip reasons: already dead, evaded/immune).

## Implementation Rules

- Prefer one generic dispatch method over one method per skill; branch by skill `type`, not by individual skill key, except for a genuinely bespoke skill.
- Treat target selection as a snapshot when the skill type says delayed visuals must use cast-time targets.
- Treat `damage` as per-hit damage, and `attackCount` as the count for repeating that damage, its damage-skin presentation, and knockback pulses, unless the spec explicitly says otherwise.
- Treat multi-hit combat judgment as shared by default: roll/decide hit, critical, and evasion-style results once per cast-time target and reuse for every hit.
- Treat hit-effect repetition as its own policy (`hitEffectPolicy`), so one-hit-effect and per-hit-effect skills share the same type handler.
- Use `attackInfo` to identify the skill inside its own manual damage and hit/presentation logic (the `Defender:TakeDamage(...)` call and the delayed presentation path) — not the native `CalcDamage`/`CalcCritical`/`GetDisplayHitCount`/`IsAttackTarget` override hooks, which this project bypasses (see [references/divergence-declarations.md](references/divergence-declarations.md)). Critical is not currently modeled for player skills.
- For direct skills, judgment is manual `CollisionSimulator:OverlapBoxAll` detection + a direct `Defender:TakeDamage(...)` call — never `AttackComponent:Attack()`/`AttackFast()`/`AttackFrom()`. If a skill's timing needs more than one scheduled judgment/presentation pass, add a custom judgment/presentation adapter (per the Reuse-or-New-File Rule), still on the manual path. (see the Non-Negotiable Rules above + [references/divergence-declarations.md](references/divergence-declarations.md))
- Do not edit `.codeblock` files. Do not hand-edit `.model`, `.map`, or `.ui` JSON when a builder is required by the MSW rules.
- Keep every concrete skill's tuned data as one entry in the Registry Logic's skill-data table — do not scatter it onto the Player Adapter as per-skill inspector properties, and do not introduce a second, separate dataset-backed skill table unless the user explicitly asks for one.
- When the user says something is unknown or advanced, ask the next smallest question and keep the spec updated as answers arrive.

## Current Project Instantiation

The three roles (see Architecture) are currently filled by these scripts, all directly under `RootDesk/MyDesk/` (no subfolder). Confirm they still exist via Workflow step 2 before editing; if a project variant differs, map the role onto the script that actually fills it.

| Role | Script |
|---|---|
| Skill Registry (`@Logic`) | `AttackSkillLogic.mlua` — skill-data table + type-handler dispatch + `ServerOnly` judgment/presentation methods + per-caster cooldown state. Accessor: `_AttackSkillLogic`. |
| Player Usage Adapter (`@Component` on the player) | `PlayerAttack.mlua` — extends plain `Component`; hotkey binding + input handling + generic casting-lock sync state + client avatar presentation, relaying every cast request into the Registry. |
| Defender (`@Component` on the monster) | `Monster.mlua` — HP/death/respawn; consumes damage via `TakeDamage`. |

Supporting scripts (not one of the three roles, but part of the combat loop):

- `MonsterAttack.mlua` — the monster's own contact attack against the player (`AttackComponent` on the monster side).
- `PlayerHit.mlua` — player-side `HitComponent`; hit-immunity/i-frame cooldown via `IsHitTarget`, checking the Player Adapter's `CastingLockActive`.

Projectile infrastructure — present once a project has built at least one `projectile_attack_skill` (a fresh project won't have these; see the "not created until the first projectile skill is built" note in [references/projectile.md](references/projectile.md) / [references/skill-framework.md](references/skill-framework.md)). Confirm via Workflow step 2 before editing:

- `ProjectilePoolLogic.mlua` — `@Logic` (accessor `_ProjectilePoolLogic`); projectile pool for `projectile_attack_skill` (acquire / `Launch` / `Retire`, never `Destroy`). Holds the projectile model id as its `ModelId` constant.
- `ProjectileMover.mlua` — `@Component` on the projectile `.model`; precompute-time `OnUpdate` travel + self-retire to the pool on arrival.
- `Models/Projectiles/Projectile.model` — minimal projectile shell (Transform + SpriteRenderer + `script.ProjectileMover`). Its model id is project-specific (a dashed UUID minted when the model is created) and is **not reproduced here** — read the live value from `ProjectilePoolLogic`'s `ModelId` constant, which must equal the `.model`'s `EntryKey`/`Id`.

When adding a new player skill of an existing type: add one skill-data entry to the Registry + one hotkey binding on the Player Adapter. No new property/method group on the Adapter, no new file (see [references/skill-framework.md](references/skill-framework.md)'s Adding a New Concrete Skill checklist).
