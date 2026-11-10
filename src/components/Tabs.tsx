import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TabItem<T extends string> {
  id: T
  label: string
}

interface TabsProps<T extends string> {
  label: string
  tabs: TabItem<T>[]
  value: T
  onChange: (id: T) => void
  children: ReactNode
}

/** Tabs with real tab semantics; the panel is whatever the caller passes for the active tab. */
export function Tabs<T extends string>({ label, tabs, value, onChange, children }: TabsProps<T>) {
  const base = useId()
  const move = (from: number, step: number) => {
    const next = tabs[(from + step + tabs.length) % tabs.length]
    onChange(next.id)
    document.getElementById(`${base}-tab-${next.id}`)?.focus()
  }

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-muted p-1">
        {tabs.map((tab, i) => {
          const selected = tab.id === value
          return (
            <button
              key={tab.id}
              id={`${base}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${base}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') move(i, 1)
                if (e.key === 'ArrowLeft') move(i, -1)
              }}
              className={cn(
                'min-h-10 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected ? 'bg-card font-semibold text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-tab-${value}`}>
        {children}
      </div>
    </div>
  )
}
