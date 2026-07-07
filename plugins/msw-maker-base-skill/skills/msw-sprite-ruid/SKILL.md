---
name: msw-sprite-ruid
description: "SpriteRendererComponent.SpriteRUID (world) and SpriteGUIRendererComponent.ImageRUID (UI) — native RUID type support (sprite / animationclip direct playback), thumbnail:// prefix for rendering avataritem / skeleton / animationclip as static thumbnail image, avatar item icon in inventory / shop / UI slot. Use when: assigning any RUID to a sprite renderer component, displaying an avatar item or resource as a thumbnail or icon, using animationclip directly in a renderer, rendering inventory item icons, displaying a thumbnail image in a world entity. Keywords: SpriteRUID, ImageRUID, thumbnail://, animationclip, RUID apply, RUID assign, thumbnail, item icon, sprite RUID, RUID to renderer"
---

# MSW Sprite RUID

Rules for assigning a RUID to `SpriteRendererComponent.SpriteRUID` (world) or
`SpriteGUIRendererComponent.ImageRUID` (UI).

---

## Native type support

Both components accept a `sprite` or `animationclip` RUID directly — no extra
animator component required.

| Component | Property | Value form (runtime `.mlua`) | Native RUID types |
|---|---|---|---|
| `SpriteRendererComponent` (world) | `SpriteRUID` | plain string | `sprite`, `animationclip` |
| `SpriteGUIRendererComponent` (UI) | `ImageRUID` | `DataRef("...")` | `sprite`, `animationclip` |

`ImageRUID` is a `DataRef`: in runtime `.mlua`, assign `DataRef(ruid)`.
Use `{ DataId: ruid }` only in `.ui` / `.model` JSON or builder patch data.
`SpriteRUID` remains a plain string.

```lua
-- World: sprite or animationclip RUID both work
self.Entity.SpriteRendererComponent.SpriteRUID = ruid

-- UI: sprite or animationclip RUID both work
self.Entity.SpriteGUIRendererComponent.ImageRUID = DataRef(ruid)
```

A `skeleton` / `avataritem` RUID assigned without the `thumbnail://` prefix
**fails silently** (no error, nothing renders).

---

## animationclip: single animation vs multi-state

- **Single looping animation** (background deco, idle effect, prop): set `SpriteRUID`
  or `ImageRUID` directly to the `animationclip` RUID.
- **Multi-state** (stand / move / attack / hit / die): use `StateAnimationComponent`
  \+ `ActionSheet`. See [`msw-general/references/monster.md`](../msw-general/references/monster.md).

---

## `thumbnail://` prefix — static thumbnail from any resource

Prepend `thumbnail://` to `SpriteRUID` or `ImageRUID` to render a **static
thumbnail image** from any resource — useful for icons, preview images, and item
thumbnails.

    thumbnail://<32-char hex RUID>

Accepted types: `sprite` · `animationclip` · `skeleton` · `avataritem`

```lua
-- World thumbnail (any resource type)
self.Entity.SpriteRendererComponent.SpriteRUID = "thumbnail://" .. anyRuid

-- UI thumbnail (any resource type)
self.Entity.SpriteGUIRendererComponent.ImageRUID = DataRef("thumbnail://" .. anyRuid)
```

### Primary use case: avataritem icons

`avataritem` RUIDs cannot render without `thumbnail://`. With the prefix they
become item icons for inventory slots, shop listings, and equip previews.

```lua
slotEntity.SpriteGUIRendererComponent.ImageRUID = DataRef("thumbnail://" .. avatarItemRuid)
```

Search avatar item RUIDs with the `msw-search` skill (`searchAvatarItems`).

---

## Common pitfalls

- `skeleton` / `avataritem` directly into `SpriteRUID` / `ImageRUID` without prefix → silently invisible.
- `thumbnail://` = **static** image only. For live animation, assign the `animationclip` RUID directly (no prefix).
- Runtime `.mlua` uses `ImageRUID = DataRef("...")`; the `{ "DataId": "..." }` object form is `.ui` / `.model` JSON only (the prefix goes **inside** `DataId`, not a separate field). Do not use the table form in runtime code — the LSP rejects it as a `DataRef` type mismatch.
- `CostumeManagerComponent.Custom*Equip`, `StateAnimationComponent.ActionSheet`, and `SkeletonRendererComponent.SkeletonRUID` do **not** accept `thumbnail://`.
- Do **not** prepend `thumbnail://` to a RUID that was already retrieved *as* a thumbnail or icon image from `msw-search`. The prefix converts a source resource into its thumbnail — applying it to an already-thumbnail sprite is logically redundant. If the search query targeted an icon / thumbnail image and returned a `sprite` RUID, assign that RUID directly without any prefix.
- To **search** for RUIDs use the `msw-search` skill — `searchAvatarItems` for avatar items; `searchResources` for everything else.
