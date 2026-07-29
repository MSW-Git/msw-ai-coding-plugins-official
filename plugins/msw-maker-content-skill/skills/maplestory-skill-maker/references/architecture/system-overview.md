# MSW Skill System Overview

This is a project-specific context map. It does not define detailed gameplay behavior.

## Purpose

The system is type-driven: datasets describe concrete skills, family Registries execute shared type handlers, player Adapters own local presentation/control, and existing monster owners handle target-side presentation.

## Families

- Attack: direct and projectile types, authoritative damage, caster presentation, and monster combat presentation.
- Movement: double jump and teleport types using a separate Registry and Adapter with no Defender dependency.
- Shared UI/input: bindings and hotbar presentation route a `skillId` to the correct family without owning family behavior.

## Capability map

| Capability | Source of truth |
|---|---|
| Catalog, Registry, Adapter, dispatch, cooldown | [framework.md](framework.md) |
| Dataset fields and type timing | [datasets.md](datasets.md) |
| Hotkeys and hotbar | [hotkeys.md](hotkeys.md), [hotbar-ui.md](hotbar-ui.md) |
| Player casting and animation | [../player/casting.md](../player/casting.md) |
| Direct/projectile targeting and judgment | [../combat/targeting.md](../combat/targeting.md) |
| Damage numbers and impact effects | [../combat/damage-presentation.md](../combat/damage-presentation.md) |
| Surviving hit reaction | [../combat/hit-reaction.md](../combat/hit-reaction.md) |
| Lethal lifecycle | [../combat/death.md](../combat/death.md) |
| Movement | [../movement/index.md](../movement/index.md) |
| Completion evidence | [../verification/index.md](../verification/index.md) |

## Working boundary

Search the current project and map each capability to one active owner before editing. Example filenames and methods are not mandatory. When this overview conflicts with a leaf contract, the leaf contract wins within its responsibility.

Use [../execution-core.md](../execution-core.md) to select the required document set for the task.