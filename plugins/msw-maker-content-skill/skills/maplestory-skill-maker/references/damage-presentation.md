# Damage Presentation

How a single real judgment's damage renders as damage-skin pops and hit effects — a purely visual concern, separate from the real HP/judgment logic in [targeting-judgment.md](targeting-judgment.md). See [../SKILL.md](../SKILL.md) for the Domain Reference Files index.

## Manual Damage & Damage-Skin Rule (see divergence-declarations.md)

Player attack skills do not route damage through `AttackComponent:Attack()`/`HitComponent`/`HitEvent` at all (see [divergence-declarations.md](divergence-declarations.md) for the full "why" — a `HitComponent.CollisionGroup` mismatch, plus the more fundamental design limit that the native path's `DamageSkinSettingComponent.DelayPerAttack` is one shared value per attacker, so per-skill damage-skin timing is not achievable natively).

The shape (reference implementation: `RootDesk/MyDesk/Monster.mlua`'s `TakeDamage`, called from the Registry Logic's skill-type handler — see [skill-framework.md](skill-framework.md)):

- The attacker computes the lump-sum damage itself (`damage * attackCount`) and calls a plain method directly on the target's own component — e.g. `target.Monster:TakeDamage(attacker, totalDamage, hitCount, damageSkinInterval, skinId)` — instead of `self:Attack(...)`. `skinId` is the attacker's own `DamageSkinSettingComponent.DamageSkinId.DataId` by default (see below), passed in by the caller rather than looked up by the defender. No `HitEvent` is emitted; `CalcDamage`/`CalcCritical`/`GetDisplayHitCount`/`IsAttackTarget` are no longer the entry point for player skill damage.
- Inside `TakeDamage`, the defender itself splits `totalDamage` into `hitCount` pops (even split, remainder folded into the last pop) and calls `_DamageSkinService:Play(targetEntity, skinId, delayPerAttack, damages, tweenType, bCritical, ...)` **manually** — this is now the ONLY way damage skins display for player skills, not a fallback.
- `delayPerAttack` is passed in directly as an argument (the skill's own `damageSkinInterval` property) — there is no shared `DamageSkinSettingComponent.DelayPerAttack` lookup, so different skills on one attacker can each use a different pop-to-pop timing.
- `DamageSkinSpawnerComponent` is no longer needed on the defender — it only mattered for the native auto-display path. `DamageSkinSettingComponent` on the **attacker (Player)**, however, is still the confirmed default source of the `skinId` — this matches its official semantic ("Specifies the damage skin type for attacks", i.e. an attacker-side property). **By default, `skinId` must come from the Player's own `DamageSkinSettingComponent.DamageSkinId.DataId`** (read on the attacker's side, e.g. `self.Entity.DamageSkinSettingComponent.DamageSkinId.DataId`, and passed into `TakeDamage` as an argument alongside `totalDamage`/`hitCount`/`damageSkinInterval`), not a RUID hardcoded on `Monster.mlua`. `Monster.mlua`'s own `DamageSkinRUID` property is the wrong default source — only override with a skill-specific RUID if a particular skill explicitly needs a different damage-skin look than the player's own default. (`DataRef.DataId` per `Environment/NativeScripts/Misc/DataRef.d.mlua` — `DamageSkinId` is a `DataRef`, not a plain string, so it must be unwrapped via `.DataId` before passing to `_DamageSkinService:Play`.)
- Critical hits are not currently supported for player skills (`bCritical` is passed as `false`) — add a parameter for this only when a skill actually needs it.
- Confirmed API via `Environment/NativeScripts/Service/DamageSkinService.d.mlua` and the official "Change Potion Effect" doc example: `_DamageSkinService:Play(Entity targetEntity, string skinId, float delayPerAttack, table damages, DamageSkinTweenType tweenType, boolean bCritical, Vector2 offset, Vector2 scale, float playRate, float alpha, LitMode litMode)`. The official example calls it directly from an unspecified-ExecSpace method alongside `_EffectService:PlayEffectAttached`, with no `ClientOnly` wrapper — call it the same way `_EffectService:PlayEffect`/`PlayEffectAttached` are already called in this project's `ServerOnly` methods (it is a presentation-service call, auto-replicated the same way).
- There is no more "native path is default, manual is fallback" split for player skills — this manual path is the only path. (Non-player damage, e.g. `MonsterAttack.mlua`'s hit on the player, is unaffected by this rule — see [divergence-declarations.md](divergence-declarations.md)'s Scope note.)

## Damage-Skin Anchor Position Rule (defender-side, applies to every monster / every skill)

The damage-skin pop renders at the **center of the first frame of the monster's `hit` animation clip's sprite** (relative to the sprite pivot), nudged **down 0.4 world units** on Y. Purely presentational, defender-side — it lives on `Monster` and applies to every player skill that hits any monster, because the damage skin is played from inside `Monster.TakeDamage` (see the Manual Damage & Damage-Skin Rule above), not per skill key. The `offset` argument to `_DamageSkinService:Play` is this value.

**Computed once and cached, not per hit.** The sprite geometry is resolved via one async clip load in `OnBeginPlay` and stored in a `@HideFromInspector property Vector2 DamageSkinOffset`; `TakeDamage` passes `self.DamageSkinOffset` straight into `_DamageSkinService:Play`. A monster's `hit`-clip sprite does not change at runtime, so caching is correct here.

### What the offset means

`_DamageSkinService:Play(targetEntity, skinId, delayPerAttack, damages, tweenType, bCritical, offset, scale, ...)` (confirmed in `Environment/NativeScripts/Service/DamageSkinService.d.mlua`) takes `offset` as a `Vector2` in **world units, relative to the target entity's origin** (the entity's `TransformComponent.WorldPosition`, which sits at the sprite pivot).

### How the offset is computed

Resolve the sprite the same async way `PreloadDieAnimationDuration` resolves the die clip (`AnimationClip.d.mlua` / `Frame.d.mlua` / `Sprite.d.mlua`):

1. `local found, hitRuid = self.Entity.StateAnimationComponent.ActionSheet:TryGetValue("hit")` — guard `found == false or hitRuid == nil or hitRuid == ""`.
2. `_ResourceService:PreloadAsync({ hitRuid }, ...)` → `local clip = _ResourceService:LoadAnimationClipAndWait(hitRuid)`.
3. `local firstFrame = clip.Frames:ToTable()[1]` → `local sprite = firstFrame.FrameSprite`. (`clip.Frames` is a `ReadOnlyList` — index it through `:ToTable()`, not `[1]` directly.)
4. Read `sprite.Width`, `sprite.Height` (int32 pixels), `sprite.PivotPixel` (`Vector2Int`, pivot in pixels from the sprite's bottom-left), and `sprite.PixelPerUnit` (default `100`).

Offset (sprite center relative to the pivot, in world units, with a fixed Y nudge):

- `offsetX = (Width / 2 - PivotPixel.x) / PixelPerUnit`
- `offsetY = (Height / 2 - PivotPixel.y) / PixelPerUnit - 0.4`

The `-0.4` is a fixed downward nudge on Y. No transform-scale multiplication is applied. If the monster has no `hit` clip (or the load fails), `DamageSkinOffset` stays at its `Vector2(0, 0)` default.

### Reference implementation

`RootDesk/MyDesk/Monster.mlua`: `OnBeginPlay` → `PreloadDamageSkinOffset()` async-loads the `hit` clip's first frame and caches `DamageSkinOffset = Vector2((Width/2 - PivotPixel.x)/ppu, (Height/2 - PivotPixel.y)/ppu - 0.4)`, logging the cached offset. `TakeDamage` passes `self.DamageSkinOffset` as the `offset` argument to `_DamageSkinService:Play(...)`.

## Hit Effect Policy Rule

Use `hitEffectPolicy` to decide how many hit effects to present per target. `hitEffectPolicy` is a must-ask field (see [skill-data-contract.md](skill-data-contract.md)'s Must-Ask vs Standard-Default Fields) — confirm it explicitly with the user for every new skill, as its own question separate from `attackCount`. Do not infer it silently just because `attackCount > 1`.

Supported initial policies:

- `"once"`: play one hit effect per target, regardless of `attackCount`.
- `"per_hit"`: play one hit effect per damage/knockback presentation, so the count equals `attackCount`.
- `"custom"`: use an explicit timeline such as `hitEffectTimeline` (see [skill-data-contract.md](skill-data-contract.md)) when a skill needs bespoke effect offsets or multiple different hit effect RUIDs.

Generated code must branch hit-effect presentation by policy, not by individual skill key.

### Hit Effect Attachment Rule (default for every skill's hit effect)

The target-side **hit effect must be attached to the target (monster) entity** via `_EffectService:PlayEffectAttached(...)`, not played at a fixed world point with `PlayEffect(...)`. This mirrors the caster-side Cast Effect Attachment Rule (see [cast-effect-attachment.md](cast-effect-attachment.md)): the effect anchors to the target and tracks the target's movement (e.g. knockback) for the effect's lifetime, instead of staying frozen at the position the target occupied at the instant the hit landed.

- **API**: `_EffectService:PlayEffectAttached(hitEffectRuid, target, localPos, 0, Vector3.one, false, { FlipX = dirX > 0 })` — `parentEntity` is the target, `localPosition` (`localPos`) defaults to the target's origin but is configurable per skill via `hitEffectOffset` (see the Hit Effect Offset Rule below), confirmed in `Environment/NativeScripts/Service/EffectService.d.mlua`.
- Applies to **every** `hitEffectPolicy` (`"once"`, `"per_hit"`, `"custom"`) — every hit effect a skill plays goes through `PlayEffectAttached` on the target.
- The `FlipX` option and its direction source are unchanged — see the Hit Effect Direction Flip Rule below.

### Hit Effect Direction Flip Rule (default for every skill's hit effect, mirrors the Cast Effect Direction Flip Rule)

Like the caster's cast effect (see [cast-effect-attachment.md](cast-effect-attachment.md)'s Cast Effect Direction Flip Rule), the target-side **hit effect** must also flip to match the attack's facing direction — hit effect art is authored facing left by default, same convention as cast effects.

- **API**: pass `options = { FlipX = <boolean> }` to `_EffectService:PlayEffectAttached(...)` (the hit effect call — see the Hit Effect Attachment Rule above), the same `FlipX` option key used for the cast effect, confirmed in `Environment/NativeScripts/Service/EffectService.d.mlua`.
- **Direction source**: reuse the same `dirX` already computed for hitbox placement/knockback/cast effect — do not derive a separate direction for the hit effect.
- **Flip condition**: `FlipX = dirX > 0`, identical condition to the cast effect flip (flip only when facing right, since the default art faces left).
- Implementation shape: `_EffectService:PlayEffectAttached(hitEffectRuid, target, Vector3.zero, 0, Vector3.one, false, { FlipX = dirX > 0 })`.
- Both cast and hit effects use `PlayEffectAttached`; they differ only in the parent entity (caster vs target). The flip logic is identical.

### Hit Effect Offset Rule (default for every skill's hit effect)

The target-side hit effect's anchor point is configurable per skill through a `hitEffectOffset` field, so a skill can nudge its hit effect above/below/in-front-of the target instead of always burying it at the target's origin. This is the `localPosition` argument to the `PlayEffectAttached` call in the Hit Effect Attachment Rule above.

- **Field**: `hitEffectOffset` is a **standard-default** field (see [skill-data-contract.md](skill-data-contract.md)'s Must-Ask vs Standard-Default Fields), a `Vector3` in the target entity's local space (world units, since the effect is parented to the target). It is **not** a must-ask field — do not add it to the per-skill questionnaire; only set it when a skill's hit effect visibly needs repositioning.
- **Default**: `Vector3.zero` (attach at the target's origin — the previous hardcoded behavior). A skill that omits the field, or sets it `nil`, behaves exactly as before. The default of zero is the guarantee: adding this knob never changes an existing skill's presentation unless that skill opts in with a non-zero value.
- **Direction handling**: the offset's **X component is flipped by `dirX`** (the same attack-facing direction already used for the hitbox, knockback, cast effect, and the Hit Effect Direction Flip Rule above) so the offset is authored in attack-facing space — a positive `x` always pushes the effect in the direction the attack is going, whether the caster faces left or right. `y` and `z` are used as-is. Implementation shape: `local off = data.hitEffectOffset or Vector3.zero; local localPos = Vector3(off.x * dirX, off.y, off.z)`, then pass `localPos` as the `localPosition` argument.
- Applies to **every** `hitEffectPolicy` (`"once"`, `"per_hit"`, `"custom"`); every `PlayEffectAttached` hit-effect call for a skill uses the same computed `localPos`. (For `hitEffectPolicy = "custom"`, a per-entry `offset` in `hitEffectTimeline` — see [skill-data-contract.md](skill-data-contract.md) — takes precedence over the skill-wide `hitEffectOffset` for that entry.)

## Damage-Skin Overkill Hold Rule (applies to EVERY `judgmentTiming`, including the default `"delayed"`)

Even under `judgmentTiming = "delayed"`, where judgment and presentation start in the same `hitDelay` callback, the **damage-skin pop cascade itself still spans multiple frames after that single callback** — `attackCount` pops spaced by `damageSkinInterval`. If the single lump-sum hit overkills the target (its remaining HP is less than `damage * attackCount`), the target must not switch to its die animation until that whole cascade has finished popping — otherwise the die clip starts playing (and, since the entity is not yet hidden, visibly loops) while damage numbers are still popping over it, which reads as "playing the death animation but not actually dead yet."

This is a **defender-side** responsibility, not an attacker-side one — the attacker only passes `hitCount`/`damageSkinInterval` into `TakeDamage`; the defender (`Monster`) decides when to `ChangeState("DEAD")` and when to actually `SetVisible(false)`/`SetEnable(false)`/`Destroy()`. See [death-sequence.md](death-sequence.md) for the defender-side death timing this feeds into. The fix is two separate delays, not one:

1. **Delay the die animation's start**, not just the hide/destroy call. Inside the killing call to `TakeDamage(attacker, totalDamage, hitCount, damageSkinInterval)`, compute `dieAnimationStartDelay = hitCount * damageSkinInterval` (0 when `hitCount <= 1`, so a normal single-pop kill plays its die animation immediately as before) — both values are already function arguments now, no attacker-side component lookup needed. Only after this delay elapses does `Monster` call `StateComponent:ChangeState("DEAD")`.
2. **Then wait for the die clip's own real duration** before hiding/destroying — not a flat guessed constant. Precompute this once (e.g. in `OnBeginPlay`, not at death time, to avoid a first-load stutter): look up the `"die"` key in `StateAnimationComponent.ActionSheet` (`TryGetValue`), `_ResourceService:PreloadAsync({ruid}, ...)` → `_ResourceService:LoadAnimationClipAndWait(ruid)`, sum every `Frame.Delay` in `clip.Frames:ToTable()`, and divide by `SpriteRendererComponent.PlayRate` (if `> 0`). Cache the result. When the die animation actually starts (step 1), wait this cached duration (falling back to `DestroyDelay` only if it wasn't available — no die clip, or the async preload hadn't resolved) before `SetVisible(false)`/`SetEnable(false)`/`Destroy()`.
3. `IsDead` is still set to `true` immediately when the killing hit lands (step 0, before either delay) — this is a separate concern from the two presentation delays above and keeps other systems (re-targeting, `IsDead` exclusion checks in target ranking) correctly excluding the target right away even while it's still visually mid-cascade.

Worked example: a 12-pop kill splits into 12 damage-skin pops and delays the die animation `hitCount * damageSkinInterval` seconds; the die animation starts only after that delay, then the entity hides after the cached die-clip duration (which varies per monster template). This keeps the die animation from starting (and looping) before the damage-skin cascade finishes, and makes the entity disappear right as its die clip actually finishes instead of on a flat guessed timer.

An event-driven alternative (client listens for the native `SpriteAnimPlayerEndEvent` on `SpriteRendererComponent` and RPCs the server to hide) was considered, since animation playback is fundamentally client-rendered — but the precompute-duration approach above was verified working and kept for simplicity (no client→server RPC, no dependency on a player currently having the entity loaded to observe the event at all).

Reference implementation: `RootDesk/MyDesk/Monster.mlua` — `OnBeginPlay` → `PreloadDieAnimationDuration()` caches `dieAnimationDuration`; `TakeDamage` → computes `dieAnimationStartDelay` → `Dead(dieAnimationStartDelay)` → (after that delay) `ChangeState("DEAD")` → (after `dieAnimationDuration`) hide/respawn.
