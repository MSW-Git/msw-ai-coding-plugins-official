# Layout Recipes

A collection of layout templates based on this skill's CJS UIBuilder (`scripts/msw_ui_builder.cjs`; see [`../../msw-general/references/builder-protocol.md`](../../msw-general/references/builder-protocol.md) §3 for the call protocol — unified entry point).

Each recipe is copy-ready from file creation to placement. In actual use, change only path / size / color / RUID values to match your project.

---

## Common Preparation

```javascript
const { UIBuilder } = require("./scripts/msw_ui_builder.cjs");
```

- Coordinates: center origin, 1920x1080, Y-axis positive upward
- Default pivot: anchor-matched when omitted (`top-left` -> `[0, 1]`, `middle-center` -> `[0.5, 0.5]`)
- Edge formula with omitted pivot: `pos = [margin, margin]` with signs based on the anchor side

---

## Recipe 1 — Basic HUD (Top-Left Score, Top-Right Minimap, Bottom-Left HP)

```javascript
const b = new UIBuilder("DefaultGroup", 1, true);

b.panel("ScoreBox", { anchor: "top-left", pos: [20, -20], rect_size: [200, 60] });
b.text("ScoreBox/Label", "Score", {
  size: 24,
  color: "#FFFFFF",
  anchor: "middle-left",
  pos: [16, 0],
  alignment: 3,
});
b.text("ScoreBox/Value", "0", {
  size: 40,
  color: "#FFD700",
  bold: true,
  anchor: "middle-right",
  pos: [-16, 0],
  alignment: 5,
});

b.panel("MiniMap", { anchor: "top-right", pos: [-20, -20], rect_size: [180, 180] });
b.sprite("MiniMap/Frame", { anchor: "stretch", image_ruid: "<minimap-frame-ruid>" });

b.panel("HPBar", { anchor: "bottom-left", pos: [20, 20], rect_size: [220, 30] });
b.sprite("HPBar/Bg", { anchor: "stretch", color: "#1A1A1A", alpha: 0.8 });
// Sliced fill: anchored to the left edge (pivot [0, 0.5]); runtime drives the
// width, not FillAmount or SliderComponent, so the 9-slice borders stay crisp.
b.sprite("HPBar/Fill", { anchor: "middle-left", pos: [0, 0], rect_size: [220, 30], pivot: [0, 0.5], image_ruid: "f0911af597259044aa624a11332c0595", color: "#E53935", alpha: 1.0 });

b.write("ui/DefaultGroup.ui");
```

### HP Update at Runtime

See [`runtime-patterns.md`](runtime-patterns.md) §3 HP Bar (Progress Bar). Key point: use the HP gauge slice sprite (`image_ruid = "f0911af597259044aa624a11332c0595"`) and resize the Sliced fill's width — `self.fillTransform.RectSize = Vector2(fullWidth * hp / maxHp, h)` — rather than setting `FillAmount` or driving a `SliderComponent`. Property binding is auto-injected via `b.write(path, { bind: {...} })`.

---

## Recipe 2 — Modal Confirmation Popup (Title + Message + OK/Cancel)

```javascript
const b = new UIBuilder("PopupGroup", 10, false);

b.sprite("Dimmer", { anchor: "stretch", color: "#000000", alpha: 0.6, raycast: true });
b.panel("Panel", { anchor: "middle-center", pos: [0, 0], rect_size: [600, 400] });
b.sprite("Panel/Bg", { anchor: "stretch", color: "#2C2C2C" });
b.text("Panel/Title", "Confirm", {
  size: 48,
  color: "#FFFFFF",
  bold: true,
  anchor: "top-center",
  pos: [0, -50],
  rect_size: [560, 60],
  alignment: 4,
});
b.text("Panel/Message", "Are you sure?", {
  size: 28,
  color: "#DDDDDD",
  anchor: "middle-center",
  pos: [0, 20],
  rect_size: [520, 160],
  alignment: 4,
});
b.button("Panel/BtnOk", "OK", {
  rect_size: [180, 60],
  pos: [-110, 40],
  anchor: "bottom-center",
  font_size: 28,
});
b.button("Panel/BtnCancel", "Cancel", {
  rect_size: [180, 60],
  pos: [110, 40],
  anchor: "bottom-center",
  font_size: 28,
});

b.write("ui/PopupGroup.ui", {
  bind: {
    mlua: "RootDesk/MyDesk/UIPopup.mlua",
    props: {
      popupGroup: "Panel",
      btnOk: "Panel/BtnOk",
      btnCancel: "Panel/BtnCancel",
      message: "Panel/Message",
    },
  },
});
```

---

## Recipe 3 — Toast (Auto-Dismissing Notification)

```javascript
const b = new UIBuilder("ToastGroup", 20, false);

b.panel("Toast", { anchor: "bottom-center", pos: [0, 140], rect_size: [600, 80] });
b.sprite("Toast/Bg", { anchor: "stretch", color: "#1E1E1E", alpha: 0.9 });
b.text("Toast/Message", "", { size: 28, color: "#FFFFFF", anchor: "stretch", alignment: 4 });

b.write("ui/ToastGroup.ui");
```

For the mlua-side logic, use the Toast pattern from [`runtime-patterns.md`](runtime-patterns.md).

---

## Recipe 4 — Top Menu Bar (3 Tabs)

```javascript
const b = new UIBuilder("MenuGroup", 5, false);

b.sprite("Dimmer", { anchor: "stretch", color: "#000000", alpha: 0.7, raycast: true });
b.panel("TopTabs", { anchor: "top-center", pos: [0, -60], rect_size: [1200, 80] });
b.sprite("TopTabs/Bg", { anchor: "stretch", color: "#1A1A1A" });

["Character", "Inventory", "Settings"].forEach((name, i) => {
  const x = -400 + i * 400;
  b.button(`TopTabs/Tab${i}`, name, { rect_size: [380, 70], pos: [x, 0], font_size: 24 });
  b.panel(`Content${i}`, { anchor: "middle-center", pos: [0, -40], rect_size: [1400, 800] });
});

b.write("ui/MenuGroup.ui");
```

Tab switching logic in mlua: `for i, content in ipairs(self.contents) do content.Enable = (i == activeIdx) end`.

---

## Recipe 5 — Inventory Grid (GridView Virtualization)

```javascript
const b = new UIBuilder("InventoryGroup", 7, false);

b.sprite("Dimmer", { anchor: "stretch", color: "#000000", alpha: 0.7, raycast: true });
b.panel("Window", { anchor: "middle-center", pos: [0, 0], rect_size: [900, 700] });
b.sprite("Window/Bg", { anchor: "stretch", color: "#2C2C2C" });
b.text("Window/Title", "Inventory", {
  size: 36,
  color: "#FFFFFF",
  bold: true,
  anchor: "top-center",
  pos: [0, -40],
  rect_size: [800, 50],
  alignment: 4,
});
b.button("Window/BtnClose", "X", {
  rect_size: [50, 50],
  pos: [-30, -30],
  anchor: "top-right",
  font_size: 24,
});

b.panel("Window/ItemTemplate", { anchor: "top-left", pos: [50, -50], rect_size: [80, 80] });
b.sprite("Window/ItemTemplate/Frame", { anchor: "stretch", image_ruid: "<slot-frame-ruid>" });
b.sprite("Window/ItemTemplate/Icon", { anchor: "middle-center", rect_size: [64, 64] });
b.text("Window/ItemTemplate/Count", "", {
  size: 20,
  color: "#FFFFFF",
  anchor: "bottom-right",
  pos: [-8, 8],
  rect_size: [40, 24],
  alignment: 5,
});
b.patch("Window/ItemTemplate", { enable: false });

b.panel("Window/Grid", { anchor: "stretch", rect_size: [800, 560] });
b.patchComponent("Window/Grid", "MOD.Core.UITransformComponent", {
  OffsetMin: { x: 50, y: 50 },
  OffsetMax: { x: -50, y: -100 },
});
b.addComponent("Window/Grid", "MOD.Core.GridViewComponent", {
  CellSize: { x: 90, y: 90 },
  FixedCount: 8,
  FixedType: 0,
  Spacing: { x: 6, y: 6 },
  UseScroll: true,
});

b.write("ui/InventoryGroup.ui");
```

### OnRefresh Callback (Runtime)

See [`runtime-patterns.md`](runtime-patterns.md) §5 GridView Large List. Property binding injects two items — `grid` / `itemTemplate` — via `b.write(path, { bind: {...} })`.

> **Caution**: `OnRefresh` is called frequently during scrolling. Do not call DataStorage; only query the in-memory cache.

---

## Recipe 6 — Scroll Chat/Log (ScrollLayoutGroup, Small Scale)

```javascript
const b = new UIBuilder("ChatGroup", 4, true);

b.panel("ChatBox", { anchor: "bottom-left", pos: [220, 220], rect_size: [400, 300] });
b.sprite("ChatBox/Bg", { anchor: "stretch", color: "#000000", alpha: 0.5 });
b.panel("ChatBox/List", { anchor: "stretch" });
b.patchComponent("ChatBox/List", "MOD.Core.UITransformComponent", {
  OffsetMin: { x: 10, y: 50 },
  OffsetMax: { x: -10, y: -10 },
});
b.addComponent("ChatBox/List", "MOD.Core.ScrollLayoutGroupComponent", {
  Type: 1,
  Spacing: 6,
  ScrollBarVisible: 1,
});
b.addComponent("ChatBox/List", "MOD.Core.MaskComponent", { Shape: 0 });

b.panel("ChatBox/InputArea", { anchor: "bottom-center", pos: [0, 20], rect_size: [380, 40] });
b.sprite("ChatBox/InputArea/Bg", { anchor: "stretch", color: "#222222" });
b.text("ChatBox/InputArea/Text", "", { size: 20, color: "#FFFFFF", anchor: "stretch", alignment: 3 });
b.addComponent("ChatBox/InputArea/Text", "MOD.Core.TextGUIRendererInputComponent", {
  PlaceHolder: "Type here...",
  LineType: 0,
  AutoClear: true,
});

b.write("ui/ChatGroup.ui");
```

Adding messages at runtime: Create Text entities as children of List via SpawnService; ScrollLayoutGroup auto-arranges them. Pin scroll to bottom: `layoutGroup:SetScrollNormalizedPosition(1, 0)`.

---

## Recipe 7 — Settings Slider List

```javascript
const b = new UIBuilder("SettingsGroup", 7, false);

b.sprite("Dimmer", { anchor: "stretch", color: "#000000", alpha: 0.7, raycast: true });
b.panel("Window", { anchor: "middle-center", rect_size: [700, 600] });
b.sprite("Window/Bg", { anchor: "stretch", color: "#2C2C2C" });
b.text("Window/Title", "Settings", {
  size: 36,
  bold: true,
  anchor: "top-center",
  pos: [0, -40],
  rect_size: [600, 50],
  alignment: 4,
});

[
  ["BGMVol", "BGM Volume", 0, 1, 0.8],
  ["SFXVol", "SFX Volume", 0, 1, 1.0],
  ["UIScale", "UI Scale", 0.8, 1.5, 1.0],
].forEach(([key, label, minValue, maxValue, value], i) => {
  const y = -140 - i * 100;
  b.panel(`Window/Row${i}`, { anchor: "top-center", pos: [0, y], rect_size: [600, 80] });
  b.text(`Window/Row${i}/Label`, label, {
    size: 24,
    anchor: "middle-left",
    pos: [20, 0],
    rect_size: [180, 40],
    alignment: 3,
  });
  b.slider(`Window/Row${i}/Slider`, {
    min_val: minValue,
    max_val: maxValue,
    value,
    anchor: "middle-right",
    pos: [-120, 0],
    rect_size: [320, 30],
  });
  b.text(`Window/Row${i}/Value`, value.toFixed(2), {
    size: 22,
    anchor: "middle-right",
    pos: [-20, 0],
    rect_size: [80, 40],
    alignment: 5,
  });
});

b.button("Window/BtnClose", "Close", {
  rect_size: [200, 60],
  anchor: "bottom-center",
  pos: [0, 40],
  font_size: 26,
});

b.write("ui/SettingsGroup.ui");
```

---

## Recipe 8 — Card-Like Clickable Tile

Use one `b.button(...)` entity when a repeated tile needs background, label, and click handling. This avoids separate sprite/text entities for every tile.

```javascript
const b = new UIBuilder("BoardGroup", 3, true);

for (let i = 0; i < 12; i += 1) {
  const x = -330 + (i % 6) * 132;
  const y = 120 - Math.floor(i / 6) * 160;
  b.button(`Tile_${i}`, "", {
    rect_size: [104, 144],
    pos: [x, y],
    anchor: "middle-center",
    font_size: 30,
    color: "#FFFFFF",
  });
  b.patchComponent(`Tile_${i}`, "MOD.Core.SpriteGUIRendererComponent", {
    Color: { r: 0.05, g: 0.12, b: 0.28, a: 1.0 },
  });
}

b.write("ui/BoardGroup.ui");
```

Runtime update pattern:

```lua
method void SetTileFace(TextGUIRendererComponent label, SpriteGUIRendererComponent sprite, string text, boolean faceUp)
    if faceUp then
        sprite.Color = Color(1, 1, 1, 1)
        label.Text = text
    else
        sprite.Color = Color(0.05, 0.12, 0.28, 1)
        label.Text = ""
    end
end
```

Use this for card games, board cells, inventory slots, quick slots, tabs, and same-shape menu items.

---

## Recipe 9 — Stat / Info Panel (Nested Rows)

Use this when the UI is a sheet of labeled rows. Each row is a parent-local unit; small labels that belong directly on a chip/cell use `sprite(..., { text })` instead of a separate overlay text entity.

```javascript
const b = new UIBuilder("CharacterStat", 20, false);

b.sprite("Dimmer", { anchor: "stretch", color: "#000000", alpha: 0.6, raycast: true });
b.sprite("Window", { anchor: "middle-center", rect_size: [620, 720], image_ruid: "<window-ruid>" });
b.sprite("Window/Title", {
  anchor: "top-center",
  pos: [0, -28],
  rect_size: [560, 60],
  image_ruid: "<title-ruid>",
  text: "CHARACTER STAT",
  text_size: 30,
  text_bold: true,
  text_alignment: 4,
});
b.button("Window/BtnClose", "", { anchor: "top-right", pos: [-28, -28], rect_size: [88, 88], image_ruid: "<close-ruid>" });

[
  ["Name", "Player"],
  ["Level", "2"],
  ["HP", "63 / 63"],
  ["MP", "37 / 37"],
].forEach(([label, value], i) => {
  const y = 250 - i * 62;
  b.panel(`Window/Row${i}`, { anchor: "top-center", pos: [0, y], rect_size: [560, 52] });
  b.sprite(`Window/Row${i}/Chip`, {
    anchor: "middle-left",
    pos: [10, 0],
    rect_size: [120, 42],
    image_ruid: "<chip-ruid>",
    text: label,
    text_size: 22,
    text_alignment: 4,
    text_color: "#33334D",
  });
  b.sprite(`Window/Row${i}/Cell`, {
    anchor: "middle-right",
    pos: [-10, 0],
    rect_size: [400, 42],
    image_ruid: "<cell-ruid>",
    text: value,
    text_size: 22,
    text_alignment: 3,
    text_color: "#F4F4F8",
  });
});

b.write("ui/CharacterStat.ui");
```

Pass criteria: no `L025` orphan parent, no `L029` nested UIGroup, no `L030` root-level text-over-box warning.

---

## Recipe Selection Guide

| Request Keyword | Recipe |
|-----------|-------|
| Score / HP / Minimap / Always-on info | Recipe 1 (HUD) |
| Confirm / Yes/No / Warning | Recipe 2 (Modal Popup) |
| Acquisition / Notification / Result | Recipe 3 (Toast) |
| Tab menu / Top navigation | Recipe 4 (Tabbed Menu) |
| Inventory / Shop / Equipment window / Many slots | Recipe 5 (GridView) |
| Chat / Log / Small list | Recipe 6 (ScrollLayoutGroup) |
| Settings / Volume / Scale | Recipe 7 (Slider List) |
| Card / tile / slot / repeated clickable cell | Recipe 8 (Card-Like Clickable Tile) |
| Stat sheet / info panel / labeled rows / status window | Recipe 9 (Stat / Info Panel) |

---

## Common Finishing Steps

After running any recipe:

1. **Binding Injection** — Auto-inject entity UUIDs into the corresponding `.mlua` property defaults via `b.write(filepath, { bind: { mlua, props } })` or `b.injectBindings(mlua_path, props)`. See [`../../msw-general/references/builder-protocol.md`](../../msw-general/references/builder-protocol.md) §3.6 Binding Injection for details.
2. **Preview Check** — Visualize the layout with `scripts/preview_ui_layout.cjs`
3. **Maker Refresh** — Reflect changes in the engine via MCP refresh
4. **Play Mode Verification** — Verify on actual resolution and mobile scale

Snapshot:

```javascript
UIBuilder.snapshot("ui/PopupGroup.ui");   // Backup right before write
```
