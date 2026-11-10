import { Map as MapLibreMap, Marker, NavigationControl, Popup, type MapLayerMouseEvent } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'
import type { Checkpoint, Place, PlanResponse, PlannedRoute, RoutePreview } from '@/api/types'
import { checkpointPopupHtml } from './checkpointPopup'
import { addHeatmapLayers, setHeatmapData, setHeatmapHour, setHeatmapRoute, setHeatmapVisible } from './heatmapLayer'
import { addRouteLayers, LAYER, setPreviewData, setRouteData } from './mapLayers'
import { addEndpointMarkers, addPlanMarkers, createTruckMarker } from './mapMarkers'
import { mapStyleUrl, type Theme } from './mapStyle'
import { boundsOf, boundsOfPoints } from './routeLayers'

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
  /** Places chosen in the form; the map reacts as soon as they are set. */
  origin?: Place | null
  destination?: Place | null
  /** Candidate routes for those places, shown until a full plan replaces them. */
  preview?: RoutePreview[]
  selectedRouteId?: string
  onSelectRoute: (id: string) => void
  theme: Theme
  fitPadding: FitPadding
  focus?: MapFocus | null
  heatmapHour: number
  heatmapVisible: boolean
  /** Where the truck is at the forecast hour being shown. */
  truckPosition?: [number, number]
}

const US_CENTER: [number, number] = [-98.5, 39.5]

export function MapView({ plan, origin, destination, preview, selectedRouteId, onSelectRoute, theme, fitPadding, focus, heatmapHour, heatmapVisible, truckPosition }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const popupRef = useRef<Popup | null>(null)
  const [styleVersion, setStyleVersion] = useState(0) // bumps whenever a (new) style finished loading

  // Latest props for event handlers registered once at map creation.
  const live = useRef({ plan, onSelectRoute, theme })
  useEffect(() => {
    live.current = { plan, onSelectRoute, theme }
  })

  /** Opens the checkpoint popup, replacing any popup that is already open. */
  const showPopup = (map: MapLibreMap, route: PlannedRoute, cp: Checkpoint) => {
    popupRef.current?.remove()
    popupRef.current = new Popup({ offset: 14, maxWidth: '300px' })
      .setLngLat([cp.lon, cp.lat])
      .setHTML(checkpointPopupHtml(route, cp))
      .addTo(map)
  }

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
      addHeatmapLayers(map, LAYER.hit)
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
      if (route && cp) showPopup(map, route, cp)
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
    if (mapRef.current) setHeatmapData(mapRef.current, plan?.heatmap)
  }, [plan, styleVersion])

  // Before a plan exists the map follows the form: pin + zoom to the origin, then frame the candidate routes.
  const showPreview = plan ? undefined : preview
  useEffect(() => {
    if (mapRef.current) setPreviewData(mapRef.current, showPreview ?? [])
  }, [showPreview, styleVersion])

  const originKey = origin ? `${origin.lon},${origin.lat}` : ''
  const destinationKey = destination ? `${destination.lon},${destination.lat}` : ''
  useEffect(() => {
    const map = mapRef.current
    if (!map || plan) return
    const from = origin ? ([origin.lon, origin.lat] as [number, number]) : null
    const to = destination ? ([destination.lon, destination.lat] as [number, number]) : null
    popupRef.current?.remove()
    const removeMarkers = addEndpointMarkers(map, from, to)

    if (preview?.length) {
      map.fitBounds(boundsOfPoints(preview.flatMap((r) => r.geometry)), { padding: fitPadding, duration: 900, maxZoom: 11 })
    } else if (from && to) {
      map.fitBounds(boundsOfPoints([from, to]), { padding: fitPadding, duration: 900, maxZoom: 11 })
    } else if (from || to) {
      map.flyTo({ center: (from ?? to)!, zoom: 9, duration: 900 })
    }
    return removeMarkers
    // Re-frame when the places or their routes change, not when padding changes with layout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, originKey, destinationKey, preview])

  // The heatmap shows the selected route's weather only.
  const hasMembership = Boolean(plan?.heatmap.route_ids)
  useEffect(() => {
    if (mapRef.current) setHeatmapRoute(mapRef.current, selectedId, hasMembership)
  }, [selectedId, hasMembership, plan, styleVersion])

  // The truck marker rides the selected route as the forecast hour moves.
  const truckRef = useRef<Marker | null>(null)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !plan || !truckPosition) {
      truckRef.current?.remove()
      truckRef.current = null
      return
    }
    if (!truckRef.current) truckRef.current = createTruckMarker().setLngLat(truckPosition).addTo(map)
    else truckRef.current.setLngLat(truckPosition)
  }, [plan, truckPosition, styleVersion])
  useEffect(
    () => () => {
      truckRef.current?.remove()
    },
    [],
  )

  // Scrubbing only repoints paint expressions; coalesce bursts to one update per frame.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (mapRef.current) setHeatmapHour(mapRef.current, heatmapHour)
    })
    return () => cancelAnimationFrame(frame)
  }, [heatmapHour, plan, styleVersion])

  useEffect(() => {
    if (mapRef.current) setHeatmapVisible(mapRef.current, heatmapVisible)
  }, [heatmapVisible, plan, styleVersion])

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
    showPopup(map, route, cp)
  }, [focus, plan])

  return <div ref={containerRef} className="size-full" />
}
