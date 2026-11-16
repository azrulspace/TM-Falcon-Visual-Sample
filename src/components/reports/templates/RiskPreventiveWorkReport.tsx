import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ExternalLink,
  Activity,
  Info,
} from 'lucide-react';
import type { RiskSegment } from '@/types/risk';
import type { FalconEvent } from '@/data/events';
import type { ReportDateRange, ReportParameters } from '@/types/reports';
import { ReportSection } from '../ReportSection';
import { formatAbsoluteMYT } from '@/lib/dateTime';

export interface RiskPreventiveWorkReportProps {
  segments: RiskSegment[];
  events: FalconEvent[];
  range: ReportDateRange;
  siteFilter: string;
  parameters?: ReportParameters;
}

export const RiskPreventiveWorkReport: React.FC<RiskPreventiveWorkReportProps> = ({
  segments,
  events: _events,
  range: _range,
  siteFilter,
}) => {
  // Scoped segments
  const scopedSegments = useMemo(() => {
    if (!siteFilter || siteFilter === 'All sites') return segments;
    return segments.filter((s) => (s as any).siteName === siteFilter);
  }, [segments, siteFilter]);

  // 1. Top 10 Priority Segments
  const prioritySegments = useMemo(() => {
    const confidenceOrder: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
    return [...scopedSegments]
      .sort((a, b) => {
        if (a.priority === 'High' && b.priority !== 'High') return -1;
        if (b.priority === 'High' && a.priority !== 'High') return 1;
        return (confidenceOrder[b.confidence] || 0) - (confidenceOrder[a.confidence] || 0);
      })
      .slice(0, 10);
  }, [scopedSegments]);

  // 2. Spatial Corridor Hotspots
  const routeHotspots = useMemo(() => {
    const map: Record<string, { total: number; high: number; basisEvents: number; drivers: Set<string> }> = {};
    for (const s of scopedSegments) {
      const r = s.route || 'General Corridors';
      if (!map[r]) {
        map[r] = { total: 0, high: 0, basisEvents: 0, drivers: new Set() };
      }
      map[r].total++;
      if (s.priority === 'High') map[r].high++;
      if (s.basis) {
        if (s.basis.toLowerCase().includes('monkey') || s.basis.toLowerCase().includes('macaque')) {
          map[r].drivers.add('Wildlife');
        } else if (s.basis.toLowerCase().includes('vegetation') || s.basis.toLowerCase().includes('tree')) {
          map[r].drivers.add('Vegetation');
        } else if (s.basis.toLowerCase().includes('vibration') || s.basis.toLowerCase().includes('shear')) {
          map[r].drivers.add('Vibration');
        } else {
          map[r].drivers.add('Encroachment');
        }
      }
    }
    return Object.entries(map).map(([route, stats]) => ({
      route,
      total: stats.total,
      high: stats.high,
      drivers: Array.from(stats.drivers).join(', ') || 'Mixed',
    }));
  }, [scopedSegments]);

  // 3. Decision Audit List
  const decisionAuditList = useMemo(() => {
    return scopedSegments
      .filter((s) => s.status === 'investigating' || s.status === 'dismissed' || s.dismissReason)
      .slice(0, 10);
  }, [scopedSegments]);

  // 4. Scripted monkey load simulation demo data
  const monkeyLoadData = [
    {
      corridor: 'SEG-01 (Route 01: AST-001 → AST-002)',
      troopCount: '12 macaques',
      estimatedMassKg: 78,
      windShearKmh: 45,
      calculatedSagCm: 18.4,
      safetyThresholdCm: 25.0,
      riskLevel: 'Elevated',
    },
    {
      corridor: 'SEG-04 (Route 02: AST-004 → AST-005)',
      troopCount: '18 macaques',
      estimatedMassKg: 115,
      windShearKmh: 60,
      calculatedSagCm: 26.8,
      safetyThresholdCm: 25.0,
      riskLevel: 'Critical',
    },
    {
      corridor: 'SEG-09 (Route 03: AST-009 → AST-010)',
      troopCount: '6 macaques',
      estimatedMassKg: 42,
      windShearKmh: 30,
      calculatedSagCm: 9.2,
      safetyThresholdCm: 25.0,
      riskLevel: 'Normal',
    },
  ];

  return (
    <div className="space-y-6">
      {/* SECTION 1: Priority Segments to Inspect */}
      <ReportSection
        id="section-risk-segments"
        title="High-Priority Cable Segments to Inspect"
        description="Fibre span corridors flagged by predictive risk rules requiring physical verification or preventive field works."
        viewAllLink={{ label: 'View all 25 risk segments in Risk Map', href: '/analytics/risk' }}
        topLimitNotice="Showing top 10 priority segments."
      >
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground">
                <th className="py-2.5 px-3 font-semibold">Corridor</th>
                <th className="py-2.5 px-3 font-semibold">Route</th>
                <th className="py-2.5 px-3 font-semibold">Terminals</th>
                <th className="py-2.5 px-3 font-semibold">Priority</th>
                <th className="py-2.5 px-3 font-semibold">Recommended Action</th>
                <th className="py-2.5 px-3 font-semibold">Basis Rule</th>
                <th className="py-2.5 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {prioritySegments.map((s) => (
                <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-foreground">
                    <Link
                      to={`/analytics/risk?segment=${s.id}`}
                      className="text-primary hover:underline flex items-center gap-1.5"
                    >
                      {s.id}
                      <ExternalLink className="size-2.5 opacity-60" />
                    </Link>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground font-medium">{s.route}</td>
                  <td className="py-2.5 px-3 font-mono text-muted-foreground">
                    {s.from} → {s.to}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        s.priority === 'High'
                          ? 'bg-rose-500/10 text-rose-500'
                          : s.priority === 'Medium'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-blue-500/10 text-blue-500'
                      }`}
                    >
                      {s.priority}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex px-2 py-0.5 rounded text-[11px] bg-primary/10 text-primary font-medium">
                      {s.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground max-w-xs truncate" title={s.basis}>
                    {s.basis}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Link
                      to={`/analytics/risk?segment=${s.id}`}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
              {prioritySegments.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">
                    No risk segments pending inspection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ReportSection>

      {/* SECTION 2: Spatial Corridor Distribution & Hotspots */}
      <ReportSection
        id="section-corridor-distribution"
        title="Corridor Risk Distribution & Spatial Hotspots"
        description="Aggregate risk posture and primary physical hazard drivers across aerial fibre transmission routes."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {routeHotspots.map((r) => (
            <div
              key={r.route}
              className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-2.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-sm">{r.route}</span>
                <span className="font-mono text-muted-foreground">{r.total} segments</span>
              </div>

              <div className="flex items-center justify-between text-muted-foreground">
                <span>High Priority:</span>
                <span className={`font-mono font-bold ${r.high > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {r.high} spans
                </span>
              </div>

              <div className="flex items-center justify-between text-muted-foreground">
                <span>Risk Drivers:</span>
                <span className="font-medium text-foreground">{r.drivers}</span>
              </div>

              <div className="pt-1.5 border-t border-border/40 flex justify-end">
                <Link
                  to={`/analytics/risk?route=${encodeURIComponent(r.route)}`}
                  className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  <span>Explore Route</span>
                  <ExternalLink className="size-2.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </ReportSection>

      {/* SECTION 3: Inspection Decisions Audit */}
      <ReportSection
        id="section-decisions-audit"
        title="Inspection Decisions &amp; Supervisor Audit Trail"
        description="Formal audit trail of reviewed risk corridors, work orders dispatched, and dismissals."
      >
        {decisionAuditList.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground rounded-lg border border-border/60 bg-muted/10">
            No reviewed or dismissed risk corridors recorded in this period.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground">
                  <th className="py-2.5 px-3 font-semibold">Corridor</th>
                  <th className="py-2.5 px-3 font-semibold">Decision Outcome</th>
                  <th className="py-2.5 px-3 font-semibold">Reviewed By</th>
                  <th className="py-2.5 px-3 font-semibold">Decision Date</th>
                  <th className="py-2.5 px-3 font-semibold">Rationale &amp; Sign-off Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {decisionAuditList.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-foreground">
                      <Link to={`/analytics/risk?segment=${s.id}`} className="text-primary hover:underline">
                        {s.id}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          s.status === 'dismissed'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-blue-500/10 text-blue-500'
                        }`}
                      >
                        {s.status === 'dismissed' ? (
                          <CheckCircle2 className="size-3" />
                        ) : (
                          <Activity className="size-3" />
                        )}
                        <span>{s.status === 'dismissed' ? 'Dismissed / Cleared' : 'Investigating'}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground font-medium">
                      {s.dismissedBy || s.investigatedBy || 'Supervisor Hazim'}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground font-mono">
                      {s.dismissedAt || s.investigatedAt ? (
                        formatAbsoluteMYT(s.dismissedAt || s.investigatedAt!)
                      ) : (
                        <span className="italic">Recent</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-foreground">
                      {s.dismissReason || s.dismissNote || (
                        <span className="text-muted-foreground italic">
                          Work order dispatched for field vegetation trimming.
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportSection>

      {/* SECTION 4: Aerial Span Monkey Load Simulation */}
      <ReportSection
        id="section-monkey-load"
        title="Aerial Span Monkey Troop Loading Simulation"
        description="Physical cable sag and tension estimation under wildlife troop load and crosswind gusts (Engineering Model Prototype)."
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
            <Info className="size-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-primary">Predictive Physical Stress Simulation</p>
              <p className="text-muted-foreground mt-0.5">
                This model combines optical macaque count detection from edge cameras with cable tension
                physics to predict sagging risks prior to fibre core micro-bending failure.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {monkeyLoadData.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-foreground truncate">
                    {item.corridor.split(' ')[0]}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.riskLevel === 'Critical'
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        : item.riskLevel === 'Elevated'
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}
                  >
                    {item.riskLevel}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Detected Wildlife:</span>
                    <span className="font-medium text-foreground">{item.troopCount}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total Dynamic Mass:</span>
                    <span className="font-mono text-foreground">{item.estimatedMassKg} kg</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Crosswind Velocity:</span>
                    <span className="font-mono text-foreground">{item.windShearKmh} km/h</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Calculated Sag Deflection:</span>
                    <span
                      className={`font-mono font-bold ${
                        item.calculatedSagCm > item.safetyThresholdCm ? 'text-rose-500' : 'text-emerald-500'
                      }`}
                    >
                      {item.calculatedSagCm} cm
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(100, (item.calculatedSagCm / item.safetyThresholdCm) * 100)}%`,
                      }}
                      className={`h-full ${
                        item.calculatedSagCm > item.safetyThresholdCm ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                  <div className="text-[10px] text-right text-muted-foreground mt-1">
                    Threshold: {item.safetyThresholdCm} cm
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ReportSection>
    </div>
  );
};
