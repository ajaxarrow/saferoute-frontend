import { useEffect, useRef, type ReactNode } from 'react'

export type SheetSnap = 'peek' | 'half' | 'full'

const HEIGHT: Record<SheetSnap, string> = { peek: '9.5rem', half: '52dvh', full: '86dvh' }
const NEXT: Record<SheetSnap, SheetSnap> = { peek: 'half', half: 'full', full: 'peek' }

interface BottomSheetProps {
  snap: SheetSnap
  onSnapChange: (snap: SheetSnap) => void
  /** When this value changes the content scrolls back to the top (e.g. new results arrived). */
  resetScrollKey?: unknown
  children: ReactNode
}

/** Non-modal bottom sheet (peek / half / full) so the map behind it stays usable. */
export function BottomSheet({ snap, onSnapChange, resetScrollKey, children }: BottomSheetProps) {
  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [resetScrollKey])

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 flex flex-col rounded-t-3xl border-t bg-background shadow-[0_-8px_30px_rgba(0,0,0,0.18)] transition-[height] duration-300 ease-out"
      style={{ height: HEIGHT[snap] }}
    >
      <button
        type="button"
        aria-label={`Panel is ${snap === 'peek' ? 'minimised' : snap === 'half' ? 'half open' : 'fully open'}. Tap to resize.`}
        onClick={() => onSnapChange(NEXT[snap])}
        className="flex h-9 w-full shrink-0 items-center justify-center"
      >
        <span className="h-1.5 w-12 rounded-full bg-muted-foreground/40" />
      </button>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">{children}</div>
    </div>
  )
}
