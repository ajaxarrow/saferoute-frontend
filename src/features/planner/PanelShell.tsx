import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const FooterSlot = createContext<HTMLElement | null>(null)

/** Where a panel's pinned footer (the "Find safest route" button) should render, or null when there is no shell. */
export const usePanelFooter = () => useContext(FooterSlot)

interface PanelShellProps {
  children: ReactNode
  /** Padding for the scrolling content; the footer pads itself. */
  className?: string
  /** When this changes the content scrolls back to the top. */
  resetKey?: unknown
}

/**
 * A scrolling body with a footer slot beneath it. The footer is a normal flex sibling, not `position: sticky`, so it is
 * always visible and never creates the overlapping compositor layer that made the map draw blank over it.
 */
export function PanelShell({ children, className, resetKey }: PanelShellProps) {
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scroller.current?.scrollTo?.({ top: 0 }) // absent in jsdom
  }, [resetKey])
  return (
    <FooterSlot.Provider value={slot}>
      <div className="flex h-full min-h-0 flex-col">
        <div ref={scroller} className={cn('min-h-0 flex-1 overflow-y-auto', className)}>
          {children}
        </div>
        <div ref={setSlot} className="shrink-0 empty:hidden" />
      </div>
    </FooterSlot.Provider>
  )
}
