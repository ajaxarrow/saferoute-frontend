import { AlertCircle, ArrowUpDown, Loader2, Search } from 'lucide-react'
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
      <div className="flex items-center gap-1">
        <div className="relative min-w-0 flex-1 rounded-lg border-2 border-input bg-card p-1">
          <span aria-hidden className="pointer-events-none absolute top-[2.75rem] left-[1.6rem] z-10 h-[2.4rem] w-1.5 rounded-full bg-foreground" />
          <PlaceInput
            key={`from-${swapCount}`}
            label="From"
            icon={<span className="block size-5 rounded-full border-[4px] border-foreground bg-card" aria-hidden />}
            value={origin}
            onChange={setOrigin}
            onPicked={remember}
            recent={recent}
            placeholder="Starting point"
            allowCurrentLocation
          />
          <div className="mx-12 h-0.5 bg-border" />
          <PlaceInput
            key={`to-${swapCount}`}
            label="To"
            icon={<span className="block size-5 rounded-full border-[4px] border-foreground bg-foreground" aria-hidden />}
            value={destination}
            onChange={setDestination}
            onPicked={remember}
            recent={recent}
            placeholder="Destination"
          />
        </div>
        <button
          type="button"
          onClick={swap}
          aria-label="Swap"
          className="flex size-12 shrink-0 items-center justify-center rounded-md border-2 border-input/60 hover:bg-muted"
        >
          <ArrowUpDown className="size-6" />
        </button>
      </div>

      {routeCheck?.isLoading && (
        <p role="status" className="-mt-3 flex items-center gap-2 text-base text-muted-foreground">
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
        <Button type="submit" disabled={Boolean(blocker) || isLoading} className="h-14 w-full gap-2 rounded-md text-xl font-extrabold">
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
        {blocker && !isLoading && <p className="text-center text-base text-muted-foreground">{blocker}</p>}
      </div>
    </form>
  )
}
