import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

const MARGIN = 8
const KEY_STEP = 16

/**
 * Lets a positioned element be moved around inside its offset parent. Returns the element ref, a transform style and props for a
 * handle (pointer drag, arrow keys, double-click to reset). The element is kept fully inside its parent.
 */
export function useDraggable() {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null)

  const clamp = useCallback((x: number, y: number) => {
    const el = ref.current
    const parent = el?.offsetParent as HTMLElement | null
    if (!el || !parent) return { x, y }
    const e = el.getBoundingClientRect()
    const p = parent.getBoundingClientRect()
    // Where the element sits with no offset applied, so the clamp is absolute rather than cumulative.
    const baseLeft = e.left - offset.x
    const baseTop = e.top - offset.y
    return {
      x: Math.min(Math.max(x, p.left + MARGIN - baseLeft), p.right - MARGIN - e.width - baseLeft),
      y: Math.min(Math.max(y, p.top + MARGIN - baseTop), p.bottom - MARGIN - e.height - baseTop),
    }
  }, [offset])

  const handleProps = {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      drag.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y }
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const d = drag.current
      if (d) setOffset(clamp(d.ox + e.clientX - d.px, d.oy + e.clientY - d.py))
    },
    onPointerUp: () => {
      drag.current = null
    },
    onPointerCancel: () => {
      drag.current = null
    },
    onDoubleClick: () => setOffset({ x: 0, y: 0 }),
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      const step: Record<string, [number, number]> = { ArrowLeft: [-KEY_STEP, 0], ArrowRight: [KEY_STEP, 0], ArrowUp: [0, -KEY_STEP], ArrowDown: [0, KEY_STEP] }
      const s = step[e.key]
      if (!s) return
      e.preventDefault()
      setOffset(clamp(offset.x + s[0], offset.y + s[1]))
    },
  }

  return { ref, style: { transform: `translate(${offset.x}px, ${offset.y}px)` }, handleProps, moved: offset.x !== 0 || offset.y !== 0 }
}
