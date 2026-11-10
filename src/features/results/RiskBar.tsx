import { RISK, RISK_ORDER, type RiskLevel } from '@/lib/risk'
import { formatMiles } from '@/lib/format'

interface RiskBarProps {
  milesByLevel: Record<RiskLevel, number>
}

/** Stacked bar of how many miles of the route sit at each risk level. */
export function RiskBar({ milesByLevel }: RiskBarProps) {
  const present = RISK_ORDER.filter((l) => milesByLevel[l] > 0)
  const total = present.reduce((sum, l) => sum + milesByLevel[l], 0) || 1
  const description = `Risk along route: ${present.map((l) => `${RISK[l].label} ${formatMiles(milesByLevel[l])}`).join(', ')}`
  return (
    <div role="img" aria-label={description} className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
      {present.map((l) => (
        <div key={l} style={{ width: `${(milesByLevel[l] / total) * 100}%`, backgroundColor: RISK[l].color }} />
      ))}
    </div>
  )
}
