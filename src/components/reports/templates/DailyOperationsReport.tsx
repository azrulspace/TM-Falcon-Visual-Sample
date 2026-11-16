import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ExternalLink,
  Radio,
  CheckCircle2,
  Activity,
  Layers,
} from 'lucide-react';
import { ReportSection } from '../ReportSection';
import type { FalconEvent } from '@/data/events';
import type { FalconCase } from '@/types/cases';
import type { DeviceRecord } from '@/types/devices';
import type { ReportDateRange, ReportParameters } from '@/types/reports';
import { parseDate, formatAbsoluteMYT } from '@/lib/dateTime';

export interface DailyOperationsReportProps {
  events: FalconEvent[];
  cases: FalconCase[];
  devices: DeviceRecord[];
  dateRange: ReportDateRange;
  parameters: ReportParameters;
}

export const DailyOperationsReport: React.FC<DailyOperationsReportProps> = ({
  events,
  cases,
  devices,
  dateRange: _dateRange,
  parameters,
}) => {
  // Filter events within active timeframe and site
  const filteredEvents = useMemo(() => {
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

  // Hourly event counts (24 hours: 00 to 23)
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

    for (const e of filteredEvents) {
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
  }, [filteredEvents]);

  const maxHourlyCount = useMemo(() => {
    return Math.max(1, ...hourlyData.map((h) => h.total));
  }, [hourlyData]);

  // Handover items: Open items requiring incoming shift action
  const handoverItems = useMemo(() => {
    const unackedEvents = filteredEvents
      .filter((e) => e.state === 'New')
      .slice(0, 8)
      .map((e) => ({
        id: e.id,
        kind: 'Event' as const,
        type: e.type,
        priority: e.priority,
        timestamp: e.receivedAt || e.captured,
        asset: e.asset,
        assignee: e.assignee || 'Unassigned',
        status: 'Unacknowledged',
        link: `/events?search=${encodeURIComponent(e.id)}`,
      }));

    const openCasesList = cases
      .filter((c) => c.status === 'Open' || c.status === 'In progress')
      .slice(0, 8)
      .map((c) => ({
        id: c.id,
        kind: 'Case' as const,
        type: c.title,
        priority: 'High', // Default operational priority for open cases
        timestamp: c.createdAt,
        asset: c.sourceEventId || 'Multi-asset',
        assignee: c.assignee || 'Field Team Alpha',
        status: c.status,
        link: `/cases/${c.id}`,
      }));

    return [...unackedEvents, ...openCasesList].slice(0, 12);
  }, [filteredEvents, cases]);

  // Devices state changes in last 24h & stale contact devices
  const deviceStateChanges = useMemo(() => {
    return devices.filter((d) => {
      if (parameters.site && parameters.site !== 'All sites' && parameters.site.toLowerCase() !== 'all') {
        if (d.siteName && d.siteName !== parameters.site) return false;
      }
      return d.connectivityState === 'offline' || d.connectivityState === 'stale';
    });
  }, [devices, parameters.site]);

  // Export CSV for Handover list
  const exportHandoverCsv = () => {
    const headers = ['Kind', 'Identifier', 'Title / Type', 'Priority', 'Logged Time (MYT)', 'Asset', 'Assignee', 'Status'];
    const rows = handoverItems.map((item) => [
      item.kind,
      item.id,
      item.type,
      item.priority,
      formatAbsoluteMYT(item.timestamp),
      item.asset,
      item.assignee,
      item.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `shift_handover_list_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* 1. Hourly Event Volume & Priority Progression */}
      <ReportSection
        id="hourly-events-section"
        title="Hourly Event Volume & Severity Progression"
        description="Chronological distribution of alarms across the 24-hour shift cycle."
        hasTableView={true}
        tableContent={
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-[11px] text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Hour Window (MYT)</th>
                  <th className="py-2.5 px-3 text-rose-600 dark:text-rose-400">Critical</th>
                  <th className="py-2.5 px-3 text-amber-600 dark:text-amber-400">High</th>
                  <th className="py-2.5 px-3 text-blue-600 dark:text-blue-400">Medium</th>
                  <th className="py-2.5 px-3 text-slate-500">Low</th>
                  <th className="py-2.5 px-3 text-right font-bold text-foreground">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {hourlyData.map((h) => (
                  <tr key={h.hour} className="hover:bg-muted/30">
                    <td className="py-2 px-3 font-mono text-muted-foreground">{h.label} - {String(h.hour).padStart(2, '0')}:59</td>
                    <td className="py-2 px-3 font-mono">{h.critical}</td>
                    <td className="py-2 px-3 font-mono">{h.high}</td>
                    <td className="py-2 px-3 font-mono">{h.medium}</td>
                    <td className="py-2 px-3 font-mono">{h.low}</td>
                    <td className="py-2 px-3 font-mono font-bold text-right text-foreground">{h.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      >
        <div className="space-y-3">
          {/* Stacked Bar Chart */}
          <div className="h-44 w-full flex items-end gap-1.5 pt-6 pb-2 px-1 border-b border-border/60">
            {hourlyData.map((h) => {
              const heightPct = h.total > 0 ? (h.total / maxHourlyCount) * 100 : 0;
              const criticalPct = h.total > 0 ? (h.critical / h.total) * 100 : 0;
              const highPct = h.total > 0 ? (h.high / h.total) * 100 : 0;
              const mediumPct = h.total > 0 ? (h.medium / h.total) * 100 : 0;
              const lowPct = h.total > 0 ? (h.low / h.total) * 100 : 0;

              return (
                <div
                  key={h.hour}
                  className="flex-1 flex flex-col justify-end items-center h-full group relative"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-popover text-popover-foreground text-[10px] p-1.5 rounded-lg border border-border shadow-md whitespace-nowrap pointer-events-none">
                    <span className="font-semibold">{h.label}: {h.total} events</span>
                    <span className="text-[9px] text-muted-foreground">
                      C:{h.critical} H:{h.high} M:{h.medium} L:{h.low}
                    </span>
                  </div>

                  {/* Stacked bar */}
                  <div
                    className="w-full max-w-[28px] rounded-t-sm flex flex-col-reverse overflow-hidden transition-all group-hover:brightness-110"
                    style={{ height: `${Math.max(4, heightPct)}%` }}
                  >
                    {criticalPct > 0 && (
                      <div
                        style={{ height: `${criticalPct}%` }}
                        className="bg-rose-500 w-full"
                        title={`Critical: ${h.critical}`}
                      />
                    )}
                    {highPct > 0 && (
                      <div
                        style={{ height: `${highPct}%` }}
                        className="bg-amber-500 w-full"
                        title={`High: ${h.high}`}
                      />
                    )}
                    {mediumPct > 0 && (
                      <div
                        style={{ height: `${mediumPct}%` }}
                        className="bg-blue-500 w-full"
                        title={`Medium: ${h.medium}`}
                      />
                    )}
                    {lowPct > 0 && (
                      <div
                        style={{ height: `${lowPct}%` }}
                        className="bg-slate-400 dark:bg-slate-600 w-full"
                        title={`Low: ${h.low}`}
                      />
                    )}
                  </div>

                  {/* Hour label on X axis */}
                  <span className="text-[9px] font-mono text-muted-foreground mt-1 truncate">
                    {h.hour % 3 === 0 ? String(h.hour).padStart(2, '0') : ''}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-sm bg-rose-500" />
                <span>Critical</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-sm bg-amber-500" />
                <span>High</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-sm bg-blue-500" />
                <span>Medium</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-sm bg-slate-400 dark:bg-slate-600" />
                <span>Low</span>
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              Peak hour: {hourlyData.reduce((prev, curr) => (curr.total > prev.total ? curr : prev), hourlyData[0]).label}
            </span>
          </div>
        </div>
      </ReportSection>

      {/* 2. Shift Handover List */}
      <ReportSection
        id="handover-list-section"
        title="Shift Handover Action List"
        description="Outstanding alerts, unacknowledged queue, and open cases requiring attention from the incoming shift."
        onExportCsv={exportHandoverCsv}
      >
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border text-[11px] text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Item ID</th>
                <th className="py-2.5 px-3">Category / Title</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Logged (MYT)</th>
                <th className="py-2.5 px-3">Corridor / Asset</th>
                <th className="py-2.5 px-3">Assignee</th>
                <th className="py-2.5 px-3">Current Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {handoverItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground space-y-1">
                    <CheckCircle2 className="size-6 text-emerald-500 mx-auto" />
                    <div className="font-semibold text-foreground text-xs">All shift items cleared</div>
                    <div className="text-[11px]">No unacknowledged events or critical open cases pending handover.</div>
                  </td>
                </tr>
              ) : (
                handoverItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-primary">
                      {item.id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        {item.kind === 'Case' ? (
                          <Layers className="size-3 text-amber-500 shrink-0" />
                        ) : (
                          <Activity className="size-3 text-primary shrink-0" />
                        )}
                        <span>{item.type}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          item.priority === 'Critical'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : item.priority === 'High'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">
                      {formatAbsoluteMYT(item.timestamp)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-foreground">{item.asset}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{item.assignee}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-foreground border border-border">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={item.link}
                        className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                      >
                        <span>Open</span>
                        <ExternalLink className="size-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ReportSection>

      {/* 3. Device Connectivity & Stale Contact Audit */}
      <ReportSection
        id="device-state-changes"
        title="Device Availability & Stale Contact Audit"
        description="Devices reporting offline connectivity or stale contact (> 24 hours) requiring inspection."
      >
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border text-[11px] text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Device ID</th>
                <th className="py-2.5 px-3">Device Name & Model</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Mounted Pole</th>
                <th className="py-2.5 px-3">Connectivity State</th>
                <th className="py-2.5 px-3">Last Contact (MYT)</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {deviceStateChanges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">
                    All network devices reporting normal online contact.
                  </td>
                </tr>
              ) : (
                deviceStateChanges.slice(0, 10).map((dev) => (
                  <tr key={dev.identifier} className="hover:bg-muted/30">
                    <td className="py-2.5 px-3 font-mono font-semibold text-primary">
                      {dev.identifier}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-foreground">{dev.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{dev.model}</div>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">{dev.type}</td>
                    <td className="py-2.5 px-3 font-mono">
                      {dev.installedPoleId ? (
                        <span className="text-foreground">{dev.installedPoleId}</span>
                      ) : (
                        <span className="text-amber-500 italic">Not installed</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          dev.connectivityState === 'offline'
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}
                      >
                        <Radio className="size-2.5" />
                        <span className="capitalize">{dev.connectivityState}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">
                      {dev.lastContactAt ? formatAbsoluteMYT(dev.lastContactAt) : 'Never reported'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/assets/inventory/devices/${dev.identifier}`}
                        className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                      >
                        <span>Inspect</span>
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
    </div>
  );
};
