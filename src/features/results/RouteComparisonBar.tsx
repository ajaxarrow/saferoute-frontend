import { Star } from 'lucide-react'
import { Roundel } from '@/components/Roundel'
import type { PlannedRoute } from '@/api/types'
import { formatDuration, formatEta, formatMiles } from '@/lib/format'
import { routeShortName } from '@/lib/hazards'
import { cn } from '@/lib/utils'
import { RiskBadge } from './RiskBadge'
import { RiskLegend } from './RiskLegend'

interface RouteComparisonBarProps {
  routes: PlannedRoute[]
  recommendedId: string
  selectedId: string
  onSelect: (id: string) => void
  /** 'panel' = equal columns (desktop); 'carousel' = horizontal scroll-snap (tablet). */
  variant: 'panel' | 'carousel'
}

/** The three routes side by side: distance, time, ETA, worst risk, and the miles that matter. Click selects. */
export function RouteComparisonBar({ routes, recommendedId, selectedId, onSelect, variant }: RouteComparisonBarProps) {
  return (
    <section aria-label="Compare routes" className="w-full space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 className={cn('text-sm font-semibold', variant === 'carousel' && 'sr-only')}>Compare routes</h2>
        <RiskLegend className="gap-x-2.5" />
      </div>
      <div
        role="radiogroup"
        aria-label="Route comparison"
        className={cn(
          variant === 'panel' ? 'grid gap-3' : 'flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1',
        )}
        style={variant === 'panel' ? { gridTemplateColumns: `repeat(${routes.length}, minmax(0, 1fr))` } : undefined}
      >
        {routes.map((route) => {
          const { summary } = route
          const last = route.checkpoints[route.checkpoints.length - 1]
          const isBest = route.id === recommendedId
          const selected = route.id === selectedId
          const number = route.label.replace(/\D+/g, '') || route.label
          return (
            <button
              key={route.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(route.id)}
              className={cn(
                'min-w-0 space-y-3 rounded-xl p-3.5 text-left transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring',
                variant === 'carousel' && 'w-[270px] shrink-0 snap-start',
                selected ? 'bg-secondary ring-2 ring-primary' : 'ring-1 ring-border hover:bg-muted/70',
              )}
            >
              <span className="flex items-center gap-2">
                <Roundel n={number} size="sm" muted={!selected} />
                <span className="min-w-0 flex-1">
                  <span className={cn('flex items-center gap-1 text-sm font-medium', isBest ? 'text-primary' : 'text-muted-foreground')}>
                    {isBest && <Star className="size-3.5 fill-current" aria-hidden />}
                    {isBest ? 'Recommended' : 'Alternative'}
                  </span>
                  <span className="block truncate text-sm font-semibold">{routeShortName(route.via) || route.label}</span>
                </span>
                <RiskBadge level={summary.worst} size="sm" />
              </span>
              <dl className="flex items-end justify-between gap-3 tabular">
                <div>
                  <dt className="sr-only">Time</dt>
                  <dd className="text-xl leading-none font-semibold">{formatDuration(summary.duration_s)}</dd>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <dt className="sr-only">Distance</dt>
                  <dd>{formatMiles(summary.total_miles)}</dd>
                  {last && (
                    <div className="flex justify-end gap-1">
                      <dt>Arrive</dt>
                      <dd className="font-medium text-foreground">{formatEta(last.eta_utc, last.tz).replace(/ [A-Z]{2,4}$/, '')}</dd>
                    </div>
                  )}
                </div>
              </dl>
              <span className="block text-sm text-muted-foreground tabular">
                Severe {formatMiles(summary.miles_by_level.SEVERE + summary.miles_by_level.NO_TRAVEL)} · High {formatMiles(summary.miles_by_level.HIGH)}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
