import type { CSSProperties } from 'react'
import { formatDate } from '../lib/format.ts'
import { useObjectUrl } from '../lib/hooks.ts'
import { useReveal } from '../lib/reveal.ts'
import type { Outfit } from '../lib/types.ts'
import { perceivedTemp } from '../lib/weather.ts'
import { ComfortIcon, Stars } from './Rating.tsx'

export function Thumb({
  outfit,
  index = 0,
  onOpen,
}: {
  outfit: Outfit
  index?: number
  onOpen: (o: Outfit) => void
}) {
  const url = useObjectUrl(outfit.photo)
  const ref = useReveal<HTMLButtonElement>()
  return (
    <button
      ref={ref}
      className="thumb reveal"
      style={{ '--delay': `${(index % 6) * 60}ms` } as CSSProperties}
      onClick={() => onOpen(outfit)}
    >
      <span className="thumb-img">
        {url ? (
          <img src={url} alt={`Modelito del ${formatDate(outfit.date)}`} loading="lazy" />
        ) : (
          <span className="skeleton fill" />
        )}
        {outfit.weather && (
          <span className="thumb-chip">
            {Math.round(perceivedTemp(outfit.weather))}°
            {outfit.comfort !== 'ok' && <ComfortIcon comfort={outfit.comfort} size={14} />}
          </span>
        )}
      </span>
      <span className="thumb-meta">
        <span className="thumb-date">{formatDate(outfit.date)}</span>
        <Stars value={outfit.rating} size={12} />
      </span>
    </button>
  )
}
