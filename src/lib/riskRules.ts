import type { RiskLevel } from './risk'

/** What each band means, for the "How it's scored" help. Mirrors backend/planner/domain/risk.py. */
export const THRESHOLD_ROWS: { level: RiskLevel; wind: string; rain: string; snow: string }[] = [
  { level: 'LOW', wind: 'Under 25', rain: 'Under 0.10', snow: 'Under 0.5' },
  { level: 'MODERATE', wind: '25–34', rain: '0.10–0.25', snow: '0.5–1.0' },
  { level: 'HIGH', wind: '35–44', rain: '0.25–0.50', snow: '1.0–2.0' },
  { level: 'SEVERE', wind: '45–54', rain: '0.50–1.00', snow: '2.0–3.0' },
  { level: 'NO_TRAVEL', wind: '55 and up', rain: 'Over 1.00', snow: 'Over 3.0' },
]

export const RECOMMENDATION_STEPS = [
  'Fewest Severe miles',
  'Then fewest High miles',
  'Then lowest average risk',
  'Then shortest drive time',
]
