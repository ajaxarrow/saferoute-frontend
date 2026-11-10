/** MapTiler key (restrict it to your domains in the MapTiler dashboard; it ships in the browser bundle). */
export const MAPTILER_KEY = (import.meta.env.VITE_MAPTILER_KEY as string | undefined) ?? ''

export function maptilerUrl(path: string, params: Record<string, string> = {}): string {
  const query = new URLSearchParams({ ...params, key: MAPTILER_KEY })
  return `https://api.maptiler.com/${path}?${query}`
}
