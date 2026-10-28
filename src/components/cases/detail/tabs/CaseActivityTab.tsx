import React, { useState, useMemo } from 'react';
import {
  History,
  PlusCircle,
  UserPlus,
  PlayCircle,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  MessageSquare,
  Filter,
  ArrowRight,
  User,
  X,
} from 'lucide-react';
import { RelativeTime } from '@/components/common/RelativeTime';
import { Button } from '@/components/ui/button';
import { formatAbsoluteMYT, parseDate } from '@/lib/dateTime';
import { cn } from '@/lib/utils';
import type { CaseActivityEntry } from '@/types/cases';

export interface CaseActivityTabProps {
  activities: CaseActivityEntry[];
}

const TYPE_CONFIG: Record<
  CaseActivityEntry['type'],
  { label: string; icon: React.FC<{ className?: string }>; color: string }
> = {
  created: {
    label: 'Case Created',
    icon: PlusCircle,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  },
  assigned: {
    label: 'Assignment',
    icon: UserPlus,
    color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
  },
  status_change: {
    label: 'Status Change',
    icon: PlayCircle,
    color: 'text-primary bg-primary/10 border-primary/20',
  },
  verification: {
    label: 'Verification',
    icon: ShieldCheck,
    color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
  },
  field_work: {
    label: 'Field Findings',
    icon: Wrench,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  closure: {
    label: 'Closure',
    icon: CheckCircle2,
    color: 'text-emerald-600 bg-emerald-600/10 border-emerald-600/20',
  },
  note: {
    label: 'Note',
    icon: MessageSquare,
    color: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
  },
};

export const CaseActivityTab: React.FC<CaseActivityTabProps> = ({ activities = [] }) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedActor, setSelectedActor] = useState<string>('all');

  // Extract unique activity types & actors
  const uniqueTypes = useMemo(() => {
    const set = new Set(activities.map((a) => a.type));
    return Array.from(set);
  }, [activities]);

  const uniqueActors = useMemo(() => {
    const set = new Set(activities.map((a) => a.actor).filter(Boolean));
    return Array.from(set).sort();
  }, [activities]);

  // Filter activities (newest first)
  const filteredActivities = useMemo(() => {
    let list = [...activities].reverse();
    if (selectedType !== 'all') {
      list = list.filter((a) => a.type === selectedType);
    }
    if (selectedActor !== 'all') {
      list = list.filter((a) => a.actor === selectedActor);
    }
    return list;
  }, [activities, selectedType, selectedActor]);

  const isFiltered = selectedType !== 'all' || selectedActor !== 'all';

  const handleResetFilters = () => {
    setSelectedType('all');
    setSelectedActor('all');
  };

  // Group by day for chronological readability
  const groupedByDay = useMemo(() => {
    const groups: { dayLabel: string; entries: CaseActivityEntry[] }[] = [];
    const map = new Map<string, CaseActivityEntry[]>();

    for (const act of filteredActivities) {
      const d = parseDate(act.timestamp);
      const dayKey = d
        ? d.toLocaleDateString('en-MY', {
            timeZone: 'Asia/Kuala_Lumpur',
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'Unknown Date';

      if (!map.has(dayKey)) {
        map.set(dayKey, []);
        groups.push({ dayLabel: dayKey, entries: map.get(dayKey)! });
      }
      map.get(dayKey)!.push(act);
    }

    return groups;
  }, [filteredActivities]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* 1. Header Toolbar with Dual Filters (Type & Actor) and Entry Counter */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2 flex-wrap">
          <History className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Audit & Activity Log</h2>
          <span className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border">
            {isFiltered
              ? `Showing ${filteredActivities.length} of ${activities.length} entries`
              : `${activities.length} ${activities.length === 1 ? 'entry' : 'entries'}`}
          </span>
        </div>

        {/* Dual Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="size-3 text-muted-foreground" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-7 text-xs bg-card border border-border rounded-md px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              aria-label="Filter activities by type"
            >
              <option value="all">All types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {TYPE_CONFIG[t]?.label || t}
                </option>
              ))}
            </select>
          </div>

          {/* Actor Filter */}
          {uniqueActors.length > 1 && (
            <div className="flex items-center gap-1.5">
              <User className="size-3 text-muted-foreground" />
              <select
                value={selectedActor}
                onChange={(e) => setSelectedActor(e.target.value)}
                className="h-7 text-xs bg-card border border-border rounded-md px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer max-w-[150px] truncate"
                aria-label="Filter activities by actor"
              >
                <option value="all">All actors</option>
                {uniqueActors.map((actor) => (
                  <option key={actor} value={actor}>
                    {actor}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Clear Filter button */}
          {isFiltered && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
            >
              <X className="size-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Timeline Body */}
      <div className="p-4 sm:p-6 text-xs">
        {activities.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No audit activities recorded.
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-muted-foreground">No activities match the selected filters.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 px-2.5 text-xs border-border"
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByDay.map((group) => (
              <div key={group.dayLabel} className="space-y-3">
                {/* Day Header */}
                <div className="sticky top-0 z-10 py-1 bg-card flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.dayLabel}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Day entries */}
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {group.entries.map((act) => {
                    const cfg = TYPE_CONFIG[act.type] || TYPE_CONFIG.note;
                    const IconComponent = cfg.icon;
                    const dateObj = parseDate(act.timestamp);
                    const formattedTime = dateObj ? formatAbsoluteMYT(dateObj) : act.timestamp;

                    return (
                      <div key={act.id} className="relative group">
                        {/* Timeline Bullet Icon */}
                        <div
                          className={cn(
                            'absolute -left-6 top-0.5 size-5 rounded-full border flex items-center justify-center bg-card shadow-xs',
                            cfg.color
                          )}
                        >
                          <IconComponent className="size-3" />
                        </div>

                        {/* Content Box */}
                        <div className="p-3.5 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                            <span className="font-semibold text-foreground text-xs">
                              {act.text}
                            </span>
                            <span className="text-[11px] text-muted-foreground whitespace-nowrap tabular-nums">
                              {formattedTime}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                            <span>
                              Actor:{' '}
                              <strong className="text-foreground/90 font-medium">{act.actor}</strong>
                            </span>
                            <span>·</span>
                            <span className="capitalize">{cfg.label}</span>
                            <span>·</span>
                            <RelativeTime date={act.timestamp} />
                          </div>

                          {/* 3. Structured Field-Level Changes Diffs (C27) */}
                          {act.fieldChanges && act.fieldChanges.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-border/70 space-y-1.5">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                                Field changes:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {act.fieldChanges.map((change, idx) => (
                                  <div
                                    key={idx}
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/40 border border-border text-[11px]"
                                  >
                                    <span className="font-medium text-foreground">
                                      {change.field}:
                                    </span>
                                    <span className="line-through text-muted-foreground bg-muted/80 px-1 py-0.2 rounded font-mono text-[10px]">
                                      {change.from || '—'}
                                    </span>
                                    <ArrowRight className="size-2.5 text-muted-foreground shrink-0" />
                                    <span className="font-semibold text-primary bg-primary/10 px-1 py-0.2 rounded font-mono text-[10px]">
                                      {change.to || '—'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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
    </div>
  );
};
