import type { Outfit } from './types.ts'
import { dayRange, perceivedTemp } from './weather.ts'

export const TEMP_RANGE = 3

/** Dos días son parecidos si su mínima y su máxima difieren como mucho 2° (cada una por separado). */
export const DAY_RANGE = 2
export interface TempRange {
  min: number
  max: number
}
export const isSimilarRange = (a: TempRange, b: TempRange) =>
  Math.abs(a.min - b.min) <= DAY_RANGE && Math.abs(a.max - b.max) <= DAY_RANGE
export const rangeGap = (a: TempRange, b: TempRange) => Math.abs(a.min - b.min) + Math.abs(a.max - b.max)

/** Las estrellas cuentan menos si con ese outfit pasaste frío o calor. */
const score = (o: Outfit) => o.rating - (o.comfort === 'ok' ? 0 : 1)

/** Outfits de días con mínima y máxima parecidas a las de hoy; arriba los mejor valorados y donde estuviste a gusto. */
export function findSimilarDays(outfits: Outfit[], today: TempRange): Outfit[] {
  return outfits
    .filter((o) => o.weather && isSimilarRange(dayRange(o.weather), today))
    .sort((a, b) => {
      const byScore = score(b) - score(a)
      return byScore || rangeGap(dayRange(a.weather!), today) - rangeGap(dayRange(b.weather!), today)
    })
}

/** Outfits de días con sensación térmica media parecida (búsqueda manual por temperatura); arriba los mejor valorados y donde estuviste a gusto. */
export function findSimilar(outfits: Outfit[], temp: number, range = TEMP_RANGE): Outfit[] {
  return outfits
    .filter((o) => o.weather && Math.abs(perceivedTemp(o.weather) - temp) <= range)
    .sort((a, b) => {
      const byScore = score(b) - score(a)
      if (byScore) return byScore
      return (
        Math.abs(perceivedTemp(a.weather!) - temp) - Math.abs(perceivedTemp(b.weather!) - temp)
      )
    })
}
