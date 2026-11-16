import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Sparkles,
  MapPinOff,
  WifiOff,
  CheckCircle2,
  Camera,
  Film,
  ArrowRight,
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

export interface DataQualityReportProps {
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
  const dataQuality = useMemo(() => {
    return computeDataQualityMetrics(
      devices,
      poles,
      events,
      INITIAL_VENDOR_DISCOVERY_RECORDS,
      INITIAL_VENDOR_SYNC_SUMMARY
    );
  }, [devices, poles, events]);

  // 1. Vendor conflict records
  const vendorConflicts = useMemo(() => {
    return INITIAL_VENDOR_DISCOVERY_RECORDS.filter((r) => r.matchStatus === 'Conflict');
  }, []);

  // 2. Stale contact devices marked online
  const onlineStaleDevices = useMemo(() => {
    const now = new Date().getTime();
    return devices.filter((d) => {
      if (d.connectivityState !== 'online') return false;
      if (!d.lastContactAt) return true;
      const contactMs = new Date(d.lastContactAt).getTime();
      return now - contactMs > 24 * 3600 * 1000;
    });
  }, [devices]);

  // 3. Poles without location
  const unlocatedPoles = useMemo(() => {
    return poles.filter((p) => p.lifecycle !== 'Deleted' && !p.location);
  }, [poles]);

  // 4. Optical evidence & clip stats
  const evidenceStats = useMemo(() => {
    const totalEvents = events.length;
    const withSnapshot = events.filter((e) => (e.snapshots && e.snapshots.length > 0) || (e as any).hasSnapshot).length;
    const withClip = events.filter((e) => (e as any).videoClipAvailable || (e as any).evidence?.clipUrl).length;
    const snapshotRate = totalEvents > 0 ? Math.round((withSnapshot / totalEvents) * 100) : 0;
    const clipRate = totalEvents > 0 ? Math.round((withClip / totalEvents) * 100) : 0;
    return {
      totalEvents,
      withSnapshot,
      withClip,
      snapshotRate,
      clipRate,
    };
  }, [events]);

  return (
    <div className="space-y-6">
      {/* SECTION 1: Vendor Edge Synchronization & Hardware Conflicts */}
      <ReportSection
        id="section-vendor-conflicts"
        title="Vendor Edge Synchronization & Hardware Conflicts"
        description="Edge vendor discovery records where hardware serial collides with an existing FALCON identifier or library driver."
        viewAllLink={{ label: 'Manage vendor records in Vendor Discovery', href: '/assets/inventory/vendor-discovery' }}
        topLimitNotice="Showing hardware serial conflicts requiring resolution."
      >
        {vendorConflicts.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground rounded-lg border border-border/60 bg-muted/10">
            <CheckCircle2 className="size-8 mx-auto mb-2 text-emerald-500" />
            <p className="font-semibold text-foreground text-xs">Zero Vendor Conflicts</p>
            <p className="text-[11px]">All discovered vendor hardware records cleanly map to the FALCON device registry.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground">
                  <th className="py-2.5 px-3 font-semibold">Vendor Serial</th>
                  <th className="py-2.5 px-3 font-semibold">Vendor Model</th>
                  <th className="py-2.5 px-3 font-semibold">FALCON Target</th>
                  <th className="py-2.5 px-3 font-semibold">Conflict Description</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {vendorConflicts.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-foreground">
                      {c.serial}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground font-medium">
                      <div>{c.vendorName}</div>
                      <div className="text-[10px] text-muted-foreground">{c.model}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-primary font-semibold">
                      {c.matchedFalconId || 'DEV-001'}
                    </td>
                    <td className="py-2.5 px-3 text-rose-500 font-medium">
                      {c.conflictReason || 'Mapped to another vendor device serial'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to="/assets/inventory/vendor-discovery"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                      >
                        <span>Resolve</span>
                        <ExternalLink className="size-2.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportSection>

      {/* SECTION 2: Telemetry Contradictions (Online State with Stale Contact) */}
      <ReportSection
        id="section-telemetry-contradictions"
        title="Telemetry Contradictions Audit (Online with Stale Heartbeat)"
        description="Physical devices flagged as 'online' in registry but failing to transmit telemetry packets for > 24 hours."
        viewAllLink={{ label: 'View all offline & stale devices in Inventory', href: '/assets/inventory?status=offline' }}
        topLimitNotice="Showing top 10 telemetry contradictions."
      >
        {onlineStaleDevices.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground rounded-lg border border-border/60 bg-muted/10">
            <CheckCircle2 className="size-8 mx-auto mb-2 text-emerald-500" />
            <p className="font-semibold text-foreground text-xs">No State Contradictions</p>
            <p className="text-[11px]">All online devices have verified active heartbeat telemetry.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground">
                  <th className="py-2.5 px-3 font-semibold">Device</th>
                  <th className="py-2.5 px-3 font-semibold">Stated State</th>
                  <th className="py-2.5 px-3 font-semibold">Last Contact (MYT)</th>
                  <th className="py-2.5 px-3 font-semibold">Mounted Pole</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {onlineStaleDevices.slice(0, 10).map((d) => (
                  <tr key={d.identifier} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-foreground">
                      <Link
                        to={`/assets/inventory/devices/${d.identifier}`}
                        className="text-primary hover:underline"
                      >
                        {d.identifier}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <WifiOff className="size-3" />
                        ONLINE (&gt;24h silence)
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground font-mono">
                      {d.lastContactAt ? formatAbsoluteMYT(d.lastContactAt) : 'Never received'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">
                      {d.installedPoleId || 'Not installed'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/assets/inventory/devices/${d.identifier}`}
                        className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
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

      {/* SECTION 3: Unlocated Pole Infrastructure Audit */}
      <ReportSection
        id="section-unlocated-poles"
        title="Unlocated Pole Infrastructure Audit"
        description="Poles registered in inventory missing verified GPS coordinates for GIS map layers."
        viewAllLink={{ label: 'Review all poles in Assets', href: '/assets/poles' }}
        topLimitNotice="Showing unlocated pole assets requiring survey coordinates."
      >
        {unlocatedPoles.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground rounded-lg border border-border/60 bg-muted/10">
            <CheckCircle2 className="size-8 mx-auto mb-2 text-emerald-500" />
            <p className="font-semibold text-foreground text-xs">All Poles Located</p>
            <p className="text-[11px]">All active poles have confirmed latitude and longitude coordinates.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground">
                  <th className="py-2.5 px-3 font-semibold">Pole ID</th>
                  <th className="py-2.5 px-3 font-semibold">Name &amp; Corridor</th>
                  <th className="py-2.5 px-3 font-semibold">Site Scope</th>
                  <th className="py-2.5 px-3 font-semibold">Lifecycle</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {unlocatedPoles.slice(0, 10).map((p) => (
                  <tr key={p.identifier} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPinOff className="size-3 text-amber-500" />
                        <span>{p.identifier}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-foreground font-medium truncate max-w-xs">{p.name}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{p.siteName || 'Unassigned'}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground">
                        {p.lifecycle}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/assets/poles/${p.identifier}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                      >
                        <span>Locate</span>
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

      {/* SECTION 4: Optical Evidence Completeness & Simulated Share */}
      <ReportSection
        id="section-evidence-completeness"
        title="Optical Evidence Completeness &amp; Simulation Share"
        description="Audit of media evidence integrity and the proportion of synthetic demo data versus live production telemetry."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Media Evidence Rate */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
            <span className="font-semibold text-foreground text-xs block">
              Incident Evidence Attachment Completeness
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-border/60 bg-card space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Camera className="size-3.5 text-primary" />
                    <span>Snapshots</span>
                  </span>
                  <span className="font-mono font-bold text-foreground">{evidenceStats.snapshotRate}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    style={{ width: `${evidenceStats.snapshotRate}%` }}
                    className="bg-primary h-full"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground block">
                  {evidenceStats.withSnapshot} of {evidenceStats.totalEvents} events have visual photos
                </span>
              </div>

              <div className="p-3 rounded-lg border border-border/60 bg-card space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Film className="size-3.5 text-blue-500" />
                    <span>Video Clips</span>
                  </span>
                  <span className="font-mono font-bold text-foreground">{evidenceStats.clipRate}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    style={{ width: `${evidenceStats.clipRate}%` }}
                    className="bg-blue-500 h-full"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground block">
                  {evidenceStats.withClip} of {evidenceStats.totalEvents} events have recorded RTSP clips
                </span>
              </div>
            </div>
          </div>

          {/* Simulation vs Real Share */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-purple-400" />
                <span>Data Provenance (Edge Telemetry vs Simulated)</span>
              </span>
              <span className="font-mono text-foreground font-bold">
                {dataQuality.simulatedShare}% Synthetic
              </span>
            </div>
            <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex">
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
            <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>{100 - dataQuality.simulatedShare}% Live telemetry</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-purple-500" />
                <span>{dataQuality.simulatedShare}% Simulated training events</span>
              </span>
            </div>
          </div>
        </div>
      </ReportSection>
    </div>
  );
};
