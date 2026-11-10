import { Ban, ShieldCheck } from 'lucide-react'
import type { PlanResponse } from '@/api/types'
import { cn } from '@/lib/utils'

export function RecommendationBanner({ plan }: { plan: PlanResponse }) {
  const best = plan.routes.find((r) => r.id === plan.recommended_route_id)
  if (!best) return null
  const blocked = best.summary.miles_by_level.NO_TRAVEL > 0

  return (
    <section
      aria-live="polite"
      className={cn(
        'rounded-2xl border p-4',
        blocked ? 'border-purple-700/50 bg-purple-700/10' : 'border-green-600/40 bg-green-600/10',
      )}
    >
      <div className="flex items-start gap-3">
        {blocked ? <Ban className="mt-0.5 size-6 shrink-0 text-purple-700 dark:text-purple-400" aria-hidden /> : <ShieldCheck className="mt-0.5 size-6 shrink-0 text-green-600" aria-hidden />}
        <div className="space-y-1">
          {blocked && <p className="text-sm font-bold tracking-wide text-purple-700 uppercase dark:text-purple-300">Do not depart as planned</p>}
          <h2 className="text-lg leading-tight font-bold">{blocked ? `Least-bad option: ${best.label}` : `Take ${best.label}`}</h2>
          <p className="text-sm">{plan.recommendation_reason}</p>
        </div>
      </div>
    </section>
  )
}
