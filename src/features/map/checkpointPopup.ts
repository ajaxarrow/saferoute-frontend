import type { Checkpoint, PlannedRoute } from '@/api/types'
import { formatEta, formatMiles } from '@/lib/format'
import { RISK } from '@/lib/risk'
import { describeWeather } from '@/lib/weather'

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

const QUIET: Record<string, { bg: string; fg: string }> = {
  LOW: { bg: '#dcf2e3', fg: '#166534' },
  MODERATE: { bg: '#faf0c8', fg: '#854d0e' },
}

/** HTML for the map popup shown when a checkpoint is clicked. All dynamic text is escaped. */
export function checkpointPopupHtml(route: PlannedRoute, cp: Checkpoint): string {
  const risk = RISK[cp.risk]
  const quiet = QUIET[cp.risk]
  const badge = quiet
    ? `background:${quiet.bg};color:${quiet.fg}`
    : `background:${risk.color};color:${risk.onColor}`
  const stat = (label: string, value: string) =>
    `<div style="flex:1;background:#eef2f7;border-radius:10px;padding:6px 8px"><div style="font-size:12px;color:#475569">${label}</div><div style="font-size:14px;font-weight:600;color:#0f172a;white-space:nowrap">${value}</div></div>`
  const drivers = cp.drivers.length
    ? `<ul style="margin:10px 0 0;padding:0;list-style:none;font-size:14px;color:#0f172a">${cp.drivers
        .map((d) => `<li style="margin-top:4px">${escapeHtml(d)}</li>`)
        .join('')}</ul>`
    : ''
  return `
    <div style="font-family:'Inter Variable',system-ui,sans-serif;color:#0f172a;width:250px;padding:4px 2px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <div>
          <div style="font-size:12px;color:#475569">${escapeHtml(route.label)} · checkpoint</div>
          <div style="font-size:16px;font-weight:600;font-variant-numeric:tabular-nums">${escapeHtml(formatMiles(cp.mile))} in</div>
        </div>
        <span style="${badge};border-radius:999px;padding:3px 10px;font-size:14px;font-weight:600;white-space:nowrap">${escapeHtml(risk.label)}</span>
      </div>
      <div style="margin-top:2px;font-size:14px;color:#475569">${escapeHtml(describeWeather(cp).label)} · ${escapeHtml(formatEta(cp.eta_utc, cp.tz))}</div>
      <div style="display:flex;gap:6px;margin-top:10px">
        ${stat('Wind', `${cp.wind_mph} mph`)}${stat('Rain', `${cp.rain_in_hr} in/hr`)}${stat('Snow', `${cp.snow_in_hr} in/hr`)}
      </div>
      ${drivers}
    </div>`
}
