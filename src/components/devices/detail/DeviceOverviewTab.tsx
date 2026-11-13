import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Copy,
  Check,
  MapPin,
  MapPinOff,
  Radio,
  ExternalLink,
  Activity,
  Cpu,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { DeviceStateBadge } from '@/components/devices/DeviceStateBadge';
import { DeviceMapCanvas } from '@/components/devices/DeviceMapCanvas';
import {
  evaluateDeviceFreshness,
  computeAvailabilityMetrics,
} from '@/data/deviceSelectors';
import { formatCoordinates } from '@/lib/geo';
import { formatAbsoluteMYT } from '@/lib/dateTime';
import { useToast } from '@/contexts/ToastContext';
import type { DeviceRecord } from '@/types/devices';

export interface DeviceOverviewTabProps {
  device: DeviceRecord;
  onManageInstallation: () => void;
  onEdit: () => void;
}

export const DeviceOverviewTab: React.FC<DeviceOverviewTabProps> = ({
  device,
  onManageInstallation,
}) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const freshness = evaluateDeviceFreshness(device);
  const availability = useMemo(
    () => computeAvailabilityMetrics(device.connectivityHistory),
    [device.connectivityHistory]
  );

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    addToast('info', `Copied ${label} to clipboard.`);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const isMounted = Boolean(device.installedOnPoleId && device.location);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column (8 cols): Device Specs, Health, Availability, Vendor & Edge */}
      <div className="lg:col-span-8 space-y-6">
        {/* 1. Device Specifications Card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="border-b border-border/80 pb-2.5 flex items-center justify-between">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="size-3.5 text-primary" />
              <span>Device Specifications</span>
            </h2>
            <span className="text-[11px] text-muted-foreground font-mono">
              FALCON Registry
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-xs">
            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Identifier
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono font-bold text-foreground">
                  {device.identifier}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(device.identifier, 'Identifier')}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Copy identifier"
                >
                  {copiedKey === 'Identifier' ? (
                    <Check className="size-3 text-emerald-500" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Name
              </span>
              <span className="font-medium text-foreground block mt-0.5 truncate">
                {device.name}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Type
              </span>
              <span className="inline-flex mt-0.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                {device.type}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Manufacturer
              </span>
              <span className="font-medium text-foreground block mt-0.5">
                {device.manufacturer}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Model
              </span>
              <span className="font-mono text-foreground block mt-0.5 truncate">
                {device.model}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Serial Number
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono font-bold text-foreground truncate">
                  {device.serialNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(device.serialNumber, 'Serial')}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Copy serial"
                >
                  {copiedKey === 'Serial' ? (
                    <Check className="size-3 text-emerald-500" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Registered
              </span>
              <span className="text-muted-foreground block mt-0.5">
                Nov 3, 2026, 3:33 PM MYT
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Last Updated
              </span>
              <span className="text-muted-foreground block mt-0.5">
                {formatAbsoluteMYT(device.lastContactIso)}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Configuration
              </span>
              <span className="font-mono text-foreground block mt-0.5">
                {device.appliedConfigVersion || 'None applied'}
              </span>
            </div>

            <div className="sm:col-span-2 md:col-span-3 pt-2 border-t border-border/60">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block mb-1.5">
                Reported Components ({device.components?.length || 0})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {device.components && device.components.length > 0 ? (
                  device.components.map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[11px] bg-muted/60 border border-border text-foreground font-mono"
                    >
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">None recorded</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Health & Telemetry Card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="border-b border-border/80 pb-2.5 flex items-center justify-between">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="size-3.5 text-primary" />
              <span>Health & Live Telemetry</span>
            </h2>
            <DeviceStateBadge
              state={device.state}
              showWarningChip={freshness.showWarningChip}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Connectivity State
              </span>
              <span className="font-bold text-foreground block mt-0.5 capitalize">
                {device.state}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Last Contact
              </span>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="text-foreground font-medium block mt-0.5 cursor-help">
                      {freshness.relativeText}
                    </span>
                  }
                />
                <TooltipContent side="top">
                  {freshness.absoluteText}
                </TooltipContent>
              </Tooltip>
            </div>

            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Battery Level
              </span>
              <span className="text-muted-foreground block mt-0.5 italic">
                Not supported by this model
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Operating Temp
              </span>
              <span className="text-muted-foreground block mt-0.5 italic">
                Not supported by this model
              </span>
            </div>

            <div className="sm:col-span-2">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Firmware / Software Version
              </span>
              <span className="font-mono text-foreground block mt-0.5">
                {device.softwareVersion || 'V1.6.5 build 260514'}
              </span>
            </div>

            <div className="sm:col-span-2 flex items-center justify-end">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="h-8 gap-1.5 text-xs opacity-60 cursor-not-allowed"
                    >
                      <Radio className="size-3" />
                      <span>Run connection check</span>
                    </Button>
                  }
                />
                <TooltipContent side="top">
                  Telemetry check endpoint is not available on this tier.
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* 3. Availability Metrics Card (Strictly Computed from Stored Intervals) */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="border-b border-border/80 pb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Availability & Uptime Summary
              </h2>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="text-muted-foreground hover:text-foreground cursor-help">
                      <Info className="size-3.5" />
                    </span>
                  }
                />
                <TooltipContent side="top" className="max-w-xs text-xs">
                  {availability.computationBasis}
                </TooltipContent>
              </Tooltip>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              {availability.totalRecordsCount} telemetry periods
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Uptime
              </span>
              <span className="font-mono text-xl font-bold text-emerald-500 mt-1 block">
                {availability.onlinePercent}%
              </span>
            </div>

            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                State Changes
              </span>
              <span className="font-mono text-xl font-bold text-foreground mt-1 block">
                {availability.stateChangesCount}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Longest Offline
              </span>
              <span className="font-mono text-xl font-bold text-rose-500 mt-1 block">
                {availability.longestOfflineMinutes} min
              </span>
            </div>

            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Telemetry Periods
              </span>
              <span className="font-mono text-xl font-bold text-foreground mt-1 block">
                {availability.totalRecordsCount}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            {availability.computationBasis}
          </p>
        </div>

        {/* 4. Vendor and Edge Gateway Card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="border-b border-border/80 pb-2.5 flex items-center justify-between">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="size-3.5 text-primary" />
              <span>Vendor & Edge Gateway</span>
            </h2>
            <span className="text-[10px] uppercase font-semibold text-emerald-500 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500" /> Active Sync
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Driver Library
              </span>
              <span className="font-mono font-semibold text-foreground block mt-0.5">
                {device.library}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Vendor Device ID
              </span>
              <span className="font-mono text-foreground block mt-0.5">
                {device.vendorDeviceId || device.serialNumber}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Vendor State
              </span>
              <span className="text-emerald-500 font-semibold block mt-0.5">
                Online at Edge
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column (4 cols): Installation & Location Card */}
      <div className="lg:col-span-4 space-y-6 sticky top-6">
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="border-b border-border/80 pb-2.5 flex items-center justify-between">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="size-3.5 text-primary" />
              <span>Installation & Location</span>
            </h2>
            {isMounted ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                Mounted
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Unmounted
              </span>
            )}
          </div>

          {isMounted && device.location ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                  Mounted on Pole
                </span>
                <button
                  type="button"
                  onClick={() => navigate(`/assets/poles/${device.installedOnPoleId}`)}
                  className="font-mono font-bold text-primary hover:underline text-sm flex items-center gap-1 mt-0.5 cursor-pointer"
                >
                  <span>{device.installedOnPoleId}</span>
                  <ExternalLink className="size-3" />
                </button>
              </div>

              <div>
                <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                  Site Name
                </span>
                <span className="font-medium text-foreground block mt-0.5">
                  {device.siteName}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                  WGS84 Coordinates
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono text-foreground">
                    {formatCoordinates(device.location)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(formatCoordinates(device.location), 'Coordinates')}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Copy coordinates"
                  >
                    {copiedKey === 'Coordinates' ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Mini Satellite Map Preview */}
              <div className="rounded-lg overflow-hidden border border-border h-48">
                <DeviceMapCanvas
                  devices={[device]}
                  centerPoint={device.location}
                  zoomLevel={16}
                  heightClassName="h-48"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={onManageInstallation}
                className="w-full h-8.5 gap-1.5 text-xs font-medium cursor-pointer"
              >
                <MapPin className="size-3.5 text-primary" />
                <span>Change pole location</span>
              </Button>
            </div>
          ) : (
            /* Clean Unmounted State (Resolves Audit D13: No contradictory centre point) */
            <div className="py-8 px-4 text-center space-y-4">
              <div className="size-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <MapPinOff className="size-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  This device is not mounted on a pole
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Assigned site: <strong className="text-foreground">{device.siteName || 'Unassigned'}</strong>. No physical coordinates recorded.
                </p>
              </div>

              <Button
                onClick={onManageInstallation}
                className="h-8.5 px-4 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-sm"
              >
                <MapPin className="size-3.5" />
                <span>Install on a pole</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
