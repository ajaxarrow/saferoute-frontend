import sample from '@/api/fixtures/plan.sample.json'
import type { Heatmap, PlanResponse } from '@/api/types'
import { heatmapToGeoJSON, hourProperty } from './heatmapGeoJson'

const heatmap = (sample as unknown as PlanResponse).heatmap

describe('heatmapToGeoJSON', () => {
  it('creates one point per grid cell with a risk property for every forecast hour', () => {
    const fc = heatmapToGeoJSON(heatmap)
    expect(fc.features).toHaveLength(heatmap.points.length)
    const keys = Object.keys(fc.features[0].properties)
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
})
