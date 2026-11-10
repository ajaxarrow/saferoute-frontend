import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { lazy, Suspense, useCallback, useMemo, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import type { PlanRequest, PlanResponse } from '@/api/types'
import type { FitPadding, MapFocus } from '@/features/map/MapView'
import { ResultsPanel } from '@/features/results/ResultsPanel'
import { BottomSheet, type SheetSnap } from '@/features/shell/BottomSheet'
import { LoadingState } from '@/features/shell/LoadingState'
import { PanelHeader } from '@/features/shell/PanelHeader'
import { TripSummaryBar } from '@/features/shell/TripSummaryBar'
import { TripForm } from '@/features/trip-form/TripForm'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useTheme } from '@/hooks/useTheme'
import { useTripPlan } from '@/hooks/useTripPlan'

// MapLibre is the bulk of the bundle; load it after the form has rendered.
const MapPane = lazy(() => import('@/features/map/MapPane').then((m) => ({ default: m.MapPane })))

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } })

function Planner() {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const { theme, toggle } = useTheme()
  const trip = useTripPlan()

  const [plan, setPlan] = useState<PlanResponse>()
  const [request, setRequest] = useState<PlanRequest>()
  const [view, setView] = useState<'form' | 'results'>('form')
  const [selectedRouteId, setSelectedRouteId] = useState<string>()
  const [focus, setFocus] = useState<MapFocus | null>(null)
  const [sheet, setSheet] = useState<SheetSnap>('full')

  const submit = useCallback(
    (req: PlanRequest) => {
      setRequest(req)
      setSheet('full')
      trip.mutate(req, {
        onSuccess: (data) => {
          setPlan(data)
          setSelectedRouteId(data.recommended_route_id)
          setFocus(null) // a focus request from the previous plan must not fly the new map somewhere
          setView('results')
          setSheet('half')
        },
      })
    },
    [trip.mutate],
  )

  const selectCheckpoint = useCallback(
    (routeId: string, index: number) => {
      setSelectedRouteId(routeId)
      setFocus({ routeId, index, nonce: Date.now() })
      if (!isDesktop) setSheet('peek') // reveal the map
    },
    [isDesktop],
  )

  const fitPadding: FitPadding = useMemo(
    () =>
      isDesktop
        ? { top: 70, right: 70, bottom: 230, left: 70 }
        : { top: 170, right: 30, bottom: Math.round(window.innerHeight * 0.55), left: 30 },
    [isDesktop],
  )

  const showResults = view === 'results' && plan && !trip.isPending

  const panel: ReactNode = (
    <div className="space-y-6">
      <PanelHeader theme={theme} onToggleTheme={toggle} />
      {view === 'results' && request && !trip.isPending && <TripSummaryBar request={request} onEdit={() => {
            setView('form')
            setSheet('full')
          }} />}
      {view === 'form' && plan && !trip.isPending && (
        <Button variant="ghost" onClick={() => setView('results')} className="-mb-3 h-11 gap-1.5 rounded-xl px-3">
          <ArrowLeft className="size-4" /> Back to results
        </Button>
      )}
      <div hidden={view === 'results' && Boolean(plan) && !trip.isPending}>
        <TripForm onSubmit={submit} isLoading={trip.isPending} error={trip.error} />
      </div>
      {trip.isPending && <LoadingState />}
      {showResults && (
        <ResultsPanel
          plan={plan}
          selectedRouteId={selectedRouteId ?? plan.recommended_route_id}
          onSelectRoute={setSelectedRouteId}
          onSelectCheckpoint={selectCheckpoint}
        />
      )}
    </div>
  )

  const map = (
    <Suspense fallback={<div className="size-full bg-muted" aria-hidden />}>
      <MapPane
        plan={plan}
        selectedRouteId={selectedRouteId}
        onSelectRoute={setSelectedRouteId}
        theme={theme}
        fitPadding={fitPadding}
        focus={focus}
        isDesktop={isDesktop}
      />
    </Suspense>
  )

  if (isDesktop) {
    return (
      <div className="flex h-dvh w-full overflow-hidden">
        <aside className="w-[440px] shrink-0 overflow-y-auto border-r bg-background p-5">{panel}</aside>
        <main className="relative min-w-0 flex-1">
          {map}
        </main>
      </div>
    )
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {map}
      <BottomSheet snap={sheet} onSnapChange={setSheet} resetScrollKey={`${view}-${plan?.recommended_route_id}-${trip.isPending}`}>
        {panel}
      </BottomSheet>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Planner />
      <Toaster position="top-center" />
    </QueryClientProvider>
  )
}
