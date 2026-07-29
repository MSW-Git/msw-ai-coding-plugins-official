# Movement Family Contract

This document owns behavior shared by double jump and teleport. Type-specific landing and force rules stay in their leaf documents.

## Ownership

Movement uses a dedicated Registry and player movement Adapter. It does not call attack targeting, Defender, damage-skin, hit-reaction, or death contracts.

The Adapter owns local input gates, local cooldown, movement execution, effects, sounds, and air-jump charges. The server Registry validates sender/state/map/cooldown and records authoritative usage. The attack Adapter retains ownership of active attack casts.

## Client-first flow

For the current project movement topology:

1. The local owner resolves `skillId` through shared bindings.
2. The movement Adapter checks state, map, cooldown, and attack interaction policy.
3. It loads the normalized row and resolves direction/force/destination.
4. It executes local movement through the verified movement/body API.
5. Only after success, it records local cooldown, plays guarded presentation, and sends `RequestUseMovementSkill(skillId)`.
6. The server validates sender, row, state, map, and cooldown and records usage. It does not relocate the player a second time.
7. Native movement synchronization distributes the final movement.

Send only `skillId` unless the project contract is explicitly redesigned. Do not add destination payloads, prediction IDs, result RPCs, rollback, or server relocation to this topology.

## Shared gates

Keep these policies explicit per row or type:

- allowed map/body modes;
- allowed while attacking, hit, dead, or climbing;
- cooldown;
- local-player ownership;
- required movement capability.

Failed or cancelled movement consumes no charge, cooldown, effect, sound, or server request.

## Casting and animation

Movement may overlap an attack only when its row allows it. Movement cleanup never clears attack cast IDs, animation subscriptions, or attack-owned control state.

New movement rows use `animationKey = ""`, meaning no animation. A non-empty action is optional and verified. Never use the attack family fallback for movement.

## Resources

Verify effect and sound RUIDs. Empty optional hooks are guarded no-ops when the loader accepts them. Trigger success presentation only after movement succeeds.

## Verification

Every movement change uses [../verification/movement-verification-harness.md](../verification/movement-verification-harness.md). Add player-control verification only when the change affects casting, player animation, or shared control gates.
