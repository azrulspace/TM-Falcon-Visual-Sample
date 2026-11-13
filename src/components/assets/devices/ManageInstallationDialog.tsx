import React, { useState, useEffect, useMemo } from 'react';
import { Link2, MapPin, Search, Unplug } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PoleMapCanvas } from '@/components/assets/PoleMapCanvas';
import { useAssets } from '@/contexts/AssetsContext';
import { formatCoordinates } from '@/lib/geo';
import { cn } from '@/lib/utils';
import type { DeviceWithRelations } from '@/types/devices';

export interface ManageInstallationDialogProps {
  device: DeviceWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManageInstallationDialog: React.FC<ManageInstallationDialogProps> = ({
  device,
  open,
  onOpenChange,
}) => {
  const { poles, cableSpans, manageInstallation, devicePermissions } = useAssets();

  const [mode, setMode] = useState<'install' | 'uninstall'>('install');
  const [poleSearch, setPoleSearch] = useState('');
  const [selectedPoleId, setSelectedPoleId] = useState<string>('');
  const [note, setNote] = useState('');
  const [uninstallReason, setUninstallReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && device) {
      setMode('install');
      setSelectedPoleId(device.installedPoleId || '');
      setPoleSearch('');
      setNote('');
      setUninstallReason('');
    }
  }, [open, device]);

  const activePoles = useMemo(
    () => poles.filter((p) => p.lifecycle !== 'Deleted'),
    [poles]
  );

  const filteredPoles = useMemo(() => {
    const q = poleSearch.trim().toLowerCase();
    return activePoles.filter((p) => {
      if (!q) return true;
      return (
        p.identifier.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.siteName.toLowerCase().includes(q)
      );
    });
  }, [activePoles, poleSearch]);

  const selectedPoleObj = useMemo(
    () => activePoles.find((p) => p.identifier === selectedPoleId) || null,
    [activePoles, selectedPoleId]
  );

  const mapCenter = selectedPoleObj?.location || { lat: 2.92239, lng: 101.45717 };

  if (!device) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    if (mode === 'uninstall') {
      const res = await manageInstallation(device.identifier, null, {
        reason: uninstallReason.trim(),
      });
      setSubmitting(false);
      if (res.ok) onOpenChange(false);
      return;
    }

    const res = await manageInstallation(device.identifier, selectedPoleId, {
      note: note.trim(),
    });
    setSubmitting(false);
    if (res.ok) onOpenChange(false);
  };

  const canConfirm =
    devicePermissions.canManageInstallation &&
    !submitting &&
    (mode === 'uninstall'
      ? Boolean(device.isInstalled && uninstallReason.trim().length >= 3)
      : Boolean(selectedPoleId && selectedPoleId !== device.installedPoleId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Link2 className="size-4 text-primary" />
            <span>Manage installation · {device.identifier}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Assign {device.identifier} to a pole so its coordinates appear on Operations maps, or remove an existing mount.
          </DialogDescription>
        </DialogHeader>

        {device.isInstalled && (
          <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5 self-start">
            <button
              type="button"
              onClick={() => setMode('install')}
              className={cn(
                'px-3 h-7 rounded-md text-xs font-medium cursor-pointer transition-all',
                mode === 'install'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Install / change pole
            </button>
            <button
              type="button"
              onClick={() => setMode('uninstall')}
              className={cn(
                'px-3 h-7 rounded-md text-xs font-medium cursor-pointer transition-all',
                mode === 'uninstall'
                  ? 'bg-card text-red-500 shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Uninstall from {device.installedPoleId}
            </button>
          </div>
        )}

        {mode === 'install' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-1">
            {/* Pole Picker List */}
            <div className="md:col-span-6 space-y-2.5">
              <div className="relative">
                <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={poleSearch}
                  onChange={(e) => setPoleSearch(e.target.value)}
                  placeholder="Search pole ID, name, or site..."
                  className="w-full h-8 rounded-lg border border-border bg-background pl-8 pr-3 text-xs"
                />
              </div>

              <div className="max-h-56 overflow-y-auto rounded-lg border border-border divide-y divide-border/60">
                {filteredPoles.slice(0, 40).map((p) => {
                  const isSel = selectedPoleId === p.identifier;
                  return (
                    <button
                      key={p.identifier}
                      type="button"
                      onClick={() => setSelectedPoleId(p.identifier)}
                      className={cn(
                        'w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors',
                        isSel ? 'bg-primary/12 text-primary font-semibold' : 'hover:bg-muted/40'
                      )}
                    >
                      <div className="min-w-0">
                        <div className="font-mono">{p.identifier}</div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {p.siteName} · {p.linkedDevicesCount} linked
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                        {p.location ? 'GPS' : 'No GPS'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground block">
                  Installation note (optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Mounted on upper cross-arm facing feeder line"
                  className="w-full h-8 rounded-lg border border-border bg-background px-2.5 text-xs"
                />
              </div>
            </div>

            {/* Map Preview of Selected Pole */}
            <div className="md:col-span-6 space-y-2">
              {selectedPoleObj?.location ? (
                <PoleMapCanvas
                  poles={[selectedPoleObj]}
                  cableSpans={cableSpans}
                  centerPoint={mapCenter}
                  selectedPoleId={selectedPoleObj.identifier}
                  showPopup={false}
                  showSiteCentre={false}
                  compactControls
                  heightClassName="h-[260px]"
                />
              ) : (
                <div className="h-[260px] rounded-lg border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center text-center p-4 text-xs text-muted-foreground">
                  <MapPin className="size-6 mb-2 opacity-60" />
                  {selectedPoleObj
                    ? `Pole ${selectedPoleObj.identifier} has no GPS coordinates recorded yet.`
                    : 'Select a pole on the left to preview its site location.'}
                </div>
              )}

              {selectedPoleObj && (
                <div className="rounded-lg border border-border bg-muted/25 px-3 py-2 text-[11px] flex items-center justify-between">
                  <span className="font-mono font-semibold text-foreground">
                    {selectedPoleObj.identifier} · {selectedPoleObj.siteName}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {formatCoordinates(selectedPoleObj.location)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <Unplug className="size-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-foreground">
                  Remove {device.identifier} from pole {device.installedPoleId}
                </div>
                <p className="text-muted-foreground mt-0.5">
                  The device will move to the Not installed list and hide from the Devices map until re-mounted.
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="uninstall-reason" className="font-medium text-foreground block">
                Uninstall reason *
              </label>
              <textarea
                id="uninstall-reason"
                rows={2}
                value={uninstallReason}
                onChange={(e) => setUninstallReason(e.target.value)}
                placeholder="Explain why the device is being removed (e.g. Returned for depot RMA)..."
                className="w-full rounded-lg border border-border bg-background p-2.5 text-xs"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
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
            variant={mode === 'uninstall' ? 'destructive' : 'default'}
            disabled={!canConfirm}
            onClick={handleConfirm}
            className="cursor-pointer"
          >
            {submitting
              ? 'Applying...'
              : mode === 'uninstall'
              ? 'Confirm uninstall'
              : device.isInstalled
              ? 'Save pole assignment'
              : 'Install on pole'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

