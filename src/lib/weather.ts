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
    current: 'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '1',
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!res.ok) throw new Error('No se pudo obtener el tiempo')
  const d = await res.json()
  return {
    temp: d.current.temperature_2m,
    feelsLike: d.current.apparent_temperature,
    tMax: d.daily.temperature_2m_max[0],
    tMin: d.daily.temperature_2m_min[0],
    wind: d.current.wind_speed_10m,
    precip: d.current.precipitation,
    code: d.current.weather_code,
  }
}

export function weatherIcon(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 2) return '🌤️'
  if (code === 3) return '☁️'
  if (code <= 48) return '🌫️'
  if (code <= 57) return '🌦️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌧️'
  if (code <= 86) return '🌨️'
  return '⛈️'
}

export const meanTemp = (w: WeatherSnapshot) => (w.tMax + w.tMin) / 2
