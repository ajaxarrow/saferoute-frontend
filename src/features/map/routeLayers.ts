import type { Feature, FeatureCollection, LineString, Point } from 'geojson'
import type { PlanResponse, PlannedRoute, RoutePreview } from '@/api/types'
import { cumulativeMiles, sliceByMiles, type LonLat } from '@/lib/geo'
import { RISK, type RiskLevel } from '@/lib/risk'

export interface RouteProps {
  id: string
  label: string
  isRecommended: boolean
  isSelected: boolean
}

export function routesToGeoJSON(plan: PlanResponse, selectedId: string): FeatureCollection<LineString, RouteProps> {
  return {
    type: 'FeatureCollection',
    features: plan.routes.map((r) => ({
      type: 'Feature',
      properties: {
        id: r.id,
        label: r.label,
        isRecommended: r.id === plan.recommended_route_id,
        isSelected: r.id === selectedId,
      },
      geometry: { type: 'LineString', coordinates: r.geometry },
    })),
  }
}

export interface CheckpointProps {
  routeId: string
  index: number
  risk: RiskLevel
  color: string
  severe: boolean
}

export function checkpointsToGeoJSON(route: PlannedRoute): FeatureCollection<Point, CheckpointProps> {
  return {
    type: 'FeatureCollection',
    features: route.checkpoints.map((c) => ({
      type: 'Feature',
      properties: {
        routeId: route.id,
        index: c.index,
        risk: c.risk,
        color: RISK[c.risk].color,
        severe: RISK[c.risk].rank >= RISK.SEVERE.rank,
      },
      geometry: { type: 'Point', coordinates: [c.lon, c.lat] },
    })),
  }
}

export interface RiskSegmentProps {
  risk: RiskLevel
  color: string
}

export interface RiskRange {
  risk: RiskLevel
  /** Route miles. */
  from: number
  to: number
}

/**
 * The route cut into stretches by risk, in route miles. Each checkpoint owns the road halfway to its
 * neighbours (the same rule the server uses for risk miles); equal neighbours are merged.
 */
export function riskRanges(route: PlannedRoute): RiskRange[] {
  const marks = route.checkpoints.map((c) => c.mile)
  const bounds = [0, ...marks.slice(1).map((m, i) => (marks[i] + m) / 2), route.summary.total_miles]
  const spans: RiskRange[] = []
  route.checkpoints.forEach((c, i) => {
    const last = spans[spans.length - 1]
    if (last && last.risk === c.risk) last.to = bounds[i + 1]
    else spans.push({ risk: c.risk, from: bounds[i], to: bounds[i + 1] })
  })
  return spans
}

/** The selected route as line stretches coloured by risk, for the map. */
export function riskSegments(route: PlannedRoute): Feature<LineString, RiskSegmentProps>[] {
  const coords = route.geometry as LonLat[]
  const cum = cumulativeMiles(coords)
  const lineMiles = cum[cum.length - 1]
  const scale = route.summary.total_miles > 0 ? lineMiles / route.summary.total_miles : 1

  return riskRanges(route).map((s) => ({
    type: 'Feature',
    properties: { risk: s.risk, color: RISK[s.risk].color },
    geometry: { type: 'LineString', coordinates: sliceByMiles(coords, cum, s.from * scale, s.to * scale) },
  }))
}

export function boundsOfPoints(points: Iterable<LonLat>): [[number, number], [number, number]] {
  let w = Infinity
  let s = Infinity
  let e = -Infinity
  let n = -Infinity
  for (const [lon, lat] of points) {
    w = Math.min(w, lon)
    e = Math.max(e, lon)
    s = Math.min(s, lat)
    n = Math.max(n, lat)
  }
  return [
    [w, s],
    [e, n],
  ]
}

export function boundsOf(plan: PlanResponse): [[number, number], [number, number]] {
  return boundsOfPoints(plan.routes.flatMap((r) => r.geometry))
}

export interface PreviewProps {
  id: string
  /** 0 = fastest. */
  rank: number
}

export function previewToGeoJSON(routes: RoutePreview[]): FeatureCollection<LineString, PreviewProps> {
  return {
    type: 'FeatureCollection',
    features: routes.map((r, rank) => ({
      type: 'Feature',
      properties: { id: r.id, rank },
      geometry: { type: 'LineString', coordinates: r.geometry },
    })),
  }
}
