# Skill Execution Core

Use this file as the single execution procedure for player attack, player movement, and monster-presentation create/modify work. `SKILL.md` classifies the request and exposes the document catalog; this file alone decides which contracts must be loaded and when. Leaf references remain the single authority for exact behavior, data, ordering, APIs, and verification criteria.

Guide-only edits and reviews use the lightweight route in `SKILL.md`; they do not require project discovery, implementation, or runtime evidence unless project work is also requested.

## Operating rules

- Do not design from example filenames. Discover the current project owners, then record concrete names as the current instantiation.
- Do not copy exact behavior into this file. Select and read the authoritative leaf contract.
- Do not self-authorize simplification of a `MUST`, required default, rejection condition, or completion gate.
- An unverified or blocked required row remains open. Never report implementation as complete while one is open.
- Read behavior contracts before illustrative code.

## Required progress ledger

Create and maintain this ledger during execution. Update it at every stage instead of reconstructing evidence at the end.

| Requirement | Confirmed decision | Current role / concrete owner | Applied contract | Implementation location | Verification scenario and evidence | Status / open blocker |
|---|---|---|---|---|---|---|
| `<requested behavior>` | `<resolved value or policy>` | `<role → current file/component/entity>` | `<reference + section>` | `<planned or changed location>` | `<scenario → observed evidence>` | `OPEN / PASS / BLOCKED` |

Use `OPEN` until both implementation and required evidence exist. Use `BLOCKED` only with the missing capability, access, or evidence named explicitly.

## Unified execution stages

Attack, movement, and monster-presentation work use the same stage order.

| Stage | Input | Required artifact | Exit condition |
|---|---|---|---|
| 1. Confirm requirements | User request plus the mode-specific question source selected below | Confirmed requirement rows in the progress ledger, including explicit defaults and unresolved decisions | No unresolved decision can change architecture, data shape, authority, timing, or verification scope |
| 2. Discover project roles | Confirmed requirements plus pre-discovery contracts selected below | Current-instantiation role map with concrete owners and capability evidence | Every affected state, lifetime, cleanup, data, input, UI, animation, and service owner is mapped or explicitly blocked |
| 3. Load applied contracts | Role map plus the detail-loading matrix | Applied-contract list, including conditional rows triggered by discovered capabilities | Every applicable behavior contract and verification contract is listed; illustrative code remains deferred until its behavior contract is understood |
| 4. Build compliance and verification map | Confirmed requirements, role map, and applied contracts | Completed pre-implementation columns of the progress ledger and instantiated harness/checklist rows | Every applicable invariant, default, rejection condition, and gate has an owner, implementation point, and verification scenario |
| 5. Implement | Approved compliance map | Scoped project changes plus updated implementation-location entries | The change preserves discovered ownership and every mapped contract; no open row was silently omitted |
| 6. Verify evidence | Implementation plus instantiated harnesses/checklists | Runtime/static evidence recorded per row | Every required row is `PASS`; `BLOCKED`, `NOT RUN`, ambiguous, or missing evidence remains incomplete |
| 7. Report | Final progress ledger | Completion report containing decisions, changed owners/locations, evidence, and open blockers | The report makes no completion claim beyond the recorded evidence |

## Mode-specific requirement sources

| Mode | Resolve before project discovery |
|---|---|
| Player attack | Use [architecture/datasets.md](architecture/datasets.md#must-ask-vs-standard-default-fields). Accept documented standard defaults without re-asking unless the request needs an override or a project conflict is discovered. |
| Player movement | Use [movement/skills.md](movement/skills.md#must-ask-fields), including common fields and the selected movement type. |
| Monster presentation only | Resolve damage direction, legacy-contact versus range-detected ATTACK capability, attack range, hit-frame delay, reattack delay, movement-lock ownership, receiving-hit scope, lethal/death scope, and required state/clip behavior. Do not inject the player-skill questionnaire. |
| Combined request | Merge the applicable mode rows and keep ownership, contracts, harnesses, and evidence separate in the ledger. |

## Detail-loading matrix — sole selection authority

Apply every matching row. Read all matching pre-discovery contracts together in one batch before inspecting project code so they can define the evidence to discover. After the role map exists, read all matching post-discovery contracts together in a separate batch so examples cannot anchor the project topology. Do not cross or merge these two batch boundaries.

| Condition | Pre-discovery contracts | Post-discovery contracts | Completion evidence |
|---|---|---|---|
| Every player attack create/modify request | [architecture/datasets.md](architecture/datasets.md), [architecture/framework.md](architecture/framework.md), [verification/non-negotiable-presentation-gates.md](verification/non-negotiable-presentation-gates.md), [player/preflight.md](player/preflight.md) | [combat/targeting.md](combat/targeting.md), [combat/damage-presentation.md](combat/damage-presentation.md), [combat/death.md](combat/death.md), [combat/hit-reaction.md](combat/hit-reaction.md), [player/casting.md](player/casting.md) | [verification/player-control-harness.md](verification/player-control-harness.md) and [verification/monster-visual-harness.md](verification/monster-visual-harness.md) |
| Every double-jump or teleport create/modify request | [architecture/framework.md](architecture/framework.md) and the Required Preflight, Architecture, Must-Ask Fields, shared-data, and animation sections of [movement/skills.md](movement/skills.md) | The selected type plus shared execution/authority sections of canonical [movement/skills.md](movement/skills.md) | [verification/movement-verification-harness.md](verification/movement-verification-harness.md) |
| Movement affects attack overlap, jump/cast gating, movement, facing, physics, or player animation | [player/preflight.md](player/preflight.md) when current state/animation/controller ownership is involved | [player/casting.md](player/casting.md) | [verification/player-control-harness.md](verification/player-control-harness.md) |
| Monster can damage a player or its ATTACK/contact presentation changes | [combat/monster-attack.md](combat/monster-attack.md) and [player/preflight.md](player/preflight.md) for ATTACK/state/clip/facing/return behavior | Re-open the exact affected sections after the role map if project adaptation is required | The acceptance scenarios in [combat/monster-attack.md](combat/monster-attack.md) |
| Monster receiving-hit, knockback, facing, HIT recovery, lethal, or death behavior changes | [player/preflight.md](player/preflight.md) | [combat/hit-reaction.md](combat/hit-reaction.md) and [combat/death.md](combat/death.md) as applicable | [verification/monster-visual-harness.md](verification/monster-visual-harness.md) |
| Attack infrastructure is missing or incomplete | [architecture/bootstrap.md](architecture/bootstrap.md) in addition to the complete player-attack row | Every leaf contract required by the bootstrap and discovered capability map | Gate B plus both player-attack harnesses |
| Flying projectile | None beyond the player-attack row | [combat/projectile.md](combat/projectile.md) | Applicable player-attack harness rows |
| Staggered multi-target presentation | None beyond the player-attack row | [combat/multi-target.md](combat/multi-target.md) | Applicable monster-visual rows |
| Caster-side effect, on any family | None beyond the selected family row | [player/cast-effects.md](player/cast-effects.md) | Applicable player-control rows for an attack cast; applicable movement-verification rows for a movement cast. Record the attach-versus-pin choice and the observed anchor |
| A presentation RUID must be chosen or replaced — effect, sprite, animation, sound, projectile image, icon, or avatar item | None beyond the selected family row | [architecture/resource-selection.md](architecture/resource-selection.md) | The recorded candidate inspection, the confirmed appearance, and the persisted value; or an explicitly reported blocked search naming the affected field |
| HIT/knockback implementation fragments would help | Never load before discovery | [combat/hit-reaction-code.md](combat/hit-reaction-code.md), only after [combat/hit-reaction.md](combat/hit-reaction.md); every name is resolved through the role map | Evidence belongs to the behavior contract, not the example code |
| Shared binding, hotkey, or family dispatch changes | [architecture/hotkeys.md](architecture/hotkeys.md) for binding storage, key defaults, and input routing; [architecture/framework.md](architecture/framework.md) for catalog and dispatch ownership; and the relevant dataset/family contract | Re-open only the affected ownership sections after mapping | Relevant family harness when behavior changes; otherwise static binding evidence |
| Player attack or movement skill create/modify request | [architecture/hotbar-ui.md](architecture/hotbar-ui.md), unless the user explicitly opts out | Extend the discovered UI owner | Hotbar contract evidence |
| Hotbar/icon/cooldown-overlay-only request | [architecture/hotbar-ui.md](architecture/hotbar-ui.md) | Family behavior contracts only if gameplay ownership or behavior changes | Hotbar contract evidence; do not require unrelated combat/movement harnesses |
| Generic `msw-combat-system` guidance, another external skill, or the target project's own documented convention conflicts with this package | [architecture/divergences.md](architecture/divergences.md) | Apply the selected leaf contract with the precedence direction that file defines | Record the resolved conflict and the inspected source in the ledger |
| MLUA refresh, component attachment, DataSet import, runtime enum, resource-tooling, or editor anomaly appears | [platform/maker-pitfalls.md](platform/maker-pitfalls.md) when the trigger is known before discovery | Read it immediately when the anomaly is discovered | Report unresolved platform limits explicitly |

## Priority enforcement gates — fail closed

The following gates protect the attack foundation and four behavior families most likely to be lost during implementation. For a player attack, the `SKILL.md` startup gate instantiates `DATA`, `PAP`, `PAJ`, and `MHP` before project writes; Stage 4 completes their mappings. Instantiate every other applicable gate and all of its contract IDs as separate progress-ledger rows during Stage 4. A family-level assurance, one representative scenario, or a link to a document does not satisfy an ID.

| Gate | Applies when | Required contract IDs | Single behavior authority | Required evidence |
|---|---|---|---|---|
| `DATA` — attack data foundation | Every player attack create/modify request | `DATA-01` existing/new infrastructure decision; `DATA-02` schema and CSV/DataSet asset; `DATA-03` concrete attack and binding rows; `DATA-04` catalog loading/validation evidence | [architecture/datasets.md](architecture/datasets.md) and the DataSet/catalog sections of [architecture/framework.md](architecture/framework.md) | Inspected DataSet/CSV asset and row, binding resolution when usable, and successful catalog schema/row validation; use [architecture/bootstrap.md](architecture/bootstrap.md) when the infrastructure is missing or incomplete |
| `PAP` — player attack presentation | Every player attack create/modify request, including an empty or nil requested animation key | `PAP-01` dispatch and animation source; `PAP-02` cast/control ownership; `PAP-03` deterministic release, interruption, and stale-callback cleanup; `PAP-04` runtime evidence | [player/casting.md](player/casting.md) and Gate P in [verification/non-negotiable-presentation-gates.md](verification/non-negotiable-presentation-gates.md) | Every applicable `P0`–`P14` row in [verification/player-control-harness.md](verification/player-control-harness.md) |
| `PAJ` — player attack judgment | Every player attack that can select or damage a target | `PAJ-01` cast-time target snapshot; `PAJ-02` one synchronous consolidated judgment per target; `PAJ-03` presentation-only delayed callbacks; `PAJ-04` judgment checkpoint evidence | [combat/targeting.md](combat/targeting.md) | Evidence for candidate snapshot, immediate result/skip, delayed presentation result/skip, and final presented-hit count for every affected attack path |
| `MHP` — monster hit/death presentation | Every player attack that can damage a monster, and monster receiving-hit/death presentation changes | `MHP-01` effective target-class capability map; `MHP-02` non-lethal presentation; `MHP-03` lethal presentation and immediate exclusion; `MHP-04` per-class runtime evidence | Gate M in [verification/non-negotiable-presentation-gates.md](verification/non-negotiable-presentation-gates.md), [combat/hit-reaction.md](combat/hit-reaction.md), and [combat/death.md](combat/death.md) | Every applicable `H`, `D`, `E`, and `F` row in [verification/monster-visual-harness.md](verification/monster-visual-harness.md) for every effective target class |
| `TP` — teleport | Every `teleport_skill` create/modify request or teleport behavior change | `TP-01` preflight and role map; `TP-02` direction and horizontal landing; `TP-03` vertical landing and cancellation; `TP-04` success-only side effects and cooldown; `TP-05` client-first authority topology; `TP-06` runtime evidence | The teleport and shared authority sections of [movement/skills.md](movement/skills.md) | `T1`–`T10` plus every applicable cast-interaction row in [verification/movement-verification-harness.md](verification/movement-verification-harness.md) |

Use this transition for each required ID:

1. Create the ledger row as `OPEN` before implementation, with its authoritative section, discovered owner, planned implementation location, and named evidence scenario.
2. Keep it `OPEN` while implementation or evidence is missing. A static inspection cannot pass an ID that requires runtime evidence.
3. Change it to `PASS` only after recording the concrete observed result for every named scenario and, where required, every effective target class.
4. Use `N/A` only when the gate's own applicability condition is false, and record that condition. Never use `N/A` because Maker access, time, or a capability is missing.
5. Use `BLOCKED` when required runtime access or project capability is unavailable. Any `OPEN`, `BLOCKED`, `NOT RUN`, inferred, or partially sampled priority ID blocks Stage 7 completion language.

## Enforcement tiers

Every behavior reference states its tier on the line directly under its title. The tier says how compliance is proven and what blocks Stage 7. It never says a rule is optional: a `MUST`, required default, or rejection condition is binding in every tier.

| Tier | Meaning |
|---|---|
| `completion-blocking` | Violating the file's rules, or failing to produce its named evidence, leaves a priority ID, a harness row, or the completion evidence the detail-loading matrix names for that condition open, and blocks Stage 7 completion language |
| `mixed` | The named sections are completion-blocking; the rest is implementation discipline. The tier line names which is which |
| `implementation discipline` | Binding on the implementation and checked during Stage 5, but the file owns no evidence row, so it cannot by itself close or block a gate |
| `evidence source` | The file defines the gates or harness rows that other contracts are proven against |
| `illustrative` | Example material. Evidence belongs to the behavior contract it illustrates |

Read the tier before triaging work under pressure: a `completion-blocking` row cannot be deferred to a follow-up, and an `implementation discipline` rule cannot be reported as gate evidence. Keep a file's tier line accurate whenever its bindings in the detail-loading matrix or the priority gates change, and verify it in the Documentation Consistency Review below.

## Documentation Consistency Review

For every guide-only change, record each row as `PASS`, `N/A` with a reason, or `BLOCKED`. This review uses repository inspection only and must not depend on Python, Node, or another optional local runtime.

Inspect each row against the changed scope and name what was actually checked. A row passes on inspected paths, terms, and cross-references; a checklist assertion is not evidence, and neither is a summary of what the change intended.

| Check | Required evidence |
|---|---|
| Link resolution | Every local Markdown link, including its `#anchor`, names an existing file and an existing heading; record the inspected source and target paths |
| Reference reachability | Every `references/**/*.md` file remains listed in the `SKILL.md` Reference Catalog, and a new reference is also selected by this execution core when its behavior has a runtime trigger |
| Single routing authority | `SKILL.md` contains only the fixed player-attack startup gate needed before progressive reference loading; conditional selection remains in the Detail-loading matrix, and index/overview files contain no competing `MUST read` condition table |
| Canonical ownership | Exact behavior stays in one leaf contract; every other file links to that owner instead of restating the rule. Deciding which leaf owns a new rule is part of the change |
| Priority gate ID coverage | Every `DATA`, `PAP`, `PAJ`, `MHP`, and `TP` contract ID stays bound in this file, and the four attack families stay instantiated by the `SKILL.md` startup gate |
| Enforcement tiers | Every behavior reference declares one of the tiers in [Enforcement tiers](#enforcement-tiers) under its title, and every gate ID a tier line names is bound in this file |
| Rename propagation | Search the changed scope for the previous filename, field, role, and contract terms; every remaining occurrence is either removed or explicitly documented as a compatibility alias |
| Cross-file rule consistency | Every named rule changed in one leaf is checked at each known cross-reference and harness |
| External dependency declaration | Every external skill an edited file relies on appears in the `SKILL.md` Required Context under its current, verified name |
| Roles, not filenames | New concrete identifiers are framed as a current instantiation, example, recommendation, or role-map result unless they are canonical engine APIs or fixed project defaults |
| Tone and encoding | Preserve each file's existing line endings and the established rule → reason → reference style; reject corrupted replacement characters or mojibake |

A checklist assertion without inspected paths, terms, or cross-references is not evidence.

## Completion report

Report:

1. confirmed requirements and defaults;
2. discovered current-instantiation roles;
3. contracts applied;
4. implementation locations;
5. verification scenarios with concrete evidence;
6. every remaining `OPEN` or `BLOCKED` row.

Do not substitute a prose assurance for the progress ledger or required harness evidence.
