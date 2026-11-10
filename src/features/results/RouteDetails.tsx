import { CircleHelp } from 'lucide-react'
import { useState } from 'react'
import type { PlannedRoute } from '@/api/types'
import { Tabs } from '@/components/Tabs'
import { CheckpointTimeline } from './CheckpointTimeline'
import { HazardList } from './HazardList'
import { RiskBreakdown } from './RiskBreakdown'
import { ScoringDialog } from './ScoringDialog'

type TabId = 'overview' | 'stops'
const TABS = [
  { id: 'overview' as const, label: 'Overview' },
  { id: 'stops' as const, label: 'Stops' },
]

interface RouteDetailsProps {
  route: PlannedRoute
  loadLb?: number
  onSelectCheckpoint: (routeId: string, index: number) => void
}

/** Everything about the selected route; the first tab answers "where will it be rough?". Scoring rules open in a modal. */
export function RouteDetails({ route, loadLb, onSelectCheckpoint }: RouteDetailsProps) {
  const [tab, setTab] = useState<TabId>('overview')
  const [scoringOpen, setScoringOpen] = useState(false)
  return (
    <div className="space-y-4">
      <Tabs label={`Details for ${route.label}`} tabs={TABS} value={tab} onChange={setTab}>
        {tab === 'overview' && (
          <div className="space-y-7">
            <HazardList route={route} onSelectStretch={onSelectCheckpoint} />
            <RiskBreakdown route={route} />
          </div>
        )}
        {tab === 'stops' && <CheckpointTimeline key={route.id} route={route} onSelectCheckpoint={onSelectCheckpoint} />}
      </Tabs>
      <button
        type="button"
        onClick={() => setScoringOpen(true)}
        className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <CircleHelp className="size-4" aria-hidden /> How is this scored?
      </button>
      <ScoringDialog open={scoringOpen} onOpenChange={setScoringOpen} loadLb={loadLb} />
    </div>
  )
}
