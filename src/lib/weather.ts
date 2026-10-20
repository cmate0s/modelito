import type { Place, WeatherSnapshot } from './types.ts'

const PLACE_KEY = 'modelito.place'

export function loadPlace(): Place | null {
  try {
    return JSON.parse(localStorage.getItem(PLACE_KEY) ?? 'null')
  } catch {
    return null
  }
}

export function savePlace(place: Place) {
  try {
    localStorage.setItem(PLACE_KEY, JSON.stringify(place))
  } catch {
    // sin almacenamiento: se pedirá de nuevo
  }
}

export function locate(): Promise<Place> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Sin geolocalización'))
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, name: 'Mi ubicación' }),
      reject,
      { timeout: 10000, maximumAge: 600000 },
    )
  })
}

export async function searchCity(query: string): Promise<Place[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=es`
  const res = await fetch(url)
  if (!res.ok) throw new Error('No se pudo buscar la ciudad')
  const data = await res.json()
  return (data.results ?? []).map(
    (r: { latitude: number; longitude: number; name: string; admin1?: string }) => ({
      lat: r.latitude,
      lon: r.longitude,
      name: r.admin1 ? `${r.name}, ${r.admin1}` : r.name,
    }),
  )
}

export async function fetchWeather(place: Place): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: String(place.lat),
    longitude: String(place.lon),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min',
    hourly: 'apparent_temperature',
    timezone: 'auto',
    forecast_days: '1',
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!res.ok) throw new Error('No se pudo obtener el tiempo')
  const d = await res.json()
  const day = daytimeRange(d.hourly.time, d.hourly.apparent_temperature)[d.hourly.time[0].slice(0, 10)]
  return {
    temp: d.current.temperature_2m,
    feelsLike: d.current.apparent_temperature,
    tMax: d.daily.temperature_2m_max[0],
    tMin: d.daily.temperature_2m_min[0],
    wind: d.current.wind_speed_10m,
    precip: d.current.precipitation,
    code: d.current.weather_code,
    aMax: d.daily.apparent_temperature_max[0],
    aMin: d.daily.apparent_temperature_min[0],
    humidity: d.current.relative_humidity_2m,
    dMin: day?.min,
    dMax: day?.max,
  }
}

export const DAY_START = 7
export const DAY_END = 19

/** Mínima y máxima de la sensación térmica entre las 7 y las 19 h (hora local) de cada fecha de una serie horaria. */
export function daytimeRange(times: string[], values: (number | null)[]): Record<string, { min: number; max: number }> {
  const out: Record<string, { min: number; max: number }> = {}
  times.forEach((t, i) => {
    const v = values[i]
    const hour = Number(t.slice(11, 13))
    if (v == null || hour < DAY_START || hour > DAY_END) return
    const date = t.slice(0, 10)
    const r = out[date]
    if (!r) out[date] = { min: v, max: v }
    else {
      r.min = Math.min(r.min, v)
      r.max = Math.max(r.max, v)
    }
  })
  return out
}

/** Sensación térmica media del día; usa la temperatura normal si el modelito no guardó la sensación. */
/** Mínima y máxima que cuentan para comparar días: la de 7 a 19 h, o la del día entero si el modelito es antiguo. */
export const dayRange = (w: WeatherSnapshot) => ({
  min: w.dMin ?? w.aMin ?? w.tMin,
  max: w.dMax ?? w.aMax ?? w.tMax,
})

export const perceivedTemp = (w: WeatherSnapshot) =>
  ((w.aMax ?? w.tMax) + (w.aMin ?? w.tMin)) / 2
