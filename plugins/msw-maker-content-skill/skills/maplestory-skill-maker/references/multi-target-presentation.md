# Multi-Target Staggered Presentation

How simultaneous multi-target hits are spread out in time so they don't visually overlap. See [../SKILL.md](../SKILL.md) for the Domain Reference Files index. Per-target judgment mechanics: [targeting-judgment.md](targeting-judgment.md).

## Multi-Target Staggered Hit Presentation Rule (required for multi-target attacks)

When hitting multiple targets at once, the hit judgment, damage skin popping, hit effects, hit sounds, and knockback cycles must NOT execute simultaneously on every target (which creates a messy overlap). Instead, they must be staggered sequentially in order of proximity (nearest to furthest).

- **API**: Sort all targets by distance squared from the attacker (`rankedCandidates`).
- **Timing**: For target at rank `i` (index 1 to target count), the stagger delay is `staggerDelay = hitDelay + (i - 1) * staggerInterval` (where `staggerInterval = 0.05` by default).
- Target 1 (nearest) is hit immediately at `hitDelay` (offset = 0s).
- Target 2 is hit at `hitDelay + 0.05s` (offset = 0.05s).
- Target 3 is hit at `hitDelay + 0.10s` (offset = 0.10s).
- In each staggered timer callback, verify the captured target is still valid and alive, apply the real judgment to that single target via the direct `TakeDamage(...)` call, play individual hit effects/sounds (see [damage-presentation.md](damage-presentation.md)), and start the target's knockback pulse cycle (see [knockback-hit-reaction.md](knockback-hit-reaction.md)).
