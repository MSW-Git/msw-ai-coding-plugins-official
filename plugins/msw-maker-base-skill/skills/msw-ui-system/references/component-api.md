# UI Component API Reference

Full list of properties, methods, and events per UI component. Use as a lookup when calling builder `patchComponent(...)` / `addComponent(...)`, or when accessing a component from `.mlua` runtime code (`property ButtonComponent btn = "uuid"` → `self.btn.Enable = false`).

Before reading or writing a UI component field in `.mlua`, verify the exact field name here. Do not infer field names from Unity, UGUI, HTML, or other UI frameworks.

> **Authoring `.ui` files**: this reference describes **what fields exist**. To **set** them, call the builder (`scripts/msw_ui_builder.cjs`; protocol in [`../../msw-general/references/builder-protocol.md`](../../msw-general/references/builder-protocol.md) §3 — unified call entry point). Do not hand-edit `.ui` JSON.

---

## Component Selection Guide

**Selection criteria (which/when/why)**. For exact field/method/event tables, jump to the component sections below.

### Quick Decision Tree

```
What do you want to display?
├── Text         → TextGUIRendererComponent  (TextComponent is legacy)
├── Image        → SpriteGUIRendererComponent
├── Avatar       → AvatarGUIRendererComponent
├── Input field  → TextGUIRendererInputComponent
└── Group items  → Empty Panel with only UITransform (arrange as children)

What do you want the user to interact with?
├── Simple click (including hover color change)       → ButtonComponent
├── Press, drag, multi-touch                          → UITouchReceiveComponent
├── Slider                                            → SliderComponent
├── Directional input (mobile)                        → JoystickComponent
└── Progress bar (display only)                       → Linear HP/MP: SpriteGUIRenderer(Sliced + width resize); radial: SpriteGUIRenderer(Filled)

Do you need to display a list?
├── 10 or fewer items, simple           → Manual placement + reuse empty Panels
├── Tens to hundreds, structured        → ScrollLayoutGroupComponent
└── Thousands, performance-critical     → GridViewComponent (virtualized)

Clipping or shape masking?
└── MaskComponent (e.g., circular avatar frame)

Opacity or grouped interaction control?
└── CanvasGroupComponent
```

Entity selection priority:
- Colored or imaged background + centered text + click handling → use one `b.button(...)` entity.
- Use separate `b.sprite(...)` + `b.text(...)` only when the text/background must be independent children, or when no click handling is needed.
- Repeated same-shape tiles such as cards, board cells, inventory slots, and menu tabs should default to `b.button(...)`.

### Choosing Between Similar Components

#### ButtonComponent vs UITouchReceiveComponent

| Criteria | ButtonComponent | UITouchReceiveComponent |
|------|----------------|------------------------|
| Hover/pressed visual feedback | **Automatic** (via Transition settings) | Must implement manually |
| Event types | Click / StateChange / Pressed | Down/Up/Drag/Enter/Exit and **7 more** |
| Drag | Not supported | **Supported** |
| Multi-touch | Not supported | **Supported** (distinguishes by TouchId) |
| Keyboard mapping | **Supported** (`KeyCode`) | Not supported |

**How to choose**:
- "Click a button to execute something" → Button
- "Drag to move an item" → UITouchReceive
- "Scroll a map" → UITouchReceive
- "Skill button that also triggers with keyboard R" → Button + `KeyCode`

#### ScrollLayoutGroupComponent vs GridViewComponent

| Criteria | ScrollLayoutGroup | GridView |
|------|-------------------|----------|
| Item count | Up to hundreds | **Unlimited** (virtualized) |
| Render cost | Renders all items | Only renders visible items |
| Item composition | Place children directly in `.ui` | Clones a single `ItemEntity` template |
| Fixed size required | Only for Grid type | **Always** |
| Implementation difficulty | Easy | Requires `OnRefresh` callback |

**Decision criteria**: If the item count exceeds 100 or may grow dynamically, **always use GridView**. Inventory, chat logs, and rankings should default to GridView. Use ScrollLayoutGroup only for static lists of 10 or fewer items, such as settings page tabs.

#### SliderComponent vs SpriteGUIRendererComponent(Filled)

Both can express a "fill" effect, but they serve different purposes.

| Criteria | Slider | Sprite(Filled) |
|------|--------|----------------|
| User interaction (drag) | **Supported** | Not supported |
| Value event | `SliderValueChangedEvent` | None |
| Direction | 4 directions | **Horizontal/Vertical/Radial** |
| Circular gauge | Not supported | **Supported** (Radial) |
| 9-slice support | Limited | Built-in |

**How to choose**:
- Volume/sensitivity control → Slider
- HP/MP bar (read-only) → Sprite(**Sliced**) fill with `image_ruid = "f0911af597259044aa624a11332c0595"`, resize width (not Slider)
- Cooldown circular gauge → Sprite(Filled Radial) — radial is the only case that needs Filled
- Experience bar → Sprite(**Sliced**) fill, resize width + Tween on value change

> For linear bars, prefer **Sliced + width resize** over `Filled`: `Filled` clips the sprite's UVs, which warps any 9-slice border, whereas resizing a Sliced fill keeps the rounded corners/borders intact at every value. Reserve `Filled` for radial sweeps.

#### TextGUIRendererComponent — Alignment

`TextGUIRendererComponent` uses two independent axes: `HorizontalAlignment` (`TextHorizontalAlignmentOption`) and `VerticalAlignment` (`TextVerticalAlignmentOption`). Defaults are `Center(2)` + `Middle(512)` — already centered, no extra setup needed.

Common combinations:
- Title/centered text → `HorizontalAlignment = Center(2)` + `VerticalAlignment = Middle(512)` (default)
- Left-aligned description → `HorizontalAlignment = Left(1)` + `VerticalAlignment = Middle(512)`
- Right-aligned numbers (e.g., scores) → `HorizontalAlignment = Right(4)` + `VerticalAlignment = Middle(512)`

Additional considerations:
- `BestFit = true` + `MinSize`/`MaxSize` → Automatically adjusts font size to fit the Rect.
- `Overflow`: `Truncate(2)` clips / `Ellipsis(1)` shows `...` / `Overflow(0)` lets text flow outside
- `SizeFit = true` → Rect automatically resizes to fit text. **Be careful with dynamic text + background Sprite** (the background won't resize along with it)
- `ColorGradient = true` + `GradientMode` → per-corner or axis gradient color

#### SpriteGUIRenderer — ImageType Selection

| Type | Value | Use Case |
|------|---|------|
| Simple | 0 | Regular image. Stretching causes distortion |
| **Sliced** | 1 | 9-slice. Recommended for button/panel backgrounds |
| Tiled | 2 | Repeating pattern backgrounds |
| Filled | 3 | **Radial** cooldowns / circular gauges only |

**Button backgrounds, dialog backgrounds, panels, and linear gauge bars should almost always use Sliced**. The sprite asset must have 9-slice borders configured for this to work. For a linear gauge (HP/MP/EXP), use a Sliced fill anchored to the left edge and drive the fill by resizing its width at runtime — reserve `Filled` for radial sweeps that a 9-slice cannot represent.

Asset-side pivot / 9-slice border metadata is not stored in `.ui`; set it on the sprite resource through `msw-mcp`'s `asset_update_resource_storage_info` (`properties: [{ key, value }]` — `pivot_x`, `pivot_y`, `border_left`, `border_right`, `border_top`, `border_bottom`, `filter_mode`, `wrap_mode`). After that, the `.ui` side still needs `SpriteGUIRendererComponent.Type = Sliced(1)` to render the borders.

> [!WARNING]
> Two Sliced panels whose borders cross paint a doubled / muddy frame seam. Keep sibling Sliced frames either fully nested (one inside the other) or separated by a margin so their borders never touch. `ui_lint` rule `L026` catches real border collisions, but only when you pass the sprites' border sizes via `--borders <ruid-border-map.json>` (mapping each `ImageRUID.DataId` to its `{ left, bottom, right, top }` px). Border thickness lives in the sprite asset, not the `.ui`, so the offline lint can't see it on its own and stays silent without that map. Deliberate layering (fanned cards, stacked art) is safe to ignore.

### Combination Patterns (Common Component Groupings)

Summary of component combinations to attach per entity. For builder call code and ASCII trees, see [`layout-recipes.md`](layout-recipes.md). For runtime code, see [`runtime-patterns.md`](runtime-patterns.md).

| Pattern | Core Structure | Builder Recipe | Runtime Code |
|------|-----------|------------|-----------|
| **Button (icon + text)** | Single entity with `Sprite(Sliced) + Button`. Separate Icon/Label as children — hover/pressed colors apply only to the background Sprite, keeping text stable | [`layout-recipes.md`](layout-recipes.md) Recipe 1 | [`runtime-patterns.md`](runtime-patterns.md) §1, §6 |
| **Clickable tile/card** | Single `b.button(...)` entity with `SpriteGUIRendererComponent + TextGUIRendererComponent + ButtonComponent`; runtime changes use `SpriteGUIRendererComponent.Color/ImageRUID` and `TextGUIRendererComponent.Text` | [`layout-recipes.md`](layout-recipes.md) Recipe 8 | [`runtime-patterns.md`](runtime-patterns.md) §1, §6 |
| **HP/MP bar** | Background Sprite + child Fill (`middle-left` anchor, pivot `(0, 0.5)`, `SpriteGUIRenderer Type=Sliced`) | [`layout-recipes.md`](layout-recipes.md) Recipe 1 | [`runtime-patterns.md`](runtime-patterns.md) §3 (`fillTransform.RectSize = Vector2(fullWidth*ratio, h)` — resize width, not FillAmount) |
| **Avatar profile (circular)** | `Sprite(circular border) + Mask(Shape=Circle)` + child `AvatarGUIRenderer` | — | — |
| **Modal popup** | Root: `UITransform(stretch) + UIGroup(GroupType=2, Order=10) + CanvasGroup(BlocksRaycasts=true)`. Children: semi-transparent Dimmer (`raycast=true`, blocks input to HUD behind) + Panel(middle-center) | [`layout-recipes.md`](layout-recipes.md) Recipe 2 | [`runtime-patterns.md`](runtime-patterns.md) §1 |
| **Scroll list (~50 items)** | `ScrollLayoutGroup(Type=Vertical/Horizontal/Grid) + Mask(Shape=Rect)`. Children are auto-arranged | [`layout-recipes.md`](layout-recipes.md) Recipe 6 | [`runtime-patterns.md`](runtime-patterns.md) §4, §8 |
| **Large list (virtualized)** | `GridView` + `ItemEntity = reference to child template entity` + `OnRefresh = fn(index, entity)`. Template entity has `enable=False`. | [`layout-recipes.md`](layout-recipes.md) Recipe 5 | [`runtime-patterns.md`](runtime-patterns.md) §5 |

> **GridView caution** — `OnRefresh` is called frequently during scrolling. Do not call DataStorage; read only from cached tables.

### Rarely Used Components

| Component | When to Use |
|----------|----------|
| `JoystickComponent` | Mobile movement controls only. Not needed for PC-only games |
| `ChatComponent` | When using the MSW built-in chat UI. For custom chat, use a Text+Input combination |
| `UILogic` methods | World↔UI coordinate conversion. Needed for damage floating text and nametags |
| Individual element alpha | Do not use. For group-level fading, use `CanvasGroup.GroupAlpha` |

### Component Attachment Checklist

When creating a new entity:

- [ ] `UITransformComponent` is required (for all UI entities)
- [ ] If it's the `.ui` root, add `UIGroupComponent + CanvasGroupComponent`; never add `UIGroupComponent` to inner containers
- [ ] If it's an image, add `SpriteGUIRendererComponent` and set `ImageRUID` (invisible if left empty)
- [ ] If it's a button, add `ButtonComponent` + background Sprite on the same entity; Label as a child
- [ ] If it's a list, decide the scroll type first (hundreds or more → GridView)
- [ ] To block input, use `CanvasGroup.Interactable` or `BlocksRaycasts`
- [ ] If it's text, use `TextGUIRendererComponent`; default alignment is already Center+Middle

---

## UITransformComponent

Manages position, size, anchors, rotation, and scale. Required on every UI entity.

### Properties

| Name | Type | Default | Description |
|------|------|--------|------|
| `anchoredPosition` | Vector2 | (0, 0) | Offset relative to the anchor (**use only this for UI positioning**) |
| `RectSize` | Vector2 | (100, 100) | UI size |
| `AlignmentOption` | AlignmentType | Center(0) | Anchor preset (0~15; see [`ui-fundamentals.md`](ui-fundamentals.md) §6 for full mapping) |
| `AnchorsMin` | Vector2 | (0.5, 0.5) | Bottom-left anchor (normalized) |
| `AnchorsMax` | Vector2 | (0.5, 0.5) | Top-right anchor (normalized) |
| `OffsetMin` | Vector2 | (0.5, 0.5) | Offset relative to AnchorsMin |
| `OffsetMax` | Vector2 | (0.5, 0.5) | Offset relative to AnchorsMax |
| `Pivot` | Vector2 | (0.5, 0.5) | Reference for rotation / scale |
| `UIScale` | Vector3 | (1, 1, 1) | Scale |
| `UIRotation` | Vector3 | (0, 0, 0) | Euler-angle rotation |
| `UIMode` | UIModeType | None(0) | Screen(1) or World(2) |
| `Position` | Vector3 | (0, 0, 0) | Coordinates relative to parent (do not set directly in UI) |
| `WorldPosition` | Vector3 | -- | World coordinates (read-only) |
| `ActivePlatform` | PlatformType | All | Active platform |

### Methods

| Method | Returns | Description |
|--------|------|------|
| `Rotate(float angle)` | void | Counterclockwise rotation |
| `Translate(float deltaX, float deltaY)` | void | Relative translation |
| `ToWorldPoint(Vector3 local)` | Vector3 | Local -> world coordinate conversion |
| `ToLocalPoint(Vector3 world)` | Vector3 | World -> local coordinate conversion |
| `ToWorldDirection(Vector3 local)` | Vector3 | Local -> world direction conversion |
| `ToLocalDirection(Vector3 world)` | Vector3 | World -> local direction conversion |
| `GetWorldCorners()` | Vector2[] | World coordinates of the rectangle's four corners (BL, TL, TR, BR) |

---

## UIGroupComponent

Defines a UI screen group. Attach only to the `.ui` root entity; use `UITransform` / `CanvasGroup` containers inside the tree.

### Properties

| Name | Type | Default | Description |
|------|------|--------|------|
| `DefaultShow` | boolean | true | Whether to show at start |
| `GroupOrder` | int32 | 0 | Z order (higher is on top) |
| `GroupType` | UIGroupType | UIType(2) | DefaultType(1), UIType(2) |

---

## CanvasGroupComponent

Controls the group's overall transparency and interaction.

### Properties

| Name | Type | Default | Description |
|------|------|--------|------|
| `GroupAlpha` | float | 1.0 | Transparency including children (0-1) |
| `Interactable` | boolean | true | Whether to respond to input |
| `BlocksRaycasts` | boolean | true | Block touches on UI behind |

---

## Commonly Mistaken Unity Analogs

| Intended action | Do not assume | MSW field / pattern |
|------|------|------|
| Disable a specific UI component or button | `Interactable` on `ButtonComponent` | `ButtonComponent.Enable = false` for the component, or `Entity.Enable = false` for the whole entity/tree |
| Disable a whole popup/panel/tree | `gameObject.SetActive(...)` / `isActive` | `Entity.Enable = false` / `true` |
| Block or allow interaction for a group | `ButtonComponent.Interactable` | `CanvasGroupComponent.Interactable` and `CanvasGroupComponent.BlocksRaycasts` |
| Change text string | `text` | `TextGUIRendererComponent.Text` |
| Change text color | `color` | `TextGUIRendererComponent.FontColor` |
| Change sprite tint | `color` | `SpriteGUIRendererComponent.Color` |

`Enable` is inherited from the base component and is valid on UI components. `Interactable` is a `CanvasGroupComponent` property, not a `ButtonComponent` property.

---

## ButtonComponent

Interactive button. Supports state-transition effects.

### Properties

| Name | Type | Default | Description |
|------|------|--------|------|
| `Transition` | TransitionType | ColorTint(1) | None(0), ColorTint(1), SpriteSwap(2) |
| `Colors` | TransitionColorSet | -- | Per-state colors (Normal/Highlighted/Pressed/Selected/Disabled) |
| `ImageRUIDs` | TransitionRUIDSet | -- | Per-state images (when SpriteSwap) |
| `KeyCode` | KeyboardKey | -- | Keyboard binding |
| `OrderInLayer` | int32 | 0 | Render priority |
| `OverrideSorting` | boolean | false | Whether to manually use SortingLayer / OrderInLayer |
| `Selectable` | boolean | true | Whether the selected state can be maintained |
| `SortingLayer` | string | "UI" | Render layer |

### Events

| Event | Description |
|--------|------|
| `ButtonClickEvent` | Click (carries Entity property) |
| `ButtonStateChangeEvent` | State change (state: ButtonState) |
| `ButtonPressedEvent` | Enter pressed state |

---

## TextGUIRendererComponent

Displays text in UI space. Use with `UITransformComponent`. **Preferred text component for new UI.**

Alignment defaults to `Center + Middle` — no explicit alignment setup needed for centered text.

### Properties

| Name | Type | Default | Description |
|------|------|--------|------|
| `Text` | string | "Text" | Text to display |
| `FontSize` | float | 20 | Font size |
| `FontColor` | Color | black | Text color |
| `Font` | string | "Default" | Font name: `"Default"`, `"Maple"`, `"Bazzi"`, `"Football"` |
| `FontStyle` | FontStyleType | Normal(0) | Normal(0), Bold(1), Italic(2), Underline(4) — bit flags, combinable |
| `HorizontalAlignment` | TextHorizontalAlignmentOption | Center(2) | Left(1), Center(2), Right(4), Justified(8) |
| `VerticalAlignment` | TextVerticalAlignmentOption | Middle(512) | Top(256), Middle(512), Bottom(1024) |
| `IsRichText` | boolean | true | Rich-text tag support |
| `Overflow` | TextOverflowMode | Overflow(0) | Overflow(0), Ellipsis(1), Truncate(2), Page(3) |
| `BestFit` | boolean | false | Auto-fit size |
| `MinSize` | float | 10 | BestFit minimum size |
| `MaxSize` | float | 40 | BestFit maximum size |
| `Padding` | RectOffset | 0,0,0,0 | Inner padding |
| `SizeFit` | boolean | false | Auto-fit to content size |
| `UseConstraintX` | boolean | false | Constrain text width to `ConstraintX` |
| `ConstraintX` | float | 100 | Max text width when `UseConstraintX` is true |
| `UseConstraintY` | boolean | false | Constrain text height to `ConstraintY` |
| `ConstraintY` | float | 100 | Max text height when `UseConstraintY` is true |
| `Underlay` | boolean | false | Drop shadow |
| `UnderlayColor` | Color | black | Shadow color |
| `UnderlayOffsetX` | float | 0 | Shadow X offset |
| `UnderlayOffsetY` | float | 0 | Shadow Y offset |
| `UnderlayDilate` | float | 0 | Shadow outline thickness |
| `UnderlaySoftness` | float | 0 | Shadow blur softness |
| `OutlineColor` | Color | black | Outline color |
| `OutlineWidth` | float | 0 | Outline thickness (0 = no outline) |
| `FaceDilate` | float | 0 | Text face thickness (positive = thicker) |
| `FaceSoftness` | float | 0 | Text face corner softness |
| `ColorGradient` | boolean | false | Enable color gradient |
| `GradientMode` | GradientModes | Single(0) | Single(0), Horizontal(1), Vertical(2), FourCorners(3) |
| `TopLeftColor` | Color | white | Gradient top-left corner |
| `TopRightColor` | Color | white | Gradient top-right corner |
| `BottomLeftColor` | Color | white | Gradient bottom-left corner |
| `BottomRightColor` | Color | white | Gradient bottom-right corner |
| `TextSpriteSetId` | string | "" | TextSpriteSet dataset entry id |
| `TextStyleSheetId` | string | "" | TextStyleSheet dataset entry id |
| `Page` | int32 | 1 | Current page (when `Overflow = Page(3)`) |

### Methods

| Method | Returns | Description |
|--------|------|------|
| `GetLocalizedText()` | string | Text in the current language. Requires `Text` to hold a locale key; set the key flag in the Maker editor, not in script. |
| `GetPreferredHeight(string text, float width)` | float | Compute required height |
| `GetPreferredWidth(string text)` | float | Compute required width |

> Localization is opt-in via a Maker-editor-only flag on the component (not a runtime `.mlua` property). To localize, set the flag and put a locale key in `Text` from the Maker editor, then read the resolved string at runtime via `GetLocalizedText()`.

---

## TextComponent (Legacy)

> ⚠️ **Legacy — do not use for new UI text; use `TextGUIRendererComponent` above.** `TextComponent` only persists in older `.ui` files. Its key difference is a single 9-cell `Alignment` field (`TextAlignmentType`, default `UpperLeft(0)` — *not* centered), instead of the separate `HorizontalAlignment` / `VerticalAlignment` axes. If you must edit legacy text, set `Alignment` explicitly and read the remaining field names directly from the existing `.ui`.

---

## SpriteGUIRendererComponent

Renders 2D images / sprites.

> See the `msw-sprite-ruid` skill for `ImageRUID` native type support (`sprite` / `animationclip`), `animationclip` animated UI, and the `thumbnail://` prefix for rendering `skeleton` / `avataritem` thumbnails (especially useful for avatar item icons).

### Properties

| Name | Type | Default | Description |
|------|------|--------|------|
| `ImageRUID` | DataRef | -- | Image resource reference |
| `Color` | Color | white | Tint color |
| `Type` | ImageType | Simple(0) | Simple(0), Sliced(1), Tiled(2), Filled(3) |
| `FillAmount` | float | 1.0 | Fill amount (Filled type, 0-1) |
| `FillMethod` | FillMethodType | Horizontal(0) | Fill direction |
| `FillOrigin` | int32 | 0 | Fill origin |
| `FillClockWise` | boolean | true | Clockwise fill |
| `FlipX` | boolean | false | Flip horizontally |
| `FlipY` | boolean | false | Flip vertically |
| `RaycastTarget` | boolean | true | Receive touch / click |
| `PlayRate` | float | 1.0 | Animation speed |
| `StartFrameIndex` | int32 | 0 | Animation start frame |
| `EndFrameIndex` | int32 | -1 | Animation end frame |
| `OrderInLayer` | int32 | 0 | Render priority |
| `PreserveSprite` | PreserveSpriteType | None(0) | None(0) stretch to RectSize / AspectOnly(1) fit keeping ratio / NativeSize(2) native px |
| `MaterialId` | string | "" | Custom material id (advanced shader effects) |

### Methods

| Method | Returns | Description |
|--------|------|------|
| `SetAlpha(float alpha)` | void | Set transparency |
| `SetNativeSize()` | void | Reset to native size |
| `ChangeMaterial(string materialId)` | void | Apply a material |

### Events

| Event | Description |
|--------|------|
| `SpriteGUIAnimPlayerStartEvent` | Animation start |
| `SpriteGUIAnimPlayerChangeFrameEvent` | Frame change |
| `SpriteGUIAnimPlayerEndEvent` | Animation end |

---

## ScrollLayoutGroupComponent

Scrollable list / grid layout.

### Properties

| Name | Type | Default | Description |
|------|------|--------|------|
| `Type` | LayoutGroupType | Horizontal(0) | Horizontal(0), Vertical(1), Grid(2). `UIBuilder.scrollLayout()` defaults to Vertical(1) for list authoring. |
| `Spacing` | float | 0 | Item spacing (H/V) |
| `GridSpacing` | Vector2 | (0, 0) | Item spacing (Grid) |
| `Padding` | RectOffset | 0,0,0,0 | Outer padding |
| `CellSize` | Vector2 | (100, 100) | Fixed item size (Grid) |
| `ConstraintCount` | int32 | 1 | Fixed row / column count |
| `ScrollBarVisible` | ScrollBarVisibility | AlwaysShow(0) | AlwaysShow(0), AutoHide(1), Hide(2) |
| `ScrollBarThickness` | float | 20.0 | Scrollbar thickness |
| `ScrollBarHandleColor` | Color | (0.5, 0.5, 0.5, 1) | Handle color |
| `ScrollBarHandleImageRUID` | DataRef | -- | Handle image |
| `ScrollBarBackgroundColor` | Color | (1, 1, 1, 0.4) | Background color |
| `ScrollBarBgImageRUID` | DataRef | -- | Background image (note: NOT `ScrollBarBackgroundImageRUID`) |
| `HorizontalScrollBarDirection` | HorizontalScrollBarDirection | LeftToRight(0) | Horizontal scrollbar direction |
| `VerticalScrollBarDirection` | VerticalScrollBarDirection | BottomToTop(2) | Vertical scrollbar direction |
| `ChildAlignment` | ChildAlignmentType | UpperLeft(0) | Child alignment for `Horizontal`/`Vertical` types |
| `ReverseArrangement` | boolean | false | Reverse child order for `Horizontal`/`Vertical` types |
| `GridChildAlignment` | ChildAlignmentType | UpperLeft(0) | Child alignment for `Grid` type |
| `StartCorner` | GridLayoutCorner | UpperLeft(0) | Grid start corner |
| `StartAxis` | GridLayoutAxis | Horizontal(0) | Grid child add direction |
| `Constraint` | GridLayoutConstraint | Flexible(0) | Grid constraint mode |

### Methods

| Method | Returns | Description |
|--------|------|------|
| `GetScrollNormalizedPosition()` | Vector2 | Current scroll position (0-1) |
| `SetScrollNormalizedPosition(UITransformAxis, float)` | void | Set scroll position |
| `SetScrollPositionByItemIndex(int32)` | void | Scroll to an item |
| `ResetScrollPosition(UITransformAxis)` | void | Reset to initial position |

### Events

| Event | Description |
|--------|------|
| `ScrollPositionChangedEvent` | On scroll (NormalizedPosition: Vector2) |

---

## GridViewComponent

Virtualization for large lists. Renders only items visible on screen.

### Properties

| Name | Type | Default | Description |
|------|------|--------|------|
| `ItemEntity` | Entity | -- | Clone template |
| `TotalCount` | int32 | 0 | Total item count |
| `CellSize` | Vector2 | (100, 100) | Item size |
| `FixedCount` | int32 | 1 | Fixed row / column count |
| `FixedType` | GridViewFixedType | ColumnCountFixed(0) | Fixed axis |
| `Spacing` | Vector2 | (0, 0) | Item spacing |
| `Padding` | RectOffset | 0,0,0,0 | Outer padding |
| `UseScroll` | boolean | true | Enable scrolling |
| `OnRefresh` | func<int32, Entity> | -- | Item-display callback |
| `OnClear` | func<int32, Entity> | -- | Item-hide callback |

### Methods

| Method | Returns | Description |
|--------|------|------|
| `Refresh(boolean resetPos, boolean force)` | void | Full refresh |
| `RefreshIndex(int32 index)` | void | Refresh a specific item |
| `SetScrollPositionByItemIndex(int32)` | void | Scroll to an item |
| `SetScrollNormalizedPosition(UITransformAxis, float)` | void | Set scroll position |

---

## TextGUIRendererInputComponent

Text input field. Receives keyboard input and feeds it to the paired `TextGUIRendererComponent` on the same entity. The builder's `textInput()` mints both together.

### Properties

| Name | Type | Default | Description |
|------|------|--------|------|
| `Text` | string | "" | Entered text |
| `PlaceHolder` | string | "" | Placeholder |
| `PlaceHolderColor` | Color | gray | Placeholder color |
| `CharacterLimit` | int32 | 0 | Max characters (0 = unlimited) |
| `ContentType` | InputContentType | Standard | Input type |
| `LineType` | InputLineType | MultiLineSubmit | Newline mode — `SingleLine=0` / `MultiLineSubmit=1` / `MultiLineNewline=2`. Component default is `MultiLineSubmit(1)`, but `textInput()` always emits `SingleLine(0)` unless you pass `line_type` |
| `AutoClear` | boolean | false | Auto-clear after submit |
| `IsFocused` | boolean | -- | Focus state (read-only) |

### Methods

| Method | Returns | Description |
|--------|------|------|
| `ActivateInputField()` | void | Set focus |
| `GetLocalizedPlaceHolder()` | string | `PlaceHolder` in the current language (requires the placeholder to hold a locale key, set in the Maker editor) |

> Placeholder localization is opt-in via a Maker-editor-only flag (not a runtime `.mlua` property). Set the flag and put a locale key in `PlaceHolder` from the Maker editor, then read the resolved string at runtime via `GetLocalizedPlaceHolder()`.

### Events

| Event | Description |
|--------|------|
| `TextInputValueChangeEvent` | While typing (text: string) |
| `TextInputEndEditEvent` | Edit ended (text: string) |
| `TextInputSubmitEvent` | Submit (text: string) |
| `TextInputKeyDownEvent` | Key down |
| `TextInputKeyUpEvent` | Key up |

---

## SliderComponent

Slider / progress bar.

### Properties

| Name | Type | Default | Description |
|------|------|--------|------|
| `Value` | float | 0 | Current value |
| `MinValue` | float | 0 | Minimum |
| `MaxValue` | float | 1 | Maximum |
| `UseIntegerValue` | boolean | false | Allow integers only |
| `Direction` | SliderDirection | -- | Slider direction |
| `HandleSize` | Vector2 | -- | Handle size |
| `HandleColor` | Color | -- | Handle color |
| `UseHandle` | boolean | true | Show handle |
| `FillRectColor` | Color | (1, 1, 1, 1) | Fill area color |
| `FillRectImageRUID` | DataRef | -- | Fill area image |
| `FillRectPadding` | RectOffset | (10, 10, 10, 10) | Inner padding of the fill rect |
| `HandleAreaPadding` | RectOffset | 0, 0, 0, 0 | Inner padding of the handle area |
| `HandleImageRUID` | DataRef | -- | Handle image |

### Events

| Event | Description |
|--------|------|
| `SliderValueChangedEvent` | Value changed (Value: float) |

---

## UITouchReceiveComponent

Receives touch / mouse input. Just attaching it makes events fire.

### Events

| Event | Properties | Description |
|--------|---------|------|
| `UITouchDownEvent` | Entity, TouchId, TouchPoint | Touch / click start |
| `UITouchUpEvent` | Entity, TouchId, TouchPoint | Touch / click end |
| `UITouchDragEvent` | Entity, TouchDelta, TouchId, TouchPoint | Drag |
| `UITouchBeginDragEvent` | Entity | Drag start |
| `UITouchEndDragEvent` | Entity | Drag end |
| `UITouchEnterEvent` | Entity | Pointer enter |
| `UITouchExitEvent` | Entity | Pointer exit |

---

## MaskComponent

Clips child UI to a specific shape.

### Properties

| Name | Type | Default | Description |
|------|------|--------|------|
| `Shape` | MaskShape | Rect | Mask shape (Rect, Circle, etc.) |
| `Padding` | RectOffset | 0,0,0,0 | Soft edge |
| `Softness` | Vector2Int | (0, 0) | Blur amount |

---

## JoystickComponent

Virtual joystick (mobile). Builder: `joystick(name, options)` — anchors to bottom-left at `(200, 200)` with a `300x300` rect by default.

### Properties

| Name | Type | Default | Description |
|------|------|--------|------|
| `DynamicStick` | boolean | true | Track touch position |
| `Axis` | AxisType | Axis_8(1) | Axis_4(0), Axis_8(1) |
| `UpArrow` | KeyboardKey | UpArrow(273) | Up-direction key mapping |
| `DownArrow` | KeyboardKey | DownArrow(274) | Down-direction key mapping |
| `LeftArrow` | KeyboardKey | LeftArrow(276) | Left-direction key mapping |
| `RightArrow` | KeyboardKey | RightArrow(275) | Right-direction key mapping |

---

## ChatComponent

In-game chat UI. Builder: `chat(name, options)`.

### Properties

| Name | Type | Default | Description |
|------|------|--------|------|
| `Expand` | boolean | true | Expandable |
| `UseChatBalloon` | boolean | false | Show speech balloons |
| `UseChatEmotion` | boolean | true | Emotion support |
| `ChatEmotionDuration` | float | 5.0 | Emotion display duration (seconds) |
| `EnableVoiceChat` | boolean | true | Allow voice-chat button |
| `HideWorldChatButton` | boolean | false | Hide the world-chat button |
| `MessageAlignBottom` | boolean | false | Anchor newest message to the bottom |

### Events

| Event | Description |
|--------|------|
| `ChatEvent` | Chat event |

---

## SoftMaskComponent

Soft-edged clipping mask (UGUI SoftMask style). Builder: `softMask(name, options)`. Attach to a sprite entity; child sprites/raw images are clipped with anti-aliased edges. **Note**: gated by the `EnableUnpublishFeature` maker authority.

### Properties

| Name | Type | Default | Description |
|------|------|--------|------|
| `InvertMask` | boolean | false | Invert the alpha mask |
| `InvertOutsides` | boolean | false | Invert the mask outside its bounds |

---

## LineGUIRendererComponent

Draws a polyline (HUD lines, guides). Builder: `line(name, options)` — `options.points` is an array of `{ pos: [x, y], color: "#RRGGBB" | Color, width: float }`.

### Properties

| Name | Type | Default | Description |
|------|------|--------|------|
| `Points` | LinePoint[] | [] | Vertex list; each entry has `Position`, `Color`, `Width` |
| `IsFlexible` | boolean | true | Smooth corners using `Flexibility` |
| `Flexibility` | float | 3.0 | Curvature factor (>=1.0) |
| `IsSmooth` | boolean | false | Anti-aliased rendering |
| `Loop` | boolean | false | Close the path back to the first point |
| `MaterialId` | string | "" | Custom material id |

---

## PolygonGUIRendererComponent

Draws an arbitrary polygon (speech-balloon tails, custom shapes). Builder: `polygon(name, options)` — `options.points` is an array of `[x, y]`; optional `options.uvs` for custom UV mapping when `use_custom_uvs: true`.

### Properties

| Name | Type | Default | Description |
|------|------|--------|------|
| `Points` | Vector2[] | [] | Polygon vertices (counter-clockwise) |
| `Color` | Color | white | Fill color |
| `UseCustomUVs` | boolean | false | Use the `UVs` list instead of auto UV |
| `UVs` | Vector2[] | [] | Custom UV coordinates (same length as `Points`) |
| `MaterialId` | string | "" | Custom material id |

### Methods

| Method | Returns | Description |
|--------|------|------|
| `IsDrawable()` | boolean | Whether the polygon can be triangulated |

---

## UISpriteParticleComponent

Sprite-textured particle effect (extends UI particle base). Builder: `spriteParticle(name, options)`.

### Properties

| Name | Type | Default | Description |
|------|------|--------|------|
| `ParticleType` | UISpriteParticleType | None(0) | Preset id (see enum below) |
| `SpriteRUID` | string | "" | Sprite resource RUID |
| `ApplySpriteColor` | boolean | false | Tint the sprite with `Color` |
| `Color` | Color | (0.5, 0.25, 0.25, 1) | Particle tint |
| `LocalScale` | Vector2 | (1, 1) | Per-particle scale |
| `Loop` | boolean | true | Loop emission |
| `PlayOnEnable` | boolean | true | Auto-play on enable |
| `Prewarm` | boolean | false | Pre-simulate one cycle before showing |
| `PlaySpeed` | float | 1.0 | Animation speed (0-10) |
| `ParticleSize` | float | 1.0 | Per-particle size (0-10) |
| `ParticleSpeed` | float | 1.0 | Per-particle speed (-10..10) |
| `ParticleCount` | float | 1.0 | Emit-count multiplier (0-3) |
| `ParticleLifeTime` | float | 1.0 | Lifetime seconds (1/120..10) |
| `AutoRandomSeed` | boolean | true | Pick a new seed on each emit |
| `RandomSeed` | int32 | 0 | Manual seed when `AutoRandomSeed` is false |

`UISpriteParticleType`: `None=0`, `BurstBig=1`, `SpawnField=2`, `BurstNova=3`, `SimpleSpawn=4`, `Burst=5`, `Stream=6`, `StreamSharp=7`, `AdditiveColor=8`.

---

## AvatarGUIRendererComponent

Renders avatars in UI.

### Properties

| Name | Type | Default | Description |
|------|------|--------|------|
| `Color` | Color | white | Avatar tint |
| `FlipX` | boolean | false | Flip horizontally |
| `FlipY` | boolean | false | Flip vertically |
| `PlayRate` | float | 1.0 | Animation speed |
| `RaycastTarget` | boolean | true | Receive input |

### Methods

| Method | Returns | Description |
|--------|------|------|
| `GetAvatarRootEntity()` | Entity | Avatar root |
| `GetBodyEntity()` | Entity | Body part |
| `GetFaceEntity()` | Entity | Face part |
| `SetAvatarPartColor(category, r, g, b, a)` | void | Change part color |
| `PlayEmotion(EmotionalType type, float duration)` | void | Play emotion |

---

## UILogic

UI coordinate-conversion utility (singleton).

### Properties

| Name | Type | Description |
|------|------|------|
| `ScreenWidth` | int32 | Current screen width |
| `ScreenHeight` | int32 | Current screen height |

### Methods

| Method | Returns | Description |
|--------|------|------|
| `ScreenToUIPosition(Vector2)` | Vector2 | Screen -> UI coords |
| `UIToWorldPosition(Vector2)` | Vector2 | UI -> world coords |
| `ScreenToWorldPosition(Vector2)` | Vector2 | Screen -> world coords |
| `WorldToScreenPosition(Vector2)` | Vector2 | World -> screen coords |
| `LocalUIToWorldPosition(Vector2, UITransformComponent)` | Vector2 | Local UI -> world |
| `ScreenToLocalUIPosition(Vector2, UITransformComponent)` | Vector2 | Screen -> local UI |
| `GetSiblingIndex(UITransformComponent)` | int32 | Get sibling index |
| `SetSiblingIndex(UITransformComponent, int32)` | void | Set sibling index |

---

## WorldUI Sort Fields (Common)

`ButtonComponent`, `TextGUIRendererComponent`, `SliderComponent`, `SpriteGUIRendererComponent`, `ScrollLayoutGroupComponent`, and `TextGUIRendererInputComponent` all expose the same 4-field sorting block. The fields are only meaningful when the parent `UITransformComponent.UIMode` is `World(2)`.

| Name | Type | Default | Description |
|------|------|--------|------|
| `OverrideSorting` | boolean | false | Detach this entity's render order from its UI group (World UI only) |
| `SortingLayer` | string | "UI" | Sorting layer name (World UI only; gated by `OverrideSorting`) |
| `OrderInLayer` | int32 | 0 | Order within the sorting layer (higher draws on top) |
| `IgnoreMapLayerCheck` | boolean | false | Bypass automatic map-layer to sorting-layer remap |

Builder shortcut: pass `world_ui: true` to `sprite()` / `text()` / `button()` / `slider()` / `scrollLayout()` / `textInput()` to set `override_sorting=true` with `sorting_layer="UI"`. Override individual values with `sorting_layer="World"`, `order_in_layer=10`, `ignore_map_layer_check=true`.

---

## Common Types

### Color
`Color(r, g, b, a)` — 0-1 floats. Static factories: `Color.FromHexCode("#RRGGBB[AA]")`, `Color.FromRGBAInt(0xRRGGBBAA)`. Static values: `Color.red`, `Color.white`, `Color.black`, etc.

### TransitionColorSet
`NormalColor`, `HighlightedColor`, `PressedColor`, `SelectedColor`, `DisabledColor`, `ColorMultiplier`, `FadeDuration`

### TransitionRUIDSet
`HighlightedSprite`, `PressedSprite`, `SelectedSprite`, `DisabledSprite`

### DataRef
`{ DataId = "32-char hex" }` -- image resource reference.

### RectOffset
`{ left, right, top, bottom }` -- int32 rectangular margins.

---

## Enums

All values are `int32`. Pass numeric values to builder `patchComponent(...)` or use the enum identifier in `.mlua` runtime code (e.g. `TextAlignmentType.MiddleCenter`).

> **Three "alignment" enums exist — do not confuse them:**
> - **`AlignmentType` (0~15)** — anchor presets for `UITransformComponent.AlignmentOption`. Builder string mapping (`"top-left"` ↔ 4, etc.) is in [`ui-fundamentals.md`](ui-fundamentals.md) §6. Not duplicated here.
> - **`TextAlignmentType` / `ChildAlignmentType` (0~8)** — 9-cell alignment used by `ChildAlignment` / `GridChildAlignment` fields (and legacy `TextComponent.Alignment`). **Different enum from anchors above.**
> - **`TextHorizontalAlignmentOption` + `TextVerticalAlignmentOption`** — separate axis enums used by `TextGUIRendererComponent`. **Different from `TextAlignmentType`.**

### TextHorizontalAlignmentOption -- Horizontal alignment (TextGUIRendererComponent)

Used by `TextGUIRendererComponent.HorizontalAlignment`.

| Name | Value | Description |
|------|---|------|
| Left | 1 | Left-aligned |
| Center | 2 | Center (default) |
| Right | 4 | Right-aligned |
| Justified | 8 | Justified (last line not adjusted) |
| Flush | 16 | Justified (last line also adjusted) |
| Geometry | 32 | Center per-line by geometry |

### TextVerticalAlignmentOption -- Vertical alignment (TextGUIRendererComponent)

Used by `TextGUIRendererComponent.VerticalAlignment`.

| Name | Value | Description |
|------|---|------|
| Top | 256 | Top-aligned |
| Middle | 512 | Middle (default) |
| Bottom | 1024 | Bottom-aligned |
| Baseline | 2048 | First line baseline centered |
| Geometry | 4096 | Full text centered by geometry |
| Capline | 8192 | First line cap-height centered |

### TextOverflowMode -- Text Overflow (TextGUIRendererComponent)

Used by `TextGUIRendererComponent.Overflow`.

| Name | Value | Description |
|------|---|------|
| Overflow | 0 | Show outside the area (default) |
| Ellipsis | 1 | Ellipsis (...) |
| Truncate | 2 | Truncate |
| Page | 3 | Multi-page (use `Page` property) |

### GradientModes -- Color Gradient (TextGUIRendererComponent)

Used by `TextGUIRendererComponent.GradientMode` when `ColorGradient = true`.

| Name | Value | Description |
|------|---|------|
| Single | 0 | Single color (default) |
| Horizontal | 1 | Left to right |
| Vertical | 2 | Top to bottom |
| FourCorners | 3 | All four corners |

---

### TextAlignmentType / ChildAlignmentType -- 9-cell alignment (0~8)

Used by `ChildAlignment` / `GridChildAlignment` fields (and the legacy `TextComponent.Alignment`). Same value mapping for all.

| Name | Value | Description |
|------|---|------|
| UpperLeft | 0 | Top-left |
| UpperCenter | 1 | Top center |
| UpperRight | 2 | Top-right |
| MiddleLeft | 3 | Left middle |
| MiddleCenter | 4 | Center (builder default for `text()`) |
| MiddleRight | 5 | Right middle |
| LowerLeft | 6 | Bottom-left |
| LowerCenter | 7 | Bottom center |
| LowerRight | 8 | Bottom-right |

### FontType -- Font

| Name | Value | Description |
|------|---|------|
| Default | 0 | Default font |
| Maple | 1 | MapleStory font |
| Bazzi | 2 | Bazzi font |
| Football | 3 | Football Gothic font |

### FontStyleType -- Font Style (bit flags, combinable)

| Name | Value | Description |
|------|---|------|
| Normal | 0 | Default |
| Bold | 1 | Bold |
| Italic | 2 | Italic |
| Underline | 4 | Underline |
| LowerCase | 8 | Lowercase |
| UpperCase | 16 | Uppercase |
| SmallCaps | 32 | Small caps |
| Strikethrough | 64 | Strikethrough |

### ImageType -- Image Rendering

Used by `SpriteGUIRendererComponent.Type`.

| Name | Value | Description |
|------|---|------|
| Simple | 0 | Original image |
| Sliced | 1 | 9-slice (corners stay intact when size changes) |
| Tiled | 2 | Tiled repeat |
| Filled | 3 | Partial fill (progress bar) |

### FillMethodType -- Fill Direction (for `ImageType.Filled`)

| Name | Value | Description |
|------|---|------|
| Horizontal | 0 | Horizontal |
| Vertical | 1 | Vertical |
| Radial90 | 2 | 90-degree radial |
| Radial180 | 3 | 180-degree radial |
| Radial360 | 4 | 360-degree radial |

### TransitionType -- Button Transition Effect

| Name | Value | Description |
|------|---|------|
| None | 0 | No effect |
| ColorTint | 1 | Color change |
| SpriteSwap | 2 | Image swap |

### ButtonState

| Name | Value | Description |
|------|---|------|
| Normal | 0 | Default |
| Hover | 1 | Mouse over |
| Pressed | 2 | Pressed |
| Released | 3 | Released |
| Clicked | 4 | Short click |

### LayoutGroupType -- Layout Direction

Used by `ScrollLayoutGroupComponent.Type`.

| Name | Value | Description |
|------|---|------|
| Horizontal | 0 | Horizontal layout |
| Vertical | 1 | Vertical layout |
| Grid | 2 | Grid layout |

### ScrollBarVisibility

| Name | Value | Description |
|------|---|------|
| AlwaysShow | 0 | Always shown |
| AutoHide | 1 | Shown only when scrollable |
| Hide | 2 | Always hidden |

### UITransformAxis

| Name | Value | Description |
|------|---|------|
| Horizontal | 0 | Horizontal axis |
| Vertical | 1 | Vertical axis |

### GridLayoutAxis / GridLayoutConstraint / GridLayoutCorner

`GridLayoutAxis`: `Horizontal=0`, `Vertical=1` (child add direction).
`GridLayoutConstraint`: `Flexible=0`, `FixedColumnCount=1`, `FixedRowCount=2`.
`GridLayoutCorner`: `UpperLeft=0`, `UpperRight=1`, `LowerLeft=2`, `LowerRight=3` (grid start position).

### GridViewFixedType

Used by `GridViewComponent.FixedType`.

| Name | Value | Description |
|------|---|------|
| ColumnCountFixed | 0 | Fixed column count (vertical scroll) |
| RowCountFixed | 1 | Fixed row count (horizontal scroll) |

### UIModeType -- UI Drawing Mode

Used by `UITransformComponent.UIMode`.

| Name | Value | Description |
|------|---|------|
| None | 0 | Initial state |
| Screen | 1 | 2D screen coordinates (HUD/popup/menu — default) |
| World | 2 | World coordinates (nametag, floating damage) |

### UIGroupType -- UI Group Type

Used by `UIGroupComponent.GroupType`.

| Name | Value | Description |
|------|---|------|
| None | 0 | Unused |
| DefaultType | 1 | Default group (HUD layer) |
| UIType | 2 | UI editor group (popup/menu layer) |
| EditorType | 3 | Editor-only group |

### MaskShape

Used by `MaskComponent.Shape`.

| Name | Value | Description |
|------|---|------|
| Rect | 0 | Rectangle |
| Circle | 1 | Circle |

### GradientModes

| Name | Value | Description |
|------|---|------|
| Single | 0 | Single color |
| Horizontal | 1 | Horizontal gradient |
| Vertical | 2 | Vertical gradient |
| FourCorners | 3 | Four-corner gradient |

### HorizontalScrollBarDirection / VerticalScrollBarDirection

`HorizontalScrollBarDirection`: `LeftToRight=0`, `RightToLeft=1`.
`VerticalScrollBarDirection`: `BottomToTop=2`, `TopToBottom=3`.

### UIAreaParticleType / UIBasicParticleType

UI particle preset enums. The builder handles preset names directly — pass numeric `particle_type=...` to `areaParticle()` / `basicParticle()`. Full numeric tables live in [`../../msw-general/references/builder-protocol.md`](../../msw-general/references/builder-protocol.md) §3.5. From runtime, use the enum identifiers (`UIAreaParticleType.FogCalm`, `UIBasicParticleType.Firework`).
