import { Ban } from 'lucide-react'
import type { PlanResponse } from '@/api/types'
import { formatDuration, formatEta, formatMiles } from '@/lib/format'
import { RISK } from '@/lib/risk'

/** The answer: best route, when you arrive, and the worst weather on it, stated in words and colour. */
export function Verdict({ plan }: { plan: PlanResponse }) {
  const best = plan.routes.find((r) => r.id === plan.recommended_route_id)
  if (!best) return null
  const { summary } = best
  const blocked = summary.miles_by_level.NO_TRAVEL > 0
  const style = RISK[summary.worst]
  const Icon = style.icon
  const last = best.checkpoints[best.checkpoints.length - 1]
  const rough = summary.worst !== 'LOW'

  return (
    <section aria-live="polite" className="space-y-3">
      {blocked && (
        <p className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-base font-medium text-destructive">
          <Ban className="size-5 shrink-0" aria-hidden /> Do not depart as planned
        </p>
      )}
      <div>
        <h2 className="text-2xl leading-snug font-medium">{blocked ? `Least-bad option: ${best.label}` : `Take ${best.label}`}</h2>
        <p className="text-lg tabular">
          <span className="font-medium">{formatDuration(summary.duration_s)}</span>
          <span className="text-muted-foreground"> · {formatMiles(summary.total_miles)}</span>
          {last && <span className="text-muted-foreground"> · arrive {formatEta(last.eta_utc, last.tz)}</span>}
        </p>
      </div>
      <p className="flex items-center gap-2 text-base font-medium">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: style.color, color: style.onColor }}>
          <Icon className="size-4" aria-hidden />
        </span>
        {rough ? `${style.label} risk for ${formatMiles(summary.miles_by_level[summary.worst])}` : 'Clear: no Moderate or worse weather'}
      </p>
      <p className="text-base text-muted-foreground">{plan.recommendation_reason}</p>
    </section>
  )
}
