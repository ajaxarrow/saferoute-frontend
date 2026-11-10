import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { lazy, Suspense, useCallback, useMemo, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import type { Place, PlanRequest, PlanResponse } from '@/api/types'
import type { FitPadding, MapFocus } from '@/features/map/MapView'
import { PeekSummary } from '@/features/results/PeekSummary'
import { ResultsPanel } from '@/features/results/ResultsPanel'
import { BottomSheet, type SheetSnap } from '@/features/shell/BottomSheet'
import { LoadingState } from '@/features/shell/LoadingState'
import { PanelHeader } from '@/features/shell/PanelHeader'
import { TripSummaryBar } from '@/features/shell/TripSummaryBar'
import { TripForm } from '@/features/trip-form/TripForm'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useRoutePreview } from '@/hooks/useRoutePreview'
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
  const [places, setPlaces] = useState<{ origin: Place | null; destination: Place | null }>({ origin: null, destination: null })
  const preview = useRoutePreview(places.origin, places.destination)

  // Editing either place makes the old results stale: the map goes back to following the form.
  const planIsCurrent =
    Boolean(plan && request) &&
    request!.origin.lat === places.origin?.lat &&
    request!.origin.lon === places.origin?.lon &&
    request!.destination.lat === places.destination?.lat &&
    request!.destination.lon === places.destination?.lon
  const mapPlan = planIsCurrent ? plan : undefined

  const changePlaces = useCallback(
    (origin: Place | null, destination: Place | null) => {
      setPlaces({ origin, destination })
      if (!isDesktop && origin && destination) setSheet('half') // reveal the map so the driver sees the routes appear
    },
    [isDesktop],
  )

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
        ? { top: 70, right: 70, bottom: 340, left: 70 }
        : { top: 170, right: 30, bottom: Math.round(window.innerHeight * 0.55), left: 30 },
    [isDesktop],
  )

  const showResults = view === 'results' && plan && !trip.isPending

  const panel: ReactNode = (
    <div className="space-y-6">
      <PanelHeader theme={theme} onToggleTheme={toggle} compact={view === 'results' || trip.isPending} />
      {view === 'results' && request && !trip.isPending && <TripSummaryBar request={request} onEdit={() => {
            setView('form')
            setSheet('full')
          }} />}
      {view === 'form' && plan && planIsCurrent && !trip.isPending && (
        <Button variant="ghost" onClick={() => setView('results')} className="-mb-3 h-11 gap-1.5 rounded-xl px-3">
          <ArrowLeft className="size-4" /> Back to results
        </Button>
      )}
      <div hidden={view === 'results' && Boolean(plan) && !trip.isPending}>
        <TripForm
          onSubmit={submit}
          isLoading={trip.isPending}
          error={trip.error}
          onPlacesChange={changePlaces}
          routeCheck={{ isLoading: preview.isFetching, error: preview.error }}
        />
      </div>
      {trip.isPending && <LoadingState />}
      {showResults && (
        <ResultsPanel
          plan={plan}
          loadLb={request?.load_lb}
          selectedRouteId={selectedRouteId ?? plan.recommended_route_id}
          onSelectRoute={setSelectedRouteId}
          onSelectCheckpoint={selectCheckpoint}
        />
      )}
    </div>
  )

  const peekRoute = showResults ? (plan.routes.find((r) => r.id === (selectedRouteId ?? plan.recommended_route_id)) ?? plan.routes[0]) : undefined
  const peek = peekRoute ? (
    <PeekSummary route={peekRoute} isRecommended={peekRoute.id === plan?.recommended_route_id} onOpen={() => setSheet('half')} />
  ) : undefined

  const map = (
    <Suspense fallback={<div className="size-full bg-muted" aria-hidden />}>
      <MapPane
        plan={mapPlan}
        origin={places.origin}
        destination={places.destination}
        preview={places.origin && places.destination ? preview.data : undefined}
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
        <aside className="w-[440px] shrink-0 overflow-y-auto bg-background p-5 shadow-[2px_0_12px_rgba(0,0,0,0.12)] z-10">{panel}</aside>
        <main className="relative min-w-0 flex-1">
          {map}
        </main>
      </div>
    )
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {map}
      <BottomSheet
        snap={sheet}
        onSnapChange={setSheet}
        peek={peek}
        resetScrollKey={`${view}-${plan?.recommended_route_id}-${trip.isPending}`}>
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
