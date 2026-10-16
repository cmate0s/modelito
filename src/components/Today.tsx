import {
  CameraIcon,
  CrosshairIcon,
  DropIcon,
  ImagesIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  ThermometerIcon,
  WarningCircleIcon,
  WindIcon,
} from '@phosphor-icons/react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { saveOutfit } from '../lib/db.ts'
import { longToday } from '../lib/format.ts'
import { useObjectUrl } from '../lib/hooks.ts'
import { shrinkPhoto } from '../lib/image.ts'
import { useReveal } from '../lib/reveal.ts'
import { findSimilar } from '../lib/similar.ts'
import type { Comfort, Outfit, Place, WeatherSnapshot } from '../lib/types.ts'
import { fetchWeather, loadPlace, locate, perceivedTemp, savePlace, searchCity } from '../lib/weather.ts'
import { PageHeader } from './PageHeader.tsx'
import { ComfortPicker, Stars } from './Rating.tsx'
import { Thumb } from './Thumb.tsx'
import { WeatherIcon, WeatherLabel } from './WeatherIcon.tsx'

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
        setState({ status: 'error', message: 'No tengo tu ubicación. Elige tu ciudad.' })
        setChoosingCity(true)
      })
  }, [place, loadWeather])

  const pickPlace = (p: Place) => {
    savePlace(p)
    setPlace(p)
    setChoosingCity(false)
  }

  const weather = state.status === 'ready' ? state.weather : undefined
  const similar = weather ? findSimilar(outfits, perceivedTemp(weather)).slice(0, 8) : []

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
    setError('')
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
    } catch {
      setError('No se pudo guardar. Comprueba que queda espacio en el móvil.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <PageHeader title="Hoy" subtitle={longToday()} />

      <Reveal className="card weather">
        {state.status === 'loading' && <WeatherSkeleton />}
        {state.status === 'error' && (
          <p className="inline-error">
            <WarningCircleIcon size={20} weight="duotone" aria-hidden="true" />
            {state.message}
          </p>
        )}
        {weather && (
          <>
            <div className="weather-top">
              <div>
                <p className="weather-temp">{Math.round(weather.temp)}°</p>
                <p className="muted">
                  <WeatherLabel code={weather.code} /> · sensación {Math.round(weather.feelsLike)}°
                </p>
              </div>
              <span className="weather-glyph">
                <WeatherIcon code={weather.code} size={56} />
              </span>
            </div>
            <dl className="stats">
              <Stat icon={<ThermometerIcon size={16} weight="duotone" />} label="Sensación">
                {Math.round(weather.aMin ?? weather.tMin)}° a {Math.round(weather.aMax ?? weather.tMax)}°
              </Stat>
              {weather.humidity != null && (
                <Stat icon={<DropIcon size={16} weight="duotone" />} label="Humedad">
                  {Math.round(weather.humidity)}%
                </Stat>
              )}
              <Stat icon={<WindIcon size={16} weight="duotone" />} label="Viento">
                {Math.round(weather.wind)} km/h
              </Stat>
            </dl>
          </>
        )}
        <button
          className="place-btn"
          aria-expanded={choosingCity}
          onClick={() => setChoosingCity((v) => !v)}
        >
          <MapPinIcon size={16} weight="fill" aria-hidden="true" />
          {place?.name ?? 'Elegir ubicación'}
        </button>
        {choosingCity && (
          <CityPicker
            onPick={pickPlace}
            onLocate={() =>
              locate()
                .then(pickPlace)
                .catch(() => setState({ status: 'error', message: 'No se pudo obtener la ubicación.' }))
            }
          />
        )}
      </Reveal>

      {weather && similar.length > 0 && (
        <Reveal as="section" className="section">
          <div className="section-head">
            <h2>Días como hoy</h2>
            <span className="badge">media del día {Math.round(perceivedTemp(weather))}°</span>
          </div>
          <p className="muted small">Lo que te pusiste con una sensación parecida. Arriba, lo que mejor te funcionó.</p>
          <div className="strip">
            {similar.map((o, i) => (
              <Thumb key={o.id} outfit={o} index={i} onOpen={onOpen} />
            ))}
          </div>
        </Reveal>
      )}

      {outfits.length === 0 && (
        <Reveal as="section" className="card intro">
          <h2>Así funciona</h2>
          <ol className="steps">
            <li>
              <span className="step-n">1</span>
              <span>Haz una foto de lo que llevas. El tiempo del día se guarda solo.</span>
            </li>
            <li>
              <span className="step-n">2</span>
              <span>Valóralo y di si pasaste frío, calor o estuviste a gusto.</span>
            </li>
            <li>
              <span className="step-n">3</span>
              <span>Cuando vuelva a hacer un día parecido, aquí verás qué te pusiste.</span>
            </li>
          </ol>
        </Reveal>
      )}

      <Reveal as="section" className="card form">
        <h2>Tu modelito de hoy</h2>
        <div className="photo-slot">
          {photoUrl ? (
            <img src={photoUrl} alt="Vista previa del modelito" />
          ) : (
            <div className="photo-empty">
              <CameraIcon size={40} weight="duotone" aria-hidden="true" />
              <p>Añade una foto</p>
              <p className="muted small">Mejor de cuerpo entero, frente al espejo</p>
            </div>
          )}
        </div>
        <div className="row">
          <PhotoButton capture onFile={onPhoto}>
            <CameraIcon size={20} weight="bold" aria-hidden="true" />
            {photo ? 'Repetir' : 'Hacer foto'}
          </PhotoButton>
          <PhotoButton onFile={onPhoto}>
            <ImagesIcon size={20} weight="bold" aria-hidden="true" />
            Galería
          </PhotoButton>
        </div>

        <div className="field">
          <span className="label">Valoración</span>
          <Stars value={rating} onChange={setRating} />
        </div>
        <div className="field">
          <span className="label">¿Qué tal de temperatura?</span>
          <ComfortPicker value={comfort} onChange={setComfort} />
        </div>
        <div className="field">
          <label className="label" htmlFor="notes">
            Notas
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Prendas, ocasión, cómo te sentiste…"
            rows={2}
          />
        </div>
        {error && (
          <p className="inline-error" role="alert">
            <WarningCircleIcon size={20} weight="duotone" aria-hidden="true" />
            {error}
          </p>
        )}
        <button className="btn primary full" onClick={save} disabled={!photo || busy}>
          {busy ? 'Guardando…' : photo ? 'Guardar modelito' : 'Primero añade una foto'}
        </button>
      </Reveal>
    </div>
  )
}

function Reveal({
  as: Tag = 'div',
  className,
  children,
}: {
  as?: 'div' | 'section'
  className: string
  children: ReactNode
}) {
  const ref = useReveal<HTMLDivElement>()
  return (
    <Tag ref={ref} className={`${className} reveal`}>
      {children}
    </Tag>
  )
}

function Stat({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="stat">
      <dt>
        <span aria-hidden="true">{icon}</span>
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  )
}

function WeatherSkeleton() {
  return (
    <div className="weather-top" aria-label="Consultando el tiempo" role="status">
      <div className="skeleton-stack">
        <span className="skeleton" style={{ width: 120, height: 60 }} />
        <span className="skeleton" style={{ width: 160, height: 16 }} />
      </div>
      <span className="skeleton" style={{ width: 56, height: 56, borderRadius: 999 }} />
    </div>
  )
}

function PhotoButton({
  capture,
  onFile,
  children,
}: {
  capture?: boolean
  onFile: (f: File | undefined) => void
  children: ReactNode
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
        {children}
      </button>
    </>
  )
}

function CityPicker({ onPick, onLocate }: { onPick: (p: Place) => void; onLocate: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [msg, setMsg] = useState('')
  const [searching, setSearching] = useState(false)

  async function search(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) {
      setMsg('Escribe el nombre de una ciudad.')
      return
    }
    setSearching(true)
    try {
      const found = await searchCity(query.trim())
      setResults(found)
      setMsg(found.length ? '' : 'No encontré esa ciudad. Prueba con otro nombre.')
    } catch (err) {
      setMsg((err as Error).message)
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="city-picker">
      <form onSubmit={search} className="search">
        <MagnifyingGlassIcon size={20} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ciudad"
          aria-label="Buscar ciudad"
          enterKeyHint="search"
        />
        <button className="btn small" type="submit" disabled={searching}>
          {searching ? 'Buscando…' : 'Buscar'}
        </button>
      </form>
      {msg && <p className="muted small">{msg}</p>}
      {results.length > 0 && (
        <ul className="results">
          {results.map((p) => (
            <li key={`${p.lat},${p.lon}`}>
              <button onClick={() => onPick(p)}>
                <MapPinIcon size={16} weight="duotone" aria-hidden="true" />
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button className="btn ghost" onClick={onLocate}>
        <CrosshairIcon size={20} aria-hidden="true" />
        Usar mi ubicación
      </button>
    </div>
  )
}
