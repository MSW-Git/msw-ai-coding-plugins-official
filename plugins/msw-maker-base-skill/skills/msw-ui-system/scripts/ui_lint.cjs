"use strict";

const fs = require("fs");

const SEVERITY_ERROR = "error";
const SEVERITY_WARN = "warning";
const SEVERITY_INFO = "info";

const CANVAS_W = 1920.0;
const CANVAS_H = 1080.0;
const CANVAS_RECT = [-CANVAS_W / 2, -CANVAS_H / 2, CANVAS_W / 2, CANVAS_H / 2];
const PC_RESERVED_TL_W = 260.0;
const PC_RESERVED_TL_H = 170.0;
const PC_RESERVED_TR_W = 220.0;
const PC_RESERVED_TR_H = 130.0;
const PC_PLATFORMS = new Set([1, 255]);
const OVERFLOW_TOL = 1.0;
const MIRROR_SUFFIXES = [["Left", "Right"], ["left", "right"]];
// L026 sliced-sprite border clash. A Sliced (9-slice) sprite paints a fixed-thickness
// decorative border ring just inside its rect edges. The border thickness lives in the
// sprite ASSET (border_left/right/top/bottom px), not in the .ui, so the lint cannot read
// it offline. When the caller supplies a border map (RUID -> {left,bottom,right,top} px,
// e.g. pulled from resource metadata) the rule reports sibling sliced frames whose border
// rings actually overlap (stacked double frame / muddy seam). With no border map — or for
// any sprite whose RUID is absent from it — border is simply not considered and the rule
// stays silent. Only Type=Sliced sprites are judged (the border renders only in Sliced
// mode); text/button entities are left to L023.
const SLICE_IMAGE_TYPE = 1; // ImageType.Sliced — border ring only renders in this mode
const SLICE_ALPHA_MIN = 0.1; // below this the sprite is effectively invisible

function finding(rule, severity, path, message, hint = "") {
  return { rule, severity, path, message, hint };
}

function formatFinding(f) {
  const sev = String(f.severity).toUpperCase().padEnd(7);
  return `[${sev}] ${f.rule} ${f.path}\n        ${f.message}${f.hint ? `\n        hint: ${f.hint}` : ""}`;
}

function components(entity) {
  return entity?.jsonString?.["@components"] || [];
}

function findComp(entity, compType) {
  return components(entity).find((c) => c["@type"] === compType) || null;
}

function entityPath(entity) {
  return entity?.jsonString?.path || entity?.path || "?";
}

function xy(value, fallback = 0.0) {
  const v = value && typeof value === "object" ? value : {};
  return [Number(v.x ?? fallback), Number(v.y ?? fallback)];
}

function anchorKey(mn, mx) {
  const stretchX = mn[0] !== mx[0];
  const stretchY = mn[1] !== mx[1];
  if (stretchX && stretchY) return mn[0] === 0 && mn[1] === 0 && mx[0] === 1 && mx[1] === 1 ? "stretch" : "stretch-custom";
  if (stretchX) {
    if (mn[1] === 1) return "stretch-top";
    if (mn[1] === 0) return "stretch-bottom";
    if (mn[1] === 0.5) return "stretch-middle";
    return "stretch-horizontal";
  }
  if (stretchY) {
    if (mn[0] === 0) return "stretch-left";
    if (mn[0] === 1) return "stretch-right";
    if (mn[0] === 0.5) return "stretch-center";
    return "stretch-vertical";
  }
  const yName = new Map([[1, "top"], [0.5, "middle"], [0, "bottom"]]).get(mn[1]) || `y${mn[1]}`;
  const xName = new Map([[0, "left"], [0.5, "center"], [1, "right"]]).get(mn[0]) || `x${mn[0]}`;
  return `${yName}-${xName}`;
}

function parentPath(p) {
  if (!p || p === "/" || p === "?") return null;
  const idx = p.lastIndexOf("/");
  return idx <= 0 ? null : p.slice(0, idx);
}

function ruleL001L002L010(entity, isRoot) {
  const out = [];
  const path = entityPath(entity);
  if (!findComp(entity, "MOD.Core.UITransformComponent")) {
    out.push(finding("L001", SEVERITY_ERROR, path, "UI entity is missing UITransformComponent", "Every UI entity must have UITransformComponent attached."));
  }
  if (isRoot) {
    if (!findComp(entity, "MOD.Core.UIGroupComponent")) {
      out.push(finding("L002", SEVERITY_ERROR, path, "Root entity missing UIGroupComponent", "Root of a .ui file needs UITransform + UIGroup + CanvasGroup."));
    }
    if (!findComp(entity, "MOD.Core.CanvasGroupComponent")) {
      out.push(finding("L002", SEVERITY_WARN, path, "Root entity missing CanvasGroupComponent", "CanvasGroup is required for fade/interactable control on the group."));
    }
  }
  const declared = String(entity.componentNames || "").split(",").filter(Boolean);
  const actual = components(entity).map((c) => c["@type"]).filter(Boolean);
  if (declared.length && !sameSet(declared, actual)) {
    out.push(finding("L010", SEVERITY_WARN, path, "componentNames string out of sync with @components array", `declared=${JSON.stringify(declared)} actual=${JSON.stringify(actual)}`));
  }
  return out;
}

function sameSet(a, b) {
  const as = new Set(a);
  const bs = new Set(b);
  if (as.size !== bs.size) return false;
  return [...as].every((x) => bs.has(x));
}

function ruleL003L004L005(entity) {
  const out = [];
  const ut = findComp(entity, "MOD.Core.UITransformComponent");
  if (!ut) return out;
  const path = entityPath(entity);
  const mn = xy(ut.AnchorsMin);
  const mx = xy(ut.AnchorsMax);
  const anchor = anchorKey(mn, mx);
  const stretchX = mn[0] !== mx[0];
  const stretchY = mn[1] !== mx[1];
  const ap = xy(ut.anchoredPosition);
  const rs = xy(ut.RectSize);

  if (stretchX && Math.abs(ap[0]) > 0.01) out.push(finding("L004", SEVERITY_WARN, path, `anchor='${anchor}' is stretched on X but anchoredPosition.x=${ap[0].toFixed(1)}`, "Stretched axis ignores anchoredPosition; use OffsetMin/OffsetMax instead."));
  if (stretchY && Math.abs(ap[1]) > 0.01) out.push(finding("L004", SEVERITY_WARN, path, `anchor='${anchor}' is stretched on Y but anchoredPosition.y=${ap[1].toFixed(1)}`, "Stretched axis ignores anchoredPosition; use OffsetMin/OffsetMax instead."));

  const pivot = xy(ut.Pivot, 0.5);
  if (!stretchX && !stretchY && Math.abs(pivot[0] - 0.5) < 0.01 && Math.abs(pivot[1] - 0.5) < 0.01) {
    if (mn[0] === 0 && rs[0] > 0 && ap[0] > 0 && ap[0] < rs[0] / 2) out.push(finding("L005", SEVERITY_WARN, path, `left-anchored entity may be half-clipped: pos.x=${ap[0].toFixed(0)} < size.x/2=${(rs[0] / 2).toFixed(0)}`, "Edge placement formula: pos = +/- (margin + size/2)"));
    if (mn[0] === 1 && rs[0] > 0 && ap[0] > -rs[0] / 2 && ap[0] < 0) out.push(finding("L005", SEVERITY_WARN, path, `right-anchored entity may be half-clipped: |pos.x|=${Math.abs(ap[0]).toFixed(0)} < size.x/2=${(rs[0] / 2).toFixed(0)}`, "Edge placement formula: pos = +/- (margin + size/2)"));
    if (mn[1] === 1 && rs[1] > 0 && ap[1] > -rs[1] / 2 && ap[1] < 0) out.push(finding("L005", SEVERITY_WARN, path, `top-anchored entity may be half-clipped: |pos.y|=${Math.abs(ap[1]).toFixed(0)} < size.y/2=${(rs[1] / 2).toFixed(0)}`, "Edge placement formula: pos = +/- (margin + size/2)"));
    if (mn[1] === 0 && rs[1] > 0 && ap[1] > 0 && ap[1] < rs[1] / 2) out.push(finding("L005", SEVERITY_WARN, path, `bottom-anchored entity may be half-clipped: pos.y=${ap[1].toFixed(0)} < size.y/2=${(rs[1] / 2).toFixed(0)}`, "Edge placement formula: pos = +/- (margin + size/2)"));
  }
  if (Math.abs(pivot[0] - 0.5) > 0.01 || Math.abs(pivot[1] - 0.5) > 0.01) {
    out.push(finding("L011", SEVERITY_INFO, path, `Pivot=(${pivot[0].toFixed(2)},${pivot[1].toFixed(2)}) differs from default (0.5, 0.5)`, "Pivot affects rotation/scale origin and anchoredPosition reference point."));
  }
  return out;
}

const ALIGN_NAMES = {
  0: "UpperLeft", 1: "UpperCenter", 2: "UpperRight",
  3: "MiddleLeft", 4: "MiddleCenter", 5: "MiddleRight",
  6: "LowerLeft", 7: "LowerCenter", 8: "LowerRight",
};

const TEXT_GUI_H_ALIGN_NAMES = {
  1: "Left",
  2: "Center",
  4: "Right",
  8: "Justified",
  16: "Flush",
  32: "Geometry",
};

const TEXT_GUI_V_ALIGN_NAMES = {
  256: "Top",
  512: "Middle",
  1024: "Bottom",
  2048: "Baseline",
  4096: "Geometry",
  8192: "Capline",
};

function hasTextGuiHAlignValue(value) {
  return Object.prototype.hasOwnProperty.call(TEXT_GUI_H_ALIGN_NAMES, value);
}

function hasTextGuiVAlignValue(value) {
  return Object.prototype.hasOwnProperty.call(TEXT_GUI_V_ALIGN_NAMES, value);
}

function alignH(a) {
  return [0, 3, 6].includes(a) ? "L" : [2, 5, 8].includes(a) ? "R" : "C";
}

function alignV(a) {
  return [0, 1, 2].includes(a) ? "U" : [6, 7, 8].includes(a) ? "Lo" : "M";
}

function textGuiAlignH(a) {
  if (a === 1) return "L";
  if (a === 4) return "R";
  if (a === 2 || a === 8) return "C";
  return null;
}

function textGuiAlignV(a) {
  if (a === 256) return "U";
  if (a === 1024) return "Lo";
  if (a === 512) return "M";
  return null;
}

function parseIntegerValue(value) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isInteger(n) ? n : null;
}

function anchorH(mn, mx) {
  if (mn[0] !== mx[0]) return null;
  if (mn[0] === 0) return "L";
  if (mn[0] === 1) return "R";
  if (mn[0] === 0.5) return "C";
  return null;
}

function anchorV(mn, mx) {
  if (mn[1] !== mx[1]) return null;
  if (mn[1] === 1) return "U";
  if (mn[1] === 0) return "Lo";
  if (mn[1] === 0.5) return "M";
  return null;
}

function ruleL006(entity) {
  const out = [];
  const tc = findComp(entity, "MOD.Core.TextComponent");
  const tgc = findComp(entity, "MOD.Core.TextGUIRendererComponent");
  if (!tc && !tgc) return out;
  if (tc) out.push(...ruleL006LegacyText(entity, tc));
  if (tgc) out.push(...ruleL006TextGuiRenderer(entity, tgc));
  return out;
}

function ruleL006LegacyText(entity, tc) {
  const out = [];
  const alignment = Number.parseInt(tc.Alignment ?? 0, 10);
  const path = entityPath(entity);
  const aname = ALIGN_NAMES[alignment] || String(alignment);
  const ut = findComp(entity, "MOD.Core.UITransformComponent");
  if (!ut) {
    if (alignment === 0) out.push(finding("L006", SEVERITY_WARN, path, "TextComponent.Alignment == UpperLeft(0) (default)", "Explicit alignment recommended. Center=4, MiddleLeft=3, MiddleRight=5."));
    return out;
  }
  const mn = xy(ut.AnchorsMin);
  const mx = xy(ut.AnchorsMax);
  const ah = anchorH(mn, mx);
  const av = anchorV(mn, mx);
  const h = alignH(alignment);
  const v = alignV(alignment);
  if ((ah === "L" && h === "R") || (ah === "R" && h === "L")) {
    out.push(finding("L006", SEVERITY_WARN, path, `Alignment=${aname}(${alignment}) opposes horizontal anchor (${ah === "L" ? "left" : "right"})`, "Default RectSize extends away from the anchor; text will render far from the anchor point. Match alignment to anchor side, or shrink RectSize."));
  } else if ((av === "U" && v === "Lo") || (av === "Lo" && v === "U")) {
    out.push(finding("L006", SEVERITY_WARN, path, `Alignment=${aname}(${alignment}) opposes vertical anchor (${av === "U" ? "top" : "bottom"})`, "Match alignment to anchor side, or shrink RectSize."));
  } else if (ah === "C" && ["L", "R"].includes(h) && alignment !== 4) {
    out.push(finding("L006", SEVERITY_INFO, path, `Alignment=${aname}(${alignment}) is edge-aligned but anchor is horizontal-center`, "If text should sit centered under the anchor, use MiddleCenter(4)."));
  } else if (alignment === 0 && ah !== "L" && av !== "U") {
    out.push(finding("L006", SEVERITY_WARN, path, "TextComponent.Alignment == UpperLeft(0) (default) with non-top-left anchor", "Explicit alignment recommended. Center=4, MiddleLeft=3, MiddleRight=5."));
  }
  return out;
}

function ruleL006TextGuiRenderer(entity, tgc) {
  const out = [];
  const path = entityPath(entity);
  if (Object.prototype.hasOwnProperty.call(tgc, "Alignment")) {
    out.push(finding("L006", SEVERITY_WARN, path, "TextGUIRendererComponent has legacy Alignment field", "Use HorizontalAlignment (1/2/4/8) and VerticalAlignment (256/512/1024); TextComponent.Alignment is ignored by TextGUIRendererComponent."));
  }

  const hRaw = tgc.HorizontalAlignment ?? 2;
  const vRaw = tgc.VerticalAlignment ?? 512;
  const h = parseIntegerValue(hRaw);
  const v = parseIntegerValue(vRaw);
  const hName = TEXT_GUI_H_ALIGN_NAMES[h] || String(hRaw);
  const vName = TEXT_GUI_V_ALIGN_NAMES[v] || String(vRaw);
  const hDir = textGuiAlignH(h);
  const vDir = textGuiAlignV(v);

  if (!hasTextGuiHAlignValue(h)) {
    out.push(finding("L006", SEVERITY_ERROR, path, `TextGUIRendererComponent.HorizontalAlignment has invalid value ${JSON.stringify(hRaw)}`, "Use TextHorizontalAlignmentOption: Left=1, Center=2, Right=4, Justified=8, Flush=16, Geometry=32."));
  }
  if (!hasTextGuiVAlignValue(v)) {
    out.push(finding("L006", SEVERITY_ERROR, path, `TextGUIRendererComponent.VerticalAlignment has invalid value ${JSON.stringify(vRaw)}`, "Use TextVerticalAlignmentOption: Top=256, Middle=512, Bottom=1024, Baseline=2048, Geometry=4096, Capline=8192."));
  }
  if (!hasTextGuiHAlignValue(h) || !hasTextGuiVAlignValue(v)) return out;

  const ut = findComp(entity, "MOD.Core.UITransformComponent");
  if (!ut) return out;
  const mn = xy(ut.AnchorsMin);
  const mx = xy(ut.AnchorsMax);
  const ah = anchorH(mn, mx);
  const av = anchorV(mn, mx);

  if ((ah === "L" && hDir === "R") || (ah === "R" && hDir === "L")) {
    out.push(finding("L006", SEVERITY_WARN, path, `HorizontalAlignment=${hName}(${h}) opposes horizontal anchor (${ah === "L" ? "left" : "right"})`, "Match text alignment to the anchor side, or shrink RectSize."));
  } else if ((av === "U" && vDir === "Lo") || (av === "Lo" && vDir === "U")) {
    out.push(finding("L006", SEVERITY_WARN, path, `VerticalAlignment=${vName}(${v}) opposes vertical anchor (${av === "U" ? "top" : "bottom"})`, "Match text alignment to the anchor side, or shrink RectSize."));
  } else if (ah === "C" && ["L", "R"].includes(hDir)) {
    out.push(finding("L006", SEVERITY_INFO, path, `HorizontalAlignment=${hName}(${h}) is edge-aligned but anchor is horizontal-center`, "If text should sit centered under the anchor, use HorizontalAlignment=Center(2)."));
  }
  return out;
}

function ruleL007(entity) {
  if (!findComp(entity, "MOD.Core.ButtonComponent")) return [];
  const ut = findComp(entity, "MOD.Core.UITransformComponent");
  if (!ut) return [];
  const rs = xy(ut.RectSize);
  return rs[0] < 88 || rs[1] < 88
    ? [finding("L007", SEVERITY_WARN, entityPath(entity), `Button RectSize ${rs[0].toFixed(0)}x${rs[1].toFixed(0)} below 88x88 mobile touch target`, "Enlarge RectSize to at least 88x88 (Apple HIG) even if icon looks smaller.")]
    : [];
}

function ruleL008(entity) {
  const sprite = findComp(entity, "MOD.Core.SpriteGUIRendererComponent");
  if (!sprite) return [];
  const ruid = sprite.ImageRUID && typeof sprite.ImageRUID === "object" ? sprite.ImageRUID : {};
  const color = sprite.Color && typeof sprite.Color === "object" ? sprite.Color : {};
  const alpha = Number(color.a ?? 1.0);
  return !ruid.DataId && alpha > 0.01
    ? [finding("L008", SEVERITY_WARN, entityPath(entity), "Sprite has empty ImageRUID.DataId but is visible (alpha>0)", "Assign a resource RUID, or set alpha=0 if used only as a Button hit area.")]
    : [];
}

function ruleL009(entity) {
  const ug = findComp(entity, "MOD.Core.UIGroupComponent");
  if (!ug) return [];
  return Number(ug.GroupType ?? 2) === 2 && Boolean(ug.DefaultShow)
    ? [finding("L009", SEVERITY_WARN, entityPath(entity), "Popup/menu UIGroup (GroupType=2) has DefaultShow=true", "Popups/menus should start hidden. Set DefaultShow=false.")]
    : [];
}

function ruleL024(entity) {
  const ug = findComp(entity, "MOD.Core.UIGroupComponent");
  if (!ug) return [];
  const out = [];
  const path = entityPath(entity);
  if (!Number.isInteger(ug.GroupOrder)) {
    out.push(finding("L024", SEVERITY_ERROR, path, `UIGroupComponent.GroupOrder must be int32, got ${JSON.stringify(ug.GroupOrder)}`, "Set GroupOrder to an integer such as 0 for HUD, 2 for toast, or 4 for popup."));
  }
  if (!Number.isInteger(ug.GroupType)) {
    out.push(finding("L024", SEVERITY_ERROR, path, `UIGroupComponent.GroupType must be int32, got ${JSON.stringify(ug.GroupType)}`, "Use UIGroupType numeric values only."));
  }
  return out;
}

function ruleL031(entity) {
  const slg = findComp(entity, "MOD.Core.ScrollLayoutGroupComponent");
  if (!slg) return [];
  const out = [];
  const path = entityPath(entity);
  if (slg.Type != null && ![0, 1, 2].includes(Number(slg.Type))) {
    out.push(finding("L031", SEVERITY_WARN, path, `ScrollLayoutGroupComponent.Type has invalid value ${JSON.stringify(slg.Type)}`, "Use LayoutGroupType: Horizontal=0, Vertical=1, Grid=2."));
  }
  if (slg.HorizontalScrollBarDirection != null && ![0, 1].includes(Number(slg.HorizontalScrollBarDirection))) {
    out.push(finding("L031", SEVERITY_WARN, path, `HorizontalScrollBarDirection has invalid value ${JSON.stringify(slg.HorizontalScrollBarDirection)}`, "Use HorizontalScrollBarDirection: LeftToRight=0, RightToLeft=1."));
  }
  if (slg.VerticalScrollBarDirection != null && ![2, 3].includes(Number(slg.VerticalScrollBarDirection))) {
    out.push(finding("L031", SEVERITY_WARN, path, `VerticalScrollBarDirection has invalid value ${JSON.stringify(slg.VerticalScrollBarDirection)}`, "Use VerticalScrollBarDirection: BottomToTop=2, TopToBottom=3. Value 0 belongs to HorizontalScrollBarDirection."));
  }
  return out;
}

function ruleL029(entity, isRoot) {
  if (isRoot || !findComp(entity, "MOD.Core.UIGroupComponent")) return [];
  return [finding(
    "L029",
    SEVERITY_ERROR,
    entityPath(entity),
    "Nested UIGroupComponent is not supported",
    "Keep UIGroupComponent only on the .ui root entity. Use empty() or panel() for inner grouping.",
  )];
}

function ruleL027(entity) {
  if (!findComp(entity, "MOD.Core.TextComponent") || !findComp(entity, "MOD.Core.TextGUIRendererComponent")) return [];
  return [finding("L027", SEVERITY_ERROR, entityPath(entity), "Entity has both TextComponent (legacy) and TextGUIRendererComponent", "A UI entity must carry exactly one text renderer. This usually means a legacy .ui was migrated by adding the new renderer without dropping the old one. Remove the legacy MOD.Core.TextComponent (rebuild the entity via the builder text()/button() helpers, or removeComponent('MOD.Core.TextComponent')). Two text layers double-render and fight over the same glyphs.")];
}

function ruleL028(entity) {
  if (!findComp(entity, "MOD.Core.TextGUIRendererComponent")) return [];
  const js = entity?.jsonString || {};
  const legacyModel = js.modelId === "uitext" || js.origin?.entry_id === "UIText" || js.origin?.entry_id === "uitext";
  if (!legacyModel) return [];
  return [finding("L028", SEVERITY_ERROR, entityPath(entity), "TextGUIRendererComponent is attached to legacy UIText model identity", "Use the UITextGUIRenderer / uitextguirenderer model identity for TextGUIRendererComponent entities. Legacy UIText / uitext can be repaired by rebuilding the entity with UIBuilder.text() or reapplying TextGUIRendererComponent through upsertComponent(); otherwise Maker reimport can restore the legacy TextComponent from the model identity.")];
}

function computeWorldRect(entity, byPath, cache) {
  const p = entityPath(entity);
  if (cache.has(p)) return cache.get(p);
  cache.set(p, null);

  const ut = findComp(entity, "MOD.Core.UITransformComponent");
  if (!ut) return null;

  const pp = parentPath(p);
  const parentEntity = pp ? byPath.get(pp) : null;
  let parentRect = parentEntity ? computeWorldRect(parentEntity, byPath, cache) : CANVAS_RECT;
  if (!parentRect) parentRect = CANVAS_RECT;

  const [px0, py0, px1, py1] = parentRect;
  const pw = px1 - px0;
  const ph = py1 - py0;
  const mn = xy(ut.AnchorsMin);
  const mx = xy(ut.AnchorsMax);
  const ap = xy(ut.anchoredPosition);
  const rs = xy(ut.RectSize);
  const pivot = xy(ut.Pivot, 0.5);
  const offMin = xy(ut.OffsetMin);
  const offMax = xy(ut.OffsetMax);

  const ax0 = px0 + mn[0] * pw;
  const ax1 = px0 + mx[0] * pw;
  const ay0 = py0 + mn[1] * ph;
  const ay1 = py0 + mx[1] * ph;
  let xMin;
  let xMax;
  let yMin;
  let yMax;
  if (mn[0] !== mx[0]) {
    xMin = ax0 + offMin[0];
    xMax = ax1 + offMax[0];
  } else {
    if (rs[0] <= 0) return null;
    const cx = (ax0 + ax1) / 2 + ap[0] + (0.5 - pivot[0]) * rs[0];
    xMin = cx - rs[0] / 2;
    xMax = cx + rs[0] / 2;
  }
  if (mn[1] !== mx[1]) {
    yMin = ay0 + offMin[1];
    yMax = ay1 + offMax[1];
  } else {
    if (rs[1] <= 0) return null;
    const cy = (ay0 + ay1) / 2 + ap[1] + (0.5 - pivot[1]) * rs[1];
    yMin = cy - rs[1] / 2;
    yMax = cy + rs[1] / 2;
  }
  const rect = [xMin, yMin, xMax, yMax];
  cache.set(p, rect);
  return rect;
}

function isFullCanvas(rect) {
  const [x0, y0, x1, y1] = rect;
  return x0 <= -CANVAS_W / 2 + 1 && x1 >= CANVAS_W / 2 - 1 && y0 <= -CANVAS_H / 2 + 1 && y1 >= CANVAS_H / 2 - 1;
}

function overlap(ax0, ax1, ay0, ay1, bx0, bx1, by0, by1) {
  return ax0 < bx1 && ax1 > bx0 && ay0 < by1 && ay1 > by0;
}

function ruleL012(entity, byPath, rectCache) {
  const ut = findComp(entity, "MOD.Core.UITransformComponent");
  if (!ut || !PC_PLATFORMS.has(Number(ut.ActivePlatform ?? 255))) return [];
  const rect = computeWorldRect(entity, byPath, rectCache);
  if (!rect || rect[2] <= rect[0] || rect[3] <= rect[1] || isFullCanvas(rect)) return [];
  const [xMin, yMin, xMax, yMax] = rect;
  const out = [];
  const tl = [-CANVAS_W / 2, -CANVAS_W / 2 + PC_RESERVED_TL_W, CANVAS_H / 2 - PC_RESERVED_TL_H, CANVAS_H / 2];
  const tr = [CANVAS_W / 2 - PC_RESERVED_TR_W, CANVAS_W / 2, CANVAS_H / 2 - PC_RESERVED_TR_H, CANVAS_H / 2];
  if (overlap(xMin, xMax, yMin, yMax, tl[0], tl[1], tl[2], tl[3])) {
    out.push(finding("L012", SEVERITY_WARN, entityPath(entity), `Entity world bbox overlaps PC top-left reserved zone (~${PC_RESERVED_TL_W.toFixed(0)}x${PC_RESERVED_TL_H.toFixed(0)} px, chat button + entry toast)`, "Shift inward, set ActivePlatform=Mobile(2), or for stretch-top bars set OffsetMin.x >= 280. See ui-fundamentals.md §9.3."));
  }
  if (overlap(xMin, xMax, yMin, yMax, tr[0], tr[1], tr[2], tr[3])) {
    out.push(finding("L012", SEVERITY_WARN, entityPath(entity), `Entity world bbox overlaps PC top-right reserved zone (~${PC_RESERVED_TR_W.toFixed(0)}x${PC_RESERVED_TR_H.toFixed(0)} px, friends + menu buttons)`, "Shift inward, set ActivePlatform=Mobile(2), or for stretch-top bars set OffsetMax.x <= -320. See ui-fundamentals.md §9.3."));
  }
  return out;
}

function ruleL013(entity, byPath, rectCache) {
  const ut = findComp(entity, "MOD.Core.UITransformComponent");
  if (!ut) return [];
  const rect = computeWorldRect(entity, byPath, rectCache);
  if (!rect || rect[2] <= rect[0] || rect[3] <= rect[1] || isFullCanvas(rect)) return [];
  const [xMin, yMin, xMax, yMax] = rect;
  const [cx0, cy0, cx1, cy1] = CANVAS_RECT;
  const sides = [];
  if (cx0 - xMin > OVERFLOW_TOL) sides.push(`left by ${(cx0 - xMin).toFixed(0)}px`);
  if (xMax - cx1 > OVERFLOW_TOL) sides.push(`right by ${(xMax - cx1).toFixed(0)}px`);
  if (yMax - cy1 > OVERFLOW_TOL) sides.push(`top by ${(yMax - cy1).toFixed(0)}px`);
  if (cy0 - yMin > OVERFLOW_TOL) sides.push(`bottom by ${(cy0 - yMin).toFixed(0)}px`);
  if (!sides.length) return [];
  const fullyOff = xMax < cx0 || xMin > cx1 || yMax < cy0 || yMin > cy1;
  return [finding("L013", fullyOff ? SEVERITY_ERROR : SEVERITY_WARN, entityPath(entity), `${fullyOff ? "Entity is fully off-canvas" : "Entity world bbox overflows canvas"}: ${sides.join(", ")} (bbox=(${xMin.toFixed(0)},${yMin.toFixed(0)})-(${xMax.toFixed(0)},${yMax.toFixed(0)}), canvas=1920x1080)`, "Edge formula: anchoredPosition = sign * (margin + RectSize/2) for center-pivot. For stretch axes, use OffsetMin/OffsetMax (anchoredPosition is ignored). Verify Pivot - non-center pivots shift the bbox.")];
}

function ruleL014(entity, byPath, rectCache) {
  const ut = findComp(entity, "MOD.Core.UITransformComponent");
  const pp = parentPath(entityPath(entity));
  if (!ut || !pp) return [];
  const parentEntity = byPath.get(pp);
  if (!parentEntity || !findComp(parentEntity, "MOD.Core.UITransformComponent")) return [];
  const rect = computeWorldRect(entity, byPath, rectCache);
  const pRect = computeWorldRect(parentEntity, byPath, rectCache);
  if (!rect || !pRect || isFullCanvas(pRect) || pRect[2] <= pRect[0] || pRect[3] <= pRect[1]) return [];
  const [xMin, yMin, xMax, yMax] = rect;
  const [px0, py0, px1, py1] = pRect;
  const sides = [];
  const threshold = 4.0;
  if (px0 - xMin > threshold) sides.push(`left ${(px0 - xMin).toFixed(0)}px`);
  if (xMax - px1 > threshold) sides.push(`right ${(xMax - px1).toFixed(0)}px`);
  if (yMax - py1 > threshold) sides.push(`top ${(yMax - py1).toFixed(0)}px`);
  if (py0 - yMin > threshold) sides.push(`bottom ${(py0 - yMin).toFixed(0)}px`);
  return sides.length ? [finding("L014", SEVERITY_INFO, entityPath(entity), `Child overflows parent '${pp}': ${sides.join(", ")}`, "Intentional for badges/tooltips. If unintended, shrink RectSize or adjust anchoredPosition / OffsetMin/Max.")] : [];
}

function groupRulesL015L016(byPath, rectCache) {
  const out = [];
  const childrenByParent = new Map();
  for (const [p, e] of byPath.entries()) {
    const pp = parentPath(p);
    if (!pp) continue;
    if (!childrenByParent.has(pp)) childrenByParent.set(pp, []);
    childrenByParent.get(pp).push(e);
  }
  for (const [pp, kids] of childrenByParent.entries()) {
    const parentEntity = byPath.get(pp);
    const parentRect = parentEntity ? computeWorldRect(parentEntity, byPath, rectCache) : null;
    if (!parentRect) continue;
    const kidRects = kids.map((k) => [k, computeWorldRect(k, byPath, rectCache)]).filter(([, r]) => r && r[2] - r[0] > 0 && r[3] - r[1] > 0);
    if (kidRects.length < 2) continue;
    const rows = [];
    for (const [k, r] of kidRects) {
      const yc = (r[1] + r[3]) / 2;
      const h = r[3] - r[1];
      let placed = false;
      for (const row of rows) {
        const rr = row[0][1];
        const ryc = (rr[1] + rr[3]) / 2;
        const rh = rr[3] - rr[1];
        if (Math.abs(yc - ryc) < Math.min(h, rh) * 0.5 && Math.abs(h - rh) / Math.max(h, rh) < 0.1) {
          row.push([k, r]);
          placed = true;
          break;
        }
      }
      if (!placed) rows.push([[k, r]]);
    }
    for (const row of rows) {
      if (row.length < 3) continue;
      const widths = row.map(([, r]) => r[2] - r[0]);
      const meanW = widths.reduce((a, b) => a + b, 0) / widths.length;
      if (meanW <= 0 || !widths.every((w) => Math.abs(w - meanW) / meanW < 0.1)) continue;
      row.sort((a, b) => ((a[1][0] + a[1][2]) / 2) - ((b[1][0] + b[1][2]) / 2));
      const xCenters = row.map(([, r]) => (r[0] + r[2]) / 2);
      const names = row.map(([k]) => entityPath(k).split("/").pop());
      const spacings = [];
      for (let i = 0; i < xCenters.length - 1; i += 1) spacings.push(xCenters[i + 1] - xCenters[i]);
      const meanSp = spacings.reduce((a, b) => a + b, 0) / spacings.length;
      if (meanSp > 1) {
        const variance = spacings.reduce((a, s) => a + (s - meanSp) ** 2, 0) / spacings.length;
        const stddev = Math.sqrt(variance);
        if (stddev / meanSp > 0.02) out.push(finding("L015", SEVERITY_WARN, pp, `Uneven sibling spacing across [${names.join(", ")}]: spacings=${JSON.stringify(spacings.map((s) => Math.round(s * 10) / 10))} (mean=${meanSp.toFixed(1)}, stddev=${stddev.toFixed(1)}, ratio=${(stddev / meanSp * 100).toFixed(1)}%)`, "Adjacent same-row repeated siblings should have uniform x-spacing. Inspect each child's anchoredPosition.x."));
      }
      const parentCx = (parentRect[0] + parentRect[2]) / 2;
      const groupCx = (Math.min(...row.map(([, r]) => r[0])) + Math.max(...row.map(([, r]) => r[2]))) / 2;
      const shift = groupCx - parentCx;
      const scale = meanSp > 1 ? meanSp : meanW;
      if (scale > 1 && Math.abs(shift) / scale > 0.1) out.push(finding("L016", SEVERITY_WARN, pp, `Repeated row [${names.join(", ")}] center off parent center by ${shift >= 0 ? "+" : ""}${shift.toFixed(1)}px (${(Math.abs(shift) / scale * 100).toFixed(0)}% of ${meanSp > 1 ? "spacing" : "width"} unit)`, `Symmetric layouts: group center should match parent center. Shift each child's anchoredPosition.x by ${(-shift) >= 0 ? "+" : ""}${(-shift).toFixed(1)}.`));
    }
  }
  return out;
}

function ruleL017(byPath, rectCache) {
  const out = [];
  const seen = new Set();
  for (const [p, entity] of byPath.entries()) {
    const name = p.split("/").pop();
    for (const [leftS, rightS] of MIRROR_SUFFIXES) {
      if (!name.endsWith(leftS) || name.length <= leftS.length) continue;
      const base = name.slice(0, -leftS.length);
      const parent = parentPath(p);
      if (!parent) continue;
      const pairPath = `${parent}/${base}${rightS}`;
      if (!byPath.has(pairPath)) continue;
      const key = [p, pairPath].sort().join("\0");
      if (seen.has(key)) continue;
      seen.add(key);
      const rl = computeWorldRect(entity, byPath, rectCache);
      const rr = computeWorldRect(byPath.get(pairPath), byPath, rectCache);
      if (!rl || !rr) continue;
      const pr = (byPath.has(parent) ? computeWorldRect(byPath.get(parent), byPath, rectCache) : CANVAS_RECT) || CANVAS_RECT;
      const pcx = (pr[0] + pr[2]) / 2;
      const dl = pcx - (rl[0] + rl[2]) / 2;
      const dr = (rr[0] + rr[2]) / 2 - pcx;
      if (dl <= 0 || dr <= 0) continue;
      const larger = Math.max(dl, dr);
      if (larger > 1 && Math.abs(dl - dr) / larger > 0.02) {
        out.push(finding("L017", SEVERITY_WARN, parent, `Mirror pair '${base}${leftS}' / '${base}${rightS}' asymmetric: left dist=${dl.toFixed(1)}, right dist=${dr.toFixed(1)} (diff ${(Math.abs(dl - dr) / larger * 100).toFixed(1)}%)`, "Named mirror pairs should be equidistant from parent center."));
      }
      break;
    }
  }
  return out;
}

function ruleL023(byPath, rectCache) {
  const out = [];
  const childrenByParent = new Map();
  for (const [p, e] of byPath.entries()) {
    const pp = parentPath(p);
    if (!pp) continue;
    if (!childrenByParent.has(pp)) childrenByParent.set(pp, []);
    childrenByParent.get(pp).push(e);
  }
  const tol = 4.0;
  for (const [pp, kids] of childrenByParent.entries()) {
    const textKids = kids
      .filter((k) => findComp(k, "MOD.Core.TextComponent") || findComp(k, "MOD.Core.TextGUIRendererComponent"))
      .map((k) => [k, computeWorldRect(k, byPath, rectCache)])
      .filter(([, r]) => r && r[2] - r[0] > 0 && r[3] - r[1] > 0);
    if (textKids.length < 2) continue;
    const reported = new Set();
    for (let i = 0; i < textKids.length; i += 1) {
      for (let j = i + 1; j < textKids.length; j += 1) {
        const [a, ra] = textKids[i];
        const [b, rb] = textKids[j];
        const ox = Math.min(ra[2], rb[2]) - Math.max(ra[0], rb[0]);
        const oy = Math.min(ra[3], rb[3]) - Math.max(ra[1], rb[1]);
        if (ox <= tol || oy <= tol) continue;
        const an = entityPath(a).split("/").pop();
        const bn = entityPath(b).split("/").pop();
        const key = [an, bn].sort().join("\0");
        if (reported.has(key)) continue;
        reported.add(key);
        out.push(finding("L023", SEVERITY_WARN, pp, `Sibling text rects overlap: '${an}' vs '${bn}' (overlap ${ox.toFixed(0)}x${oy.toFixed(0)}px)`, "Two text columns share canvas area - likely default RectSize (e.g. 400x29) bleeding into the next column. Set explicit RectSize per column or tighten anchors."));
      }
    }
  }
  return out;
}

function slicedSpriteRuid(entity) {
  const sprite = findComp(entity, "MOD.Core.SpriteGUIRendererComponent");
  if (!sprite) return null;
  // The border ring renders only in Sliced mode; a Simple/Tiled/Filled sprite ignores the
  // asset border, so its RUID's border px never produce a frame clash.
  if (Number(sprite.Type) !== SLICE_IMAGE_TYPE) return null;
  const ruid = sprite.ImageRUID && typeof sprite.ImageRUID === "object" ? sprite.ImageRUID : {};
  if (!ruid.DataId) return null;
  const color = sprite.Color && typeof sprite.Color === "object" ? sprite.Color : {};
  if (Number(color.a ?? 1.0) <= SLICE_ALPHA_MIN) return null;
  // Text/button backgrounds overlap as a text/spacing concern (L023), not a frame clash.
  if (findComp(entity, "MOD.Core.TextComponent") || findComp(entity, "MOD.Core.TextGUIRendererComponent")) return null;
  if (findComp(entity, "MOD.Core.ButtonComponent")) return null;
  return String(ruid.DataId);
}

// Accept either short {left,bottom,right,top} or resource-metadata {border_left,...} px.
// All-zero (no ring) returns null -> treated as "no border data to consider".
function normalizeBorder(b) {
  if (!b || typeof b !== "object") return null;
  const pick = (...keys) => {
    for (const k of keys) {
      const v = b[k];
      if (v !== undefined && v !== null && v !== "") {
        const n = Number(v);
        if (Number.isFinite(n)) return Math.max(0, n);
      }
    }
    return 0;
  };
  const left = pick("left", "border_left", "l");
  const bottom = pick("bottom", "border_bottom", "b");
  const right = pick("right", "border_right", "r");
  const top = pick("top", "border_top", "t");
  if (left <= 0 && bottom <= 0 && right <= 0 && top <= 0) return null;
  return { left, bottom, right, top };
}

function buildBorderMap(input) {
  const map = new Map();
  if (!input) return map;
  const entries = input instanceof Map ? input.entries() : Object.entries(input);
  for (const [ruid, raw] of entries) {
    const nb = normalizeBorder(raw);
    if (nb) map.set(String(ruid), nb);
  }
  return map;
}

// 9-slice border ring as up to four axis-aligned band rects (corners shared between bands).
// Each band thickness is clamped to the rect so an oversized border never escapes the frame.
function borderBands(rect, b) {
  const [x0, y0, x1, y1] = rect;
  const w = x1 - x0;
  const h = y1 - y0;
  const l = Math.min(b.left, w);
  const r = Math.min(b.right, w);
  const bo = Math.min(b.bottom, h);
  const t = Math.min(b.top, h);
  const bands = [];
  if (l > 0) bands.push([x0, y0, x0 + l, y1]);
  if (r > 0) bands.push([x1 - r, y0, x1, y1]);
  if (bo > 0) bands.push([x0, y0, x1, y0 + bo]);
  if (t > 0) bands.push([x0, y1 - t, x1, y1]);
  return bands;
}

function rectOverlap(a, b) {
  const ox = Math.min(a[2], b[2]) - Math.max(a[0], b[0]);
  const oy = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
  return [ox, oy];
}

function ruleL026(byPath, rectCache, borders) {
  const out = [];
  // Border is considered only when the caller supplies border data. No map -> rule silent.
  if (!borders || borders.size === 0) return out;
  const childrenByParent = new Map();
  for (const [p, e] of byPath.entries()) {
    const pp = parentPath(p);
    if (!pp) continue;
    if (!childrenByParent.has(pp)) childrenByParent.set(pp, []);
    childrenByParent.get(pp).push(e);
  }
  for (const [pp, kids] of childrenByParent.entries()) {
    const sliceKids = [];
    for (const k of kids) {
      const ruid = slicedSpriteRuid(k);
      if (!ruid) continue;
      const border = borders.get(ruid);
      if (!border) continue; // no border data for this RUID -> not considered
      const rect = computeWorldRect(k, byPath, rectCache);
      if (!rect || rect[2] - rect[0] <= 0 || rect[3] - rect[1] <= 0) continue;
      sliceKids.push([k, rect, border]);
    }
    if (sliceKids.length < 2) continue;
    const reported = new Set();
    for (let i = 0; i < sliceKids.length; i += 1) {
      for (let j = i + 1; j < sliceKids.length; j += 1) {
        const [a, ra, ba] = sliceKids[i];
        const [b, rb, bb] = sliceKids[j];
        const [ox, oy] = rectOverlap(ra, rb);
        if (ox <= 0 || oy <= 0) continue; // rects don't even touch
        // Do the two border rings actually paint over each other? Test every band pair.
        const bandsA = borderBands(ra, ba);
        const bandsB = borderBands(rb, bb);
        let clash = false;
        for (const sa of bandsA) {
          for (const sb of bandsB) {
            const [bx, by] = rectOverlap(sa, sb);
            if (bx > 0 && by > 0) { clash = true; break; }
          }
          if (clash) break;
        }
        if (!clash) continue;
        const an = entityPath(a).split("/").pop();
        const bn = entityPath(b).split("/").pop();
        const key = [an, bn].sort().join("\0");
        if (reported.has(key)) continue;
        reported.add(key);
        out.push(finding("L026", SEVERITY_WARN, pp, `Sibling sliced (9-slice) borders overlap: '${an}' vs '${bn}' (rects cross by ${ox.toFixed(0)}x${oy.toFixed(0)}px)`, "Both panels are 9-slice and their border rings paint over each other, producing a doubled/muddy frame seam. Separate them so the borders don't touch, nest one fully inside the other, or if the layering is intentional ignore this."));
      }
    }
  }
  return out;
}

function ruleL030(byPath, rectCache, rootPath) {
  const out = [];
  const childrenByParent = new Map();
  for (const [p, e] of byPath.entries()) {
    const pp = parentPath(p);
    if (!pp) continue;
    if (!childrenByParent.has(pp)) childrenByParent.set(pp, []);
    childrenByParent.get(pp).push(e);
  }
  const rootKids = childrenByParent.get(rootPath) || [];
  const texts = rootKids.filter((entity) => {
    const js = entity?.jsonString || {};
    return (js.modelId === "uitext" || js.modelId === "uitextguirenderer") &&
      (findComp(entity, "MOD.Core.TextComponent") || findComp(entity, "MOD.Core.TextGUIRendererComponent"));
  });
  const boxes = rootKids.filter((entity) => {
    const js = entity?.jsonString || {};
    return !["uitext", "uitextguirenderer"].includes(js.modelId) &&
      (findComp(entity, "MOD.Core.SpriteGUIRendererComponent") || findComp(entity, "MOD.Core.ButtonComponent")) &&
      !findComp(entity, "MOD.Core.TextComponent") &&
      !findComp(entity, "MOD.Core.TextGUIRendererComponent");
  });
  if (!texts.length || !boxes.length) return out;

  const reported = new Set();
  for (const textEntity of texts) {
    const textRect = computeWorldRect(textEntity, byPath, rectCache);
    if (!textRect || textRect[2] <= textRect[0] || textRect[3] <= textRect[1]) continue;
    const textArea = (textRect[2] - textRect[0]) * (textRect[3] - textRect[1]);
    if (textArea <= 0) continue;

    let best = null;
    for (const boxEntity of boxes) {
      const boxRect = computeWorldRect(boxEntity, byPath, rectCache);
      if (!boxRect || isFullCanvas(boxRect) || boxRect[2] <= boxRect[0] || boxRect[3] <= boxRect[1]) continue;
      const ox = Math.min(textRect[2], boxRect[2]) - Math.max(textRect[0], boxRect[0]);
      const oy = Math.min(textRect[3], boxRect[3]) - Math.max(textRect[1], boxRect[1]);
      if (ox <= 0 || oy <= 0) continue;
      const cover = (ox * oy) / textArea;
      if (cover < 0.6) continue;
      const boxArea = (boxRect[2] - boxRect[0]) * (boxRect[3] - boxRect[1]);
      if (!best || boxArea < best.boxArea) best = { entity: boxEntity, cover, boxArea };
    }
    if (!best) continue;

    const textName = entityPath(textEntity).split("/").pop();
    const boxName = entityPath(best.entity).split("/").pop();
    const key = `${[textName, boxName].sort().join("\0")}@${rootPath}`;
    if (reported.has(key)) continue;
    reported.add(key);
    out.push(finding(
      "L030",
      SEVERITY_WARN,
      entityPath(textEntity),
      `Root-level text '${textName}' overlaps sibling box '${boxName}' (${(best.cover * 100).toFixed(0)}% covered)`,
      `Do not stack related controls as root siblings. Nest the text under the box as "${boxName}/${textName}", or put the label on the box itself via sprite()/panel() text options or button().`,
    ));
  }
  return out;
}

function ruleL025(byPath) {
  const out = [];
  for (const [p] of byPath) {
    const pp = parentPath(p);
    // pp === "/ui" means p is a top-level UI group mounted directly under the
    // engine canvas (/ui), which is legitimately not an entity in this file.
    // Anything deeper must have its parent present, regardless of array order.
    if (!pp || pp === "/ui") continue;
    if (!byPath.has(pp)) {
      out.push(finding("L025", SEVERITY_ERROR, p, `Orphaned entity: parent '${pp}' does not exist in this .ui file`, "Create the parent empty()/panel() container before its nested children. A child whose intermediate parent is missing cannot be mounted as a proper UI container on import."));
    }
  }
  return out;
}

function lintUiFile(filepath, opts = {}) {
  const data = JSON.parse(fs.readFileSync(filepath, "utf8"));
  const borders = buildBorderMap(opts.borders);
  const entities = data?.ContentProto?.Entities || [];
  if (!entities.length) return [finding("L000", SEVERITY_ERROR, String(filepath), "No entities found in .ui file", "File may be corrupt or built with wrong schema.")];
  const findings = [];
  const byPath = new Map();
  for (const e of entities) {
    if (typeof e.jsonString === "string") e.jsonString = JSON.parse(e.jsonString);
    const ep = entityPath(e);
    if (ep && ep !== "?") byPath.set(ep, e);
  }
  const rootPath = entityPath(entities[0]);
  const rectCache = new Map();
  entities.forEach((entity, idx) => {
    findings.push(...ruleL001L002L010(entity, idx === 0));
    findings.push(...ruleL003L004L005(entity));
    findings.push(...ruleL006(entity));
    findings.push(...ruleL007(entity));
    findings.push(...ruleL008(entity));
    findings.push(...ruleL009(entity));
    findings.push(...ruleL024(entity));
    findings.push(...ruleL031(entity));
    findings.push(...ruleL029(entity, idx === 0));
    findings.push(...ruleL027(entity));
    findings.push(...ruleL028(entity));
    findings.push(...ruleL012(entity, byPath, rectCache));
    findings.push(...ruleL013(entity, byPath, rectCache));
    findings.push(...ruleL014(entity, byPath, rectCache));
  });
  findings.push(...groupRulesL015L016(byPath, rectCache));
  findings.push(...ruleL017(byPath, rectCache));
  findings.push(...ruleL023(byPath, rectCache));
  findings.push(...ruleL026(byPath, rectCache, borders));
  findings.push(...ruleL030(byPath, rectCache, rootPath));
  findings.push(...ruleL025(byPath));
  return findings;
}

function parseArgs(argv) {
  const args = { json: false, severity: "info", path: null, borders: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--json") args.json = true;
    else if (arg === "--severity") {
      i += 1;
      args.severity = argv[i];
    } else if (arg.startsWith("--severity=")) args.severity = arg.slice("--severity=".length);
    else if (arg === "--borders") {
      i += 1;
      args.borders = argv[i];
    } else if (arg.startsWith("--borders=")) args.borders = arg.slice("--borders=".length);
    else if (!args.path) args.path = arg;
    else throw new Error(`Unexpected argument: ${arg}`);
  }
  if (!args.path) throw new Error("Usage: node ui_lint.cjs <path-to-ui-file> [--json] [--severity error|warning|info] [--borders <ruid-border-map.json>]");
  if (!["error", "warning", "info"].includes(args.severity)) throw new Error("--severity must be one of: error, warning, info");
  return args;
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const order = { error: 2, warning: 1, info: 0 };
  const borders = args.borders ? JSON.parse(fs.readFileSync(args.borders, "utf8")) : null;
  const filtered = lintUiFile(args.path, { borders }).filter((f) => order[f.severity] >= order[args.severity]);
  if (args.json) {
    console.log(JSON.stringify(filtered, null, 2));
  } else {
    filtered.forEach((f) => console.log(formatFinding(f)));
    const total = filtered.length;
    const errors = filtered.filter((f) => f.severity === SEVERITY_ERROR).length;
    const warns = filtered.filter((f) => f.severity === SEVERITY_WARN).length;
    const infos = filtered.filter((f) => f.severity === SEVERITY_INFO).length;
    console.log(`\n${args.path}: ${total} finding(s) - ${errors} error, ${warns} warning, ${infos} info`);
  }
  return filtered.some((f) => f.severity === SEVERITY_ERROR) ? 1 : 0;
}

if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    process.exitCode = 2;
  }
}

module.exports = {
  SEVERITY_ERROR,
  SEVERITY_WARN,
  SEVERITY_INFO,
  formatFinding,
  lintUiFile,
  main,
};
