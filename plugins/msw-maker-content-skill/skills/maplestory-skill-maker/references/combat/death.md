# Death Sequence — MUST Contract

Defender-side rules for what happens to a monster from the instant a hit is lethal until it actually disappears. See [../../SKILL.md](../../SKILL.md) for the Domain Reference Files index. The presentation-cascade timing this depends on lives in [damage-presentation.md](damage-presentation.md)'s Damage-Skin Overkill Hold Rule.

Every lethal hit **MUST** satisfy every applicable rule in this document. The implementation **MUST NOT** be marked complete while any death timing, freeze, state-transition, or disappearance requirement is missing or unverified.

Verification **MUST** use [../verification/monster-visual-harness.md](../verification/monster-visual-harness.md). In particular, `DEAD` state logs without a resolved `die` mapping and visible full-duration playback do not prove the death presentation.

Before applying this sequence, complete [../player/preflight.md](../player/preflight.md). The freeze/hold/visibility ordering below is behavioral. `IsDead` is not a universal death or gameplay-exclusion flag. It is valid only as the final transition input for a model whose discovered StateSet uses `ConditionIsDead`. A model without that condition uses its discovered direct transition or playback owner instead. Select exactly one final transition owner per effective monster, keep immediate gameplay exclusion separate from that transition input, and never add a second State owner to imitate the reference implementation.

## MUST — Pre-Lethal Physics Flush Rule (absolute — server AND client)

The no-sliding guarantee **MUST** start before the synchronous lethal `TakeDamage(...)` call, not after the final death-transition owner runs. When the attacker can predict lethality from the authoritative values (`targetMonster.Hp <= totalDamage`), the following call order **MUST** be preserved:

1. `targetMonster:FaceAttacker(dirX)`
2. `targetMonster:PreHitReaction()`
3. `targetMonster:TakeDamage(...)`
4. Re-check the discovered lethal/exclusion capability; return without starting any knockback pulse when lethal ownership is active. Do not prescribe a new flag name.

`PreHitReaction()` is a required physics flush, not an optional visual hook. It must perform all of the following on the server in the same tick:

- Cache `RigidbodyComponent.MoveVelocity` only when a physical hit lock was not already active.
- Set `body.MoveVelocity = Vector2.zero`.
- Call `body:SetForce(Vector2.zero)` to erase residual knockback force. `MovementComponent:Stop()` or AI disable alone is insufficient because neither clears force already owned by the Rigidbody.
- Mark the physical lock active, call `MovementComponent:Stop()`, and disable `AIWanderComponent` / `AIChaseComponent`.

It must also invoke a client execution-space companion (for example, `PreHitReaction_Client()`) that immediately performs:

```lua
body.MoveVelocity = Vector2.zero
body:SetForce(Vector2.zero)
movement:Stop()
```

The client flush is mandatory even when the server owns judgment. Waiting for server physics synchronization leaves a visible window in which the monster can continue sliding locally after the killing hit. The server flush guarantees authoritative rest; the client flush guarantees presentation rest. Omitting either side violates the Death Freeze Rule.

Do not restore the cached velocity or residual force on the lethal path. After `TakeDamage(...)` enters `Dead()`, the death freeze owns the entity until hide/respawn. This pre-lethal flush is intentionally stronger than the ordinary non-lethal `EndHitReaction()` rollback path.

**MUST implementation shape** for the defender role (method and filename may differ):

- As soon as lethal ownership is established, stop Movement and disable the effective AI movement owner. Do not disable/remove or replace the existing State topology. Whether the current State is preserved, a neutral hold State is used, or direct die playback begins later is decided by the discovered project owner.
- Before the lethal TakeDamage call, lock the target toward the killing attacker. Preserve that facing throughout the preserved-action/IDLE hold and the subsequent DEAD animation; Dead must not clear the facing lock. Clear it on respawn.
- Confirm that every attack/targeting owner checks the discovered immediate gameplay-exclusion capability. `IsDead` is not a general guard; it is meaningful only to a discovered `ConditionIsDead` transition owner. Existing repeat timers must query the exclusion owner selected by the role map.
- On `Respawn()`, mirror this by re-enabling whichever AI component was disabled (`UnfreezeMovement()`), otherwise a respawned monster stays stuck in place forever.

**MUST implementation shape** for the attacker/judgment role (method and filename may differ):

- A skill's knockback application must **not fire at all** for a lethal hit. Re-check the selected lethal/exclusion capability immediately after `TakeDamage(...)` and skip knockback when active. Do not assume that capability is represented by a particular flag or State transition.
- Scheduled knockback callbacks still revalidate the same exclusion capability because another source may make the target lethal after scheduling.

## MUST — Death Freeze Rule

From the instant a hit is established as lethal and the discovered gameplay-exclusion owner is activated until the die animation actually starts, the target's **gameplay and physics MUST** be completely frozen — no movement, no AI, no knockback, and no new attack. This freeze does not by itself choose or trigger a State transition.

Additionally, from that same instant the target **MUST deal no contact or attack damage to any player** for the **entire** death presentation — through the damage-skin hold, the die animation, and until the entity disappears/respawns (not only until die starts). Disable the monster's player-damage capability (both the legacy contact-damage loop and the range-detected ATTACK hit-frame judgment) as part of the step-0 exclusion, and gate it on that immediate exclusion capability, **never on `IsDead`**. `IsDead` is a final transition input only for `ConditionIsDead` models and may remain unset until the hold ends; models without that condition may never use it for transition at all. A path gated on `IsDead` or a bare "while alive" check can keep damaging a player who touches the dying monster. See [monster-attack.md](monster-attack.md)'s Death interaction rule and harness scenario `D4`.

## MUST — Death-Hold Rule

This rule plays a highly critical role in the monster model's death presentation. You MUST accurately implement the details below (see [targeting.md](targeting.md)).

If immediate damage kills a monster, do not let the monster disappear, change to Die animation, or otherwise advance past the animation state it had at damage time until both delayed hit effect and damage skin presentation complete.
The duration required for the damage skin presentation to complete is `attackCount * damageSkinInterval`.

The generated implementation **MUST** provide or integrate a death-hold mechanism:

- Capture the target's visual/animation state at damage time (e.g., if the target's animation at damage time is an attack motion like `ATTACK` or `SKILL`, preserve it).
- Death-hold until the required damage skin presentation completes. Suppress or postpone presentation/despawn.
- Release the death-hold after all required damage skin presentation finishes.
- Run the monster's Die animation only after death hold is released.
- Log when death hold starts, when damage skin presentation completes, when death hold releases, and when Die animation is requested.

This is required because gameplay state and visual presentation are intentionally decoupled for this skill type.

## MUST — Preserved-Action Death Hold Race

A killing blow must NOT start a new HIT flinch or apply knockback. The selected death owner freezes physics/AI and records death-hold ownership without creating or forcing a reference State at lethal judgment.

The damage-skin hold deadline and the preserved action's natural end race under one owner:

- **Hold finishes first:** invoke the selected final death transition/playback owner. This may activate an existing condition, call the existing direct transition, and/or start the die clip directly; use exactly the route proven for that model.
- **Preserved action (`ATTACK`, `SKILL` etc) finishes first:** its behavior owner notifies the death-hold owner. Use the project's existing neutral/hold behavior only if entering it has no harmful `OnEnter` side effect. Do not use `IDLE` universally.
- **Same-frame/stale callback:** the death-hold active flag and timer id are authoritative. Once DEAD has been requested, a late action-end callback must not restore IDLE or schedule another death transition.
- Each protected action uses its existing completion owner. HIT and DEAD may use different animation owners; verify each instead of forcing a shared State-animation path.

The die start deadline remains exactly the conservative damage-skin hold budget (`attackCount * damageSkinInterval`). Preserving the current action must never extend that deadline.

Reference capability ordering: pre-lethal physics flush → `TakeDamage` → selected immediate exclusion capability → no lethal knockback → hold owner → selected final death transition/playback owner. Map these capabilities to the discovered project model; do not copy reference method names or treat `IsDead` as a cross-model capability.