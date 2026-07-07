"use strict";

const fs = require("fs");
const path = require("path");

const MSCORLIB = "mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089";
const MOD_CORE_VERSION = process.env.MSW_MODEL_BUILDER_MOD_CORE_VERSION || "26.5.0.0";
const MOD_CORE = `MOD.Core, Version=${MOD_CORE_VERSION}, Culture=neutral, PublicKeyToken=null`;
const MOD_CORE_SHORT = "MOD.Core";

const DEFAULT_SPRITE_RUID = "8ef238e0d0ca4bb783aca526cff35d11";
const SPRITE_RENDERER = "MOD.Core.SpriteRendererComponent";

const DEFAULT_DAMAGE_SKIN_ATTACK = "3271c3e79bf04ecba9a107d55495970d";
const DEFAULT_DAMAGE_SKIN_HIT = "02c22d93421b4038b3c413b3e40b57ec";
const DEFAULT_DAMAGE_SKIN_HEAL = "d58b67cf0f3a4eaf9fe1ad87c0ffac8a";

const TYPE_MAP = {
  bool: `System.Boolean, ${MSCORLIB}`,
  boolean: `System.Boolean, ${MSCORLIB}`,
  int: `System.Int32, ${MSCORLIB}`,
  integer: `System.Int32, ${MSCORLIB}`,
  long: `System.Int64, ${MSCORLIB}`,
  float: `System.Single, ${MSCORLIB}`,
  single: `System.Single, ${MSCORLIB}`,
  double: `System.Double, ${MSCORLIB}`,
  string: `System.String, ${MSCORLIB}`,
  vector2: `MOD.Core.MODVector2, ${MOD_CORE}`,
  Vector2: `MOD.Core.MODVector2, ${MOD_CORE}`,
  vector3: `MOD.Core.MODVector3, ${MOD_CORE}`,
  Vector3: `MOD.Core.MODVector3, ${MOD_CORE}`,
  quaternion: `MOD.Core.MODQuaternion, ${MOD_CORE}`,
  Quaternion: `MOD.Core.MODQuaternion, ${MOD_CORE}`,
  collision_group: `MOD.Core.Physics.CollisionGroup, ${MOD_CORE}`,
  CollisionGroup: `MOD.Core.Physics.CollisionGroup, ${MOD_CORE}`,
  collider_type: `MOD.Core.ColliderType, ${MOD_CORE}`,
  ColliderType: `MOD.Core.ColliderType, ${MOD_CORE}`,
  data_ref: `MOD.Core.MODDataRef, ${MOD_CORE}`,
  MODDataRef: `MOD.Core.MODDataRef, ${MOD_CORE}`,
  sync_string_dict: `MOD.Core.MODSyncDictionary\`2[[System.String, ${MSCORLIB}],[System.String, ${MSCORLIB}]], ${MOD_CORE}`,
  action_sheet: `MOD.Core.MODSyncDictionary\`2[[System.String, ${MSCORLIB}],[System.String, ${MSCORLIB}]], ${MOD_CORE}`,
};

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function typeDescriptor(typeStr) {
  return { $type: "MODNativeType", type: typeStr };
}

function componentTypeDescriptor(componentType) {
  const target = normalizeTargetType(componentType);
  if (target && target.startsWith("MOD.Core.")) return typeDescriptor(`${target}, ${MOD_CORE}`);
  return typeDescriptor(target);
}

function normalizeTypeKey(typeKey) {
  if (typeKey == null) return null;
  const value = String(typeKey);
  const canonical = {
    Boolean: "bool",
    boolean: "bool",
    Integer: "int",
    integer: "int",
    Int32: "int",
    Single: "float",
    Float: "float",
    Vector2: "vector2",
    Vector3: "vector3",
    Quaternion: "quaternion",
    CollisionGroup: "collision_group",
    MODDataRef: "data_ref",
  }[value];
  return canonical || value;
}

function inferType(value) {
  if (typeof value === "boolean") return "bool";
  if (typeof value === "number") return Number.isInteger(value) ? "int" : "float";
  if (typeof value === "string") return "string";
  if (value && typeof value === "object") {
    const typeName = String(value.$type || "");
    if (typeName.includes("MODVector2")) return "vector2";
    if (typeName.includes("MODVector3")) return "vector3";
    if (typeName.includes("MODQuaternion")) return "quaternion";
    if (typeName.includes("CollisionGroup")) return "collision_group";
    if (typeName.includes("MODDataRef")) return "data_ref";
    const keys = Object.keys(value).sort().join(",");
    if (keys === "x,y") return "vector2";
    if (keys === "x,y,z") return "vector3";
    if (keys === "w,x,y,z") return "quaternion";
  }
  return "string";
}

function wrapValue(value, typeKey) {
  const t = normalizeTypeKey(typeKey);
  if (t === "vector2") {
    if (Array.isArray(value)) return vector2(value[0], value[1]);
    if (value && typeof value === "object" && value.$type == null) return { $type: `MOD.Core.MODVector2, ${MOD_CORE_SHORT}`, ...value };
  }
  if (t === "vector3") {
    if (Array.isArray(value)) return vector3(value[0], value[1], value[2]);
    if (value && typeof value === "object" && value.$type == null) return { $type: `MOD.Core.MODVector3, ${MOD_CORE_SHORT}`, ...value };
  }
  if (t === "quaternion") {
    if (Array.isArray(value)) return quaternion(value[0], value[1], value[2], value[3]);
    if (value && typeof value === "object" && value.$type == null) return { $type: `MOD.Core.MODQuaternion, ${MOD_CORE_SHORT}`, ...value };
  }
  if (t === "collision_group" && typeof value === "string") return collisionGroup(value);
  if (t === "data_ref" && typeof value === "string") return dataRef(value);
  if ((t === "sync_string_dict" || t === "action_sheet") && value && typeof value === "object" && value.$type == null) return actionSheet(value);
  return clone(value);
}

function vector2(x = 0, y = 0) {
  if (x && typeof x === "object") {
    if (Array.isArray(x)) return { $type: `MOD.Core.MODVector2, ${MOD_CORE_SHORT}`, x: Number(x[0] ?? 0), y: Number(x[1] ?? 0) };
    return { $type: `MOD.Core.MODVector2, ${MOD_CORE_SHORT}`, x: Number(x.x ?? 0), y: Number(x.y ?? 0) };
  }
  return { $type: `MOD.Core.MODVector2, ${MOD_CORE_SHORT}`, x: Number(x), y: Number(y) };
}

function vector3(x = 0, y = 0, z = 0) {
  if (x && typeof x === "object") {
    if (Array.isArray(x)) return { $type: `MOD.Core.MODVector3, ${MOD_CORE_SHORT}`, x: Number(x[0] ?? 0), y: Number(x[1] ?? 0), z: Number(x[2] ?? 0) };
    return { $type: `MOD.Core.MODVector3, ${MOD_CORE_SHORT}`, x: Number(x.x ?? 0), y: Number(x.y ?? 0), z: Number(x.z ?? 0) };
  }
  return { $type: `MOD.Core.MODVector3, ${MOD_CORE_SHORT}`, x: Number(x), y: Number(y), z: Number(z) };
}

function quaternion(x = 0, y = 0, z = 0, w = 1) {
  if (x && typeof x === "object") {
    if (Array.isArray(x)) return { $type: `MOD.Core.MODQuaternion, ${MOD_CORE_SHORT}`, x: Number(x[0] ?? 0), y: Number(x[1] ?? 0), z: Number(x[2] ?? 0), w: Number(x[3] ?? 1) };
    return { $type: `MOD.Core.MODQuaternion, ${MOD_CORE_SHORT}`, x: Number(x.x ?? 0), y: Number(x.y ?? 0), z: Number(x.z ?? 0), w: Number(x.w ?? 1) };
  }
  return { $type: `MOD.Core.MODQuaternion, ${MOD_CORE_SHORT}`, x: Number(x), y: Number(y), z: Number(z), w: Number(w) };
}

function collisionGroup(groupId) {
  return { $type: `MOD.Core.Physics.CollisionGroup, ${MOD_CORE_SHORT}`, Id: String(groupId) };
}

function dataRef(dataId) {
  return { $type: `MOD.Core.MODDataRef, ${MOD_CORE_SHORT}`, DataId: String(dataId) };
}

function actionSheet(actions) {
  return {
    $type: "MOD.Core.MODSyncDictionary`2[[System.String, mscorlib],[System.String, mscorlib]], MOD.Core",
    ...clone(actions),
  };
}

function modelIdFromName(name) {
  return String(name)
    .trim()
    .replace(/[^0-9A-Za-z_]/g, "")
    .toLowerCase();
}

function readJsonFile(filepath, label) {
  try {
    return JSON.parse(fs.readFileSync(filepath, "utf8"));
  } catch (err) {
    if (err && err.code === "ENOENT") throw new Error(`${label} not found: ${filepath}`);
    throw new Error(`Invalid JSON in ${label} ${filepath}: ${err.message}`);
  }
}

function modelDefinition(modelJsonOrContent, label = "model") {
  if (modelJsonOrContent && modelJsonOrContent.ContentProto && modelJsonOrContent.ContentProto.Json) {
    return modelJsonOrContent.ContentProto.Json;
  }
  if (modelJsonOrContent && Array.isArray(modelJsonOrContent.Components)) return modelJsonOrContent;
  throw new Error(`Invalid ${label}: missing ContentProto.Json.Components`);
}

function normalizeModelId(value) {
  if (value == null) return null;
  const modelId = String(value).trim().replace(/^model:\/\//, "");
  return modelId === "" ? null : modelId.toLowerCase();
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
      console.warn(`[builder:model] component "${value}" -> ${out} (native; auto-qualified). Pass "${out}" to silence this.`);
    }
    return out;
  }
  const near = _nearestNative(value);
  const out = "script." + value;
  if (!_resolveWarned.has(value)) {
    _resolveWarned.add(value);
    if (near) {
      console.warn(`[builder:model] component "${value}" is not a native component -> treated as ${out}. Looks like a typo of native "MOD.Core.${near}": if you meant the native, pass "MOD.Core.${near}"; if it is your own script component, pass "${out}".`);
    } else {
      console.warn(`[builder:model] component "${value}" -> ${out} (assumed custom script component). Next time pass "${out}" if it is yours, or "MOD.Core.${value}" if it is native.`);
    }
  }
  return out;
}
// <<< END AUTO-GENERATED

function normalizeTargetType(targetType) {
  return targetType == null ? null : normalizeComponentName(targetType);
}

function shortTarget(targetType) {
  return targetType == null ? "<property>" : String(targetType).replace(/^MOD\.Core\./, "");
}

class ModelBuilder {
  constructor(name, options = {}) {
    if (!name || !String(name).trim()) throw new Error("Model name must not be empty");
    this.name = String(name);
    this.model_id = options.model_id || options.modelId || modelIdFromName(this.name);
    if (!this.model_id) throw new Error(`Model id derived from '${this.name}' is empty`);
    this.components = [];
    this.properties = [];
    this.values = [];
    this.event_links = [];
    this.children = [];
    this.base_model_id = options.base_model_id ?? options.baseModelId ?? null;
    this.version = options.version ?? 1;
    this._data = null;
  }

  static load(filepath) {
    const data = readJsonFile(filepath, "model file");
    if (!data.ContentProto || !data.ContentProto.Json) {
      throw new Error(`Missing ContentProto.Json in model file: ${filepath}`);
    }
    const modelJson = data.ContentProto.Json;
    const instance = new ModelBuilder(modelJson.Name || "Unnamed", {
      model_id: modelJson.Id || undefined,
      version: modelJson.Version ?? 1,
    });
    instance.components = Array.isArray(modelJson.Components) ? clone(modelJson.Components) : [];
    instance.properties = Array.isArray(modelJson.Properties) ? clone(modelJson.Properties) : [];
    instance.values = Array.isArray(modelJson.Values) ? clone(modelJson.Values) : [];
    instance.event_links = Array.isArray(modelJson.EventLinks) ? clone(modelJson.EventLinks) : [];
    instance.children = Array.isArray(modelJson.Children) ? clone(modelJson.Children) : [];
    instance.base_model_id = modelJson.BaseModelId ?? null;
    instance._data = data;
    console.log(`Loaded model '${instance.name}': ${instance.components.length} components, ${instance.values.length} values, ${instance.children.length} children`);
    return instance;
  }

  static read(filepath) {
    return ModelBuilder.load(filepath);
  }

  static fromTemplate(templatePath, name, options = {}) {
    const instance = ModelBuilder.load(templatePath);
    return instance.renameModel(name, options.model_id || options.modelId);
  }

  static snapshot(filepath) {
    return ModelBuilder.load(filepath).snapshot();
  }

  static normalizeComponentName(name) {
    return normalizeComponentName(name);
  }

  snapshot() {
    return {
      name: this.name,
      model_id: this.model_id,
      version: this.version,
      base_model_id: this.base_model_id,
      components: clone(this.components),
      properties: this.properties.map((p) => ({
        name: p.Name,
        display_name: p.DisplayName,
        show_in_inspector: p.ShowInInspector,
        link_target: p.Link ? clone(p.Link.Target) : null,
        link_property: p.Link ? p.Link.Property : null,
      })),
      values: this.values.map((v) => ({
        target_type: v.TargetType,
        name: v.Name,
        value: clone(v.Value),
        type: v.ValueType && v.ValueType.type ? v.ValueType.type : null,
      })),
      child_count: this.children.length,
      children: this.children.map((child) => childSummary(child)),
    };
  }

  renameModel(name, modelId = null) {
    if (!name || !String(name).trim()) throw new Error("Model name must not be empty");
    const oldModelId = this.model_id;
    this.name = String(name);
    this.model_id = modelId || modelIdFromName(this.name);
    if (!this.model_id) throw new Error(`Model id derived from '${this.name}' is empty`);
    for (const child of this.children) {
      if (child.ParentId === oldModelId) child.ParentId = this.model_id;
    }
    if (this._data) this._data.EntryKey = `model://${this.model_id}`;
    return this;
  }

  setBaseModelId(baseModelId) {
    this.base_model_id = normalizeModelId(baseModelId);
    return this;
  }

  component(compName) {
    const normalized = normalizeComponentName(compName);
    if (normalized.startsWith("script.")) {
      console.log(`[ModelBuilder] NOTE: '${normalized}' is a script component. Refresh script .mlua before writing and refreshing this .model.`);
    }
    if (!this.components.includes(normalized)) this.components.push(normalized);
    return this;
  }

  addComponent(compName) {
    return this.component(compName);
  }

  hasComponent(compName) {
    return this.components.includes(normalizeComponentName(compName));
  }

  removeComponent(compName) {
    const normalized = normalizeComponentName(compName);
    if (!this.components.includes(normalized)) {
      throw new Error(`Component not found: ${normalized}`);
    }
    this.components = this.components.filter((c) => c !== normalized);
    this.values = this.values.filter((v) => v.TargetType !== normalized);
    this.properties = this.properties.filter((p) => {
      if (!p.Link) return true;
      return normalizeLinkTarget(p.Link.Target) !== normalized;
    });
    return this;
  }

  value(targetType, name, val, typeKey = null) {
    upsertValue(this.values, targetType, name, val, typeKey);
    return this;
  }

  getValue(targetType, name, fallback = undefined) {
    return getValueEntry(this.values, targetType, name, fallback);
  }

  getValueEntry(targetType, name) {
    const normalizedTarget = normalizeTargetType(targetType);
    const found = this.values.find((v) => v.TargetType === normalizedTarget && v.Name === name);
    return found ? clone(found) : null;
  }

  hasValue(targetType, name) {
    const normalizedTarget = normalizeTargetType(targetType);
    return this.values.some((v) => v.TargetType === normalizedTarget && v.Name === name);
  }

  removeValue(targetType, name) {
    if (!removeValueEntry(this.values, targetType, name)) {
      throw new Error(`Value not found: ${targetType}.${name}`);
    }
    return this;
  }

  enable(targetType, enabled = true) {
    return this.value(targetType, "Enable", Boolean(enabled), "bool");
  }

  entityEnable(enabled = true) {
    return this.value("MOD.Core.MODEntity", "Enable", Boolean(enabled), "bool");
  }

  entityVisible(visible = true) {
    return this.value("MOD.Core.MODEntity", "Visible", Boolean(visible), "bool");
  }

  property(name, options = {}) {
    upsertProperty(this.properties, this.values, name, options);
    return this;
  }

  removeProperty(name) {
    if (!removePropertyEntry(this.properties, name)) {
      throw new Error(`Property not found: ${name}`);
    }
    return this;
  }

  child(name, componentsOrOptions = null, maybeOptions = {}) {
    if (!name || !String(name).trim()) throw new Error("Child name must not be empty");
    const options = normalizeChildOptions(componentsOrOptions, maybeOptions);
    const parentId = this._childParentId(options.parent ?? options.parentId);
    const existing = this._findChild(name, options.parent ?? options.parentId);
    if (existing) {
      if (options.model != null) {
        throw new Error(
          `child("${name}"): cannot swap the Model template of an existing child via options.model — ` +
          `applyChildOptions does not consume options.model, so a passing call would silently keep the prior template. ` +
          `To replace the template, call removeChild("${name}") first, then childFromTemplate/childFromModel. ` +
          `To update name/components/enable/visible on the existing child, omit options.model.`,
        );
      }
      ensureChildModelShape(existing, name, parentId);
      applyChildOptions(existing, options, name, parentId);
      return this;
    }
    const child = createChildModel(name, parentId, options);
    this.children.push(child);
    return this;
  }

  childFromTemplate(name, templatePath, options = {}) {
    if (!templatePath || !String(templatePath).trim()) throw new Error("childFromTemplate() requires templatePath");
    const model = modelDefinition(readJsonFile(templatePath, "child template"), "child template");
    return this.child(name, { preserve_model_id: false, ...options, model });
  }

  childFromModel(name, modelJsonOrContent, options = {}) {
    return this.child(name, { ...options, model: modelDefinition(modelJsonOrContent, "child model") });
  }

  getChild(name) {
    const found = this._findChild(name);
    return found ? clone(found) : null;
  }

  hasChild(name) {
    return this._findChild(name) != null;
  }

  childComponent(childName, compName) {
    const child = this._requireChild(childName);
    const comp = normalizeComponentName(compName);
    if (!child.Model.Components.includes(comp)) child.Model.Components.push(comp);
    return this;
  }

  removeChildComponent(childName, compName) {
    const child = this._requireChild(childName);
    const comp = normalizeComponentName(compName);
    if (!child.Model.Components.includes(comp)) {
      throw new Error(`Child ${childName} has no ${comp}`);
    }
    child.Model.Components = child.Model.Components.filter((c) => c !== comp);
    child.Model.Values = child.Model.Values.filter((v) => v.TargetType !== comp);
    child.Model.Properties = child.Model.Properties.filter((p) => !p.Link || normalizeLinkTarget(p.Link.Target) !== comp);
    return this;
  }

  childValue(childName, targetType, name, val, typeKey = null) {
    const child = this._requireChild(childName);
    upsertValue(child.Model.Values, targetType, name, val, typeKey);
    return this;
  }

  getChildValue(childName, targetType, name, fallback = undefined) {
    const child = this._requireChild(childName);
    return getValueEntry(child.Model.Values, targetType, name, fallback);
  }

  removeChildValue(childName, targetType, name) {
    const child = this._requireChild(childName);
    if (!removeValueEntry(child.Model.Values, targetType, name)) {
      throw new Error(`Value not found on child '${childName}': ${targetType}.${name}`);
    }
    return this;
  }

  childEnable(childName, enabled = true) {
    return this.childValue(childName, "MOD.Core.MODEntity", "Enable", Boolean(enabled), "bool");
  }

  childVisible(childName, visible = true) {
    return this.childValue(childName, "MOD.Core.MODEntity", "Visible", Boolean(visible), "bool");
  }

  childProperty(childName, name, options = {}) {
    const child = this._requireChild(childName);
    upsertProperty(child.Model.Properties, child.Model.Values, name, options);
    return this;
  }

  removeChildProperty(childName, name) {
    const child = this._requireChild(childName);
    if (!removePropertyEntry(child.Model.Properties, name)) {
      throw new Error(`Property not found on child '${childName}': ${name}`);
    }
    return this;
  }

  setChildBaseModelId(childName, baseModelId) {
    const child = this._requireChild(childName);
    child.Model.BaseModelId = normalizeModelId(baseModelId);
    return this;
  }

  moveChild(childName, parentNameOrId = null) {
    const child = this._requireChild(childName);
    const parentId = this._childParentId(parentNameOrId);
    if (parentId === child.Id) throw new Error(`Child '${childName}' cannot be moved under itself`);
    child.ParentId = parentId;
    return this;
  }

  renameChild(childName, newName, options = {}) {
    if (!newName || !String(newName).trim()) throw new Error("New child name must not be empty");
    const child = this._requireChild(childName);
    child.Name = String(newName);
    if (options.rename_model !== false && options.renameModel !== false) child.Model.Name = String(newName);
    return this;
  }

  childEventLink(childName, link, options = {}) {
    const child = this._requireChild(childName);
    upsertEventLink(child.Model.EventLinks, link, options);
    return this;
  }

  removeChildEventLink(childName, key, value = undefined) {
    const child = this._requireChild(childName);
    if (!removeEventLinkFrom(child.Model.EventLinks, key, value)) {
      throw new Error(`EventLink not found on child '${childName}': ${typeof key === "function" ? "<predicate>" : `${key}=${value}`}`);
    }
    return this;
  }

  eventLink(link, options = {}) {
    upsertEventLink(this.event_links, link, options);
    return this;
  }

  upsertEventLink(link, options = {}) {
    return this.eventLink(link, options);
  }

  removeEventLink(key, value = undefined) {
    if (!removeEventLinkFrom(this.event_links, key, value)) {
      throw new Error(`EventLink not found: ${typeof key === "function" ? "<predicate>" : `${key}=${value}`}`);
    }
    return this;
  }

  listEventLinks() {
    return clone(this.event_links);
  }

  printEventLinks() {
    const entries = this.listEventLinks();
    entries.forEach((entry, index) => console.log(`  [${index}] ${JSON.stringify(entry)}`));
    return entries;
  }

  _requireChild(name) {
    const child = this._findChild(name);
    if (!child) throw new Error(`Child not found: ${name}`);
    ensureChildModelShape(child, child.Name || name, child.ParentId || this.model_id);
    return child;
  }

  _findChild(name, parentNameOrId = undefined) {
    const target = String(name);
    const parentId = parentNameOrId === undefined ? undefined : this._childParentId(parentNameOrId);
    return this.children.find((child) => {
      const id = child.Id || (child.Model && child.Model.Id);
      const matchesName = child.Name === target || id === target || (child.Model && child.Model.Name === target);
      const matchesParent = parentId === undefined || child.ParentId === parentId;
      return matchesName && matchesParent;
    }) || null;
  }

  _childParentId(parentNameOrId = null) {
    if (parentNameOrId == null) return this.model_id;
    const parent = this._findChild(parentNameOrId);
    if (parent) return parent.Id || (parent.Model && parent.Model.Id);
    const id = String(parentNameOrId);
    if (id === this.name || id === this.model_id || id === `model://${this.model_id}`) return this.model_id;
    return id.replace(/^model:\/\//, "");
  }

  removeChild(name) {
    const target = this._findChild(name);
    if (!target) throw new Error(`Child not found: ${name}`);
    const removeIds = new Set([target.Id || (target.Model && target.Model.Id)]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const child of this.children) {
        const childId = child.Id || (child.Model && child.Model.Id);
        if (!removeIds.has(childId) && removeIds.has(child.ParentId)) {
          removeIds.add(childId);
          changed = true;
        }
      }
    }
    this.children = this.children.filter((child) => !removeIds.has(child.Id || (child.Model && child.Model.Id)));
    return this;
  }

  listComponents() {
    return clone(this.components);
  }

  printComponents() {
    const items = this.listComponents();
    items.forEach((c) => console.log(`  ${c}`));
    return items;
  }

  listValues() {
    return clone(this.values);
  }

  printValues() {
    const items = this.listValues();
    items.forEach((v) => console.log(`  ${shortTarget(v.TargetType)}.${v.Name} = ${JSON.stringify(v.Value)}`));
    return items;
  }

  listChildren() {
    return clone(this.children);
  }

  printChildren() {
    this.children.forEach((child) => {
      const summary = childSummary(child);
      console.log(`  ${summary.name} id=${summary.id} parent=${summary.parent_id} model=${summary.model_id} (${summary.components.length} components)`);
    });
    return this.listChildren();
  }

  build() {
    const modelJson = {
      Version: this.version,
      Name: this.name,
      BaseModelId: this.base_model_id,
      Id: this.model_id,
      Components: clone(this.components),
      Properties: clone(this.properties),
      Values: clone(this.values),
      EventLinks: clone(this.event_links),
      Children: clone(this.children),
    };
    const data = this._data ? clone(this._data) : {
      Id: "",
      GameId: "",
      EntryKey: `model://${this.model_id}`,
      ContentType: "x-mod/model",
      Content: "",
      Usage: 0,
      UsePublish: 1,
      UseService: 0,
      CoreVersion: "",
      StudioVersion: "",
      DynamicLoading: 0,
      ContentProto: { Use: "Json", Json: modelJson },
    };
    data.EntryKey = `model://${this.model_id}`;
    data.ContentProto = data.ContentProto || {};
    data.ContentProto.Use = "Json";
    data.ContentProto.Json = modelJson;
    return data;
  }

  validate() {
    const findings = [];
    if (!this.name) findings.push({ severity: "error", rule: "M001", message: "Model name is empty" });
    if (!this.model_id) findings.push({ severity: "error", rule: "M002", message: "Model id is empty" });
    if (this.components.includes(SPRITE_RENDERER) && !this.hasValue(SPRITE_RENDERER, "SpriteRUID")) {
      findings.push({ severity: "warn", rule: "M010", message: "SpriteRendererComponent exists but SpriteRUID is missing; write() will inject placeholder" });
    }
    for (const v of this.values) {
      if (!v.ValueType || !v.ValueType.type) {
        findings.push({ severity: "error", rule: "M020", message: `Value ${shortTarget(v.TargetType)}.${v.Name} has no ValueType.type` });
      }
    }
    const childIds = new Set([this.model_id]);
    for (const child of this.children) {
      ensureChildModelShape(child, child.Name || (child.Model && child.Model.Name) || "Child", child.ParentId || this.model_id);
      if (!child.Id) findings.push({ severity: "error", rule: "M030", message: `Child ${child.Name || "<unnamed>"} has no Id` });
      if (!child.ParentId) findings.push({ severity: "error", rule: "M031", message: `Child ${child.Name || child.Id || "<unnamed>"} has no ParentId` });
      if (child.Id && childIds.has(child.Id)) findings.push({ severity: "error", rule: "M032", message: `Duplicate child/model id: ${child.Id}` });
      if (child.Id) childIds.add(child.Id);
      for (const v of child.Model.Values) {
        if (!v.ValueType || !v.ValueType.type) {
          findings.push({ severity: "error", rule: "M033", message: `Child ${child.Name || child.Id} value ${shortTarget(v.TargetType)}.${v.Name} has no ValueType.type` });
        }
      }
    }
    for (const child of this.children) {
      if (child.ParentId && !childIds.has(child.ParentId)) {
        findings.push({ severity: "error", rule: "M034", message: `Child ${child.Name || child.Id} ParentId does not point to root or another child: ${child.ParentId}` });
      }
      if (child.ParentId === child.Id) {
        findings.push({ severity: "error", rule: "M035", message: `Child ${child.Name || child.Id} cannot be its own parent` });
      }
    }
    const parentById = new Map(this.children.map((child) => [child.Id, child.ParentId]));
    for (const child of this.children) {
      const seen = new Set([child.Id]);
      let parentId = child.ParentId;
      while (parentById.has(parentId)) {
        if (seen.has(parentId)) {
          findings.push({ severity: "error", rule: "M036", message: `Child parent cycle detected at ${child.Name || child.Id}` });
          break;
        }
        seen.add(parentId);
        parentId = parentById.get(parentId);
      }
    }
    return findings;
  }

  _ensureSpriteRuid() {
    if (!this.components.includes(SPRITE_RENDERER)) return;
    const existing = this.values.find((v) => v.TargetType === SPRITE_RENDERER && v.Name === "SpriteRUID");
    if (!existing) {
      console.log(`[ModelBuilder] WARNING: model '${this.name}' declares SpriteRendererComponent but SpriteRUID is unset; injecting placeholder ${DEFAULT_SPRITE_RUID}. Replace it with a real sprite RUID before shipping.`);
      this.value(SPRITE_RENDERER, "SpriteRUID", DEFAULT_SPRITE_RUID, "string");
      return;
    }
    if (existing.Value == null || existing.Value === "") {
      console.log(`[ModelBuilder] WARNING: model '${this.name}' has empty SpriteRUID. This can fail at load time unless replaced at runtime.`);
    }
  }

  write(filepath, options = {}) {
    if (options.ensure_sprite_ruid !== false && options.ensureSpriteRuid !== false) this._ensureSpriteRuid();
    const findings = this.validate();
    const errors = findings.filter((f) => f.severity === "error");
    if (errors.length) {
      const message = errors.map((f) => `${f.rule}: ${f.message}`).join("; ");
      throw new Error(`Model validation failed: ${message}`);
    }
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, `${JSON.stringify(this.build(), null, 2)}\n`, "utf8");
    console.log(`Written model '${this.name}' (${this.components.length} components, ${this.values.length} values, ${this.children.length} children) to ${filepath}`);
    console.log(`  Model ID: ${this.model_id} (use this in SpawnByModelId)`);
    return this;
  }
}

function normalizeLinkTarget(target) {
  if (target == null) return null;
  if (typeof target === "string") return target;
  if (typeof target === "object" && typeof target.type === "string") return target.type.split(",")[0].trim();
  return String(target);
}

function normalizeChildOptions(componentsOrOptions, maybeOptions) {
  if (Array.isArray(componentsOrOptions)) return { ...maybeOptions, components: componentsOrOptions };
  if (componentsOrOptions == null) return { ...maybeOptions };
  if (typeof componentsOrOptions === "object") return { ...componentsOrOptions, ...maybeOptions };
  throw new TypeError("child() second argument must be a components array or options object");
}

function normalizeComponentList(components) {
  return components == null ? null : components.map((c) => normalizeComponentName(c));
}

function createDefaultChildModel(name, id) {
  return {
    Version: 1,
    Name: String(name),
    BaseModelId: null,
    Id: id,
    Components: [],
    Properties: [],
    Values: [
      { TargetType: "MOD.Core.MODEntity", Name: "Enable", ValueType: typeDescriptor(TYPE_MAP.bool), Value: true },
      { TargetType: "MOD.Core.MODEntity", Name: "Visible", ValueType: typeDescriptor(TYPE_MAP.bool), Value: true },
    ],
    EventLinks: [],
    Children: [],
  };
}

function createChildModel(name, parentId, options = {}) {
  const childId = String(options.id ?? options.child_id ?? options.childId ?? randomUuid());
  const sourceModel = options.model ? clone(modelDefinition(options.model, "child model")) : createDefaultChildModel(name, childId);
  const child = {
    Id: childId,
    ParentId: parentId,
    Name: String(options.name ?? name),
    Model: sourceModel,
  };
  ensureChildModelShape(child, child.Name, parentId);
  applyChildOptions(child, options, child.Name, parentId, { isNew: true });
  return child;
}

function applyChildOptions(child, options = {}, fallbackName, parentId, flags = {}) {
  const model = child.Model;
  const oldChildId = child.Id;
  const oldModelId = model.Id;
  child.ParentId = parentId;
  child.Name = String(options.name ?? child.Name ?? fallbackName);
  if (options.id || options.child_id || options.childId) child.Id = String(options.id ?? options.child_id ?? options.childId);
  if (options.modelReplaced !== undefined || options.model_replaced !== undefined) {
    child.ModelReplaced = Boolean(options.modelReplaced ?? options.model_replaced);
  }
  model.Name = String(options.model_name ?? options.modelName ?? model.Name ?? child.Name);
  const explicitModelId = options.model_id ?? options.modelId;
  if (explicitModelId != null) model.Id = normalizeModelId(explicitModelId);
  else if (flags.isNew && (options.model == null || options.preserve_model_id === false || options.preserveModelId === false)) model.Id = child.Id;
  else if (child.Id !== oldChildId && oldModelId === oldChildId) model.Id = child.Id;
  if (!model.Id) model.Id = child.Id;
  model.BaseModelId = normalizeModelId(options.base_model_id ?? options.baseModelId ?? model.BaseModelId);
  const normalizedComponents = normalizeComponentList(options.components);
  if (normalizedComponents != null) model.Components = normalizedComponents;
  if (options.enable !== undefined) upsertValue(model.Values, "MOD.Core.MODEntity", "Enable", Boolean(options.enable), "bool");
  if (options.visible !== undefined) upsertValue(model.Values, "MOD.Core.MODEntity", "Visible", Boolean(options.visible), "bool");
}

function childSummary(child) {
  const model = child.Model || {};
  return {
    name: child.Name || model.Name || "",
    id: child.Id || model.Id || null,
    parent_id: child.ParentId || null,
    model_name: model.Name || "",
    model_id: model.Id || null,
    base_model_id: model.BaseModelId ?? null,
    model_replaced: Boolean(child.ModelReplaced),
    components: Array.isArray(model.Components) ? clone(model.Components) : clone(child.Components || []),
    child_count: Array.isArray(model.Children) ? model.Children.length : 0,
  };
}

function upsertValue(values, targetType, name, val, typeKey = null) {
  const normalizedTarget = normalizeTargetType(targetType);
  const explicitKey = normalizeTypeKey(typeKey);
  const inferredKey = explicitKey || inferType(val);
  const existing = values.find((v) => v.TargetType === normalizedTarget && v.Name === name);
  // Preserve typed metadata (e.g. MODSyncDictionary) when caller passes a dict
  // without an explicit typeKey. inferType() returns "string" for object shapes
  // it can't classify (anything that isn't vector2/3, quaternion, etc.), which
  // would otherwise clobber the ValueType. Also covers the round-trip case
  // where the dict carries a $type from a previous getValueEntry() read.
  const isDictLike =
    val != null && typeof val === "object" && !Array.isArray(val) && inferredKey === "string";
  const shouldPreserveExistingType =
    !explicitKey &&
    isDictLike &&
    existing &&
    existing.ValueType &&
    typeof existing.ValueType.type === "string" &&
    !existing.ValueType.type.startsWith("System.String");
  if (shouldPreserveExistingType) {
    const existingDollar =
      existing.Value && typeof existing.Value === "object" ? existing.Value.$type : null;
    const stripped = clone(val);
    if (stripped && typeof stripped === "object") delete stripped.$type;
    existing.Value = existingDollar ? { $type: existingDollar, ...stripped } : stripped;
    return;
  }
  const typeStr = TYPE_MAP[inferredKey] || String(inferredKey);
  const wrapped = wrapValue(val, inferredKey);
  if (existing) {
    existing.ValueType = typeDescriptor(typeStr);
    existing.Value = wrapped;
    return;
  }
  values.push({
    TargetType: normalizedTarget,
    Name: String(name),
    ValueType: typeDescriptor(typeStr),
    Value: wrapped,
  });
}

function getValueEntry(values, targetType, name, fallback = undefined) {
  const normalizedTarget = normalizeTargetType(targetType);
  const found = values.find((v) => v.TargetType === normalizedTarget && v.Name === name);
  return found ? clone(found.Value) : fallback;
}

function removeValueEntry(values, targetType, name) {
  const normalizedTarget = normalizeTargetType(targetType);
  const before = values.length;
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i].TargetType === normalizedTarget && values[i].Name === name) values.splice(i, 1);
  }
  return values.length !== before;
}

function upsertProperty(properties, values, name, options = {}) {
  if (!name || !String(name).trim()) throw new Error("Property name must not be empty");
  const target = normalizeTargetType(options.target ?? options.link_target ?? options.linkTarget);
  const prop = options.property ?? options.link_property ?? options.linkProperty;
  if (!target || !prop) throw new Error("property() requires options.target and options.property");
  const typeKey = normalizeTypeKey(options.type_key ?? options.typeKey ?? options.type);
  const existingValue = values.find((v) => v.TargetType === target && v.Name === prop && v.ValueType && v.ValueType.type);
  const typeStr = options.type_string || options.typeString || TYPE_MAP[typeKey] || typeKey || (existingValue && existingValue.ValueType.type);
  if (!typeStr) throw new Error(`property('${name}') needs type/type_key or an existing value for ${target}.${prop}`);
  const entry = {
    Type: typeDescriptor(typeStr),
    Name: String(name),
    DisplayName: String(options.display_name ?? options.displayName ?? name),
    ShowInInspector: Boolean(options.show_in_inspector ?? options.showInInspector ?? true),
    Link: {
      Target: componentTypeDescriptor(target),
      Property: String(prop),
    },
  };
  const idx = properties.findIndex((p) => p.Name === entry.Name);
  if (idx >= 0) properties[idx] = entry;
  else properties.push(entry);
}

function removePropertyEntry(properties, name) {
  const before = properties.length;
  for (let i = properties.length - 1; i >= 0; i--) {
    if (properties[i].Name === name) properties.splice(i, 1);
  }
  return properties.length !== before;
}

function ensureChildModelShape(child, name, parentId) {
  child.Name = child.Name || String(name);
  child.Id = child.Id || randomUuid();
  child.ParentId = child.ParentId || parentId;
  child.Model = child.Model || {};
  child.Model.Version = child.Model.Version || 1;
  child.Model.Name = child.Model.Name || child.Name;
  child.Model.BaseModelId = child.Model.BaseModelId ?? null;
  child.Model.Id = child.Model.Id || child.Id;
  child.Model.Components = Array.isArray(child.Model.Components) ? child.Model.Components : [];
  child.Model.Properties = Array.isArray(child.Model.Properties) ? child.Model.Properties : [];
  child.Model.Values = Array.isArray(child.Model.Values) ? child.Model.Values : [];
  child.Model.EventLinks = Array.isArray(child.Model.EventLinks) ? child.Model.EventLinks : [];
  child.Model.Children = Array.isArray(child.Model.Children) ? child.Model.Children : [];
}

function pickEventLinkKey(entry) {
  for (const key of ["Id", "id", "Name", "name", "EventName", "eventName"]) {
    if (entry[key] != null) return key;
  }
  return null;
}

function upsertEventLink(list, link, options = {}) {
  if (!link || typeof link !== "object" || Array.isArray(link)) {
    throw new TypeError("eventLink() requires a link object");
  }
  const entry = clone(link);
  const key = options.key || pickEventLinkKey(entry);
  if (key != null) {
    const idx = list.findIndex((existing) => existing && existing[key] === entry[key]);
    if (idx >= 0) {
      list[idx] = entry;
      return;
    }
  }
  list.push(entry);
}

function removeEventLinkFrom(list, key, value = undefined) {
  if (typeof key === "function") {
    const before = list.length;
    const kept = list.filter((entry) => !key(clone(entry)));
    list.splice(0, list.length, ...kept);
    return list.length !== before;
  }
  if (value === undefined && typeof key === "object" && key != null) {
    const matchKey = pickEventLinkKey(key);
    if (matchKey == null) return false;
    return removeEventLinkFrom(list, matchKey, key[matchKey]);
  }
  const before = list.length;
  const kept = list.filter((entry) => !entry || entry[key] !== value);
  list.splice(0, list.length, ...kept);
  return list.length !== before;
}

function randomUuid() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") return globalThis.crypto.randomUUID();
  return require("crypto").randomUUID();
}

module.exports = {
  ModelBuilder,
  DEFAULT_SPRITE_RUID,
  DEFAULT_DAMAGE_SKIN_ATTACK,
  DEFAULT_DAMAGE_SKIN_HIT,
  DEFAULT_DAMAGE_SKIN_HEAL,
  MOD_CORE_VERSION,
  TYPE_MAP,
  vector2,
  vector3,
  quaternion,
  collision_group: collisionGroup,
  collisionGroup,
  data_ref: dataRef,
  dataRef,
  actionSheet,
  normalizeComponentName,
};
