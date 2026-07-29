# Skill Hotbar UI — Default Deliverable

Every skill created or modified through `maplestory-skill-maker` includes a visible hotbar entry by default. Do not wait for a separate UI request and do not ask whether the user wants the UI. Skip it only when the user explicitly opts out.

## Contents

- [1. Delivery Contract](#1-delivery-contract)
- [2. Integration Shape](#2-integration-shape)
- [3. Canonical Project Style](#3-canonical-project-style)
- [4. Maple-Style Cooldown Presentation](#4-maple-style-cooldown-presentation)
- [5. Icon Resolution Policy](#5-icon-resolution-policy)
- [6. Verification](#6-verification)
- [7. Reference Files](#7-reference-files)

## 1. Delivery Contract

For every attack or movement skill task:

1. Discover the existing shared skill catalog, binding list, cooldown owner, hotbar `.ui`, and hotbar controller before creating files.
2. Reuse and extend the existing hotbar. Never create a parallel hotbar when one already fills this role.
3. Add or update the bound-key label, skill icon, display name, and cooldown source for the concrete skill.
4. Create the canonical hotbar UI and controller when the project has no existing implementation.
5. Verify UI structure, binding UUIDs, name formatting, icon availability, and cooldown progress together with the skill implementation.

The UI is part of the skill's definition of done, not an optional polish pass.

## 2. Integration Shape

Prefer using a single shared UI controller instead of writing per-skill UI scripts:

- The shared catalog provides an ordered binding list containing the family, integer `skillId`, and key name.
- The controller resolves data and remaining cooldown through the owned family.
- The controller sets the icon and name only once, and updates only the fill amount and remaining time text every frame.
- When adding a concrete skill, mutate the data/binding entries; do not add slot-specific methods or new UI scripts.

Canonical project files (if they exist):

- `ui/SkillHotbarGroup.ui`
- The discovered hotbar runtime owner
- The discovered skill catalog owner
- Family adapters exposing local remaining cooldown

Discover the actual project first. These names describe the current implementation state, not a permission to duplicate an equivalent existing system.

## 3. Canonical Project Style

Use this default bright Maple-style hotbar recipe unless the target project already has an established UI system:

- UI group: `SkillHotbarGroup`, screen-space, bottom-center.
- Default capacity: 8 bound-skill slots. If the binding list grows past 8, extend the same recipe instead of silently dropping bindings.
- Hotbar frame: `1180 x 184`, bottom-center position `[0, 20]` on the 1920 x 1080 authoring canvas.
- Slot frame: `130 x 154`, 8 px visual gap, centered as one row.
- Skill icon: `104 x 104` near the top of the slot.
- Key badge: `52 x 31`, top-left over the icon.
- Skill-name box: `126 x 30`, centered at the bottom.
- Theme: `simplefantasy` sprite-backed frame recipes through `msw-ui-design-tokens`.
- Text color: opaque black for key, skill name, and cooldown text.
- Key label: compact engine-key aliases such as `SHF`, `ALT`, and `SPC`.
- Display name: compact UpperCamelCase, for example `energy_bolt` -> `EnergyBolt` and `double jump` -> `DoubleJump`.
- Skill name must remain one line: centered, `BestFit = true`, `Overflow = Truncate`, width/height constraints matching the name box, and a token-derived readable font range.
- Only slots with active bindings are visible at runtime.

All `.ui` reads and writes must go through `UIBuilder` from `msw-ui-system`. Do not edit raw `.ui` JSON directly. Apply visual values through `msw-ui-design-tokens`, then use UIBuilder binding injection so that `.mlua` component properties receive the generated entity UUIDs.

## 4. Maple-Style Cooldown Presentation

Each slot uses two identical icon copies and a center text label:

1. `GrayIcon` is the fully-visible cooldown base, tinted muted gray/dark.
2. `ReadyFill` is the original full-color icon layered on top.
3. Configure `ReadyFill` as `ImageType.Filled`, vertical fill, top origin.
4. During cooldown, set `FillAmount = 1 - clamp(remaining / duration, 0, 1)` so the original icon fills top-to-bottom over the gray base.
5. While `remaining > 0`, display `ceil(remaining)` in opaque black at the center of the icon; otherwise, clear the text.
6. In the ready state, `ReadyFill.FillAmount = 1`, and the center cooldown text is empty.

The UI reads the remaining time from the owning family of the cooldown. Attack cooldowns are maintained in the attack Registry/Adapter path, and movement cooldowns are maintained in the movement Registry/Adapter path. Do not introduce a separate, second cooldown clock inside the UI.

## 5. Icon Resolution Policy

Icon resolution happens at authoring time, never at game runtime.

Use this priority order for every concrete skill:

1. A dedicated icon RUID already stored in the authoritative skill data.
2. An existing skill presentation resource that is legible as a square icon, such as its projectile or distinctive cast effect.
3. Resource search through the `msw-search` skill, which invokes the validated `msw-mcp` resource pipeline. Do not call `asset_search_resources` directly.

When search is needed:

1. Load `msw-search` and read its required resource search/detail references.
2. Search sprites first using the concrete skill name and semantic variants such as `blue magic projectile`, `teleport lightning`, or terms inferred from element, motion, weapon, and skill type.
3. If the exact name has no strong result, search for the visual concept the skill communicates. Choose the closest readable, centered, high-contrast icon rather than an unrelated exact-name result.
4. Inspect resource details when the result type or thumbnail behavior is uncertain.
5. Apply the correct RUID/thumbnail convention from `msw-search` and the renderer-RUID rules.
6. Persist the selected RUID into the authoritative catalog/DataSet so subsequent sessions are deterministic. Never run MCP searches from `OnBeginPlay`, `OnUpdate`, or a cast handler.

If `msw-mcp` is unavailable in the current environment, reuse the closest valid presentation RUID as a temporary icon when possible and explicitly report the unresolved dedicated-icon search. Never silently leave a bound slot blank.

If the current skill schema has no dedicated `iconRuid` field, either reuse a stable existing presentation field or extend the DataSet/catalog/normalization/runtime shape atomically before storing a dedicated icon. Do not add a field in only one layer.

## 6. Verification

The skill task is not complete until all applicable checks pass:

1. UIBuilder write with strict lint: 0 errors and 0 warnings.
2. Layout preview confirms the enlarged row remains bottom-centered and slots do not overlap.
3. Every active binding shows the expected compact key and UpperCamelCase name on one line.
4. Every active binding has a non-empty icon RUID or an explicitly reported MCP-blocked temporary fallback.
5. Cooldown start shows the gray base and center seconds; the original icon fills top-to-bottom; ready state restores the full icon and clears the number.
6. Run the normal Maker `refresh -> build logs -> play -> runtime logs -> stop` loop when Maker MCP is available.

## 7. Reference Files

For cooldown icons, see [../../assets/cooldown_reference.png](../../assets/cooldown_reference.png).