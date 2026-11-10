import { MAPTILER_KEY, maptilerUrl } from './maptiler'
import { MOCK_ENABLED, mockPlaces } from './mock'
import type { Place } from './types'

const RESULT_COUNT = '6'
const COUNTRY = 'us'
const SEARCH_ERROR = 'Place search is unavailable. Try again in a moment.'

interface ContextEntry {
  id: string
  text: string
  short_code?: string
}

interface GeocodeFeature {
  text: string
  place_name: string
  center: [number, number]
  context?: ContextEntry[]
}

/** "Denver, Colorado, United States" → { label: "Denver, CO", name: "Denver", region: "CO" }. */
export function toPlace(feature: GeocodeFeature): Place {
  const state = feature.context?.find((c) => c.id.startsWith('region'))
  const code = state?.short_code?.replace(/^US-/i, '') ?? ''
  const parts = feature.place_name
    .split(', ')
    .filter((part) => part !== 'United States')
    .map((part) => (code && part === state?.text ? code : part))
  const [lon, lat] = feature.center
  return { label: parts.join(', '), name: parts[0] ?? feature.text, region: code, lat, lon }
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  if (MOCK_ENABLED) return mockPlaces(query)
  if (!MAPTILER_KEY) throw new Error('Place search needs a MapTiler key. Set VITE_MAPTILER_KEY in frontend/.env.')

  let response: Response
  try {
    response = await fetch(
      maptilerUrl(`geocoding/${encodeURIComponent(query)}.json`, {
        country: COUNTRY,
        limit: RESULT_COUNT,
        autocomplete: 'true',
        language: 'en',
      }),
      { signal },
    )
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new Error(SEARCH_ERROR)
  }
  if (!response.ok) throw new Error(SEARCH_ERROR)

  const body = (await response.json()) as { features: GeocodeFeature[] }
  return body.features.map(toPlace)
}
