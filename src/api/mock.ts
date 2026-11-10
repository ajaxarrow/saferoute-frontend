import type { Place, PlanResponse } from './types'

/** `npm run dev` + `?mock` in the URL serves canned data, for UI work without API keys. */
export const MOCK_ENABLED = import.meta.env.DEV && new URLSearchParams(window.location.search).has('mock')

const CITIES: Place[] = [
  { label: 'Los Angeles, CA, USA', name: 'Los Angeles', region: 'CA', lat: 34.05, lon: -118.24 },
  { label: 'Denver, CO, USA', name: 'Denver', region: 'CO', lat: 39.74, lon: -104.99 },
  { label: 'Dallas, TX, USA', name: 'Dallas', region: 'TX', lat: 32.78, lon: -96.8 },
  { label: 'Seattle, WA, USA', name: 'Seattle', region: 'WA', lat: 47.61, lon: -122.33 },
]

export async function mockPlaces(query: string): Promise<Place[]> {
  await new Promise((resolve) => setTimeout(resolve, 150))
  return CITIES.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
}

export async function mockPlan(): Promise<PlanResponse> {
  await new Promise((resolve) => setTimeout(resolve, 1200))
  return (await import('./fixtures/plan.sample.json')).default as unknown as PlanResponse
}
