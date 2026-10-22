import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useEvents } from '@/contexts/EventsContext';
import { useToast } from '@/contexts/ToastContext';
import { formatId } from '@/lib/utils';
import type { FalconEvent } from '@/data/events';
import type { EventDetailViewModel } from '@/types/eventDetail';

export interface ResolveEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: FalconEvent | EventDetailViewModel | null;
}

export const ResolveEventDialog: React.FC<ResolveEventDialogProps> = ({
  open,
  onOpenChange,
  event,
}) => {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();
  const { dismissEvent } = useEvents();

  if (!event) return null;

  const handleResolve = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      dismissEvent(event.id, note.trim() || 'Event marked as resolved by analyst');
      setIsSubmitting(false);
      onOpenChange(false);
      setNote('');
      addToast('success', `Event ${formatId(event.id)} resolved.`);
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border text-card-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-500" />
            <DialogTitle className="text-base font-bold">
              Resolve Event {formatId(event.id)}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Mark this telemetry detection as resolved. This will update the operational state to Resolved.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2 text-xs">
          <label className="font-medium text-foreground flex flex-col gap-1.5">
            <span>Resolution Note (optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Explain how the incident was resolved (e.g. Field inspection confirmed cable secure; no physical damage found)..."
              rows={3}
              className="w-full p-2.5 rounded-lg border border-border bg-muted/40 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground"
            />
          </label>
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
            type="button"
            size="sm"
            disabled={isSubmitting}
            onClick={handleResolve}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="size-3.5" />
            )}
            <span>{isSubmitting ? 'Resolving...' : 'Confirm Resolution'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
