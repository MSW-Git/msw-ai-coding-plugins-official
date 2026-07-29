# Teleport Skill

## Scope

Read [common.md](common.md) first. This file owns only `teleport_skill` direction and landing resolution.

## Required decisions

Confirm:

- supported map/body modes;
- teleport distance;
- allowed directions and directionless-input policy;
- landing search distance, footprint offset, surface offset, and landing clearance;
- attack/hit/dead/climbing interaction flags;
- optional effect/sound resources.

Do not copy numeric distances, clearances, cooldowns, or RUIDs from examples.

## Direction and success

Resolve exactly one supported direction from current input. Reject no direction, opposing keys, or diagonals unless a new type explicitly defines them.

Apply relocation through the verified movement API such as `MovementComponent:SetWorldPosition`; do not write a physical body's Transform directly. A resolved fallback may count as success even when it returns the current coordinate, but this policy must be explicit and verified for the project.

Cooldown and success presentation occur only after a valid destination is resolved and relocation succeeds.

## MapleTile horizontal resolver

Keep horizontal and vertical resolvers separate.

For horizontal teleport:

1. Compute the full-distance candidate.
2. Collect vertical wall candidates along the path and calculate their signed distances; do not trust raycast result order.
3. Allow intermediate-wall pass-through when that is the selected project feel.
4. Probe downward at the destination and use the nearest supported horizontal foothold when present.
5. If unsupported, evaluate wall-near-side landing candidates and select the furthest supported candidate along travel.
6. If none exists, traverse the connected current-platform foothold chain to its terminal edge and evaluate that fallback.
7. Cancel only when all authorized landing candidates fail.

`GetCurrentFoothold()` represents one segment, not necessarily the full platform. Verify neighbor/chain APIs before implementing terminal-edge traversal. Keep path walls and landing floors in typed collections.

Landing clearance is configuration, not a universal hardcoded `0.03`.

## MapleTile vertical resolver

Cast along the vertical trajectory, retain horizontal footholds within distance, calculate signed travel distance, and select the furthest valid foothold in the requested direction. Snap through the verified surface-Y calculation and configured surface offset.

Do not reuse the horizontal downward-destination probe for upward teleport. Cancel when no foothold intersects the vertical path.

## Other map/body modes

RectTile or SideView modes may use direct relocation because they do not expose MapleTile footholds, but support must be proven against the actual body and movement APIs. Do not silently reuse MapleTile sensors or claim support from static assumptions.

## Evidence

Log skill ID, direction, map/body mode, origin, full candidate, selected resolver branch, final destination, movement result, and cancellation reason. Validate four directions, invalid input, supported destinations, walls, gaps, cliff edges, vertical platforms, repeated boundary casts, cooldown rejection, cancellation with no side effects, and remote observation through native synchronization.
