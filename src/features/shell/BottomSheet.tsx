import type { ReactNode } from 'react'

const PEEK_HEIGHT = '9.5rem'

interface BottomSheetProps {
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  children: ReactNode
}

/** Non-modal bottom sheet so the map behind it stays interactive. */
export function BottomSheet({ expanded, onExpandedChange, children }: BottomSheetProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 flex flex-col rounded-t-3xl border-t bg-background shadow-[0_-8px_30px_rgba(0,0,0,0.18)] transition-[height] duration-300 ease-out"
      style={{ height: expanded ? '82dvh' : PEEK_HEIGHT }}
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse panel to see the map' : 'Expand panel'}
        onClick={() => onExpandedChange(!expanded)}
        className="flex h-8 w-full shrink-0 items-center justify-center"
      >
        <span className="h-1.5 w-12 rounded-full bg-muted-foreground/40" />
      </button>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">{children}</div>
    </div>
  )
}
