import { useObjectUrl } from '../lib/hooks.ts'
import type { Outfit } from '../lib/types.ts'
import { meanTemp } from '../lib/weather.ts'
import { Stars } from './Rating.tsx'

export function formatDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function Thumb({ outfit, onOpen }: { outfit: Outfit; onOpen: (o: Outfit) => void }) {
  const url = useObjectUrl(outfit.photo)
  return (
    <button className="thumb" onClick={() => onOpen(outfit)}>
      {url && <img src={url} alt={`Outfit del ${formatDate(outfit.date)}`} loading="lazy" />}
      <span className="thumb-meta">
        <span>
          {formatDate(outfit.date)}
          {outfit.weather && ` · ${Math.round(meanTemp(outfit.weather))}°`}
        </span>
        <Stars value={outfit.rating} />
      </span>
    </button>
  )
}
