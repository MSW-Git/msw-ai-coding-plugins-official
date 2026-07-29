---
name: maplestory-skill-maker
description: Create advanced MapleStory Worlds player attack and movement skills and preserve the project's monster combat presentation. Use for direct/projectile attacks, hit/die animation, damage-skin death hold, knockback pulses, monster ATTACK range/timing, custom player animation and cast locks, double jump, teleport/blink, cooldowns, hotkeys, or updates to the player/monster skill pipelines.
---

# MSW Player Skill Maker (Attack + Movement)

Use this skill to create reusable attack-skill and movement-skill implementation patterns for this project's MSW player stacks.

This is not a basic MSW combat-rule summary. Treat it as a project-specific implementation guide for skills whose gameplay timing and visual timing may intentionally diverge from the default MSW presentation flow.

The intended design is type-driven: define a small number of skill *types*, then stamp out concrete attack or movement skills by tuning family-specific data.

## Current Goal

Create advanced player-skill implementation patterns from reusable types. Attack skills tune damage/judgment/presentation; movement skills tune movement power/distance, air-use count, collision policy, and authority/prediction.

For the attack family, this guide handles authoritative judgment, HP/death state, and visual hit timing. For the movement family, use the platform-aware execution and validation contract in [references/movement/skills.md](references/movement/skills.md).

## Required Context

Before editing project files, load the normal MSW foundation for the task:

- `msw-general`
- `msw-ui-system` and `msw-ui-design-tokens` for the skill hotbar UI, which is a default deliverable for every skill (see [references/architecture/hotbar-ui.md](references/architecture/hotbar-ui.md))
- `msw-scripting` for any `.mlua` edits
- `msw-combat-system` for hit/damage/projectile work
- `msw-defaultplayer` for double jump, teleport, Body, or player movement work
- `msw-avatar` for attack animation or avatar action changes
- `msw-search` when an effect, sprite, animation, sound, projectile image, or avatar item RUID is needed
- `msw-mcp` when the `msw-search` resource pipeline is required; if it is unavailable, follow the explicit fallback/reporting rule in [references/architecture/hotbar-ui.md](references/architecture/hotbar-ui.md)

For every player attack, player movement, or monster-presentation create/modify request, read [references/execution-core.md](references/execution-core.md) first and follow its stage gates and sole detail-loading matrix. Do not select required contracts from the catalog below. For guide-only work, use the lightweight route under Request Modes.

## Execute Discovered Obligations — do not acknowledge and stop

Treat every applicable required rule as work to execute, not commentary to repeat. Do not stop with an apology, realization, praise of the guide, or a restatement such as “this must be followed,” and do not hand the rule back to the user for confirmation.

When a missed or unevidenced obligation is discovered, immediately reopen the affected ledger rows to `OPEN`, inspect the required project evidence, correct the implementation, and run the named verification before continuing. Mark a row `BLOCKED` only when the exact required access or evidence is unavailable; record what is missing and ask only for that specific external artifact. For per-model HIT/death obligations, execute the required model-by-model artifact and gates rather than merely citing them. (→ [references/player/preflight.md](references/player/preflight.md), [references/verification/monster-visual-harness.md](references/verification/monster-visual-harness.md))

## Player Attack Startup Gate — loaded entry contract

This section is intentionally in `SKILL.md` because linked references are loaded progressively and an agent that skips the first link would otherwise miss the attack's foundation and presentation obligations. It fixes the first actions and required artifacts; leaf references still own exact behavior.

For every player attack create/modify request, complete these actions **before any project write**:

1. Open [references/execution-core.md](references/execution-core.md), [references/architecture/datasets.md](references/architecture/datasets.md), [references/architecture/framework.md](references/architecture/framework.md), [references/verification/non-negotiable-presentation-gates.md](references/verification/non-negotiable-presentation-gates.md), and [references/player/preflight.md](references/player/preflight.md).
2. Discover whether the attack DataSet/catalog/binding infrastructure already exists. If any part is missing or incomplete, also open [references/architecture/bootstrap.md](references/architecture/bootstrap.md).
3. Create a user-visible progress ledger. Use the host's visible plan/task artifact when available; otherwise create `.maplestory-skill-maker-ledger.md` in the target project root and keep it through handoff.
4. Instantiate every required ID below with its discovered owner, authoritative contract, planned implementation location, named evidence scenario, and `OPEN` status:

| Required family | Rows that must exist before editing |
|---|---|
| `DATA` — attack data foundation | `DATA-01` existing/new DataSet and catalog decision; `DATA-02` schema and project-managed CSV/DataSet asset; `DATA-03` concrete attack row and usable binding row; `DATA-04` catalog load/validation evidence |
| `PAP` — player attack presentation | `PAP-01`–`PAP-04` |
| `PAJ` — player attack judgment | `PAJ-01`–`PAJ-04` |
| `MHP` — monster hit/death presentation | `MHP-01`–`MHP-04`, expanded per effective target class |

Do not create or edit project scripts, components, entities, DataSets, or CSVs until this startup ledger exists. A damaging player attack is not implemented unless all four families have implementation locations: attack data, player casting presentation, immediate judgment, and monster receiving-hit/death presentation. Missing Maker/runtime access changes runtime-dependent rows to `BLOCKED`; it never authorizes omitting their implementation or silently narrowing the attack to damage-only behavior.

## Reference Catalog

This is a document dictionary, not a second routing table. The fixed player-attack startup list above protects progressive loading; after that entry gate, [references/execution-core.md](references/execution-core.md) is the only authority for conditional document selection and timing. Leaf references own exact behavior.

| Group | Files |
|---|---|
| Execution | [references/execution-core.md](references/execution-core.md), [references/index.md](references/index.md) |
| Compatibility aliases | [references/skill-data-contract.md](references/skill-data-contract.md), [references/knockback-hit-reaction.md](references/knockback-hit-reaction.md) |
| Architecture | [references/architecture/index.md](references/architecture/index.md), [references/architecture/system-overview.md](references/architecture/system-overview.md), [references/architecture/framework.md](references/architecture/framework.md), [references/architecture/datasets.md](references/architecture/datasets.md), [references/architecture/hotkeys.md](references/architecture/hotkeys.md), [references/architecture/hotbar-ui.md](references/architecture/hotbar-ui.md), [references/architecture/bootstrap.md](references/architecture/bootstrap.md), [references/architecture/divergences.md](references/architecture/divergences.md) |
| Combat | [references/combat/index.md](references/combat/index.md), [references/combat/targeting.md](references/combat/targeting.md), [references/combat/projectile.md](references/combat/projectile.md), [references/combat/damage-presentation.md](references/combat/damage-presentation.md), [references/combat/multi-target.md](references/combat/multi-target.md), [references/combat/hit-reaction.md](references/combat/hit-reaction.md), [references/combat/hit-reaction-code.md](references/combat/hit-reaction-code.md), [references/combat/monster-attack.md](references/combat/monster-attack.md), [references/combat/death.md](references/combat/death.md) |
| Movement | [references/movement/index.md](references/movement/index.md), [references/movement/skills.md](references/movement/skills.md), [references/movement/common.md](references/movement/common.md), [references/movement/double-jump.md](references/movement/double-jump.md), [references/movement/teleport.md](references/movement/teleport.md) |
| Player | [references/player/index.md](references/player/index.md), [references/player/preflight.md](references/player/preflight.md), [references/player/casting.md](references/player/casting.md), [references/player/cast-effects.md](references/player/cast-effects.md) |
| Verification | [references/verification/index.md](references/verification/index.md), [references/verification/non-negotiable-presentation-gates.md](references/verification/non-negotiable-presentation-gates.md), [references/verification/player-control-harness.md](references/verification/player-control-harness.md), [references/verification/monster-visual-harness.md](references/verification/monster-visual-harness.md), [references/verification/movement-verification-harness.md](references/verification/movement-verification-harness.md) |
| Platform | [references/platform/index.md](references/platform/index.md), [references/platform/maker-pitfalls.md](references/platform/maker-pitfalls.md) |

## Request Modes

Classify every request before loading domain references:

- **Player attack skill** — normal, projectile, area, or multi-target player attacks.
- **Player movement skill** — double jump, teleport, blink, air jump, or another movement ability.
- **Monster presentation only** — monster ATTACK timing, contact/range capability, HIT/DEAD presentation, facing, or movement lock without creating a player skill.
- **Guide-only change or review** — edits or coherence checks for this instruction package itself.

If a request spans modes, record the combination explicitly. Do not import another mode's defaults or deliverables without a matching execution-core condition.

## Route Entry

- **Player attack, player movement, monster presentation, or a combination:** read [references/execution-core.md](references/execution-core.md), create its progress ledger, and follow its stages and sole detail-loading matrix through evidence-backed reporting.
- **Guide-only change or review:** read this router and the directly affected leaf reference. Load adjacent references only to verify a named cross-file rule or dependency. Do not inspect project code, run implementation harnesses, or require gameplay deliverables unless project modification is also requested.

## Authority and Change Rules

- `SKILL.md` owns request classification, external context, entry routing, and the player-attack startup/definition-of-done gate above.
- [references/execution-core.md](references/execution-core.md) owns execution stages, required artifacts, exit conditions, and conditional document selection.
- Leaf references own exact behavior, data shapes, defaults, ordering, APIs, rejection conditions, and acceptance evidence. Index and overview documents are navigation aids only.
- Concrete filenames, component names, methods, and entities in references are current instantiations or examples unless a leaf contract explicitly identifies a canonical engine API or fixed project default. Discover and map roles before creating or connecting anything.
- When the user supplies a new rule, update its authoritative leaf reference first. Update the execution core only if the trigger, stage, artifact, or completion gate changes; update this catalog only when the file set changes.
- After documentation changes, perform the Documentation Consistency Review in [references/execution-core.md](references/execution-core.md). Record its evidence in the progress ledger; any unresolved link, reachability, terminology, or routing failure blocks completion.
