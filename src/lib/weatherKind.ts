import type { WeatherKind } from './art.ts'

// Códigos WMO de Open-Meteo, agrupados por el máximo de cada tramo
const KINDS: [number, WeatherKind, string][] = [
  [0, 'clear', 'Despejado'],
  [2, 'partly', 'Poco nuboso'],
  [3, 'cloudy', 'Nublado'],
  [48, 'fog', 'Niebla'],
  [67, 'rain', 'Lluvia'],
  [77, 'snow', 'Nieve'],
  [82, 'showers', 'Chubascos'],
  [86, 'snow', 'Nevadas'],
  [99, 'storm', 'Tormenta'],
]

// Color de cada baldosa ilustrada: tiñe la tarjeta del tiempo para que haga juego
const TINT: Record<WeatherKind, string> = {
  clear: '#4fc3f7',
  partly: '#b79cf2',
  cloudy: '#ffd54a',
  fog: '#6fe0b5',
  rain: '#ff7a85',
  showers: '#ff9f43',
  snow: '#2bb5ae',
  storm: '#7b8fe0',
}

const find = (code: number) => KINDS.find(([max]) => code <= max) ?? KINDS[KINDS.length - 1]

export const weatherKind = (code: number): WeatherKind => find(code)[1]
export const weatherLabel = (code: number): string => find(code)[2]
export const weatherTint = (code: number): string => TINT[find(code)[1]]
