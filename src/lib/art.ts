import type { Comfort } from './types.ts'

// Ilustraciones generadas en Google Flow y recortadas por design/build-assets.py.
const files = import.meta.glob('../assets/**/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const asset = (folder: string, name: string) => files[`../assets/${folder}/${name}.webp`] ?? ''

export type ArtName = 'hoy' | 'historial' | 'paso-foto' | 'paso-tiempo' | 'paso-valora' | 'bienvenida'
export type StickerName =
  | 'hanger'
  | 'socks'
  | 'cap'
  | 'umbrella'
  | 'sun'
  | 'heart'
  | 'star'
  | 'sparkle'
  | 'sneaker'
  | 'sunglasses'
  | 'scarf'
  | 'cloud'
export type WeatherKind = 'clear' | 'partly' | 'cloudy' | 'fog' | 'rain' | 'showers' | 'snow' | 'storm'

export const art = (name: ArtName) => asset('art', name)
export const sticker = (name: StickerName) => asset('stickers', name)
export const weatherArt = (kind: WeatherKind) => asset('weather', kind)
export const feelArt = (comfort: Comfort) => asset('feel', comfort)
