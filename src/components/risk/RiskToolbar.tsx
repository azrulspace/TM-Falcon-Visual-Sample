import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Filter,
  ChevronDown,
  ArrowUpDown,
  Map as MapIcon,
  ListFilter,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiMode } from '@/hooks/useUiMode';
import type { RiskFilterState, RiskSortKey, RiskPriority, RiskConfidence, SegmentStatus } from '@/types/risk';
import type { RiskStatusCounts } from '@/data/riskSelectors';
import type { RiskKpiKey } from '@/components/risk/RiskKpiStrip';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

export interface RiskToolbarProps {
  currentTab: 'map' | 'list';
  onTabChange: (tab: 'map' | 'list') => void;
  filters: RiskFilterState;
  onFilterChange: React.Dispatch<React.SetStateAction<RiskFilterState>>;
  sortKey: RiskSortKey;
  onSortChange: (sortKey: RiskSortKey) => void;
  activeKpi: RiskKpiKey | null;
  onClearKpi: () => void;
  availableRoutes: string[];
  totalSegmentsCount: number;
  filteredCount: number;
  statusCounts: RiskStatusCounts;
}

const SORT_OPTIONS: { key: RiskSortKey; label: string }[] = [
  { key: 'urgent', label: 'Most urgent' },
  { key: 'priority', label: 'Priority' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'incidents', label: 'Incidents' },
  { key: 'last_incident', label: 'Last incident' },
];

export const RiskToolbar: React.FC<RiskToolbarProps> = ({
  currentTab,
  onTabChange,
  filters,
  onFilterChange,
  sortKey,
  onSortChange,
  activeKpi,
  onClearKpi,
  availableRoutes,
  totalSegmentsCount,
  filteredCount,
  statusCounts: _statusCounts,
}) => {
  const { isTablet, orientation } = useUiMode();
  const isTabletPortrait = isTablet && orientation === 'portrait';
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Local search state with 250ms debouncing (Section 5.5)
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [mobileFilterSheetOpen, setMobileFilterSheetOpen] = useState(false);

  useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

  // Debounced search update
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((filters.search || '') !== localSearch.trim()) {
        onFilterChange((prev) => ({
          ...prev,
          search: localSearch.trim() || undefined,
        }));
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [localSearch, filters.search, onFilterChange]);

  // Keyboard shortcut '/' focuses search (Section 5.5)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement !== searchInputRef.current &&
        !(document.activeElement instanceof HTMLInputElement) &&
        !(document.activeElement instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const togglePriority = (p: RiskPriority) => {
    onFilterChange((prev) => {
      const current = prev.priority || [];
      const next = current.includes(p) ? current.filter((x) => x !== p) : [...current, p];
      return { ...prev, priority: next.length > 0 ? next : undefined };
    });
  };

  const toggleRoute = (r: string) => {
    onFilterChange((prev) => {
      const current = prev.route || [];
      const next = current.includes(r) ? current.filter((x) => x !== r) : [...current, r];
      return { ...prev, route: next.length > 0 ? next : undefined };
    });
  };

  const toggleConfidence = (c: RiskConfidence) => {
    onFilterChange((prev) => {
      const current = prev.confidence || [];
      const next = current.includes(c) ? current.filter((x) => x !== c) : [...current, c];
      return { ...prev, confidence: next.length > 0 ? next : undefined };
    });
  };

  const toggleStatus = (s: SegmentStatus) => {
    onFilterChange((prev) => {
      const current = prev.status || [];
      const next = current.includes(s) ? current.filter((x) => x !== s) : [...current, s];
      return { ...prev, status: next.length > 0 ? next : undefined };
    });
  };

  const clearAllFilters = () => {
    setLocalSearch('');
    onFilterChange({
      tab: 'to_inspect',
      search: undefined,
      priority: undefined,
      route: undefined,
      confidence: undefined,
      status: undefined,
    });
    onClearKpi();
  };

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.priority?.length || 0) +
    (filters.route?.length || 0) +
    (filters.confidence?.length || 0) +
    (filters.status?.length || 0) +
    (activeKpi ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="space-y-3 mb-4 select-none">
      {/* 5.4 Top-level View Tabs: Map and Ranked list */}
      <div className="flex items-center justify-between border-b border-border/80 pb-0">
        <div className="flex items-center gap-1 -mb-px">
          <button
            type="button"
            onClick={() => onTabChange('map')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer',
              currentTab === 'map'
                ? 'border-primary text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
            )}
          >
            <MapIcon className="size-4" />
            <span>Map</span>
            <span
              className={cn(
                'ml-1 text-xs px-1.5 py-0.5 rounded-full font-mono tabular-nums',
                currentTab === 'map'
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {filteredCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('list')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer',
              currentTab === 'list'
                ? 'border-primary text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
            )}
          >
            <ListFilter className="size-4" />
            <span>Ranked list</span>
            <span
              className={cn(
                'ml-1 text-xs px-1.5 py-0.5 rounded-full font-mono tabular-nums',
                currentTab === 'list'
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {filteredCount}
            </span>
          </button>
        </div>

        {/* Results text */}
        <div className="text-xs text-muted-foreground hidden sm:block">
          Showing <span className="font-semibold text-foreground tabular-nums">{filteredCount}</span>{' '}
          of <span className="font-mono tabular-nums">{totalSegmentsCount}</span> risk segments
        </div>
      </div>

      {/* 5.5 Main Toolbar Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-md">
          {/* Search input with slash shortcut */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search segment ID, pole, or route..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className={cn(
                'w-full pl-9 pr-14 text-xs rounded-lg border border-border/80 bg-card/80 text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary',
                isTablet ? 'h-11 text-sm' : 'h-9'
              )}
            />
            {localSearch ? (
              <button
                type="button"
                onClick={() => setLocalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                title="Clear search"
              >
                <X className="size-3.5" />
              </button>
            ) : (
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted/60 border border-border rounded pointer-events-none hidden sm:inline">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Filter chips & Sort on Desktop / Landscape */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mobile/Tablet Portrait Filter Button */}
          {isTabletPortrait && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileFilterSheetOpen(true)}
              className="h-11 px-3 text-xs gap-1.5 border-border rounded-lg"
            >
              <Filter className="size-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="size-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          )}

          {/* Quiet Outlined Filter Chips (Desktop/Landscape) */}
          <div className={cn('items-center gap-1.5', isTabletPortrait ? 'hidden' : 'flex')}>
            {/* 1. Priority Chip */}
            <Popover>
              <PopoverTrigger render={
                <button
                  type="button"
                  className={cn(
                    'h-8 px-2.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
                    filters.priority?.length
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'bg-card border-border/80 text-muted-foreground hover:text-foreground hover:border-border'
                  )}
                >
                  <span>
                    Priority
                    {filters.priority?.length ? `: ${filters.priority.join(', ')}` : ''}
                  </span>
                  <ChevronDown className="size-3 opacity-60" />
                </button>
              } />
              <PopoverContent className="w-48 p-2 bg-popover border border-border shadow-lg z-50 text-xs">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border font-semibold">
                  <span>Filter Priority</span>
                  {filters.priority?.length && (
                    <button
                      type="button"
                      onClick={() => onFilterChange((prev) => ({ ...prev, priority: undefined }))}
                      className="text-[10px] text-primary hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {(['High', 'Medium', 'Low'] as RiskPriority[]).map((p) => {
                    const isChecked = filters.priority?.includes(p) || false;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePriority(p)}
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

            {/* 2. Route Chip */}
            <Popover>
              <PopoverTrigger render={
                <button
                  type="button"
                  className={cn(
                    'h-8 px-2.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
                    filters.route?.length
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'bg-card border-border/80 text-muted-foreground hover:text-foreground hover:border-border'
                  )}
                >
                  <span>
                    Route
                    {filters.route?.length ? `: ${filters.route.join(', ')}` : ''}
                  </span>
                  <ChevronDown className="size-3 opacity-60" />
                </button>
              } />
              <PopoverContent className="w-48 p-2 bg-popover border border-border shadow-lg z-50 text-xs">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border font-semibold">
                  <span>Filter Route</span>
                  {filters.route?.length && (
                    <button
                      type="button"
                      onClick={() => onFilterChange((prev) => ({ ...prev, route: undefined }))}
                      className="text-[10px] text-primary hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-1 max-h-52 overflow-y-auto">
                  {availableRoutes.map((r) => {
                    const isChecked = filters.route?.includes(r) || false;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => toggleRoute(r)}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-left transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox checked={isChecked} className="size-3.5 pointer-events-none" />
                          <span>{r}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {/* 3. Confidence Chip */}
            <Popover>
              <PopoverTrigger render={
                <button
                  type="button"
                  className={cn(
                    'h-8 px-2.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
                    filters.confidence?.length
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'bg-card border-border/80 text-muted-foreground hover:text-foreground hover:border-border'
                  )}
                >
                  <span>
                    Confidence
                    {filters.confidence?.length ? `: ${filters.confidence.join(', ')}` : ''}
                  </span>
                  <ChevronDown className="size-3 opacity-60" />
                </button>
              } />
              <PopoverContent className="w-48 p-2 bg-popover border border-border shadow-lg z-50 text-xs">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border font-semibold">
                  <span>Filter Confidence</span>
                  {filters.confidence?.length && (
                    <button
                      type="button"
                      onClick={() => onFilterChange((prev) => ({ ...prev, confidence: undefined }))}
                      className="text-[10px] text-primary hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {(['High', 'Medium', 'Low'] as RiskConfidence[]).map((c) => {
                    const isChecked = filters.confidence?.includes(c) || false;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleConfidence(c)}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-left transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox checked={isChecked} className="size-3.5 pointer-events-none" />
                          <span>{c}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {/* 4. Status Chip */}
            <Popover>
              <PopoverTrigger render={
                <button
                  type="button"
                  className={cn(
                    'h-8 px-2.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
                    filters.status?.length
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'bg-card border-border/80 text-muted-foreground hover:text-foreground hover:border-border'
                  )}
                >
                  <span>
                    Status
                    {filters.status?.length
                      ? `: ${filters.status.map((s) => (s === 'to_inspect' ? 'To inspect' : s === 'investigating' ? 'Investigating' : 'Dismissed')).join(', ')}`
                      : ''}
                  </span>
                  <ChevronDown className="size-3 opacity-60" />
                </button>
              } />
              <PopoverContent className="w-48 p-2 bg-popover border border-border shadow-lg z-50 text-xs">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border font-semibold">
                  <span>Filter Status</span>
                  {filters.status?.length && (
                    <button
                      type="button"
                      onClick={() => onFilterChange((prev) => ({ ...prev, status: undefined }))}
                      className="text-[10px] text-primary hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {(
                    [
                      { key: 'to_inspect', label: 'To inspect' },
                      { key: 'investigating', label: 'Investigating' },
                      { key: 'dismissed', label: 'Dismissed' },
                    ] as { key: SegmentStatus; label: string }[]
                  ).map((s) => {
                    const isChecked = filters.status?.includes(s.key) || false;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => toggleStatus(s.key)}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-left transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox checked={isChecked} className="size-3.5 pointer-events-none" />
                          <span>{s.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <button
                type="button"
                className={cn(
                  'px-3 rounded-lg border border-border/80 bg-card text-xs font-medium text-foreground hover:bg-muted/60 transition-colors flex items-center gap-2 cursor-pointer',
                  isTablet ? 'h-11' : 'h-8'
                )}
                title="Sort segments"
              >
                <ArrowUpDown className="size-3.5 text-muted-foreground" />
                <span>
                  Sort: <strong className="font-semibold">{SORT_OPTIONS.find((s) => s.key === sortKey)?.label}</strong>
                </span>
                <ChevronDown className="size-3 opacity-60" />
              </button>
            } />
            <DropdownMenuContent align="end" className="w-44 bg-popover border border-border text-xs z-50">
              {SORT_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.key}
                  onClick={() => onSortChange(opt.key)}
                  className="flex items-center justify-between px-3 py-2 cursor-pointer"
                >
                  <span>{opt.label}</span>
                  {sortKey === opt.key && <Check className="size-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active Filter Removable Chips & Clear All */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
          <span className="text-muted-foreground text-[11px] font-medium">Active:</span>

          {activeKpi && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30 text-xs font-medium">
              KPI:{' '}
              {activeKpi === 'to_inspect'
                ? 'To inspect'
                : activeKpi === 'high_priority'
                  ? 'High priority'
                  : activeKpi === 'medium_priority'
                    ? 'Medium priority'
                    : activeKpi === 'low_priority'
                      ? 'Low priority'
                      : 'Low confidence'}
              <button
                type="button"
                onClick={onClearKpi}
                className="hover:opacity-70 p-0.5"
                title="Remove KPI filter"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted border border-border text-xs">
              Search: "{filters.search}"
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  onFilterChange((prev) => ({ ...prev, search: undefined }));
                }}
                className="hover:opacity-70 p-0.5"
                title="Clear search filter"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {filters.priority?.map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted border border-border text-xs"
            >
              Priority: {p}
              <button
                type="button"
                onClick={() => togglePriority(p)}
                className="hover:opacity-70 p-0.5"
                title={`Remove ${p} priority`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}

          {filters.route?.map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted border border-border text-xs"
            >
              Route: {r}
              <button
                type="button"
                onClick={() => toggleRoute(r)}
                className="hover:opacity-70 p-0.5"
                title={`Remove ${r}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}

          {filters.confidence?.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted border border-border text-xs"
            >
              Confidence: {c}
              <button
                type="button"
                onClick={() => toggleConfidence(c)}
                className="hover:opacity-70 p-0.5"
                title={`Remove ${c} confidence`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}

          {filters.status?.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted border border-border text-xs"
            >
              Status: {s === 'to_inspect' ? 'To inspect' : s === 'investigating' ? 'Investigating' : 'Dismissed'}
              <button
                type="button"
                onClick={() => toggleStatus(s)}
                className="hover:opacity-70 p-0.5"
                title={`Remove ${s} status`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs text-primary hover:underline ml-1 font-medium cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Mobile/Tablet Portrait Filter Bottom Sheet (Section 7) */}
      <Sheet open={mobileFilterSheetOpen} onOpenChange={setMobileFilterSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl p-4 bg-background">
          <SheetHeader className="pb-3 border-b border-border">
            <SheetTitle className="text-base font-semibold">Filters</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Narrow down segments by priority, route, confidence, or status.
            </SheetDescription>
          </SheetHeader>

          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Priority */}
            <div>
              <div className="text-xs font-semibold text-foreground mb-2">Priority</div>
              <div className="grid grid-cols-3 gap-2">
                {(['High', 'Medium', 'Low'] as RiskPriority[]).map((p) => {
                  const isChecked = filters.priority?.includes(p) || false;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePriority(p)}
                      className={cn(
                        'h-11 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors',
                        isChecked ? 'bg-primary/10 border-primary text-primary font-semibold' : 'border-border text-muted-foreground'
                      )}
                    >
                      <Checkbox checked={isChecked} className="size-4 pointer-events-none" />
                      <span>{p}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Confidence */}
            <div>
              <div className="text-xs font-semibold text-foreground mb-2">Confidence</div>
              <div className="grid grid-cols-3 gap-2">
                {(['High', 'Medium', 'Low'] as RiskConfidence[]).map((c) => {
                  const isChecked = filters.confidence?.includes(c) || false;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleConfidence(c)}
                      className={cn(
                        'h-11 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors',
                        isChecked ? 'bg-primary/10 border-primary text-primary font-semibold' : 'border-border text-muted-foreground'
                      )}
                    >
                      <Checkbox checked={isChecked} className="size-4 pointer-events-none" />
                      <span>{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Route */}
            <div>
              <div className="text-xs font-semibold text-foreground mb-2">Route</div>
              <div className="grid grid-cols-2 gap-2">
                {availableRoutes.map((r) => {
                  const isChecked = filters.route?.includes(r) || false;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleRoute(r)}
                      className={cn(
                        'h-11 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors',
                        isChecked ? 'bg-primary/10 border-primary text-primary font-semibold' : 'border-border text-muted-foreground'
                      )}
                    >
                      <Checkbox checked={isChecked} className="size-4 pointer-events-none" />
                      <span>{r}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status */}
            <div>
              <div className="text-xs font-semibold text-foreground mb-2">Status</div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: 'to_inspect', label: 'To inspect' },
                    { key: 'investigating', label: 'Investigating' },
                    { key: 'dismissed', label: 'Dismissed' },
                  ] as { key: SegmentStatus; label: string }[]
                ).map((s) => {
                  const isChecked = filters.status?.includes(s.key) || false;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => toggleStatus(s.key)}
                      className={cn(
                        'h-11 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors',
                        isChecked ? 'bg-primary/10 border-primary text-primary font-semibold' : 'border-border text-muted-foreground'
                      )}
                    >
                      <Checkbox checked={isChecked} className="size-4 pointer-events-none" />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <SheetFooter className="flex-row justify-between pt-3 border-t border-border gap-2">
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-11">
              Clear all
            </Button>
            <Button size="sm" onClick={() => setMobileFilterSheetOpen(false)} className="h-11 px-6">
              Done ({filteredCount} results)
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};
