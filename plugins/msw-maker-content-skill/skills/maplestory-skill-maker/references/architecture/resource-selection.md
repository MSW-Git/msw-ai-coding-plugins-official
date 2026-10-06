# Resource RUID Selection

**Enforcement:** completion-blocking — every RUID persisted into authoritative data is either an inspected and appearance-confirmed resource or an explicitly reported blocked search. Evidence is the recorded candidate inspection and the stored value.

How a RUID is chosen for any presentation field — effect, sprite, animation, sound, projectile image, icon, or avatar item. This file owns selection only. How a chosen resource is then played, attached, oriented, or ordered belongs to the family contract that owns that field. See [../../SKILL.md](../../SKILL.md) for the Reference Catalog.

## Contents

- [Selection Ladder](#selection-ladder)
- [Required Procedure](#required-procedure)
- [Rejection and Fallback](#rejection-and-fallback)

## Selection Ladder

Selection happens at authoring time, never at game runtime. Apply in order and stop at the first usable result:

1. A RUID already stored in the authoritative skill data for that field.
2. A verified project-standard default documented by the data contract that owns the field — [datasets.md](datasets.md) for attack rows, [../movement/skills.md](../movement/skills.md) for movement rows.
3. An existing presentation resource already proven in this project that legibly serves the same purpose.
4. Resource search through the `msw-search` skill, which invokes the validated `msw-mcp` resource pipeline. Do not call `asset_search_resources` directly.

## Required Procedure

1. Load `msw-search` and read its required resource search/detail references.
2. Search the concrete concept first, using the skill name and semantic variants inferred from element, motion, weapon, and skill type.
3. When the exact name returns nothing usable, broaden toward the visual concept the skill communicates rather than the literal skill name. A closest-concept result beats an unrelated exact-name result.
4. Inspect resource details when the result type or thumbnail behavior is uncertain.
5. **Confirm the appearance before choosing.** When candidates carry no descriptive label — unnamed clips, generated ids, numeric variants — retrieve the candidate's thumbnail from the resource detail payload and look at it. Do not select from an identifier, file name, or search rank alone. Record which candidates were inspected and why the chosen one was kept.
6. Apply the correct RUID/thumbnail convention from `msw-search` and the renderer-RUID rules.
7. Persist the chosen RUID into the authoritative catalog/DataSet so later sessions are deterministic. Never run MCP searches from `OnBeginPlay`, `OnUpdate`, or a cast handler.

## Rejection and Fallback

- Never fabricate a RUID, guess one from a pattern, or transcribe one out of an example row in this guide.
- An empty RUID is valid only where the field's own family contract declares it a guarded hook. Emptiness is then a recorded decision, not the residue of a search that was never run or never confirmed.
- A candidate that could not be visually confirmed is not a completed selection. Report it as blocked and name the field it affects instead of persisting it as final.
- If `msw-mcp` is unavailable, reuse the closest valid presentation RUID already proven in the project when one exists, and explicitly report the unresolved search together with the affected field. Never leave the failure silent.
- Absence of a labelled, verifiable resource is a reason to report a blocked selection, never a reason to narrow the requested skill's presentation without saying so.
