import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Unplug,
  ChevronDown,
  ChevronRight,
  Cpu,
  MapPin,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeviceMapCanvas } from './DeviceMapCanvas';
import { DeviceConnectivityBadge, DeviceTypeBadge } from './DeviceStateBadge';
import { useUiMode } from '@/hooks/useUiMode';
import { cn } from '@/lib/utils';
import type {
  DevicePolicyConfig,
  DeviceWithRelations,
} from '@/types/devices';
import type {
  CableSpanRecord,
  PoleLocation,
  PoleWithRelations,
  SiteRecord,
} from '@/types/assets';
import type { DevicePermissions } from '@/lib/permissions';

export interface DevicesMapViewProps {
  devices: DeviceWithRelations[];
  poles: PoleWithRelations[];
  cableSpans: CableSpanRecord[];
  sites: SiteRecord[];
  activeSiteFilter?: string;
  selectedDeviceId: string | null;
  onSelectDevice: (identifier: string | null) => void;
  onManageInstallation: (device: DeviceWithRelations) => void;
  policyConfig: DevicePolicyConfig;
  permissions: DevicePermissions;
}

export const DevicesMapView: React.FC<DevicesMapViewProps> = ({
  devices,
  poles,
  cableSpans,
  sites,
  activeSiteFilter,
  selectedDeviceId,
  onSelectDevice,
  onManageInstallation,
  policyConfig,
  permissions,
}) => {
  const navigate = useNavigate();
  const { isTablet, orientation, viewportWidth } = useUiMode();
  const isPortrait = (isTablet && orientation === 'portrait') || viewportWidth < 768;

  const [notInstalledExpanded, setNotInstalledExpanded] = useState(true);

  const locatedDevices = useMemo(() => devices.filter((d) => Boolean(d.location)), [devices]);
  const notInstalledDevices = useMemo(() => devices.filter((d) => !d.isInstalled), [devices]);

  const poleLocationsById = useMemo(() => {
    const map = new Map<string, PoleLocation>();
    for (const p of poles) {
      if (p.location) map.set(p.identifier, p.location);
    }
    return map;
  }, [poles]);

  const mapCenter = useMemo(() => {
    if (activeSiteFilter && activeSiteFilter !== 'ALL' && activeSiteFilter !== 'Unassigned') {
      const matched = sites.find((s) => s.name === activeSiteFilter);
      if (matched?.centrePoint) return matched.centrePoint;
    }
    if (locatedDevices.length > 0 && locatedDevices[0].location) {
      return locatedDevices[0].location;
    }
    return { lat: 2.92239, lng: 101.45717 };
  }, [activeSiteFilter, sites, locatedDevices]);

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
          !isPortrait && (notInstalledExpanded || notInstalledDevices.length > 0 ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12')
        )}
      >
        <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Cpu className="size-3.5 text-primary" />
              <span>{locatedDevices.length} mapped devices</span>
            </span>
            <span className="text-muted-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5 text-sky-400" />
              <span>{notInstalledDevices.length} not installed on poles</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-500" /> Online
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-amber-500" /> Stale
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-red-500" /> Offline
            </span>
          </div>
        </div>

        <DeviceMapCanvas
          devices={locatedDevices}
          cableSpans={cableSpans}
          poleLocationsById={poleLocationsById}
          centerPoint={mapCenter}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={onSelectDevice}
          onOpenDevice={(id) => navigate(`/assets/inventory/devices/${encodeURIComponent(id)}`)}
          onConfigureDevice={(id) =>
            navigate(`/assets/inventory/devices/${encodeURIComponent(id)}?tab=configuration`)
          }
          policyConfig={policyConfig}
          heightClassName={isPortrait ? 'h-[420px]' : 'h-[560px]'}
        />
      </div>

      {/* Collapsible Not Installed (N) Panel */}
      <div
        className={cn(
          'rounded-xl border border-border bg-card shadow-xs overflow-hidden flex flex-col',
          !isPortrait && 'lg:col-span-4 xl:col-span-3 lg:max-h-[605px]'
        )}
      >
        <button
          type="button"
          onClick={() => setNotInstalledExpanded((e) => !e)}
          className="w-full px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between text-left cursor-pointer hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Unplug className="size-4 text-amber-500 shrink-0" />
            <div>
              <h3 className="text-xs font-semibold text-foreground">
                Not installed ({notInstalledDevices.length})
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Hidden from map until mounted on a pole
              </p>
            </div>
          </div>
          {notInstalledExpanded ? (
            <ChevronDown className="size-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          )}
        </button>

        {notInstalledExpanded && (
          <div className="divide-y divide-border/60 overflow-y-auto flex-1">
            {notInstalledDevices.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                All filtered devices are installed on poles with map coordinates.
              </div>
            ) : (
              notInstalledDevices.map((d) => (
                <div key={d.identifier} className="p-3.5 space-y-2 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        to={`/assets/inventory/devices/${encodeURIComponent(d.identifier)}`}
                        className="font-mono text-xs font-semibold text-primary hover:underline block truncate"
                      >
                        {d.identifier}
                      </Link>
                      <span className="text-[11px] text-muted-foreground block truncate">
                        {d.model} · {d.siteName || 'Unassigned'}
                      </span>
                    </div>
                    <DeviceConnectivityBadge state={d.connectivityState} />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <DeviceTypeBadge type={d.type} />
                    {permissions.canManageInstallation && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onManageInstallation(d)}
                        className="h-7 px-2.5 text-[11px] gap-1 border-border hover:bg-muted cursor-pointer"
                      >
                        <Link2 className="size-3 text-primary" />
                        <span>Install on a pole</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

