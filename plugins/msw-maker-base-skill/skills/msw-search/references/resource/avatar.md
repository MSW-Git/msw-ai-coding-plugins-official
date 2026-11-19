# Avatar Lookup

Search avatar costume items, browse the full avatar catalog, look up
default parts, and inspect item details.

> **All examples in this file go through the Node.js wrapper
> `scripts/msw_resource_api.cjs`.** Use it either as a CLI from a
> shell or via `require(...)` inside Node.js — never assemble curl commands
> by hand.

---

## Searching Costume Items — `POST /v3/search/resources`

**Costume items (hats, coats, shoes, weapons, …) are searched through the
general resource-search endpoint** with `resourceTypeFilter: ["avataritem"]`.
The wrapper exposes this as `searchAvatarItems` (CLI: `search-avatar`)
and hard-codes that filter, so you only need to pass the query (and
optionally a slot category).

```bash
# CLI — narrow to a specific slot with --category
node scripts/msw_resource_api.cjs \
    search-avatar "early dismissal" --topK 3 --category shoes
```

```js
// Node.js
const { searchAvatarItems } = require('./scripts/msw_resource_api.cjs');

const result = await searchAvatarItems("early dismissal", {
  topK: 3,
  categoryFilter: ["shoes"],
});
```

Each result has `type: "avataritem"` and a `category` matching the avatar slot
(`cap`, `coat`, `pants`, `shoes`, `weapon`, …). Use the `id` (RUID) to assign to
the corresponding `Custom*Equip` property — see the slot mapping table in the
`msw-avatar` skill.

> **For full request/response details (fields like `dname`, `score`, `hasEmbedding`,
> `payload.color_hex`, `categoryFilter` slot list, pagination via `nextOffset`/`offset`),
> see the "Avatar Item Search" section in [`references/resource/search.md`](search.md).**

---

## GET /v3/avatars

List **all** avatar items (server-cached). Best for browsing tabs without
a query; for keyword search use `searchAvatarItems`.

### Usage

```bash
# CLI — canonical-only (default; deduped by color/shape variant)
node scripts/msw_resource_api.cjs avatars

# Include all variants
node scripts/msw_resource_api.cjs avatars --no-canonical-only
```

```js
// Node.js
const { listAvatars } = require('./scripts/msw_resource_api.cjs');

const avatars = await listAvatars({ canonicalOnly: true });
```

| Query param (server) | Wrapper arg / CLI flag | Type | Description |
|----------------------|------------------------|------|-------------|
| `canonicalOnly` | `canonicalOnly` / `--no-canonical-only` | bool | Server default `true` (variant groups deduped to representative) |

### Response

```json
{
  "items": [
    {
      "ruid": "d9e9948624a54255b079df8dba096f47",
      "category": "coat",
      "names": {"ko": ["Yellow Frill Sleeveless"]},
      "dname": "coat-541",
      "group_id": "coat:757587b9bf92",
      "color_hex": "#eeac19",
      "group_size": 2,
      "group_canonical": false,
      "group_members": [...]
    }
  ],
  "nextOffset": null,
  "total": null
}
```

---

## GET /v3/avatars/defaults

Fetch the default avatar body / head RUIDs.

### Usage

```bash
# CLI
node scripts/msw_resource_api.cjs \
    avatar-defaults
```

```js
// Node.js
const { getAvatarDefaults } = require('./scripts/msw_resource_api.cjs');

const defaults = await getAvatarDefaults();
```

### Response

```json
{
  "body": "body_ruid_32hex",
  "head": "head_ruid_32hex"
}
```

`body` and `head` are the base avatar parts used with costume item slots.

---

## Inspecting an avatar item — use `GET /v3/resources/{ruid}`

> **There is no `/v3/avatars/{ruid}` endpoint.** Avatar item details
> live behind the same `GET /v3/resources/{ruid}` endpoint that returns
> sprites, animationclips, and resource_packs.

### Usage

```bash
# CLI
node scripts/msw_resource_api.cjs \
    get ITEM_RUID
```

```js
// Node.js
const { getResource } = require('./scripts/msw_resource_api.cjs');

const item = await getResource("ITEM_RUID");
```

### Response (avataritem branch)

```json
{
  "id": "71ce85c4acf04770949b7a55488974c2",
  "type": "avataritem",
  "category": "cap",
  "names": {"ko": ["Orange Mushroom Beanie"]},
  "dname": "cap-895",
  "payload": {
    "color_hex": "#ed8316",
    "group_size": 2,
    "group_canonical": false,
    "group_members": [...],
    "group_id": "cap:..."
  }
}
```

## Workflows

### Costume item search → application
1. `searchAvatarItems("...", { topK: N, categoryFilter: [slot] })` → obtain RUID
2. Use the slot mapping table in the `msw-avatar` skill to assign the RUID to the correct `Custom*Equip` property
3. Edit `./Global/DefaultPlayer.model` or the relevant `.map` file → `maker_refresh_workspace`

### Inspecting avatar item details
1. `searchAvatarItems("...")` → search for a costume item and get its RUID
2. `getResource(ruid)` → inspect color_hex / group meta / variants
