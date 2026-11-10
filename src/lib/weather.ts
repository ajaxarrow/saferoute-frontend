export type WeatherKind = 'clear' | 'wind' | 'rain' | 'snow'

interface Conditions {
  wind_mph: number
  rain_in_hr: number
  snow_in_hr: number
}

const WINDY_MPH = 25
const TRACE_IN_HR = 0.05

/** One icon and one phrase for what the truck is driving through. */
export function describeWeather(c: Conditions): { kind: WeatherKind; label: string } {
  const snow = c.snow_in_hr >= TRACE_IN_HR
  const rain = c.rain_in_hr >= TRACE_IN_HR
  const wind = c.wind_mph >= WINDY_MPH
  const parts = [snow && 'Snow', rain && 'rain', wind && 'wind'].filter((p): p is string => Boolean(p))
  if (parts.length === 0) return { kind: 'clear', label: 'Clear' }
  const kind: WeatherKind = snow ? 'snow' : rain ? 'rain' : 'wind'
  // Lead with the icon's word, then the rest: "Rain and wind", "Snow and rain", "Windy".
  const lead = kind === 'snow' ? 'Snow' : kind === 'rain' ? 'Rain' : 'Windy'
  const rest = parts.filter((p) => p.toLowerCase() !== lead.toLowerCase() && !(kind === 'wind' && p === 'wind'))
  return { kind, label: rest.length ? `${lead} and ${rest.join(' and ')}` : lead }
}

/** Local night (7 PM–6 AM) at the given instant and zone, for a moon instead of a sun. */
export function isNight(isoUtc: string, timeZone: string): boolean {
  const hour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone }).format(new Date(isoUtc)))
  return hour >= 19 || hour < 6
}
