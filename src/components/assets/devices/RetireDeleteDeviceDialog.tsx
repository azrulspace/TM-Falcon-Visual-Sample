import React, { useState, useEffect } from 'react';
import { AlertTriangle, Archive, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAssets } from '@/contexts/AssetsContext';
import { cn } from '@/lib/utils';
import type { DeviceWithRelations } from '@/types/devices';

export interface RetireDeleteDeviceDialogProps {
  device: DeviceWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export const RetireDeleteDeviceDialog: React.FC<RetireDeleteDeviceDialogProps> = ({
  device,
  open,
  onOpenChange,
  onDeleted,
}) => {
  const { retireOrDeleteDevice, devicePermissions } = useAssets();
  const [action, setAction] = useState<'retire' | 'delete'>('retire');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAction('retire');
      setReason('');
      setErrorMsg(null);
    }
  }, [open]);

  if (!device) return null;

  const canDelete = devicePermissions.canDeleteDevice;
  const blockedDeleteByMount = action === 'delete' && device.isInstalled;
  const canConfirm =
    reason.trim().length >= 3 &&
    !submitting &&
    !blockedDeleteByMount &&
    (action === 'retire' ? devicePermissions.canEditDevice : canDelete);

  const handleConfirm = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    const res = await retireOrDeleteDevice(device.identifier, action, reason.trim());
    setSubmitting(false);
    if (!res.ok) {
      setErrorMsg(res.error || 'Action failed.');
      return;
    }
    onOpenChange(false);
    if (action === 'delete') {
      onDeleted?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Archive className="size-4 text-amber-500" />
            <span>Retire or delete · {device.identifier}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Retiring marks the lifecycle Retired while keeping historical telemetry and {device.allEventsCount} linked events.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAction('retire')}
              className={cn(
                'rounded-lg border p-3 text-left cursor-pointer transition-all space-y-1',
                action === 'retire'
                  ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                  : 'border-border hover:bg-muted/40'
              )}
            >
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Archive className="size-3.5 text-primary" />
                <span>Retire device</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Preserves events & config audit</p>
            </button>

            <button
              type="button"
              disabled={!canDelete}
              onClick={() => canDelete && setAction('delete')}
              className={cn(
                'rounded-lg border p-3 text-left transition-all space-y-1',
                !canDelete
                  ? 'opacity-50 cursor-not-allowed border-border bg-muted/20'
                  : action === 'delete'
                  ? 'border-red-500 bg-red-500/10 ring-1 ring-red-500/40 cursor-pointer'
                  : 'border-border hover:bg-muted/40 cursor-pointer'
              )}
              title={!canDelete ? devicePermissions.deleteDisabledReason : undefined}
            >
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Trash2 className="size-3.5 text-red-500" />
                <span>Delete record</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {canDelete ? 'Removes device from registry' : 'Requires delete capability'}
              </p>
            </button>
          </div>

          {blockedDeleteByMount && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-[11px] flex items-start gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
              <span>
                Device is currently mounted on pole {device.installedPoleId}. Uninstall it first before deleting.
              </span>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="retire-reason" className="font-medium text-foreground block">
              Reason *
            </label>
            <textarea
              id="retire-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this device is being retired or removed..."
              className="w-full rounded-lg border border-border bg-background p-2.5 text-xs"
            />
          </div>

          {errorMsg && <p className="text-[11px] text-red-500">{errorMsg}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            size="sm"
            variant={action === 'delete' ? 'destructive' : 'default'}
            disabled={!canConfirm}
            onClick={handleConfirm}
            className="cursor-pointer"
          >
            {submitting
              ? 'Applying...'
              : action === 'delete'
              ? 'Confirm delete'
              : 'Confirm retire'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

