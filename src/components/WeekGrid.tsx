import { CaretRightIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { formatWeekRange, groupByWeek, SLOTS_PER_WEEK } from '../lib/weeks.ts'
import type { Outfit } from '../lib/types.ts'
import { Thumb } from './Thumb.tsx'
import { WeekSheet } from './WeekSheet.tsx'

/** Semanas (lunes a domingo) con las 3 mejores fotos de cada una; si hay menos, queda el hueco vacío. */
export function WeekGrid({
  outfits,
  onOpen,
}: {
  outfits: Outfit[]
  onOpen: (o: Outfit) => void
}) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const weeks = groupByWeek(outfits)
  const openWeek = weeks.find((w) => w.key === openKey)
  return (
    <div className="weeks">
      {weeks.map((week, wi) => (
        <section className="week" key={week.key}>
          <div className="week-head">
            <h3 className="week-label">{formatWeekRange(week.start, week.end)}</h3>
            {week.total > SLOTS_PER_WEEK ? (
              <button className="week-more" onClick={() => setOpenKey(week.key)}>
                Ver las {week.total} fotos
                <CaretRightIcon size={12} weight="bold" aria-hidden="true" />
              </button>
            ) : (
              <span className="badge">{week.total === 1 ? '1 foto' : `${week.total} fotos`}</span>
            )}
          </div>
          <div className="week-slots">
            {week.items.map((o, i) => (
              <Thumb key={o.id} outfit={o} index={wi * SLOTS_PER_WEEK + i} compact onOpen={onOpen} />
            ))}
            {Array.from({ length: SLOTS_PER_WEEK - week.items.length }, (_, i) => (
              <span className="week-slot" key={`empty-${i}`} aria-hidden="true" />
            ))}
          </div>
        </section>
      ))}
      {openWeek && <WeekSheet week={openWeek} onClose={() => setOpenKey(null)} onOpen={onOpen} />}
    </div>
  )
}
