import { cn } from '@/lib/utils'
import { RISK, type RiskLevel } from '@/lib/risk'

interface RiskBadgeProps {
  level: RiskLevel
  size?: 'sm' | 'md'
  className?: string
}

/** Colour + icon + label, so risk never depends on colour alone. */
export function RiskBadge({ level, size = 'md', className }: RiskBadgeProps) {
  const { label, color, onColor, icon: Icon } = RISK[level]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className,
      )}
      style={{ backgroundColor: color, color: onColor }}
    >
      <Icon className={size === 'sm' ? 'size-3' : 'size-4'} aria-hidden />
      {label}
    </span>
  )
}
