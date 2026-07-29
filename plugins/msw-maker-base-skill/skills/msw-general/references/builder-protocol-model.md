# Builder Protocol — §2 ModelBuilder (`.model`) + CollisionGroupSetBuilder

Per-builder file of the unified Builder Protocol. **[builder-protocol.md](builder-protocol.md) (core) must be in context alongside this file** — routing, the common workflow, the cross-builder chaining contract, §0 pre-flight, §4 cross-builder flow, and the §5 checklist live in the core and are not repeated here. Mutating another file type in the same turn requires that type's per-builder file too.

## Method index — what `ModelBuilder` / `CollisionGroupSetBuilder` actually exposes

Alpha-sorted **camelCase** method names. **camelCase is canonical** — if a name does not appear here, do not call it. Signatures live in §2.3 / §2.7 below. Internal helpers (prefixed with `_`) are omitted.

**`ModelBuilder`** — instance: `addComponent` · `build` · `child` · `childComponent` · `childEnable` · `childEventLink` · `childFromModel` · `childFromTemplate` · `childProperty` · `childValue` · `childVisible` · `component` · `enable` · `entityEnable` · `entityVisible` · `eventLink` · `getChild` · `getChildValue` · `getValue` · `getValueEntry` · `hasChild` · `hasComponent` · `hasValue` · `listChildren` · `listComponents` · `listEventLinks` · `listValues` · `moveChild` · `property` · `removeChild` · `removeChildComponent` · `removeChildEventLink` · `removeChildProperty` · `removeChildValue` · `removeComponent` · `removeEventLink` · `removeProperty` · `removeValue` · `renameChild` · `renameModel` · `setBaseModelId` · `setChildBaseModelId` · `snapshot` · `upsertEventLink` · `validate` · `value` · `write`. Static: `ModelBuilder.fromTemplate` · `ModelBuilder.load` · `ModelBuilder.read` · `ModelBuilder.snapshot`.

**`CollisionGroupSetBuilder`** — instance: `addGroup` · `build` · `getGroup` · `getGroupId` · `hasGroup` · `listCollisions` · `listGroups` · `removeGroup` · `renameGroup` · `setCollidable` · `setCollidesWith` · `setGroupId` · `snapshot` · `validate` · `write`. Static: `CollisionGroupSetBuilder.load` · `CollisionGroupSetBuilder.read` · `CollisionGroupSetBuilder.snapshot`.

## §2 ModelBuilder — `.model`

A `.model` is an entity template. AI agents **do not** inspect or edit its JSON directly. All read / create / update / write operations go through the skill-local CJS builder:

```javascript
const { ModelBuilder, vector3 } = require("./scripts/model/msw_model_builder.cjs");
```

### §2.0 Non-Negotiable Rule

Do not use `Read`, `cat`, `Get-Content`, `grep`, or manual JSON patches on `.model` files for normal authoring.

Use:

- `ModelBuilder.read(filepath)` / `ModelBuilder.snapshot(filepath)` to inspect existing models.
- `ModelBuilder.fromTemplate(templatePath, name, { model_id })` to create from a shipped template.
- `component()`, `value()`, `property()`, `child()`, `childFromTemplate()`, `childFromModel()`, `eventLink()`, `setBaseModelId()`, `renameModel()` to mutate.
- `write(filepath)` to save, then Maker `refresh`.

The builder owns `EntryKey`, `ContentProto.Json.Id/Name`, value type descriptors, inspector-property links, child model shape, and event-link preservation.

Prefer fluent chaining for normal create/update flows. The mutation methods above return the builder instance, and `write()` also returns the builder after saving. Keep inspection and conditional methods outside the chain: `snapshot()`, `validate()`, `build()`, `get*()`, `has*()`, `list*()`, and boolean-returning removals return data or booleans, not the builder.

### §2.1 Template Catalog

Never start from a blank model. Pick the closest template from the skill-local `models/` folder and load it with `ModelBuilder.fromTemplate()`.

**Template path rule** — templates live in this skill's own `models/` folder, sibling to `scripts/` and `references/`. `fromTemplate`'s first argument is resolved against `process.cwd()`, so always pass either an **absolute path** or a `__dirname`-derived path. Never guess. Templates are **not** under `Global/`, `RootDesk/`, `MyDesk/`, or a top-level `Models/` — those are output locations. An error like `model file not found: ./Global/<Name>.model` means the path was fabricated; recompute it from the skill location, do not create a file there.

```javascript
const path = require("path");
const templateDir = path.join(__dirname, "..", "models"); // from a script under scripts/model/
ModelBuilder.fromTemplate(path.join(templateDir, "ChaseMonster.model"), "MyMonster");
```

#### Base

| Template | Use |
|---|---|
| `../models/TransformOnly.model` | Empty entity with only `TransformComponent` |

#### Characters / Players

| Template | Use |
|---|---|
| `../models/Player.model` | Player variant |
| `../models/DefaultPlayer.model` | DefaultPlayer customization, usually with `BaseModelId` |

#### Monsters

Read [`monster.md`](monster.md) before authoring a monster.

| Template | Use |
|---|---|
| `../models/MonsterCanonical.model` | Default start for new monsters |
| `../models/ChaseMonster.model` | Chasing side-view monster (caveats in [`monster.md`](monster.md)) |
| `../models/MoveMonster.model` | Patrol movement monster |
| `../models/StaticMonster.model` | Stationary attacker |

#### NPC / Interaction

| Template | Use |
|---|---|
| `../models/StaticNPC.model` | Static NPC with dialogue / name tag |

#### Terrain

| Template | Use |
|---|---|
| `../models/Foothold.model` | MapleTile foothold |
| `../models/Ladder.model` | Climbable ladder |
| `../models/Rope.model` | Climbable rope |
| `../models/Portal.model` | Map portal / teleport trigger |

#### Map Objects / Decoration

| Template | Use |
|---|---|
| `../models/MapObject.model` | Generic decorative object |
| `../models/ParticleMapObject.model` | Object with particles |
| `../models/SkeletonMapObject.model` | Skeleton-based animated object |
| `../models/ItemAsset.model` | Item display |

#### Particles / Effects

| Template | Use |
|---|---|
| `../models/BasicParticle.model` | Generic particle |
| `../models/SpriteParticle.model` | Sprite-sheet particle |
| `../models/AreaParticle.model` | Area effect |
| `../models/AnimationPlayer.model` | One-shot animation effect |

#### Sound

| Template | Use |
|---|---|
| `../models/Sound.model` | Position-based sound |
| `../models/SoundEffect.model` | One-shot SFX |

#### Tilemap Containers

| Template | Use |
|---|---|
| `../models/TileMap.model` | MapleTile tile container |
| `../models/RectTileMap.model` | RectTile / SideViewRectTile tile container |
| `../models/MapleMapLayer.model` | Maple-style map layer |
| `../models/MapEmpty.model` | Empty map container |

#### External Media / UI Prefabs

| Template | Use |
|---|---|
| `../models/WebSprite.model` | External image URL |
| `../models/YoutubePlayerWorld.model` | YouTube world object |
| `../models/UIButton.model` | UI button prefab |
| `../models/UIText.model` | Simple UI text prefab |
| `../models/UITextGUIRenderer.model` | Text GUI renderer prefab |
| `../models/UISprite.model` | UI sprite prefab |
| `../models/UIGroup.model` | UI group prefab |
| `../models/UIEmpty.model` | Empty UI prefab |

> For full UI layout work, use the `msw-ui-system` skill's `UIBuilder` ([builder-protocol-ui.md](builder-protocol-ui.md) §3) instead of authoring UI models directly.

### §2.2 Builder Workflow

#### Create from Template

```javascript
const path = require("path");
const { ModelBuilder, vector3 } = require("./scripts/model/msw_model_builder.cjs");

const b = ModelBuilder.fromTemplate(
  path.join(__dirname, "..", "models", "TransformOnly.model"),
  "MyObject"
);

b.component("SpriteRendererComponent")
  .value("SpriteRendererComponent", "SpriteRUID", "1705e3c5b2c146ac9a699f96fb067408", "string")
  .value("TransformComponent", "Position", vector3(0, 1, 0), "vector3")
  .write("RootDesk/MyDesk/Models/MapObjects/MyObject.model");

console.log(b.snapshot());
```

#### Patch Existing Model

```javascript
const b = ModelBuilder.read("RootDesk/MyDesk/Models/Monsters/Slime.model");

b.value("MovementComponent", "InputSpeed", 2.5, "float")
  .value("SpriteRendererComponent", "SpriteRUID", "1705e3c5b2c146ac9a699f96fb067408", "string")
  .write("RootDesk/MyDesk/Models/Monsters/Slime.model");

console.log(b.snapshot());
```

Removal mutators throw when the target value/property/child/event-link is missing. Guard with `hasValue` / `hasChild` if you need idempotent semantics:

```javascript
const b = ModelBuilder.read("RootDesk/MyDesk/Models/Monsters/Slime.model");

if (b.hasValue("MovementComponent", "InputSpeed")) {
  b.removeValue("MovementComponent", "InputSpeed");
}

b.value("MovementComponent", "InputSpeed", 2.5, "float")
  .write("RootDesk/MyDesk/Models/Monsters/Slime.model");
```

#### Inspector Property

```javascript
b.property("speed", {
  target: "MovementComponent",
  property: "InputSpeed",
  type_key: "float",
  display_name: "Movement Speed",
  show_in_inspector: true,
});
```

#### Child Entity

A `.model` describes a tree of entities. The root carries top-level `Components` / `Properties` / `Values` / `EventLinks`; additional entities live in `Children`.

**Child shell schema** — each entry in the root's `Children` array is a wrapper around a full inner model:

| Field | Meaning |
|---|---|
| `Id` | UUID of this child entity. Equals `Model.Id` for builder-created children |
| `ParentId` | UUID of the parent — either the root `model_id`, or another child's `Id` for nested trees |
| `Name` | Display name |
| `Model` | A complete model definition with the same schema as the root: `Version`, `Name`, `Id`, `BaseModelId`, `Components`, `Properties`, `Values`, `EventLinks`, `Children` |
| `ModelReplaced?` | Optional boolean flag set by `childFromTemplate` / `childFromModel` / `{ modelReplaced: true }` |

**Tree representation** — the builder stores all descendants in **one flat array** (`this.children`); the tree shape is recovered from `ParentId`. The inner `Model.Children` array is preserved on round-trip but the builder does **not** read from or write to it — to add grandchildren, pass `{ parent: "..." }` to `child()` so the new entry goes into the flat list with the right `ParentId`.

**Invariants**:

- `child.Id === child.Model.Id` for builder-created children. Templates may diverge unless `preserve_model_id: false` is used (which `childFromTemplate` defaults to).
- `child.ParentId` must point to the root `model_id` **or** another existing child's `Id`. Orphan values are rejected by `validate()` rule M034.
- Each child owns its `Components` / `Values` / `Properties` / `EventLinks` independently. **No implicit inheritance from the root** — to share a base, set `BaseModelId` on the child via `setChildBaseModelId`.
- New children automatically receive `MOD.Core.MODEntity.Enable = true` and `MOD.Core.MODEntity.Visible = true` in their `Values`.
- `renameModel(newName, newId)` rewrites only those `child.ParentId` entries that equal the old root `model_id`; nested (child-of-child) links are left intact, which is correct.
- Child `TransformComponent.Position` is **parent-local**, not world. In MSW 2D only X/Y are meaningful — depth ordering is controlled by `SpriteRendererComponent.SortingLayer` + `OrderInLayer`, not `z`. A child `QuaternionRotation` with `w = -1` is the common horizontal-flip pattern (alternative to `FlipX`).

**Examples**:

```javascript
b.child("WeaponSlot", ["TransformComponent", "SpriteRendererComponent"])
  .childValue("WeaponSlot", "TransformComponent", "Position", vector3(0.5, 0, 0), "vector3");
```

For Maker-style model hierarchy work, prefer the options form — stable IDs, nested parents, template-backed children, model inheritance, and child-local properties / event links:

```javascript
b.child("Body", {
  components: ["TransformComponent", "SpriteRendererComponent"],
  id: "body",
  enable: true,
  visible: true,
})
  .child("NameTag", {
    parent: "Body",
    components: ["TransformComponent", "TextComponent"],
    id: "name_tag",
  })
  .childValue("NameTag", "TransformComponent", "Position", vector3(0, 1.1, 0), "vector3")
  .childProperty("NameTag", "text", {
    target: "TextComponent",
    property: "Text",
    type_key: "string",
  });
```

Clone a shipped template as a child:

```javascript
b.childFromTemplate("Aura", "./skills/msw-general/models/BasicParticle.model", {
  parent: "Body",
  id: "aura",
  preserve_model_id: false,
});
```

Use `model_id` / `base_model_id` only when the child is intentionally tied to a registered model identity. Otherwise let the builder create an owned child model ID from the child ID.

**Validation rules for children** — `b.validate()` (called automatically by `b.write()`) reports these schema violations:

| Rule | Trigger | Fix |
|---|---|---|
| M030 | Child has no `Id` | `child()` auto-fills with `randomUuid()`; only fires for hand-built shells |
| M031 | Child has no `ParentId` | Use `child()` / `moveChild()`, never write the shell directly |
| M032 | Two children share an `Id` | Pass distinct `id` options, or let the builder generate UUIDs |
| M033 | A child `Values` entry has no `ValueType.type` | Always pass `typeKey` when calling `childValue()` |
| M034 | `ParentId` does not match the root or any other child's `Id` | Pass an existing name/id to `parent`; `moveChild()` resolves names automatically |
| M035 | `ParentId === Id` (self-parenting) | `moveChild()` rejects this; only triggered by manual edits |
| M036 | Cycle in the `ParentId` chain | Avoid `moveChild()` calls that close a loop |

#### Event Link

EventLinks are intentionally generic because project shapes vary.

```javascript
b.eventLink({ Id: "openDialog", EventName: "TouchEvent", Target: "DialogLogic" }, { key: "Id" });
b.removeEventLink("Id", "openDialog");
```

### §2.3 Builder API Quick Reference

```javascript
new ModelBuilder(name, { model_id, base_model_id });
ModelBuilder.read(filepath);
ModelBuilder.load(filepath);
ModelBuilder.snapshot(filepath);
ModelBuilder.fromTemplate(templatePath, name, { model_id });

b.snapshot();
b.renameModel(name, modelId);
b.setBaseModelId(baseModelIdOrNull);
b.validate();

b.component(compName);
b.addComponent(compName);
b.hasComponent(compName);
b.removeComponent(compName);
b.listComponents();           // silent — returns array of component type names
b.printComponents();          // listComponents() + log each

b.value(targetType, name, val, typeKey);
b.getValue(targetType, name, fallback);
b.getValueEntry(targetType, name);
b.hasValue(targetType, name);
b.removeValue(targetType, name);
b.enable(targetType, enabled);
b.entityEnable(enabled);
b.entityVisible(visible);
b.listValues();               // silent — returns cloned values array
b.printValues();              // listValues() + log each

b.property(name, { target, property, type_key, display_name, show_in_inspector });
b.removeProperty(name);

b.child(name, components);
b.child(name, { components, parent, id, model_id, base_model_id, enable, visible });
b.childFromTemplate(name, templatePath, options);
b.childFromModel(name, modelJsonOrContent, options);
b.getChild(name);
b.hasChild(name);
b.childComponent(childName, compName);
b.removeChildComponent(childName, compName);
b.childValue(childName, targetType, name, val, typeKey);
b.getChildValue(childName, targetType, name, fallback);
b.removeChildValue(childName, targetType, name);
b.childEnable(childName, enabled);
b.childVisible(childName, visible);
b.childProperty(childName, name, { target, property, type_key, display_name, show_in_inspector });
b.removeChildProperty(childName, name);
b.setChildBaseModelId(childName, baseModelId);
b.moveChild(childName, parentNameOrId);
b.renameChild(childName, newName);
b.childEventLink(childName, linkObject, { key });
b.removeChildEventLink(childName, key, value);
b.removeChild(name);
b.listChildren();             // silent — returns cloned children array
b.printChildren();            // listChildren() + log summary

b.eventLink(linkObject, { key });
b.upsertEventLink(linkObject, { key });
b.removeEventLink(key, value);
b.listEventLinks();           // silent — returns cloned event_links array
b.printEventLinks();          // listEventLinks() + log each

b.build();
b.write(filepath, { ensure_sprite_ruid: true });
```

**Every mutator chains** (`return this`). Missing target → `Error`. See the cross-builder chaining contract above.

- Creators / updaters: `renameModel()`, `setBaseModelId()`, `component()`, `addComponent()`, `value()`, `enable()`, `entityEnable()`, `entityVisible()`, `property()`, `child()`, `childFromTemplate()`, `childFromModel()`, `childComponent()`, `childValue()`, `childEnable()`, `childVisible()`, `childProperty()`, `setChildBaseModelId()`, `moveChild()`, `renameChild()`, `childEventLink()`, `eventLink()`, `upsertEventLink()`, `write()`.
- Removers (throw on miss): `removeComponent()`, `removeChildComponent()`, `removeValue()`, `removeProperty()`, `removeChildValue()`, `removeChildProperty()`, `removeChildEventLink()`, `removeChild()`, `removeEventLink()`.
- Inspection (no chaining): `snapshot()`, `validate()`, `build()`, `get*()`, `has*()`, `list*()` — call on their own line.

**`typeKey` values**: `bool`, `int`, `long`, `float`, `double`, `string`, `vector2`, `vector3`, `quaternion`, `collision_group`, `data_ref`, `sync_string_dict`, `action_sheet`.

**Helpers**: `vector2`, `vector3`, `quaternion`, `collisionGroup` / `collision_group`, `dataRef` / `data_ref`, `actionSheet`.

`SpriteRUID` is a plain string. Do not wrap it in `dataRef()`.

The default generated MOD.Core assembly version is `26.7.0.0`. If a different project CoreVersion requires a different version for newly generated value type blocks, set `MSW_MODEL_BUILDER_MOD_CORE_VERSION` before running Node.

### §2.4 Component Combinations

| Entity type | Core components |
|---|---|
| Visual object | `TransformComponent`, `SpriteRendererComponent` |
| MapleTile side-view moving monster | `MovementComponent`, `RigidbodyComponent`, `StateComponent`, `HitComponent` |
| RectTile top-down moving object | `MovementComponent`, `KinematicbodyComponent` |
| SideViewRectTile moving object | `MovementComponent`, `SideviewbodyComponent` |
| Interactive NPC | `SpriteRendererComponent`, `TouchReceiveComponent` |
| Attackable enemy | `AttackComponent`, `HitComponent` |

The Body component must match the target map's `TileMapMode`; see [`platform.md`](platform.md) §4.

### §2.5 Script Components

Custom `script.XXX` components in a `.model` depend on the script type already being registered.

Required order:

1. Write the script `.mlua`.
2. Maker `refresh`.
3. Build or patch the `.model` through `ModelBuilder`.
4. Maker `refresh` again.

If this order is inconvenient, keep the `.model` native-only and attach the script at spawn time with `entity:AddComponent("ScriptName")`.

### §2.6 Model Checklist

- [ ] Used `ModelBuilder.read()` / `snapshot()` / `fromTemplate()`, not raw `.model` reading.
- [ ] `fromTemplate` path is absolute or `__dirname`-derived (§2.1); never `./Global/...`, `./Models/...`, or a guess.
- [ ] Saved under `RootDesk/MyDesk/Models/{Category}/`.
- [ ] Created any needed folder only; left folder metadata to Maker Refresh.
- [ ] Picked the Body component matching `TileMapMode`.
- [ ] Set a real `SpriteRUID` when using `SpriteRendererComponent`.
- [ ] Used explicit `typeKey` for new or changed values.
- [ ] Called Maker `refresh` after write.
- [ ] Checked logs after refresh / play.

### §2.7 CollisionGroupSetBuilder — `Global/CollisionGroupSet.collisiongroupset`

Use this builder for the existing workspace collision group set only. Do not create a new `.collisiongroupset` file under `Global/`.

```javascript
const { CollisionGroupSetBuilder } = require("./scripts/collisiongroupset/msw_collisiongroupset_builder.cjs");

const cg = CollisionGroupSetBuilder.read("Global/CollisionGroupSet.collisiongroupset");
cg.addGroup("Item")
  .setCollidable("Player", "Item", true)
  .setCollidable("Monster", "Item", false)
  .write("Global/CollisionGroupSet.collisiongroupset");
```

Key rules:

- Scripts use `CollisionGroups.Name`; `.model` `CollisionGroup` values store the group `Id`.
- Keep built-ins (`Default`, `TriggerBox`, `HitBox`, `Interaction`, `Portal`, `Climbable`) intact unless the user explicitly asks for a project-level collision policy change.
- `addGroup()` creates a 32-character hex id by default; pass `{ id }` only when preserving an existing known id.
- The engine supports at most **15 user-defined groups** (excluding `Default` and `MOD@` system groups). `write()` rejects larger sets.
- `setCollidable(a, b, enabled)` is symmetric by default. Pass `{ symmetric: false }` only when the one-way matrix is intentional.
- `write()` rejects missing matrix rows, more than 15 user-defined groups, duplicate group ids, and non-array matrix rows. It warns for duplicate names, dangling matrix ids, one-way collisions, and built-in edits.

API:

```javascript
CollisionGroupSetBuilder.read(filepath);
CollisionGroupSetBuilder.load(filepath);
CollisionGroupSetBuilder.snapshot(filepath);

b.snapshot();
b.validate();
b.listGroups();
b.hasGroup(nameOrId);
b.getGroup(nameOrId);
b.getGroupId(nameOrId);
b.listCollisions(nameOrId);

b.addGroup(name, { id });
b.removeGroup(nameOrId);
b.renameGroup(nameOrId, newName);
b.setGroupId(nameOrId, newId);
b.setCollidable(groupA, groupB, enabled, { symmetric: true });
b.setCollidesWith(group, targets, { symmetric: false });

b.build();
b.write(filepath);
```
