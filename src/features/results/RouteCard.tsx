import { Clock, Flag, Route as RouteIcon } from 'lucide-react'
import { useId } from 'react'
import type { PlannedRoute, RouteTag } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { formatDuration, formatEta, formatMiles } from '@/lib/format'
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
        'w-full rounded-2xl border bg-card p-4 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        selected ? 'border-foreground shadow-md ring-1 ring-foreground' : 'hover:border-foreground/40',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold">{route.label}</p>
          {route.via && <p className="truncate text-sm text-muted-foreground">{route.via}</p>}
        </div>
        <RiskBadge level={summary.worst} />
      </div>

      {route.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {route.tags.map((tag) => (
            <Badge key={tag} variant={tag === 'recommended' ? 'default' : 'secondary'}>
              {TAG_LABEL[tag]}
            </Badge>
          ))}
        </div>
      )}

      <div id={summaryId} className="mt-3 space-y-2.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <Clock className="size-4 text-muted-foreground" aria-hidden /> {formatDuration(summary.duration_s)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <RouteIcon className="size-4 text-muted-foreground" aria-hidden /> {formatMiles(summary.total_miles)}
          </span>
          {last && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Flag className="size-4" aria-hidden /> Arrive {formatEta(last.eta_utc, last.tz)}
            </span>
          )}
        </div>
        <RiskBar milesByLevel={summary.miles_by_level} />
        <p className="text-sm text-muted-foreground">
          {hazards.length === 0
            ? 'No High, Severe or No Travel stretches.'
            : hazards.map((l) => `${RISK[l].label} ${formatMiles(summary.miles_by_level[l])}`).join(' · ')}
        </p>
      </div>
    </button>
  )
}
