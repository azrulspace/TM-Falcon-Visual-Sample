import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPinOff,
  ChevronDown,
  ChevronRight,
  Navigation,
  MapPin,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PoleMapCanvas } from './PoleMapCanvas';
import { useUiMode } from '@/hooks/useUiMode';
import { cn } from '@/lib/utils';
import type { PoleWithRelations, CableSpanRecord, SiteRecord } from '@/types/assets';
import type { PolePermissions } from '@/lib/permissions';

export interface PolesMapViewProps {
  poles: PoleWithRelations[];
  cableSpans: CableSpanRecord[];
  sites: SiteRecord[];
  activeSiteFilter?: string;
  selectedPoleId: string | null;
  onSelectPole: (identifier: string | null) => void;
  onRelocate: (pole: PoleWithRelations) => void;
  permissions: PolePermissions;
}

export const PolesMapView: React.FC<PolesMapViewProps> = ({
  poles,
  cableSpans,
  sites,
  activeSiteFilter,
  selectedPoleId,
  onSelectPole,
  onRelocate,
  permissions,
}) => {
  const navigate = useNavigate();
  const { isTablet, orientation, viewportWidth } = useUiMode();
  const isPortrait = (isTablet && orientation === 'portrait') || viewportWidth < 768;

  const [unlocatedExpanded, setUnlocatedExpanded] = useState(true);

  const locatedPoles = useMemo(() => poles.filter((p) => Boolean(p.location)), [poles]);
  const unlocatedPoles = useMemo(() => poles.filter((p) => !p.location), [poles]);

  const mapCenter = useMemo(() => {
    if (activeSiteFilter && activeSiteFilter !== 'ALL') {
      const matched = sites.find((s) => s.name === activeSiteFilter);
      if (matched?.centrePoint) return matched.centrePoint;
    }
    if (locatedPoles.length > 0 && locatedPoles[0].location) {
      return locatedPoles[0].location;
    }
    return { lat: 2.92239, lng: 101.45717 };
  }, [activeSiteFilter, sites, locatedPoles]);

  return (
    <div
      className={cn(
        'gap-4',
        isPortrait ? 'flex flex-col' : 'grid grid-cols-1 lg:grid-cols-12 items-start'
      )}
    >
      {/* Interactive Satellite Map */}
      <div
        className={cn(
          'rounded-xl border border-border bg-card shadow-xs overflow-hidden',
          !isPortrait && (unlocatedExpanded || unlocatedPoles.length > 0 ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12')
        )}
      >
        <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5 text-primary" />
              <span>{locatedPoles.length} mapped poles</span>
            </span>
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Layers className="size-3.5 text-sky-400" />
              <span>{cableSpans.length} cable spans</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-status-online" /> Active
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-status-warning" /> Maintenance
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-status-info" /> Planned
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-status-stale" /> Inactive
            </span>
          </div>
        </div>

        <PoleMapCanvas
          poles={locatedPoles}
          cableSpans={cableSpans}
          centerPoint={mapCenter}
          selectedPoleId={selectedPoleId}
          onSelectPole={onSelectPole}
          onOpenPole={(id) => navigate(`/assets/poles/${encodeURIComponent(id)}`)}
          onRelocatePole={onRelocate}
          heightClassName={isPortrait ? 'h-[420px]' : 'h-[560px]'}
        />
      </div>

      {/* Collapsible Without Location (N) Panel / Drawer */}
      <div
        className={cn(
          'rounded-xl border border-border bg-card shadow-xs overflow-hidden flex flex-col',
          !isPortrait && 'lg:col-span-4 xl:col-span-3 lg:max-h-[605px]'
        )}
      >
        <button
          type="button"
          onClick={() => setUnlocatedExpanded((v) => !v)}
          aria-expanded={unlocatedExpanded}
          className="w-full px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <MapPinOff className="size-4 text-status-warning shrink-0" />
            <span className="text-xs font-semibold text-foreground truncate">
              Without location ({unlocatedPoles.length})
            </span>
          </div>
          {unlocatedExpanded ? (
            <ChevronDown className="size-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          )}
        </button>

        {unlocatedExpanded && (
          <>
            <div className="px-4 py-2 border-b border-border bg-muted/10 text-[11px] text-muted-foreground">
              Records without coordinates appear here only.
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border max-h-[480px]">
              {unlocatedPoles.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Every matching pole has coordinates recorded.
                </div>
              ) : (
                unlocatedPoles.map((pole) => (
                  <div
                    key={pole.identifier}
                    className="p-3 hover:bg-muted/30 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/assets/poles/${encodeURIComponent(pole.identifier)}`)
                        }
                        className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer truncate block"
                      >
                        {pole.identifier}
                      </button>
                      <div className="flex items-center gap-1.5 mt-1">
                        <StatusBadge status={pole.lifecycle} size="sm" />
                        <span className="text-[10px] text-muted-foreground truncate">
                          {pole.siteName}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!permissions.canRelocate}
                      onClick={() => onRelocate(pole)}
                      className={cn(
                        'gap-1 shrink-0 cursor-pointer',
                        isTablet ? 'h-11 px-3 text-xs' : 'h-7 px-2 text-[11px]'
                      )}
                    >
                      <Navigation className="size-3" />
                      <span>Add location</span>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
