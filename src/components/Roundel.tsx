import { cn } from '@/lib/utils'

interface RoundelProps {
  /** The route number shown inside, like a line bullet on a transit sign. */
  n: string
  size?: 'sm' | 'md' | 'lg'
  /** Light roundel for use on the dark (ink) plate. */
  inverse?: boolean
  /** Quiet version for rows that are not selected, so navy marks only what matters. */
  muted?: boolean
  className?: string
}

const SIZE = { sm: 'size-8 text-base', md: 'size-11 text-xl', lg: 'size-14 text-3xl' }

/** A numbered circle: the route's bullet. Decorative; the route name is always in the text next to it. */
export function Roundel({ n, size = 'md', inverse, muted, className }: RoundelProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold tabular',
        inverse ? 'bg-primary-foreground text-primary' : muted ? 'bg-muted text-foreground ring-1 ring-border' : 'bg-primary text-primary-foreground',
        SIZE[size],
        className,
      )}
    >
      {n}
    </span>
  )
}
