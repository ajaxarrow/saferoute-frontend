import { cn } from '@/lib/utils'
import { PlannerMap } from '@/features/planner/PlannerMap'
import { PlannerPanel } from '@/features/planner/PlannerPanel'
import type { PlannerState } from '@/features/planner/usePlanner'
import { PeekSummary } from '@/features/results/PeekSummary'
import { RISK, RISK_ORDER } from '@/lib/risk'
import { AppHeader } from '../AppHeader'
import { BottomSheet } from '../BottomSheet'
import { CheckpointSheet } from '../CheckpointSheet'

/** One-line risk key for the map on phones: five dots, named from first to last. */
function MobileLegend() {
  return (
    <div className="absolute top-[4.75rem] left-3 z-[5] flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm shadow-float" role="group" aria-label="Risk levels, lowest to highest">
      <span className="font-medium">{RISK.LOW.label}</span>
      <span className="flex items-center gap-1" aria-hidden>
        {RISK_ORDER.map((l) => (
          <span key={l} className="size-3 rounded-full" style={{ backgroundColor: RISK[l].color }} />
        ))}
      </span>
      <span className="font-medium">{RISK.NO_TRAVEL.label}</span>
    </div>
  )
}

/** < 768px: full-screen map and a three-position bottom sheet; checkpoint details open in their own sheet. */
export function MobileLayout({ p }: { p: PlannerState }) {
  const { plan, sheet, setSheet } = p
  const route = p.showResults ? p.activeRoute : undefined
  const peek = route ? (
    <PeekSummary route={route} isRecommended={route.id === plan?.recommended_route_id} onViewAll={() => p.setSheet('full')} />
  ) : (
    <button
      type="button"
      onClick={() => setSheet('half')}
      className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border bg-card px-4 text-left"
    >
      <span className="text-base font-semibold">Where to?</span>
      <span className="text-sm text-muted-foreground">Plan before you drive</span>
    </button>
  )

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden">
      <AppHeader theme={p.theme} onToggleTheme={p.toggleTheme} loadLb={p.request?.load_lb} />
      {/* Zoom buttons sit under the forecast bar, on the right, well clear of the sheet. */}
      <main className={cn('map-below-bar relative min-h-0 flex-1', sheet === 'full' && 'map-hide-zoom')}>
        <PlannerMap p={p} forecastClassName="inset-x-3 top-3">
          <MobileLegend />
        </PlannerMap>
      </main>
      <BottomSheet snap={sheet} onSnapChange={setSheet} peek={peek} peekHeight={route ? 208 : 132} resetScrollKey={`${p.view}-${plan?.recommended_route_id}-${p.trip.isPending}`}>
        <PlannerPanel p={p} />
      </BottomSheet>
      {p.checkpointDetail && <CheckpointSheet route={p.checkpointDetail.route} checkpoint={p.checkpointDetail.checkpoint} onClose={p.closeCheckpoint} />}
    </div>
  )
}
