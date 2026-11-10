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

/** Start/end pins plus a "Best" badge on the recommended route. Returns a cleanup function. */
export function addPlanMarkers(map: MapLibreMap, plan: PlanResponse): () => void {
  const markers: Marker[] = []
  const first = plan.routes[0]
  const geometry = first.geometry as LonLat[]

  markers.push(
    new Marker({ element: el('A', `${PIN}background:#2563eb;`) }).setLngLat(geometry[0]).addTo(map),
    new Marker({ element: el('B', `${PIN}background:#111827;`) }).setLngLat(geometry[geometry.length - 1]).addTo(map),
  )

  const best = plan.routes.find((r) => r.id === plan.recommended_route_id)
  if (best) {
    const coords = best.geometry as LonLat[]
    const cum = cumulativeMiles(coords)
    const mid = pointAt(coords, cum, cum[cum.length - 1] / 2)
    const badge = el(
      '★ Best',
      'padding:3px 9px;border-radius:999px;background:#16a34a;color:#fff;font:700 12px system-ui;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);pointer-events:none;',
    )
    markers.push(new Marker({ element: badge }).setLngLat(mid).addTo(map))
  }
  return () => markers.forEach((m) => m.remove())
}
