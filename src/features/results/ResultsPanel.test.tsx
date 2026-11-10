import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import sample from '@/api/fixtures/plan.sample.json'
import type { PlanResponse } from '@/api/types'
import { ResultsPanel } from './ResultsPanel'
import { RiskBar } from './RiskBar'

const plan = sample as unknown as PlanResponse

function setup(overrides: Partial<PlanResponse> = {}, selected = plan.recommended_route_id) {
  const onSelectRoute = vi.fn()
  const onSelectCheckpoint = vi.fn()
  const data = { ...plan, ...overrides }
  render(<ResultsPanel plan={data} selectedRouteId={selected} onSelectRoute={onSelectRoute} onSelectCheckpoint={onSelectCheckpoint} />)
  return { onSelectRoute, onSelectCheckpoint }
}

const cards = () => within(screen.getByRole('radiogroup', { name: 'Route options' })).getAllByRole('radio')

describe('ResultsPanel', () => {
  it.each([1, 2, 3])('renders %i route card(s) without gaps', (n) => {
    setup({ routes: plan.routes.slice(0, n), recommended_route_id: plan.routes[0].id }, plan.routes[0].id)
    expect(cards()).toHaveLength(n)
  })

  it('marks the recommended route and selects it initially', () => {
    setup()
    const recommended = cards().find((c) => c.getAttribute('aria-checked') === 'true')!
    expect(recommended).toHaveAccessibleName(/Route 2/)
    expect(within(recommended).getByText('Recommended')).toBeInTheDocument()
  })

  it('leads with a plain-language verdict', () => {
    setup()
    expect(screen.getByRole('heading', { name: /take route 2/i })).toBeInTheDocument()
    expect(screen.getByText(plan.recommendation_reason)).toBeInTheDocument()
  })

  it('selects a route when its card is clicked', async () => {
    const { onSelectRoute } = setup()
    await userEvent.click(cards().find((c) => /Route 3/.test(c.getAttribute('aria-label') ?? c.textContent ?? ''))!)
    expect(onSelectRoute).toHaveBeenCalledWith('route-3')
  })

  it('shows plan notes', () => {
    setup({ notes: ['Only 2 distinct truck routes were found for this trip.'] })
    expect(screen.getByText(/only 2 distinct truck routes/i)).toBeInTheDocument()
  })

  it('warns not to depart when even the best route has No Travel miles', () => {
    const routes = plan.routes.map((r) => ({ ...r, summary: { ...r.summary, miles_by_level: { ...r.summary.miles_by_level, NO_TRAVEL: 20 } } }))
    setup({ routes })
    expect(screen.getByText(/do not depart as planned/i)).toBeInTheDocument()
  })

  it('lists checkpoints of the selected route and reports clicks', async () => {
    const { onSelectCheckpoint } = setup()
    const first = screen.getAllByRole('button', { name: /^Checkpoint at mile/ })[0]
    await userEvent.click(first)
    expect(onSelectCheckpoint).toHaveBeenCalledWith('route-2', 0)
  })

  it('can limit the checkpoint list to Moderate and worse', async () => {
    setup()
    const all = screen.getAllByRole('button', { name: /^Checkpoint at mile/ }).length
    await userEvent.click(screen.getByRole('radio', { name: 'Moderate+' }))
    const risky = screen.getAllByRole('button', { name: /^Checkpoint at mile/ }).length
    expect(risky).toBeGreaterThan(0)
    expect(risky).toBeLessThan(all)
  })
})

describe('RiskBar', () => {
  it('has a text alternative listing miles per level', () => {
    render(<RiskBar milesByLevel={{ LOW: 388, MODERATE: 0, HIGH: 148, SEVERE: 125, NO_TRAVEL: 175 }} />)
    expect(screen.getByRole('img')).toHaveAccessibleName('Risk along route: Low 388 mi, High 148 mi, Severe 125 mi, No Travel 175 mi')
  })
})
