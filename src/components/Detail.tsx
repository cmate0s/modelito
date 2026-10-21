import { DropIcon, MapPinIcon, TrashIcon, WindIcon, XIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { deleteOutfit, saveOutfit } from '../lib/db.ts'
import { formatDate } from '../lib/format.ts'
import { useObjectUrl } from '../lib/hooks.ts'
import { lockScroll } from '../lib/scrollLock.ts'
import type { Outfit } from '../lib/types.ts'
import { dayRange } from '../lib/weather.ts'
import { ComfortPicker, Stars } from './Rating.tsx'
import { WeatherIcon, WeatherLabel } from './WeatherIcon.tsx'

const EXIT_MS = 400

export function Detail({
  outfit,
  onClose,
  onChanged,
}: {
  outfit: Outfit
  onClose: () => void
  onChanged: (message: string) => void
}) {
  const url = useObjectUrl(outfit.photo)
  const [rating, setRating] = useState(outfit.rating)
  const [comfort, setComfort] = useState(outfit.comfort)
  const [notes, setNotes] = useState(outfit.notes)
  const [confirming, setConfirming] = useState(false)
  const [closing, setClosing] = useState(false)
  const w = outfit.weather
  const dirty = rating !== outfit.rating || comfort !== outfit.comfort || notes !== outfit.notes

  const close = () => setClosing(true)

  // deja terminar la animación de salida antes de desmontar
  useEffect(() => {
    if (!closing) return
    const t = setTimeout(onClose, EXIT_MS)
    return () => clearTimeout(t)
  }, [closing, onClose])

  useEffect(() => {
    const unlock = lockScroll()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setClosing(true)
    window.addEventListener('keydown', onKey)
    return () => {
      unlock()
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  async function save() {
    await saveOutfit({ ...outfit, rating, comfort, notes })
    onChanged('Cambios guardados')
    close()
  }

  async function remove() {
    await deleteOutfit(outfit.id)
    onChanged('Modelito borrado')
    close()
  }

  return (
    <div className={`sheet-backdrop${closing ? ' closing' : ''}`} onClick={close}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Modelito del ${formatDate(outfit.date)}`}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="grabber" aria-hidden="true" />
        <div className="sheet-photo">
          {url ? <img src={url} alt="Modelito" /> : <span className="skeleton fill" />}
          <button className="icon-btn glass" onClick={close} aria-label="Cerrar" autoFocus>
            <XIcon size={20} weight="light" />
          </button>
        </div>

        <div className="sheet-head">
          <h2>{formatDate(outfit.date)}</h2>
          {outfit.place && (
            <span className="muted small place">
              <MapPinIcon size={14} weight="light" aria-hidden="true" />
              {outfit.place}
            </span>
          )}
        </div>

        {w && (
          <div className="weather-row">
            <span className="weather-glyph small">
              <WeatherIcon code={w.code} size={44} />
            </span>
            <div>
              <p className="strong">
                Se sentía de {Math.round(dayRange(w).min)}° a {Math.round(dayRange(w).max)}°{w.dMin != null && ' (7–19 h)'}
              </p>
              <p className="muted small">
                <WeatherLabel code={w.code} />
                {w.humidity != null && (
                  <>
                    {' · '}
                    <DropIcon size={12} weight="light" aria-hidden="true" /> {Math.round(w.humidity)}%
                  </>
                )}
                {' · '}
                <WindIcon size={12} weight="light" aria-hidden="true" /> {Math.round(w.wind)} km/h
              </p>
            </div>
          </div>
        )}

        <div className="field">
          <span className="label">Valoración</span>
          <Stars value={rating} onChange={setRating} />
        </div>
        <div className="field">
          <span className="label">¿Qué tal de temperatura?</span>
          <ComfortPicker value={comfort} onChange={setComfort} />
        </div>
        <div className="field">
          <label className="label" htmlFor="detail-notes">
            Notas
          </label>
          <textarea
            id="detail-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Prendas, ocasión, cómo te sentiste…"
            rows={3}
          />
        </div>

        {confirming ? (
          <div className="confirm" role="alertdialog" aria-label="Confirmar borrado">
            <p>¿Borrar este modelito? No se puede deshacer.</p>
            <div className="row">
              <button className="btn" onClick={() => setConfirming(false)} autoFocus>
                Cancelar
              </button>
              <button className="btn danger-solid" onClick={remove}>
                Sí, borrar
              </button>
            </div>
          </div>
        ) : (
          <div className="row">
            <button className="btn danger" onClick={() => setConfirming(true)}>
              <TrashIcon size={18} weight="light" aria-hidden="true" />
              Borrar
            </button>
            <button className="btn primary" onClick={save} disabled={!dirty}>
              Guardar cambios
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
