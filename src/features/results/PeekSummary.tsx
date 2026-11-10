import type { PlannedRoute } from '@/api/types'
import { formatDuration, formatEta } from '@/lib/format'
import { routeShortName } from '@/lib/hazards'
import { RiskBadge } from './RiskBadge'

/** The whole answer in one glance, for the smallest sheet position. */
export function PeekSummary({ route, isRecommended, onOpen }: { route: PlannedRoute; isRecommended: boolean; onOpen: () => void }) {
  const last = route.checkpoints[route.checkpoints.length - 1]
  return (
    <button type="button" onClick={onOpen} className="flex min-h-16 w-full items-center gap-3 rounded-xl bg-muted p-3 text-left">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xl leading-tight font-medium">
          {isRecommended ? 'Take ' : ''}
          {route.label} <span className="font-normal text-muted-foreground">{routeShortName(route.via)}</span>
        </span>
        <span className="block text-base text-muted-foreground tabular">
          {formatDuration(route.summary.duration_s)}
          {last && ` · arrive ${formatEta(last.eta_utc, last.tz)}`}
        </span>
      </span>
      <RiskBadge level={route.summary.worst} />
    </button>
  )
}
