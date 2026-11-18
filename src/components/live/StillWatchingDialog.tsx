import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

interface StillWatchingDialogProps {
  open: boolean;
  remainingSeconds: number;
  onConfirm: () => void;
}

export const StillWatchingDialog: React.FC<StillWatchingDialogProps> = ({
  open,
  remainingSeconds,
  onConfirm,
}) => {
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-md bg-card text-card-foreground border-border" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <Clock className="size-5" />
            <span className="text-xs font-semibold tracking-wide uppercase">Bandwidth & Session Guard</span>
          </div>
          <DialogTitle className="text-lg font-bold">Still watching?</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            To preserve cellular mobile data and edge bandwidth, streaming automatically stops after 10 minutes of inactivity.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 px-4 bg-muted/40 rounded-lg border border-border flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Disconnecting in</span>
          <span className="font-mono font-bold text-base text-foreground">{remainingSeconds}s</span>
        </div>

        <DialogFooter className="mt-2">
          <Button onClick={onConfirm} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
            Continue watching
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
