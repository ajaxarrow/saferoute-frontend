import { CircleHelp, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import type { Theme } from '@/features/map/mapStyle'
import { ScoringDialog } from '@/features/results/ScoringDialog'
import { cn } from '@/lib/utils'

/** The mark is a station: a ring on a line. */
function Mark() {
  return (
    <span aria-hidden className="relative flex h-8 w-10 items-center">
      <span className="absolute inset-x-0 h-1.5 rounded-full bg-primary" />
      <span className="relative mx-auto size-6 rounded-full border-4 border-primary bg-card" />
    </span>
  )
}

const iconButton =
  'flex size-11 items-center justify-center rounded-xl text-foreground transition-colors duration-150 hover:bg-muted'

interface AppHeaderProps {
  theme: Theme
  onToggleTheme: () => void
  loadLb?: number
  className?: string
}

/** ~56px bar: logo and name, a link to how scoring works, and the theme toggle. */
export function AppHeader({ theme, onToggleTheme, loadLb, className }: AppHeaderProps) {
  const [helpOpen, setHelpOpen] = useState(false)
  return (
    <header className={cn('z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-card px-4', className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        <Mark />
        <h1 className="text-lg leading-none font-semibold">SafeRoute</h1>
        <span className="hidden text-sm text-muted-foreground lg:inline">Weather-aware truck routing</span>
      </div>
      <nav aria-label="Application" className="flex items-center gap-1">
        <button type="button" onClick={() => setHelpOpen(true)} className={cn(iconButton, 'w-auto gap-2 px-3 text-sm font-medium whitespace-nowrap')} aria-label="How scoring works">
          <CircleHelp className="size-5" aria-hidden />
          <span className="hidden sm:inline">How scoring works</span>
        </button>
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className={iconButton}
        >
          {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
      </nav>
      <ScoringDialog open={helpOpen} onOpenChange={setHelpOpen} loadLb={loadLb} />
    </header>
  )
}
