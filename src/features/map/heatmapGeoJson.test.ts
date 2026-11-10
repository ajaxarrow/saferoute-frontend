import sample from '@/api/fixtures/plan.sample.json'
import type { Heatmap, PlanResponse } from '@/api/types'
import { heatmapRouteFilter, heatmapToGeoJSON, hourProperty } from './heatmapGeoJson'

const heatmap = (sample as unknown as PlanResponse).heatmap

describe('heatmapToGeoJSON', () => {
  it('creates one point per grid cell with a risk property for every forecast hour', () => {
    const fc = heatmapToGeoJSON(heatmap)
    expect(fc.features).toHaveLength(heatmap.points.length)
    const keys = Object.keys(fc.features[0].properties).filter((k) => /^r\d+$/.test(k))
    expect(keys).toHaveLength(49)
    expect(keys[0]).toBe('r0')
    expect(keys[48]).toBe('r48')
  })

  it('maps risk[hour][point] onto r<hour> and keeps [lon, lat] order', () => {
    const small: Heatmap = {
      points: [
        [-105, 40],
        [-106, 41],
      ],
      hours: 3,
      risk: [
        [0, 1],
        [2, 3],
        [4, 0],
      ],
    }
    const fc = heatmapToGeoJSON(small)
    expect(fc.features[1].geometry.coordinates).toEqual([-106, 41])
    expect(fc.features[0].properties).toEqual({ r0: 0, r1: 2, r2: 4 })
    expect(fc.features[1].properties).toEqual({ r0: 1, r1: 3, r2: 0 })
  })

  it('names hour properties r<hour>', () => {
    expect(hourProperty(12)).toBe('r12')
  })

  it('tags each point with the routes it lies on, delimited so route-1 never matches route-10', () => {
    const tagged: Heatmap = { points: [[-105, 40], [-106, 41]], hours: 1, risk: [[0, 1]], route_ids: [['route-1', 'route-2'], ['route-3']] }
    const fc = heatmapToGeoJSON(tagged)
    expect(fc.features[0].properties.routes).toBe(',route-1,route-2,')
    expect(fc.features[1].properties.routes).toBe(',route-3,')
  })
})

describe('heatmapRouteFilter', () => {
  it('keeps only points on the given route', () => {
    expect(heatmapRouteFilter('route-2')).toEqual(['in', ',route-2,', ['get', 'routes']])
  })
})
