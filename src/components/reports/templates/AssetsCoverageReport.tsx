import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPinOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import type { PoleRecord, CableSpanRecord } from '@/types/assets';
import type { DeviceRecord } from '@/types/devices';
import type { ReportDateRange, ReportParameters } from '@/types/reports';
import { computeAssetMetrics } from '@/data/reportsSelectors';
import { ReportSection } from '../ReportSection';

export interface AssetsCoverageReportProps {
  poles: PoleRecord[];
  cableSpans: CableSpanRecord[];
  devices: DeviceRecord[];
  range: ReportDateRange;
  siteFilter: string;
  parameters?: ReportParameters;
}

export const AssetsCoverageReport: React.FC<AssetsCoverageReportProps> = ({
  poles,
  cableSpans,
  devices,
  siteFilter,
}) => {
  const assetMetrics = useMemo(() => {
    return computeAssetMetrics(poles, cableSpans, siteFilter);
  }, [poles, cableSpans, siteFilter]);

  // Filtered scoped assets
  const filteredPoles = useMemo(() => {
    if (!siteFilter || siteFilter === 'All sites') return poles;
    return poles.filter((p) => p.siteName === siteFilter);
  }, [poles, siteFilter]);

  const activePoles = useMemo(() => {
    return filteredPoles.filter((p) => p.lifecycle !== 'Deleted');
  }, [filteredPoles]);

  const filteredSpans = useMemo(() => {
    if (!siteFilter || siteFilter === 'All sites') return cableSpans;
    return cableSpans.filter((s) => (s as any).siteName === siteFilter || s.siteId === siteFilter);
  }, [cableSpans, siteFilter]);

  const scopedDevices = useMemo(() => {
    if (!siteFilter || siteFilter === 'All sites') return devices;
    return devices.filter((d) => d.siteName === siteFilter);
  }, [devices, siteFilter]);

  // 1. Unlocated poles
  const unlocatedPoles = useMemo(() => {
    return activePoles.filter((p) => !p.location);
  }, [activePoles]);

  // 2. Uninstalled devices (devices without pole assignment)
  const uninstalledDevices = useMemo(() => {
    return scopedDevices.filter((d) => !d.installedPoleId);
  }, [scopedDevices]);

  // 3. Poles with mounted devices mapping
  const poleDeviceMap = useMemo(() => {
    const map = new Map<string, DeviceRecord[]>();
    scopedDevices.forEach((d) => {
      if (d.installedPoleId) {
        const list = map.get(d.installedPoleId) || [];
        list.push(d);
        map.set(d.installedPoleId, list);
      }
    });
    return map;
  }, [scopedDevices]);

  const equippedPolesCount = useMemo(() => {
    return activePoles.filter((p) => (poleDeviceMap.get(p.identifier) || []).length > 0).length;
  }, [activePoles, poleDeviceMap]);

  const installationCoverage = activePoles.length > 0
    ? Math.round((equippedPolesCount / activePoles.length) * 100)
    : 0;

  // Cable spans metrics
  const totalLengthKm = useMemo(() => {
    const spansList = filteredSpans.length > 0 ? filteredSpans : cableSpans;
    return Math.round(spansList.reduce((acc, s) => acc + (s.lengthKm || 0.8), 0) * 10) / 10;
  }, [filteredSpans, cableSpans]);

  const averageSpanMeters = useMemo(() => {
    const spansList = filteredSpans.length > 0 ? filteredSpans : cableSpans;
    return spansList.length > 0 ? Math.round((totalLengthKm * 1000) / spansList.length) : 0;
  }, [filteredSpans, cableSpans, totalLengthKm]);

  // Lifecycle breakdown
  const lifecycleData = useMemo(() => {
    return Object.entries(assetMetrics.polesByLifecycle)
      .filter(([status]) => status !== 'Deleted')
      .map(([status, count]) => ({
        status,
        count,
        percent: activePoles.length > 0 ? Math.round((count / activePoles.length) * 100) : 0,
      }));
  }, [assetMetrics.polesByLifecycle, activePoles.length]);

  return (
    <div className="space-y-6">
      {/* SECTION 1: Location Completeness Audit */}
      <ReportSection
        id="section-unlocated-poles"
        title="Location Completeness Audit (Poles Without GPS Coordinates)"
        description="Physical assets lacking confirmed geocoordinates. These poles cannot be visualised on the Operations Map."
        viewAllLink={{ label: 'Manage all poles in Assets', href: '/assets/poles' }}
        topLimitNotice="Showing unlocated pole assets requiring field GPS capture."
      >
        {unlocatedPoles.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground rounded-lg border border-border/60 bg-muted/10">
            <CheckCircle2 className="size-8 mx-auto mb-2 text-emerald-500" />
            <p className="font-semibold text-foreground text-xs">100% Geolocation Completeness</p>
            <p className="text-[11px]">All registered poles have valid GPS latitude/longitude coordinates.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground">
                  <th className="py-2.5 px-3 font-semibold">Pole ID</th>
                  <th className="py-2.5 px-3 font-semibold">Name &amp; Corridor</th>
                  <th className="py-2.5 px-3 font-semibold">Site</th>
                  <th className="py-2.5 px-3 font-semibold">Protection</th>
                  <th className="py-2.5 px-3 font-semibold">Lifecycle</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {unlocatedPoles.map((p) => (
                  <tr key={p.identifier} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPinOff className="size-3 text-amber-500" />
                        <span>{p.identifier}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-foreground font-medium truncate max-w-xs">
                      {p.name}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {p.siteName || 'Unassigned'}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground font-mono">
                      {p.protection || 'Standard'}
                    </td>
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

      {/* SECTION 2: Devices Awaiting Physical Mounting */}
      <ReportSection
        id="section-uninstalled-devices"
        title="Devices Awaiting Physical Mounting (In Storage / Unassigned)"
        description="Hardware registered in the inventory but not yet mounted onto a physical pole."
        viewAllLink={{ label: 'View all uninstalled devices in Inventory', href: '/assets/inventory?status=uninstalled' }}
        topLimitNotice="Showing uninstalled devices ready for field dispatch."
      >
        {uninstalledDevices.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground rounded-lg border border-border/60 bg-muted/10">
            <ShieldCheck className="size-8 mx-auto mb-2 text-emerald-500" />
            <p className="font-semibold text-foreground text-xs">All Hardware Installed</p>
            <p className="text-[11px]">All registered cameras and speakers are mounted on active poles.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground">
                  <th className="py-2.5 px-3 font-semibold">Device</th>
                  <th className="py-2.5 px-3 font-semibold">Type</th>
                  <th className="py-2.5 px-3 font-semibold">Manufacturer &amp; Model</th>
                  <th className="py-2.5 px-3 font-semibold">Serial Number</th>
                  <th className="py-2.5 px-3 font-semibold">Connectivity</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {uninstalledDevices.map((d) => (
                  <tr key={d.identifier} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-mono font-semibold text-foreground">{d.identifier}</div>
                      <div className="text-[10px] text-muted-foreground">{d.name}</div>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground font-medium">
                      {d.type || 'Camera'}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {d.manufacturer} {d.model}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">
                      {d.serial}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground capitalize">
                        {d.connectivityState}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/assets/inventory/devices/${d.identifier}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                      >
                        <span>Mount</span>
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

      {/* SECTION 3: Optical & Audio Sensor Coverage Ratio */}
      <ReportSection
        id="section-sensor-coverage"
        title="Optical & Audio Sensor Coverage Ratio"
        description="Physical pole telemetry instrumentation rate across aerial fibre routes."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-2">
              <span className="text-xs text-muted-foreground block font-medium">Equipped Poles Ratio</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-foreground">{installationCoverage}%</span>
                <span className="text-xs text-muted-foreground">monitored</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  style={{ width: `${installationCoverage}%` }}
                  className="bg-primary h-full transition-all duration-500"
                />
              </div>
              <span className="text-[11px] text-muted-foreground block">
                {equippedPolesCount} of {activePoles.length} active poles mounted with sensors
              </span>
            </div>

            <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-2">
              <span className="text-xs text-muted-foreground block font-medium">Cable Span Fleet</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-foreground">
                  {filteredSpans.length > 0 ? filteredSpans.length : cableSpans.length}
                </span>
                <span className="text-xs text-muted-foreground">spans</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                <span>Total network length:</span>
                <span className="font-mono font-semibold text-foreground">{totalLengthKm} km</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Average span length:</span>
                <span className="font-mono">{averageSpanMeters} m</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-2">
              <span className="text-xs text-muted-foreground block font-medium">Device Density</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-foreground">
                  {scopedDevices.length}
                </span>
                <span className="text-xs text-muted-foreground">devices deployed</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                <span>Uninstalled / In stock:</span>
                <span className="font-mono font-semibold text-amber-500">{uninstalledDevices.length}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Active on poles:</span>
                <span className="font-mono font-semibold text-emerald-500">
                  {scopedDevices.length - uninstalledDevices.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ReportSection>

      {/* SECTION 4: Asset Inventory Balance & Lifecycle Breakdown */}
      <ReportSection
        id="section-inventory-lifecycle"
        title="Asset Inventory Balance & Lifecycle Breakdown"
        description="Operational state and lifecycle phase distribution across poles and connecting spans."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
            <span className="font-semibold text-foreground text-xs block">Pole Lifecycle Distribution</span>
            <div className="space-y-2.5">
              {lifecycleData.map((item) => (
                <div key={item.status} className="p-3 rounded-lg border border-border/60 bg-card space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{item.status}</span>
                    <span className="font-mono font-bold text-foreground">
                      {item.count} poles ({item.percent}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      style={{ width: `${item.percent}%` }}
                      className={`h-full ${
                        item.status === 'Active'
                          ? 'bg-emerald-500'
                          : item.status === 'Maintenance'
                          ? 'bg-amber-500'
                          : 'bg-muted-foreground'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
            <span className="font-semibold text-foreground text-xs block">Quick Actions &amp; Navigation</span>
            <div className="space-y-2 text-xs">
              <Link
                to="/assets/poles"
                className="p-3 rounded-lg border border-border/60 bg-card flex items-center justify-between hover:border-primary/60 transition-colors group"
              >
                <div>
                  <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    Manage Poles Directory
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Review and edit {activePoles.length} registered physical poles
                  </div>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>

              <Link
                to="/assets/cable-spans"
                className="p-3 rounded-lg border border-border/60 bg-card flex items-center justify-between hover:border-primary/60 transition-colors group"
              >
                <div>
                  <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    Fibre Cable Spans
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Inspect {totalLengthKm} km across aerial transmission spans
                  </div>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>

              <Link
                to="/assets/inventory"
                className="p-3 rounded-lg border border-border/60 bg-card flex items-center justify-between hover:border-primary/60 transition-colors group"
              >
                <div>
                  <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    Device Inventory &amp; Vendor Discovery
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Provision cameras and resolve serial conflict issues
                  </div>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </ReportSection>
    </div>
  );
};
