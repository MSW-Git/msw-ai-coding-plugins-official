# Monster Attack Presentation — MUST Contract

Read this reference when a monster can damage a player or when player-hit behavior is changed. Implement by capability and observable behavior; the current filenames and method names are examples only.

## Capability split

Inspect `StateAnimationComponent.ActionSheet` for a non-empty lowercase `"attack"` action before choosing the attack mode.

- **No attack action:** preserve the legacy contact-damage path. Derive a contact box from the current sprite clip's first-frame size and pivot, then repeatedly call the monster's existing player-attack capability while alive **and not under the death/exclusion capability** (see the Death interaction rule below). Do not add an ATTACK state, windup, or ranged detection to this branch.
- **Attack action exists:** register a valid uppercase `ATTACK` state, use the monster's authored attack range/offset instead of the contact box, and start an attack only when a living player overlaps that range.

The lowercase ActionSheet key (`"attack"`) and uppercase State name (`"ATTACK"`) are different identifiers. Never pass a state-name string as an unsupported argument to `ChangeState`; call `StateComponent:ChangeState("ATTACK")` with the API's actual signature.

## Portable defaults

- Detection poll interval: `0.03s`
- Attack range: `Vector2(6, 2)` world units
- Attack offset: `Vector2(0, 0)` in monster local space
- Hit-frame delay from ATTACK start: `0.5s`
- Reattack delay after the active attack window: `1.0s`
- Fallback attack-animation duration while the clip is unresolved: `0.5s`

Treat these as required defaults unless the user explicitly tunes that monster.

## Range and coordinate contract

- Build the box in world units from `TransformComponent.WorldPosition`, `Scale`, and `ZRotation`.
- Scale range by absolute transform scale. Rotate and scale the local offset into world space.
- For attack-animation monsters only, mirror local offset X when the monster sprite is flipped.
- Detection must include the player's configured hit box when available, not only the player's origin. Transform its offset and half-size by player scale before the overlap test.
- Recompute the same shape again at the hit frame; detection grants permission to start an attack, not a guaranteed future hit.

## ATTACK sequence — ordering is fixed

1. Detect a living player in the current range only while the monster is alive, not already attacking, past `NextAttackAllowedTime`, and in `IDLE` or `MOVE`.
2. Acquire the attack-owned movement lock: stop Movement and cache/disable the current Wander/Chase enable values.
3. Call `ChangeState("ATTACK")`. If it fails, immediately release the movement lock and do not arm attack timers.

4. Mark the attack active and set `NextAttackAllowedTime = now + max(realAttackAnimationDuration, attackHitDelay) + reattackDelay`.
5. Schedule real player judgment at `attackHitDelay`. This is **not** a player-skill cast-time snapshot: recalculate the attack shape from the monster's current transform at the hit frame, then attack players currently overlapping it.
6. End ATTACK after the cached real clip duration. Return to `IDLE` only if the current state is still `ATTACK`, then release only the attack-owned movement lock.

Preload the attack clip once, sum `Frame.Delay`, divide by positive `SpriteRendererComponent.PlayRate`, and cache the real duration. Do not guess the normal-path duration from the `0.5s` hit delay.

## Lock ownership and hit interaction

- ATTACK owns its movement lock independently from the monster's player-hit reaction lock.
- A player hit still applies physical knockback during ATTACK, but MUST NOT replace ATTACK with HIT.
- Ending a hit pulse while ATTACK remains active MUST NOT enable AI. Ending ATTACK while a hit pulse remains active MUST NOT enable AI. The last active owner releases movement.
- When releasing ATTACK normally, restore the exact Wander/Chase enable values cached at attack start rather than forcing both true.
- Death makes attack detection and pending hit/animation callbacks no-op through the death/exclusion capability activated at lethal judgment (see the Death interaction rule below), not `IsDead`; that property is a transition input only for `ConditionIsDead` models; lifecycle cleanup clears their timer handles. It never releases movement into a live AI state.

## Death interaction — no player damage during death presentation (MUST)

A monster that has taken a lethal hit is effectively dead the instant lethal judgment lands, even though its death presentation (damage-skin hold → die animation → disappearance) still plays for a while. It **MUST NOT** damage a player at any point during that window.

- Disable the monster's player-damage capability immediately at lethal judgment — the same step-0 gameplay exclusion in [death.md](death.md) — and keep it disabled for the **entire** death presentation until the entity disappears/respawns.
- This applies to **both** capability branches: the legacy contact-damage loop and the range-detected ATTACK hit-frame judgment. A scheduled hit-frame callback and the repeating contact loop MUST both re-check the exclusion capability and no-op.
- **Gate on the immediate exclusion capability, never on `IsDead`.** `IsDead` is valid only as the final transition input for a model proven to use `ConditionIsDead`; it may remain unset throughout the Damage-Skin Overkill Hold, and models without that condition do not use it for transition. A contact loop gated on `IsDead` or a bare "while alive" check can keep dealing damage to a player who touches the monster mid-hold. That is the exact defect to eliminate: use the exclusion capability activated at step 0.
- On `Respawn()`, re-enable the player-damage capability together with movement/AI.
- Prove with harness scenario `D4` in [../verification/monster-visual-harness.md](../verification/monster-visual-harness.md): a player contacting the monster throughout the death hold and die animation takes zero damage.

## Required acceptance scenarios

| Scenario | Required result |
|---|---|
| Monster has no `attack` action | Existing sprite-sized contact damage remains active; no ATTACK animation is attempted. |
| Player enters authored range | ATTACK starts once, movement stops, and no damage occurs before `0.5s`. |
| Player leaves before hit frame | ATTACK animation continues, but the recomputed hit-frame overlap deals no damage. |
| Player remains at hit frame | Damage occurs once at the hit frame, not at detection time. |
| Monster is hit while attacking | Physical knockback occurs; ATTACK animation remains visible instead of HIT. |
| Attack finishes | State returns to IDLE only if still ATTACK; cached movement owners restore; next attack cannot begin until the `1.0s` reattack delay has elapsed. |
| Monster is lethally hit | Player-damage (contact and ATTACK hit-frame) stops immediately at lethal judgment and stays off through the entire death presentation; a player contacting the dying monster takes no damage. |

Do not report this behavior complete from code inspection alone. Verify the applicable scenarios in Maker; if runtime tools are unavailable, report implementation complete but runtime verification blocked.
