import { Weight } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Segmented } from '@/components/Segmented'

export const MAX_LOAD_LB = 80_000
const PRESETS = [
  { value: 0, label: 'Empty' },
  { value: 20_000, label: '20k lb' },
  { value: 40_000, label: '40k lb' },
  { value: 80_000, label: '80k lb' },
]

/** The load rules that apply at this weight, in plain words. */
export function loadRuleLines(loadLb: number | null): string[] {
  if (loadLb == null) return []
  const lines: string[] = []
  if (loadLb > 30_000) lines.push('Over 30,000 lb: winds 45+ mph are No Travel.')
  if (loadLb > 40_000) lines.push('Over 40,000 lb: winds 35+ mph count as Severe.')
  if (lines.length === 0) lines.push('Light load: only 55+ mph winds are No Travel.')
  return lines
}

interface LoadFieldProps {
  value: number | null
  onChange: (lb: number | null) => void
}

export function LoadField({ value, onChange }: LoadFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="load-weight" className="text-lg font-bold">
        Load weight
      </Label>
      <div className="relative">
        <Weight className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="load-weight"
          inputMode="numeric"
          autoComplete="off"
          value={value == null ? '' : value.toLocaleString('en-US')}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '')
            onChange(digits === '' ? null : Math.min(parseInt(digits, 10), MAX_LOAD_LB))
          }}
          className="h-14 w-full rounded-md border-2 border-input bg-card pr-12 pl-11 text-xl font-bold tabular outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-base text-muted-foreground">lb</span>
      </div>
      <Segmented options={PRESETS} value={value} onChange={onChange} label="Common weights" />
      <ul className="space-y-0.5 text-base text-muted-foreground">
        {loadRuleLines(value).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  )
}
