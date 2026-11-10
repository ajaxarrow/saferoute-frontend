import type { Feature, FeatureCollection, Point } from 'geojson'
import type { Heatmap } from '@/api/types'

export const hourProperty = (hour: number) => `r${hour}`

/**
 * One Point per grid cell carrying a risk value for every forecast hour (r0…r48), so scrubbing the
 * slider only changes which property the paint expressions read — the data is never re-sent.
 */
export function heatmapToGeoJSON(heatmap: Heatmap): FeatureCollection<Point, Record<string, number>> {
  const features: Feature<Point, Record<string, number>>[] = heatmap.points.map((coordinates, i) => {
    const properties: Record<string, number> = {}
    for (let h = 0; h < heatmap.risk.length; h++) properties[hourProperty(h)] = heatmap.risk[h][i]
    return { type: 'Feature', properties, geometry: { type: 'Point', coordinates } }
  })
  return { type: 'FeatureCollection', features }
}
