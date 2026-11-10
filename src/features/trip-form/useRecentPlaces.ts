import { useCallback, useState } from 'react'
import type { Place } from '@/api/types'

const KEY = 'recent-places'
const MAX = 5

function load(): Place[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : []
  } catch {
    return []
  }
}

/** Last few places the driver picked, remembered in this browser only. */
export function useRecentPlaces() {
  const [recent, setRecent] = useState<Place[]>(load)

  const remember = useCallback((place: Place) => {
    setRecent((current) => {
      const next = [place, ...current.filter((p) => p.label !== place.label)].slice(0, MAX)
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        /* storage unavailable: recents just won't persist */
      }
      return next
    })
  }, [])

  return { recent, remember }
}
