import { Moon, Navigation, Sun } from 'lucide-react'
import type { Theme } from '@/features/map/mapStyle'

interface PanelHeaderProps {
  theme: Theme
  onToggleTheme: () => void
  /** Hide the tagline once there is real content to show. */
  compact?: boolean
}

export function PanelHeader({ theme, onToggleTheme, compact }: PanelHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Navigation className="size-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-xl leading-tight font-medium">SafeRoute</h1>
          {!compact && <p className="text-base text-muted-foreground">Weather-aware truck routing</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={onToggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="flex size-12 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        {theme === 'dark' ? <Sun className="size-6" /> : <Moon className="size-6" />}
      </button>
    </header>
  )
}
