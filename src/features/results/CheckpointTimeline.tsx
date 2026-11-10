import { useState } from 'react'
import type { Checkpoint, PlannedRoute } from '@/api/types'
import { Segmented } from '@/components/Segmented'
import { formatEta, formatMiles } from '@/lib/format'
import { RISK } from '@/lib/risk'
import { RiskBadge } from './RiskBadge'

type Filter = 'all' | 'risky'

const isRisky = (c: Checkpoint) => RISK[c.risk].rank >= RISK.MODERATE.rank

/** Wind always; rain and snow only when there is some, so calm rows stay short. */
function conditions(c: Checkpoint): string {
  const parts = [`Wind ${c.wind_mph} mph`]
  if (c.rain_in_hr > 0) parts.push(`Rain ${c.rain_in_hr} in/hr`)
  if (c.snow_in_hr > 0) parts.push(`Snow ${c.snow_in_hr} in/hr`)
  return parts.join(' · ')
}

interface CheckpointTimelineProps {
  route: PlannedRoute
  onSelectCheckpoint: (routeId: string, index: number) => void
}

export function CheckpointTimeline({ route, onSelectCheckpoint }: CheckpointTimelineProps) {
  const anyRisky = route.checkpoints.some(isRisky)
  const [filter, setFilter] = useState<Filter>(anyRisky ? 'risky' : 'all')
  const [expanded, setExpanded] = useState(false)
  const rows = route.checkpoints.filter((c) => filter === 'all' || isRisky(c))
  const maxWind = Math.max(...route.checkpoints.map((c) => c.wind_mph))
  // A route that is Low all the way is one sentence, not 40 identical rows.
  const collapsed = !anyRisky && !expanded

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-medium">Stops on {route.label}</h3>
        {anyRisky && (
          <Segmented
            label="Which checkpoints to list"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'risky', label: 'Moderate+' },
              { value: 'all', label: 'All' },
            ]}
            className="w-52"
          />
        )}
      </div>
      {route.forecast_truncated && (
        <p className="text-base text-muted-foreground">The forecast ends before this trip does; late stops use the last available hour.</p>
      )}
      {collapsed ? (
        <div className="space-y-2">
          <p className="text-base">
            All {route.checkpoints.length} stops are Low. Strongest wind {maxWind} mph.
          </p>
          <button type="button" onClick={() => setExpanded(true)} className="min-h-12 rounded-full border px-5 text-base font-medium text-primary hover:bg-primary/10">
            Show all {route.checkpoints.length} stops
          </button>
        </div>
      ) : (
        <ol className="-mx-3">
          {rows.map((c) => (
            <li key={c.index}>
              <button
                type="button"
                aria-label={`Checkpoint at mile ${Math.round(c.mile)}, ${RISK[c.risk].label}`}
                onClick={() => onSelectCheckpoint(route.id, c.index)}
                className="flex min-h-14 w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="mt-1.5 size-3.5 shrink-0 rounded-full" style={{ backgroundColor: RISK[c.risk].color }} aria-hidden />
                <span className="min-w-0 flex-1 space-y-0.5">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-base font-medium tabular">
                      {formatMiles(c.mile)} · {formatEta(c.eta_utc, c.tz)}
                    </span>
                    <RiskBadge level={c.risk} size="sm" />
                  </span>
                  <span className="block text-base text-muted-foreground tabular">{conditions(c)}</span>
                  {c.drivers.map((d) => (
                    <span key={d} className="block text-base font-medium">
                      {d}
                    </span>
                  ))}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
