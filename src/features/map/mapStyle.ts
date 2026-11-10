export type Theme = 'light' | 'dark'

const LIGHT = (import.meta.env.VITE_MAP_STYLE_LIGHT as string | undefined) ?? 'https://tiles.openfreemap.org/styles/positron'
const DARK = (import.meta.env.VITE_MAP_STYLE_DARK as string | undefined) ?? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

export function mapStyleUrl(theme: Theme): string {
  return theme === 'dark' ? DARK : LIGHT
}
