import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Segmented } from '@/components/Segmented'
import type { IntervalMiles } from '@/api/types'
import { cn } from '@/lib/utils'

const OPTIONS = [
  { value: 10 as IntervalMiles, label: '10 mi' },
  { value: 25 as IntervalMiles, label: '25 mi' },
  { value: 50 as IntervalMiles, label: '50 mi' },
]

interface IntervalFieldProps {
  value: IntervalMiles
  onChange: (miles: IntervalMiles) => void
}

/** Rarely changed, so it folds away; the current value stays visible on the closed row. */
export function IntervalField({ value, onChange }: IntervalFieldProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-md border-2 border-input">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-14 w-full items-center justify-between gap-3 px-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span>
          <span className="block text-lg font-bold">Weather checks</span>
          <span className="block text-base text-muted-foreground">Every {value} mi along the route</span>
        </span>
        <ChevronDown className={cn('size-6 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div className="space-y-2 border-t-2 p-3">
          <Segmented options={OPTIONS} value={value} onChange={onChange} label="Weather check distance" />
          <p className="text-base text-muted-foreground">Smaller = more detail, a little slower.</p>
        </div>
      )}
    </div>
  )
}
