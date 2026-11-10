import { ArrowRight, Pencil } from 'lucide-react'
import type { PlanRequest } from '@/api/types'
import { Button } from '@/components/ui/button'

const shortName = (label: string) => label.split(',')[0]

export function TripSummaryBar({ request, onEdit }: { request: PlanRequest; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-3">
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-semibold">
          <span className="truncate">{shortName(request.origin.label)}</span>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate">{shortName(request.destination.label)}</span>
        </p>
        <p className="text-sm text-muted-foreground">{request.load_lb.toLocaleString('en-US')} lb · every {request.interval_miles} mi</p>
      </div>
      <Button variant="outline" onClick={onEdit} className="h-11 shrink-0 gap-1.5 rounded-xl px-3">
        <Pencil className="size-4" /> Edit trip
      </Button>
    </div>
  )
}
