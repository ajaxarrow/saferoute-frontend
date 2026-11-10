import { CircleCheck } from 'lucide-react'
import type { PlannedRoute } from '@/api/types'
import { formatClock, formatMiles } from '@/lib/format'
import { hazardStretches, type HazardStretch } from '@/lib/hazards'
import { RiskBadge } from './RiskBadge'

function conditions(s: HazardStretch): string {
  const parts = [`wind up to ${Math.round(s.maxWindMph)} mph`]
  if (s.maxRainInHr > 0) parts.push(`rain ${s.maxRainInHr} in/hr`)
  if (s.maxSnowInHr > 0) parts.push(`snow ${s.maxSnowInHr} in/hr`)
  return parts.join(' · ')
}

interface HazardListProps {
  route: PlannedRoute
  onSelectStretch: (routeId: string, checkpointIndex: number) => void
}

/** "Where will it be rough": each stretch is a button that flies the map there. */
export function HazardList({ route, onSelectStretch }: HazardListProps) {
  const stretches = hazardStretches(route)

  if (stretches.length === 0) {
    return (
      <p className="flex items-center gap-3 rounded-xl bg-muted p-3 text-base">
        <CircleCheck className="size-6 shrink-0 text-[#188038]" aria-hidden /> Clear all the way: no Moderate or worse weather on {route.label}.
      </p>
    )
  }

  return (
    <section aria-label={`Rough stretches on ${route.label}`} className="space-y-2">
      <h3 className="text-lg font-medium">Rough stretches</h3>
      <ul className="-mx-3">
        {stretches.map((s) => (
          <li key={s.firstIndex}>
            <button
              type="button"
              onClick={() => onSelectStretch(route.id, s.firstIndex)}
              className="flex min-h-14 w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <RiskBadge level={s.worst} size="sm" className="mt-0.5" />
              <span className="min-w-0 flex-1">
                <span className="block text-base font-medium tabular">
                  {s.fromMile === s.toMile ? `Mile ${Math.round(s.fromMile)}` : `Mile ${Math.round(s.fromMile)}–${Math.round(s.toMile)}`}
                  <span className="font-normal text-muted-foreground"> · {formatMiles(s.toMile - s.fromMile || 0)}</span>
                </span>
                <span className="block text-base text-muted-foreground tabular">
                  {formatClock(s.startUtc, s.tz)}
                  {s.startUtc !== s.endUtc && ` – ${formatClock(s.endUtc, s.tz)}`} · {conditions(s)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
