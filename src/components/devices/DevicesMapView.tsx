import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPinOff,
  ChevronDown,
  ChevronRight,
  Radio,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeviceStateBadge } from '@/components/devices/DeviceStateBadge';
import { DeviceMapCanvas } from '@/components/devices/DeviceMapCanvas';
import { evaluateDeviceFreshness } from '@/data/deviceSelectors';
import { useUiMode } from '@/hooks/useUiMode';
import { cn } from '@/lib/utils';
import type { DeviceRecord } from '@/types/devices';
import type { SiteRecord, PoleLocation } from '@/types/assets';

export interface DevicesMapViewProps {
  devices: DeviceRecord[];
  sites: SiteRecord[];
  activeSiteFilter?: string;
  selectedDeviceId: string | null;
  onSelectDevice: (identifier: string | null) => void;
  onManageInstallation: (device: DeviceRecord) => void;
}

export const DevicesMapView: React.FC<DevicesMapViewProps> = ({
  devices,
  sites,
  activeSiteFilter,
  selectedDeviceId,
  onSelectDevice,
  onManageInstallation,
}) => {
  const navigate = useNavigate();
  const { isTablet, orientation, viewportWidth } = useUiMode();
  const isPortrait = (isTablet && orientation === 'portrait') || viewportWidth < 768;

  const [uninstalledExpanded, setUninstalledExpanded] = useState(true);

  const installedDevices = useMemo(
    () => devices.filter((d) => Boolean(d.installedOnPoleId && d.location)),
    [devices]
  );

  const uninstalledDevices = useMemo(
    () => devices.filter((d) => !d.installedOnPoleId || !d.location),
    [devices]
  );

  const mapCenter: PoleLocation = useMemo(() => {
    if (activeSiteFilter && activeSiteFilter !== 'ALL') {
      const matched = sites.find((s) => s.name === activeSiteFilter);
      if (matched?.centrePoint) return matched.centrePoint;
    }
    if (installedDevices.length > 0 && installedDevices[0].location) {
      return installedDevices[0].location;
    }
    return { lat: 2.92239, lng: 101.45717 };
  }, [activeSiteFilter, sites, installedDevices]);

  return (
    <div
      className={cn(
        'gap-4',
        isPortrait ? 'flex flex-col' : 'grid grid-cols-1 lg:grid-cols-12 items-start'
      )}
    >
      {/* 1. Interactive Satellite Map with Device Markers */}
      <div
        className={cn(
          'rounded-xl border border-border bg-card shadow-xs overflow-hidden',
          !isPortrait &&
            (uninstalledExpanded || uninstalledDevices.length > 0
              ? 'lg:col-span-8 xl:col-span-9'
              : 'lg:col-span-12')
        )}
      >
        <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Radio className="size-3.5 text-primary" />
              <span>{installedDevices.length} mapped devices</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-500" /> Online
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-slate-400" /> Stale
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-rose-500" /> Offline
            </span>
          </div>
        </div>

        <DeviceMapCanvas
          devices={devices}
          centerPoint={mapCenter}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={onSelectDevice}
          onOpenDevice={(id) => navigate(`/assets/devices/${id}`)}
          onConfigureDevice={(id) => navigate(`/assets/devices/${id}?tab=configuration`)}
          heightClassName={isPortrait ? 'h-[420px]' : 'h-[560px]'}
        />
      </div>

      {/* 2. Collapsible Not Installed (N) Side Panel */}
      <div
        className={cn(
          'rounded-xl border border-border bg-card shadow-xs overflow-hidden flex flex-col',
          !isPortrait && 'lg:col-span-4 xl:col-span-3 lg:max-h-[605px]'
        )}
      >
        <button
          type="button"
          onClick={() => setUninstalledExpanded((v) => !v)}
          aria-expanded={uninstalledExpanded}
          className="w-full px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <MapPinOff className="size-4 text-amber-500 shrink-0" />
            <span className="text-xs font-semibold text-foreground truncate">
              Not installed ({uninstalledDevices.length})
            </span>
          </div>
          {uninstalledExpanded ? (
            <ChevronDown className="size-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          )}
        </button>

        {uninstalledExpanded && (
          <div className="flex-1 overflow-y-auto divide-y divide-border/60 max-h-[540px]">
            {uninstalledDevices.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                All registered devices are mounted on a pole.
              </div>
            ) : (
              uninstalledDevices.map((d) => {
                const freshness = evaluateDeviceFreshness(d);
                return (
                  <div
                    key={d.identifier}
                    className="p-3 hover:bg-muted/30 transition-colors flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono font-bold text-foreground text-xs truncate">
                          {d.identifier}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                          {d.type}
                        </span>
                      </div>
                      <DeviceStateBadge
                        state={d.state}
                        showWarningChip={freshness.showWarningChip}
                      />
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      <span>Model: {d.model}</span>
                      <span className="mx-1.5">·</span>
                      <span>Serial: {d.serialNumber}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/assets/devices/${d.identifier}`)}
                        className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <ExternalLink className="size-3" />
                        <span>Details</span>
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => onManageInstallation(d)}
                        className="h-7 px-2.5 text-[11px] gap-1 font-semibold cursor-pointer bg-primary text-primary-foreground"
                      >
                        <Plus className="size-3" />
                        <span>Install on pole</span>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

