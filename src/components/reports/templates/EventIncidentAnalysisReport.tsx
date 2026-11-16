import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  ArrowRight,
  Flame,
  Sparkles,
} from 'lucide-react';
import { ReportSection } from '../ReportSection';
import type { FalconEvent } from '@/data/events';
import type { ReportDateRange, ReportParameters } from '@/types/reports';

export interface EventIncidentAnalysisReportProps {
  events: FalconEvent[];
  dateRange: ReportDateRange;
  parameters: ReportParameters;
}

export const EventIncidentAnalysisReport: React.FC<EventIncidentAnalysisReportProps> = ({
  events,
  dateRange: _dateRange,
  parameters,
}) => {
  // Scoped events (respecting simulation toggle and site)
  const scopedEvents = useMemo(() => {
    return events.filter((e) => {
      if (!parameters.includeSimulatedEvents && e.source === 'Simulation') return false;
      if (parameters.site && parameters.site !== 'All sites' && parameters.site.toLowerCase() !== 'all') {
        if (e.site && e.site !== parameters.site) return false;
      }
      return true;
    });
  }, [events, parameters.includeSimulatedEvents, parameters.site]);

  const totalEvents = scopedEvents.length;

  // 1. Group by Event Type
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of scopedEvents) {
      counts[e.type] = (counts[e.type] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [scopedEvents]);

  // 2. Repeat targets (assets with >= 3 events)
  const repeatTargets = useMemo(() => {
    const targetMap: Record<string, { count: number; types: Record<string, number>; site: string }> = {};
    for (const e of scopedEvents) {
      const asset = e.asset || 'Unknown';
      if (!targetMap[asset]) {
        targetMap[asset] = { count: 0, types: {}, site: e.site || 'Teluk Panglima Garang' };
      }
      targetMap[asset].count++;
      targetMap[asset].types[e.type] = (targetMap[asset].types[e.type] || 0) + 1;
    }

    return Object.entries(targetMap)
      .filter(([, data]) => data.count >= 3)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([assetId, data]) => {
        const topType = Object.entries(data.types).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
        return {
          assetId,
          site: data.site,
          total: data.count,
          topType,
          isSevere: data.count >= 5,
        };
      });
  }, [scopedEvents]);

  // 3. Evidence Coverage (Snapshots & Clips)
  const evidenceMetrics = useMemo(() => {
    const withSnapshots = scopedEvents.filter((e) => e.snapshots && e.snapshots.length > 0).length;
    const snapshotRate = totalEvents > 0 ? Math.round((withSnapshots / totalEvents) * 100) : 0;
    return {
      withSnapshots,
      snapshotRate,
    };
  }, [scopedEvents, totalEvents]);

  // 4. Source Split (Edge Service, Manual, Partner Feed, Simulation)
  const sourceSplit = useMemo(() => {
    const sources: Record<string, number> = {};
    for (const e of events) {
      sources[e.source] = (sources[e.source] || 0) + 1;
    }
    return sources;
  }, [events]);

  return (
    <div className="space-y-6">
      {/* 1. Incident Classification Breakdown */}
      <ReportSection
        id="incident-categories"
        title="Incident Category Distribution & Density"
        description="Comprehensive volume and percentage share across all detection trigger signatures."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {typeCounts.map(([type, count]) => {
              const share = totalEvents > 0 ? Math.round((count / totalEvents) * 100) : 0;
              return (
                <div
                  key={type}
                  className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-foreground text-xs">{type}</div>
                    <div className="text-[11px] text-muted-foreground">{share}% of total alarms</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold font-mono text-primary">{count}</div>
                    <div className="text-[10px] text-muted-foreground">incidents</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ReportSection>

      {/* 2. Hotspots & Repeat Incident Targets */}
      <ReportSection
        id="repeat-incident-targets"
        title="Infrastructure Hotspots & Repeat Incident Targets"
        description="Corridors and pole assets experiencing persistent incident clustering (>= 3 events)."
      >
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border text-[11px] text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Asset / Corridor ID</th>
                <th className="py-2.5 px-3">Site Jurisdiction</th>
                <th className="py-2.5 px-3">Primary Anomaly Signature</th>
                <th className="py-2.5 px-3 text-right">Event Count</th>
                <th className="py-2.5 px-3">Density Classification</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {repeatTargets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    No infrastructure assets exhibit repeat incident clustering in this period.
                  </td>
                </tr>
              ) : (
                repeatTargets.map((target) => (
                  <tr key={target.assetId} className="hover:bg-muted/30">
                    <td className="py-2.5 px-3 font-mono font-semibold text-primary">
                      {target.assetId}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">{target.site}</td>
                    <td className="py-2.5 px-3 font-medium text-foreground">{target.topType}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-right text-foreground">
                      {target.total}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          target.isSevere
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}
                      >
                        <Flame className="size-2.5" />
                        <span>{target.isSevere ? 'Severe hotspot' : 'Moderate clustering'}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/events?search=${encodeURIComponent(target.assetId)}`}
                        className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                      >
                        <span>Filter events</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ReportSection>

      {/* 3. Optical Evidence & Forensic Data Verification */}
      <ReportSection
        id="evidence-audit"
        title="Optical Evidence Coverage & Telemetry Quality"
        description="Verification audit of photographic snapshot captures accompanying sensor triggers."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Camera className="size-4 text-primary" />
                <span>Optical Snapshot Capture Rate</span>
              </span>
              <span className="text-lg font-bold font-mono text-primary">
                {evidenceMetrics.snapshotRate}%
              </span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              {evidenceMetrics.withSnapshots} out of {totalEvents} incidents contain high-resolution optical snapshots captured by adjacent pole cameras.
            </p>
            <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${evidenceMetrics.snapshotRate}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-4 text-amber-500" />
                <span>Simulated vs Real Source Share</span>
              </span>
              <span className="text-lg font-bold font-mono text-foreground">
                {events.length} total recorded
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-muted-foreground">
              {Object.entries(sourceSplit).map(([src, count]) => (
                <div key={src} className="flex items-center justify-between">
                  <span>{src}</span>
                  <span className="font-mono font-medium text-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ReportSection>
    </div>
  );
};
