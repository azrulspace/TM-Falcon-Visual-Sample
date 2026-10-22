import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CheckCheck,
  Briefcase,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { DeviceChip } from '@/components/common/DeviceChip';
import { AssetChip } from '@/components/common/AssetChip';
import { EventTableView } from './EventTableView';
import { useEvents } from '@/contexts/EventsContext';
import { cn } from '@/lib/utils';
import type { FalconEvent } from '@/data/events';
import type { ColumnVisibility } from './InboxHeader';

export interface EventGroup {
  key: string;
  type: string;
  device: string | null;
  asset: string;
  events: FalconEvent[];
  count: number;
  highestPriority: FalconEvent['priority'];
  latestTime: string;
  oldestTime: string;
  statusMix: {
    newCount: number;
    ackCount: number;
    inCaseCount: number;
    resolvedCount: number;
  };
}

export interface EventGroupedViewProps {
  events: FalconEvent[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAllPage: (all: boolean, pageIds: string[]) => void;
  activeEventId: string | null;
  onRowClick: (event: FalconEvent) => void;
  columns: ColumnVisibility;
  density: 'comfortable' | 'compact';
  onOpenAssignDialog: (id: string) => void;
  onOpenDismissDialog: (id: string) => void;
  onOpenCreateCaseDialog: (id: string) => void;
}

export const EventGroupedView: React.FC<EventGroupedViewProps> = ({
  events,
  selectedIds,
  onToggleSelect,
  onSelectAllPage,
  activeEventId,
  onRowClick,
  columns,
  density,
  onOpenAssignDialog,
  onOpenDismissDialog,
  onOpenCreateCaseDialog,
}) => {
  const { bulkAcknowledge, createCaseForGroup } = useEvents();

  // Group events by: type + device + asset
  const groups: EventGroup[] = useMemo(() => {
    const map = new Map<string, FalconEvent[]>();

    for (const evt of events) {
      const gKey = `${evt.type}:::${evt.device || 'no-device'}:::${evt.asset}`;
      const existing = map.get(gKey) || [];
      existing.push(evt);
      map.set(gKey, existing);
    }

    const priorityWeight: Record<string, number> = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };

    const res: EventGroup[] = [];
    map.forEach((grpEvents, key) => {
      const [type, rawDevice, asset] = key.split(':::');
      const device = rawDevice === 'no-device' ? null : rawDevice;

      // Sort group events by newest
      const sortedEvents = [...grpEvents];

      // Highest priority
      let maxWeight = 0;
      let highestPriority: FalconEvent['priority'] = 'Low';
      for (const e of sortedEvents) {
        const w = priorityWeight[e.priority] || 1;
        if (w > maxWeight) {
          maxWeight = w;
          highestPriority = e.priority;
        }
      }

      // Status mix
      const statusMix = {
        newCount: sortedEvents.filter((e) => e.state === 'New').length,
        ackCount: sortedEvents.filter((e) => e.state === 'Acknowledged').length,
        inCaseCount: sortedEvents.filter((e) => e.state === 'In case').length,
        resolvedCount: sortedEvents.filter((e) => e.state === 'Resolved').length,
      };

      res.push({
        key,
        type,
        device,
        asset,
        events: sortedEvents,
        count: sortedEvents.length,
        highestPriority,
        latestTime: sortedEvents[0].captured,
        oldestTime: sortedEvents[sortedEvents.length - 1].captured,
        statusMix,
      });
    });

    // Sort groups by highest priority, then count
    res.sort((a, b) => {
      const wA = priorityWeight[a.highestPriority] || 1;
      const wB = priorityWeight[b.highestPriority] || 1;
      if (wB !== wA) return wB - wA;
      return b.count - a.count;
    });

    return res;
  }, [events]);

  // Expand state (default the largest cluster open)
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (groups.length > 0) initial.add(groups[0].key);
    return initial;
  });

  const toggleGroup = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleAcknowledgeAllInGroup = (grp: EventGroup) => {
    const newIds = grp.events.filter((e) => e.state === 'New').map((e) => e.id);
    if (newIds.length > 0) {
      bulkAcknowledge(newIds);
    }
  };

  return (
    <div className="flex flex-col gap-3 select-none">
      {groups.map((grp) => {
        const isExpanded = expandedKeys.has(grp.key);
        const total = grp.count;
        const newPct = (grp.statusMix.newCount / total) * 100;
        const ackPct = (grp.statusMix.ackCount / total) * 100;
        const inCasePct = (grp.statusMix.inCaseCount / total) * 100;

        return (
          <div
            key={grp.key}
            className="flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden transition-all"
          >
            {/* Sticky Group Header Row */}
            <div
              onClick={() => toggleGroup(grp.key)}
              className={cn(
                'sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/40 hover:bg-muted/70 border-b border-border transition-colors cursor-pointer',
                isExpanded && 'bg-muted/60'
              )}
            >
              {/* Left Info: Chevron, Type Icon, Title, Chips, Count */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  className="size-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                  aria-label={isExpanded ? 'Collapse group' : 'Expand group'}
                >
                  {isExpanded ? (
                    <ChevronDown className="size-4 shrink-0 transition-transform" />
                  ) : (
                    <ChevronRight className="size-4 shrink-0 transition-transform" />
                  )}
                </button>

                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-sm text-foreground truncate">
                    {grp.type}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <DeviceChip deviceId={grp.device} />
                    <AssetChip assetId={grp.asset} />
                  </div>
                </div>

                {/* Count badge */}
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0 tabular-nums">
                  {grp.count} events
                </span>

                {/* Highest Priority Badge */}
                <PriorityBadge priority={grp.highestPriority} size="sm" />
              </div>

              {/* Right Side: Status Mix Bar, Timestamps, Group Actions */}
              <div className="flex items-center gap-4 shrink-0" onClick={(e) => e.stopPropagation()}>
                {/* Status Mix Bar */}
                <div className="flex flex-col gap-1 w-36 hidden md:flex">
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                    {newPct > 0 && (
                      <div style={{ width: `${newPct}%` }} className="h-full bg-amber-500" title={`New: ${grp.statusMix.newCount}`} />
                    )}
                    {ackPct > 0 && (
                      <div style={{ width: `${ackPct}%` }} className="h-full bg-blue-500" title={`Acknowledged: ${grp.statusMix.ackCount}`} />
                    )}
                    {inCasePct > 0 && (
                      <div style={{ width: `${inCasePct}%` }} className="h-full bg-slate-500" title={`In case: ${grp.statusMix.inCaseCount}`} />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground tabular-nums">
                    <span>{grp.statusMix.newCount} New</span>
                    <span>{grp.statusMix.ackCount} Ack</span>
                    <span>{grp.statusMix.inCaseCount} Case</span>
                  </div>
                </div>

                {/* Latest & Oldest Times */}
                <div className="flex flex-col text-right text-[11px] text-muted-foreground hidden lg:flex tabular-nums">
                  <span>Latest: <strong className="text-foreground">{grp.latestTime}</strong></span>
                  <span>Oldest: {grp.oldestTime}</span>
                </div>

                {/* Group Quick Actions */}
                <div className="flex items-center gap-1.5">
                  {grp.statusMix.newCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAcknowledgeAllInGroup(grp)}
                      className="h-7 px-2 text-xs gap-1 border-border"
                      title="Acknowledge all unacknowledged events in group"
                    >
                      <CheckCheck className="size-3 text-emerald-500" />
                      <span>Ack all</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => createCaseForGroup(grp.type, grp.device, grp.asset)}
                    className="h-7 px-2 text-xs gap-1 border-border"
                    title="Bundle group into a new case"
                  >
                    <Briefcase className="size-3 text-amber-500" />
                    <span>Create case</span>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <button className="size-7 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="size-3.5" />
                      </button>
                    } />
                    <DropdownMenuContent align="end" className="w-44 text-xs">
                      <DropdownMenuItem onClick={() => handleAcknowledgeAllInGroup(grp)}>
                        Acknowledge {grp.statusMix.newCount} new
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => createCaseForGroup(grp.type, grp.device, grp.asset)}>
                        Bundle all into field case
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Expanded Child Rows: Reuses Table View */}
            {isExpanded && (
              <div className="border-t border-border bg-background">
                <EventTableView
                  events={grp.events}
                  selectedIds={selectedIds}
                  onToggleSelect={onToggleSelect}
                  onSelectAllPage={onSelectAllPage}
                  activeEventId={activeEventId}
                  onRowClick={onRowClick}
                  sortConfig={{ key: 'captured', direction: 'desc' }}
                  onSort={() => {}}
                  columns={columns}
                  density={density}
                  currentPage={1}
                  setCurrentPage={() => {}}
                  rowsPerPage={grp.events.length}
                  setRowsPerPage={() => {}}
                  onOpenAssignDialog={onOpenAssignDialog}
                  onOpenDismissDialog={onOpenDismissDialog}
                  onOpenCreateCaseDialog={onOpenCreateCaseDialog}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
