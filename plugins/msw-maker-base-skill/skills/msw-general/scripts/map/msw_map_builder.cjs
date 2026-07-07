#!/usr/bin/env node
"use strict";

const fs = require("fs");
const crypto = require("crypto");

const DEFAULT_SPRITE_RUID = "8ef238e0d0ca4bb783aca526cff35d11";

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function hasExplicitPos(options = {}) {
  return options != null && options.pos != null;
}

function readJsonFile(filepath, label) {
  try {
    return JSON.parse(fs.readFileSync(filepath, "utf8"));
  } catch (err) {
    if (err && err.code === "ENOENT") throw new Error(`${label} not found: ${filepath}`);
    throw new Error(`Invalid JSON in ${label} ${filepath}: ${err.message}`);
  }
}

function vector2(x = 0, y = 0) {
  if (x && typeof x === "object") {
    if (Array.isArray(x)) return { x: Number(x[0] ?? 0), y: Number(x[1] ?? 0) };
    return { x: Number(x.x ?? 0), y: Number(x.y ?? 0) };
  }
  return { x: Number(x), y: Number(y) };
}

function vector3(x = 0, y = 0, z = 0) {
  if (x && typeof x === "object") {
    if (Array.isArray(x)) return { x: Number(x[0] ?? 0), y: Number(x[1] ?? 0), z: Number(x[2] ?? 0) };
    return { x: Number(x.x ?? 0), y: Number(x.y ?? 0), z: Number(x.z ?? 0) };
  }
  return { x: Number(x), y: Number(y), z: Number(z) };
}

function quaternion(x = 0, y = 0, z = 0, w = 1) {
  if (x && typeof x === "object") {
    if (Array.isArray(x)) return { x: Number(x[0] ?? 0), y: Number(x[1] ?? 0), z: Number(x[2] ?? 0), w: Number(x[3] ?? 1) };
    return { x: Number(x.x ?? 0), y: Number(x.y ?? 0), z: Number(x.z ?? 0), w: Number(x.w ?? 1) };
  }
  return { x: Number(x), y: Number(y), z: Number(z), w: Number(w) };
}

function color(value, alpha = 1) {
  if (value == null) return { r: 1, g: 1, b: 1, a: alpha };
  if (typeof value === "string") {
    const hex = value.replace(/^#/, "");
    if (hex.length !== 6 && hex.length !== 8) throw new Error(`Invalid color hex: ${value}`);
    return {
      r: parseInt(hex.slice(0, 2), 16) / 255,
      g: parseInt(hex.slice(2, 4), 16) / 255,
      b: parseInt(hex.slice(4, 6), 16) / 255,
      a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : alpha,
    };
  }
  if (Array.isArray(value)) {
    return { r: Number(value[0]), g: Number(value[1]), b: Number(value[2]), a: value.length > 3 ? Number(value[3]) : alpha };
  }
  return { r: Number(value.r ?? 1), g: Number(value.g ?? 1), b: Number(value.b ?? 1), a: Number(value.a ?? alpha) };
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
      console.warn(`[builder:map] component "${value}" -> ${out} (native; auto-qualified). Pass "${out}" to silence this.`);
    }
    return out;
  }
  const near = _nearestNative(value);
  const out = "script." + value;
  if (!_resolveWarned.has(value)) {
    _resolveWarned.add(value);
    if (near) {
      console.warn(`[builder:map] component "${value}" is not a native component -> treated as ${out}. Looks like a typo of native "MOD.Core.${near}": if you meant the native, pass "MOD.Core.${near}"; if it is your own script component, pass "${out}".`);
    } else {
      console.warn(`[builder:map] component "${value}" -> ${out} (assumed custom script component). Next time pass "${out}" if it is yours, or "MOD.Core.${value}" if it is native.`);
    }
  }
  return out;
}
// <<< END AUTO-GENERATED

function modelContent(modelJson) {
  const content = modelJson && modelJson.ContentProto && modelJson.ContentProto.Json;
  if (!content || !Array.isArray(content.Components)) {
    throw new Error("Invalid model JSON: missing ContentProto.Json.Components");
  }
  return content;
}

function modelDefinitionContent(modelJsonOrContent) {
  if (modelJsonOrContent && modelJsonOrContent.ContentProto && modelJsonOrContent.ContentProto.Json) {
    return modelContent(modelJsonOrContent);
  }
  if (modelJsonOrContent && Array.isArray(modelJsonOrContent.Components)) {
    return modelJsonOrContent;
  }
  throw new Error("Invalid model JSON: missing model Components");
}

function modelIdFromJson(modelJson) {
  const content = modelDefinitionContent(modelJson);
  if (content.Id) return String(content.Id);
  const entryKey = String(modelJson.EntryKey || "");
  if (entryKey.startsWith("model://")) return entryKey.slice("model://".length);
  throw new Error("Model Id not found");
}

function targetTypeFromDescriptor(target) {
  if (!target || typeof target !== "object") return null;
  const raw = String(target.type || "");
  const match = raw.match(/(MOD\.Core\.[A-Za-z0-9_]+Component|script\.[A-Za-z0-9_]+)/);
  return match ? match[1] : null;
}

function defaultComponent(componentType, pos) {
  const type = normalizeComponentName(componentType);
  if (type === "MOD.Core.TransformComponent") {
    return {
      "@type": type,
      Position: vector3(pos || [0, 0, 0]),
      QuaternionRotation: quaternion(),
      Scale: vector3(1, 1, 1),
      Enable: true,
    };
  }
  if (type === "MOD.Core.SpriteRendererComponent") {
    return {
      "@type": type,
      SpriteRUID: "",
      Color: color(),
      DrawMode: 0,
      FlipX: false,
      FlipY: false,
      PlayRate: 1,
      OrderInLayer: 2,
      StartFrameIndex: 0,
      EndFrameIndex: 2147483647,
      Enable: true,
    };
  }
  if (type === "MOD.Core.RigidbodyComponent" || type === "MOD.Core.KinematicbodyComponent" || type === "MOD.Core.SideviewbodyComponent") {
    return { "@type": type, MoveVelocity: vector2(), RealMoveVelocity: vector2(), Enable: true };
  }
  if (type === "MOD.Core.AIChaseComponent" || type === "MOD.Core.AIWanderComponent" || type === "MOD.Core.HitComponent") {
    return { "@type": type, IsLegacy: false, Enable: true };
  }
  if (type === "script.Monster") return { "@type": type, Enable: true, IsDead: false };
  if (type === "script.MonsterAttack") return { "@type": type, Enable: true, SpriteSize: vector2(), PositionOffset: vector2() };
  return { "@type": type, Enable: true };
}

function componentsFromModel(modelJson, pos) {
  const content = modelDefinitionContent(modelJson);
  const components = content.Components.map((componentType) =>
    defaultComponent(componentType, componentType === "MOD.Core.TransformComponent" ? pos : null));
  const byType = new Map(components.map((component) => [component["@type"], component]));
  const properties = Array.isArray(content.Properties) ? content.Properties : [];
  for (const item of content.Values || []) {
    let targetType = item.TargetType;
    let propertyName = item.Name;
    if (targetType == null) {
      const prop = properties.find((candidate) => candidate.Name === item.Name);
      if (prop && prop.Link) {
        targetType = targetTypeFromDescriptor(prop.Link.Target);
        propertyName = prop.Link.Property || propertyName;
      }
    }
    if (!targetType || !propertyName) continue;
    const component = byType.get(normalizeComponentName(targetType));
    if (component) component[propertyName] = clone(item.Value);
  }
  return components;
}

class MapBuilder {
  constructor(mapName = "map01", data = null) {
    this.mapName = mapName;
    this.rootPath = `/maps/${mapName}`;
    this.data = data || {
      Id: "",
      GameId: "",
      EntryKey: `map://${mapName}`,
      ContentType: "x-mod/map",
      Content: "",
      Usage: 0,
      UsePublish: 1,
      UseService: 0,
      CoreVersion: "26.5.0.0",
      StudioVersion: "0.1.0.0",
      DynamicLoading: 0,
      ContentProto: { Use: "Binary", Entities: [] },
    };
    this.entities = this.data.ContentProto.Entities;
    this.displayCounter = this._nextDisplayOrder();
    this._lastId = null;
  }

  static read(filepath) {
    return MapBuilder.load(filepath);
  }

  static load(filepath) {
    const data = readJsonFile(filepath, "map");
    if (data.ContentType !== "x-mod/map") throw new Error(`Not an x-mod/map file: ${filepath}`);
    if (!data.ContentProto || !Array.isArray(data.ContentProto.Entities)) {
      throw new Error(`Missing ContentProto.Entities in map file: ${filepath}`);
    }
    for (const entity of data.ContentProto.Entities) {
      if (typeof entity.jsonString === "string") entity.jsonString = JSON.parse(entity.jsonString);
      const js = entity.jsonString || {};
      if (js.version2 && (js.entityInfos || js.addedComponents || js.modifications)) {
        throw new Error("Condensed version2 .map files are not supported by MapBuilder.");
      }
    }
    const rootPath = data.ContentProto.Entities[0] && data.ContentProto.Entities[0].jsonString && data.ContentProto.Entities[0].jsonString.path;
    const mapName = rootPath && rootPath.startsWith("/maps/")
      ? rootPath.split("/")[2]
      : String(data.EntryKey || "map://map01").replace(/^map:\/\//, "");
    return new MapBuilder(mapName, data);
  }

  static snapshot(filepath) {
    return MapBuilder.read(filepath).snapshot();
  }

  build() {
    this.data.ContentProto.Entities = this.entities;
    return this.data;
  }

  write(filepath) {
    fs.writeFileSync(filepath, `${JSON.stringify(this.build(), null, 2)}\n`, "utf8");
    return this;
  }

  snapshot() {
    return { mapName: this.mapName, mapInfo: this.getMapInfo(), entities: this.listEntities() };
  }

  lastId() {
    return this._lastId;
  }

  _nextDisplayOrder() {
    return this.entities.reduce((max, entity) => Math.max(max, Number(this._entityJson(entity).displayOrder ?? -1)), -1) + 1;
  }

  _entityJson(entity) {
    if (!entity.jsonString || typeof entity.jsonString !== "object") entity.jsonString = {};
    return entity.jsonString;
  }

  _normalizePath(identifier) {
    const value = String(identifier || "").trim();
    if (!value) throw new Error("Entity identifier must not be empty");
    if (value.startsWith("/maps/")) {
      if (value !== this.rootPath && !value.startsWith(`${this.rootPath}/`)) throw new Error(`Entity path is outside this map: ${value}`);
      return value;
    }
    return `${this.rootPath}/${value.replace(/^\/+/, "")}`;
  }

  _entityName(path) {
    return path === this.rootPath ? this.mapName : path.split("/").pop();
  }

  _pathConstraints(path) {
    return "/".repeat((path.match(/\//g) || []).length);
  }

  _findIndex(identifier) {
    const raw = String(identifier || "").trim();
    const target = raw === this.mapName ? this.rootPath : this._normalizePath(identifier);
    return this.entities.findIndex((entity) => this._entityJson(entity).path === target || entity.path === target);
  }

  find(identifier) {
    const idx = this._findIndex(identifier);
    return idx < 0 ? null : this.entities[idx];
  }

  component(identifier, componentType) {
    const entity = typeof identifier === "object" ? identifier : this.find(identifier);
    if (!entity) return null;
    const target = normalizeComponentName(componentType);
    return (this._entityJson(entity)["@components"] || []).find((component) => component["@type"] === target) || null;
  }

  _syncComponentNames(entity) {
    entity.componentNames = (this._entityJson(entity)["@components"] || [])
      .map((component) => component["@type"])
      .filter(Boolean)
      .join(",");
  }

  _rootMapEntity() {
    return this.entities.find((entity) => this.component(entity, "MOD.Core.MapComponent")) || null;
  }

  getMapInfo() {
    const root = this._rootMapEntity();
    const map = root ? this.component(root, "MOD.Core.MapComponent") : null;
    return {
      TileMapMode: map ? map.TileMapMode : null,
      Gravity: map ? map.Gravity : null,
      IsInstanceMap: map ? map.IsInstanceMap : null,
      entityCount: this.entities.length,
      tileCount: this.getTiles().length,
      footholdCount: this.getFootholds().length,
    };
  }

  getTileMapMode() {
    return this.getMapInfo().TileMapMode;
  }

  listEntities() {
    return this.entities.map((entity) => {
      const js = this._entityJson(entity);
      return {
        id: entity.id,
        name: js.name,
        path: js.path || entity.path,
        modelId: js.modelId ?? null,
        displayOrder: js.displayOrder,
        componentNames: entity.componentNames || "",
      };
    }).sort((a, b) => String(a.path).localeCompare(String(b.path)));
  }

  entity(identifier, components, options = {}, preserveExistingTransform = false) {
    const path = this._normalizePath(identifier);
    const existingIndex = this._findIndex(path);
    const existing = existingIndex >= 0 ? this.entities[existingIndex] : null;
    const existingJs = existing ? this._entityJson(existing) : null;
    const id = existing ? existing.id : crypto.randomUUID();
    const modelId = options.modelId !== undefined ? options.modelId : (existingJs ? existingJs.modelId : null);
    let origin;
    if (options.origin !== undefined) origin = options.origin;
    else if (existingJs && existingJs.origin !== undefined) origin = clone(existingJs.origin);
    else if (modelId != null) origin = { type: "Model", entry_id: modelId, sub_entity_id: null, root_entity_id: id, replaced_model_id: null };
    else origin = undefined;
    if (origin && origin.root_entity_id == null) origin.root_entity_id = id;
    let finalComponents = clone(components);
    if (preserveExistingTransform && existingJs) {
      const existingTransform = (existingJs["@components"] || []).find(
        (component) => component["@type"] === "MOD.Core.TransformComponent",
      );
      if (existingTransform) {
        finalComponents = finalComponents.map((component) =>
          component["@type"] === "MOD.Core.TransformComponent" ? clone(existingTransform) : component,
        );
      }
    }
    const js = {
      name: options.name ?? (existingJs ? existingJs.name : this._entityName(path)),
      path,
      nameEditable: options.nameEditable ?? (existingJs ? existingJs.nameEditable : true),
      enable: options.enable ?? (existingJs ? existingJs.enable : true),
      visible: options.visible ?? (existingJs ? existingJs.visible : true),
      localize: options.localize ?? (existingJs ? existingJs.localize : false),
      displayOrder: options.displayOrder ?? (existingJs ? existingJs.displayOrder : this.displayCounter++),
      pathConstraints: this._pathConstraints(path),
      revision: existingJs ? (existingJs.revision ?? 1) : (options.revision ?? 1),
      modelId,
      "@components": finalComponents,
      "@version": 1,
    };
    if (origin !== undefined) js.origin = origin;
    const entity = { id, path, componentNames: "", jsonString: js };
    this._syncComponentNames(entity);
    if (existingIndex >= 0) this.entities[existingIndex] = entity;
    else this.entities.push(entity);
    this._lastId = id;
    return this;
  }

  empty(name, options = {}) {
    const components = [defaultComponent("MOD.Core.TransformComponent", options.pos || [0, 0, 0])];
    for (const script of options.scripts || []) components.push(defaultComponent(script));
    return this.entity(name, components, { modelId: options.modelId ?? "mapempty", origin: options.origin, enable: options.enable }, !hasExplicitPos(options));
  }

  sprite(name, options = {}) {
    const sprite = defaultComponent("MOD.Core.SpriteRendererComponent");
    sprite.SpriteRUID = options.ruid === undefined ? DEFAULT_SPRITE_RUID : options.ruid;
    sprite.OrderInLayer = options.order ?? sprite.OrderInLayer;
    sprite.Color = color(options.color);
    return this.entity(name, [defaultComponent("MOD.Core.TransformComponent", options.pos || [0, 0, 0]), sprite], {
      modelId: options.modelId ?? "mapobject",
      origin: options.origin,
      enable: options.enable,
    }, !hasExplicitPos(options));
  }

  placeModel(name, modelFilepathOrJson, options = {}) {
    const modelJson = typeof modelFilepathOrJson === "string" ? readJsonFile(modelFilepathOrJson, "model") : clone(modelFilepathOrJson);
    const modelId = options.modelId || modelIdFromJson(modelJson);
    const components = componentsFromModel(modelJson, options.pos || [0, 0, 0]);
    for (const [componentType, updates] of Object.entries(options.componentOverrides || {})) {
      const component = components.find((item) => item["@type"] === normalizeComponentName(componentType));
      if (!component) throw new Error(`Model ${modelId} has no component ${componentType}`);
      Object.assign(component, clone(updates));
    }
    const path = this._normalizePath(name);
    const existing = this.find(path);
    if (existing) {
      const existingPath = this._entityJson(existing).path || existing.path;
      this.entities = this.entities.filter((entity) => {
        const currentPath = this._entityJson(entity).path || entity.path;
        return !currentPath.startsWith(`${existingPath}/`);
      });
      this.data.ContentProto.Entities = this.entities;
    }
    this.entity(name, components, {
      modelId,
      enable: options.enable,
      visible: options.visible,
      origin: { type: "Model", entry_id: modelId, sub_entity_id: null, root_entity_id: null, replaced_model_id: null },
    }, !hasExplicitPos(options));
    const rootId = this._lastId;
    const model = modelContent(modelJson);
    this._placeModelChildren(path, rootId, modelId, model.Children || [], modelId);
    this._lastId = rootId;
    return this;
  }

  _placeModelChildren(parentPath, rootEntityId, rootModelId, children, parentModelId) {
    if (!Array.isArray(children) || children.length === 0) return;
    const byId = new Map(children.map((child) => [child.Id || (child.Model && child.Model.Id), child]));
    const placed = new Set();
    const placedPaths = new Map();
    const place = (child, fallbackParentPath = parentPath) => {
      const childId = child.Id || (child.Model && child.Model.Id);
      if (!childId || placed.has(childId)) return;
      const parentChild = byId.get(child.ParentId);
      let currentParentPath = fallbackParentPath;
      if (parentChild && parentChild !== child) {
        place(parentChild, fallbackParentPath);
        currentParentPath = placedPaths.get(parentChild.Id || (parentChild.Model && parentChild.Model.Id)) || currentParentPath;
      }
      const model = child.Model || {};
      const childName = child.Name || model.Name || childId;
      const childPath = `${currentParentPath}/${childName}`;
      const childModelId = model.Id || childId;
      const origin = child.ModelReplaced
        ? { type: "Model2", entry_id: childModelId, sub_entity_id: null, root_entity_id: rootEntityId, replaced_model_id: childId }
        : { type: "Model", entry_id: parentModelId || rootModelId, sub_entity_id: childId, root_entity_id: rootEntityId, replaced_model_id: null };
      this.entity(childPath, componentsFromModel(model), {
        name: childName,
        modelId: childModelId,
        origin,
      });
      placed.add(childId);
      placedPaths.set(childId, childPath);
      this._placeModelChildren(childPath, rootEntityId, rootModelId, model.Children || [], childModelId);
    };
    for (const child of children) place(child);
  }

  patch(identifier, updates = {}) {
    const entity = this.find(identifier);
    if (!entity) throw new Error(`Entity not found: ${identifier}`);
    const js = this._entityJson(entity);
    if (updates.pos) {
      const transform = this.component(entity, "MOD.Core.TransformComponent");
      if (!transform) throw new Error(`Entity ${identifier} has no TransformComponent`);
      transform.Position = vector3(updates.pos);
    }
    for (const key of ["enable", "visible", "localize", "displayOrder"]) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) js[key] = updates[key];
    }
    if (updates.name) this.rename(identifier, updates.name);
    return this;
  }

  rename(identifier, newName) {
    const entity = this.find(identifier);
    if (!entity) throw new Error(`Entity not found: ${identifier}`);
    const oldPath = this._entityJson(entity).path;
    const newPath = `${oldPath.split("/").slice(0, -1).join("/")}/${newName}`;
    for (const item of this.entities) {
      const js = this._entityJson(item);
      const currentPath = js.path || item.path;
      if (currentPath === oldPath || currentPath.startsWith(`${oldPath}/`)) {
        const updatedPath = newPath + currentPath.slice(oldPath.length);
        item.path = updatedPath;
        js.path = updatedPath;
        js.pathConstraints = this._pathConstraints(updatedPath);
        if (currentPath === oldPath) js.name = newName;
      }
    }
    return this;
  }

  upsertComponent(identifier, componentType, data = null) {
    const entity = this.find(identifier);
    if (!entity) throw new Error(`Entity not found: ${identifier}`);
    const js = this._entityJson(entity);
    const component = data ? clone(data) : defaultComponent(componentType);
    component["@type"] = normalizeComponentName(component["@type"] || componentType);
    const idx = (js["@components"] || []).findIndex((item) => item["@type"] === component["@type"]);
    if (idx >= 0) js["@components"][idx] = component;
    else js["@components"].push(component);
    this._syncComponentNames(entity);
    return this;
  }

  patchComponent(identifier, componentType, updates) {
    const component = this.component(identifier, componentType);
    if (!component) throw new Error(`Entity ${identifier} has no ${componentType}`);
    Object.assign(component, clone(updates));
    return this;
  }

  removeComponent(identifier, componentType) {
    const entity = this.find(identifier);
    if (!entity) throw new Error(`Entity not found: ${identifier}`);
    const js = this._entityJson(entity);
    const target = normalizeComponentName(componentType);
    if (!(js["@components"] || []).some((component) => component["@type"] === target)) {
      throw new Error(`Entity ${identifier} has no ${target}`);
    }
    js["@components"] = js["@components"].filter((component) => component["@type"] !== target);
    this._syncComponentNames(entity);
    return this;
  }

  remove(identifier) {
    const target = this._normalizePath(identifier);
    const before = this.entities.length;
    this.entities = this.entities.filter((entity) => {
      const currentPath = this._entityJson(entity).path || entity.path;
      return currentPath !== target && !currentPath.startsWith(`${target}/`);
    });
    this.data.ContentProto.Entities = this.entities;
    if (this.entities.length === before) throw new Error(`Entity not found: ${identifier}`);
    return this;
  }

  _tileEntity(name = null) {
    if (name) return this.find(name);
    return this.entities.find((entity) => this.component(entity, "MOD.Core.TileMapComponent") || this.component(entity, "MOD.Core.RectTileMapComponent")) || null;
  }

  _tileComponent(name = null) {
    const entity = this._tileEntity(name);
    if (!entity) return null;
    return this.component(entity, "MOD.Core.TileMapComponent") || this.component(entity, "MOD.Core.RectTileMapComponent");
  }

  getTiles(tilemapName = null) {
    const component = this._tileComponent(tilemapName);
    if (!component) return [];
    return component.Tiles || component.tileMap || [];
  }

  getTileAt(x, y, tilemapName = null) {
    return this.getTiles(tilemapName).find((tile) => tile.position && tile.position.x === x && tile.position.y === y) || null;
  }

  getTileBounds(tilemapName = null) {
    const tiles = this.getTiles(tilemapName);
    if (!tiles.length) return null;
    const xs = tiles.map((tile) => tile.position.x);
    const ys = tiles.map((tile) => tile.position.y);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys), count: tiles.length };
  }

  _footholdComponent() {
    const root = this._rootMapEntity();
    return root ? this.component(root, "MOD.Core.FootholdComponent") : null;
  }

  getFootholds(layer = "1") {
    const component = this._footholdComponent();
    if (!component || !component.FootholdsByLayer) return [];
    return component.FootholdsByLayer[String(layer)] || [];
  }

  getFootholdBounds(layer = "1") {
    const footholds = this.getFootholds(layer);
    if (!footholds.length) return null;
    const xs = [];
    const ys = [];
    for (const foothold of footholds) {
      xs.push(foothold.StartPoint.x, foothold.EndPoint.x);
      ys.push(foothold.StartPoint.y, foothold.EndPoint.y);
    }
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys), count: footholds.length };
  }
}

module.exports = { MapBuilder, DEFAULT_SPRITE_RUID, componentsFromModel, defaultComponent, vector2, vector3, quaternion, color };
