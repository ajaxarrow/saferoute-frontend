import type { FeatureCollection } from 'geojson'
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl'
import type { PlanResponse, RoutePreview } from '@/api/types'
import { checkpointsToGeoJSON, previewToGeoJSON, riskSegments, routesToGeoJSON } from './routeLayers'

export const SOURCE = { routes: 'routes', risk: 'selected-risk', checkpoints: 'checkpoints', preview: 'route-preview' } as const
export const LAYER = {
  previewCasing: 'route-preview-casing',
  preview: 'route-preview-line',
  hit: 'routes-hit',
  other: 'routes-other',
  casing: 'selected-casing',
  risk: 'selected-risk-line',
  checkpoints: 'checkpoints',
} as const

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] }

/** Adds sources and layers. Safe to call after every style change (theme switch wipes them). */
export function addRouteLayers(map: MapLibreMap): void {
  for (const id of Object.values(SOURCE)) {
    if (!map.getSource(id)) map.addSource(id, { type: 'geojson', data: EMPTY })
  }
  const line = { 'line-join': 'round', 'line-cap': 'round' } as const

  // Candidate routes shown before the weather check runs: bold fastest, softer alternatives.
  map.addLayer({
    id: LAYER.previewCasing,
    type: 'line',
    source: SOURCE.preview,
    layout: line,
    paint: { 'line-color': '#ffffff', 'line-width': ['case', ['==', ['get', 'rank'], 0], 11, 9], 'line-opacity': 0.9 },
  })
  map.addLayer({
    id: LAYER.preview,
    type: 'line',
    source: SOURCE.preview,
    layout: line,
    paint: {
      'line-color': '#2563eb',
      'line-width': ['case', ['==', ['get', 'rank'], 0], 7, 5],
      'line-opacity': ['case', ['==', ['get', 'rank'], 0], 1, 0.55],
    },
  })

  map.addLayer({
    id: LAYER.hit,
    type: 'line',
    source: SOURCE.routes,
    layout: line,
    paint: { 'line-width': 24, 'line-opacity': 0 },
  })
  map.addLayer({
    id: LAYER.other,
    type: 'line',
    source: SOURCE.routes,
    filter: ['!', ['get', 'isSelected']],
    layout: line,
    paint: { 'line-color': '#9aa0a6', 'line-width': 6, 'line-opacity': 1 },
  })
  map.addLayer({
    id: LAYER.casing,
    type: 'line',
    source: SOURCE.routes,
    filter: ['get', 'isSelected'],
    layout: line,
    paint: { 'line-color': '#ffffff', 'line-width': 11, 'line-opacity': 0.95 },
  })
  map.addLayer({
    id: LAYER.risk,
    type: 'line',
    source: SOURCE.risk,
    layout: { 'line-join': 'round', 'line-cap': 'butt' },
    paint: { 'line-color': ['get', 'color'], 'line-width': 7 },
  })
  map.addLayer({
    id: LAYER.checkpoints,
    type: 'circle',
    source: SOURCE.checkpoints,
    paint: {
      'circle-color': ['get', 'color'],
      'circle-radius': ['case', ['get', 'severe'], 9, 7],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2.5,
    },
  })
}

function setData(map: MapLibreMap, id: string, data: GeoJSON.GeoJSON) {
  ;(map.getSource(id) as GeoJSONSource | undefined)?.setData(data)
}

/** Pushes the current plan and selection into the map's sources (no layer churn). */
export function setRouteData(map: MapLibreMap, plan: PlanResponse | undefined, selectedId: string | undefined): void {
  const selected = plan?.routes.find((r) => r.id === selectedId) ?? plan?.routes[0]
  setData(map, SOURCE.routes, plan && selected ? routesToGeoJSON(plan, selected.id) : EMPTY)
  setData(map, SOURCE.risk, selected ? { type: 'FeatureCollection', features: riskSegments(selected) } : EMPTY)
  setData(map, SOURCE.checkpoints, selected ? checkpointsToGeoJSON(selected) : EMPTY)
}

/** Candidate routes for the chosen places; pass an empty list to clear them. */
export function setPreviewData(map: MapLibreMap, routes: RoutePreview[]): void {
  setData(map, SOURCE.preview, routes.length ? previewToGeoJSON(routes) : EMPTY)
}
