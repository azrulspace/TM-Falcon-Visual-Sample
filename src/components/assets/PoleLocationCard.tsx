import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  MapPinOff,
  Copy,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PoleMapCanvas } from '@/components/assets/PoleMapCanvas';
import { formatCoordinates } from '@/lib/geo';
import { useToast } from '@/contexts/ToastContext';
import type { PoleWithRelations } from '@/types/assets';
import type { PolePermissions } from '@/lib/permissions';

export interface PoleLocationCardProps {
  pole: PoleWithRelations;
  allPoles: PoleWithRelations[];
  permissions: PolePermissions;
  onRelocate: () => void;
}

/**
 * Side column Location card for Pole detail: embeds PoleMapCanvas centered on the pole
 * with connected cable spans and neighbor endpoints, or shows an honest "No location recorded"
 * state with an Add location CTA.
 */
export const PoleLocationCard: React.FC<PoleLocationCardProps> = ({
  pole,
  allPoles,
  permissions,
  onRelocate,
}) => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Include direct span neighbor poles so connected spans draw accurately on detail map
  const mapPoles = useMemo(() => {
    const ids = new Set<string>([pole.identifier]);
    pole.connectedSpans.forEach((s) => {
      ids.add(s.fromPole);
      ids.add(s.toPole);
    });
    return allPoles.filter((p) => ids.has(p.identifier) && Boolean(p.location));
  }, [pole, allPoles]);

  const handleCopy = () => {
    if (!pole.location) return;
    const text = formatCoordinates(pole.location);
    navigator.clipboard.writeText(text);
    addToast('info', `Copied ${text}`);
  };

  return (
    <section
      aria-label="Pole location"
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Location</h3>
        </div>
        {pole.location && (
          <button
            type="button"
            onClick={() => navigate(`/overview?asset=${encodeURIComponent(pole.identifier)}`)}
            className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Overview map</span>
            <ExternalLink className="size-3" />
          </button>
        )}
      </div>

      {pole.location ? (
        <div>
          <PoleMapCanvas
            poles={mapPoles}
            cableSpans={pole.connectedSpans}
            centerPoint={pole.location}
            selectedPoleId={pole.identifier}
            onOpenPole={(targetId) => {
              if (targetId !== pole.identifier) {
                navigate(`/assets/poles/${encodeURIComponent(targetId)}`);
              }
            }}
            showPopup={false}
            showSiteCentre
            heightClassName="h-[260px]"
          />

          <div className="p-4 flex items-center justify-between gap-2 border-t border-border">
            <div className="min-w-0">
              <div className="text-[11px] text-muted-foreground">Coordinates (WGS84)</div>
              <div className="font-mono text-xs text-foreground mt-0.5 flex items-center gap-1.5">
                <span className="truncate">{formatCoordinates(pole.location)}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                  aria-label="Copy coordinates"
                  title="Copy coordinates"
                >
                  <Copy className="size-3" />
                </button>
              </div>
            </div>

            {pole.lifecycle !== 'Deleted' && permissions.canRelocate && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRelocate}
                className="h-8 px-2.5 text-xs gap-1.5 shrink-0 cursor-pointer"
              >
                <Navigation className="size-3" />
                <span>Relocate</span>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-5">
          <div className="rounded-lg border border-dashed border-border bg-muted p-5 text-center space-y-2.5">
            <div className="size-9 rounded-full bg-status-warning-tint border border-status-warning-border text-status-warning flex items-center justify-center mx-auto">
              <MapPinOff className="size-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">No location recorded</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                This pole has no WGS84 coordinates and will not appear on map views until located.
              </p>
            </div>
            {pole.lifecycle !== 'Deleted' && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!permissions.canRelocate}
                onClick={onRelocate}
                className="h-8 px-3 text-xs gap-1.5 cursor-pointer"
              >
                <Navigation className="size-3.5" />
                <span>Add location</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
