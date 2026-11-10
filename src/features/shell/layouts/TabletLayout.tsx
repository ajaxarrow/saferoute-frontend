import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useEffect } from 'react'
import { PlannerMap } from '@/features/planner/PlannerMap'
import { PanelShell } from '@/features/planner/PanelShell'
import { PlannerPanel } from '@/features/planner/PlannerPanel'
import type { PlannerState } from '@/features/planner/usePlanner'
import { RouteComparisonBar } from '@/features/results/RouteComparisonBar'
import { cn } from '@/lib/utils'
import { AppHeader } from '../AppHeader'

/** 768-1023px: the map is primary; planning and results live in a 340px drawer that opens and closes without disturbing the map. */
export function TabletLayout({ p }: { p: PlannerState }) {
  const { plan, mapPlan, drawerOpen, setDrawerOpen } = p

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !(e.target instanceof HTMLElement && e.target.closest('[cmdk-root]'))) setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen, setDrawerOpen])

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden">
      <AppHeader theme={p.theme} onToggleTheme={p.toggleTheme} loadLb={p.request?.load_lb} />
      <main className="relative min-h-0 flex-1 overflow-hidden">
        <PlannerMap p={p} forecastClassName={cn('top-3 right-16', drawerOpen ? 'left-[356px]' : 'left-[7.75rem]')} />

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open trip panel"
          aria-expanded={drawerOpen}
          aria-controls="trip-drawer"
          className={cn(
            'absolute top-3 left-3 z-10 flex h-11 items-center gap-2 rounded-xl border bg-card px-3 text-sm font-semibold shadow-float transition-opacity duration-150',
            drawerOpen && 'pointer-events-none opacity-0',
          )}
          tabIndex={drawerOpen ? -1 : 0}
        >
          <PanelLeftOpen className="size-5" aria-hidden /> {p.showResults ? 'Results' : 'Plan'}
        </button>

        {p.showResults && plan && mapPlan && (
          <div className={cn('absolute right-3 bottom-7 z-10 rounded-2xl border bg-card p-3 shadow-float transition-[left] duration-200 motion-reduce:transition-none', drawerOpen ? 'left-[356px]' : 'left-3')}>
            <RouteComparisonBar
              variant="carousel"
              routes={plan.routes}
              recommendedId={plan.recommended_route_id}
              selectedId={p.activeRouteId ?? plan.recommended_route_id}
              onSelect={p.selectRoute}
            />
          </div>
        )}

        <aside
          id="trip-drawer"
          aria-label="Trip planner"
          inert={!drawerOpen}
          className={cn(
            'absolute inset-y-0 left-0 z-20 flex w-[340px] flex-col border-r bg-card shadow-float transition-transform duration-200 ease-out motion-reduce:transition-none',
            drawerOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex h-12 shrink-0 items-center justify-between border-b pr-2 pl-4">
            <h2 className="text-base font-semibold">{p.showResults ? 'Your trip' : 'Trip panel'}</h2>
            <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close trip panel" className="flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted">
              <PanelLeftClose className="size-5" aria-hidden />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <PanelShell className="p-5" resetKey={p.view}>
              <PlannerPanel p={p} showRouteList={false} />
            </PanelShell>
          </div>
        </aside>
      </main>
    </div>
  )
}
