# Builder Protocol — §3 UIBuilder (`.ui`)

Per-builder file of the unified Builder Protocol. **[builder-protocol.md](builder-protocol.md) (core) must be in context alongside this file** — routing, the common workflow, the cross-builder chaining contract, §0 pre-flight, §4 cross-builder flow, and the §5 checklist live in the core and are not repeated here. Mutating another file type in the same turn requires that type's per-builder file too.

## Method index — what `UIBuilder` actually exposes

Alpha-sorted **camelCase** method names. **camelCase is canonical** — if a name does not appear here, do not call it. Signatures live in §3.5 below. Internal helpers (prefixed with `_`) are omitted.

**`UIBuilder`** — instance: `addComponent` · `areaParticle` · `avatar` · `basicParticle` · `build` · `button` · `chat` · `empty` · `find` · `getComponent` · `getId` · `gridView` · `group` · `hasComponent` · `injectBindings` · `joystick` · `line` · `listEntities` · `mask` · `panel` · `patch` · `patchComponent` · `polygon` · `remove` · `removeComponent` · `rename` · `script` · `scrollLayout` · `setComponentEnabled` · `skeleton` · `softMask` · `sprite` · `spriteParticle` · `text` · `textInput` · `touchReceive` · `upsertComponent` · `write`. Static: `UIBuilder.load` · `UIBuilder.read` · `UIBuilder.snapshot`.

## §3 UIBuilder — `.ui`

`.ui` layouts are mutated only through builder calls — never edit JSON directly. **This protocol alone is not enough** — UI calls only make sense on top of the design context (anchor/pivot, UIGroup hierarchy, component selection). Read the `msw-ui-system` design references listed in [builder-protocol.md](builder-protocol.md) §0 Pre-flight first.

### §3.1 Basic Workflow

1. Determine the target `.ui` path and the scope of entities / components to modify.
2. If the file already exists, load it with `UIBuilder.load()` (alias of `UIBuilder.read()`).
3. For one-off modifications, call directly; for repeated / high-risk modifications, separate into a `.builder-work/` temporary script.
4. Reopen the resulting `.ui` to verify hierarchy and rect / anchor.
5. If needed, run the preview script to check placement and touch-guide warnings.

### §3.2 Call Protocol

- Do not read the `.cjs` internal implementation every time. Call in the fixed order below.
- Basic order: `UIBuilder.read/load()` → `find/snapshot()` → `patch / entity / component API` → `write()`.
- Internal script inspection is limited to one-time, minimal scope only in exceptional situations (errors, unclear API).

### §3.3 `write()` Auto-Lint (Default ON)

`write(filepath)` automatically runs the sibling `msw-ui-system/scripts/ui_lint.cjs` immediately after saving. Default behavior:

- One or more errors → **build failure** via `RuntimeError` (the file remains on disk; the caller must observe the failure).
- Warnings only → one-line summary, details hidden.
- Nothing found → `✓ ui_lint: clean`.

`write(filepath)` overwrites the target `.ui` path. Do not delete and recreate `.ui` files — load (or construct) the intended state, then write once.

**Deleting a whole file** (distinct from mutating it): no builder exposes a delete-file API, and the registered guard blocks shell `rm` / `del` / `Remove-Item` on `.ui` / `.model`. To intentionally remove a file, use a cross-platform node unlink — `node -e "require('fs').unlinkSync('ui/<File>.ui')"` (or the `.model` path) — then `refresh` and confirm it dropped from the Glob index. The guard permits this because it is a `node` call, not a shell content-tool, and it does not scan inside `node -e` code.

Flags:

| Argument | Default | Meaning |
|---|---|---|
| `lint` | `True` | Setting to `False` skips lint entirely. Use only for special paths like one-off dumps. |
| `strict` | `True` | If `False`, errors are printed but proceed without exception. |
| `lint_verbose` | `False` | If `True`, prints full text of all warnings / errors. |

```javascript
b.write("ui/PopupGroup.ui");                                   // default: strict + summary
b.write("ui/PopupGroup.ui", { lint_verbose: true });            // verbose warnings
b.write("ui/_scratch.ui", { lint: false });                     // skip lint
```

Applied rule IDs (`L001`–`L017`, `L023`–`L031`) are implemented as `ruleLNNN` functions in `msw-ui-system/scripts/ui_lint.cjs`. Hierarchy-focused guards:

- **`L025` (ERROR)** — an entity path implies an intermediate parent that does not exist in the file.
- **`L029` (ERROR)** — `UIGroupComponent` exists below the root group.
- **`L030` (WARN)** — a root-level text entity overlaps a sibling sprite/button box instead of being nested under it or merged onto it.
- **`L031` (WARN)** — `ScrollLayoutGroupComponent` layout / scrollbar direction enum values are outside their valid ranges.

### §3.4 pos / anchor Rules — Builder Auto-Pivot

Canvas 1920×1080, center origin `(0, 0)`. X: ±960, Y: ±540. All values are in **UI pixels**. For the coordinate model, 16 anchor presets (`top-left`–`stretch`), and the basic `pos = ±(margin + size/2)` formula, see [`ui-fundamentals.md`](../../msw-ui-system/references/ui-fundamentals.md) §1–§6 — only **builder-specific behavior** is covered here.

When the builder is called without a `pivot` argument, it automatically assigns a **pivot identical to the anchor point** (`middle-left` → (0, 0.5), `top-right` → (1, 1), `stretch*` → (0.5, 0.5), etc.). With edge anchors, supplying `pos = (margin, ...)` makes the element's **corresponding edge stick exactly at the margin position**:

```javascript
// auto pivot (recommended)
b.panel("Left", { anchor: "middle-left", pos: [20, 0], rect_size: [260, 80] });
// → pivot=(0, 0.5), rect left edge = x+20

// explicit pivot=(0.5, 0.5) — center-based offset (ui-fundamentals default mode)
b.panel("Left", {
  anchor: "middle-left",
  pos: [20, 0],
  rect_size: [260, 80],
  pivot: [0.5, 0.5],
});
// → rect left edge = x-110, outside parent boundary
```

**Two mode formulas**:
- Auto pivot (builder default): `pos = (±margin, ±margin)` — no need to add half the size.
- Explicit `pivot=(0.5, 0.5)`: `pos = ±(margin + size/2)` — the general formula from ui-fundamentals §4.

`ui_lint`'s `L005` rule detects edge-overflow patterns where "pos absolute value < size/2".

> **Breaking note**: among `.ui` files generated with older builder versions that appeared to use edge anchor + center pivot, restore intentionally center-based layouts by explicitly specifying `pivot=(0.5, 0.5)`.

All public APIs (`panel / text / sprite / button / script / slider / scrollLayout / textInput`, etc.) and `patch()` accept `pivot=(x, y)`. `patch()` preserves the existing `Pivot` value when not explicitly specified.

### §3.5 API Reference

`identifier` accepts three forms — all point to the same entity:

- Absolute path — `"/ui/<group>/Panel/Text"` (paths to other groups raise `ValueError`).
- Group-name prefix — `"<group>"`, `"<group>/Panel/Text"`.
- Relative name — `"Panel/Text"` (from direct children of the root).

To refer to the root itself, use any of `"<group>"`, `"/ui/<group>"`, or `"/"`. An empty string raises `ValueError`.

#### Hierarchy by Path

Builder creation methods do not take a separate `parent` argument. The parent is encoded in the `name` path:

```javascript
b.panel("Window", { rect_size: [700, 500] });                 // /ui/<group>/Window
b.sprite("Window/Bg", { anchor: "stretch" });                 // child of Window
b.button("Window/Card_SA", "A", { rect_size: [96, 132] });     // child of Window
```

Names without `/` are root-level children of the UI group. Passing `{ parent: "Window" }` or `{ parent: "/" }` to `empty()` / `panel()` / `text()` / `sprite()` / `button()` / other creator methods now throws. Use `"Window/Child"` path notation for nested children, or `"Child"` for root-level children. All missing intermediate parents must be created explicitly before adding children — adding a nested child whose parent entity does not yet exist now **throws** (and `ui_lint` rule `L025` flags any orphaned entity that reaches a file). An orphan cannot be mounted as a proper UI container on import, so create the parent `empty()` or `panel()` first.

Build related controls as a tree, not root-level coordinate overlays. A window, row, slot, tab, chip, or card should be a parent entity with its visual parts below it so movement / fade / enable / binding work as one unit. `ui_lint` rule `L030` warns when a root-level text entity overlaps a sibling sprite/button box. Fix by nesting the text under the box (`"Chip/Label"`), using `button()` for clickable labeled boxes, or using `panel()` / `sprite()` `text` options when the label belongs directly on the box entity.

Binding injection follows the same path notation. When a property points at `"Window/TitleText"`, pass that full path to `injectBindings`; a short leaf name such as `"TitleText"` is ambiguous and fails lookup.

#### Create / Load

```javascript
new UIBuilder(groupName, displayOrder = 1, defaultShow = true, defaultRuid = DEFAULT_SPRITE_RUID);
UIBuilder.load(filepath)  |  UIBuilder.read(filepath);
UIBuilder.snapshot(filepath);                              // returns compact entity view only
```

#### Entity Lookup

```javascript
b.find(identifier);                         // raw entity dict or null
b.getId(identifier);                       // UUID string or null (lookup by path)
b.lastId();                                 // UUID of entity targeted by the most recent creator call (new path → fresh UUID, existing path → existing UUID via upsert); not touched by update/remove
b.hasComponent(identifier, comp_type);
b.getComponent(identifier, comp_type);     // {"@type": ..., ...} or null
b.listEntities();                          // silent — returns array (name/path/depth/kind/pos/size/enable)
b.printEntities();                         // listEntities() + indented tree log to console
```

`find()` return dict — `@components` is one level deeper, so direct access raises KeyError:

```
{
  "id":             str,
  "path":           str,
  "componentNames": str,
  "jsonString": {
      "name", "path", "enable", "visible", "displayOrder", ...,
      "@components": [ {"@type": "MOD.Core.UITransformComponent", ...}, ... ],
      "@version": 1,
  },
}
```

When you only need component data, use `b.getComponent(path, comp_type)` instead of unwrapping the raw structure:

```javascript
const btn = b.getComponent("Panel/BtnOk", "MOD.Core.ButtonComponent");
if (btn?.Enable) { /* use */ }
```

#### Entity Creation (upsert — components replaced, existing root metadata preserved)

> When the same path already exists, the creator preserves the existing root metadata (`name`, `nameEditable`, `visible`, `localize`, `revision`, `origin`) and re-applies only what the caller passed. `@components` is replaced with the new value. For `UITransformComponent`, a re-call with no transform option (`anchor`, `pos`, `rect_size`, `pivot`) preserves the existing transform, and a re-call with partial transform options merges omitted transform fields from the existing transform. Example: `sprite("Bg", { rect_size: [1200, 900] })` keeps the existing anchor / position / pivot and changes only the size. For stretch anchors, omitted stretch-axis offsets are preserved instead of being collapsed to the new `pos`. To change `name` / `enable` / `visible`, call `patch()` rather than re-invoking the creator, or pass the field explicitly in the creator options.


Tuple-shaped options (`pos`, `rect_size`, `cell_size`, `padding`, `spacing`, `softness`, ...) accept `[a, b]` / `[a, b, c, d]` (preferred) or `{ x, y, z, w }`. Both normalize to the same value.

Do not use Unicode emoji as icons inside text-shaped options (`text`, `placeholder`, button labels, panel/sprite embedded `text`) on `TextGUIRendererComponent` — glyph availability depends on the active UI font/fallback setup and can render as missing/broken glyphs. For an inline icon, use a configured `TextSpriteSet` rich-text sprite; for a standalone icon, use `SpriteGUIRendererComponent`/image assets.

> **Default sprite skin (applies to every SpriteGUIRendererComponent the builder mints).** `panel` / `sprite` / `button` / `slider` / `textInput` / `joystick` all default their background sprite to `image_ruid = "2860136c06ab075439721c027de365af"` (`DEFAULT_SPRITE_RUID`), `sprite_type = 1` (Sliced 9-slice), and `color = RGBA(26, 26, 26, 60)` (dark translucent).
>
> **This dark gray is only a DEFAULT, never a constraint.** It fills in what the caller leaves unspecified — it does **not** mean every panel must be gray. Give any individual element its own color whenever the design calls for it: pass `color` (for `panel`/`sprite`) or `bg_color` (for `button`/`slider`/`textInput`) as a hex string (`"#cc3344"`) or `{ r, g, b, a }`, and adjust `alpha` / `sprite_type` / `image_ruid` the same way. `color` for `button`/`slider`/`textInput` is the **text** color (defaulting to `#FFFFFF` so labels stay readable on the dark fill). Transparent helpers (`text` / `mask` / `softMask` / `chat`) keep their own invisible sprite (`alpha = 0`) and are unaffected.
>
> ```javascript
> b.panel("InfoBox");                              // default dark-gray translucent
> b.panel("Danger", { color: "#cc3344" });          // red panel
> b.panel("Hero",   { color: { r: 0.1, g: 0.3, b: 0.8, a: 0.9 } }); // custom blue, mostly opaque
> b.panel("Solid",  { alpha: 1.0 });                // same gray, fully opaque
> ```

```javascript
b.panel(name, { anchor: "middle-center", pos: [0, 0], rect_size: [1920, 1080], color: null, alpha: null, sprite_type: 1, fill_method: 0, raycast: false, image_ruid: null, enable: true, pivot: null });
b.empty(name, { anchor: "middle-center", pos: [0, 0], rect_size: [100, 100], enable: true, pivot: null });
b.text(name, text, {
  size: 24, color: null, bold: false,
  alignment: 4,      // 0=UpperLeft .. 4=MiddleCenter(default) .. 8=LowerRight
  overflow: 0,       // 0=Overflow, 1=Truncate, 2=Ellipsis
  bestfit: false, min_size: 10, max_size: null,
  outline: false, outline_color: null, outline_width: null,
  anchor: "middle-center", pos: [0, 0], rect_size: null,
  enable: true, pivot: null,
});
b.sprite(name, { anchor, pos, rect_size, color, alpha: null, fill_method: 0, sprite_type: 1, raycast: false, enable: true, image_ruid: null, pivot: null });
b.button(name, text, { rect_size: null, pos, anchor, font_size: 24, color: "#FFFFFF", bg_color: null, sprite_type: 1, enable: true, image_ruid: null, pivot: null });
b.slider(name, { min_val: 0, max_val: 1, value: 0, direction: 0, use_handle: true, use_integer: false, bg_color: null, sprite_type: 1, anchor, pos, rect_size: [200, 30], enable: true, image_ruid: null, pivot: null });
b.scrollLayout(name, { layout_type: 1, spacing: 0, cell_size: [100, 100], use_scroll: true, padding: [0, 0, 0, 0], v_scroll_dir: 2, h_scroll_dir: 0, anchor, pos, rect_size: [400, 600], enable: true, pivot: null });
b.textInput(name, { placeholder: "", char_limit: 0, content_type: 0, line_type: 0, font_size: 24, color: "#FFFFFF", bg_color: null, sprite_type: 1, anchor, pos, rect_size: [300, 50], enable: true, image_ruid: null, pivot: null });
b.script(name, scriptName, { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080], enable: true, pivot: null });

// Root UIGroup only; nested group() throws. Use empty()/panel() for inner containers.
b.group(name, { default_show: true, group_order: 0, group_type: 1, blocks_raycasts: true, group_alpha: 1.0, interactable: true, anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080], enable: true, pivot: null });

// Clipping mask
b.mask(name, { shape: 0, padding: [0, 0, 0, 0], softness: [0, 0], anchor: "middle-center", pos: [0, 0], rect_size: [200, 200], color: null, alpha: 0.0, image_ruid: null, enable: true, pivot: null });

// Virtualized grid
b.gridView(name, { total_count: 0, cell_size: [100, 100], fixed_count: 1, fixed_type: 0, spacing: [0, 0], padding: [0, 0, 0, 0], use_scroll: true, scroll_bar_visible: 1, scroll_bar_thickness: 10.0, anchor, pos, rect_size: [400, 600], enable: true, pivot: null });

// Avatar / Touch / Skeleton / Particle
b.avatar(name, { color: null, flip_x: false, flip_y: false, play_rate: 1.0, preserve_avatar: 0, raycast: true, material_id: "", anchor, pos, rect_size: [200, 300], enable: true, pivot: null });
b.touchReceive(name, { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080], enable: true, pivot: null });
b.skeleton(name, { skeleton_ruid: "", animations: null, skins: null, color: null, flip_x: false, flip_y: false, loop: true, play_rate: 1.0, preserve_mode: 0, raycast: true, anchor, pos, rect_size: [200, 200], enable: true, pivot: null });
b.areaParticle(name, { particle_type: 0, area_size: [100, 100], area_offset: [0, 0], color: null, local_scale: [1, 1], play_speed: 1.0, particle_size: 1.0, particle_speed: 1.0, particle_count: 1.0, particle_lifetime: 1.0, loop: true, play_on_enable: true, prewarm: false, auto_random_seed: true, random_seed: 0, anchor, pos, rect_size: [100, 100], enable: true, pivot: null });
b.basicParticle(name, { particle_type: 0, color: null, local_scale: [1, 1], play_speed: 1.0, particle_size: 1.0, particle_speed: 1.0, particle_count: 1.0, particle_lifetime: 1.0, loop: true, play_on_enable: true, prewarm: false, auto_random_seed: true, random_seed: 0, anchor, pos, rect_size: [100, 100], enable: true, pivot: null });
b.spriteParticle(name, { particle_type: 0, sprite_ruid: "", apply_sprite_color: false, color: null, local_scale: [1, 1], play_speed: 1.0, particle_size: 1.0, particle_speed: 1.0, particle_count: 1.0, particle_lifetime: 1.0, loop: true, play_on_enable: true, prewarm: false, auto_random_seed: true, random_seed: 0, anchor, pos, rect_size: [100, 100], enable: true, pivot: null });

// Virtual joystick (mobile controls)
b.joystick(name, { dynamic_stick: true, axis: 1, up_arrow: 273, down_arrow: 274, left_arrow: 276, right_arrow: 275, anchor: "bottom-left", pos: [200, 200], rect_size: [300, 300], image_ruid: null, color: null, alpha: null, sprite_type: 1, enable: true, pivot: null });

// Soft mask (UGUI SoftMask style)
b.softMask(name, { invert_mask: false, invert_outsides: false, anchor: "middle-center", pos: [0, 0], rect_size: [200, 200], color: null, alpha: 0.0, image_ruid: null, enable: true, pivot: null });

// Chat UI
b.chat(name, { use_chat_balloon: false, expand: true, use_chat_emotion: true, chat_emotion_duration: 5.0, enable_voice_chat: true, hide_world_chat_button: false, message_align_bottom: false, anchor: "bottom-left", pos: [200, 200], rect_size: [400, 300], image_ruid: null, color: null, alpha: 0.0, enable: true, pivot: null });

// Line / Polygon renderer (HUD lines, guidelines, speech-bubble tails, custom shapes)
b.line(name, { points: [{ pos: [0, 0], color: "#FFFFFF", width: 2.0 }, /* ... */], is_flexible: true, flexibility: 3.0, is_smooth: false, loop: false, material_id: "", anchor, pos, rect_size: [100, 100], enable: true, pivot: null });
b.polygon(name, { points: [[0, 0], [100, 0], [50, 100]], color: null, use_custom_uvs: false, uvs: null, material_id: "", anchor, pos, rect_size: [100, 100], enable: true, pivot: null });
```

All creation methods return the builder for chaining. The UUID of the created / updated entity is exposed via `b.lastId()` — call it immediately after the creator if you need the id.

Use `button()` as the default for any colored or imaged rectangle that needs centered text and click handling. It creates the clickable tile as one entity instead of requiring a separate `sprite()` + `text()` pair. For non-clickable labeled boxes, `panel()` and `sprite()` accept `text`, `text_size`, `text_color`, `text_bold`, `text_alignment`, and `text_outline*` options; these add `TextGUIRendererComponent` to the same entity. Use a separate child `text()` only when the label needs its own rect inside a larger parent.

**Button color rule**:

- `button(..., { color })` controls `TextGUIRendererComponent.FontColor` only — button **text** color, not background. It defaults to `#FFFFFF` (white) so labels stay readable on the default dark fill.
- The background is the same entity's `SpriteGUIRendererComponent.Color` / `ImageRUID`, defaulting to the dark translucent skin (RGBA 26,26,26,60, Sliced). Retint it via the `bg_color` option (or `patchComponent`), not `color`.
- For light buttons, set a light `bg_color` **and** a dark text `color` (e.g. `color: "#111827"`); otherwise white text on a light fill becomes invisible.

```javascript
// Default dark button — white text on the dark translucent fill (no extra setup)
b.button("BtnAttack", "Attack", {
  anchor: "bottom-center", pos: [-220, 80], rect_size: [400, 120], font_size: 30,
});

// Opaque dark button — override the default 60/255 alpha
b.button("BtnSolid", "Confirm", {
  anchor: "bottom-center", pos: [0, 80], rect_size: [400, 120], font_size: 30,
  bg_color: { r: 0.12, g: 0.16, b: 0.22, a: 1.0 },
});

// Light button with readable dark text
b.button("BtnRun", "Run", {
  anchor: "bottom-center", pos: [220, 80], rect_size: [400, 120], font_size: 30,
  color: "#111827", bg_color: { r: 0.90, g: 0.94, b: 1.0, a: 1.0 },
});
```

#### Signature gotchas

**`sprite()` fill options are int-only.** `sprite_type` and `fill_method` accept integer codes; string enums (`"Filled"`, `"Horizontal"`) throw at the int32 cast. The full enum catalog is in `#### Enum catalog` below — `sprite_type` ∈ `Simple=0 / Sliced=1 / Tiled=2 / Filled=3` (builder default is **Sliced=1**), `fill_method` ∈ `Horizontal=0 / Vertical=1 / Radial90=2 / Radial180=3 / Radial360=4`. `fill_origin` and `fill_amount` are **not** exposed as builder options — they start at engine defaults (`FillOrigin=0`, `FillAmount=1.0`). Runtime code that animates a fill writes `entity.FillAmount` directly each frame.

```javascript
b.sprite("Cooldown/Fill", { color: "2ecc71", sprite_type: 3, fill_method: 0 });   // ✅ int
b.sprite("Cooldown/Fill", { image_type: "Filled", fill_method: "Horizontal" });   // ❌ throws "FillMethod must be int32. Got 'Horizontal'"
b.sprite("HPBar/Fill", { image_ruid: "f0911af597259044aa624a11332c0595", sprite_type: 1, pivot: [0, 0.5] }); // ✅ linear HP: resize width at runtime
```

**`script(name, scriptName, options)` is 3-arg and `scriptName` must be fully qualified.** Same shape as `text(name, text, opts)` / `button(name, text, opts)` — the second positional argument is the **content string** (the script component type, e.g. `"script.WoWPlayerHUDController"`), not the options object. Packing the script name into options (`b.script(name, { scripts: ["script.X"] })`) now throws at the builder call site. Options-only patterns are reserved for content-free entities (`panel` / `sprite` / `mask` / etc.).

```javascript
b.script("Controller", "script.WoWPlayerHUDController", { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080] });  // ✅
b.script("Controller", { scripts: ["script.WoWPlayerHUDController"] });                                                // ❌ throws — use 3-arg form
```

#### Enum catalog

| Method | Argument | Enum | Values |
|---|---|---|---|
| `mask` | `shape` | `MaskShape` | `Rect=0` |
| `gridView` | `fixed_type` | `GridViewFixedType` | `ColumnCountFixed=0` (vertical scroll), `RowCountFixed=1` (horizontal) |
| `gridView` | `scroll_bar_visible` | `ScrollBarVisibility` | `AlwaysShow=0`, `AutoHide=1`, `Hide=2` |
| `avatar` | `preserve_avatar` | `PreserveSpriteType` | `None=0`, `AspectOnly=1`, `NativeSize=2` |
| `group` | `group_type` | `UIGroupType` | `DefaultType=0`, `UIType=1` (recommended), `EditorType=2` |
| `skeleton` | `preserve_mode` | `PreserveSpriteType` | `None=0`, `AspectOnly=1`, `NativeSize=2` |
| `areaParticle` | `particle_type` | `UIAreaParticleType` | `None=0`, `FogCalm=1`, `FogHeavy=2`, `FogLively=3`, `CalmStarField=4`, `StarFieldSimple=5`, `StarFog=6`, `StarFogFlow=7` |
| `basicParticle` | `particle_type` | `UIBasicParticleType` | `None=0` + 1–45 (full table in [`ui-system/references/component-api.md`](../../msw-ui-system/references/component-api.md) §Enums) |
| `spriteParticle` | `particle_type` | `UISpriteParticleType` | `None=0`, `BurstBig=1`, `SpawnField=2`, `BurstNova=3`, `SimpleSpawn=4`, `Burst=5`, `Stream=6`, `StreamSharp=7`, `AdditiveColor=8` |
| `joystick` | `axis` | `AxisType` | `Axis_4=0`, `Axis_8=1` (default) |
| `joystick` | arrow keys | `KeyboardKey` | Integer key codes. Defaults: `UpArrow=273`, `DownArrow=274`, `RightArrow=275`, `LeftArrow=276` |

#### Notes on group / mask / gridView

- **`group()` is root-only** — nested `group()` calls throw. For inner cards, gauges, tabs, sub-popups, and other local containers, create `empty()` or `panel()` and toggle that entity's `Enable`; use `CanvasGroup` when you need alpha/interactable control.
- **`mask` requires `SpriteGUIRenderer`** — the builder attaches it automatically, but leaving `image_ruid` empty renders a placeholder (SpawnLocation pin shape). To hide the visual mask shape, keep the default `alpha=0`; to make it visible, specify `alpha` / `color` / `image_ruid`.
- **`gridView`'s `ItemEntity` is a runtime prefab** — the builder only fills static fields like `TotalCount` / `CellSize`. The actual cell template must be injected in the script's `OnBeginPlay` via `self.Entity.GridViewComponent.ItemEntity = ...` followed by a `Refresh()` call. This is the only component that cannot be completed by the builder alone.

#### Notes on touchReceive / skeleton / particle

- **`touchReceive` alone receives NOTHING — the same entity (or a child) must carry a raycast-enabled renderer.** UI touch events are delivered only where a raycast hit lands, and the hit resolves upward through parents — a **sibling** sprite does not feed the receiver (silent failure: no error, no events). Standard recipe: `b.sprite(name, { alpha: 0, raycast: true, anchor, pos, rect_size })` then `b.addComponent(name, "MOD.Core.UITouchReceiveComponent")` — `sprite`'s `raycast` defaults to `false`, so set it explicitly. For a visible touch area, use a visible sprite (`alpha`/`color`/`image_ruid`) with `raycast: true` instead. All 7 events (`UITouchEnter/Exit/Down/Up/BeginDrag/Drag/EndDrag`) are ClientOnly. Actions requiring server sync (e.g. inventory moves resulting from a drag) should be delegated by calling `Server` ExecSpace methods.
- **`skeleton` is Spine 4.1 only** — RUIDs from other versions fail to load. Track 1 is reserved by the engine, so passing 1 as the `trackIndex` argument to `SetAnimation` / `AddAnimation` / `ClearTrack` in user code is ignored (use only 0, 2+). The `animations` / `skins` fields only set the initial track-0 animation and active skin list at builder time — runtime changes use ClientOnly methods (`SetAnimation`, `SetAttachment`, etc.).
- **`SkeletonRUID` is a plain string** — the builder serializes it as `"SkeletonRUID": "<ruid>"`. Do not confuse it with SpriteGUIRenderer's `ImageRUID: {"DataId": ...}` MODDataRef wrapping.
- **`areaParticle` / `basicParticle` are preset-based** — the `ParticleType` value determines the visual appearance. `LocalScale` / `ParticleSize` / `ParticleSpeed` / `ParticleCount` / `ParticleLifeTime` are global tuning multipliers on top of the preset. To change the shape itself, switch to a different `particle_type`.
- **Default particle Color is `(0.5, 0.25, 0.25, 1)`** (brown/sepia) — preserves the engine default. For white or high-saturation colors, specify `color="#FFFFFF"` / `color=(1,1,1)` explicitly.
- **`AreaSize` engine metadata default is `(0,0)`**, which emits particles from a point. The builder uses `(100, 100)` as a usable default. To intentionally emit from a point, specify `area_size=(0, 0)` explicitly.
- **`play_on_enable=True` (default) + `loop=True`** → infinite playback starts immediately when the entity is enabled. To show the effect only once, use `loop=False`, or set `play_on_enable=False` and control the `Play()` call from script. `Play` / `Stop` are ClientOnly.

#### Notes on joystick / softMask / chat / line / polygon

- **`joystick` is for mobile input only** — desktop uses keyboard mappings (`up_arrow` / `down_arrow` / `left_arrow` / `right_arrow`) for alternative input. With `dynamic_stick=true` (default), the stick follows the touch start position. The builder attaches both `SpriteGUIRenderer` and `Joystick`, and the engine automatically sets `SpriteGUIRenderer.RaycastTarget` to `false` at `BeginPlay`. If `image_ruid` is not specified, the builder's default sprite is used.
- **`softMask` is an unpublish feature** — gated by permission (`EnableUnpublishFeature`). Unlike `MaskComponent`, it supports soft-edge clipping, and only `RawImageGUIRenderer` / `SpriteGUIRenderer` children are clipped. `invert_mask=true` clips inside the mask, `invert_outsides=true` clips outside.
- **`chat` is a world / session-level chat UI** — typically only one per world. `use_chat_balloon=true` enables speech-bubble mode (bubbles above other users' characters). `expand` / `use_chat_emotion` / `enable_voice_chat` / `hide_world_chat_button` / `message_align_bottom` are UI display details.
- **`line`'s `points`** — `[{ pos: [x, y], color: "#RRGGBB" | Color, width: float }, ...]`. An empty array draws nothing. A single `null` point prevents the engine from drawing any of it. Corners are smoothed only when `is_flexible=true` + `flexibility>=1`.
- **`polygon`'s `points`** — `[[x, y], ...]` Vector2 array. Fewer than 3 points or self-intersecting polygons are not drawn (`IsDrawable()` false). `uvs` is used only when `use_custom_uvs=true`, and its length must match `points`.

#### WorldUI sort fields (common)

All 6 methods `sprite` / `text` / `button` / `slider` / `scrollLayout` / `textInput` support the same 4 sort fields. These are meaningful only when UITransform `UIMode=World(2)` (Screen UI ignores sort fields).

```javascript
b.text("BossName", "Boss", { world_ui: true, sorting_layer: "World", order_in_layer: 10 });
// world_ui: true → override_sorting=true, sorting_layer="UI" (default), order_in_layer=0, ignore_map_layer_check=false
// Individual override: specify override_sorting / sorting_layer / order_in_layer / ignore_map_layer_check directly
```

`override_sorting=false` (default) means sort fields are emitted but follow the UI group's sorting. Specify `world_ui: true` or `override_sorting: true` only when independent WorldUI sorting is needed.

#### Patch / Rename / Remove

```javascript
b.patch(identifier, { anchor, pos, rect_size, pivot, enable, visible, localize, display_order, new_name }); // throws if missing
b.rename(identifier, newName);  // updates all child paths; throws if missing
b.remove(identifier);           // deletes subtree (root not allowed); throws if missing
```

#### Component CRUD

```javascript
b.addComponent(identifier, comp_type, comp_data = null);       // throws if it already exists
b.upsertComponent(identifier, comp_type, comp_data = null);    // replaces if it exists
b.patchComponent(identifier, comp_type, updates);              // field merge; throws if missing
b.removeComponent(identifier, comp_type);                      // rejects UITransform; throws if missing
b.setComponentEnabled(identifier, comp_type, enabled);         // throws if missing
```

`comp_data` defaults to `{"@type": comp_type, "Enable": True}` when omitted. The `componentNames` field is auto-synced. All mutators return the builder; missing entity/component throws.

#### Output

```javascript
b.build();                                                   // completed JSON (not saved to file)
b.write(filepath, { lint: true, strict: true, lint_verbose: false, bind: null });
```

### §3.6 Binding Injection (`.ui` UUID → `.mlua` property)

For `.mlua` scripts to reference entities created by the builder, the property default must contain that UUID. In the AI automation route, the builder updates the `.mlua` file in the same call right after `write()` — without drag binding.

**Key fact — a single entity UUID is all you need.** The right side of `.mlua` property defaults is always a **single entity UUID string**. Component-typed properties work the same way:

```lua
property Entity popupGroup    = "<entity UUID>"   -- Entity / EntityRef
property TextGUIRendererComponent message = "<entity UUID>"  -- same for components
property ButtonComponent btnOk = "<entity UUID>"
```

The engine reads the property declaration type (`TextGUIRendererComponent`, etc.) and wraps it at runtime as `MODComponentRef("{uuid}:{TypeName}")` → resolves the component via `entity.GetComponent(typeId)`. Therefore the builder only needs to pass **one kind: `getId(path)`**. (Earlier guides describing a separate "extract component UUID" procedure were based on an incorrect assumption.)

**`write(path, { bind: ... })` — write + injection in one call**:

```javascript
b.write("ui/PopupGroup.ui", {
  bind: {
    mlua: "RootDesk/MyDesk/UIPopup.mlua",
    props: {
      popupGroup: "/ui/PopupGroup/Panel",       // property Entity popupGroup
      btnOk: "/ui/PopupGroup/Panel/BtnOk",      // property ButtonComponent btnOk
      btnCancel: "Panel/BtnCancel",             // relative path also OK
      message: "Panel/Message",
    },
  },
});
```

`props` = `{ mlua property name → entity path }`. The builder converts each path → entity UUID, uses regex to replace the `property <Type> <name> = "..."` line default in the target `.mlua`, and saves as UTF-8.

Or as separate calls:

```javascript
b.write("ui/PopupGroup.ui");
b.injectBindings("RootDesk/MyDesk/UIPopup.mlua", {
  popupGroup: "Panel",
  btnOk: "Panel/BtnOk",
});
```

**Protected failure cases (RuntimeError)**:

- The entity path does not exist.
- The target `.mlua` does not declare that property at all (typo / undeclared).
- The same property name is declared more than once in the `.mlua` (ambiguous).
- The target `.mlua` file does not exist → `FileNotFoundError`.

Verify that the `.mlua` actually exists and the target property is declared before calling. `.codeblock` is not touched — Maker Refresh regenerates it.

**Failure ordering** — `b.write({ bind })` runs `validate()` and pre-bakes the `.mlua` patch in memory **before** writing `.ui`. If anything before the `.ui` write throws (validation error, missing entity, undeclared property, duplicate property), neither file is touched. If strict `ui_lint` fails after `.ui` is on disk, the invalid `.ui` remains on disk for inspection/recovery, and `.mlua` is left untouched. `.mlua` is written last, only after `.ui` + lint pass. Property replacement is line-anchored and skips Lua line comments (`--`) and block comments (`--[[ ... ]]`), so a commented-out `property string Foo = "..."` is never overwritten.

**`b.validate()`** — call directly to inspect findings (`{ severity, rule, message }[]`) without writing. `write()` calls it internally and throws on any `severity: "error"`. Rules: `U001` invalid number (NaN / Infinity), `U002` int32 component field, `U003` finite-number component field, `U004` boolean component field, `U005` Vector2-shape component field (e.g. `GridViewComponent.Spacing` — must be `{ x, y }` with finite numbers).

**Naming convention (recommended)**:

```
/ui/Popup/Panel/BtnOk       → btnOk    (or okBtn)
/ui/Popup/Panel/Message     → message  (or messageText)
/ui/Popup/Panel             → popupGroup / panel / root
```

Keep the last path segment in camelCase + role suffix (`Btn` / `Text` / `Panel`). When in doubt, **specify the injection table explicitly** and trust only that — do not auto-infer.

### §3.7 Scope (what UIBuilder covers)

- Adding empty / panel / text / sprite / button / slider / scrollLayout / textInput / script
- Root UIGroup (`group`) only; inner grouping uses `empty()` / `panel()`
- mask / gridView / avatar — clipping, virtualized lists, avatar rendering
- touchReceive — invisible drag / multi-touch receiver
- skeleton — Spine 4.1 skeleton UI renderer
- areaParticle / basicParticle / spriteParticle — preset-based particles
- anchor / position / rect_size adjustment
- HUD / popup / menu layout modification
- entity rename / remove (including subtree)
- component add / replace / patch / remove
- path-based entity lookup

### §3.8 `patchComponent` workaround for fields beyond the signature

Component fields not covered by the signature parameters of `text()` / `sprite()` / `button()` (e.g. `Font`, `FontStyle`, `Underlay`, `Padding`, `FillAmount`, `FillOrigin`, `OrderInLayer`) must be set explicitly via `patchComponent(path, comp_type, updates)`. `text()` / `button()` emit `TextGUIRendererComponent`, whose `Font` is a **string** (`"Default"` / `"Maple"` / `"Bazzi"` / `"Football"`) and whose drop shadow is the `Underlay` family — patch those, not the legacy `TextComponent` field names.

When patching `TextGUIRendererComponent` alignment fields directly, use the component enums, not the `text(..., { alignment })` 0-8 helper index: `HorizontalAlignment` uses `Left=1 / Center=2 / Right=4 / Justified=8`, and `VerticalAlignment` uses `Top=256 / Middle=512 / Bottom=1024`.

```javascript
b.patchComponent("Panel/Title", "MOD.Core.TextGUIRendererComponent",
                  { Font: "Maple", FontStyle: 1 });

b.patchComponent("Panel/Title", "MOD.Core.TextGUIRendererComponent",
                  { Underlay: true,
                    UnderlayColor: { r: 0, g: 0, b: 0, a: 0.6 } });

b.patchComponent("Cooldown/Fill", "MOD.Core.SpriteGUIRendererComponent",
                  { Type: 3, FillMethod: 0, FillOrigin: 0,
                    FillAmount: 1.0 });
```

Per-entity forced values (intentional design separation):

- `button()` → `RaycastTarget` is always `True` (button = click area).
- `sprite(raycast=False)` is the default (sprite = decoration). Explicitly set `raycast=True` for modal dimmers and drag areas.
- `text()`'s background sprite is fixed as a transparent sprite with `alpha=0`.

Full enum lists (Alignment, Overflow, ImageType, etc.): [`ui-system/references/component-api.md`](../../msw-ui-system/references/component-api.md) §Enums.

### §3.9 UI-specific failure modes (must know before calling)

**`UITransformComponent.ActivePlatform` — UI not displayed when missing from JSON**

The `PlatformType` enum (`PC=1, Mobile=2, All=0xff(255)`) determines which platforms the UI is active on. If `ActivePlatform` is missing or set to `0`, the UI can be invisible on both PC and Mobile.

The builder automatically injects `ActivePlatform: 255` (all platforms) when creating a new UITransformComponent. Only watch out for these patterns:

- When partially modifying UITransform fields via `patchComponent(identifier, "MOD.Core.UITransformComponent", updates)`, do not touch `ActivePlatform`.
- For mobile-only UI, set explicitly with `b.patchComponent(name, "MOD.Core.UITransformComponent", { ActivePlatform: 2 })`. For PC-only, use `1`.
- Among **existing `.ui` files** loaded via `load()`, entries missing the `ActivePlatform` field entirely are **not** auto-corrected. Fill them in manually with `patchComponent`.

**`default_show=False` caveat — script lifecycle halted**

The `UIBuilder` default is `default_show=True` (recommended). If the root UIGroup is saved as hidden with `default_show=False`, `OnBeginPlay` / `OnUpdate` for scripts inside the group will not be called — a common cause of "the popup doesn't appear even after leveling up."

**Standard pattern** — always keep the root UIGroup at `default_show=True`, and have scripts toggle the `Enable` property of child entities (`Enable` vs `Visible` difference is covered in [`ui-hierarchy.md`](../../msw-ui-system/references/ui-hierarchy.md) §5 — summary: always use `Enable`; `Visible=False` keeps clicks alive and OnUpdate still runs).

```javascript
const ui = new UIBuilder("LevelUpUI");          // defaultShow=true (default)
ui.sprite("dimmer", { ... });
ui.text("title", "Level Up", { ... });
// Script starts with child entities Enable=false in OnBeginPlay,
// then sets Enable=true at the trigger point.
```

Use `default_show=False` only when the group contains **no** controller script and the flow toggles the group's `Enable` externally.

**Diagnosis** — when a popup doesn't appear: check root `UIGroupComponent.DefaultShow` → verify whether the controller's `OnBeginPlay` log fires → if not, the group being hidden is the cause. Recreate with `default_show=True` and migrate to the child `Enable` toggle pattern.

**`scrollLayout()` direction caveat — vertical lists need vertical scroll-bar enum values**

`layout_type`: `0=Horizontal`, `1=Vertical`, `2=Grid`. `v_scroll_dir` must use `2=BottomToTop` or `3=TopToBottom`; `0` and `1` are horizontal-scrollbar values. The builder defaults to `layout_type:1` and `v_scroll_dir:2`; when patching existing `.ui` files manually, keep both fields consistent.

### §3.10 UIBuilder coverage gaps (out of scope)

- `.map` / `.model` / `.tileset` builders — [builder-protocol-map.md](builder-protocol-map.md) §1 / [builder-protocol-model.md](builder-protocol-model.md) §2
- `.ui` JSON schema (raw field shapes, `@type` / `@components` wrapping, AlignmentOption 0–15 mapping) — handled internally by the builder; users / AI do not need to know directly.
- Accessibility patterns (alt text, screen-reader hints, focus order) — not covered.
- Error-state UI patterns (disabled-button styling beyond `Transition.Disabled`, validation messages, loading spinners) — not covered; design ad-hoc per project.
- Automated UI testing / layout assertions beyond `ui_lint.cjs` and `preview_ui_layout.cjs` — not provided.
- Custom shader materials (`MaterialId`) — the field is exposed but authoring shaders is out of scope.
