"use strict";

const fs = require("fs");
const path = require("path");

const CANVAS_W = 1920;
const CANVAS_H = 1080;
const GRID_W = 96;
const GRID_H = 32;
const MSW_CORE_UI = { x: 800, y: 440, w: 160, h: 100, label: "[MSW UI]" };

const ANCHOR_NAMES = new Map([
  ["0,0,1,1", "stretch"],
  ["0.5,0.5,0.5,0.5", "mid-ctr"],
  ["0.5,1,0.5,1", "top-ctr"],
  ["0,1,0,1", "top-L"],
  ["1,1,1,1", "top-R"],
  ["0.5,0,0.5,0", "bot-ctr"],
  ["0,0,0,0", "bot-L"],
  ["1,0,1,0", "bot-R"],
]);

function num(value, fallback = 0) {
  return Number(value ?? fallback);
}

function parseUiFile(filepath) {
  const data = JSON.parse(fs.readFileSync(filepath, "utf8"));
  const entities = data.ContentProto.Entities;
  const entityMap = new Map();

  for (const e of entities) {
    const js = typeof e.jsonString === "string" ? JSON.parse(e.jsonString) : e.jsonString;
    const entityPath = js.path || "";
    const name = js.name;
    const enabled = js.enable ?? true;
    const comps = js["@components"] || [];
    const ut = comps.find((c) => c["@type"] === "MOD.Core.UITransformComponent");
    if (!ut) continue;

    const amin = ut.AnchorsMin || {};
    const amax = ut.AnchorsMax || {};
    const pos = ut.anchoredPosition || {};
    const rect = ut.RectSize || {};
    const aminX = num(amin.x, 0.5);
    const aminY = num(amin.y, 0.5);
    const amaxX = num(amax.x, 0.5);
    const amaxY = num(amax.y, 0.5);
    const px = num(pos.x);
    const py = num(pos.y);
    const rw = num(rect.x);
    const rh = num(rect.y);
    const anchorName = ANCHOR_NAMES.get([aminX, aminY, amaxX, amaxY].join(",")) || "custom";
    const compTypes = comps.map((c) => c["@type"] || "");
    const hasText = compTypes.some((t) => t.includes("TextComponent") || t.includes("TextGUIRendererComponent"));
    const hasBtn = compTypes.some((t) => t.includes("ButtonComponent"));
    const hasSprite = compTypes.some((t) => t.includes("SpriteGUIRenderer"));
    const hasScript = compTypes.some((t) => t.includes("script."));
    const tc = comps.find((c) => c["@type"] === "MOD.Core.TextGUIRendererComponent" || c["@type"] === "MOD.Core.TextComponent") || {};
    const kind = hasScript ? "script" : hasBtn ? "btn" : hasText ? "text" : hasSprite ? "sprite" : "panel";

    entityMap.set(entityPath, {
      name, path: entityPath, enabled, anchorName, aminX, aminY, amaxX, amaxY,
      px, py, rw, rh, kind, text: tc.Text || "", fontSize: num(tc.FontSize),
    });
  }

  const worldCache = new Map();
  function getWorldPos(entityPath) {
    if (worldCache.has(entityPath)) return worldCache.get(entityPath);
    const info = entityMap.get(entityPath);
    if (!info) {
      worldCache.set(entityPath, [0, 0]);
      return [0, 0];
    }
    const idx = entityPath.lastIndexOf("/");
    const parentPath = idx >= 0 ? entityPath.slice(0, idx) : "";
    const parentInfo = entityMap.get(parentPath);
    const isStretch = info.aminX === 0 && info.aminY === 0 && info.amaxX === 1 && info.amaxY === 1;
    let wx;
    let wy;
    if (isStretch) {
      const [pwx, pwy] = parentInfo ? getWorldPos(parentPath) : [0, 0];
      wx = pwx + info.px;
      wy = pwy + info.py;
    } else {
      const [pwx, pwy] = parentInfo ? getWorldPos(parentPath) : [0, 0];
      const parentW = parentInfo ? parentInfo.rw : CANVAS_W;
      const parentH = parentInfo ? parentInfo.rh : CANVAS_H;
      wx = pwx + (info.aminX - 0.5) * parentW + info.px;
      wy = pwy + (info.aminY - 0.5) * parentH + info.py;
    }
    worldCache.set(entityPath, [wx, wy]);
    return [wx, wy];
  }

  const items = [];
  for (const [entityPath, info] of entityMap.entries()) {
    if (!info.enabled) continue;
    const [wx, wy] = getWorldPos(entityPath);
    let rw = info.rw;
    let rh = info.rh;
    if (info.anchorName === "stretch" && rw === 0 && rh === 0) {
      const idx = entityPath.lastIndexOf("/");
      const parentInfo = entityMap.get(idx >= 0 ? entityPath.slice(0, idx) : "");
      rw = parentInfo ? parentInfo.rw : CANVAS_W;
      rh = parentInfo ? parentInfo.rh : CANVAS_H;
    }
    items.push({ name: info.name, anchor: info.anchorName, cx: wx, cy: wy, w: rw, h: rh, kind: info.kind, text: info.text, fontSize: info.fontSize });
  }
  return items;
}

function toGrid(cx, cy, w, h) {
  const gx = Math.trunc((cx + CANVAS_W / 2) / CANVAS_W * GRID_W);
  const gy = Math.trunc((CANVAS_H / 2 - cy) / CANVAS_H * GRID_H);
  const gw = Math.max(1, Math.trunc(w / CANVAS_W * GRID_W));
  const gh = Math.max(1, Math.trunc(h / CANVAS_H * GRID_H));
  return [gx, gy, gw, gh];
}

function renderAscii(items, title = "") {
  const grid = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(" "));
  for (let x = 0; x < GRID_W; x += 1) {
    grid[0][x] = "-";
    grid[GRID_H - 1][x] = "-";
  }
  for (let y = 0; y < GRID_H; y += 1) {
    grid[y][0] = "|";
    grid[y][GRID_W - 1] = "|";
  }
  grid[0][0] = "+";
  grid[0][GRID_W - 1] = "+";
  grid[GRID_H - 1][0] = "+";
  grid[GRID_H - 1][GRID_W - 1] = "+";

  const [mgx, mgy, mgw, mgh] = toGrid(MSW_CORE_UI.x, MSW_CORE_UI.y, MSW_CORE_UI.w, MSW_CORE_UI.h);
  for (let dy = 0; dy < mgh; dy += 1) {
    for (let dx = 0; dx < mgw; dx += 1) {
      const ny = mgy + dy;
      const nx = mgx + dx;
      if (ny > 0 && ny < GRID_H - 1 && nx > 0 && nx < GRID_W - 1) grid[ny][nx] = "#";
    }
  }

  const drawn = [];
  for (const item of items) {
    if (["panel", "script"].includes(item.kind)) continue;
    if (item.w >= CANVAS_W && item.h >= CANVAS_H) continue;
    const [gx, gy] = toGrid(item.cx, item.cy, item.w, item.h);
    const label = item.name.slice(0, 12);
    if (gy > 0 && gy < GRID_H - 1 && gx > 0 && gx < GRID_W - 1) {
      const startX = Math.max(1, gx - Math.trunc(label.length / 2));
      for (let i = 0; i < label.length; i += 1) {
        const nx = startX + i;
        if (nx > 0 && nx < GRID_W - 1) grid[gy][nx] = label[i];
      }
      drawn.push(item);
    }
  }

  console.log(`\n${"=".repeat(GRID_W)}`);
  console.log(`  ${title}  (1920x1080, origin=center)`);
  console.log("=".repeat(GRID_W));
  grid.forEach((row) => console.log(row.join("")));
  console.log(`\n${"-".repeat(70)}`);
  console.log(`${"Name".padEnd(20)} ${"Anchor".padEnd(10)} ${"Pos".padStart(16)} ${"Size".padStart(12)} ${"Kind".padEnd(6)} ${"Font".padStart(4)}`);
  console.log("-".repeat(70));
  for (const item of drawn) {
    const posStr = `(${item.cx.toFixed(0).padStart(7)},${item.cy.toFixed(0).padStart(7)})`;
    const sizeStr = `${item.w.toFixed(0)}x${item.h.toFixed(0)}`;
    const fontStr = item.fontSize ? String(item.fontSize) : "";
    let warn = "";
    if (item.kind === "btn" && (item.w < 80 || item.h < 80)) warn = " !! btn<80px";
    if (item.fontSize && item.fontSize < 18) warn += " !! font<18";
    if (item.fontSize && item.fontSize < 24) warn += " !! font<24(mobile)";
    if (item.cx > 700 && item.cy > 350) warn += " !! MSW UI zone";
    console.log(`${item.name.padEnd(20)} ${item.anchor.padEnd(10)} ${posStr.padStart(16)} ${sizeStr.padStart(12)} ${item.kind.padEnd(6)} ${fontStr.padStart(4)}${warn}`);
  }
  console.log("-".repeat(70));
}

function main(argv = process.argv.slice(2)) {
  const files = argv.length ? argv : [path.join("ui", "DefaultGroup.ui"), path.join("ui", "PopupGroup.ui")];
  for (const file of files) {
    if (!fs.existsSync(file)) {
      console.log(`File not found: ${file}`);
      continue;
    }
    renderAscii(parseUiFile(file), path.basename(file));
  }
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

module.exports = { parseUiFile, renderAscii, main };
