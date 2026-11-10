import { lazy, Suspense, type ReactNode } from 'react'
import type { PlannerState } from './usePlanner'

// MapLibre is the bulk of the bundle; load it after the form has rendered.
const MapPane = lazy(() => import('@/features/map/MapPane').then((m) => ({ default: m.MapPane })))

interface PlannerMapProps {
  p: PlannerState
  forecastClassName: string
  children?: ReactNode
}

/** The map wired to planner state; every layout renders this and only decides where the overlays sit. */
export function PlannerMap({ p, forecastClassName, children }: PlannerMapProps) {
  const { places, mapPlan, preview } = p
  const mobile = p.layout === 'mobile'
  return (
    <Suspense fallback={<div className="size-full bg-muted" aria-hidden />}>
      <MapPane
        plan={mapPlan}
        origin={places.origin}
        destination={places.destination}
        preview={places.origin && places.destination ? preview.data : undefined}
        selectedRouteId={p.selectedRouteId}
        onSelectRoute={p.selectRoute}
        theme={p.theme}
        fitPadding={p.fitPadding}
        initialPadding={p.initialPadding}
        focus={p.focus}
        forecastClassName={forecastClassName}
        intervalMiles={mapPlan?.effective_interval_miles}
        onCheckpointClick={p.selectCheckpoint}
        checkpointPopup={!mobile}
        selectedCheckpoint={p.checkpoint?.index ?? null}
      >
        {children}
      </MapPane>
    </Suspense>
  )
}
