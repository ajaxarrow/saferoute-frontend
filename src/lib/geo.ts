export type LonLat = [number, number]

const EARTH_RADIUS_MILES = 3958.8
const rad = (deg: number) => (deg * Math.PI) / 180

export function haversineMiles(a: LonLat, b: LonLat): number {
  const dLat = rad(b[1] - a[1])
  const dLon = rad(b[0] - a[0])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h))
}

/** Running distance in miles at each vertex (cum[0] = 0). */
export function cumulativeMiles(coords: LonLat[]): number[] {
  const cum = [0]
  for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + haversineMiles(coords[i - 1], coords[i]))
  return cum
}

/** The point `mile` miles along the line, clamped to its ends. */
export function pointAt(coords: LonLat[], cum: number[], mile: number): LonLat {
  const total = cum[cum.length - 1]
  if (mile <= 0) return coords[0]
  if (mile >= total) return coords[coords.length - 1]
  let lo = 0
  let hi = cum.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (cum[mid] <= mile) lo = mid
    else hi = mid
  }
  const span = cum[hi] - cum[lo]
  const t = span === 0 ? 0 : (mile - cum[lo]) / span
  return [coords[lo][0] + (coords[hi][0] - coords[lo][0]) * t, coords[lo][1] + (coords[hi][1] - coords[lo][1]) * t]
}

/** The part of the line between two mile marks, with interpolated end points. */
export function sliceByMiles(coords: LonLat[], cum: number[], from: number, to: number): LonLat[] {
  const out: LonLat[] = [pointAt(coords, cum, from)]
  for (let i = 0; i < coords.length; i++) if (cum[i] > from && cum[i] < to) out.push(coords[i])
  out.push(pointAt(coords, cum, to))
  return out
}
