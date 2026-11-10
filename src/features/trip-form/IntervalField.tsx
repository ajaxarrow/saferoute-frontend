import { Segmented } from '@/components/Segmented'
import type { IntervalMiles } from '@/api/types'

const OPTIONS = [
  { value: 10 as IntervalMiles, label: '10 mi' },
  { value: 25 as IntervalMiles, label: '25 mi' },
  { value: 50 as IntervalMiles, label: '50 mi' },
]

interface IntervalFieldProps {
  value: IntervalMiles
  onChange: (miles: IntervalMiles) => void
}

export function IntervalField({ value, onChange }: IntervalFieldProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Check the weather every</p>
      <Segmented options={OPTIONS} value={value} onChange={onChange} label="Weather check distance" />
      <p className="text-sm text-muted-foreground">Smaller = more detail, a little slower.</p>
    </div>
  )
}
