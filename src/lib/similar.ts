import type { Outfit } from './types.ts'
import { meanTemp } from './weather.ts'

export const TEMP_RANGE = 3

/** Outfits de días con temperatura media parecida, los mejor valorados primero. */
export function findSimilar(outfits: Outfit[], temp: number, range = TEMP_RANGE): Outfit[] {
  return outfits
    .filter((o) => o.weather && Math.abs(meanTemp(o.weather) - temp) <= range)
    .sort((a, b) => {
      const byRating = b.rating - a.rating
      if (byRating) return byRating
      return (
        Math.abs(meanTemp(a.weather!) - temp) - Math.abs(meanTemp(b.weather!) - temp)
      )
    })
}
