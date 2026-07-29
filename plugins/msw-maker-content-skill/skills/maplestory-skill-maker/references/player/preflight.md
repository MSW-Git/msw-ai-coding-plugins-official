# Project State and Animation Preflight

Read this before changing player cast animation, monster HIT/DEAD presentation, facing, or cast/reaction locks. The reference implementation is not permission to create a parallel State topology in an existing project.

---

## Contents

- [Step 1: Overview and Core Concepts Definition](#step-1-overview-and-core-concepts-definition)
- [Step 2: Player Domain Specification](#step-2-player-domain-specification)
- [Step 3: Monster Domain Specification](#step-3-monster-domain-specification)
- [Step 4: Practical Investigation Methodology and Probe Code](#step-4-practical-investigation-methodology-and-probe-code)
- [Step 5: Forbidden shortcuts and final verification gate](#step-5-forbidden-shortcuts-and-final-verification-gate)

## Step 1: Overview and Core Concepts Definition

### Absolute rule: discover before extending

Treat State and animation as project-owned infrastructure.

1. Inspect the configuration of the player and all reachable monsters before editing. If there are monsters on the map, as well as Global/MoveMonster.model, Global/ChaseMonster.model, and Global/StaticMonster, they **must** be inspected.
2. Check if `.stateset` files exist, and verify whether the monster configurations inspected above use this `StateSet`.
3. Record the current State owner, transition owner, animation owner, direction owner, and return-state side effects.
4. Reuse those owners. Do not create a new `@State`, `StateType`, `StateSet`, condition, animation mapping, or parallel reaction component merely because another reference uses one. For monster models that do not use `StateSet`, you may create a `StateSet` to handle them if you fully understand how `StateSet` works.
5. Create a new State capability only when the project demonstrably has no equivalent, the requested behavior cannot be expressed through an existing owner, and the new transition has been verified against every affected model.

Behavioral requirements such as “show HIT” or “finish death presentation” do not imply a specific State name or implementation.

### Required capability matrix

Build one row per effective player/monster configuration. Shared scripts do not make two rows equivalent.

| Subject | Required facts |
|---|---|
| Player cast | effective avatar/body entity, dispatched action, one-shot vs loop, whether an end event actually fires, normal release owner |
| Monster HIT | valid source states including project-specific locomotion states such as `CHASE`, transition owner, clip playback owner, protected states, return state |
| Monster DEAD | direct transition vs StateSet/Condition transition, clip playback owner, hide/respawn owner |
| Facing | Use `SpriteRendererComponent`'s `FlipX`; all SpriteRUIDs are by default facing left; do not write like `Scale.x` |
| State return | every `OnEnter`/condition side effect, including AI timers, wait intervals, cached velocity, and enable restoration |

If any fact is unknown, keep the relevant presentation gate open. Do not fill the gap by copying a reference State.

---

## Step 2: Player Domain Specification

### Player animation and cast release

- Author `animationKey = "swingO1"` by default if there is no information. Do not infer a custom action from the skill name. Empty values are not allowed.
- A custom action (or a valid action with content) is allowed only after its existence, target entity, visible playback, and play type are verified. If completion is not handled by a separate specific event, use `SpriteAnimPlayerEndEvent`.
- Normal cast release depends on time or a verified event. It must have a bounded, cast-id-guarded local path that does not depend on an unverified animation-end event. Resolve the duration from a verified one-shot clip or an explicit per-skill/project cast-lock policy. A formula such as `hitDelay + a short recovery margin` is a design choice, not a universal engine rule; record and verify it before use.
- `swingO1` handles the player's basic attack animation and does not have a separate playback completion event, but the timing of animation completion can be detected through `SpriteAnimPlayerEndEvent`.
- The server safety timeout remains last-resort recovery. Reaching a two-to-three-second safety timeout during an ordinary cast is failure.
- Every release source must converge on the same idempotent `castId`-checked cleanup and must not release a newer cast.

---

## Step 3: Monster Domain Specification

### Monster State ownership

#### HIT

- Discover all actual eligible source states. Do not hardcode `IDLE/MOVE/HIT` when the project uses `CHASE`, `WANDER`, or custom names.
- Determine whether entering HIT triggers its clip through the State pipeline or requires direct sprite playback. Decide per state and per effective model. If `StateComponent` is not used, play the sprite directly.
- Returning from HIT is not assumed side-effect-free, and a StateSet/HitComponent-managed monster often auto-returns (e.g. HIT→CHASE once the clip ends). Inspect the destination State's `OnEnter`; delegate to the existing return owner rather than forcing `ChangeState("IDLE")`, and skip any multi-second `OnEnter` wait (e.g. `walkTimeLeft` reset) on hit-recovery re-entry. See the Per-Model Verification Gate above.

#### DEAD

- `IsDead` is not a universal monster-death flag. It is valid only when the effective model's discovered StateSet uses `ConditionIsDead`, in which case writing it requests the final DEAD transition.
- Separate immediate gameplay exclusion from the final death-state trigger when the project needs a damage-skin hold. Use the project's existing pre-death/exclusion capability instead of adding a second State owner.
- **Transition mechanism is per-model — fill the Per-Model Verification Gate above** (`StateSet` model = set as transition condition; simple `StateComponent` model without conditions = direct `ChangeState("DEAD")` call; never both, never uniform).
- Determine independently whether DEAD automatically plays `die` or whether the existing death owner must start the clip. HIT and DEAD may have different playback owners; a State name alone is not playback evidence — a correct transition can still leave the die clip un-rendered.

### Facing ownership

This project's monster facing convention is **`SpriteRendererComponent.FlipX` with a `SpriteFacesLeftByDefault` orientation**. Treat it as the single sanctioned facing writer.

- HIT/death facing MUST be written through `SpriteRendererComponent.FlipX`. Do not use signed `TransformComponent.Scale.x` as a facing writer.
- If the effective monster's AI already writes `FlipX`, reuse that exact writer and orientation convention; the hit/death facing lock reuses the same writer so there is only ever one.
- If a monster currently faces via signed `Scale.x`, that is a competing facing writer: redirect facing to `FlipX` rather than stacking a second `FlipX` writer on top of a live `Scale.x` facing writer. `Scale.x` may remain for a non-facing purpose (e.g. collider sizing), but it MUST NOT be the value that expresses which way the monster looks.
- Identify every writer and ensure the HIT/death facing lock and AI restoration both go through `FlipX` and do not fight each other.

---

## Step 4: Practical Investigation Methodology and Probe Code

### Per-Model Verification Gate — fill this BEFORE writing death/HIT code

This is the single most repeated failure in this skill: the rules get **read** (and even quoted) but not **executed per model** — two models are inspected and the third is assumed to match. This gate converts the rule into a **required filled artifact**: produce the table below from real inspect/probe output before writing any death or HIT code. It is the canonical home for the death-transition and HIT-return rules; other files point here.

### Required StateSet resolution procedure

Do not infer a monster's StateSet from a model name, a shared script, or a similarly named resource. Resolve it for every effective monster model as follows:

1. Inspect every monster model.
2. For each model, find the component that directly uses `StateComponent` or extends it.
3. Read that component's `StateSetId` property value.
4. Find every file with the `.stateset` extension.
5. Compare the `StateSetId` from step 3 with the `EntryKey` field in each `.stateset` file.
6. A matching `EntryKey` proves that the model uses that `.stateset` file. Record the model, component, `StateSetId`, matched `.stateset` path, and relevant condition/transition evidence in the table below.

**Required table — one row per effective monster model (StaticMonster, MoveMonster, ChaseMonster, …):**
| Model | State owner | StateSet? | Death mechanism | HIT-eligible states | HIT return owner | Evidence (actual inspect/probe output) |
|---|---|---|---|---|---|---|

- **Death mechanism follows the discovered `ConditionIsDead` capability:** has the condition → keep immediate gameplay exclusion separate during Death-Hold, then **set `IsDead` only when the final DEAD transition should begin** (a direct `ChangeState("DEAD")` is a competing owner → transition-conflict log, a bug even if die still plays). No `ConditionIsDead` → `IsDead` has no transition authority; use the discovered direct `ChangeState("DEAD")` or direct playback owner. Never both, never uniform across models.
- **HIT mechanism follows `StateSet`:** has the condition → inspect and set the Transition condition used in `StateSet` directly. No `StateSet` / no condition → **direct `ChangeState("HIT")` is the only owner**. Do not confuse the two methods. They operate under distinctly different mechanisms.
- **HIT return owner:** if the StateSet/HitComponent auto-returns (e.g. HIT→CHASE once the clip ends), delegate to it — a manual `ChangeState("IDLE")` fights it and stalls chase/patrol. Audit the return state's `OnEnter` for a multi-second wait (e.g. a `walkTimeLeft` reset) and skip that reset on hit-recovery re-entry. See the Per-Model Verification Gate above. If you do not use StateSet, you must return the state by calling `ChangeState("IDLE")` directly when the HIT state ends.

**Failure conditions — death/HIT is NOT complete if any holds:**

- Any cell empty, or filled with "assumed same as \<model>", "likely", or anything not backed by an actual inspect result.
- **Sample generalization:** fewer than *all* effective models were actually opened. N-of-M matching does not license inferring the rest — open every model.
- One death mechanism applied uniformly across models with different StateSet configs.
- One HIT mechanism applied uniformly across models with different StateSet configs.

### Probe patterns (illustrative — confirm the real API names against the project first; a snippet naming an unverified API is itself an assumption):

```lua
-- Per-model death: prove the transition actually fires, per model
local ok = monster.Entity.StateComponent:ChangeState("DEAD")   -- no-condition model
-- or:  monster.IsDead = true                                   -- only a model proven to use ConditionIsDead
log("[probe] "..modelName.." death ok="..tostring(ok).." state="..monster.Entity.StateComponent.StateName)

-- HIT recovery: poll position every 0.2s after a non-lethal hit
log("[probe] t="..t.." state="..state.." x="..tostring(pos.x))
-- PASS = returns to CHASE and x changes within ~one pulse window, not after a 1-3s stall
```

These prove *behavior*, not that a line of code exists.

---

## Step 5: Forbidden shortcuts and final verification gate

### Forbidden shortcuts

- Creating new HIT/DEAD/CHASE States before inventorying existing ones.
- Treating a State name as proof that its animation plays.
- Treating HIT and DEAD as having the same playback owner without evidence.
- Treating `IsDead` as a universal guard or transition flag without proving that model uses `ConditionIsDead`.
- Assuming an animation-end event fires because an event handler was connected.
- Waiting for the three-second safety timeout on the ordinary player-cast path.
- Hardcoding `IDLE/MOVE/HIT` as the only HIT source states.
- Expressing monster facing through signed `Scale.x`; monster facing is written through `SpriteRendererComponent.FlipX` only.
- Returning to a State without auditing its `OnEnter` side effects.

### Completion evidence

Static evidence must name the discovered owners and transitions. Runtime evidence must show:

1. held-direction cast stops, displays Attack, shows no walk animation, and releases within the intended cast window;
2. loop/no-end-event animation still releases normally without the safety timeout;
3. every effective monster enters visible HIT from each reachable locomotion state;
4. HIT recovery resumes the previous AI cadence without a new multi-second pause;
5. lethal presentation uses one death transition owner and visibly plays die after the hold;
6. facing remains consistent, written through `FlipX`, throughout HIT and death.
