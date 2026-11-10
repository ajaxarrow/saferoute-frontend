import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { DENVER, LOS_ANGELES, geocodeHandler } from '@/test/maptilerMock'
import { renderWithClient } from '@/test/render'
import { TripForm } from './TripForm'

let geocodeCalls = 0
const server = setupServer(
  geocodeHandler({ denv: [DENVER], los: [LOS_ANGELES] }, () => {
    geocodeCalls++
  }),
)
beforeAll(() => server.listen())
beforeEach(() => {
  geocodeCalls = 0
  localStorage.clear()
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

async function pick(field: string, typed: string, optionName: string) {
  const user = userEvent.setup()
  await user.click(screen.getByRole('combobox', { name: field }))
  await user.type(screen.getByRole('combobox', { name: field }), typed)
  await user.click(await screen.findByRole('option', { name: new RegExp(optionName) }))
  return user
}

function setup(props: Partial<React.ComponentProps<typeof TripForm>> = {}) {
  const onSubmit = vi.fn()
  renderWithClient(<TripForm onSubmit={onSubmit} isLoading={false} {...props} />)
  return onSubmit
}

describe('TripForm', () => {
  it('searches once after fast typing (debounced)', async () => {
    setup()
    const user = userEvent.setup()
    await user.type(screen.getByRole('combobox', { name: 'From' }), 'denv')
    await screen.findByRole('option', { name: /Denver/ })
    expect(geocodeCalls).toBe(1)
  })

  it('selecting a suggestion fills the field', async () => {
    setup()
    await pick('From', 'denv', 'Denver')
    expect(screen.getByRole('combobox', { name: 'From' })).toHaveValue('Denver, CO')
  })

  it('keeps submit disabled and says why until both places are chosen', async () => {
    setup()
    const submit = screen.getByRole('button', { name: /find safest route/i })
    expect(submit).toBeDisabled()
    expect(screen.getByText(/choose where you're starting/i)).toBeInTheDocument()
    await pick('From', 'denv', 'Denver')
    expect(submit).toBeDisabled()
    expect(screen.getByText(/choose a destination/i)).toBeInTheDocument()
    await pick('To', 'los', 'Los Angeles')
    expect(submit).toBeEnabled()
  })

  it('swaps origin and destination', async () => {
    setup()
    await pick('From', 'denv', 'Denver')
    await pick('To', 'los', 'Los Angeles')
    await userEvent.click(screen.getByRole('button', { name: /swap/i }))
    expect(screen.getByRole('combobox', { name: 'From' })).toHaveValue('Los Angeles, CA')
    expect(screen.getByRole('combobox', { name: 'To' })).toHaveValue('Denver, CO')
  })

  it('load chip sets the weight and the helper explains the rules that apply', async () => {
    setup()
    const user = userEvent.setup()
    await user.click(screen.getByRole('radio', { name: '40k lb' }))
    expect(screen.getByLabelText(/load weight/i)).toHaveValue('40,000')
    expect(screen.getByText(/over 30,000 lb/i)).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Empty' }))
    expect(screen.getByText(/only 55\+ mph winds are no travel/i)).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: '80k lb' }))
    expect(screen.getByText(/over 40,000 lb/i)).toBeInTheDocument()
  })

  it('clamps load to 80,000 lb', async () => {
    setup()
    const user = userEvent.setup()
    const input = screen.getByLabelText(/load weight/i)
    await user.clear(input)
    await user.type(input, '95000')
    expect(input).toHaveValue('80,000')
  })

  it('shows the API error inline', () => {
    setup({ error: { name: 'ApiError', code: 'no_route', message: 'No truck route found.' } as never })
    expect(within(screen.getByRole('alert')).getByText('No truck route found.')).toBeInTheDocument()
  })

  it('submits the documented PlanRequest', async () => {
    const onSubmit = setup()
    await pick('From', 'denv', 'Denver')
    const user = await pick('To', 'los', 'Los Angeles')
    await user.click(screen.getByRole('radio', { name: 'Pick time' }))
    const when = screen.getByLabelText(/departure time/i)
    await user.clear(when)
    await user.type(when, '2026-12-15T05:00')
    await user.click(screen.getByRole('radio', { name: '10 mi' }))
    await user.click(screen.getByRole('button', { name: /find safest route/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith({
      origin: { label: 'Denver, CO', lat: 39.74, lon: -104.99 },
      destination: { label: 'Los Angeles, CA', lat: 34.05, lon: -118.24 },
      departure_local: '2026-12-15T05:00',
      load_lb: 40000,
      interval_miles: 10,
    })
  })

  it('"Now" sends an absolute UTC instant', async () => {
    const onSubmit = setup()
    await pick('From', 'denv', 'Denver')
    const user = await pick('To', 'los', 'Los Angeles')
    await user.click(screen.getByRole('button', { name: /find safest route/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0].departure_local).toMatch(/Z$/)
    expect(onSubmit.mock.calls[0][0].interval_miles).toBe(25)
  })

  it('offers recently used places when the field is focused and empty', async () => {
    localStorage.setItem('recent-places', JSON.stringify([{ label: 'Denver, CO', name: 'Denver', region: 'CO', lat: 39.74, lon: -104.99 }]))
    setup()
    await userEvent.click(screen.getByRole('combobox', { name: 'From' }))
    expect(await screen.findByRole('option', { name: /Denver/ })).toBeInTheDocument()
  })
})
