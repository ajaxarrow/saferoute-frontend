import { defaultCustomLocal, describeDeparture, toDepartureLocal } from './departure'

const NOW = new Date('2026-12-14T12:00:00Z')

describe('departure choices', () => {
  it('"now" is an absolute UTC instant', () => {
    expect(toDepartureLocal({ mode: 'now' }, NOW)).toBe('2026-12-14T12:00:00Z')
  })

  it('"in 1 hour" is an absolute UTC instant one hour later', () => {
    expect(toDepartureLocal({ mode: 'hour' }, NOW)).toBe('2026-12-14T13:00:00Z')
  })

  it('a picked time is passed through as origin wall-clock time', () => {
    expect(toDepartureLocal({ mode: 'custom', local: '2026-12-15T05:00' }, NOW)).toBe('2026-12-15T05:00')
  })

  it('default custom time is the next full hour in local format', () => {
    expect(defaultCustomLocal(new Date(2026, 11, 14, 9, 20))).toBe('2026-12-14T10:00')
  })

  it('describes each choice in words', () => {
    expect(describeDeparture({ mode: 'now' })).toBe('Leaving right now')
    expect(describeDeparture({ mode: 'hour' })).toBe('Leaving in 1 hour')
    expect(describeDeparture({ mode: 'custom', local: '2026-12-15T05:00' })).toBe('Tue, Dec 15 · 5:00 AM (time at your starting point)')
  })
})
