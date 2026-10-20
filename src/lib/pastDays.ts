import type { Place } from './types.ts'

export interface PastDay {
  date: string
  /** Sensación térmica media, máxima y mínima del día. */
  feel: number
  aMax: number
  aMin: number
  code: number
}

export const MAX_PAST_DAYS = 5
const RANGE = 3

/** Primer día que se tiene en cuenta: desde ahí empiezan las galerías de quien usa la app. */
export const SINCE = '2026-01-01'

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Días desde SINCE hasta ayer (tiempo real registrado, no previsión) en el lugar elegido. */
export async function fetchPastDays(place: Place, today = new Date()): Promise<PastDay[]> {
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  if (iso(yesterday) < SINCE) return []
  const params = new URLSearchParams({
    latitude: String(place.lat),
    longitude: String(place.lon),
    start_date: SINCE,
    end_date: iso(yesterday),
    daily: 'apparent_temperature_max,apparent_temperature_min,weather_code',
    timezone: 'auto',
  })
  const res = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`)
  if (!res.ok) throw new Error('No se pudo consultar los días anteriores')
  const d = await res.json()
  const out: PastDay[] = []
  for (let i = 0; i < d.daily.time.length; i++) {
    const aMax = d.daily.apparent_temperature_max[i]
    const aMin = d.daily.apparent_temperature_min[i]
    if (aMax == null || aMin == null) continue
    out.push({ date: d.daily.time[i], aMax, aMin, feel: (aMax + aMin) / 2, code: d.daily.weather_code[i] ?? 0 })
  }
  return out
}

const dayOfYear = (month: number, day: number) => Math.round((Date.UTC(2001, month, day) - Date.UTC(2001, 0, 1)) / 864e5)

/** Distancia en días del calendario (circular) entre la fecha de un día pasado y la de hoy, sin contar el año. */
function calendarDistance(date: string, today: Date): number {
  const [, m, d] = date.split('-').map(Number)
  const diff = Math.abs(dayOfYear(m - 1, d) - dayOfYear(today.getMonth(), today.getDate()))
  return Math.min(diff, 365 - diff)
}

/** Días desde SINCE con sensación parecida a la de hoy; como mucho 5, los más cercanos a esta fecha del calendario. */
export function similarPastDays(days: PastDay[], feel: number, today = new Date()): PastDay[] {
  return days
    .filter((day) => Math.abs(day.feel - feel) <= RANGE)
    .map((day) => ({ day, near: calendarDistance(day.date, today) }))
    .sort((a, b) => a.near - b.near || Math.abs(a.day.feel - feel) - Math.abs(b.day.feel - feel))
    .slice(0, MAX_PAST_DAYS)
    .map((x) => x.day)
    .sort((a, b) => a.date.localeCompare(b.date))
}
