import { FireIcon, SmileyIcon, SnowflakeIcon, StarIcon } from '@phosphor-icons/react'
import { COMFORT_LABEL } from '../lib/format.ts'
import type { Comfort } from '../lib/types.ts'

const COMFORT_ICON = { cold: SnowflakeIcon, ok: SmileyIcon, hot: FireIcon }
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
          <StarIcon key={n} size={size} weight="fill" className={n <= value ? 'on' : ''} />
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
          <StarIcon size={32} weight="fill" />
        </button>
      ))}
    </div>
  )
}

export function ComfortIcon({ comfort, size = 16 }: { comfort: Comfort; size?: number }) {
  const Glyph = COMFORT_ICON[comfort]
  return <Glyph size={size} weight="duotone" aria-label={COMFORT_LABEL[comfort]} />
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
      <span
        className="segmented-thumb"
        style={{ transform: `translateX(${COMFORTS.indexOf(value) * 100}%)` }}
        aria-hidden="true"
      />
      {COMFORTS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          className={value === c ? 'on' : ''}
          onClick={() => onChange(c)}
        >
          <ComfortIcon comfort={c} size={20} />
          {COMFORT_LABEL[c]}
        </button>
      ))}
    </div>
  )
}
