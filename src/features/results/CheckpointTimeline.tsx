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
  const rows = route.checkpoints.filter((c) => filter === 'all' || isRisky(c))
  const maxWind = Math.max(...route.checkpoints.map((c) => c.wind_mph))

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Stops on {route.label}</h3>
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
      {!anyRisky && (
        <p className="text-sm text-muted-foreground">
          All {route.checkpoints.length} stops are Low. Strongest wind {maxWind} mph.
        </p>
      )}
      {(
        <ol>
          {rows.map((c, i) => (
            <li key={c.index} className="relative pl-9">
              {/* the line: inked in this stop's risk, running down to the next stop */}
              {i < rows.length - 1 && <span aria-hidden className="absolute top-5 bottom-[-0.25rem] left-[0.6rem] w-1 rounded-full opacity-80" style={{ backgroundColor: RISK[c.risk].color }} />}
              <span aria-hidden className="absolute top-3 left-0 size-6 rounded-full border-2 border-muted-foreground/60 bg-card" />
              <button
                type="button"
                aria-label={`Checkpoint at mile ${Math.round(c.mile)}, ${RISK[c.risk].label}`}
                onClick={() => onSelectCheckpoint(route.id, c.index)}
                className="flex min-h-14 w-full items-start gap-3 rounded-xl px-2 py-3 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="min-w-0 flex-1 space-y-0.5">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-base font-semibold tabular">
                      {formatMiles(c.mile)} · {formatEta(c.eta_utc, c.tz)}
                    </span>
                    <RiskBadge level={c.risk} size="sm" />
                  </span>
                  <span className="block text-sm text-muted-foreground tabular">{conditions(c)}</span>
                  {c.drivers.map((d) => (
                    <span key={d} className="block text-sm font-medium">
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
