export type WeatherKind = 'clear' | 'partly' | 'cloudy' | 'fog' | 'rain' | 'showers' | 'snow' | 'storm'

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

const find = (code: number) => KINDS.find(([max]) => code <= max) ?? KINDS[KINDS.length - 1]

export const weatherKind = (code: number): WeatherKind => find(code)[1]
export const weatherLabel = (code: number): string => find(code)[2]
