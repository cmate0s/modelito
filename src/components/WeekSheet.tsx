import { XIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatWeekRange, type WeekGroup } from '../lib/weeks.ts'
import { useBackEntry } from '../lib/backStack.ts'
import { lockScroll } from '../lib/scrollLock.ts'
import type { Outfit } from '../lib/types.ts'
import { Thumb } from './Thumb.tsx'

const EXIT_MS = 300

/** Todas las fotos de una semana, en una hoja que sube desde abajo. */
export function WeekSheet({ week, onClose, onOpen }: { week: WeekGroup; onClose: () => void; onOpen: (o: Outfit) => void }) {
  const [closing, setClosing] = useState(false)
  useBackEntry(true, () => setClosing(true))

  // deja terminar la animación de salida antes de desmontar
  useEffect(() => {
    if (!closing) return
    const t = setTimeout(onClose, EXIT_MS)
    return () => clearTimeout(t)
  }, [closing, onClose])

  useEffect(() => {
    const unlock = lockScroll()
    // con el detalle de una foto abierto encima, Escape cierra solo ese
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && document.querySelectorAll('.sheet').length === 1 && setClosing(true)
    window.addEventListener('keydown', onKey)
    return () => {
      unlock()
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const label = formatWeekRange(week.start, week.end)
  // en el body: dentro de una tarjeta con transform, «fixed» se calcularía respecto a ella
  return createPortal(
    <div className={`sheet-backdrop${closing ? ' closing' : ''}`} onClick={() => setClosing(true)}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={`Fotos de la semana ${label}`} onClick={(e) => e.stopPropagation()}>
        <span className="grabber" aria-hidden="true" />
        <div className="sheet-head week-sheet-head">
          <div>
            <p className="eyebrow">{week.total === 1 ? '1 foto' : `${week.total} fotos`}</p>
            <h2>{label}</h2>
          </div>
          <button className="icon-btn" onClick={() => setClosing(true)} aria-label="Cerrar" autoFocus>
            <XIcon size={20} weight="light" />
          </button>
        </div>
        <div className="week-slots">
          {week.all.map((o, i) => (
            <Thumb key={o.id} outfit={o} index={i} compact onOpen={onOpen} />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}
