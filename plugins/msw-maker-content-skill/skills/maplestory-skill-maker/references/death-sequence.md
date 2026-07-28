# Death Sequence

Defender-side rules for what happens to a monster from the instant a hit is lethal until it actually disappears. See [../SKILL.md](../SKILL.md) for the Domain Reference Files index. The presentation-cascade timing this depends on lives in [damage-presentation.md](damage-presentation.md)'s Damage-Skin Overkill Hold Rule.

## Death-Hold Rule (only applies when `judgmentTiming = "immediate"`)

Not needed for the default `judgmentTiming = "delayed"` pattern — judgment and presentation happen in the same `hitDelay` callback, so there is no gap where a monster could be dead in data but still mid-presentation visually. Only implement this rule for a skill that explicitly opts into `judgmentTiming = "immediate"` (see [targeting-judgment.md](targeting-judgment.md)).

If immediate damage kills a monster, do not let the monster disappear, change to Die animation, or otherwise advance past the animation state it had at damage time until both delayed hit effect and damage skin presentation complete.

The generated implementation must provide or integrate a death-hold mechanism:

- Capture the target's visual/animation state at damage time.
- Suppress or postpone death presentation/despawn until required hit effect and damage skin presentation is complete.
- Release the hold after both required hit effect and damage skin presentation finish.
- Run the monster's Die animation only after death hold is released.
- Log when death hold starts, when hit effect presentation completes, when damage skin presentation completes, when death hold releases, and when Die animation is requested.

This is required because gameplay state and visual presentation are intentionally decoupled for this skill type.

## Death Freeze Rule (applies to EVERY `judgmentTiming` — a killing hit holds the target perfectly still)

From the instant a hit is lethal (`IsDead` becomes `true`) until the die animation actually starts (after the [damage-presentation.md](damage-presentation.md) Damage-Skin Overkill Hold Rule's delay elapses), the target must be **completely frozen** — no movement, no AI, no knockback, no attacking. It is not enough to just delay the die animation; the target must visibly hold still through that whole window rather than sliding from residual knockback/AI movement while damage numbers pop over it.

Required implementation shape (defender side, `Monster.Dead()`):

- The instant `IsDead` is set `true` (same moment as the Damage-Skin Overkill Hold Rule's `Dead()` call, before either of its delays), also freeze movement: `MovementComponent:Stop()` plus disabling whichever AI component the monster template has (`AIWanderComponent.Enable = false` / `AIChaseComponent.Enable = false` — a monster template only ever has one, `isvalid`-guard both). Do **not** touch `StateComponent`/animation here — HIT/IDLE/DEAD state transitions are a separate concern (see below).
- Attacking is already excluded once `IsDead` — `script.MonsterAttack`'s repeat-timer already checks `monster.IsDead == false` before calling `AttackNear()`; no change needed there.
- On `Respawn()`, mirror this by re-enabling whichever AI component was disabled (`UnfreezeMovement()`), otherwise a respawned monster stays stuck in place forever.

Required implementation shape (attacker side, e.g. `AttackSkillLogic`'s skill-type handler methods — see [skill-framework.md](skill-framework.md) for the current file split):

- A skill's knockback application must **not fire at all** for a hit that killed the target — not "fire but the target can't move anyway because it's frozen." Re-check the target's `script.Monster.IsDead` immediately after the `TakeDamage(...)` call returns (it is synchronously `true` by then, since `Dead()` already ran inside that call) and skip the knockback call entirely when `true`. See [knockback-hit-reaction.md](knockback-hit-reaction.md). Log which branch was taken (e.g. `"hit killed the target, skipping knockback"` vs. applying it normally).
- Once the caller already branches on `IsDead` to decide whether to call the knockback method at all, the knockback method itself no longer needs an internal `IsDead` check — remove any unreachable branch there instead of leaving dead code.

Animation during the freeze window is explicitly overridden to bypass the HIT flinch: per the user's directive, a killing blow must NOT play the hit animation/flinch or apply knockback. To achieve this, when `Dead(dieAnimationStartDelay)` is called, we immediately force `stateComponent:ChangeState("IDLE")` on the server. This cancels the engine's native auto-HIT transition, making the target stand perfectly still in its IDLE pose (since movement/AI is frozen) during the damage-skin cascade delay, before cleanly transitioning to `ChangeState("DEAD")` at the end of the delay.

Reference implementation: `RootDesk/MyDesk/Monster.mlua` — `Dead()` calls `FreezeMovement()` and immediately forces `stateComponent:ChangeState("IDLE")` (paired with `UnfreezeMovement()` in `Respawn()`); the skill's delayed-hit callback (in the Registry Logic's type handler — see [skill-framework.md](skill-framework.md)) re-checks `script.Monster.IsDead` after the damage call to decide whether to call the knockback method at all.
