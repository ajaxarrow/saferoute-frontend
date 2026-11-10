import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { DENVER, feature, geocodeHandler } from '@/test/maptilerMock'
import { searchPlaces } from './geocode'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('searchPlaces', () => {
  it('asks MapTiler for US results with the key and the typed text', async () => {
    let url: URL | undefined
    server.use(geocodeHandler({ denv: [DENVER] }, (u) => (url = u)))
    await searchPlaces('denv')
    expect(url?.pathname).toBe('/geocoding/denv.json')
    expect(url?.searchParams.get('key')).toBe('test-key')
    expect(url?.searchParams.get('country')).toBe('us')
    expect(url?.searchParams.get('autocomplete')).toBe('true')
  })

  it('maps a feature to a Place with a short "City, ST" label', async () => {
    server.use(geocodeHandler({ denv: [DENVER] }))
    expect(await searchPlaces('denv')).toEqual([
      { label: 'Denver, CO', name: 'Denver', region: 'CO', lat: 39.74, lon: -104.99 },
    ])
  })

  it('keeps the street part of an address', async () => {
    const address = {
      ...feature({ text: 'Main Street', region: 'Colorado', code: 'CO', lon: -105, lat: 39.7 }),
      place_type: ['address'],
      place_name: '100 Main Street, Denver, Colorado, United States',
    }
    server.use(geocodeHandler({ '100 main': [address] }))
    const [place] = await searchPlaces('100 main')
    expect(place).toMatchObject({ label: '100 Main Street, Denver, CO', name: '100 Main Street', region: 'CO' })
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
