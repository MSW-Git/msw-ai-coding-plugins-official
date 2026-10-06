# Hotkey / Skill Slot Input Layer

**Enforcement:** completion-blocking — static binding evidence. The relevant family harness is added only when behavior changes.

This file is the single authority for key binding, binding storage, and family input routing. [framework.md](framework.md) owns catalog, dispatch, and cooldown ownership around it; animation defaults belong to [../player/casting.md](../player/casting.md) and [../player/preflight.md](../player/preflight.md).

A skill row is inert until `SkillBindingData` maps a key to its family and id. A single shared input router owns the key-input subscription and resolves `SkillBindingData`, then forwards the normalized integer `skillId` to the selected family Adapter. Family Adapters execute already-resolved ids; they do not maintain separate hardcoded key maps.

Treat this router and the `PlayerControllerComponent` subclass as separate owners. Name the router by its input-routing role, such as `PlayerSkillInputRouter`; do not name or implement it as the player controller. It must not override native jump/down-jump actions.

```csv
keyName,familyId,skillId
LeftShift,1,1001
F,2,2002
```

The integer skill IDs above are illustrative and MUST be allocated in a non-conflicting project range. The key mappings are required project defaults: the baseline `normal_attack_skill` uses `LeftShift`, and `teleport_skill` uses `F`. Do not ask for or invent another key unless the user explicitly requests an override. If either key is already bound to another skill, do not silently overwrite it; report and resolve the collision before updating `SkillBindingData`.

During the initial catalog parsing phase, safely parse string key names into `KeyboardKey` internal enum values once using a lookup dictionary, and hold them in memory as a map table structure keyed by the enum. Runtime executors receive the enum key and never hardcode `"LeftShift"`, `"F"`, or their enum equivalents. At runtime, upon receiving `OnKeyDown(event.key)` on the client, look up the raw input key in the binding map, resolve the skill family category constant to determine routing, analyze the family-specific data contract, apply cross-family suppression rules, retrieve the correct target component, and **directly invoke its verified entry point method mapped in the role layout**. Guard unbound or irrelevant key inputs so they return immediately without generating log spam.
