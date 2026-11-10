import { http, HttpResponse } from 'msw'

interface FakePlace {
  text: string
  /** Full state name, as MapTiler returns it (no abbreviation). */
  region: string
  lon: number
  lat: number
  /** Feature type; defaults to a city. */
  type?: string
  /** For addresses: house number and the city it is in. */
  address?: string
  city?: string
}

/** A MapTiler geocoding GeoJSON feature, shaped like the live API (verified against api.maptiler.com). */
export function feature({ text, region, lon, lat, type = 'municipality', address, city }: FakePlace) {
  const context = [
    ...(city ? [{ id: 'municipality.1', text: city, kind: 'admin_area' }] : []),
    { id: 'region.1', text: region, kind: 'admin_area' },
    { id: 'country.1', text: 'United States', kind: 'admin_area' },
  ]
  const head = address ? `${address} ${text}` : text
  return {
    id: `${type}.${head}`,
    place_type: [type],
    text,
    ...(address && { address }),
    place_name: [head, city, region, 'United States'].filter(Boolean).join(', '),
    center: [lon, lat],
    context,
  }
}

export const DENVER = feature({ text: 'Denver', region: 'Colorado', lon: -104.99, lat: 39.74 })
export const LOS_ANGELES = feature({ text: 'Los Angeles', region: 'California', lon: -118.24, lat: 34.05 })

/** msw handler for MapTiler geocoding: `byQuery` maps the typed text to features. */
export function geocodeHandler(byQuery: Record<string, unknown[]>, onCall?: (url: URL) => void) {
  return http.get('https://api.maptiler.com/geocoding/:query', ({ request, params }) => {
    const url = new URL(request.url)
    onCall?.(url)
    const query = decodeURIComponent(String(params.query)).replace(/\.json$/, '')
    return HttpResponse.json({ type: 'FeatureCollection', features: byQuery[query] ?? [] })
  })
}
