import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  MapPinOff,
  Layers,
  Link2,
  CheckCircle2,
  ExternalLink,
  Radio,
} from 'lucide-react';
import type { PoleRecord, CableSpanRecord } from '@/types/assets';
import type { DeviceRecord } from '@/types/devices';
import type { ReportDateRange } from '@/types/reports';
import { computeAssetMetrics } from '@/data/reportsSelectors';
import { ReportSection } from '../ReportSection';

interface AssetInventoryReportProps {
  poles: PoleRecord[];
  cableSpans: CableSpanRecord[];
  devices: DeviceRecord[];
  range: ReportDateRange;
  siteFilter: string;
}

export const AssetInventoryReport: React.FC<AssetInventoryReportProps> = ({
  poles,
  cableSpans,
  devices,
  siteFilter,
}) => {
  const assetMetrics = computeAssetMetrics(poles, cableSpans, siteFilter);

  // Filtered lists
  const filteredPoles = poles.filter((p) => {
    if (siteFilter && siteFilter !== 'All sites') {
      return p.siteName === siteFilter;
    }
    return true;
  });

  const activePoles = filteredPoles.filter((p) => p.lifecycle !== 'Deleted');

  // Unlocated poles audit
  const unlocatedPoles = activePoles.filter((p) => !p.location);

  // Poles with mounted devices mapping
  const poleDeviceMap = new Map<string, DeviceRecord[]>();
  devices.forEach((d) => {
    if (d.installedPoleId) {
      const list = poleDeviceMap.get(d.installedPoleId) || [];
      list.push(d);
      poleDeviceMap.set(d.installedPoleId, list);
    }
  });

  // Equipped poles
  const equippedPolesCount = activePoles.filter((p) => (poleDeviceMap.get(p.identifier) || []).length > 0).length;
  const installationCoverage =
    activePoles.length > 0 ? Math.round((equippedPolesCount / activePoles.length) * 100) : 0;

  // Cable spans metrics
  const totalLengthKm = Math.round(
    cableSpans.reduce((acc, s) => acc + (s.lengthKm || 0.8), 0) * 10
  ) / 10;
  const averageSpanMeters =
    cableSpans.length > 0 ? Math.round((totalLengthKm * 1000) / cableSpans.length) : 0;

  // Lifecycle breakdown
  const lifecycleData = Object.entries(assetMetrics.polesByLifecycle)
    .filter(([status]) => status !== 'Deleted')
    .map(([status, count]) => ({
      status,
      count,
      percent: activePoles.length > 0 ? Math.round((count / activePoles.length) * 100) : 0,
    }));

  return (
    <div className="space-y-6">
      {/* 1. Infrastructure Baseline & Balance Sheet */}
      <ReportSection
        id="infrastructure-baseline"
        title="Telecom Infrastructure Inventory Baseline"
        description="Physical inventory of physical poles, connecting aerial fibre spans, and IoT monitoring equipment."
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-xs font-medium text-blue-500 mb-1">
                <MapPin className="size-3.5" />
                <span>Physical Poles</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{activePoles.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {equippedPolesCount} monitored ({installationCoverage}%)
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-500 mb-1">
                <Link2 className="size-3.5" />
                <span>Cable Spans</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{cableSpans.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Aerial fibre segments</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-xs font-medium text-purple-500 mb-1">
                <Layers className="size-3.5" />
                <span>Total Network Length</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{totalLengthKm} km</div>
              <div className="text-xs text-muted-foreground mt-1">Avg span: {averageSpanMeters} m</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-xs font-medium text-indigo-500 mb-1">
                <Radio className="size-3.5" />
                <span>Registered Devices</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{devices.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Cameras &amp; speakers</div>
            </div>
          </div>

          {/* Installation Coverage Progress Bar */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-foreground font-semibold">Sensor Installation Coverage</span>
              <span className="text-primary font-bold">{installationCoverage}% equipped</span>
            </div>
            <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
              <div
                style={{ width: `${installationCoverage}%` }}
                className="bg-primary h-full rounded-full transition-all duration-500"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{equippedPolesCount} poles equipped with active IoT hardware</span>
              <span>{activePoles.length - equippedPolesCount} unmonitored poles</span>
            </div>
          </div>
        </div>
      </ReportSection>

      {/* 2. Poles by Lifecycle Status */}
      <ReportSection
        id="poles-lifecycle"
        title="Pole Lifecycle Status Distribution"
        description="Administrative status of infrastructure assets across operational planning phases."
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {lifecycleData.map((item) => (
            <div
              key={item.status}
              className="p-4 rounded-xl border border-border bg-card space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">{item.status}</span>
                <span className="text-xs font-mono font-bold text-primary">{item.percent}%</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{item.count}</div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div style={{ width: `${item.percent}%` }} className="h-full bg-primary" />
              </div>
            </div>
          ))}
        </div>
      </ReportSection>

      {/* 3. Data Quality Audit: Unlocated Poles */}
      <ReportSection
        id="unlocated-poles-audit"
        title="Unlocated Poles Data Quality Audit"
        description="Assets registered without geographical coordinates (latitude/longitude), preventing map rendering."
      >
        {unlocatedPoles.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            <CheckCircle2 className="size-8 mx-auto mb-2 text-emerald-500" />
            <p className="font-medium text-foreground">Perfect Coordinate Coverage</p>
            <p>Every active pole has valid geographical coordinates.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <MapPinOff className="size-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-amber-400">
                  {unlocatedPoles.length} poles require GPS coordinates
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Unlocated poles cannot be placed on the Map Canvas or spatial risk corridor models.
                  Use the link below to update their GPS locations in the Poles registry.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Pole</th>
                    <th className="py-2.5 px-3 font-semibold">Name</th>
                    <th className="py-2.5 px-3 font-semibold">Site</th>
                    <th className="py-2.5 px-3 font-semibold">Lifecycle</th>
                    <th className="py-2.5 px-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {unlocatedPoles.map((p) => (
                    <tr key={p.identifier} className="hover:bg-muted/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                        {p.identifier}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">{p.name}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{p.siteName}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400">
                          {p.lifecycle}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <Link
                          to={`/assets/poles/${p.identifier}`}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                        >
                          <span>Set Location</span>
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

      {/* 4. Cable Spans Summary */}
      <ReportSection
        id="cable-spans-summary"
        title="Fibre Cable Spans Summary"
        description="Physical cable segments connecting adjacent poles, showing route coverage and span distances."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted text-muted-foreground border-b border-border">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Span ID</th>
                <th className="py-2.5 px-3 font-semibold">Route</th>
                <th className="py-2.5 px-3 font-semibold">Connection (From → To)</th>
                <th className="py-2.5 px-3 font-semibold">Length</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cableSpans.slice(0, 15).map((s) => (
                <tr key={s.identifier} className="hover:bg-muted/50 transition-colors">
                  <td className="py-2 px-3 font-mono font-medium text-foreground">
                    {s.identifier}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">{s.route || 'General Route'}</td>
                  <td className="py-2 px-3 font-mono text-muted-foreground">
                    {s.fromPole} → {s.toPole}
                  </td>
                  <td className="py-2 px-3 font-mono text-foreground">
                    {s.lengthKm ? `${s.lengthKm} km` : '0.8 km'}
                  </td>
                  <td className="py-2 px-3">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400">
                      {s.lifecycle || 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportSection>
    </div>
  );
};
