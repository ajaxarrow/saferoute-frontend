import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const STAGES = ['Finding truck routes…', 'Forecasting weather along each route…', 'Scoring risk and picking the safest…']

/** Same silhouette as the results (verdict, then route rows) so nothing jumps when they land. */
export function LoadingState() {
  const [stage, setStage] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 2200)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <p className="flex items-center gap-2 text-base font-medium">
        <Loader2 className="size-5 animate-spin" aria-hidden /> {STAGES[stage]}
      </p>
      <Skeleton className="h-40 w-full rounded-2xl bg-secondary ring-1 ring-border" />
      <Skeleton className="h-14 w-full rounded-xl bg-secondary ring-1 ring-border" />
      <Skeleton className="h-14 w-full rounded-xl bg-secondary ring-1 ring-border" />
      <Skeleton className="h-32 w-full rounded-xl bg-secondary ring-1 ring-border" />
    </div>
  )
}
