import { useEffect, useState } from 'react'
import type { PlanResponse } from '@/api/types'
import { HeatmapControl } from './HeatmapControl'
import { MapView, type FitPadding, type MapFocus } from './MapView'
import type { Theme } from './mapStyle'
import { cn } from '@/lib/utils'

interface MapPaneProps {
  plan?: PlanResponse
  selectedRouteId?: string
  onSelectRoute: (id: string) => void
  theme: Theme
  fitPadding: FitPadding
  focus: MapFocus | null
  isDesktop: boolean
}

/**
 * The map plus its forecast slider. The slider's hour lives here, not in App, so scrubbing
 * re-renders only this pane and never the form or results list.
 */
export function MapPane({ plan, selectedRouteId, onSelectRoute, theme, fitPadding, focus, isDesktop }: MapPaneProps) {
  const [hour, setHour] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setHour(0)
    setPlaying(false)
  }, [plan])

  const origin = plan?.routes[0].checkpoints[0]

  return (
    <div className="relative size-full">
      <MapView
        plan={plan}
        selectedRouteId={selectedRouteId}
        onSelectRoute={onSelectRoute}
        theme={theme}
        fitPadding={fitPadding}
        focus={focus}
        heatmapHour={hour}
        heatmapVisible={visible}
      />
      {plan && origin && (
        <div className={cn('absolute z-10', isDesktop ? 'inset-x-0 bottom-5 mx-auto w-[min(560px,calc(100%-2rem))]' : 'inset-x-3 top-3')}>
          <HeatmapControl
            hour={hour}
            maxHour={plan.heatmap.hours - 1}
            onHourChange={setHour}
            departureIso={origin.eta_utc}
            tz={origin.tz}
            visible={visible}
            onVisibleChange={setVisible}
            playing={playing}
            onPlayingChange={setPlaying}
          />
        </div>
      )}
    </div>
  )
}
