import { Eye, EyeOff, Pause, Play } from 'lucide-react'
import { useEffect } from 'react'
import { Slider } from '@/components/ui/slider'
import { formatEta } from '@/lib/format'
import { RISK, RISK_ORDER } from '@/lib/risk'

const STEP_MS = 400

interface HeatmapControlProps {
  hour: number
  maxHour: number
  onHourChange: (hour: number) => void
  /** ISO instant of departure and the time zone to show it in. */
  departureIso: string
  tz: string
  visible: boolean
  onVisibleChange: (visible: boolean) => void
  playing: boolean
  onPlayingChange: (playing: boolean) => void
}

export function HeatmapControl({
  hour, maxHour, onHourChange, departureIso, tz, visible, onVisibleChange, playing, onPlayingChange,
}: HeatmapControlProps) {
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => onHourChange(hour >= maxHour ? 0 : hour + 1), STEP_MS)
    return () => clearInterval(id)
  }, [playing, hour, maxHour, onHourChange])

  const at = new Date(new Date(departureIso).getTime() + hour * 3_600_000).toISOString()

  return (
    <section aria-label="Weather forecast along the route" className="w-full space-y-2.5 rounded-2xl border bg-card/95 p-3.5 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Weather risk</p>
          <p className="truncate text-base font-bold" aria-live="polite">
            {hour === 0 ? 'At departure' : `+${hour} h`} · {formatEta(at, tz)}
          </p>
        </div>
        <button
          type="button"
          aria-pressed={visible}
          aria-label={visible ? 'Hide weather heatmap' : 'Show weather heatmap'}
          onClick={() => onVisibleChange(!visible)}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border text-muted-foreground hover:bg-muted"
        >
          {visible ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={playing ? 'Pause forecast animation' : 'Play forecast animation'}
          onClick={() => onPlayingChange(!playing)}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
        </button>
        <Slider
          aria-label="Forecast hour"
          min={0}
          max={maxHour}
          step={1}
          value={[hour]}
          onValueChange={(v) => onHourChange(Array.isArray(v) ? v[0] : v)}
          className="px-1"
        />
      </div>

      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" aria-label="Legend">
        {RISK_ORDER.map((level) => (
          <li key={level} className="flex items-center gap-1">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: RISK[level].color }} aria-hidden />
            {RISK[level].label}
          </li>
        ))}
      </ul>
    </section>
  )
}
