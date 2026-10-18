import { weatherArt } from '../lib/art.ts'
import { weatherKind, weatherLabel } from '../lib/weatherKind.ts'

export function WeatherIcon({ code, size = 24 }: { code: number; size?: number }) {
  return <img className="weather-art" src={weatherArt(weatherKind(code))} width={size} height={size} alt="" />
}

export function WeatherLabel({ code }: { code: number }) {
  return <>{weatherLabel(code)}</>
}
