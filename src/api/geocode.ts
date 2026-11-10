import { US_STATE_CODES } from '@/lib/usStates'
import { MAPTILER_KEY, maptilerUrl } from './maptiler'
import { MOCK_ENABLED, mockPlaces } from './mock'
import type { Place } from './types'

const RESULT_COUNT = '6'
const COUNTRY = 'us'
const SEARCH_ERROR = 'Place search is unavailable. Try again in a moment.'

interface ContextEntry {
  id: string
  text: string
}

interface GeocodeFeature {
  text: string
  /** House number, for address results. */
  address?: string
  place_type: string[]
  center: [number, number]
  context?: ContextEntry[]
}

const contextText = (feature: GeocodeFeature, type: string) => feature.context?.find((c) => c.id.startsWith(`${type}.`))?.text

/**
 * "100 Main Street, Denver, CO". Built from the structured fields because MapTiler's `place_name`
 * has no state abbreviation and mixes postcodes into the state ("Columbia 20003").
 */
export function toPlace(feature: GeocodeFeature): Place {
  const name = feature.address ? `${feature.address} ${feature.text}` : feature.text
  const kind = feature.place_type[0]
  const city = kind === 'municipality' || kind === 'region' ? undefined : contextText(feature, 'municipality')
  const state = contextText(feature, 'region')
  const code = state ? (US_STATE_CODES[state] ?? state) : ''
  const parts = [name, city, kind === 'region' ? undefined : code].filter((part): part is string => Boolean(part))
  const [lon, lat] = feature.center
  return { label: parts.join(', '), name, region: code, lat, lon }
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
