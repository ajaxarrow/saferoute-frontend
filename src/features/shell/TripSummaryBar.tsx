import { ArrowRight, Pencil } from 'lucide-react'
import type { PlanRequest } from '@/api/types'

const shortName = (label: string) => label.split(',')[0]

export function TripSummaryBar({ request, onEdit }: { request: PlanRequest; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b pb-4">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 text-base leading-snug font-semibold">
          <span>{shortName(request.origin.label)}</span>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>{shortName(request.destination.label)}</span>
        </p>
        <p className="text-sm text-muted-foreground tabular">{request.load_lb.toLocaleString('en-US')} lb · weather every {request.interval_miles} mi</p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="flex min-h-11 shrink-0 items-center gap-2 rounded-md border px-3.5 text-sm font-semibold hover:bg-muted"
      >
        <Pencil className="size-4" /> Edit trip
      </button>
    </div>
  )
}
