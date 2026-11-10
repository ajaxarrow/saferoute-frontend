import { loadRuleLines } from '@/features/trip-form/LoadField'
import { RECOMMENDATION_STEPS, THRESHOLD_ROWS } from '@/lib/riskRules'
import { RiskBadge } from './RiskBadge'

/** Plain-language help: what the levels mean, what your load changes, how a route is picked. */
export function ScoringGuide({ loadLb }: { loadLb?: number }) {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="text-base font-semibold">What the levels mean</h3>
        <div role="table" aria-label="Risk thresholds" className="text-base">
          <div role="row" className="grid grid-cols-[6.5rem_1fr_1fr_1fr] gap-2 border-b pb-1.5 font-medium text-muted-foreground">
            <span role="columnheader">Level</span>
            <span role="columnheader">Wind mph</span>
            <span role="columnheader">Rain in/hr</span>
            <span role="columnheader">Snow in/hr</span>
          </div>
          {THRESHOLD_ROWS.map((row) => (
            <div key={row.level} role="row" className="grid grid-cols-[6.5rem_1fr_1fr_1fr] items-center gap-2 border-b py-2 tabular">
              <span role="cell">
                <RiskBadge level={row.level} size="sm" />
              </span>
              <span role="cell">{row.wind}</span>
              <span role="cell">{row.rain}</span>
              <span role="cell">{row.snow}</span>
            </div>
          ))}
        </div>
        <p className="text-base text-muted-foreground">The worst of wind, rain and snow sets the level at each stop.</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold">{loadLb != null ? `Your load: ${loadLb.toLocaleString('en-US')} lb` : 'Heavy loads'}</h3>
        <ul className="list-disc space-y-1 pl-5 text-base">
          {(loadLb != null
            ? loadRuleLines(loadLb)
            : ['Over 30,000 lb: winds 45+ mph are No Travel.', 'Over 40,000 lb: winds 35+ mph count as Severe.']
          ).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold">How a route is recommended</h3>
        <ol className="list-decimal space-y-1 pl-5 text-base">
          {RECOMMENDATION_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="text-base text-muted-foreground">Stretches within 5 miles of each other count as equal, so a tiny difference never beats a much shorter drive.</p>
      </section>
    </div>
  )
}
