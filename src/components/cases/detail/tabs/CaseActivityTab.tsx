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
} from 'lucide-react';
import { RelativeTime } from '@/components/common/RelativeTime';
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

  // Filter activities
  const filteredActivities = useMemo(() => {
    let list = [...activities].reverse(); // Newest first
    if (selectedType !== 'all') {
      list = list.filter((a) => a.type === selectedType);
    }
    return list;
  }, [activities, selectedType]);

  // Group by day (Section 7.4)
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

  const uniqueTypes = useMemo(() => {
    const set = new Set(activities.map((a) => a.type));
    return Array.from(set);
  }, [activities]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Header with Type Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <History className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Audit & Activity Log</h2>
          <span className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
            {filteredActivities.length} {filteredActivities.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {/* Filter by type */}
        {uniqueTypes.length > 1 && (
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="size-3 text-muted-foreground" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-7 text-xs bg-card border border-border rounded-md px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="all">All activity types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {TYPE_CONFIG[t]?.label || t}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Timeline Body */}
      <div className="p-4 sm:p-6 text-xs">
        {groupedByDay.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No audit activities recorded.
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByDay.map((group) => (
              <div key={group.dayLabel} className="space-y-3">
                {/* Day Header */}
                <div className="sticky top-0 z-10 py-1 bg-card/90 backdrop-blur-xs flex items-center gap-2">
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

                        {/* Content */}
                        <div className="p-3 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                            <span className="font-semibold text-foreground">
                              {act.text}
                            </span>
                            <span className="text-[11px] text-muted-foreground whitespace-nowrap tabular-nums">
                              {formattedTime}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span>
                              Actor: <strong className="text-foreground/90 font-medium">{act.actor}</strong>
                            </span>
                            <span>·</span>
                            <span className="capitalize">{cfg.label}</span>
                            <span>·</span>
                            <RelativeTime date={act.timestamp} />
                          </div>
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
