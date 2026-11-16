import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Activity,
  Info,
} from 'lucide-react';
import type { RiskSegment } from '@/types/risk';
import type { FalconEvent } from '@/data/events';
import type { ReportDateRange } from '@/types/reports';
import { computeRiskMetrics } from '@/data/reportsSelectors';
import { ReportSection } from '../ReportSection';
import { formatAbsoluteMYT } from '@/lib/dateTime';

interface RiskPreventiveWorkReportProps {
  segments: RiskSegment[];
  events: FalconEvent[];
  range: ReportDateRange;
  siteFilter: string;
}

export const RiskPreventiveWorkReport: React.FC<RiskPreventiveWorkReportProps> = ({
  segments,
  events,
  range,
  siteFilter,
}) => {
  const riskMetrics = computeRiskMetrics(segments, events, range, siteFilter);

  // High priority segments
  const highPrioritySegments = segments.filter((s) => s.priority === 'High');

  // Decision audit list: reviewed, investigating or dismissed
  const decisionAuditList = segments.filter(
    (s) => s.status === 'investigating' || s.status === 'dismissed' || s.dismissReason
  );

  // Scripted monkey load simulation demo data
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
      {/* 1. High-Risk Corridors & Priority Ranking */}
      <ReportSection
        id="risk-corridors-ranking"
        title="High-Risk Corridors & Segment Priority Ranking"
        description="Fibre span segments flagged by automated risk rules based on historical incidents, vegetation encroachments, and vibration patterns."
      >
        <div className="space-y-6">
          {/* Status overview cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-xs font-medium text-rose-500 mb-1">
                <ShieldAlert className="size-3.5" />
                <span>High Priority</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{riskMetrics.highPriority}</div>
              <div className="text-xs text-muted-foreground mt-1">Requires immediate physical survey</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-500 mb-1">
                <AlertTriangle className="size-3.5" />
                <span>Pending Inspection</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{riskMetrics.toInspect}</div>
              <div className="text-xs text-muted-foreground mt-1">In dispatch backlog</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-xs font-medium text-blue-500 mb-1">
                <Activity className="size-3.5" />
                <span>Under Investigation</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{riskMetrics.investigated}</div>
              <div className="text-xs text-muted-foreground mt-1">Work order assigned</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-500 mb-1">
                <CheckCircle2 className="size-3.5" />
                <span>Dismissed / Cleared</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{riskMetrics.dismissed}</div>
              <div className="text-xs text-muted-foreground mt-1">Audited with sign-off</div>
            </div>
          </div>

          {/* High priority table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Corridor</th>
                  <th className="py-2.5 px-3 font-semibold">Route</th>
                  <th className="py-2.5 px-3 font-semibold">Terminals</th>
                  <th className="py-2.5 px-3 font-semibold">Priority</th>
                  <th className="py-2.5 px-3 font-semibold">Recommended Action</th>
                  <th className="py-2.5 px-3 font-semibold">Basis Rule</th>
                  <th className="py-2.5 px-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {highPrioritySegments.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                      <Link
                        to={`/risk?selected=${s.id}`}
                        className="text-primary hover:underline flex items-center gap-1.5"
                      >
                        {s.id}
                        <ExternalLink className="size-3 opacity-60" />
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">{s.route}</td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">
                      {s.from} → {s.to}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        {s.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 font-medium">
                        {s.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground max-w-xs truncate" title={s.basis}>
                      {s.basis}
                    </td>
                    <td className="py-2.5 px-3">
                      <Link
                        to={`/risk?selected=${s.id}`}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        View Corridor
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ReportSection>

      {/* 2. Decision Audit & Dismissal Rationale */}
      <ReportSection
        id="risk-decisions-audit"
        title="Risk Review & Decision Audit Trail"
        description="Formal audit log of risk decisions, field investigations, work orders, and dismissal reasons approved by supervisors."
      >
        {decisionAuditList.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No reviewed or dismissed risk corridors recorded in this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Corridor</th>
                  <th className="py-2.5 px-3 font-semibold">Decision Outcome</th>
                  <th className="py-2.5 px-3 font-semibold">Reviewed By</th>
                  <th className="py-2.5 px-3 font-semibold">Decision Date</th>
                  <th className="py-2.5 px-3 font-semibold">Rationale &amp; Sign-off Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {decisionAuditList.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                      <Link to={`/risk?selected=${s.id}`} className="text-primary hover:underline">
                        {s.id}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          s.status === 'dismissed'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {s.status === 'dismissed' ? (
                          <CheckCircle2 className="size-3" />
                        ) : (
                          <Activity className="size-3" />
                        )}
                        {s.status === 'dismissed' ? 'Dismissed / Cleared' : 'Investigating'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {s.dismissedBy || s.investigatedBy || 'Supervisor Hazim'}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
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

      {/* 3. Scripted Monkey Load Analysis Prototype */}
      <ReportSection
        id="monkey-load-simulation"
        title="Aerial Span Monkey Troop Loading Simulation"
        description="Physical cable sag and tension estimation under wildlife troop load and crosswind gusts (Demo / Simulation Model)."
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
                className="p-4 rounded-xl border border-border bg-card space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-foreground truncate">
                    {item.corridor.split(' ')[0]}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.riskLevel === 'Critical'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : item.riskLevel === 'Elevated'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
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

                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Calculated Sag Deflection:</span>
                    <span
                      className={`font-mono font-bold ${
                        item.calculatedSagCm > item.safetyThresholdCm ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {item.calculatedSagCm} cm
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
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
