import { MagnifyingGlassIcon, StarIcon } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { findSimilar, TEMP_RANGE } from '../lib/similar.ts'
import type { Outfit } from '../lib/types.ts'
import { ImportPhotos } from './ImportPhotos.tsx'
import { LineArt } from './LineArt.tsx'
import { PageHeader } from './PageHeader.tsx'
import { WeekGrid } from './WeekGrid.tsx'

export function History({
  outfits,
  onOpen,
  onNew,
  onImported,
}: {
  outfits: Outfit[]
  onOpen: (o: Outfit) => void
  onNew: () => void
  onImported: (message: string) => void
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

  const count = outfits.length
  const subtitle = count === 1 ? '1 modelito' : `${count} modelitos`

  if (count === 0) {
    return (
      <div className="page">
        <PageHeader title="Historial" />
        <div className="empty-state">
          <LineArt name="sweater" className="empty-art" />
          <h2>Tu armario de días empieza hoy</h2>
          <p className="muted">Guarda tu primer modelito y aquí irás viendo todos, con el tiempo que hacía.</p>
          <button className="btn primary" onClick={onNew}>
            Registrar el de hoy
          </button>
          <p className="muted small">¿Ya tienes fotos de otros días? Cárgalas y se guardan con el tiempo que hizo.</p>
          <ImportPhotos outfits={outfits} onDone={onImported} />
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader title="Historial" subtitle={subtitle} />
      <ImportPhotos outfits={outfits} onDone={onImported} />
      <div className="filters">
        <label className="search">
          <MagnifyingGlassIcon size={20} weight="light" aria-hidden="true" />
          <input
            type="number"
            inputMode="decimal"
            value={temp}
            onChange={(e) => setTemp(e.target.value)}
            placeholder="Sensación térmica"
            aria-label={`Buscar por sensación térmica, más o menos ${TEMP_RANGE} grados`}
          />
          <span className="unit">°C</span>
        </label>
        <button
          className={topOnly ? 'chip on' : 'chip'}
          aria-pressed={topOnly}
          onClick={() => setTopOnly((v) => !v)}
        >
          <StarIcon size={16} weight="fill" aria-hidden="true" />4 o más
        </button>
      </div>
      {temp && <p className="muted small">Días con sensación entre {parseFloat(temp) - TEMP_RANGE}° y {parseFloat(temp) + TEMP_RANGE}°</p>}
      {shown.length === 0 ? (
        <div className="empty-state compact">
          <LineArt name="sunglasses" className="empty-art" />
          <p>Nada con esos filtros.</p>
          <button
            className="btn ghost"
            onClick={() => {
              setTemp('')
              setTopOnly(false)
            }}
          >
            Quitar filtros
          </button>
        </div>
      ) : (
        <WeekGrid outfits={shown} onOpen={onOpen} />
      )}
    </div>
  )
}
