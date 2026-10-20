import React, { useState, useEffect } from 'react';
import { Briefcase, AlertCircle } from 'lucide-react';
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

export interface CreateCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: FalconEvent | null;
}

export const CreateCaseDialog: React.FC<CreateCaseDialogProps> = ({
  open,
  onOpenChange,
  event,
}) => {
  const { createCaseForEvent } = useEvents();
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');
  const [assignee, setAssignee] = useState('Haris Danial');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(`Incident on ${event.asset}: ${event.type}`);
      setPriority(event.priority);
      setNotes(`Automated case created from event ${event.id} captured on ${event.captured}. Detection rule: ${event.detection}.`);
    }
  }, [event]);

  if (!event) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const caseId = createCaseForEvent(event.id, {
      title,
      priority,
      owner: assignee,
      notes,
    });
    addToast('success', `Case ${caseId} created and linked to ${event.id}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-card text-card-foreground border-border">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="gap-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Briefcase className="size-4" />
              </div>
              <DialogTitle className="text-base font-semibold">Create Field Case</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Bundle event <span className="font-mono font-medium text-foreground">{event.id}</span> into an operational repair case.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4 text-xs">
            {/* Case Title */}
            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-foreground">Case Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Grid: Priority & Assignee */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-medium text-foreground">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="h-9 px-2.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="Critical">Critical (P1)</option>
                  <option value="High">High (P2)</option>
                  <option value="Medium">Medium (P3)</option>
                  <option value="Low">Low (P4)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-medium text-foreground">Dispatch Assignee</label>
                <select
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="h-9 px-2.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="Haris Danial">Haris Danial (Field Lead)</option>
                  <option value="Farah Zulkifli">Farah Zulkifli (Patrol Team)</option>
                  <option value="Siti Aminah">Siti Aminah (CCTV Ops)</option>
                  <option value="Azman Ali">Azman Ali (Fiber Ops)</option>
                </select>
              </div>
            </div>

            {/* Context Summary */}
            <div className="p-2.5 rounded-lg bg-muted/50 border border-border flex items-start gap-2 text-muted-foreground text-[11px]">
              <AlertCircle className="size-4 shrink-0 text-amber-500 mt-0.5" />
              <span>
                Target Asset: <strong className="text-foreground">{event.asset}</strong> | Device:{' '}
                <strong className="text-foreground">{event.device || 'N/A'}</strong>. SLA resolution window is 4 hours for {priority} priority.
              </span>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-foreground">Field Instructions & Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="p-2.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </div>
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
            <Button type="submit" size="sm" className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
              Create and Dispatch Case
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
