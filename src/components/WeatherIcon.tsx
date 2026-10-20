import {
  CloudFogIcon,
  CloudIcon,
  CloudLightningIcon,
  CloudRainIcon,
  CloudSnowIcon,
  CloudSunIcon,
  SunIcon,
  type Icon,
} from '@phosphor-icons/react'
import type { WeatherKind } from '../lib/weatherKind.ts'
import { weatherKind, weatherLabel } from '../lib/weatherKind.ts'

const GLYPH: Record<WeatherKind, Icon> = {
  clear: SunIcon,
  partly: CloudSunIcon,
  cloudy: CloudIcon,
  fog: CloudFogIcon,
  rain: CloudRainIcon,
  showers: CloudRainIcon,
  snow: CloudSnowIcon,
  storm: CloudLightningIcon,
}

export function WeatherIcon({ code, size = 24 }: { code: number; size?: number }) {
  const Glyph = GLYPH[weatherKind(code)]
  return <Glyph size={size} weight="thin" aria-hidden="true" />
}

export function WeatherLabel({ code }: { code: number }) {
  return <>{weatherLabel(code)}</>
}
