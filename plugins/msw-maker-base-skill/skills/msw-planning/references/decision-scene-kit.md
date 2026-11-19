# Decision Scene Kit — composed card pictures for the native pane

Read this **in full before writing a gate while the native pane is active** ([`decision-sheet.md`](decision-sheet.md) §2 *⓪ Native pane*: your system prompt has a section beginning `msw-decision-pane is active`). Nothing here applies to the browser sheet (① / ②), which ignores `scene`; there, [`decision-sheet.md`](decision-sheet.md) §3 *One picture, one difference* covers `visual` and `emoji`.

---

## Composed pictures (`scene`) — on every option under ⓪

Write a short recipe for **every option of every question**, the ones that feel abstract included: player relationships, saving, timing, scope. There is no "this can't be drawn" option, because what you draw is the situation the option creates (see *Abstract choices* below). You write the recipe; the pane paints it in its own hand-drawn style. **Never write pixels yourself.**

```json
"scene": { "bg": "meadow", "items": [
  { "part": "mushroom", "x": 3, "y": 11 },
  { "part": "slime", "x": 17, "y": 17, "count": 2, "dx": 7, "tint": "purple" },
  { "part": "hero", "x": 31, "y": 12 },
  { "emoji": "🧛", "x": 26, "y": 16 }
] }
```

- **Canvas**: 40 wide × 26 tall pixels, `(0,0)` top-left; items paint in order, later on top. The ground's top row is `y` 21 on `meadow` · `night` · `dark`, 20 on `dungeon`, 18 on `room` — a part stands on it at `y = ground − its height`.
- **Backdrops** (`bg`): `meadow` (sky, hills, grass) · `field` (top-down grass tiles) · `sky` · `night` · `dungeon` · `room` · `dark` (purple fog, dead ground) · `ui` (dark panel, for screens and systems).
- **Parts** (`part`, width × height): `hero` 6×9 · `mushroom` 12×10 · `slime` 6×4 · `ghost` 6×7 · `bat` 7×4 · `chest` 7×6 · `coin` 3×3 · `gem` 5×5 · `heart` 5×4 · `star` 5×5 · `sparkle` 3×3 · `sword` 5×10 · `shield` 5×6 · `arrowUp` 5×6 · `arrowRight` 6×5 · `barChart` 7×6 · `monitor` 12×8 · `keyboard` 12×3 · `phone` 5×8 · `gamepad` 9×5 · `puzzle` 8×7 · `book` 7×6 · `clock` 7×7 · `hourglass` 5×7 · `tree` 7×9 · `deadTree` 7×8 · `sprout` 5×5 · `house` 10×8 · `castle` 12×8 · `flag` 5×6 · `crown` 7×5 · `trophy` 7×7 · `cloud` 9×4 · `moon` 5×5 · `torch` 3×5 · `vs` 12×5.
- **Part options**: `scale: 2` (twice the size) · `flip: true` (mirrored) · `tint` (`red` `orange` `yellow` `green` `teal` `blue` `purple` `pink` `gray` `dark` `light` — recolours the part, outlines and eyes kept) · `count` with `dx` / `dy` (repeat it, stepping by that many pixels — a crowd, a row of coins).
- **Shapes**, for what the kit lacks: `{ "shape": "rect" | "frame", "x", "y", "w", "h", "color" }` · `{ "shape": "circle", "x", "y", "r", "color" }` · `{ "shape": "tri", "x", "y", "w", "h", "color" }` (a roof or peak, `x` its apex) · `{ "shape": "line", "x", "y", "x2", "y2", "color" }`. `color` is `white` `black` `gray` `red` `orange` `yellow` `green` `teal` `blue` `sky` `purple` `pink` `brown` `beige` `navy` or `#rrggbb`.
- **Emoji stickers**, for anything else: `{ "emoji": "🧛", "x", "y" }` — two pixels wide by two tall on screen, set over the scene (`y` snaps to an even row). Use them as accents on a composed scene, not as the whole picture.
- **Keep it a sketch of the difference**: 3–8 items, the subject large and central, the same backdrop across a question's options unless the backdrop *is* the difference (`meadow` vs `dark` for a mood question). The *One picture, one difference* rule ([`decision-sheet.md`](decision-sheet.md) §3) applies to scenes too.
- **Abstract choices: draw the situation the option creates**, with kit parts doing the talking:

  | The option is about… | Draw |
  |---|---|
  | Playing alone | one `hero` on its own backdrop, a `house` behind it |
  | Others in the same map | three `hero`s in different `tint`s side by side |
  | Sharing only a ranking | one `hero`, a `trophy` and a `barChart` on `ui` |
  | Saving progress | the `hero` beside a `chest` or `book`, a `heart` above |
  | Rewards while away | `night` backdrop, `moon`, the `hero` beside a `house`, a row of `coin`s |
  | Starting from zero each time | a lone `sprout`, an `arrowRight` and an `hourglass` |
  | Small scope vs big scope | one `house` vs a `castle` with `flag`s |
  | Now vs later | the thing itself vs the same thing in `tint: "gray"` beside an `hourglass` |
  | A system or a screen | `ui` backdrop, `frame` shapes for panels, `coin` / `barChart` / `gem` inside |

## What the pane refuses

The mod **refuses the write** of a gate where any option has no `scene`, an off-kit backdrop or part, only emoji stickers, or the same scene as a sibling in its question; the refusal names each card. Add the missing scenes and write the whole file again.
