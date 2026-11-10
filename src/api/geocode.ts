import { apiFetch } from './client'
import { MOCK_ENABLED, mockPlaces } from './mock'
import type { Place } from './types'

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  if (MOCK_ENABLED) return mockPlaces(query)
  const { results } = await apiFetch<{ results: Place[] }>(`/api/geocode/?q=${encodeURIComponent(query)}`, { signal })
  return results
}
