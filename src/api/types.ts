import type { RiskLevel } from '@/lib/risk'

export interface Place {
  label: string
  name: string
  region: string
  lat: number
  lon: number
}

export type IntervalMiles = 10 | 25 | 50

export interface PlanRequest {
  origin: { label: string; lat: number; lon: number }
  destination: { label: string; lat: number; lon: number }
  /** Wall-clock time at the origin, "YYYY-MM-DDTHH:MM". */
  departure_local: string
  load_lb: number
  interval_miles: IntervalMiles
}

export interface Checkpoint {
  index: number
  mile: number
  lat: number
  lon: number
  eta_utc: string
  tz: string
  wind_mph: number
  rain_in_hr: number
  snow_in_hr: number
  risk: RiskLevel
  drivers: string[]
}

export interface RouteSummary {
  total_miles: number
  duration_s: number
  avg_risk: number
  worst: RiskLevel
  miles_by_level: Record<RiskLevel, number>
}

export type RouteTag = 'recommended' | 'fastest' | 'safest'

export interface PlannedRoute {
  id: string
  label: string
  via: string
  tags: RouteTag[]
  forecast_truncated: boolean
  summary: RouteSummary
  /** [lon, lat] pairs. */
  geometry: [number, number][]
  checkpoints: Checkpoint[]
}

export interface Heatmap {
  /** [lon, lat] pairs. */
  points: [number, number][]
  hours: number
  /** risk[hour][pointIndex] = RiskLevel as an int 0–4. */
  risk: number[][]
}

export interface PlanResponse {
  recommended_route_id: string
  recommendation_reason: string
  effective_interval_miles: number
  notes: string[]
  routes: PlannedRoute[]
  heatmap: Heatmap
}
