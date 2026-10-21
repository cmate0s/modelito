import type { Comfort } from './types.ts'

export const COMFORT_LABEL: Record<Comfort, string> = {
  cold: 'Frío',
  ok: 'Perfecto',
  hot: 'Calor',
}

export function formatDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function longToday(): string {
  const s = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}
