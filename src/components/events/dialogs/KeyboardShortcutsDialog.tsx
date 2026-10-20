import React from 'react';
import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHORTCUTS = [
  { key: '?', description: 'Show keyboard shortcuts guide' },
  { key: '/', description: 'Focus search input from anywhere' },
  { key: 'J / ↓', description: 'Navigate to next event in list' },
  { key: 'K / ↑', description: 'Navigate to previous event in list' },
  { key: 'Enter', description: 'Open full Event detail dossier' },
  { key: 'Esc', description: 'Close Peek panel or open dialogs' },
  { key: 'E', description: 'Quick-acknowledge active event' },
  { key: 'C', description: 'Open Create Case dialog for active event' },
  { key: 'X', description: 'Toggle row selection for bulk actions' },
  { key: '1 / 2 / 3', description: 'Switch between Table, Grouped, and Gallery views' },
];

export const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] bg-card text-card-foreground border-border">
        <DialogHeader className="gap-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Keyboard className="size-4" />
            </div>
            <DialogTitle className="text-base font-semibold">Triage Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Accelerate event triage using standard enterprise control hotkeys.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col divide-y divide-border py-2 text-xs">
          {SHORTCUTS.map((sc) => (
            <div key={sc.key} className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">{sc.description}</span>
              <kbd className="px-2 py-0.5 rounded bg-muted border border-border font-mono text-[11px] font-semibold text-foreground shadow-2xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs border-border"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
