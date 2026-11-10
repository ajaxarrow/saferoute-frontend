import { apiFetch } from './client'
import { MOCK_ENABLED, mockPreview } from './mock'
import type { Place, RoutePreview } from './types'

type Endpoint = Pick<Place, 'label' | 'lat' | 'lon'>

export async function fetchRoutePreview(trip: { origin: Endpoint; destination: Endpoint }, signal?: AbortSignal): Promise<RoutePreview[]> {
  if (MOCK_ENABLED) return mockPreview()
  const { routes } = await apiFetch<{ routes: RoutePreview[] }>('/api/routes/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin: pick(trip.origin), destination: pick(trip.destination) }),
    signal,
  })
  return routes
}

const pick = ({ label, lat, lon }: Endpoint) => ({ label, lat, lon })
