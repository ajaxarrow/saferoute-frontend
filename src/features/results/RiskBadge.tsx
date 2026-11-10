import { cn } from '@/lib/utils'
import { RISK, type RiskLevel } from '@/lib/risk'

interface RiskBadgeProps {
  level: RiskLevel
  size?: 'sm' | 'md'
  className?: string
}

// Calm levels are quiet (soft tint, dark text) so the eye goes to High, Severe and No Travel, which stay solid.
const QUIET: Partial<Record<RiskLevel, string>> = {
  LOW: 'text-[#166534] dark:text-[#4ade80]',
  MODERATE: 'text-[#854d0e] dark:text-[#facc15]',
}

/** Risk as a pill: icon + label always, so risk never depends on colour alone. */
export function RiskBadge({ level, size = 'md', className }: RiskBadgeProps) {
  const { label, color, onColor, icon: Icon } = RISK[level]
  const quiet = QUIET[level]
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap', size === 'sm' ? 'px-2 py-0.5 text-sm' : 'px-3 py-1 text-base', quiet, className)}
      style={quiet ? { backgroundColor: `color-mix(in srgb, ${color} 16%, var(--card))` } : { backgroundColor: color, color: onColor }}
    >
      <Icon className={size === 'sm' ? 'size-4' : 'size-5'} aria-hidden />
      {label}
    </span>
  )
}
