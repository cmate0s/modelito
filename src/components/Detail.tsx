import { useState } from 'react'
import { deleteOutfit, saveOutfit } from '../lib/db.ts'
import { useObjectUrl } from '../lib/hooks.ts'
import type { Outfit } from '../lib/types.ts'
import { weatherIcon } from '../lib/weather.ts'
import { ComfortPicker, Stars } from './Rating.tsx'
import { formatDate } from './Thumb.tsx'

export function Detail({
  outfit,
  onClose,
  onChanged,
}: {
  outfit: Outfit
  onClose: () => void
  onChanged: () => void
}) {
  const url = useObjectUrl(outfit.photo)
  const [rating, setRating] = useState(outfit.rating)
  const [comfort, setComfort] = useState(outfit.comfort)
  const [notes, setNotes] = useState(outfit.notes)
  const w = outfit.weather
  const dirty = rating !== outfit.rating || comfort !== outfit.comfort || notes !== outfit.notes

  async function save() {
    await saveOutfit({ ...outfit, rating, comfort, notes })
    onChanged()
    onClose()
  }

  async function remove() {
    if (!confirm('¿Borrar este modelito?')) return
    await deleteOutfit(outfit.id)
    onChanged()
    onClose()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Detalle del modelito"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
        {url && <img className="sheet-photo" src={url} alt="Modelito" />}
        <h2>{formatDate(outfit.date)}</h2>
        {w && (
          <p className="weather-line">
            {weatherIcon(w.code)} sensación {Math.round(w.aMin ?? w.tMin)}° /{' '}
            {Math.round(w.aMax ?? w.tMax)}°
            {w.humidity != null && ` · humedad ${Math.round(w.humidity)}%`} · viento{' '}
            {Math.round(w.wind)} km/h
            {outfit.place && ` · ${outfit.place}`}
          </p>
        )}
        <Stars value={rating} onChange={setRating} />
        <ComfortPicker value={comfort} onChange={setComfort} />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas: qué prendas, qué tal te sentiste…"
          rows={3}
        />
        <div className="row">
          <button className="btn danger" onClick={remove}>
            Borrar
          </button>
          <button className="btn primary" onClick={save} disabled={!dirty}>
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  )
}
