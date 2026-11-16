import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Server,
  WifiOff,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import type { DeviceRecord } from '@/types/devices';
import type { ReportDateRange } from '@/types/reports';
import { computeDeviceMetrics } from '@/data/reportsSelectors';
import { ReportSection } from '../ReportSection';
import { formatAbsoluteMYT } from '@/lib/dateTime';

interface DeviceHealthReportProps {
  devices: DeviceRecord[];
  range: ReportDateRange;
  siteFilter: string;
}

export const DeviceHealthReport: React.FC<DeviceHealthReportProps> = ({
  devices,
  range,
  siteFilter,
}) => {
  const metrics = computeDeviceMetrics(devices, range, siteFilter);

  // Filter offline and stale devices
  const offlineOrStaleDevices = devices.filter(
    (d) => d.connectivityState === 'offline' || d.connectivityState === 'stale'
  );

  // Flapping devices: >= 3 connectivity state transitions
  const flappingDevices = devices
    .map((d) => ({
      device: d,
      transitions: (d.connectivityPeriods || []).length,
      periods: d.connectivityPeriods || [],
    }))
    .filter((item) => item.transitions >= 3)
    .sort((a, b) => b.transitions - a.transitions);

  // Firmware breakdown
  const firmwareList = Object.entries(metrics.softwareVersions).map(([version, count]) => ({
    version,
    count,
    percentage: metrics.devicesTotal > 0 ? Math.round((count / metrics.devicesTotal) * 100) : 0,
    isRecommended: version.includes('V1.6.5'),
  }));

  return (
    <div className="space-y-6">
      {/* 1. Fleet Availability & State Breakdown */}
      <ReportSection
        id="device-fleet-availability"
        title="Fleet Availability & Connectivity State"
        description="Active telemetry status and fleet uptime percentage across the selected monitoring period."
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-500 mb-1">
                <Activity className="size-3.5" />
                <span>Online Devices</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{metrics.byState.online}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {metrics.devicesTotal > 0
                  ? Math.round((metrics.byState.online / metrics.devicesTotal) * 100)
                  : 0}
                % of total fleet
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-xs font-medium text-rose-500 mb-1">
                <WifiOff className="size-3.5" />
                <span>Offline Devices</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{metrics.byState.offline}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {metrics.offlineHoursTotal} hrs accumulated offline
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-500 mb-1">
                <AlertTriangle className="size-3.5" />
                <span>Stale Contact (&gt;24h)</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{metrics.staleDevicesCount}</div>
              <div className="text-xs text-muted-foreground mt-1">No heartbeat in &gt; 24h</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-xs font-medium text-blue-500 mb-1">
                <Server className="size-3.5" />
                <span>Uninstalled / In Storage</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{metrics.notInstalled}</div>
              <div className="text-xs text-muted-foreground mt-1">Awaiting pole mounting</div>
            </div>
          </div>

          {/* Proportion Bar */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Fleet Connectivity Composition</span>
              <span className="font-semibold text-foreground">{metrics.devicesTotal} Total Units ({metrics.availabilityPercent}% Uptime)</span>
            </div>
            <div className="h-4 w-full bg-muted rounded-full overflow-hidden flex">
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
            <div className="flex flex-wrap items-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-sm bg-emerald-500" />
                <span className="text-foreground">Online ({metrics.byState.online})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-sm bg-rose-500" />
                <span className="text-foreground">Offline ({metrics.byState.offline})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-sm bg-amber-500" />
                <span className="text-foreground">Stale (&gt;24h) ({metrics.byState.stale})</span>
              </div>
            </div>
          </div>
        </div>
      </ReportSection>

      {/* 2. Devices Currently Offline or Stale */}
      <ReportSection
        id="offline-stale-devices"
        title="Offline & Stale Contact Audit"
        description="Critical hardware requiring field investigation, remote reboot, or power supply diagnostics."
      >
        {offlineOrStaleDevices.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <ShieldCheck className="size-10 mx-auto mb-2 text-emerald-500" />
            <p className="font-medium text-foreground">All monitoring devices are healthy</p>
            <p className="text-xs">No devices are currently offline or in stale contact status.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Device</th>
                  <th className="py-2.5 px-3 font-semibold">State</th>
                  <th className="py-2.5 px-3 font-semibold">Pole Placement</th>
                  <th className="py-2.5 px-3 font-semibold">Last Heartbeat (MYT)</th>
                  <th className="py-2.5 px-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {offlineOrStaleDevices.map((d) => (
                  <tr key={d.identifier} className="hover:bg-muted/50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-mono font-medium text-foreground">{d.identifier}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {d.manufacturer} {d.model}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          d.connectivityState === 'offline'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        <WifiOff className="size-3" />
                        {d.connectivityState.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {d.installedPoleId ? (
                        <Link
                          to={`/assets/poles/${d.installedPoleId}`}
                          className="font-mono text-primary hover:underline"
                        >
                          {d.installedPoleId}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground italic">Not installed</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {d.lastContactAt ? formatAbsoluteMYT(d.lastContactAt) : 'Never heard from'}
                    </td>
                    <td className="py-2.5 px-3">
                      <Link
                        to={`/assets/inventory/devices/${d.identifier}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                      >
                        <span>Diagnose</span>
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

      {/* 3. Flapping & Connectivity Instability */}
      <ReportSection
        id="flapping-devices"
        title="Connectivity Flapping & State Volatility"
        description="Devices exhibiting recurring disconnections or rapid transitions between Online and Offline states."
      >
        {flappingDevices.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No devices with frequent state flapping (≥ 3 transitions) detected in this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Device</th>
                  <th className="py-2.5 px-3 font-semibold">Transitions</th>
                  <th className="py-2.5 px-3 font-semibold">Current State</th>
                  <th className="py-2.5 px-3 font-semibold">Installed Pole</th>
                  <th className="py-2.5 px-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {flappingDevices.map((f) => (
                  <tr key={f.device.identifier} className="hover:bg-muted/50 transition-colors">
                    <td className="py-2.5 px-3">
                      <Link
                        to={`/assets/inventory/devices/${f.device.identifier}`}
                        className="font-mono font-medium text-primary hover:underline flex items-center gap-1.5"
                      >
                        {f.device.identifier}
                      </Link>
                      <div className="text-[10px] text-muted-foreground">{f.device.name}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <Clock className="size-3" />
                        {f.transitions} changes
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          f.device.connectivityState === 'online'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        {f.device.connectivityState}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">
                      {f.device.installedPoleId || 'Not installed'}
                    </td>
                    <td className="py-2.5 px-3">
                      <Link
                        to={`/assets/inventory/devices/${f.device.identifier}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View periods
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportSection>

      {/* 4. Software & Firmware Distribution */}
      <ReportSection
        id="firmware-distribution"
        title="Software & Firmware Compliance"
        description="Version distribution across edge devices. Highlights versions with known vulnerabilities or deprecations."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {firmwareList.map((fw) => (
            <div
              key={fw.version}
              className="p-4 rounded-xl border border-border bg-card space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="size-4 text-primary" />
                  <span className="font-mono text-sm font-bold text-foreground">{fw.version}</span>
                </div>
                {fw.isRecommended ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Standard Build
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Legacy Version
                  </span>
                )}
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Fleet Adoption</span>
                  <span>
                    {fw.count} devices ({fw.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    style={{ width: `${fw.percentage}%` }}
                    className={`h-full ${fw.isRecommended ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </ReportSection>
    </div>
  );
};
