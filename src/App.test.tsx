import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import sample from '@/api/fixtures/plan.sample.json'
import { DENVER, LOS_ANGELES, geocodeHandler } from '@/test/maptilerMock'
import App from './App'

vi.mock('@/features/map/MapView', () => ({
  MapView: ({ preview }: { preview?: unknown[] }) => <div data-testid="map" data-preview-count={preview?.length ?? 0} />,
}))

const previewRoutes = [
  { id: 'route-1', label: 'Route 1', via: 'via I-15', total_miles: 1016, duration_s: 59000, geometry: [[-118.24, 34.05], [-104.99, 39.74]] },
  { id: 'route-2', label: 'Route 2', via: 'via US-50', total_miles: 1100, duration_s: 63000, geometry: [[-118.24, 34.05], [-110, 38], [-104.99, 39.74]] },
]
let previewCalls = 0
let planHandler: Parameters<typeof http.post>[1]
const server = setupServer(
  geocodeHandler({ denv: [DENVER], los: [LOS_ANGELES] }),
  http.post('http://localhost:8000/api/routes/', () => {
    previewCalls++
    return HttpResponse.json({ routes: previewRoutes })
  }),
  http.post('http://localhost:8000/api/plan/', (info) => planHandler(info)),
)
beforeAll(() => server.listen())
beforeEach(() => {
  localStorage.clear()
  previewCalls = 0
})
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
  it('previews the candidate routes on the map as soon as both places are chosen', async () => {
    render(<App />)
    const user = userEvent.setup()
    await user.type(screen.getByRole('combobox', { name: 'From' }), 'los')
    await user.click(await screen.findByRole('option', { name: /Los Angeles/ }))
    expect(previewCalls).toBe(0) // one place is not a trip yet
    await user.type(screen.getByRole('combobox', { name: 'To' }), 'denv')
    await user.click(await screen.findByRole('option', { name: /Denver/ }))
    await waitFor(() => expect(screen.getByTestId('map')).toHaveAttribute('data-preview-count', '2'))
    expect(previewCalls).toBe(1)
  })

  it('clears the preview when a place is removed', async () => {
    render(<App />)
    const user = userEvent.setup()
    await user.type(screen.getByRole('combobox', { name: 'From' }), 'los')
    await user.click(await screen.findByRole('option', { name: /Los Angeles/ }))
    await user.type(screen.getByRole('combobox', { name: 'To' }), 'denv')
    await user.click(await screen.findByRole('option', { name: /Denver/ }))
    await waitFor(() => expect(screen.getByTestId('map')).toHaveAttribute('data-preview-count', '2'))
    await user.click(screen.getByRole('button', { name: /clear to/i }))
    await waitFor(() => expect(screen.getByTestId('map')).toHaveAttribute('data-preview-count', '0'))
  })

  it('shows the recommendation and all route cards after a successful search', async () => {
    planHandler = () => HttpResponse.json(sample)
    render(<App />)
    await fillAndSubmit()
    expect(await screen.findByRole('heading', { name: /take route 2/i })).toBeInTheDocument()
    expect(within(screen.getByRole('radiogroup', { name: 'Route comparison' })).getAllByRole('radio')).toHaveLength(3)
    expect(screen.getByLabelText('Forecast hour')).toBeInTheDocument()
    expect(await screen.findByTestId('map')).toBeInTheDocument()
  })

  it('shows the server message in the form and no results when no route exists', async () => {
    planHandler = () => HttpResponse.json({ error: { code: 'no_route', message: 'No truck route found between these places.' } }, { status: 422 })
    render(<App />)
    await fillAndSubmit()
    expect(await screen.findByText('No truck route found between these places.')).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup', { name: 'Route comparison' })).not.toBeInTheDocument()
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
