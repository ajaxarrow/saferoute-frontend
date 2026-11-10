import { useState } from 'react'
import type { PlannedRoute } from '@/api/types'
import { Segmented } from '@/components/Segmented'
import { formatEta, formatMiles } from '@/lib/format'
import { RISK } from '@/lib/risk'
import { RiskBadge } from './RiskBadge'

type Filter = 'all' | 'risky'

interface CheckpointTimelineProps {
  route: PlannedRoute
  onSelectCheckpoint: (routeId: string, index: number) => void
}

export function CheckpointTimeline({ route, onSelectCheckpoint }: CheckpointTimelineProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const rows = route.checkpoints.filter((c) => filter === 'all' || RISK[c.risk].rank >= RISK.MODERATE.rank)

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Stops on {route.label}</h3>
        <Segmented
          label="Which checkpoints to list"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'risky', label: 'Moderate+' },
          ]}
          className="w-44"
        />
      </div>
      {route.forecast_truncated && (
        <p className="text-sm text-muted-foreground">The forecast ends before this trip does; late stops use the last available hour.</p>
      )}
      {rows.length === 0 && <p className="text-sm text-muted-foreground">No Moderate or worse weather on this route.</p>}
      <ol className="space-y-1.5">
        {rows.map((c) => (
          <li key={c.index}>
            <button
              type="button"
              aria-label={`Checkpoint at mile ${Math.round(c.mile)}, ${RISK[c.risk].label}`}
              onClick={() => onSelectCheckpoint(route.id, c.index)}
              className="flex w-full items-start gap-3 rounded-xl border bg-card p-3 text-left transition-colors outline-none hover:border-foreground/40 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="mt-1 size-3 shrink-0 rounded-full" style={{ backgroundColor: RISK[c.risk].color }} aria-hidden />
              <span className="min-w-0 flex-1 space-y-0.5">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">
                    {formatMiles(c.mile)} · {formatEta(c.eta_utc, c.tz)}
                  </span>
                  <RiskBadge level={c.risk} size="sm" />
                </span>
                <span className="block text-sm text-muted-foreground">
                  Wind {c.wind_mph} mph · Rain {c.rain_in_hr} in/hr · Snow {c.snow_in_hr} in/hr
                </span>
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
    </section>
  )
}
