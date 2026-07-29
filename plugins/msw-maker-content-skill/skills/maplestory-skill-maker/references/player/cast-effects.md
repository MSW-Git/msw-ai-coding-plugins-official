# Cast Effect Attachment

The caster-side visual effect — distinct from the target-side hit effect covered in [../combat/damage-presentation.md](../combat/damage-presentation.md). See [../../SKILL.md](../../SKILL.md) for the Domain Reference Files index.

## Cast Effect Attachment Rule (default for every skill's caster-side effect)

Applies as the default for every skill's caster-side effect.

- A skill's **cast effect** (the visual played on the caster, as opposed to the hit effect played on the target) must, by default, be **attached to the caster's body** so it follows the caster if they move/get pushed while it plays — not fixed to the world position captured at cast time.
- Implementation: use `_EffectService:PlayEffectAttached(clipRUID, casterEntity, localPosition, localZRotation, localScale, isLoop, options)`, not `PlayEffect(...)`. `PlayEffect` pins the effect to a world-space point and is only correct for effects that are explicitly meant to stay put (e.g. a hit effect anchored to where the target was, an AoE marker on the ground).
- `localPosition` is relative to the caster entity — use `Vector3.zero` unless the skill needs a specific body-relative offset (e.g. a weapon-tip effect).
- This does not change the hit-effect rule — hit effects still play via `PlayEffect`/`PlayEffectAttached` on the **target**, not the caster; only the caster's own cast effect defaults to attached.

## Cast Effect Direction Flip Rule (default for every skill's caster-side effect)

This project's cast effect assets are authored **facing left by default** (the same left-default art convention as monster sprites — see [../combat/hit-reaction.md](../combat/hit-reaction.md)'s Face-Attacker-during-Hit-and-Death Rule). A cast effect must be flipped to match the caster's actual facing direction at cast time — it must not always play in its unflipped, left-facing default orientation regardless of which way the caster is looking.

- **API**: `EffectService:PlayEffect`/`PlayEffectAttached` both accept an `options: Dictionary<string, any>` last argument whose supported keys include `FlipX` (confirmed in `Environment/NativeScripts/Service/EffectService.d.mlua`) — pass `{ FlipX = <boolean> }` rather than baking the flip into `localScale`.
- **Direction source**: reuse the same `dirX` already computed for hitbox placement/knockback (see [../combat/targeting.md](../combat/targeting.md), [../combat/hit-reaction.md](../combat/hit-reaction.md)) — do not recompute facing separately for the effect.
- **Flip condition**: since the default art faces left, set `FlipX = (dirX > 0)` — flip only when the caster faces right (away from the art's default orientation); leave unflipped (`FlipX = false`, or omit the key) when the caster faces left.
- Implementation shape: `_EffectService:PlayEffectAttached(castEffectRuid, self.Entity, Vector3.zero, 0, Vector3.one, false, { FlipX = dirX > 0 })`.
- This applies to the **cast** effect only. Hit effects are positioned/oriented independently on the target side (see [../combat/damage-presentation.md](../combat/damage-presentation.md)) and are not covered by this rule unless the user separately confirms they need the same treatment.
