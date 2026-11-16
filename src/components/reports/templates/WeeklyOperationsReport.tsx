import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Radio,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { ReportSection } from '../ReportSection';
import type { FalconEvent } from '@/data/events';
import type { FalconCase } from '@/types/cases';
import type { DeviceRecord } from '@/types/devices';
import type { ReportDateRange, ReportParameters } from '@/types/reports';
import { parseDate, formatAbsoluteMYT, getServerNow } from '@/lib/dateTime';

export interface WeeklyOperationsReportProps {
  events: FalconEvent[];
  cases: FalconCase[];
  devices: DeviceRecord[];
  dateRange: ReportDateRange;
  parameters: ReportParameters;
}

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WeeklyOperationsReport: React.FC<WeeklyOperationsReportProps> = ({
  events,
  cases,
  devices,
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

  // 1. Daily breakdown across the 7 days of the week
  const dailyBreakdown = useMemo(() => {
    const days = WEEKDAY_NAMES.map((name, i) => ({
      index: i,
      name,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: 0,
    }));

    for (const e of scopedEvents) {
      const d = parseDate(e.receivedAt || e.captured);
      if (d) {
        const dayIdx = (d.getDay() + 6) % 7; // Mon=0, Sun=6
        if (e.priority === 'Critical') days[dayIdx].critical++;
        else if (e.priority === 'High') days[dayIdx].high++;
        else if (e.priority === 'Medium') days[dayIdx].medium++;
        else days[dayIdx].low++;
        days[dayIdx].total++;
      }
    }
    return days;
  }, [scopedEvents]);

  const maxDailyCount = useMemo(() => {
    return Math.max(1, ...dailyBreakdown.map((d) => d.total));
  }, [dailyBreakdown]);

  // 2. 7x24 Heatmap matrix
  const heatmap = useMemo(() => {
    const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const e of scopedEvents) {
      const d = parseDate(e.receivedAt || e.captured);
      if (d) {
        const day = (d.getDay() + 6) % 7;
        const hr = d.getHours();
        if (day >= 0 && day < 7 && hr >= 0 && hr < 24) {
          matrix[day][hr]++;
        }
      }
    }
    return matrix;
  }, [scopedEvents]);

  const maxHeatmapVal = useMemo(() => {
    let max = 1;
    for (const row of heatmap) {
      for (const val of row) {
        if (val > max) max = val;
      }
    }
    return max;
  }, [heatmap]);

  // 3. Top 10 devices reporting incidents
  const topDevices = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of scopedEvents) {
      const dev = e.device || 'Unassigned';
      counts[dev] = (counts[dev] || 0) + 1;
    }
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return sorted.map(([devId, count]) => {
      const record = devices.find((d) => d.identifier === devId);
      return {
        id: devId,
        name: record?.name || 'Optical Sensor',
        type: record?.type || 'Camera',
        poleId: record?.installedPoleId || 'Not mounted',
        status: record?.connectivityState || 'online',
        count,
        share: scopedEvents.length > 0 ? Math.round((count / scopedEvents.length) * 100) : 0,
      };
    });
  }, [scopedEvents, devices]);

  // 4. Unresolved items older than 3 days
  const nowMs = getServerNow().getTime();
  const threeDaysMs = 3 * 24 * 3600 * 1000;

  const staleUnresolvedCases = useMemo(() => {
    return cases.filter((c) => {
      if (c.status === 'Closed') return false;
      const createdMs = parseDate(c.createdAt)?.getTime() || nowMs;
      return nowMs - createdMs > threeDaysMs;
    });
  }, [cases, nowMs, threeDaysMs]);

  return (
    <div className="space-y-6">
      {/* 1. Daily Event Progression Across Week */}
      <ReportSection
        id="weekly-trend"
        title="Weekly Event Volume by Day"
        description="Daily incident occurrences across Monday through Sunday with priority tiers."
      >
        <div className="space-y-3">
          <div className="h-44 w-full flex items-end gap-3 pt-6 pb-2 px-2 border-b border-border/60">
            {dailyBreakdown.map((d) => {
              const heightPct = d.total > 0 ? (d.total / maxDailyCount) * 100 : 0;
              const criticalPct = d.total > 0 ? (d.critical / d.total) * 100 : 0;
              const highPct = d.total > 0 ? (d.high / d.total) * 100 : 0;
              const mediumPct = d.total > 0 ? (d.medium / d.total) * 100 : 0;
              const lowPct = d.total > 0 ? (d.low / d.total) * 100 : 0;

              return (
                <div key={d.name} className="flex-1 flex flex-col justify-end items-center h-full group relative">
                  <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-popover text-popover-foreground text-[10px] p-1.5 rounded-lg border border-border shadow-md whitespace-nowrap pointer-events-none">
                    <span className="font-semibold">{d.name}: {d.total} incidents</span>
                    <span className="text-[9px] text-muted-foreground">
                      C:{d.critical} H:{d.high} M:{d.medium} L:{d.low}
                    </span>
                  </div>

                  <div
                    className="w-full max-w-[48px] rounded-t-sm flex flex-col-reverse overflow-hidden transition-all group-hover:brightness-110"
                    style={{ height: `${Math.max(4, heightPct)}%` }}
                  >
                    {criticalPct > 0 && <div style={{ height: `${criticalPct}%` }} className="bg-rose-500 w-full" />}
                    {highPct > 0 && <div style={{ height: `${highPct}%` }} className="bg-amber-500 w-full" />}
                    {mediumPct > 0 && <div style={{ height: `${mediumPct}%` }} className="bg-blue-500 w-full" />}
                    {lowPct > 0 && <div style={{ height: `${lowPct}%` }} className="bg-slate-400 dark:bg-slate-600 w-full" />}
                  </div>

                  <span className="text-xs font-semibold text-foreground mt-2">{d.name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{d.total}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-rose-500" /> Critical</span>
              <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-amber-500" /> High</span>
              <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-blue-500" /> Medium</span>
              <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-slate-400 dark:bg-slate-600" /> Low</span>
            </div>
            <span>Busiest day: {dailyBreakdown.reduce((prev, curr) => (curr.total > prev.total ? curr : prev), dailyBreakdown[0]).name}</span>
          </div>
        </div>
      </ReportSection>

      {/* 2. 7x24 Hour-by-Weekday Heatmap */}
      <ReportSection
        id="weekly-heatmap"
        title="Incident Clustering Heatmap (7 Days × 24 Hours)"
        description="Visual density identifying operational shift patterns and temporal risk windows."
      >
        <div className="space-y-2">
          <div className="overflow-x-auto">
            <div className="min-w-[680px] space-y-1">
              {heatmap.map((hours, dayIdx) => (
                <div key={dayIdx} className="flex items-center gap-1">
                  <span className="w-10 text-[11px] font-medium text-muted-foreground">
                    {WEEKDAY_NAMES[dayIdx]}
                  </span>
                  <div className="flex-1 grid grid-cols-24 gap-0.5">
                    {hours.map((val, hr) => {
                      const intensity = val > 0 ? Math.min(1, val / maxHeatmapVal) : 0;
                      return (
                        <div
                          key={hr}
                          className="h-6 rounded-xs transition-colors cursor-pointer group relative"
                          style={{
                            backgroundColor:
                              val === 0
                                ? 'var(--muted)'
                                : `rgba(244, 63, 94, ${Math.max(0.2, intensity)})`,
                          }}
                          title={`${WEEKDAY_NAMES[dayIdx]} ${String(hr).padStart(2, '0')}:00 - ${val} events`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Hour X-Axis Ticks */}
              <div className="flex items-center gap-1 pt-1 text-[9px] font-mono text-muted-foreground">
                <span className="w-10" />
                <div className="flex-1 flex justify-between">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>23:00</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
            <div className="flex items-center gap-1.5">
              <span>Low density</span>
              <span className="size-3 rounded-xs bg-muted" />
              <span className="size-3 rounded-xs bg-rose-500/20" />
              <span className="size-3 rounded-xs bg-rose-500/60" />
              <span className="size-3 rounded-xs bg-rose-500" />
              <span>Peak clustering</span>
            </div>
            <span className="text-[10px]">Matrix evaluated strictly in Asia/Kuala_Lumpur (+08:00)</span>
          </div>
        </div>
      </ReportSection>

      {/* 3. Top 10 Reporting Devices */}
      <ReportSection
        id="top-reporting-devices"
        title="Top 10 Reporting Devices"
        description="Sensors reporting the highest event density across the weekly monitoring window."
      >
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border text-[11px] text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Device ID</th>
                <th className="py-2.5 px-3">Device Name & Type</th>
                <th className="py-2.5 px-3">Mounted Pole</th>
                <th className="py-2.5 px-3">Telemetry State</th>
                <th className="py-2.5 px-3 text-right">Event Count</th>
                <th className="py-2.5 px-3 text-right">Share of Week</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {topDevices.map((d) => (
                <tr key={d.id} className="hover:bg-muted/30">
                  <td className="py-2.5 px-3 font-mono font-semibold text-primary">{d.id}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-foreground">{d.name}</div>
                    <div className="text-[10px] text-muted-foreground">{d.type}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-muted-foreground">{d.poleId}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        d.status === 'online'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}
                    >
                      <Radio className="size-2.5" />
                      <span className="capitalize">{d.status}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-right text-foreground">{d.count}</td>
                  <td className="py-2.5 px-3 font-mono text-right text-muted-foreground">{d.share}%</td>
                  <td className="py-2.5 px-3 text-right">
                    <Link
                      to={`/assets/inventory/devices/${d.id}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
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
      </ReportSection>

      {/* 4. Unresolved Cases Older than 3 Days */}
      <ReportSection
        id="unresolved-backlog"
        title="Aging Backlog: Unresolved Cases > 3 Days"
        description="Cases exceeding normal 72-hour operational turnaround requiring supervisor intervention."
      >
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border text-[11px] text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Case ID</th>
                <th className="py-2.5 px-3">Title / Subject</th>
                <th className="py-2.5 px-3">Opened At (MYT)</th>
                <th className="py-2.5 px-3">Aging Time</th>
                <th className="py-2.5 px-3">Assignee</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {staleUnresolvedCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">
                    No active cases exceed the 3-day turnaround threshold.
                  </td>
                </tr>
              ) : (
                staleUnresolvedCases.map((c) => {
                  const createdMs = parseDate(c.createdAt)?.getTime() || nowMs;
                  const daysOld = Math.floor((nowMs - createdMs) / (24 * 3600 * 1000));

                  return (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-3 font-mono font-semibold text-primary">{c.id}</td>
                      <td className="py-2.5 px-3 font-medium text-foreground">{c.title}</td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">
                        {formatAbsoluteMYT(c.createdAt)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-amber-600 dark:text-amber-400 font-semibold">
                        {daysOld} days old
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">{c.assignee || 'Unassigned'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          {c.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          to={`/cases/${c.id}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                        >
                          <span>Review</span>
                          <ExternalLink className="size-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </ReportSection>
    </div>
  );
};
