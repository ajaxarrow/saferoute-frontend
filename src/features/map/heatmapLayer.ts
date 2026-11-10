import type { FeatureCollection } from 'geojson'
import type { ExpressionSpecification, GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl'
import type { Heatmap } from '@/api/types'
import { RISK } from '@/lib/risk'
import { heatmapRouteFilter, heatmapToGeoJSON, hourProperty } from './heatmapGeoJson'

export const HEAT = { source: 'heat', glow: 'heat-glow', cells: 'heat-cells' } as const

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] }
const CLEAR = 'rgba(0,0,0,0)'

const weightFor = (hour: number): ExpressionSpecification => ['/', ['get', hourProperty(hour)], 4]

const cellColorFor = (hour: number): ExpressionSpecification => [
  'match',
  ['get', hourProperty(hour)],
  1, RISK.MODERATE.color,
  2, RISK.HIGH.color,
  3, RISK.SEVERE.color,
  4, RISK.NO_TRAVEL.color,
  CLEAR,
]

/** Adds the heatmap below `beforeId` so route lines stay on top. Safe to call after each style load. */
export function addHeatmapLayers(map: MapLibreMap, beforeId: string): void {
  if (!map.getSource(HEAT.source)) map.addSource(HEAT.source, { type: 'geojson', data: EMPTY })

  // Wide, smooth glow for the zoomed-out "corridor" view.
  map.addLayer(
    {
      id: HEAT.glow,
      type: 'heatmap',
      source: HEAT.source,
      paint: {
        'heatmap-weight': weightFor(0),
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 3, 0.9, 9, 1.6],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 3, 18, 6, 38, 9, 80],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, CLEAR,
          0.1, 'rgba(234,179,8,0.35)',
          0.35, 'rgba(249,115,22,0.55)',
          0.6, 'rgba(220,38,38,0.65)',
          0.85, 'rgba(126,34,206,0.75)',
        ],
        'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.95, 9.5, 0],
      },
    },
    beforeId,
  )

  // Soft per-cell blobs with exact risk colours once zoomed in.
  map.addLayer(
    {
      id: HEAT.cells,
      type: 'circle',
      source: HEAT.source,
      paint: {
        'circle-color': cellColorFor(0),
        'circle-radius': ['interpolate', ['exponential', 2], ['zoom'], 5, 14, 8, 40, 11, 150],
        'circle-blur': 0.9,
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 6.5, 0, 8.5, 0.6],
      },
    },
    beforeId,
  )
}

export function setHeatmapData(map: MapLibreMap, heatmap: Heatmap | undefined): void {
  ;(map.getSource(HEAT.source) as GeoJSONSource | undefined)?.setData(heatmap ? heatmapToGeoJSON(heatmap) : EMPTY)
}

/** The only work done while scrubbing: repoint two paint expressions at another hour's property. */
export function setHeatmapHour(map: MapLibreMap, hour: number): void {
  if (!map.getLayer(HEAT.glow) || !map.getLayer(HEAT.cells)) return
  map.setPaintProperty(HEAT.glow, 'heatmap-weight', weightFor(hour))
  map.setPaintProperty(HEAT.cells, 'circle-color', cellColorFor(hour))
}

/** Shows only the selected route's weather. Older responses without route membership show everything. */
export function setHeatmapRoute(map: MapLibreMap, routeId: string | undefined, hasMembership: boolean): void {
  const filter = routeId && hasMembership ? heatmapRouteFilter(routeId) : null
  for (const id of [HEAT.glow, HEAT.cells]) {
    if (map.getLayer(id)) map.setFilter(id, filter)
  }
}

export function setHeatmapVisible(map: MapLibreMap, visible: boolean): void {
  for (const id of [HEAT.glow, HEAT.cells]) {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none')
  }
}
