import { isoDate as iso } from './format.ts'
import { isSimilarRange, rangeGap, type TempRange } from './similar.ts'
import type { Place } from './types.ts'
import { daytimeRange } from './weather.ts'

export interface PastDay {
  date: string
  /** Sensación térmica mínima y máxima entre las 7 y las 19 h. */
  aMax: number
  aMin: number
  code: number
}

export const MAX_PAST_DAYS = 5
/** Primer día que se tiene en cuenta: desde ahí empiezan las galerías de quien usa la app. */
export const SINCE = '2026-01-01'

/** Días desde SINCE hasta ayer (tiempo real registrado, no previsión) en el lugar elegido. */
export async function fetchPastDays(place: Place, today = new Date()): Promise<PastDay[]> {
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  if (iso(yesterday) < SINCE) return []
  const params = new URLSearchParams({
    latitude: String(place.lat),
    longitude: String(place.lon),
    start_date: SINCE,
    end_date: iso(yesterday),
    daily: 'weather_code',
    hourly: 'apparent_temperature',
    timezone: 'auto',
  })
  const res = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`)
  if (!res.ok) throw new Error('No se pudo consultar los días anteriores')
  const d = await res.json()
  const range = daytimeRange(d.hourly.time, d.hourly.apparent_temperature)
  const out: PastDay[] = []
  for (let i = 0; i < d.daily.time.length; i++) {
    const r = range[d.daily.time[i]]
    if (r) out.push({ date: d.daily.time[i], aMin: r.min, aMax: r.max, code: d.daily.weather_code[i] ?? 0 })
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

/** Días desde SINCE con mínima y máxima parecidas a las de hoy; como mucho 5, los más cercanos a esta fecha del calendario. */
export function similarPastDays(days: PastDay[], today: TempRange, now = new Date()): PastDay[] {
  return days
    .filter((day) => isSimilarRange({ min: day.aMin, max: day.aMax }, today))
    .map((day) => ({ day, near: calendarDistance(day.date, now) }))
    .sort(
      (a, b) =>
        a.near - b.near ||
        rangeGap({ min: a.day.aMin, max: a.day.aMax }, today) - rangeGap({ min: b.day.aMin, max: b.day.aMax }, today),
    )
    .slice(0, MAX_PAST_DAYS)
    .map((x) => x.day)
    .sort((a, b) => a.date.localeCompare(b.date))
}
