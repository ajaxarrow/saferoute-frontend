import { Truck } from 'lucide-react'
import type { PlannedRoute } from '@/api/types'
import { riskRanges } from '@/features/map/routeLayers'
import { formatMiles } from '@/lib/format'
import { RISK } from '@/lib/risk'
import { cn } from '@/lib/utils'

const MAX_STATIONS = 28

interface RouteLineProps {
  route: PlannedRoute
  /** 0–1: shows the truck on the line. */
  truckProgress?: number
  className?: string
}

/**
 * The route as a transit line: terminals at both ends, a station at each weather checkpoint, and the line itself
 * inked in the risk level of every stretch. Reads the same in the route list and in the weather card.
 */
export function RouteLine({ route, truckProgress, className }: RouteLineProps) {
  const total = route.summary.total_miles || 1
  const ranges = riskRanges(route)
  const inner = route.checkpoints.slice(1, -1)
  const every = Math.max(1, Math.ceil(inner.length / MAX_STATIONS))
  const stations = inner.filter((_, i) => i % every === 0)
  const rough = ranges.filter((r) => r.risk !== 'LOW')

  return (
    <div
      role="img"
      aria-label={`${route.label}, ${formatMiles(total)}, ${route.checkpoints.length} stations${
        rough.length ? `. Rough stretches: ${rough.map((r) => `${RISK[r.risk].label} from mile ${Math.round(r.from)} to ${Math.round(r.to)}`).join(', ')}` : '. Low risk all the way'
      }${truckProgress != null ? `. Truck is ${Math.round(truckProgress * 100)} percent along.` : ''}`}
      className={cn('relative h-8', className)}
    >
      <div className="absolute inset-x-2.5 top-1/2 h-3 -translate-y-1/2">
        <div className="flex size-full overflow-hidden rounded-full">
          {ranges.map((r, i) => (
            <span key={i} style={{ width: `${((r.to - r.from) / total) * 100}%`, backgroundColor: RISK[r.risk].color }} />
          ))}
        </div>
        {stations.map((c) => (
          <span
            key={c.index}
            data-station
            className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground bg-card"
            style={{ left: `${(c.mile / total) * 100}%` }}
          />
        ))}
        {truckProgress != null && (
          <span
            data-truck
            aria-hidden
            className="absolute -top-2.5 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-card bg-foreground text-background transition-[left] duration-300 ease-out motion-reduce:transition-none"
            style={{ left: `${Math.min(Math.max(truckProgress, 0), 1) * 100}%` }}
          >
            <Truck className="size-4" />
          </span>
        )}
      </div>
      <span data-terminal className="absolute top-1/2 left-0 size-5 -translate-y-1/2 rounded-full border-[3px] border-foreground bg-card" />
      <span data-terminal className="absolute top-1/2 right-0 size-5 -translate-y-1/2 rounded-full border-[3px] border-foreground bg-foreground" />
    </div>
  )
}
