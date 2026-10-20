import { saveOutfit } from './db.ts'
import { photoDate } from './exif.ts'
import { isoDate } from './format.ts'
import { shrinkPhoto } from './image.ts'
import type { Outfit, Place, WeatherSnapshot } from './types.ts'
import { daytimeRange } from './weather.ts'

export interface ImportResult {
  added: number
  duplicates: number
  withoutWeather: number
}

const keyOf = (f: File) => `${f.name}|${f.size}|${f.lastModified}`

/** Tiempo real registrado de varios días (ayer como máximo: el histórico no llega más cerca). */
async function fetchSnapshots(place: Place, dates: string[]): Promise<Record<string, WeatherSnapshot>> {
  const now = new Date()
  const yesterday = isoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))
  const usable = dates.filter((d) => d <= yesterday).sort()
  if (usable.length === 0) return {}
  const params = new URLSearchParams({
    latitude: String(place.lat),
    longitude: String(place.lon),
    start_date: usable[0],
    end_date: usable[usable.length - 1],
    daily:
      'temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,weather_code,wind_speed_10m_max,precipitation_sum',
    hourly: 'apparent_temperature',
    timezone: 'auto',
  })
  const res = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`)
  if (!res.ok) throw new Error('No se pudo consultar el tiempo de esos días. Comprueba la conexión.')
  const d = await res.json()
  const day = daytimeRange(d.hourly.time, d.hourly.apparent_temperature)
  const out: Record<string, WeatherSnapshot> = {}
  d.daily.time.forEach((date: string, i: number) => {
    const tMax = d.daily.temperature_2m_max[i]
    const tMin = d.daily.temperature_2m_min[i]
    if (tMax == null || tMin == null) return
    const aMax = d.daily.apparent_temperature_max[i] ?? tMax
    const aMin = d.daily.apparent_temperature_min[i] ?? tMin
    out[date] = {
      temp: (tMax + tMin) / 2,
      feelsLike: (aMax + aMin) / 2,
      tMax,
      tMin,
      aMax,
      aMin,
      dMin: day[date]?.min,
      dMax: day[date]?.max,
      wind: d.daily.wind_speed_10m_max[i] ?? 0,
      precip: d.daily.precipitation_sum[i] ?? 0,
      code: d.daily.weather_code[i] ?? 0,
    }
  })
  return out
}

/**
 * Crea un modelito por foto, con la fecha en que se hizo y el tiempo que hizo ese día en `place`.
 * Las fotos ya cargadas antes (mismo nombre, tamaño y fecha) se saltan.
 */
export async function importPhotos(
  files: File[],
  place: Place,
  existing: Outfit[],
  onProgress: (done: number, total: number) => void,
): Promise<ImportResult> {
  const known = new Set(existing.map((o) => o.importKey).filter(Boolean))
  const fresh = files.filter((f) => f.type.startsWith('image/') && !known.has(keyOf(f)))
  const result: ImportResult = { added: 0, duplicates: files.length - fresh.length, withoutWeather: 0 }
  if (fresh.length === 0) return result

  const taken = await Promise.all(fresh.map((f) => photoDate(f)))
  const weather = await fetchSnapshots(place, [...new Set(taken.map(isoDate))])

  for (let i = 0; i < fresh.length; i++) {
    onProgress(i, fresh.length)
    const date = isoDate(taken[i])
    await saveOutfit({
      id: crypto.randomUUID(),
      date,
      createdAt: taken[i].getTime(),
      photo: await shrinkPhoto(fresh[i]),
      weather: weather[date],
      place: place.name,
      rating: 3,
      comfort: 'ok',
      notes: '',
      importKey: keyOf(fresh[i]),
    })
    result.added++
    if (!weather[date]) result.withoutWeather++
  }
  onProgress(fresh.length, fresh.length)
  return result
}
