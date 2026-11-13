import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAssets } from '@/contexts/AssetsContext';
import { DeviceConnectivityBadge } from './DeviceStateBadge';
import { formatAbsoluteMYT } from '@/lib/dateTime';
import { cn } from '@/lib/utils';
import type { VendorDiscoveryRecord } from '@/types/devices';

export interface ResolveConflictSheetProps {
  vendorRecord: VendorDiscoveryRecord | null;
  onOpenChange: (open: boolean) => void;
}

export const ResolveConflictSheet: React.FC<ResolveConflictSheetProps> = ({
  vendorRecord,
  onOpenChange,
}) => {
  const {
    getDeviceById,
    isDeviceIdentifierUnique,
    resolveVendorConflict,
    devicePermissions,
  } = useAssets();

  const [mode, setMode] = useState<'remap_existing_falcon' | 'register_new_falcon'>(
    'remap_existing_falcon'
  );
  const [newIdentifier, setNewIdentifier] = useState('');
  const [newName, setNewName] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (vendorRecord) {
      setMode('remap_existing_falcon');
      setNewIdentifier(`DEV-${vendorRecord.serial.slice(-4)}`);
      setNewName(vendorRecord.vendorName);
      setReason('');
      setErrorMsg(null);
    }
  }, [vendorRecord]);

  if (!vendorRecord) return null;

  const claimingTarget = vendorRecord.matchedFalconId
    ? getDeviceById(vendorRecord.matchedFalconId)
    : undefined;

  const newIdInvalid =
    mode === 'register_new_falcon' &&
    (!newIdentifier.trim() ||
      !/^[A-Za-z0-9-]+$/.test(newIdentifier.trim()) ||
      !isDeviceIdentifierUnique(newIdentifier.trim()));

  const canSubmit =
    devicePermissions.canResolveVendorConflict &&
    reason.trim().length >= 5 &&
    !newIdInvalid &&
    !submitting;

  const handleConfirm = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    const res = await resolveVendorConflict(vendorRecord.id, {
      mode,
      newIdentifier: mode === 'register_new_falcon' ? newIdentifier.trim() : undefined,
      newName: mode === 'register_new_falcon' ? newName.trim() : undefined,
      reason: reason.trim(),
    });
    setSubmitting(false);
    if (!res.ok) {
      setErrorMsg(res.error || 'Unable to resolve vendor conflict.');
      return;
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={Boolean(vendorRecord)} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl bg-card text-card-foreground border-border overflow-y-auto px-6 py-5">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-4 text-red-500" />
            <span>Resolve vendor conflict · {vendorRecord.serial}</span>
          </SheetTitle>
          <SheetDescription className="text-xs leading-relaxed">
            This vendor device claims a FALCON record already mapped to different hardware. Unresolved conflicts cause Edge events to appear under the raw serial{' '}
            <span className="font-mono font-semibold text-foreground">
              {vendorRecord.serial}
            </span>{' '}
            instead of the FALCON device.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-4">
          {/* Side-by-Side Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3.5 space-y-2 text-xs">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                Vendor hardware (Edge)
              </div>
              <div className="font-mono text-sm font-bold text-foreground">
                {vendorRecord.serial}
              </div>
              <div className="space-y-1 text-muted-foreground">
                <div>
                  Vendor name: <strong className="text-foreground">{vendorRecord.vendorName}</strong>
                </div>
                <div>
                  Model: <span className="text-foreground">{vendorRecord.model}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>Vendor state:</span>
                  <DeviceConnectivityBadge state={vendorRecord.vendorState} />
                </div>
                <div>
                  Last seen:{' '}
                  <span className="font-mono text-foreground">
                    {formatAbsoluteMYT(vendorRecord.lastSeenAt, { showSeconds: false })}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2 text-xs">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Claimed FALCON device
              </div>
              {claimingTarget ? (
                <>
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/assets/inventory/devices/${encodeURIComponent(
                        claimingTarget.identifier
                      )}`}
                      className="font-mono text-sm font-bold text-primary hover:underline"
                    >
                      {claimingTarget.identifier}
                    </Link>
                    <DeviceConnectivityBadge state={claimingTarget.connectivityState} />
                  </div>
                  <div className="space-y-1 text-muted-foreground">
                    <div>
                      Current vendor ID:{' '}
                      <span className="font-mono font-semibold text-foreground">
                        {claimingTarget.vendorDeviceId}
                      </span>
                    </div>
                    <div>
                      Installed on:{' '}
                      <span className="font-mono text-foreground">
                        {claimingTarget.installedPoleId || 'Not installed'}
                      </span>
                    </div>
                    <div>
                      Events (30d):{' '}
                      <strong className="font-mono text-foreground">
                        {claimingTarget.events30dCount}
                      </strong>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">
                  Target FALCON ID:{' '}
                  <span className="font-mono text-foreground">
                    {vendorRecord.matchedFalconId || 'Unknown'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Event Impact Callout */}
          {vendorRecord.rawSerialEventsCount !== undefined &&
            vendorRecord.rawSerialEventsCount > 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-foreground">
                <strong className="font-semibold">Event attribution impact:</strong>{' '}
                {vendorRecord.rawSerialEventsCount} recent events from{' '}
                <span className="font-mono font-semibold">{vendorRecord.serial}</span> need a
                clear mapping so operators see the FALCON identifier ({claimingTarget?.identifier || 'target'}) rather than a raw vendor serial.
              </div>
            )}

          {/* Resolution Options */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-foreground block">
              Choose how to resolve this conflict
            </label>

            <button
              type="button"
              onClick={() => setMode('remap_existing_falcon')}
              className={cn(
                'w-full text-left rounded-xl border p-3.5 transition-all cursor-pointer space-y-1',
                mode === 'remap_existing_falcon'
                  ? 'border-primary bg-primary/8 ring-1 ring-primary/40'
                  : 'border-border hover:bg-muted/40'
              )}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <ArrowRightLeft className="size-3.5 text-primary" />
                <span>
                  Remap {claimingTarget?.identifier || vendorRecord.matchedFalconId} to serial{' '}
                  <span className="font-mono">{vendorRecord.serial}</span>
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground pl-5">
                Use when hardware was physically swapped on the pole. Replaces existing vendor binding (
                <span className="font-mono">{claimingTarget?.vendorDeviceId || 'previous'}</span>).
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode('register_new_falcon')}
              className={cn(
                'w-full text-left rounded-xl border p-3.5 transition-all cursor-pointer space-y-1',
                mode === 'register_new_falcon'
                  ? 'border-primary bg-primary/8 ring-1 ring-primary/40'
                  : 'border-border hover:bg-muted/40'
              )}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Plus className="size-3.5 text-primary" />
                <span>
                  Keep {claimingTarget?.identifier || 'existing'} untouched & register{' '}
                  <span className="font-mono">{vendorRecord.serial}</span> as a new device
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground pl-5">
                Use when both vendor devices exist separately and the vendor name ({vendorRecord.vendorName}) was reused by mistake.
              </p>
            </button>
          </div>

          {mode === 'register_new_falcon' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-border bg-muted/20 p-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground block">
                  New FALCON identifier *
                </label>
                <input
                  type="text"
                  value={newIdentifier}
                  onChange={(e) => setNewIdentifier(e.target.value)}
                  className="w-full h-8 rounded-md border border-border bg-background px-2.5 text-xs font-mono"
                />
                {newIdInvalid && (
                  <p className="text-[10px] text-red-500">
                    Must be unique and use letters, digits, or hyphens.
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground block">
                  Device name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full h-8 rounded-md border border-border bg-background px-2.5 text-xs"
                />
              </div>
            </div>
          )}

          {/* Required Audit Reason */}
          <div className="space-y-1.5">
            <label htmlFor="conflict-reason" className="text-xs font-medium text-foreground block">
              Audit reason *
            </label>
            <textarea
              id="conflict-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this mapping is being updated (minimum 5 characters)..."
              className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {errorMsg && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-2.5 text-xs text-red-500">
              {errorMsg}
            </div>
          )}
        </div>

        <SheetFooter className="gap-2 border-t border-border pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!canSubmit}
            onClick={handleConfirm}
            className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
          >
            <CheckCircle2 className="size-3.5" />
            <span>{submitting ? 'Applying...' : 'Confirm resolution'}</span>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
