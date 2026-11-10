import { Moon, Sun } from 'lucide-react'
import type { Theme } from '@/features/map/mapStyle'

interface PanelHeaderProps {
  theme: Theme
  onToggleTheme: () => void
  /** Hide the tagline once there is real content to show. */
  compact?: boolean
}

/** The mark is a station: a ring on a line. */
function Mark() {
  return (
    <span aria-hidden className="relative flex h-10 w-12 items-center">
      <span className="absolute inset-x-0 h-2 rounded-full bg-foreground" />
      <span className="relative mx-auto size-8 rounded-full border-[5px] border-foreground bg-card" />
    </span>
  )
}

export function PanelHeader({ theme, onToggleTheme, compact }: PanelHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Mark />
        <div>
          <h1 className="text-2xl leading-none font-extrabold">SafeRoute</h1>
          {!compact && <p className="mt-1 text-base text-muted-foreground">Weather-aware truck routing</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={onToggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="flex size-12 items-center justify-center rounded-md border-2 border-foreground/70 hover:bg-muted"
      >
        {theme === 'dark' ? <Sun className="size-6" /> : <Moon className="size-6" />}
      </button>
    </header>
  )
}
