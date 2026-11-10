import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import sample from '@/api/fixtures/plan.sample.json'
import type { PlanResponse } from '@/api/types'
import { truckAt } from '@/lib/journey'
import { TripWeatherCard } from './TripWeatherCard'

const plan = sample as unknown as PlanResponse

function setup(routeIndex = 0, hour = 0, extra: Partial<React.ComponentProps<typeof TripWeatherCard>> = {}) {
  const route = plan.routes[routeIndex]
  const props = {
    route,
    truck: truckAt(route, hour),
    hour,
    maxHour: 48,
    onHourChange: vi.fn(),
    visible: true,
    onVisibleChange: vi.fn(),
    playing: false,
    onPlayingChange: vi.fn(),
    ...extra,
  }
  render(<TripWeatherCard {...props} />)
  return props
}

describe('TripWeatherCard', () => {
  it('says which route the weather is for', () => {
    setup(1)
    expect(screen.getByRole('region', { name: 'Weather along Route 2' })).toBeInTheDocument()
    expect(screen.getByText('Route 2')).toBeInTheDocument()
  })

  it('shows where the truck is and the conditions it is driving through', () => {
    const props = setup(0, 3)
    expect(screen.getByText(new RegExp(`Mile ${Math.round(props.truck.mile)} of`))).toBeInTheDocument()
    const stats = screen.getByRole('list', { name: 'Conditions at the truck' })
    expect(stats).toHaveTextContent(`${props.truck.checkpoint.wind_mph} mph`)
    expect(screen.getByLabelText(/^Wind /)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Rain /)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Snow /)).toBeInTheDocument()
  })

  it('shows the route progress strip with the truck on it', () => {
    setup(0, 4)
    expect(screen.getByRole('img', { name: /Route 1, .* mi\. Truck is \d+ percent along\./ })).toBeInTheDocument()
  })

  it('reports arrival once the truck is at the destination', () => {
    setup(0, 48)
    expect(screen.getByText('Arrived')).toBeInTheDocument()
    expect(screen.getByText(/weather at destination/i)).toBeInTheDocument()
  })

  it('follows the selected route: a different route shows its own weather and label', () => {
    const { container } = render(<div />)
    container.remove()
    setup(2, 6)
    expect(screen.getByText('Route 3')).toBeInTheDocument()
  })

  it('moves the hour forward while playing and loops after the trip ends', () => {
    vi.useFakeTimers()
    const route = plan.routes[0]
    const onHourChange = vi.fn()
    const endHour = Math.ceil(route.summary.duration_s / 3600) + 1
    const { rerender } = render(
      <TripWeatherCard route={route} truck={truckAt(route, 5)} hour={5} maxHour={48} onHourChange={onHourChange} visible onVisibleChange={vi.fn()} playing onPlayingChange={vi.fn()} />,
    )
    act(() => void vi.advanceTimersByTime(400))
    expect(onHourChange).toHaveBeenLastCalledWith(6)
    rerender(
      <TripWeatherCard route={route} truck={truckAt(route, endHour)} hour={endHour} maxHour={48} onHourChange={onHourChange} visible onVisibleChange={vi.fn()} playing onPlayingChange={vi.fn()} />,
    )
    act(() => void vi.advanceTimersByTime(400))
    expect(onHourChange).toHaveBeenLastCalledWith(0)
    vi.useRealTimers()
  })

  it('toggles play and the heatmap', async () => {
    const props = setup()
    await userEvent.click(screen.getByRole('button', { name: /play forecast/i }))
    expect(props.onPlayingChange).toHaveBeenCalledWith(true)
    await userEvent.click(screen.getByRole('button', { name: /hide weather heatmap/i }))
    expect(props.onVisibleChange).toHaveBeenCalledWith(false)
  })
})
