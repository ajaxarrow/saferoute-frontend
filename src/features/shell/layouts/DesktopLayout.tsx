import { PlannerMap } from '@/features/planner/PlannerMap'
import { PlannerPanel } from '@/features/planner/PlannerPanel'
import type { PlannerState } from '@/features/planner/usePlanner'
import { RouteComparisonBar } from '@/features/results/RouteComparisonBar'
import { AppHeader } from '../AppHeader'

/** >= 1024px: fixed left sidebar (320px, 360px from 1440), map fills the rest, comparison panel along its bottom. */
export function DesktopLayout({ p }: { p: PlannerState }) {
  const { plan, mapPlan } = p
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden">
      <AppHeader theme={p.theme} onToggleTheme={p.toggleTheme} loadLb={p.request?.load_lb} />
      <div className="flex min-h-0 flex-1">
        <aside aria-label="Trip planner" className="w-[320px] shrink-0 overflow-y-auto border-r bg-card p-5 min-[1440px]:w-[360px] min-[1440px]:p-6">
          <PlannerPanel p={p} showRouteList={false} />
        </aside>
        <main className="relative min-w-0 flex-1">
          <PlannerMap p={p} forecastClassName="top-3 left-1/2 w-[min(460px,calc(100%-7rem))] -translate-x-1/2" />
          {p.showResults && plan && mapPlan && (
            <div className="absolute inset-x-4 bottom-7 z-10 rounded-2xl border bg-card p-3 shadow-float min-[1440px]:p-4">
              <RouteComparisonBar
                variant="panel"
                routes={plan.routes}
                recommendedId={plan.recommended_route_id}
                selectedId={p.activeRouteId ?? plan.recommended_route_id}
                onSelect={p.selectRoute}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
