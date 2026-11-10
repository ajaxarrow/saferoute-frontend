import { Info } from 'lucide-react'
import type { PlanResponse } from '@/api/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckpointTimeline } from './CheckpointTimeline'
import { RecommendationBanner } from './RecommendationBanner'
import { RouteCard } from './RouteCard'

interface ResultsPanelProps {
  plan: PlanResponse
  selectedRouteId: string
  onSelectRoute: (id: string) => void
  onSelectCheckpoint: (routeId: string, index: number) => void
}

export function ResultsPanel({ plan, selectedRouteId, onSelectRoute, onSelectCheckpoint }: ResultsPanelProps) {
  const selected = plan.routes.find((r) => r.id === selectedRouteId) ?? plan.routes[0]

  return (
    <div className="space-y-5">
      <RecommendationBanner plan={plan} />

      {plan.notes.map((note) => (
        <Alert key={note}>
          <Info />
          <AlertDescription>{note}</AlertDescription>
        </Alert>
      ))}

      <div role="radiogroup" aria-label="Route options" className="space-y-3">
        {plan.routes.map((route) => (
          <RouteCard key={route.id} route={route} selected={route.id === selected.id} onSelect={() => onSelectRoute(route.id)} />
        ))}
      </div>

      <CheckpointTimeline key={selected.id} route={selected} onSelectCheckpoint={onSelectCheckpoint} />
    </div>
  )
}
