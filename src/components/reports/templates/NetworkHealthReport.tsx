import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Server,
  WifiOff,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Clock,
  Camera,
  Volume2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { DeviceRecord } from '@/types/devices';
import type { ReportDateRange } from '@/types/reports';
import { computeDeviceMetrics } from '@/data/reportsSelectors';
import { ReportSection } from '../ReportSection';
import { formatAbsoluteMYT } from '@/lib/dateTime';

export interface NetworkHealthReportProps {
  devices: DeviceRecord[];
  range: ReportDateRange;
  siteFilter: string;
}

export const NetworkHealthReport: React.FC<NetworkHealthReportProps> = ({
  devices,
  range,
  siteFilter,
}) => {
  const metrics = useMemo(() => {
    return computeDeviceMetrics(devices, range, siteFilter);
  }, [devices, range, siteFilter]);

  // Scoped device list matching siteFilter
  const scopedDevices = useMemo(() => {
    if (!siteFilter || siteFilter === 'All sites') return devices;
    return devices.filter((d) => d.siteName === siteFilter);
  }, [devices, siteFilter]);

  // 1. Group by Device Type (Cameras vs Speakers)
  const typeBreakdown = useMemo(() => {
    const cameras = scopedDevices.filter(
      (d) => d.type === 'Camera' || d.identifier.startsWith('CAM-')
    );
    const speakers = scopedDevices.filter(
      (d) => d.type === 'Speaker' || d.identifier.startsWith('SPK-')
    );
    const other = scopedDevices.filter(
      (d) => !cameras.includes(d) && !speakers.includes(d)
    );

    const getStats = (list: DeviceRecord[]) => {
      const total = list.length;
      const online = list.filter((d) => d.connectivityState === 'online').length;
      const offline = list.filter((d) => d.connectivityState === 'offline').length;
      const stale = list.filter((d) => d.connectivityState === 'stale').length;
      const uptime = total > 0 ? Math.round((online / total) * 1000) / 10 : 100;
      return { total, online, offline, stale, uptime };
    };

    return {
      cameras: getStats(cameras),
      speakers: getStats(speakers),
      other: getStats(other),
    };
  }, [scopedDevices]);

  // 2. Flapping devices: >= 2 transitions
  const flappingDevices = useMemo(() => {
    return scopedDevices
      .map((d) => ({
        device: d,
        transitions: (d.connectivityPeriods || []).length,
        periods: d.connectivityPeriods || [],
      }))
      .filter((item) => item.transitions >= 2)
      .sort((a, b) => b.transitions - a.transitions);
  }, [scopedDevices]);

  // 3. Stale / offline devices (top 10 for audit table)
  const offlineOrStaleDevices = useMemo(() => {
    return scopedDevices
      .filter((d) => d.connectivityState === 'offline' || d.connectivityState === 'stale')
      .sort((a, b) => {
        // Offline first, then stale
        if (a.connectivityState === 'offline' && b.connectivityState !== 'offline') return -1;
        if (b.connectivityState === 'offline' && a.connectivityState !== 'offline') return 1;
        const timeA = a.lastContactAt ? new Date(a.lastContactAt).getTime() : 0;
        const timeB = b.lastContactAt ? new Date(b.lastContactAt).getTime() : 0;
        return timeA - timeB;
      });
  }, [scopedDevices]);

  const topOfflineOrStaleDevices = useMemo(() => {
    return offlineOrStaleDevices.slice(0, 10);
  }, [offlineOrStaleDevices]);

  // 4. Firmware list
  const firmwareList = useMemo(() => {
    return Object.entries(metrics.softwareVersions).map(([version, count]) => ({
      version,
      count,
      percentage: metrics.devicesTotal > 0 ? Math.round((count / metrics.devicesTotal) * 100) : 0,
      isRecommended: version.includes('V1.6.5') || version.includes('v2.') || version.includes('1.6'),
    }));
  }, [metrics]);

  return (
    <div className="space-y-6">
      {/* SECTION 1: Availability by Device Type */}
      <ReportSection
        id="section-availability-type"
        title="Availability by Device Type"
        description="Comparative uptime and operational connectivity split across optical camera sensors and IP acoustic speakers."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cameras Card */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <Camera className="size-4 text-primary" />
                  <span>Optical Surveillance Cameras</span>
                </div>
                <span className="font-mono text-sm font-bold text-emerald-500">
                  {typeBreakdown.cameras.uptime}% Uptime
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-lg bg-card border border-border/60">
                  <span className="text-[11px] text-muted-foreground block">Online</span>
                  <span className="text-lg font-bold font-mono text-emerald-500">
                    {typeBreakdown.cameras.online}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    / {typeBreakdown.cameras.total} units
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-card border border-border/60">
                  <span className="text-[11px] text-muted-foreground block">Offline</span>
                  <span className="text-lg font-bold font-mono text-rose-500">
                    {typeBreakdown.cameras.offline}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">unreachable</span>
                </div>
                <div className="p-2.5 rounded-lg bg-card border border-border/60">
                  <span className="text-[11px] text-muted-foreground block">Stale (&gt;24h)</span>
                  <span className="text-lg font-bold font-mono text-amber-500">
                    {typeBreakdown.cameras.stale}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">old heartbeat</span>
                </div>
              </div>
            </div>

            {/* Speakers Card */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <Volume2 className="size-4 text-blue-500" />
                  <span>IP Audio / Deterrence Speakers</span>
                </div>
                <span className="font-mono text-sm font-bold text-emerald-500">
                  {typeBreakdown.speakers.uptime}% Uptime
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-lg bg-card border border-border/60">
                  <span className="text-[11px] text-muted-foreground block">Online</span>
                  <span className="text-lg font-bold font-mono text-emerald-500">
                    {typeBreakdown.speakers.online}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    / {typeBreakdown.speakers.total} units
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-card border border-border/60">
                  <span className="text-[11px] text-muted-foreground block">Offline</span>
                  <span className="text-lg font-bold font-mono text-rose-500">
                    {typeBreakdown.speakers.offline}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">unreachable</span>
                </div>
                <div className="p-2.5 rounded-lg bg-card border border-border/60">
                  <span className="text-[11px] text-muted-foreground block">Stale (&gt;24h)</span>
                  <span className="text-lg font-bold font-mono text-amber-500">
                    {typeBreakdown.speakers.stale}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">old heartbeat</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fleet Connectivity Composition Bar */}
          <div className="p-4 rounded-xl border border-border/60 bg-card space-y-2.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Overall Fleet Connectivity Distribution</span>
              <span className="font-semibold text-foreground">
                {metrics.devicesTotal} Total Units ({metrics.availabilityPercent}% Availability)
              </span>
            </div>
            <div className="h-3.5 w-full bg-muted rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${metrics.devicesTotal > 0 ? (metrics.byState.online / metrics.devicesTotal) * 100 : 0}%`,
                }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title={`Online: ${metrics.byState.online}`}
              />
              <div
                style={{
                  width: `${metrics.devicesTotal > 0 ? (metrics.byState.offline / metrics.devicesTotal) * 100 : 0}%`,
                }}
                className="bg-rose-500 h-full transition-all duration-500"
                title={`Offline: ${metrics.byState.offline}`}
              />
              <div
                style={{
                  width: `${metrics.devicesTotal > 0 ? (metrics.byState.stale / metrics.devicesTotal) * 100 : 0}%`,
                }}
                className="bg-amber-500 h-full transition-all duration-500"
                title={`Stale: ${metrics.byState.stale}`}
              />
            </div>
            <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-emerald-500" />
                <span className="text-foreground">Online ({metrics.byState.online})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-rose-500" />
                <span className="text-foreground">Offline ({metrics.byState.offline})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-amber-500" />
                <span className="text-foreground">Stale &gt;24h ({metrics.byState.stale})</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto text-[11px]">
                <Server className="size-3 text-muted-foreground" />
                <span>{metrics.notInstalled} not installed on pole</span>
              </div>
            </div>
          </div>
        </div>
      </ReportSection>

      {/* SECTION 2: Devices That Keep Changing State (Flapping) */}
      <ReportSection
        id="section-flapping-analysis"
        title="Devices That Keep Changing State (Flapping Analysis)"
        description="Hardware units experiencing multiple connectivity state changes or frequent flapping cycles."
      >
        {flappingDevices.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground rounded-lg border border-border/60 bg-muted/10">
            No devices with frequent state flapping (≥ 2 transitions) detected in this period.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground">
                  <th className="py-2.5 px-3 font-semibold">Device</th>
                  <th className="py-2.5 px-3 font-semibold">Transitions</th>
                  <th className="py-2.5 px-3 font-semibold">Current State</th>
                  <th className="py-2.5 px-3 font-semibold">Installed Pole</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {flappingDevices.map((f) => (
                  <tr key={f.device.identifier} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-3">
                      <Link
                        to={`/assets/inventory/devices/${f.device.identifier}`}
                        className="font-mono font-semibold text-primary hover:underline"
                      >
                        {f.device.identifier}
                      </Link>
                      <div className="text-[11px] text-muted-foreground">{f.device.name}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono">
                        <Clock className="size-3" />
                        {f.transitions} changes
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                          f.device.connectivityState === 'online'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : f.device.connectivityState === 'offline'
                            ? 'bg-rose-500/10 text-rose-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}
                      >
                        {f.device.connectivityState}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">
                      {f.device.installedPoleId ? (
                        <Link
                          to={`/assets/poles/${f.device.installedPoleId}`}
                          className="hover:underline text-foreground"
                        >
                          {f.device.installedPoleId}
                        </Link>
                      ) : (
                        <span className="italic text-muted-foreground">Not installed</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/assets/inventory/devices/${f.device.identifier}?tab=history`}
                        className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                      >
                        <span>History</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportSection>

      {/* SECTION 3: Last Contact Audit */}
      <ReportSection
        id="section-last-contact"
        title="Last Contact Audit (Offline & Stale Devices)"
        description="Physical edge hardware requiring power cycle diagnostics, solar check, or physical maintenance dispatch."
        viewAllLink={{
          label: `View all ${offlineOrStaleDevices.length} offline devices in Inventory`,
          href: '/assets/inventory?status=offline',
        }}
        topLimitNotice="Showing top 10 offline & stale contact devices."
      >
        {topOfflineOrStaleDevices.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground rounded-lg border border-border/60 bg-muted/10">
            <ShieldCheck className="size-8 mx-auto mb-2 text-emerald-500" />
            <p className="font-semibold text-foreground text-xs">All monitoring devices are healthy</p>
            <p className="text-[11px]">No devices are currently offline or in stale contact status.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground">
                  <th className="py-2.5 px-3 font-semibold">Device</th>
                  <th className="py-2.5 px-3 font-semibold">Type</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Pole Placement</th>
                  <th className="py-2.5 px-3 font-semibold">Last Heartbeat (MYT)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {topOfflineOrStaleDevices.map((d) => (
                  <tr key={d.identifier} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-mono font-semibold text-foreground">{d.identifier}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {d.manufacturer} {d.model}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground font-medium">
                      {d.type || 'Camera'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          d.connectivityState === 'offline'
                            ? 'bg-rose-500/10 text-rose-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}
                      >
                        <WifiOff className="size-3" />
                        {d.connectivityState}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {d.installedPoleId ? (
                        <Link
                          to={`/assets/poles/${d.installedPoleId}`}
                          className="text-foreground hover:underline"
                        >
                          {d.installedPoleId}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground italic">Not installed</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">
                      {d.lastContactAt ? formatAbsoluteMYT(d.lastContactAt) : 'Never received'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/assets/inventory/devices/${d.identifier}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportSection>

      {/* SECTION 4: Software and Configuration Sync Status */}
      <ReportSection
        id="section-firmware-sync"
        title="Software & Configuration Sync Status"
        description="Edge firmware compliance and configuration push status across active surveillance assets."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Firmware Distribution */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
            <span className="font-semibold text-foreground text-xs block">
              Firmware Version Compliance
            </span>
            <div className="space-y-2.5">
              {firmwareList.map((fw) => (
                <div
                  key={fw.version}
                  className="p-3 rounded-lg border border-border/60 bg-card space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
                      <Cpu className="size-3.5 text-primary" />
                      <span>{fw.version}</span>
                    </div>
                    {fw.isRecommended ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="size-3" />
                        Standard Build
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-500/10 text-amber-500 flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        Upgrade Recommended
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                      <span>Adoption</span>
                      <span className="font-mono">
                        {fw.count} devices ({fw.percentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        style={{ width: `${fw.percentage}%` }}
                        className={`h-full ${fw.isRecommended ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Config Status */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
            <span className="font-semibold text-foreground text-xs block">
              Edge Configuration Push Status
            </span>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-lg bg-card border border-border/60 space-y-1">
                <span className="text-muted-foreground text-[11px]">Applied (Synced)</span>
                <div className="text-xl font-bold font-mono text-emerald-500">
                  {metrics.configStatus.Applied || 0}
                </div>
                <span className="text-[10px] text-muted-foreground">Configuration verified</span>
              </div>

              <div className="p-3 rounded-lg bg-card border border-border/60 space-y-1">
                <span className="text-muted-foreground text-[11px]">Pending Sync</span>
                <div className="text-xl font-bold font-mono text-amber-500">
                  {metrics.configStatus.Pending || 0}
                </div>
                <span className="text-[10px] text-muted-foreground">Queued for next contact</span>
              </div>

              <div className="p-3 rounded-lg bg-card border border-border/60 space-y-1">
                <span className="text-muted-foreground text-[11px]">Failed / Conflict</span>
                <div className="text-xl font-bold font-mono text-rose-500">
                  {metrics.configStatus.Failed || 0}
                </div>
                <span className="text-[10px] text-muted-foreground">Push rejected by device</span>
              </div>

              <div className="p-3 rounded-lg bg-card border border-border/60 space-y-1">
                <span className="text-muted-foreground text-[11px]">Unmanaged / Default</span>
                <div className="text-xl font-bold font-mono text-muted-foreground">
                  {metrics.configStatus.None || 0}
                </div>
                <span className="text-[10px] text-muted-foreground">No schema template assigned</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/assets/inventory"
                className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                <span>Manage device configurations in Assets &amp; Devices</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>
      </ReportSection>
    </div>
  );
};
