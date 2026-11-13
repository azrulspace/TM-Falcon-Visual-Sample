import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  Copy,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDevices } from '@/contexts/DevicesContext';
import { useToast } from '@/contexts/ToastContext';
import type { VendorDeviceRecord, DeviceRecord } from '@/types/devices';

export interface ResolveConflictSheetProps {
  isOpen: boolean;
  onClose: () => void;
  vendorRecord: VendorDeviceRecord | null;
  falconDevice: DeviceRecord | null;
}

export const ResolveConflictSheet: React.FC<ResolveConflictSheetProps> = ({
  isOpen,
  onClose,
  vendorRecord,
  falconDevice,
}) => {
  const navigate = useNavigate();
  const { remapVendorConflict } = useDevices();
  const { addToast } = useToast();

  const [reason, setReason] = useState('Hardware replacement on pole');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedSerial, setCopiedSerial] = useState(false);

  if (!isOpen || !vendorRecord) return null;

  const claimedId = vendorRecord.mappedFalconId || 'DEV-001';
  const conflictDetails = vendorRecord.conflictDetails || {
    claimedFalconId: claimedId,
    currentMappedSerial: falconDevice?.serialNumber || 'GQ7752680',
    eventsAttributedToClaimed: falconDevice?.events30dCount || 4,
    eventsAttributedToVendorSerial: 12,
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSerial(true);
    setTimeout(() => setCopiedSerial(false), 1500);
  };

  const handleRemap = async () => {
    if (!reason.trim()) {
      addToast('error', 'Please provide a reason for the remap.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await remapVendorConflict(claimedId, vendorRecord.serialNumber, reason.trim());
      if (res.ok) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterNew = () => {
    onClose();
    navigate(`/assets/devices/new?serial=${vendorRecord.serialNumber}`);
  };

  const handleKeepCurrent = () => {
    addToast('info', `Conflict on ${claimedId} acknowledged. Mapping kept as ${conflictDetails.currentMappedSerial}.`);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-sheet-title"
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-xl bg-card border-l border-border p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <AlertTriangle className="size-4" />
              </div>
              <div>
                <h2 id="conflict-sheet-title" className="text-base font-bold text-foreground">
                  Resolve vendor conflict
                </h2>
                <p className="text-xs text-muted-foreground">
                  Hardware correlation mismatch detected by Edge discovery.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Real consequence explanation */}
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-xs space-y-2">
            <div className="font-semibold text-rose-500 flex items-center gap-1.5">
              <span>Attribution Conflict</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              FALCON device <strong className="font-mono text-foreground">{claimedId}</strong> was registered with vendor serial <strong className="font-mono text-foreground">{conflictDetails.currentMappedSerial}</strong>. Discovered vendor device <strong className="font-mono text-foreground">{vendorRecord.serialNumber}</strong> ({vendorRecord.vendorName}) is claiming the same identifier.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Because of this mismatch, <strong className="text-foreground">{conflictDetails.eventsAttributedToVendorSerial} events</strong> captured by {vendorRecord.serialNumber} cannot be attributed to {claimedId} and currently appear in events with raw vendor serial numbers.
            </p>
          </div>

          {/* Side by side comparison */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* Device A */}
            <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Current Registry
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                  FALCON
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground block">Device ID</span>
                <span className="font-mono font-bold text-foreground text-sm">
                  {claimedId}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground block">Mapped Serial</span>
                <span className="font-mono text-xs text-foreground truncate block">
                  {conflictDetails.currentMappedSerial}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground block">Installed Pole</span>
                <span className="font-mono text-xs text-primary font-semibold">
                  {falconDevice?.installedOnPoleId || 'TGP_P010'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground block">Attributed Events</span>
                <span className="font-mono font-bold text-foreground">
                  {conflictDetails.eventsAttributedToClaimed} events
                </span>
              </div>
            </div>

            {/* Device B */}
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                  Discovered Vendor
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-500">
                  Edge
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground block">Vendor Serial</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-foreground text-sm">
                    {vendorRecord.serialNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(vendorRecord.serialNumber)}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Copy serial"
                  >
                    {copiedSerial ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground block">Vendor Name & Model</span>
                <span className="text-xs text-foreground truncate block">
                  {vendorRecord.vendorName} · {vendorRecord.vendorModel}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground block">Claims FALCON ID</span>
                <span className="font-mono text-xs text-rose-500 font-bold">
                  {claimedId}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground block">Unattributed Events</span>
                <span className="font-mono font-bold text-rose-500">
                  {conflictDetails.eventsAttributedToVendorSerial} events
                </span>
              </div>
            </div>
          </div>

          {/* Reason for remap */}
          <div className="space-y-1.5 pt-2">
            <label
              htmlFor="remap-reason-input"
              className="text-xs font-semibold text-foreground flex items-center justify-between"
            >
              <span>Audit reason for remap</span>
              <span className="text-[10px] text-muted-foreground">Required</span>
            </label>
            <input
              id="remap-reason-input"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Hardware camera replacement on pole TGP_P010"
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="text-[11px] text-muted-foreground">
              This entry is logged in the device timeline and system audit trail.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-border space-y-2.5">
          <Button
            type="button"
            disabled={isSubmitting || !reason.trim()}
            onClick={handleRemap}
            className="w-full h-9 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-sm"
          >
            <RefreshCw className="size-3.5" />
            <span>Remap {claimedId} to {vendorRecord.serialNumber}</span>
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleRegisterNew}
              className="h-9 gap-1.5 text-xs cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Register as new device</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={handleKeepCurrent}
              className="h-9 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Keep current mapping
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
