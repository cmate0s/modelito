export type Comfort = 'cold' | 'ok' | 'hot'

export interface WeatherSnapshot {
  temp: number
  feelsLike: number
  tMax: number
  tMin: number
  wind: number
  precip: number
  code: number
  /** Sensación térmica máxima/mínima del día y humedad; ausentes en modelitos antiguos. */
  aMax?: number
  aMin?: number
  /** Sensación térmica mínima y máxima entre las 7 y las 19 h; ausentes en modelitos anteriores. */
  dMin?: number
  dMax?: number
  humidity?: number
}

export interface Place {
  lat: number
  lon: number
  name: string
}

export interface Outfit {
  id: string
  date: string
  createdAt: number
  photo: Blob
  weather?: WeatherSnapshot
  place?: string
  rating: number
  comfort: Comfort
  notes: string
  /** Identifica la foto cargada desde la galería, para no cargarla dos veces. */
  importKey?: string
}
