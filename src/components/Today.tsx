import { useCallback, useEffect, useRef, useState } from 'react'
import { saveOutfit } from '../lib/db.ts'
import { useObjectUrl } from '../lib/hooks.ts'
import { shrinkPhoto } from '../lib/image.ts'
import { findSimilar } from '../lib/similar.ts'
import type { Comfort, Outfit, Place, WeatherSnapshot } from '../lib/types.ts'
import {
  fetchWeather,
  loadPlace,
  locate,
  meanTemp,
  savePlace,
  searchCity,
  weatherIcon,
} from '../lib/weather.ts'
import { ComfortPicker, Stars } from './Rating.tsx'
import { Thumb } from './Thumb.tsx'

type WeatherState =
  | { status: 'loading' }
  | { status: 'ready'; weather: WeatherSnapshot }
  | { status: 'error'; message: string }

const todayISO = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function Today({
  outfits,
  onSaved,
  onOpen,
}: {
  outfits: Outfit[]
  onSaved: () => void
  onOpen: (o: Outfit) => void
}) {
  const [place, setPlace] = useState<Place | null>(loadPlace)
  const [state, setState] = useState<WeatherState>({ status: 'loading' })
  const [choosingCity, setChoosingCity] = useState(false)

  const [photo, setPhoto] = useState<Blob | null>(null)
  const [rating, setRating] = useState(0)
  const [comfort, setComfort] = useState<Comfort>('ok')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const photoUrl = useObjectUrl(photo)

  const loadWeather = useCallback(async (p: Place) => {
    setState({ status: 'loading' })
    try {
      setState({ status: 'ready', weather: await fetchWeather(p) })
    } catch (e) {
      setState({ status: 'error', message: (e as Error).message })
    }
  }, [])

  useEffect(() => {
    if (place) {
      loadWeather(place)
      return
    }
    locate()
      .then((p) => {
        savePlace(p)
        setPlace(p)
      })
      .catch(() => {
        setState({ status: 'error', message: 'No tengo tu ubicación' })
        setChoosingCity(true)
      })
  }, [place, loadWeather])

  const weather = state.status === 'ready' ? state.weather : undefined
  const similar = weather ? findSimilar(outfits, meanTemp(weather)).slice(0, 8) : []

  async function onPhoto(file: File | undefined) {
    if (!file) return
    setError('')
    try {
      setPhoto(await shrinkPhoto(file))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function save() {
    if (!photo) return
    setBusy(true)
    try {
      await saveOutfit({
        id: crypto.randomUUID(),
        date: todayISO(),
        createdAt: Date.now(),
        photo,
        weather,
        place: place?.name,
        rating: rating || 3,
        comfort,
        notes: notes.trim(),
      })
      setPhoto(null)
      setRating(0)
      setComfort('ok')
      setNotes('')
      onSaved()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <section className="card weather">
        {state.status === 'loading' && <p>Consultando el tiempo…</p>}
        {state.status === 'error' && <p>⚠️ {state.message}</p>}
        {weather && (
          <>
            <div className="weather-main">
              <span className="weather-icon">{weatherIcon(weather.code)}</span>
              <span className="weather-temp">{Math.round(weather.temp)}°</span>
              <span className="weather-sub">
                sensación {Math.round(weather.feelsLike)}°<br />
                {Math.round(weather.tMin)}° / {Math.round(weather.tMax)}° · viento{' '}
                {Math.round(weather.wind)} km/h
              </span>
            </div>
          </>
        )}
        <button className="link" onClick={() => setChoosingCity((v) => !v)}>
          📍 {place?.name ?? 'Elegir ubicación'}
        </button>
        {choosingCity && (
          <CityPicker
            onPick={(p) => {
              savePlace(p)
              setPlace(p)
              setChoosingCity(false)
            }}
            onLocate={() =>
              locate()
                .then((p) => {
                  savePlace(p)
                  setPlace(p)
                  setChoosingCity(false)
                })
                .catch(() => setError('No se pudo obtener la ubicación'))
            }
          />
        )}
      </section>

      {weather && similar.length > 0 && (
        <section>
          <h2>Días como hoy ({Math.round(meanTemp(weather))}°)</h2>
          <p className="hint">Lo que te pusiste con una temperatura parecida, lo mejor valorado primero.</p>
          <div className="strip">
            {similar.map((o) => (
              <Thumb key={o.id} outfit={o} onOpen={onOpen} />
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <h2>¿Qué llevas hoy?</h2>
        {photoUrl ? (
          <img className="preview" src={photoUrl} alt="Vista previa del modelito" />
        ) : (
          <div className="photo-empty">📸</div>
        )}
        <div className="row">
          <PhotoButton label="Hacer foto" capture onFile={onPhoto} />
          <PhotoButton label="Galería" onFile={onPhoto} />
        </div>

        <label className="field">Valoración</label>
        <Stars value={rating} onChange={setRating} />
        <label className="field">¿Qué tal de temperatura?</label>
        <ComfortPicker value={comfort} onChange={setComfort} />
        <label className="field" htmlFor="notes">
          Notas
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Prendas, ocasión, cómo te sentiste…"
          rows={2}
        />
        {error && <p className="error">{error}</p>}
        <button className="btn primary full" onClick={save} disabled={!photo || busy}>
          {busy ? 'Guardando…' : 'Guardar modelito'}
        </button>
      </section>
    </div>
  )
}

function PhotoButton({
  label,
  capture,
  onFile,
}: {
  label: string
  capture?: boolean
  onFile: (f: File | undefined) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture={capture ? 'user' : undefined}
        hidden
        onChange={(e) => {
          onFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <button className="btn" type="button" onClick={() => ref.current?.click()}>
        {label}
      </button>
    </>
  )
}

function CityPicker({
  onPick,
  onLocate,
}: {
  onPick: (p: Place) => void
  onLocate: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [msg, setMsg] = useState('')

  async function search(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    try {
      const found = await searchCity(query.trim())
      setResults(found)
      setMsg(found.length ? '' : 'Sin resultados')
    } catch (err) {
      setMsg((err as Error).message)
    }
  }

  return (
    <div className="city-picker">
      <button className="btn" onClick={onLocate}>
        Usar mi ubicación
      </button>
      <form onSubmit={search} className="row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ciudad"
          aria-label="Buscar ciudad"
        />
        <button className="btn" type="submit">
          Buscar
        </button>
      </form>
      {msg && <p className="hint">{msg}</p>}
      {results.map((p) => (
        <button key={`${p.lat},${p.lon}`} className="result" onClick={() => onPick(p)}>
          {p.name}
        </button>
      ))}
    </div>
  )
}
