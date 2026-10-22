import React, { useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  X,
  Bookmark,
  Check,
  Plus,
  Table as TableIcon,
  LayoutGrid,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEvents } from '@/contexts/EventsContext';
import { cn } from '@/lib/utils';
import { getStatusCounts } from '@/data/eventSelectors';

export interface InboxFilters {
  tab: 'all' | 'new' | 'acknowledged' | 'in_case' | 'resolved';
  search: string;
  timeRange?: string;
  priority?: string;
  status?: string;
  caseFilter?: string;
  device?: string;
  asset?: string;
  type?: string;
  source?: string;
}

export interface InboxToolbarProps {
  filters: InboxFilters;
  setFilters: React.Dispatch<React.SetStateAction<InboxFilters>>;
  viewMode: 'table' | 'gallery';
  setViewMode: (m: 'table' | 'gallery') => void;
  filteredCount: number;
}

export const InboxToolbar: React.FC<InboxToolbarProps> = ({
  filters,
  setFilters,
  viewMode,
  setViewMode,
  filteredCount,
}) => {
  const { events, savedViews, saveView, deleteSavedView } = useEvents();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [saveViewName, setSaveViewName] = React.useState('');
  const [saveViewOpen, setSaveViewOpen] = React.useState(false);

  // Faceted tab counts respecting all active filters except status
  const tabCounts = React.useMemo(() => {
    return getStatusCounts(events, {
      search: filters.search,
      priority: filters.priority ? filters.priority.split(',') : undefined,
      status: filters.status ? filters.status.split(',') : undefined,
      caseFilter: filters.caseFilter,
      timeRange: filters.timeRange,
      device: filters.device,
      asset: filters.asset,
      source: filters.source ? filters.source.split(',') : undefined,
    });
  }, [events, filters]);

  // Local search state with 250ms debouncing (Section 3.4)
  const [localSearch, setLocalSearch] = React.useState(filters.search);

  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        setFilters((prev) => ({ ...prev, search: localSearch.trim() }));
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [localSearch, filters.search, setFilters]);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter modifiers
  const updateFilter = (key: keyof InboxFilters, val: any) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  const removeFilter = (key: keyof InboxFilters) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const clearAllFilters = () => {
    setFilters({
      tab: 'all',
      search: '',
    });
  };

  // Active filter pills list
  const activePills = React.useMemo(() => {
    const pills: { key: keyof InboxFilters; label: string; value: string }[] = [];
    if (filters.priority) pills.push({ key: 'priority', label: 'Priority', value: filters.priority });
    if (filters.status) pills.push({ key: 'status', label: 'Status', value: filters.status });
    if (filters.caseFilter) pills.push({ key: 'caseFilter', label: 'Case', value: filters.caseFilter === 'with_case' ? 'With case' : 'No case' });
    if (filters.timeRange) pills.push({ key: 'timeRange', label: 'Time', value: filters.timeRange });
    if (filters.device) pills.push({ key: 'device', label: 'Device', value: filters.device });
    if (filters.asset) pills.push({ key: 'asset', label: 'Asset', value: filters.asset });
    if (filters.type) pills.push({ key: 'type', label: 'Type', value: filters.type });
    if (filters.source) pills.push({ key: 'source', label: 'Source', value: filters.source });
    return pills;
  }, [filters]);

  const handleApplySavedView = (view: typeof savedViews[0]) => {
    setFilters((prev) => ({
      ...prev,
      ...view.filters,
    }));
  };

  return (
    <div className="flex flex-col gap-2.5 mb-3 select-none">
      {/* Upper Toolbar: Tabs, Search, View Mode, Saved Views */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Quick View Tabs matching Section 6.3 */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg border border-border bg-muted/40 shrink-0 overflow-x-auto">
          {[
            { id: 'all' as const, label: 'All', count: tabCounts.all },
            { id: 'new' as const, label: 'New', count: tabCounts.new },
            { id: 'acknowledged' as const, label: 'Acknowledged', count: tabCounts.acknowledged },
            { id: 'in_case' as const, label: 'Case Created', count: tabCounts.in_case },
            { id: 'resolved' as const, label: 'Resolved', count: tabCounts.resolved },
          ].map((tab) => {
            const isActive = filters.tab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => updateFilter('tab', tab.id)}
                className={cn(
                  'flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer',
                  isActive
                    ? 'bg-card text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'text-[10px] px-1 rounded-full tabular-nums',
                    isActive ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right side: Search, Saved Views, View Mode Switcher */}
        <div className="flex items-center gap-2">
          {/* Search Input with / badge */}
          <div className="relative w-64 lg:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by ID, type, device, asset..."
              className="w-full h-9 pl-8 pr-7 text-xs bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs transition-colors"
            />
            {localSearch ? (
              <button
                onClick={() => {
                  setLocalSearch('');
                  updateFilter('search', '');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center"
                title="Clear search"
              >
                <X className="size-3" />
              </button>
            ) : (
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1 text-[10px] font-mono rounded bg-muted text-muted-foreground border border-border pointer-events-none">
                /
              </kbd>
            )}
          </div>

          {/* Saved Views Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2.5 text-xs gap-1.5 border-border hover:bg-muted"
                title="Saved views"
              >
                <Bookmark className="size-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Views</span>
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-56 bg-popover border border-border text-xs z-50">
              <DropdownMenuLabel className="text-xs font-semibold">Saved Views</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {savedViews.map((sv) => (
                <div key={sv.id} className="flex items-center justify-between px-2 py-1.5 hover:bg-muted/60 rounded cursor-pointer group">
                  <div className="flex items-center gap-1.5 truncate flex-1" onClick={() => handleApplySavedView(sv)}>
                    <Bookmark className="size-3 text-primary shrink-0" />
                    <span className="truncate">{sv.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSavedView(sv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive text-muted-foreground"
                    title="Delete saved view"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
              <DropdownMenuSeparator />
              <div className="p-2">
                <Popover open={saveViewOpen} onOpenChange={setSaveViewOpen}>
                  <PopoverTrigger render={
                    <Button variant="ghost" size="sm" className="w-full h-7 text-xs justify-start gap-1.5 text-primary">
                      <Plus className="size-3" />
                      <span>Save current filters</span>
                    </Button>
                  } />
                  <PopoverContent align="end" className="w-64 p-3 bg-popover border border-border shadow-xl z-50 text-xs">
                    <div className="font-semibold text-foreground mb-2">Save current view</div>
                    <input
                      type="text"
                      placeholder="e.g. Critical Camera Faults"
                      value={saveViewName}
                      onChange={(e) => setSaveViewName(e.target.value)}
                      className="w-full h-8 px-2 text-xs border border-border rounded mb-3 bg-card"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSaveViewOpen(false)}>Cancel</Button>
                      <Button
                        size="sm"
                        disabled={!saveViewName.trim()}
                        onClick={() => {
                          saveView(saveViewName.trim(), filters);
                          setSaveViewName('');
                          setSaveViewOpen(false);
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode Toggle: Table and Gallery ONLY */}
          <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'size-8 flex items-center justify-center rounded transition-colors cursor-pointer',
                viewMode === 'table' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
              title="Table view"
              aria-label="Table view"
            >
              <TableIcon className="size-4" />
            </button>
            <button
              onClick={() => setViewMode('gallery')}
              className={cn(
                'size-8 flex items-center justify-center rounded transition-colors cursor-pointer',
                viewMode === 'gallery' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
              title="Gallery view"
              aria-label="Gallery view"
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Lower Filter Chips Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-muted-foreground flex items-center gap-1 shrink-0 font-medium mr-1">
          <Filter className="size-3" />
          <span>Filter:</span>
        </span>

        {/* Priority Filter */}
        <Popover>
          <PopoverTrigger render={
            <button className={cn(
              'h-7 px-2.5 rounded-full border text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
              filters.priority ? 'bg-primary/10 border-primary text-primary font-semibold' : 'bg-card border-border text-muted-foreground hover:text-foreground'
            )}>
              <span>Priority{filters.priority ? `: ${filters.priority}` : ''}</span>
            </button>
          } />
          <PopoverContent className="w-40 p-1.5 bg-popover border border-border shadow-lg z-50 text-xs">
            {['Critical', 'High', 'Medium', 'Low'].map((p) => (
              <button
                key={p}
                onClick={() => updateFilter('priority', filters.priority === p ? undefined : p)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted text-left cursor-pointer"
              >
                <span>{p}</span>
                {filters.priority === p && <Check className="size-3 text-primary" />}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Status Filter */}
        <Popover>
          <PopoverTrigger render={
            <button className={cn(
              'h-7 px-2.5 rounded-full border text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
              filters.status ? 'bg-primary/10 border-primary text-primary font-semibold' : 'bg-card border-border text-muted-foreground hover:text-foreground'
            )}>
              <span>Status{filters.status ? `: ${filters.status}` : ''}</span>
            </button>
          } />
          <PopoverContent className="w-44 p-1.5 bg-popover border border-border shadow-lg z-50 text-xs">
            {['New', 'Acknowledged', 'In case', 'Dismissed', 'Resolved'].map((s) => (
              <button
                key={s}
                onClick={() => updateFilter('status', filters.status === s ? undefined : s)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted text-left cursor-pointer"
              >
                <span>{s}</span>
                {filters.status === s && <Check className="size-3 text-primary" />}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Case Filter */}
        <Popover>
          <PopoverTrigger render={
            <button className={cn(
              'h-7 px-2.5 rounded-full border text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
              filters.caseFilter ? 'bg-primary/10 border-primary text-primary font-semibold' : 'bg-card border-border text-muted-foreground hover:text-foreground'
            )}>
              <span>Case{filters.caseFilter ? `: ${filters.caseFilter === 'with_case' ? 'With case' : 'No case'}` : ''}</span>
            </button>
          } />
          <PopoverContent className="w-36 p-1.5 bg-popover border border-border shadow-lg z-50 text-xs">
            {[
              { id: 'with_case', label: 'With case' },
              { id: 'without_case', label: 'No case' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => updateFilter('caseFilter', filters.caseFilter === c.id ? undefined : c.id)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted text-left cursor-pointer"
              >
                <span>{c.label}</span>
                {filters.caseFilter === c.id && <Check className="size-3 text-primary" />}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Time Range Filter */}
        <Popover>
          <PopoverTrigger render={
            <button className={cn(
              'h-7 px-2.5 rounded-full border text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
              filters.timeRange ? 'bg-primary/10 border-primary text-primary font-semibold' : 'bg-card border-border text-muted-foreground hover:text-foreground'
            )}>
              <span>Time{filters.timeRange ? `: ${filters.timeRange}` : ''}</span>
            </button>
          } />
          <PopoverContent className="w-40 p-1.5 bg-popover border border-border shadow-lg z-50 text-xs">
            {['Last 1 hour', 'Last 24 hours', 'Last 7 days', 'Last 30 days'].map((t) => (
              <button
                key={t}
                onClick={() => updateFilter('timeRange', filters.timeRange === t ? undefined : t)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted text-left cursor-pointer"
              >
                <span>{t}</span>
                {filters.timeRange === t && <Check className="size-3 text-primary" />}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Source Filter */}
        <Popover>
          <PopoverTrigger render={
            <button className={cn(
              'h-7 px-2.5 rounded-full border text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
              filters.source ? 'bg-primary/10 border-primary text-primary font-semibold' : 'bg-card border-border text-muted-foreground hover:text-foreground'
            )}>
              <span>Source{filters.source ? `: ${filters.source}` : ''}</span>
            </button>
          } />
          <PopoverContent className="w-40 p-1.5 bg-popover border border-border shadow-lg z-50 text-xs">
            {['Edge service', 'Manual', 'Partner feed'].map((src) => (
              <button
                key={src}
                onClick={() => updateFilter('source', filters.source === src ? undefined : src)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted text-left cursor-pointer"
              >
                <span>{src}</span>
                {filters.source === src && <Check className="size-3 text-primary" />}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Active Removable Chips */}
        {activePills.map((pill) => (
          <span
            key={pill.key}
            className="h-7 pl-2.5 pr-1.5 rounded-full bg-primary/10 border border-primary/40 text-primary text-xs font-medium flex items-center gap-1 shrink-0"
          >
            <span>{pill.label}: <strong>{pill.value}</strong></span>
            <button
              onClick={() => removeFilter(pill.key)}
              className="size-4 rounded-full hover:bg-primary/20 flex items-center justify-center cursor-pointer"
              title={`Remove ${pill.label} filter`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}

        {/* Clear All */}
        {activePills.length > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 ml-2 shrink-0 cursor-pointer"
          >
            Clear all
          </button>
        )}

        {/* Result Count Indicator */}
        <span className="text-[11px] text-muted-foreground ml-auto shrink-0 font-medium tabular-nums hidden sm:inline">
          {filteredCount} event{filteredCount === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  );
};
