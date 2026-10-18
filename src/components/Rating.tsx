import { StarIcon } from '@phosphor-icons/react'
import { feelArt } from '../lib/art.ts'
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
          <StarIcon size={38} weight="fill" />
        </button>
      ))}
    </div>
  )
}

/** La mascota con la cara de cada sensación: tiritando, a gusto o sudando. */
export function ComfortIcon({ comfort, size = 16 }: { comfort: Comfort; size?: number }) {
  return <img className="comfort-art" src={feelArt(comfort)} width={size} height={size} alt={COMFORT_LABEL[comfort]} />
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
          <ComfortIcon comfort={c} size={64} />
          {COMFORT_LABEL[c]}
        </button>
      ))}
    </div>
  )
}
