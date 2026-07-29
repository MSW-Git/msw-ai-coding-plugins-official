# Damage Presentation

How a single real judgment's damage renders as damage-skin pops and hit effects — a purely visual concern, separate from the real HP/judgment logic in [targeting.md](targeting.md). See [../../SKILL.md](../../SKILL.md) for the Domain Reference Files index.

Any attack path that can hit or kill a monster **MUST** prove this presentation through [../verification/monster-visual-harness.md](../verification/monster-visual-harness.md). A calculated delay or scheduled timer without captured ordering and visible-presentation evidence is not a pass.

## Contents

- [Manual Damage & Damage-Skin Rule (see ../architecture/divergences.md)](#manual-damage--damage-skin-rule-see-divergence-declarationsmd)
- [Damage-Skin Anchor Position Rule (defender-side, applies to every monster / every skill)](#damage-skin-anchor-position-rule-defender-side-applies-to-every-monster--every-skill)
- [Hit Effect Policy Rule](#hit-effect-policy-rule)
- [MUST — Damage-Skin Overkill Hold Rule (current immediate-judgment contract)](#must--damage-skin-overkill-hold-rule-current-immediate-judgment-contract)

## Manual Damage & Damage-Skin Rule (see ../architecture/divergences.md)

Player attack skills do not route damage through `AttackComponent:Attack()`/`HitComponent`/`HitEvent` at all (see [../architecture/divergences.md](../architecture/divergences.md) for the full "why" — a `HitComponent.CollisionGroup` mismatch, plus the more fundamental design limit that the native path's `DamageSkinSettingComponent.DelayPerAttack` is one shared value per attacker, so per-skill damage-skin timing is not achievable natively).

The shape is implemented by the discovered Defender damage entry point, called from the Registry's skill-type handler (see [../architecture/framework.md](../architecture/framework.md)):

- The attacker computes the lump-sum damage itself (`damage * attackCount`) and calls a plain method directly on the target's own component — e.g. `target.Monster:TakeDamage(attacker, totalDamage, hitCount, damageSkinInterval, skinId, presentationDelay)` — instead of `self:Attack(...)`. The defender applies HP immediately, while `presentationDelay` tells it when to start the manual damage-skin cascade. `skinId` is the attacker's own `DamageSkinSettingComponent.DamageSkinId.DataId` by default. No `HitEvent` is emitted; `CalcDamage`/`CalcCritical`/`GetDisplayHitCount`/`IsAttackTarget` are no longer the entry point for player skill damage.
- Inside `TakeDamage`, the defender applies `totalDamage` synchronously, splits it into `hitCount` pops, and schedules `_DamageSkinService:Play(targetEntity, skinId, delayPerAttack, damages, ...)` after `presentationDelay`. This is the ONLY way damage skins display for player skills, not a fallback.
- `delayPerAttack` is passed in directly as the skill's `damageSkinInterval`; it is pop-to-pop spacing, not the initial delay. `presentationDelay` is the separate cast-to-first-pop delay, and no extra timer is added after it before the first pop.
- `DamageSkinSpawnerComponent` is no longer needed on the defender — it only mattered for the native auto-display path (using HitComponent). `DamageSkinSettingComponent` on the **attacker (Player)** is the preferred source of `skinId`; unwrap `DamageSkinId.DataId`. The row field `damageSkinRuid` is the fallback used when the attacker has no usable setting/id, so its name must not be read as “always override the player's skin.” The defender does not own the default skin choice.
- Critical hits are not currently supported for player skills (`bCritical` is passed as `false`) — add a parameter for this only when a skill actually needs it.
- Confirmed API via `Environment/NativeScripts/Service/DamageSkinService.d.mlua` and the official "Change Potion Effect" doc example: `_DamageSkinService:Play(Entity targetEntity, string skinId, float delayPerAttack, table damages, DamageSkinTweenType tweenType, boolean bCritical, Vector2 offset, Vector2 scale, float playRate, float alpha, LitMode litMode)`. The official example calls it directly from an unspecified-ExecSpace method alongside `_EffectService:PlayEffectAttached`, with no `ClientOnly` wrapper — call it the same way `_EffectService:PlayEffect`/`PlayEffectAttached` are already called in this project's `ServerOnly` methods (it is a presentation-service call, auto-replicated the same way).
- There is no more "native path is default, manual is fallback" split for player skills — this manual path is the only path. (Non-player damage, e.g. the monster's own attack-on-player path, is unaffected by this rule — see [../architecture/divergences.md](../architecture/divergences.md)'s Scope note.)

## Damage-Skin Anchor Position Rule (defender-side, applies to every monster / every skill)

The damage-skin pop renders at the **center of the first frame of the monster's `hit` animation clip's sprite** (relative to the sprite pivot), nudged **down 0.4 world units** on Y. Purely presentational, defender-side — it lives on the discovered Defender role and applies to every player skill that hits the monster because damage-skin playback is scheduled by `TakeDamage`, not per `skillId`. The `offset` argument to `_DamageSkinService:Play` is this value.

**Computed once and cached, not per hit.** The sprite geometry is resolved via one async clip load in `OnBeginPlay` and stored in a `@HideFromInspector property Vector2 DamageSkinOffset`; `TakeDamage` passes `self.DamageSkinOffset` straight into `_DamageSkinService:Play`. A monster's `hit`-clip sprite does not change at runtime, so caching is correct here.

### What the offset means

`_DamageSkinService:Play(targetEntity, skinId, delayPerAttack, damages, tweenType, bCritical, offset, scale, ...)` (confirmed in `Environment/NativeScripts/Service/DamageSkinService.d.mlua`) takes `offset` as a `Vector2` in **world units, relative to the target entity's origin** (the entity's `TransformComponent.WorldPosition`, which sits at the sprite pivot).

Offset (sprite center relative to the pivot, in world units, with a fixed Y nudge):

- `offsetX = (Width / 2 - PivotPixel.x) / PixelPerUnit`
- `offsetY = (Height / 2 - PivotPixel.y) / PixelPerUnit - 0.4`

The `-0.4` is a fixed downward nudge on Y. No transform-scale multiplication is applied. If the monster has no `hit` clip (or the load fails), `DamageSkinOffset` stays at its `Vector2(0, 0)` default.

### How the offset is computed

Resolve the sprite the same async way `PreloadDieAnimationDuration` resolves the die clip (`AnimationClip.d.mlua` / `Frame.d.mlua` / `Sprite.d.mlua`):

1. `local found, hitRuid = self.Entity.StateAnimationComponent.ActionSheet:TryGetValue("hit")` — guard `found == false or hitRuid == nil or hitRuid == ""`.
2. `_ResourceService:PreloadAsync({ hitRuid }, ...)` → `local clip = _ResourceService:LoadAnimationClipAndWait(hitRuid)`.
3. `local firstFrame = clip.Frames:ToTable()[1]` → `local sprite = firstFrame.FrameSprite`. (`clip.Frames` is a `ReadOnlyList` — index it through `:ToTable()`, not `[1]` directly.)
4. Read `sprite.Width`, `sprite.Height` (int32 pixels), `sprite.PivotPixel` (`Vector2Int`, pivot in pixels from the sprite's bottom-left), and `sprite.PixelPerUnit` (default `100`).

### Reference implementation

The Defender may preload the `hit` clip's first frame and cache `DamageSkinOffset = Vector2((Width/2 - PivotPixel.x)/ppu, (Height/2 - PivotPixel.y)/ppu - 0.4)`. Its damage entry point passes the cached value as the `_DamageSkinService:Play(...)` offset. Method and property names are illustrative.

## Hit Effect Policy Rule

Use `hitEffectPolicy` to decide how many hit effects to present per target. `hitEffectPolicy` is a must-ask field (see [../architecture/datasets.md](../architecture/datasets.md)'s Must-Ask vs Standard-Default Fields) — confirm it explicitly with the user for every new skill, as its own question separate from `attackCount`. Do not infer it silently just because `attackCount > 1`.

### Hit Effect Attachment Rule (default for every skill's hit effect)

The target-side **hit effect must be attached to the target (monster) entity** via `_EffectService:PlayEffectAttached(...)`, not played at a fixed world point with `PlayEffect(...)`. This mirrors the caster-side Cast Effect Attachment Rule (see [../player/cast-effects.md](../player/cast-effects.md)): the effect anchors to the target and tracks the target's movement (e.g. knockback) for the effect's lifetime, instead of staying frozen at the position the target occupied at the instant the hit landed.

- **API**: `_EffectService:PlayEffectAttached(hitEffectRuid, target, localPos, 0, Vector3.one, false, { FlipX = dirX > 0 })` — `parentEntity` is the target, `localPosition` (`localPos`) defaults to the target's origin but is configurable per skill via `hitEffectOffset` (see the Hit Effect Offset Rule below), confirmed in `Environment/NativeScripts/Service/EffectService.d.mlua`.
- Applies to both currently supported `hitEffectPolicy` values (`"once"`, `"per_hit"`). If the extension-only `"custom"` policy is added, its entries follow the same attachment rule.
- The `FlipX` option and its direction source are unchanged — see the Hit Effect Direction Flip Rule below.

### Hit Effect Direction Flip Rule (default for every skill's hit effect, mirrors the Cast Effect Direction Flip Rule)

Like the caster's cast effect (see [../player/cast-effects.md](../player/cast-effects.md)'s Cast Effect Direction Flip Rule), the target-side **hit effect** must also flip to match the attack's facing direction — hit effect art is authored facing left by default, same convention as cast effects.

- **API**: pass `options = { FlipX = <boolean> }` to `_EffectService:PlayEffectAttached(...)` (the hit effect call — see the Hit Effect Attachment Rule above), the same `FlipX` option key used for the cast effect, confirmed in `Environment/NativeScripts/Service/EffectService.d.mlua`.
- **Direction source**: reuse the same `dirX` already computed for hitbox placement/knockback/cast effect — do not derive a separate direction for the hit effect.
- **Flip condition**: `FlipX = dirX > 0`, identical condition to the cast effect flip (flip only when facing right, since the default art faces left).
- Implementation shape: `_EffectService:PlayEffectAttached(hitEffectRuid, target, Vector3.zero, 0, Vector3.one, false, { FlipX = dirX > 0 })`.
- Both cast and hit effects use `PlayEffectAttached`; they differ only in the parent entity (caster vs target). The flip logic is identical.

### Hit Effect Offset Rule (default for every skill's hit effect)

The target-side hit effect's anchor point is configurable per skill through a `hitEffectOffset` field, so a skill can nudge its hit effect above/below/in-front-of the target instead of always burying it at the target's origin. This is the `localPosition` argument to the `PlayEffectAttached` call in the Hit Effect Attachment Rule above.

- **Field**: `hitEffectOffset` is a **standard-default** field (see [../architecture/datasets.md](../architecture/datasets.md)'s Must-Ask vs Standard-Default Fields), a `Vector3` in the target entity's local space (world units, since the effect is parented to the target). It is **not** a must-ask field — do not add it to the per-skill questionnaire; only set it when a skill's hit effect visibly needs repositioning.
- **Default**: `Vector3.zero` (attach at the target's origin — the previous hardcoded behavior). A skill that omits the field, or sets it `nil`, behaves exactly as before. The default of zero is the guarantee: adding this knob never changes an existing skill's presentation unless that skill opts in with a non-zero value.
- **Direction handling**: the offset's **X component is flipped by `dirX`** (the same attack-facing direction already used for the hitbox, knockback, cast effect, and the Hit Effect Direction Flip Rule above) so the offset is authored in attack-facing space — a positive `x` always pushes the effect in the direction the attack is going, whether the caster faces left or right. `y` and `z` are used as-is. Implementation shape: `local off = data.hitEffectOffset or Vector3.zero; local localPos = Vector3(off.x * dirX, off.y, off.z)`, then pass `localPos` as the `localPosition` argument.
- Applies to both currently supported policies (`"once"`, `"per_hit"`). If extension-only `"custom"` is implemented, a per-entry `offset` in `hitEffectTimeline` takes precedence over the skill-wide `hitEffectOffset`.

### MUST — Hit Effect Lifecycle Rule (absolute — decoupled from knockback and lethality)

The hit effect is **damage presentation**, owned by the Registry's delayed presentation callback at `hitDelay`. Real damage has already been applied by the immediate cast-time `Defender:TakeDamage(...)`; the callback plays hit effects and aligns with the defender-scheduled damage-skin cascade. It is **not** owned by the knockback pulse cycle, `PlayHitReaction`, `BeginHitReaction`, or any HIT-state entry.

- A hit effect **MUST** be dispatched for every landed hit **regardless of lethality**. A killing hit skips the entire knockback/HIT reaction path (see [hit-reaction.md](hit-reaction.md) and [death.md](death.md)'s lethal ordering: `FaceAttacker → PreHitReaction → TakeDamage → return without starting the pulse cycle`). Therefore any hit-effect call attached to a pulse, to `PlayHitReaction`, or to a HIT transition **silently disappears on every kill** — the exact defect the harness `HIT_EFFECT_PLAYED` gate (scenario `E2`) exists to catch.
- **Forbidden coupling**: do not emit the hit effect from `FireKnockbackPulse` / `BeginHitReaction` / the per-pulse call site, and do not gate it on "survived" or on entering HIT. Emit it from the delayed presentation callback alongside the scheduled `_DamageSkinService:Play`, independent of the lethality branch that decides whether to start knockback.
- `hitEffectPolicy` (`"once"` / `"per_hit"`) controls **how many** effects present; it does not change **whether** they present on a lethal hit. A one-pop lethal hit still shows exactly one hit effect; a `"per_hit"` lethal hit still shows its pops' effects even though no knockback pulse ever fires.
- Prove this with harness scenarios `E1` (non-lethal) and `E2` (**lethal**) in [../verification/monster-visual-harness.md](../verification/monster-visual-harness.md); a lethal hit with no visible hit effect is a hard failure, not a cosmetic gap.

### Policy Types

Supported initial policies:

- `"once"`: play one hit effect per target, regardless of `attackCount`.
- `"per_hit"`: play one hit effect per damage-skin pop presentation, so the count equals `attackCount`. "Per pop", **not** "per knockback pulse" — the count is driven by the damage-skin cascade, never by how many knockback pulses the cycle happens to fire.
- `"custom"` (**extension-only; rejected by the current loader**): after extending the DataSet/catalog/handler contract, use an explicit timeline such as `hitEffectTimeline` (see [../architecture/datasets.md](../architecture/datasets.md)) when a skill needs bespoke effect offsets or multiple different hit effect RUIDs.

Generated code must branch hit-effect presentation by policy, not by individual `skillId`.

## MUST — Damage-Skin Overkill Hold Rule (current immediate-judgment contract)

Judgment occurs immediately at cast time, while hit presentation begins after `hitDelay`. The **damage-skin pop cascade then spans multiple frames** — `attackCount` pops spaced by `damageSkinInterval`. The literal first-to-last pop span is `max(0, attackCount - 1) * damageSkinInterval`; the current implementation deliberately holds through the presentation delay plus the more conservative cascade budget `attackCount * damageSkinInterval` before starting death presentation. If the single lump-sum hit overkills the target, the target **MUST NOT** switch to its die animation while waiting for presentation or while damage numbers are still popping.

This is a **defender-side** responsibility, not an attacker-side one — the attacker passes `hitCount`, `damageSkinInterval`, and `presentationDelay` into `TakeDamage`; the defender decides when to trigger the death transition and when to actually hide/disable/destroy. See [death.md](death.md) for the defender-side death timing this feeds into. The fix is two separate delays, not one:

### MUST NOT Approximate or Substitute a Legacy Timer (absolute)

Do not replace either delay below with an existing fixed death/despawn timer merely because the project already has one. A condition-based state machine, an existing `DestroyDelay`, or a reusable legacy death path is an integration constraint to adapt around, not a waiver of presentation timing.

- A fixed fallback is permitted only after a non-empty, loadable die mapping has been established but its asynchronous duration preload has not yet resolved. A missing die clip, empty mapping, or failed resource load is a capability failure and MUST NOT use the fallback as permission to hide. Any fallback duration must be explicitly documented and paired with capability validation; the loaded real duration remains the normal path.
- Reusing an existing death method is allowed only after extending it to accept the damage-skin hold and to wait the cached real die-clip duration. Similar-looking output or an existing `DEAD` condition is not behavioral equivalence.
- During that hold, preserve the visual action already playing at lethal judgment. If the action ends first, show IDLE for only the remaining hold; if the hold ends first, start DEAD immediately and interrupt the action. The preserved action never extends `dieAnimationStartDelay`.
- Never knowingly ship a path where the die animation may overlap the damage-number cascade, be cut short, or leave an artificial final-frame pause, then describe that as a simplification in the handoff. Under the Compliance Gate in `../../SKILL.md`, that implementation is incomplete.
- If the project APIs or architecture appear unable to support both delays, stop before editing the approximate path and ask the user to choose among exact integration alternatives. Do not choose the approximation yourself.

The implementation **MUST provide all evidence below before completion**:

1. The lethal path **MUST** compute or receive `hitCount * damageSkinInterval` and delay the `DEAD` transition by that value.
2. The defender **MUST** preload the die clip, sum `Frame.Delay`, adjust for positive `PlayRate`, and cache the result outside the death-time path.
3. Hide, disable, destroy, or respawn scheduling **MUST** start only after `DEAD` begins and **MUST** use the cached die duration on the normal path.
4. Any fixed fallback **MUST** be limited to the valid-mapping-but-not-yet-resolved duration path. Missing/empty/failed die capability blocks disappearance instead of selecting fallback. Test resolved, pending, and invalid-capability cases separately.
5. The default fallback is fade. This means playing the hit animation clip and fading out the entity where the die animation would normally be called. This is a fallback; you must not use this presentation if a die animation clip exists.

### Required implementation shape (the two delays, in order)

1. **MUST delay the die animation's start**, not just the hide/destroy call. Inside the killing call to `TakeDamage(attacker, totalDamage, hitCount, damageSkinInterval, skinId, presentationDelay)`, compute `dieAnimationStartDelay = presentationDelay + hitCount * damageSkinInterval`. This conservative hold covers the initial presentation delay plus the cascade budget; only after it elapses may the selected death-transition owner enter DEAD.
2. **MUST then wait for the die clip's own real duration** before hiding/destroying — not a flat guessed constant on the normal path. Initialize the cached duration to the current fallback (`0.6s`), validate a non-empty `"die"` mapping, then precompute once in `OnBeginPlay`: preload/load the clip, sum every `Frame.Delay`, divide by positive `SpriteRendererComponent.PlayRate`, and overwrite the cached duration. When DEAD starts, wait that cached property before hiding/disabling/destroying. The initialized value is usable only while a valid mapping's preload is pending; missing/empty/failed capability MUST block disappearance and surface an error.
3. The target **MUST** be excluded from gameplay immediately when the killing hit lands (step 0, before either delay), but the exclusion write is selected through [../player/preflight.md](../player/preflight.md). Only when the effective model is proven to use `ConditionIsDead`, use the project's existing pre-death/exclusion capability during the hold and let the selected death-transition owner set `IsDead` when the final DEAD transition should begin. For every other model, `IsDead` is not part of the transition contract. Do not trigger both a condition transition and direct `ChangeState("DEAD")` in the same lethal path; the mechanism is per-model (see [../player/preflight.md](../player/preflight.md)'s Per-Model Verification Gate).

Worked example: with 12 pops, the first-to-last pop span is `11 * damageSkinInterval`, while the current conservative death hold is `12 * damageSkinInterval`. The die animation starts after that hold budget, then the entity hides after the cached die-clip duration.

An event-driven alternative (client listens for the native `SpriteAnimPlayerEndEvent` on `SpriteRendererComponent` and RPCs the server to hide) was considered, since animation playback is fundamentally client-rendered — but the precompute-duration approach above was verified working and kept for simplicity (no client→server RPC, no dependency on a player currently having the entity loaded to observe the event at all).

Reference capability flow: preload and validate the effective die clip → cache its adjusted duration → lethal damage computes the damage-skin hold → the selected death owner starts visible die playback after the hold → hide/respawn only after the cached real duration.
