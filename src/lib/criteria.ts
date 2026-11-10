import type { PlannedRoute } from '@/api/types'

/** Mirrors RECOMMEND_BUCKET_MILES on the server: mile counts within one bucket are a tie. */
export const BUCKET_MILES = 5

export type CriterionKey = 'no_travel' | 'severe' | 'high' | 'avg' | 'time'

export interface CriterionRow {
  key: CriterionKey
  label: string
  /** Raw value per route id: miles, 0–4 average risk, or seconds. */
  values: Record<string, number>
  /** Routes that are best in this row once ties are applied. */
  bestIds: Set<string>
}

export interface Comparison {
  rows: CriterionRow[]
  /** The first criterion that put the recommended route ahead, or null when nothing needed deciding. */
  decidedBy: CriterionKey | null
}

interface Definition {
  key: CriterionKey
  label: string
  value: (r: PlannedRoute) => number
  /** What routes are compared on: lower is better. */
  rank: (value: number) => number
}

const miles = (level: 'NO_TRAVEL' | 'SEVERE' | 'HIGH') => (r: PlannedRoute) => r.summary.miles_by_level[level]
const bucketed = (value: number) => Math.floor(value / BUCKET_MILES)

const NO_TRAVEL: Definition = { key: 'no_travel', label: 'No Travel miles', value: miles('NO_TRAVEL'), rank: bucketed }
const CRITERIA: Definition[] = [
  { key: 'severe', label: 'Severe miles', value: miles('SEVERE'), rank: bucketed },
  { key: 'high', label: 'High miles', value: miles('HIGH'), rank: bucketed },
  { key: 'avg', label: 'Average risk', value: (r) => r.summary.avg_risk, rank: (v) => Math.round(v * 10) / 10 },
  { key: 'time', label: 'Travel time', value: (r) => r.summary.duration_s, rank: (v) => v },
]

/**
 * The ranking the server applies, laid out per route: fewest Severe miles, then fewest High miles, then lowest
 * average risk, then shortest time. No Travel miles come first when any route has them, because those rule a route out.
 */
export function compareRoutes(routes: PlannedRoute[], recommendedId: string): Comparison {
  const anyNoTravel = routes.some((r) => r.summary.miles_by_level.NO_TRAVEL > 0)
  const definitions = anyNoTravel ? [NO_TRAVEL, ...CRITERIA] : CRITERIA

  let remaining = routes
  let decidedBy: CriterionKey | null = null
  const rows = definitions.map((d) => {
    const values = Object.fromEntries(routes.map((r) => [r.id, d.value(r)]))
    const best = Math.min(...routes.map((r) => d.rank(d.value(r))))
    const bestIds = new Set(routes.filter((r) => d.rank(d.value(r)) === best).map((r) => r.id))

    const bestAmongRemaining = Math.min(...remaining.map((r) => d.rank(d.value(r))))
    const narrowed = remaining.filter((r) => d.rank(d.value(r)) === bestAmongRemaining)
    if (decidedBy === null && narrowed.length < remaining.length && narrowed.some((r) => r.id === recommendedId)) decidedBy = d.key
    remaining = narrowed
    return { key: d.key, label: d.label, values, bestIds }
  })
  return { rows, decidedBy }
}
