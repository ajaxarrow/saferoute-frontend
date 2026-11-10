import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SegmentedOption<T extends string | number> {
  value: T
  label: ReactNode
  /** Plain-text name for assistive tech when `label` is not text. */
  name?: string
}

interface SegmentedProps<T extends string | number> {
  options: SegmentedOption<T>[]
  value: T | null
  onChange: (value: T) => void
  label: string
  className?: string
}

/** Single-choice chips (radio semantics) with 44px+ targets. */
export function Segmented<T extends string | number>({ options, value, onChange, label, className }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('flex flex-wrap gap-2', className)}>
      {options.map((option) => {
        const checked = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={option.name}
            onClick={() => onChange(option.value)}
            className={cn(
              'min-h-12 flex-1 rounded-md border-2 px-3 text-base font-bold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              checked ? 'border-foreground bg-foreground text-background' : 'border-input/60 text-foreground hover:bg-muted',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
