import { formatDuration, formatEta, formatMiles } from './format'

describe('format', () => {
  it('formats durations', () => {
    expect(formatDuration(22800)).toBe('6h 20m')
    expect(formatDuration(2700)).toBe('45m')
    expect(formatDuration(3600)).toBe('1h 0m')
  })

  it('formats miles with grouping', () => {
    expect(formatMiles(1234.4)).toBe('1,234 mi')
    expect(formatMiles(0.4)).toBe('0 mi')
  })

  it('renders ETAs in the checkpoint time zone', () => {
    expect(formatEta('2026-12-15T13:00:00Z', 'America/Los_Angeles')).toBe('Tue 5:00 AM PST')
    expect(formatEta('2026-12-15T13:00:00Z', 'America/Denver')).toBe('Tue 6:00 AM MST')
  })
})
