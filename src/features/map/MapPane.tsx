import { useEffect, useMemo, useState } from 'react'
import type { Place, PlanResponse, RoutePreview } from '@/api/types'
import { useDraggable } from '@/hooks/useDraggable'
import { truckAt } from '@/lib/journey'
import { cn } from '@/lib/utils'
import { MapView, type FitPadding, type MapFocus } from './MapView'
import type { Theme } from './mapStyle'
import { TripWeatherCard } from './TripWeatherCard'

interface MapPaneProps {
  plan?: PlanResponse
  origin?: Place | null
  destination?: Place | null
  preview?: RoutePreview[]
  selectedRouteId?: string
  onSelectRoute: (id: string) => void
  theme: Theme
  fitPadding: FitPadding
  initialPadding: FitPadding
  focus: MapFocus | null
  /** Positioning classes for the floating forecast bar; the layout decides where it sits. */
  forecastClassName: string
  intervalMiles?: number
  onCheckpointClick?: (routeId: string, index: number) => void
  checkpointPopup?: boolean
  selectedCheckpoint?: number | null
  /** Extra overlay content positioned by the layout (e.g. a compact legend). */
  children?: React.ReactNode
}

/**
 * The map plus its forecast bar. The forecast hour lives here, not in the planner, so scrubbing re-renders only this pane
 * and never the form or results list. The bar and the heatmap follow the selected route.
 */
export function MapPane({ plan, origin: from, destination: to, preview, selectedRouteId, onSelectRoute, theme, fitPadding, initialPadding, focus, forecastClassName, intervalMiles, onCheckpointClick, checkpointPopup, selectedCheckpoint, children }: MapPaneProps) {
  const [hour, setHour] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setHour(0)
    setPlaying(false)
  }, [plan])

  // The map follows the slider a beat behind the thumb, so dragging stays smooth.
  const [mapHour, setMapHour] = useState(0)
  useEffect(() => {
    const id = setTimeout(() => setMapHour(hour), 60)
    return () => clearTimeout(id)
  }, [hour])

  const dock = useDraggable()

  const route = plan ? (plan.routes.find((r) => r.id === (selectedRouteId ?? plan.recommended_route_id)) ?? plan.routes[0]) : undefined
  const truck = useMemo(() => (route ? truckAt(route, hour) : undefined), [route, hour])

  return (
    <div className="relative size-full">
      <MapView
        plan={plan}
        origin={from}
        destination={to}
        preview={preview}
        selectedRouteId={selectedRouteId}
        onSelectRoute={onSelectRoute}
        theme={theme}
        fitPadding={fitPadding}
        initialPadding={initialPadding}
        focus={focus}
        heatmapHour={mapHour}
        heatmapVisible={visible}
        truckPosition={truck?.position}
        onCheckpointClick={onCheckpointClick}
        checkpointPopup={checkpointPopup}
        selectedCheckpoint={selectedCheckpoint}
      />
      {plan && route && truck && (
        <div ref={dock.ref} style={dock.style} className={cn('absolute z-10 transition-[left] duration-200 motion-reduce:transition-none', forecastClassName)}>
          <TripWeatherCard
            route={route}
            truck={truck}
            hour={hour}
            maxHour={plan.heatmap.hours - 1}
            onHourChange={setHour}
            visible={visible}
            onVisibleChange={setVisible}
            playing={playing}
            onPlayingChange={setPlaying}
            intervalMiles={intervalMiles}
            dragHandleProps={dock.handleProps}
          />
        </div>
      )}
      {plan && children}
    </div>
  )
}
