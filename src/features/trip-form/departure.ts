/** How the driver chose to leave, and how that becomes the API's `departure_local`. */
export type DepartureChoice = { mode: 'now' } | { mode: 'hour' } | { mode: 'custom'; local: string }

const isoUtc = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, 'Z')

/**
 * "Now" and "in 1 hour" are absolute instants (UTC), so they are right whatever time zone the
 * driver's device is in. A picked time is a wall-clock time at the origin, which the server
 * interprets in the origin's zone.
 */
export function toDepartureLocal(choice: DepartureChoice, now: Date = new Date()): string {
  switch (choice.mode) {
    case 'now':
      return isoUtc(now)
    case 'hour':
      return isoUtc(new Date(now.getTime() + 3_600_000))
    case 'custom':
      return choice.local
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

export function formatLocalInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function defaultCustomLocal(now: Date = new Date()): string {
  const next = new Date(now)
  next.setHours(next.getHours() + 1, 0, 0, 0)
  return formatLocalInput(next)
}

export function describeDeparture(choice: DepartureChoice): string {
  if (choice.mode === 'now') return 'Leaving right now'
  if (choice.mode === 'hour') return 'Leaving in 1 hour'
  const [date, time] = choice.local.split('T')
  if (!date || !time) return 'Pick a date and time'
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const when = new Date(y, m - 1, d, hh, mm)
  const day = when.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const clock = when.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${day} · ${clock} (time at your starting point)`
}
