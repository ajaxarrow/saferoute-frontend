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
    <div className="rounded-xl border">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-14 w-full rounded-xl items-center justify-between gap-3 px-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span>
          <span className="block text-base font-semibold">Advanced</span>
          <span className="block text-sm text-muted-foreground">Weather check every {value} mi</span>
        </span>
        <ChevronDown className={cn('size-5 shrink-0 transition-transform duration-150', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div className="space-y-2 border-t p-3">
          <Segmented options={OPTIONS} value={value} onChange={onChange} label="Weather check distance" />
          <p className="text-sm text-muted-foreground">Weather check distance. Smaller = more detail, a little slower.</p>
        </div>
      )}
    </div>
  )
}
