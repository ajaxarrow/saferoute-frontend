import type { Checkpoint, PlannedRoute } from '@/api/types'
import { cumulativeMiles, pointAt, type LonLat } from './geo'

export interface TruckState {
  /** Miles driven along the route at that hour. */
  mile: number
  /** 0–1 share of the route driven. */
  progress: number
  position: LonLat
  /** The checkpoint whose forecast the truck is driving through (nearest in time). */
  checkpoint: Checkpoint
  arrived: boolean
  /** The clock time of that hour, as an ISO instant. */
  timeIso: string
}

const HOUR_MS = 3_600_000
const cumulativeByGeometry = new WeakMap<object, number[]>()

function cumulative(route: PlannedRoute): number[] {
  let cum = cumulativeByGeometry.get(route.geometry)
  if (!cum) {
    cum = cumulativeMiles(route.geometry as LonLat[])
    cumulativeByGeometry.set(route.geometry, cum)
  }
  return cum
}

/** Where the truck is, and what weather it is in, `hour` hours after departure. */
export function truckAt(route: PlannedRoute, hour: number): TruckState {
  const stops = route.checkpoints
  const departure = new Date(stops[0].eta_utc).getTime()
  const now = departure + hour * HOUR_MS
  const timeIso = new Date(now).toISOString()
  const last = stops[stops.length - 1]
  const geometry = route.geometry as LonLat[]

  if (now >= new Date(last.eta_utc).getTime()) {
    return { mile: last.mile, progress: 1, position: geometry[geometry.length - 1], checkpoint: last, arrived: true, timeIso }
  }

  let next = stops.findIndex((c) => new Date(c.eta_utc).getTime() > now)
  if (next < 1) next = 1
  const a = stops[next - 1]
  const b = stops[next]
  const t0 = new Date(a.eta_utc).getTime()
  const t1 = new Date(b.eta_utc).getTime()
  const share = t1 === t0 ? 0 : (now - t0) / (t1 - t0)
  const mile = a.mile + (b.mile - a.mile) * share
  const progress = last.mile === 0 ? 0 : mile / last.mile

  const cum = cumulative(route)
  const position = pointAt(geometry, cum, progress * cum[cum.length - 1])
  const checkpoint = now - t0 <= t1 - now ? a : b
  return { mile, progress, position, checkpoint, arrived: false, timeIso }
}
