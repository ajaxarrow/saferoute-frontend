import sample from '@/api/fixtures/plan.sample.json'
import type { PlanResponse, PlannedRoute } from '@/api/types'
import { truckAt } from './journey'

const plan = sample as unknown as PlanResponse
const route: PlannedRoute = plan.routes[0]
const first = route.checkpoints[0]
const last = route.checkpoints[route.checkpoints.length - 1]
const hoursBetween = (a: string, b: string) => (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000

describe('truckAt', () => {
  it('starts at mile 0 at the first checkpoint', () => {
    const t = truckAt(route, 0)
    expect(t.mile).toBe(0)
    expect(t.progress).toBe(0)
    expect(t.arrived).toBe(false)
    expect(t.checkpoint.index).toBe(first.index)
    expect(t.position).toEqual(route.geometry[0])
  })

  it('moves forward with time and stays on the route', () => {
    const a = truckAt(route, 2)
    const b = truckAt(route, 6)
    expect(b.mile).toBeGreaterThan(a.mile)
    expect(b.progress).toBeGreaterThan(a.progress)
    expect(a.progress).toBeGreaterThan(0)
    expect(a.progress).toBeLessThan(1)
  })

  it('interpolates the mile between the two checkpoints around that time', () => {
    const [c0, c1] = [route.checkpoints[1], route.checkpoints[2]]
    const mid = (hoursBetween(first.eta_utc, c0.eta_utc) + hoursBetween(first.eta_utc, c1.eta_utc)) / 2
    const t = truckAt(route, mid)
    expect(t.mile).toBeGreaterThan(c0.mile)
    expect(t.mile).toBeLessThan(c1.mile)
    expect(t.mile).toBeCloseTo((c0.mile + c1.mile) / 2, 0)
  })

  it('uses the weather of the nearest checkpoint in time', () => {
    const c = route.checkpoints[3]
    const t = truckAt(route, hoursBetween(first.eta_utc, c.eta_utc))
    expect(t.checkpoint.index).toBe(c.index)
  })

  it('parks at the destination after arrival', () => {
    const t = truckAt(route, 48)
    expect(t.arrived).toBe(true)
    expect(t.progress).toBe(1)
    expect(t.mile).toBe(last.mile)
    expect(t.checkpoint.index).toBe(last.index)
    expect(t.position).toEqual(route.geometry[route.geometry.length - 1])
  })

  it('reports the clock time of the hour', () => {
    expect(truckAt(route, 3).timeIso).toBe(new Date(new Date(first.eta_utc).getTime() + 3 * 3_600_000).toISOString())
  })
})
