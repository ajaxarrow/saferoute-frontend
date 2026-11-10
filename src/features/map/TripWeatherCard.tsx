import { CloudRain, Eye, EyeOff, Flag, Info, Moon, Pause, Play, Snowflake, Sun, Truck, Wind, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { PlannedRoute } from '@/api/types'
import { RiskBadge } from '@/features/results/RiskBadge'
import { Slider } from '@/components/ui/slider'
import { formatEta, formatMiles } from '@/lib/format'
import { routeShortName } from '@/lib/hazards'
import type { TruckState } from '@/lib/journey'
import { RISK } from '@/lib/risk'
import { describeWeather, isNight, type WeatherKind } from '@/lib/weather'
import { cn } from '@/lib/utils'
import { riskRanges } from './routeLayers'

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
}

function Stat({ icon: Icon, label, value, active }: { icon: LucideIcon; label: string; value: string; active: boolean }) {
  return (
    <li aria-label={`${label} ${value}`} className={cn('flex items-center gap-1.5 text-base tabular', active ? 'font-medium text-foreground' : 'text-muted-foreground')}>
      <Icon className="size-5" aria-hidden />
      {value}
    </li>
  )
}

/**
 * Weather for the selected route only: what the truck is driving through at this hour, where it is on the route,
 * and the whole route's risk laid out as a strip the truck moves along.
 */
export function TripWeatherCard({ route, truck, hour, maxHour, onHourChange, visible, onVisibleChange, playing, onPlayingChange, intervalMiles }: TripWeatherCardProps) {
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
  const risk = RISK[c.risk]
  const total = route.summary.total_miles || 1
  const segments = riskRanges(route)
  const roads = routeShortName(route.via)

  return (
    <section aria-label={`Weather along ${route.label}`} className="w-full space-y-3 rounded-2xl bg-card p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.28)]">
      <div className="flex items-center justify-between gap-3">
        <p key={route.id} className="flex min-w-0 items-center gap-2 text-base font-medium duration-200 animate-in fade-in motion-reduce:animate-none">
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-sm text-primary-foreground">{route.label}</span>
          {roads && <span className="truncate text-muted-foreground">{roads}</span>}
        </p>
        <button
          type="button"
          aria-pressed={visible}
          aria-label={visible ? 'Hide weather heatmap' : 'Show weather heatmap'}
          onClick={() => onVisibleChange(!visible)}
          className="-my-1 flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          {visible ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
        </button>
      </div>

      <div className="flex items-center gap-3" aria-live="polite">
        <span
          className="flex size-14 shrink-0 items-center justify-center rounded-full transition-colors duration-200"
          style={{ backgroundColor: `color-mix(in srgb, ${risk.color} 18%, transparent)`, color: c.risk === 'LOW' ? 'var(--foreground)' : risk.color }}
        >
          <WeatherIcon className="size-8" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-xl leading-tight font-medium">
            {truck.arrived ? (
              <>
                <Flag className="size-5 shrink-0" aria-hidden /> Arrived
              </>
            ) : (
              weather.label
            )}
            <RiskBadge level={c.risk} size="sm" />
          </p>
          <p className="truncate text-base text-muted-foreground tabular">
            {truck.arrived ? 'Weather at destination' : `Mile ${Math.round(truck.mile)} of ${Math.round(total)}`} · {formatEta(truck.timeIso, c.tz)}
          </p>
        </div>
      </div>

      <ul aria-label="Conditions at the truck" className="flex flex-wrap gap-x-5 gap-y-1">
        <Stat icon={Wind} label="Wind" value={`${c.wind_mph} mph`} active={c.wind_mph >= 25} />
        <Stat icon={CloudRain} label="Rain" value={`${c.rain_in_hr} in/hr`} active={c.rain_in_hr >= 0.05} />
        <Stat icon={Snowflake} label="Snow" value={`${c.snow_in_hr} in/hr`} active={c.snow_in_hr >= 0.05} />
      </ul>

      <div className="pt-4">
        <div
          role="img"
          aria-label={`${route.label}, ${formatMiles(total)}. Truck is ${Math.round(truck.progress * 100)} percent along.`}
          className="relative"
        >
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
            {segments.map((s, i) => (
              <span key={i} style={{ width: `${((s.to - s.from) / total) * 100}%`, backgroundColor: RISK[s.risk].color }} />
            ))}
          </div>
          <span
            aria-hidden
            className="absolute -top-[1.35rem] flex size-8 -translate-x-1/2 items-center justify-center rounded-full bg-card text-primary shadow-[0_1px_4px_rgba(0,0,0,0.35)] ring-2 ring-primary transition-[left] duration-300 ease-out motion-reduce:transition-none"
            style={{ left: `${Math.min(Math.max(truck.progress, 0.02), 0.98) * 100}%` }}
          >
            <Truck className="size-4" />
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={playing ? 'Pause forecast animation' : 'Play forecast animation'}
          onClick={() => onPlayingChange(!playing)}
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90"
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
          className="px-1"
        />
        <span className="w-12 shrink-0 text-right text-base font-medium tabular">{hour === 0 ? 'Start' : `+${hour}h`}</span>
      </div>

      <p className="-mt-1 text-sm text-muted-foreground">Drag or press play to see the weather 0–48 h after departure.</p>

      <div>
        <button
          type="button"
          aria-expanded={legendOpen}
          onClick={() => setLegendOpen((o) => !o)}
          className="flex min-h-11 items-center gap-1.5 text-base font-medium text-primary sm:hidden"
        >
          <Info className="size-4" aria-hidden /> {legendOpen ? 'Hide legend' : 'Legend'}
        </button>
        <div aria-label="Legend" role="group" className={cn('space-y-1.5 text-sm', legendOpen ? 'block' : 'hidden', 'sm:block')}>
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
              <span className="size-3.5 rounded-full border-2 border-white bg-[#188038] shadow-[0_0_0_1px_rgba(0,0,0,0.35)]" aria-hidden />
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
    </section>
  )
}
