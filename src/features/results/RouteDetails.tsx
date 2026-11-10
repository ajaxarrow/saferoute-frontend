import { useState } from 'react'
import type { PlannedRoute } from '@/api/types'
import { Tabs } from '@/components/Tabs'
import { CheckpointTimeline } from './CheckpointTimeline'
import { HazardList } from './HazardList'
import { RiskBreakdown } from './RiskBreakdown'
import { ScoringGuide } from './ScoringGuide'

type TabId = 'overview' | 'stops' | 'scoring'
const TABS = [
  { id: 'overview' as const, label: 'Overview' },
  { id: 'stops' as const, label: 'Stops' },
  { id: 'scoring' as const, label: 'How scored' },
]

interface RouteDetailsProps {
  route: PlannedRoute
  loadLb?: number
  onSelectCheckpoint: (routeId: string, index: number) => void
}

/** Everything about the selected route, organised so the first tab answers "where will it be rough?". */
export function RouteDetails({ route, loadLb, onSelectCheckpoint }: RouteDetailsProps) {
  const [tab, setTab] = useState<TabId>('overview')
  return (
    <Tabs label={`Details for ${route.label}`} tabs={TABS} value={tab} onChange={setTab}>
      {tab === 'overview' && (
        <div className="space-y-6">
          <HazardList route={route} onSelectStretch={onSelectCheckpoint} />
          <RiskBreakdown route={route} />
        </div>
      )}
      {tab === 'stops' && <CheckpointTimeline key={route.id} route={route} onSelectCheckpoint={onSelectCheckpoint} />}
      {tab === 'scoring' && <ScoringGuide loadLb={loadLb} />}
    </Tabs>
  )
}
