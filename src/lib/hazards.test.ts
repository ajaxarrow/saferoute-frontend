import type { Checkpoint, PlannedRoute } from '@/api/types'
import type { RiskLevel } from './risk'
import { hazardStretches, routeShortName } from './hazards'

const cp = (index: number, risk: RiskLevel, wind = 5): Checkpoint => ({
  index,
  mile: index * 25,
  lat: 35,
  lon: -110,
  eta_utc: new Date(Date.UTC(2026, 11, 15, 12 + index)).toISOString(),
  tz: 'America/Denver',
  wind_mph: wind,
  rain_in_hr: 0,
  snow_in_hr: 0,
  risk,
  drivers: [],
})

const route = (levels: [RiskLevel, number?][]): PlannedRoute =>
  ({ id: 'route-1', label: 'Route 1', checkpoints: levels.map(([r, w], i) => cp(i, r, w)) }) as unknown as PlannedRoute

describe('hazardStretches', () => {
  it('groups consecutive Moderate-or-worse checkpoints into one stretch', () => {
    const stretches = hazardStretches(route([['LOW'], ['MODERATE', 28], ['HIGH', 38], ['LOW'], ['SEVERE', 50]]))
    expect(stretches).toHaveLength(2)
    const high = stretches.find((s) => s.worst === 'HIGH')
    expect(high).toMatchObject({ fromMile: 25, toMile: 50, maxWindMph: 38, firstIndex: 1 })
    expect(stretches.find((s) => s.worst === 'SEVERE')).toMatchObject({ fromMile: 100, toMile: 100, firstIndex: 4 })
  })

  it('carries the time window of the stretch', () => {
    const [s] = hazardStretches(route([['LOW'], ['HIGH'], ['HIGH']]))
    expect(s.startUtc).toBe(new Date(Date.UTC(2026, 11, 15, 13)).toISOString())
    expect(s.endUtc).toBe(new Date(Date.UTC(2026, 11, 15, 14)).toISOString())
    expect(s.tz).toBe('America/Denver')
  })

  it('is empty when the route is Low all the way', () => {
    expect(hazardStretches(route([['LOW'], ['LOW']]))).toEqual([])
  })

  it('lists the worst stretches first', () => {
    const stretches = hazardStretches(route([['MODERATE'], ['LOW'], ['NO_TRAVEL'], ['LOW'], ['HIGH']]))
    expect(stretches.map((s) => s.worst)).toEqual(['NO_TRAVEL', 'HIGH', 'MODERATE'])
  })
})

describe('routeShortName', () => {
  it('keeps just the road numbers from a long ORS summary', () => {
    expect(routeShortName('via Barstow Freeway / Mojave Freeway, I 15 and US 99 Hist')).toBe('I 15 · US 99')
  })

  it('falls back to the text without "via" when there are no road numbers', () => {
    expect(routeShortName('via Maple Street')).toBe('Maple Street')
  })

  it('handles an empty summary', () => {
    expect(routeShortName('')).toBe('')
  })
})
