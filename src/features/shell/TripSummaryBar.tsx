import { ArrowRight, Pencil } from 'lucide-react'
import type { PlanRequest } from '@/api/types'

const shortName = (label: string) => label.split(',')[0]

export function TripSummaryBar({ request, onEdit }: { request: PlanRequest; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b-2 pb-4">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 text-xl leading-snug font-extrabold">
          <span>{shortName(request.origin.label)}</span>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>{shortName(request.destination.label)}</span>
        </p>
        <p className="text-base text-muted-foreground tabular">{request.load_lb.toLocaleString('en-US')} lb · weather every {request.interval_miles} mi</p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="flex min-h-12 shrink-0 items-center gap-2 rounded-md border-2 border-foreground px-4 text-base font-bold hover:bg-muted"
      >
        <Pencil className="size-4" /> Edit trip
      </button>
    </div>
  )
}
