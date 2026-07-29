# Monster Hit/Death Verification Harness — MUST Contract

Use this harness for every attack implementation or modification that can hit a monster. It converts the HIT, knockback, damage-skin, and death contracts into completion-blocking evidence gates. It applies whether the project uses the reference filenames or completely different scripts.

This file does not replace [../combat/hit-reaction.md](../combat/hit-reaction.md), [../combat/damage-presentation.md](../combat/damage-presentation.md), or [../combat/death.md](../combat/death.md). Read those contracts first; this harness proves that the adapted implementation actually satisfies them.

## Contents

- [Completion Rule — absolute](#completion-rule--absolute)
- [1. Capability Discovery Gate — before editing](#1-capability-discovery-gate--before-editing)
- [2. Static Ordering Gate — after editing, before play](#2-static-ordering-gate--after-editing-before-play)
- [3. Runtime Evidence Instrumentation](#3-runtime-evidence-instrumentation)
- [4. Required Runtime Scenarios](#4-required-runtime-scenarios)
- [5. Required Handoff Ledger](#5-required-handoff-ledger)

## Completion Rule — absolute

The implementation **MUST NOT** be called complete unless every applicable static row and runtime scenario below has explicit evidence.

- A code path that looks correct is not runtime evidence.
- A non-empty ActionSheet entry is not proof that the corresponding state was entered.
- A `ChangeState("HIT")` or `ChangeState("DEAD")` log is not by itself proof that the mapped clip was visible for the required window.
- “No errors in logs” is not a passing result.
- A legacy fixed timer, an architecture-specific shortcut, or a post-implementation caveat cannot waive a failed row.
- If runtime tools are unavailable, mark runtime rows `BLOCKED`, report **implemented but verification blocked**, and do not use completion language.
- A target that can be damaged by an attack covered by this skill MUST have the required `hit` and `die` visual capability. Missing capability is a hard failure by default; an agent cannot declare it deliberate. Only a prior explicit user decision naming the exact target and omitted visual can create a scoped exception.

## 1. Capability Discovery Gate — before editing

Discover roles and capabilities from the target project. Never require a specific filename, component script name, or method name.

Create this ledger before implementation and fill it with actual paths/symbols. Repeat the state-registration and visual-mapping rows for every distinct effective monster model/instance animation configuration reachable by the skill; one passing monster cannot certify a differently configured model. Sharing one behavior script is insufficient equivalence: effective state registration, ActionSheet mappings, mapped RUIDs, and behavior owners must all match.

| Capability | Required evidence | Status |
|---|---|---|
| Judgment coordinator | Code location that predicts/re-checks lethality, calls damage, and starts pulses only for survivors | OPEN |
| Defender damage owner | Code location that mutates HP, sets dead state, starts damage-skin presentation, and schedules death | OPEN |
| Defender reaction owner | Code location that owns facing, velocity/force, hit lock, optional HIT transition, and reaction timer | OPEN |
| Independent action-lock owner | Code location or state predicate that proves `ATTACK`/other protected actions retain their own movement lock | OPEN |
| HIT transition/playback owner | Component/API evidence for the effective existing HIT route from every reachable locomotion state; do not create a State to satisfy the ledger | OPEN |
| `hit` visual mapping | Entity/model evidence showing the entered HIT state resolves to a non-empty, loadable hit action/clip | OPEN |
| Death transition owner (**per model**) | **One row per effective monster model**: whether it has a `ConditionIsDead` StateSet condition (Y/N, backed by static `componentNames`/StateSet path evidence) → the single chosen final-transition mechanism (set `IsDead` at transition time for a condition model; use the discovered direct `ChangeState("DEAD")` or playback owner for a no-condition model), and the separate immediate gameplay-exclusion owner. Applying one mechanism **uniformly** across models without this per-model check is a failure even when die appears to play — and it is catchable by static inspection alone, no play session needed. | OPEN |
| `die` playback owner | Entity/model/code evidence showing whether State or direct sprite playback starts a non-empty, loadable die clip | OPEN |
| Die-duration cache | Code and runtime evidence for preload, `Frame.Delay` sum, positive `PlayRate` adjustment, and cached result | OPEN |
| Hide/disable/destroy owner | Code location proving disappearance begins after DEAD and uses cached die duration on the normal path | OPEN |
| Facing owner | Code/entity evidence that facing is written through `SpriteRendererComponent.FlipX` (the mandated writer) that `FaceAttacker` reuses; proof no signed `TransformComponent.Scale.x` facing writer competes with it during the reaction/death window | OPEN |
| Hit-effect dispatch owner | Code location proving the hit effect fires from the judgment/damage-presentation path (alongside `_DamageSkinService:Play`), **not** from the knockback pulse, `PlayHitReaction`, or a HIT transition | OPEN |
| Death player-damage suppression owner | Code location proving the monster's player-damage path (legacy contact loop and ATTACK hit-frame) is gated on the step-0 exclusion capability, disabled through the whole death presentation, and re-enabled on respawn | OPEN |

Any unresolved state registration, empty mapping, failed resource load, or unclear lock owner is a **hard stop before continuing attack/presentation implementation**. Fix the capability first or ask the user for a scoped decision; do not write timing code on top of an unknown pipeline.

## 2. Static Ordering Gate — after editing, before play

Prove each invariant with code locations. Method names may differ; ordering and ownership may not.

### Non-lethal path

1. Apply damage exactly once.
2. Revalidate the target and confirm it survived.
3. Start pulse 1 only after survival is known.
4. At the same pulse call site, face the attacker, zero movement as required, apply `SetForce`, and begin the hit reaction.
5. Enter visible HIT through the discovered existing owner from every eligible locomotion state, including `CHASE`/custom states when reachable; preserve protected actions.
6. End the hit-owned lock after the reaction duration; invoke the discovered return owner only if this pulse still owns HIT, and prove the destination `OnEnter` does not reset the prior AI cadence.
7. Restore movement during the fixed inter-pulse gap only when no independent action/death lock remains.

**Zero movement**: Means `RigidbodyComponent.Movelocity` = 0, `MovementComponent:Stop()`, `AIWanderComponent.Enable` = false, `AIChaseComponent.Enable` = false.
**Every eligible locomotion state**: Common states such as `MOVE`, `STAND`, `IDLE`, etc. Special states like `ATTACK`, `HIT`, `SKILL` are not eligible.

### Lethal path

1. Preserve `FaceAttacker → PreHitReaction → TakeDamage` ordering.
2. Flush `MoveVelocity` and residual force on both server and client before lethal damage.
3. Activate the discovered immediate gameplay-exclusion capability when damage is lethal; set `IsDead` only at final transition time and only for a model proven to use `ConditionIsDead`.
4. Never start HIT or knockback for the killing hit.
5. Hold the target frozen in the required pre-DEAD state for `hitCount * damageSkinInterval`.
6. Invoke the selected final death transition/playback owner only after that hold.
7. Start hide/disable/destroy/respawn scheduling only after visible die playback begins.
8. Use the cached real die duration on the normal path. The current initialized-duration pattern may supply the fallback while preload is unresolved; runtime evidence must distinguish resolved preload from fallback use.
9. Dispatch the hit effect for this killing hit exactly as the non-lethal path would (from the judgment/presentation step, alongside `_DamageSkinService:Play`), even though no HIT state and no knockback occur. A lethal hit with no visible hit effect fails `E2` and proves the effect was wrongly coupled to the pulse/HIT path.
10. Keep the attacker-facing lock applied through the death hold and DEAD playback; `Dead` must not clear it. It is cleared only on respawn.
11. Cross-check each model's actual death-transition mechanism in code against the section-1 per-model table: a `ConditionIsDead` model must set `IsDead` at final transition time **only** (no competing `ChangeState("DEAD")`), while a no-condition model must not use `IsDead` as transition authority and instead uses its discovered direct `ChangeState("DEAD")` or playback owner. A single mechanism applied uniformly across models with different StateSet configs is a **static FAIL here — before any play session.** "Die appears to play" does not close this row.

If any invariant is distributed across asynchronous callbacks, record the timer owner, cancellation/re-entry guard, target-validity check, and the state captured by the callback. A timer's existence is not proof that a stale callback cannot end a newer reaction or hide a respawned entity.

## 3. Runtime Evidence Instrumentation

Use focused temporary logs with stable event labels. Include target identity, cast/attack identity when available, current state, dead flag, and relevant duration/count values. Do not dump per-frame logs; remove the harness instrumentation after evidence capture unless the user explicitly requests retained diagnostics.

Required labels:

| Label | Emit when |
|---|---|
| `MSM_HARNESS DAMAGE_APPLIED` | HP changes; include before/after HP, hitCount, and interval |
| `MSM_HARNESS HIT_BEGIN` | A pulse acquires the hit-owned lock; include state before and whether HIT was entered |
| `MSM_HARNESS KNOCKBACK_APPLIED` | `SetForce` is applied; include direction and power |
| `MSM_HARNESS HIT_END` | The hit-owned lock is released; include current state and whether movement may resume |
| `MSM_HARNESS PULSE_GAP_BEGIN` | The `0.09s` inter-pulse gap begins; include independent-lock status |
| `MSM_HARNESS LETHAL_FLUSH` | Server/client pre-lethal velocity and force flush executes |
| `MSM_HARNESS DEATH_HOLD_BEGIN` | Lethal hold begins; include computed `hitCount * interval` |
| `MSM_HARNESS DEATH_HOLD_ANIMATION_END` | The preserved action ends before the hold; include the state that falls back to IDLE |
| `MSM_HARNESS DEAD_REQUEST` | selected final death transition/playback owner is invoked |
| `MSM_HARNESS DIE_DURATION_READY` | Die duration preload/cache resolves; include frame sum, PlayRate, and final duration |
| `MSM_HARNESS DISAPPEAR_REQUEST` | Hide/disable/destroy begins; include the duration source (`cached` or guarded `fallback`) |

| `MSM_HARNESS HIT_EFFECT_PLAYED` | A hit effect is dispatched; include `hitEffectPolicy`, target identity, effect index/count, and whether this landing hit was **lethal** |
| `MSM_HARNESS FACE_LOCKED` | The target's facing is set/locked toward the attacker via `FlipX`; include resolved `dirX`, the resulting `FlipX` value, and whether the hit was lethal |
| `MSM_HARNESS DEATH_DAMAGE_BLOCKED` | A dying monster's player-damage path (contact or ATTACK) no-ops because the death/exclusion capability is active; include which path and the exclusion source that gated it |

Capture runtime logs from the actual Maker play session. Source-code inspection or fabricated example logs cannot fill these rows. After capturing evidence, remove test-only noise if it is not useful to the project, then refresh and re-check build logs.

## 4. Required Runtime Scenarios

Run every applicable scenario against each distinct effective monster state/animation pipeline the skill can target. Models/instances may share one equivalence class only when their effective state registration, complete relevant ActionSheet mappings and mapped RUIDs, and behavior owners match; record proof of that grouping in the ledger. Use deterministic test skill/damage values when necessary; do not infer a scenario from an unrelated ordinary play session.

| ID | Scenario | Required pass evidence |
|---|---|---|
| H1 | Non-lethal hit while `IDLE` | `HIT_BEGIN` reports HIT entered; runtime state becomes HIT; mapped hit action is visibly presented; `HIT_END` invokes the discovered return owner only while the same reaction still owns HIT. |
| H2 | Non-lethal hit while `MOVE` | Same animation result as H1; movement is locked only during the reaction window, then the existing movement owner resumes without an unrelated cadence reset. |
| H2-C | Non-lethal hit while `CHASE` | HIT visibly interrupts CHASE through the existing transition/playback owner; release returns through the existing chase owner and does not restart a 1–3 second `OnEnter` standing interval. |
| H2-X | Non-lethal hit while any other reachable locomotion state | The state is explicitly classified as HIT-eligible or protected; an eligible state visibly enters HIT and returns through its existing owner without resetting unrelated `OnEnter` behavior. |
| H3 | Non-lethal hit while `ATTACK` or another protected action | Knockback and hit-owned lock occur, but HIT is not entered and the protected animation remains active; hit end does not release the action-owned lock. |
| H4 | A newer action starts during a HIT pulse | Pulse end preserves the newer state and releases only the hit-owned lock. |
| H5 | Multi-pop non-lethal hit with `hitCount = 12` when the schema supports it | Repeated pulses occur within the presentation budget; every pulse pairs knockback with reaction handling; during each `0.09s` gap the hit lock is absent and movement/AI can run when no independent lock exists. One continuous lock across the entire damage-number cascade fails. If the schema has a lower hard maximum, use that maximum and record the constraint. |
| D1-A | Lethal hit during `ATTACK`/another protected action where the conservative damage-skin hold (`hitCount * damageSkinInterval`) ends before the action does | Lethal flush occurs before damage; no new HIT and no knockback follow; the current action remains visibly active while physics/AI stay frozen; DEAD is requested at the hold deadline and interrupts that action immediately. The action's remaining duration must not extend the hold. |
| D1-B | Lethal hit during `ATTACK`/another protected action where that action ends before the conservative hold | The current action remains visible until its real owner ends it; `DEATH_HOLD_ANIMATION_END` then precedes an IDLE remainder; DEAD is still not requested before the original hold deadline and starts immediately when that deadline arrives. |
| D2 | Continuation of D1-A/D1-B | The die mapping resolves and the die animation is visibly presented; disappearance is not requested before DEAD plus the cached adjusted die duration. **Exactly one death-transition owner fires per model class**: a `ConditionIsDead` model transitions when its final owner sets `IsDead`, while a no-condition model uses its discovered direct `ChangeState("DEAD")` or playback owner. A transition-conflict log (e.g. `ChangeState("DEAD")` competing with a condition transition) is a **FAIL even if the die clip still animates**. Verify condition and no-condition model classes separately. |
| D3 | Repeated/overlapping lethal request | Dead transition and disappearance scheduling remain single-owner/idempotent; no stale hit timer restores movement or forces IDLE. |
| D4 | Player contacts the dying monster during its death presentation (damage-skin hold **and** die animation) | The player takes **no** contact or attack damage from lethal judgment until the monster disappears; `DEATH_DAMAGE_BLOCKED` shows the contact loop and ATTACK hit-frame path are disabled by the immediate step-0 exclusion, not by the model-specific `IsDead` transition input. |
| R1 | Respawn, when supported | Facing/hit/death locks and stale timers are cleared; visibility, HP, IDLE state, and only the appropriate movement/AI owners are restored. |
| E1 | Hit effect on a non-lethal hit | `HIT_EFFECT_PLAYED` fires from the judgment/presentation path; the effect is visibly attached to the target and tracks it through knockback; count matches `hitEffectPolicy`. |
| E2 | Hit effect on a **lethal** hit | `HIT_EFFECT_PLAYED` fires even though no knockback pulse and no HIT state occur; the hit effect is **visibly present on the killing blow**. A lethal hit with no visible hit effect is a hard FAIL and proves the effect was wrongly coupled to the pulse/HIT path. |
| F1 | Facing on every landed hit (non-lethal and lethal) | `FACE_LOCKED` fires; the target **visibly turns to face the attacker** on the hit; facing is written through `FlipX` (no `Scale.x` facing writer) and is not overwritten by an AI writer within the reaction/death window; on a lethal hit facing persists through DEAD. |

## 5. Required Handoff Ledger

Include a compact ledger in the final handoff:

| Row | Static location | Runtime evidence | Result |
|---|---|---|---|
| HIT registration/mapping | path + symbol/entity | H1/H2/H2-C/H2-X evidence for every reachable locomotion state | PASS/FAIL/BLOCKED |
| Protected-action suppression | path + symbol | H3 evidence | PASS/FAIL/BLOCKED |
| Pulse lock/gap ownership | path + symbol | H4/H5 evidence | PASS/FAIL/BLOCKED |
| Lethal pre-flush/no-knockback | path + symbol | D1 evidence | PASS/FAIL/BLOCKED |
| Damage-skin death hold/action race | path + symbol | D1-A/D1-B timestamps + visual evidence | PASS/FAIL/BLOCKED |
| DEAD/die duration/disappearance | path + symbol/entity | D2 timestamps + visual evidence | PASS/FAIL/BLOCKED |
| Hit-effect presentation (incl. lethal) | path + symbol | E1/E2 visual evidence | PASS/FAIL/BLOCKED |
| Facing lock (incl. lethal) | path + symbol | F1 visual evidence | PASS/FAIL/BLOCKED |
| Death player-damage suppression | path + symbol | D4 evidence | PASS/FAIL/BLOCKED |
| Re-entry/respawn safety | path + symbol | D3/R1 evidence | PASS/FAIL/BLOCKED/N/A |

Only `PASS` closes a required row. `BLOCKED`, `NOT RUN`, inferred behavior, or a caveat keeps the implementation unfinished. State the blocker and the exact next verification action instead of weakening the conclusion.