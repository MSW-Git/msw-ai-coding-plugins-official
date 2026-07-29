# Multi-Target Staggered Presentation

How simultaneous multi-target hits are spread out in time so they don't visually overlap. See [../../SKILL.md](../../SKILL.md) for the Domain Reference Files index. Per-target judgment mechanics: [targeting.md](targeting.md).

## Multi-Target Staggered Hit Presentation Rule (required for multi-target attacks)

When hitting multiple targets at once, damage skin popping, hit effects, hit sounds, and knockback cycles must NOT execute simultaneously on every target (which creates a messy overlap). Instead, they must be staggered sequentially in order of proximity (nearest to furthest).

- **API**: Sort all targets by distance squared from the attacker (`rankedCandidates`).
- **Timing**: judgment for every accepted target occurs immediately at cast time. For presentation rank `i` (1-based), use `targetPresentationDelay = hitDelay + (i - 1) * staggerInterval`. Name the variable so it cannot be mistaken for a judgment delay. The template fallback for `staggerInterval` is `0.05s`.
- Target 1 (nearest) is hit immediately at `hitDelay` (offset = 0s).
- Target 2 is hit at `hitDelay + 0.05s` (offset = 0.05s).
- Target 3 is hit at `hitDelay + 0.10s` (offset = 0.10s).
- In each staggered timer callback, verify the captured target is still valid, play individual hit effects/sounds (see [damage-presentation.md](damage-presentation.md)), and start the target's knockback pulse cycle (see [hit-reaction.md](hit-reaction.md)).
