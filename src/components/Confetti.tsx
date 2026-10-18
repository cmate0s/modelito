import type { CSSProperties } from 'react'
import { sticker, type StickerName } from '../lib/art.ts'

const PIECES: StickerName[] = ['star', 'heart', 'sparkle', 'sun', 'star', 'heart', 'sparkle', 'cloud', 'star', 'heart', 'sparkle', 'sun']

/** Ráfaga de pegatinas al guardar un modelito. `burst` cambia en cada disparo para reiniciar la animación. */
export function Confetti({ burst }: { burst: number | null }) {
  if (burst === null) return null
  return (
    <span className="confetti" key={burst} aria-hidden="true">
      {PIECES.map((name, i) => {
        const angle = ((-160 + (i * 140) / (PIECES.length - 1)) * Math.PI) / 180
        const dist = 120 + (i % 4) * 48
        return (
          <img
            key={i}
            className="confetti-piece"
            src={sticker(name)}
            alt=""
            style={
              {
                '--dx': `${Math.round(Math.cos(angle) * dist)}px`,
                '--dy': `${Math.round(Math.sin(angle) * dist)}px`,
                '--rot': `${(i % 2 ? 1 : -1) * (120 + i * 25)}deg`,
                '--delay': `${i * 28}ms`,
              } as CSSProperties
            }
          />
        )
      })}
    </span>
  )
}
