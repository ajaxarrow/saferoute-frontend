import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ResultsPanel } from '@/features/results/ResultsPanel'
import { LoadingState } from '@/features/shell/LoadingState'
import { TripSummaryBar } from '@/features/shell/TripSummaryBar'
import { TripForm } from '@/features/trip-form/TripForm'
import type { PlannerState } from './usePlanner'

/** The planning form and the results, one after the other. Lives in the sidebar, the tablet drawer or the phone sheet. */
export function PlannerPanel({ p, showRouteList = true }: { p: PlannerState; showRouteList?: boolean }) {
  const { trip, plan, request, view, showResults } = p
  const editing = view === 'form'
  return (
    <div className="space-y-6 pb-6">
      {view === 'results' && request && !trip.isPending && <TripSummaryBar request={request} onEdit={p.editTrip} />}
      {editing && plan && p.planIsCurrent && !trip.isPending && (
        <Button variant="ghost" onClick={p.backToResults} className="-mb-2 h-11 gap-1.5 rounded-xl px-3">
          <ArrowLeft className="size-4" /> Back to results
        </Button>
      )}
      {/* Kept mounted (just hidden) behind the loader and the results so "Edit trip" never loses what was typed. */}
      <div hidden={trip.isPending || (!editing && Boolean(plan))}>
        <TripForm
          onSubmit={p.submit}
          isLoading={trip.isPending}
          error={trip.error}
          onPlacesChange={p.changePlaces}
          routeCheck={{ isLoading: p.preview.isFetching, error: p.preview.error }}
        />
      </div>
      {trip.isPending && <LoadingState />}
      {showResults && plan && (
        <ResultsPanel
          plan={plan}
          loadLb={request?.load_lb}
          selectedRouteId={p.activeRouteId ?? plan.recommended_route_id}
          onSelectRoute={p.selectRoute}
          onSelectCheckpoint={p.selectCheckpoint}
          showRouteList={showRouteList}
        />
      )}
    </div>
  )
}
