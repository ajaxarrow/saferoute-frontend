import type { PlannedRoute } from '@/api/types'
import { compareRoutes } from './criteria'

const route = (id: string, o: { nt?: number; severe?: number; high?: number; avg?: number; minutes?: number }): PlannedRoute =>
  ({
    id,
    label: `Route ${id.slice(-1)}`,
    summary: {
      total_miles: 500,
      duration_s: (o.minutes ?? 600) * 60,
      avg_risk: o.avg ?? 0,
      worst: 'LOW',
      miles_by_level: { LOW: 0, MODERATE: 0, HIGH: o.high ?? 0, SEVERE: o.severe ?? 0, NO_TRAVEL: o.nt ?? 0 },
    },
  }) as unknown as PlannedRoute

const rowFor = (c: ReturnType<typeof compareRoutes>, key: string) => c.rows.find((r) => r.key === key)!

describe('compareRoutes', () => {
  it('checks Severe, High, average risk and time, in that order', () => {
    const c = compareRoutes([route('route-1', {}), route('route-2', {})], 'route-1')
    expect(c.rows.map((r) => r.key)).toEqual(['severe', 'high', 'avg', 'time'])
  })

  it('adds a No Travel row first only when some route has No Travel miles', () => {
    const c = compareRoutes([route('route-1', { nt: 40 }), route('route-2', {})], 'route-2')
    expect(c.rows[0].key).toBe('no_travel')
  })

  it('marks the best route in each row, counting 5-mile differences as ties', () => {
    const c = compareRoutes([route('route-1', { severe: 120, high: 10 }), route('route-2', { severe: 0, high: 12 }), route('route-3', { severe: 3, high: 40 })], 'route-2')
    expect(rowFor(c, 'severe').bestIds).toEqual(new Set(['route-2', 'route-3'])) // 0 and 3 mi are the same 5-mile bucket
    expect(rowFor(c, 'high').bestIds).toEqual(new Set(['route-1', 'route-2'])) // 10 and 12 mi: same bucket
  })

  it('says the first criterion that separates the winner from the rest decided it', () => {
    const severe = compareRoutes([route('route-1', { severe: 100 }), route('route-2', { severe: 0 })], 'route-2')
    expect(severe.decidedBy).toBe('severe')

    const time = compareRoutes([route('route-1', { minutes: 900 }), route('route-2', { minutes: 800 })], 'route-2')
    expect(time.decidedBy).toBe('time')

    const high = compareRoutes([route('route-1', { high: 90, minutes: 700 }), route('route-2', { high: 0, minutes: 900 })], 'route-2')
    expect(high.decidedBy).toBe('high')
  })

  it('has nothing to decide with a single route', () => {
    expect(compareRoutes([route('route-1', {})], 'route-1').decidedBy).toBeNull()
  })

  it('carries each route value for display', () => {
    const c = compareRoutes([route('route-1', { severe: 100.4, avg: 1.234, minutes: 125 })], 'route-1')
    expect(rowFor(c, 'severe').values['route-1']).toBe(100.4)
    expect(rowFor(c, 'time').values['route-1']).toBe(125 * 60)
  })
})
