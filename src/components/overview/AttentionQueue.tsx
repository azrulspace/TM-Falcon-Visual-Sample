import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Radio,
  Briefcase,
  AlertCircle,
  RadioReceiver,
  Clock,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge, SeverityBadge } from '@/components/common/StatusBadge';
import { attention } from '@/data/attention';
import type { KpiFilterType } from './KpiRibbon';

export interface AttentionItem {
  kind: 'EVENT' | 'CASE' | 'DEVICE';
  id: string;
  title: string;
  badges: string[];
  detail: string;
  why: string;
  marker: string | null;
  age?: string;
  timestamp?: string;
  thumbnail?: string;
  locationArea?: string;
}

interface AttentionQueueProps {
  selectedId: string | null;
  onSelectItem: (id: string | null, markerId?: string | null) => void;
  activeKpiFilter: KpiFilterType;
  density?: 'default' | 'compact';
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const AttentionQueue: React.FC<AttentionQueueProps> = ({
  selectedId,
  onSelectItem,
  activeKpiFilter,
  density = 'default',
  isLoading = false,
  error = null,
  onRetry,
}) => {
  const [tab, setTab] = useState<'All' | 'EVENT' | 'DEVICE' | 'CASE'>('All');
  const [groupSimilar, setGroupSimilar] = useState(true);
  const [sortBy, setSortBy] = useState<'severity' | 'newest' | 'oldest'>('severity');
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>(['High', 'Medium', 'Low', 'Offline', 'Stale']);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const listContainerRef = useRef<HTMLDivElement>(null);

  // Synchronize KPI Ribbon Filter to Tab/Selection
  useEffect(() => {
    if (activeKpiFilter === 'new_events') {
      setTab('EVENT');
    } else if (activeKpiFilter === 'open_cases') {
      setTab('CASE');
    } else if (activeKpiFilter === 'devices_attention') {
      setTab('DEVICE');
    } else if (activeKpiFilter === null) {
      setTab('All');
    }
  }, [activeKpiFilter]);

  // Enrich raw attention items with realistic relative ages and location areas
  const enrichedItems: AttentionItem[] = useMemo(() => {
    return attention.map((item, idx) => {
      // Deterministic age values for audit-friendliness
      const ages = ['23m ago', '1h 14m ago', '2h 17m ago', '3h 40m ago', '5h 12m ago', '9h 05m ago', '14h 22m ago', '1d 3h ago', '1d 8h ago', '2d 1h ago'];
      const timestamps = [
        'Today 14:12 MYT',
        'Today 13:21 MYT',
        'Today 12:18 MYT',
        'Today 10:55 MYT',
        'Today 09:23 MYT',
        'Today 05:30 MYT',
        'Yesterday 23:40 MYT',
        'Yesterday 11:15 MYT',
        '04 Oct 08:34 MYT',
        '03 Oct 14:14 MYT',
      ];
      // Location area extracted from detail
      const locMatch = item.detail.match(/AST_\d+|CBL_\d+|Route \d+/);
      const locArea = locMatch ? locMatch[0] : 'Kuching Area';

      return {
        ...item,
        kind: item.kind as 'EVENT' | 'CASE' | 'DEVICE',
        age: ages[idx % ages.length],
        timestamp: timestamps[idx % timestamps.length],
        locationArea: locArea,
      };
    });
  }, []);

  // Filter items based on tab, severity checkboxes, and active KPI ribbon filter
  const filteredItems = useMemo(() => {
    return enrichedItems.filter((item) => {
      // Tab filter
      if (tab !== 'All' && item.kind !== tab) return false;

      // KPI filter
      if (activeKpiFilter === 'critical_events') {
        const isHigh = item.badges.some((b) => ['High', 'Critical', 'Offline'].includes(b));
        if (!isHigh) return false;
      }

      // Severity checkbox filter
      if (selectedSeverities.length > 0) {
        const matchesBadge = item.badges.some((b) => selectedSeverities.includes(b));
        if (!matchesBadge && !selectedSeverities.includes(item.kind)) return false;
      }

      return true;
    });
  }, [enrichedItems, tab, activeKpiFilter, selectedSeverities]);

  // Group items by event type / title + location area
  const groupedItems = useMemo(() => {
    if (!groupSimilar) return null;

    const groups: Record<
      string,
      {
        key: string;
        title: string;
        locationArea: string;
        items: AttentionItem[];
        highestSeverity: string;
        oldestAge: string;
        kind: 'EVENT' | 'CASE' | 'DEVICE';
      }
    > = {};

    filteredItems.forEach((item) => {
      const groupKey = `${item.title}__${item.locationArea}`;
      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          title: item.title,
          locationArea: item.locationArea || 'General',
          items: [],
          highestSeverity: item.badges[0] || 'Medium',
          oldestAge: item.age || 'Recent',
          kind: item.kind,
        };
      }
      groups[groupKey].items.push(item);
    });

    const groupList = Object.values(groups);

    // Sort groups: High/Critical severity first, then by count descending
    groupList.sort((a, b) => {
      const getWeight = (g: typeof a) => {
        if (g.items.some((i) => i.badges.includes('High') || i.badges.includes('Offline'))) return 3;
        if (g.items.some((i) => i.badges.includes('Medium') || i.badges.includes('Stale'))) return 2;
        return 1;
      };
      const diff = getWeight(b) - getWeight(a);
      if (diff !== 0) return diff;
      return b.items.length - a.items.length;
    });

    return groupList;
  }, [filteredItems, groupSimilar]);

  // Keyboard navigation
  const flatItemIds = useMemo(() => filteredItems.map((i) => i.id), [filteredItems]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (flatItemIds.length === 0) return;
    const currentIndex = selectedId ? flatItemIds.indexOf(selectedId) : -1;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min(currentIndex + 1, flatItemIds.length - 1);
      const target = filteredItems[nextIndex];
      onSelectItem(target.id, target.marker);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = Math.max(currentIndex - 1, 0);
      const target = filteredItems[prevIndex];
      onSelectItem(target.id, target.marker);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onSelectItem(null, null);
    }
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: prev[key] === undefined ? false : !prev[key], // Default expanded
    }));
  };

  const isGroupExpanded = (key: string) => {
    return expandedGroups[key] !== false; // expanded by default
  };

  const rowHeightClass = density === 'compact' ? 'py-1.5' : 'py-2.5';

  return (
    <div
      className="flex flex-col h-full bg-card rounded-panel border border-border overflow-hidden select-none outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Attention Queue"
    >
      {/* Header */}
      <div className="p-3 border-b border-border bg-card shrink-0 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Needs attention</h2>
            <Badge variant="secondary" className="h-5 px-1.5 text-xs font-bold font-mono bg-muted text-foreground">
              {filteredItems.length}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Filter Popover */}
            <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-7 text-muted-foreground hover:text-foreground"
                    aria-label="Filter attention queue"
                  >
                    <SlidersHorizontal className="size-3.5" />
                  </Button>
                }
              />
              <PopoverContent className="w-56 p-3 bg-popover border border-border text-xs z-50">
                <div className="font-semibold text-foreground mb-2">Filter by Severity & State</div>
                <div className="space-y-2">
                  {['High', 'Medium', 'Low', 'Offline', 'Stale'].map((sev) => (
                    <label key={sev} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedSeverities.includes(sev)}
                        onCheckedChange={(checked) => {
                          setSelectedSeverities((prev) =>
                            checked ? [...prev, sev] : prev.filter((s) => s !== sev)
                          );
                        }}
                      />
                      <span className="capitalize">{sev}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-border flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSeverities(['High', 'Medium', 'Low', 'Offline', 'Stale'])}
                    className="h-6 text-[11px] px-2 text-muted-foreground"
                  >
                    Reset
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Sort Select */}
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="h-7 w-28 text-xs bg-muted/40 border-border">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="severity">Highest severity</SelectItem>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs: All, Events, Devices, Cases */}
        <div className="flex items-center justify-between gap-2">
          <Tabs value={tab} onValueChange={(val: any) => setTab(val)} className="w-full">
            <TabsList className="h-7 w-full p-0.5 bg-muted/60 border border-border grid grid-cols-4 rounded-md">
              <TabsTrigger value="All" className="text-[11px] h-6 px-1 data-[state=active]:bg-card font-medium">
                All ({enrichedItems.length})
              </TabsTrigger>
              <TabsTrigger value="EVENT" className="text-[11px] h-6 px-1 data-[state=active]:bg-card font-medium">
                Events ({enrichedItems.filter((i) => i.kind === 'EVENT').length})
              </TabsTrigger>
              <TabsTrigger value="DEVICE" className="text-[11px] h-6 px-1 data-[state=active]:bg-card font-medium">
                Devices ({enrichedItems.filter((i) => i.kind === 'DEVICE').length})
              </TabsTrigger>
              <TabsTrigger value="CASE" className="text-[11px] h-6 px-1 data-[state=active]:bg-card font-medium">
                Cases ({enrichedItems.filter((i) => i.kind === 'CASE').length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Group Similar Items Switch */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
          <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
            <Layers className="size-3 text-muted-foreground" />
            Group similar items
          </span>
          <Switch
            checked={groupSimilar}
            onCheckedChange={setGroupSimilar}
            aria-label="Group similar items"
            className="scale-90"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="m-3 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-xs text-destructive flex flex-col gap-2">
          <span>Failed to load queue items: {error}</span>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="h-7 text-xs border-destructive/40 self-start">
              <RotateCcw className="size-3 mr-1.5" /> Retry
            </Button>
          )}
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="p-3 space-y-2 flex-1 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-2.5 rounded-md border border-border bg-muted/20 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredItems.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
          <AlertCircle className="size-8 stroke-[1.5] text-muted-foreground/60 mb-2" />
          <p className="text-xs font-semibold text-foreground">No events need attention</p>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px]">
            All active alerts, incidents, and device issues have been resolved.
          </p>
        </div>
      )}

      {/* Main List Container */}
      {!isLoading && !error && filteredItems.length > 0 && (
        <div ref={listContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1.5">
          {groupSimilar && groupedItems
            ? groupedItems.map((group) => {
                const expanded = isGroupExpanded(group.key);
                const hasSelectedChild = group.items.some((i) => i.id === selectedId);

                return (
                  <div key={group.key} className="rounded-md border border-border overflow-hidden bg-card/60">
                    {/* Sticky Group Header */}
                    <div
                      onClick={() => toggleGroup(group.key)}
                      className={`sticky top-0 z-10 px-2.5 py-2 flex items-center justify-between cursor-pointer transition-colors border-b border-border/60 ${
                        hasSelectedChild ? 'bg-accent/40 font-semibold' : 'bg-muted/40 hover:bg-muted/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {expanded ? <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />}
                        {group.kind === 'EVENT' && <AlertCircle className="size-3.5 shrink-0 text-warning" />}
                        {group.kind === 'DEVICE' && <RadioReceiver className="size-3.5 shrink-0 text-destructive" />}
                        {group.kind === 'CASE' && <Briefcase className="size-3.5 shrink-0 text-primary" />}
                        <span className="text-xs font-semibold truncate text-foreground">{group.title}</span>
                        <Badge variant="outline" className="h-4 px-1 text-[10px] font-mono bg-muted text-muted-foreground">
                          {group.items.length}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-muted-foreground font-mono">{group.locationArea}</span>
                        <SeverityBadge severity={group.highestSeverity} size="sm" />
                      </div>
                    </div>

                    {/* Group Children */}
                    {expanded && (
                      <div className="divide-y divide-border/40">
                        {group.items.map((item) => {
                          const isSelected = selectedId === item.id;
                          return (
                            <QueueItemRow
                              key={item.id}
                              item={item}
                              isSelected={isSelected}
                              rowHeightClass={rowHeightClass}
                              onSelect={() => onSelectItem(item.id, item.marker)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            : filteredItems.map((item) => {
                const isSelected = selectedId === item.id;
                return (
                  <QueueItemRow
                    key={item.id}
                    item={item}
                    isSelected={isSelected}
                    rowHeightClass={rowHeightClass}
                    onSelect={() => onSelectItem(item.id, item.marker)}
                  />
                );
              })}
        </div>
      )}

      {/* Footer Meta / Audit Counter */}
      <div className="px-3 py-1.5 border-t border-border bg-muted/30 text-[10px] text-muted-foreground flex items-center justify-between shrink-0 font-mono">
        <span>Active triage queue</span>
        <span>Keyboard: ↑/↓ select • Esc</span>
      </div>
    </div>
  );
};

// Queue Item Row Subcomponent
const QueueItemRow: React.FC<{
  item: AttentionItem;
  isSelected: boolean;
  rowHeightClass: string;
  onSelect: () => void;
}> = ({ item, isSelected, rowHeightClass, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className={`px-3 ${rowHeightClass} cursor-pointer transition-all relative flex items-center justify-between gap-2 border-l-[3px] ${
        isSelected
          ? 'bg-accent border-l-primary shadow-xs'
          : 'border-l-transparent hover:bg-muted/40'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Leading icon */}
        <div className="shrink-0">
          {item.kind === 'EVENT' && <Radio className="size-3.5 text-warning" />}
          {item.kind === 'DEVICE' && <RadioReceiver className="size-3.5 text-destructive" />}
          {item.kind === 'CASE' && <Briefcase className="size-3.5 text-primary" />}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-primary">{item.id}</span>
            <span className="text-xs text-foreground truncate">{item.title}</span>
          </div>
          <span className="text-[11px] text-muted-foreground truncate">{item.detail}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Tooltip>
          <TooltipTrigger render={
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono tabular-nums">
              <Clock className="size-3 opacity-60" />
              {item.age}
            </span>
          } />
          <TooltipContent side="left" className="text-xs font-mono">
            {item.timestamp}
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-1">
          {item.badges.slice(0, 1).map((b) => (
            <StatusBadge key={b} status={b} size="sm" />
          ))}
        </div>
      </div>
    </div>
  );
};
