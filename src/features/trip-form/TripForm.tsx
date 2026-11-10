import { AlertCircle, ArrowUpDown, Loader2, Search, ShieldAlert } from 'lucide-react'
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
      <div>
        <h2 className="text-xl font-semibold">Plan a trip</h2>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <ShieldAlert className="size-4 shrink-0" aria-hidden /> Plan before you drive. Don't use while driving.
        </p>
      </div>
      <div className="flex items-stretch gap-2">
        <div className="relative min-w-0 flex-1 rounded-xl border border-input bg-card p-1 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
          <span aria-hidden className="pointer-events-none absolute top-[2.9rem] left-[1.55rem] z-10 h-[1.9rem] border-l-2 border-dotted border-muted-foreground/70" />
          <PlaceInput
            key={`from-${swapCount}`}
            label="From"
            icon={<span className="block size-3.5 rounded-full border-[3px] border-primary bg-card" aria-hidden />}
            value={origin}
            onChange={setOrigin}
            onPicked={remember}
            recent={recent}
            placeholder="Starting point"
            allowCurrentLocation
          />
          <div className="mx-4 h-px bg-border" />
          <PlaceInput
            key={`to-${swapCount}`}
            label="To"
            icon={<span className="block size-3.5 rounded-full border-[3px] border-primary bg-primary" aria-hidden />}
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
          className="flex h-12 w-12 shrink-0 items-center justify-center self-center rounded-xl border bg-card transition-colors hover:bg-muted"
        >
          <ArrowUpDown className="size-5" />
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

      <div className="sticky bottom-0 z-10 -mx-5 space-y-2 border-t bg-card px-5 pt-3 pb-3 min-[1440px]:-mx-6 min-[1440px]:px-6">
        <Button type="submit" disabled={Boolean(blocker) || isLoading} className="h-14 w-full gap-2 rounded-xl bg-primary text-lg font-semibold text-primary-foreground hover:bg-[var(--primary-hover)] disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100">
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
