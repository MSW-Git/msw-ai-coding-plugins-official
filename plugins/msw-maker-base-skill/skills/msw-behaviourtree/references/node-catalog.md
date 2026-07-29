# BT Node Catalog

Reference for filling `nodeName`, `definitionId`, and `btNodeType` correctly. The catalog is **project-agnostic** — it describes the format and how to discover what nodes are available in *any* project, not a fixed list of node names.

## `btNodeType` values

| Value | Category | Notes |
|------:|----------|-------|
| `0` | Action (leaf) | `.mlua` declares `script X extends ActionNode`. No `childNodes`. |
| `1` | Composite | Built-in (`SequenceNode`, `SelectorNode`, `ParallelNode`) **or custom** — `.mlua` declares `script X extends CompositeNode`. Has `childNodes`. |
| `2` | Decorator | `.mlua` declares `script X extends DecoratorNode`. Wraps a single child (or a single sub-tree). Inferred value — confirm against an existing decorator-using BT in the project before relying on it. |

## Valid graph shapes (parent ↔ child rules)

These are hard constraints — violating them produces a tree that loads but does not behave correctly. Validate **before** writing the file.

| Parent | Allowed children | Notes |
|--------|------------------|-------|
| **RootNode** (`startNodeId`) | Exactly **one** node — Composite, Decorator, or Action | RootNode is not a parent node and must not have `childNodes`. `startNodeId` is a single id, not a list. Exactly one node may have `nodeParentId: ""`, and it must be the `startNodeId` node. To run several actions in sequence/parallel/etc., the start node must be one Composite or one Decorator that wraps a Composite, directly or through a Decorator chain. **Never** model multiple root children. |
| **Composite** (`btNodeType: 1`) | One or more children of any kind (Action, Composite, Decorator) | This is the only node category that holds multiple children. `childNodes` is the ordered list. |
| **Decorator** (`btNodeType: 2`) | Exactly **one** child — Action, Composite, or another Decorator | Decorators can be attached as the parent/wrapper of one Action, Composite, or Decorator node, and can themselves be attached under another Decorator. Use singular `decoChildNodes` (a single `nodeId` string, not an array) for that one child, not `childNodes`; the wrapped child's `nodeParentId` must point back to the Decorator. The legacy field name `ChildNodeId` may appear in older hand-authored files — read it as equivalent, but the editor strips it on round-trip, so always write `decoChildNodes`. **Decorator nodes carry no `nodePosition`** — the editor lays them out automatically relative to their wrapped child. |
| **Action** (`btNodeType: 0`) | **None** (leaf) | Action nodes never have children. Omit `childNodes` entirely. If you need a sequence of actions, put them under a Composite, not chained under each other. |

**Inverse formulation (top-down):**
- Want multiple actions to run? → put a **Composite** above them.
- Want to gate / loop / cooldown a sub-tree? → put a **Decorator** above it (above a Composite, an Action, or another Decorator).
- Want multiple gates / loops / cooldowns on the same sub-tree? → chain **Decorator → Decorator → Action/Composite/Decorator** with one `decoChildNodes` at each Decorator layer.
- Want a single action at the root? → allowed, but rare; usually wrap with a Composite or Decorator anyway.

**Common mistakes to reject during planning:**
- ❌ RootNode with a `childNodes` array. RootNode must only point to one `startNodeId`.
- ❌ Two or more root-level nodes with `nodeParentId: ""`. The format only executes one `startNodeId`; multiple root-level actions/composites/decorators are invalid for generated trees.
- ❌ Two or more actions directly under the root (no parent Composite). Put them under a single Composite start node, or under a Composite wrapped by one or more Decorators.
- ❌ An Action with `childNodes` populated. Actions are leaves.
- ❌ A Decorator with zero children or more than one child. Decorators can only parent one Action, Composite, or Decorator.
- ❌ A Decorator with `childNodes`. Decorators use singular `decoChildNodes` (a single `nodeId` string), and that id must match its single wrapped child.
- ❌ Any node other than the `startNodeId` node with `nodeParentId: ""`. Re-parent it under the start Composite or remove it.
- ❌ **Multiple decorators meant to apply to the *same* Action laid out as siblings of a Composite instead of chained.** When two or more decorators must wrap one Action, they form a single chain — each decorator's child is the next decorator (or finally the Action), so each decorator in the chain has a *unique* `nodeParentId`. ✅ `Composite → ADeco → BDeco → CDeco → Action` (chain). ❌ `Composite → [ADeco, BDeco, CDeco, Action]` (decorators flattened as siblings; the decorators are orphaned with no Action to wrap, and the Action is unguarded). ❌ `Composite → [ADeco→Action, BDeco→Action, CDeco→Action]` (Action duplicated to bypass chaining). The shared-`nodeParentId` red flag: if two decorators share the same `nodeParentId` value yet the user described them as gating/modifying the same Action, the structure is wrong — chain them. Sibling decorators under one Composite are only valid when each wraps a *distinct* downstream Action/subtree.

## Discovering available nodes in *any* MSW project

The creator should normally consume `<ProjectRoot>/.behaviourDocs/bt-spec.md`, generated by `msw-behaviourtree-spec-builder`. That compact spec is the source of truth for node names, `definitionId`, `btNodeType`, and valid property names.

If the spec is missing or stale, regenerate it first. If you are debugging discovery manually, use the same logic as the builder:

1. Glob the project for `**/*.codeblock`.
2. For each `.codeblock`, read `ContentProto.Json.Name` and `ContentProto.Json.Id`.
3. Find the sibling `.mlua` with the same base name.
4. Classify the node from the `.mlua` declaration: `script X extends ActionNode` -> custom action (`btNodeType: 0`), `script X extends DecoratorNode` -> custom decorator (`btNodeType: 2`), `script X extends CompositeNode` -> custom composite (`btNodeType: 1`, may have `childNodes`).
5. Use the codeblock `Id` as `definitionId: codeblock://{Id}`.

The `ContentProto.Json.Target` field can be useful as a fallback, but do not rely on it as the primary classifier; generated BT nodes may have a missing or unreliable target.

### Finding property metadata

The compact spec lists only property names. For each property you need to serialize, find the node's paired `.mlua`. The `.mlua`'s visible `property` declarations enumerate exactly which `propertyKey` strings are valid and what mlua type/default each one has.

```
property string TargetPositionKey = ""    →  propertyKey: "TargetPositionKey", propertyType: System.String
property number MoveSpeed         = 10.0  →  propertyKey: "MoveSpeed",         propertyType: System.Double
property bool   IsActive          = false →  propertyKey: "IsActive",          propertyType: System.Boolean
```

`@HideFromInspector property …` declarations are runtime-only state — **never** include them in `nodeProperties`.

### Confirm built-in composite names

Built-in composites use **the node name itself as `definitionId`** (no `codeblock://` prefix). To find which built-in names this version of the engine accepts, prefer one of:

1. Read an existing `.behaviourtree` file in the project and harvest the `nodeName` / `definitionId` strings used on `btNodeType: 1` nodes.
2. Check engine documentation / `Environment/NativeScripts/` if available.

Common names that BT engines typically expose — verify before use:

- `SequenceNode` — runs children left-to-right; fails fast on first failure; succeeds when all succeed.
- `SelectorNode` — runs children left-to-right; succeeds fast on first success.
- `ParallelNode` — runs children concurrently.

If a name isn't confirmed by either source, ask the user instead of guessing.

## `nodeProperties` ↔ `.mlua` property mapping

Each entry in `nodeProperties` must correspond to a property name listed for that node in `bt-spec.md` and declared in the node's `.mlua`. The `propertyType.type` and `propertyValue` shape MUST match the declared type — use the type map in `bt-spec.md` §4.

`{V}` is the engine version stamped into the file (e.g. `26.7.0.0`). Match the project's existing files.

**Primitives (System.*)**

| `.mlua` declaration | `propertyType.type` | `propertyValue` |
|---------------------|----------------------|------------------|
| `bool`    | `System.Boolean, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089` | `true` / `false` |
| `string`  | `System.String, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089` | `"<string>"` |
| `integer` | `System.Int64, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089` | `<int>` (also used for enum-like operator properties — e.g. `BlackboardCondition_*` nodes serialize `Operator: 2` as `System.Int64`) |
| `number`  | `System.Double, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089` | `<num>` (use `3.0` not `3`) |

**MOD.Core types**

| `.mlua` declaration | `propertyType.type` | `propertyValue` shape |
|---------------------|----------------------|------------------------|
| `Vector2` | `MOD.Core.MODVector2, MOD.Core, Version={V}, Culture=neutral, PublicKeyToken=null` | `{ "x": <num>, "y": <num> }` |
| `Vector3` | `MOD.Core.MODVector3, MOD.Core, Version={V}, Culture=neutral, PublicKeyToken=null` | `{ "x": <num>, "y": <num>, "z": <num> }` |
| `Vector4` | `MOD.Core.MODVector4, MOD.Core, Version={V}, Culture=neutral, PublicKeyToken=null` | `{ "x": <num>, "y": <num>, "z": <num>, "w": <num> }` |
| `Color` | `MOD.Core.MODColor, MOD.Core, Version={V}, Culture=neutral, PublicKeyToken=null` | `{ "r": <0..1>, "g": <0..1>, "b": <0..1>, "a": <0..1> }` |
| `Entity` | `MOD.Core.MODEntity, MOD.Core, Version={V}, Culture=neutral, PublicKeyToken=null` | `{ "tempEntityId": null, "IsRelative": false, "EntityId": "<entity-uuid>", "Version2": false }` |
| `Component` | `MOD.Core.Component.MODComponent, MOD.Core, Version={V}, Culture=neutral, PublicKeyToken=null` | `{ "IsRelative": false, "ComponentId": "<entity-uuid>:<ComponentName>", "UseNested": false }` |
| `ComponentRef` | `MOD.Core.MODComponentRef, MOD.Core, Version={V}, Culture=neutral, PublicKeyToken=null` | `{ "IsRelative": false, "ComponentId": "<entity-uuid>:<ComponentName>", "UseNested": false }` |
| `EntityRef` | `MOD.Core.MODEntityRef, MOD.Core, Version={V}, Culture=neutral, PublicKeyToken=null` ⚠ inferred | uncertain — Grep the project for a real example before using |

`Component` (live binding) and `ComponentRef` (reference) share the same `ComponentId` payload shape — `<entity-uuid>:<ComponentName>` where `<ComponentName>` is the engine component (`TransformComponent`, `AttackComponent`, …) or, for script components, the form is `<scriptCodeblockUuid>:<ScriptComponentName>`. Mirror an existing serialized example.

For any type not in the table, do not guess — Grep the project for a serialized example and copy the type string verbatim.

**`Key`-suffix convention:** properties whose name ends with `Key` (e.g. `TargetEntityKey`, `MoveSpeedKey`) are **String** properties whose `propertyValue` is the **name of a Blackboard variable** — the script resolves the actual value at runtime via `BlackBoard:GetNumber(self.MoveSpeedKey)` etc. Properties without the `Key` suffix carry the literal value directly.
