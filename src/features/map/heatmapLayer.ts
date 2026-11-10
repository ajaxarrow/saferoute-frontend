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
  0, RISK.LOW.color, // calm weather is drawn too, so the corridor never looks like "no heatmap"
  1, RISK.MODERATE.color,
  2, RISK.HIGH.color,
  3, RISK.SEVERE.color,
  4, RISK.NO_TRAVEL.color,
  CLEAR,
]

// Calm weather is drawn too (a clear green band); elevated risk is much heavier so trouble jumps out.
const cellOpacityFor = (hour: number): ExpressionSpecification => ['match', ['get', hourProperty(hour)], 0, 0.3, 0.55]

/** Adds the heatmap (a soft risk-coloured band along the trip corridor) below `beforeId` so route lines stay on top. Safe to call after each style load. */
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
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 3, 1.6, 9, 2.4],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 3, 30, 6, 60, 9, 110],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, CLEAR,
          0.1, 'rgba(234,179,8,0.7)',
          0.35, 'rgba(249,115,22,0.85)',
          0.6, 'rgba(220,38,38,0.9)',
          0.85, 'rgba(127,29,29,0.95)',
        ],
        'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.6, 9.5, 0],
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
        'circle-radius': ['interpolate', ['exponential', 2], ['zoom'], 3, 14, 5, 26, 8, 62, 11, 190],
        'circle-blur': 0.55,
        'circle-opacity': cellOpacityFor(0),
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
  map.setPaintProperty(HEAT.cells, 'circle-opacity', cellOpacityFor(hour))
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
