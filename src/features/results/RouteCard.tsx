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

/** A flat list row, not a box: number, roads, drive time and risk. Only the selected row opens up to show its line and tags. */
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
        'w-full rounded-2xl px-3 py-3.5 text-left transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected ? 'bg-secondary ring-1 ring-primary/30' : 'hover:bg-muted/70',
      )}
    >
      <div className="flex items-center gap-3">
        <Roundel n={number} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base leading-tight font-semibold">{routeShortName(route.via) || route.label}</p>
          <p className="mt-0.5 text-sm text-muted-foreground tabular">
            {formatMiles(summary.total_miles)}
            {last && ` · arrive ${formatEta(last.eta_utc, last.tz)}`}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="text-base leading-none font-semibold tabular">{formatDuration(summary.duration_s)}</span>
          <RiskBadge level={summary.worst} size="sm" />
        </div>
      </div>

      <div id={summaryId} className={cn('space-y-3', selected ? 'mt-3.5' : 'sr-only')}>
        <RouteLine route={route} />
        {hazards.length > 0 && (
          <p className="text-sm font-medium">{hazards.map((l) => `${RISK[l].label} ${formatMiles(summary.miles_by_level[l])}`).join(' · ')}</p>
        )}
        {route.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {route.tags.map((tag) => (
              <span
                key={tag}
                className={cn('rounded-full px-2.5 py-0.5 text-sm font-medium', tag === 'recommended' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground ring-1 ring-border')}
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
