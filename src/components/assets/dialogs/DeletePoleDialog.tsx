import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Trash2,
  Cpu,
  Layers,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAssets } from '@/contexts/AssetsContext';
import { useToast } from '@/contexts/ToastContext';
import type { PoleWithRelations } from '@/types/assets';

export interface DeletePoleDialogProps {
  pole: PoleWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewLinkedDevices?: () => void;
  onViewCableSpans?: () => void;
  onDeleted?: () => void;
}

/**
 * Impact-checked, reason-required soft-delete confirmation dialog for a Pole.
 * Blocks confirmation when linked devices or connected cable spans exist,
 * states soft-delete / restore availability truthfully, and requires an audit reason.
 */
export const DeletePoleDialog: React.FC<DeletePoleDialogProps> = ({
  pole,
  open,
  onOpenChange,
  onViewLinkedDevices,
  onViewCableSpans,
  onDeleted,
}) => {
  const { permissions, capabilities, deletePole } = useAssets();
  const { addToast } = useToast();
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasonRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setErrorMsg(undefined);
      setTimeout(() => reasonRef.current?.focus(), 60);
    }
  }, [open, pole?.identifier]);

  if (!pole) return null;

  const hasDeviceOrSpanLinks =
    pole.linkedDevicesCount > 0 || pole.cableSpansCount > 0;
  const reasonValid = reason.trim().length > 0;

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.canDelete) {
      setErrorMsg(permissions.deleteDisabledReason || 'Permission required.');
      return;
    }
    if (hasDeviceOrSpanLinks) {
      setErrorMsg('Remove linked devices and cable spans before deleting this pole.');
      return;
    }
    if (!reasonValid) {
      setErrorMsg('A deletion reason is required.');
      return;
    }

    setErrorMsg(undefined);
    setIsSubmitting(true);
    try {
      const res = await deletePole(pole.identifier, reason.trim());
      if (!res.ok) {
        setErrorMsg(res.error || 'Unable to delete pole.');
        return;
      }
      addToast(
        'info',
        `Pole ${pole.identifier} moved to Deleted records.`,
        'Pole deleted'
      );
      onOpenChange(false);
      onDeleted?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-5 bg-card border border-border">
        <DialogHeader className="pb-3 border-b border-border mb-4">
          <div className="flex items-center gap-2 text-destructive">
            <Trash2 className="size-4 shrink-0" />
            <DialogTitle className="text-base font-semibold text-foreground">
              Delete pole <span className="font-mono">{pole.identifier}</span>
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Review downstream asset impact and enter a reason before soft-deleting this pole.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConfirmDelete} className="space-y-4 text-xs">
          {errorMsg && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive flex items-center gap-2"
            >
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Impact Summary Counts */}
          <div className="rounded-lg border border-border bg-muted p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Impact check</span>
              <span className="text-[11px] text-muted-foreground">
                {capabilities.serverImpactCheck
                  ? 'Verified by backend'
                  : 'Checked from loaded registry'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md bg-background border border-border p-2">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Cpu className="size-3" />
                  <span>Devices</span>
                </div>
                <div className="font-mono text-sm font-bold text-foreground mt-0.5">
                  {pole.linkedDevicesCount}
                </div>
              </div>
              <div className="rounded-md bg-background border border-border p-2">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Layers className="size-3" />
                  <span>Spans</span>
                </div>
                <div className="font-mono text-sm font-bold text-foreground mt-0.5">
                  {pole.cableSpansCount}
                </div>
              </div>
              <div className="rounded-md bg-background border border-border p-2">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <AlertTriangle className="size-3" />
                  <span>Events</span>
                </div>
                <div className="font-mono text-sm font-bold text-foreground mt-0.5">
                  {pole.allEventsCount}
                </div>
              </div>
            </div>
          </div>

          {/* Blocking Dependency Warning when devices or spans attached */}
          {hasDeviceOrSpanLinks && (
            <div
              role="alert"
              className="rounded-lg border border-status-warning-border bg-status-warning-tint p-3.5 space-y-2"
            >
              <div className="flex items-start gap-2 font-semibold text-status-warning">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <span>
                  Cannot delete while {pole.linkedDevicesCount > 0 ? `${pole.linkedDevicesCount} linked device(s)` : ''}
                  {pole.linkedDevicesCount > 0 && pole.cableSpansCount > 0 ? ' and ' : ''}
                  {pole.cableSpansCount > 0 ? `${pole.cableSpansCount} cable span(s)` : ''} remain attached.
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Detach all mounted hardware and disconnect spans before removing this pole.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {pole.linkedDevicesCount > 0 && onViewLinkedDevices && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onOpenChange(false);
                      onViewLinkedDevices();
                    }}
                    className="h-7 px-2.5 text-[11px] gap-1 cursor-pointer"
                  >
                    <span>Inspect linked devices</span>
                    <ExternalLink className="size-3" />
                  </Button>
                )}
                {pole.cableSpansCount > 0 && onViewCableSpans && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onOpenChange(false);
                      onViewCableSpans();
                    }}
                    className="h-7 px-2.5 text-[11px] gap-1 cursor-pointer"
                  >
                    <span>Inspect cable spans</span>
                    <ExternalLink className="size-3" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Required Deletion Reason */}
          <div>
            <label htmlFor="delete-pole-reason" className="block font-semibold text-foreground mb-1">
              Deletion reason <span className="text-destructive">*</span>
            </label>
            <textarea
              ref={reasonRef}
              id="delete-pole-reason"
              rows={3}
              disabled={hasDeviceOrSpanLinks || !permissions.canDelete}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setErrorMsg(undefined);
              }}
              placeholder="e.g. Duplicate test record or physical pole decommissioned"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/40 disabled:opacity-50 resize-none"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              {capabilities.restore
                ? 'Moves pole to the Deleted view (Preview restore enabled).'
                : 'Moves pole to the Deleted view. Restore is not available yet in the staging API.'}
            </p>
          </div>

          <div className="pt-3.5 border-t border-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-9 px-3.5 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={
                isSubmitting ||
                !permissions.canDelete ||
                hasDeviceOrSpanLinks ||
                !reasonValid
              }
              className="h-9 px-4 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              <span>{isSubmitting ? 'Deleting...' : 'Delete pole'}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
