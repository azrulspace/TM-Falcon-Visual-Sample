import React, { useState } from 'react';
import { XCircle, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEvents } from '@/contexts/EventsContext';
import { useToast } from '@/contexts/ToastContext';
import type { FalconEvent } from '@/data/events';

export interface DismissEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: FalconEvent | null;
  bulkIds?: string[];
}

export const DismissEventDialog: React.FC<DismissEventDialogProps> = ({
  open,
  onOpenChange,
  event,
  bulkIds,
}) => {
  const { dismissEvent, bulkDismiss } = useEvents();
  const { addToast } = useToast();

  const [reason, setReason] = useState('Camera glare / lighting artifact');
  const [customNote, setCustomNote] = useState('');

  const isBulk = bulkIds && bulkIds.length > 0;
  const targetCount = isBulk ? bulkIds.length : event ? 1 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason === 'Other' ? (customNote || 'Unspecified false positive') : reason;

    if (isBulk && bulkIds) {
      bulkDismiss(bulkIds, finalReason);
      addToast('info', `Dismissed ${bulkIds.length} events as false positive: ${finalReason}`);
    } else if (event) {
      dismissEvent(event.id, finalReason);
      addToast('info', `Event ${event.id} marked as false positive: ${finalReason}`);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] bg-card text-card-foreground border-border">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="gap-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                <XCircle className="size-4" />
              </div>
              <DialogTitle className="text-base font-semibold">
                Dismiss {isBulk ? `${targetCount} Events` : `Event ${event?.id}`}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Provide justification for marking {isBulk ? 'these events' : 'this detection'} as a false positive or benign observation.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4 text-xs">
            {/* Caution Callout */}
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-[11px] text-amber-700 dark:text-amber-300">
              <AlertTriangle className="size-4 shrink-0 text-amber-500 mt-0.5" />
              <span>
                Dismissed events are archived and excluded from SLA breach escalations, but remain in the audit trail.
              </span>
            </div>

            {/* Reason Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-foreground">False Positive Reason (Required)</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-9 px-2.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="Camera glare / lighting artifact">Camera glare / lighting artifact</option>
                <option value="Vegetation sway / non-encroaching foliage">Vegetation sway / non-encroaching foliage</option>
                <option value="Authorized maintenance crew activity">Authorized maintenance crew activity</option>
                <option value="Wildlife non-threatening / transit only">Wildlife non-threatening / transit only</option>
                <option value="Hardware calibration / test pattern">Hardware calibration / test pattern</option>
                <option value="Other">Other reason (specify below)</option>
              </select>
            </div>

            {/* Custom Notes */}
            {reason === 'Other' && (
              <div className="flex flex-col gap-1.5">
                <label className="font-medium text-foreground">Specific Details</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Provide explicit reason..."
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="p-2.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              className="text-xs"
            >
              Confirm Dismissal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
