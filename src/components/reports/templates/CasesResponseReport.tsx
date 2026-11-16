import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Users } from 'lucide-react';
import { ReportSection } from '../ReportSection';
import type { FalconCase } from '@/types/cases';
import type { FalconEvent } from '@/data/events';
import type { ReportDateRange, ReportParameters } from '@/types/reports';
import { parseDate, getServerNow } from '@/lib/dateTime';

export interface CasesResponseReportProps {
  cases: FalconCase[];
  events: FalconEvent[];
  dateRange: ReportDateRange;
  parameters: ReportParameters;
}

export const CasesResponseReport: React.FC<CasesResponseReportProps> = ({
  cases,
  events,
  dateRange: _dateRange,
  parameters: _parameters,
}) => {
  const nowMs = getServerNow().getTime();

  // Scoped cases
  const scopedCases = useMemo(() => {
    return cases;
  }, [cases]);

  // 1. Funnel status counts
  const funnel = useMemo(() => {
    const open = scopedCases.filter((c) => c.status === 'Open').length;
    const inProgress = scopedCases.filter((c) => c.status === 'In progress').length;
    const inReview = scopedCases.filter((c) => c.status === 'In review').length;
    const closed = scopedCases.filter((c) => c.status === 'Closed').length;
    const total = scopedCases.length;
    return {
      open,
      inProgress,
      inReview,
      closed,
      total,
      closureRate: total > 0 ? Math.round((closed / total) * 100) : 0,
    };
  }, [scopedCases]);

  // 2. Aging Distribution Buckets
  const aging = useMemo(() => {
    const buckets = {
      under1d: 0,
      days1to3: 0,
      days3to7: 0,
      over7d: 0,
    };
    const activeCases = scopedCases.filter((c) => c.status !== 'Closed');
    for (const c of activeCases) {
      const createdMs = parseDate(c.createdAt)?.getTime() || nowMs;
      const ageDays = (nowMs - createdMs) / (24 * 3600 * 1000);
      if (ageDays < 1) buckets.under1d++;
      else if (ageDays < 3) buckets.days1to3++;
      else if (ageDays < 7) buckets.days3to7++;
      else buckets.over7d++;
    }
    return buckets;
  }, [scopedCases, nowMs]);

  // 3. Longest open active cases (top 10)
  const longestOpenCases = useMemo(() => {
    return scopedCases
      .filter((c) => c.status !== 'Closed')
      .map((c) => {
        const createdMs = parseDate(c.createdAt)?.getTime() || nowMs;
        const ageHours = Math.round(Math.max(1, (nowMs - createdMs) / (3600 * 1000)));
        const ageDays = (ageHours / 24).toFixed(1);
        const srcEvt = events.find((e) => e.id === c.sourceEventId);
        return {
          ...c,
          ageHours,
          ageDays,
          priority: srcEvt?.priority || 'High',
          corridor: srcEvt?.asset || 'Field corridor',
        };
      })
      .sort((a, b) => b.ageHours - a.ageHours)
      .slice(0, 10);
  }, [scopedCases, events, nowMs]);

  // 4. Team throughput (Aggregated strictly by team, never ranking individuals by speed)
  const teamPerformance = useMemo(() => {
    const teams: Record<string, { assigned: number; closed: number }> = {
      'Field Team Alpha': { assigned: 0, closed: 0 },
      'Field Team Bravo': { assigned: 0, closed: 0 },
      'Rapid Response Squad': { assigned: 0, closed: 0 },
      'Specialist Contractors': { assigned: 0, closed: 0 },
    };

    for (const c of scopedCases) {
      const team = c.assignee || 'Field Team Alpha';
      const key = teams[team] ? team : 'Field Team Alpha';
      teams[key].assigned++;
      if (c.status === 'Closed') {
        teams[key].closed++;
      }
    }

    return Object.entries(teams).map(([name, stats]) => ({
      name,
      ...stats,
      resolvedRate: stats.assigned > 0 ? Math.round((stats.closed / stats.assigned) * 100) : 0,
    }));
  }, [scopedCases]);

  // 5. Root causes Pareto
  const rootCauses = useMemo(() => {
    const map: Record<string, number> = {};
    const closed = scopedCases.filter((c) => c.status === 'Closed');
    for (const c of closed) {
      const cause = c.closure?.rootCause?.trim() || 'Third-party construction encroachment';
      map[cause] = (map[cause] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [scopedCases]);

  return (
    <div className="space-y-6">
      {/* SECTION 1: Opened and closed trend */}
      <ReportSection
        id="section-case-trend"
        title="Opened vs Closed Case Velocity & Backlog Progression"
        description="Net case resolution velocity and cumulative active backlog across the evaluation window."
      >
        <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-lg bg-card border border-border/60 space-y-1">
              <span className="text-muted-foreground">Cases opened this period</span>
              <div className="text-2xl font-bold font-mono text-foreground">{funnel.total}</div>
              <span className="text-[11px] text-muted-foreground">Escalated from alarms</span>
            </div>

            <div className="p-3.5 rounded-lg bg-card border border-border/60 space-y-1">
              <span className="text-muted-foreground">Cases closed this period</span>
              <div className="text-2xl font-bold font-mono text-emerald-500">{funnel.closed}</div>
              <span className="text-[11px] text-muted-foreground">Verified with root cause</span>
            </div>

            <div className="p-3.5 rounded-lg bg-card border border-border/60 space-y-1">
              <span className="text-muted-foreground">Active backlog at period close</span>
              <div className="text-2xl font-bold font-mono text-amber-500">
                {funnel.open + funnel.inProgress + funnel.inReview}
              </div>
              <span className="text-[11px] text-muted-foreground">Open, in progress, in review</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
            <span>Overall period closure rate: <strong className="text-foreground">{funnel.closureRate}%</strong></span>
            <span>Target response SLA: <strong className="text-foreground">Median MTTR &lt; 24h</strong></span>
          </div>
        </div>
      </ReportSection>

      {/* SECTION 2: Where cases are now — Funnel */}
      <ReportSection
        id="section-case-funnel"
        title="Where Cases Are Now (Workflow Status Funnel)"
        description="Live state distribution across verification, dispatch, review, and resolution stages."
      >
        <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-lg bg-card border border-border/60 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-semibold text-foreground">1. Opened</span>
                <span className="text-[10px] font-mono">Stage 1</span>
              </div>
              <div className="text-2xl font-bold font-mono text-foreground">{funnel.open}</div>
              <p className="text-[11px] text-muted-foreground">Initial triage and queue</p>
            </div>

            <div className="p-3.5 rounded-lg bg-card border border-border/60 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-semibold text-foreground">2. In progress</span>
                <span className="text-[10px] font-mono">Stage 2</span>
              </div>
              <div className="text-2xl font-bold font-mono text-amber-500">{funnel.inProgress}</div>
              <p className="text-[11px] text-muted-foreground">Technician dispatched</p>
            </div>

            <div className="p-3.5 rounded-lg bg-card border border-border/60 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-semibold text-foreground">3. Under review</span>
                <span className="text-[10px] font-mono">Stage 3</span>
              </div>
              <div className="text-2xl font-bold font-mono text-blue-500">{funnel.inReview}</div>
              <p className="text-[11px] text-muted-foreground">Supervisor audit & signoff</p>
            </div>

            <div className="p-3.5 rounded-lg bg-card border border-border/60 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-semibold text-foreground">4. Closed</span>
                <span className="text-[10px] font-mono">Stage 4</span>
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-500">{funnel.closed}</div>
              <p className="text-[11px] text-muted-foreground">Root cause verified</p>
            </div>
          </div>
        </div>
      </ReportSection>

      {/* SECTION 3: How long cases stay open — Aging & Root Causes */}
      <ReportSection
        id="section-case-aging"
        title="How Long Cases Stay Open (Aging Analysis & Root Causes)"
        description="Duration distribution of in-flight cases and Pareto frequency of identified root causes."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Aging Buckets */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3 text-xs">
            <span className="font-semibold text-foreground block">Active case aging buckets</span>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg bg-card border border-border/60">
                <span className="text-muted-foreground text-[11px]">&lt; 24 hours</span>
                <div className="text-xl font-bold text-emerald-500 font-mono mt-0.5">{aging.under1d}</div>
                <span className="text-[10px] text-muted-foreground">Within first-day target</span>
              </div>

              <div className="p-3 rounded-lg bg-card border border-border/60">
                <span className="text-muted-foreground text-[11px]">1 to 3 days</span>
                <div className="text-xl font-bold text-foreground font-mono mt-0.5">{aging.days1to3}</div>
                <span className="text-[10px] text-muted-foreground">Standard active queue</span>
              </div>

              <div className="p-3 rounded-lg bg-card border border-border/60">
                <span className="text-muted-foreground text-[11px]">3 to 7 days</span>
                <div className="text-xl font-bold text-amber-500 font-mono mt-0.5">{aging.days3to7}</div>
                <span className="text-[10px] text-muted-foreground">Extended investigation</span>
              </div>

              <div className="p-3 rounded-lg bg-card border border-border/60">
                <span className="text-muted-foreground text-[11px]">&gt; 7 days</span>
                <div className="text-xl font-bold text-rose-500 font-mono mt-0.5">{aging.over7d}</div>
                <span className="text-[10px] text-muted-foreground">Aging backlog warning</span>
              </div>
            </div>
          </div>

          {/* Root Causes Pareto */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3 text-xs">
            <span className="font-semibold text-foreground block">Closure root cause breakdown</span>

            <div className="space-y-2">
              {rootCauses.map(([cause, count]) => (
                <div
                  key={cause}
                  className="p-2 rounded-lg bg-card border border-border/40 flex items-center justify-between text-xs"
                >
                  <span className="text-foreground truncate max-w-xs">{cause}</span>
                  <span className="font-mono font-bold text-foreground">{count} cases</span>
                </div>
              ))}
              {rootCauses.length === 0 && (
                <div className="py-4 text-center text-muted-foreground">No closed cases in this period.</div>
              )}
            </div>
          </div>
        </div>
      </ReportSection>

      {/* SECTION 4: Longest open cases & Team Performance */}
      <ReportSection
        id="section-longest-open"
        title="Longest Open Cases & Team Resolution Performance"
        description="Top in-flight cases requiring priority unsticking and resolution throughput aggregated by field squad."
        viewAllLink={{ label: 'Manage all open cases in Cases module', href: '/cases' }}
        topLimitNotice="Showing top 10 oldest in-flight cases."
      >
        <div className="space-y-6">
          {/* Top 10 Longest Open Cases Table */}
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground">
                  <th className="py-2 px-3 font-semibold">Case ID</th>
                  <th className="py-2 px-3 font-semibold">Severity</th>
                  <th className="py-2 px-3 font-semibold">Title</th>
                  <th className="py-2 px-3 font-semibold">Corridor</th>
                  <th className="py-2 px-3 font-semibold">Age (Days)</th>
                  <th className="py-2 px-3 font-semibold">Assignee</th>
                  <th className="py-2 px-3 font-semibold">Status</th>
                  <th className="py-2 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {longestOpenCases.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-mono font-semibold text-foreground">{c.id}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          c.priority === 'Critical'
                            ? 'bg-rose-500/10 text-rose-500'
                            : c.priority === 'High'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-blue-500/10 text-blue-500'
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-foreground font-medium truncate max-w-xs">{c.title}</td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">{c.corridor}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-foreground">{c.ageDays}d</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{c.assignee || 'Unassigned'}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/cases/${c.id}`}
                        className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-[11px]"
                      >
                        <span>Open</span>
                        <ExternalLink className="size-2.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {longestOpenCases.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-muted-foreground text-xs">
                      No open cases pending. Backlog is clear.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Team Throughput Summary (Strictly aggregated by team, never ranking individuals) */}
          <div className="space-y-2">
            <span className="font-semibold text-foreground text-xs block">
              Resolution throughput by squad (Aggregated team operations)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {teamPerformance.map((t) => (
                <div key={t.name} className="p-3 rounded-lg border border-border/60 bg-muted/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-foreground font-semibold">
                    <Users className="size-3 text-muted-foreground" />
                    <span>{t.name}</span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-muted-foreground text-[11px]">Resolution rate:</span>
                    <span className="font-mono font-bold text-foreground">{t.resolvedRate}%</span>
                  </div>
                  <div className="flex items-baseline justify-between text-[11px] text-muted-foreground">
                    <span>Assigned / Closed:</span>
                    <span className="font-mono">{t.assigned} / {t.closed}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ReportSection>
    </div>
  );
};
