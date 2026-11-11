import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Edit3,
  Activity,
  PlusCircle,
  Trash2,
  ArrowRight,
  Copy,
  Info,
  Clock,
  List,
  Table2,
} from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { RelativeTime } from '@/components/common/RelativeTime';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatAbsoluteMYT, parseDate, getServerNow } from '@/lib/dateTime';
import { formatCoordinates } from '@/lib/geo';
import { useToast } from '@/contexts/ToastContext';
import type {
  PoleWithRelations,
  PoleTimelineKind,
  PoleTimelineEntry,
} from '@/types/assets';
import { cn } from '@/lib/utils';

export interface PoleHistoryTabProps {
  pole: PoleWithRelations;
}

function formatDurationWithBasis(fromIso: string, toIso: string | null): {
  label: string;
  basis: string;
} {
  const fromDate = parseDate(fromIso);
  const serverNow = getServerNow();
  const toDate = toIso ? parseDate(toIso) : serverNow;
  if (!fromDate || !toDate) {
    return { label: '—', basis: 'Timestamp unavailable' };
  }
  const diffMs = Math.max(0, toDate.getTime() - fromDate.getTime());
  const totalMinutes = Math.floor(diffMs / 60000);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  let label = '< 1 min';
  if (totalDays >= 1) {
    label = totalDays === 1 ? '1 day' : `${totalDays} days`;
  } else if (totalHours >= 1) {
    label = totalHours === 1 ? '1 hour' : `${totalHours} hours`;
  } else if (totalMinutes >= 1) {
    label = totalMinutes === 1 ? '1 min' : `${totalMinutes} mins`;
  }

  const startStr = formatAbsoluteMYT(fromDate);
  const endStr = toIso
    ? formatAbsoluteMYT(toDate)
    : `server reference time (${formatAbsoluteMYT(serverNow)})`;

  return {
    label,
    basis: `Calculated from ${startStr} to ${endStr}.`,
  };
}

function getMytDayKey(timestamp: string): { key: string; label: string } {
  const d = parseDate(timestamp);
  if (!d) return { key: 'unknown', label: 'Unknown date' };
  const key = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
  const niceDate = new Intl.DateTimeFormat('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
  const todayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(getServerNow());
  return {
    key,
    label: key === todayKey ? `Today · ${niceDate}` : niceDate,
  };
}

function getKindMeta(kind: PoleTimelineKind): {
  badgeClass: string;
  icon: React.ReactNode;
} {
  switch (kind) {
    case 'Location':
      return {
        badgeClass: 'bg-status-info-tint text-status-info border-status-info-border',
        icon: <MapPin className="size-3" />,
      };
    case 'Change':
      return {
        badgeClass: 'bg-muted text-foreground border-border',
        icon: <Edit3 className="size-3" />,
      };
    case 'Lifecycle':
      return {
        badgeClass: 'bg-status-online-tint text-status-online border-status-online-border',
        icon: <Activity className="size-3" />,
      };
    case 'Registered':
      return {
        badgeClass: 'bg-primary/10 text-primary border-primary/30',
        icon: <PlusCircle className="size-3" />,
      };
    case 'Deleted':
      return {
        badgeClass: 'bg-status-offline-tint text-status-offline border-status-offline-border',
        icon: <Trash2 className="size-3" />,
      };
  }
}

/**
 * Merged History tab (D1): unifies Timeline (default, grouped by MYT day with kind & actor filters
 * and structured From -> To transitions) with Status periods (lifecycle intervals table with explicit duration basis).
 */
export const PoleHistoryTab: React.FC<PoleHistoryTabProps> = ({ pole }) => {
  const { addToast } = useToast();
  const [subView, setSubView] = useState<'timeline' | 'periods'>('timeline');
  const [kindFilter, setKindFilter] = useState<PoleTimelineKind | 'all'>('all');
  const [actorFilter, setActorFilter] = useState<string>('all');

  const currentPeriodDuration = useMemo(
    () => formatDurationWithBasis(pole.lifecycleStartedAt, null),
    [pole.lifecycleStartedAt]
  );

  const kindCounts = useMemo(() => {
    const counts = new Map<PoleTimelineKind, number>();
    pole.timeline.forEach((e) => {
      counts.set(e.kind, (counts.get(e.kind) || 0) + 1);
    });
    return counts;
  }, [pole.timeline]);

  const actors = useMemo(() => {
    const set = new Set<string>();
    pole.timeline.forEach((e) => {
      set.add(e.actor || 'System');
    });
    return Array.from(set);
  }, [pole.timeline]);

  const filteredEntries = useMemo(() => {
    return [...pole.timeline]
      .sort((a, b) => {
        const ta = parseDate(a.timestamp)?.getTime() || 0;
        const tb = parseDate(b.timestamp)?.getTime() || 0;
        return tb - ta;
      })
      .filter((e) => {
        if (kindFilter !== 'all' && e.kind !== kindFilter) return false;
        const actorName = e.actor || 'System';
        if (actorFilter !== 'all' && actorName !== actorFilter) return false;
        return true;
      });
  }, [pole.timeline, kindFilter, actorFilter]);

  const groupedByDay = useMemo(() => {
    const groups: { key: string; label: string; entries: PoleTimelineEntry[] }[] = [];
    const byKey = new Map<string, { key: string; label: string; entries: PoleTimelineEntry[] }>();

    filteredEntries.forEach((entry) => {
      const { key, label } = getMytDayKey(entry.timestamp);
      let grp = byKey.get(key);
      if (!grp) {
        grp = { key, label, entries: [] };
        byKey.set(key, grp);
        groups.push(grp);
      }
      grp.entries.push(entry);
    });
    return groups;
  }, [filteredEntries]);

  const handleCopyCoords = (lat: number, lng: number) => {
    const text = formatCoordinates({ lat, lng });
    navigator.clipboard.writeText(text);
    addToast('info', `Copied ${text}`);
  };

  return (
    <div className="space-y-4">
      {/* Top Row: Honest Duration Summary + Timeline / Status Periods Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3.5 text-primary shrink-0" />
          <span>
            <strong className="font-semibold text-foreground">{pole.lifecycle}</strong> since{' '}
            <span className="font-medium text-foreground">
              {formatAbsoluteMYT(pole.lifecycleStartedAt)}
            </span>
            ,{' '}
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-4 text-foreground font-semibold cursor-help">
                    {currentPeriodDuration.label}
                    <Info className="size-3 text-muted-foreground" />
                  </span>
                }
              />
              <TooltipContent className="max-w-xs text-xs bg-popover text-popover-foreground border border-border">
                {currentPeriodDuration.basis}
              </TooltipContent>
            </Tooltip>
          </span>
        </div>

        {/* Sub-view Switch: Timeline | Status periods */}
        <div
          role="group"
          aria-label="History view mode"
          className="inline-flex items-center rounded-lg border border-border bg-muted p-0.5 self-start sm:self-auto"
        >
          <button
            type="button"
            onClick={() => setSubView('timeline')}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
              subView === 'timeline'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <List className="size-3.5" />
            <span>Timeline</span>
          </button>
          <button
            type="button"
            onClick={() => setSubView('periods')}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
              subView === 'periods'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Table2 className="size-3.5" />
            <span>Status periods ({pole.lifecycleHistory.length})</span>
          </button>
        </div>
      </div>

      {subView === 'timeline' ? (
        <div className="space-y-4">
          {/* Timeline Filter Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setKindFilter('all')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer',
                  kindFilter === 'all'
                    ? 'bg-primary text-primary-foreground border-primary font-semibold'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground'
                )}
              >
                All ({pole.timeline.length})
              </button>
              {(['Location', 'Change', 'Lifecycle', 'Registered', 'Deleted'] as PoleTimelineKind[]).map(
                (k) => {
                  const cnt = kindCounts.get(k) || 0;
                  if (cnt === 0) return null;
                  const active = kindFilter === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKindFilter(active ? 'all' : k)}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer',
                        active
                          ? 'bg-primary text-primary-foreground border-primary font-semibold'
                          : 'bg-card text-muted-foreground border-border hover:text-foreground'
                      )}
                    >
                      {k} ({cnt})
                    </button>
                  );
                }
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <select
                aria-label="Filter timeline by actor"
                value={actorFilter}
                onChange={(e) => setActorFilter(e.target.value)}
                className="h-7 rounded-md border border-border bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="all">All actors</option>
                {actors.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
          </div>

          {groupedByDay.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              {pole.timeline.length === 0 ? (
                <span>No activity history recorded for this pole.</span>
              ) : (
                <div className="space-y-2">
                  <p>No timeline entries match the selected filters.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setKindFilter('all');
                      setActorFilter('all');
                    }}
                    className="text-primary font-medium hover:underline cursor-pointer"
                  >
                    Reset timeline filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {groupedByDay.map((group) => (
                <div key={group.key} className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                    {group.label}
                  </div>
                  <div className="divide-y divide-border rounded-lg border border-border bg-background">
                    {group.entries.map((entry) => {
                      const meta = getKindMeta(entry.kind);
                      return (
                        <div
                          key={entry.id}
                          className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium shrink-0',
                                  meta.badgeClass
                                )}
                              >
                                {meta.icon}
                                <span>{entry.kind}</span>
                              </span>

                              {entry.field && (entry.fromValue !== undefined || entry.toValue !== undefined) ? (
                                <span className="inline-flex flex-wrap items-center gap-1.5 text-foreground">
                                  <span className="font-semibold">{entry.field}:</span>
                                  <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground line-through">
                                    {entry.fromValue || 'none'}
                                  </span>
                                  <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                                  <span className="px-1.5 py-0.5 rounded bg-muted font-medium text-foreground">
                                    {entry.toValue || 'none'}
                                  </span>
                                </span>
                              ) : (
                                <span className="font-medium text-foreground">{entry.message}</span>
                              )}

                              {entry.coordinates && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-card font-mono text-[11px] text-foreground">
                                  <span>{formatCoordinates(entry.coordinates)}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopyCoords(entry.coordinates!.lat, entry.coordinates!.lng)
                                    }
                                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                                    aria-label="Copy coordinates"
                                    title="Copy coordinates"
                                  >
                                    <Copy className="size-3" />
                                  </button>
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-muted-foreground">
                              Recorded by <span className="font-medium text-foreground">{entry.actor || 'System'}</span>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0 text-[11px]">
                            <span className="text-foreground font-mono">
                              {formatAbsoluteMYT(entry.timestamp)}
                            </span>
                            <RelativeTime
                              date={entry.timestamp}
                              className="text-muted-foreground"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Status Periods Table */
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted text-muted-foreground border-b border-border">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">From</th>
                <th className="py-2.5 px-3 font-semibold">To</th>
                <th className="py-2.5 px-3 font-semibold">Duration</th>
                <th className="py-2.5 px-3 font-semibold">Note</th>
                <th className="py-2.5 px-3 font-semibold">Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pole.lifecycleHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No status period records available.
                  </td>
                </tr>
              ) : (
                pole.lifecycleHistory.map((period) => {
                  const dur = formatDurationWithBasis(period.from, period.to);
                  return (
                    <tr key={period.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-3">
                        <StatusBadge status={period.status} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-foreground whitespace-nowrap">
                        {formatAbsoluteMYT(period.from)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {period.to ? (
                          <span className="font-mono text-[11px] text-foreground">
                            {formatAbsoluteMYT(period.to)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-status-online-tint text-status-online border border-status-online-border">
                            Current
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <span className="inline-flex items-center gap-1 font-medium text-foreground underline decoration-dotted underline-offset-4 cursor-help">
                                {dur.label}
                              </span>
                            }
                          />
                          <TooltipContent className="max-w-xs text-xs bg-popover text-popover-foreground border border-border">
                            {dur.basis}
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {period.note || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                        <span className="font-medium text-foreground">{period.recordedBy}</span> on{' '}
                        <span className="font-mono text-[11px]">
                          {formatAbsoluteMYT(period.recordedAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
