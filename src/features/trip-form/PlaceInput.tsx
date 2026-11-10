import { useQuery } from '@tanstack/react-query'
import { Command as CommandPrimitive } from 'cmdk'
import { Clock, Loader2, LocateFixed, MapPin, X } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { searchPlaces } from '@/api/geocode'
import type { Place } from '@/api/types'
import { CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { cn } from '@/lib/utils'
import { getCurrentPlace } from './currentLocation'

const MIN_CHARS = 3
const DEBOUNCE_MS = 300

interface PlaceInputProps {
  label: string
  icon: ReactNode
  value: Place | null
  onChange: (place: Place | null) => void
  placeholder: string
  recent: Place[]
  onPicked?: (place: Place) => void
  allowCurrentLocation?: boolean
  /** Rendered next to the label (e.g. a swap button). */
  action?: ReactNode
}

function PlaceRow({ place }: { place: Place }) {
  const rest = place.label.startsWith(place.name) ? place.label.slice(place.name.length).replace(/^,\s*/, '') : place.label
  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate font-medium">{place.name}</span>
      {rest && <span className="truncate text-xs text-muted-foreground">{rest}</span>}
    </span>
  )
}

export function PlaceInput({ label, icon, value, onChange, placeholder, recent, onPicked, allowCurrentLocation, action }: PlaceInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState(value?.label ?? '')
  const [open, setOpen] = useState(false)
  const [locating, setLocating] = useState(false)
  const debounced = useDebouncedValue(text.trim(), DEBOUNCE_MS)

  const search = useQuery({
    queryKey: ['places', debounced],
    queryFn: ({ signal }) => searchPlaces(debounced, signal),
    enabled: open && !value && debounced.length >= MIN_CHARS,
    staleTime: 5 * 60_000,
  })

  const pick = (place: Place) => {
    setText(place.label)
    setOpen(false)
    onChange(place)
    onPicked?.(place)
  }

  const useMyLocation = async () => {
    setLocating(true)
    try {
      pick(await getCurrentPlace())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't get your location.")
    } finally {
      setLocating(false)
    }
  }

  const typing = text.trim().length >= MIN_CHARS && !value
  const waiting = typing && (debounced !== text.trim() || search.isFetching)
  const showUnpicked = !open && text.trim().length > 0 && !value

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold" onClick={() => inputRef.current?.focus()}>
          {label}
        </span>
        {action}
      </div>

      <CommandPrimitive
        label={label}
        shouldFilter={false}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false)
        }}
        className="relative"
      >
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <CommandPrimitive.Input
          ref={inputRef}
          value={text}
          onValueChange={(next) => {
            setText(next)
            setOpen(true)
            if (value) onChange(null)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          aria-invalid={showUnpicked || undefined}
          className={cn(
            'h-12 w-full rounded-xl border bg-background pr-11 pl-11 text-base outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive',
            value && 'border-foreground/30',
          )}
        />
        {text && (
          <button
            type="button"
            aria-label={`Clear ${label.toLowerCase()}`}
            onClick={() => {
              setText('')
              onChange(null)
              setOpen(true)
            }}
            className="absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        )}

        {open && (
          <CommandList
            onMouseDown={(e) => e.preventDefault()}
            className="absolute z-40 mt-1 max-h-72 w-full rounded-xl border bg-popover p-1 shadow-lg"
          >
            {!typing && allowCurrentLocation && (
              <CommandGroup>
                <CommandItem value="__current" onSelect={useMyLocation} className="min-h-11 gap-3">
                  {locating ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4 text-sky-500" />}
                  <span className="font-medium">Use my current location</span>
                </CommandItem>
              </CommandGroup>
            )}
            {!typing && recent.length > 0 && (
              <CommandGroup heading="Recent">
                {recent.map((place) => (
                  <CommandItem key={place.label} value={`recent-${place.label}`} onSelect={() => pick(place)} className="min-h-11 gap-3">
                    <Clock className="size-4 text-muted-foreground" />
                    <PlaceRow place={place} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!typing && recent.length === 0 && !allowCurrentLocation && (
              <p className="px-3 py-4 text-sm text-muted-foreground">Type a city or address.</p>
            )}
            {typing && (
              <CommandGroup>
                {search.data?.map((place) => (
                  <CommandItem key={`${place.label}-${place.lat}`} value={place.label} onSelect={() => pick(place)} className="min-h-11 gap-3">
                    <MapPin className="size-4 text-muted-foreground" />
                    <PlaceRow place={place} />
                  </CommandItem>
                ))}
                {waiting && (
                  <p className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Searching…
                  </p>
                )}
                {!waiting && search.isSuccess && search.data.length === 0 && (
                  <CommandEmpty>No places match “{text.trim()}”.</CommandEmpty>
                )}
                {!waiting && search.isError && <p className="px-3 py-3 text-sm text-destructive">{search.error.message}</p>}
              </CommandGroup>
            )}
          </CommandList>
        )}
      </CommandPrimitive>

      {showUnpicked && <p className="text-xs text-destructive">Pick a place from the list.</p>}
    </div>
  )
}
