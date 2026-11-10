import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'
import type { PlanRequest, PlanResponse } from '@/api/types'
import { HeatmapControl } from '@/features/map/HeatmapControl'
import { MapView, type FitPadding, type MapFocus } from '@/features/map/MapView'
import { ResultsPanel } from '@/features/results/ResultsPanel'
import { BottomSheet } from '@/features/shell/BottomSheet'
import { LoadingState } from '@/features/shell/LoadingState'
import { PanelHeader } from '@/features/shell/PanelHeader'
import { TripSummaryBar } from '@/features/shell/TripSummaryBar'
import { TripForm } from '@/features/trip-form/TripForm'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useTheme } from '@/hooks/useTheme'
import { useTripPlan } from '@/hooks/useTripPlan'

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
  const [sheetExpanded, setSheetExpanded] = useState(true)

  const [hour, setHour] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [heatVisible, setHeatVisible] = useState(true)

  const submit = useCallback(
    (req: PlanRequest) => {
      setRequest(req)
      setSheetExpanded(true)
      setPlaying(false)
      trip.mutate(req, {
        onSuccess: (data) => {
          setPlan(data)
          setSelectedRouteId(data.recommended_route_id)
          setHour(0)
          setView('results')
        },
      })
    },
    [trip],
  )

  const selectCheckpoint = useCallback(
    (routeId: string, index: number) => {
      setSelectedRouteId(routeId)
      setFocus({ routeId, index, nonce: Date.now() })
      if (!isDesktop) setSheetExpanded(false) // reveal the map
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

  const origin = plan?.routes[0].checkpoints[0]
  const showResults = view === 'results' && plan && !trip.isPending

  const panel: ReactNode = (
    <div className="space-y-6">
      <PanelHeader theme={theme} onToggleTheme={toggle} />
      {view === 'results' && request && !trip.isPending && <TripSummaryBar request={request} onEdit={() => setView('form')} />}
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

  const heatmapControl =
    plan && origin ? (
      <HeatmapControl
        hour={hour}
        maxHour={plan.heatmap.hours - 1}
        onHourChange={setHour}
        departureIso={origin.eta_utc}
        tz={origin.tz}
        visible={heatVisible}
        onVisibleChange={setHeatVisible}
        playing={playing}
        onPlayingChange={setPlaying}
      />
    ) : null

  const map = (
    <MapView
      plan={plan}
      selectedRouteId={selectedRouteId}
      onSelectRoute={setSelectedRouteId}
      theme={theme}
      fitPadding={fitPadding}
      focus={focus}
      heatmapHour={hour}
      heatmapVisible={heatVisible}
    />
  )

  if (isDesktop) {
    return (
      <div className="flex h-dvh w-full overflow-hidden">
        <aside className="w-[440px] shrink-0 overflow-y-auto border-r bg-background p-5">{panel}</aside>
        <main className="relative min-w-0 flex-1">
          {map}
          {heatmapControl && <div className="absolute inset-x-0 bottom-5 mx-auto w-[min(560px,calc(100%-2rem))]">{heatmapControl}</div>}
        </main>
      </div>
    )
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {map}
      {heatmapControl && <div className="absolute inset-x-3 top-3 z-10">{heatmapControl}</div>}
      <BottomSheet expanded={sheetExpanded} onExpandedChange={setSheetExpanded}>
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
