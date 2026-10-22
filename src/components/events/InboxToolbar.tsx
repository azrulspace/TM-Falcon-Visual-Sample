import React, { useRef, useEffect, useState } from 'react';
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
  Edit2,
  Star,
  ChevronDown,
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { useEvents, type SavedView } from '@/contexts/EventsContext';
import { cn, formatId } from '@/lib/utils';
import { getStatusCounts } from '@/data/eventSelectors';

export interface InboxFilters {
  tab: 'all' | 'new' | 'acknowledged' | 'in_case' | 'resolved';
  search: string;
  timeRange?: string;
  customTimeStart?: string;
  customTimeEnd?: string;
  priority?: string;
  status?: string;
  caseFilter?: string;
  device?: string;
  asset?: string;
  type?: string;
  source?: string;
  capturedBefore?: string;
  fromEventId?: string;
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
  const { events, savedViews, saveView, renameSavedView, deleteSavedView, setDefaultView } = useEvents();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Saved Views state
  const [saveViewName, setSaveViewName] = useState('');
  const [saveViewOpen, setSaveViewOpen] = useState(false);
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [editingViewName, setEditingViewName] = useState('');
  const [mobileFilterSheetOpen, setMobileFilterSheetOpen] = useState(false);

  // Local search state with 250ms debouncing (Section 3.4)
  const [localSearch, setLocalSearch] = useState(filters.search);

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
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      capturedBefore: filters.capturedBefore,
      fromEventId: filters.fromEventId,
    });
  }, [events, filters]);

  // Filter modifiers
  const updateFilter = (key: keyof InboxFilters, val: any) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  const removeFilter = (key: keyof InboxFilters) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      if (key === 'capturedBefore') {
        delete next.fromEventId;
      }
      return next;
    });
  };

  const clearAllFilters = () => {
    setFilters({
      tab: 'all',
      search: '',
      timeRange: undefined,
      priority: undefined,
      status: undefined,
      caseFilter: undefined,
      device: undefined,
      asset: undefined,
      type: undefined,
      source: undefined,
      capturedBefore: undefined,
      fromEventId: undefined,
    });
  };

  // Multi-select Priority Handler
  const handleTogglePriority = (p: string) => {
    const current = filters.priority ? filters.priority.split(',') : [];
    let updated: string[];
    if (current.includes(p)) {
      updated = current.filter((x) => x !== p);
    } else {
      updated = [...current, p];
    }
    updateFilter('priority', updated.length > 0 ? updated.join(',') : undefined);
  };

  // Multi-select Status Handler (Selecting several statuses sets tab to 'all')
  const handleToggleStatus = (s: string) => {
    const current = filters.status ? filters.status.split(',') : [];
    let updated: string[];
    if (current.includes(s)) {
      updated = current.filter((x) => x !== s);
    } else {
      updated = [...current, s];
    }
    setFilters((prev) => ({
      ...prev,
      tab: 'all',
      status: updated.length > 0 ? updated.join(',') : undefined,
    }));
  };

  // Multi-select Source Handler
  const handleToggleSource = (src: string) => {
    const current = filters.source ? filters.source.split(',') : [];
    let updated: string[];
    if (current.includes(src)) {
      updated = current.filter((x) => x !== src);
    } else {
      updated = [...current, src];
    }
    updateFilter('source', updated.length > 0 ? updated.join(',') : undefined);
  };

  // Case search local state
  const [caseSearchInput, setCaseSearchInput] = useState('');

  // Active filter pills list (Section 3.5)
  const activePills = React.useMemo(() => {
    const pills: { key: keyof InboxFilters; label: string; value: string }[] = [];
    if (filters.priority) pills.push({ key: 'priority', label: 'Priority', value: filters.priority.replace(/,/g, ', ') });
    if (filters.status) pills.push({ key: 'status', label: 'Status', value: filters.status.replace(/,/g, ', ') });
    if (filters.caseFilter) {
      const valLabel =
        filters.caseFilter === 'with_case'
          ? 'With case'
          : filters.caseFilter === 'without_case'
          ? 'Without case'
          : filters.caseFilter;
      pills.push({ key: 'caseFilter', label: 'Case', value: valLabel });
    }
    if (filters.timeRange) pills.push({ key: 'timeRange', label: 'Time', value: filters.timeRange });
    if (filters.source) pills.push({ key: 'source', label: 'Source', value: filters.source.replace(/,/g, ', ') });
    if (filters.device) pills.push({ key: 'device', label: 'Device', value: formatId(filters.device) });
    if (filters.asset) pills.push({ key: 'asset', label: 'Asset', value: formatId(filters.asset) });
    if (filters.capturedBefore) pills.push({ key: 'capturedBefore', label: 'Captured before', value: formatId(filters.capturedBefore) });
    return pills;
  }, [filters]);

  // Saved View Apply
  const handleApplySavedView = (view: SavedView) => {
    setFilters((prev) => ({
      ...prev,
      tab: view.filters.tab || 'all',
      search: view.filters.search || '',
      priority: view.filters.priority,
      status: view.filters.status,
      caseFilter: view.filters.caseFilter,
      timeRange: view.filters.timeRange,
      device: view.filters.device,
      asset: view.filters.asset,
      source: view.filters.source,
    }));
    if (view.filters.viewMode) {
      setViewMode(view.filters.viewMode);
    }
  };

  return (
    <div className="flex flex-col gap-2.5 mb-3 select-none">
      {/* Upper Toolbar: Status Tabs, Search, Views, View Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Quick View Tabs matching Section 3.3 & INBOX_FINAL */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg border border-border bg-muted/40 shrink-0 overflow-x-auto">
          {[
            { id: 'all' as const, label: 'All', count: tabCounts.all },
            { id: 'new' as const, label: 'New', count: tabCounts.new },
            { id: 'acknowledged' as const, label: 'Acknowledged', count: tabCounts.acknowledged },
            { id: 'in_case' as const, label: 'Case Created', count: tabCounts.in_case },
            { id: 'resolved' as const, label: 'Resolved', count: tabCounts.resolved },
          ].map((tab) => {
            const isActive = filters.tab === tab.id && !filters.status;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFilters((prev) => ({
                    ...prev,
                    tab: tab.id,
                    status: undefined, // Quick tab sets single status focus
                  }));
                }}
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

        {/* Right side: Search, Saved Views, View Mode Switcher, Result Count */}
        <div className="flex items-center gap-2">
          {/* Search Input with / badge (Section 3.4) */}
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
                type="button"
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

          {/* Saved Views Dropdown (Section 3.4) */}
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2.5 text-xs gap-1.5 border-border hover:bg-muted font-medium"
                title="Views dropdown"
              >
                <Bookmark className="size-3.5 text-muted-foreground" />
                <span>Views</span>
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-64 bg-popover border border-border text-xs z-50">
              <DropdownMenuLabel className="text-xs font-semibold px-2 py-1">Saved Views</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Default Views list */}
              <div className="flex flex-col gap-0.5 p-1">
                {savedViews.map((sv) => (
                  <div
                    key={sv.id}
                    className="flex items-center justify-between px-2 py-1.5 hover:bg-muted/60 rounded cursor-pointer group"
                  >
                    {editingViewId === sv.id ? (
                      <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingViewName}
                          onChange={(e) => setEditingViewName(e.target.value)}
                          className="h-6 px-1.5 text-xs border border-border rounded bg-card flex-1"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => {
                            renameSavedView(sv.id, editingViewName);
                            setEditingViewId(null);
                          }}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div
                          className="flex items-center gap-1.5 truncate flex-1"
                          onClick={() => handleApplySavedView(sv)}
                        >
                          <Bookmark className={cn('size-3 shrink-0', sv.isDefault ? 'text-amber-500 fill-amber-500' : 'text-primary')} />
                          <span className="truncate">{sv.name}</span>
                          {sv.isDefault && (
                            <span className="text-[9px] px-1 rounded bg-amber-500/10 text-amber-500 font-semibold">Default</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDefaultView(sv.id);
                            }}
                            className="p-1 hover:text-amber-500 text-muted-foreground"
                            title="Set as default"
                          >
                            <Star className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingViewId(sv.id);
                              setEditingViewName(sv.name);
                            }}
                            className="p-1 hover:text-primary text-muted-foreground"
                            title="Rename view"
                          >
                            <Edit2 className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSavedView(sv.id);
                            }}
                            className="p-1 hover:text-destructive text-muted-foreground"
                            title="Delete view"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <DropdownMenuSeparator />

              {/* Save current filters */}
              <div className="p-2">
                <Popover open={saveViewOpen} onOpenChange={setSaveViewOpen}>
                  <PopoverTrigger render={
                    <Button variant="ghost" size="sm" className="w-full h-7 text-xs justify-start gap-1.5 text-primary">
                      <Plus className="size-3" />
                      <span>Save current view</span>
                    </Button>
                  } />
                  <PopoverContent align="end" className="w-64 p-3 bg-popover border border-border shadow-xl z-50 text-xs">
                    <div className="font-semibold text-foreground mb-2">Save current view</div>
                    <input
                      type="text"
                      placeholder="e.g. Critical Camera Alerts"
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
                          saveView(saveViewName.trim(), {
                            tab: filters.tab,
                            search: filters.search,
                            priority: filters.priority,
                            status: filters.status,
                            caseFilter: filters.caseFilter,
                            timeRange: filters.timeRange,
                            device: filters.device,
                            asset: filters.asset,
                            source: filters.source,
                            viewMode,
                          });
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

          {/* View Mode Toggle: Table and Gallery ONLY (Section 3.4) */}
          <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40">
            <button
              type="button"
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
              type="button"
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

          {/* Result Count Indicator matching INBOX_FINAL */}
          <span className="text-xs text-muted-foreground ml-2 shrink-0 font-medium tabular-nums hidden sm:inline">
            {filteredCount} events
          </span>
        </div>
      </div>

      {/* Lower Filter Chips Strip (Desktop & Tablet >= 768px) (Section 3.5) */}
      <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-muted-foreground flex items-center gap-1 shrink-0 font-medium mr-1">
          <Filter className="size-3" />
          <span>Filter:</span>
        </span>

        {/* 1. Priority Popover (Multiple Select) */}
        <Popover>
          <PopoverTrigger render={
            <button
              type="button"
              className={cn(
                'h-7 px-2.5 rounded-full border text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
                filters.priority ? 'bg-primary/10 border-primary text-primary font-semibold' : 'bg-card border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <span>Priority{filters.priority ? `: ${filters.priority.replace(/,/g, ', ')}` : ''}</span>
              <ChevronDown className="size-3 opacity-60" />
            </button>
          } />
          <PopoverContent className="w-48 p-2 bg-popover border border-border shadow-lg z-50 text-xs">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border font-semibold">
              <span>Filter Priority</span>
              {filters.priority && (
                <button
                  type="button"
                  onClick={() => updateFilter('priority', undefined)}
                  className="text-[10px] text-primary hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {['Critical', 'High', 'Medium', 'Low'].map((p) => {
                const isChecked = (filters.priority ? filters.priority.split(',') : []).includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleTogglePriority(p)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={isChecked} className="size-3.5 pointer-events-none" />
                      <span>{p}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* 2. Status Popover (Multiple Select) */}
        <Popover>
          <PopoverTrigger render={
            <button
              type="button"
              className={cn(
                'h-7 px-2.5 rounded-full border text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
                filters.status ? 'bg-primary/10 border-primary text-primary font-semibold' : 'bg-card border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <span>Status{filters.status ? `: ${filters.status.replace(/,/g, ', ')}` : ''}</span>
              <ChevronDown className="size-3 opacity-60" />
            </button>
          } />
          <PopoverContent className="w-52 p-2 bg-popover border border-border shadow-lg z-50 text-xs">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border font-semibold">
              <span>Filter Status</span>
              {filters.status && (
                <button
                  type="button"
                  onClick={() => updateFilter('status', undefined)}
                  className="text-[10px] text-primary hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {['New', 'Acknowledged', 'Case Created', 'Resolved'].map((s) => {
                const isChecked = (filters.status ? filters.status.split(',') : []).includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleToggleStatus(s)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={isChecked} className="size-3.5 pointer-events-none" />
                      <span>{s}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* 3. Case Popover (Any, With case, Without case, Case ID search) */}
        <Popover>
          <PopoverTrigger render={
            <button
              type="button"
              className={cn(
                'h-7 px-2.5 rounded-full border text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
                filters.caseFilter ? 'bg-primary/10 border-primary text-primary font-semibold' : 'bg-card border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <span>
                Case
                {filters.caseFilter
                  ? `: ${
                      filters.caseFilter === 'with_case'
                        ? 'With case'
                        : filters.caseFilter === 'without_case'
                        ? 'Without case'
                        : filters.caseFilter
                    }`
                  : ''}
              </span>
              <ChevronDown className="size-3 opacity-60" />
            </button>
          } />
          <PopoverContent className="w-56 p-2 bg-popover border border-border shadow-lg z-50 text-xs">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border font-semibold">
              <span>Filter Case</span>
              {filters.caseFilter && (
                <button
                  type="button"
                  onClick={() => updateFilter('caseFilter', undefined)}
                  className="text-[10px] text-primary hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {[
                { id: undefined, label: 'Any' },
                { id: 'with_case', label: 'With case' },
                { id: 'without_case', label: 'Without case' },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => updateFilter('caseFilter', opt.id)}
                  className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted text-left cursor-pointer"
                >
                  <span>{opt.label}</span>
                  {filters.caseFilter === opt.id && <Check className="size-3.5 text-primary" />}
                </button>
              ))}
              <div className="pt-2 border-t border-border mt-1">
                <span className="text-[10px] text-muted-foreground block mb-1">Search Case ID</span>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="e.g. CAS-0001"
                    value={caseSearchInput}
                    onChange={(e) => setCaseSearchInput(e.target.value)}
                    className="h-7 px-2 text-xs border border-border rounded bg-card flex-1"
                  />
                  <Button
                    size="sm"
                    className="h-7 px-2 text-xs"
                    disabled={!caseSearchInput.trim()}
                    onClick={() => {
                      updateFilter('caseFilter', caseSearchInput.trim().toUpperCase());
                      setCaseSearchInput('');
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* 4. Time Popover (Today, 24h, 7d, 30d, Custom range) */}
        <Popover>
          <PopoverTrigger render={
            <button
              type="button"
              className={cn(
                'h-7 px-2.5 rounded-full border text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
                filters.timeRange ? 'bg-primary/10 border-primary text-primary font-semibold' : 'bg-card border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <span>
                Time
                {filters.timeRange
                  ? `: ${
                      filters.timeRange === 'today'
                        ? 'Today'
                        : filters.timeRange === '24h'
                        ? 'Last 24 hours'
                        : filters.timeRange === '7d'
                        ? 'Last 7 days'
                        : filters.timeRange === '30d'
                        ? 'Last 30 days'
                        : filters.timeRange
                    }`
                  : ''}
              </span>
              <ChevronDown className="size-3 opacity-60" />
            </button>
          } />
          <PopoverContent className="w-56 p-2 bg-popover border border-border shadow-lg z-50 text-xs">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border font-semibold">
              <span>Filter Time (MYT)</span>
              {filters.timeRange && (
                <button
                  type="button"
                  onClick={() => {
                    updateFilter('timeRange', undefined);
                    updateFilter('customTimeStart', undefined);
                    updateFilter('customTimeEnd', undefined);
                  }}
                  className="text-[10px] text-primary hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {[
                { id: undefined, label: 'All time' },
                { id: 'today', label: 'Today (from 00:00 MYT)' },
                { id: '24h', label: 'Last 24 hours' },
                { id: '7d', label: 'Last 7 days' },
                { id: '30d', label: 'Last 30 days' },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    updateFilter('timeRange', opt.id);
                    updateFilter('customTimeStart', undefined);
                    updateFilter('customTimeEnd', undefined);
                  }}
                  className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted text-left cursor-pointer"
                >
                  <span>{opt.label}</span>
                  {filters.timeRange === opt.id && <Check className="size-3.5 text-primary" />}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* 5. Source Popover (Edge service, Manual, Partner feed) */}
        <Popover>
          <PopoverTrigger render={
            <button
              type="button"
              className={cn(
                'h-7 px-2.5 rounded-full border text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
                filters.source ? 'bg-primary/10 border-primary text-primary font-semibold' : 'bg-card border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <span>Source{filters.source ? `: ${filters.source.replace(/,/g, ', ')}` : ''}</span>
              <ChevronDown className="size-3 opacity-60" />
            </button>
          } />
          <PopoverContent className="w-52 p-2 bg-popover border border-border shadow-lg z-50 text-xs">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border font-semibold">
              <span>Filter Source</span>
              {filters.source && (
                <button
                  type="button"
                  onClick={() => updateFilter('source', undefined)}
                  className="text-[10px] text-primary hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {['Edge service', 'Manual', 'Partner feed'].map((src) => {
                const isChecked = (filters.source ? filters.source.split(',') : []).includes(src);
                return (
                  <button
                    key={src}
                    type="button"
                    onClick={() => handleToggleSource(src)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={isChecked} className="size-3.5 pointer-events-none" />
                      <span>{src}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Removable Chips (Priority, Status, Case, Time, Source, Device, Asset, CapturedBefore) */}
        {activePills.map((pill) => (
          <span
            key={pill.key}
            className="h-7 pl-2.5 pr-1.5 rounded-full bg-primary/10 border border-primary/40 text-primary text-xs font-medium flex items-center gap-1 shrink-0"
          >
            <span>{pill.label}: <strong>{pill.value}</strong></span>
            <button
              type="button"
              onClick={() => removeFilter(pill.key)}
              className="size-4 rounded-full hover:bg-primary/20 flex items-center justify-center cursor-pointer"
              title={`Remove ${pill.label} filter`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}

        {/* Clear All action */}
        {activePills.length > 0 && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1 shrink-0 cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Mobile Filter Trigger Strip (< 768px) (Section 8) */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileFilterSheetOpen(true)}
          className={cn(
            'h-7 px-2.5 rounded-full text-xs font-medium flex items-center gap-1.5 shrink-0 cursor-pointer',
            activePills.length > 0
              ? 'border-primary text-primary bg-primary/10'
              : 'border-border text-muted-foreground hover:text-foreground'
          )}
        >
          <Filter className="size-3" />
          <span>Filters{activePills.length > 0 ? ` (${activePills.length})` : ''}</span>
          <ChevronDown className="size-3 opacity-60" />
        </Button>

        {/* Scrollable active pills preview */}
        {activePills.map((pill) => (
          <span
            key={pill.key}
            className="h-7 pl-2.5 pr-1.5 rounded-full bg-primary/10 border border-primary/40 text-primary text-xs font-medium flex items-center gap-1 shrink-0"
          >
            <span>{pill.label}: <strong>{pill.value}</strong></span>
            <button
              type="button"
              onClick={() => removeFilter(pill.key)}
              className="size-4 rounded-full hover:bg-primary/20 flex items-center justify-center cursor-pointer"
              title={`Remove ${pill.label} filter`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}

        {activePills.length > 0 && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-foreground underline shrink-0 cursor-pointer ml-1"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Mobile Bottom Filter Sheet (< 768px) (Section 8) */}
      <Sheet open={mobileFilterSheetOpen} onOpenChange={setMobileFilterSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl p-0">
          <SheetHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
            <div>
              <SheetTitle className="text-base font-semibold">Filter Events</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Showing {filteredCount} matching events
              </SheetDescription>
            </div>
            {activePills.length > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-primary font-medium hover:underline mr-6 cursor-pointer"
              >
                Clear all
              </button>
            )}
          </SheetHeader>

          <div className="p-4 space-y-4 text-xs">
            {/* Priority Section */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">Priority</h4>
              <div className="grid grid-cols-2 gap-2">
                {['Critical', 'High', 'Medium', 'Low'].map((p) => {
                  const isChecked = (filters.priority ? filters.priority.split(',') : []).includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleTogglePriority(p)}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg border text-left transition-colors cursor-pointer',
                        isChecked ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:bg-muted'
                      )}
                    >
                      <Checkbox checked={isChecked} className="size-3.5 pointer-events-none" />
                      <span>{p}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status Section */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">Status</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'New', label: 'New' },
                  { id: 'Acknowledged', label: 'Acknowledged' },
                  { id: 'Case Created', label: 'Case Created' },
                  { id: 'Resolved', label: 'Resolved' },
                ].map((s) => {
                  const isChecked = (filters.status ? filters.status.split(',') : []).includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleToggleStatus(s.id)}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg border text-left transition-colors cursor-pointer',
                        isChecked ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:bg-muted'
                      )}
                    >
                      <Checkbox checked={isChecked} className="size-3.5 pointer-events-none" />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Case Section */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">Operational Case</h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: undefined, label: 'Any' },
                  { id: 'with_case', label: 'With case' },
                  { id: 'without_case', label: 'Without case' },
                ].map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => updateFilter('caseFilter', c.id)}
                    className={cn(
                      'p-2 rounded-lg border text-center transition-colors cursor-pointer',
                      filters.caseFilter === c.id ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:bg-muted'
                    )}
                  >
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Section */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">Time (MYT)</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: undefined, label: 'All time' },
                  { id: 'today', label: 'Today' },
                  { id: '24h', label: 'Last 24 hours' },
                  { id: '7d', label: 'Last 7 days' },
                  { id: '30d', label: 'Last 30 days' },
                ].map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => updateFilter('timeRange', t.id)}
                    className={cn(
                      'p-2 rounded-lg border text-center transition-colors cursor-pointer',
                      filters.timeRange === t.id ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:bg-muted'
                    )}
                  >
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Source Section */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">Source</h4>
              <div className="grid grid-cols-3 gap-2">
                {['Edge service', 'Manual', 'Partner feed'].map((src) => {
                  const isChecked = (filters.source ? filters.source.split(',') : []).includes(src);
                  return (
                    <button
                      key={src}
                      type="button"
                      onClick={() => handleToggleSource(src)}
                      className={cn(
                        'flex items-center gap-1.5 p-2 rounded-lg border text-left transition-colors cursor-pointer',
                        isChecked ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:bg-muted'
                      )}
                    >
                      <Checkbox checked={isChecked} className="size-3 pointer-events-none" />
                      <span className="truncate">{src}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <SheetFooter className="p-4 border-t border-border">
            <Button
              className="w-full h-9 bg-primary text-primary-foreground font-semibold cursor-pointer"
              onClick={() => setMobileFilterSheetOpen(false)}
            >
              Apply Filters ({filteredCount} results)
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};
