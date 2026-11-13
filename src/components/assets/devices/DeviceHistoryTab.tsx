import React, { useState, useMemo } from 'react';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Clock,
  History as HistoryIcon,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeviceConnectivityBadge } from './DeviceStateBadge';
import { formatDeviceDurationMs } from '@/data/deviceSelectors';
import { formatAbsoluteMYT, formatRelativeTime, parseDate } from '@/lib/dateTime';
import { cn } from '@/lib/utils';
import type {
  DeviceConnectivityState,
  DeviceTimelineKind,
  DeviceWithRelations,
} from '@/types/devices';

export interface DeviceHistoryTabProps {
  device: DeviceWithRelations;
}

export const DeviceHistoryTab: React.FC<DeviceHistoryTabProps> = ({ device }) => {
  const [subView, setSubView] = useState<'connectivity' | 'timeline'>('connectivity');
  const [stateFilter, setStateFilter] = useState<'all' | DeviceConnectivityState>('all');
  const [page, setPage] = useState(1);
  const rowsPerPage = 20;

  const [timelineKindFilter, setTimelineKindFilter] = useState<'all' | DeviceTimelineKind>('all');
  const [timelineSearch, setTimelineSearch] = useState('');

  const latestPeriod = device.connectivityPeriods[0] || null;
  const currentDurationMs = useMemo(() => {
    if (!latestPeriod) return null;
    const fromD = parseDate(latestPeriod.from);
    if (!fromD) return null;
    const endD = latestPeriod.to ? parseDate(latestPeriod.to) : new Date('2026-10-21T11:15:00+08:00');
    if (!endD) return null;
    return Math.max(0, endD.getTime() - fromD.getTime());
  }, [latestPeriod]);

  const filteredPeriods = useMemo(() => {
    if (stateFilter === 'all') return device.connectivityPeriods;
    return device.connectivityPeriods.filter((p) => p.state === stateFilter);
  }, [device.connectivityPeriods, stateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPeriods.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pagePeriods = filteredPeriods.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage
  );

  // Daily summary strip across all stored periods
  const dailySummary = useMemo(() => {
    const map = new Map<
      string,
      { day: string; onlineMs: number; staleMs: number; offlineMs: number; count: number }
    >();
    const anchorEnd = new Date('2026-10-21T11:15:00+08:00').getTime();

    for (const p of device.connectivityPeriods) {
      const fromD = parseDate(p.from);
      if (!fromD) continue;
      const toMs = p.to ? parseDate(p.to)?.getTime() ?? anchorEnd : anchorEnd;
      const dur = Math.max(0, toMs - fromD.getTime());
      const dayKey = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kuala_Lumpur',
      }).format(fromD);

      const entry = map.get(dayKey) || {
        day: dayKey,
        onlineMs: 0,
        staleMs: 0,
        offlineMs: 0,
        count: 0,
      };
      entry.count += 1;
      if (p.state === 'online') entry.onlineMs += dur;
      else if (p.state === 'stale') entry.staleMs += dur;
      else entry.offlineMs += dur;
      map.set(dayKey, entry);
    }

    return Array.from(map.values()).slice(0, 7);
  }, [device.connectivityPeriods]);

  const filteredTimeline = useMemo(() => {
    const q = timelineSearch.trim().toLowerCase();
    return device.timeline.filter((item) => {
      if (timelineKindFilter !== 'all' && item.kind !== timelineKindFilter) return false;
      if (q) {
        const hay = `${item.message} ${item.field || ''} ${item.actor || ''} ${item.kind}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [device.timeline, timelineKindFilter, timelineSearch]);

  const groupedTimeline = useMemo(() => {
    const groups = new Map<string, typeof filteredTimeline>();
    for (const item of filteredTimeline) {
      const d = parseDate(item.timestamp);
      const dayLabel = d
        ? new Intl.DateTimeFormat('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            timeZone: 'Asia/Kuala_Lumpur',
          }).format(d)
        : 'Unknown date';
      const arr = groups.get(dayLabel) || [];
      arr.push(item);
      groups.set(dayLabel, arr);
    }
    return Array.from(groups.entries());
  }, [filteredTimeline]);

  return (
    <div className="space-y-4">
      {/* Current State Since Header + Mode Toggle */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <DeviceConnectivityBadge
            state={latestPeriod?.state || device.connectivityState}
            size="sm"
          />
          <div className="text-xs">
            <span className="font-semibold text-foreground">
              {(latestPeriod?.state || device.connectivityState) === 'online'
                ? 'Online'
                : (latestPeriod?.state || device.connectivityState) === 'offline'
                ? 'Offline'
                : 'Stale'}{' '}
              since{' '}
              <span className="font-mono">
                {latestPeriod
                  ? formatAbsoluteMYT(latestPeriod.from, { showSeconds: false })
                  : formatAbsoluteMYT(device.lastContactAt, { showSeconds: false })}
              </span>
            </span>
            {currentDurationMs !== null && (
              <span className="text-muted-foreground ml-2 font-mono">
                ({formatDeviceDurationMs(currentDurationMs)})
              </span>
            )}
          </div>
        </div>

        <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5 self-start">
          <button
            type="button"
            onClick={() => setSubView('connectivity')}
            className={cn(
              'flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-medium cursor-pointer transition-all',
              subView === 'connectivity'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Activity className="size-3.5 text-primary" />
            <span>Connectivity ({device.connectivityPeriods.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubView('timeline')}
            className={cn(
              'flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-medium cursor-pointer transition-all',
              subView === 'timeline'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <HistoryIcon className="size-3.5 text-primary" />
            <span>Timeline ({device.timeline.length})</span>
          </button>
        </div>
      </div>

      {subView === 'connectivity' ? (
        <div className="space-y-4">
          {/* Daily Summary Strip */}
          {dailySummary.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-2.5">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="size-3.5 text-primary" />
                <span>Daily breakdown (MYT)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {dailySummary.map((d) => (
                  <div
                    key={d.day}
                    className="rounded-lg border border-border bg-muted/25 px-3 py-2 text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold text-foreground">
                      <span>{d.day}</span>
                      <span className="font-mono text-muted-foreground">{d.count} periods</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      <span className="text-emerald-500">On {formatDeviceDurationMs(d.onlineMs)}</span>
                      <span className="text-amber-500">St {formatDeviceDurationMs(d.staleMs)}</span>
                      <span className="text-red-500">Off {formatDeviceDurationMs(d.offlineMs)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connectivity Filter & Table */}
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                {(['all', 'online', 'stale', 'offline'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setStateFilter(s);
                      setPage(1);
                    }}
                    className={cn(
                      'px-2.5 h-7 rounded-md text-xs font-medium capitalize cursor-pointer border transition-colors',
                      stateFilter === s
                        ? 'bg-primary/12 text-primary border-primary/40 font-semibold'
                        : 'bg-card text-muted-foreground border-border hover:text-foreground'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {filteredPeriods.length} periods
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-4 font-semibold">State</th>
                    <th className="py-2.5 px-4 font-semibold">From</th>
                    <th className="py-2.5 px-4 font-semibold">To</th>
                    <th className="py-2.5 px-4 font-semibold">Duration</th>
                    <th className="py-2.5 px-4 font-semibold">Recorded by</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {pagePeriods.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No connectivity periods match this filter.
                      </td>
                    </tr>
                  ) : (
                    pagePeriods.map((p) => {
                      const fromD = parseDate(p.from);
                      const toD = p.to
                        ? parseDate(p.to)
                        : new Date('2026-10-21T11:15:00+08:00');
                      const durMs =
                        fromD && toD ? Math.max(0, toD.getTime() - fromD.getTime()) : null;

                      return (
                        <tr key={p.id} className="hover:bg-muted/30">
                          <td className="py-2.5 px-4">
                            <DeviceConnectivityBadge state={p.state} />
                          </td>
                          <td className="py-2.5 px-4 font-mono text-foreground whitespace-nowrap">
                            {formatAbsoluteMYT(p.from, { showSeconds: false })}
                          </td>
                          <td className="py-2.5 px-4 font-mono whitespace-nowrap">
                            {p.to ? (
                              <span className="text-foreground">
                                {formatAbsoluteMYT(p.to, { showSeconds: false })}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-primary/12 text-primary font-semibold text-[11px]">
                                Current
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-foreground tabular-nums">
                            {durMs !== null ? formatDeviceDurationMs(durMs) : '—'}
                          </td>
                          <td className="py-2.5 px-4 text-muted-foreground">{p.recordedBy}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Page <strong className="font-mono text-foreground">{safePage}</strong> of{' '}
                  <strong className="font-mono text-foreground">{totalPages}</strong>
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-7 w-7 p-0 cursor-pointer"
                  >
                    <ChevronLeft className="size-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-7 w-7 p-0 cursor-pointer"
                  >
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Audit Timeline Mode */
        <div className="rounded-xl border border-border bg-card shadow-xs p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                ['all', 'Configuration', 'Installed', 'Uninstalled', 'Lifecycle', 'Edited', 'Connection check'] as const
              ).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTimelineKindFilter(k)}
                  className={cn(
                    'px-2.5 h-7 rounded-md text-xs font-medium cursor-pointer border transition-colors',
                    timelineKindFilter === k
                      ? 'bg-primary/12 text-primary border-primary/40 font-semibold'
                      : 'bg-background text-muted-foreground border-border hover:text-foreground'
                  )}
                >
                  {k === 'all' ? 'All entries' : k}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={timelineSearch}
                onChange={(e) => setTimelineSearch(e.target.value)}
                placeholder="Search timeline..."
                className="w-full h-8 rounded-lg border border-border bg-background pl-8 pr-7 text-xs"
              />
              {timelineSearch && (
                <button
                  type="button"
                  onClick={() => setTimelineSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {groupedTimeline.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No timeline events match these filters.
            </div>
          ) : (
            <div className="space-y-4">
              {groupedTimeline.map(([day, items]) => (
                <div key={day} className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1">
                    {day}
                  </div>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border bg-muted/20 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/25">
                              {item.kind}
                            </span>
                            <span className="font-medium text-foreground">{item.message}</span>
                          </div>
                          {(item.fromValue || item.toValue) && (
                            <div className="text-[11px] text-muted-foreground font-mono">
                              {item.field ? `${item.field}: ` : ''}
                              {item.fromValue && (
                                <span className="line-through opacity-75 mr-1.5">
                                  {item.fromValue}
                                </span>
                              )}
                              {item.toValue && (
                                <span className="text-foreground font-semibold">
                                  → {item.toValue}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0 text-[11px] text-muted-foreground">
                          <div className="font-mono text-foreground">
                            {formatAbsoluteMYT(item.timestamp, { showSeconds: false })}
                          </div>
                          <div>
                            {formatRelativeTime(item.timestamp)}
                            {item.actor ? ` · ${item.actor}` : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
