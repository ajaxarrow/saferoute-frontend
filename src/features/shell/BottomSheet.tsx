import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'

export type SheetSnap = 'peek' | 'half' | 'full'

const DEFAULT_PEEK_PX = 148
const FRACTION: Record<Exclude<SheetSnap, 'peek'>, number> = { half: 0.52, full: 0.86 }
const NEXT: Record<SheetSnap, SheetSnap> = { peek: 'half', half: 'full', full: 'peek' }
const TAP_SLOP_PX = 6

const snapHeights = (viewport: number, peekPx: number): Record<SheetSnap, number> => ({
  peek: peekPx,
  half: Math.round(viewport * FRACTION.half),
  full: Math.round(viewport * FRACTION.full),
})

interface BottomSheetProps {
  snap: SheetSnap
  onSnapChange: (snap: SheetSnap) => void
  /** Shown instead of the content while the sheet is at its smallest (e.g. a one-line result). */
  peek?: ReactNode
  /** Height of the smallest position; make room for whatever `peek` shows. */
  peekHeight?: number
  /** Accessible name of the sheet. */
  label?: string
  children: ReactNode
}

/** Non-modal bottom sheet: drag the handle or tap it to cycle peek / half / full; the map behind stays usable. */
export function BottomSheet({ snap, onSnapChange, peek, peekHeight = DEFAULT_PEEK_PX, label = 'Trip planner', children }: BottomSheetProps) {
  const sheet = useRef<HTMLDivElement>(null)
  const drag = useRef<{ startY: number; startHeight: number; moved: boolean } | null>(null)
  const [dragHeight, setDragHeight] = useState<number | null>(null)

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { startY: e.clientY, startHeight: sheet.current?.offsetHeight ?? 0, moved: false }
  }
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (!d) return
    const delta = d.startY - e.clientY
    if (Math.abs(delta) > TAP_SLOP_PX) d.moved = true
    if (d.moved) setDragHeight(Math.min(Math.max(d.startHeight + delta, peekHeight), window.innerHeight * 0.9))
  }
  const onPointerUp = () => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (!d.moved) {
      onSnapChange(NEXT[snap])
    } else if (dragHeight != null) {
      const heights = snapHeights(window.innerHeight, peekHeight)
      const nearest = (Object.keys(heights) as SheetSnap[]).reduce((a, b) => (Math.abs(heights[b] - dragHeight) < Math.abs(heights[a] - dragHeight) ? b : a))
      onSnapChange(nearest)
    }
    setDragHeight(null)
  }

  // Esc folds the sheet down to its peek position.
  useEffect(() => {
    if (snap === 'peek') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !(e.target instanceof HTMLElement && e.target.closest('[role="listbox"], [cmdk-root]'))) onSnapChange('peek')
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [snap, onSnapChange])

  const showPeek = snap === 'peek' && peek != null && dragHeight == null
  const height = dragHeight ?? snapHeights(window.innerHeight, peekHeight)[snap]

  return (
    <div
      ref={sheet}
      role="region"
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-20 flex flex-col rounded-t-2xl border-t bg-background shadow-[0_-8px_24px_-8px_rgba(15,23,42,0.25)]"
      style={{ height, transition: dragHeight == null ? 'height 200ms ease-out' : 'none' }}
    >
      <div className="relative shrink-0">
      <button
        type="button"
        aria-label={`Panel is ${snap === 'peek' ? 'minimised' : snap === 'half' ? 'half open' : 'fully open'}. Drag or tap to resize.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex h-11 w-full touch-none items-center justify-center"
      >
        <span className="h-1.5 w-12 rounded-full bg-muted-foreground/50" />
      </button>
      {snap !== 'peek' && (
        <button
          type="button"
          onClick={() => onSnapChange('peek')}
          aria-label="Close panel"
          className="absolute top-0 right-2 flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
        >
          <ChevronDown className="size-6" aria-hidden />
        </button>
      )}
      </div>
      {showPeek && <div className="px-4 pb-4">{peek}</div>}
      {/* Kept mounted while peeking so the form keeps what the driver typed. */}
      {/* Kept mounted while peeking so the form keeps what the driver typed. */}
      <div hidden={showPeek} className="min-h-0 flex-1">
        {children}
      </div>
    </div>
  )
}
