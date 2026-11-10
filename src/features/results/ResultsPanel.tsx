import { Info } from 'lucide-react'
import type { PlanResponse } from '@/api/types'
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
}

export function ResultsPanel({ plan, selectedRouteId, loadLb, onSelectRoute, onSelectCheckpoint }: ResultsPanelProps) {
  const selected = plan.routes.find((r) => r.id === selectedRouteId) ?? plan.routes[0]

  return (
    <div className="space-y-7">
      <Verdict plan={plan} />

      {plan.notes.map((note) => (
        <p key={note} className="flex items-start gap-2 text-base">
          <Info className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden /> {note}
        </p>
      ))}

      <section aria-label="Compare routes" className="space-y-2">
        <h3 className="text-xl font-extrabold">Routes</h3>
        <div role="radiogroup" aria-label="Route options" className="space-y-2.5">
          {plan.routes.map((route) => (
            <RouteCard key={route.id} route={route} selected={route.id === selected.id} onSelect={() => onSelectRoute(route.id)} />
          ))}
        </div>
      </section>

      <RouteComparison routes={plan.routes} recommendedId={plan.recommended_route_id} />

      <RouteDetails key={selected.id} route={selected} loadLb={loadLb} onSelectCheckpoint={onSelectCheckpoint} />
    </div>
  )
}
