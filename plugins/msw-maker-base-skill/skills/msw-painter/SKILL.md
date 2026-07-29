---
name: msw-painter
description: "When msw-search cannot find a suitable sprite RUID, draw a pixel art sprite directly with SVG / HTML5 Canvas / HTML code, render it to PNG, and upload it via the msw-mcp asset upload tool to obtain a sprite RUID (if no upload tool is connected, guide the user to register it through Maker). Two style modes are supported: chunky pixel (retro / icon / tile feel) and maple cartoon (MapleStory-inspired character / NPC feel). Triggers: draw sprite directly, create sprite, image generation, custom graphic, pixel art, cartoon sprite, maple style, chibi character, painter, draw a sprite, make an icon, create NPC image directly, draw a slime, custom sprite."
---

# MSW Painter

A workflow for registering a hand-drawn pixel art sprite as a sprite resource. **Call `msw-search` first, and only invoke this skill when no suitable RUID is found.**

This skill is dedicated to the sprite category. It does not handle animation / audio / avatar / atlas.

The painter supports two pixel art **styles**: **chunky pixel** (retro, icon/tile feel) and **maple cartoon** (MapleStory-inspired, character/NPC feel). Pick one before writing code — see step 2 below.

---

## When to invoke

| Situation | Action |
|-----------|--------|
| User wants a specific sprite | First use `msw-search` (Resource search section, sprite category) |
| `msw-search` returns an RUID that matches the intent | Use that RUID directly. **Do not invoke painter.** |
| No search results, or all results are unsuitable | Invoke painter → create directly |
| User explicitly says "I need a hand-drawn looking character/icon" | Invoke painter directly |

---

## Workflow

1. **Choose the medium** — One of SVG / Canvas / HTML. See "Choosing the medium" below.
2. **Choose the style** — `chunky` or `maple`. See "Choosing the style" below.
3. **Decide the size** — See [references/size-guide.md](references/size-guide.md). Default is 128×128.
4. **Write the code** — Follow the rules for the chosen style:
   - `chunky` → [references/style-chunky-pixel.md](references/style-chunky-pixel.md)
   - `maple` → [references/style-maple-cartoon.md](references/style-maple-cartoon.md)
5. **Render to PNG** — Run `scripts/render.cjs`.
6. **Upload the resource** — the msw-mcp asset upload tool, two-step presigned pattern (§5). If the connected MCP has no upload tool, ask the user to register the PNG through Maker.
7. **Register sprite properties** — `asset_update_resource_storage_info` right after upload: `filter_mode` / `wrap_mode` / pivot, plus 9-slice borders for UI frame sprites. See "Step 4" below.
8. **Report the result** — RUID + a 1–2 sentence description (include which style was used). Entity placement / script application is outside the painter's scope.

---

## 1. Choosing the medium

| Medium | Recommended use | Strengths |
|--------|-----------------|-----------|
| **SVG** | Icons, logos, simple characters, shape-based pixel art | Intuitive code, easy to drop 1px `<rect>` dots |
| **Canvas** | Procedural patterns, iterative logic (loop-drawn textures / noise) | Generate complex patterns via JS programming logic |
| **HTML** | Composite layouts that can be styled quickly with CSS | Rarely used — SVG/Canvas is usually a better fit for pixel art |

### Minimal SVG template

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"
     width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
     style="image-rendering: pixelated;">
  <rect x="6" y="2" width="1" height="1" fill="#4A90D9"/>
  <!-- Place dots one by one with 1px rects -->
</svg>
```

> ⚠️ Use `width="100%" height="100%"` (NOT a fixed pixel count). The SVG element draws at its **own** declared size inside the render.cjs viewport — if you hard-code 128 but render at `--width 1024`, the SVG fills only the top-left 128px and the rest of the PNG is transparent. `100%` makes the SVG fill whatever canvas `--width`/`--height` specifies.

### Minimal Canvas template

```javascript
// `c` (canvas element) and `ctx` (2D context) are auto-exposed by render.cjs.
// ctx.imageSmoothingEnabled = false is applied automatically as well.
// IMPORTANT: derive scale from c.width, not a hard-coded constant — otherwise
// a different --width leaves the bottom-right of the canvas blank.
const GRID = 16;
const scale = c.width / GRID;  // 16×16 logical grid → canvas-sized output
ctx.fillStyle = '#4A90D9';
ctx.fillRect(6 * scale, 2 * scale, scale, scale);
```

### Minimal HTML template

```html
<!doctype html>
<html><body style="margin:0; image-rendering: pixelated;">
  <!-- Anything you like -->
</body></html>
```

---

## 2. Choosing the style

| Style | Recommended use | Look & feel | Logical grid | Outline | Shading |
|-------|-----------------|-------------|--------------|---------|---------|
| **`chunky`** | Icons, buttons, tiles, blocks, simple props | Retro / 8-bit / NES-SNES | Small (16×16, 32×32) | Black or white, 1px | 2–4 stepped levels, NO AA |
| **`maple`** | Characters, NPCs, monsters, cute mascots | MapleStory / storybook / cartoon | Larger (32×32 ~ 128×128) | **Selout** (darker version of fill color) | 4–6 stepped levels + **selective AA** on silhouette + optional 2×2 dithering |

### Defaults when in doubt

- Icon / button / tile / block → **`chunky`**
- Character / NPC / monster / mascot / "cute" requests / "draw a slime" → **`maple`**
- User says "retro" / "8-bit" / "NES" / "minimal" → **`chunky`**
- User says "MapleStory" / "cute" / "cartoon" / "chibi" / "illustrated" → **`maple`**

Full per-style rules:
- [references/style-chunky-pixel.md](references/style-chunky-pixel.md)
- [references/style-maple-cartoon.md](references/style-maple-cartoon.md)

Both styles share the same forbidden APIs (no curve APIs, no gradient APIs, no fractional coordinates, no `filter: blur`/`drop-shadow`). They differ in palette richness, outline color, AA, and working grid.

---

## 3. Size guide (summary)

| Use | Recommended size |
|-----|------------------|
| Icon / button | 48×48 ~ 64×64 |
| Character / item / NPC / monster | 96×96 ~ 128×128 |
| Tile / floor / block | 64×64 ~ 128×128 |
| Background / large object | 256×256 or larger (only on explicit request) |

The default is **128×128**. For style-specific working-grid tables (chunky uses a small logical grid like 16×16; maple uses a larger one like 64×64) and SD character proportions, see [references/size-guide.md](references/size-guide.md).

> If the requested output is **below 64×64**, the `maple` style does not have enough pixels for selout + AA + facial features — either bump the output size to 64+ or fall back to `chunky`.

---

## 4. PNG render — `render.cjs`

### One-time dependency install

```bash
cd scripts && npm ci
```

This installs `puppeteer` (~200MB including headless Chromium) from the committed `package-lock.json`. It is separate from other base skill dependencies, so run this only the first time you use painter.

> 🔒 Use `npm ci`, **not** `npm install`. `npm ci` installs exactly the versions pinned in `package-lock.json` and fails if the lockfile and `package.json` disagree — this is the supply-chain integrity guarantee for W012. Never edit `package-lock.json` by hand; if you need to bump puppeteer, run `npm install puppeteer@<version>` locally and commit the regenerated lockfile.

### Sandboxing & network isolation

`render.cjs` runs the headless Chromium with the OS sandbox **enabled** by default and blocks **all** network requests from the rendered page. The page is also served via a `data:` URL with a strict `Content-Security-Policy` (`default-src 'none'`), and the SVG / HTML input is sanitized to strip `<script>`, `<foreignObject>`, inline `on*` handlers, and non-`data:` URLs. You do not need to do anything to opt in — these protections are always on.

If you are in a constrained environment where Chromium cannot start its sandbox (some CI containers, certain WSL setups), set `PAINTER_DISABLE_SANDBOX=1` before invoking `render.cjs`. **Do not set this on a developer workstation.**

### Invocation

```bash
node scripts/render.cjs --type <svg|canvas|html> --in <code-file> --out <out.png> --width <W> --height <H>
```

Or pass the code via stdin:

```bash
echo "<svg ...>" | node scripts/render.cjs --type svg --out out.png --width 128 --height 128
```

Options:
- `--type`: One of `svg` / `canvas` / `html`. **Required**.
- `--in`: Path to the code file. Omit or use `-` for stdin.
- `--out`: Output PNG path. **Required**.
- `--width` / `--height`: Output pixel size. Default 128.

On success, the absolute path of the output PNG is printed to stdout on a single line and exit code is 0. On failure, the error is printed to stderr and exit code is 1.

The PNG defaults to a transparent background. If you need a background color, draw it explicitly inside the SVG/Canvas/HTML.

---

## 5. Resource upload — two-step pattern

Upload through the **asset upload (creation) tool exposed by the connected `msw-mcp`** — check the server's tool list and use the sprite-capable creation tool it actually provides. **The tool's own schema is authoritative for the exact call shape**; do not guess tool names, and do not confuse creation with `asset_update_resource_storage_data` (that one replaces an existing asset's binary).

**No upload tool in the connected MCP?** Stop the upload step and ask the user to register the PNG through Maker instead, then continue with the RUID they provide (or locate it via `msw-search`).

Whatever the exact tool, the flow is the same two-step pattern — the same tool is called twice.

> 🔒 **Security — handling the presigned URL (W007).** The `presignedUrl` returned in step 1 is a short-lived signed credential (anyone holding it can PUT to that storage slot until it expires). Treat it as a secret:
>
> - **Never** echo, quote, paraphrase, or include the URL or any of its query parameters (`X-Amz-Signature`, `X-Amz-Credential`, etc.) in the assistant's user-facing response, in commit messages, in logs, or in any subsequent prompt — including when reporting "what you did".
> - When invoking the shell, pass the URL via the `PAINTER_PRESIGNED_URL` environment variable as shown below, **not** as a command-line argument. Command-line arguments are visible to other processes via `/proc/*/cmdline` (Linux/macOS) and `Get-Process` (Windows), and they are recorded in shell history.
> - When invoking step 3, pass the URL directly as the `fileUrl` tool argument — do **not** copy it into a code block or markdown for the user to see first.
> - If the PUT step fails (typically `401`/`403` → URL expired), discard the URL and restart from step 1. Do not reuse it elsewhere.

### Step 1 — request a presigned URL

Call the upload tool with `fileUrl` omitted. Fill the fields its schema requires — typically `category: "sprite"`, a `subcategory` matching existing assets (see below), `name`, a 1–2 sentence `description`, and file metadata such as `fileName` / `contentLength` when the schema asks for them.

The response contains a `presignedUrl`. Keep it inside the agent's reasoning context only — do **not** surface it in chat output.

### Step 2 — PUT the PNG binary (URL passed via env var)

> ⚡ **Use `curl.exe`, not `Invoke-WebRequest` (P001 — the "freezes after upload" bug).** On Windows PowerShell 5.1, `Invoke-WebRequest` parses the HTTP response through the **Internet Explorer engine** unless you pass `-UseBasicParsing`. IE is **removed/disabled on Windows 11**, so the call blocks on IE "first-launch configuration" and appears to freeze for a long time after the bytes are already uploaded (the MCP tool itself returns in ~45 ms — the stall is entirely in this step). `curl.exe` (shipped in `System32` on Windows 10 1803+ and all Windows 11) has no IE dependency and behaves identically in PowerShell and Git Bash, so prefer it in **both** shells.

PowerShell (preferred — `curl.exe`):
```powershell
$env:PAINTER_PRESIGNED_URL = "<presignedUrl from step 1>"
try {
  # Feed url/request/upload-file to curl via a stdin config (-K -) so the URL
  # never lands in argv (visible via Get-Process) or shell history.
  "url = `"$env:PAINTER_PRESIGNED_URL`"`nrequest = `"PUT`"`nupload-file = `"out.png`"" | curl.exe -K -
} finally {
  Remove-Item Env:\PAINTER_PRESIGNED_URL -ErrorAction SilentlyContinue
}
```

bash (Git for Windows / WSL — `curl`):
```bash
# 1) Assign on its OWN statement (export), NOT as an inline prefix.
#    `VAR=… curl … "$VAR"` does NOT work: the shell expands "$VAR" on the
#    same command line BEFORE the assignment takes effect, so curl receives
#    an empty URL and fails with "curl: option : blank argument…".
export PAINTER_PRESIGNED_URL="<presignedUrl from step 1>"
# 2) Feed the URL to curl via a config file read from stdin (-K -). Passing it
#    as a normal argument (curl … "$PAINTER_PRESIGNED_URL") would expand the URL
#    straight into argv, where it is visible via `ps` / /proc/<pid>/cmdline —
#    -K - keeps it out of the argument list entirely.
printf 'url = "%s"\nrequest = "PUT"\nupload-file = "out.png"\n' "$PAINTER_PRESIGNED_URL" | curl -K -
unset PAINTER_PRESIGNED_URL
```

The PUT itself is a plain binary upload — no auth headers are needed (the signature is embedded in the presigned URL). The `-K -` (stdin config) form keeps the URL out of `ps` / `Get-Process` argument lists and shell history in both shells.

**Fallback only — `Invoke-WebRequest`.** If `curl.exe` is genuinely unavailable, you MUST add `-UseBasicParsing` (skips the IE engine → no freeze) and silence the progress bar (a separate PS 5.1 bug that slows transfers by 10–50×):
```powershell
$env:PAINTER_PRESIGNED_URL = "<presignedUrl from step 1>"
$ProgressPreference = 'SilentlyContinue'
try {
  Invoke-WebRequest -Method PUT -InFile out.png -Uri $env:PAINTER_PRESIGNED_URL `
    -ContentType "image/png" -UseBasicParsing
} finally {
  Remove-Item Env:\PAINTER_PRESIGNED_URL -ErrorAction SilentlyContinue
}
```

### Step 3 — report upload completion

Call the **same tool again with the same arguments**, adding `fileUrl` set to the presigned URL from step 1 (pass it directly as the tool argument — do not echo it into chat or code blocks).

The response contains the sprite **RUID**. That is the final deliverable. After this call returns, treat the URL as fully consumed — do not retain it.

### Step 4 — register sprite properties

The creation tool does not accept `properties` — after step 3 returns the RUID, immediately call `mcp__msw-mcp__asset_update_resource_storage_info` with the asset's `guid`. Property entries are lowercase `{ "key": "...", "value": "..." }` with **string** values (resource *responses* show `Properties: [{ "Key", "Value" }]` — do not mirror that casing in the input).

| Key | Value | Meaning |
|---|---|---|
| `pivot_x` / `pivot_y` | numeric string | Sprite pivot |
| `border_left` / `border_right` / `border_top` / `border_bottom` | numeric string | 9-slice border in px |
| `filter_mode` | `Point` / `Bilinear` / `Trilinear` | Texture filtering |
| `wrap_mode` | `Repeat` / `Clamp` / `Mirror` / `MirrorOnce` | Texture wrap |

Painter defaults: `filter_mode=Point` (Bilinear smears chunky/maple pixel edges), `wrap_mode=Clamp`, `pivot_x=0.5`; `pivot_y=0.5` for icons / UI panels, `pivot_y=0.0` for characters and props standing on the ground (adjust only if visual verification shows foot drift). Set nonzero `border_*` only when the sprite is a 9-slice UI frame (button / panel / gauge) — the `.ui` side additionally needs `SpriteGUIRendererComponent.Type = Sliced(1)` (see [component-api.md](../msw-ui-system/references/component-api.md) §"SpriteGUIRenderer — ImageType Selection"). Never invent property keys or enum values beyond this table. If the connected MCP's tool list has no `asset_update_resource_storage_info`, report the intended property values to the user instead of calling a different tool.

### Choosing a subcategory

First inspect the subcategory distribution of existing sprites with `asset_search_resources` or `asset_list_account_resources` and match it. When in doubt, fall back to a generic value such as `object` / `etc`.

---

## 6. Report format

When the painter task is done, hand the user only this:

```
RUID: <received RUID>
Style: <chunky | maple>
<1–2 sentence description: what you drew, at what size, and what sprite it was registered as>
```

Entity creation/movement/spawn, script authoring, and UI editing are outside the painter's scope. Handle those in another skill or a follow-up step.

---

## Common pitfalls

- **Not running `npm ci` before `render.cjs`** → `Cannot find module 'puppeteer'`. Only needed the first time. Use `npm ci` (not `npm install`) so the lockfile-pinned puppeteer version is installed.
- **Omitting `--width` / `--height`** → It falls back to 128×128, and if the user wanted a different size you have to redraw. Always specify it.
- **SVG/Canvas content drawn only in the top-left corner of the PNG** → The drawing code declared its own dimensions (e.g. SVG `width="128" height="128"` or Canvas `scale = 8`) but render.cjs was invoked with a larger `--width`/`--height`. The content fills only its declared size and the rest of the PNG stays transparent. Fix: SVG uses `width="100%" height="100%"`; Canvas derives scale from `c.width`. The Minimal templates above already follow this.
- **Always Read the output PNG before uploading** → A misconfigured SVG/Canvas can silently produce a blank or off-canvas PNG. One `Read` on the output catches the size-mismatch and blank-canvas bugs in seconds; uploading first means re-doing the 2-step upload.
- **Background comes out black** → You drew a background inside the SVG/Canvas/HTML. To keep it transparent, remove the background shape itself.
- **Curves look smooth** → If using `chunky`, this is a rule violation; remove `arc()`/`bezierCurveTo()`/gradients and redraw with dots. If using `maple`, smoothness should come from **selective AA pixels at the silhouette**, NOT from gradient/curve APIs — the API ban still applies.
- **Maple sprite looks like chunky with extra colors** → You probably forgot the **selout** (1-pixel darker-color outline around each surface) and/or the selective AA at silhouette edges. Re-check `style-maple-cartoon.md` Selout and Selective AA sections.
- **Chunky sprite looks mushy / blurry** → You added intermediate-color pixels on edges. Chunky forbids ALL anti-aliasing — remove transition pixels and keep edges sharp. If a softer look is desired, switch to `maple` instead.
- **Maple sprite at small size (32×32 output) looks bad** → Maple style needs ≥ 64×64 output to fit selout + AA + features. Either increase size or switch to `chunky`.
- **PUT step fails with 401/403** → The presigned URL expired or is wrong. Restart from step 1.
- **Changing other arguments in the completion call** → Pass exactly the same arguments as in step 1. Only add `fileUrl`.
