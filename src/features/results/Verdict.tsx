import { Ban } from 'lucide-react'
import { Roundel } from '@/components/Roundel'
import type { PlanResponse } from '@/api/types'
import { formatDuration, formatEta, formatMiles } from '@/lib/format'
import { routeShortName } from '@/lib/hazards'
import { RISK } from '@/lib/risk'

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-background/75">{label}</dt>
      <dd className="text-xl leading-tight font-bold whitespace-nowrap tabular">{value}</dd>
    </div>
  )
}

/** The answer, as an ink plate: which line to take, when it arrives, and the worst weather on it in its risk ink. */
export function Verdict({ plan }: { plan: PlanResponse }) {
  const best = plan.routes.find((r) => r.id === plan.recommended_route_id)
  if (!best) return null
  const { summary } = best
  const blocked = summary.miles_by_level.NO_TRAVEL > 0
  const style = RISK[summary.worst]
  const Icon = style.icon
  const last = best.checkpoints[best.checkpoints.length - 1]
  const rough = summary.worst !== 'LOW'
  const roads = routeShortName(best.via)

  return (
    <section aria-live="polite" className="space-y-4 rounded-lg bg-foreground p-4 text-background">
      <div className="flex items-center gap-3">
        <Roundel n={best.label.replace(/\D+/g, '') || '1'} size="lg" inverse />
        <div className="min-w-0">
          <h2 className="text-3xl leading-none font-extrabold">{blocked ? `Least-bad: ${best.label}` : `Take ${best.label}`}</h2>
          {roads && <p className="mt-1 truncate text-lg text-background/80">{roads}</p>}
        </div>
      </div>

      {blocked && (
        <p className="flex items-center gap-2 rounded-md bg-destructive px-3 py-2 text-lg font-bold text-white">
          <Ban className="size-6 shrink-0" aria-hidden /> Do not depart as planned
        </p>
      )}

      <dl className="flex flex-wrap gap-x-6 gap-y-2 border-y border-background/25 py-3">
        <Fact label="Drive" value={formatDuration(summary.duration_s)} />
        <Fact label="Distance" value={formatMiles(summary.total_miles)} />
        {last && <Fact label="Arrive" value={formatEta(last.eta_utc, last.tz).replace(/ [A-Z]{2,4}$/, '')} />}
      </dl>
      {last && <p className="sr-only">Arrive {formatEta(last.eta_utc, last.tz)}</p>}

      <p className="flex items-center gap-2.5 text-lg font-bold">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: style.color, color: style.onColor }}>
          <Icon className="size-5" aria-hidden />
        </span>
        {rough ? `${style.label} risk for ${formatMiles(summary.miles_by_level[summary.worst])}` : 'Clear: no Moderate or worse weather'}
      </p>
      <p className="text-base text-background/85">{plan.recommendation_reason}</p>
    </section>
  )
}
