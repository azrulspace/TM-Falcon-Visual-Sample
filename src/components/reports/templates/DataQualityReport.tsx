import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Sparkles,
  MapPinOff,
  WifiOff,
  CheckCircle2,
} from 'lucide-react';
import type { DeviceRecord } from '@/types/devices';
import type { PoleRecord } from '@/types/assets';
import type { FalconEvent } from '@/data/events';
import type { ReportDateRange, ReportParameters } from '@/types/reports';
import { computeDataQualityMetrics } from '@/data/reportsSelectors';
import { ReportSection } from '../ReportSection';
import {
  INITIAL_VENDOR_DISCOVERY_RECORDS,
  INITIAL_VENDOR_SYNC_SUMMARY,
} from '@/data/devicesRegistry';
import { formatAbsoluteMYT } from '@/lib/dateTime';

interface DataQualityReportProps {
  devices: DeviceRecord[];
  poles: PoleRecord[];
  events: FalconEvent[];
  range: ReportDateRange;
  parameters: ReportParameters;
}

export const DataQualityReport: React.FC<DataQualityReportProps> = ({
  devices,
  poles,
  events,
}) => {
  const dataQuality = computeDataQualityMetrics(
    devices,
    poles,
    events,
    INITIAL_VENDOR_DISCOVERY_RECORDS,
    INITIAL_VENDOR_SYNC_SUMMARY
  );

  // Vendor conflict records
  const vendorConflicts = INITIAL_VENDOR_DISCOVERY_RECORDS.filter(
    (r) => r.matchStatus === 'Conflict'
  );

  // Stale contact devices marked online
  const now = new Date().getTime();
  const onlineStaleDevices = devices.filter((d) => {
    if (d.connectivityState !== 'online') return false;
    if (!d.lastContactAt) return true;
    const contactMs = new Date(d.lastContactAt).getTime();
    return now - contactMs > 24 * 3600 * 1000;
  });

  // Poles without location
  const unlocatedPoles = poles.filter((p) => p.lifecycle !== 'Deleted' && !p.location);

  return (
    <div className="space-y-6">
      {/* 1. Data Integrity & Trust Scorecard */}
      <ReportSection
        id="data-quality-scorecard"
        title="Data Trust & System Health Scorecard"
        description="Comprehensive audit of vendor synchronization freshness, record discrepancies, unlocated assets, and simulation share."
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-xs font-medium text-primary mb-1">
                <RefreshCw className="size-3.5" />
                <span>Vendor Sync Freshness</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {dataQuality.vendorSyncAgeMinutes} min ago
              </div>
              <div className="text-xs text-muted-foreground mt-1">Edge telemetry feed</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-xs font-medium text-rose-500 mb-1">
                <ShieldAlert className="size-3.5" />
                <span>Vendor Conflicts</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{dataQuality.vendorConflicts}</div>
              <div className="text-xs text-muted-foreground mt-1">Serial-to-ID collision</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-500 mb-1">
                <WifiOff className="size-3.5" />
                <span>Online-Stale Contradictions</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{onlineStaleDevices.length}</div>
              <div className="text-xs text-muted-foreground mt-1">No contact in &gt; 24h</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-xs font-medium text-purple-500 mb-1">
                <MapPinOff className="size-3.5" />
                <span>Unlocated Poles</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{unlocatedPoles.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Missing GPS coordinates</div>
            </div>
          </div>

          {/* Simulated vs Real Data Share Banner */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-foreground font-semibold flex items-center gap-1.5">
                <Sparkles className="size-4 text-purple-400" />
                <span>Data Source Breakdown (Real Edge vs Simulation)</span>
              </span>
              <span className="font-mono text-foreground font-bold">
                {dataQuality.simulatedShare}% Simulated
              </span>
            </div>
            <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
              <div
                style={{ width: `${100 - dataQuality.simulatedShare}%` }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title={`Edge Production: ${100 - dataQuality.simulatedShare}%`}
              />
              <div
                style={{ width: `${dataQuality.simulatedShare}%` }}
                className="bg-purple-500 h-full transition-all duration-500"
                title={`Simulated: ${dataQuality.simulatedShare}%`}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{100 - dataQuality.simulatedShare}% Real telemetry and camera feeds</span>
              <span>{dataQuality.simulatedShare}% Synthetic incidents and stress models</span>
            </div>
          </div>
        </div>
      </ReportSection>

      {/* 2. Vendor Discovery Conflicts Audit */}
      <ReportSection
        id="vendor-conflicts-audit"
        title="Vendor Discovery Serial Conflicts"
        description="Edge vendor records where device serial matches a different FALCON identifier or library driver."
      >
        {vendorConflicts.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            <CheckCircle2 className="size-8 mx-auto mb-2 text-emerald-500" />
            <p className="font-medium text-foreground">Zero Vendor Conflicts</p>
            <p>All vendor hardware records cleanly map to FALCON device registry.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Vendor Serial</th>
                    <th className="py-2.5 px-3 font-semibold">Vendor Device Name</th>
                    <th className="py-2.5 px-3 font-semibold">FALCON Target</th>
                    <th className="py-2.5 px-3 font-semibold">Conflict Description</th>
                    <th className="py-2.5 px-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {vendorConflicts.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                        {c.serial}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        <div>{c.vendorName}</div>
                        <div className="text-[10px]">{c.model}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-primary">
                        {c.matchedFalconId || 'DEV-001'}
                      </td>
                      <td className="py-2.5 px-3 text-rose-400 font-medium">
                        {c.conflictReason || 'Mapped to another vendor device serial'}
                      </td>
                      <td className="py-2.5 px-3">
                        <Link
                          to="/assets/inventory/vendor-discovery"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                        >
                          <span>Resolve Conflict</span>
                          <ExternalLink className="size-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ReportSection>

      {/* 3. Data Contradictions: Online State with Stale Contact */}
      <ReportSection
        id="data-contradictions"
        title="Telemetry Contradictions Audit"
        description="Hardware flagged as Online in status tables but lacking fresh heartbeat telemetry within 24 hours."
      >
        {onlineStaleDevices.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No telemetry state contradictions detected.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-amber-400">
                  {onlineStaleDevices.length} devices marked Online with outdated contact
                </p>
                <p className="text-muted-foreground mt-0.5">
                  These records have not reported a telemetry packet in over 24 hours. The edge sync
                  scheduler should transition their connectivityState to 'stale' or 'offline'.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Device</th>
                    <th className="py-2.5 px-3 font-semibold">Stated State</th>
                    <th className="py-2.5 px-3 font-semibold">Last Contact (MYT)</th>
                    <th className="py-2.5 px-3 font-semibold">Mounted Pole</th>
                    <th className="py-2.5 px-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {onlineStaleDevices.map((d) => (
                    <tr key={d.identifier} className="hover:bg-muted/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                        <Link
                          to={`/assets/inventory/devices/${d.identifier}`}
                          className="text-primary hover:underline flex items-center gap-1.5"
                        >
                          {d.identifier}
                          <ExternalLink className="size-3 opacity-60" />
                        </Link>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          ONLINE (Contradiction)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {d.lastContactAt ? formatAbsoluteMYT(d.lastContactAt) : 'Never'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">
                        {d.installedPoleId || 'Not installed'}
                      </td>
                      <td className="py-2.5 px-3">
                        <Link
                          to={`/assets/inventory/devices/${d.identifier}`}
                          className="text-xs text-primary hover:underline"
                        >
                          Force Sync
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ReportSection>
    </div>
  );
};
