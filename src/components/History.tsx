import { useMemo, useState } from 'react'
import { findSimilar, TEMP_RANGE } from '../lib/similar.ts'
import type { Outfit } from '../lib/types.ts'
import { Thumb } from './Thumb.tsx'

export function History({
  outfits,
  onOpen,
}: {
  outfits: Outfit[]
  onOpen: (o: Outfit) => void
}) {
  const [temp, setTemp] = useState('')
  const [topOnly, setTopOnly] = useState(false)

  const shown = useMemo(() => {
    let list = outfits
    const t = parseFloat(temp)
    if (!Number.isNaN(t)) list = findSimilar(list, t)
    if (topOnly) list = list.filter((o) => o.rating >= 4)
    return list
  }, [outfits, temp, topOnly])

  return (
    <div className="page">
      <div className="filters">
        <input
          type="number"
          inputMode="decimal"
          value={temp}
          onChange={(e) => setTemp(e.target.value)}
          placeholder={`Buscar por sensación térmica (±${TEMP_RANGE}°)`}
          aria-label="Buscar por sensación térmica media"
        />
        <button
          className={topOnly ? 'chip on' : 'chip'}
          aria-pressed={topOnly}
          onClick={() => setTopOnly((v) => !v)}
        >
          ★ 4+
        </button>
      </div>
      {outfits.length === 0 ? (
        <p className="empty">Todavía no has guardado ningún modelito. Empieza por la pestaña Hoy.</p>
      ) : shown.length === 0 ? (
        <p className="empty">Nada con esos filtros.</p>
      ) : (
        <div className="grid">
          {shown.map((o) => (
            <Thumb key={o.id} outfit={o} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  )
}
