import { ChevronDown, GripVertical, CloudRain, Eye, EyeOff, Flag, Info, Moon, Pause, Play, Snowflake, Sun, Truck, Wind, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { PlannedRoute } from '@/api/types'
import { RouteLine } from '@/components/RouteLine'
import { RiskBadge } from '@/features/results/RiskBadge'
import { Slider } from '@/components/ui/slider'
import { formatEta } from '@/lib/format'
import { routeShortName } from '@/lib/hazards'
import type { TruckState } from '@/lib/journey'
import { RISK } from '@/lib/risk'
import { describeWeather, isNight, type WeatherKind } from '@/lib/weather'
import { cn } from '@/lib/utils'

const STEP_MS = 400

const ICON: Record<WeatherKind, LucideIcon> = { clear: Sun, wind: Wind, rain: CloudRain, snow: Snowflake }

interface TripWeatherCardProps {
  route: PlannedRoute
  truck: TruckState
  hour: number
  maxHour: number
  onHourChange: (hour: number) => void
  visible: boolean
  onVisibleChange: (visible: boolean) => void
  playing: boolean
  onPlayingChange: (playing: boolean) => void
  /** Miles between weather checkpoints, for the legend. */
  intervalMiles?: number
  /** Start with the details (weather now, route strip, legend) open. */
  defaultExpanded?: boolean
  className?: string
  /** Pointer and key handlers that make the grip move the whole bar; omit for a fixed bar. */
  dragHandleProps?: React.HTMLAttributes<HTMLElement>
}

function Stat({ icon: Icon, label, value, active }: { icon: LucideIcon; label: string; value: string; active: boolean }) {
  return (
    <li aria-label={`${label} ${value}`} className={cn('rounded-xl px-3 py-2 tabular', active ? 'bg-secondary ring-1 ring-primary/30' : 'bg-muted/60')}>
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Icon className="size-4" aria-hidden />
        {label}
      </span>
      <span className={cn('mt-0.5 block text-base font-semibold', !active && 'text-foreground/80')}>{value}</span>
    </li>
  )
}

/**
 * Weather for the selected route only: what the truck is driving through at this hour, where it is on the route,
 * and the whole route's risk laid out as a strip the truck moves along.
 */
export function TripWeatherCard({ route, truck, hour, maxHour, onHourChange, visible, onVisibleChange, playing, onPlayingChange, intervalMiles, defaultExpanded = false, className, dragHandleProps }: TripWeatherCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [legendOpen, setLegendOpen] = useState(false)
  // Playing follows the trip and loops after arrival instead of idling through empty forecast hours.
  const playEnd = Math.min(maxHour, Math.ceil(route.summary.duration_s / 3600) + 1)
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => onHourChange(hour >= playEnd ? 0 : hour + 1), STEP_MS)
    return () => clearInterval(id)
  }, [playing, hour, playEnd, onHourChange])

  const { checkpoint: c } = truck
  const weather = describeWeather(c)
  const WeatherIcon = weather.kind === 'clear' && isNight(truck.timeIso, c.tz) ? Moon : ICON[weather.kind]
    const total = route.summary.total_miles || 1
  const roads = routeShortName(route.via)

  return (
    <section aria-label={`Weather along ${route.label}`} className={cn('w-full rounded-2xl border bg-card p-2 shadow-float', className)}>
      <div className="flex items-center gap-2">
        {dragHandleProps && (
          <button
            type="button"
            aria-label="Move forecast controls. Drag, or use arrow keys. Double-click to reset."
            title="Drag to move"
            {...dragHandleProps}
            className="-mr-1 -ml-1 flex h-11 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-muted-foreground/70 hover:bg-muted hover:text-foreground active:cursor-grabbing"
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        )}
        <button
          type="button"
          aria-label={playing ? 'Pause forecast animation' : 'Play forecast animation'}
          onClick={() => onPlayingChange(!playing)}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-[var(--primary-hover)]"
        >
          {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
        </button>
        <Slider
          aria-label="Forecast hour"
          min={0}
          max={maxHour}
          step={1}
          value={[hour]}
          onValueChange={(v) => onHourChange(Array.isArray(v) ? v[0] : v)}
          className="min-w-24 px-1"
        />
        <span className="w-12 shrink-0 text-right text-base font-semibold tabular">{hour === 0 ? 'Start' : `+${hour}h`}</span>
        <button
          type="button"
          aria-pressed={visible}
          aria-label={visible ? 'Hide weather heatmap' : 'Show weather heatmap'}
          onClick={() => onVisibleChange(!visible)}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl hover:bg-muted"
        >
          {visible ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
        </button>
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={expanded ? 'Hide forecast details' : 'Show forecast details'}
          onClick={() => setExpanded((e) => !e)}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl hover:bg-muted"
        >
          <ChevronDown className={cn('size-5 transition-transform duration-150', expanded && 'rotate-180')} aria-hidden />
        </button>
      </div>

      <div hidden={!expanded} className="space-y-4 px-2 pt-4 pb-1">
        <p key={route.id} className="flex min-w-0 items-baseline gap-2 text-sm text-muted-foreground duration-200 animate-in fade-in motion-reduce:animate-none">
          <span className="font-semibold text-foreground">{route.label}</span>
          {roads && <span className="truncate">{roads}</span>}
        </p>

        <div className="flex items-center gap-3" aria-live="polite">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground">
            <WeatherIcon className="size-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-lg leading-tight font-semibold">
              {truck.arrived ? (
                <>
                  <Flag className="size-4 shrink-0" aria-hidden /> Arrived
                </>
              ) : (
                weather.label
              )}
              <RiskBadge level={c.risk} size="sm" />
            </p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground tabular">
              {truck.arrived ? 'Weather at destination' : `Mile ${Math.round(truck.mile)} of ${Math.round(total)}`} · {formatEta(truck.timeIso, c.tz)}
            </p>
          </div>
        </div>

        <ul aria-label="Conditions at the truck" className="grid grid-cols-3 gap-2">
          <Stat icon={Wind} label="Wind" value={`${c.wind_mph} mph`} active={c.wind_mph >= 25} />
          <Stat icon={CloudRain} label="Rain" value={`${c.rain_in_hr} in/hr`} active={c.rain_in_hr >= 0.05} />
          <Stat icon={Snowflake} label="Snow" value={`${c.snow_in_hr} in/hr`} active={c.snow_in_hr >= 0.05} />
        </ul>

        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Risk along the route</p>
          <RouteLine route={route} truckProgress={truck.progress} />
        </div>

      <p className="sr-only">Drag or press play to see the weather 0–48 h after departure.</p>

      <div className="border-t pt-2">
        <button
          type="button"
          aria-expanded={legendOpen}
          onClick={() => setLegendOpen((o) => !o)}
          className="flex min-h-9 items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <Info className="size-4" aria-hidden /> {legendOpen ? 'Hide legend' : 'Legend'}
        </button>
        <div aria-label="Legend" role="group" className={cn('space-y-1.5 pb-1 text-sm', legendOpen ? 'block' : 'hidden')}>
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground" aria-label="Risk colours">
            {(['LOW', 'MODERATE', 'HIGH', 'SEVERE', 'NO_TRAVEL'] as const).map((level) => (
              <li key={level} className="flex items-center gap-1">
                <span className="size-3 rounded-full" style={{ backgroundColor: RISK[level].color }} aria-hidden />
                {RISK[level].label}
              </li>
            ))}
          </ul>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground" aria-label="Map symbols">
            <li className="flex items-center gap-1.5">
              <span className="size-3.5 rounded-full border-2 border-white bg-[#16a34a] shadow-[0_0_0_1px_rgba(0,0,0,0.35)]" aria-hidden />
              Weather checkpoint{intervalMiles ? ` (every ${intervalMiles} mi)` : ''}: tap for details
            </li>
            <li className="flex items-center gap-1.5">
              <Truck className="size-4 text-primary" aria-hidden /> Truck at this hour
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-6 rounded-full opacity-70" style={{ background: `linear-gradient(90deg, ${RISK.LOW.color}, ${RISK.MODERATE.color}, ${RISK.SEVERE.color})` }} aria-hidden /> Heatmap: weather risk along the route
            </li>
          </ul>
        </div>
      </div>
      </div>
    </section>
  )
}
