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
    <div role="radiogroup" aria-label={label} className={cn('flex gap-0 rounded-xl bg-muted p-1', className)}>
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
              'min-h-12 min-w-0 flex-1 rounded-lg px-2 text-base font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              checked ? 'bg-card font-semibold text-primary shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
