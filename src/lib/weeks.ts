import type { Outfit } from './types.ts'

/** Fotos que se muestran por semana en el historial. */
export const SLOTS_PER_WEEK = 3

export interface WeekGroup {
  /** Lunes de la semana, en formato YYYY-MM-DD (clave estable). */
  key: string
  start: Date
  end: Date
  /** Las que se muestran (como mucho SLOTS_PER_WEEK). */
  items: Outfit[]
  /** Cuántas hay en realidad esa semana. */
  total: number
  /** Todas las de la semana, por fecha (para la hoja «ver todas»). */
  all: Outfit[]
}

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Lunes (00:00 local) de la semana a la que pertenece la fecha. */
export function weekStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const offset = (d.getDay() + 6) % 7 // lunes = 0
  d.setDate(d.getDate() - offset)
  return d
}

/**
 * Agrupa por semana (lunes a domingo). De cada semana se quedan las 3 mejores
 * valoradas (desempatando por la más reciente) y se muestran en orden cronológico.
 * Las semanas salen de la más nueva a la más antigua.
 */
export function groupByWeek(outfits: Outfit[]): WeekGroup[] {
  const groups = new Map<string, WeekGroup>()
  for (const outfit of outfits) {
    const day = new Date(`${outfit.date}T12:00:00`)
    const start = weekStart(day)
    const key = iso(start)
    let group = groups.get(key)
    if (!group) {
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      group = { key, start, end, items: [], total: 0, all: [] }
      groups.set(key, group)
    }
    group.items.push(outfit)
    group.total++
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      all: [...group.items].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt),
      items: [...group.items]
        .sort((a, b) => b.rating - a.rating || b.createdAt - a.createdAt)
        .slice(0, SLOTS_PER_WEEK)
        .sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .sort((a, b) => b.key.localeCompare(a.key))
}

/** Etiqueta de la semana: «12 – 18 oct 2026» o «29 sep – 5 oct 2026». */
export function formatWeekRange(start: Date, end: Date): string {
  const fmt = (d: Date, withYear: boolean) =>
    d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      ...(withYear ? { year: 'numeric' } : {}),
    })
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  const left = sameMonth ? start.toLocaleDateString('es-ES', { day: 'numeric' }) : fmt(start, false)
  return `${left} – ${fmt(end, true)}`
}
