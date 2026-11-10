import { useQuery } from '@tanstack/react-query'
import type { ApiError } from '@/api/client'
import { fetchRoutePreview } from '@/api/routePreview'
import type { Place, RoutePreview } from '@/api/types'

const sameSpot = (a: Place, b: Place) => Math.abs(a.lat - b.lat) < 1e-4 && Math.abs(a.lon - b.lon) < 1e-4

/** Candidate routes for the chosen places, fetched as soon as both are set (routing only, no weather). */
export function useRoutePreview(origin: Place | null, destination: Place | null) {
  const ready = Boolean(origin && destination && !sameSpot(origin, destination))
  return useQuery<RoutePreview[], ApiError>({
    queryKey: ['route-preview', origin?.lat, origin?.lon, destination?.lat, destination?.lon],
    queryFn: ({ signal }) => fetchRoutePreview({ origin: origin!, destination: destination! }, signal),
    enabled: ready,
    staleTime: 10 * 60_000,
    retry: false,
  })
}
