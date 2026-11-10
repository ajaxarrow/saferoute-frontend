import { apiFetch } from './client'
import type { PlanRequest, PlanResponse } from './types'

export function planTrip(request: PlanRequest): Promise<PlanResponse> {
  return apiFetch<PlanResponse>('/api/plan/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
}
