import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { ApiError } from './client'
import { fetchRoutePreview } from './routePreview'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const origin = { label: 'LA', lat: 34, lon: -118 }
const destination = { label: 'Denver', lat: 39.7, lon: -105 }

describe('fetchRoutePreview', () => {
  it('posts both places and returns the routes', async () => {
    let received: unknown
    server.use(
      http.post('http://localhost:8000/api/routes/', async ({ request }) => {
        received = await request.json()
        return HttpResponse.json({ routes: [{ id: 'route-1', label: 'Route 1', via: 'via I-15', total_miles: 1016, duration_s: 59000, geometry: [[-118, 34], [-105, 39.7]] }] })
      }),
    )
    const routes = await fetchRoutePreview({ origin, destination })
    expect(received).toEqual({ origin, destination })
    expect(routes).toHaveLength(1)
    expect(routes[0].via).toBe('via I-15')
  })

  it('surfaces the server message when no route exists', async () => {
    server.use(http.post('http://localhost:8000/api/routes/', () => HttpResponse.json({ error: { code: 'no_route', message: 'No truck route found.' } }, { status: 422 })))
    await expect(fetchRoutePreview({ origin, destination })).rejects.toBeInstanceOf(ApiError)
    await expect(fetchRoutePreview({ origin, destination })).rejects.toMatchObject({ code: 'no_route' })
  })
})
