import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { usePlanner, useLayoutKind } from '@/features/planner/usePlanner'
import { DesktopLayout } from '@/features/shell/layouts/DesktopLayout'
import { MobileLayout } from '@/features/shell/layouts/MobileLayout'
import { TabletLayout } from '@/features/shell/layouts/TabletLayout'

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } })

/** One set of state and hooks; the layout is the only thing that changes with the screen. */
function Planner() {
  const layout = useLayoutKind()
  const p = usePlanner(layout)
  if (layout === 'desktop') return <DesktopLayout p={p} />
  if (layout === 'tablet') return <TabletLayout p={p} />
  return <MobileLayout p={p} />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Planner />
      <Toaster position="top-center" />
    </QueryClientProvider>
  )
}
