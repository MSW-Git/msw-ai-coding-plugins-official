---
name: msw-ui-system
description: "MSW `.ui` single entry point — design + component API + builder + runtime. Anchor/pivot/RectTransform, UIGroup/CanvasGroup hierarchy, layout recipes (HUD/popup/toast/menu/inventory/scroll-list), full API tables for ButtonComponent/TextGUIRendererComponent/SpriteGUIRendererComponent/ScrollLayoutGroup/GridView/TextInput/Slider/Mask/AvatarGUIRenderer + UI enums (AlignmentType/TextOverflowMode/ImageType/FillAmount), `.mlua` runtime patterns (popup open-close, toast, HP bar, GridView, drag, tab, cooldown, world nametag), UI-client-only caveats (nil on server, no RPC), `.ui`↔`.mlua` UUID auto-binding (write+injectBindings), resolution/safe-area/touch. UIBuilder (msw_ui_builder.cjs): all node types (empty/panel/text/sprite/button/slider/scrollLayout/textInput/group/mask/gridView/avatar/skeleton etc.), component add/replace/patch/remove, 13 anchor presets+stretch, auto-inject .mlua UUID bindings after write."
---

# msw-ui-system

MSW `.ui` single entry point — **design guide + component API + builder invocation + runtime patterns** bundled into one skill.

Role division with existing skills:

| Skill | Responsibility |
|-------|----------------|
| `msw-ui-system` (this skill) | Everything `.ui` — design (which/when/why), component API/enum (what), builder invocation (how to mutate), runtime mlua patterns. **`.ui` mutations must always go through this skill's builder** |
| `references/templates/` | Pre-built style bundles — `.ui` + ruid-map + button handler packages |

---

## 0. Routing

Branch to sub-references based on request keywords.

| Trigger | Reference Document |
|---------|--------------------|
| "anchor/pivot/coordinates/why is the position wrong", "RectTransform", "stretch" | [`references/ui-fundamentals.md`](references/ui-fundamentals.md) §1–§8 |
| "mobile", "safe area", "1920", "MobileOnly", "ActivePlatform", "touch size", "PC reserved zone", "font size by device" | [`references/ui-fundamentals.md`](references/ui-fundamentals.md) §9 |
| "UIGroup", "above popup", "z-order", "displayOrder", "CanvasGroup", "opacity propagation", "Enable vs Visible" | [`references/ui-hierarchy.md`](references/ui-hierarchy.md); for runtime sibling reorder also read [`references/runtime-patterns.md`](references/runtime-patterns.md) §7 |
| "which component", "Sprite vs Text vs Button", "9-slice", "scroll list", "GridView vs ScrollLayoutGroup" | [`references/component-api.md`](references/component-api.md) §"Component Selection Guide" |
| "sprite pivot", "9-slice border", "slice boundary", "set sliced asset metadata", "resource storage properties" | Set asset-side metadata via `msw-mcp` `asset_update_resource_storage_info` directly; for the `.ui` side see [`references/component-api.md`](references/component-api.md) §"SpriteGUIRenderer — ImageType Selection" |
| "make a HUD", "popup placement", "toast", "menu", "inventory grid", "scroll list" | [`references/layout-recipes.md`](references/layout-recipes.md) |
| "connect .mlua after building with .ui builder", "property default UUID", "binding without drag" | [`../msw-general/references/builder-protocol.md`](../msw-general/references/builder-protocol.md) §3.6 Binding Injection (unified entry point) |
| Runtime UI component field read/write, component property name/type (`ButtonComponent.Colors`, `TextGUIRendererComponent.Overflow`, `SpriteGUIRendererComponent.FillAmount`…) | [`references/component-api.md`](references/component-api.md) **required before every `.mlua` access to UI component fields** |
| Enum values (`AlignmentType`, `TextOverflowMode`, `ImageType`, `UIBasicParticleType`…) | [`references/component-api.md`](references/component-api.md) §Enums |
| Runtime mlua patterns (popup open/close, toast fade, HP bar, GridView, drag, tab, cooldown), Runtime UI Caveats (client-only, server-side nil, etc.) | [`references/runtime-patterns.md`](references/runtime-patterns.md) |
| **`.ui` builder invocation methods** (UIBuilder API, anchor presets, write auto-lint, component add/patch/remove) | [`../msw-general/references/builder-protocol.md`](../msw-general/references/builder-protocol.md) §3 UIBuilder (unified entry point — same document as `.map` MapBuilder / `.model` ModelBuilder) |
| "sound", "sfx", "click sound", "hover sound", "button audio", "PlaySound" | [`references/ui-sound.md`](references/ui-sound.md) |

---

## 1. Basic Workflow

```
(1) Clarify intent       Layout sketch (ASCII or verbal) + which group to attach to
(2) Check design guide   Match at least one of ui-fundamentals / ui-hierarchy / component-api §Component Selection Guide
(3) Builder Preflight    Read ../msw-general/references/builder-protocol.md §3 (unified call-protocol entry point)
(4) Match recipe          Select the closest template from layout-recipes.md
(5) Invoke builder        Create/patch via scripts/msw_ui_builder.cjs (protocol: builder-protocol.md §3)
(6) Inject bindings       Auto-inject .mlua property default UUIDs via b.write(path, { bind: {...} }) or b.injectBindings(...) (builder-protocol.md §3.6 Binding Injection)
(7) Self-verify           write() auto-runs scripts/ui_lint.cjs (strict ON by default)
(8) Preview               Visual check via scripts/preview_ui_layout.cjs
(9) Sound pass            For any interactive button, offer click/hover SFX wiring (references/ui-sound.md)
(10) Maker Refresh         Apply to engine
```

## 2. Global Rules

### NEVER
1. **Do not directly edit `.ui` JSON** — `.ui` creation/modification **must** go through `scripts/msw_ui_builder.cjs`. Manual editing breaks UUID·ValueType·`@components` consistency and causes silent drops.
2. **Read existing `.ui` files through the builder too** — Query via `UIBuilder.read(filepath)` / `.find()` / `.listEntities()`. Do not directly grep/parse raw JSON.
   - `.ui` direct `Read` and shell commands such as `cat` / `type` / `Get-Content` / `rg` / `grep` / `sed` / `awk` / `cp` / `mv` are blocked by the registered guard. Use `UIBuilder.read/load/snapshot` for reads and `b.write()` for writes. Deleting an entire `.ui` file is a separate explicit deletion action, not a builder mutation.
3. Set `Position` directly — Use only `anchoredPosition` (Position is engine-managed)
4. Express size via OffsetMin/Max on fixed anchors (AnchorsMin == AnchorsMax) while also using `anchoredPosition` — Do not mix the two modes
5. Builder creates new UUIDs but `.mlua` property defaults are not updated — Binding breaks

### ALWAYS
1. **Builder Protocol Preflight — read [`../msw-general/references/builder-protocol.md`](../msw-general/references/builder-protocol.md) §3 every turn before any `.ui` mutation** (UIBuilder API, write auto-lint, pos / anchor rules, binding injection, coverage gaps). It lives in the same document as `.map` MapBuilder / `.model` ModelBuilder — a unified entry point because the cross-flow is interlocked.
2. Check at least one design guide before invoking the builder (`ui-fundamentals` / `ui-hierarchy` / `component-api` §Component Selection Guide)
3. Match a recipe first; build from scratch only as a last resort
4. For edge placement use the formula: `pos = ±(margin + size/2)`
5. Separate popups and toasts into their **own `.ui` root UIGroup**, standalone show/hide; use `empty()` / `panel()` for inner containers, never nested `group()`
6. Verify text `Alignment` default is `UpperLeft(0)` — 95% of "I centered it but it sticks to the left" issues
7. Button touch target ≥ 88×88 (mobile support)
8. **After creating any interactive button** — proactively suggest wiring click/hover SFX via [`references/ui-sound.md`](references/ui-sound.md) (default UI SFX RUIDs available). Skip only if the user explicitly opts out or the button is purely decorative.
9. **Build the tree nested, not flat.** Controls of one unit (window + title/close, row + chip/value, slot + icon/count) must share a parent via `"Parent/Child"` paths so they move / fade / toggle / bind as a block. Create each parent before its children; missing parents fail lint (`L025` ERROR).
10. **Do not stack root-level text over a sibling box.** `ui_lint` reports this as `L030` WARN. Nest the text under the box, use `button()` for clickable labeled boxes, or put a direct label on `panel()` / `sprite()` via their `text` options.

---

## 3. Sub-documents

- [`references/ui-fundamentals.md`](references/ui-fundamentals.md) — Coordinate system, RectTransform 3 elements, anchor mode determination (§1–§8) + Resolution·safe area·PC reserved zones·touch targets·font sizes·platform separation (§9)
- [`references/ui-hierarchy.md`](references/ui-hierarchy.md) — UIGroup / displayOrder / CanvasGroup / Enable vs Visible
- [`references/component-api.md`](references/component-api.md) — §"Component Selection Guide" (which/when/why) + full component property/method/event tables (what) + all UI-related enum values (§Enums)
- [`references/layout-recipes.md`](references/layout-recipes.md) — Layout template collection
- [`references/runtime-patterns.md`](references/runtime-patterns.md) — `.mlua` runtime patterns (popup/toast/HP/grid/drag…) + Runtime UI Caveats
- [`references/ui-sound.md`](references/ui-sound.md) — UI sound integration (`_SoundService:PlaySound`, click/hover hook, default UI SFX RUIDs)
- [`../msw-general/references/builder-protocol.md`](../msw-general/references/builder-protocol.md) §3 — **`.ui` CJS builder call protocol (unified entry point)** — same document as `.map` MapBuilder / `.model` ModelBuilder. panel / text / sprite / button / slider / scroll / script / group / mask / grid / avatar / touchReceive / skeleton / areaParticle / basicParticle, component CRUD, anchor presets, write auto-lint, and `.mlua` property UUID auto-binding all live in §3 + §3.6.
- [`references/templates/templates.md`](references/templates/templates.md) — Pre-built style bundle index (`style-N-*` `.ui`, [`ruid-map.md`](references/templates/style-1-black/ruid-map.md), `Popupbutton.mlua`)

## 4. Scripts

- `scripts/msw_ui_builder.cjs` — `.ui` builder core (UIBuilder class). Read [`../msw-general/references/builder-protocol.md`](../msw-general/references/builder-protocol.md) §3 (unified entry point) before use.
- `scripts/preview_ui_layout.cjs` — `.ui` layout visual check + touch target warnings
- `scripts/ui_lint.cjs` — `.ui` file self-verification (auto-called by `write()`)
- `scripts/ui_recipe.cjs` — Recipe-based scaffolding

---

## Out of Scope

- `.map` / `.model` / `.tileset` builders — Outside this skill's scope
- `.ui` JSON schema (raw field shapes, `@type`/`@components` wrapping, AlignmentOption 0–15 mapping, etc.) — Handled internally by the builder. Users/AI do not need to know directly
- Accessibility patterns (alt text, screen-reader hints, focus order) — Not covered
- Error-state UI patterns (disabled-button styling beyond `Transition.Disabled`, validation messages, loading spinners) — Not covered; design ad-hoc per project
- Automated UI testing / layout assertions beyond `ui_lint.cjs` and `preview_ui_layout.cjs` — Not provided
- Custom shader materials (`MaterialId`) — Field is exposed but authoring shaders is outside this skill's scope
