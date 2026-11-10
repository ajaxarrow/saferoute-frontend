import type { Checkpoint, PlannedRoute } from '@/api/types'
import { formatEta, formatMiles } from '@/lib/format'
import { RISK } from '@/lib/risk'

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

/** HTML for the map popup shown when a checkpoint is clicked. All dynamic text is escaped. */
export function checkpointPopupHtml(route: PlannedRoute, cp: Checkpoint): string {
  const risk = RISK[cp.risk]
  const drivers = cp.drivers.length
    ? `<ul style="margin:6px 0 0;padding-left:16px;font-size:12px">${cp.drivers.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}</ul>`
    : ''
  return `
    <div style="font-family:inherit;color:#111827;min-width:190px">
      <div style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:700;background:${risk.color};color:${risk.onColor}">
        ${escapeHtml(risk.label)}
      </div>
      <div style="margin-top:6px;font-weight:600">${escapeHtml(route.label)} · ${escapeHtml(formatMiles(cp.mile))}</div>
      <div style="font-size:13px;color:#4b5563">${escapeHtml(formatEta(cp.eta_utc, cp.tz))}</div>
      <div style="margin-top:6px;font-size:13px">Wind ${cp.wind_mph} mph · Rain ${cp.rain_in_hr} in/hr · Snow ${cp.snow_in_hr} in/hr</div>
      ${drivers}
    </div>`
}
