---
name: msw-behaviourtree
description: "Authors MSW `.behaviourtree` files end-to-end and maintains the project-specific authoring spec (`.behaviourDocs/bt-spec.md`). Scans every `.codeblock` whose paired `.mlua` extends `ActionNode`/`DecoratorNode`/`CompositeNode` to build a compact catalog of custom action/decorator/composite UUIDs, propertyKey names, and version-stamped MODNativeType strings. Then generates the full tree: RootNode → Nodes graph, Blackboard variables, nodeProperties wiring, and self-validates parent/child consistency. Triggers: 'create behaviourtree', 'new BT', 'add a behaviour tree', 'BT node graph', '비헤이비어 트리 만들어', '.behaviourtree 생성', 'SequenceNode SelectorNode', 'Blackboard variable', 'definitionId codeblock', 'startNodeId', 'build BT spec', 'refresh bt-spec', 'generate behaviourtree catalog', 'BT 스펙 생성', 'bt-spec.md 만들어', 'rescan BT nodes'."
---

# MSW BehaviourTree

End-to-end authoring skill for MSW `.behaviourtree` files. Owns **both** the project-specific authoring spec (`<ProjectRoot>/.behaviourDocs/bt-spec.md`) and the tree generation itself. Fixed graph rules and skeletons live in this skill's `references/`; the per-project spec is (re)built by this skill's local `scripts/build-spec.cjs`.

---

## 🚦 Execution order (follow this sequence)

### 0. Build / refresh the project spec (`bt-spec.md`)

The spec is the **source of truth** for every project-specific data point: each custom action/decorator/composite node's `definitionId`, `btNodeType`, visible `propertyKey` names, and the serialized `Type.type` strings stamped to this project's `CoreVersion`.

**When to (re)build:**

- First time working on BT in a project (no `.behaviourDocs/bt-spec.md` yet).
- After **any** change that affects BT node surface area:
  - new / renamed / removed `.codeblock` whose paired `.mlua` extends `ActionNode` / `DecoratorNode` / `CompositeNode`
  - added / removed / renamed `property` lines in such a `.mlua`
  - `Environment/config` `CoreVersion` bumped (the serialized type strings are version-tagged).
- The user says they recently added/changed a BT codeblock or a `.mlua` property — stale UUIDs / missing properties silently produce broken trees.
- The downstream validation (Step 7) flags a `definitionId`, `propertyKey`, or version mismatch.

**How to run** — invoke this skill's local script:

```bash
node "scripts/build-spec.cjs" --projectRoot "<MSW project root>"
```

If the current working directory is already the MSW project root, `--projectRoot` can be omitted. Requires Node.js on `PATH` (no other dependencies — pure stdlib `fs`/`path`).

Optional overrides (long flags, case-insensitive):

| Flag | Default | Notes |
|------|---------|-------|
| `--projectRoot` | current working directory | MSW project root to scan |
| `--outputPath` | `<ProjectRoot>/.behaviourDocs/bt-spec.md` | folder is created if missing |
| `--coreVersion` | read from `<ProjectRoot>/Environment/config` (`CoreVersion` field) | required if the config is missing |

Example with overrides:

```bash
node "scripts/build-spec.cjs" --projectRoot "C:/path/to/project" --coreVersion 26.7.0.0
```

The script throws if `Environment/config` is absent and `--coreVersion` is not passed — there is no fallback default.

**What the spec contains:**

1. Project metadata — project root, `CoreVersion`, generated time, discovered node counts.
2. Composite nodes — built-in names with fixed `definitionId` / `btNodeType`, plus discovered custom composites (`.mlua` declares `extends CompositeNode`).
3. Custom action nodes — `Name`, `definitionId`, `btNodeType`, visible property names.
4. Custom decorator nodes — same shape as action nodes.
5. Type map — mlua type to serialized `MODNativeType.type` plus Blackboard `ObjectValue` shape.

UUIDs come from real `.codeblock` files in the project — the spec never invents them. `@HideFromInspector` properties are filtered out automatically. Fixed authoring rules, file skeletons, and validation checklists live in this skill's `references/` rather than in the generated spec.

**After (re)building**, read the freshly written `<ProjectRoot>/.behaviourDocs/bt-spec.md` and continue with the steps below. The compact spec intentionally lists only property names; when constructing `nodeProperties`, resolve each property's mlua type/default from the paired `.mlua` file, then use the type map in `bt-spec.md` §4 for `propertyType.type`.

Also read [`references/skeleton-minimal.json`](references/skeleton-minimal.json) for the smallest valid tree, [`references/skeleton-full.json`](references/skeleton-full.json) for a Composite+Decorator+Action+Blackboard example with all optional fields populated, [`references/node-catalog.md`](references/node-catalog.md) for fixed graph rules, and any existing `.behaviourtree` in the project (`**/*.behaviourtree`) to mirror conventions. Replace `{CORE_VERSION}` in the skeletons with the `CoreVersion` from `bt-spec.md` — both at the top level **and** inside every `MOD.Core.*` type string in Blackboard variables and `nodeProperties`.

### 1. Collect input from the user

Confirm via context, or ask via AskUserQuestion if anything is ambiguous:

| Item | Description | Example |
|------|-------------|---------|
| `name` | Display name for the tree | `"PatrolAndChase"` |
| Save path | `.behaviourtree` location (relative to project root) | `RootDesk/MyDesk/PatrolAndChase.behaviourtree` |
| Tree shape | Intended node graph (root composite + children) | `Sequence → [Chase, MoveTo]` |
| Custom nodes | Action/decorator/composite codeblocks the tree references | `Chase`, `MoveTo`, `Jump` |
| Blackboard variables | Variable name + type + initial value | `TargetEntity: Entity`, `MoveSpeed: number = 10.0` |
| Node properties | For each custom node, which property maps to which Blackboard variable | `Chase.TargetEntityKey = "TargetEntity"` |

**Custom-node existence check (mandatory):** every custom action/decorator/composite name the user mentions must appear in `bt-spec.md` §1 / §2 / §3. If a referenced node is not in the spec, **stop** and ask the user — do not invent a UUID, do not assume a node exists by name, and do not skip rerunning Step 0.

### 2. Mint UUIDs

You need:

- One UUID for the file → goes into `EntryKey` and `ContentProto.Json.id` (both identical, both prefixed `behaviourtree://`).
- One UUID for **each** node in `Nodes` (`nodeId`).

```bash
node -e "console.log(require('node:crypto').randomUUID())"
```

Mint up front, write into a scratch table, then assemble. Don't reuse the file UUID as a `nodeId`.

### 3. Resolve every `definitionId`

| Node category | `definitionId` value | `btNodeType` |
|---------------|----------------------|--------------|
| Built-in composite (`SequenceNode`, `SelectorNode`, `ParallelNode`) | Same string as `nodeName` | `1` |
| Custom composite node (`extends CompositeNode`) | value from `bt-spec.md` §1 | `1` |
| Custom action node | value from `bt-spec.md` §2 | `0` |
| Custom decorator node | value from `bt-spec.md` §3 | `2` |

Custom-node UUIDs come from `bt-spec.md` (which read them from real `.codeblock` files) — never any other source.

### 4. Build the Blackboard

For each variable, copy the `Type.type` string and `ObjectValue` shape verbatim from `bt-spec.md` §4. The version-tagged substring (`Version=<CoreVersion>`) must match exactly — a typo silently breaks deserialization.

`Variables` is an ordered array; each entry: `{ Name, Type: { "$type": "MODNativeType", type: "<from spec>" }, ObjectValue: <from spec> }`. The `ObjectValue` does **not** include a `$type` discriminator (unlike `Value` in `.model` files).

For `Component` / `ComponentRef`, `ComponentId` is `<entity-uuid>:<ComponentName>` (engine component) or `<entity-uuid>:<scriptCodeblockUuid>:<ScriptComponentName>` (script component). Mirror an existing serialized example in the project.

Numeric `ObjectValue`s use float literal form (`3.0`, not `3`).

> **Runtime caveat:** the Blackboard lives on the entry's tree. If any script later calls `AIComponent:SetRootNode(...)` on that component, the entry tree and this Blackboard are discarded — `BlackBoard` reads `nil` and `*Key` properties stop resolving. Do not mix runtime root swaps with Blackboard-dependent trees.

### 4.5 Resolve node property values

For each custom node that needs `nodeProperties`:

1. Confirm the `propertyKey` exists in `bt-spec.md` §1 / §2 / §3 for that node.
2. Find the paired `.mlua` by searching for `script <NodeName> extends ActionNode`, `extends DecoratorNode`, or `extends CompositeNode` under the project. If multiple files match, prefer the one whose sibling `.codeblock` has the exact `definitionId` UUID from `bt-spec.md`; if still ambiguous, ask the user.
3. Read the visible `property` declarations in that `.mlua`, ignoring `@HideFromInspector` properties. This gives the mlua type and default value.
4. Include a `nodeProperties` entry only when the user provided a value, the behavior requires a non-default value, or a `*Key` property must point at a Blackboard variable. Omit optional properties that can safely use the `.mlua` default.
5. For `*Key` string properties, set `propertyValue` to the Blackboard variable name. Infer the variable by name and getter usage when obvious (`MoveSpeedKey` -> `MoveSpeed`, `TargetEntityKey` -> `TargetEntity`). If more than one Blackboard variable could match, ask.
6. For literal properties, use the user-provided value. If no value is provided and the `.mlua` default is meaningful, omit the property instead of serializing a guessed value.
7. If `OnBehave` checks a property for `nil`, empty string, or invalid enum and no value can be inferred, ask the user before writing the tree.

`nodeProperties` entry shape:

```json
{
  "propertyKey": "<property name>",
  "propertyType": { "$type": "MODNativeType", "type": "<type from bt-spec.md §4>" },
  "propertyValue": <value>
}
```

### 5. Assemble Nodes

Hard graph constraints (validate **before** writing):

- **RootNode is not a parent node.** It must not have `childNodes`. It only stores `startNodeId`, and `startNodeId` points to exactly **one** node in `Nodes`.
- If the tree needs several top-level behaviors, use either one Composite as the single `startNodeId`, or one Decorator as the single `startNodeId` whose `decoChildNodes` wraps a Composite or another Decorator chain that eventually wraps a Composite. Put the multiple behaviors under that Composite's `childNodes`.
- Exactly one node in `Nodes` may have `nodeParentId: ""`: the node referenced by `RootNode.startNodeId`. Do not create multiple root-level Action/Composite/Decorator nodes.
- **Composite** (`btNodeType: 1`) is the only node category that can own multiple children through `childNodes`.
- **Decorator** (`btNodeType: 2`) is only a wrapper/parent for exactly one Action, Composite, or Decorator node. It can also be the child of another Decorator, so Decorator-to-Decorator chains are valid. It must use singular `decoChildNodes` (a single `nodeId` string) for that one child, not `childNodes`; the wrapped child must also record the Decorator's id in its `nodeParentId`.
- **Decorators applying to the same Action MUST be chained — never flattened as siblings.** Each decorator owns exactly one downstream subtree. If two or more decorators are meant to gate/modify the same Action, build a single chain `Composite → ADeco → BDeco → CDeco → Action` where each decorator's `decoChildNodes` points to the next decorator (and finally the Action). Concretely: **within one chain leading to a single Action, no two decorators may share the same `nodeParentId`** — each decorator's parent is the previous decorator, and only the topmost decorator's parent is the Composite. Sibling decorators under one Composite are still valid when each wraps a *different* downstream subtree. ✅ `Composite → ADeco → BDeco → CDeco → Action` (chain — every decorator has a unique parent within the chain). ❌ `Composite → [ADeco→Action, BDeco→Action, CDeco→Action]` (Action duplicated to bypass chaining). ❌ `Composite → [ADeco, BDeco, CDeco, Action]` (decorators flattened — they don't wrap the Action and are effectively orphaned).
- **Action** (`btNodeType: 0`) is a leaf — never has children.

Node-write invariants:

- Every `nodeId` is unique within the file.
- `nodeParentId` of every non-root node points to a real `nodeId` that is a Composite or Decorator. It must never point to `RootNode`, because `RootNode` is not represented as a node in `Nodes`.
- If a node's parent is a Composite, that Composite must include the node id in `childNodes`.
- If a node's parent is a Decorator, that Decorator's `decoChildNodes` must equal that node's `nodeId`. This is valid even when both parent and child are Decorators.
- Composite `childNodes` ↔ child `nodeParentId` is **bidirectionally consistent**.
- Action nodes omit `childNodes`. Decorator nodes omit `childNodes` and use exactly one `decoChildNodes` (single string `nodeId`) instead.
- **Never write `probability`.** The editor strips this field on round-trip, and the supported composites (`SequenceNode`, `SelectorNode`, `ParallelNode`) do not consume per-child weights. Older generated trees in the project may still carry `"probability": 1.0` on every node; treat that as legacy on read but do not write it on new nodes.
- **Decorator nodes (`btNodeType: 2`) omit `nodePosition`.** The editor positions a Decorator automatically relative to the child it wraps, and writes no `nodePosition` field for it on save. Only Composites and Actions carry `nodePosition`. The `RootNode` block also carries its own `nodePosition` (separate from the start node).
- **Empty collection fields are omitted, not serialized as `[]`.** A Composite with no children yet should omit `childNodes` entirely; a node with no overrides should omit `nodeProperties` entirely. Empty arrays are an editor-draft artifact — do not author them.
- **Decorator child field is `decoChildNodes`** (canonical — this is what the editor preserves on save; `ChildNodeId` is silently stripped on round-trip). It is a single string holding the wrapped child's `nodeId` (not an array). When *reading* legacy files you may still encounter `ChildNodeId` on hand-authored decorators; treat it as the same field. When *writing*, always emit `decoChildNodes`.
- `RootNode.startNodeId` references one of the `nodeId`s — an Action, Composite, or Decorator — and that node is the only node with `nodeParentId: ""`.

`*Key`-suffix String properties carry the **name** of a Blackboard variable (resolved at runtime via `BlackBoard:GetXxx`). Non-`Key` properties carry the literal value.

### 6. nodePosition format

`nodePosition` is a **JSON object** with numeric `x` / `y`:

```json
"nodePosition": { "x": 0.0, "y": 0.0 }
```

Use float literals (`0.0`, not `0`). The legacy string form `"(0.000, 0.000)"` may still appear in older hand-authored trees — read it as equivalent, but always **write** the object form (the BT editor canonicalizes to this shape on save, so the string form re-serializes to a noisy diff the first time the file is opened).

**Editor axes**: the BT editor uses a math-convention canvas — **+x is right, +y is up** (upper-right quadrant is positive). So a child placed at a *higher* y than its parent appears *above* the parent on screen.

**Layout rule — draw the tree downward**: depth grows along **−y** (children sit below their parent), and siblings spread along **±x** around the parent's x. Typical spacing: 200 units between depth levels and 200 units between siblings.

**`RootNode` block vs the start node — do not stack them at the same position.** `RootNode.nodePosition` is the canvas anchor and stays at `{ "x": 0.0, "y": 0.0 }`. The start node (the node referenced by `startNodeId`) must sit one level **below** that anchor — putting it at `(0, 0)` makes it visually overlap the RootNode marker on the editor canvas. Treat the RootNode anchor as depth 0 and the start node as depth 1.

- `RootNode.nodePosition`: `{ "x": 0.0, "y": 0.0 }` (fixed anchor — never moves)
- Start node (depth 1, referenced by `startNodeId`): `{ "x": 0.0, "y": -200.0 }`
- Single child of the start node (depth 2): `{ "x": 0.0, "y": -400.0 }`
- Two children of the start node (depth 2): `{ "x": -100.0, "y": -400.0 }` and `{ "x": 100.0, "y": -400.0 }`
- Each additional level: parent.y − 200

Never place a child at a y greater than or equal to its parent's y — that draws upward and overlaps the parent visually. The same rule applies between `RootNode` and the start node: the start node must be at `y ≤ -200` (strictly below the anchor).

**Decorator nodes do not carry `nodePosition`.** The editor lays them out automatically relative to the wrapped child. Omit the field on every `btNodeType: 2` node; it appears only on `RootNode`, Composites (`btNodeType: 1`), and Actions (`btNodeType: 0`).

### 7. Write and validate

Write the JSON file, then run this checklist. In particular:

- [ ] `EntryKey` is `behaviourtree://{uuid}` and matches `ContentProto.Json.id` exactly.
- [ ] Top-level `Id`, `GameId`, `Content` are `""`. `Usage`, `UseService`, `DynamicLoading` are `0`. `UsePublish` is `1`. `CoreVersion` matches the project (`Environment/config`). `StudioVersion` is `0.1.0.0`. `ContentType` is `x-mod/behaviourtree`. `ContentProto.Use` is `Json`.
- [ ] `RootNode` has no `childNodes`; `RootNode.startNodeId` matches exactly one `nodeId` in `Nodes`; that start node has `nodeParentId: ""`; and no other node has `nodeParentId: ""`.
- [ ] Every `nodeParentId` is `""` or an existing `nodeId`.
- [ ] All `nodeId` values are unique.
- [ ] For every Composite, the set of `childNodes` IDs equals the set of nodes whose `nodeParentId` is this Composite.
- [ ] Every Action has no `childNodes`. Every Decorator has no `childNodes`, has exactly one `decoChildNodes` (single `nodeId` string — `ChildNodeId` is the legacy variant; the editor strips it on round-trip), and that id points to exactly one Action, Composite, or Decorator child whose `nodeParentId` points back to the Decorator. Decorator-to-Decorator parent/child chains are valid and must be checked with the same `decoChildNodes` ↔ `nodeParentId` rule.
- [ ] **Decorator chain rule:** when multiple decorators apply to the same Action, they form a single chain (`Composite → ADeco → BDeco → … → Action`). Verify by walking each Action upward to its enclosing Composite: the decorators encountered along that one path must all have *unique* `nodeParentId` values (i.e. each decorator's parent is the previous decorator, never another decorator that already appeared in the chain). Two decorators in the same chain sharing a `nodeParentId` is invalid. (Sibling decorators under one Composite that wrap *different* downstream subtrees are fine — uniqueness is per-chain, not global.)
- [ ] No node serializes `"probability"`. (Legacy `1.0` values may appear on read but are never authored.)
- [ ] Every Composite and Action carries `nodePosition` in object form `{ "x": <num>, "y": <num> }` with float literals — no legacy `"(x.xxx, y.yyy)"` strings on write. **Decorator nodes carry no `nodePosition` at all.**
- [ ] **Start node is not stacked on the RootNode anchor.** `RootNode.nodePosition` is `{ "x": 0.0, "y": 0.0 }` and the node referenced by `startNodeId` has `y ≤ -200.0` (typically `{ "x": 0.0, "y": -200.0 }`). If the start node is a Decorator (no `nodePosition`), the first wrapped Composite/Action down the chain must satisfy this offset instead.
- [ ] No node serializes empty arrays — a Composite with no children omits `childNodes`; a node with no overrides omits `nodeProperties`. Do not write `"childNodes": []` or `"nodeProperties": []`.
- [ ] Every custom node's `definitionId` is copied from `bt-spec.md` (never invented).
- [ ] Every `nodeProperties[].propertyKey` matches a property in `bt-spec.md` for that node.
- [ ] Every `*Key` property's `propertyValue` matches a `Blackboard.Variables[].Name` of the right type.
- [ ] Every type string is copied verbatim from `bt-spec.md` §4 — version-tagged, typo-fragile.
- [ ] **Version cross-check:** every `MOD.Core.*` type string's `Version=X.Y.Z.Z` substring (in `Blackboard.Variables[].Type.type` and `Nodes[].nodeProperties[].propertyType.type`) equals the file's top-level `CoreVersion`. Mismatch silently breaks deserialization — common when `bt-spec.md` is stale relative to the project's current `CoreVersion`. If they differ, **re-run Step 0** before writing. (`System.*` types use the immutable `Version=4.0.0.0` and are exempt.)
- [ ] JSON parses:
  ```bash
  node -e "JSON.parse(require('node:fs').readFileSync(process.argv[1],'utf8'))" "<path>"
  ```

If any check fails, fix it before reporting done.

---

## 📂 Files in / consumed by this skill

- [`scripts/build-spec.cjs`](scripts/build-spec.cjs) — Node.js script that scans the project and emits `<ProjectRoot>/.behaviourDocs/bt-spec.md`. Invoked in Step 0.
- `<ProjectRoot>/.behaviourDocs/bt-spec.md` — compact generated catalog. **Source of truth** for node names, `definitionId`, `btNodeType`, property names, and type strings. Written by the script above; consumed by Steps 1–7.
- [`references/skeleton-minimal.json`](references/skeleton-minimal.json) — smallest valid tree (empty Blackboard, single Composite root with no children).
- [`references/skeleton-full.json`](references/skeleton-full.json) — Composite → Decorator → Action with `nodeProperties` (literal + `Key`-suffix) and a populated `Blackboard`. Use this as the shape reference whenever the tree is non-trivial.
- [`references/node-catalog.md`](references/node-catalog.md) — narrative explanation of `btNodeType` values, valid graph shapes, the `Key`-suffix convention, and how the spec builder discovers nodes (kept for reference; the runtime catalog itself lives in `bt-spec.md`).

---

## 🔁 Edit workflow (existing file)

1. Read the entire file — never Edit blind. UUIDs and the parent/child graph must stay consistent.
2. Never change the file's wrapper UUID (`EntryKey` / `ContentProto.Json.id`) — external references break.
3. Adding a node: mint a fresh `nodeId`, append to `Nodes`, update the parent Composite's `childNodes`, set the new node's `nodeParentId`.
4. Removing a node: remove from `Nodes`, remove its ID from any Composite's `childNodes`. If it was a Composite, decide whether to re-parent or remove its children — never leave dangling `nodeParentId` references.
5. If the edit involves a custom node name, property, or type that may have changed in the project since the spec was last built, **re-run Step 0** first.
6. Re-run the Step 7 validation checklist after every edit.
