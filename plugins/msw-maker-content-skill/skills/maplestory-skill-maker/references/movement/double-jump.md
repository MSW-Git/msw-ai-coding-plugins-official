# Double Jump Skill

Use this reference when implementing player movement skills. This document defines two reusable movement skill types:

- `double_jump_skill`: Consumes a limited number of air-charge jumps while airborne.
- `teleport_skill`: Teleports the player by a configured distance in world units.

These are not attack skills. They do not target defenders, generate `attackInfo` tables, or interface with the damage/death-presentation pipelines.

## Scope

Read [common.md](common.md) first. This file owns only `double_jump_skill` eligibility, charge, and force behavior.

## Required decisions

Confirm:

- supported map/body modes;
- number of air-jump charges;
- horizontal and vertical force values;
- fall-damping policy and limits;
- attack/hit/dead/climbing interaction flags;
- optional effect/sound resources.

Do not copy numeric forces or RUIDs from examples.

## Runtime contract

1. Let the native controller own the initial grounded jump.
2. On an airborne jump input, check remaining charges and all shared gates.
3. Resolve facing and calculate the requested force from the normalized row.
4. Call the verified map/body forced-jump API.
5. On success only, consume one charge and run the common success flow.
6. Reset charges on an observed airborne-to-grounded transition, respawn, or relevant map/body reset—not on a timer.

A cliff fall counts as airborne eligibility when the type design allows it.

## Force policy

Do not assume `MovementComponent:Jump()` supplies an air jump. MapleTile and SideView body types may expose different forced-jump capabilities; verify each supported mode.

For a curve damping policy, derive the downward fall amount from current real movement, compute a bounded damping ratio, subtract configured damping from vertical power, and clamp to configured limits. Keep this calculation in one helper so runtime and verification logs use the same value.

Preserve gravity and unrelated velocity ownership. Do not disable the controller or zero the complete velocity vector to implement an air jump.

## Evidence

Log skill ID, map/body mode, grounded state, charges before/after, requested and applied force, movement API result, and cancellation reason. Validate successful first use, excess-use rejection, landing reset, cliff-fall use, and every supported map/body mode.
