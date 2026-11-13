import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Search,
  Check,
  AlertTriangle,
  X,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDevices } from '@/contexts/DevicesContext';
import { useAssets } from '@/contexts/AssetsContext';
import { formatCoordinates } from '@/lib/geo';
import { cn } from '@/lib/utils';
import type { DeviceRecord } from '@/types/devices';

export interface ManageInstallationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  device: DeviceRecord | null;
}

export const ManageInstallationDialog: React.FC<ManageInstallationDialogProps> = ({
  isOpen,
  onClose,
  device,
}) => {
  const { manageInstallation } = useDevices();
  const { poles } = useAssets();

  const [selectedPoleId, setSelectedPoleId] = useState<string | null>(
    device?.installedOnPoleId || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [note, setNote] = useState('Field technician deployment update');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uninstallMode, setUninstallMode] = useState(false);

  // Available poles on the device's site
  const sitePoles = useMemo(() => {
    if (!device) return [];
    return poles.filter((p) => {
      if (p.lifecycle === 'Deleted') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = p.identifier.toLowerCase().includes(q);
        const nameMatch = p.name ? p.name.toLowerCase().includes(q) : false;
        if (!idMatch && !nameMatch) return false;
      }
      return true;
    });
  }, [poles, device, searchQuery]);

  if (!isOpen || !device) return null;

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const poleToAssign = uninstallMode ? null : selectedPoleId;
      const res = await manageInstallation(
        device.identifier,
        poleToAssign,
        note.trim()
      );
      if (res.ok) {
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
      aria-labelledby="manage-inst-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <MapPin className="size-4" />
            </div>
            <div>
              <h2 id="manage-inst-title" className="text-base font-bold text-foreground">
                Manage pole installation
              </h2>
              <p className="text-xs text-muted-foreground">
                Mount <strong className="font-mono text-foreground">{device.identifier}</strong> to a physical utility pole.
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

        {/* Current State Info */}
        <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
              Current Mount
            </span>
            <span className="font-mono font-bold text-foreground mt-0.5 block">
              {device.installedOnPoleId ? (
                <span className="text-primary">{device.installedOnPoleId} ({device.siteName})</span>
              ) : (
                <span className="text-amber-500 font-normal">Not installed (Unmounted)</span>
              )}
            </span>
          </div>

          {device.installedOnPoleId && !uninstallMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUninstallMode(true);
                setSelectedPoleId(null);
              }}
              className="h-7 text-xs text-rose-500 border-rose-500/30 hover:bg-rose-500/10 cursor-pointer"
            >
              <Trash2 className="size-3 mr-1" />
              <span>Uninstall from pole</span>
            </Button>
          )}

          {uninstallMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setUninstallMode(false);
                setSelectedPoleId(device.installedOnPoleId);
              }}
              className="h-7 text-xs text-muted-foreground cursor-pointer"
            >
              Cancel uninstall
            </Button>
          )}
        </div>

        {uninstallMode ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-xs space-y-2">
            <span className="font-bold text-rose-500 flex items-center gap-1.5">
              <AlertTriangle className="size-4" />
              <span>Confirm Uninstallation</span>
            </span>
            <p className="text-muted-foreground leading-relaxed">
              This will remove {device.identifier} from pole {device.installedOnPoleId}. The device will be preserved in the FALCON registry with its configuration and history, marked as unmounted without coordinates.
            </p>
          </div>
        ) : (
          /* Searchable Pole Picker */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Select target pole ({sitePoles.length} available)
              </label>
              <span className="text-[10px] text-muted-foreground font-mono">
                Site: {device.siteName}
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pole identifier (e.g. TGP_P010)..."
                className="w-full h-8.5 rounded-md border border-border bg-background pl-8.5 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
              />
            </div>

            <div className="max-h-52 overflow-y-auto rounded-lg border border-border divide-y divide-border/60">
              {sitePoles.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No poles found matching &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                sitePoles.map((p) => {
                  const isSelected = selectedPoleId === p.identifier;
                  return (
                    <button
                      key={p.identifier}
                      type="button"
                      onClick={() => setSelectedPoleId(p.identifier)}
                      className={cn(
                        'w-full text-left p-2.5 transition-colors flex items-center justify-between gap-3 cursor-pointer',
                        isSelected ? 'bg-primary/10' : 'hover:bg-muted/40'
                      )}
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-foreground">
                            {p.identifier}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                            {p.lifecycle}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-mono truncate block">
                          Coords: {formatCoordinates(p.location)}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                          <Check className="size-3" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Note / Reason Field */}
        <div className="space-y-1.5 pt-1">
          <label htmlFor="inst-note-input" className="text-xs font-semibold text-foreground">
            Deployment note / Reason
          </label>
          <input
            id="inst-note-input"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Field technician hardware move"
            className="w-full h-8.5 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
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
            disabled={isSubmitting || (!uninstallMode && !selectedPoleId)}
            onClick={handleSave}
            className={cn(
              'h-8.5 px-4 text-xs font-semibold cursor-pointer shadow-sm',
              uninstallMode
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            )}
          >
            {isSubmitting
              ? 'Saving...'
              : uninstallMode
              ? 'Confirm unmount'
              : `Mount to ${selectedPoleId || 'pole'}`}
          </Button>
        </div>
      </div>
    </div>
  );
};
