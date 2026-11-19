// Card pictures composed on demand. A gate's option may carry a `scene`: a
// background, then parts from a hand-drawn kit (recoloured, flipped, doubled,
// repeated), simple shapes, and emoji stickers for anything the kit lacks.
// The session writes only that short recipe; this file paints it onto the
// medium canvas (40 x 26 pixels), so every card reads in one hand-drawn style.
// The terminal shows that canvas in half blocks; the desktop, which has real
// pixels to spare, gets the same recipe painted four times finer (160 x 104):
// the kit's parts smoothed up with Scale2x, shapes drawn at that resolution.

import type { SceneItem, SceneSpec } from '../types'

export const SCENE_W = 40
export const SCENE_H = 26

/* one letter per colour; '.' in a part is see-through */
const INK: Record<string, string> = {
  A: '#8fd0ff', a: '#a9dcff', C: '#c6e9ff', W: '#ffffff', w: '#dceefa', V: '#93c9a8', v: '#7fb894',
  G: '#57b83a', H: '#6fcd4b', E: '#46a12f', e: '#86dd5c', g: '#2f7a22', x: '#25611b',
  D: '#9a6332', d: '#6e4521', Q: '#7a4a24', q: '#b97a40', U: '#c9a06a', u: '#a8834f',
  K: '#2a2a2a', F: '#ffe1b0', k: '#f7b7b0', X: '#5a3b1e', J: '#3a5fb0',
  O: '#f08a24', o: '#ffb25c', s: '#c96a12', R: '#e0483e', r: '#a8302a', Y: '#ffd23f', y: '#d9a514',
  '5': '#7ad66a', '6': '#3f9a35', L: '#d8b36a', l: '#9c7536', T: '#b7c0cc', t: '#7d8792',
  P: '#e8d7a8', p: '#c4a872', N: '#1f2633', n: '#34425e', '8': '#2a3446',
  B: '#3d7ddb', b: '#8fb8ff', M: '#5fd0a8', m: '#3aa884', h: '#9b7be0', f: '#6f52b8', Z: '#ff6fa8', z: '#fff07a',
}

/** The kit: small hand-drawn parts, their top-left corner placed by the recipe. */
export const PARTS: Record<string, readonly string[]> = {
  hero: ['.XXXX.', 'XXXXXX', 'XFFFFX', '.KFFK.', '.FFFF.', 'OOOOOO', 'FOOOOF', '.JJJJ.', '.K..K.'],
  mushroom: [
    '....KKKK....', '..KKOOOOKK..', '.KOooOOOWWK.', 'KOooOOOOWWOK', 'KOOOOWWOOOOK', '.KKKKKKKKKK.',
    '..KFFFFFFK..', '..KFKFFKFK..', '..KkFFFFkK..', '...KK..KK...',
  ],
  slime: ['.5555.', '55K5K5', '555555', '666666'],
  ghost: ['.WWWW.', 'WWWWWW', 'WKWWKW', 'WWWWWW', 'wWWWWw', 'wwwwww', 'w.ww.w'],
  bat: ['K.....K', 'KKRKRKK', '.KKKKK.', '..K.K..'],
  chest: ['.ddddd.', 'dDDYDDd', 'ddddddd', 'dDDYDDd', 'dDDDDDd', 'ddddddd'],
  coin: ['.y.', 'yYy', '.y.'],
  gem: ['.bbb.', 'bbWbb', 'bBBBb', '.bBb.', '..b..'],
  heart: ['RR.RR', 'RRRRR', '.RRR.', '..R..'],
  star: ['..Y..', '.YYY.', 'YYYYY', '.YYY.', 'Y...Y'],
  sparkle: ['.W.', 'WWW', '.W.'],
  sword: ['..W..', '..T..', '..T..', '..T..', '..T..', '..T..', 'yyyyy', '..d..', '..d..', '..y..'],
  shield: ['BBBBB', 'BYBYB', 'BBYBB', 'BYBYB', '.BBB.', '..B..'],
  arrowUp: ['..G..', '.GGG.', 'GGGGG', '.GGG.', '.GGG.', '.GGG.'],
  arrowRight: ['...G..', '...GG.', 'GGGGGG', '...GG.', '...G..'],
  barChart: ['......G', '...G..G', '...G..G', 'G..G..G', 'G..G..G', 'TTTTTTT'],
  monitor: ['TTTTTTTTTTTT', 'TbbbbbbbbbbT', 'TbWbbbbbbbbT', 'TbbbbbbBbbbT', 'TbbbbbbbbbbT', 'TTTTTTTTTTTT', '.....tt.....', '...tttttt...'],
  keyboard: ['tttttttttttt', 'tTtTtTtTtTtt', 'ttTTTTTTTTtt'],
  phone: ['.ttt.', 'tbbbt', 'tbWbt', 'tbbbt', 'tbbbt', 'tbbBt', 'tbbbt', 'ttTtt'],
  gamepad: ['.ttttttt.', 'ttKtttRtt', 'tKKKtRtRt', 'ttKtttRtt', '.tt...tt.'],
  puzzle: ['...hh...', '..hhhh..', 'hhhhhhhh', 'hhhhhhff', 'hhhhhhff', 'hhhhhhhh', '..hhhh..'],
  book: ['.ttttt.', 'tPPtPPt', 'tPPtPPt', 'tPPtPPt', 'tPPtPPt', '.ttttt.'],
  clock: ['..ttt..', '.tWWWt.', 'tWWKWWt', 'tWWKKWt', 'tWWWWWt', '.tWWWt.', '..ttt..'],
  hourglass: ['yyyyy', '.PPP.', '..P..', '..P..', '.PPP.', 'PPPPP', 'yyyyy'],
  tree: ['..ggg..', '.gEggg.', 'gggEggg', 'gEggggg', 'ggggEgg', '.ggggg.', '...d...', '...d...', '..ddd..'],
  deadTree: ['.t...t.', '..t.t..', 't..t..t', '.t.t.t.', '..ttt..', '...t...', '...t...', '..ttt..'],
  sprout: ['.e.e.', 'eGeGe', '..G..', '..d..', '.ddd.'],
  house: ['....RR....', '...RRRR...', '..RRRRRR..', '.RRRRRRRR.', '..PPPPPP..', '..PdPPbP..', '..PdPPPP..', '..PPPPPP..'],
  castle: ['T.T.T..T.T.T', 'TTTTT..TTTTT', 'TTtTT..TTtTT', 'TTTTTTTTTTTT', 'TTTTTTTTTTTT', 'TTTTKKKKTTTT', 'TTTKKKKKKTTT', 'TTTKKKKKKTTT'],
  flag: ['dRRR.', 'dRRRR', 'dRRR.', 'd....', 'd....', 'd....'],
  crown: ['Y..Y..Y', 'YY.Y.YY', 'YYYYYYY', 'YRYBYRY', 'YYYYYYY'],
  trophy: ['YYYYYYY', 'YYYYYYY', '.YYYYY.', '..YYY..', '...Y...', '..yyy..', '.yyyyy.'],
  cloud: ['..WWW....', '.WWWWWWW.', 'WWWWWWWWW', '.wwwwwww.'],
  moon: ['.YYY.', 'YYY..', 'YY...', 'YYY..', '.YYY.'],
  torch: ['.Y.', 'YOY', '.O.', '.d.', '.d.'],
  vs: ['RR...RR.BBBB', 'RR...RR.B...', '.RR.RR..BBBB', '..RRR.......', '...R....BBBB'],
}

/** The backdrops, painted first across the whole canvas. */
export const BACKGROUNDS = ['meadow', 'field', 'sky', 'night', 'dungeon', 'room', 'dark', 'ui'] as const

/** Named colours for shapes; a `#rrggbb` works too. */
const NAMED: Record<string, string> = {
  white: '#ffffff', black: '#2a2a2a', gray: '#9aa3ad', red: '#e0483e', orange: '#f08a24', yellow: '#ffd23f',
  green: '#57b83a', teal: '#5fd0a8', blue: '#3d7ddb', sky: '#8fd0ff', purple: '#9b7be0', pink: '#ff6fa8',
  brown: '#9a6332', beige: '#e8d7a8', navy: '#1f2633',
}

/* a tint keeps a part's light and shade and moves its hue (or drops it) */
const TINTS: Record<string, { hue?: number; sat?: number; light?: number }> = {
  red: { hue: 2 }, orange: { hue: 28 }, yellow: { hue: 48 }, green: { hue: 115 }, teal: { hue: 165 },
  blue: { hue: 215 }, purple: { hue: 272 }, pink: { hue: 330 }, gray: { sat: 0 }, dark: { light: 0.55 }, light: { light: 1.3 },
}


/** A painted scene: one colour per pixel, row-major, and the emoji stickers on top (cell-aligned, in canvas
    cells whatever the resolution). `k` is how many times finer than the 40 x 26 canvas it was painted. */
export type Painted = { w: number; h: number; px: number[]; stickers: { emoji: string; col: number; row: number }[]; k?: number }

/** A kit entry by the name a gate gave, only when the kit holds it itself: a name such as "constructor" or
    "toString" must not reach Object.prototype. */
export function own<T>(rec: { readonly [k: string]: T }, key: string | undefined): T | undefined {
  return key !== undefined && Object.prototype.hasOwnProperty.call(rec, key) ? rec[key] : undefined
}

const clampTo = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** An item held to what a picture can show: positions and sizes at most one canvas beyond each edge, repeats at
    most 24, so a mistyped 1e6 cannot hold a painter in its loops. */
export function boundItem(it: SceneItem): SceneItem {
  const out: SceneItem = { ...it, x: clampTo(it.x, -SCENE_W, 2 * SCENE_W), y: clampTo(it.y, -SCENE_H, 2 * SCENE_H) }
  if (it.w !== undefined) out.w = clampTo(it.w, 0, 2 * SCENE_W)
  if (it.h !== undefined) out.h = clampTo(it.h, 0, 2 * SCENE_H)
  if (it.r !== undefined) out.r = clampTo(it.r, 0, SCENE_W)
  if (it.x2 !== undefined) out.x2 = clampTo(it.x2, -SCENE_W, 2 * SCENE_W)
  if (it.y2 !== undefined) out.y2 = clampTo(it.y2, -SCENE_H, 2 * SCENE_H)
  if (it.dx !== undefined) out.dx = clampTo(it.dx, -SCENE_W, SCENE_W)
  if (it.dy !== undefined) out.dy = clampTo(it.dy, -SCENE_H, SCENE_H)
  if (it.count !== undefined) out.count = clampTo(Math.round(it.count), 1, 24)
  return out
}

const hex = (h: string): number => parseInt(h.slice(1), 16)
const colourOf = (name: string | undefined): number | undefined => {
  if (!name) return undefined
  if (/^#[0-9a-f]{6}$/i.test(name)) return hex(name)
  const named = own(NAMED, name)
  return named ? hex(named) : undefined
}

function rgbToHsl(c: number): [number, number, number] {
  const r = ((c >> 16) & 255) / 255
  const g = ((c >> 8) & 255) / 255
  const b = (c & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s, l]
}
function hslToRgb(h: number, s: number, l: number): number {
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
  }
  return (f(0) << 16) | (f(8) << 8) | f(4)
}
function tinted(c: number, tint: string | undefined): number {
  const t = own(TINTS, tint)
  if (!t) return c
  const [h, s, l] = rgbToHsl(c)
  /* outlines, eyes and highlights keep their colour so the part stays readable */
  if (l < 0.18 || l > 0.93) return c
  return hslToRgb(t.hue ?? h, t.sat ?? Math.max(s, t.hue !== undefined ? 0.45 : s), Math.max(0, Math.min(1, l * (t.light ?? 1))))
}

function paintBackground(bg: string, set: (x: number, y: number, c: number) => void): void {
  const W = SCENE_W
  const H = SCENE_H
  const fill = (y0: number, y1: number, c: string) => { for (let y = y0; y <= y1; y++) for (let x = 0; x < W; x++) set(x, y, hex(c)) }
  const ground = (top: number, grass: string, grass2: string, dirt: string, dirt2: string) => {
    for (let x = 0; x < W; x++) {
      set(x, top, hex(x % 3 === 0 ? grass2 : grass))
      set(x, top + 1, hex(grass))
      for (let y = top + 2; y < H; y++) set(x, y, hex((x + y) % 5 === 0 ? dirt2 : dirt))
    }
  }
  switch (bg) {
    case 'field':
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) set(x, y, hex(((((x / 8) | 0) + ((y / 8) | 0)) % 2 ? INK.H : INK.G) as string))
      return
    case 'night':
      fill(0, 9, '#1b2340'); fill(10, 20, '#24305a')
      for (const [x, y] of [[3, 2], [11, 5], [19, 1], [27, 4], [35, 2], [7, 8], [31, 9], [15, 11]] as const) set(x, y, hex('#ffffff'))
      ground(21, '#2f5a2a', '#3c6e34', '#3a2a1c', '#2c2015')
      return
    case 'dungeon':
      for (let y = 0; y < 20; y++) for (let x = 0; x < W; x++) {
        const off = ((y / 3) | 0) % 2 ? 3 : 0
        set(x, y, hex(y % 3 === 2 || (x + off) % 6 === 5 ? '#4a4f5a' : '#6b7280'))
      }
      fill(20, 25, '#3a3530')
      for (let x = 0; x < W; x += 4) set(x, 22, hex('#2c2824'))
      return
    case 'room':
      fill(0, 15, '#e8d7a8'); fill(16, 17, '#c4a872')
      for (let y = 18; y < H; y++) for (let x = 0; x < W; x++) set(x, y, hex((x + (y % 2) * 3) % 6 === 0 ? '#7a4a24' : '#9a6332'))
      return
    case 'dark':
      fill(0, 7, '#2a1f3d'); fill(8, 15, '#3b2a55'); fill(16, 20, '#4a3566')
      for (let x = 0; x < W; x++) { const top = 17 + Math.round(2 * Math.sin(x / 4)); for (let y = top; y < 21; y++) set(x, y, hex('#2e2440')) }
      ground(21, '#3a3448', '#4a4258', '#241e2e', '#1b1622')
      return
    case 'ui':
      fill(0, H - 1, '#1f2633')
      for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 4) set(x, y, hex('#2a3446'))
      return
    case 'sky':
      fill(0, 8, INK.A as string); fill(9, 17, INK.a as string); fill(18, 25, INK.C as string)
      return
    default: /* meadow */
      fill(0, 7, INK.A as string); fill(8, 15, INK.a as string); fill(16, 20, INK.C as string)
      for (let x = 0; x < W; x++) { const top = Math.round(17 - 2 * Math.sin((x + 3) / 5)); for (let y = top; y < 21; y++) set(x, y, hex((y === top ? INK.v : INK.V) as string)) }
      ground(21, INK.G as string, INK.e as string, INK.D as string, INK.d as string)
  }
}

/** Paints a recipe; unknown backdrops fall back to the meadow, unknown parts are left out. */
export function paintScene(spec: SceneSpec): Painted {
  const px: number[] = new Array(SCENE_W * SCENE_H).fill(0)
  paintBackground(spec.bg, (x, y, c) => {
    if (x >= 0 && y >= 0 && x < SCENE_W && y < SCENE_H) px[y * SCENE_W + x] = c
  })
  return paintItems(spec.items, { w: SCENE_W, h: SCENE_H, px, stickers: [] })
}

/* the recipe's items painted over a backdrop already on the canvas, whatever its size */
function paintItems(items: readonly SceneItem[], canvas: Painted): Painted {
  const { w: W, h: H, px, stickers } = canvas
  const set = (x: number, y: number, c: number) => {
    const xi = Math.round(x)
    const yi = Math.round(y)
    if (xi >= 0 && yi >= 0 && xi < W && yi < H) px[yi * W + xi] = c
  }
  for (const it of items.map(boundItem)) {
    const count = Math.max(1, Math.min(24, Math.round(it.count ?? 1)))
    for (let n = 0; n < count; n++) {
      const x = it.x + n * (it.dx ?? 0)
      const y = it.y + n * (it.dy ?? 0)
      if (it.part) {
        const rows = own(PARTS, it.part)
        if (!rows) continue
        const scale = it.scale === 2 ? 2 : 1
        const width = Math.max(...rows.map(r => r.length))
        rows.forEach((row, ry) =>
          [...row].forEach((ch, rx) => {
            const inked = INK[ch]
            if (ch === '.' || !inked) return
            const c = tinted(hex(inked), it.tint)
            const col = it.flip ? width - 1 - rx : rx
            for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) set(x + col * scale + sx, y + ry * scale + sy, c)
          }),
        )
      } else if (it.shape) {
        const c = colourOf(it.color) ?? hex('#ffffff')
        const w = Math.max(1, it.w ?? 1)
        const h = Math.max(1, it.h ?? 1)
        if (it.shape === 'rect') for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) set(x + xx, y + yy, c)
        else if (it.shape === 'frame') for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { if (yy === 0 || xx === 0 || yy === h - 1 || xx === w - 1) set(x + xx, y + yy, c) }
        else if (it.shape === 'circle') {
          const r = Math.max(1, it.r ?? 2)
          for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r + r * 0.6) set(x + xx, y + yy, c)
        } else if (it.shape === 'tri') for (let yy = 0; yy < h; yy++) { const half = Math.round(((yy + 1) / h) * (w / 2)); for (let xx = -half; xx <= half; xx++) set(x + xx, y + yy, c) }
        else if (it.shape === 'line') {
          const x2 = it.x2 ?? x
          const y2 = it.y2 ?? y
          const steps = Math.max(Math.abs(x2 - x), Math.abs(y2 - y), 1)
          for (let k = 0; k <= steps; k++) set(x + ((x2 - x) * k) / steps, y + ((y2 - y) * k) / steps, c)
        }
      } else if (it.emoji) {
        /* a sticker covers two columns of one cell row (two pixel rows) */
        const col = Math.max(0, Math.min(W - 2, Math.round(x)))
        const row = Math.max(0, Math.min(H / 2 - 1, Math.floor(y / 2)))
        stickers.push({ emoji: it.emoji, col, row })
      }
    }
  }
  return { w: W, h: H, px, stickers }
}

/* a part's width and height on the canvas, its scale counted */
function partSize(name: string, scale: number | undefined): { w: number; h: number } | undefined {
  const rows = own(PARTS, name)
  if (!rows) return undefined
  const k = scale === 2 ? 2 : 1
  return { w: Math.max(...rows.map(r => r.length)) * k, h: rows.length * k }
}

/* every copy an item places, its repeats spelled out one by one */
function placed(items: readonly SceneItem[]): SceneItem[] {
  return items.map(boundItem).flatMap(it =>
    Array.from({ length: Math.max(1, Math.min(24, Math.round(it.count ?? 1))) }, (_, n) => ({
      ...it,
      x: it.x + n * (it.dx ?? 0),
      y: it.y + n * (it.dy ?? 0),
      count: 1,
    })),
  )
}

type Extent = { x0: number; y0: number; x1: number; y1: number }

/* the pixels one placed copy covers on the canvas, right and bottom edges exclusive */
function extentOf(it: SceneItem): Extent | undefined {
  const x = Math.round(it.x)
  const y = Math.round(it.y)
  if (it.part) {
    const s = partSize(it.part, it.scale)
    return s && { x0: x, y0: y, x1: x + s.w, y1: y + s.h }
  }
  if (it.shape === 'rect' || it.shape === 'frame') return { x0: x, y0: y, x1: x + Math.max(1, it.w ?? 1), y1: y + Math.max(1, it.h ?? 1) }
  if (it.shape === 'circle') {
    const r = Math.max(1, it.r ?? 2)
    return { x0: x - r, y0: y - r, x1: x + r + 1, y1: y + r + 1 }
  }
  if (it.shape === 'tri') {
    const half = Math.round(Math.max(1, it.w ?? 1) / 2)
    return { x0: x - half, y0: y, x1: x + half + 1, y1: y + Math.max(1, it.h ?? 1) }
  }
  if (it.shape === 'line') {
    const x2 = Math.round(it.x2 ?? x)
    const y2 = Math.round(it.y2 ?? y)
    return { x0: Math.min(x, x2), y0: Math.min(y, y2), x1: Math.max(x, x2) + 1, y1: Math.max(y, y2) + 1 }
  }
  if (it.emoji) {
    const col = Math.max(0, Math.min(SCENE_W - 2, x))
    const row = Math.max(0, Math.min(SCENE_H / 2 - 1, Math.floor(y / 2)))
    return { x0: col, y0: row * 2, x1: col + 2, y1: row * 2 + 2 }
  }
  return undefined
}

/**
 * A recipe painted into a picture smaller than its canvas (the small card), with nothing it draws cut off: the
 * window of that size nearest the middle that holds every item, or, where the items spread wider or taller than
 * any window, the recipe laid out again on the smaller canvas, each part at its own size and only the room
 * between them shrunk.
 */
export function fitScene(spec: SceneSpec, w: number, h: number): Painted {
  const full = paintScene(spec)
  const drawn = placed(spec.items)
    .map(extentOf)
    .filter((e): e is Extent => !!e)
    .map(e => ({ x0: Math.max(0, e.x0), y0: Math.max(0, e.y0), x1: Math.min(SCENE_W, e.x1), y1: Math.min(SCENE_H, e.y1) }))
    .filter(e => e.x0 < e.x1 && e.y0 < e.y1)
  const midX = Math.max(0, Math.floor((SCENE_W - w) / 2))
  /* keep cell rows aligned: an even top offset */
  const midY = Math.max(0, Math.floor((SCENE_H - h) / 4) * 2)
  if (drawn.length === 0) return cropPainted(full, midX, midY, w, h)
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
  /* the window's left edge may go anywhere that still takes in the leftmost and the rightmost item */
  const xLo = Math.max(0, Math.max(...drawn.map(e => e.x1)) - w)
  const xHi = Math.min(SCENE_W - w, Math.min(...drawn.map(e => e.x0)))
  const yLo = Math.max(0, Math.max(...drawn.map(e => e.y1)) - h)
  const yHi = Math.min(SCENE_H - h, Math.min(...drawn.map(e => e.y0)))
  const y = clamp(midY, yLo, yHi)
  const y0 = [y, y - 1, y + 1].find(v => v % 2 === 0 && v >= yLo && v <= yHi)
  if (xLo <= xHi && y0 !== undefined) return cropPainted(full, clamp(midX, xLo, xHi), y0, w, h)
  return relaid(spec, w, h)
}

/* the recipe on a w x h canvas: the backdrop sampled down, shapes (panels, rects, lines) stretched with it, and
   each part or sticker slid along the room left for it at its own size, so one at an edge stays at that edge */
function relaid(spec: SceneSpec, w: number, h: number): Painted {
  const back = paintScene({ bg: spec.bg, items: [] })
  const px: number[] = []
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) px.push(back.px[Math.floor(((y + 0.5) * SCENE_H) / h) * SCENE_W + Math.floor(((x + 0.5) * SCENE_W) / w)] ?? 0)
  const sx = w / SCENE_W
  const sy = h / SCENE_H
  const slide = (a: number, len: number, from: number, to: number) =>
    Math.round(len >= to || from <= len ? (to - len) / 2 : (a * (to - len)) / (from - len))
  const edge = (a: number, s: number) => Math.floor(a * s)
  const items = placed(spec.items).flatMap((it): SceneItem[] => {
    const x = Math.round(it.x)
    const y = Math.round(it.y)
    if (it.part) {
      const s = partSize(it.part, it.scale)
      return s ? [{ ...it, x: slide(x, s.w, SCENE_W, w), y: slide(y, s.h, SCENE_H, h) }] : []
    }
    if (it.emoji) return [{ ...it, x: slide(x, 2, SCENE_W, w), y: slide(Math.floor(y / 2) * 2, 2, SCENE_H, h) }]
    if (it.shape === 'circle') {
      const r = Math.max(1, it.r ?? 2)
      return [{ ...it, x: slide(x - r, 2 * r + 1, SCENE_W, w) + r, y: slide(y - r, 2 * r + 1, SCENE_H, h) + r }]
    }
    if (it.shape === 'line')
      return [{ ...it, x: edge(x, sx), y: edge(y, sy), x2: edge(Math.round(it.x2 ?? x), sx), y2: edge(Math.round(it.y2 ?? y), sy) }]
    if (it.shape === 'tri')
      return [{ ...it, x: Math.round(x * sx), y: edge(y, sy), w: Math.max(1, Math.round(Math.max(1, it.w ?? 1) * sx)), h: Math.max(1, Math.round(Math.max(1, it.h ?? 1) * sy)) }]
    if (it.shape) {
      const x1 = x + Math.max(1, it.w ?? 1)
      const y1 = y + Math.max(1, it.h ?? 1)
      return [{ ...it, x: edge(x, sx), y: edge(y, sy), w: Math.max(1, edge(x1, sx) - edge(x, sx)), h: Math.max(1, edge(y1, sy) - edge(y, sy)) }]
    }
    return []
  })
  return paintItems(items, { w, h, px, stickers: [] })
}

/* the w x h of a painted scene from (x0, y0) */
function cropPainted(p: Painted, x0: number, y0: number, w: number, h: number): Painted {
  const px: number[] = []
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px.push(p.px[(y0 + y) * p.w + x0 + x] ?? 0)
  const stickers = p.stickers
    .map(st => ({ ...st, col: st.col - x0, row: st.row - y0 / 2 }))
    .filter(st => st.col >= 0 && st.col + 1 < w && st.row >= 0 && st.row < h / 2)
  return { w, h, px, stickers }
}

// ---------- the desktop's finer painting ----------

/** How many times finer the desktop paints a scene than the terminal. */
export const FINE_K = 4

/* a pixel nothing was painted on, in a part's own layer */
const CLEAR = -1

type Layer = { w: number; h: number; px: number[] }

/** Scale2x (EPX): doubles a layer and rounds its stair-step edges, so a part grows smoother, not blockier. */
function smooth2x(src: Layer): Layer {
  const w = src.w * 2
  const h = src.h * 2
  const px: number[] = new Array(w * h)
  const at = (x: number, y: number) => src.px[Math.min(src.h - 1, Math.max(0, y)) * src.w + Math.min(src.w - 1, Math.max(0, x))] ?? CLEAR
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const p = at(x, y)
      const up = at(x, y - 1)
      const right = at(x + 1, y)
      const left = at(x - 1, y)
      const down = at(x, y + 1)
      px[2 * y * w + 2 * x] = left === up && left !== down && up !== right ? up : p
      px[2 * y * w + 2 * x + 1] = up === right && up !== left && right !== down ? right : p
      px[(2 * y + 1) * w + 2 * x] = down === left && down !== right && left !== up ? left : p
      px[(2 * y + 1) * w + 2 * x + 1] = right === down && right !== up && down !== left ? down : p
    }
  return { w, h, px }
}

function blockUp(src: Layer, f: number): Layer {
  if (f <= 1) return src
  const w = src.w * f
  const h = src.h * f
  const px: number[] = new Array(w * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px[y * w + x] = src.px[Math.floor(y / f) * src.w + Math.floor(x / f)] ?? CLEAR
  return { w, h, px }
}

/** A kit part on its own see-through layer, recoloured and mirrored, with a clear pixel all round so its
    edges can round off against nothing. */
function partLayer(name: string, tint: string | undefined, flip: boolean | undefined): Layer | undefined {
  const rows = own(PARTS, name)
  if (!rows) return undefined
  const pw = Math.max(...rows.map(r => r.length))
  const w = pw + 2
  const h = rows.length + 2
  const px: number[] = new Array(w * h).fill(CLEAR)
  rows.forEach((row, ry) =>
    [...row].forEach((ch, rx) => {
      const inked = INK[ch]
      if (ch === '.' || !inked) return
      const col = flip ? pw - 1 - rx : rx
      px[(ry + 1) * w + col + 1] = tinted(hex(inked), tint)
    }),
  )
  return { w, h, px }
}

/* parts whose sharp corners are the point: smoothing melts a star into a blob and a trophy into a funnel,
   so these grow as crisp blocks */
const CRISP = new Set(['star', 'sparkle', 'arrowUp', 'arrowRight', 'puzzle', 'book', 'trophy', 'vs'])

/** The same recipe as paintScene, painted k times finer for a surface with pixels to spare. Parts of 48 pixels
    or more are smoothed twice; smaller ones (a coin, a sparkle) once, since two passes melt a glyph that small. */
export function paintSceneFine(spec: SceneSpec, k: number = FINE_K): Painted {
  const W = SCENE_W * k
  const H = SCENE_H * k
  /* the backdrop: painted on the canvas, then smoothed up like a part */
  const flat = paintScene({ bg: spec.bg, items: [] })
  let bg: Layer = { w: flat.w, h: flat.h, px: flat.px }
  for (let f = 1; f < k; f *= 2) bg = smooth2x(bg)
  bg = blockUp(bg, Math.round(W / bg.w))
  const px = bg.px.slice(0, W * H)
  const stickers: Painted['stickers'] = []
  const put = (x: number, y: number, c: number) => {
    if (c !== CLEAR && x >= 0 && y >= 0 && x < W && y < H) px[y * W + x] = c
  }
  const fill = (x0: number, y0: number, w: number, h: number, c: number) => {
    for (let y = Math.round(y0); y < Math.round(y0 + h); y++) for (let x = Math.round(x0); x < Math.round(x0 + w); x++) put(x, y, c)
  }
  const passesMax = Math.max(0, Math.round(Math.log2(k)))
  for (const it of spec.items.map(boundItem)) {
    const count = Math.max(1, Math.min(24, Math.round(it.count ?? 1)))
    let layer: Layer | undefined
    let pad = 0
    if (it.part) {
      const base = partLayer(it.part, it.tint, it.flip)
      if (!base) continue
      const scale = it.scale === 2 ? 2 : 1
      const big = (base.w - 2) * (base.h - 2) >= 48
      const passes = CRISP.has(it.part) ? 0 : Math.min(passesMax + (scale === 2 ? 1 : 0), big ? 2 : 1)
      layer = base
      for (let i = 0; i < passes; i++) layer = smooth2x(layer)
      const grown = 2 ** passes
      layer = blockUp(layer, Math.max(1, Math.round((k * scale) / grown)))
      /* the clear border pixel, grown with the part */
      pad = k * scale
    }
    for (let n = 0; n < count; n++) {
      const x = Math.round(it.x + n * (it.dx ?? 0))
      const y = Math.round(it.y + n * (it.dy ?? 0))
      if (layer) {
        const ox = x * k - pad
        const oy = y * k - pad
        for (let ly = 0; ly < layer.h; ly++) for (let lx = 0; lx < layer.w; lx++) put(ox + lx, oy + ly, layer.px[ly * layer.w + lx] ?? CLEAR)
      } else if (it.shape) {
        const c = colourOf(it.color) ?? hex('#ffffff')
        const w = Math.max(1, it.w ?? 1)
        const h = Math.max(1, it.h ?? 1)
        if (it.shape === 'rect') fill(x * k, y * k, w * k, h * k, c)
        else if (it.shape === 'frame') {
          fill(x * k, y * k, w * k, k, c)
          fill(x * k, (y + h - 1) * k, w * k, k, c)
          fill(x * k, y * k, k, h * k, c)
          fill((x + w - 1) * k, y * k, k, h * k, c)
        } else if (it.shape === 'circle') {
          const r = (Math.max(1, it.r ?? 2) + 0.5) * k
          const cx = x * k + k / 2
          const cy = y * k + k / 2
          for (let yy = Math.floor(cy - r); yy <= Math.ceil(cy + r); yy++)
            for (let xx = Math.floor(cx - r); xx <= Math.ceil(cx + r); xx++) if ((xx + 0.5 - cx) ** 2 + (yy + 0.5 - cy) ** 2 <= r * r) put(xx, yy, c)
        } else if (it.shape === 'tri') {
          const cx = x * k + k / 2
          for (let yy = 0; yy < h * k; yy++) {
            const half = ((yy + 1) / (h * k)) * ((w * k) / 2)
            for (let xx = Math.floor(cx - half); xx < Math.ceil(cx + half); xx++) put(xx, y * k + yy, c)
          }
        } else if (it.shape === 'line') {
          const x2 = Math.round(it.x2 ?? x)
          const y2 = Math.round(it.y2 ?? y)
          const steps = Math.max(Math.abs(x2 - x), Math.abs(y2 - y), 1) * k
          for (let i = 0; i <= steps; i++) fill(x * k + ((x2 - x) * k * i) / steps, y * k + ((y2 - y) * k * i) / steps, k, k, c)
        }
      } else if (it.emoji) {
        const col = Math.max(0, Math.min(SCENE_W - 2, x))
        const row = Math.max(0, Math.min(SCENE_H / 2 - 1, Math.floor(y / 2)))
        stickers.push({ emoji: it.emoji, col, row })
      }
    }
  }
  return { w: W, h: H, px, stickers, k }
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

/** The painted scene as the picture region's props: letter rows, each letter's colour, the stickers. */
export function sceneProps(p: Painted): { rows: string[]; palette: { [letter: string]: string }; stickers: { emoji: string; col: number; row: number }[] } {
  const seen = new Map<number, string>()
  const colours: number[] = []
  const letterOf = (c: number): string => {
    const hit = seen.get(c)
    if (hit) return hit
    if (colours.length < LETTERS.length) {
      const letter = LETTERS[colours.length] as string
      seen.set(c, letter)
      colours.push(c)
      return letter
    }
    /* past 62 colours: the nearest one already lettered */
    let best = 0
    let bestD = Infinity
    colours.forEach((k, i) => {
      const d = (((k >> 16) & 255) - ((c >> 16) & 255)) ** 2 + (((k >> 8) & 255) - ((c >> 8) & 255)) ** 2 + ((k & 255) - (c & 255)) ** 2
      if (d < bestD) { bestD = d; best = i }
    })
    return LETTERS[best] as string
  }
  const rows: string[] = []
  for (let y = 0; y < p.h; y++) {
    let row = ''
    for (let x = 0; x < p.w; x++) row += letterOf(p.px[y * p.w + x] ?? 0)
    rows.push(row)
  }
  const palette: { [letter: string]: string } = {}
  colours.forEach((c, i) => { palette[LETTERS[i] as string] = '#' + c.toString(16).padStart(6, '0') })
  return { rows, palette, stickers: p.stickers }
}

/** The painted scene as an SVG for surfaces that draw one (desktop, mobile). */
export function sceneSvg(p: Painted): string {
  /* one path per colour, a horizontal run per segment: a fine scene stays far under the element's size limit */
  const runs = new Map<number, string[]>()
  for (let y = 0; y < p.h; y++) {
    let x = 0
    while (x < p.w) {
      const c = p.px[y * p.w + x] ?? 0
      let n = 1
      while (x + n < p.w && p.px[y * p.w + x + n] === c) n += 1
      const list = runs.get(c) ?? []
      list.push(`M${x} ${y}h${n}v1h-${n}z`)
      runs.set(c, list)
      x += n
    }
  }
  let body = ''
  for (const [c, d] of runs) body += `<path fill="#${Math.max(0, c).toString(16).padStart(6, '0')}" d="${d.join('')}"/>`
  const k = p.k ?? 1
  for (const s of p.stickers) {
    const safe = s.emoji.replace(/[&<>"]/g, '')
    body += `<text x="${(s.col + 1) * k}" y="${(s.row * 2 + 1.8) * k}" font-size="${2.2 * k}" text-anchor="middle">${safe}</text>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${p.w} ${p.h}" shape-rendering="crispEdges">${body}</svg>`
}

/** The recipe as written in a gate, kept only when it is usable. */
export function readScene(raw: unknown): SceneSpec | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const o = raw as { [k: string]: unknown }
  const bg = typeof o.bg === 'string' ? o.bg : 'meadow'
  const items: SceneItem[] = []
  for (const r of Array.isArray(o.items) ? o.items.slice(0, 40) : []) {
    if (!r || typeof r !== 'object') continue
    const it = r as { [k: string]: unknown }
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)
    const str = (v: unknown) => (typeof v === 'string' ? v : undefined)
    const x = num(it.x)
    const y = num(it.y)
    if (x === undefined || y === undefined) continue
    const shape = str(it.shape)
    items.push(boundItem({
      x,
      y,
      ...(str(it.part) ? { part: str(it.part) } : {}),
      ...(shape && ['rect', 'frame', 'circle', 'line', 'tri'].includes(shape) ? { shape: shape as SceneItem['shape'] } : {}),
      ...(str(it.emoji) ? { emoji: str(it.emoji) } : {}),
      ...(num(it.w) !== undefined ? { w: num(it.w) } : {}),
      ...(num(it.h) !== undefined ? { h: num(it.h) } : {}),
      ...(num(it.x2) !== undefined ? { x2: num(it.x2) } : {}),
      ...(num(it.y2) !== undefined ? { y2: num(it.y2) } : {}),
      ...(num(it.r) !== undefined ? { r: num(it.r) } : {}),
      ...(str(it.color) ? { color: str(it.color) } : {}),
      ...(str(it.tint) ? { tint: str(it.tint) } : {}),
      ...(it.flip === true ? { flip: true } : {}),
      ...(num(it.scale) !== undefined ? { scale: num(it.scale) } : {}),
      ...(num(it.count) !== undefined ? { count: num(it.count) } : {}),
      ...(num(it.dx) !== undefined ? { dx: num(it.dx) } : {}),
      ...(num(it.dy) !== undefined ? { dy: num(it.dy) } : {}),
    }))
  }
  return { bg, items }
}
