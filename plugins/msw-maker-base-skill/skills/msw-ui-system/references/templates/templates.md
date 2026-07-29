# MSW UI Style Templates

> **Entry point**: This document is reached from [`../../SKILL.md`](../../SKILL.md). Read `msw-ui-system` first for routing, components, anchors, lifecycle, and builder protocol — then return here when you need style-coherent template bundles.

Style-specific template files for building game UI. **Each style is a coherent bundle**: `.ui` structure templates + matching RUIDs (each style's `ruid-map.md`, e.g. [`style-1-black/ruid-map.md`](style-1-black/ruid-map.md)) + button handler patterns (`Popupbutton.mlua`). Pick a style first, then use its files together for visual consistency.

## Style Selection Guide

Pick based on **UI complexity and interaction pattern**, not game genre.

| Folder | Visual Theme | Pattern | Best For | Key Features |
|--------|--------------|---------|----------|--------------|
| `style-1-black/` | Black | Simple Popups | Games with a few feature popups | Multiple popups, simple open/close buttons |
| `style-2-diary/` | Diary | Minimal HUD | Lightweight or single-screen games | Minimal UI, result screen, drag-drop delete |
| `style-3-wood/` | Wood | Multi-Tab | Games with many menus/features | Menu toggle, tab switching, many popup types |
| `style-4-blue/` | Blue | Transaction Flow | Games with purchase/reward flows | Purchase confirmation, button fold/unfold, result panels |

## File Structure Per Style

| File | style-1 | style-2 | style-3 | style-4 | Role |
|------|:-------:|:-------:|:-------:|:-------:|------|
| `ruid-map.md` | O | O | O | O | RUID lookup by UI role (e.g. [`style-1-black/ruid-map.md`](style-1-black/ruid-map.md)) |
| `structure.md` | O | O | O | O | Entity hierarchy, layout, sizes (compact) (e.g. [`style-1-black/structure.md`](style-1-black/structure.md)) |
| `HUDGroup.ui` | O | O | O | O | Always-visible HUD |
| `DefaultGroup.ui` | O | N/A | O | O | Joystick, Chat |
| `ToastGroup.ui` | O | O | O | O | Toast notifications |
| `ButtonGroup.ui` | O | `Popupbutton.ui` | O | O | Buttons that open popups |
| `PopupGroup.ui` | O | O | O | O | Popup panel collection |
| `Popupbutton.mlua` | O | O | O | O | Button→Popup handler script |
| `TrashBin.ui` | N/A | O | N/A | N/A | Item delete UI |

## Button Handler Patterns

| Pattern | Behavior | Used In |
|---------|----------|---------|
| A: Open/Close | Button opens popup, close button closes it | All styles |
| B: Toggle | Same button opens and closes | Style 3 |
| C: Group Control | Show/hide multiple buttons at once + flip image | Style 4 |

See the `Popupbutton.mlua` in the corresponding style folder for implementation details.

## Common UI Rules

- Base resolution: 1920 x 1080
- .ui file format: JSON (`ContentType: "x-mod/ui"`)
- .mlua scripts: `@Component` + `ButtonClickEvent` handlers
- Popup panels start with `enable: false` → set `Enable = true` on button click
- Entity access: `_EntityService:GetEntityByPath(path)`
- Higher GroupOrder renders on top

## RUID Handling

Template `.ui` files contain `ImageRUID.DataId` values that define the visual style — button sprites, panel backgrounds, icons, etc. These are **platform-shared resources** and can be used directly in any project.

### Infrastructure vs. Style files

Not all `.ui` files in a project define its visual style:

| File | Role | Style-defining? |
|------|------|:---:|
| `DefaultGroup.ui` | Joystick, chat — functional scaffolding | No |
| `ToastGroup.ui` | Toast notification container | No |
| `HUDGroup.ui` | Game HUD (HP, score, minimap, etc.) | **Yes** |
| `ButtonGroup.ui` | Buttons that open popups | **Yes** |
| `PopupGroup.ui` | Popup panels, modals | **Yes** |

**When deciding whether to use template RUIDs:**
- If the project only has `DefaultGroup.ui` + `ToastGroup.ui` → these are infrastructure, not a style. **Use template RUIDs as-is.**
- If the project has custom `HUDGroup`/`ButtonGroup`/`PopupGroup` with intentional visuals → match that existing custom style. Use templates for structure and patterns only.
- `DataId: ""` in templates means intentionally blank — fill via `msw-search` only if the element should be visible.

**RUID source priority (when using a template style):**
1. **The style's `ruid-map.md`** (e.g. [`style-1-black/ruid-map.md`](style-1-black/ruid-map.md)) — first choice. Look up the role (panel background, button, close icon, etc.) and use the listed DataId directly.
2. **`msw-search`** — only when the style's `ruid-map.md` has no suitable RUID for the needed role (e.g. game-specific sprites like a custom character icon).

## Searching Template Files

The `.ui` files are large JSON. Use the helper scripts in `scripts/` or `rg` to find specific entities without reading the full file.

### Helper Scripts

Located in `./scripts/`:

**`ui-structure.cjs`** — Entity hierarchy viewer

```bash
# Show all .ui files in a style (top-level only)
node scripts/ui-structure.cjs --style 1 --depth 0

# Show specific file with full hierarchy
node scripts/ui-structure.cjs --style 1 --file PopupGroup.ui

# Limit hierarchy depth
node scripts/ui-structure.cjs --style 1 --file PopupGroup.ui --depth 2

# Dump full JSON for an entity by exact name
node scripts/ui-structure.cjs --style 1 --entity BasicPopup

# Search entity name across all files (substring match)
node scripts/ui-structure.cjs --style 1 --grep ExitButton
```

**`ruid-lookup.cjs`** — RUID lookup by style and role

```bash
# List available styles
node scripts/ruid-lookup.cjs

# Dump all RUIDs for a style
node scripts/ruid-lookup.cjs --style 1

# Filter by role keyword (button, panel, slot, icon, gauge, etc.)
node scripts/ruid-lookup.cjs --style 1 --role button
```

### ripgrep patterns

For quick one-off searches (from workspace root):

```bash
# Entity by name — use -A 50 to capture full layout + components + RUID
rg '"name": "ExitButton"' -A 50 ./style-1-black/PopupGroup.ui

# Find where a specific RUID is used
rg '6efba31a09bb434f833edaceac5fd12a' ./style-1-black/

# Disabled entities (hidden popups) — -B 3 shows entity name above
rg '"enable": false' -B 3 ./style-1-black/PopupGroup.ui
```

**Entity JSON field order** (what you'll see in `-A 50` output):
```
"name" → "path" → "enable" → "displayOrder" → "origin" → "modelId" → "@components": [
  { "@type": "UITransformComponent", "AlignmentOption", "anchoredPosition", "RectSize", ... },
  { "@type": "SpriteGUIRendererComponent", "ImageRUID": { "DataId": "..." }, ... },
  { "@type": "ButtonComponent", ... }
]
```

## Workflow

The end-to-end UI authoring workflow (anchors, 4-value formula, `refresh_workspace` cycle, lifecycle) lives in [`../../SKILL.md`](../../SKILL.md) and [`../../../msw-general/references/builder-protocol-ui.md`](../../../msw-general/references/builder-protocol-ui.md) §3 (unified call entry point). The template-specific decision steps below feed into that workflow.

### Style-Source Decision (planning-time, BEFORE writing any `.ui`)

| Situation | Action |
|---|---|
| User specified a visual style (color, mood, reference image, "like X") | Follow user's intent for visuals. Use templates for **structure/patterns only**; pick RUIDs per user's intent (may need `msw-search`). |
| Project already has custom UI (`HUDGroup`/`ButtonGroup`/`PopupGroup` with intentional visuals) | Match existing style — keep naming, path, and RUID conventions consistent across new files. |
| Fresh project (only `DefaultGroup.ui` / `ToastGroup.ui`, or no UI yet) AND user gave no visual guidance | **Pick one of the 4 template styles** and use its full bundle (`.ui` + `ruid-map` + `Popupbutton.mlua`). Default behavior — do **not** ask the user "which style?"; pick one and tell them. |

**Rule of thumb**: when style source is unclear, pick a template style and proceed. The user can redirect.

### Reading Template Files

1. **Mention chosen style** — briefly tell the user which style is being used (e.g. "Using `style-3-wood` as reference"). Switch immediately if user prefers a different style.
2. **Read the style's `ruid-map.md` + `structure.md`** (e.g. [`style-1-black/ruid-map.md`](style-1-black/ruid-map.md) + [`style-1-black/structure.md`](style-1-black/structure.md)) — these two files give you everything needed without reading full `.ui` files:
   - `ruid-map.md` — which RUID to use for each UI role (buttons, panels, icons, etc.)
   - `structure.md` — entity hierarchy, alignment, position, size, components
3. **Read `.mlua` handler** — `Popupbutton.mlua` for button handler patterns.
4. **Read `.ui` files only as needed** — only when you need exact JSON to copy/paste.
5. **Apply template RUIDs** — keep visual consistency.
6. **Avoid conflicts** — do not duplicate existing Entity UUIDs, `displayOrder`, or `GroupOrder` values.
