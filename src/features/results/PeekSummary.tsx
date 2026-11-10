import type { PlannedRoute } from '@/api/types'
import { Button } from '@/components/ui/button'
import { formatDuration, formatEta, formatMiles } from '@/lib/format'
import { routeShortName } from '@/lib/hazards'
import { RiskBadge } from './RiskBadge'

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-lg leading-tight font-semibold whitespace-nowrap tabular">{value}</dd>
    </div>
  )
}

/** The whole answer in one glance, for the smallest sheet position, with a way into the full list. */
export function PeekSummary({ route, isRecommended, onViewAll }: { route: PlannedRoute; isRecommended: boolean; onViewAll: () => void }) {
  const last = route.checkpoints[route.checkpoints.length - 1]
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {isRecommended && <p className="text-sm font-semibold text-primary">Recommended</p>}
          <p className="truncate text-lg leading-tight font-semibold">
            {route.label} <span className="font-normal text-muted-foreground">{routeShortName(route.via)}</span>
          </p>
        </div>
        <RiskBadge level={route.summary.worst} />
      </div>
      <dl className="flex gap-x-6 max-[479px]:gap-x-4">
        <Metric label="Time" value={formatDuration(route.summary.duration_s)} />
        <Metric label="Distance" value={formatMiles(route.summary.total_miles)} />
        {last && <Metric label="Arrive" value={formatEta(last.eta_utc, last.tz).replace(/ [A-Z]{2,4}$/, '')} />}
      </dl>
      <Button type="button" variant="outline" onClick={onViewAll} className="h-12 w-full rounded-xl text-base font-semibold">
        View all routes
      </Button>
    </div>
  )
}
