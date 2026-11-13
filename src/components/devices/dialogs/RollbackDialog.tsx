import React, { useState } from 'react';
import {
  RotateCcw,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDevices } from '@/contexts/DevicesContext';
import { useToast } from '@/contexts/ToastContext';
import type { DeviceRecord, DeviceConfigVersion } from '@/types/devices';

export interface RollbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  device: DeviceRecord | null;
  targetVersion: DeviceConfigVersion | null;
}

export const RollbackDialog: React.FC<RollbackDialogProps> = ({
  isOpen,
  onClose,
  device,
  targetVersion,
}) => {
  const { updateSettings } = useDevices();
  const { addToast } = useToast();

  const [reason, setReason] = useState(
    targetVersion ? `Rollback to ${targetVersion.versionLabel}` : 'Rollback to earlier configuration'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !device || !targetVersion) return null;

  const currentSettings = device.currentSettings || {};
  const targetSettings = targetVersion.settings || {};

  // Compare diff
  const allKeys = Array.from(
    new Set([...Object.keys(currentSettings), ...Object.keys(targetSettings)])
  );
  const diffKeys = allKeys.filter((k) => currentSettings[k] !== targetSettings[k]);

  const handleConfirmRollback = async () => {
    if (!reason.trim()) {
      addToast('error', 'Please provide a rollback reason.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await updateSettings(device.identifier, targetSettings, reason.trim());
      if (res.ok) {
        addToast(
          'success',
          `Rolled back to ${targetVersion.versionLabel}. Created new version ${res.versionLabel}.`
        );
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rollback-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <RotateCcw className="size-4" />
            </div>
            <div>
              <h2 id="rollback-title" className="text-base font-bold text-foreground">
                Roll back configuration
              </h2>
              <p className="text-xs text-muted-foreground">
                Revert to settings from version <strong className="font-mono text-foreground">{targetVersion.versionLabel}</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
            <span className="font-semibold text-foreground block">
              Notice: Rollback creates a new version
            </span>
            <p className="text-muted-foreground leading-relaxed">
              Rolling back will not delete any history. It sends the values from {targetVersion.versionLabel} to Edge and creates a new configuration snapshot with your audit note.
            </p>
          </div>

          {/* Diff comparison table */}
          <div>
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
              Modified Settings ({diffKeys.length})
            </span>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-left">
                <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground">
                  <tr>
                    <th className="py-2 px-3">Setting</th>
                    <th className="py-2 px-3">Current</th>
                    <th className="py-2 px-3">Target ({targetVersion.versionLabel})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                  {diffKeys.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-muted-foreground font-sans">
                        Target version settings are identical to current values.
                      </td>
                    </tr>
                  ) : (
                    diffKeys.map((k) => (
                      <tr key={k}>
                        <td className="py-2 px-3 font-sans text-foreground">
                          {k}
                        </td>
                        <td className="py-2 px-3 text-rose-500 line-through">
                          {String(currentSettings[k]) || '—'}
                        </td>
                        <td className="py-2 px-3 text-emerald-500 font-bold">
                          {String(targetSettings[k]) || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reason input */}
          <div className="space-y-1.5 pt-1">
            <label htmlFor="rollback-reason-input" className="font-semibold text-foreground flex items-center justify-between">
              <span>Rollback reason</span>
              <span className="text-[10px] text-muted-foreground">Required</span>
            </label>
            <input
              id="rollback-reason-input"
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Reverting experimental volume threshold"
              className="w-full h-8.5 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8.5 px-3 text-xs cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={isSubmitting || !reason.trim()}
            onClick={handleConfirmRollback}
            className="h-8.5 px-4 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-sm"
          >
            {isSubmitting ? 'Rolling back...' : `Roll back to ${targetVersion.versionLabel}`}
          </Button>
        </div>
      </div>
    </div>
  );
};
