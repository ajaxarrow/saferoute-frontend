import { http, HttpResponse } from 'msw'

interface FakePlace {
  text: string
  region: string
  /** Two-letter state code, e.g. "CO". */
  code: string
  lon: number
  lat: number
}

/** A MapTiler geocoding GeoJSON feature, shaped like the real API. */
export function feature({ text, region, code, lon, lat }: FakePlace) {
  return {
    id: `place.${text}`,
    place_type: ['place'],
    text,
    place_name: `${text}, ${region}, United States`,
    center: [lon, lat],
    context: [
      { id: 'region.1', text: region, short_code: `US-${code}` },
      { id: 'country.1', text: 'United States', short_code: 'us' },
    ],
  }
}

export const DENVER = feature({ text: 'Denver', region: 'Colorado', code: 'CO', lon: -104.99, lat: 39.74 })
export const LOS_ANGELES = feature({ text: 'Los Angeles', region: 'California', code: 'CA', lon: -118.24, lat: 34.05 })

/** msw handler for MapTiler geocoding: `byQuery` maps the typed text to features. */
export function geocodeHandler(byQuery: Record<string, unknown[]>, onCall?: (url: URL) => void) {
  return http.get('https://api.maptiler.com/geocoding/:query', ({ request, params }) => {
    const url = new URL(request.url)
    onCall?.(url)
    const query = decodeURIComponent(String(params.query)).replace(/\.json$/, '')
    return HttpResponse.json({ type: 'FeatureCollection', features: byQuery[query] ?? [] })
  })
}
