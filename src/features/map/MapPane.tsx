import { useEffect, useMemo, useState } from 'react'
import type { Place, PlanResponse, RoutePreview } from '@/api/types'
import { truckAt } from '@/lib/journey'
import { TripWeatherCard } from './TripWeatherCard'
import { MapView, type FitPadding, type MapFocus } from './MapView'
import type { Theme } from './mapStyle'
import { cn } from '@/lib/utils'

interface MapPaneProps {
  plan?: PlanResponse
  origin?: Place | null
  destination?: Place | null
  preview?: RoutePreview[]
  selectedRouteId?: string
  onSelectRoute: (id: string) => void
  theme: Theme
  fitPadding: FitPadding
  focus: MapFocus | null
  isDesktop: boolean
  intervalMiles?: number
}

/**
 * The map plus its weather card. The forecast hour lives here, not in App, so scrubbing re-renders only this pane
 * and never the form or results list. The card and the heatmap follow the selected route.
 */
export function MapPane({ plan, origin: from, destination: to, preview, selectedRouteId, onSelectRoute, theme, fitPadding, focus, isDesktop, intervalMiles }: MapPaneProps) {
  const [hour, setHour] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setHour(0)
    setPlaying(false)
  }, [plan])

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
        focus={focus}
        heatmapHour={hour}
        heatmapVisible={visible}
        truckPosition={truck?.position}
      />
      {plan && route && truck && (
        <div className={cn('absolute z-10', isDesktop ? 'inset-x-0 bottom-5 mx-auto w-[min(580px,calc(100%-2rem))]' : 'inset-x-3 top-3')}>
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
          />
        </div>
      )}
    </div>
  )
}
