import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Activity,
  Layers,
  Camera,
  Film,
} from 'lucide-react';
import { ReportSection } from '../ReportSection';
import type { FalconEvent } from '@/data/events';
import type { FalconCase } from '@/types/cases';
import type { DeviceRecord } from '@/types/devices';
import type { ReportDateRange, ReportParameters } from '@/types/reports';
import { parseDate, formatAbsoluteMYT, getServerNow } from '@/lib/dateTime';

export interface OperationsReportProps {
  events: FalconEvent[];
  cases: FalconCase[];
  devices: DeviceRecord[];
  dateRange: ReportDateRange;
  parameters: ReportParameters;
}

export const OperationsReport: React.FC<OperationsReportProps> = ({
  events,
  cases,
  devices,
  dateRange: _dateRange,
  parameters,
}) => {
  const isMultiDay =
    parameters.periodPreset === 'last_week' ||
    parameters.periodPreset === 'last_month' ||
    parameters.periodPreset === 'last_7_days' ||
    parameters.periodPreset === 'last_30_days';

  // Filter events by site and simulated flag
  const scopedEvents = useMemo(() => {
    return events.filter((e) => {
      if (!parameters.includeSimulatedEvents && e.source === 'Simulation') {
        return false;
      }
      if (parameters.site && parameters.site !== 'All sites' && parameters.site.toLowerCase() !== 'all') {
        if (e.site && e.site !== parameters.site) {
          return false;
        }
      }
      return true;
    });
  }, [events, parameters.includeSimulatedEvents, parameters.site]);

  // Hourly distribution (00 to 23)
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${String(i).padStart(2, '0')}:00`,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: 0,
    }));

    for (const e of scopedEvents) {
      const d = parseDate(e.receivedAt || e.captured);
      if (d) {
        const hr = d.getHours();
        if (hr >= 0 && hr < 24) {
          if (e.priority === 'Critical') hours[hr].critical++;
          else if (e.priority === 'High') hours[hr].high++;
          else if (e.priority === 'Medium') hours[hr].medium++;
          else hours[hr].low++;
          hours[hr].total++;
        }
      }
    }
    return hours;
  }, [scopedEvents]);

  const maxHourlyCount = useMemo(() => {
    return Math.max(1, ...hourlyData.map((h) => h.total));
  }, [hourlyData]);

  // Day-of-week breakdown for multi-day views
  const weekdayData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name) => ({
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
        // Mon=0, Sun=6
        const dayIdx = (d.getDay() + 6) % 7;
        if (e.priority === 'Critical') days[dayIdx].critical++;
        else if (e.priority === 'High') days[dayIdx].high++;
        else if (e.priority === 'Medium') days[dayIdx].medium++;
        else days[dayIdx].low++;
        days[dayIdx].total++;
      }
    }
    return days;
  }, [scopedEvents]);

  const maxWeekdayCount = useMemo(() => {
    return Math.max(1, ...weekdayData.map((d) => d.total));
  }, [weekdayData]);

  // Section 2: To handle now — Unacknowledged events (top 10)
  const unacknowledgedEvents = useMemo(() => {
    return scopedEvents
      .filter((e) => e.state === 'New')
      .slice(0, 10);
  }, [scopedEvents]);

  // Section 2: To handle now — Open cases (top 10)
  const openCases = useMemo(() => {
    return cases
      .filter((c) => c.status === 'Open' || c.status === 'In progress' || c.status === 'In review')
      .slice(0, 10);
  }, [cases]);

  // Section 3: Devices to check — Top 10 offline or stale contact devices (> 24h)
  const devicesToCheck = useMemo(() => {
    const now = getServerNow().getTime();
    return devices
      .map((d) => {
        const contactMs = parseDate(d.lastContactAt)?.getTime() || 0;
        const isStale = d.connectivityState === 'online' && now - contactMs > 24 * 3600 * 1000;
        const isOffline = d.connectivityState === 'offline';
        return {
          ...d,
          isStale,
          isOffline,
          staleHours: Math.round(Math.max(0, now - contactMs) / (3600 * 1000)),
        };
      })
      .filter((d) => d.isOffline || d.isStale)
      .slice(0, 10);
  }, [devices]);

  // Section 4: Hot spots & evidence
  const repeatHotspots = useMemo(() => {
    const counts: Record<string, { corridor: string; count: number; priority: string }> = {};
    for (const e of scopedEvents) {
      const key = e.asset || 'General corridor';
      if (!counts[key]) {
        counts[key] = { corridor: key, count: 0, priority: e.priority };
      }
      counts[key].count++;
      if (e.priority === 'Critical') counts[key].priority = 'Critical';
      else if (e.priority === 'High' && counts[key].priority !== 'Critical') {
        counts[key].priority = 'High';
      }
    }
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [scopedEvents]);

  // Evidence metrics
  const totalEventsCount = scopedEvents.length;
  const eventsWithSnapshot = scopedEvents.filter((e) => e.snapshots && e.snapshots.length > 0).length;
  const snapshotRate = totalEventsCount > 0 ? Math.round((eventsWithSnapshot / totalEventsCount) * 100) : 100;
  const eventsWithClip = scopedEvents.filter((e) => (e as any).videoClipAvailable || (e as any).clipAvailable).length;

  return (
    <div className="space-y-6">
      {/* SECTION 1: Events by hour / day */}
      <ReportSection
        id="section-events-temporal"
        title={isMultiDay ? 'Events by Day & Weekday Distribution' : 'Hourly Event Volume & Severity Progression'}
        description={
          isMultiDay
            ? 'Distribution of detection alarms across days of the week for this reporting period.'
            : 'Chronological distribution of alarms across the 24-hour shift cycle.'
        }
        hasTableView
        tableContent={
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground">
                  <th className="py-2 px-3 font-semibold">{isMultiDay ? 'Day' : 'Hour'}</th>
                  <th className="py-2 px-3 font-semibold">Critical</th>
                  <th className="py-2 px-3 font-semibold">High</th>
                  <th className="py-2 px-3 font-semibold">Medium</th>
                  <th className="py-2 px-3 font-semibold">Low</th>
                  <th className="py-2 px-3 font-semibold">Total Alarms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {(isMultiDay ? weekdayData : hourlyData).map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/20">
                    <td className="py-2 px-3 font-medium text-foreground">
                      {'name' in row ? row.name : row.label}
                    </td>
                    <td className="py-2 px-3 text-rose-500 font-medium">{row.critical}</td>
                    <td className="py-2 px-3 text-amber-500 font-medium">{row.high}</td>
                    <td className="py-2 px-3 text-blue-500 font-medium">{row.medium}</td>
                    <td className="py-2 px-3 text-muted-foreground">{row.low}</td>
                    <td className="py-2 px-3 font-bold text-foreground">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      >
        <div className="space-y-4 pt-1">
          {isMultiDay ? (
            /* Multi-day weekday column bars */
            <div className="h-44 flex items-end gap-3 px-2 pt-4 pb-2 border-b border-border/60">
              {weekdayData.map((d) => {
                const heightPct = Math.round((d.total / maxWeekdayCount) * 100);
                return (
                  <div key={d.name} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] text-muted-foreground font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.total}
                    </span>
                    <div
                      style={{ height: `${Math.max(6, heightPct)}%` }}
                      className={`w-full max-w-[48px] rounded-t transition-all ${
                        d.total > 0
                          ? d.critical > 0
                            ? 'bg-rose-500'
                            : d.high > 0
                            ? 'bg-amber-500'
                            : 'bg-primary'
                          : 'bg-muted/40'
                      }`}
                    />
                    <span className="text-[11px] font-semibold text-muted-foreground">{d.name}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Single day 24-hour bars */
            <div className="h-44 flex items-end gap-1 px-1 pt-4 pb-2 border-b border-border/60">
              {hourlyData.map((h) => {
                const heightPct = Math.round((h.total / maxHourlyCount) * 100);
                const isPeak = h.total === maxHourlyCount && maxHourlyCount > 0;
                return (
                  <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <span className="text-[9px] text-muted-foreground font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                      {h.total}
                    </span>
                    <div
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                      className={`w-full rounded-t transition-all ${
                        isPeak
                          ? 'bg-amber-500 shadow-xs'
                          : h.total > 0
                          ? 'bg-primary/80 group-hover:bg-primary'
                          : 'bg-muted/30'
                      }`}
                    />
                    {h.hour % 3 === 0 && (
                      <span className="text-[9px] text-muted-foreground font-mono mt-0.5">
                        {String(h.hour).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-rose-500" />
                <span>Critical</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-amber-500" />
                <span>High</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" />
                <span>Standard</span>
              </span>
            </div>
            <span className="text-[11px]">
              Peak activity evaluates to {isMultiDay ? 'busiest weekdays' : 'highest volume hours'}.
            </span>
          </div>
        </div>
      </ReportSection>

      {/* SECTION 2: To handle now — Unacknowledged events & Open cases */}
      <ReportSection
        id="section-to-handle-now"
        title="To Handle Now (Shift Handover Action Queue)"
        description="Outstanding alerts, unacknowledged triage queue, and open cases requiring immediate operator action."
        viewAllLink={{ label: 'View all unacknowledged events in Event inbox', href: '/events?tab=new' }}
        topLimitNotice="Showing top 10 items. Priority ordered by severity and capture time."
      >
        <div className="space-y-6">
          {/* Sub-table A: Unacknowledged Events */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Activity className="size-3.5 text-primary" />
                <span>Unacknowledged alarms waiting for triage ({unacknowledgedEvents.length})</span>
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground">
                    <th className="py-2 px-3 font-semibold">Event ID</th>
                    <th className="py-2 px-3 font-semibold">Severity</th>
                    <th className="py-2 px-3 font-semibold">Corridor / Asset</th>
                    <th className="py-2 px-3 font-semibold">Title</th>
                    <th className="py-2 px-3 font-semibold">Logged (MYT)</th>
                    <th className="py-2 px-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {unacknowledgedEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-muted/20">
                      <td className="py-2.5 px-3 font-mono font-semibold text-foreground">{evt.id}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            evt.priority === 'Critical'
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              : evt.priority === 'High'
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                          }`}
                        >
                          {evt.priority}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">{evt.asset}</td>
                      <td className="py-2.5 px-3 text-foreground font-medium">{evt.type}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                        {formatAbsoluteMYT(evt.receivedAt || evt.captured)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          to={`/events/${evt.id}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-[11px]"
                        >
                          <span>Open</span>
                          <ExternalLink className="size-2.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {unacknowledgedEvents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted-foreground text-xs">
                        All events acknowledged. No pending alerts in the triage queue.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sub-table B: Open Cases */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="size-3.5 text-primary" />
                <span>Open & in-progress cases ({openCases.length})</span>
              </span>
              <Link
                to="/cases?status=open"
                className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                <span>All cases</span>
                <ExternalLink className="size-2.5" />
              </Link>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground">
                    <th className="py-2 px-3 font-semibold">Case ID</th>
                    <th className="py-2 px-3 font-semibold">Status</th>
                    <th className="py-2 px-3 font-semibold">Priority</th>
                    <th className="py-2 px-3 font-semibold">Title</th>
                    <th className="py-2 px-3 font-semibold">Assignee</th>
                    <th className="py-2 px-3 font-semibold">Opened</th>
                    <th className="py-2 px-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {openCases.map((c) => {
                    const srcEvt = events.find((e) => e.id === c.sourceEventId);
                    const casePriority = srcEvt?.priority || 'High';

                    return (
                      <tr key={c.id} className="hover:bg-muted/20">
                        <td className="py-2.5 px-3 font-mono font-semibold text-foreground">{c.id}</td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground">
                            {c.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              casePriority === 'Critical'
                                ? 'bg-rose-500/10 text-rose-500'
                                : casePriority === 'High'
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-blue-500/10 text-blue-500'
                            }`}
                          >
                            {casePriority}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-foreground font-medium truncate max-w-xs">{c.title}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{c.assignee || 'Unassigned'}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                          {c.createdAt ? formatAbsoluteMYT(c.createdAt) : '—'}
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
                    );
                  })}
                  {openCases.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-muted-foreground text-xs">
                        No open cases requiring shift handover.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ReportSection>

      {/* SECTION 3: Devices to check — Top 10 offline / stale contact devices */}
      <ReportSection
        id="section-devices-to-check"
        title="Devices to Check (Offline & Stale Contact Audit)"
        description="Field hardware reporting offline connectivity or failing to transmit heartbeat telemetry for > 24 hours."
        viewAllLink={{ label: 'View complete device fleet in Inventory', href: '/assets/inventory' }}
        topLimitNotice="Showing top 10 devices requiring inspection."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground">
                <th className="py-2 px-3 font-semibold">Device ID</th>
                <th className="py-2 px-3 font-semibold">Name & Model</th>
                <th className="py-2 px-3 font-semibold">Type</th>
                <th className="py-2 px-3 font-semibold">Mounted Pole</th>
                <th className="py-2 px-3 font-semibold">Connectivity</th>
                <th className="py-2 px-3 font-semibold">Last Contact (MYT)</th>
                <th className="py-2 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {devicesToCheck.map((dev) => (
                <tr key={dev.identifier} className="hover:bg-muted/20">
                  <td className="py-2.5 px-3 font-mono font-semibold text-foreground">{dev.identifier}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-foreground">{dev.name}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{dev.model}</div>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">{dev.type}</td>
                  <td className="py-2.5 px-3 font-mono text-muted-foreground">{dev.installedPoleId || 'Not installed'}</td>
                  <td className="py-2.5 px-3">
                    {dev.isOffline ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        Offline
                      </span>
                    ) : dev.isStale ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        Online (Stale &gt;24h)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500">
                        Online
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                    {dev.lastContactAt ? formatAbsoluteMYT(dev.lastContactAt) : 'Never'}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Link
                      to={`/assets/inventory/devices/${dev.identifier}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-[11px]"
                    >
                      <span>Inspect</span>
                      <ExternalLink className="size-2.5" />
                    </Link>
                  </td>
                </tr>
              ))}
              {devicesToCheck.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground text-xs">
                    All devices reporting active telemetry within expected intervals.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ReportSection>

      {/* SECTION 4: Hot spots & evidence line */}
      <ReportSection
        id="section-hotspots-evidence"
        title="Corridor Hot Spots & Evidence Completeness"
        description="Fibre corridors with recurring detection clusters and operational optical snapshot/clip audit."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Corridors by Event Count */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Top recurring corridors</span>
              <span className="text-muted-foreground">Incident count</span>
            </div>

            <div className="space-y-2">
              {repeatHotspots.map((spot) => (
                <div
                  key={spot.corridor}
                  className="p-2 rounded-lg bg-card border border-border/40 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-1.5 rounded-full ${
                        spot.priority === 'Critical'
                          ? 'bg-rose-500'
                          : spot.priority === 'High'
                          ? 'bg-amber-500'
                          : 'bg-primary'
                      }`}
                    />
                    <span className="font-mono font-medium text-foreground">{spot.corridor}</span>
                  </div>
                  <span className="font-bold font-mono text-foreground">{spot.count} alarms</span>
                </div>
              ))}
              {repeatHotspots.length === 0 && (
                <div className="py-4 text-center text-xs text-muted-foreground">No recurring hotspots detected.</div>
              )}
            </div>
          </div>

          {/* Evidence Completeness & Video Clips */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
            <span className="font-semibold text-foreground text-xs block">Evidence & video extraction status</span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-card border border-border/40 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Camera className="size-3.5 text-primary" />
                  <span>Snapshot coverage</span>
                </div>
                <div className="text-xl font-bold text-foreground">{snapshotRate}%</div>
                <div className="text-[11px] text-muted-foreground">
                  {eventsWithSnapshot} of {totalEventsCount} alarms with snapshot
                </div>
              </div>

              <div className="p-3 rounded-lg bg-card border border-border/40 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Film className="size-3.5 text-primary" />
                  <span>Video clips ready</span>
                </div>
                <div className="text-xl font-bold text-foreground">{eventsWithClip}</div>
                <div className="text-[11px] text-muted-foreground">
                  RTSP video clips extracted on demand
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
              Optical snapshots are captured automatically by Hikvision/Dahua cameras at detection time.
              RTSP video clips are pulled from Edge ring buffers upon supervisor investigation.
            </p>
          </div>
        </div>
      </ReportSection>
    </div>
  );
};
