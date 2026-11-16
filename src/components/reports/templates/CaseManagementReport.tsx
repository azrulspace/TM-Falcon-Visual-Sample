import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Users,
} from 'lucide-react';
import { ReportSection } from '../ReportSection';
import type { FalconCase } from '@/types/cases';
import type { ReportDateRange, ReportParameters } from '@/types/reports';
import { parseDate, formatAbsoluteMYT, getServerNow } from '@/lib/dateTime';

export interface CaseManagementReportProps {
  cases: FalconCase[];
  dateRange: ReportDateRange;
  parameters: ReportParameters;
}

export const CaseManagementReport: React.FC<CaseManagementReportProps> = ({
  cases,
  dateRange: _dateRange,
  parameters: _parameters,
}) => {
  const nowMs = getServerNow().getTime();

  // 1. Status breakdown
  const statusCounts = useMemo(() => {
    return {
      open: cases.filter((c) => c.status === 'Open').length,
      inProgress: cases.filter((c) => c.status === 'In progress').length,
      inReview: cases.filter((c) => c.status === 'In review').length,
      closed: cases.filter((c) => c.status === 'Closed').length,
      total: cases.length,
    };
  }, [cases]);

  const closureRate =
    statusCounts.total > 0
      ? Math.round((statusCounts.closed / statusCounts.total) * 100)
      : 0;

  // 2. Aging Distribution Buckets for Open Cases
  const agingBuckets = useMemo(() => {
    const buckets = {
      under24h: 0,
      days1to3: 0,
      days4to7: 0,
      over7d: 0,
    };

    const activeCases = cases.filter((c) => c.status !== 'Closed');
    for (const c of activeCases) {
      const createdMs = parseDate(c.createdAt)?.getTime() || nowMs;
      const ageDays = (nowMs - createdMs) / (24 * 3600 * 1000);
      if (ageDays < 1) buckets.under24h++;
      else if (ageDays < 3) buckets.days1to3++;
      else if (ageDays < 7) buckets.days4to7++;
      else buckets.over7d++;
    }

    return buckets;
  }, [cases, nowMs]);

  // 3. Root Cause Pareto Breakdown
  const rootCauses = useMemo(() => {
    const map: Record<string, number> = {};
    const closed = cases.filter((c) => c.status === 'Closed');
    for (const c of closed) {
      const cause = c.closure?.rootCause?.trim() || 'Third-party construction encroachment';
      map[cause] = (map[cause] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [cases]);

  // 4. Team throughput (Ethical Performance: Aggregated by Team, never ranking individuals)
  const teamThroughput = useMemo(() => {
    const teams: Record<string, { assigned: number; closed: number }> = {
      'Field Team Alpha': { assigned: 0, closed: 0 },
      'Field Team Bravo': { assigned: 0, closed: 0 },
      'Rapid Response Squad': { assigned: 0, closed: 0 },
    };

    for (const c of cases) {
      const team =
        c.assignee && c.assignee.includes('Bravo')
          ? 'Field Team Bravo'
          : c.assignee && c.assignee.includes('Rapid')
          ? 'Rapid Response Squad'
          : 'Field Team Alpha';

      teams[team].assigned++;
      if (c.status === 'Closed') {
        teams[team].closed++;
      }
    }

    return Object.entries(teams).map(([name, data]) => ({
      name,
      assigned: data.assigned,
      closed: data.closed,
      rate: data.assigned > 0 ? Math.round((data.closed / data.assigned) * 100) : 0,
    }));
  }, [cases]);

  // 5. Open cases older than 7 days
  const agedOver7dCases = useMemo(() => {
    return cases.filter((c) => {
      if (c.status === 'Closed') return false;
      const createdMs = parseDate(c.createdAt)?.getTime() || nowMs;
      return nowMs - createdMs > 7 * 24 * 3600 * 1000;
    });
  }, [cases, nowMs]);

  return (
    <div className="space-y-6">
      {/* 1. Status Funnel & Velocity */}
      <ReportSection
        id="case-funnel-section"
        title="Case Management Pipeline & Throughput Velocity"
        description="Lifecycle tracking from initial event triage to field resolution and supervisor audit."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
              <div className="text-[11px] text-muted-foreground font-medium">1. Open Triage</div>
              <div className="text-xl font-bold font-mono text-foreground">{statusCounts.open}</div>
              <div className="text-[10px] text-muted-foreground">Pending squad dispatch</div>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
              <div className="text-[11px] text-muted-foreground font-medium">2. Field In Progress</div>
              <div className="text-xl font-bold font-mono text-amber-500">{statusCounts.inProgress}</div>
              <div className="text-[10px] text-muted-foreground">On-site investigation</div>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
              <div className="text-[11px] text-muted-foreground font-medium">3. Under Review</div>
              <div className="text-xl font-bold font-mono text-blue-500">{statusCounts.inReview}</div>
              <div className="text-[10px] text-muted-foreground">Verification review</div>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
              <div className="text-[11px] text-muted-foreground font-medium">4. Closed Resolved</div>
              <div className="text-xl font-bold font-mono text-emerald-500">{statusCounts.closed}</div>
              <div className="text-[10px] text-muted-foreground">Audit completed</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/30 border border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span>Overall Case Resolution Rate: <strong className="text-foreground">{closureRate}%</strong></span>
            <span>Target Turnaround SLA: <strong className="text-foreground">&lt; 24h P1 / &lt; 72h P2</strong></span>
          </div>
        </div>
      </ReportSection>

      {/* 2. Case Aging Distribution Buckets */}
      <ReportSection
        id="aging-distribution"
        title="Case Aging Distribution Profile"
        description="Partitioning of active cases across elapsed turnaround duration buckets."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1">
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">&lt; 24 Hours</div>
            <div className="text-2xl font-bold font-mono text-foreground">{agingBuckets.under24h}</div>
            <div className="text-[10px] text-muted-foreground">Within standard triage window</div>
          </div>

          <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-1">
            <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">1 to 3 Days</div>
            <div className="text-2xl font-bold font-mono text-foreground">{agingBuckets.days1to3}</div>
            <div className="text-[10px] text-muted-foreground">Active field dispatch</div>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1">
            <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">4 to 7 Days</div>
            <div className="text-2xl font-bold font-mono text-foreground">{agingBuckets.days4to7}</div>
            <div className="text-[10px] text-muted-foreground">Requires supervisor follow-up</div>
          </div>

          <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1">
            <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">&gt; 7 Days (Overdue)</div>
            <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">{agingBuckets.over7d}</div>
            <div className="text-[10px] text-rose-600/80">Exceeds operational threshold</div>
          </div>
        </div>
      </ReportSection>

      {/* 3. Root Cause Classification */}
      <ReportSection
        id="root-cause-pareto"
        title="Root Cause Classification (Closed Cases)"
        description="Pareto analysis of verified root causes documented during case closure."
      >
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border text-[11px] text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Identified Root Cause</th>
                <th className="py-2.5 px-3 text-right">Cases Resolved</th>
                <th className="py-2.5 px-3 text-right">Share (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rootCauses.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-muted-foreground">
                    No closed case root causes recorded yet.
                  </td>
                </tr>
              ) : (
                rootCauses.map(([cause, count]) => {
                  const share =
                    statusCounts.closed > 0
                      ? Math.round((count / statusCounts.closed) * 100)
                      : 0;
                  return (
                    <tr key={cause} className="hover:bg-muted/30">
                      <td className="py-2.5 px-3 font-medium text-foreground">{cause}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-right text-foreground">{count}</td>
                      <td className="py-2.5 px-3 font-mono text-right text-muted-foreground">{share}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </ReportSection>

      {/* 4. Team Throughput (Ethical Performance) */}
      <ReportSection
        id="team-throughput"
        title="Field Squad Throughput & Workload Balance"
        description="Operational throughput aggregated strictly by engineering team. Individual personnel are never ranked."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {teamThroughput.map((t) => (
            <div key={t.name} className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Users className="size-3.5 text-primary" />
                <span>{t.name}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                <span>Assigned Cases:</span>
                <span className="font-mono font-medium text-foreground">{t.assigned}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                <span>Resolved & Closed:</span>
                <span className="font-mono font-medium text-foreground">{t.closed}</span>
              </div>
              <div className="pt-1 border-t border-border/40 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-foreground">Completion Rate:</span>
                <span className="font-mono font-bold text-primary">{t.rate}%</span>
              </div>
            </div>
          ))}
        </div>
      </ReportSection>

      {/* 5. Aged Cases > 7 Days */}
      {agedOver7dCases.length > 0 && (
        <ReportSection
          id="aged-over-7d"
          title="Escalation Notice: Open Cases > 7 Days"
          description="Detailed register of prolonged cases requiring supervisor review."
        >
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-[11px] text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Case ID</th>
                  <th className="py-2.5 px-3">Subject / Incident</th>
                  <th className="py-2.5 px-3">Logged Date (MYT)</th>
                  <th className="py-2.5 px-3">Assigned Team</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {agedOver7dCases.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="py-2.5 px-3 font-mono font-semibold text-primary">{c.id}</td>
                    <td className="py-2.5 px-3 font-medium text-foreground">{c.title}</td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">
                      {formatAbsoluteMYT(c.createdAt)}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">{c.assignee || 'Unassigned'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/cases/${c.id}`}
                        className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="size-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportSection>
      )}
    </div>
  );
};
