import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Copy, AlertTriangle, Cpu, Layers } from 'lucide-react';
import { formatCoordinates, formatDistance } from '@/lib/geo';
import { useToast } from '@/contexts/ToastContext';
import { useAssets } from '@/contexts/AssetsContext';
import type { PoleWithRelations } from '@/types/assets';

export interface PoleSiteCardProps {
  pole: PoleWithRelations;
}

/**
 * Side column Site card showing site name, site centre point coordinates,
 * Haversine distance from centre point, and cross-asset site fleet connections.
 */
export const PoleSiteCard: React.FC<PoleSiteCardProps> = ({ pole }) => {
  const { addToast } = useToast();
  const { poles, richDevices, cableSpans } = useAssets();

  const handleCopyCentre = () => {
    if (!pole.siteCentrePoint) return;
    const text = formatCoordinates(pole.siteCentrePoint);
    navigator.clipboard.writeText(text);
    addToast('info', `Copied site centre ${text}`);
  };

  const isFar =
    pole.distanceFromCentreMeters !== null && pole.distanceFromCentreMeters > 5000;

  const sitePolesCount = useMemo(
    () => poles.filter((p) => p.siteName === pole.siteName && p.lifecycle !== 'Deleted').length,
    [poles, pole.siteName]
  );

  const siteDevicesCount = useMemo(
    () => richDevices.filter((d) => d.siteName === pole.siteName).length,
    [richDevices, pole.siteName]
  );

  const siteSpansCount = useMemo(
    () => cableSpans.filter((s) => s.siteName === pole.siteName).length,
    [cableSpans, pole.siteName]
  );

  return (
    <section
      aria-label="Site details"
      className="rounded-xl border border-border bg-card overflow-hidden shadow-xs"
    >
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <Building2 className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Site ecosystem</h3>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          {sitePolesCount} poles
        </span>
      </div>

      <dl className="p-4 space-y-3.5 text-xs">
        <div>
          <dt className="text-[11px] text-muted-foreground mb-0.5">Site jurisdiction</dt>
          <dd className="text-sm font-semibold text-foreground">{pole.siteName}</dd>
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

        {/* Site Fleet Density & Quick Navigation */}
        <div className="pt-2 border-t border-border/60 space-y-2">
          <dt className="text-[11px] text-muted-foreground font-medium">Assets on this site</dt>
          <dd className="grid grid-cols-2 gap-2">
            <Link
              to={`/assets/inventory?site=${encodeURIComponent(pole.siteName)}`}
              className="p-2 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors flex items-center justify-between gap-1 group"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Cpu className="size-3.5 text-primary shrink-0" />
                <span className="text-[11px] text-foreground font-medium truncate">Devices</span>
              </div>
              <span className="text-[11px] font-mono font-semibold text-primary">
                {siteDevicesCount}
              </span>
            </Link>

            <Link
              to={`/assets/cable-spans?site=${encodeURIComponent(pole.siteName)}`}
              className="p-2 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors flex items-center justify-between gap-1 group"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Layers className="size-3.5 text-sky-400 shrink-0" />
                <span className="text-[11px] text-foreground font-medium truncate">Spans</span>
              </div>
              <span className="text-[11px] font-mono font-semibold text-sky-400">
                {siteSpansCount}
              </span>
            </Link>
          </dd>
        </div>
      </dl>
    </section>
  );
};
