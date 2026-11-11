import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapPin,
  Navigation,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  Check,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PoleMapCanvas } from '@/components/assets/PoleMapCanvas';
import { useAssets } from '@/contexts/AssetsContext';
import { useToast } from '@/contexts/ToastContext';
import {
  validateCoordinatePair,
  haversineDistanceMeters,
  formatDistance,
  formatCoordinates,
} from '@/lib/geo';
import type { PoleWithRelations, PoleLocation } from '@/types/assets';
import { cn } from '@/lib/utils';

export interface RelocatePoleDialogProps {
  pole: PoleWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function usePortraitSheet(): boolean {
  const [useSheet, setUseSheet] = useState(false);
  useEffect(() => {
    const check = () => {
      if (typeof window === 'undefined') return;
      const isNarrow = window.innerWidth < 768;
      const isTabletPortrait = window.innerWidth <= 900 && window.innerHeight > window.innerWidth;
      setUseSheet(isNarrow || isTabletPortrait);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return useSheet;
}

/**
 * Dialog/Sheet to relocate a pole (or add initial coordinates): renders interactive PoleMapCanvas
 * with reference old location pin + draggable new pin, Haversine distance moved, >5km site centre
 * warning, optional reason, and old -> new summary confirmation.
 */
export const RelocatePoleDialog: React.FC<RelocatePoleDialogProps> = ({
  pole,
  open,
  onOpenChange,
}) => {
  const { sites, poles, cableSpans, capabilities, permissions, relocatePole } = useAssets();
  const { addToast } = useToast();
  const isSheet = usePortraitSheet();

  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [reason, setReason] = useState('');
  const [latError, setLatError] = useState<string | undefined>();
  const [lngError, setLngError] = useState<string | undefined>();
  const [summaryError, setSummaryError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const latInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && pole) {
      setLatInput(pole.location ? pole.location.lat.toFixed(6) : '');
      setLngInput(pole.location ? pole.location.lng.toFixed(6) : '');
      setReason('');
      setLatError(undefined);
      setLngError(undefined);
      setSummaryError(undefined);
      setTimeout(() => latInputRef.current?.focus(), 60);
    }
  }, [open, pole]);

  const activeSite = useMemo(() => {
    if (!pole) return undefined;
    return sites.find((s) => s.name === pole.siteName) || sites[0];
  }, [pole, sites]);

  const sitePoles = useMemo(() => {
    if (!pole) return [];
    return poles.filter((p) => p.siteName === pole.siteName && p.lifecycle !== 'Deleted');
  }, [pole, poles]);

  const coordCheck = useMemo(
    () => validateCoordinatePair(latInput, lngInput),
    [latInput, lngInput]
  );

  const distanceMovedMeters = useMemo(() => {
    if (!pole?.location || !coordCheck.valid || !coordCheck.location) return null;
    return haversineDistanceMeters(pole.location, coordCheck.location);
  }, [pole, coordCheck]);

  const distanceFromCentreMeters = useMemo(() => {
    if (!activeSite?.centrePoint || !coordCheck.valid || !coordCheck.location) return null;
    return haversineDistanceMeters(activeSite.centrePoint, coordCheck.location);
  }, [activeSite, coordCheck]);

  const isFarFromSite =
    distanceFromCentreMeters !== null && distanceFromCentreMeters > 5000;

  const isUnchanged = useMemo(() => {
    if (!pole?.location || !coordCheck.valid || !coordCheck.location) return false;
    return (
      pole.location.lat.toFixed(6) === coordCheck.location.lat.toFixed(6) &&
      pole.location.lng.toFixed(6) === coordCheck.location.lng.toFixed(6)
    );
  }, [pole, coordCheck]);

  const handleMapPick = (loc: PoleLocation) => {
    setLatInput(loc.lat.toFixed(6));
    setLngInput(loc.lng.toFixed(6));
    setLatError(undefined);
    setLngError(undefined);
    setSummaryError(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pole) return;
    if (!permissions.canRelocate) {
      setSummaryError(permissions.relocateDisabledReason || 'Permission required.');
      return;
    }

    const pair = validateCoordinatePair(latInput, lngInput);
    if (!pair.valid) {
      setLatError(pair.latError);
      setLngError(pair.lngError);
      setSummaryError(pair.summaryError);
      return;
    }
    if (!pair.location) {
      setLatError('Latitude is required.');
      setLngError('Longitude is required.');
      setSummaryError('Enter both latitude and longitude, or click the map to set coordinates.');
      return;
    }
    if (isUnchanged) {
      setSummaryError('New coordinates match the existing pole location. Move the pin or update values.');
      return;
    }

    setSummaryError(undefined);
    setIsSubmitting(true);
    try {
      const res = await relocatePole(
        pole.identifier,
        pair.location,
        reason.trim() || undefined
      );
      if (!res.ok) {
        setSummaryError(res.error || 'Failed to save new location.');
        return;
      }
      addToast(
        'success',
        `Updated location for ${pole.identifier} to ${formatCoordinates(pair.location)}.`,
        pole.location ? 'Pole relocated' : 'Location added'
      );
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!pole) return null;

  const mapCenter: PoleLocation =
    pole.location || activeSite?.centrePoint || { lat: 2.92239, lng: 101.45717 };

  const body = (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
      {summaryError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive flex items-start gap-2"
        >
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{summaryError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 overflow-y-auto pr-1">
        <div className="md:col-span-6 space-y-3.5 text-xs">
          {/* Existing vs Proposed Summary */}
          <div className="rounded-lg border border-border bg-muted p-3 space-y-2">
            <div className="text-[11px] font-medium text-muted-foreground">
              Location transition
            </div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="px-2 py-1 rounded bg-background border border-border text-muted-foreground">
                {pole.location ? formatCoordinates(pole.location) : 'Not recorded'}
              </span>
              <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
              <span className="px-2 py-1 rounded bg-background border border-primary/40 text-foreground font-semibold">
                {coordCheck.valid && coordCheck.location
                  ? formatCoordinates(coordCheck.location)
                  : 'Select new point'}
              </span>
            </div>

            {distanceMovedMeters !== null && (
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                <Navigation className="size-3 text-primary" />
                <span>
                  Distance moved:{' '}
                  <strong className="font-mono text-foreground">
                    {formatDistance(distanceMovedMeters)}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Lat & Lng Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="relocate-lat" className="block font-semibold text-foreground mb-1">
                New latitude <span className="text-destructive">*</span>
              </label>
              <input
                ref={latInputRef}
                id="relocate-lat"
                type="text"
                inputMode="decimal"
                value={latInput}
                onChange={(e) => {
                  setLatInput(e.target.value);
                  const next = validateCoordinatePair(e.target.value, lngInput);
                  setLatError(next.latError);
                  setLngError(next.lngError);
                  setSummaryError(undefined);
                }}
                placeholder="2.922926"
                className={cn(
                  'w-full h-9 rounded-md border bg-background px-3 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40',
                  latError ? 'border-destructive' : 'border-border'
                )}
              />
              {latError && <p className="mt-1 text-[11px] text-destructive">{latError}</p>}
            </div>

            <div>
              <label htmlFor="relocate-lng" className="block font-semibold text-foreground mb-1">
                New longitude <span className="text-destructive">*</span>
              </label>
              <input
                id="relocate-lng"
                type="text"
                inputMode="decimal"
                value={lngInput}
                onChange={(e) => {
                  setLngInput(e.target.value);
                  const next = validateCoordinatePair(latInput, e.target.value);
                  setLatError(next.latError);
                  setLngError(next.lngError);
                  setSummaryError(undefined);
                }}
                placeholder="101.457646"
                className={cn(
                  'w-full h-9 rounded-md border bg-background px-3 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40',
                  lngError ? 'border-destructive' : 'border-border'
                )}
              />
              {lngError && <p className="mt-1 text-[11px] text-destructive">{lngError}</p>}
            </div>
          </div>

          {/* Distance from Site Centre Warning */}
          {distanceFromCentreMeters !== null && (
            <div
              className={cn(
                'flex items-start gap-2 rounded-md px-3 py-2 text-[11px]',
                isFarFromSite
                  ? 'bg-status-warning-tint border border-status-warning-border text-status-warning'
                  : 'bg-muted border border-border text-muted-foreground'
              )}
            >
              {isFarFromSite ? (
                <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
              ) : (
                <MapPin className="size-3.5 shrink-0 mt-0.5 text-primary" />
              )}
              <span>
                {formatDistance(distanceFromCentreMeters)} from {pole.siteName} centre point
                {isFarFromSite &&
                  ' — coordinate is over 5 km away. Confirm this is intended before saving.'}
              </span>
            </div>
          )}

          {/* Optional Reason / Note */}
          <div>
            <label htmlFor="relocate-reason" className="block font-semibold text-foreground mb-1">
              Reason or survey note (optional)
            </label>
            <textarea
              id="relocate-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. GPS resurvey with RTK handset"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
            {!capabilities.relocateReasonPersisted && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Timeline entry recorded in session; dedicated relocate-reason field not yet persisted by staging API.
              </p>
            )}
          </div>
        </div>

        {/* Interactive Map with Old Reference Pin + New Picked Pin */}
        <div className="md:col-span-6 flex flex-col">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-semibold text-foreground">Click map or drag pin</span>
            {pole.location && <span className="text-[11px]">Dashed = current location</span>}
          </div>
          <div className="rounded-lg border border-border overflow-hidden flex-1 min-h-[280px]">
            <PoleMapCanvas
              poles={sitePoles}
              cableSpans={cableSpans}
              centerPoint={mapCenter}
              pickerMode
              pickedLocation={coordCheck.valid ? coordCheck.location : null}
              referenceLocation={pole.location}
              referenceLabel="Current"
              onPickLocation={handleMapPick}
              showPopup={false}
              showSiteCentre
              compactControls
              heightClassName="h-[320px] md:h-full min-h-[290px]"
            />
          </div>
        </div>
      </div>

      <div className="mt-5 pt-3.5 border-t border-border flex items-center justify-end gap-2">
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
          disabled={
            isSubmitting ||
            !permissions.canRelocate ||
            !coordCheck.valid ||
            !coordCheck.location ||
            isUnchanged
          }
          className="h-9 px-4 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 cursor-pointer"
        >
          <Check className="size-3.5" />
          <span>{isSubmitting ? 'Saving...' : pole.location ? 'Confirm relocate' : 'Save location'}</span>
        </Button>
      </div>
    </form>
  );

  if (isSheet) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[92vh] flex flex-col p-4">
          <SheetHeader className="px-0 pt-0 pb-3">
            <SheetTitle>
              {pole.location ? 'Relocate pole' : 'Add pole location'} ·{' '}
              <span className="font-mono">{pole.identifier}</span>
            </SheetTitle>
            <SheetDescription>
              Pick new WGS84 coordinates by clicking the map or entering Latitude and Longitude.
            </SheetDescription>
          </SheetHeader>
          {body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col p-5 bg-card border border-border">
        <DialogHeader className="pb-3 border-b border-border mb-4">
          <DialogTitle className="text-base font-semibold text-foreground">
            {pole.location ? 'Relocate pole' : 'Add pole location'} ·{' '}
            <span className="font-mono">{pole.identifier}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Compare existing coordinates against the new map pin before confirming.
          </DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
};
