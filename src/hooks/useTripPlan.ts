import { useMutation } from '@tanstack/react-query'
import type { ApiError } from '@/api/client'
import { planTrip } from '@/api/planTrip'
import type { PlanRequest, PlanResponse } from '@/api/types'

/** `npm run dev` + `?mock` in the URL serves a canned plan, handy for UI work without API keys. */
const useMock = import.meta.env.DEV && new URLSearchParams(window.location.search).has('mock')

async function mockPlan(): Promise<PlanResponse> {
  await new Promise((resolve) => setTimeout(resolve, 1200))
  return (await import('@/api/fixtures/plan.sample.json')).default as unknown as PlanResponse
}

export function useTripPlan() {
  return useMutation<PlanResponse, ApiError, PlanRequest>({
    mutationFn: useMock ? mockPlan : planTrip,
    retry: false,
  })
}
