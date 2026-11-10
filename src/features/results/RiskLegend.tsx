import { RISK, RISK_ORDER } from '@/lib/risk'
import { cn } from '@/lib/utils'

/** Compact key to the five risk levels: a coloured dot and its name, never the colour alone. */
export function RiskLegend({ className }: { className?: string }) {
  return (
    <ul aria-label="Risk levels" className={cn('flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground', className)}>
      {RISK_ORDER.map((level) => {
        const Icon = RISK[level].icon
        return (
          <li key={level} className="flex items-center gap-1">
            <span className="flex size-4 items-center justify-center rounded-full" style={{ backgroundColor: RISK[level].color, color: RISK[level].onColor }} aria-hidden>
              <Icon className="size-3" />
            </span>
            {RISK[level].label}
          </li>
        )
      })}
    </ul>
  )
}
