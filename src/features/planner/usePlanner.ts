import { useCallback, useMemo, useState } from 'react'
import type { Place, PlanRequest, PlanResponse, PlannedRoute } from '@/api/types'
import type { FitPadding, MapFocus } from '@/features/map/MapView'
import type { SheetSnap } from '@/features/shell/BottomSheet'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useRoutePreview } from '@/hooks/useRoutePreview'
import { useTheme } from '@/hooks/useTheme'
import { useTripPlan } from '@/hooks/useTripPlan'

export type LayoutKind = 'desktop' | 'tablet' | 'mobile'

/** Which composition to render. Only the layout differs per breakpoint; everything else comes from usePlanner. */
export function useLayoutKind(): LayoutKind {
  const desktop = useMediaQuery('(min-width: 1024px)')
  const tablet = useMediaQuery('(min-width: 768px)')
  return desktop ? 'desktop' : tablet ? 'tablet' : 'mobile'
}

/** Map padding so a fitted route lands in the part of the map that no panel covers. Computed once per plan, never on panel toggles. */
function paddingFor(layout: LayoutKind): FitPadding {
  if (layout === 'desktop') return { top: 90, right: 70, bottom: 270, left: 60 }
  if (layout === 'tablet') return { top: 90, right: 70, bottom: 230, left: 370 }
  return { top: 130, right: 24, bottom: Math.round(window.innerHeight * 0.55), left: 24 }
}

/** Padding for the opening view of the continental US: it should sit in the open part of the map, not under a panel. */
function usPaddingFor(layout: LayoutKind): FitPadding {
  if (layout === 'desktop') return { top: 24, right: 24, bottom: 24, left: 24 }
  if (layout === 'tablet') return { top: 24, right: 24, bottom: 24, left: 360 }
  return { top: 24, right: 16, bottom: Math.round(window.innerHeight * 0.52) + 8, left: 16 }
}

/** All planner state and actions, shared by every layout. */
export function usePlanner(layout: LayoutKind) {
  const isMobile = layout === 'mobile'
  const { theme, toggle: toggleTheme } = useTheme()
  const trip = useTripPlan()

  const [plan, setPlan] = useState<PlanResponse>()
  const [request, setRequest] = useState<PlanRequest>()
  const [view, setView] = useState<'form' | 'results'>('form')
  const [selectedRouteId, setSelectedRouteId] = useState<string>()
  const [focus, setFocus] = useState<MapFocus | null>(null)
  const [checkpoint, setCheckpoint] = useState<{ routeId: string; index: number } | null>(null)
  const [sheet, setSheet] = useState<SheetSnap>('half')
  const [drawerOpen, setDrawerOpen] = useState(true)
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
      if (isMobile && origin && destination) setSheet('half') // reveal the map so the driver sees the routes appear
    },
    [isMobile],
  )

  const submit = useCallback(
    (req: PlanRequest) => {
      setRequest(req)
      setSheet('half') // keep the map in view while the routes load
      setCheckpoint(null)
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
      setCheckpoint({ routeId, index })
      setFocus({ routeId, index, nonce: Date.now() })
      if (isMobile) setSheet('peek') // reveal the map
    },
    [isMobile],
  )

  const selectRoute = useCallback((id: string) => {
    setSelectedRouteId(id)
    setCheckpoint(null)
  }, [])

  const editTrip = useCallback(() => {
    setView('form')
    setSheet('full')
    setDrawerOpen(true)
  }, [])
  const backToResults = useCallback(() => setView('results'), [])

  const fitPadding = useMemo(() => paddingFor(layout), [layout])
  const initialPadding = useMemo(() => usPaddingFor(layout), [layout])

  const showResults = view === 'results' && Boolean(plan) && !trip.isPending
  const activeRouteId = selectedRouteId ?? plan?.recommended_route_id
  const activeRoute: PlannedRoute | undefined = plan?.routes.find((r) => r.id === activeRouteId) ?? plan?.routes[0]
  const checkpointDetail = useMemo(() => {
    const route = plan?.routes.find((r) => r.id === checkpoint?.routeId)
    const cp = route?.checkpoints[checkpoint?.index ?? -1]
    return route && cp ? { route, checkpoint: cp } : null
  }, [plan, checkpoint])

  return {
    layout, theme, toggleTheme, trip, preview, places, plan, mapPlan, request, view, showResults, planIsCurrent,
    selectedRouteId, activeRouteId, activeRoute, focus, checkpoint, checkpointDetail, closeCheckpoint: () => setCheckpoint(null),
    sheet, setSheet, drawerOpen, setDrawerOpen, fitPadding, initialPadding,
    changePlaces, submit, selectCheckpoint, selectRoute, editTrip, backToResults,
  }
}

export type PlannerState = ReturnType<typeof usePlanner>
