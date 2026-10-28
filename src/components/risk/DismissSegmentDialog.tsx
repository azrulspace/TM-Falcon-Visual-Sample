import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { formatId } from '@/lib/utils';
import type { RiskSegment } from '@/types/risk';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export const DISMISS_REASONS = [
  'Inspection completed recently',
  'False positive / sensor artifact',
  'Vegetation cleared / hazard removed',
  'Span scheduled for planned replacement',
  'Duplicate / covered by adjacent work order',
  'Risk level acceptable under review',
];

export interface DismissSegmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment: RiskSegment | null;
  onConfirm: (segment: RiskSegment, reason: string, note?: string) => void;
}

export const DismissSegmentDialog: React.FC<DismissSegmentDialogProps> = ({
  open,
  onOpenChange,
  segment,
  onConfirm,
}) => {
  const [reason, setReason] = useState<string>(DISMISS_REASONS[0]);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!segment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onConfirm(segment, reason, note.trim() || undefined);
      setIsSubmitting(false);
      onOpenChange(false);
      setNote('');
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-popover border-border p-5 text-foreground z-50">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm">
            <AlertCircle className="size-4 shrink-0" />
            <span>Dismiss segment from inspection queue</span>
          </div>
          <DialogTitle className="text-base font-bold text-foreground">
            Dismiss {formatId(segment.id)}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            This segment ({formatId(segment.from)} to {formatId(segment.to)}) will be moved out of the active
            inspection queue. You can view it anytime under the "Dismissed" status filter.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
          {/* Reason Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Dismiss Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-9 px-2.5 text-xs rounded-lg border border-border bg-card text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
              required
            >
              {DISMISS_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Additional Notes</span>
              <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Work order WO-4402 was verified on-site by field team..."
              rows={3}
              className="w-full p-2.5 text-xs rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <DialogFooter className="pt-2 border-t border-border gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={!reason || isSubmitting}
              className="h-9 px-4 text-xs font-semibold"
            >
              {isSubmitting ? 'Dismissing...' : 'Confirm Dismissal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
