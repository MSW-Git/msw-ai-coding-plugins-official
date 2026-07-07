"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// SpriteGUIRendererComponent defaults applied to EVERY UI entity the builder
// mints with a sprite renderer (panel / sprite / button / slider / textInput /
// joystick, ...). A 9-slice RUID, Sliced image type, and a dark translucent fill
// (RGBA 26,26,26,60).
//
// These are DEFAULTS, not constraints: they only fill in what the caller leaves
// unspecified. Pass `color` (panel/sprite) or `bg_color` (button/slider/textInput)
// — as a hex string or { r, g, b, a } — plus `alpha` / `sprite_type` / `image_ruid`
// to tint or restyle any individual element. Do not assume every panel must be gray.
const DEFAULT_SPRITE_RUID = "2860136c06ab075439721c027de365af";
const DEFAULT_SPRITE_TYPE = 1; // ImageType.Sliced
const DEFAULT_SPRITE_COLOR = { r: 26 / 255, g: 26 / 255, b: 26 / 255, a: 60 / 255 };

// PreserveSprite (PreserveSpriteType) — how a sprite keeps its source proportions:
//   0 None (stretch to RectSize) / 1 AspectOnly (fit inside RectSize, keep ratio) /
//   2 NativeSize (draw at native pixel size). This enum is the only proportion control
//   the renderer honors. The legacy `preserve_aspect: true` option maps to AspectOnly(1).
const PRESERVE_SPRITE = { none: 0, aspectonly: 1, aspect: 1, nativesize: 2, native: 2 };
function resolvePreserveSprite(extra = {}) {
  const v = extra.preserve_sprite;
  if (v != null) {
    if (typeof v === "number") return v;
    const k = String(v).toLowerCase();
    if (k in PRESERVE_SPRITE) return PRESERVE_SPRITE[k];
    throw new Error(`unknown preserve_sprite: '${v}' (use 0|1|2 or none|aspectOnly|nativeSize)`);
  }
  return extra.preserve_aspect ? 1 : 0;
}

// >>> BEGIN AUTO-GENERATED: native component catalog + resolver — do not hand-edit; run tools/gen-native-components.cjs
// Native MSW component class names (CoreVersion 26.5.0.0). A bare name in this
// set is auto-qualified to "MOD.Core.<name>"; any other bare name is treated as a
// "script.<name>" custom component, with a one-time advisory on stderr.
const NATIVE_COMPONENTS = new Set([
  "AIChaseComponent", "AIComponent", "AIWanderComponent", "AnimationSequenceControllerComponent",
  "AreaParticleComponent", "AttackComponent", "AvatarBodyActionSelectorComponent", "AvatarFaceActionSelectorComponent",
  "AvatarGUIRendererComponent", "AvatarRendererComponent", "AvatarStateAnimationComponent", "BackgroundComponent",
  "BasicParticleComponent", "ButtonComponent", "CameraComponent", "CanvasGroupComponent",
  "ChatBalloonComponent", "ChatComponent", "ClimbableComponent", "ClimbableSpriteRendererComponent",
  "Component", "CostumeManagerComponent", "CustomFootholdComponent", "DamageSkinComponent",
  "DamageSkinSettingComponent", "DamageSkinSpawnerComponent", "DirectionSynchronizerComponent", "DistanceJointComponent",
  "FootholdComponent", "GridViewComponent", "HitComponent", "HitEffectSpawnerComponent",
  "InteractionComponent", "InventoryComponent", "JoystickComponent", "KinematicbodyComponent",
  "LightComponent", "LineGUIRendererComponent", "LineRendererComponent", "MapComponent",
  "MapLayerComponent", "MaskComponent", "MissingComponent", "MovementComponent",
  "NameTagComponent", "OverlayLightComponent", "PhysicsColliderComponent", "PhysicsRigidbodyComponent",
  "PhysicsSimulatorComponent", "PixelGUIRendererComponent", "PixelRendererComponent", "PlayerComponent",
  "PlayerControllerComponent", "PolygonGUIRendererComponent", "PolygonRendererComponent", "PortalComponent",
  "PrismaticJointComponent", "PulleyJointComponent", "RawImageGUIRendererComponent", "RawImageRendererComponent",
  "RectTileMapComponent", "RevoluteJointComponent", "RigidbodyComponent", "ScrollLayoutGroupComponent",
  "SideviewbodyComponent", "SkeletonGUIRendererComponent", "SkeletonRendererComponent", "SliderComponent",
  "SoundComponent", "SpawnLocationComponent", "SpriteGUIRendererComponent", "SpriteParticleComponent",
  "SpriteRendererComponent", "StateAnimationComponent", "StateComponent", "StateStringToAvatarActionComponent",
  "StateStringToMonsterActionComponent", "TagComponent", "TextComponent", "TextGUIRendererComponent",
  "TextGUIRendererInputComponent", "TextInputComponent", "TextRendererComponent", "TileMapComponent",
  "TouchReceiveComponent", "TransformComponent", "TriggerComponent", "TweenCircularComponent",
  "TweenFloatingComponent", "TweenLineComponent", "UIAreaParticleComponent", "UIBasicParticleComponent",
  "UIGroupComponent", "UISpriteParticleComponent", "UITouchReceiveComponent", "UITransformComponent",
  "WebSpriteComponent", "WebViewComponent", "WeldJointComponent", "WheelJointComponent",
  "WorldComponent", "YoutubePlayerCommonComponent", "YoutubePlayerGUIComponent", "YoutubePlayerWorldComponent"
]);
const _resolveWarned = new Set();
function _editDistance(a, b) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 3;
  const prev = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        diag + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      diag = tmp;
    }
  }
  return prev[n];
}
function _nearestNative(name) {
  const limit = name.length <= 6 ? 1 : 2;
  let best = null, bestD = limit + 1;
  for (const n of NATIVE_COMPONENTS) {
    const d = _editDistance(name, n);
    if (d < bestD) { bestD = d; best = n; }
  }
  return bestD <= limit ? best : null;
}
function normalizeComponentName(name) {
  if (name == null) throw new TypeError("Component name must not be null");
  const value = String(name);
  if (value.startsWith("MOD.") || value.startsWith("script.")) return value;
  if (NATIVE_COMPONENTS.has(value)) {
    const out = "MOD.Core." + value;
    if (!_resolveWarned.has(value)) {
      _resolveWarned.add(value);
      console.warn(`[builder:ui] component "${value}" -> ${out} (native; auto-qualified). Pass "${out}" to silence this.`);
    }
    return out;
  }
  const near = _nearestNative(value);
  const out = "script." + value;
  if (!_resolveWarned.has(value)) {
    _resolveWarned.add(value);
    if (near) {
      console.warn(`[builder:ui] component "${value}" is not a native component -> treated as ${out}. Looks like a typo of native "MOD.Core.${near}": if you meant the native, pass "MOD.Core.${near}"; if it is your own script component, pass "${out}".`);
    } else {
      console.warn(`[builder:ui] component "${value}" -> ${out} (assumed custom script component). Next time pass "${out}" if it is yours, or "MOD.Core.${value}" if it is native.`);
    }
  }
  return out;
}
// <<< END AUTO-GENERATED

// A UI entity renders text through exactly one text component. TextComponent is the
// legacy renderer; TextGUIRendererComponent is the current one. Adding either must drop
// the other, otherwise an entity migrated from a legacy .ui carries both — two text
// layers that double-render and fight over the same glyphs.
const MUTUALLY_EXCLUSIVE_COMPONENTS = new Map([
  ["MOD.Core.TextComponent", ["MOD.Core.TextGUIRendererComponent"]],
  ["MOD.Core.TextGUIRendererComponent", ["MOD.Core.TextComponent"]],
]);

const ANCHOR_DEFAULT_PIVOT = {
  "middle-center": [0.5, 0.5],
  "middle-left": [0.0, 0.5],
  "middle-right": [1.0, 0.5],
  "top-center": [0.5, 1.0],
  "top-left": [0.0, 1.0],
  "top-right": [1.0, 1.0],
  "bottom-center": [0.5, 0.0],
  "bottom-left": [0.0, 0.0],
  "bottom-right": [1.0, 0.0],
  "stretch-top": [0.5, 1.0],
  "stretch-middle": [0.5, 0.5],
  "stretch-bottom": [0.5, 0.0],
  "stretch-left": [0.0, 0.5],
  "stretch-center": [0.5, 0.5],
  "stretch-right": [1.0, 0.5],
  stretch: [0.5, 0.5],
};

const ANCHOR_PRESETS = {
  "middle-center": { min: [0.5, 0.5], max: [0.5, 0.5], alignment: 0 },
  "middle-left": { min: [0.0, 0.5], max: [0.0, 0.5], alignment: 1 },
  "middle-right": { min: [1.0, 0.5], max: [1.0, 0.5], alignment: 2 },
  "top-center": { min: [0.5, 1.0], max: [0.5, 1.0], alignment: 3 },
  "top-left": { min: [0.0, 1.0], max: [0.0, 1.0], alignment: 4 },
  "top-right": { min: [1.0, 1.0], max: [1.0, 1.0], alignment: 5 },
  "bottom-center": { min: [0.5, 0.0], max: [0.5, 0.0], alignment: 6 },
  "bottom-left": { min: [0.0, 0.0], max: [0.0, 0.0], alignment: 7 },
  "bottom-right": { min: [1.0, 0.0], max: [1.0, 0.0], alignment: 8 },
  "stretch-top": { min: [0.0, 1.0], max: [1.0, 1.0], alignment: 9 },
  "stretch-middle": { min: [0.0, 0.5], max: [1.0, 0.5], alignment: 10 },
  "stretch-bottom": { min: [0.0, 0.0], max: [1.0, 0.0], alignment: 11 },
  "stretch-left": { min: [0.0, 0.0], max: [0.0, 1.0], alignment: 12 },
  "stretch-center": { min: [0.5, 0.0], max: [0.5, 1.0], alignment: 13 },
  "stretch-right": { min: [1.0, 0.0], max: [1.0, 1.0], alignment: 14 },
  stretch: { min: [0.0, 0.0], max: [1.0, 1.0], alignment: 15 },
};

function hasExplicitTransformOptions(options = {}) {
  return options.anchor != null || options.pos != null || options.rect_size != null || options.pivot != null;
}

function assertNoParentOption(methodName, name, options = {}) {
  if (options && Object.prototype.hasOwnProperty.call(options, "parent")) {
    throw new Error(
      `UIBuilder.${methodName}() does not accept options.parent. ` +
        `Use path notation in the entity name instead, such as "Parent/Child".`
    );
  }
}

const KNOWN_COMPONENTS = new Set([
  "MOD.Core.UITransformComponent",
  "MOD.Core.SpriteGUIRendererComponent",
  "MOD.Core.TextComponent",
  "MOD.Core.TextGUIRendererComponent",
  "MOD.Core.TextGUIRendererInputComponent",
  "MOD.Core.ButtonComponent",
  "MOD.Core.UIGroupComponent",
  "MOD.Core.CanvasGroupComponent",
  "MOD.Core.SliderComponent",
  "MOD.Core.ScrollLayoutGroupComponent",
  "MOD.Core.TextInputComponent",
  "MOD.Core.MaskComponent",
  "MOD.Core.GridViewComponent",
  "MOD.Core.AvatarGUIRendererComponent",
  "MOD.Core.UITouchReceiveComponent",
  "MOD.Core.SkeletonGUIRendererComponent",
  "MOD.Core.UIAreaParticleComponent",
  "MOD.Core.UIBasicParticleComponent",
  "MOD.Core.UISpriteParticleComponent",
  "MOD.Core.JoystickComponent",
  "MOD.Core.SoftMaskComponent",
  "MOD.Core.ChatComponent",
  "MOD.Core.LineGUIRendererComponent",
  "MOD.Core.PolygonGUIRendererComponent",
]);

const INT32_COMPONENT_FIELDS = new Set([
  "ActivePlatform", "Alignment", "AlignmentOption", "AnimClipPlayType", "Axis", "ChildAlignment",
  "Constraint", "ConstraintCount", "ContentType", "Direction", "DownArrow", "EndFrameIndex",
  "FillMethod", "FillOrigin", "FixedCount", "FixedType", "Font", "FontSize", "FontStyle", "FrameColumn",
  "FrameRate", "FrameRow", "GridChildAlignment", "GroupOrder", "GroupType", "HorizontalAlignment",
  "HorizontalScrollBarDirection", "KeyCode", "LeftArrow", "LineType", "MaxSize", "MinSize",
  "VerticalAlignment",
  "OrderInLayer", "Overflow", "ParticleType", "PreserveAvatar", "PreserveMode",
  "PreserveSprite", "PreserveSpriteType", "PreserveType", "RandomSeed", "RightArrow", "ScrollBarVisible",
  "Shape", "StartAxis", "StartCorner", "StartFrameIndex", "TotalCount", "Transition", "Type",
  "UIVersion", "UpArrow", "VerticalScrollBarDirection",
]);

const NUMBER_COMPONENT_FIELDS = new Set([
  "ChatEmotionDuration", "ColorMultiplier", "ConstraintX", "ConstraintY", "DropShadowAngle",
  "DropShadowDistance", "FadeDuration", "FillAmount", "Flexibility", "GroupAlpha",
  "MaxValue", "MinValue", "OutlineWidth", "ParticleCount", "ParticleLifeTime", "ParticleSize",
  "ParticleSpeed", "PlayRate", "PlaySpeed", "ScrollBarThickness", "Spacing", "Value", "Width",
]);

const BOOLEAN_COMPONENT_FIELDS = new Set([
  "AllowAutomaticTranslation", "ApplySpriteColor", "AutoClear", "AutoRandomSeed", "BestFit",
  "BlocksRaycasts", "Bold", "DefaultShow", "DynamicStick", "Enable", "EnableVoiceChat",
  "Expand", "FillCenter", "FillClockWise", "FlipX", "FlipY", "HideWorldChatButton",
  "IgnoreMapLayerCheck", "Interactable", "InvertMask", "InvertOutsides", "IsEmitting",
  "IsFlexible", "IsLocalizationKey", "IsSmooth", "Loop", "MessageAlignBottom", "OverrideSorting",
  "PlayOnEnable", "Prewarm", "RaycastTarget", "ReverseArrangement",
  "SizeFit", "UseChatBalloon", "UseChatEmotion", "UseConstraintX", "UseConstraintY",
  "UseCustomUVs", "UseHandle", "UseIntegerValue", "UseOutLine", "UseScroll",
]);

const COMPONENT_FIELD_TYPE_OVERRIDES = new Map([
  ["MOD.Core.GridViewComponent.Spacing", "Vector2"],
  ["MOD.Core.TextGUIRendererComponent.Font", "String"],
  ["MOD.Core.TextGUIRendererComponent.FontSize", "Single"],
  ["MOD.Core.TextGUIRendererComponent.MinSize", "Single"],
  ["MOD.Core.TextGUIRendererComponent.MaxSize", "Single"],
]);

function isFiniteNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

function isVector2Shape(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return isFiniteNumber(value.x) && isFiniteNumber(value.y);
}

function hexToRgba(hexColor, alpha = 1.0) {
  const h = String(hexColor).replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    throw new Error(`Invalid hex color: ${hexColor}`);
  }
  return {
    r: parseInt(h.slice(0, 2), 16) / 255.0,
    g: parseInt(h.slice(2, 4), 16) / 255.0,
    b: parseInt(h.slice(4, 6), 16) / 255.0,
    a: alpha,
  };
}

function colorDict(color, alpha = 1.0) {
  if (color == null) return { r: 1.0, g: 1.0, b: 1.0, a: alpha };
  if (typeof color === "string") return hexToRgba(color, alpha);
  if (Array.isArray(color)) {
    if ((color.length === 3 || color.length === 4) && color.every(isFiniteNumber)) {
      return { r: color[0], g: color[1], b: color[2], a: color.length === 4 ? color[3] : alpha };
    }
    throw new Error(`Invalid color array: ${JSON.stringify(color)} (use [r,g,b] or [r,g,b,a] with 0..1 floats, a hex string, or {r,g,b,a})`);
  }
  return color;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function tuple(value, fallback) {
  if (value == null) return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value === "object") {
    const arity = Array.isArray(fallback) ? fallback.length : 2;
    const keys = ["x", "y", "z", "w"].slice(0, arity);
    if (keys.some((k) => k in value)) return keys.map((k) => Number(value[k] ?? 0));
  }
  return fallback;
}

function sortFields(extra = {}) {
  return {
    SortingLayer: String(extra.sorting_layer ?? "UI"),
    OrderInLayer: Number(extra.order_in_layer ?? 0),
    IgnoreMapLayerCheck: Boolean(extra.ignore_map_layer_check ?? false),
    OverrideSorting: Boolean(extra.override_sorting ?? false),
  };
}

function _resolveSortOptions(options = {}) {
  if (options.world_ui === true) {
    return {
      sorting_layer: options.sorting_layer ?? "UI",
      order_in_layer: options.order_in_layer ?? 0,
      ignore_map_layer_check: options.ignore_map_layer_check ?? false,
      override_sorting: options.override_sorting ?? true,
    };
  }
  const picked = {};
  if (options.sorting_layer !== undefined) picked.sorting_layer = options.sorting_layer;
  if (options.order_in_layer !== undefined) picked.order_in_layer = options.order_in_layer;
  if (options.ignore_map_layer_check !== undefined) picked.ignore_map_layer_check = options.ignore_map_layer_check;
  if (options.override_sorting !== undefined) picked.override_sorting = options.override_sorting;
  return picked;
}

function int32Field(value, fieldName) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < -2147483648 || n > 2147483647) {
    throw new TypeError(`${fieldName} must be an int32. Got ${JSON.stringify(value)}`);
  }
  return n;
}

function collectInvalidNumbers(value, pathLabel, findings) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      findings.push({ severity: "error", rule: "U001", message: `${pathLabel} must be a finite number. Got ${String(value)}` });
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, idx) => collectInvalidNumbers(item, `${pathLabel}[${idx}]`, findings));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      collectInvalidNumbers(item, `${pathLabel}.${key}`, findings);
    }
  }
}

function collectComponentScalarTypeIssues(data, findings) {
  const entities = data?.ContentProto?.Entities || [];
  for (const entity of entities) {
    const js = typeof entity.jsonString === "string" ? JSON.parse(entity.jsonString) : entity.jsonString;
    const entityPath = js?.path || entity.path || "?";
    for (const component of js?.["@components"] || []) {
      const compType = component["@type"] || "?";
      for (const [key, value] of Object.entries(component)) {
        const label = `${entityPath}.${compType}.${key}`;
        const overrideType = COMPONENT_FIELD_TYPE_OVERRIDES.get(`${compType}.${key}`);
        if (overrideType === "Vector2") {
          if (!isVector2Shape(value)) {
            findings.push({ severity: "error", rule: "U005", message: `${label} must be Vector2 {x, y} with finite numbers. Got ${JSON.stringify(value)}` });
          }
          continue;
        }
        if (overrideType === "String") {
          if (typeof value !== "string") {
            findings.push({ severity: "error", rule: "U006", message: `${label} must be a string. Got ${JSON.stringify(value)}` });
          }
          continue;
        }
        if (overrideType === "Single") {
          if (typeof value !== "number" || !Number.isFinite(value)) {
            findings.push({ severity: "error", rule: "U003", message: `${label} must be a finite number. Got ${JSON.stringify(value)}` });
          }
          continue;
        }
        if (INT32_COMPONENT_FIELDS.has(key) && !Number.isInteger(value)) {
          findings.push({ severity: "error", rule: "U002", message: `${label} must be int32. Got ${JSON.stringify(value)}` });
        }
        if (NUMBER_COMPONENT_FIELDS.has(key) && (typeof value !== "number" || !Number.isFinite(value))) {
          findings.push({ severity: "error", rule: "U003", message: `${label} must be a finite number. Got ${JSON.stringify(value)}` });
        }
        if (BOOLEAN_COMPONENT_FIELDS.has(key) && typeof value !== "boolean") {
          findings.push({ severity: "error", rule: "U004", message: `${label} must be boolean. Got ${JSON.stringify(value)}` });
        }
      }
    }
  }
}

function assertNoInvalidNumbers(value, pathLabel = "$") {
  const findings = [];
  collectInvalidNumbers(value, pathLabel, findings);
  if (findings.length) throw new TypeError(findings[0].message);
}

function assertComponentScalarTypes(data) {
  const findings = [];
  collectComponentScalarTypeIssues(data, findings);
  if (findings.length) throw new TypeError(findings[0].message);
}

class UIBuilder {
  constructor(groupName, displayOrder = 1, defaultShow = true, defaultRuid = DEFAULT_SPRITE_RUID) {
    this.group_name = groupName;
    this.root_uuid = crypto.randomUUID();
    this.root_path = `/ui/${groupName}`;
    this.default_ruid = defaultRuid;
    this.entities = [];
    this._data = null;
    this._display_counters = {};
    this._lastId = null;
    this._createRoot(int32Field(displayOrder, "displayOrder"), defaultShow);
  }

  static load(filepath) {
    let data;
    try {
      data = JSON.parse(fs.readFileSync(filepath, "utf8"));
    } catch (err) {
      if (err && err.code === "ENOENT") throw new Error(`UI file not found: ${filepath}`);
      throw new Error(`Invalid JSON in UI file ${filepath}: ${err.message}`);
    }
    if (!data.ContentProto || !Array.isArray(data.ContentProto.Entities)) {
      throw new Error(`Missing ContentProto.Entities in UI file: ${filepath}`);
    }
    const entities = data.ContentProto.Entities;
    if (entities.length === 0) throw new Error(`No entities found in UI file: ${filepath}`);
    for (const entity of entities) {
      if (typeof entity.jsonString === "string") entity.jsonString = JSON.parse(entity.jsonString);
    }
    const rootJs = entities[0].jsonString;
    const instance = new UIBuilder(rootJs.name || "Unnamed");
    instance.root_uuid = entities[0].id;
    instance.root_path = rootJs.path || instance.root_path;
    instance.entities = entities;
    instance._data = data;
    instance._display_counters = {};
    for (const entity of entities) {
      const js = entity.jsonString;
      const entityPath = js.path || "";
      const parent = entityPath.includes("/") ? entityPath.split("/").slice(0, -1).join("/") : "";
      const displayOrder = js.displayOrder || 0;
      if (parent && displayOrder >= (instance._display_counters[parent] || 0)) {
        instance._display_counters[parent] = displayOrder + 1;
      }
    }
    console.log(`Loaded ${entities.length} entities from ${filepath}`);
    return instance;
  }

  static read(filepath) {
    return UIBuilder.load(filepath);
  }

  static snapshot(filepath) {
    return UIBuilder.load(filepath).listEntities();
  }

  _createRoot(displayOrder, defaultShow) {
    this.entities.push({
      id: this.root_uuid,
      path: this.root_path,
      componentNames: "MOD.Core.UITransformComponent,MOD.Core.UIGroupComponent,MOD.Core.CanvasGroupComponent",
      jsonString: {
        name: this.group_name,
        path: this.root_path,
        nameEditable: true,
        enable: true,
        visible: true,
        localize: true,
        displayOrder,
        pathConstraints: "//",
        revision: 0,
        origin: {
          type: "Model",
          entry_id: "UIGroup",
          sub_entity_id: null,
          root_entity_id: null,
          replaced_model_id: null,
        },
        modelId: "uigroup",
        "@components": [
          this._uiTransform("stretch", [0, 0], [1920, 1080]),
          {
            "@type": "MOD.Core.UIGroupComponent",
            DefaultShow: defaultShow,
            GroupOrder: displayOrder,
            GroupType: 1,
            Enable: true,
          },
          {
            "@type": "MOD.Core.CanvasGroupComponent",
            BlocksRaycasts: true,
            GroupAlpha: 1.0,
            Interactable: true,
            Enable: true,
          },
        ],
        "@version": 1,
      },
    });
  }

  _normalizePath(identifier) {
    const value = String(identifier).trim();
    if (!value) throw new Error("Entity identifier must not be empty");
    if (value.startsWith("/ui/")) {
      if (!value.startsWith(this.root_path)) {
        throw new Error(`Entity path '${value}' is outside this UI root '${this.root_path}'`);
      }
      return value;
    }
    const rel = value.replace(/^\/+/, "");
    if (!rel) return this.root_path;
    if (rel === this.group_name || rel.startsWith(`${this.group_name}/`)) return `/ui/${rel}`;
    return `${this.root_path}/${rel}`;
  }

  _resolve(identifier) {
    const fullPath = this._normalizePath(identifier);
    const parentPath = fullPath.includes("/") ? fullPath.split("/").slice(0, -1).join("/") : this.root_path;
    const entityName = fullPath.split("/").pop();
    return [fullPath, parentPath, entityName];
  }

  _nextDisplayOrder(parentPath) {
    const n = this._display_counters[parentPath] || 0;
    this._display_counters[parentPath] = n + 1;
    return n;
  }

  _pathConstraints(fullPath) {
    if (fullPath === this.root_path) return "//";
    return "/".repeat((fullPath.slice(this.root_path.length).match(/\//g) || []).length + 2);
  }

  _entityJson(entity) {
    return entity.jsonString;
  }

  _findComponent(entity, compType) {
    for (const component of this._entityJson(entity)["@components"] || []) {
      if (component["@type"] === compType) return component;
    }
    return null;
  }

  _refreshComponentNamesFromComponents(entity) {
    entity.componentNames = (this._entityJson(entity)["@components"] || [])
      .map((component) => component["@type"])
      .filter(Boolean)
      .join(",");
  }

  _normalizeTextGuiRendererModelIdentity(entity) {
    const js = this._entityJson(entity);
    if (!this._findComponent(entity, "MOD.Core.TextGUIRendererComponent")) return;
    if (js.modelId === "uitext") js.modelId = "uitextguirenderer";
    if (js.origin?.entry_id === "UIText" || js.origin?.entry_id === "uitext") js.origin.entry_id = "UITextGUIRenderer";
  }

  _uiTransform(anchor = "middle-center", pos = [0, 0], rectSize = [100, 100], pivot = null) {
    const preset = ANCHOR_PRESETS[anchor] || ANCHOR_PRESETS["middle-center"];
    const px = Number(pos[0]);
    const py = Number(pos[1]);
    const sx = Number(rectSize[0]);
    const sy = Number(rectSize[1]);
    const [pvx, pvy] = pivot == null ? (ANCHOR_DEFAULT_PIVOT[anchor] || [0.5, 0.5]) : [Number(pivot[0]), Number(pivot[1])];
    const mn = preset.min;
    const mx = preset.max;
    const stretchX = mn[0] !== mx[0];
    const stretchY = mn[1] !== mx[1];
    let ominX;
    let ominY;
    let omaxX;
    let omaxY;
    if (stretchX && stretchY) {
      ominX = px; ominY = py; omaxX = px; omaxY = py;
    } else if (stretchX) {
      ominX = px; omaxX = px; ominY = py - pvy * sy; omaxY = py + (1.0 - pvy) * sy;
    } else if (stretchY) {
      ominX = px - pvx * sx; omaxX = px + (1.0 - pvx) * sx; ominY = py; omaxY = py;
    } else {
      ominX = px - pvx * sx; omaxX = px + (1.0 - pvx) * sx;
      ominY = py - pvy * sy; omaxY = py + (1.0 - pvy) * sy;
    }
    return {
      "@type": "MOD.Core.UITransformComponent",
      ActivePlatform: 255,
      AlignmentOption: preset.alignment,
      AnchorsMax: { x: preset.max[0], y: preset.max[1] },
      AnchorsMin: { x: preset.min[0], y: preset.min[1] },
      MobileOnly: false,
      OffsetMax: { x: omaxX, y: omaxY },
      OffsetMin: { x: ominX, y: ominY },
      Pivot: { x: pvx, y: pvy },
      RectSize: { x: sx, y: sy },
      UIMode: 1,
      UIScale: { x: 1.0, y: 1.0, z: 1.0 },
      UIVersion: 2,
      anchoredPosition: { x: px, y: py },
      Position: { x: 0.0, y: 0.0, z: 0.0 },
      QuaternionRotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 },
      Scale: { x: 1.0, y: 1.0, z: 1.0 },
      Enable: true,
    };
  }

  _anchorNameFromTransform(transform) {
    for (const [presetName, preset] of Object.entries(ANCHOR_PRESETS)) {
      const amin = transform.AnchorsMin || {};
      const amax = transform.AnchorsMax || {};
      if (Number(amin.x) === preset.min[0] && Number(amin.y) === preset.min[1] && Number(amax.x) === preset.max[0] && Number(amax.y) === preset.max[1]) {
        return presetName;
      }
    }
    return "middle-center";
  }

  _mergeUiTransform(existingTransform, options = {}) {
    const curPos = existingTransform.anchoredPosition || {};
    const curSize = existingTransform.RectSize || {};
    const curPivot = existingTransform.Pivot || {};
    const curOffMin = existingTransform.OffsetMin || {};
    const curOffMax = existingTransform.OffsetMax || {};
    const nextPos = options.pos != null ? tuple(options.pos, [0, 0]) : [Number(curPos.x ?? 0.0), Number(curPos.y ?? 0.0)];
    const nextSize = options.rect_size != null ? tuple(options.rect_size, [100, 100]) : [Number(curSize.x ?? 100.0), Number(curSize.y ?? 100.0)];
    let nextPivot = null;
    if (options.pivot != null) nextPivot = tuple(options.pivot, [0.5, 0.5]);
    else if (curPivot.x != null && curPivot.y != null) nextPivot = [Number(curPivot.x), Number(curPivot.y)];
    const nextAnchor = options.anchor ?? this._anchorNameFromTransform(existingTransform);
    const rebuilt = this._uiTransform(nextAnchor, nextPos, nextSize, nextPivot);
    if (options.anchor == null) {
      const preset = ANCHOR_PRESETS[nextAnchor] || ANCHOR_PRESETS["middle-center"];
      const stretchX = preset.min[0] !== preset.max[0];
      const stretchY = preset.min[1] !== preset.max[1];
      if ((stretchX || stretchY) && curOffMin.x != null && curOffMin.y != null && curOffMax.x != null && curOffMax.y != null) {
        if (stretchX) {
          rebuilt.OffsetMin.x = Number(curOffMin.x);
          rebuilt.OffsetMax.x = Number(curOffMax.x);
          rebuilt.anchoredPosition.x = options.pos != null ? Number(nextPos[0]) : Number(curPos.x ?? 0.0);
        }
        if (stretchY) {
          rebuilt.OffsetMin.y = Number(curOffMin.y);
          rebuilt.OffsetMax.y = Number(curOffMax.y);
          rebuilt.anchoredPosition.y = options.pos != null ? Number(nextPos[1]) : Number(curPos.y ?? 0.0);
        }
        if (options.rect_size == null && curSize.x != null && curSize.y != null) {
          rebuilt.RectSize = { x: Number(curSize.x), y: Number(curSize.y) };
        }
      }
    }
    return rebuilt;
  }

  static _spriteRenderer(color = null, alpha = null, raycast = false, fillMethod = 0, spriteType = null, imageRuid = null, extra = {}) {
    const sort = sortFields(extra);
    const resolvedType = spriteType != null ? spriteType : DEFAULT_SPRITE_TYPE;
    const resolvedRuid = imageRuid != null ? imageRuid : DEFAULT_SPRITE_RUID;
    let resolvedColor;
    if (color != null) {
      resolvedColor = colorDict(color, alpha != null ? alpha : 1.0);
    } else {
      resolvedColor = { ...DEFAULT_SPRITE_COLOR };
      if (alpha != null) resolvedColor.a = alpha;
    }
    return {
      "@type": "MOD.Core.SpriteGUIRendererComponent",
      AnimClipPlayType: 0,
      EndFrameIndex: 2147483647,
      ImageRUID: { DataId: resolvedRuid },
      IgnoreMapLayerCheck: sort.IgnoreMapLayerCheck,
      LocalPosition: { x: 0.0, y: 0.0 },
      LocalScale: { x: 1.0, y: 1.0 },
      MaterialId: String(extra.material_id ?? ""),
      OrderInLayer: sort.OrderInLayer,
      OverrideSorting: sort.OverrideSorting,
      PlayRate: 1.0,
      PreserveSprite: resolvePreserveSprite(extra),
      SortingLayer: sort.SortingLayer,
      StartFrameIndex: 0,
      Color: resolvedColor,
      DropShadow: false,
      DropShadowAngle: 120.0,
      DropShadowColor: { r: 0.0, g: 0.0, b: 0.0, a: 0.72 },
      DropShadowDistance: 3.0,
      FillAmount: 1.0,
      FillCenter: true,
      FillClockWise: true,
      FillMethod: fillMethod,
      FillOrigin: 0,
      FlipX: false,
      FlipY: false,
      FrameColumn: 1,
      FrameRate: 0,
      FrameRow: 1,
      Outline: false,
      OutlineColor: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
      OutlineWidth: 3.0,
      RaycastTarget: raycast,
      Type: resolvedType,
      Enable: true,
    };
  }

  _spriteRenderer(...args) {
    return UIBuilder._spriteRenderer(...args);
  }

  // `alignment`: 9-cell value 0-8 (default 4 = MiddleCenter), split into the H/V axes below.
  static _textGuiRenderer(text = "", fontSize = 24, color = null, bold = false, alignment = 4, options = {}) {
    const maxSize = options.max_size != null ? options.max_size : Math.max(fontSize + 12, 40);
    const sort = sortFields(options);
    const a = Number.parseInt(alignment, 10) || 0;
    const HORIZONTAL = [1, 2, 4]; // Left, Center, Right
    const VERTICAL = [256, 512, 1024]; // Top, Middle, Bottom
    const horizontal = HORIZONTAL[((a % 3) + 3) % 3];
    const vertical = VERTICAL[Math.min(Math.max(Math.floor(a / 3), 0), 2)];
    const outlineOn = Boolean(options.outline);
    return {
      "@type": "MOD.Core.TextGUIRendererComponent",
      BestFit: Boolean(options.bestfit),
      ConstraintX: Number(options.constraint_x ?? 100.0),
      ConstraintY: Number(options.constraint_y ?? 100.0),
      Font: "Default",
      FontColor: colorDict(color),
      FontSize: Number(fontSize),
      FontStyle: bold ? 1 : 0, // FontStyleType: Normal 0, Bold 1 (bit flags)
      HorizontalAlignment: horizontal,
      IgnoreMapLayerCheck: sort.IgnoreMapLayerCheck,
      MaxSize: maxSize,
      MinSize: options.min_size != null ? options.min_size : 10,
      OrderInLayer: sort.OrderInLayer,
      OutlineColor: options.outline_color != null ? colorDict(options.outline_color) : { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
      OutlineWidth: outlineOn ? Number(options.outline_width ?? 0.2) : 0.0,
      Overflow: options.overflow != null ? options.overflow : 0, // TextOverflowMode: Overflow 0, Ellipsis 1, Truncate 2, Page 3
      OverrideSorting: sort.OverrideSorting,
      Padding: { left: 0, right: 0, top: 0, bottom: 0 },
      SizeFit: false,
      SortingLayer: sort.SortingLayer,
      Text: text,
      Underlay: false,
      UseConstraintX: Boolean(options.use_constraint_x ?? false),
      UseConstraintY: Boolean(options.use_constraint_y ?? false),
      VerticalAlignment: vertical,
      Enable: true,
    };
  }

  _textGuiRenderer(...args) {
    return UIBuilder._textGuiRenderer(...args);
  }

  _textFromOptions(options = {}) {
    if (!Object.prototype.hasOwnProperty.call(options, "text")) return null;
    return this._textGuiRenderer(
      String(options.text ?? ""),
      options.text_size ?? options.font_size ?? 24,
      options.text_color ?? "#FFFFFF",
      options.text_bold ?? false,
      options.text_alignment ?? 4,
      {
        overflow: options.text_overflow ?? options.overflow ?? 0,
        bestfit: options.text_bestfit ?? options.bestfit ?? false,
        min_size: options.text_min_size ?? options.min_size ?? 10,
        max_size: options.text_max_size ?? options.max_size ?? null,
        outline: options.text_outline ?? options.outline ?? false,
        outline_color: options.text_outline_color ?? options.outline_color ?? null,
        outline_width: options.text_outline_width ?? options.outline_width ?? null,
        use_constraint_x: options.text_use_constraint_x ?? options.use_constraint_x ?? false,
        constraint_x: options.text_constraint_x ?? options.constraint_x ?? 100.0,
        use_constraint_y: options.text_use_constraint_y ?? options.use_constraint_y ?? false,
        constraint_y: options.text_constraint_y ?? options.constraint_y ?? 100.0,
        ..._resolveSortOptions(options),
      },
    );
  }

  static _buttonComponent(extra = {}) {
    const sort = sortFields(extra);
    return {
      "@type": "MOD.Core.ButtonComponent",
      Colors: {
        NormalColor: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
        HighlightedColor: { r: 0.9607843, g: 0.9607843, b: 0.9607843, a: 1.0 },
        PressedColor: { r: 0.784313738, g: 0.784313738, b: 0.784313738, a: 1.0 },
        SelectedColor: { r: 0.9607843, g: 0.9607843, b: 0.9607843, a: 1.0 },
        DisabledColor: { r: 0.784313738, g: 0.784313738, b: 0.784313738, a: 0.5019608 },
        ColorMultiplier: 1.0,
        FadeDuration: 0.1,
      },
      IgnoreMapLayerCheck: sort.IgnoreMapLayerCheck,
      ImageRUIDs: {
        HighlightedSprite: null,
        PressedSprite: null,
        SelectedSprite: null,
        DisabledSprite: null,
      },
      KeyCode: 0,
      OrderInLayer: sort.OrderInLayer,
      OverrideSorting: sort.OverrideSorting,
      SortingLayer: sort.SortingLayer,
      Transition: 1,
      Enable: true,
    };
  }

  _buttonComponent(...args) {
    return UIBuilder._buttonComponent(...args);
  }

  static _sliderComponent(minVal = 0, maxVal = 1, value = 0, direction = 0, useHandle = true, useInteger = false, extra = {}) {
    const fillPadding = tuple(extra.fill_padding, [10, 10, 10, 10]);
    const handlePadding = tuple(extra.handle_padding, [0, 0, 0, 0]);
    const handleSize = tuple(extra.handle_size, [50, 50]);
    const sort = sortFields(extra);
    return {
      "@type": "MOD.Core.SliderComponent",
      Direction: direction,
      FillRectColor: extra.fill_color != null ? colorDict(extra.fill_color) : { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
      FillRectImageRUID: { DataId: String(extra.fill_image_ruid ?? "") },
      FillRectPadding: { left: Number(fillPadding[0]), right: Number(fillPadding[1]), top: Number(fillPadding[2]), bottom: Number(fillPadding[3]) },
      HandleAreaPadding: { left: Number(handlePadding[0]), right: Number(handlePadding[1]), top: Number(handlePadding[2]), bottom: Number(handlePadding[3]) },
      HandleColor: extra.handle_color != null ? colorDict(extra.handle_color) : { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
      HandleImageRUID: { DataId: String(extra.handle_image_ruid ?? "") },
      HandleSize: { x: Number(handleSize[0]), y: Number(handleSize[1]) },
      IgnoreMapLayerCheck: sort.IgnoreMapLayerCheck,
      MaxValue: Number(maxVal),
      MinValue: Number(minVal),
      OrderInLayer: sort.OrderInLayer,
      OverrideSorting: sort.OverrideSorting,
      SortingLayer: sort.SortingLayer,
      UseHandle: useHandle,
      UseIntegerValue: useInteger,
      Value: Number(value),
      Enable: true,
    };
  }

  _sliderComponent(...args) {
    return UIBuilder._sliderComponent(...args);
  }

  static _scrollLayoutComponent(layoutType = 1, spacing = 0, cellSize = [100, 100], useScroll = true, padding = [0, 0, 0, 0], extra = {}) {
    const gridSpacing = tuple(extra.grid_spacing, [0, 0]);
    const sort = sortFields(extra);
    return {
      "@type": "MOD.Core.ScrollLayoutGroupComponent",
      CellSize: { x: Number(cellSize[0]), y: Number(cellSize[1]) },
      ChildAlignment: Number(extra.child_alignment ?? 0),
      Constraint: Number(extra.constraint ?? 0),
      ConstraintCount: Number(extra.constraint_count ?? 1),
      GridChildAlignment: Number(extra.grid_child_alignment ?? 0),
      GridSpacing: { x: Number(gridSpacing[0]), y: Number(gridSpacing[1]) },
      HorizontalScrollBarDirection: Number(extra.h_scroll_dir ?? 0),
      IgnoreMapLayerCheck: sort.IgnoreMapLayerCheck,
      OrderInLayer: sort.OrderInLayer,
      OverrideSorting: sort.OverrideSorting,
      Padding: { left: padding[0], right: padding[1], top: padding[2], bottom: padding[3] },
      ReverseArrangement: Boolean(extra.reverse_arrangement ?? false),
      ScrollBarBackgroundColor: extra.scroll_bar_bg_color != null ? colorDict(extra.scroll_bar_bg_color) : { r: 1.0, g: 1.0, b: 1.0, a: 0.4 },
      ScrollBarBgImageRUID: { DataId: String(extra.scroll_bar_bg_ruid ?? "") },
      ScrollBarHandleColor: extra.scroll_bar_handle_color != null ? colorDict(extra.scroll_bar_handle_color) : { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
      ScrollBarHandleImageRUID: { DataId: String(extra.scroll_bar_handle_ruid ?? "") },
      ScrollBarThickness: Number(extra.scroll_bar_thickness ?? 20.0),
      ScrollBarVisible: Number(extra.scroll_bar_visible ?? 0),
      SortingLayer: sort.SortingLayer,
      Spacing: Number(spacing),
      StartAxis: Number(extra.start_axis ?? 0),
      StartCorner: Number(extra.start_corner ?? 0),
      Type: layoutType,
      UseScroll: useScroll,
      VerticalScrollBarDirection: Number(extra.v_scroll_dir ?? 2),
      Enable: true,
    };
  }

  _scrollLayoutComponent(...args) {
    return UIBuilder._scrollLayoutComponent(...args);
  }

  static _textInputComponent(placeholder = "", charLimit = 0, contentType = 0, lineType = 0, extra = {}) {
    const sort = sortFields(extra);
    return {
      "@type": "MOD.Core.TextGUIRendererInputComponent",
      AllowAutomaticTranslation: Boolean(extra.allow_auto_translation ?? true),
      AutoClear: Boolean(extra.auto_clear ?? false),
      CharacterLimit: charLimit,
      ContentType: contentType,
      IgnoreMapLayerCheck: sort.IgnoreMapLayerCheck,
      IsLocalizationKey: Boolean(extra.is_localization_key ?? false),
      LineType: lineType,
      OrderInLayer: sort.OrderInLayer,
      OverrideSorting: sort.OverrideSorting,
      PlaceHolder: String(placeholder ?? ""),
      PlaceHolderColor: extra.placeholder_color != null ? colorDict(extra.placeholder_color) : { r: 0.1953125, g: 0.1953125, b: 0.1953125, a: 0.5 },
      SortingLayer: sort.SortingLayer,
      Text: String(extra.text ?? ""),
      Enable: true,
    };
  }

  _textInputComponent(...args) {
    return UIBuilder._textInputComponent(...args);
  }

  static _uiGroupComponent(defaultShow = true, groupOrder = 0, groupType = 1) {
    return {
      "@type": "MOD.Core.UIGroupComponent",
      DefaultShow: Boolean(defaultShow),
      GroupOrder: int32Field(groupOrder, "UIGroupComponent.GroupOrder"),
      GroupType: int32Field(groupType, "UIGroupComponent.GroupType"),
      Enable: true,
    };
  }

  _uiGroupComponent(...args) {
    return UIBuilder._uiGroupComponent(...args);
  }

  static _canvasGroupComponent(blocksRaycasts = true, groupAlpha = 1.0, interactable = true) {
    return {
      "@type": "MOD.Core.CanvasGroupComponent",
      BlocksRaycasts: Boolean(blocksRaycasts),
      GroupAlpha: Number(groupAlpha),
      Interactable: Boolean(interactable),
      Enable: true,
    };
  }

  _canvasGroupComponent(...args) {
    return UIBuilder._canvasGroupComponent(...args);
  }

  static _maskComponent(shape = 0, padding = [0, 0, 0, 0], softness = [0, 0]) {
    return {
      "@type": "MOD.Core.MaskComponent",
      Shape: Number(shape),
      Padding: { left: padding[0], right: padding[1], top: padding[2], bottom: padding[3] },
      Softness: { x: Number(softness[0]), y: Number(softness[1]) },
      Enable: true,
    };
  }

  _maskComponent(...args) {
    return UIBuilder._maskComponent(...args);
  }

  static _gridViewComponent(totalCount = 0, cellSize = [100, 100], fixedCount = 1, fixedType = 0, spacing = [0, 0], padding = [0, 0, 0, 0], useScroll = true, scrollBarVisible = 1, scrollBarThickness = 10.0, hScrollDir = 0, vScrollDir = 0, scrollBarBgColor = null, scrollBarHandleColor = null, scrollBarBgRuid = "", scrollBarHandleRuid = "") {
    return {
      "@type": "MOD.Core.GridViewComponent",
      CellSize: { x: Number(cellSize[0]), y: Number(cellSize[1]) },
      FixedCount: Number(fixedCount),
      FixedType: Number(fixedType),
      HorizontalScrollBarDirection: Number(hScrollDir),
      Padding: { left: padding[0], right: padding[1], top: padding[2], bottom: padding[3] },
      ScrollBarBackgroundColor: scrollBarBgColor != null ? colorDict(scrollBarBgColor) : { r: 1.0, g: 1.0, b: 1.0, a: 0.0 },
      ScrollBarBackgroundImageRUID: { DataId: scrollBarBgRuid },
      ScrollBarHandleColor: scrollBarHandleColor != null ? colorDict(scrollBarHandleColor) : { r: 0.725, g: 0.71, b: 0.698, a: 1.0 },
      ScrollBarHandleImageRUID: { DataId: scrollBarHandleRuid },
      ScrollBarThickness: Number(scrollBarThickness),
      ScrollBarVisible: Number(scrollBarVisible),
      Spacing: { x: Number(spacing[0]), y: Number(spacing[1]) },
      TotalCount: Number(totalCount),
      UseScroll: Boolean(useScroll),
      VerticalScrollBarDirection: Number(vScrollDir),
      Enable: true,
    };
  }

  _gridViewComponent(...args) {
    return UIBuilder._gridViewComponent(...args);
  }

  static _avatarRendererComponent(color = null, flipX = false, flipY = false, playRate = 1.0, preserveAvatar = 0, raycast = true, materialId = "") {
    return {
      "@type": "MOD.Core.AvatarGUIRendererComponent",
      Color: colorDict(color),
      FlipX: Boolean(flipX),
      FlipY: Boolean(flipY),
      MaterialId: materialId,
      PlayRate: Number(playRate),
      PreserveAvatar: Number(preserveAvatar),
      RaycastTarget: Boolean(raycast),
      Enable: true,
    };
  }

  _avatarRendererComponent(...args) {
    return UIBuilder._avatarRendererComponent(...args);
  }

  static _touchReceiveComponent() {
    return { "@type": "MOD.Core.UITouchReceiveComponent", Enable: true };
  }

  _touchReceiveComponent() {
    return UIBuilder._touchReceiveComponent();
  }

  static _skeletonRendererComponent(skeletonRuid = "", animations = null, skins = null, color = null, flipX = false, flipY = false, loop = true, playRate = 1.0, preserveMode = 0, raycast = true) {
    return {
      "@type": "MOD.Core.SkeletonGUIRendererComponent",
      AnimationNames: animations ? [...animations] : [],
      Color: colorDict(color),
      FlipX: Boolean(flipX),
      FlipY: Boolean(flipY),
      Loop: Boolean(loop),
      PlayRate: Number(playRate),
      PreserveMode: Number(preserveMode),
      RaycastTarget: Boolean(raycast),
      SkeletonRUID: String(skeletonRuid),
      SkinNames: skins ? [...skins] : [],
      Enable: true,
    };
  }

  _skeletonRendererComponent(...args) {
    return UIBuilder._skeletonRendererComponent(...args);
  }

  static _areaParticleComponent(particleType = 0, areaSize = [100, 100], areaOffset = [0, 0], color = null, localScale = [1, 1], loop = true, playOnEnable = true, prewarm = false, autoRandomSeed = true, randomSeed = 0, playSpeed = 1.0, particleSize = 1.0, particleSpeed = 1.0, particleCount = 1.0, particleLifetime = 1.0) {
    return {
      "@type": "MOD.Core.UIAreaParticleComponent",
      AreaOffset: { x: Number(areaOffset[0]), y: Number(areaOffset[1]) },
      AreaSize: { x: Number(areaSize[0]), y: Number(areaSize[1]) },
      AutoRandomSeed: Boolean(autoRandomSeed),
      Color: color != null ? colorDict(color) : { r: 0.5, g: 0.25, b: 0.25, a: 1.0 },
      IsEmitting: false,
      LocalScale: { x: Number(localScale[0]), y: Number(localScale[1]) },
      Loop: Boolean(loop),
      ParticleCount: Number(particleCount),
      ParticleLifeTime: Number(particleLifetime),
      ParticleSize: Number(particleSize),
      ParticleSpeed: Number(particleSpeed),
      ParticleType: Number(particleType),
      PlayOnEnable: Boolean(playOnEnable),
      PlaySpeed: Number(playSpeed),
      Prewarm: Boolean(prewarm),
      RandomSeed: Number(randomSeed),
      Enable: true,
    };
  }

  _areaParticleComponent(...args) {
    return UIBuilder._areaParticleComponent(...args);
  }

  static _basicParticleComponent(particleType = 0, color = null, localScale = [1, 1], loop = true, playOnEnable = true, prewarm = false, autoRandomSeed = true, randomSeed = 0, playSpeed = 1.0, particleSize = 1.0, particleSpeed = 1.0, particleCount = 1.0, particleLifetime = 1.0) {
    return {
      "@type": "MOD.Core.UIBasicParticleComponent",
      AutoRandomSeed: Boolean(autoRandomSeed),
      Color: color != null ? colorDict(color) : { r: 0.5, g: 0.25, b: 0.25, a: 1.0 },
      IsEmitting: false,
      LocalScale: { x: Number(localScale[0]), y: Number(localScale[1]) },
      Loop: Boolean(loop),
      ParticleCount: Number(particleCount),
      ParticleLifeTime: Number(particleLifetime),
      ParticleSize: Number(particleSize),
      ParticleSpeed: Number(particleSpeed),
      ParticleType: Number(particleType),
      PlayOnEnable: Boolean(playOnEnable),
      PlaySpeed: Number(playSpeed),
      Prewarm: Boolean(prewarm),
      RandomSeed: Number(randomSeed),
      Enable: true,
    };
  }

  _basicParticleComponent(...args) {
    return UIBuilder._basicParticleComponent(...args);
  }

  static _spriteParticleComponent(particleType = 0, spriteRuid = "", applySpriteColor = false, localScale = [1, 1], loop = true, playOnEnable = true, prewarm = false, autoRandomSeed = true, randomSeed = 0, playSpeed = 1.0, particleSize = 1.0, particleSpeed = 1.0, particleCount = 1.0, particleLifetime = 1.0, color = null) {
    return {
      "@type": "MOD.Core.UISpriteParticleComponent",
      ApplySpriteColor: Boolean(applySpriteColor),
      AutoRandomSeed: Boolean(autoRandomSeed),
      Color: color != null ? colorDict(color) : { r: 0.5, g: 0.25, b: 0.25, a: 1.0 },
      IsEmitting: false,
      LocalScale: { x: Number(localScale[0]), y: Number(localScale[1]) },
      Loop: Boolean(loop),
      ParticleCount: Number(particleCount),
      ParticleLifeTime: Number(particleLifetime),
      ParticleSize: Number(particleSize),
      ParticleSpeed: Number(particleSpeed),
      ParticleType: Number(particleType),
      PlayOnEnable: Boolean(playOnEnable),
      PlaySpeed: Number(playSpeed),
      Prewarm: Boolean(prewarm),
      RandomSeed: Number(randomSeed),
      SpriteRUID: String(spriteRuid ?? ""),
      Enable: true,
    };
  }

  _spriteParticleComponent(...args) {
    return UIBuilder._spriteParticleComponent(...args);
  }

  static _joystickComponent(dynamicStick = true, axis = 1, upArrow = 273, downArrow = 274, leftArrow = 276, rightArrow = 275) {
    return {
      "@type": "MOD.Core.JoystickComponent",
      Axis: Number(axis),
      DownArrow: Number(downArrow),
      DynamicStick: Boolean(dynamicStick),
      LeftArrow: Number(leftArrow),
      RightArrow: Number(rightArrow),
      UpArrow: Number(upArrow),
      Enable: true,
    };
  }

  _joystickComponent(...args) {
    return UIBuilder._joystickComponent(...args);
  }

  static _softMaskComponent(invertMask = false, invertOutsides = false) {
    return {
      "@type": "MOD.Core.SoftMaskComponent",
      InvertMask: Boolean(invertMask),
      InvertOutsides: Boolean(invertOutsides),
      Enable: true,
    };
  }

  _softMaskComponent(...args) {
    return UIBuilder._softMaskComponent(...args);
  }

  static _chatComponent(useChatBalloon = false, expand = true, useChatEmotion = true, chatEmotionDuration = 5.0, enableVoiceChat = true, hideWorldChatButton = false, messageAlignBottom = false) {
    return {
      "@type": "MOD.Core.ChatComponent",
      ChatEmotionDuration: Number(chatEmotionDuration),
      EnableVoiceChat: Boolean(enableVoiceChat),
      Expand: Boolean(expand),
      HideWorldChatButton: Boolean(hideWorldChatButton),
      MessageAlignBottom: Boolean(messageAlignBottom),
      UseChatBalloon: Boolean(useChatBalloon),
      UseChatEmotion: Boolean(useChatEmotion),
      Enable: true,
    };
  }

  _chatComponent(...args) {
    return UIBuilder._chatComponent(...args);
  }

  static _lineGuiRendererComponent(points = null, isFlexible = true, flexibility = 3.0, isSmooth = false, loop = false, materialId = "") {
    const pointList = Array.isArray(points) ? points.map((point) => {
      const pos = tuple(point.pos != null ? point.pos : point.position, [0, 0]);
      const colorValue = point.color != null ? colorDict(point.color) : { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };
      const width = point.width != null ? Number(point.width) : 1.0;
      return {
        Position: { x: Number(pos[0]), y: Number(pos[1]) },
        Color: colorValue,
        Width: width,
      };
    }) : [];
    return {
      "@type": "MOD.Core.LineGUIRendererComponent",
      Flexibility: Number(flexibility),
      IsFlexible: Boolean(isFlexible),
      IsSmooth: Boolean(isSmooth),
      Loop: Boolean(loop),
      MaterialId: String(materialId ?? ""),
      Points: pointList,
      Enable: true,
    };
  }

  _lineGuiRendererComponent(...args) {
    return UIBuilder._lineGuiRendererComponent(...args);
  }

  static _polygonGuiRendererComponent(points = null, color = null, useCustomUvs = false, uvs = null, materialId = "") {
    const pointList = Array.isArray(points) ? points.map((point) => {
      const arr = tuple(point, [0, 0]);
      return { x: Number(arr[0]), y: Number(arr[1]) };
    }) : [];
    const uvList = Array.isArray(uvs) ? uvs.map((uv) => {
      const arr = tuple(uv, [0, 0]);
      return { x: Number(arr[0]), y: Number(arr[1]) };
    }) : [];
    return {
      "@type": "MOD.Core.PolygonGUIRendererComponent",
      Color: color != null ? colorDict(color) : { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
      MaterialId: String(materialId ?? ""),
      Points: pointList,
      UseCustomUVs: Boolean(useCustomUvs),
      UVs: uvList,
      Enable: true,
    };
  }

  _polygonGuiRendererComponent(...args) {
    return UIBuilder._polygonGuiRendererComponent(...args);
  }

  getId(identifier) {
    const idx = this._findIndex(identifier);
    return idx >= 0 ? this.entities[idx].id : null;
  }

  lastId() {
    return this._lastId;
  }

  _findIndex(identifier) {
    const fullPath = this._normalizePath(identifier);
    return this.entities.findIndex((entity) => this._entityJson(entity).path === fullPath);
  }

  find(identifier) {
    const idx = this._findIndex(identifier);
    return idx < 0 ? null : this.entities[idx];
  }

  hasComponent(identifier, compType) {
    normalizeComponentName(compType);
    const entity = this.find(identifier);
    return entity != null && this._findComponent(entity, compType) != null;
  }

  getComponent(identifier, compType) {
    normalizeComponentName(compType);
    const entity = this.find(identifier);
    return entity == null ? null : this._findComponent(entity, compType);
  }

  remove(identifier) {
    const fullPath = this._normalizePath(identifier);
    if (fullPath === this.root_path) throw new Error("Cannot remove root UI group entity");
    const before = this.entities.length;
    this.entities = this.entities.filter((entity) => {
      const entityPath = this._entityJson(entity).path || "";
      return entityPath !== fullPath && !entityPath.startsWith(`${fullPath}/`);
    });
    const removed = before - this.entities.length;
    if (removed === 0) throw new Error(`UI entity not found: ${identifier}`);
    console.log(`  Removed: ${fullPath} (${removed} entities)`);
    return this;
  }

  _add(name, compNames, entryId, modelId, components, enable = true, preserveExistingTransform = false, transformOptions = {}) {
    const [fullPath, parentPath, entityName] = this._resolve(name);
    const idx = this._findIndex(name);
    let eid;
    let displayOrder;
    let action;
    let existingJs = null;
    let finalComponents = components;
    if (idx >= 0) {
      eid = this.entities[idx].id;
      existingJs = this.entities[idx].jsonString;
      displayOrder = existingJs.displayOrder;
      action = "Updated";
      const existingTransform = (existingJs["@components"] || []).find(
        (component) => component["@type"] === "MOD.Core.UITransformComponent",
      );
      if (existingTransform && (preserveExistingTransform || hasExplicitTransformOptions(transformOptions))) {
        finalComponents = (components || []).map((component) =>
          component["@type"] === "MOD.Core.UITransformComponent"
            ? (preserveExistingTransform ? clone(existingTransform) : this._mergeUiTransform(existingTransform, transformOptions))
            : component,
        );
      }
    } else {
      if (parentPath !== this.root_path && !this.entities.some((entity) => this._entityJson(entity).path === parentPath)) {
        const parentRel = parentPath.slice(this.root_path.length).replace(/^\/+/, "");
        throw new Error(
          `Cannot add '${fullPath}': parent entity '${parentPath}' does not exist. ` +
          `Create the parent container first (e.g. empty("${parentRel}") or panel("${parentRel}")) before adding nested children. ` +
          `A nested child whose parent is missing becomes an orphan that the engine cannot mount correctly.`,
        );
      }
      eid = crypto.randomUUID();
      displayOrder = this._nextDisplayOrder(parentPath);
      action = "Added";
    }
    const derivedNames = (finalComponents || []).map((component) => component["@type"]).filter(Boolean).join(",") || compNames;
    const origin = existingJs && existingJs.origin ? clone(existingJs.origin) : {
      type: "Model",
      entry_id: entryId,
      sub_entity_id: null,
      root_entity_id: null,
      replaced_model_id: null,
    };
    origin.entry_id = entryId;
    const entity = {
      id: eid,
      path: fullPath,
      componentNames: derivedNames,
      jsonString: {
        name: existingJs ? existingJs.name : entityName,
        path: fullPath,
        nameEditable: existingJs ? existingJs.nameEditable : true,
        enable,
        visible: existingJs ? existingJs.visible : true,
        localize: existingJs ? existingJs.localize : true,
        displayOrder,
        pathConstraints: this._pathConstraints(fullPath),
        revision: existingJs ? (existingJs.revision ?? 0) : 0,
        origin,
        modelId,
        "@components": finalComponents,
        "@version": 1,
      },
    };
    if (idx >= 0) this.entities[idx] = entity;
    else this.entities.push(entity);
    console.log(`  ${action}: ${name}`);
    this._lastId = eid;
    return this;
  }

  patch(identifier, options = {}) {
    const idx = this._findIndex(identifier);
    if (idx < 0) throw new Error(`UI entity not found: ${identifier}`);
    const entity = this.entities[idx];
    const js = this._entityJson(entity);
    const transform = this._findComponent(entity, "MOD.Core.UITransformComponent");
    if (transform && hasExplicitTransformOptions(options)) {
      const rebuilt = this._mergeUiTransform(transform, options);
      Object.keys(transform).forEach((key) => delete transform[key]);
      Object.assign(transform, rebuilt);
    }
    if (options.enable != null) js.enable = Boolean(options.enable);
    if (options.visible != null) js.visible = Boolean(options.visible);
    if (options.localize != null) js.localize = Boolean(options.localize);
    if (options.display_order != null) js.displayOrder = Number(options.display_order);
    if (options.new_name) this.rename(identifier, options.new_name);
    console.log(`  Patched: ${js.path}`);
    return this;
  }

  rename(identifier, newName) {
    const idx = this._findIndex(identifier);
    if (idx < 0) throw new Error(`UI entity not found: ${identifier}`);
    const entity = this.entities[idx];
    const js = this._entityJson(entity);
    const oldPath = js.path;
    if (oldPath === this.root_path) throw new Error("Cannot rename root UI group path");
    const parent = oldPath.split("/").slice(0, -1).join("/");
    const newPath = `${parent}/${newName}`;
    for (const current of this.entities) {
      const currentJs = this._entityJson(current);
      const currentPath = currentJs.path || "";
      if (currentPath === oldPath || currentPath.startsWith(`${oldPath}/`)) {
        const suffix = currentPath.slice(oldPath.length);
        const updated = newPath + suffix;
        current.path = updated;
        currentJs.path = updated;
        currentJs.pathConstraints = this._pathConstraints(updated);
        if (currentPath === oldPath) currentJs.name = newName;
      }
    }
    console.log(`  Renamed: ${oldPath} -> ${newPath}`);
    return this;
  }

  upsertComponent(identifier, compType, compData = null) {
    normalizeComponentName(compType);
    const idx = this._findIndex(identifier);
    if (idx < 0) throw new Error(`UI entity not found: ${identifier}`);
    const entity = this.entities[idx];
    const js = this._entityJson(entity);
    const component = compData == null ? { "@type": compType, Enable: true } : clone(compData);
    if (!component["@type"]) component["@type"] = compType;
    const conflicts = MUTUALLY_EXCLUSIVE_COMPONENTS.get(component["@type"]);
    if (conflicts) {
      const before = (js["@components"] || []).length;
      js["@components"] = (js["@components"] || []).filter((c) => !conflicts.includes(c["@type"]));
      if (js["@components"].length !== before) {
        console.log(`  Dropped ${conflicts.join("/")} on ${js.name} (mutually exclusive with ${component["@type"]})`);
      }
    }
    const current = this._findComponent(entity, compType);
    if (current != null) {
      Object.keys(current).forEach((key) => delete current[key]);
      Object.assign(current, component);
      this._refreshComponentNamesFromComponents(entity);
      this._normalizeTextGuiRendererModelIdentity(entity);
      console.log(`  Replaced component ${compType} on ${js.name}`);
      return this;
    }
    js["@components"] = js["@components"] || [];
    js["@components"].push(component);
    this._refreshComponentNamesFromComponents(entity);
    this._normalizeTextGuiRendererModelIdentity(entity);
    console.log(`  Added component ${compType} to ${js.name}`);
    return this;
  }

  addComponent(identifier, compType, compData = null) {
    normalizeComponentName(compType);
    const idx = this._findIndex(identifier);
    if (idx < 0) throw new Error(`UI entity not found: ${identifier}`);
    if (this._findComponent(this.entities[idx], compType) != null) {
      throw new Error(`Component ${compType} already exists on ${identifier}; use upsertComponent to replace`);
    }
    return this.upsertComponent(identifier, compType, compData);
  }

  patchComponent(identifier, compType, updates) {
    normalizeComponentName(compType);
    const entity = this.find(identifier);
    if (entity == null) throw new Error(`UI entity not found: ${identifier}`);
    const component = this._findComponent(entity, compType);
    if (component == null) throw new Error(`UI entity ${identifier} has no ${compType}`);
    Object.assign(component, updates);
    console.log(`  Patched component ${compType} on ${this._entityJson(entity).name}`);
    return this;
  }

  removeComponent(identifier, compType) {
    normalizeComponentName(compType);
    const idx = this._findIndex(identifier);
    if (idx < 0) throw new Error(`UI entity not found: ${identifier}`);
    if (compType === "MOD.Core.UITransformComponent") throw new Error("UITransformComponent cannot be removed from UI entities");
    const entity = this.entities[idx];
    const js = this._entityJson(entity);
    if (this._findComponent(entity, compType) == null) throw new Error(`UI entity ${identifier} has no ${compType}`);
    js["@components"] = (js["@components"] || []).filter((component) => component["@type"] !== compType);
    this._refreshComponentNamesFromComponents(entity);
    console.log(`  Removed component ${compType} from ${js.name}`);
    return this;
  }

  setComponentEnabled(identifier, compType, enabled) {
    normalizeComponentName(compType);
    const entity = this.find(identifier);
    if (entity == null) throw new Error(`UI entity not found: ${identifier}`);
    const component = this._findComponent(entity, compType);
    if (component == null) throw new Error(`UI entity ${identifier} has no ${compType}`);
    component.Enable = Boolean(enabled);
    console.log(`  Set ${compType}.Enable=${enabled} on ${this._entityJson(entity).name}`);
    return this;
  }

  panel(name, options = {}) {
    assertNoParentOption("panel", name, options);
    const sort = _resolveSortOptions(options);
    const components = [
      this._uiTransform(options.anchor || "middle-center", tuple(options.pos, [0, 0]), tuple(options.rect_size, [1920, 1080]), options.pivot ?? null),
      this._spriteRenderer(options.color ?? null, options.alpha ?? null, options.raycast ?? false, options.fill_method ?? 0, options.sprite_type ?? null, options.image_ruid ?? null, { preserve_aspect: options.preserve_aspect ?? false, preserve_sprite: options.preserve_sprite, material_id: options.material_id ?? "", ...sort }),
    ];
    const textComponent = this._textFromOptions(options);
    if (textComponent) components.push(textComponent);
    const componentNames = textComponent
      ? "MOD.Core.UITransformComponent,MOD.Core.SpriteGUIRendererComponent,MOD.Core.TextGUIRendererComponent"
      : "MOD.Core.UITransformComponent,MOD.Core.SpriteGUIRendererComponent";
    return this._add(name, componentNames, "UISprite", "uisprite", components, options.enable ?? true, !hasExplicitTransformOptions(options), options);
  }

  empty(name, options = {}) {
    assertNoParentOption("empty", name, options);
    return this._add(name, "MOD.Core.UITransformComponent", "UIEmpty", "uiempty", [
      this._uiTransform(options.anchor || "middle-center", tuple(options.pos, [0, 0]), tuple(options.rect_size, [100, 100]), options.pivot ?? null),
    ], options.enable ?? true, !hasExplicitTransformOptions(options), options);
  }

  text(name, text = "", options = {}) {
    assertNoParentOption("text", name, options);
    const size = options.size ?? 24;
    let rectSize = options.rect_size;
    if (rectSize == null) rectSize = [Math.max(String(text).length * size, 400), size + 16];
    const sort = _resolveSortOptions(options);
    return this._add(name, "MOD.Core.UITransformComponent,MOD.Core.SpriteGUIRendererComponent,MOD.Core.TextGUIRendererComponent", "UITextGUIRenderer", "uitextguirenderer", [
      this._uiTransform(options.anchor || "middle-center", tuple(options.pos, [0, 0]), rectSize, options.pivot ?? null),
      this._spriteRenderer(null, 0.0, false, 0, 0, "", sort),
      this._textGuiRenderer(text, size, options.color ?? null, options.bold ?? false, options.alignment ?? 4, {
        overflow: options.overflow ?? 0,
        bestfit: options.bestfit ?? false,
        min_size: options.min_size ?? 10,
        max_size: options.max_size ?? null,
        outline: options.outline ?? false,
        outline_color: options.outline_color ?? null,
        outline_width: options.outline_width ?? null,
        use_constraint_x: options.use_constraint_x ?? false,
        constraint_x: options.constraint_x ?? 100.0,
        use_constraint_y: options.use_constraint_y ?? false,
        constraint_y: options.constraint_y ?? 100.0,
        ...sort,
      }),
    ], options.enable ?? true, !hasExplicitTransformOptions(options), options);
  }

  sprite(name, options = {}) {
    assertNoParentOption("sprite", name, options);
    const imageRuid = options.image_ruid != null ? options.image_ruid : this.default_ruid;
    const sort = _resolveSortOptions(options);
    const components = [
      this._uiTransform(options.anchor || "middle-center", tuple(options.pos, [0, 0]), tuple(options.rect_size, [100, 100]), options.pivot ?? null),
      this._spriteRenderer(options.color ?? null, options.alpha ?? null, options.raycast ?? false, options.fill_method ?? 0, options.sprite_type ?? null, imageRuid, { preserve_aspect: options.preserve_aspect ?? false, preserve_sprite: options.preserve_sprite, material_id: options.material_id ?? "", ...sort }),
    ];
    const textComponent = this._textFromOptions(options);
    if (textComponent) components.push(textComponent);
    const componentNames = textComponent
      ? "MOD.Core.UITransformComponent,MOD.Core.SpriteGUIRendererComponent,MOD.Core.TextGUIRendererComponent"
      : "MOD.Core.UITransformComponent,MOD.Core.SpriteGUIRendererComponent";
    return this._add(name, componentNames, "UISprite", "uisprite", components, options.enable ?? true, !hasExplicitTransformOptions(options), options);
  }

  button(name, text = "", options = {}) {
    assertNoParentOption("button", name, options);
    const imageRuid = options.image_ruid != null ? options.image_ruid : this.default_ruid;
    const sort = _resolveSortOptions(options);
    return this._add(name, "MOD.Core.UITransformComponent,MOD.Core.SpriteGUIRendererComponent,MOD.Core.ButtonComponent,MOD.Core.TextGUIRendererComponent", "UIButton", "uibutton", [
      this._uiTransform(options.anchor || "middle-center", tuple(options.pos, [0, 0]), tuple(options.rect_size, [200, 50]), options.pivot ?? null),
      this._spriteRenderer(options.bg_color ?? null, options.alpha ?? null, true, 0, options.sprite_type ?? null, imageRuid, sort),
      this._buttonComponent(sort),
      this._textGuiRenderer(text, options.font_size ?? 24, options.color ?? "#FFFFFF", false, 4, sort),
    ], options.enable ?? true, !hasExplicitTransformOptions(options), options);
  }

  script(name, scriptName, options = {}) {
    if (scriptName == null || typeof scriptName !== "string") {
      throw new TypeError(
        `UIBuilder.script(name, scriptName, options) requires a 3-arg form. ` +
          `Use b.script("Controller", "script.MyController", { ...options }). ` +
          `Do not pass { scripts: [...] } as the second argument.`
      );
    }
    normalizeComponentName(scriptName);
    if (options && Object.prototype.hasOwnProperty.call(options, "scripts")) {
      throw new Error(
        `UIBuilder.script() does not accept options.scripts. ` +
          `Pass the script component type as the second argument: ` +
          `b.script("Controller", "script.MyController", options).`
      );
    }
    assertNoParentOption("script", name, options);
    return this._add(name, `MOD.Core.UITransformComponent,${scriptName}`, "UIEmpty", "uiempty", [
      this._uiTransform(options.anchor || "stretch", tuple(options.pos, [0, 0]), tuple(options.rect_size, [1920, 1080]), options.pivot ?? null),
      { "@type": scriptName, Enable: true },
    ], options.enable ?? true, !hasExplicitTransformOptions(options), options);
  }

  slider(name, options = {}) {
    assertNoParentOption("slider", name, options);
    const imageRuid = options.image_ruid != null ? options.image_ruid : this.default_ruid;
    const sort = _resolveSortOptions(options);
    return this._add(name, "MOD.Core.UITransformComponent,MOD.Core.SpriteGUIRendererComponent,MOD.Core.SliderComponent", "UIEmpty", "uiempty", [
      this._uiTransform(options.anchor || "middle-center", tuple(options.pos, [0, 0]), tuple(options.rect_size, [200, 30]), options.pivot ?? null),
      this._spriteRenderer(options.bg_color ?? null, options.alpha ?? null, true, 0, options.sprite_type ?? null, imageRuid, sort),
      this._sliderComponent(options.min_val ?? 0, options.max_val ?? 1, options.value ?? 0, options.direction ?? 0, options.use_handle ?? true, options.use_integer ?? false, { ...options, ...sort }),
    ], options.enable ?? true, !hasExplicitTransformOptions(options), options);
  }

  scrollLayout(name, options = {}) {
    assertNoParentOption("scrollLayout", name, options);
    const sort = _resolveSortOptions(options);
    return this._add(name, "MOD.Core.UITransformComponent,MOD.Core.ScrollLayoutGroupComponent", "UIEmpty", "uiempty", [
      this._uiTransform(options.anchor || "middle-center", tuple(options.pos, [0, 0]), tuple(options.rect_size, [400, 600]), options.pivot ?? null),
      this._scrollLayoutComponent(options.layout_type ?? 1, options.spacing ?? 0, tuple(options.cell_size, [100, 100]), options.use_scroll ?? true, tuple(options.padding, [0, 0, 0, 0]), { ...options, ...sort }),
    ], options.enable ?? true, !hasExplicitTransformOptions(options), options);
  }

  textInput(name, options = {}) {
    assertNoParentOption("textInput", name, options);
    const imageRuid = options.image_ruid != null ? options.image_ruid : this.default_ruid;
    const sort = _resolveSortOptions(options);
    return this._add(name, "MOD.Core.UITransformComponent,MOD.Core.SpriteGUIRendererComponent,MOD.Core.TextGUIRendererComponent,MOD.Core.TextGUIRendererInputComponent", "UIEmpty", "uiempty", [
      this._uiTransform(options.anchor || "middle-center", tuple(options.pos, [0, 0]), tuple(options.rect_size, [300, 50]), options.pivot ?? null),
      this._spriteRenderer(options.bg_color ?? null, options.alpha ?? null, true, 0, options.sprite_type ?? null, imageRuid, sort),
      this._textGuiRenderer(String(options.text ?? ""), options.font_size ?? 24, options.color ?? "#FFFFFF", false, 4, sort),
      this._textInputComponent(options.placeholder ?? "", options.char_limit ?? 0, options.content_type ?? 0, options.line_type ?? 0, { ...options, ...sort }),
    ], options.enable ?? true, !hasExplicitTransformOptions(options), options);
  }

  group(name, options = {}) {
    assertNoParentOption("group", name, options);
    const [fullPath] = this._resolve(name);
    if (fullPath !== this.root_path) {
      throw new Error(
        `UIBuilder.group() creates only the .ui root UIGroup. ` +
          `Nested UIGroup entities are not supported because they can fail to render correctly. ` +
          `Use empty("${name}") or panel("${name}") for inner grouping.`,
      );
    }
    return this._add(name, "MOD.Core.UITransformComponent,MOD.Core.UIGroupComponent,MOD.Core.CanvasGroupComponent", "UIGroup", "uigroup", [
      this._uiTransform(options.anchor || "stretch", tuple(options.pos, [0, 0]), tuple(options.rect_size, [1920, 1080]), options.pivot ?? null),
      this._uiGroupComponent(options.default_show ?? true, options.group_order ?? 0, options.group_type ?? 1),
      this._canvasGroupComponent(options.blocks_raycasts ?? true, options.group_alpha ?? 1.0, options.interactable ?? true),
    ], options.enable ?? true, !hasExplicitTransformOptions(options), options);
  }

  mask(name, options = {}) {
    assertNoParentOption("mask", name, options);
    const imageRuid = options.image_ruid != null ? options.image_ruid : this.default_ruid;
    return this._add(name, "MOD.Core.UITransformComponent,MOD.Core.SpriteGUIRendererComponent,MOD.Core.MaskComponent", "UIEmpty", "uiempty", [
      this._uiTransform(options.anchor || "middle-center", tuple(options.pos, [0, 0]), tuple(options.rect_size, [200, 200]), options.pivot ?? null),
      this._spriteRenderer(options.color ?? null, options.alpha ?? 0.0, false, 0, 0, imageRuid),
      this._maskComponent(options.shape ?? 0, tuple(options.padding, [0, 0, 0, 0]), tuple(options.softness, [0, 0])),
    ], options.enable ?? true, !hasExplicitTransformOptions(options), options);
  }

  gridView(name, options = {}) {
    assertNoParentOption("gridView", name, options);
    return this._add(name, "MOD.Core.UITransformComponent,MOD.Core.GridViewComponent", "UIEmpty", "uiempty", [
      this._uiTransform(options.anchor || "middle-center", tuple(options.pos, [0, 0]), tuple(options.rect_size, [400, 600]), options.pivot ?? null),
      this._gridViewComponent(options.total_count ?? 0, tuple(options.cell_size, [100, 100]), options.fixed_count ?? 1, options.fixed_type ?? 0, tuple(options.spacing, [0, 0]), tuple(options.padding, [0, 0, 0, 0]), options.use_scroll ?? true, options.scroll_bar_visible ?? 1, options.scroll_bar_thickness ?? 10.0),
    ], options.enable ?? true, !hasExplicitTransformOptions(options), options);
  }

  avatar(name, options = {}) {
    assertNoParentOption("avatar", name, options);
    return this._add(name, "MOD.Core.UITransformComponent,MOD.Core.AvatarGUIRendererComponent", "UIEmpty", "uiempty", [
      this._uiTransform(options.anchor || "middle-center", tuple(options.pos, [0, 0]), tuple(options.rect_size, [200, 300]), options.pivot ?? null),
      this._avatarRendererComponent(options.color ?? null, options.flip_x ?? false, options.flip_y ?? false, options.play_rate ?? 1.0, options.preserve_avatar ?? 0, options.raycast ?? true, options.material_id ?? ""),
    ], options.enable ?? true, !hasExplicitTransformOptions(options), options);
  }

  touchReceive(name, options = {}) {
    assertNoParentOption("touchReceive", name, options);
    return this._add(name, "MOD.Core.UITransformComponent,MOD.Core.UITouchReceiveComponent", "UIEmpty", "uiempty", [
      this._uiTransform(options.anchor || "stretch", tuple(options.pos, [0, 0]), tuple(options.rect_size, [1920, 1080]), options.pivot ?? null),
      this._touchReceiveComponent(),
    ], options.enable ?? true, !hasExplicitTransformOptions(options), options);
  }

  skeleton(name, options = {}) {
    assertNoParentOption("skeleton", name, options);
    return this._add(name, "MOD.Core.UITransformComponent,MOD.Core.SkeletonGUIRendererComponent", "UIEmpty", "uiempty", [
      this._uiTransform(options.anchor || "middle-center", tuple(options.pos, [0, 0]), tuple(options.rect_size, [200, 200]), options.pivot ?? null),
      this._skeletonRendererComponent(options.skeleton_ruid ?? "", options.animations ?? null, options.skins ?? null, options.color ?? null, options.flip_x ?? false, options.flip_y ?? false, options.loop ?? true, options.play_rate ?? 1.0, options.preserve_mode ?? 0, options.raycast ?? true),
    ], options.enable ?? true, !hasExplicitTransformOptions(options), options);
  }

  areaParticle(name, options = {}) {
    assertNoParentOption("areaParticle", name, options);
    return this._add(name, "MOD.Core.UITransformComponent,MOD.Core.UIAreaParticleComponent", "UIEmpty", "uiempty", [
      this._uiTransform(options.anchor || "middle-center", tuple(options.pos, [0, 0]), tuple(options.rect_size, [100, 100]), options.pivot ?? null),
      this._areaParticleComponent(options.particle_type ?? 0, tuple(options.area_size, [100, 100]), tuple(options.area_offset, [0, 0]), options.color ?? null, tuple(options.local_scale, [1, 1]), options.loop ?? true, options.play_on_enable ?? true, options.prewarm ?? false, options.auto_random_seed ?? true, options.random_seed ?? 0, options.play_speed ?? 1.0, options.particle_size ?? 1.0, options.particle_speed ?? 1.0, options.particle_count ?? 1.0, options.particle_lifetime ?? 1.0),
    ], options.enable ?? true, !hasExplicitTransformOptions(options), options);
  }

  basicParticle(name, options = {}) {
    assertNoParentOption("basicParticle", name, options);
    return this._add(name, "MOD.Core.UITransformComponent,MOD.Core.UIBasicParticleComponent", "UIEmpty", "uiempty", [
      this._uiTransform(options.anchor || "middle-center", tuple(options.pos, [0, 0]), tuple(options.rect_size, [100, 100]), options.pivot ?? null),
      this._basicParticleComponent(options.particle_type ?? 0, options.color ?? null, tuple(options.local_scale, [1, 1]), options.loop ?? true, options.play_on_enable ?? true, options.prewarm ?? false, options.auto_random_seed ?? true, options.random_seed ?? 0, options.play_speed ?? 1.0, options.particle_size ?? 1.0, options.particle_speed ?? 1.0, options.particle_count ?? 1.0, options.particle_lifetime ?? 1.0),
    ], options.enable ?? true, !hasExplicitTransformOptions(options), options);
  }

  spriteParticle(name, options = {}) {
    assertNoParentOption("spriteParticle", name, options);
    return this._add(name, "MOD.Core.UITransformComponent,MOD.Core.UISpriteParticleComponent", "UIEmpty", "uiempty", [
      this._uiTransform(options.anchor || "middle-center", tuple(options.pos, [0, 0]), tuple(options.rect_size, [100, 100]), options.pivot ?? null),
      this._spriteParticleComponent(options.particle_type ?? 0, options.sprite_ruid ?? "", options.apply_sprite_color ?? false, tuple(options.local_scale, [1, 1]), options.loop ?? true, options.play_on_enable ?? true, options.prewarm ?? false, options.auto_random_seed ?? true, options.random_seed ?? 0, options.play_speed ?? 1.0, options.particle_size ?? 1.0, options.particle_speed ?? 1.0, options.particle_count ?? 1.0, options.particle_lifetime ?? 1.0, options.color ?? null),
    ], options.enable ?? true, !hasExplicitTransformOptions(options), options);
  }

  joystick(name, options = {}) {
    assertNoParentOption("joystick", name, options);
    const imageRuid = options.image_ruid != null ? options.image_ruid : this.default_ruid;
    return this._add(name, "MOD.Core.UITransformComponent,MOD.Core.SpriteGUIRendererComponent,MOD.Core.JoystickComponent", "UIEmpty", "uiempty", [
      this._uiTransform(options.anchor || "bottom-left", tuple(options.pos, [200, 200]), tuple(options.rect_size, [300, 300]), options.pivot ?? null),
      this._spriteRenderer(options.color ?? null, options.alpha ?? null, false, 0, options.sprite_type ?? null, imageRuid),
      this._joystickComponent(options.dynamic_stick ?? true, options.axis ?? 1, options.up_arrow ?? 273, options.down_arrow ?? 274, options.left_arrow ?? 276, options.right_arrow ?? 275),
    ], options.enable ?? true, !hasExplicitTransformOptions(options), options);
  }

  softMask(name, options = {}) {
    assertNoParentOption("softMask", name, options);
    const imageRuid = options.image_ruid != null ? options.image_ruid : this.default_ruid;
    return this._add(name, "MOD.Core.UITransformComponent,MOD.Core.SpriteGUIRendererComponent,MOD.Core.SoftMaskComponent", "UIEmpty", "uiempty", [
      this._uiTransform(options.anchor || "middle-center", tuple(options.pos, [0, 0]), tuple(options.rect_size, [200, 200]), options.pivot ?? null),
      this._spriteRenderer(options.color ?? null, options.alpha ?? 0.0, false, 0, 0, imageRuid),
      this._softMaskComponent(options.invert_mask ?? false, options.invert_outsides ?? false),
    ], options.enable ?? true, !hasExplicitTransformOptions(options), options);
  }

  chat(name, options = {}) {
    assertNoParentOption("chat", name, options);
    const imageRuid = options.image_ruid != null ? options.image_ruid : this.default_ruid;
    return this._add(name, "MOD.Core.UITransformComponent,MOD.Core.SpriteGUIRendererComponent,MOD.Core.ChatComponent", "UIEmpty", "uiempty", [
      this._uiTransform(options.anchor || "bottom-left", tuple(options.pos, [200, 200]), tuple(options.rect_size, [400, 300]), options.pivot ?? null),
      this._spriteRenderer(options.color ?? null, options.alpha ?? 0.0, true, 0, 0, imageRuid),
      this._chatComponent(options.use_chat_balloon ?? false, options.expand ?? true, options.use_chat_emotion ?? true, options.chat_emotion_duration ?? 5.0, options.enable_voice_chat ?? true, options.hide_world_chat_button ?? false, options.message_align_bottom ?? false),
    ], options.enable ?? true, !hasExplicitTransformOptions(options), options);
  }

  line(name, options = {}) {
    assertNoParentOption("line", name, options);
    return this._add(name, "MOD.Core.UITransformComponent,MOD.Core.LineGUIRendererComponent", "UIEmpty", "uiempty", [
      this._uiTransform(options.anchor || "middle-center", tuple(options.pos, [0, 0]), tuple(options.rect_size, [100, 100]), options.pivot ?? null),
      this._lineGuiRendererComponent(options.points ?? null, options.is_flexible ?? true, options.flexibility ?? 3.0, options.is_smooth ?? false, options.loop ?? false, options.material_id ?? ""),
    ], options.enable ?? true, !hasExplicitTransformOptions(options), options);
  }

  polygon(name, options = {}) {
    assertNoParentOption("polygon", name, options);
    return this._add(name, "MOD.Core.UITransformComponent,MOD.Core.PolygonGUIRendererComponent", "UIEmpty", "uiempty", [
      this._uiTransform(options.anchor || "middle-center", tuple(options.pos, [0, 0]), tuple(options.rect_size, [100, 100]), options.pivot ?? null),
      this._polygonGuiRendererComponent(options.points ?? null, options.color ?? null, options.use_custom_uvs ?? false, options.uvs ?? null, options.material_id ?? ""),
    ], options.enable ?? true, !hasExplicitTransformOptions(options), options);
  }

  listEntities() {
    const result = [];
    for (const entity of [...this.entities].sort((a, b) => String(this._entityJson(a).path || "").localeCompare(String(this._entityJson(b).path || "")))) {
      const js = entity.jsonString;
      const comps = (js["@components"] || []).map((component) => component["@type"]);
      let kind = "?";
      const model = js.modelId || "";
      if (model === "uigroup") kind = "GROUP";
      else if (model === "uibutton") kind = "BTN";
      else if (model === "uitext" || model === "uitextguirenderer") kind = "TEXT";
      else if (model === "uisprite") kind = "SPR";
      else if (model === "uiempty") kind = "PANEL";
      for (const component of comps) {
        if (!KNOWN_COMPONENTS.has(component)) kind = "SCRIPT";
        else if (component === "MOD.Core.UIGroupComponent" && kind !== "GROUP") kind = "GROUP";
        else if ((component === "MOD.Core.TextComponent" || component === "MOD.Core.TextGUIRendererComponent") && kind === "?") kind = "TEXT";
        else if (component === "MOD.Core.MaskComponent") kind = "MASK";
        else if (component === "MOD.Core.SoftMaskComponent") kind = "MASK";
        else if (component === "MOD.Core.GridViewComponent") kind = "GRID";
        else if (component === "MOD.Core.AvatarGUIRendererComponent") kind = "AVATAR";
        else if (component === "MOD.Core.UITouchReceiveComponent") kind = "TOUCH";
        else if (component === "MOD.Core.SkeletonGUIRendererComponent") kind = "SKEL";
        else if (component === "MOD.Core.UIAreaParticleComponent" || component === "MOD.Core.UIBasicParticleComponent" || component === "MOD.Core.UISpriteParticleComponent") kind = "PARTICLE";
        else if (component === "MOD.Core.JoystickComponent") kind = "JOY";
        else if (component === "MOD.Core.ChatComponent") kind = "CHAT";
        else if (component === "MOD.Core.LineGUIRendererComponent") kind = "LINE";
        else if (component === "MOD.Core.PolygonGUIRendererComponent") kind = "POLY";
      }
      let pos = [0, 0];
      let size = [0, 0];
      for (const component of js["@components"] || []) {
        if (component["@type"] === "MOD.Core.UITransformComponent") {
          const ap = component.anchoredPosition || {};
          const rs = component.RectSize || {};
          pos = [ap.x || 0, ap.y || 0];
          size = [rs.x || 0, rs.y || 0];
        }
      }
      const entityPath = js.path || "";
      const depth = entityPath.startsWith(this.root_path) ? (entityPath.slice(this.root_path.length).match(/\//g) || []).length : 0;
      result.push({ name: js.name || "", path: entityPath, depth, kind, pos, size, enable: js.enable ?? true });
    }
    return result;
  }

  printEntities() {
    const items = this.listEntities();
    for (const info of items) {
      const indent = "  ".repeat(info.depth);
      const posStr = info.pos[0] !== 0 || info.pos[1] !== 0 ? `(${info.pos[0].toFixed(0)},${info.pos[1].toFixed(0)})` : "";
      const sizeStr = `${Number(info.size[0]).toFixed(0)}x${Number(info.size[1]).toFixed(0)}`;
      const enableStr = info.enable ? "" : " [disabled]";
      console.log(`  ${indent}${info.kind.padEnd(6)} ${info.name.padEnd(20)} ${posStr.padEnd(12)} ${sizeStr}${enableStr}`);
    }
    return items;
  }

  build() {
    if (this._data != null) {
      this._data.ContentProto.Entities = this.entities;
      return this._data;
    }
    return {
      Id: "",
      GameId: "",
      EntryKey: `ui://${this.root_uuid}`,
      ContentType: "x-mod/ui",
      Content: "",
      Usage: 0,
      UsePublish: 1,
      UseService: 0,
      CoreVersion: "26.5.0.0",
      StudioVersion: "0.1.0.0",
      DynamicLoading: 0,
      ContentProto: { Use: "Binary", Entities: this.entities },
    };
  }

  validate() {
    const findings = [];
    const data = this.build();
    collectInvalidNumbers(data, "$", findings);
    collectComponentScalarTypeIssues(data, findings);
    return findings;
  }

  write(filepath, options = {}) {
    const lint = options.lint ?? true;
    const strict = options.strict ?? true;
    const lintVerbose = options.lint_verbose ?? false;

    const findings = this.validate();
    const errors = findings.filter((f) => f.severity === "error");
    if (errors.length) {
      throw new TypeError(`UI validation failed: ${errors.map((f) => `${f.rule}: ${f.message}`).join("; ")}`);
    }

    let bindPlan = null;
    if (options.bind != null) {
      const [mluaPath, props] = UIBuilder._normalizeBindArg(options.bind);
      bindPlan = this._prepareBindings(mluaPath, props);
    }

    const data = this.build();
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    console.log(`Written ${this.entities.length} entities to ${filepath}`);

    if (lint) {
      runUiLint(filepath, strict, lintVerbose);
    }

    if (bindPlan) {
      fs.writeFileSync(bindPlan.mluaPath, bindPlan.updatedSrc, "utf8");
      console.log(`  Bound ${Object.keys(bindPlan.resolved).length} property/properties in ${bindPlan.mluaPath}`);
    }
    return this;
  }

  static _normalizeBindArg(bind) {
    if (Array.isArray(bind) && bind.length === 2) return [bind[0], bind[1]];
    if (bind && typeof bind === "object") {
      if (bind.mlua == null || bind.props == null) {
        throw new Error(`bind dict must contain 'mlua' (path) and 'props' (mapping). Got keys=${Object.keys(bind)}`);
      }
      return [bind.mlua, bind.props];
    }
    throw new TypeError(`bind must be a dict {'mlua': ..., 'props': {...}} or a (mlua_path, props) tuple. Got ${typeof bind}`);
  }

  _prepareBindings(mluaPath, props) {
    if (!fs.existsSync(mluaPath) || !fs.statSync(mluaPath).isFile()) throw new Error(`injectBindings: target .mlua not found: ${mluaPath}`);
    if (path.extname(mluaPath) !== ".mlua") throw new Error(`injectBindings: target must be a .mlua file: ${mluaPath}`);
    const resolved = {};
    const missingEntities = [];
    for (const [propName, entityRef] of Object.entries(props)) {
      const uid = this.getId(entityRef);
      if (uid == null) missingEntities.push(`${propName} -> ${entityRef}`);
      else resolved[propName] = uid;
    }
    if (missingEntities.length) throw new Error(`injectBindings: entity not found for ${missingEntities.join(", ")}`);

    const original = fs.readFileSync(mluaPath, "utf8");
    const { src: updatedSrc, counts } = applyBindings(original, resolved);
    const missingProps = [];
    const duplicatedProps = [];
    for (const propName of Object.keys(resolved)) {
      const count = counts[propName] || 0;
      if (count === 0) missingProps.push(propName);
      else if (count > 1) duplicatedProps.push(`${propName} (${count}x)`);
    }
    if (missingProps.length) throw new Error(`injectBindings: property not found in ${mluaPath}: ${missingProps.join(", ")}`);
    if (duplicatedProps.length) throw new Error(`injectBindings: property declared multiple times in ${mluaPath}: ${duplicatedProps.join(", ")}`);
    return { mluaPath, resolved, updatedSrc };
  }

  injectBindings(mluaPath, props) {
    const plan = this._prepareBindings(mluaPath, props);
    fs.writeFileSync(plan.mluaPath, plan.updatedSrc, "utf8");
    console.log(`  Bound ${Object.keys(plan.resolved).length} property/properties in ${plan.mluaPath}`);
    return this;
  }

}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findLineCommentStart(line) {
  let inDouble = false;
  let inSingle = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    const prev = i > 0 ? line[i - 1] : "";
    if (!inSingle && c === '"' && prev !== "\\") inDouble = !inDouble;
    else if (!inDouble && c === "'" && prev !== "\\") inSingle = !inSingle;
    else if (!inDouble && !inSingle && c === "-" && line[i + 1] === "-") return i;
  }
  return -1;
}

function replacePropertyDecls(segment, resolved, counts) {
  const commentIdx = findLineCommentStart(segment);
  const code = commentIdx >= 0 ? segment.slice(0, commentIdx) : segment;
  const comment = commentIdx >= 0 ? segment.slice(commentIdx) : "";
  let updated = code;
  for (const [propName, uid] of Object.entries(resolved)) {
    const pattern = new RegExp(
      `^(\\s*property\\s+[A-Za-z_][A-Za-z0-9_.]*\\s+${escapeRegExp(propName)}\\b\\s*=\\s*)"[^"\\r\\n]*"`,
    );
    if (pattern.test(updated)) {
      counts[propName] = (counts[propName] || 0) + 1;
      updated = updated.replace(pattern, (_m, prefix) => `${prefix}"${uid}"`);
    }
  }
  return updated + comment;
}

function applyBindings(src, resolved) {
  const lineSep = src.includes("\r\n") ? "\r\n" : "\n";
  const lines = src.split(/\r?\n/);
  const counts = {};
  let inBlockComment = false;
  const out = lines.map((rawLine) => {
    if (inBlockComment) {
      const closeIdx = rawLine.indexOf("]]");
      if (closeIdx < 0) return rawLine;
      inBlockComment = false;
      const after = rawLine.slice(closeIdx + 2);
      return rawLine.slice(0, closeIdx + 2) + replacePropertyDecls(after, resolved, counts);
    }
    const blockStart = rawLine.indexOf("--[[");
    if (blockStart < 0) return replacePropertyDecls(rawLine, resolved, counts);
    const prefix = rawLine.slice(0, blockStart);
    const replacedPrefix = replacePropertyDecls(prefix, resolved, counts);
    const blockEnd = rawLine.indexOf("]]", blockStart + 4);
    if (blockEnd < 0) {
      inBlockComment = true;
      return replacedPrefix + rawLine.slice(blockStart);
    }
    const after = rawLine.slice(blockEnd + 2);
    return replacedPrefix + rawLine.slice(blockStart, blockEnd + 2) + replacePropertyDecls(after, resolved, counts);
  });
  return { src: out.join(lineSep), counts };
}

function runUiLint(filepath, strict, verbose) {
  const lintPath = path.join(__dirname, "ui_lint.cjs");
  if (!fs.existsSync(lintPath)) {
    console.log(`WARN ui_lint.cjs not found at ${__dirname} - skipped lint`);
    return;
  }
  let lintModule;
  try {
    lintModule = require(lintPath);
  } catch (err) {
    console.log(`WARN ui_lint import failed (${err.message}) - skipped`);
    return;
  }
  const findings = lintModule.lintUiFile(filepath);
  const errors = findings.filter((finding) => finding.severity === lintModule.SEVERITY_ERROR);
  const warns = findings.filter((finding) => finding.severity === lintModule.SEVERITY_WARN);
  if (verbose) findings.forEach((finding) => console.log(formatFinding(finding)));
  else errors.forEach((finding) => console.log(formatFinding(finding)));
  if (errors.length) {
    const msg = `ui_lint: ${errors.length} error(s), ${warns.length} warning(s) in ${filepath}`;
    if (strict) throw new Error(msg);
    console.log(`x ${msg}`);
    return;
  }
  if (warns.length) {
    const extra = verbose ? "" : " (pass lint_verbose=true to see)";
    console.log(`WARN ui_lint: ${warns.length} warning(s)${extra}`);
  } else {
    console.log("OK ui_lint: clean");
  }
}

function formatFinding(finding) {
  const sev = finding.severity.toUpperCase().padEnd(7);
  return `[${sev}] ${finding.rule} ${finding.path}\n        ${finding.message}${finding.hint ? `\n        hint: ${finding.hint}` : ""}`;
}

module.exports = {
  UIBuilder,
  DEFAULT_SPRITE_RUID,
  ANCHOR_DEFAULT_PIVOT,
  ANCHOR_PRESETS,
  hexToRgba,
  colorDict,
};
