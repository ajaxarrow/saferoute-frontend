import type { PlannedRoute } from '@/api/types'
import { formatMiles } from '@/lib/format'
import { RISK, RISK_ORDER } from '@/lib/risk'
import { RiskBadge } from './RiskBadge'

/** Miles at each risk level for one route. */
export function RiskBreakdown({ route }: { route: PlannedRoute }) {
  const { miles_by_level: miles, total_miles: total } = route.summary
  const levels = RISK_ORDER.filter((l) => miles[l] > 0)
  return (
    <section aria-label={`Risk along ${route.label}`} className="space-y-3">
      <h3 className="text-base font-semibold">Miles by risk</h3>
      <ul className="space-y-2.5">
        {levels.map((level) => (
          <li key={level} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3">
            <RiskBadge level={level} size="sm" className="justify-self-start" />
            <span className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
              <span className="block h-full rounded-full" style={{ width: `${(miles[level] / total) * 100}%`, backgroundColor: RISK[level].color }} />
            </span>
            <span className="text-sm font-medium tabular">{formatMiles(miles[level])}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
