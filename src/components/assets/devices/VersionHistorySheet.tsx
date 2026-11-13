import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  GitCompare,
  History,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAssets } from '@/contexts/AssetsContext';
import { getConfigSchemaForDevice } from '@/data/deviceConfigSchema';
import { formatAbsoluteMYT } from '@/lib/dateTime';
import { cn } from '@/lib/utils';
import type { DeviceConfigVersion, DeviceWithRelations } from '@/types/devices';
import type { DevicePermissions } from '@/lib/permissions';

export interface VersionHistorySheetProps {
  device: DeviceWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: DevicePermissions;
}

export const VersionHistorySheet: React.FC<VersionHistorySheetProps> = ({
  device,
  open,
  onOpenChange,
  permissions,
}) => {
  const { rollbackDeviceConfig } = useAssets();
  const [compareIds, setCompareIds] = useState<[string, string] | null>(null);
  const [rollbackTarget, setRollbackTarget] = useState<DeviceConfigVersion | null>(null);
  const [rollbackReason, setRollbackReason] = useState('');
  const [submittingRollback, setSubmittingRollback] = useState(false);

  const schema = useMemo(() => getConfigSchemaForDevice(device), [device]);

  const appliedVersions = useMemo(
    () =>
      device.configVersions.filter(
        (v) => v.status === 'Applied' || v.status === 'Partly applied'
      ),
    [device.configVersions]
  );

  const hasPreviousToReturn = appliedVersions.length >= 2;

  const compareDiff = useMemo(() => {
    if (!compareIds) return [];
    const verA = device.configVersions.find((v) => v.id === compareIds[0]);
    const verB = device.configVersions.find((v) => v.id === compareIds[1]);
    if (!verA || !verB) return [];

    const rows: { key: string; label: string; older: unknown; newer: unknown; changed: boolean }[] =
      [];
    for (const sec of schema) {
      for (const field of sec.fields) {
        const aVal = verA.values[field.key];
        const bVal = verB.values[field.key];
        const changed = String(aVal ?? '') !== String(bVal ?? '');
        rows.push({
          key: field.key,
          label: field.label,
          older: bVal,
          newer: aVal,
          changed,
        });
      }
    }
    return rows.filter((r) => r.changed);
  }, [compareIds, device.configVersions, schema]);

  const handleConfirmRollback = async () => {
    if (!rollbackTarget || !rollbackReason.trim()) return;
    setSubmittingRollback(true);
    const res = await rollbackDeviceConfig(
      device.identifier,
      rollbackTarget.id,
      rollbackReason.trim()
    );
    setSubmittingRollback(false);
    if (res.ok) {
      setRollbackTarget(null);
      setRollbackReason('');
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-xl bg-card text-card-foreground border-border px-6 py-5 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-base">
              <History className="size-4 text-primary" />
              <span>Version history · {device.identifier}</span>
            </SheetTitle>
            <SheetDescription className="text-xs">
              Each configuration push and its per-setting Edge result, newest first.
            </SheetDescription>
          </SheetHeader>

          <div className="py-4 space-y-4">
            {device.configVersions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center space-y-3">
                <p className="text-xs font-medium text-foreground">
                  No configuration versions yet.
                </p>
                <div className="space-y-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled
                    className="gap-1.5 opacity-60 cursor-not-allowed"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Roll back</span>
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    No earlier applied value to return to.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {device.configVersions.length >= 2 && (
                  <div className="rounded-lg border border-border bg-muted/25 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <GitCompare className="size-3.5 text-primary" />
                        <span>Compare versions</span>
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setCompareIds(
                            compareIds
                              ? null
                              : [device.configVersions[0].id, device.configVersions[1].id]
                          )
                        }
                        className="h-6 px-2 text-[11px] cursor-pointer"
                      >
                        {compareIds ? 'Close compare' : 'Compare latest two'}
                      </Button>
                    </div>

                    {compareIds && (
                      <div className="space-y-2 pt-1 border-t border-border/60">
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            aria-label="Newer version to compare"
                            value={compareIds[0]}
                            onChange={(e) => setCompareIds([e.target.value, compareIds[1]])}
                            className="h-7 rounded border border-border bg-card px-2 text-xs font-mono"
                          >
                            {device.configVersions.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.versionLabel} ({v.status})
                              </option>
                            ))}
                          </select>
                          <select
                            aria-label="Baseline version to compare"
                            value={compareIds[1]}
                            onChange={(e) => setCompareIds([compareIds[0], e.target.value])}
                            className="h-7 rounded border border-border bg-card px-2 text-xs font-mono"
                          >
                            {device.configVersions.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.versionLabel} ({v.status})
                              </option>
                            ))}
                          </select>
                        </div>

                        {compareDiff.length === 0 ? (
                          <div className="text-[11px] text-muted-foreground">
                            No differences between selected versions.
                          </div>
                        ) : (
                          <div className="rounded border border-border overflow-hidden">
                            <table className="w-full text-[11px] border-collapse">
                              <thead>
                                <tr className="bg-muted/40 border-b border-border text-muted-foreground">
                                  <th className="py-1.5 px-2.5 text-left">Setting</th>
                                  <th className="py-1.5 px-2.5 text-left">Baseline</th>
                                  <th className="py-1.5 px-2.5 text-left">Target</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/50">
                                {compareDiff.map((row) => (
                                  <tr key={row.key}>
                                    <td className="py-1.5 px-2.5 font-medium text-foreground">
                                      {row.label}
                                    </td>
                                    <td className="py-1.5 px-2.5 font-mono text-muted-foreground">
                                      {String(row.older ?? '—')}
                                    </td>
                                    <td className="py-1.5 px-2.5 font-mono font-semibold text-primary">
                                      {String(row.newer ?? '—')}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  {device.configVersions.map((ver, idx) => {
                    const isLatest = idx === 0;
                    const canRollbackThis =
                      !isLatest &&
                      hasPreviousToReturn &&
                      permissions.canRollbackConfig &&
                      (ver.status === 'Applied' || ver.status === 'Partly applied');

                    return (
                      <div
                        key={ver.id}
                        className="rounded-xl border border-border bg-muted/20 p-4 space-y-2.5 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-foreground">
                                {ver.versionLabel}
                              </span>
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                                  ver.status === 'Applied'
                                    ? 'bg-emerald-500/12 text-emerald-500 border-emerald-500/30'
                                    : ver.status === 'Partly applied' || ver.status === 'Failed'
                                    ? 'bg-red-500/12 text-red-500 border-red-500/30'
                                    : 'bg-amber-500/12 text-amber-500 border-amber-500/30'
                                )}
                              >
                                {ver.status}
                              </span>
                              {isLatest && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/15 text-primary font-semibold">
                                  Latest
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                              {formatAbsoluteMYT(ver.createdAt, { showSeconds: false })} ·{' '}
                              {ver.createdBy}
                            </div>
                          </div>

                          {canRollbackThis && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRollbackTarget(ver);
                                setRollbackReason('');
                              }}
                              className="h-7 px-2.5 text-[11px] gap-1 border-border hover:bg-muted cursor-pointer shrink-0"
                            >
                              <RotateCcw className="size-3 text-primary" />
                              <span>Roll back</span>
                            </Button>
                          )}
                        </div>

                        {ver.note && (
                          <p className="text-[11px] text-foreground italic">"{ver.note}"</p>
                        )}

                        <div className="space-y-1 pt-1 border-t border-border/50">
                          {ver.results.map((r) => (
                            <div
                              key={r.key}
                              className="flex items-center justify-between gap-2 text-[11px]"
                            >
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                {r.status === 'Applied' ? (
                                  <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                                ) : (
                                  <XCircle className="size-3 text-red-500 shrink-0" />
                                )}
                                <span className="text-foreground">{r.label}</span>
                              </span>
                              <span className="font-mono text-foreground">
                                {String(r.sentValue)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Roll Back Reason Dialog */}
      <Dialog
        open={Boolean(rollbackTarget)}
        onOpenChange={(o) => !o && setRollbackTarget(null)}
      >
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-base">
              Roll back to {rollbackTarget?.versionLabel}?
            </DialogTitle>
            <DialogDescription className="text-xs">
              This sends {rollbackTarget?.versionLabel}'s settings as a new Edge version so full audit history is preserved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label htmlFor="rb-reason" className="text-xs font-medium text-foreground block">
              Rollback reason *
            </label>
            <textarea
              id="rb-reason"
              rows={2}
              value={rollbackReason}
              onChange={(e) => setRollbackReason(e.target.value)}
              placeholder="Explain why you are restoring this earlier version..."
              className="w-full rounded-lg border border-border bg-background p-2.5 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRollbackTarget(null)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!rollbackReason.trim() || submittingRollback}
              onClick={handleConfirmRollback}
              className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span>{submittingRollback ? 'Rolling back...' : 'Confirm rollback'}</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

