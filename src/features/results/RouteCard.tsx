import { useId } from 'react'
import { RouteLine } from '@/components/RouteLine'
import { Roundel } from '@/components/Roundel'
import type { PlannedRoute, RouteTag } from '@/api/types'
import { formatDuration, formatEta, formatMiles } from '@/lib/format'
import { routeShortName } from '@/lib/hazards'
import { RISK } from '@/lib/risk'
import { cn } from '@/lib/utils'
import { RiskBadge } from './RiskBadge'

const TAG_LABEL: Record<RouteTag, string> = { recommended: 'Recommended', fastest: 'Fastest', safest: 'Safest' }

interface RouteCardProps {
  route: PlannedRoute
  selected: boolean
  onSelect: () => void
}

/** A route as a line card: bullet, roads, arrival and drive time, then the line itself with every checkpoint a station. */
export function RouteCard({ route, selected, onSelect }: RouteCardProps) {
  const summaryId = useId()
  const { summary } = route
  const last = route.checkpoints[route.checkpoints.length - 1]
  const number = route.label.replace(/\D+/g, '') || route.label
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
        'w-full space-y-3 rounded-lg border-2 bg-card p-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        selected ? 'border-foreground' : 'border-border hover:border-foreground/50',
      )}
    >
      <div className="flex items-start gap-3">
        <Roundel n={number} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg leading-tight font-bold">{routeShortName(route.via) || route.label}</p>
          <p className="text-base text-muted-foreground tabular">
            {formatMiles(summary.total_miles)}
            {last && ` · arrive ${formatEta(last.eta_utc, last.tz)}`}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-2xl leading-none font-extrabold tabular">{formatDuration(summary.duration_s)}</span>
          <RiskBadge level={summary.worst} size="sm" />
        </div>
      </div>

      <div id={summaryId} className="space-y-2">
        <RouteLine route={route} />
        {hazards.length > 0 && (
          <p className="text-base font-semibold">{hazards.map((l) => `${RISK[l].label} ${formatMiles(summary.miles_by_level[l])}`).join(' · ')}</p>
        )}
        {route.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {route.tags.map((tag) => (
              <span
                key={tag}
                className={cn('rounded-md px-2 py-0.5 text-sm font-bold', tag === 'recommended' ? 'bg-primary text-primary-foreground' : 'border-2 border-foreground/40')}
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
