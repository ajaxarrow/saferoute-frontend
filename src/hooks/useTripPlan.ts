import { useMutation } from '@tanstack/react-query'
import type { ApiError } from '@/api/client'
import { MOCK_ENABLED, mockPlan } from '@/api/mock'
import { planTrip } from '@/api/planTrip'
import type { PlanRequest, PlanResponse } from '@/api/types'

export function useTripPlan() {
  return useMutation<PlanResponse, ApiError, PlanRequest>({
    mutationFn: MOCK_ENABLED ? () => mockPlan() : planTrip,
    retry: false,
  })
}
