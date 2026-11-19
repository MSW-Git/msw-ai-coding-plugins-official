// A card's pixel picture as a region the pointer can press. A Raster takes no
// press yet, so the terminal draws the scene here instead: each cell an '▀'
// whose foreground is the top pixel and background the bottom one, runs of
// equal cells drawn as one Text, and any emoji sticker in place of the two
// cells it covers. A left click inside posts { pick: true }; the hooks module
// (register.tsx, `ui.message`) picks the card it belongs to.

import type { ClientModule } from 'claude-code'

type Sticker = { emoji: string; col: number; row: number }
type PictureProps = { rows: string[]; palette: { [letter: string]: string }; stickers?: Sticker[] }

const Picture: ClientModule<PictureProps> = (props, surface) => {
  const { Box, Text } = surface.elements
  surface.onPointer(e => {
    const isInside = e.x >= 0 && e.y >= 0 && e.x < surface.columns && e.y < surface.rows
    if (e.type === 'up' && (e.button ?? 'left') === 'left' && isInside) surface.post({ pick: true })
  })
  const colour = (letter: string | undefined) => props.palette[letter ?? ''] ?? 'black'
  const lines = []
  for (let r = 0; r + 1 < props.rows.length; r += 2) {
    const top = props.rows[r] ?? ''
    const bottom = props.rows[r + 1] ?? ''
    const stickers = (props.stickers ?? []).filter(s => s.row === r / 2)
    const runs = []
    let c = 0
    while (c < top.length) {
      const sticker = stickers.find(s => s.col === c)
      if (sticker) {
        /* an emoji is two cells wide: it sits on the background of the cells it covers */
        runs.push(Text({ backgroundColor: colour(bottom[c]), children: sticker.emoji }))
        c += 2
        continue
      }
      const fg = colour(top[c])
      const bg = colour(bottom[c])
      let n = 1
      while (c + n < top.length && colour(top[c + n]) === fg && colour(bottom[c + n]) === bg && !stickers.some(s => s.col === c + n)) n += 1
      runs.push(Text({ color: fg, backgroundColor: bg, children: '▀'.repeat(n) }))
      c += n
    }
    lines.push(Text({ wrap: 'truncate', children: runs }))
  }
  return Box({ flexDirection: 'column', children: lines })
}

export default Picture
