import { cn } from '@/lib/utils'
import { RISK, type RiskLevel } from '@/lib/risk'

interface RiskBadgeProps {
  level: RiskLevel
  size?: 'sm' | 'md'
  className?: string
}

/** A small enamel plate: risk ink + icon + label, so risk never depends on colour alone. */
export function RiskBadge({ level, size = 'md', className }: RiskBadgeProps) {
  const { label, color, onColor, icon: Icon } = RISK[level]
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-md font-bold whitespace-nowrap', size === 'sm' ? 'px-1.5 py-0.5 text-sm' : 'px-2.5 py-1 text-base', className)}
      style={{ backgroundColor: color, color: onColor }}
    >
      <Icon className={size === 'sm' ? 'size-4' : 'size-5'} aria-hidden />
      {label}
    </span>
  )
}
