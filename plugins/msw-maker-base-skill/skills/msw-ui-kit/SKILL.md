---
name: msw-ui-kit
description: "Packaged UI asset kit — polished, visually harmonized MSW UI from official MSWPackages assets. Use when the user wants UI that looks good / polished / pretty / consistent / game-quality, asks for a themed screen or themed part (frame, slot, gauge, arrow, icon), or needs an interaction widget native components lack. (1) 7 theme RUID palettes mined from published-world UI resource packs: parts with RUID, native size, 9-slice type and button states, usable as UIBuilder image_ruid with no install, plus entity-tree digests of 130+ sample and official package screens (inventory, shop, ranking, HUD, dialog). (2) Prebuilt widgets: checkbox, radio button, switch, toggle group, dropdown, pagination, progress bar, scroll picker, time picker, number pad, loading spinner."
---

# msw-ui-kit

Build **visually harmonized** UI by reusing official MSWPackages assets: theme RUID palettes from published worlds + a prebuilt interaction widget library. The premise: parts shipped together in one resource pack are already art-directed to match — picking from one theme beats assembling RUIDs ad-hoc via search.

Role division:

| Skill | Responsibility |
|-------|----------------|
| `msw-ui-kit` (this skill) | **Which assets** — themed part RUIDs, sample screen references, prebuilt widget integration |
| `msw-ui-system` | **The `.ui` itself** — all `.ui` creation/mutation goes through its UIBuilder; layout, anchors, components |
| `msw-packages` | **Feature systems** (inventory logic, shop logic, ranking data…) — this skill covers only the *look* and *interaction widgets* |

---

## 0. Routing

| Trigger | Read |
|---------|------|
| "polished / pretty / game-quality UI", "themed screen", theme chosen | [`references/themes/<theme>.md`](references/themes/) — pick via §1 table first |
| Specific part hunt ("this theme's close button / arrow / slot variant / gauge") | Theme doc part lists; long tail → grep `data/themes/<theme>.ruids.json` by name keyword |
| "checkbox / radio / switch / toggle group / dropdown / pagination / progress bar / scroll picker / time picker / number pad / spinner" | [`references/widgets.md`](references/widgets.md) |
| Whole-screen structure reference ("make an inventory/shop/ranking screen like a real game") | Theme doc §Sample screens → read the bundled tree at `data/samples/<theme>/<Screen>.txt` |
| Same, but the feature comes from an official package (inventory / shop / mail / ranking / quest / dialog…) | [`references/package-screens.md`](references/package-screens.md) → `data/packages/<package>/<Screen>.txt` |
| Feature logic behind the screen (inventory add/remove, purchase flow…) | Route to `msw-packages` skill |

## 1. Theme selection

Pick **one theme per world** (at minimum per screen family) and stay inside it. All parts within a theme are art-directed to match.

| Theme | Source world | Character / best for | Inventory |
|-------|-------------|----------------------|-----------|
| `supersimple` | Getting Over It Maker | Clean minimal utility UI; lightweight games, tool-like screens | 9 core sets, 19 sample screens |
| `simplefantasy` | MapleSlash | Fantasy action RPG, the largest kit (equip/skill/gacha/star-force screens) | 11 core sets, 42 sample screens |
| `casualrpg` | MapleSoulHero | Casual RPG full suite (inventory, quest, collection, stage map) | 11 core sets, 20 sample screens |
| `casualsurvival` | Durango The Lost Island | Survival/crafting (research, crafting, minimap, status) | 10 core sets, 15 sample screens |
| `cutecasual` | ChuChuBurger | Cute round management/tycoon style, biggest sample set | 10 core sets, 28 sample screens |
| `cardgame` | Maple Duel | Card battler (cards, minions, ranked match, decks) | 8 core sets, 12 sample screens |
| `minimalcombat` | Maple Auto Battler | Small core-only set (icons, slots, tints) — accent use | 5 core sets, no samples |

If the user has no preference: `supersimple` for utility/lightweight worlds, `simplefantasy` for RPG-like worlds. State the choice and why in one line.

## 2. Workflow

```
(1) Pick theme          §1 table (ask only if genuinely ambiguous)
(2) Load palette        references/themes/<theme>.md
(3) Structure first     building a standard screen (inventory/shop/ranking/HUD/dialog…)?
                        read data/samples/<theme>/<Screen>.txt BEFORE laying anything out
                        (large files say so in their header — read top-level sections, not all)
                        feature comes from an official package? use data/packages/ instead
                        (references/package-screens.md indexes them)
(4) Map screen parts    panel → surface part, actions → button parts, lists → slot/unit parts,
                        gauges → slider parts, glyphs → tint/icon parts
(5) Build via builder   msw-ui-system UIBuilder, passing image_ruid per part
(6) Widgets if needed   references/widgets.md (binding groups + assets/widgets/trees/ blueprint)
```

## 3. Rules

### ALWAYS
1. **One theme per screen, baked at authoring time.** This skill assumes the theme is chosen when you write the `.ui` and does not change at runtime — that is what lets ALWAYS #4 treat "is this text sitting on theme art?" as a fact you can check while building. Never mix parts from two themes on one screen; for a missing part, first grep the theme's `data/themes/<theme>.ruids.json` long tail, then reuse a same-theme part with a different size, and only then fall back to `msw-search`. If the world really does swap themes at runtime, that assumption breaks: a plain panel you authored can end up under theme art later. Then either keep the swappable surfaces and the text on them in the same theme set, or leave that chrome out of the swap entirely and fix its colors.
2. **Respect native sizes.** Non-Sliced parts keep their native aspect ratio (scale uniformly). `(Sliced)` parts resize, but 9-slice keeps only the border clean — a band, divider or inner frame painted inside the art stretches with the middle and lands across your content, unseen by you or lint. For a generic window/popup background, pick from the theme doc's part lists the one whose native W:H is closest to your target rect. Before reusing a background lifted from a sample tree, grep its RUID in the data JSON: `"kind": "S"` means it exists only in sample screens — a fixture of that layout, not a generic surface. `(Tiled)` parts extend by repetition — with one exception: for a **gauge/bar background** marked `(Tiled)`, use `sprite_type: 1` (Sliced) when your bar width differs from the native size (tiling clips a partial segment at the end and looks misaligned). Keep Tiled for large decorative pattern fills (`BG_Pattern`-style). **Default for resized surfaces**: any surface-type part (window bg, panel, list/row bg, plate) used at a non-native size gets `sprite_type: 1` regardless of marker — with 9-slice borders the border renders clean, without them it renders identically to Simple, so it is never worse than Simple. Icons/illustrations are NOT surfaces — scale those uniformly. **`(Filled)` is a record, not an instruction**: it means the source drove that art through `FillAmount` at its native size, typically inside a `SliderComponent`. For your own linear gauge, follow `msw-ui-system`'s rule — resize the fill sprite's width instead of filling it, since `Filled` clips UVs and warps any 9-slice border. Start at `sprite_type: 1`; gauge fills are long thin gradients that often carry no slice borders, so if the fill looks stretched or blurred switch to `sprite_type: 2` (Tiled), which repeats the pattern cleanly. Reserve `Filled` for radial sweeps (cooldown rings). Never keep a `(Filled)` part's native aspect ratio — these arts run to extremes like 48:1, so uniform scaling can produce no usable bar at all.
3. **Every themed part needs an explicit `color`.** Passing `image_ruid` alone leaves the builder's dark translucent default skin color on the sprite, and it multiplies the art into a near-invisible ghost — pass `"#FFFFFF"` (`bg_color` on `button` / `slider` / `textInput`) to render a part as authored, including cells and icons whose image you swap at runtime (a part the theme doc lists with a `color:` value takes that value instead). `Tint_*` parts are monochrome glyphs — apply theme-consistent accent colors via the builder `color` option instead of hunting for another colored icon. This extends to surfaces: some panel/row/unit bgs are **neutral white masks sharing a RUID with `Tint_*` entries** — bare they render as a flat white (or near-invisible) fill that buries text. Any part listed with a `color:` value must get that color (or a deliberate theme-consistent substitute) passed to the builder; never render the bare RUID. Mask RUIDs are flagged `"tint": true` in the data JSON.
4. **Never invent font colors on themed art.** Sprite brightness is invisible to you — white-on-light and dark-on-dark failures are undetectable statically. Use the part's `text:` pairing from the theme doc: it lists every font color the source world actually put on that art, most-used first, with counts. A pairing carrying `+o#RRGGBB` (outline) or `+s#RRGGBB` (flat halo) is one unit — most light font colors in these packs read *only* because of that ring, so taking the color without it recreates the failure. Pass the outline as `outline` / `outline_color` / `outline_width` on the text node; a halo is `Underlay` + `UnderlayColor` via `patchComponent`, at offset 0 (a flat ring, not a drop shadow). If the part has none, pick from the theme's "Text colors" section (matching the closest context). Only fall back to plain black/white on your own flat-color panels. **A part marked `[split surface]`** (`"split_text": true` in the data JSON) carries both light and dark regions — a title band over a pale body, say — so its listed colors are not interchangeable: match the region you are writing on, and when unsure prefer the darker option, which stays readable on the pale part.
5. **All `.ui` mutations go through `msw-ui-system`'s UIBuilder** — this skill only supplies RUIDs/sizes/structure. Its design rules (anchors, nesting, UIGroup roots) still apply.
6. **Sample and package screens are structural references, not files to copy** — study the part composition, then rebuild with the builder. Package screens carry the package's own art, so take their composition and pass your theme's RUIDs; prefer one when the feature itself comes from that package, since its scripts bind against that tree.

### NEVER
1. Do not install/copy the `ui-resource-*` packages — their RUIDs resolve from MSW resource storage as-is. Widgets are the only thing copied into the workspace, and their source is **this skill's `assets/widgets/`** (see `references/widgets.md`) — never fetch anything from the network.
2. Do not hand-edit widget prefab internals (script names, child names) — bindings are by name.

## 4. Sub-documents

- [`references/themes/`](references/themes/) — per-theme part palettes: `supersimple.md`, `simplefantasy.md`, `casualrpg.md`, `casualsurvival.md`, `cutecasual.md`, `cardgame.md`, `minimalcombat.md`
- [`references/widgets.md`](references/widgets.md) — prebuilt interaction widgets: integration, per-widget API, binding groups, events, pitfalls
- [`references/package-screens.md`](references/package-screens.md) — index of official feature-package screens (inventory, shop, mail, ranking, quest…) whose trees are digested at `data/packages/<package>/<Screen>.txt`
- `data/themes/<theme>.ruids.json` — full RUID registry per theme (machine-greppable long tail; one JSON object per line: names, category, `kind` (which models the art appears in — `C` core palette only, `S` sample screens only, `CS` both), size, and `type` — **a record of how the source world rendered that art, not a recommendation for your use**; see ALWAYS #2 for what to actually pass — plus `"surface": true` on parts classified as stretch-to-fit surfaces — the ALWAYS #2 default-Sliced targets — and `"tint": true` on neutral masks that require an explicit `color` — the ALWAYS #3 targets — plus `"text"`, the font colors the source world used on that art with counts and their `+o`/`+s` rings, and `"split_text": true` where those span light and dark — the ALWAYS #4 targets)
- `data/samples/<theme>/<Screen>.txt` — full entity-tree digests of the source world's production screens (structural recipes)
- `assets/widgets/` — bundled widget sources: `UIComponent/**/*.mlua` + `Util/Util.mlua` (copy into workspace) and `trees/**.txt` prefab structure digests (rebuild visuals with theme parts)

## Out of Scope

- `.ui` building mechanics, anchors, components, runtime patterns — `msw-ui-system`
- Feature/system packages (inventory, shop, mail, ranking logic…) — `msw-packages`
- Free-form sprite search outside themes — `msw-search`; drawing new sprites — `msw-painter`
