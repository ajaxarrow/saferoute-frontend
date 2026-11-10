import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import sample from '@/api/fixtures/plan.sample.json'
import { DENVER, LOS_ANGELES, geocodeHandler } from '@/test/maptilerMock'
import App from './App'

vi.mock('@/features/map/MapView', () => ({ MapView: () => <div data-testid="map" /> }))

let planHandler: Parameters<typeof http.post>[1]
const server = setupServer(
  geocodeHandler({ denv: [DENVER], los: [LOS_ANGELES] }),
  http.post('http://localhost:8000/api/plan/', (info) => planHandler(info)),
)
beforeAll(() => server.listen())
beforeEach(() => localStorage.clear())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

async function fillAndSubmit() {
  const user = userEvent.setup()
  for (const [field, typed, option] of [['From', 'los', 'Los Angeles'], ['To', 'denv', 'Denver']] as const) {
    await user.type(screen.getByRole('combobox', { name: field }), typed)
    await user.click(await screen.findByRole('option', { name: new RegExp(option) }))
  }
  await user.click(screen.getByRole('button', { name: /find safest route/i }))
  return user
}

describe('App', () => {
  it('shows the recommendation and all route cards after a successful search', async () => {
    planHandler = () => HttpResponse.json(sample)
    render(<App />)
    await fillAndSubmit()
    expect(await screen.findByRole('heading', { name: /take route 2/i })).toBeInTheDocument()
    expect(within(screen.getByRole('radiogroup', { name: 'Route options' })).getAllByRole('radio')).toHaveLength(3)
    expect(screen.getByLabelText('Forecast hour')).toBeInTheDocument()
    expect(await screen.findByTestId('map')).toBeInTheDocument()
  })

  it('shows the server message in the form and no results when no route exists', async () => {
    planHandler = () => HttpResponse.json({ error: { code: 'no_route', message: 'No truck route found between these places.' } }, { status: 422 })
    render(<App />)
    await fillAndSubmit()
    expect(await screen.findByText('No truck route found between these places.')).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup', { name: 'Route options' })).not.toBeInTheDocument()
  })

  it('lets the driver go back and edit the trip after results arrive', async () => {
    planHandler = () => HttpResponse.json(sample)
    render(<App />)
    const user = await fillAndSubmit()
    await screen.findByRole('heading', { name: /take route 2/i })
    await user.click(screen.getByRole('button', { name: /edit trip/i }))
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'From' })).toBeVisible())
    expect(screen.getByRole('combobox', { name: 'From' })).toHaveValue('Los Angeles, CA')
  })

  it('offers a way back to the results while editing', async () => {
    planHandler = () => HttpResponse.json(sample)
    render(<App />)
    const user = await fillAndSubmit()
    await screen.findByRole('heading', { name: /take route 2/i })
    await user.click(screen.getByRole('button', { name: /edit trip/i }))
    await user.click(screen.getByRole('button', { name: /back to results/i }))
    expect(await screen.findByRole('heading', { name: /take route 2/i })).toBeVisible()
  })
})
