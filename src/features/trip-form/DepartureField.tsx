import { CalendarClock } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Segmented } from '@/components/Segmented'
import { defaultCustomLocal, describeDeparture, type DepartureChoice } from './departure'

interface DepartureFieldProps {
  value: DepartureChoice
  onChange: (choice: DepartureChoice) => void
}

const MODES = [
  { value: 'now', label: 'Now' },
  { value: 'hour', label: 'In 1 hour' },
  { value: 'custom', label: 'Pick time' },
] as const

export function DepartureField({ value, onChange }: DepartureFieldProps) {
  const choose = (mode: DepartureChoice['mode']) =>
    onChange(mode === 'custom' ? { mode, local: defaultCustomLocal() } : ({ mode } as DepartureChoice))

  return (
    <div className="space-y-2">
      <p className="text-base font-semibold">When are you leaving?</p>
      <Segmented options={[...MODES]} value={value.mode} onChange={choose} label="Departure choices" />
      {value.mode === 'custom' && (
        <div className="space-y-1.5">
          <Label htmlFor="departure-time" className="sr-only">
            Departure time
          </Label>
          <input
            id="departure-time"
            type="datetime-local"
            value={value.local}
            onChange={(e) => onChange({ mode: 'custom', local: e.target.value })}
            className="h-14 w-full rounded-xl border border-input bg-card px-3 text-base font-semibold outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>
      )}
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <CalendarClock className="size-4" /> {describeDeparture(value)}
      </p>
    </div>
  )
}
