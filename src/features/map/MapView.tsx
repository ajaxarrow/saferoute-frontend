import { Map as MapLibreMap, NavigationControl, Popup, type MapLayerMouseEvent } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'
import type { PlanResponse } from '@/api/types'
import { checkpointPopupHtml } from './checkpointPopup'
import { addRouteLayers, LAYER, setRouteData } from './mapLayers'
import { addPlanMarkers } from './mapMarkers'
import { mapStyleUrl, type Theme } from './mapStyle'
import { boundsOf } from './routeLayers'

export interface FitPadding {
  top: number
  right: number
  bottom: number
  left: number
}

export interface MapFocus {
  routeId: string
  index: number
  /** Changes on every request so focusing the same checkpoint twice still re-opens the popup. */
  nonce: number
}

interface MapViewProps {
  plan?: PlanResponse
  selectedRouteId?: string
  onSelectRoute: (id: string) => void
  theme: Theme
  fitPadding: FitPadding
  focus?: MapFocus | null
}

const US_CENTER: [number, number] = [-98.5, 39.5]

export function MapView({ plan, selectedRouteId, onSelectRoute, theme, fitPadding, focus }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [styleVersion, setStyleVersion] = useState(0) // bumps whenever a (new) style finished loading

  // Latest props for event handlers registered once at map creation.
  const live = useRef({ plan, onSelectRoute, theme })
  useEffect(() => {
    live.current = { plan, onSelectRoute, theme }
  })

  useEffect(() => {
    const map = new MapLibreMap({
      container: containerRef.current!,
      style: mapStyleUrl(live.current.theme),
      center: US_CENTER,
      zoom: 3.4,
      attributionControl: { compact: true },
    })
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    map.on('style.load', () => {
      addRouteLayers(map)
      setStyleVersion((v) => v + 1)
    })

    map.on('click', LAYER.hit, (e: MapLayerMouseEvent) => {
      const id = e.features?.[0]?.properties?.id as string | undefined
      if (id) live.current.onSelectRoute(id)
    })
    map.on('click', LAYER.checkpoints, (e: MapLayerMouseEvent) => {
      const props = e.features?.[0]?.properties
      const route = live.current.plan?.routes.find((r) => r.id === props?.routeId)
      const cp = route?.checkpoints[Number(props?.index)]
      if (route && cp) new Popup({ offset: 14, maxWidth: '300px' }).setLngLat([cp.lon, cp.lat]).setHTML(checkpointPopupHtml(route, cp)).addTo(map)
    })
    for (const layer of [LAYER.hit, LAYER.checkpoints]) {
      map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'))
      map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''))
    }

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Theme switch: swap the base style; 'style.load' re-adds our layers.
  const firstTheme = useRef(theme)
  useEffect(() => {
    if (firstTheme.current === theme) return
    firstTheme.current = theme
    mapRef.current?.setStyle(mapStyleUrl(theme))
  }, [theme])

  const selectedId = selectedRouteId ?? plan?.recommended_route_id

  useEffect(() => {
    if (mapRef.current) setRouteData(mapRef.current, plan, selectedId)
  }, [plan, selectedId, styleVersion])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !plan) return
    map.fitBounds(boundsOf(plan), { padding: fitPadding, duration: 900, maxZoom: 11 })
    return addPlanMarkers(map, plan)
    // Re-fit only for a new plan, not when padding changes with layout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !plan || !focus) return
    const route = plan.routes.find((r) => r.id === focus.routeId)
    const cp = route?.checkpoints[focus.index]
    if (!route || !cp) return
    map.flyTo({ center: [cp.lon, cp.lat], zoom: Math.max(map.getZoom(), 7), duration: 700 })
    new Popup({ offset: 14, maxWidth: '300px' }).setLngLat([cp.lon, cp.lat]).setHTML(checkpointPopupHtml(route, cp)).addTo(map)
  }, [focus, plan])

  return <div ref={containerRef} className="size-full" />
}
