import sample from '@/api/fixtures/plan.sample.json'
import type { PlanResponse, PlannedRoute } from '@/api/types'
import { boundsOf, checkpointsToGeoJSON, riskSegments, routesToGeoJSON } from './routeLayers'

const plan = sample as unknown as PlanResponse

describe('routesToGeoJSON', () => {
  it('marks exactly one route recommended and one selected', () => {
    const fc = routesToGeoJSON(plan, 'route-3')
    expect(fc.features).toHaveLength(plan.routes.length)
    expect(fc.features.filter((f) => f.properties.isRecommended).map((f) => f.properties.id)).toEqual([plan.recommended_route_id])
    expect(fc.features.filter((f) => f.properties.isSelected).map((f) => f.properties.id)).toEqual(['route-3'])
  })

  it('emits [lon, lat] LineStrings', () => {
    const f = routesToGeoJSON(plan, 'route-1').features[0]
    expect(f.geometry.type).toBe('LineString')
    expect(f.geometry.coordinates[0]).toEqual(plan.routes[0].geometry[0])
  })
})

describe('checkpointsToGeoJSON', () => {
  it('carries risk, colour and index for each checkpoint', () => {
    const route = plan.routes[0]
    const fc = checkpointsToGeoJSON(route)
    expect(fc.features).toHaveLength(route.checkpoints.length)
    const f = fc.features[3]
    expect(f.properties).toMatchObject({ index: 3, routeId: route.id, risk: route.checkpoints[3].risk })
    expect(f.properties.color).toMatch(/^#[0-9a-f]{6}$/i)
    expect(f.geometry.coordinates).toEqual([route.checkpoints[3].lon, route.checkpoints[3].lat])
  })
})

describe('boundsOf', () => {
  it('contains every route coordinate', () => {
    const [[w, s], [e, n]] = boundsOf(plan)
    for (const r of plan.routes)
      for (const [lon, lat] of r.geometry) {
        expect(lon).toBeGreaterThanOrEqual(w)
        expect(lon).toBeLessThanOrEqual(e)
        expect(lat).toBeGreaterThanOrEqual(s)
        expect(lat).toBeLessThanOrEqual(n)
      }
  })
})

describe('riskSegments', () => {
  // ~138 mi north-south line with checkpoints at the ends and the middle.
  const route = {
    id: 'r',
    geometry: [
      [0, 0],
      [0, 1],
      [0, 2],
    ],
    summary: { total_miles: 138 },
    checkpoints: [
      { index: 0, mile: 0, risk: 'LOW' },
      { index: 1, mile: 69, risk: 'SEVERE' },
      { index: 2, mile: 138, risk: 'LOW' },
    ],
  } as unknown as PlannedRoute

  it('splits the line at the halfway points and colours each part by its checkpoint', () => {
    const segs = riskSegments(route)
    expect(segs.map((s) => s.properties.risk)).toEqual(['LOW', 'SEVERE', 'LOW'])
    const severe = segs[1].geometry.coordinates
    expect(severe[0][1]).toBeCloseTo(0.5, 1)
    expect(severe[severe.length - 1][1]).toBeCloseTo(1.5, 1)
  })

  it('merges neighbouring segments with the same risk so the map draws fewer features', () => {
    const merged = riskSegments({ ...route, checkpoints: route.checkpoints.map((c) => ({ ...c, risk: 'LOW' })) } as PlannedRoute)
    expect(merged).toHaveLength(1)
    expect(merged[0].geometry.coordinates[0]).toEqual([0, 0])
    expect(merged[0].geometry.coordinates.at(-1)).toEqual([0, 2])
  })
})
