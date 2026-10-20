import React, { useState } from 'react';
import { UserCheck, Check } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import type { FalconEvent } from '@/data/events';

export interface AssignEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: FalconEvent | null;
  bulkIds?: string[];
}

const ANALYSTS = [
  { name: 'Farah Zulkifli', role: 'Patrol Team Lead', avatar: 'FZ', status: 'Online' },
  { name: 'Haris Danial', role: 'Field Operations Specialist', avatar: 'HD', status: 'In Field' },
  { name: 'Siti Aminah', role: 'CCTV Triage Analyst', avatar: 'SA', status: 'Online' },
  { name: 'Azman Ali', role: 'Fiber Infrastructure Engineer', avatar: 'AA', status: 'Online' },
  { name: 'Nurul Huda', role: 'Physical Security Ops', avatar: 'NH', status: 'On Duty' },
];

export const AssignEventDialog: React.FC<AssignEventDialogProps> = ({
  open,
  onOpenChange,
  event,
  bulkIds,
}) => {
  const { assignEvent, bulkAssign } = useEvents();
  const { addToast } = useToast();

  const [selectedUser, setSelectedUser] = useState('Haris Danial');

  const isBulk = bulkIds && bulkIds.length > 0;
  const targetCount = isBulk ? bulkIds.length : event ? 1 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBulk && bulkIds) {
      bulkAssign(bulkIds, selectedUser);
      addToast('success', `Assigned ${bulkIds.length} events to ${selectedUser}`);
    } else if (event) {
      assignEvent(event.id, selectedUser);
      addToast('success', `Event ${event.id} assigned to ${selectedUser}`);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-card text-card-foreground border-border">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="gap-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <UserCheck className="size-4" />
              </div>
              <DialogTitle className="text-base font-semibold">
                Assign {isBulk ? `${targetCount} Events` : `Event ${event?.id}`}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Select an analyst to take ownership of triage and verification.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 py-4">
            {ANALYSTS.map((user) => {
              const isSelected = selectedUser === user.name;
              return (
                <div
                  key={user.name}
                  onClick={() => setSelectedUser(user.name)}
                  className={cn(
                    'flex items-center justify-between p-2.5 rounded-lg border border-border cursor-pointer transition-all hover:bg-muted/60',
                    isSelected && 'border-primary bg-primary/5 ring-1 ring-primary'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                      {user.avatar}
                    </div>
                    <div className="flex flex-col text-xs">
                      <span className="font-medium text-foreground">{user.name}</span>
                      <span className="text-[11px] text-muted-foreground">{user.role}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                      {user.status}
                    </span>
                    {isSelected && <Check className="size-4 text-primary" />}
                  </div>
                </div>
              );
            })}
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
              size="sm"
              className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              Assign to {selectedUser.split(' ')[0]}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
