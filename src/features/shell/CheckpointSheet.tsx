import { X } from 'lucide-react'
import { useEffect } from 'react'
import type { Checkpoint, PlannedRoute } from '@/api/types'
import { RiskBadge } from '@/features/results/RiskBadge'
import { formatEta, formatMiles } from '@/lib/format'
import { describeWeather } from '@/lib/weather'

interface CheckpointSheetProps {
  route: PlannedRoute
  checkpoint: Checkpoint
  onClose: () => void
}

/** Checkpoint details as a bottom sheet for phones: readable at 360px, closes with X, backdrop tap or Esc. */
export function CheckpointSheet({ route, checkpoint: c, onClose }: CheckpointSheetProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const weather = describeWeather(c)
  return (
    <div className="fixed inset-0 z-40">
      <button type="button" aria-label="Close checkpoint details" onClick={onClose} className="absolute inset-0 bg-foreground/30" />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${route.label}, mile ${Math.round(c.mile)}`}
        className="absolute inset-x-0 bottom-0 max-h-[70dvh] space-y-3 overflow-y-auto rounded-t-2xl border-t bg-card p-4 pb-6 shadow-float"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{route.label} · checkpoint</p>
            <h2 className="text-xl leading-tight font-semibold tabular">{formatMiles(c.mile)} into the trip</h2>
            <p className="text-base text-muted-foreground tabular">Truck arrives {formatEta(c.eta_utc, c.tz)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-11 shrink-0 items-center justify-center rounded-xl border hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <RiskBadge level={c.risk} />
          <span className="text-base font-medium">{weather.label}</span>
        </div>
        <dl className="grid grid-cols-3 gap-2">
          {[
            ['Wind', `${c.wind_mph} mph`],
            ['Rain', `${c.rain_in_hr} in/hr`],
            ['Snow', `${c.snow_in_hr} in/hr`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-muted p-2.5">
              <dt className="text-sm text-muted-foreground">{k}</dt>
              <dd className="text-base font-semibold tabular">{v}</dd>
            </div>
          ))}
        </dl>
        {c.drivers.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-base">
            {c.drivers.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
