import { AlertCircle, ArrowUpDown, Loader2, MapPin, Navigation, Search } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import type { ApiError } from '@/api/client'
import type { IntervalMiles, Place, PlanRequest } from '@/api/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { DepartureField } from './DepartureField'
import { toDepartureLocal, type DepartureChoice } from './departure'
import { IntervalField } from './IntervalField'
import { LoadField } from './LoadField'
import { PlaceInput } from './PlaceInput'
import { useRecentPlaces } from './useRecentPlaces'

interface TripFormProps {
  onSubmit: (request: PlanRequest) => void
  isLoading: boolean
  error?: ApiError | null
  /** Called whenever the chosen places change, so the map can follow the form. */
  onPlacesChange?: (origin: Place | null, destination: Place | null) => void
  /** State of the route lookup that runs once both places are chosen. */
  routeCheck?: { isLoading: boolean; error?: ApiError | null }
}

const toRef = (p: Place) => ({ label: p.label, lat: p.lat, lon: p.lon })

export function TripForm({ onSubmit, isLoading, error, onPlacesChange, routeCheck }: TripFormProps) {
  const { recent, remember } = useRecentPlaces()
  const [origin, setOrigin] = useState<Place | null>(null)
  const [destination, setDestination] = useState<Place | null>(null)
  const [swapCount, setSwapCount] = useState(0) // remounts the inputs so their text follows a swap
  const [departure, setDeparture] = useState<DepartureChoice>({ mode: 'now' })
  const [loadLb, setLoadLb] = useState<number | null>(40_000)
  const [interval, setInterval] = useState<IntervalMiles>(25)

  useEffect(() => {
    onPlacesChange?.(origin, destination)
  }, [origin, destination, onPlacesChange])

  const noRoute = routeCheck?.error?.code === 'no_route' ? routeCheck.error.message : null

  const blocker = !origin
    ? "Choose where you're starting from."
    : !destination
      ? 'Choose a destination.'
      : noRoute
        ? noRoute
        : loadLb == null
          ? 'Enter your load weight.'
          : departure.mode === 'custom' && !departure.local
            ? 'Pick a departure date and time.'
            : null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (blocker || !origin || !destination || loadLb == null) return
    onSubmit({
      origin: toRef(origin),
      destination: toRef(destination),
      departure_local: toDepartureLocal(departure),
      load_lb: loadLb,
      interval_miles: interval,
    })
  }

  const swap = () => {
    setOrigin(destination)
    setDestination(origin)
    setSwapCount((n) => n + 1)
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <div className="space-y-4">
        <PlaceInput
          key={`from-${swapCount}`}
          label="From"
          icon={<Navigation className="size-4" />}
          value={origin}
          onChange={setOrigin}
          onPicked={remember}
          recent={recent}
          placeholder="City or address"
          allowCurrentLocation
        />
        <PlaceInput
          key={`to-${swapCount}`}
          label="To"
          icon={<MapPin className="size-4" />}
          value={destination}
          onChange={setDestination}
          onPicked={remember}
          recent={recent}
          placeholder="City or address"
          action={
            <button
              type="button"
              onClick={swap}
              className="flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowUpDown className="size-4" /> Swap
            </button>
          }
        />
      </div>

      {routeCheck?.isLoading && (
        <p role="status" className="-mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Finding truck routes…
        </p>
      )}
      {noRoute && (
        <Alert variant="destructive" className="-mt-3">
          <AlertCircle />
          <AlertDescription>{noRoute}</AlertDescription>
        </Alert>
      )}

      <DepartureField value={departure} onChange={setDeparture} />
      <LoadField value={loadLb} onChange={setLoadLb} />
      <IntervalField value={interval} onChange={setInterval} />

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <div className="sticky bottom-0 z-10 -mx-4 space-y-2 bg-background/95 px-4 pt-3 pb-3 backdrop-blur md:-mx-5 md:px-5">
        <Button type="submit" disabled={Boolean(blocker) || isLoading} className="h-14 w-full gap-2 rounded-xl text-base font-semibold">
          {isLoading ? (
            <>
              <Loader2 className="size-5 animate-spin" /> Checking routes &amp; weather…
            </>
          ) : (
            <>
              <Search className="size-5" /> Find safest route
            </>
          )}
        </Button>
        {blocker && !isLoading && <p className="text-center text-sm text-muted-foreground">{blocker}</p>}
      </div>
    </form>
  )
}
