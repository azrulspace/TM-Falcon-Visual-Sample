import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Radio,
  Briefcase,
  AlertCircle,
  RadioReceiver,
  AlertTriangle,
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
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { attention } from '@/data/attention';
import { formatId } from '@/lib/utils';
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
  density: _density = 'default',
  isLoading = false,
  error = null,
  onRetry,
}) => {
  const [tab, setTab] = useState<'All' | 'EVENT' | 'DEVICE' | 'CASE'>('All');
  const [groupSimilar, setGroupSimilar] = useState(false);
  const [sortBy, setSortBy] = useState<'severity' | 'newest' | 'oldest'>('severity');
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
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

  // Enrich raw attention items with realistic ages, timestamps, and locations
  const enrichedItems: AttentionItem[] = useMemo(() => {
    const ages = ['23m ago', '1h 14m ago', '2h 17m ago', '3h 40m ago', '5h 12m ago', '6h 11m ago', '8h 27m ago', '14h 22m ago', '1d 3h ago', '1d 8h ago'];
    const timestamps = [
      'Today 14:12 MYT',
      'Today 13:21 MYT',
      'Today 12:18 MYT',
      'Today 10:55 MYT',
      'Today 09:23 MYT',
      'Today 08:24 MYT',
      'Today 06:10 MYT',
      'Yesterday 23:40 MYT',
      'Yesterday 11:15 MYT',
      '04 Oct 08:34 MYT',
    ];

    return attention.map((item, idx) => {
      const locMatch = item.detail.match(/AST_\d+|CBL_\d+|Route \d+/);
      const locArea = locMatch ? locMatch[0].replace('_', '-') : 'Kuching Area';

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

      // Severity checkbox filter (only applies if user selected specific severities)
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
        kind: string;
        highestSeverity: string;
        items: AttentionItem[];
      }
    > = {};

    filteredItems.forEach((item) => {
      const key = `${item.title}-${item.locationArea || 'general'}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          title: item.title,
          locationArea: item.locationArea || 'General',
          kind: item.kind,
          highestSeverity: item.badges[0] || 'Medium',
          items: [],
        };
      }
      groups[key].items.push(item);
    });

    return Object.values(groups);
  }, [groupSimilar, filteredItems]);

  const flatItemIds = useMemo(() => filteredItems.map((i) => i.id), [filteredItems]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (flatItemIds.length === 0) return;
    const currentIndex = flatItemIds.indexOf(selectedId || '');

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
      [key]: prev[key] === undefined ? false : !prev[key],
    }));
  };

  const isGroupExpanded = (key: string) => {
    return expandedGroups[key] !== false;
  };

  return (
    <div
      className="flex flex-col h-full bg-card/95 backdrop-blur-md rounded-xl border border-border/80 overflow-hidden select-none outline-none shadow-2xl"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Needs attention queue"
    >
      {/* Header (D1 & CEO_REFERENCE: Title, Count badge, and View all link) */}
      <div className="p-3.5 border-b border-border bg-card shrink-0 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Needs attention
            </h2>
            <Badge variant="secondary" className="h-5 px-1.5 text-xs font-semibold bg-muted text-foreground tabular-nums">
              {filteredItems.length}
            </Badge>
          </div>

          <Link
            to="/events"
            className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors group"
          >
            <span>View all</span>
            <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Full-width Tabs Row (D1) */}
        <Tabs value={tab} onValueChange={(val: any) => setTab(val)} className="w-full">
          <TabsList className="h-7 w-full p-0.5 bg-muted/60 border border-border grid grid-cols-4 rounded-md">
            <TabsTrigger value="All" className="text-xs h-6 px-1 data-[state=active]:bg-card font-medium">
              All ({enrichedItems.length})
            </TabsTrigger>
            <TabsTrigger value="EVENT" className="text-xs h-6 px-1 data-[state=active]:bg-card font-medium">
              Events ({enrichedItems.filter((i) => i.kind === 'EVENT').length})
            </TabsTrigger>
            <TabsTrigger value="DEVICE" className="text-xs h-6 px-1 data-[state=active]:bg-card font-medium">
              Devices ({enrichedItems.filter((i) => i.kind === 'DEVICE').length})
            </TabsTrigger>
            <TabsTrigger value="CASE" className="text-xs h-6 px-1 data-[state=active]:bg-card font-medium">
              Cases ({enrichedItems.filter((i) => i.kind === 'CASE').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Compact Controls Row: Group Similar Items Switch (left) + Filter & Untruncated Sort (right) */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <Layers className="size-3 text-muted-foreground" />
              Group
            </span>
            <Switch
              checked={groupSimilar}
              onCheckedChange={setGroupSimilar}
              aria-label="Group similar items"
              className="scale-90"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
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
                  {['High', 'Medium', 'Low', 'Offline', 'Stale', 'Field work'].map((sev) => (
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
                    onClick={() => setSelectedSeverities([])}
                    className="h-6 text-[11px] px-2 text-muted-foreground"
                  >
                    Reset
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Sort Select (Untruncated) */}
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="h-7 w-32 text-xs bg-muted/40 border-border">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover border border-border text-xs">
                <SelectItem value="severity">Highest severity</SelectItem>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
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

      {/* Main List Container: Flat 72px rows separated by 1px dividers (D2 & CEO_REFERENCE) */}
      {!isLoading && !error && filteredItems.length > 0 && (
        <div ref={listContainerRef} className="flex-1 overflow-y-auto divide-y divide-border/60">
          {groupSimilar && groupedItems
            ? groupedItems.map((group) => {
                if (group.items.length === 1) {
                  const singleItem = group.items[0];
                  return (
                    <FlatQueueItemRow
                      key={singleItem.id}
                      item={singleItem}
                      isSelected={selectedId === singleItem.id}
                      onSelect={() => onSelectItem(singleItem.id, singleItem.marker)}
                    />
                  );
                }

                const expanded = isGroupExpanded(group.key);
                const hasSelectedChild = group.items.some((i) => i.id === selectedId);

                return (
                  <div key={group.key} className="flex flex-col">
                    {/* Sticky Group Header */}
                    <div
                      onClick={() => toggleGroup(group.key)}
                      className={`sticky top-0 z-10 px-3 py-2 flex items-center justify-between cursor-pointer transition-colors border-b border-border/60 ${
                        hasSelectedChild ? 'bg-accent/60 font-semibold' : 'bg-muted/40 hover:bg-muted/70'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {expanded ? (
                          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                        )}
                        <span className="text-xs font-semibold truncate text-foreground">{group.title}</span>
                        <Badge variant="outline" className="h-4 px-1 text-[10px] font-mono bg-muted text-muted-foreground">
                          {group.items.length}
                        </Badge>
                      </div>

                      <span className="text-[10px] text-muted-foreground font-mono">{group.locationArea}</span>
                    </div>

                    {expanded && (
                      <div className="divide-y divide-border/40 pl-2">
                        {group.items.map((item) => (
                          <FlatQueueItemRow
                            key={item.id}
                            item={item}
                            isSelected={selectedId === item.id}
                            onSelect={() => onSelectItem(item.id, item.marker)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            : filteredItems.map((item) => (
                <FlatQueueItemRow
                  key={item.id}
                  item={item}
                  isSelected={selectedId === item.id}
                  onSelect={() => onSelectItem(item.id, item.marker)}
                />
              ))}
        </div>
      )}

      {/* Footer Meta / Audit Counter in quiet sans text (D6) */}
      <div className="px-3.5 py-2 border-t border-border bg-card/60 text-[11px] text-muted-foreground flex items-center justify-between shrink-0 font-sans select-none">
        <span>Active triage queue</span>
        <span className="text-[10px] text-muted-foreground/70">Keyboard: ↑/↓ select • Esc</span>
      </div>
    </div>
  );
};

// Flat 72px Queue Item Row (CEO_REFERENCE)
const FlatQueueItemRow: React.FC<{
  item: AttentionItem;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ item, isSelected, onSelect }) => {
  const isOffline = item.badges.includes('Offline');
  const isStale = item.badges.includes('Stale');
  const isHigh = item.badges.includes('High') || item.badges.includes('Critical');
  const isCase = item.kind === 'CASE';

  return (
    <div
      onClick={onSelect}
      className={`min-h-[72px] px-3.5 py-2.5 cursor-pointer transition-colors relative flex items-center gap-3 border-l-2 ${
        isSelected
          ? 'bg-primary/10 border-l-primary'
          : 'border-l-transparent hover:bg-muted/30'
      }`}
    >
      {/* 28px Round Status Icon on left (CEO_REFERENCE) */}
      <div className="shrink-0">
        {isOffline ? (
          <div className="size-7 rounded-full bg-destructive/15 text-destructive flex items-center justify-center border border-destructive/30">
            <AlertCircle className="size-4" />
          </div>
        ) : isStale ? (
          <div className="size-7 rounded-full bg-status-stale/15 text-status-stale flex items-center justify-center border border-status-stale/30">
            <AlertCircle className="size-4" />
          </div>
        ) : isHigh ? (
          <div className="size-7 rounded-full bg-destructive/15 text-destructive flex items-center justify-center border border-destructive/30">
            <AlertTriangle className="size-4" />
          </div>
        ) : isCase ? (
          <div className="size-7 rounded-full bg-primary/15 text-primary flex items-center justify-center border border-primary/30">
            <Briefcase className="size-4" />
          </div>
        ) : (
          <div className="size-7 rounded-full bg-status-warning/15 text-status-warning flex items-center justify-center border border-status-warning/30">
            <AlertTriangle className="size-4" />
          </div>
        )}
      </div>

      {/* Middle: 2-line Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        {/* Line 1: Bold ID, State Badge, Urgency-colored Age aligned right */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-xs text-foreground tracking-tight">
              {formatId(item.id)}
            </span>
            {item.badges.slice(0, 1).map((b) => (
              <StatusBadge key={b} status={b} size="sm" />
            ))}
          </div>

          <span
            className={`text-[11px] font-medium tabular-nums shrink-0 ${
              isOffline || isHigh
                ? 'text-destructive'
                : isStale
                ? 'text-muted-foreground'
                : 'text-status-warning'
            }`}
          >
            {item.age}
          </span>
        </div>

        {/* Line 2: Type icon, Location & Reason in muted text */}
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5 truncate">
            {item.kind === 'DEVICE' ? (
              <RadioReceiver className="size-3 shrink-0 opacity-70" />
            ) : item.kind === 'CASE' ? (
              <Briefcase className="size-3 shrink-0 opacity-70" />
            ) : (
              <Radio className="size-3 shrink-0 opacity-70" />
            )}
            <span className="truncate">{item.locationArea || item.detail}</span>
            <span className="opacity-40">•</span>
            <span className="truncate">{item.why}</span>
          </div>

          <ChevronRight className="size-3.5 text-muted-foreground/50 shrink-0" />
        </div>
      </div>
    </div>
  );
};
