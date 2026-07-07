# UI Fundamentals — Mental Model

MSW UI uses **the same coordinate model as Unity RectTransform**. If you have Unity experience, almost everything carries over directly. The root cause of AI placing UI elements incorrectly is almost always a fuzzy understanding of the relationship between these 3 things: anchor / pivot / anchoredPosition.

---

## 1. Coordinate System

```
               (0, +540)
                  ▲ +Y
                  │
 (-960, 0) ◄──────┼──────► (+960, 0)
                  │ +X
                  ▼
               (0, -540)
```

- Reference resolution: **1920 × 1080** (fixed). Regardless of the actual device resolution (1440×2960, 800×600, etc.), the canvas is calculated as 1920×1080
- Origin: exact center of the screen `(0, 0)`
- X: `[-960, +960]` — right is +, left is -
- Y: `[-540, +540]` — **up is +, down is -** (Unity convention. Opposite of screen coordinates where top is 0)
- Unit: **pixels** (different from world map units)
- When the device aspect ratio differs, the engine handles scaling and letterboxing → always design in 1920×1080 coordinates

### Layout Design Implications

- **Anchors must be used correctly.** Using center anchor + absolute coordinates will break on wide or tall screens
- **Screen edge elements must use the corresponding corner/edge anchor** — edges stay in place even when resolution changes
- **Center content uses middle-center** — stays centered even with letterboxing

---

## 2. Three RectTransform Elements

The position and size of every UI entity is determined by a combination of these 3 fields.

```
AnchorsMin / AnchorsMax   ─── "reference line" position within the parent Rect (normalized 0~1)
Pivot                     ─── rotation/scale reference point of own Rect (normalized 0~1)
anchoredPosition          ─── offset from anchor → pivot direction (pixels)
OffsetMin / OffsetMax     ─── margins in stretch mode (pixels)
```

### 2-1. anchor — "Where on my parent do I attach?"

- `(0, 0)` = parent's **bottom-left**
- `(1, 1)` = parent's **top-right**
- `(0.5, 0.5)` = parent's **center**
- If Min and Max are the **same point** → **fixed anchor** (size is preserved even when parent resizes)
- If Min and Max are **different points** → **stretch anchor** (stretches proportionally with parent size)

### 2-2. pivot — "Which point of my box do I use as the reference?"

The reference point for rotation, scale, and `anchoredPosition`.

```
Pivot (0.5, 0.5) — center reference      Pivot (0, 0) — bottom-left reference
  ┌────────┐                            ┌────────┐
  │        │                            │        │
  │   ●    │                            │        │
  │        │                            │        │
  └────────┘                            ●────────┘
```

**The MSW builder default is `(0.5, 0.5)`**. Do not change it without a specific reason. If you change the pivot, the entity will render at a different position even with the same `anchoredPosition`.

### 2-3. anchoredPosition — "How far is my pivot from the anchor?"

```
Parent Rect
┌──────────────────────────────┐
│                              │
│      ● anchor (0.5, 0.5)     │
│       ╲                      │
│        ╲ anchoredPosition    │
│         ╲ (+200, +100)       │
│          ┌──────┐            │
│          │      │            │
│          │  ●   │ pivot      │
│          │      │            │
│          └──────┘            │
│                              │
└──────────────────────────────┘
```

If the anchor is at the parent's center and `anchoredPosition = (200, 100)`, then my pivot is 200 to the right and 100 up from the parent's center.

---

## 3. Two Modes — Must Distinguish

### Mode A: Fixed Anchor (AnchorsMin == AnchorsMax)

When you determine the size yourself. HUD elements, buttons, and most UI fall into this category.

- **Size**: determined by `RectSize` field (pixels)
- **Position**: offset from anchor via `anchoredPosition`
- `OffsetMin/Max` is not used (the builder calculates automatically)

```
AnchorsMin = AnchorsMax = (0, 1)   ← parent top-left anchor
RectSize = (500, 160)
Pivot = (0.5, 0.5)
anchoredPosition = (260, -90)
→ a 500×160 box with margin 10 from the top-left (formula: pos = ±(margin + size/2))
```

### Mode B: Stretch Anchor (AnchorsMin ≠ AnchorsMax)

When stretching proportionally with parent size. Fullscreen backgrounds, top bars, side panels, etc.

- **Size**: adjust margins from the anchor range via `OffsetMin/OffsetMax`
- `RectSize`, `anchoredPosition` are meaningless (the engine fills in calculated values)

```
AnchorsMin = (0, 0), AnchorsMax = (1, 1)   ← full stretch
OffsetMin = (20, 20), OffsetMax = (-20, -20)
→ fullscreen panel with 20px margin on all sides inside the parent
```

### Never Mix Modes

- Using `OffsetMin/Max` arbitrarily on a fixed anchor → breaks pivot position calculation
- Using `anchoredPosition` on stretch → no effect or engine overwrites it
- The builder receives the mode as an anchor preset string (`top-left`, `stretch-top`, etc.) and routes automatically. **Do not manually edit OffsetMin/Max.**

---

## 4. Edge Placement Formula

When placing with a fixed anchor at the edge of the screen with a given margin:

```
pos = ±(margin + size/2)
```

Since the pivot is `(0.5, 0.5)`, `anchoredPosition` is the offset of the box's **center**. If you only add the margin, half the box will be clipped.

### 4-Corner & 4-Edge Formula (for pivot 0.5, 0.5)

| Anchor | anchoredPosition for margin 10, size 500×160 |
|------|------------------------------------------------|
| `top-left` | `(+260, -90)` |
| `top-right` | `(-260, -90)` |
| `top-center` | `(0, -90)` |
| `bottom-left` | `(+260, +90)` |
| `bottom-right` | `(-260, +90)` |
| `bottom-center` | `(0, +90)` |
| `middle-left` | `(+260, 0)` |
| `middle-right` | `(-260, 0)` |
| `middle-center` | `(0, 0)` |

Sign convention: determined by **which side/corner of the parent** the anchor is on.
- `top-*` → y is negative (must go downward to stay on screen)
- `bottom-*` → y is positive
- `*-left` → x is positive (move to the right)
- `*-right` → x is negative

---

## 5. Parent-Child Coordinate Inheritance

In nested panels, the child's `anchoredPosition` is relative to the **parent Rect**, not the entire screen.

```
UIGroup (1920×1080, full)
└── Panel (anchoredPosition=(0, 0), RectSize=(600, 400), centered)
    └── BtnOk (anchoredPosition=(0, -120), RectSize=(200, 60))
         ↑ This BtnOk is 120px below the Panel's center (= 120px below the screen center)
```

If you move the Panel, the child Button moves with it. For child placement, just think: **"Where inside my parent Rect?"**

---

## 6. AlignmentOption ↔ Anchor Mapping

`UITransformComponent.AlignmentOption` is the anchor preset number. Builder string ↔ engine value mapping:

| Builder String | AlignmentOption | AnchorsMin | AnchorsMax |
|-------------|-----------------|------------|------------|
| `middle-center` (default) | 0 Center | (0.5, 0.5) | (0.5, 0.5) |
| `middle-left` | 1 Left | (0, 0.5) | (0, 0.5) |
| `middle-right` | 2 Right | (1, 0.5) | (1, 0.5) |
| `top-center` | 3 TopCenter | (0.5, 1) | (0.5, 1) |
| `top-left` | 4 TopLeft | (0, 1) | (0, 1) |
| `top-right` | 5 TopRight | (1, 1) | (1, 1) |
| `bottom-center` | 6 BottomCenter | (0.5, 0) | (0.5, 0) |
| `bottom-left` | 7 BottomLeft | (0, 0) | (0, 0) |
| `bottom-right` | 8 BottomRight | (1, 0) | (1, 0) |
| `stretch-top` | 9 HorizontalTop | (0, 1) | (1, 1) |
| `stretch-middle` | 10 HorizontalCenter | (0, 0.5) | (1, 0.5) |
| `stretch-bottom` | 11 HorizontalBottom | (0, 0) | (1, 0) |
| `stretch-left` | 12 VerticalLeft | (0, 0) | (0, 1) |
| `stretch-center` | 13 VerticalCenter | (0.5, 0) | (0.5, 1) |
| `stretch-right` | 14 VerticalRight | (1, 0) | (1, 1) |
| `stretch` | 15 StretchAll | (0, 0) | (1, 1) |

The builder handles this mapping automatically. Only refer to this when manually editing JSON.

> ⚠️ **`AlignmentOption` overrides `AnchorsMin/Max` on load.** When a UI entity is deserialized, the engine recomputes `AnchorsMin/Max` from `AlignmentOption` (by design — `AlignmentOption` is the source of truth). Writing `AnchorsMin/Max` in `.ui` JSON or via patches without a matching `AlignmentOption` is silently undone on the next load / `refresh`. Symptom: anchors revert to the preset that matches the current `AlignmentOption`. Fix: change `AlignmentOption` to the preset whose anchors you want, or set the anchors at runtime *after* `OnBeginPlay` (note: runtime anchor writes are also overwritten the next time the entity is reloaded).

---

## 7. UIMode — Screen vs World

`UITransformComponent.UIMode` field.

| Value | Name | Usage |
|---|------|------|
| 1 | **Screen** | HUD, menus, popups. Fixed to the screen. **Default** |
| 2 | **World** | Nametags above characters, UI in 3D space. Placed using world coordinates |

Decision criteria: "**If the camera moves, should this UI move with it?**"
- Moves with it (fixed in world) → World
- Doesn't move (fixed on screen) → Screen

In World mode, the meaning of RectTransform coordinates changes. Unless it's a special case like character nametags, damage skins, or NPC speech bubbles, keep it on Screen.

---

## 8. Common Pitfalls (anchor/pivot related only)

> The full failure pattern catalog is outside the scope of this skill. Here we only briefly cover **those directly caused by mental model confusion**.

- **Touching the Position field**: `Position` is managed by the engine. Only modify `anchoredPosition`.
- **Trying to control stretch size with RectSize**: In stretch mode, only `OffsetMin/Max` is effective.
- **Changing an entity's mode midway**: Switching an existing anchor to stretch changes the coordinate system and causes a jump to a completely different position. Regenerating via the builder is safer.
- **Calculating child coordinates as screen absolute values when the parent is stretch**: Children are always relative to the parent Rect.

---

## 9. Resolution & Platform Handling

MSW runs on both PC and mobile. Rules for designing a single `.ui` that displays correctly on both platforms.

### 9.1 Platform Separation — ActivePlatform

Per-entity platform control via the `UITransformComponent.ActivePlatform` field.

```lua
property PlatformType ActivePlatform = PlatformType.All
```

| Value | Name | Displayed On |
|---|------|-------------|
| 1 | `PlatformType.PC` | PC only |
| 2 | `PlatformType.Mobile` | Mobile only |
| 255 | `PlatformType.All` | **Default**, both |

**Typical use cases**:
- **Mobile-only joystick** → `PlatformType.Mobile`
- **PC-only shortcut hint** ("Press R to reload") → `PlatformType.PC`
- **Shared HUD** → `PlatformType.All`

**How to set** — patch after creating an entity in the builder:

```javascript
b.patchComponent("Joystick", "MOD.Core.UITransformComponent", {
  ActivePlatform: 2,   // Mobile only
});
```

mlua runtime change:

```lua
self.joystick.UITransformComponent.ActivePlatform = PlatformType.Mobile
```

### 9.2 Safe Area

Handling mobile notches, punch-holes, and home indicators. MSW does not have a dedicated component — instead it uses the **convention of inserting a Safe Area entity into the hierarchy**.

**Structure**:

```
UIGroup Root (stretch, 1920×1080)
└── SafeArea entity (stretch, OffsetMin/Max dynamically adjusted)
    └── Actual HUD elements
         ├── TopBar (relative to top-* anchor)
         ├── BottomBar (relative to bottom-* anchor)
         └── ...
```

- The SafeArea entity uses a `stretch` anchor in `UITransformComponent`
- At runtime, it receives the device safe area values and adjusts `OffsetMin/OffsetMax` (e.g., excluding the iPhone notch area)
- HUD elements must be placed as **children of** SafeArea to automatically stay within the safe area

**Rules**:

- **For mobile-targeting projects, place a SafeArea layer under the HUD root**
- Place outside SafeArea: fullscreen Dimmer (black overlay), background images
- Whether popups go inside or outside SafeArea is a design decision (usually inside)

**Builder example**:

```javascript
const b = new UIBuilder("DefaultGroup", 1, true);

// SafeArea layer
b.panel("SafeArea", { anchor: "stretch" });

// HUD as children of SafeArea
b.panel("SafeArea/HPBar", {
  anchor: "bottom-left",
  pos: [120, 50],
  rect_size: [220, 30],
});

b.write("ui/DefaultGroup.ui");
```

Adjusting SafeArea `OffsetMin/Max` to device-specific values at runtime requires project scripts (querying device safe area uses engine/OS APIs).

### 9.3 Reserved Zones — MSW Default UI Occupied Areas (PC/Desktop)

The desktop client permanently displays **system UI drawn directly by the engine** in the top two corners of the screen. Your `.ui` must be **designed not to overlap** with them.

**Position and size (based on 1920×1080, conservative estimates)**:

| Position | Content | Recommended Avoidance Area (W × H) | Anchor-relative Coordinates |
|------|------|----------------------|---------------|
| **Top-left** | Chat button (≈120×120) + entry toast ("Welcome to ...") | **≈ 260 × 170 px** | Inward from top-left corner |
| **Top-right** | Friends button + menu (…) button — each ≈90×90, side by side | **≈ 220 × 130 px** | Inward from top-right corner |

The toast only appears briefly upon entry, but is included in the avoidance area as a safety margin.

**Recommended placement principles (PC/Desktop)**:

- **Place top-left / top-right corner-anchored elements outside the reserved zone**:
  - top-left anchor → content starts from `(x ≥ 260, y ≤ -170)` (assuming pivot 0.5: `anchoredPosition = (260 + w/2, -170 - h/2)`)
  - top-right anchor → content starts from `(x ≤ -220, y ≤ -130)`
- **top-center anchor** is safe — system UI only exists at left/right corners (the x=-130~+110 range is empty)
- To use **stretch-top** as a full-width bar (e.g., header), apply left/right padding: `OffsetMin.x = +260`, `OffsetMax.x = -220`
- Push important persistent HUD elements (health, currency, minimap, etc.) to **bottom corners or vertical center of left/right edges**

**How to disable system UI** — **you can't.** There is no public API available in user world scripts to globally hide or disable the platform system UI. `ScreenshotService`'s `includeUI` and `ScreenRecordService`'s `excludeSystemUI` are options that only apply to capture/recording results.

Workarounds:
1. **Avoidance by design is the default.** Place elements outside the reserved zones listed above
2. **Modal popup**: Covering system UI with a fullscreen dimmer + popup is possible (visual occlusion). However, system UI **clicks may still be active** — verify that the game design allows this
3. **Mobile-only layout**: Branching with `ActivePlatform = Mobile` allows designing independently from desktop since the system UI layout differs on mobile

**Builder example**:

```javascript
// top-right menu (avoiding system UI)
b.button("SettingsBtn", "Settings", {
  anchor: "top-right",
  pos: [-270, -50],
  rect_size: [100, 100],
});

// stretch-top header bar (reserved left/right padding)
b.panel("TopHeader", { anchor: "stretch-top", rect_size: [1920, 80] });
b.patchComponent("TopHeader", "MOD.Core.UITransformComponent", {
  OffsetMin: { x: 260, y: -80 },
  OffsetMax: { x: -220, y: 0 },
});
```

> Lint rule `L012` (in `scripts/ui_lint.cjs`) warns when an entity overlaps these reserved zones. See this subsection for remediation.

### 9.4 Minimum Touch Target Size

Mobile touch guidelines:

| Standard | Minimum Size | Recommended |
|------|---------|------|
| Apple HIG | 44×44 pt (≈88×88 px) | 44pt |
| Google Material | 48×48 dp | 48dp |
| **MSW Project Standard** | **88×88 px** | 100×100 or larger |

**Application**:

- Button `RectSize` ≥ 88×88 (even on narrow screens)
- **Gap ≥ 16 px** between adjacent buttons (to prevent accidental taps)
- Even if visually small, the **hit area can be kept large**:
  - The Button entity's own `RectSize` is 100×100
  - A child Sprite displays only a visual 60×60 icon
  - The Button's `RaycastTarget` applies to the entire RectSize area

`scripts/preview_ui_layout.cjs` outputs warnings for buttons smaller than 88px. **Do not ignore them.**

### 9.5 Font Size Guide

Based on 1920×1080 resolution. Maintaining readability even on small mobile screens.

| Purpose | Recommended FontSize |
|------|--------------|
| Body text / descriptions | 24~28 |
| Button labels | 26~32 |
| Titles (Panel Title) | 36~48 |
| Popup main messages | 28~36 |
| Damage / notification floaters | 32~56 |
| Small quantities / secondary text | 18~22 (nearly unreadable on mobile, **avoid using**) |

**Handling long text**:

- **`BestFit = true`** + `MinSize`/`MaxSize` → auto-fits within the Rect. Essential for handling multilingual text length variations
- **`Overflow = Ellipsis(2)`** (or `Truncate(1)`) → clips overflow text; `Ellipsis` appends `...` (recommended for names and item names). Values are for `TextComponent` (`OverflowType`: `Truncate=1`, `Ellipsis=2`); `TextGUIRendererComponent` uses `TextOverflowMode` where the two are swapped (`Ellipsis=1`, `Truncate=2`)
- **`SizeFit = true`** → Text Rect expands to fit its content. When used with a background Sprite, the background also needs separate logic to expand
- **Drive panel height from content — `ui_lint` cannot.** Its geometry rules (overflow/containment) read only `RectSize`; they have **no font metrics and cannot measure rendered text height**, so a fixed-height panel holding variable-length or wrapping text can silently overflow (or leave dead space) while lint stays clean. For such panels, resize to `GetPreferredHeight(text, width)` at runtime, or contain the text via `SizeFit`/`BestFit`/`Overflow`. A clean lint never proves the text fits.

### 9.6 Resolution Handling Checklist

When designing or reviewing a `.ui`:

- [ ] Is centered UI using `middle-center` anchor? (letterbox handling)
- [ ] Is edge UI using the corresponding corner/edge anchor? (aspect ratio change handling)
- [ ] Is the full background using `stretch` anchor?
- [ ] Are fullscreen Dimmer / background images **outside** SafeArea?
- [ ] Are HUD elements **inside** SafeArea? (when targeting mobile)
- [ ] Are mobile-only elements (joystick) set to `ActivePlatform = Mobile`?
- [ ] Are PC-only elements (keyboard hints) set to `ActivePlatform = PC`?
- [ ] **When targeting PC, are elements placed outside the top-left 260×170 / top-right 220×130 reserved zones?** (preventing system UI overlap)
- [ ] Are all button `RectSize` ≥ 88×88? (when targeting mobile)
- [ ] Are long text fields set with `BestFit` or `Overflow = Ellipsis`?
- [ ] Does `preview_ui_layout.cjs` pass with no warnings?

### 9.7 Frequently Confused Topics

**"Does the aspect ratio stay the same when resolution changes?"**

- The engine adjusts via `FitMode` (scaling method). Most use `Height fit` or `Expand`
- When designing a `.ui`, **always think in terms of 1920×1080**
- However, prepare for extra edge space on ultrawide screens (21:9) by combining **center-fixed UI + edge-anchored UI**

**"I want completely different layouts on PC vs. mobile"**

- Create both versions of entities in the same `.ui` and toggle each with `ActivePlatform`
- Or create two separate `.ui` files and detect the platform at startup to Enable only one
- The latter approach is cleaner, but comes with the cost of maintaining two files

**"Fonts look wrong on Android"**

- MSW default fonts: `Default`, `Maple`, `Bazzi`, `Football`
- Project-specific fonts require resource registration
- Check the `Font` value; `Default` is safe in most cases. On `TextGUIRendererComponent`, `Font` is a **string** (`"Default"`)
