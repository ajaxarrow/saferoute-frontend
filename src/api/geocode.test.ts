import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { DENVER, feature, geocodeHandler } from '@/test/maptilerMock'
import { searchPlaces } from './geocode'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('searchPlaces', () => {
  it('asks MapTiler for worldwide autocomplete results with the key and the typed text', async () => {
    let url: URL | undefined
    server.use(geocodeHandler({ denv: [DENVER] }, (u) => (url = u)))
    await searchPlaces('denv')
    expect(url?.pathname).toBe('/geocoding/denv.json')
    expect(url?.searchParams.get('key')).toBe('test-key')
    expect(url?.searchParams.has('country')).toBe(false)
    expect(url?.searchParams.get('autocomplete')).toBe('true')
  })

  it('maps a feature to a Place with a short "City, ST" label', async () => {
    server.use(geocodeHandler({ denv: [DENVER] }))
    expect(await searchPlaces('denv')).toEqual([
      { label: 'Denver, CO', name: 'Denver', region: 'CO', lat: 39.74, lon: -104.99 },
    ])
  })

  it('labels an address as "number street, city, ST"', async () => {
    const address = feature({ text: 'Main Street', address: '100', city: 'Denver', region: 'Colorado', lon: -105, lat: 39.7, type: 'address' })
    server.use(geocodeHandler({ '100 main': [address] }))
    const [place] = await searchPlaces('100 main')
    expect(place).toMatchObject({ label: '100 Main Street, Denver, CO', name: '100 Main Street', region: 'CO' })
  })

  it('keeps the city for a neighbourhood and abbreviates every state, including DC', async () => {
    const hood = feature({ text: 'Austin', city: 'Chicago', region: 'Illinois', lon: -87.7, lat: 41.9, type: 'neighbourhood' })
    const dc = feature({ text: 'Washington', region: 'Columbia', lon: -77, lat: 38.9 })
    server.use(geocodeHandler({ austin: [hood], wash: [dc] }))
    expect((await searchPlaces('austin'))[0].label).toBe('Austin, Chicago, IL')
    expect((await searchPlaces('wash'))[0]).toMatchObject({ label: 'Washington, DC', region: 'DC' })
  })

  it('throws a readable error when MapTiler rejects the request', async () => {
    server.use(http.get('https://api.maptiler.com/geocoding/:q', () => HttpResponse.json({}, { status: 403 })))
    await expect(searchPlaces('denv')).rejects.toThrow(/place search/i)
  })

  it('throws a readable error on a network failure', async () => {
    server.use(http.get('https://api.maptiler.com/geocoding/:q', () => HttpResponse.error()))
    await expect(searchPlaces('denv')).rejects.toThrow(/place search/i)
  })
})
