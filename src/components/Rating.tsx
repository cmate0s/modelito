import { StarIcon, ThermometerColdIcon, ThermometerHotIcon, ThermometerIcon, type Icon } from '@phosphor-icons/react'
import { COMFORT_LABEL } from '../lib/format.ts'
import type { Comfort } from '../lib/types.ts'

const COMFORTS: Comfort[] = ['cold', 'ok', 'hot']

export function Stars({
  value,
  onChange,
  size = 14,
}: {
  value: number
  onChange?: (n: number) => void
  size?: number
}) {
  if (!onChange) {
    return (
      <span className="stars" aria-label={`${value} de 5 estrellas`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <StarIcon key={n} size={size} weight={n <= value ? 'fill' : 'light'} className={n <= value ? 'on' : ''} />
        ))}
      </span>
    )
  }
  return (
    <div className="stars stars-input" role="radiogroup" aria-label="Valoración">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} de 5`}
          className={n <= value ? 'on' : ''}
          onClick={() => onChange(n)}
        >
          <StarIcon size={36} weight={n <= value ? 'fill' : 'light'} />
        </button>
      ))}
    </div>
  )
}

const COMFORT_GLYPH: Record<Comfort, Icon> = {
  cold: ThermometerColdIcon,
  ok: ThermometerIcon,
  hot: ThermometerHotIcon,
}

/** Termómetro de cada sensación: frío, a gusto o calor. Hereda el color del texto. */
export function ComfortIcon({ comfort, size = 16 }: { comfort: Comfort; size?: number }) {
  const Glyph = COMFORT_GLYPH[comfort]
  return (
    <span className="comfort-icon" role="img" aria-label={COMFORT_LABEL[comfort]}>
      <Glyph size={size} weight="light" />
    </span>
  )
}

export function ComfortPicker({
  value,
  onChange,
}: {
  value: Comfort
  onChange: (c: Comfort) => void
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label="Sensación térmica">
      {COMFORTS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          data-comfort={c}
          className={value === c ? 'on' : ''}
          onClick={() => onChange(c)}
        >
          <ComfortIcon comfort={c} size={30} />
          {COMFORT_LABEL[c]}
        </button>
      ))}
    </div>
  )
}
