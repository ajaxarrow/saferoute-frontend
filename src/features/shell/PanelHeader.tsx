import { Moon, Sun, Truck } from 'lucide-react'
import type { Theme } from '@/features/map/mapStyle'

interface PanelHeaderProps {
  theme: Theme
  onToggleTheme: () => void
}

export function PanelHeader({ theme, onToggleTheme }: PanelHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Truck className="size-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-lg leading-tight font-bold">SafeRoute</h1>
          <p className="text-sm text-muted-foreground">Weather-aware truck routing</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="flex size-11 items-center justify-center rounded-xl border text-muted-foreground hover:bg-muted"
      >
        {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </button>
    </header>
  )
}
