import type { CSSProperties } from 'react'
import { sticker, type StickerName } from '../lib/art.ts'

// Pegatinas que asoman por los bordes, detrás de las tarjetas. Fijas: el contenido se desliza por encima.
const DOODLES: { name: StickerName; top: string; side: 'left' | 'right'; size: number; rot: string; delay: string }[] = [
  { name: 'star', top: '13%', side: 'left', size: 64, rot: '-14deg', delay: '0s' },
  { name: 'hanger', top: '29%', side: 'right', size: 74, rot: '16deg', delay: '-2s' },
  { name: 'socks', top: '46%', side: 'left', size: 80, rot: '10deg', delay: '-4s' },
  { name: 'heart', top: '61%', side: 'right', size: 66, rot: '-12deg', delay: '-1s' },
  { name: 'cap', top: '76%', side: 'left', size: 84, rot: '-8deg', delay: '-3s' },
  { name: 'sparkle', top: '88%', side: 'right', size: 62, rot: '12deg', delay: '-5s' },
]

export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      {DOODLES.map(({ name, top, side, size, rot, delay }) => (
        <img
          key={name}
          className="doodle"
          src={sticker(name)}
          alt=""
          style={{ top, [side]: `-${Math.round(size * 0.42)}px`, '--size': `${size}px`, '--rot': rot, '--delay': delay } as CSSProperties}
        />
      ))}
    </div>
  )
}
