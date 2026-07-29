# MSW `.material` Files — Shader Effects via MCP-Driven Lookup

A `.material` file is the asset that decides **how** a renderer draws its sprite (outline, blur, color mod, screen post-process, …). The visual effect itself is encoded in the **shader**; the material is the configured instance of that shader.

This reference is intentionally short. **The full shader catalog, per-shader property names, default values, and component compatibility are not memorized here** — they live in the live docs and must be retrieved each session through the `mlua_Document_Retriever` / `mlua_API_Retriever` MCP tools (the `msw-guide-mcp` server, identifier `user-msw-guide-mcp`).

> **Visual polish gate.** Whenever the user asks for "shader effect", "outline", "glow", "blur", "rainbow", "vignette", "pixelate", "color flash", "post-process", "screen filter", "hit flash", "material", or any rendering effect on top of a sprite — read this file **first**, then drive the answer from MCP lookups, not from memory.

---

## 0. When to Read This File — **MUST**

If **any** of the following triggers fires, read this file in full before proposing a plan:

- The user says "shader", "material", "outline", "glow", "blur", "pixelate", "rainbow", "color flash", "tint", "grayscale", "vignette", "screen filter", "lens distortion", "wave", "ripple", "distortion", "dissolve", "additive", "blend mode", "hologram", "mask", "stencil", "post-process".
- The user wants a visual effect that is **not** a particle, **not** a separate sprite swap, and **not** an animation clip — i.e. an effect baked onto an existing renderer.
- You need to set / change a `MaterialId` on any renderer component.
- A script needs to call `ChangeMaterial(...)` or `_MaterialService:ChangeMaterialProperty(...)`.
- You will create, edit, or delete a `*.material` file under `RootDesk/MyDesk/`.

---

## 1. Core Concepts (Memorize Only This)

| Concept | Meaning |
|---|---|
| **Material** | An asset (`.material`) that pairs **one shader** with the values of that shader's properties. Each material is identified by its `EntryKey` (`material://<uuid>`). |
| **Shader** | The rendering code/effect. Shader **type is fixed per material** — to switch effects you swap the material, not the shader inside it. |
| **Renderer component** | The component that actually draws something (Sprite / Polygon / Line / RawImage / Avatar / WebSprite / Camera). It exposes a **`MaterialId`** (lowercase `d`, `Sync`) string property and a `ChangeMaterial(materialId)` runtime method. |
| **Entry ID** | The UUID portion of the material's `EntryKey`. **Runtime APIs (`renderer:ChangeMaterial(...)`, `_MaterialService:ChangeMaterialProperty(...)`) take the bare `<EntryId>` UUID — no `material://` prefix.** `_EntryService:GetMaterialIdByName(name)` returns the bare UUID, so pass its return value directly without re-wrapping. The `"material://<EntryId>"` URL form is only for **static asset fields** (the `.material` file's own `EntryKey`, and the `MaterialId` field that Maker writes into `.model` / `.map` files). |
| **Shader category** | A logical grouping of shaders (e.g. `Outline`, `ColorEffect`, `Blurry`, `UVEffect`, `BlendColor`, `Screen`, `AlphaMask`, `AlphaBlend`, `PolygonRenderer`, `LineRenderer`). Some categories are **component-restricted** (e.g. `Screen` is `CameraComponent` only). |

Three operational rules that follow from the above:

1. **The shader code is static. Only its property values are dynamic.** To change the *kind* of effect at runtime you must swap the entire material via `ChangeMaterial(...)`. To merely tween an effect's strength/color/center, edit properties via `_MaterialService:ChangeMaterialProperty(...)`.
2. **`_MaterialService:ChangeMaterialProperty` is shared state.** It mutates the material asset itself, so **every** entity referencing that `EntryId` sees the change. If two instances need different live values, author two distinct `.material` files.
3. **`_MaterialService:ChangeMaterialProperty` is `ClientOnly`.** Server scripts cannot mutate material properties. For server-driven effects, send an RPC and let the client call `ChangeMaterialProperty`.

---

## 2. MCP-Driven Lookup — **the only sustainable way to use shaders**

Do **not** memorize shader names, property names, default values, or compatibility tables. There are 60+ shaders across 10+ categories and each has its own property set; this churn does not fit in a single reference file. Always **fish, don't archive**.

> ⚠️ **Reality check on what MCP can give you.** `mlua_Document_Retriever` reliably returns the **shader category list** and the **member shader names + 1-line descriptions** (the `Designing Materials → Shader Type` chapter). For many shaders it does **not** return the per-property name list — only a handful (e.g. `Hologram`, `Rainbow`, `Pixel`) are documented in retrievable examples. For the rest, fall back to §3.3 path (let Maker generate the material once and read its file).

### 2.1 Which MCP tool to use

| Tool | Use for | Typical phrasing |
|---|---|---|
| **`mlua_Document_Retriever`** | Concepts, recipes, full shader catalog by category, "how do I make X effect?", step-by-step authoring guides, examples that combine multiple systems. | Natural-language sentences. Mention **what effect you want**, not just the shader name. |
| **`mlua_API_Retriever`** | Exact API: class/component/service properties, method signatures, parameter types, ClientOnly/ServerOnly annotations. | **Single API symbol** or short symbol list. E.g. `"SpriteRendererComponent"`, `"MaterialService"`, `"EntryService GetMaterialIdByName"`. |

Server identifier in MCP calls: **`user-msw-guide-mcp`**.

### 2.2 Effective query patterns (copy these, adapt the keyword)

**Finding which shader fits an effect** → `mlua_Document_Retriever`:

```
"Shader types in MapleStory Worlds list - Outline, ColorEffect, Blurry, UVEffect, BlendColor, AlphaMask, AlphaBlend, Screen, PolygonRenderer, LineRenderer categories and their member shaders"
```

```
"How to make a sprite glow / outline / pixelate / shake / dissolve / flash in MSW with material shader"
```

**Finding the exact property names of one shader** → `mlua_Document_Retriever`:

```
"Designing Materials Shader Type <CategoryName> property list and meaning"
```

(e.g. replace `<CategoryName>` with `Blurry`, `Outline`, `ColorEffect`, `UVEffect`, `BlendColor`, `Screen`, `AlphaMask`, `AlphaBlend`.)

**Finding which components accept a material** → `mlua_API_Retriever`:

```
"<ComponentName>"
```

(e.g. `"SpriteRendererComponent"`, `"PolygonRendererComponent"`, `"LineRendererComponent"`, `"RawImageRendererComponent"`, `"RawImageGUIRendererComponent"`, `"PolygonGUIRendererComponent"`, `"WebSpriteComponent"`, `"AvatarRendererComponent"`, `"CameraComponent"`.) Look for the `MaterialId` property (lowercase `d`, `Sync`) and the `ChangeMaterial(string materialId)` method.

**Finding the runtime API** → `mlua_API_Retriever`:

```
"MaterialService ChangeMaterialProperty"
"EntryService GetMaterialIdByName"
```

### 2.3 When a query returns nothing

- A bare keyword like `"Shader"` often returns **0 results**. Expand into a sentence with context (effect goal + component + words like "material", "shader type", "MSW").
- If `mlua_API_Retriever` misses, try `mlua_Document_Retriever` with `"Implementing Materials"` or `"Designing Materials"` (the canonical guide titles).
- If a shader name is unknown, ask `mlua_Document_Retriever` for the **category** ("Shader types ColorEffect chapter list") and pick the entry whose `Description` matches the goal — then re-query for that specific shader's properties.

### 2.4 The 30-second pre-authoring loop (do this every time)

1. `mlua_Document_Retriever`: "*Which shader category covers <user's goal>?*" → pick the category.
2. `mlua_Document_Retriever`: "*Shader Type <Category>*" → pick the exact shader name + read its 1-line description.
3. `mlua_Document_Retriever`: "*Material Property Control example with <ShaderName>*" or read the matching `Designing Materials` chapter to learn the **property names + default value ranges**.
4. (If scripting) `mlua_API_Retriever`: `"<RendererComponent>"` + `"MaterialService ChangeMaterialProperty"` to confirm signatures.
5. Author the `.material` and wire it.

---

## 3. `.material` File Anatomy

`.material` is a plain JSON asset under `RootDesk/MyDesk/Materials/` (create the folder once; Maker Refresh generates folder metadata). It is **not** a builder-only file like `.model`/`.ui` — direct authoring is fine, but the recommended path is "let Maker generate the skeleton once, then edit".

### 3.1 Skeleton (always present, do not invent values for these)

```json
{
  "Id": "",
  "GameId": "",
  "EntryKey": "material://<uuid>",
  "ContentType": "x-mod/material",
  "Content": "",
  "Usage": 0,
  "UsePublish": 1,
  "UseService": 0,
  "CoreVersion": "26.7.0.0",
  "StudioVersion": "0.1.0.0",
  "DynamicLoading": 0,
  "ContentProto": {
    "Use": "Json",
    "Json": {
      "name": "<MaterialName>",
      "id": "<uuid>",
      "shadertype": "<ShaderName>",
      "IsUIMaterial": false,
      "RequiresUIStencilStateChange": false
      // ... shader-specific properties below ...
    }
  }
}
```

Invariants:

- `EntryKey` is `"material://" + <uuid>` and the `<uuid>` **must match** `ContentProto.Json.id`. If they drift, scripts that lookup by `EntryKey` will silently miss.
- `ContentType` is always `"x-mod/material"`. `CoreVersion` must equal the project CoreVersion (`26.7.0.0`).
- `Id` / `GameId` / `Content` are populated by Maker; leave them empty on hand-authored files and let `refresh` finalize.
- `ContentProto.Json.shadertype` is the **shader name** (e.g. `"Hologram"`, `"InnerOutline"`, `"Rainbow"`, `"Pixel"`, `"Vignette"`) — **not** the category name.
- `IsUIMaterial` / `RequiresUIStencilStateChange` are always present; set `IsUIMaterial=true` only if the material is being applied to UI renderer components (`RawImageGUIRendererComponent`, `PolygonGUIRendererComponent`, …).

### 3.2 Shader-specific properties (this is where MCP lookup lives)

Every entry below `shadertype` is **shader-defined**. Example for `Hologram`:

```json
"shadertype": "Hologram",
"Blend": 0.5,
"ChangeAmount": 0.3,
"HologramColor": { "r": 0.0, "g": 1.0, "b": 0.0, "a": 1.0 },
"LitMode": 0,
"MaxAlpha": 0.75,
"MinAlpha": 0.1,
"Rotate": 0.0,
"TimeOffset": 0.0,
"TimeScale": 1.0,
"UnchangeAmount": 0.2
```

A different shader has a completely different property set. **Never guess these.** Per shader you must:

1. Call `mlua_Document_Retriever` with: `"Designing Materials Shader Type <Category> <ShaderName> properties"`. **Often returns only the category-level shader list, not per-property names.** Confirmed exposed: `Hologram` (Blend / ChangeAmount / HologramColor / LitMode / MaxAlpha / MinAlpha / Rotate / TimeOffset / TimeScale / UnchangeAmount), `Rainbow` (Blend / Rotate / Spread / TimeOffset / TimeScale), `Pixel` (PixelateSize). For other shaders the property list is generally **not** retrievable.
2. If MCP doesn't give the property names, use the **recommended authoring path** below — let Maker create a sample `.material` with that shader once, then read its file.

> 🔴 **Critical:** writing only `shadertype` plus the §3.1 skeleton is **not enough for a visible effect**. Maker's `refresh` does NOT inject shader-specific property defaults into hand-authored files. With property values missing/zero, most shaders render as Default (or with a 0-strength effect, which looks unchanged). You must either (a) fill in the property values yourself from confirmed lists, or (b) author the material in Maker first and copy its filled defaults into the canonical file.

### 3.3 Recommended authoring path

**This is the default path for any shader whose property names are not in the confirmed list in §3.2.** Hand-authoring skeleton-only files for unfamiliar shaders silently fails (no visible effect).

1. Ask the user (or decide via MCP) which **shader category + shader name** matches the goal.
2. **First-time use of that shader:** ask the user to create one throwaway `.material` with that shader in Maker (Workspace `[+]` → Material → set Shader in Property Editor), then `refresh`. Read the generated file — its property defaults are the source of truth and the only reliable way to get the full property name set.
3. Save the canonical version under `RootDesk/MyDesk/Materials/<Name>.material` (copy the Maker-generated property block verbatim), tweak property values as needed (still as a plain JSON edit), then `refresh`.
4. **For repeated use of the same shader**, keep a reference template in the project so future AI sessions can copy from a known-good file.

> Folder rule: materials live under `RootDesk/MyDesk/Materials/` (create the folder if missing). Never place them directly under `MyDesk/`, under `Global/`, or alongside `.model` / `.map` files.

---

## 4. Applying a Material to a Renderer Component

This is the bridge from "material asset exists" to "entity shows the effect".

### 4.1 Renderer components that accept a material

These all expose a `MaterialId` string property **and** a `void ChangeMaterial(string materialId)` method:

- World renderers: `SpriteRendererComponent`, `WebSpriteComponent`, `AvatarRendererComponent`, `PolygonRendererComponent`, `LineRendererComponent`, `RawImageRendererComponent`
- UI renderers: `RawImageGUIRendererComponent`, `PolygonGUIRendererComponent` (+ other GUI renderers — confirm per component via `mlua_API_Retriever`)
- Special: `CameraComponent` (only **Screen** category shaders — `Vignette`, `LensDistortion` — apply meaningfully to the camera, as a full-screen post-process)

> The full per-component support matrix changes with engine updates. **Always confirm by calling `mlua_API_Retriever` with the component name** before claiming "X component supports material Y". Some renderers restrict which shader categories work.

### 4.2 Setting `MaterialId` statically — three places

Pick the place that matches *where* the material assignment should live for the entity:

1. **On a `.model` file (canonical)** — the right choice when the same entity composition appears more than once. Use `ModelBuilder` (see [model.md](model.md)):

   ```javascript
   b.component("SpriteRendererComponent")
     .value("SpriteRendererComponent", "MaterialId", "material://<EntryId>", "string");
   ```

   The value goes in as a plain `string` typeKey, exactly like `SpriteRUID`. Do **not** wrap it in `dataRef()`.

2. **Inline on a `.map` entity** — for genuinely one-off scene entities. Use `MapBuilder` (see [builder-protocol-map.md §1](builder-protocol-map.md); domain context in [`entity.md`](entity.md)) to set the same `MaterialId` value on the entity's `SpriteRendererComponent`.

3. **In the Maker editor** — Property Editor → renderer component → `MaterialId` field → pick from Reference window. Use this only when the user is iterating live and you have no automation route.

The value format is identical in all three places: the **`material://<EntryId>`** URL (some component variants accept just the bare `<EntryId>` as well — when in doubt, use the `material://` form).

### 4.3 Swapping the material at runtime

Use `ChangeMaterial(materialId)` on the renderer component. **The argument is the bare `<EntryId>` UUID — do not add a `material://` prefix.**

> ⚠️ **Common mistake.** Wrapping the value as `"material://" .. entryId` causes the lookup to fail (the renderer does not strip the prefix). Pass the raw UUID string only.

```lua
property string outlineMatId = ""

-- Resolve once (e.g. in OnBeginPlay) so you don't pay name lookup per call
self.outlineMatId = _EntryService:GetMaterialIdByName("Outline_Red")
-- self.outlineMatId is the bare "<uuid>" — pass it straight through

-- Swap when something happens
self.Entity.SpriteRendererComponent:ChangeMaterial(self.outlineMatId)
```

If you already know the literal `EntryId` (copied via Maker → context menu → Copy Entry ID), pass it directly as a bare string:

```lua
self.Entity.SpriteRendererComponent:ChangeMaterial("b97f4743-af7a-44a7-8b7b-388628534910")
```

To **remove** the effect, swap to a `Default` shader material (author one once and reuse), or to a known "neutral" material. There is no documented "clear material" API — keep a `Default.material` around for resets.

### 4.4 Tweaking a property in real time

Use `_MaterialService:ChangeMaterialProperty(entryId, { [PropertyName] = value })`. **ClientOnly**, **shared across all entities using that material**. Like `ChangeMaterial`, the `entryId` argument is the **bare UUID** — no `material://` prefix.

```lua
property string materialEntryId = ""

@ExecSpace("ClientOnly")
method void OnBeginPlay()
    self.materialEntryId = _EntryService:GetMaterialIdByName("HologramAura")  -- bare "<uuid>"
end

@ExecSpace("ClientOnly")
method void OnUpdate(number delta)
    _MaterialService:ChangeMaterialProperty(self.materialEntryId, {
        ["TimeScale"] = 2.0,
        ["MinAlpha"] = 0.3
    })
end
```

Two important consequences:

- **Per-instance unique values are not possible with one material.** If two enemies need *different* outline thicknesses, create two materials. The "live property" channel is global to the asset.
- **Property names are case-sensitive and shader-specific.** A `Hologram` material exposes `TimeScale`/`MinAlpha`/`HologramColor` etc.; an `Outline` material exposes a different set. Always confirm names via `mlua_Document_Retriever` against the matching `Designing Materials → Shader Type → <Category>` chapter, or by inspecting a Maker-generated `.material` file.

### 4.5 CameraComponent (Screen shaders, full-screen post-process)

Screen-category shaders (`Vignette`, `LensDistortion`) only do anything when assigned to the **active** `CameraComponent`'s material slot. Applying them to a `SpriteRendererComponent` is silently a no-op. When you want a "whole screen tints / pulses / distorts" effect:

1. Locate the player's active `CameraComponent` (typically on `DefaultPlayer`).
2. Assign a Screen-shader material to its material slot (component property is `MaterialId` — confirm exact spelling via `mlua_API_Retriever "CameraComponent"`).
3. Drive properties via `_MaterialService:ChangeMaterialProperty(...)` from client scripts.

### 4.6 Polygon / Line renderers (sprite-tiling shaders)

`PolygonRendererComponent` + `PolygonSprite` shader, and `LineRendererComponent` + `SpritePattern` shader, both **tile a sprite across a geometric primitive**. Two gotchas:

- The sprite (user upload or cloned MSW resource) **must have its lab mode set to `Repeat`**, otherwise the tile boundary breaks.
- These shaders are **not interchangeable with `SpriteRendererComponent`**. The Shader Picker in Maker filters this automatically; via scripts/JSON you must match shader category to renderer.

---

## 5. Shader Catalog — Category Index Only

The exhaustive shader-by-shader list is **not** copied here on purpose (it changes; copying it bloats this file and creates drift). What you need to remember is the **categories** so you can route an MCP query correctly:

| Category | Typical use | Component restriction |
|---|---|---|
| `Default` | "No effect" baseline | any renderer |
| `Outline` | Contour lines around / inside sprite | sprite-like renderers |
| `ColorEffect` | Colorize, gradient, gray, rainbow, hologram, dropshadow, posterize, concentration line | sprite-like renderers |
| `Blurry` | Blur, pixelate, chromatic aberration, motion blur, radial blur, watercolor | sprite-like renderers |
| `AlphaMask` | Cutoff, clip, custom mask texture | sprite-like renderers |
| `AlphaBlend` | Additive / soft-additive transparency for FX layers | sprite-like renderers |
| `UVEffect` | Noise, wave, ripple, glitch, scroll, grass-sway, distortion | sprite-like renderers |
| `BlendColor` | Photoshop-style blend modes (Multiply, Screen, Overlay, …) | sprite-like renderers |
| `Screen` | Full-screen post-process (Vignette, LensDistortion) | **`CameraComponent` only** |
| `PolygonRenderer` | Tile a sprite across a polygon (`PolygonSprite`) | **`PolygonRendererComponent` only** |
| `LineRenderer` | Tile a sprite across a line (`SpritePattern`) | **`LineRendererComponent` only** |

For the **shader names inside each category** and their **property lists** → call `mlua_Document_Retriever` with `"Designing Materials Shader Type <Category>"`.

---

## 6. End-to-End Recipe (template you can adapt)

Goal: monster flashes a red outline when hit.

1. **Decide effect → category** → `Outline` category, `InnerOutline` shader (or `Outline` shader). Confirm via `mlua_Document_Retriever`: "Shader Type Outline list".
2. **Get the property set** for `InnerOutline` from `mlua_Document_Retriever`: "Designing Materials Shader Type Outline InnerOutline properties". (Or generate a sample `.material` in Maker once and copy its defaults.)
3. **Author `RootDesk/MyDesk/Materials/InnerOutline_Red.material`** using the skeleton in §3.1 with `shadertype: "InnerOutline"` plus the outline color/thickness properties from step 2.
4. **Refresh** so Maker registers the new entry.
5. **Set the monster's default material** on its `.model` via `ModelBuilder` (§4.2): `SpriteRendererComponent.MaterialId = "material://<EntryId of InnerOutline_Red>"`. Or, if you don't want the outline by default, leave the model's `MaterialId` unset/`Default` and swap at hit time only.
6. **Hit script (client side)** — on `OnHit` (or via an RPC from server `OnHit`):

   ```lua
   property any outlineId = nil
   property any defaultId = nil

   -- GetMaterialIdByName returns the bare "<uuid>" — pass it to ChangeMaterial as-is, no "material://" prefix
   self.outlineId = self.outlineId or _EntryService:GetMaterialIdByName("InnerOutline_Red")
   self.defaultId = self.defaultId or _EntryService:GetMaterialIdByName("Default_Material")
   self.Entity.SpriteRendererComponent:ChangeMaterial(self.outlineId)
   _TimerService:SetTimerOnce(function()
     self.Entity.SpriteRendererComponent:ChangeMaterial(self.defaultId)
   end, 0.15)
   ```

7. **Verify in play mode** and check `logs` for `LEA-` errors.

---

## 7. Pitfalls

| Symptom | Likely cause | Fix |
|---|---|---|
| Material assigned but no visible effect | Wrong renderer for that shader category (e.g. `Screen` shader on a `SpriteRendererComponent`, or `PolygonSprite` on a sprite) | Re-check the component restriction in §5; re-query `mlua_API_Retriever` for the component to confirm what it supports. |
| Effect works in editor but disappears at runtime | `_MaterialService:ChangeMaterialProperty` was called from a **server** script | Move the call to a `[client only]` method or RPC the event to clients. |
| All instances of the monster suddenly change at once | `ChangeMaterialProperty` mutates the **asset**, not the instance | Author separate `.material` files per intended live-value group. |
| `EntryKey` lookup misses ("material not found") | `EntryKey`'s UUID and `ContentProto.Json.id` are out of sync, or the file was not `refresh`-ed | Make the two UUIDs match; `refresh` Maker. |
| Polygon/Line shader shows broken seams | Sprite resource lab mode is not `Repeat` | Re-import the sprite with `Repeat` lab mode. |
| Camera Screen shader does nothing | Material assigned to non-active camera, or to a sprite renderer | Assign to the active `CameraComponent`'s material slot. |
| Want to switch *effect* not value, but `ChangeMaterialProperty` doesn't help | Shader type is fixed per material | Use `ChangeMaterial(materialId)` to swap the whole material. |
| `ChangeMaterial(...)` silently does nothing / "material not found" at runtime | Passed `"material://" .. entryId` instead of the bare UUID | Pass the **bare `<EntryId>` UUID** directly — `_EntryService:GetMaterialIdByName(name)` already returns it in that form. The `material://` URL form is only used in static asset fields (the `.material` file's own `EntryKey`, and the `MaterialId` field in `.model` / `.map` JSON), never in `ChangeMaterial` / `ChangeMaterialProperty`. |
| Material is applied (no error) but renders identically to Default | Hand-authored skeleton has `shadertype` set but the shader-specific properties are missing/zero; `refresh` does not fill them in | Create the same-shader material once in Maker so it generates the full property set, then copy that property block into the canonical `.material` file. |

---

## 8. Checklist

- [ ] Read this file in full (triggered by §0).
- [ ] Confirmed the shader category + name via `mlua_Document_Retriever` (not memory).
- [ ] Confirmed property names + types via `mlua_Document_Retriever` (or a Maker-generated `.material` sample).
- [ ] Confirmed the renderer component accepts that shader category via `mlua_API_Retriever`.
- [ ] `.material` saved under `RootDesk/MyDesk/Materials/<Name>.material` with the §3.1 skeleton, matching `EntryKey` UUID and `ContentProto.Json.id`, correct `CoreVersion`.
- [ ] `MaterialId` wired on the target renderer through `ModelBuilder` (§4.2) for canonical entities or via `MapBuilder` for one-off placements — not by hand-editing `.model` JSON.
- [ ] Runtime swaps go through `renderer:ChangeMaterial(entryId)` where `entryId = _EntryService:GetMaterialIdByName(name)` (bare UUID — **never** wrap it as `"material://" .. entryId`).
- [ ] Property tweens go through `_MaterialService:ChangeMaterialProperty(entryId, {...})` from `[client only]` code, using the same bare UUID.
- [ ] Per-instance unique live values? → multiple materials, not one shared.
- [ ] Called Maker `refresh` after authoring the file and after any model/map mutation.

---

## 9. Related Docs

| Doc | Why |
|---|---|
| [model.md](model.md) | Setting `MaterialId` as a `.model` value via `ModelBuilder` (§4.2). |
| [builder-protocol-map.md §1](builder-protocol-map.md) | MapBuilder call protocol for patching `MaterialId` on inline `.map` entities (domain context in [entity.md](entity.md)) |
| [platform.md](platform.md) | `SortingLayer` / `OrderInLayer` / `SpriteRUID` — separate from materials but often involved when the material "doesn't seem to show". |
| `msw-scripting` skill | Authoring the `.mlua` that calls `ChangeMaterial` / `ChangeMaterialProperty`. Read [`msw-scripting/SKILL.md`](../../msw-scripting/SKILL.md) + [`verify-checklist.md`](../../msw-scripting/references/verify-checklist.md) before writing any `.mlua`. |
| `msw-search` skill | Finding sprite RUIDs that pair with the material (e.g. the base sprite under an outline). |
| `msw-ui-system` skill | Applying materials to UI renderers (`RawImageGUIRendererComponent`, `PolygonGUIRendererComponent`) — UI work always routes through this skill first. |

**MCP servers used by this reference**

- `user-msw-guide-mcp` → `mlua_Document_Retriever` (concepts, shader catalog, recipes), `mlua_API_Retriever` (component & service signatures). Treat these as the source of truth for all shader-specific detail every time.
