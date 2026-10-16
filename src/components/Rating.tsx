import type { Comfort } from '../lib/types.ts'

export const COMFORT: Record<Comfort, { label: string; emoji: string }> = {
  cold: { label: 'Frío', emoji: '🥶' },
  ok: { label: 'Perfecto', emoji: '👌' },
  hot: { label: 'Calor', emoji: '🥵' },
}

export function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <div className="stars" role={onChange ? 'radiogroup' : undefined} aria-label="Valoración">
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} de 5`}
            className={n <= value ? 'on' : ''}
            onClick={() => onChange(n)}
          >
            ★
          </button>
        ) : (
          <span key={n} className={n <= value ? 'on' : ''}>
            ★
          </span>
        ),
      )}
    </div>
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
    <div className="chips" role="radiogroup" aria-label="Sensación térmica">
      {(Object.keys(COMFORT) as Comfort[]).map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          className={value === c ? 'chip on' : 'chip'}
          onClick={() => onChange(c)}
        >
          {COMFORT[c].emoji} {COMFORT[c].label}
        </button>
      ))}
    </div>
  )
}
