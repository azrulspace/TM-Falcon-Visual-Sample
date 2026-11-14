import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Link2,
  Cpu,
  Search,
  CheckCircle2,
  ExternalLink,
  Plus,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAssets } from '@/contexts/AssetsContext';
import { useToast } from '@/contexts/ToastContext';
import { DeviceTypeBadge, DeviceConnectivityBadge } from '@/components/assets/devices/DeviceStateBadge';
import { cn } from '@/lib/utils';
import type { PoleWithRelations } from '@/types/assets';

export interface MountDeviceDialogProps {
  pole: PoleWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MountDeviceDialog: React.FC<MountDeviceDialogProps> = ({
  pole,
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const { richDevices, manageInstallation, devicePermissions } = useAssets();
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Uninstalled devices available for mounting
  const availableDevices = useMemo(() => {
    return richDevices.filter((d) => !d.isInstalled || !d.installedPoleId);
  }, [richDevices]);

  const filteredDevices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return availableDevices.filter((d) => {
      if (!q) return true;
      return (
        d.identifier.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.serial.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q)
      );
    });
  }, [availableDevices, search]);

  const selectedDevice = useMemo(
    () => availableDevices.find((d) => d.identifier === selectedDeviceId) || null,
    [availableDevices, selectedDeviceId]
  );

  const handleMount = async () => {
    if (!selectedDeviceId) return;
    setSubmitting(true);
    const res = await manageInstallation(selectedDeviceId, pole.identifier, {
      note: note.trim() || `Mounted to pole ${pole.identifier}`,
    });
    setSubmitting(false);

    if (res.ok) {
      addToast('success', `Mounted device ${selectedDeviceId} onto pole ${pole.identifier}.`);
      setSelectedDeviceId('');
      setNote('');
      onOpenChange(false);
    } else {
      addToast('error', res.error || 'Failed to mount device onto pole.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Link2 className="size-4 text-primary" />
            <span>Mount device to pole {pole.identifier}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Select an uninstalled device from the FALCON registry to mount at {pole.siteName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {availableDevices.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center space-y-2">
              <Cpu className="size-8 text-muted-foreground/60 mx-auto" />
              <p className="text-xs font-semibold text-foreground">No unmounted devices available</p>
              <p className="text-[11px] text-muted-foreground">
                All devices in the registry are currently mounted on physical poles.
              </p>
              <div className="pt-2">
                <Button
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    navigate(
                      `/assets/inventory/devices/new?poleId=${encodeURIComponent(
                        pole.identifier
                      )}&site=${encodeURIComponent(pole.siteName)}`
                    );
                  }}
                  className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Register new device for this pole</span>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search unmounted devices by ID, type, or serial..."
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Devices selection list */}
              <div className="max-h-56 overflow-y-auto divide-y divide-border/60 rounded-lg border border-border">
                {filteredDevices.map((dev) => {
                  const isSelected = selectedDeviceId === dev.identifier;
                  return (
                    <button
                      key={dev.identifier}
                      type="button"
                      onClick={() => setSelectedDeviceId(dev.identifier)}
                      className={cn(
                        'w-full p-3 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer',
                        isSelected ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-muted/40'
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {dev.identifier}
                          </span>
                          <DeviceTypeBadge type={dev.type} size="xs" />
                          <DeviceConnectivityBadge state={dev.connectivityState} size="xs" />
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {dev.manufacturer} {dev.model} · SN: {dev.serial}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isSelected && <CheckCircle2 className="size-4 text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Installation Note */}
              {selectedDevice && (
                <div className="space-y-1.5 pt-1">
                  <label htmlFor="mount-note" className="text-xs font-medium text-foreground block">
                    Installation note (optional)
                  </label>
                  <input
                    id="mount-note"
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Mounted at 6m elevation facing north-west"
                    className="w-full h-8 px-3 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    navigate(
                      `/assets/inventory/devices/new?poleId=${encodeURIComponent(
                        pole.identifier
                      )}&site=${encodeURIComponent(pole.siteName)}`
                    );
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Or register a new device</span>
                  <ExternalLink className="size-3" />
                </button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!selectedDeviceId || submitting || !devicePermissions.canManageInstallation}
                    onClick={handleMount}
                    className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                  >
                    <Link2 className="size-3.5" />
                    <span>{submitting ? 'Mounting...' : 'Mount device'}</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
