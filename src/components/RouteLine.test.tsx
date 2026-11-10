import { render, screen } from '@testing-library/react'
import sample from '@/api/fixtures/plan.sample.json'
import type { PlanResponse } from '@/api/types'
import { RouteLine } from './RouteLine'

const route = (sample as unknown as PlanResponse).routes[1]

describe('RouteLine', () => {
  it('draws one station per checkpoint between the two terminals', () => {
    const short = { ...route, checkpoints: route.checkpoints.slice(0, 12) }
    const { container } = render(<RouteLine route={short} />)
    expect(container.querySelectorAll('[data-station]').length).toBe(10)
    expect(container.querySelectorAll('[data-terminal]').length).toBe(2)
  })

  it('has a text alternative with the miles and the stretches', () => {
    render(<RouteLine route={route} />)
    expect(screen.getByRole('img', { name: /Route 2.*mi.*stations/i })).toBeInTheDocument()
  })

  it('thins out the stations on a very long route instead of drawing hundreds', () => {
    const many = { ...route, checkpoints: Array.from({ length: 120 }, (_, i) => ({ ...route.checkpoints[i % route.checkpoints.length], index: i, mile: (i / 119) * route.summary.total_miles })) }
    const { container } = render(<RouteLine route={many} />)
    expect(container.querySelectorAll('[data-station]').length).toBeLessThanOrEqual(30)
  })

  it('shows the truck only when it is given a progress', () => {
    const { container, rerender } = render(<RouteLine route={route} />)
    expect(container.querySelector('[data-truck]')).toBeNull()
    rerender(<RouteLine route={route} truckProgress={0.4} />)
    expect(container.querySelector('[data-truck]')).not.toBeNull()
  })
})
