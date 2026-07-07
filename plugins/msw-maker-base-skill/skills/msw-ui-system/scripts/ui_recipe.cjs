"use strict";

const fs = require("fs");
const path = require("path");
const { UIBuilder } = require("./msw_ui_builder.cjs");

function recipeHud(groupName) {
  const b = new UIBuilder(groupName, 1, true);
  b.panel("ScoreBox", { anchor: "top-left", pos: [110, -40], rect_size: [200, 60] });
  b.text("ScoreBox/Label", "Score", { size: 24, color: "#FFFFFF", anchor: "middle-left", pos: [-80, 0], rect_size: [140, 40] });
  b.patchComponent("ScoreBox/Label", "MOD.Core.TextGUIRendererComponent", { HorizontalAlignment: 1, VerticalAlignment: 512 });
  b.text("ScoreBox/Value", "0", { size: 40, color: "#FFD700", bold: true, anchor: "middle-right", pos: [80, 0], rect_size: [140, 50] });
  b.patchComponent("ScoreBox/Value", "MOD.Core.TextGUIRendererComponent", { HorizontalAlignment: 4, VerticalAlignment: 512 });
  b.panel("MiniMap", { anchor: "top-right", pos: [-110, -110], rect_size: [180, 180] });
  b.sprite("MiniMap/Frame", { anchor: "stretch", color: "#FFFFFF", alpha: 0.3 });
  b.panel("HPBar", { anchor: "bottom-left", pos: [120, 50], rect_size: [220, 30] });
  b.sprite("HPBar/Bg", { anchor: "stretch", color: "#1A1A1A", alpha: 0.8 });
  // Sliced HP fill anchored to the left edge; runtime resizes its width.
  b.sprite("HPBar/Fill", { anchor: "middle-left", pos: [0, 0], rect_size: [220, 30], pivot: [0, 0.5], image_ruid: "f0911af597259044aa624a11332c0595", color: "#E53935", alpha: 1.0 });
  return b;
}

function recipePopup(groupName) {
  const b = new UIBuilder(groupName, 10, false);
  b.sprite("Dimmer", { anchor: "stretch", color: "#000000", alpha: 0.6 });
  b.patchComponent("Dimmer", "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: true });
  b.panel("Panel", { anchor: "middle-center", rect_size: [600, 400] });
  b.sprite("Panel/Bg", { anchor: "stretch", color: "#2C2C2C" });
  // TextGUIRendererComponent defaults to Center + Middle, so no explicit alignment patch is needed.
  b.text("Panel/Title", "Confirm", { size: 48, color: "#FFFFFF", bold: true, anchor: "top-center", pos: [0, -50], rect_size: [560, 60] });
  b.text("Panel/Message", "Are you sure?", { size: 28, color: "#DDDDDD", anchor: "middle-center", pos: [0, 20], rect_size: [520, 160] });
  b.button("Panel/BtnOk", "OK", { rect_size: [200, 88], pos: [-110, -140], anchor: "bottom-center", font_size: 28 });
  b.button("Panel/BtnCancel", "Cancel", { rect_size: [200, 88], pos: [110, -140], anchor: "bottom-center", font_size: 28 });
  return b;
}

function recipeToast(groupName) {
  const b = new UIBuilder(groupName, 20, false);
  b.panel("Toast", { anchor: "bottom-center", pos: [0, 140], rect_size: [600, 80] });
  b.sprite("Toast/Bg", { anchor: "stretch", color: "#1E1E1E", alpha: 0.9 });
  b.text("Toast/Message", "", { size: 28, color: "#FFFFFF", anchor: "stretch" }); // centered by default
  return b;
}

function recipeMenu(groupName) {
  const b = new UIBuilder(groupName, 5, false);
  b.sprite("Dimmer", { anchor: "stretch", color: "#000000", alpha: 0.7 });
  b.patchComponent("Dimmer", "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: true });
  b.panel("TopTabs", { anchor: "top-center", pos: [0, -60], rect_size: [1200, 80] });
  b.sprite("TopTabs/Bg", { anchor: "stretch", color: "#1A1A1A" });
  ["Character", "Inventory", "Settings"].forEach((name, i) => {
    b.button(`TopTabs/Tab${i}`, name, { rect_size: [380, 88], pos: [-400 + i * 400, 0], font_size: 24 });
  });
  for (let i = 0; i < 3; i += 1) b.panel(`Content${i}`, { anchor: "middle-center", pos: [0, -40], rect_size: [1400, 800], enable: i === 0 });
  return b;
}

function recipeInventory(groupName) {
  const b = new UIBuilder(groupName, 7, false);
  b.sprite("Dimmer", { anchor: "stretch", color: "#000000", alpha: 0.7 });
  b.patchComponent("Dimmer", "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: true });
  b.panel("Window", { anchor: "middle-center", rect_size: [900, 700] });
  b.sprite("Window/Bg", { anchor: "stretch", color: "#2C2C2C" });
  b.text("Window/Title", "Inventory", { size: 36, color: "#FFFFFF", bold: true, anchor: "top-center", pos: [0, -40], rect_size: [800, 50] }); // centered by default
  b.button("Window/BtnClose", "X", { rect_size: [100, 100], pos: [-70, -70], anchor: "top-right", font_size: 24 });
  b.panel("Window/ItemTemplate", { anchor: "top-left", pos: [50, -50], rect_size: [80, 80], enable: false });
  b.sprite("Window/ItemTemplate/Frame", { anchor: "stretch", color: "#FFFFFF", alpha: 0.2 });
  b.sprite("Window/ItemTemplate/Icon", { anchor: "middle-center", rect_size: [64, 64] });
  b.text("Window/ItemTemplate/Count", "", { size: 20, color: "#FFFFFF", anchor: "bottom-right", pos: [-28, 20], rect_size: [40, 24] });
  b.patchComponent("Window/ItemTemplate/Count", "MOD.Core.TextGUIRendererComponent", { HorizontalAlignment: 4, VerticalAlignment: 512 });
  b.panel("Window/Grid", { anchor: "stretch" });
  b.patchComponent("Window/Grid", "MOD.Core.UITransformComponent", { OffsetMin: { x: 50, y: 50 }, OffsetMax: { x: -50, y: -100 } });
  b.addComponent("Window/Grid", "MOD.Core.GridViewComponent", { CellSize: { x: 90, y: 90 }, FixedCount: 8, FixedType: 0, Spacing: { x: 6, y: 6 }, UseScroll: true, TotalCount: 0 });
  return b;
}

function recipeChat(groupName) {
  const b = new UIBuilder(groupName, 4, true);
  b.panel("ChatBox", { anchor: "bottom-left", pos: [220, 220], rect_size: [400, 300] });
  b.sprite("ChatBox/Bg", { anchor: "stretch", color: "#000000", alpha: 0.5 });
  b.panel("ChatBox/List", { anchor: "stretch" });
  b.patchComponent("ChatBox/List", "MOD.Core.UITransformComponent", { OffsetMin: { x: 10, y: 50 }, OffsetMax: { x: -10, y: -10 } });
  b.addComponent("ChatBox/List", "MOD.Core.ScrollLayoutGroupComponent", { Type: 1, Spacing: 6 });
  b.addComponent("ChatBox/List", "MOD.Core.MaskComponent", { Shape: 0 });
  b.panel("ChatBox/InputArea", { anchor: "bottom-center", pos: [0, 20], rect_size: [380, 40] });
  b.sprite("ChatBox/InputArea/Bg", { anchor: "stretch", color: "#222222" });
  b.textInput("ChatBox/InputArea/Text", { anchor: "stretch", color: "#FFFFFF", font_size: 20, placeholder: "Type here...", line_type: 0, auto_clear: true, alpha: 0 });
  b.patchComponent("ChatBox/InputArea/Text", "MOD.Core.TextGUIRendererComponent", { HorizontalAlignment: 1 });
  return b;
}

function recipeSettings(groupName) {
  const b = new UIBuilder(groupName, 7, false);
  b.sprite("Dimmer", { anchor: "stretch", color: "#000000", alpha: 0.7 });
  b.patchComponent("Dimmer", "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: true });
  b.panel("Window", { anchor: "middle-center", rect_size: [700, 600] });
  b.sprite("Window/Bg", { anchor: "stretch", color: "#2C2C2C" });
  b.text("Window/Title", "Settings", { size: 36, bold: true, anchor: "top-center", pos: [0, -40], rect_size: [600, 50] }); // centered by default
  [["BGMVol", "BGM Volume", 0, 1, 0.8], ["SFXVol", "SFX Volume", 0, 1, 1.0], ["UIScale", "UI Scale", 0.8, 1.5, 1.0]].forEach(([, label, minVal, maxVal, val], i) => {
    const y = -140 - i * 100;
    b.panel(`Window/Row${i}`, { anchor: "top-center", pos: [0, y], rect_size: [600, 80] });
    b.text(`Window/Row${i}/Label`, label, { size: 24, anchor: "middle-left", pos: [120, 0], rect_size: [180, 40] });
    b.patchComponent(`Window/Row${i}/Label`, "MOD.Core.TextGUIRendererComponent", { HorizontalAlignment: 1, VerticalAlignment: 512 });
    b.slider(`Window/Row${i}/Slider`, { min_val: minVal, max_val: maxVal, value: val, anchor: "middle-right", pos: [-160, 0], rect_size: [320, 30] });
    b.text(`Window/Row${i}/Value`, val.toFixed(2), { size: 22, anchor: "middle-right", pos: [-60, 0], rect_size: [80, 40] });
    b.patchComponent(`Window/Row${i}/Value`, "MOD.Core.TextGUIRendererComponent", { HorizontalAlignment: 4, VerticalAlignment: 512 });
  });
  b.button("Window/BtnClose", "Close", { rect_size: [220, 88], anchor: "bottom-center", pos: [0, 60], font_size: 26 });
  return b;
}

const RECIPES = {
  hud: recipeHud,
  popup: recipePopup,
  toast: recipeToast,
  menu: recipeMenu,
  inventory: recipeInventory,
  chat: recipeChat,
  settings: recipeSettings,
};

const RECIPE_DESCRIPTIONS = {
  hud: "Score + Minimap + HP bar (DefaultGroup, always-on HUD)",
  popup: "Modal dialog: Title + Message + OK/Cancel (dimmed background)",
  toast: "Bottom auto-hide notification bar",
  menu: "Top-tab menu with 3 tabs (dimmed background)",
  inventory: "Grid-virtualized item window with close button",
  chat: "Bottom-left scroll log + text input (ScrollLayoutGroup)",
  settings: "3-slider settings window (BGM / SFX / UI Scale)",
};

function manifest(builder) {
  return builder.entities.map((e) => {
    const js = e.jsonString || {};
    return {
      path: js.path || "",
      entity_id: e.id || "",
      components: (js["@components"] || []).map((c) => ({ "@type": c["@type"], id: c.id })),
    };
  });
}

function suggestProperties(recipe) {
  const map = {
    popup: [
      ["popupGroup", "/ui/{GROUP}/Panel", "Entity"],
      ["title", "/ui/{GROUP}/Panel/Title", "TextGUIRendererComponent"],
      ["message", "/ui/{GROUP}/Panel/Message", "TextGUIRendererComponent"],
      ["btnOk", "/ui/{GROUP}/Panel/BtnOk", "ButtonComponent"],
      ["btnCancel", "/ui/{GROUP}/Panel/BtnCancel", "ButtonComponent"],
    ],
    toast: [["toastGroup", "/ui/{GROUP}/Toast", "Entity"], ["message", "/ui/{GROUP}/Toast/Message", "TextGUIRendererComponent"]],
    hud: [["scoreValue", "/ui/{GROUP}/ScoreBox/Value", "TextGUIRendererComponent"], ["hpFillTransform", "/ui/{GROUP}/HPBar/Fill", "UITransformComponent"], ["hpFill", "/ui/{GROUP}/HPBar/Fill", "SpriteGUIRendererComponent"]],
    inventory: [["invGroup", "/ui/{GROUP}/Window", "Entity"], ["grid", "/ui/{GROUP}/Window/Grid", "GridViewComponent"], ["itemTemplate", "/ui/{GROUP}/Window/ItemTemplate", "Entity"], ["btnClose", "/ui/{GROUP}/Window/BtnClose", "ButtonComponent"]],
    menu: [["menuRoot", "/ui/{GROUP}", "Entity"], ["tab0", "/ui/{GROUP}/TopTabs/Tab0", "ButtonComponent"], ["tab1", "/ui/{GROUP}/TopTabs/Tab1", "ButtonComponent"], ["tab2", "/ui/{GROUP}/TopTabs/Tab2", "ButtonComponent"], ["content0", "/ui/{GROUP}/Content0", "Entity"], ["content1", "/ui/{GROUP}/Content1", "Entity"], ["content2", "/ui/{GROUP}/Content2", "Entity"]],
    chat: [["chatBox", "/ui/{GROUP}/ChatBox", "Entity"], ["list", "/ui/{GROUP}/ChatBox/List", "ScrollLayoutGroupComponent"], ["inputText", "/ui/{GROUP}/ChatBox/InputArea/Text", "TextGUIRendererInputComponent"]],
    settings: [["settingsGroup", "/ui/{GROUP}/Window", "Entity"], ["bgmSlider", "/ui/{GROUP}/Window/Row0/Slider", "SliderComponent"], ["sfxSlider", "/ui/{GROUP}/Window/Row1/Slider", "SliderComponent"], ["uiScaleSlider", "/ui/{GROUP}/Window/Row2/Slider", "SliderComponent"], ["btnClose", "/ui/{GROUP}/Window/BtnClose", "ButtonComponent"]],
  };
  return (map[recipe] || []).map(([name, propertyPath, type]) => ({ name, path: propertyPath, type }));
}

function parseArgs(argv) {
  const args = { recipe: null, output: null, groupName: null, list: false, manifestJson: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--list") args.list = true;
    else if (arg === "--manifest-json") args.manifestJson = true;
    else if (arg === "--group-name") {
      i += 1;
      args.groupName = argv[i];
    } else if (arg.startsWith("--group-name=")) args.groupName = arg.slice("--group-name=".length);
    else if (!args.recipe) args.recipe = arg;
    else if (!args.output) args.output = arg;
    else throw new Error(`Unexpected argument: ${arg}`);
  }
  if (args.list) return args;
  if (!args.recipe || !args.output) throw new Error(`Usage: node ui_recipe.cjs <recipe> <output_path> [--group-name NAME]\nRecipes: ${Object.keys(RECIPES).join(", ")}`);
  if (!RECIPES[args.recipe]) throw new Error(`Unknown recipe '${args.recipe}'. Use one of: ${Object.keys(RECIPES).join(", ")}`);
  return args;
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.list) {
    Object.entries(RECIPE_DESCRIPTIONS).forEach(([name, desc]) => console.log(`  ${name.padEnd(10)}  ${desc}`));
    return 0;
  }

  const group = args.groupName || path.basename(args.output, path.extname(args.output));
  const builder = RECIPES[args.recipe](group);
  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  builder.write(args.output);

  const suggestions = suggestProperties(args.recipe);
  const rows = manifest(builder);
  if (args.manifestJson) {
    console.log(JSON.stringify({
      recipe: args.recipe,
      group,
      output: args.output,
      entities: rows,
      suggested_properties: suggestions.map((s) => ({ ...s, path: s.path.replace("{GROUP}", group) })),
    }, null, 2));
    return 0;
  }

  console.log(`\nRecipe '${args.recipe}' written to ${args.output}`);
  console.log(`  GroupName: ${group}`);
  console.log(`  Entities : ${rows.length}`);
  if (suggestions.length) {
    console.log("\nSuggested .mlua properties for binding:");
    suggestions.forEach((s) => console.log(`  property ${s.type.padEnd(35)} ${s.name.padEnd(18)} = "..."   -- ${s.path.replace("{GROUP}", group)}`));
  }
  console.log("\nNext steps:");
  console.log("  1. Create/update paired .mlua with the properties above");
  console.log("  2. Inject UUIDs via b.write(bind=...) or b.injectBindings(...)");
  console.log("  3. Run ui_lint.cjs on the output");
  console.log("  4. Maker Refresh (MCP) to apply");
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    process.exitCode = 2;
  }
}

module.exports = { RECIPES, RECIPE_DESCRIPTIONS, suggestProperties, manifest, main };
