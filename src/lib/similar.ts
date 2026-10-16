import type { Outfit } from './types.ts'
import { perceivedTemp } from './weather.ts'

export const TEMP_RANGE = 3

/** Las estrellas cuentan menos si con ese outfit pasaste frío o calor. */
const score = (o: Outfit) => o.rating - (o.comfort === 'ok' ? 0 : 1)

/** Outfits de días con sensación térmica parecida; arriba los mejor valorados y donde estuviste a gusto. */
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
