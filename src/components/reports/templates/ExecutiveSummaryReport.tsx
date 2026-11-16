import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  FileCheck,
  Building2,
} from 'lucide-react';
import { ReportSection } from '../ReportSection';
import type { FalconEvent } from '@/data/events';
import type { FalconCase } from '@/types/cases';
import type { DeviceRecord } from '@/types/devices';
import type { PoleRecord, CableSpanRecord } from '@/types/assets';
import type { RiskSegment } from '@/types/risk';
import type { ReportDateRange, ReportParameters } from '@/types/reports';

export interface ExecutiveSummaryReportProps {
  events: FalconEvent[];
  cases: FalconCase[];
  devices: DeviceRecord[];
  poles: PoleRecord[];
  cableSpans: CableSpanRecord[];
  segments: RiskSegment[];
  dateRange: ReportDateRange;
  parameters: ReportParameters;
}

export const ExecutiveSummaryReport: React.FC<ExecutiveSummaryReportProps> = ({
  events,
  cases,
  devices,
  poles,
  cableSpans,
  segments,
  dateRange: _dateRange,
  parameters,
}) => {
  // Scoped events
  const scopedEvents = useMemo(() => {
    return events.filter((e) => {
      if (!parameters.includeSimulatedEvents && e.source === 'Simulation') return false;
      if (parameters.site && parameters.site !== 'All sites' && parameters.site.toLowerCase() !== 'all') {
        if (e.site && e.site !== parameters.site) return false;
      }
      return true;
    });
  }, [events, parameters.includeSimulatedEvents, parameters.site]);

  // Priority counts
  const criticalCount = scopedEvents.filter((e) => e.priority === 'Critical').length;
  const highCount = scopedEvents.filter((e) => e.priority === 'High').length;
  const mediumCount = scopedEvents.filter((e) => e.priority === 'Medium').length;
  const lowCount = scopedEvents.filter((e) => e.priority === 'Low').length;
  const totalEvents = scopedEvents.length;

  // Case counts
  const totalCases = cases.length;
  const closedCases = cases.filter((c) => c.status === 'Closed').length;
  const inProgressCases = cases.filter((c) => c.status === 'In progress').length;
  const inReviewCases = cases.filter((c) => c.status === 'In review').length;
  const openCases = cases.filter((c) => c.status === 'Open').length;
  const closureRate = totalCases > 0 ? Math.round((closedCases / totalCases) * 100) : 0;

  // Top 5 High Risk Corridors
  const topRiskSegments = useMemo(() => {
    return segments
      .filter((s) => s.priority === 'High' || s.priority === 'Medium')
      .slice(0, 5);
  }, [segments]);

  // Infrastructure availability
  const onlineDevices = devices.filter((d) => d.connectivityState === 'online').length;
  const availabilityPct = devices.length > 0 ? Math.round((onlineDevices / devices.length) * 1000) / 10 : 0;

  // Poles equipped
  const activePoles = poles.filter((p) => p.lifecycle !== 'Deleted');
  const equippedPoles = activePoles.filter((p) => (p as any).mountedDevicesCount > 0 || (p as any).linkedDevicesCount > 0).length;
  const coveragePct = activePoles.length > 0 ? Math.round((equippedPoles / activePoles.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Executive Briefing Bullets */}
      <ReportSection
        id="executive-briefing"
        title="Executive Strategic Briefing"
        description="Key findings and operational synthesis evaluated across active network telemetry."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="size-4" />
            </div>
            <div>
              <div className="font-semibold text-foreground">Infrastructure Uptime at {availabilityPct}%</div>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">
                Sensor availability maintained across active telecom routes. Out of {devices.length} registered assets, {onlineDevices} devices report active telemetry.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <FileCheck className="size-4" />
            </div>
            <div>
              <div className="font-semibold text-foreground">Case Resolution Efficiency ({closureRate}%)</div>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">
                Engineering squads resolved {closedCases} out of {totalCases} opened field cases. Active in-flight backlog is contained to {openCases + inProgressCases} cases.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
              <ShieldAlert className="size-4" />
            </div>
            <div>
              <div className="font-semibold text-foreground">Predictive Risk Containment</div>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">
                Top risk corridors identified along Route 01 and Route 02. Optical tampering and cable encroachment alarms successfully mitigated prior to service disruptions.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
              <Building2 className="size-4" />
            </div>
            <div>
              <div className="font-semibold text-foreground">Asset Coverage Ratio ({coveragePct}%)</div>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">
                {equippedPoles} out of {activePoles.length} physical poles are actively fitted with camera or speaker sensors, safeguarding {cableSpans.length} fiber cable spans.
              </p>
            </div>
          </div>
        </div>
      </ReportSection>

      {/* 2. Incident Volume & Severity Breakdown */}
      <ReportSection
        id="incident-volume-severity"
        title="Incident Volume & Severity Classification"
        description="Comprehensive breakdown of physical security alarms and optical anomaly detections."
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 text-xs">
          {/* Critical */}
          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1">
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-semibold">
              <span>Critical (P1)</span>
              <span className="text-lg font-bold font-mono">{criticalCount}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">Fibre cut & structural impacts</div>
            <div className="w-full bg-border rounded-full h-1.5 overflow-hidden mt-2">
              <div
                className="bg-rose-500 h-full rounded-full"
                style={{ width: `${totalEvents > 0 ? (criticalCount / totalEvents) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* High */}
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-semibold">
              <span>High (P2)</span>
              <span className="text-lg font-bold font-mono">{highCount}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">Perimeter & cable tampering</div>
            <div className="w-full bg-border rounded-full h-1.5 overflow-hidden mt-2">
              <div
                className="bg-amber-500 h-full rounded-full"
                style={{ width: `${totalEvents > 0 ? (highCount / totalEvents) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Medium */}
          <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-1">
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 font-semibold">
              <span>Medium (P3)</span>
              <span className="text-lg font-bold font-mono">{mediumCount}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">Motion and acoustic alerts</div>
            <div className="w-full bg-border rounded-full h-1.5 overflow-hidden mt-2">
              <div
                className="bg-blue-500 h-full rounded-full"
                style={{ width: `${totalEvents > 0 ? (mediumCount / totalEvents) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Low */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground font-semibold">
              <span>Low (P4)</span>
              <span className="text-lg font-bold font-mono text-foreground">{lowCount}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">Informational telemetry notices</div>
            <div className="w-full bg-border rounded-full h-1.5 overflow-hidden mt-2">
              <div
                className="bg-slate-400 dark:bg-slate-600 h-full rounded-full"
                style={{ width: `${totalEvents > 0 ? (lowCount / totalEvents) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </ReportSection>

      {/* 3. Case Pipeline Funnel */}
      <ReportSection
        id="case-management-funnel"
        title="Field Operations & Case Pipeline Funnel"
        description="Workflow throughput tracking case transitions from creation to final root cause verification."
      >
        <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-4">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-3 rounded-lg bg-background border border-border space-y-1">
              <div className="text-[11px] text-muted-foreground font-medium">1. Opened</div>
              <div className="text-xl font-bold font-mono text-foreground">{openCases}</div>
              <div className="text-[10px] text-muted-foreground">Initial triage</div>
            </div>

            <div className="p-3 rounded-lg bg-background border border-border space-y-1">
              <div className="text-[11px] text-muted-foreground font-medium">2. In Progress</div>
              <div className="text-xl font-bold font-mono text-amber-500">{inProgressCases}</div>
              <div className="text-[10px] text-muted-foreground">Field team dispatched</div>
            </div>

            <div className="p-3 rounded-lg bg-background border border-border space-y-1">
              <div className="text-[11px] text-muted-foreground font-medium">3. Under Review</div>
              <div className="text-xl font-bold font-mono text-blue-500">{inReviewCases}</div>
              <div className="text-[10px] text-muted-foreground">Supervisor audit</div>
            </div>

            <div className="p-3 rounded-lg bg-background border border-border space-y-1">
              <div className="text-[11px] text-muted-foreground font-medium">4. Closed</div>
              <div className="text-xl font-bold font-mono text-emerald-500">{closedCases}</div>
              <div className="text-[10px] text-muted-foreground">Verified & resolved</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
            <span>Overall Closure Rate: <strong className="text-foreground">{closureRate}%</strong></span>
            <span>Target Resolution SLA: <strong className="text-foreground">95% within 24h</strong></span>
          </div>
        </div>
      </ReportSection>

      {/* 4. Top 5 High-Risk Corridors */}
      <ReportSection
        id="top-risk-corridors"
        title="Top Priority Risk Corridors & Preventive Work"
        description="Ranked infrastructure corridors exhibiting persistent incident clustering requiring preventive reinforcement."
      >
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border text-[11px] text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Corridor ID</th>
                <th className="py-2.5 px-3">Route & Span</th>
                <th className="py-2.5 px-3">Terminal Poles</th>
                <th className="py-2.5 px-3">Risk Tier</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Recommended Remediation</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {topRiskSegments.map((seg) => (
                <tr key={seg.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-primary">{seg.id}</td>
                  <td className="py-2.5 px-3 font-medium text-foreground">{seg.route} ({seg.spanId})</td>
                  <td className="py-2.5 px-3 font-mono text-muted-foreground">{seg.from} &rarr; {seg.to}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        seg.priority === 'High'
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}
                    >
                      {seg.priority}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">{seg.confidence}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-muted text-foreground font-medium text-[11px]">
                      {seg.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Link
                      to={`/risk?segment=${seg.id}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                    >
                      <span>Investigate</span>
                      <ArrowRight className="size-3" />
                    </Link>
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
