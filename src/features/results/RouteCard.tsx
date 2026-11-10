import { useId } from 'react'
import type { PlannedRoute, RouteTag } from '@/api/types'
import { formatDuration, formatEta, formatMiles } from '@/lib/format'
import { routeShortName } from '@/lib/hazards'
import { RISK } from '@/lib/risk'
import { cn } from '@/lib/utils'
import { RiskBadge } from './RiskBadge'
import { RiskBar } from './RiskBar'

const TAG_LABEL: Record<RouteTag, string> = { recommended: 'Recommended', fastest: 'Fastest', safest: 'Safest' }

interface RouteCardProps {
  route: PlannedRoute
  selected: boolean
  onSelect: () => void
}

/** One row of the route list, in the order a driver decides: how long, when I arrive, how bad is the weather. */
export function RouteCard({ route, selected, onSelect }: RouteCardProps) {
  const summaryId = useId()
  const { summary } = route
  const last = route.checkpoints[route.checkpoints.length - 1]
  const hazards = (['NO_TRAVEL', 'SEVERE', 'HIGH'] as const).filter((l) => summary.miles_by_level[l] >= 1)

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${route.label}${route.via ? `, ${route.via}` : ''}`}
      aria-describedby={summaryId}
      onClick={onSelect}
      className={cn(
        'w-full space-y-2 rounded-xl px-3 py-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        selected ? 'bg-primary/10 ring-1 ring-primary' : 'hover:bg-muted',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-medium">
            {route.label}
            {routeShortName(route.via) && <span className="font-normal text-muted-foreground"> · {routeShortName(route.via)}</span>}
          </p>
          <p className="text-base text-muted-foreground tabular">
            {formatMiles(summary.total_miles)}
            {last && ` · arrive ${formatEta(last.eta_utc, last.tz)}`}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-xl font-medium tabular">{formatDuration(summary.duration_s)}</span>
          <RiskBadge level={summary.worst} size="sm" />
        </div>
      </div>

      <div id={summaryId} className="space-y-1.5">
        <RiskBar milesByLevel={summary.miles_by_level} />
        {hazards.length > 0 && (
          <p className="text-base text-muted-foreground">{hazards.map((l) => `${RISK[l].label} ${formatMiles(summary.miles_by_level[l])}`).join(' · ')}</p>
        )}
        {route.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {route.tags.map((tag) => (
              <span
                key={tag}
                className={cn('rounded-full px-2.5 py-0.5 text-sm font-medium', tag === 'recommended' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')}
              >
                {TAG_LABEL[tag]}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}
