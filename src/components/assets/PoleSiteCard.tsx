import React from 'react';
import { Building2, Copy, AlertTriangle } from 'lucide-react';
import { formatCoordinates, formatDistance } from '@/lib/geo';
import { useToast } from '@/contexts/ToastContext';
import type { PoleWithRelations } from '@/types/assets';

export interface PoleSiteCardProps {
  pole: PoleWithRelations;
}

/**
 * Side column Site card showing site name, site centre point coordinates, and
 * Haversine distance from centre point (computed only when pole coordinates exist).
 */
export const PoleSiteCard: React.FC<PoleSiteCardProps> = ({ pole }) => {
  const { addToast } = useToast();

  const handleCopyCentre = () => {
    if (!pole.siteCentrePoint) return;
    const text = formatCoordinates(pole.siteCentrePoint);
    navigator.clipboard.writeText(text);
    addToast('info', `Copied site centre ${text}`);
  };

  const isFar =
    pole.distanceFromCentreMeters !== null && pole.distanceFromCentreMeters > 5000;

  return (
    <section
      aria-label="Site details"
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-border flex items-center gap-1.5">
        <Building2 className="size-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Site</h3>
      </div>

      <dl className="p-4 space-y-3 text-xs">
        <div>
          <dt className="text-[11px] text-muted-foreground mb-0.5">Site name</dt>
          <dd className="text-sm font-medium text-foreground">{pole.siteName}</dd>
        </div>

        <div>
          <dt className="text-[11px] text-muted-foreground mb-0.5">Centre point</dt>
          <dd className="font-mono text-foreground flex items-center gap-1.5">
            <span>{formatCoordinates(pole.siteCentrePoint)}</span>
            {pole.siteCentrePoint && (
              <button
                type="button"
                onClick={handleCopyCentre}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Copy site centre point"
                title="Copy site centre point"
              >
                <Copy className="size-3" />
              </button>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-[11px] text-muted-foreground mb-0.5">
            Distance from site centre
          </dt>
          <dd className="text-foreground">
            {pole.location && pole.distanceFromCentreMeters !== null ? (
              <div className="space-y-1">
                <span className="font-mono font-medium">
                  {formatDistance(pole.distanceFromCentreMeters)}
                </span>
                {isFar && (
                  <p className="text-[11px] text-status-warning flex items-center gap-1">
                    <AlertTriangle className="size-3 shrink-0" />
                    <span>Over 5 km from site centre</span>
                  </p>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">
                Unavailable until pole location is recorded
              </span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
};
