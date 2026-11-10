import { Check } from 'lucide-react'
import type { PlannedRoute } from '@/api/types'
import { compareRoutes, type CriterionKey, type CriterionRow } from '@/lib/criteria'
import { formatDuration, formatMiles } from '@/lib/format'
import { cn } from '@/lib/utils'

const DECIDED_BY: Record<CriterionKey, string> = {
  no_travel: 'it avoids No Travel weather',
  severe: 'it has the fewest Severe miles',
  high: 'it has the fewest High miles',
  avg: 'it has the lowest average risk',
  time: 'it is the shortest drive',
}

function format(row: CriterionRow, value: number): string {
  if (row.key === 'time') return formatDuration(value)
  if (row.key === 'avg') return value.toFixed(2)
  return formatMiles(value)
}

interface RouteComparisonProps {
  routes: PlannedRoute[]
  recommendedId: string
}

/** Every ranking criterion, route by route, in the order the server applies them, so the pick can be checked. */
export function RouteComparison({ routes, recommendedId }: RouteComparisonProps) {
  const { rows, decidedBy } = compareRoutes(routes, recommendedId)
  const winner = routes.find((r) => r.id === recommendedId)
  const columns = `minmax(6.5rem,1.4fr) repeat(${routes.length}, minmax(0, 1fr))`

  return (
    <section aria-label="How the routes compare" className="space-y-2">
      <h3 className="sr-only">How the routes compare</h3>
      <div role="table" aria-label="Route criteria, in order of priority" className="text-base">
        <div role="row" className="grid items-end gap-1 border-b pb-1.5 font-medium text-muted-foreground" style={{ gridTemplateColumns: columns }}>
          <span role="columnheader">Checked in order</span>
          {routes.map((r) => (
            <span key={r.id} role="columnheader" className={cn('text-right', r.id === recommendedId && 'font-semibold text-foreground')}>
              {r.label.replace('Route ', 'R')}
            </span>
          ))}
        </div>
        {rows.map((row, i) => (
          <div key={row.key} role="row" className="grid items-center gap-1 border-b py-2 tabular" style={{ gridTemplateColumns: columns }}>
            <span role="rowheader" className="font-medium">
              {i + 1}. {row.label}
            </span>
            {routes.map((r) => {
              const best = row.bestIds.has(r.id)
              return (
                <span
                  key={r.id}
                  role="cell"
                  className={cn('flex items-center justify-end gap-1 rounded-md px-1.5 py-0.5', best ? 'bg-foreground font-semibold text-background' : 'text-muted-foreground')}
                >
                  {best && <Check className="size-4 shrink-0" aria-label="best" />}
                  {format(row, row.values[r.id])}
                </span>
              )
            })}
          </div>
        ))}
      </div>
      {winner && (
        <p className="text-base text-muted-foreground">
          {decidedBy
            ? `${winner.label} wins because ${DECIDED_BY[decidedBy]}. Differences under 5 miles count as a tie.`
            : routes.length > 1
              ? `${winner.label} is at least as good on every criterion.`
              : `Only one truck route was found.`}
        </p>
      )}
    </section>
  )
}
