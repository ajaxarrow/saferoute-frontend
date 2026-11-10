import { describeWeather, isNight } from './weather'

const wx = (wind_mph: number, rain_in_hr = 0, snow_in_hr = 0) => ({ wind_mph, rain_in_hr, snow_in_hr })

describe('describeWeather', () => {
  it('is clear when nothing notable is happening', () => {
    expect(describeWeather(wx(8))).toEqual({ kind: 'clear', label: 'Clear' })
  })

  it('calls 25+ mph windy', () => {
    expect(describeWeather(wx(24.9)).kind).toBe('clear')
    expect(describeWeather(wx(25))).toEqual({ kind: 'wind', label: 'Windy' })
  })

  it('shows rain and snow, snow first when both fall', () => {
    expect(describeWeather(wx(5, 0.2))).toEqual({ kind: 'rain', label: 'Rain' })
    expect(describeWeather(wx(5, 0.2, 0.4))).toEqual({ kind: 'snow', label: 'Snow and rain' })
  })

  it('lists every factor in the label and picks the most severe icon', () => {
    expect(describeWeather(wx(40, 0.3))).toEqual({ kind: 'rain', label: 'Rain and wind' })
  })

  it('ignores trace amounts', () => {
    expect(describeWeather(wx(5, 0.01, 0.01)).kind).toBe('clear')
  })
})

describe('isNight', () => {
  it('is local night from 7 PM to 6 AM', () => {
    expect(isNight('2026-12-15T03:00:00Z', 'America/Denver')).toBe(true) // 8 PM MST
    expect(isNight('2026-12-15T18:00:00Z', 'America/Denver')).toBe(false) // 11 AM MST
    expect(isNight('2026-12-15T11:30:00Z', 'America/Denver')).toBe(true) // 4:30 AM MST
  })
})
