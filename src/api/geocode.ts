import { apiFetch } from './client'
import type { Place } from './types'

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const { results } = await apiFetch<{ results: Place[] }>(`/api/geocode/?q=${encodeURIComponent(query)}`, { signal })
  return results
}
