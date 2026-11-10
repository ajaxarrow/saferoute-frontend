import { MAPTILER_KEY, maptilerUrl } from '@/api/maptiler'

export type Theme = 'light' | 'dark'

const OVERRIDE = {
  light: import.meta.env.VITE_MAP_STYLE_LIGHT as string | undefined,
  dark: import.meta.env.VITE_MAP_STYLE_DARK as string | undefined,
}
const MAPTILER_STYLE: Record<Theme, string> = { light: 'streets-v4', dark: 'streets-v4-dark' }
const FALLBACK: Record<Theme, string> = {
  light: 'https://tiles.openfreemap.org/styles/liberty',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
}

/** Explicit env override → MapTiler streets (when a key is set) → keyless fallback. */
export function mapStyleUrl(theme: Theme): string {
  if (OVERRIDE[theme]) return OVERRIDE[theme]
  if (MAPTILER_KEY) return maptilerUrl(`maps/${MAPTILER_STYLE[theme]}/style.json`)
  return FALLBACK[theme]
}
