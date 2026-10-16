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

// Códigos WMO de Open-Meteo, agrupados por el máximo de cada tramo
const KINDS: [number, Icon, string][] = [
  [0, SunIcon, 'Despejado'],
  [2, CloudSunIcon, 'Poco nuboso'],
  [3, CloudIcon, 'Nublado'],
  [48, CloudFogIcon, 'Niebla'],
  [67, CloudRainIcon, 'Lluvia'],
  [77, CloudSnowIcon, 'Nieve'],
  [82, CloudRainIcon, 'Chubascos'],
  [86, CloudSnowIcon, 'Nevadas'],
  [99, CloudLightningIcon, 'Tormenta'],
]

const kind = (code: number) => KINDS.find(([max]) => code <= max) ?? KINDS[KINDS.length - 1]

export function WeatherIcon({ code, size = 24 }: { code: number; size?: number }) {
  const [, Glyph] = kind(code)
  return <Glyph size={size} weight="duotone" aria-hidden="true" />
}

export function WeatherLabel({ code }: { code: number }) {
  return <>{kind(code)[2]}</>
}
