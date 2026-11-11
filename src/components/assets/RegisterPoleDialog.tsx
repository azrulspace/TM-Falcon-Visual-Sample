import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  MapPin,
  X,
  Plus,
  Check,
  Navigation,
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
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import {
  validateCoordinatePair,
  haversineDistanceMeters,
  formatDistance,
} from '@/lib/geo';
import type { PoleLifecycle, PoleLocation } from '@/types/assets';
import { cn } from '@/lib/utils';

export interface RegisterPoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenPole?: (identifier: string) => void;
}

const LIFECYCLE_OPTIONS: Exclude<PoleLifecycle, 'Deleted'>[] = [
  'Active',
  'Maintenance',
  'Planned',
  'Inactive',
];

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
 * Dialog (desktop/landscape) or Sheet (mobile/portrait) for registering a new utility pole
 * with synchronized form inputs and interactive map coordinate picker.
 */
export const RegisterPoleDialog: React.FC<RegisterPoleDialogProps> = ({
  open,
  onOpenChange,
  onOpenPole,
}) => {
  const {
    sites,
    poles,
    cableSpans,
    isIdentifierUnique,
    registerPole,
    permissions,
  } = useAssets();
  const { selectedSite } = useAppContext();
  const { addToast } = useToast();
  const isSheet = usePortraitSheet();

  const defaultSiteName = useMemo(() => {
    if (selectedSite && selectedSite !== 'All sites' && sites.some((s) => s.name === selectedSite)) {
      return selectedSite;
    }
    return sites[0]?.name || 'Teluk Panglima Garang';
  }, [selectedSite, sites]);

  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [siteName, setSiteName] = useState(defaultSiteName);
  const [lifecycle, setLifecycle] = useState<Exclude<PoleLifecycle, 'Deleted'>>('Active');
  const [protection, setProtection] = useState('');
  const [note, setNote] = useState('');
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [identifierError, setIdentifierError] = useState<string | undefined>();
  const [siteError, setSiteError] = useState<string | undefined>();
  const [latError, setLatError] = useState<string | undefined>();
  const [lngError, setLngError] = useState<string | undefined>();
  const [summaryErrors, setSummaryErrors] = useState<string[]>([]);
  const [touchedId, setTouchedId] = useState(false);

  const idInputRef = useRef<HTMLInputElement>(null);

  // Sync default site when dialog opens fresh (preserving entered fields while already open)
  useEffect(() => {
    if (open) {
      setSummaryErrors([]);
      setIdentifierError(undefined);
      setSiteError(undefined);
      setLatError(undefined);
      setLngError(undefined);
      setSiteName((prev) => prev || defaultSiteName);
      setTimeout(() => {
        idInputRef.current?.focus();
      }, 60);
    }
  }, [open, defaultSiteName]);

  const resetForm = () => {
    setIdentifier('');
    setName('');
    setSiteName(defaultSiteName);
    setLifecycle('Active');
    setProtection('');
    setNote('');
    setLatInput('');
    setLngInput('');
    setIdentifierError(undefined);
    setSiteError(undefined);
    setLatError(undefined);
    setLngError(undefined);
    setSummaryErrors([]);
    setTouchedId(false);
  };

  const activeSiteObj = useMemo(
    () => sites.find((s) => s.name === siteName) || sites[0],
    [sites, siteName]
  );

  const sitePoles = useMemo(
    () => poles.filter((p) => p.siteName === siteName && p.lifecycle !== 'Deleted'),
    [poles, siteName]
  );

  const coordCheck = useMemo(
    () => validateCoordinatePair(latInput, lngInput),
    [latInput, lngInput]
  );

  const distanceFromCentreMeters = useMemo(() => {
    if (!coordCheck.valid || !coordCheck.location || !activeSiteObj?.centrePoint) return null;
    return haversineDistanceMeters(activeSiteObj.centrePoint, coordCheck.location);
  }, [coordCheck, activeSiteObj]);

  const isFarFromSite = distanceFromCentreMeters !== null && distanceFromCentreMeters > 5000;

  const validateIdentifierField = (raw: string): string | undefined => {
    const trimmed = raw.trim();
    if (!trimmed) return 'Identifier is required.';
    if (/\s/.test(trimmed)) return 'Identifier cannot contain spaces.';
    if (!isIdentifierUnique(trimmed)) {
      return `Identifier "${trimmed}" is already registered.`;
    }
    return undefined;
  };

  const handleIdentifierBlur = () => {
    setTouchedId(true);
    setIdentifierError(validateIdentifierField(identifier));
  };

  const handleMapPick = (loc: PoleLocation) => {
    setLatInput(loc.lat.toFixed(6));
    setLngInput(loc.lng.toFixed(6));
    setLatError(undefined);
    setLngError(undefined);
  };

  const handleClearCoords = () => {
    setLatInput('');
    setLngInput('');
    setLatError(undefined);
    setLngError(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.canRegister) {
      setSummaryErrors(['You do not have permission to register poles.']);
      return;
    }

    const errors: string[] = [];
    const idErr = validateIdentifierField(identifier);
    setIdentifierError(idErr);
    if (idErr) errors.push(idErr);

    const sErr = !siteName ? 'Site is required.' : undefined;
    setSiteError(sErr);
    if (sErr) errors.push(sErr);

    const coords = validateCoordinatePair(latInput, lngInput);
    setLatError(coords.latError);
    setLngError(coords.lngError);
    if (!coords.valid && coords.summaryError) {
      errors.push(coords.summaryError);
    }

    if (errors.length > 0) {
      setSummaryErrors(errors);
      return;
    }

    setSummaryErrors([]);
    setIsSubmitting(true);
    try {
      const cleanId = identifier.trim();
      const result = await registerPole({
        identifier: cleanId,
        name: name.trim() || cleanId,
        siteName,
        lifecycle,
        location: coords.location,
        protection: protection.trim() || null,
        note: note.trim() || null,
      });

      if (!result.ok) {
        const msg = result.error || 'Failed to register pole.';
        setSummaryErrors([msg]);
        if (msg.toLowerCase().includes('identifier')) setIdentifierError(msg);
        return;
      }

      const savedId = cleanId;
      addToast(
        'success',
        `Pole ${savedId} registered on ${siteName}.`,
        'Pole registered',
        onOpenPole
          ? {
              action: {
                label: 'Open pole',
                onClick: () => onOpenPole(savedId),
              },
            }
          : undefined
      );
      resetForm();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formAndMapContent = (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
      {/* Top Validation / Submit Error Summary */}
      {summaryErrors.length > 0 && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive"
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="size-4 shrink-0" />
            <span>Please review {summaryErrors.length === 1 ? 'this issue' : 'these issues'} before saving:</span>
          </div>
          <ul className="mt-1 list-disc pl-5 space-y-0.5">
            {summaryErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 overflow-y-auto pr-1">
        {/* Left: Structured Form Inputs */}
        <div className="md:col-span-6 space-y-3.5">
          {/* Identifier */}
          <div>
            <label htmlFor="reg-pole-id" className="block text-xs font-semibold text-foreground mb-1">
              Identifier <span className="text-destructive">*</span>
            </label>
            <input
              ref={idInputRef}
              id="reg-pole-id"
              type="text"
              value={identifier}
              onChange={(e) => {
                const next = e.target.value;
                setIdentifier(next);
                if (touchedId || identifierError || summaryErrors.length > 0) {
                  const nextErr = validateIdentifierField(next);
                  setIdentifierError(nextErr);
                  if (!nextErr && summaryErrors.length > 0) {
                    setSummaryErrors([]);
                  }
                }
              }}
              onBlur={handleIdentifierBlur}
              placeholder="e.g. TGP_P012"
              aria-invalid={Boolean(identifierError)}
              className={cn(
                'w-full h-9 rounded-md border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40',
                identifierError ? 'border-destructive' : 'border-border'
              )}
            />
            {identifierError ? (
              <p className="mt-1 text-xs text-destructive">{identifierError}</p>
            ) : (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Stored verbatim (underscores and case preserved). Checked against loaded records.
              </p>
            )}
          </div>

          {/* Name */}
          <div>
            <label htmlFor="reg-pole-name" className="block text-xs font-semibold text-foreground mb-1">
              Name
            </label>
            <input
              id="reg-pole-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Optional display name (defaults to identifier)"
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Site + Lifecycle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="reg-pole-site" className="block text-xs font-semibold text-foreground mb-1">
                Site <span className="text-destructive">*</span>
              </label>
              <select
                id="reg-pole-site"
                value={siteName}
                onChange={(e) => {
                  setSiteName(e.target.value);
                  setSiteError(undefined);
                }}
                aria-invalid={Boolean(siteError)}
                className={cn(
                  'w-full h-9 rounded-md border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40',
                  siteError ? 'border-destructive' : 'border-border'
                )}
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
              {siteError && <p className="mt-1 text-xs text-destructive">{siteError}</p>}
            </div>

            <div>
              <label htmlFor="reg-pole-lifecycle" className="block text-xs font-semibold text-foreground mb-1">
                Lifecycle
              </label>
              <select
                id="reg-pole-lifecycle"
                value={lifecycle}
                onChange={(e) => setLifecycle(e.target.value as Exclude<PoleLifecycle, 'Deleted'>)}
                className="w-full h-9 rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {LIFECYCLE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Coordinate Inputs */}
          <div className="rounded-lg border border-border bg-muted p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" />
                Coordinates (optional)
              </span>
              {(latInput || lngInput) && (
                <button
                  type="button"
                  onClick={handleClearCoords}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
                >
                  <X className="size-3" />
                  Clear location
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="reg-pole-lat" className="block text-[11px] text-muted-foreground mb-1">
                  Latitude
                </label>
                <input
                  id="reg-pole-lat"
                  type="text"
                  inputMode="decimal"
                  value={latInput}
                  onChange={(e) => {
                    setLatInput(e.target.value);
                    const next = validateCoordinatePair(e.target.value, lngInput);
                    setLatError(next.latError);
                    setLngError(next.lngError);
                  }}
                  placeholder={
                    activeSiteObj?.centrePoint
                      ? activeSiteObj.centrePoint.lat.toFixed(6)
                      : '2.922390'
                  }
                  aria-invalid={Boolean(latError)}
                  className={cn(
                    'w-full h-8 rounded-md border bg-background px-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40',
                    latError ? 'border-destructive' : 'border-border'
                  )}
                />
                {latError && <p className="mt-1 text-[11px] text-destructive">{latError}</p>}
              </div>

              <div>
                <label htmlFor="reg-pole-lng" className="block text-[11px] text-muted-foreground mb-1">
                  Longitude
                </label>
                <input
                  id="reg-pole-lng"
                  type="text"
                  inputMode="decimal"
                  value={lngInput}
                  onChange={(e) => {
                    setLngInput(e.target.value);
                    const next = validateCoordinatePair(latInput, e.target.value);
                    setLatError(next.latError);
                    setLngError(next.lngError);
                  }}
                  placeholder={
                    activeSiteObj?.centrePoint
                      ? activeSiteObj.centrePoint.lng.toFixed(6)
                      : '101.457170'
                  }
                  aria-invalid={Boolean(lngError)}
                  className={cn(
                    'w-full h-8 rounded-md border bg-background px-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40',
                    lngError ? 'border-destructive' : 'border-border'
                  )}
                />
                {lngError && <p className="mt-1 text-[11px] text-destructive">{lngError}</p>}
              </div>
            </div>

            {distanceFromCentreMeters !== null && (
              <div
                className={cn(
                  'flex items-start gap-2 rounded-md px-2.5 py-1.5 text-[11px]',
                  isFarFromSite
                    ? 'bg-status-warning-tint border border-status-warning-border text-status-warning'
                    : 'bg-background border border-border text-muted-foreground'
                )}
              >
                {isFarFromSite ? (
                  <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                ) : (
                  <Navigation className="size-3.5 shrink-0 mt-0.5 text-primary" />
                )}
                <span>
                  {formatDistance(distanceFromCentreMeters)} from {siteName} centre point
                  {isFarFromSite && ' — over 5 km away, verify coordinates if unintended.'}
                </span>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground">
              Click the map on the right or drag the blue pin to pick coordinates, or leave blank to record location later.
            </p>
          </div>

          {/* Protection */}
          <div>
            <label htmlFor="reg-pole-protection" className="block text-xs font-semibold text-foreground mb-1">
              Protection
            </label>
            <input
              id="reg-pole-protection"
              type="text"
              value={protection}
              onChange={(e) => setProtection(e.target.value)}
              placeholder="e.g. Earth-fault relay (leave blank if none)"
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Note */}
          <div>
            <label htmlFor="reg-pole-note" className="block text-xs font-semibold text-foreground mb-1">
              Note
            </label>
            <textarea
              id="reg-pole-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional site note or physical mounting observation"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>
        </div>

        {/* Right: Synchronized Map Coordinate Picker */}
        <div className="md:col-span-6 flex flex-col">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-semibold text-foreground">Map location picker</span>
            <span>{siteName}</span>
          </div>
          <div className="rounded-lg border border-border overflow-hidden flex-1 min-h-[280px]">
            <PoleMapCanvas
              poles={sitePoles}
              cableSpans={cableSpans}
              centerPoint={activeSiteObj?.centrePoint || { lat: 2.92239, lng: 101.45717 }}
              pickerMode
              pickedLocation={coordCheck.valid ? coordCheck.location : null}
              onPickLocation={handleMapPick}
              showPopup={false}
              showSiteCentre
              compactControls
              heightClassName="h-[340px] md:h-full min-h-[300px]"
            />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 pt-3.5 border-t border-border flex items-center justify-between gap-3">
        <span className="text-[11px] text-muted-foreground hidden sm:inline">
          Fields marked <span className="text-destructive">*</span> are required.
        </span>
        <div className="flex items-center gap-2 ml-auto">
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
            disabled={isSubmitting || !permissions.canRegister}
            className="h-9 px-4 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Registering...</span>
            ) : (
              <>
                {coordCheck.valid && coordCheck.location ? (
                  <Check className="size-3.5" />
                ) : (
                  <Plus className="size-3.5" />
                )}
                <span>Register pole</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );

  if (isSheet) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[92vh] flex flex-col p-4">
          <SheetHeader className="px-0 pt-0 pb-3">
            <SheetTitle>Register pole</SheetTitle>
            <SheetDescription>
              Add a new pole record and optionally place it on the site map.
            </SheetDescription>
          </SheetHeader>
          {formAndMapContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col p-5 bg-card border border-border">
        <DialogHeader className="pb-3 border-b border-border mb-4">
          <DialogTitle className="text-base font-semibold text-foreground">
            Register pole
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Add a new pole record to the site registry and optionally pin its coordinates on the map.
          </DialogDescription>
        </DialogHeader>
        {formAndMapContent}
      </DialogContent>
    </Dialog>
  );
};
