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

Apply every matching row. “Pre-discovery” means the document must be read before inspecting project code so it can define the evidence to discover. “Post-discovery” means the role map must exist first so examples cannot anchor the project topology.

| Condition | Pre-discovery contracts | Post-discovery contracts | Completion evidence |
|---|---|---|---|
| Every player attack create/modify request | [architecture/datasets.md](architecture/datasets.md), [architecture/framework.md](architecture/framework.md), [verification/non-negotiable-presentation-gates.md](verification/non-negotiable-presentation-gates.md), [player/preflight.md](player/preflight.md) | [combat/targeting.md](combat/targeting.md), [combat/damage-presentation.md](combat/damage-presentation.md), [combat/death.md](combat/death.md), [combat/hit-reaction.md](combat/hit-reaction.md), [player/casting.md](player/casting.md) | [verification/player-control-harness.md](verification/player-control-harness.md) and [verification/monster-visual-harness.md](verification/monster-visual-harness.md) |
| Every double-jump or teleport create/modify request | [architecture/framework.md](architecture/framework.md) and the Required Preflight, Architecture, Must-Ask Fields, shared-data, and animation sections of [movement/skills.md](movement/skills.md) | The selected type plus shared execution/authority sections of canonical [movement/skills.md](movement/skills.md); supplemental summaries never replace it | [verification/movement-verification-harness.md](verification/movement-verification-harness.md) |
| Movement affects attack overlap, jump/cast gating, movement, facing, physics, or player animation | [player/preflight.md](player/preflight.md) when current state/animation/controller ownership is involved | [player/casting.md](player/casting.md) | [verification/player-control-harness.md](verification/player-control-harness.md) |
| Monster can damage a player or its ATTACK/contact presentation changes | [combat/monster-attack.md](combat/monster-attack.md) and [player/preflight.md](player/preflight.md) for ATTACK/state/clip/facing/return behavior | Re-open the exact affected sections after the role map if project adaptation is required | The acceptance scenarios in [combat/monster-attack.md](combat/monster-attack.md) |
| Monster receiving-hit, knockback, facing, HIT recovery, lethal, or death behavior changes | [player/preflight.md](player/preflight.md) | [combat/hit-reaction.md](combat/hit-reaction.md) and [combat/death.md](combat/death.md) as applicable | [verification/monster-visual-harness.md](verification/monster-visual-harness.md) |
| Attack infrastructure is missing or incomplete | [architecture/bootstrap.md](architecture/bootstrap.md) in addition to the complete player-attack row | Every leaf contract required by the bootstrap and discovered capability map | Gate B plus both player-attack harnesses |
| Flying projectile | None beyond the player-attack row | [combat/projectile.md](combat/projectile.md) | Applicable player-attack harness rows |
| Staggered multi-target presentation | None beyond the player-attack row | [combat/multi-target.md](combat/multi-target.md) | Applicable monster-visual rows |
| Caster-side effect | None beyond the selected family row | [player/cast-effects.md](player/cast-effects.md) | Applicable player-control rows |
| HIT/knockback implementation fragments would help | Never load before discovery | [combat/hit-reaction-code.md](combat/hit-reaction-code.md), only after [combat/hit-reaction.md](combat/hit-reaction.md); every name is resolved through the role map | Evidence belongs to the behavior contract, not the example code |
| Shared binding, hotkey, or family dispatch changes | [architecture/framework.md](architecture/framework.md), [architecture/hotkeys.md](architecture/hotkeys.md), and the relevant dataset/family contract | Re-open only the affected ownership sections after mapping | Relevant family harness when behavior changes; otherwise static binding evidence |
| Player attack or movement skill create/modify request | [architecture/hotbar-ui.md](architecture/hotbar-ui.md), unless the user explicitly opts out | Extend the discovered UI owner | Hotbar contract evidence |
| Hotbar/icon/cooldown-overlay-only request | [architecture/hotbar-ui.md](architecture/hotbar-ui.md) | Family behavior contracts only if gameplay ownership or behavior changes | Hotbar contract evidence; do not require unrelated combat/movement harnesses |
| Generic `msw-combat-system` guidance conflicts with this project | [architecture/divergences.md](architecture/divergences.md) | Apply the selected leaf contract with project precedence | Record the resolved conflict in the ledger |
| MLUA refresh, component attachment, DataSet import, runtime enum, resource-tooling, or editor anomaly appears | [platform/maker-pitfalls.md](platform/maker-pitfalls.md) when the trigger is known before discovery | Read it immediately when the anomaly is discovered | Report unresolved platform limits explicitly |

## Priority enforcement gates — fail closed

The following gates protect the attack foundation and four behavior families most likely to be lost during implementation. For a player attack, the `SKILL.md` startup gate instantiates `DATA`, `PAP`, `PAJ`, and `MHP` before project writes; Stage 4 completes their mappings. Instantiate every other applicable gate and all of its contract IDs as separate progress-ledger rows during Stage 4. A family-level assurance, one representative scenario, or a link to a document does not satisfy an ID.

| Gate | Applies when | Required contract IDs | Single behavior authority | Required evidence |
|---|---|---|---|---|
| `DATA` — attack data foundation | Every player attack create/modify request | `DATA-01` existing/new infrastructure decision; `DATA-02` schema and CSV/DataSet asset; `DATA-03` concrete attack and binding rows; `DATA-04` catalog loading/validation evidence | [architecture/datasets.md](architecture/datasets.md) and the DataSet/catalog sections of [architecture/framework.md](architecture/framework.md) | Inspected DataSet/CSV asset and row, binding resolution when usable, and successful catalog schema/row validation; use [architecture/bootstrap.md](architecture/bootstrap.md) when the infrastructure is missing or incomplete |
| `PAP` — player attack presentation | Every player attack create/modify request, including an empty or nil requested animation key | `PAP-01` dispatch and animation source; `PAP-02` cast/control ownership; `PAP-03` deterministic release, interruption, and stale-callback cleanup; `PAP-04` runtime evidence | [player/casting.md](player/casting.md) and Gate P in [verification/non-negotiable-presentation-gates.md](verification/non-negotiable-presentation-gates.md) | Every applicable `P0`–`P12` row in [verification/player-control-harness.md](verification/player-control-harness.md) |
| `PAJ` — player attack judgment | Every player attack that can select or damage a target | `PAJ-01` cast-time target snapshot; `PAJ-02` one synchronous consolidated judgment per target; `PAJ-03` presentation-only delayed callbacks; `PAJ-04` judgment checkpoint evidence | [combat/targeting.md](combat/targeting.md) | Evidence for candidate snapshot, immediate result/skip, delayed presentation result/skip, and final presented-hit count for every affected attack path |
| `MHP` — monster hit/death presentation | Every player attack that can damage a monster, and monster receiving-hit/death presentation changes | `MHP-01` effective target-class capability map; `MHP-02` non-lethal presentation; `MHP-03` lethal presentation and immediate exclusion; `MHP-04` per-class runtime evidence | Gate M in [verification/non-negotiable-presentation-gates.md](verification/non-negotiable-presentation-gates.md), [combat/hit-reaction.md](combat/hit-reaction.md), and [combat/death.md](combat/death.md) | Every applicable `H`, `D`, `E`, and `F` row in [verification/monster-visual-harness.md](verification/monster-visual-harness.md) for every effective target class |
| `TP` — teleport | Every `teleport_skill` create/modify request or teleport behavior change | `TP-01` preflight and role map; `TP-02` direction and horizontal landing; `TP-03` vertical landing and cancellation; `TP-04` success-only side effects and cooldown; `TP-05` client-first authority topology; `TP-06` runtime evidence | The teleport and shared authority sections of [movement/skills.md](movement/skills.md) | `T1`–`T10` plus every applicable cast-interaction row in [verification/movement-verification-harness.md](verification/movement-verification-harness.md) |

Use this transition for each required ID:

1. Create the ledger row as `OPEN` before implementation, with its authoritative section, discovered owner, planned implementation location, and named evidence scenario.
2. Keep it `OPEN` while implementation or evidence is missing. A static inspection cannot pass an ID that requires runtime evidence.
3. Change it to `PASS` only after recording the concrete observed result for every named scenario and, where required, every effective target class.
4. Use `N/A` only when the gate's own applicability condition is false, and record that condition. Never use `N/A` because Maker access, time, or a capability is missing.
5. Use `BLOCKED` when required runtime access or project capability is unavailable. Any `OPEN`, `BLOCKED`, `NOT RUN`, inferred, or partially sampled priority ID blocks Stage 7 completion language.

## Documentation Consistency Review

For every guide-only change, record each row as `PASS`, `N/A` with a reason, or `BLOCKED`. This review uses repository inspection only and must not depend on Python, Node, or another optional local runtime.

| Check | Required evidence |
|---|---|
| Link resolution | Every changed or added local Markdown link names an existing file; record the inspected source and target paths |
| Reference reachability | Every `references/*.md` file remains listed in the `SKILL.md` Reference Catalog; a new reference is also selected by this execution core when its behavior has a runtime trigger |
| Single routing authority | `SKILL.md` contains only the fixed player-attack startup gate needed before progressive reference loading; conditional selection remains in the Detail-loading matrix, and index/overview files contain no competing `MUST read` condition table |
| Canonical ownership | Exact behavior stays in one leaf contract; aliases and indexes point to it without copying the rule |
| Rename propagation | Search the changed scope for the previous filename, field, role, and contract terms; every remaining occurrence is either removed or explicitly documented as a compatibility alias |
| Cross-file rule consistency | Every named rule changed in one leaf is checked at each known cross-reference and harness |
| Roles, not filenames | New concrete identifiers are framed as a current instantiation, example, recommendation, or role-map result unless they are canonical engine APIs or fixed project defaults |
| Tone and encoding | Preserve LF and the established rule → reason → reference style; reject corrupted replacement characters or mojibake |

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
