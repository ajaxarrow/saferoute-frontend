import type { Feature, FeatureCollection, Point } from 'geojson'
import type { ExpressionSpecification } from 'maplibre-gl'
import type { Heatmap } from '@/api/types'

export const hourProperty = (hour: number) => `r${hour}`

/**
 * One Point per grid cell carrying a risk value for every forecast hour (r0…r48), so scrubbing the
 * slider only changes which property the paint expressions read — the data is never re-sent.
 */
export function heatmapToGeoJSON(heatmap: Heatmap): FeatureCollection<Point, Record<string, number | string>> {
  const features: Feature<Point, Record<string, number | string>>[] = heatmap.points.map((coordinates, i) => {
    const properties: Record<string, number | string> = {}
    for (let h = 0; h < heatmap.risk.length; h++) properties[hourProperty(h)] = heatmap.risk[h][i]
    if (heatmap.route_ids) properties.routes = `,${heatmap.route_ids[i].join(',')},`
    return { type: 'Feature', properties, geometry: { type: 'Point', coordinates } }
  })
  return { type: 'FeatureCollection', features }
}

/** Map filter that keeps only the cells on one route, so the weather shown is the selected route's. */
export const heatmapRouteFilter = (routeId: string): ExpressionSpecification => ['in', `,${routeId},`, ['get', 'routes']]
