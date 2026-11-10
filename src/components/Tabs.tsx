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
    <div className="space-y-4">
      <div role="tablist" aria-label={label} className="grid auto-cols-fr grid-flow-col border-b-2 border-border">
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
                '-mb-0.5 min-h-12 border-b-4 px-2 text-lg font-bold outline-none focus-visible:bg-muted',
                selected ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground',
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
