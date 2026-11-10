import { Ban, CircleAlert, CircleCheck, OctagonAlert, TriangleAlert, type LucideIcon } from 'lucide-react'

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE' | 'NO_TRAVEL'

export interface RiskStyle {
  label: string
  /** Hex, because MapLibre paint expressions cannot read CSS variables. */
  color: string
  /** Readable text colour on top of `color`. */
  onColor: string
  icon: LucideIcon
  rank: number
}

/** Single source of truth for how a risk level looks. Colour is never the only signal: label + icon too. */
export const RISK: Record<RiskLevel, RiskStyle> = {
  LOW: { label: 'Low', color: '#16a34a', onColor: '#0f172a', icon: CircleCheck, rank: 0 },
  MODERATE: { label: 'Moderate', color: '#eab308', onColor: '#0f172a', icon: CircleAlert, rank: 1 },
  HIGH: { label: 'High', color: '#f97316', onColor: '#0f172a', icon: TriangleAlert, rank: 2 },
  SEVERE: { label: 'Severe', color: '#dc2626', onColor: '#ffffff', icon: OctagonAlert, rank: 3 },
  NO_TRAVEL: { label: 'No Travel', color: '#7f1d1d', onColor: '#ffffff', icon: Ban, rank: 4 },
}

export const RISK_ORDER: RiskLevel[] = ['LOW', 'MODERATE', 'HIGH', 'SEVERE', 'NO_TRAVEL']

export function riskFromInt(n: number): RiskLevel {
  return RISK_ORDER[Math.min(Math.max(Math.round(n), 0), RISK_ORDER.length - 1)]
}
