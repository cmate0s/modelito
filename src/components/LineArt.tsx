import type { CSSProperties } from 'react'
import { art, type ArtName } from '../lib/art.ts'

/** Boceto de línea fina; hereda el color del texto (tinta en claro, marfil en oscuro). */
export function LineArt({ name, className = '' }: { name: ArtName; className?: string }) {
  return <span className={`lineart ${className}`} style={{ '--art': `url(${art(name)})` } as CSSProperties} aria-hidden="true" />
}
