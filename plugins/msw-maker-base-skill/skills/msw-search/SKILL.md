---
name: msw-search
description: "MSW search integration — (1) vector search for API docs and implementation guides via the msw-mcp MCP server (mlua_api_retriever / mlua_document_retriever), (2) REST API search for resources (sprite / animation / sound / resource pack / avatar). Use for 'find details, examples, or related APIs not in .d.mlua', 'need a SpriteRUID', 'monster sprite', 'background image', 'find a sound', 'avatar item lookup', etc. Keywords: document search, API details, examples, guide, retriever, resource, sprite, animation, sound, RUID, resource pack, avatar."
---

# MSW Search

MSW has **two distinct search targets**:

1. **API docs & implementation guides** — Vector search for descriptions, code examples, and related APIs missing from `.d.mlua`.
2. **Resources** — REST API for sprites, animations, sounds, resource packs, and avatars. The only path for obtaining RUIDs.

---

## Routing Table

| Request type | Go to section |
|--------------|---------------|
| "How do I implement this?", "Show me an example", "What related APIs exist?" | **Document search** |
| ".d.mlua only has the signature; the description is insufficient" | **Document search** |
| "I don't know the API name (semantic search)" | **Document search** |
| "Implementation guide / best practice / pattern" | **Document search** |
| "I need a SpriteRUID", "Find a sprite for monster / NPC / background" | **Resource search** → **start with `resource_pack`** |
| "Find an animation / sound / resource pack" | **Resource search** → **start with `resource_pack`** |
| "Details for this RUID", "Similar resources" | **Resource search** |
| "Avatar item / default avatar lookup" | **Resource search** |
| "Upload / list / update / delete my own assets" | Call `msw-mcp` `asset_*` tools directly |
| "Set sprite pivot", "set 9-slice border", "slice boundary for UI RUID", "asset properties" | Call `msw-mcp` `asset_update_resource_storage_info` directly (`properties: [{ key, value }]` — `pivot_x/y`, `border_left/right/top/bottom`, `filter_mode`, `wrap_mode`) |

> **★ Resource search default — always `resource_pack` first**
>
> Unless the user **explicitly** asks for an individual sprite / animationclip / sound / avatar item (or names a non-pack RUID directly), pass `resourceTypeFilter: ["resource_pack"]` to `searchResources`. A pack bundles every sprite + animation + sound for one asset, so picking a stray `sprite` or `animationclip` first usually leaves the entity with a single frame, no animation set, or the wrong asset family.
>
> Search the pack → drill into `payload.elements` → assign individual RUIDs.
> Switch types only on explicit intent: "BGM file", "individual sprite only", "avatar item", "animationclip similar to this RUID", etc.

---

# Section 1 — Document Search (APIs & Guides)

Vector search via the **`msw-mcp`** MCP server. Supplies the **detailed descriptions, code examples, related APIs, and implementation guides** missing from `.d.mlua`.

## Decision Flow

```
Need API-related information
│
├─ Checking signature / type / property / enum
│   → Read .d.mlua first (highest priority)
│   → If .d.mlua is insufficient, call msw-mcp
│     (code examples, parameter details, related APIs, etc.)
│
├─ Implementation guide / pattern / best practice
│   → mlua_document_retriever
│
└─ Don't know the API name (semantic search)
    → mlua_api_retriever (and/or mlua_document_retriever for broader scope)
```

---

## API Research Order

### Priority 1 — .d.mlua (always first)

If you know the API name, **always read `.d.mlua` first.** Signatures, types, properties, event parameters, and enum values can be confirmed here accurately.

**Path**: `Environment/NativeScripts/{Component,Service,Event,Enum,Logic,Misc}/Name.d.mlua`

| Situation | Example |
|-----------|---------|
| Confirm method signature | "Does TransformComponent have SetPosition?" |
| Property type / existence | "What is the type of SpriteRendererComponent.RUID?" |
| Event parameter structure | "What are the AttackEvent constructor parameters?" |
| List of enum values | "What are the BodyMoveType values?" |
| Method existence | "What methods does SpawnService have?" |

### Priority 2 — Vector search (when .d.mlua is not enough)

`.d.mlua` contains only signatures and **lacks detailed descriptions and examples.** Use vector search when you need any of the following.

| Situation | MCP tool | Example query |
|-----------|----------|---------------|
| Need a **code example** | `mlua_api_retriever` | `AIComponent example`, `BehaviorTree usage` |
| **Parameter details** | `mlua_api_retriever` | `BadgeService GetBadgeInfosAndWait parameters` |
| **Related API** cross-references | `mlua_api_retriever` | `AttackComponent related`, `HitComponent` |
| **ScriptOverridable** check | `mlua_api_retriever` | `AttackComponent CalcCritical override` |
| **Don't know** the API name | both retrievers | `damage calculation`, `inventory save` |
| **"How do I …?"** implementation guide | `mlua_document_retriever` | `how to make inventory system` |
| **Pattern / best practice** | `mlua_document_retriever` | `collision detection best practice` |

---

## MCP Tools (`msw-mcp`)

| Tool | Description |
|------|-------------|
| **`mlua_api_retriever`** | API details for Service / Component / Misc etc. (signatures, parameters, examples). Pass an API/class/function/component name. |
| **`mlua_document_retriever`** | Authoring manuals, guidelines, MLua usage, and other document-style material. Pass a natural-language sentence describing what to implement. |

**On failure**: If a `msw-mcp` tool call errors out, surface the failure to the user and fall back to `.d.mlua`. Do not guess — state what you couldn't verify.

**Default result count**: request `3` results unless wider exploration is explicitly required.

---

## .d.mlua vs Search — Information Comparison

`.d.mlua` is a type stub (~29 lines); Search returns the full document (254+ lines).

| Information | .d.mlua | Search |
|-------------|:-------:|:------:|
| Method signature / types | **O** | O |
| Property declarations | **O** | O |
| Detailed method description (DetailDesc) | X | **O** |
| Code examples (AdditionalPageContent) | X | **O** |
| Per-parameter descriptions | X | **O** |
| Related APIs (SeeAlsoAPIs) | X | **O** |
| Related guides (SeeAlsoGuides) | X | **O** |
| ScriptOverridable flag | X | **O** |
| SyncDirection | Partial | **O** |
| Localized descriptions (Ko/Ja/Es/Zh) | X | **O** |

---

## Maker Editor Syntax → .mlua Conversion Rules

Code examples in search results use **Maker Editor syntax**. They must be converted before being used in a local `.mlua` file.

| Item | Maker Editor | .mlua file | Note |
|------|--------------|------------|------|
| Override declaration | `override integer CalcDamage(...)` | `method integer CalcDamage(...)` | `override` → `method` |
| Block | `{ ... }` | `... end` | Braces → `end` |
| Exec space (own method) | `[server only]` | `@ExecSpace("ServerOnly")` | Self-defined methods: annotate explicitly |
| Exec space (override) | `[server only]` shown / omitted in editor | **Match the parent's `@ExecSpace` exactly** — see warning below | LEA-3014 if mismatched |
| Property | `Property: int32 Score = 0` | `@Sync property int32 Score = 0` | Add `@Sync` if synced |
| Type `int` | `int` | `integer` | C# int → mlua integer |
| Type `number` | `number` | `number` | Same (double) |
| Type `float` | `float` | `float` | Same (single) |

> `number` (64-bit double) and `float` (32-bit single) are assignable to each other but remain distinct types. Follow the `.d.mlua` declaration.

> ⚠ **Override ExecSpace caveat — LEA-3014 `SignatureMismatch`**
>
> The Maker Editor often **hides** the parent's exec space and lets you toggle `[server only]` freely on an `override` block. In `.mlua`, however, the override's `@ExecSpace` must be **byte-identical** to the parent declared in `.d.mlua`. If the parent has no `@ExecSpace` (engine default = `ExecSpace=All`), the override must also **omit** `@ExecSpace` entirely.
>
> Concretely, the AttackComponent / HitComponent damage hooks (`CalcDamage`, `CalcCritical`, `GetCriticalDamageRate`, `GetDisplayHitCount`, `IsAttackTarget`, `IsHitTarget`, `OnAttack`) are all `ExecSpace=All` upstream. Adding `@ExecSpace("ServerOnly")` produces:
>
> ```
> [LEA-3014] SignatureMismatch : The signature of <Child>.CalcDamage[... (ExecSpace=ServerOnly)]
>   must match the overridden <Parent>.CalcDamage.[... (ExecSpace=All)].
> ```
>
> Always look up the parent in `.d.mlua` first and copy its annotation block verbatim. Detail: [`msw-scripting/SKILL.md` §9 "Method override → LEA-3014"](../msw-scripting/SKILL.md).

**Conversion example** — AttackComponent from search results:

```
-- Maker Editor syntax (search result)
override int CalcDamage(Entity attacker, Entity defender, string attackInfo) {
    return 50
}
override boolean CalcCritical(Entity attacker, Entity defender, string attackInfo) {
    return _UtilLogic:RandomDouble() < 0.3
}
```

```lua
-- Converted to .mlua
-- ⚠ Parent AttackComponent.CalcDamage / CalcCritical declare no @ExecSpace
--   (ExecSpace=All). Adding @ExecSpace here triggers LEA-3014 SignatureMismatch.
method integer CalcDamage(Entity attacker, Entity defender, string attackInfo)
    return 50
end

method boolean CalcCritical(Entity attacker, Entity defender, string attackInfo)
    return _UtilLogic:RandomDouble() < 0.3
end
```

---

# Section 2 — Resource Search (Sprite / Animation / Sound / Resource Pack / Avatar)

REST API for searching and browsing MSW resources.
Never guess or fabricate a RUID — **always obtain one through this API**.

> **Default search type = `resource_pack`** — see the pack-first rule under the Routing Table above.

## Access — always go through `msw_resource_api.cjs`

All resource-API calls in this skill are made through the Node.js wrapper

```
scripts/msw_resource_api.cjs
```

**Do not assemble curl commands by hand.** The wrapper:

- Sends UTF-8 JSON bodies directly, so non-ASCII queries (Korean / Japanese / Chinese / emoji) avoid the `{"detail":"There was an error parsing the body"}` failure mode that hits inline `curl -d '...'`.
- URL-encodes slash-containing path parameters (e.g. pack IDs like `npc/1013617.img`).
- Zero dependencies (Node 18+ built-in `fetch` / `AbortController`).
- Uses the **exact OpenAPI field names** (`topK`, `resourceTypeFilter`, `categoryFilter`, `count`, …). Legacy names like `limit` / `types` / `categories` are silently ignored by the server.

Two ways to use it:

```bash
# 1) CLI — fire one call from a shell. Output is pretty-printed JSON.
node scripts/msw_resource_api.cjs \
    search "orange mushroom" --resource-type resource_pack --category npc --topK 3

# Discover available subcommands:
node scripts/msw_resource_api.cjs --help
```

```js
// 2) require — preferred when already in a Node.js context.
const {
  searchResources, searchAvatarItems, findSimilarResources,
  getResource, getResourcesBatch, getResourceTags,
  listResources, randomResources, findPacksContaining,
  listAvatars, getAvatarDefaults,
} = require('./scripts/msw_resource_api.cjs');

const result = await searchResources("orange mushroom", {
  resourceTypeFilter: ["resource_pack"],
  categoryFilter: ["npc"],
  topK: 3,
});
```

## Wrapper function ↔ endpoint map

| Wrapper function | CLI subcommand | Endpoint |
|------------------|----------------|----------|
| `searchResources` | `search` | `POST /v3/search/resources` |
| `searchAvatarItems` | `search-avatar` | `POST /v3/search/resources` (avatar mode) |
| `findSimilarResources` | `similar` | `GET /v3/search/resources/similar/{ruid}` |
| `getResource` | `get` | `GET /v3/resources/{ruid}` (works for sprite / animationclip / resource_pack / avataritem) |
| `getResourcesBatch` | `batch` | `POST /v3/resources/batch` |
| `getResourceTags` | `tags` | `GET /v3/resources/tags/{ruid}` |
| `listResources` | `list` | `GET /v3/resources` (Qdrant Scroll, opaque-string `offset` cursor) |
| `randomResources` | `random` | `GET /v3/resources/random` |
| `findPacksContaining` | `packs` | `GET /v3/resources/packs/{ruid}` (lists packs **containing** a RUID — pack id is NOT accepted here) |
| `listAvatars` | `avatars` | `GET /v3/avatars` |
| `getAvatarDefaults` | `avatar-defaults` | `GET /v3/avatars/defaults` |

> **No `/v3/avatars/{ruid}` endpoint exists.** To inspect an avataritem
> (color_hex, group members, …), call `getResource(ruid)` — the
> `/v3/resources/{ruid}` endpoint returns avataritem detail just like
> any other resource.

## Base URL & transport (informational)

The wrapper handles all of this — you do not need to set it manually.

- Base URL: `https://maplestoryworlds-resourcesearch-new.nexon.com/api`
- No auth (public), `/v3/` prefix, POST bodies are `application/json; charset=utf-8`
- Default timeout: 15s (override via the wrapper's `_request(method, path, { timeout })`)

### Result count — this skill's default is **3**

Unless explicitly told otherwise, **always send `3`** for the result-count parameter
on every search call. The wrapper defaults to 3 as well, and parameter names follow
the OpenAPI spec exactly — note that `limit` / `count` / `topK` differ per endpoint.

| Endpoint | Server parameter | Wrapper default |
|----------|------------------|:---------------:|
| `POST /v3/search/resources` (resources + avatar) | `topK` | **3** |
| `GET /v3/search/resources/similar/{ruid}` | `topK` | **3** |
| `GET /v3/resources` (browsing) | `limit` | **3** |
| `GET /v3/resources/random` | `count` | **3** |
| `GET /v3/resources/packs/{ruid}` (packs containing a RUID) | `limit` | **3** |

> The server-side default is 20 or 50, so **always pass these parameters explicitly**.
> Increase to 10+ (or 50–100 for avatar broad-browse) only when wider exploration is explicitly required.

> **`offset` parameter caveat** — for `GET /v3/resources` and `GET /v3/resources/packs/{ruid}`,
> `offset` is **not an integer** but the **opaque string cursor `nextOffset` returned by the previous response**.
> Do not send it on the first page (sending integer `0` is interpreted as a cursor and returns empty results).

### POST body rule — let `msw_resource_api.cjs` handle it

If you must POST without the wrapper (no HTTP client in your language), reproduce its behaviour:

1. Serialize the body as **UTF-8 JSON bytes** (not a re-encoded shell string).
2. Send `Content-Type: application/json; charset=utf-8`.
3. POST raw bytes (e.g. curl's `--data-binary "@file"` reading a UTF-8 temp file).

Otherwise, just call the wrapper.

## Resource Types

`type` values (the `type` field on server responses, and the values you put
into the `resourceTypeFilter` array when searching):

| type | Description |
|------|-------------|
| `sprite` | Static image (PNG) |
| `animationclip` | Frame-based animation |
| `resource_pack` | Finished asset bundling sprites + animations + sounds |
| `bgm` | Background music (audio) |
| `voice` | Voice clip — NPC dialogue, etc. (audio) |
| `effect` | **Sound effect (audio).** Not a visual effect. For visual particles / hit / skill FX, search `sprite` or `animationclip` (categories `skill` / `mob` / `etc`). |
| `avataritem` | Avatar costume item (cap, coat, pants, shoes, weapon, …) — same `POST /v3/search/resources` endpoint with `resourceTypeFilter: ["avataritem"]`. See [`references/resource/search.md`](references/resource/search.md) ("Avatar Item Search") and [`references/resource/avatar.md`](references/resource/avatar.md). |

> All search and listing endpoints use the same type-filter field name: **`resourceTypeFilter`**
> (an array). Other names like `types` are silently ignored by the server.
> The wrapper's `resource_type_filter` argument (or CLI `--resource-type`) maps to this field.

> ⚠ **`SpriteRendererComponent.SpriteRUID` accepts both `sprite` and `animationclip`, but renders them differently:**
> - `animationclip` → all frame layers play (shadow + body + foreground)
> - `sprite` → that single Sprite renders only
>
> Symptom of mistake: feeding an `animationclip` RUID where you intended a `sprite` (or vice-versa) leaves only the shadow layer visible — the body silently vanishes. Always check `payload.type` of the response before assigning to `SpriteRUID`. Use `sprite` for the static idle/default frame; use `animationclip` only for fields like `StateAnimationComponent.ActionSheet` values.
>
> **`skeleton` and `avataritem` RUIDs fail silently (no error, nothing renders) when assigned to `SpriteRUID` / `ImageRUID` without the `thumbnail://` prefix.** Conversely, `CostumeManagerComponent.Custom*Equip` / `SkeletonRendererComponent.SkeletonRUID` / `StateAnimationComponent.ActionSheet` do **not** accept the `thumbnail://` prefix — pass a plain RUID there. If the search query targeted an icon / thumbnail image and returned a `sprite` RUID, that RUID is already renderable directly — adding `thumbnail://` is redundant. Full assignment rules — accepted types, slot-by-slot prefix matrix, RUID-vs-prefix usage — live in [`msw-sprite-ruid/SKILL.md`](../msw-sprite-ruid/SKILL.md).

## Categories

`category` values that actually appear on responses. Use these with `categoryFilter`.

### General resources (`sprite` / `animationclip` / `resource_pack` / `bgm` / `voice` / `effect`)

| category | Description |
|----------|-------------|
| `mob` | Monster |
| `npc` | NPC |
| `item` | Item |
| `skill` | Skill effect / skill resources |
| `object` | Map object (tree, rock, decoration) |
| `background` | Background / map tile / BGM |
| `foothold` | Walkable platform |
| `rope` | Rope |
| `ladder` | Ladder |
| `etc` | Uncategorized |

### Avatar (`avataritem` only)

| category | Slot |
|----------|------|
| `cap`, `hair`, `face`, `faceaccessory`, `eyeaccessory`, `earaccessory` | Head / face |
| `coat`, `longcoat`, `pants`, `shoes`, `glove`, `cape` | Body |
| `weapon`, `twohandweapon`, `subweapon`, `shield` | Weapon |

> `map`, `effect`, `ui` are **not** valid category values — they return zero results.
> - Looking for maps / backgrounds → `category: "background"` or `"object"`.
> - Looking for **visual effects** → search `sprite` / `animationclip` with `category: "skill"` (or `mob`/`etc`); `effect` is the **audio** resource_type, not a category.
> - There is no `ui` resource family in this index — UI sprites usually live as `sprite` + `category: "etc"`.

## RUID

A 32-character hex string that uniquely identifies every resource. Example: `"0017da7385e04bc4b2ddbe5949b4b462"`

- The `id` field in search results is the RUID
- `assetGuid` is a separate Unity asset GUID (used in `spawn_preset`)
- Never guess or fabricate a RUID — always obtain it from an API response

## Common Response Fields

```json
{
  "id": "32-char hex RUID",
  "type": "sprite|animationclip|resource_pack|bgm|voice|effect|avataritem",
  "category": "mob|npc|item|skill|object|background|foothold|rope|ladder|etc | <avatar slot>",
  "names": {
    "ko": ["Korean name"],
    "en": ["English name"]
  },
  "assetGuid": "Unity asset GUID (may or may not exist)",
  "payload": {
    "width": 64,
    "height": 64,
    "thumbnail": "https://...",
    "pivot": {"x": 32, "y": 32},
    "frames": [],
    "elements": []
  }
}
```

## Pagination — same name, two flavors

`nextOffset` appears in every list-style response but means **different things** depending on the endpoint. Round-tripping a value into the wrong endpoint silently misbehaves.

| Endpoint | `nextOffset` type | Meaning | How to paginate |
|---|---|---|---|
| `POST /v3/search/resources` (search) | **integer** | Item offset (0-based) | Pass it back as `offset` (number) |
| `GET /v3/search/resources/similar/{id}` (similar) | **integer** | Item offset | Same |
| `GET /v3/resources` (list) | **opaque UUID string** | Qdrant Scroll cursor | Pass the string back as `offset`. **End-of-stream = `null`** |
| `GET /v3/resources/packs/{ruid}` (packs) | **opaque UUID string** | Same cursor | Same |
| `GET /v3/resources/random` | n/a | No pagination | — |

**Rules:**

1. Never feed a `list` cursor into a `search` call (or vice versa) — the server ignores the wrong-shape value and returns the first page.
2. On the **first page**, omit `offset` entirely. Sending integer `0` to `list` / `packs` is interpreted as a cursor and yields **zero items** (silent failure).
3. Stop paginating when the response returns `nextOffset: null` (list / packs) or returns fewer items than `topK` (search / similar).

## Endpoint Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/v3/search/resources` | Natural-language semantic search (incl. avatar items via `resourceTypeFilter: ["avataritem"]`) |
| GET | `/v3/search/resources/similar/{ruid}` | Find similar resources |
| GET | `/v3/resources/{ruid}` | Single resource details (sprite / animationclip / **resource_pack with populated elements** / **avataritem**) |
| POST | `/v3/resources/batch` | Batch fetch multiple resources |
| GET | `/v3/resources/tags/{ruid}` | AI-generated multilingual tags |
| GET | `/v3/resources` | List resources (Qdrant Scroll, opaque-string `offset` cursor) |
| GET | `/v3/resources/random` | Random resource recommendation |
| GET | `/v3/resources/packs/{ruid}` | List resource packs **containing** the given RUID — the path parameter is a 32-char-hex RUID, not a pack id |
| GET | `/v3/avatars` | List all avatar items (cached) |
| GET | `/v3/avatars/defaults` | Default avatar body / head RUIDs |

> Single avataritem detail uses `/v3/resources/{ruid}` (no
> `/v3/avatars/{ruid}` endpoint exists).

---

## Resource Routing Guide

> **★ When in doubt, search `resource_pack` first.** Only the rows marked with an
> explicit non-pack intent below should bypass the pack-first default.

| Situation | Wrapper call (CLI subcommand) | Reference file |
|-----------|-------------------------------|----------------|
| "Find a slime / orange mushroom / monster / NPC / item / background / map asset" (default — no type specified) | `searchResources(query, { resourceTypeFilter: ["resource_pack"], ... })` (`search ... --resource-type resource_pack`) | [`references/resource/search.md`](references/resource/search.md) |
| "Find an **individual sprite** / single image" (user explicitly asked for a sprite) | `searchResources(query, { resourceTypeFilter: ["sprite"], ... })` | [`references/resource/search.md`](references/resource/search.md) |
| "Find an **individual animationclip**" (user explicitly asked for an animation) | `searchResources(query, { resourceTypeFilter: ["animationclip"], ... })` | [`references/resource/search.md`](references/resource/search.md) |
| "Find a **visual effect / particle / hit FX**" | `searchResources(query, { resourceTypeFilter: ["animationclip","sprite"], categoryFilter: ["skill","mob","etc"] })` — note: `effect` here would mean **audio**, not visual | [`references/resource/search.md`](references/resource/search.md) |
| "Find a **sound / BGM / voice / sound-effect**" (audio) | `searchResources(query, { resourceTypeFilter: ["bgm"\|"voice"\|"effect"], ... })` — `effect` resource_type = sound-effect (audio) | [`references/resource/search.md`](references/resource/search.md) |
| "Find a **background / map tile / scenery**" | `searchResources(query, { resourceTypeFilter: ["sprite","animationclip"], categoryFilter: ["background","object"] })` — there is no `map` category in the index | [`references/resource/search.md`](references/resource/search.md) |
| "Find a costume / hat / shoes / weapon (avatar item)" | `searchAvatarItems(...)` (`search-avatar`) | [`references/resource/search.md`](references/resource/search.md) (Avatar Item Search section) + [`references/resource/avatar.md`](references/resource/avatar.md) |
| "Any more monsters like this one?" | `findSimilarResources(ruid, ...)` (`similar`) | [`references/resource/search.md`](references/resource/search.md) |
| "Details for RUID abc123" (any type incl. avataritem and resource_pack) | `getResource(ruid)` (`get`) | [`references/resource/detail.md`](references/resource/detail.md) |
| "Show me a list of monster sprites" | `listResources(...)` (`list`) | [`references/resource/browse.md`](references/resource/browse.md) |
| "Which resource packs include this RUID?" | `findPacksContaining(ruid, ...)` (`packs`) | [`references/resource/browse.md`](references/resource/browse.md) |
| "Browse all avatar items" | `listAvatars(...)` (`avatars`) | [`references/resource/avatar.md`](references/resource/avatar.md) |

### Typical Workflow (pack-first)

```
1. searchResources(query, { resourceTypeFilter: ["resource_pack"], topK: 3 })
   → obtain a resource_pack RUID (or pack id like "npc/9072309.img")
   → switch types only on explicit user intent, or fall back when 0 packs match
2. getResource(id)
   → resource_pack: payload.elements is pre-populated with element payloads
                    (sprite / animationclip / sound RUIDs live here)
   → avataritem:    payload has color_hex / group meta
3. Pick the element from payload.elements and assign its RUID to
   SpriteRendererComponent.SpriteRUID / StateAnimationComponent.ActionSheet
   (or assign avataritem RUIDs through the slot mapping in `msw-avatar`)
```

> **Don't** call `findPacksContaining(packId)` to "open" a pack — that endpoint takes a 32-hex RUID and returns the **packs that include that RUID**, not the contents of a pack. Use `getResource(packId)` for pack contents.

> **For detailed Request/Response of each endpoint, refer to the files under `references/resource/`.**

---

## Sprite Orientation — Most Resources Face Left

Most MSW sprite / animationclip / resource_pack assets — especially `mob`, `npc`, and player-character — are authored **facing left**, so a freshly spawned `SpriteRendererComponent` renders left unless you flip it.

| Situation | What to do |
|-----------|-----------|
| Spawn an entity that should face **right** | Set `FlipX = true` on `SpriteRendererComponent` (default is `false` = left-facing as authored) |
| Custom AI / chase using `MovementComponent:MoveToDirection` | Update `FlipX` on direction change: `sprite.FlipX = velocity.x > 0` (right ⇒ flip) |
| Monster model / monster collider alignment | Invert `TransformComponent.Scale.x` instead of `FlipX` so the sprite and collider stay aligned; see [`msw-general/references/monster.md`](../msw-general/references/monster.md) |
| Native `AIChaseComponent` / `AIWanderComponent` | Engine flips automatically based on movement — do nothing |
| Top-down (`RectTile`) movement | Decide per-axis: usually flip when `dx > 0`; sprites with up/down frames need the StateAnimationComponent action set instead |
| `_EffectService:PlayEffect(...)` should face right | Pass `FlipX = true` in the `options` table |
| Player-attached effect must follow the player's facing | Use `SyncFlip = true` in `PlayEffect` options, or read `PlayerControllerComponent.LookDirectionX` |
| Resource is authored facing right (rare) | Inspect `payload.thumbnail` via `GET /v3/resources/{ruid}` and invert the rule for that asset |

```lua
-- Custom side-view chase: flip sprite to match movement direction
local sprite = self.Entity.SpriteRendererComponent
local selfX = self.Entity.TransformComponent.WorldPosition.x
local dx    = targetPos.x - selfX
if dx ~= 0 then
    sprite.FlipX = dx > 0   -- target on the right → flip
end
```

> **Sanity check** — the left-facing convention is not contractual. Open `payload.thumbnail` from `GET /v3/resources/{ruid}` to confirm.
>
> **Do not use `TransformComponent.Scale.x` as a general renderer flip** — for players / effects / non-monster renderers, use `SpriteRendererComponent.FlipX`. **Monster exception**: monster models should invert `TransformComponent.Scale.x` so the sprite and collider stay aligned. Related: [`msw-combat-system/SKILL.md` "Direction check ★"](../msw-combat-system/SKILL.md), [`msw-general/references/monster.md`](../msw-general/references/monster.md).

---

# Shared Tips

1. **Keyword choice** — Use the exact name if you know it; natural-language Korean/English also works.
2. **Adjust the page-size parameter** — the name differs per endpoint (`topK` for search/similar, `limit` for list/packs, `count` for random). **This skill's default is 3** (see the "Result count" table above). Keep it at 3 for precise lookups; increase to 10+ (or 50–100 for avatar broad-browse) only when wider exploration is required.
3. **When search fails**:
   - Document search fails → read `.d.mlua` directly.
   - Resource search fails → retry with synonyms or a different category; browse with `listResources(...)` (CLI: `list`) by type/category.
   - `POST` returns `{"detail":"There was an error parsing the body"}` → you bypassed
     the wrapper and sent JSON inline via `curl -d '{...}'`. Switch to
     `msw_resource_api.cjs` (or replicate its UTF-8 raw-body POST pattern) as
     described in Section 2.
4. **Composite queries are allowed** — e.g. `AttackComponent CalcCritical` for docs, `red slime jump` for resources.
5. **No guessing** — Never guess API names, RUIDs, or enum values; always confirm via search or references.
