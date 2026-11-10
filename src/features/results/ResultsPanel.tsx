import { ChevronDown, Info } from 'lucide-react'
import type { PlanResponse } from '@/api/types'
import { Roundel } from '@/components/Roundel'
import { RouteLine } from '@/components/RouteLine'
import { routeShortName } from '@/lib/hazards'
import { RiskBadge } from './RiskBadge'
import { RouteCard } from './RouteCard'
import { RouteComparison } from './RouteComparison'
import { RouteDetails } from './RouteDetails'
import { Verdict } from './Verdict'

interface ResultsPanelProps {
  plan: PlanResponse
  selectedRouteId: string
  loadLb?: number
  onSelectRoute: (id: string) => void
  onSelectCheckpoint: (routeId: string, index: number) => void
  /** List every route as a row. Off where a comparison panel on the map already lists them. */
  showRouteList?: boolean
}

export function ResultsPanel({ plan, selectedRouteId, loadLb, onSelectRoute, onSelectCheckpoint, showRouteList = true }: ResultsPanelProps) {
  const selected = plan.routes.find((r) => r.id === selectedRouteId) ?? plan.routes[0]
  // The recommendation leads; the others follow in the server's order.
  const ordered = [...plan.routes].sort((a, b) => Number(b.id === plan.recommended_route_id) - Number(a.id === plan.recommended_route_id))

  return (
    <div className="space-y-6">
      <Verdict plan={plan} />

      {plan.notes.map((note) => (
        <p key={note} className="flex items-start gap-2 text-base">
          <Info className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden /> {note}
        </p>
      ))}

      {showRouteList ? (
        <section aria-label="Routes" className="space-y-2">
          <h3 className="text-base font-semibold">Routes</h3>
          <div role="radiogroup" aria-label="Route options" className="-mx-1 space-y-1">
            {ordered.map((route, i) => (
              <div key={route.id}>
                {i === 1 && <h4 className="px-3 pt-3 pb-1 text-sm font-medium text-muted-foreground">Alternatives</h4>}
                <RouteCard route={route} selected={route.id === selected.id} onSelect={() => onSelectRoute(route.id)} />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section aria-label="Selected route" className="space-y-3">
          {selected.id !== plan.recommended_route_id && (
          <div className="flex items-center gap-3">
            <Roundel n={selected.label.replace(/\D+/g, '') || '1'} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base leading-tight font-semibold">{selected.label}</p>
              <p className="truncate text-sm text-muted-foreground">{routeShortName(selected.via)}</p>
            </div>
            <RiskBadge level={selected.summary.worst} size="sm" />
          </div>
          )}
          <RouteLine route={selected} />
        </section>
      )}

      <details className="group rounded-xl bg-muted/60">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          How the routes compare
          <ChevronDown className="size-5 transition-transform duration-150 group-open:rotate-180" aria-hidden />
        </summary>
        <div className="px-4 pb-4">
          <RouteComparison routes={plan.routes} recommendedId={plan.recommended_route_id} />
        </div>
      </details>

      <RouteDetails key={selected.id} route={selected} loadLb={loadLb} onSelectCheckpoint={onSelectCheckpoint} />
    </div>
  )
}
