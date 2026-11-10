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
  'width:30px;height:30px;border-radius:999px;display:flex;align-items:center;justify-content:center;font:500 14px Roboto,system-ui;color:#fff;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);'

/** "A" and/or "B" pins for whichever endpoints are known. Returns a cleanup function. */
export function addEndpointMarkers(map: MapLibreMap, origin?: LonLat | null, destination?: LonLat | null): () => void {
  const markers: Marker[] = []
  if (origin) markers.push(new Marker({ element: el('A', `${PIN}background:#1a73e8;`) }).setLngLat(origin).addTo(map))
  if (destination) markers.push(new Marker({ element: el('B', `${PIN}background:#d93025;`) }).setLngLat(destination).addTo(map))
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
    'padding:3px 9px;border-radius:999px;background:#188038;color:#fff;font:500 13px Roboto,system-ui;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);pointer-events:none;',
  )
  const badgeMarker = new Marker({ element: badge }).setLngLat(mid).addTo(map)
  return () => {
    removeEndpoints()
    badgeMarker.remove()
  }
}

const TRUCK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>'

/** The moving truck: a white disc with a blue ring, so it reads on any risk colour underneath. */
export function createTruckMarker(): Marker {
  const node = el(TRUCK_SVG, 'width:38px;height:38px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:#fff;color:#1a73e8;border:3px solid #1a73e8;box-shadow:0 2px 8px rgba(0,0,0,.4);pointer-events:none;')
  return new Marker({ element: node })
}
