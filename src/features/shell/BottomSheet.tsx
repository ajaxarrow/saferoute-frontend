import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'

export type SheetSnap = 'peek' | 'half' | 'full'

const PEEK_PX = 148
const FRACTION: Record<Exclude<SheetSnap, 'peek'>, number> = { half: 0.52, full: 0.86 }
const NEXT: Record<SheetSnap, SheetSnap> = { peek: 'half', half: 'full', full: 'peek' }
const TAP_SLOP_PX = 6

const snapHeights = (viewport: number): Record<SheetSnap, number> => ({
  peek: PEEK_PX,
  half: Math.round(viewport * FRACTION.half),
  full: Math.round(viewport * FRACTION.full),
})

interface BottomSheetProps {
  snap: SheetSnap
  onSnapChange: (snap: SheetSnap) => void
  /** Shown instead of the content while the sheet is at its smallest (e.g. a one-line result). */
  peek?: ReactNode
  /** When this value changes the content scrolls back to the top (e.g. new results arrived). */
  resetScrollKey?: unknown
  children: ReactNode
}

/** Non-modal bottom sheet: drag the handle or tap it to cycle peek / half / full; the map behind stays usable. */
export function BottomSheet({ snap, onSnapChange, peek, resetScrollKey, children }: BottomSheetProps) {
  const scroller = useRef<HTMLDivElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
  const drag = useRef<{ startY: number; startHeight: number; moved: boolean } | null>(null)
  const [dragHeight, setDragHeight] = useState<number | null>(null)

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [resetScrollKey])

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { startY: e.clientY, startHeight: sheet.current?.offsetHeight ?? 0, moved: false }
  }
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (!d) return
    const delta = d.startY - e.clientY
    if (Math.abs(delta) > TAP_SLOP_PX) d.moved = true
    if (d.moved) setDragHeight(Math.min(Math.max(d.startHeight + delta, PEEK_PX), window.innerHeight * 0.9))
  }
  const onPointerUp = () => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (!d.moved) {
      onSnapChange(NEXT[snap])
    } else if (dragHeight != null) {
      const heights = snapHeights(window.innerHeight)
      const nearest = (Object.keys(heights) as SheetSnap[]).reduce((a, b) => (Math.abs(heights[b] - dragHeight) < Math.abs(heights[a] - dragHeight) ? b : a))
      onSnapChange(nearest)
    }
    setDragHeight(null)
  }

  const showPeek = snap === 'peek' && peek != null && dragHeight == null
  const height = dragHeight ?? snapHeights(window.innerHeight)[snap]

  return (
    <div
      ref={sheet}
      className="fixed inset-x-0 bottom-0 z-20 flex flex-col rounded-t-xl border-t-4 border-foreground bg-background"
      style={{ height, transition: dragHeight == null ? 'height 300ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none' }}
    >
      <button
        type="button"
        aria-label={`Panel is ${snap === 'peek' ? 'minimised' : snap === 'half' ? 'half open' : 'fully open'}. Drag or tap to resize.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex h-11 w-full shrink-0 touch-none items-center justify-center"
      >
        <span className="h-1.5 w-12 rounded-full bg-foreground/40" />
      </button>
      {showPeek && <div className="px-4 pb-4">{peek}</div>}
      {/* Kept mounted while peeking so the form keeps what the driver typed. */}
      <div ref={scroller} hidden={showPeek} className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">
        {children}
      </div>
    </div>
  )
}
