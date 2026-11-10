import { Marker, type Map as MapLibreMap } from 'maplibre-gl'
import type { PlanResponse } from '@/api/types'
import { cumulativeMiles, pointAt, type LonLat } from '@/lib/geo'

function el(html: string, css: string): HTMLElement {
  const node = document.createElement('div')
  node.innerHTML = html
  node.style.cssText = css
  return node
}

const PIN =
  'width:30px;height:30px;border-radius:999px;display:flex;align-items:center;justify-content:center;font:700 14px system-ui;color:#fff;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);'

/** "A" and/or "B" pins for whichever endpoints are known. Returns a cleanup function. */
export function addEndpointMarkers(map: MapLibreMap, origin?: LonLat | null, destination?: LonLat | null): () => void {
  const markers: Marker[] = []
  if (origin) markers.push(new Marker({ element: el('A', `${PIN}background:#2563eb;`) }).setLngLat(origin).addTo(map))
  if (destination) markers.push(new Marker({ element: el('B', `${PIN}background:#111827;`) }).setLngLat(destination).addTo(map))
  return () => markers.forEach((m) => m.remove())
}

/** Start/end pins plus a "Best" badge on the recommended route. Returns a cleanup function. */
export function addPlanMarkers(map: MapLibreMap, plan: PlanResponse): () => void {
  const geometry = plan.routes[0].geometry as LonLat[]
  const removeEndpoints = addEndpointMarkers(map, geometry[0], geometry[geometry.length - 1])

  const best = plan.routes.find((r) => r.id === plan.recommended_route_id)
  if (!best) return removeEndpoints
  const coords = best.geometry as LonLat[]
  const cum = cumulativeMiles(coords)
  const mid = pointAt(coords, cum, cum[cum.length - 1] / 2)
  const badge = el(
    '★ Best',
    'padding:3px 9px;border-radius:999px;background:#16a34a;color:#fff;font:700 12px system-ui;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);pointer-events:none;',
  )
  const badgeMarker = new Marker({ element: badge }).setLngLat(mid).addTo(map)
  return () => {
    removeEndpoints()
    badgeMarker.remove()
  }
}
