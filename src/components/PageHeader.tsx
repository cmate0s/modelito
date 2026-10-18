import { sticker, type StickerName } from '../lib/art.ts'

export function PageHeader({
  title,
  subtitle,
  decoration,
}: {
  title: string
  subtitle?: string
  /** Pegatina que asoma junto al título */
  decoration?: StickerName
}) {
  return (
    <header className="page-header">
      {subtitle && <p className="eyebrow">{subtitle}</p>}
      <h1 className="title">{title}</h1>
      {decoration && <img className="header-sticker" src={sticker(decoration)} alt="" aria-hidden="true" />}
    </header>
  )
}
