import type { PlannedRoute } from '@/api/types'
import { RISK, type RiskLevel } from './risk'

export interface HazardStretch {
  fromMile: number
  toMile: number
  worst: RiskLevel
  maxWindMph: number
  maxRainInHr: number
  maxSnowInHr: number
  startUtc: string
  endUtc: string
  tz: string
  /** Checkpoint index to focus on the map. */
  firstIndex: number
}

/** Runs of consecutive Moderate-or-worse checkpoints, worst first. The driver's "where will it be rough" list. */
export function hazardStretches(route: PlannedRoute): HazardStretch[] {
  const stretches: HazardStretch[] = []
  let current: HazardStretch | null = null

  for (const c of route.checkpoints) {
    if (RISK[c.risk].rank < RISK.MODERATE.rank) {
      current = null
      continue
    }
    if (!current) {
      current = {
        fromMile: c.mile,
        toMile: c.mile,
        worst: c.risk,
        maxWindMph: c.wind_mph,
        maxRainInHr: c.rain_in_hr,
        maxSnowInHr: c.snow_in_hr,
        startUtc: c.eta_utc,
        endUtc: c.eta_utc,
        tz: c.tz,
        firstIndex: c.index,
      }
      stretches.push(current)
      continue
    }
    current.toMile = c.mile
    current.endUtc = c.eta_utc
    current.maxWindMph = Math.max(current.maxWindMph, c.wind_mph)
    current.maxRainInHr = Math.max(current.maxRainInHr, c.rain_in_hr)
    current.maxSnowInHr = Math.max(current.maxSnowInHr, c.snow_in_hr)
    if (RISK[c.risk].rank > RISK[current.worst].rank) current.worst = c.risk
  }
  return stretches.sort((a, b) => RISK[b.worst].rank - RISK[a.worst].rank || a.fromMile - b.fromMile)
}

const ROAD_NUMBER = /\b(?:I|US|SR|[A-Z]{2})[ -]\d+[A-Z]?\b/g

/** "via Barstow Freeway, I 15 and US 99 Hist" → "I 15 · US 99": what a driver recognises a route by. */
export function routeShortName(via: string): string {
  const roads = [...new Set(via.match(ROAD_NUMBER) ?? [])].slice(0, 3)
  return roads.length ? roads.join(' · ') : via.replace(/^via\s+/i, '')
}
