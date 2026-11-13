import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Battery,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  ExternalLink,
  Info,
  Link2,
  MapPin,
  Radar,
  Thermometer,
  Unplug,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DeviceMapCanvas } from './DeviceMapCanvas';
import {
  DeviceConfigBadge,
  DeviceConnectivityBadge,
  DeviceLifecycleBadge,
} from './DeviceStateBadge';
import {
  computeAvailabilitySummary,
  formatDeviceDurationMs,
  getLastContactFreshness,
} from '@/data/deviceSelectors';
import { formatAbsoluteMYT } from '@/lib/dateTime';
import { formatCoordinates } from '@/lib/geo';
import { useToast } from '@/contexts/ToastContext';
import { useAssets } from '@/contexts/AssetsContext';
import { cn } from '@/lib/utils';
import type { DevicePolicyConfig, DeviceWithRelations } from '@/types/devices';
import type { DevicePermissions } from '@/lib/permissions';
import type { DeviceDetailTabKey } from './DeviceDetailHeader';

export interface DeviceOverviewTabProps {
  device: DeviceWithRelations;
  policyConfig: DevicePolicyConfig;
  permissions: DevicePermissions;
  onSelectTab: (tab: DeviceDetailTabKey) => void;
  onManageInstallation: () => void;
  onRunConnectionCheck: () => void;
}

export const DeviceOverviewTab: React.FC<DeviceOverviewTabProps> = ({
  device,
  policyConfig,
  permissions,
  onSelectTab,
  onManageInstallation,
  onRunConnectionCheck,
}) => {
  const { addToast } = useToast();
  const { poles, cableSpans } = useAssets();
  const [availWindow, setAvailWindow] = useState<24 | 168>(24);

  const freshness = getLastContactFreshness(
    device.lastContactAt,
    device.connectivityState,
    policyConfig
  );

  const availability = useMemo(
    () => computeAvailabilitySummary(device.connectivityPeriods, availWindow),
    [device.connectivityPeriods, availWindow]
  );

  const poleLocationsById = useMemo(() => {
    const map = new Map<string, { lat: number; lng: number }>();
    for (const p of poles) {
      if (p.location) map.set(p.identifier, p.location);
    }
    return map;
  }, [poles]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left Main Cards (8 cols) */}
      <div className="lg:col-span-8 space-y-4">
        {/* 1. Device Definition Card */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Cpu className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Device specification</h2>
            </div>
            <DeviceLifecycleBadge lifecycle={device.lifecycle} />
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3.5 text-xs">
            <div>
              <dt className="text-muted-foreground text-[11px]">Identifier</dt>
              <dd className="font-mono font-semibold text-foreground mt-0.5">
                {device.identifier}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-[11px]">Manufacturer</dt>
              <dd className="font-medium text-foreground mt-0.5">{device.manufacturer}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-[11px]">Model</dt>
              <dd className="font-medium text-foreground mt-0.5">{device.model}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-[11px]">Serial number</dt>
              <dd className="font-mono text-foreground mt-0.5 flex items-center gap-1.5">
                <span>{device.serial}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(device.serial);
                    addToast('info', `Copied serial ${device.serial}`);
                  }}
                  title="Copy serial"
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Copy className="size-3" />
                </button>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-[11px]">Registered</dt>
              <dd className="font-mono text-foreground mt-0.5">
                {formatAbsoluteMYT(device.registeredAt, { showSeconds: false })}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-[11px]">Last updated</dt>
              <dd className="font-mono text-foreground mt-0.5">
                {formatAbsoluteMYT(device.lastUpdatedAt, { showSeconds: false })}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-[11px]">Configuration</dt>
              <dd className="mt-1">
                <DeviceConfigBadge
                  version={device.configVersion}
                  status={device.configStatus}
                  reportedAt={device.configReportedAt}
                />
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground text-[11px]">Components</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {device.components.length > 0 ? (
                  device.components.map((c, idx) => (
                    <span
                      key={`${c}-${idx}`}
                      className="px-2 py-0.5 rounded-md text-[11px] bg-muted border border-border text-foreground"
                    >
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground">None recorded</span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        {/* 2. Availability & Telemetry Summary Card (D5) */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Availability</h2>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="text-muted-foreground hover:text-foreground cursor-help">
                      <Info className="size-3.5" />
                    </span>
                  }
                />
                <TooltipContent className="max-w-xs text-xs leading-relaxed">
                  {availability.basisLabel}
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5 self-start">
              <button
                type="button"
                onClick={() => setAvailWindow(24)}
                className={cn(
                  'px-2.5 h-6 rounded text-[11px] font-medium cursor-pointer transition-colors',
                  availWindow === 24
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Last 24h
              </button>
              <button
                type="button"
                onClick={() => setAvailWindow(168)}
                className={cn(
                  'px-2.5 h-6 rounded text-[11px] font-medium cursor-pointer transition-colors',
                  availWindow === 168
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Last 7d
              </button>
            </div>
          </div>

          {availability.coveredMs === 0 ? (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              {availability.basisLabel}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Proportional Availability Bar */}
              <div className="h-3 w-full rounded-full overflow-hidden bg-muted flex">
                {availability.onlinePercent !== null && availability.onlinePercent > 0 && (
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${availability.onlinePercent}%` }}
                    title={`Online: ${availability.onlinePercent}%`}
                  />
                )}
                {availability.stalePercent !== null && availability.stalePercent > 0 && (
                  <div
                    className="bg-amber-500 h-full"
                    style={{ width: `${availability.stalePercent}%` }}
                    title={`Stale: ${availability.stalePercent}%`}
                  />
                )}
                {availability.offlinePercent !== null && availability.offlinePercent > 0 && (
                  <div
                    className="bg-red-500 h-full"
                    style={{ width: `${availability.offlinePercent}%` }}
                    title={`Offline: ${availability.offlinePercent}%`}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <span className="size-2 rounded-full bg-emerald-500" /> Online
                  </span>
                  <strong className="font-mono text-sm text-foreground">
                    {availability.onlinePercent}%
                  </strong>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <span className="size-2 rounded-full bg-amber-500" /> Stale
                  </span>
                  <strong className="font-mono text-sm text-foreground">
                    {availability.stalePercent}%
                  </strong>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <span className="size-2 rounded-full bg-red-500" /> Offline
                  </span>
                  <strong className="font-mono text-sm text-foreground">
                    {availability.offlinePercent}%
                  </strong>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">State changes</span>
                  <strong className="font-mono text-sm text-foreground">
                    {availability.transitionsCount}
                  </strong>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Longest offline</span>
                  <strong className="font-mono text-sm text-foreground">
                    {availability.longestOfflineMs > 0
                      ? formatDeviceDurationMs(availability.longestOfflineMs)
                      : 'None'}
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-muted-foreground">
                <span>{availability.basisLabel}</span>
                <button
                  type="button"
                  onClick={() => onSelectTab('history')}
                  className="text-primary hover:underline font-medium shrink-0 cursor-pointer"
                >
                  Inspect connectivity log →
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 3. Health & 4. Vendor and Edge Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Health</h2>
              </div>
              <DeviceConnectivityBadge state={device.connectivityState} />
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <dt className="text-muted-foreground text-[11px]">Last contact</dt>
                <dd className="mt-0.5 flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">{freshness.relative}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {freshness.absoluteMYT}
                  </span>
                </dd>
                {(freshness.isStaleByPolicy || freshness.isOldWhileOnline) && (
                  <p className="text-[11px] text-amber-500 mt-1">{freshness.tooltipSummary}</p>
                )}
              </div>
              <div>
                <dt className="text-muted-foreground text-[11px] flex items-center gap-1">
                  <Battery className="size-3" /> Battery
                </dt>
                <dd className="font-mono text-foreground mt-0.5">
                  {device.batteryPercent !== null ? `${device.batteryPercent}%` : 'No data'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-[11px] flex items-center gap-1">
                  <Thermometer className="size-3" /> Temperature
                </dt>
                <dd className="font-mono text-foreground mt-0.5">
                  {device.temperatureC !== null ? `${device.temperatureC} °C` : 'No data'}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground text-[11px]">Software</dt>
                <dd className="font-mono text-foreground mt-0.5">
                  {device.softwareVersion || 'Not reported'}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Radar className="size-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Vendor and Edge</h2>
              </div>
              {permissions.canRunConnectionCheck && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRunConnectionCheck}
                  className="h-7 px-2.5 text-[11px] gap-1 border-border hover:bg-muted cursor-pointer"
                >
                  <Activity className="size-3 text-primary" />
                  <span>Check now</span>
                </Button>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-muted-foreground text-[11px]">Library</dt>
                <dd className="font-mono font-medium text-foreground mt-0.5">{device.library}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-[11px]">Vendor device id</dt>
                <dd className="font-mono text-foreground mt-0.5">{device.vendorDeviceId}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground text-[11px]">Connection check</dt>
                <dd className="mt-0.5 flex items-center gap-1.5 text-foreground">
                  {device.connectionCheck.status === 'Pass' && (
                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  )}
                  {device.connectionCheck.status === 'Fail' && (
                    <AlertTriangle className="size-3.5 text-red-500 shrink-0" />
                  )}
                  <span>
                    {device.connectionCheck.message || device.connectionCheck.status}
                  </span>
                </dd>
                {device.connectionCheck.checkedAt && (
                  <span className="text-[11px] font-mono text-muted-foreground block mt-0.5">
                    Checked {formatAbsoluteMYT(device.connectionCheck.checkedAt, { showSeconds: false })}
                  </span>
                )}
              </div>
            </dl>

            {device.vendorConflict && (
              <div className="rounded-lg border border-red-500/35 bg-red-500/8 p-2.5 text-[11px] text-red-600 dark:text-red-400 flex items-center justify-between gap-2">
                <span>
                  Conflict with serial <strong className="font-mono">{device.vendorConflict.serial}</strong>
                </span>
                <Link
                  to="/assets/inventory/vendor-discovery"
                  className="font-semibold underline shrink-0"
                >
                  Resolve →
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Right Column: Installation & Location Mini-Map or Single Clear Empty State (4 cols) */}
      <aside className="lg:col-span-4 space-y-4">
        <section className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Installation & location</h2>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">
              {device.siteName || 'Unassigned'}
            </span>
          </div>

          {device.isInstalled && device.location ? (
            <div className="space-y-3">
              <DeviceMapCanvas
                devices={[device]}
                cableSpans={cableSpans}
                poleLocationsById={poleLocationsById}
                centerPoint={device.location}
                selectedDeviceId={device.identifier}
                showPopup={false}
                showSiteCentre={false}
                compactControls
                heightClassName="h-[240px]"
              />

              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Installed on</span>
                  <Link
                    to={`/assets/poles/${encodeURIComponent(device.installedPoleId!)}`}
                    className="font-mono font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>{device.installedPoleId}</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Coordinates</span>
                  <button
                    type="button"
                    onClick={() => {
                      const txt = formatCoordinates(device.location);
                      navigator.clipboard?.writeText(txt);
                      addToast('info', `Copied ${txt}`);
                    }}
                    className="font-mono text-foreground hover:text-primary flex items-center gap-1 cursor-pointer"
                    title="Copy coordinates"
                  >
                    <span>{formatCoordinates(device.location)}</span>
                    <Copy className="size-3 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {permissions.canManageInstallation && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onManageInstallation}
                  className="w-full h-8 text-xs gap-1.5 border-border hover:bg-muted cursor-pointer"
                >
                  <Link2 className="size-3.5 text-primary" />
                  <span>Manage installation</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center space-y-3">
              <Unplug className="size-8 text-muted-foreground/70 mx-auto" />
              <div className="space-y-1">
                <div className="text-xs font-semibold text-foreground">
                  Not installed on a pole
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {device.siteName
                    ? `Assigned to ${device.siteName}, but no physical pole is linked yet. Coordinates appear after mounting.`
                    : 'Site is Unassigned and no pole is linked yet. Coordinates appear once installed on a located pole.'}
                </p>
              </div>
              {permissions.canManageInstallation && (
                <Button
                  size="sm"
                  onClick={onManageInstallation}
                  className="h-8 px-3 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                >
                  <Link2 className="size-3.5" />
                  <span>Install on a pole</span>
                </Button>
              )}
            </div>
          )}
        </section>
      </aside>
    </div>
  );
};
