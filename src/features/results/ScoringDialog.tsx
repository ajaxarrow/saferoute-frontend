import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScoringGuide } from './ScoringGuide'

interface ScoringDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loadLb?: number
}

/** The scoring rules are general, so they live in a modal (X, backdrop and Esc all close it) rather than in a tab. */
export function ScoringDialog({ open, onOpenChange, loadLb }: ScoringDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">How scoring works</DialogTitle>
          <DialogDescription>Plain-language rules behind each risk level.</DialogDescription>
        </DialogHeader>
        <ScoringGuide loadLb={loadLb} />
      </DialogContent>
    </Dialog>
  )
}
