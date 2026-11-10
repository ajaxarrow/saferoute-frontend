import { render, screen } from '@testing-library/react'
import sample from '@/api/fixtures/plan.sample.json'
import type { PlanResponse } from '@/api/types'
import { RISK } from '@/lib/risk'
import { Verdict } from './Verdict'

const plan = sample as unknown as PlanResponse
const best = plan.routes.find((r) => r.id === plan.recommended_route_id)!

const withWorst = (worst: 'LOW' | 'HIGH', miles: number): PlanResponse => ({
  ...plan,
  routes: plan.routes.map((r) =>
    r.id === best.id ? { ...r, summary: { ...r.summary, worst, miles_by_level: { LOW: 100, MODERATE: 0, HIGH: worst === 'HIGH' ? miles : 0, SEVERE: 0, NO_TRAVEL: 0 } } } : r,
  ),
})

describe('Verdict', () => {
  it('never calls a High-risk route clear: it states the worst risk and its miles', () => {
    render(<Verdict plan={withWorst('HIGH', 227)} />)
    expect(screen.getByText('High risk for 227 mi')).toBeInTheDocument()
    expect(screen.queryByText(/clear: no moderate/i)).not.toBeInTheDocument()
  })

  it('colours the status with the risk level of the recommended route', () => {
    const { container } = render(<Verdict plan={withWorst('HIGH', 227)} />)
    const dot = container.querySelector('[style*="background-color"]') as HTMLElement
    expect(dot.style.backgroundColor).toBe(hex(RISK.HIGH.color))
  })

  it('says clear only when the route is Low all the way', () => {
    render(<Verdict plan={withWorst('LOW', 0)} />)
    expect(screen.getByText(/clear: no moderate or worse weather/i)).toBeInTheDocument()
  })

  it('leads with the arrival time', () => {
    render(<Verdict plan={withWorst('LOW', 0)} />)
    expect(screen.getByText(/arrive /i)).toBeInTheDocument()
  })
})

function hex(color: string) {
  const n = parseInt(color.slice(1), 16)
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}
