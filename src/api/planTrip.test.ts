import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { ApiError } from './client'
import { searchPlaces } from './geocode'
import { planTrip } from './planTrip'
import type { PlanRequest } from './types'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const request: PlanRequest = {
  origin: { label: 'LA', lat: 34, lon: -118 },
  destination: { label: 'Denver', lat: 39.7, lon: -105 },
  departure_local: '2026-12-15T05:00',
  load_lb: 42000,
  interval_miles: 25,
}

describe('planTrip', () => {
  it('posts the request and returns the plan', async () => {
    let received: unknown
    server.use(
      http.post('http://localhost:8000/api/plan/', async ({ request: r }) => {
        received = await r.json()
        return HttpResponse.json({ recommended_route_id: 'route-1', routes: [] })
      }),
    )
    const plan = await planTrip(request)
    expect(plan.recommended_route_id).toBe('route-1')
    expect(received).toEqual(request)
  })

  it('throws ApiError with the server code and message on 422', async () => {
    server.use(
      http.post('http://localhost:8000/api/plan/', () =>
        HttpResponse.json({ error: { code: 'no_route', message: 'No truck route found.' } }, { status: 422 }),
      ),
    )
    await expect(planTrip(request)).rejects.toMatchObject({ code: 'no_route', message: 'No truck route found.' })
    await expect(planTrip(request)).rejects.toBeInstanceOf(ApiError)
  })

  it('turns a network failure into a friendly ApiError', async () => {
    server.use(http.post('http://localhost:8000/api/plan/', () => HttpResponse.error()))
    await expect(planTrip(request)).rejects.toMatchObject({ code: 'network' })
  })
})

describe('searchPlaces', () => {
  it('returns results and sends the query', async () => {
    server.use(
      http.get('http://localhost:8000/api/geocode/', ({ request: r }) => {
        expect(new URL(r.url).searchParams.get('q')).toBe('denv')
        return HttpResponse.json({ results: [{ label: 'Denver, CO, USA', name: 'Denver', region: 'CO', lat: 39.7, lon: -105 }] })
      }),
    )
    const places = await searchPlaces('denv')
    expect(places[0].name).toBe('Denver')
  })
})
