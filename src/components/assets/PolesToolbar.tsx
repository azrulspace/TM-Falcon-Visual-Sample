import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Filter,
  ChevronDown,
  ArrowUpDown,
  Table as TableIcon,
  Map as MapIcon,
  Bookmark,
  Star,
  Edit2,
  Trash2,
  Plus,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiMode } from '@/hooks/useUiMode';
import { useAssets } from '@/contexts/AssetsContext';
import type {
  PoleFilterState,
  PoleLifecycle,
  PoleSavedView,
  PoleSortKey,
  PoleSortDir,
  SiteRecord,
} from '@/types/assets';
import type { PoleStatusTabCounts } from '@/data/poleSelectors';
import type { PoleKpiKey } from './PolesKpiStrip';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';

export interface PolesToolbarProps {
  filters: PoleFilterState;
  setFilters: React.Dispatch<React.SetStateAction<PoleFilterState>>;
  sortKey: PoleSortKey;
  sortDir: PoleSortDir;
  onSortChange: (key: PoleSortKey, dir?: PoleSortDir) => void;
  statusCounts: PoleStatusTabCounts;
  filteredCount: number;
  sites: SiteRecord[];
  availableProtections: string[];
  hasTestFlag: boolean;
  activeKpi: PoleKpiKey | null;
  onClearKpi: () => void;
  defaultSite: string;
}

const LIFECYCLE_OPTIONS: PoleLifecycle[] = [
  'Active',
  'Maintenance',
  'Planned',
  'Inactive',
  'Retired',
];

const SORT_OPTIONS: { key: PoleSortKey; label: string }[] = [
  { key: 'identifier', label: 'Identifier' },
  { key: 'lastUpdatedAt', label: 'Last updated' },
  { key: 'registeredAt', label: 'Registered' },
];

export const PolesToolbar: React.FC<PolesToolbarProps> = ({
  filters,
  setFilters,
  sortKey,
  sortDir,
  onSortChange,
  statusCounts,
  filteredCount,
  sites,
  availableProtections,
  hasTestFlag,
  activeKpi,
  onClearKpi,
  defaultSite,
}) => {
  const { isTablet, orientation } = useUiMode();
  const isPortrait = isTablet && orientation === 'portrait';
  const { savedViews, saveView, renameSavedView, deleteSavedView, setDefaultView } = useAssets();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [mobileFilterSheetOpen, setMobileFilterSheetOpen] = useState(false);

  // Saved Views state
  const [saveViewOpen, setSaveViewOpen] = useState(false);
  const [saveViewName, setSaveViewName] = useState('');
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [editingViewName, setEditingViewName] = useState('');

  useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

  // Debounce search by 250ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((filters.search || '') !== localSearch.trim()) {
        setFilters((prev) => ({
          ...prev,
          search: localSearch.trim() || undefined,
        }));
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [localSearch, filters.search, setFilters]);

  // '/' focuses toolbar search input when no input/textarea is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement !== searchInputRef.current &&
        !(document.activeElement instanceof HTMLInputElement) &&
        !(document.activeElement instanceof HTMLTextAreaElement) &&
        !(document.activeElement instanceof HTMLSelectElement)
      ) {
        e.preventDefault();
        e.stopPropagation();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  const toggleLifecycle = (lc: PoleLifecycle) => {
    onClearKpi();
    setFilters((prev) => {
      const curr = prev.lifecycle || [];
      const next = curr.includes(lc) ? curr.filter((x) => x !== lc) : [...curr, lc];
      return { ...prev, lifecycle: next.length > 0 ? next : undefined };
    });
  };

  const toggleProtection = (val: string) => {
    setFilters((prev) => {
      const curr = prev.protection || [];
      const next = curr.includes(val) ? curr.filter((x) => x !== val) : [...curr, val];
      return { ...prev, protection: next.length > 0 ? next : undefined };
    });
  };

  const clearAllFilters = () => {
    onClearKpi();
    setLocalSearch('');
    setFilters((prev) => ({
      ...prev,
      search: undefined,
      lifecycle: undefined,
      site: defaultSite,
      locationFilter: 'all',
      protection: undefined,
      linkedDevice: 'all',
      withEvents30d: false,
      updatedRange: 'all',
      hideTestRecords: false,
    }));
  };

  const handleApplySavedView = (sv: PoleSavedView) => {
    onClearKpi();
    setFilters((prev) => ({
      ...prev,
      statusTab: sv.filters.statusTab || 'active',
      viewMode: sv.filters.viewMode || prev.viewMode,
      search: sv.filters.search,
      lifecycle: sv.filters.lifecycle,
      site: sv.filters.site || defaultSite,
      locationFilter: sv.filters.locationFilter || 'all',
      protection: sv.filters.protection,
      linkedDevice: sv.filters.linkedDevice || 'all',
      withEvents30d: sv.filters.withEvents30d || false,
      updatedRange: sv.filters.updatedRange || 'all',
      hideTestRecords: sv.filters.hideTestRecords || false,
    }));
    setLocalSearch(sv.filters.search || '');
    if (sv.filters.sortKey) {
      onSortChange(sv.filters.sortKey, sv.filters.sortDir || 'asc');
    }
  };

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; value: string; onRemove: () => void }[] = [];

    if (filters.search) {
      chips.push({
        key: 'search',
        label: 'Search',
        value: `"${filters.search}"`,
        onRemove: () => {
          setLocalSearch('');
          setFilters((p) => ({ ...p, search: undefined }));
        },
      });
    }
    if (filters.lifecycle?.length) {
      chips.push({
        key: 'lifecycle',
        label: 'Lifecycle',
        value: filters.lifecycle.join(', '),
        onRemove: () => {
          onClearKpi();
          setFilters((p) => ({ ...p, lifecycle: undefined }));
        },
      });
    }
    if (filters.site && filters.site !== defaultSite) {
      chips.push({
        key: 'site',
        label: 'Site',
        value: filters.site === 'ALL' ? 'All sites' : filters.site,
        onRemove: () => setFilters((p) => ({ ...p, site: defaultSite })),
      });
    }
    if (filters.locationFilter && filters.locationFilter !== 'all') {
      chips.push({
        key: 'locationFilter',
        label: 'Location',
        value: filters.locationFilter === 'missing_location' ? 'Missing location' : 'Has location',
        onRemove: () => {
          onClearKpi();
          setFilters((p) => ({ ...p, locationFilter: 'all' }));
        },
      });
    }
    if (filters.protection?.length) {
      chips.push({
        key: 'protection',
        label: 'Protection',
        value: filters.protection.map((v) => (v === '__NONE__' ? 'No protection recorded' : v)).join(', '),
        onRemove: () => setFilters((p) => ({ ...p, protection: undefined })),
      });
    }
    if (filters.linkedDevice && filters.linkedDevice !== 'all') {
      chips.push({
        key: 'linkedDevice',
        label: 'Linked device',
        value: filters.linkedDevice === 'with' ? 'With device' : 'Without device',
        onRemove: () => {
          onClearKpi();
          setFilters((p) => ({ ...p, linkedDevice: 'all' }));
        },
      });
    }
    if (filters.withEvents30d) {
      chips.push({
        key: 'withEvents30d',
        label: 'Events',
        value: 'Last 30 days',
        onRemove: () => {
          onClearKpi();
          setFilters((p) => ({ ...p, withEvents30d: false }));
        },
      });
    }
    if (filters.updatedRange && filters.updatedRange !== 'all') {
      const map: Record<string, string> = {
        '24h': 'Last 24h',
        '7d': 'Last 7d',
        '30d': 'Last 30d',
      };
      chips.push({
        key: 'updatedRange',
        label: 'Updated',
        value: map[filters.updatedRange] || filters.updatedRange,
        onRemove: () => setFilters((p) => ({ ...p, updatedRange: 'all' })),
      });
    }
    if (hasTestFlag && filters.hideTestRecords) {
      chips.push({
        key: 'hideTestRecords',
        label: 'Filter',
        value: 'Hide test records',
        onRemove: () => setFilters((p) => ({ ...p, hideTestRecords: false })),
      });
    }

    return chips;
  }, [filters, defaultSite, hasTestFlag, onClearKpi, setFilters]);

  const activeFilterCount = activeChips.length;
  const currentSortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label || 'Identifier';
  const siteLabel =
    !filters.site || filters.site === 'ALL' ? 'All sites' : filters.site;

  return (
    <div className="flex flex-col gap-3 mb-4 select-none">
      {/* Row 1: Active / Deleted Status Tabs on left, Table / Map View Switcher + Search + Views on right */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Tabs matching Events & Cases */}
          <div
            role="tablist"
            aria-label="Pole status views"
            className="flex items-center gap-1 p-0.5 rounded-lg border border-border bg-muted/40 shrink-0"
          >
            <button
              type="button"
              role="tab"
              aria-selected={filters.statusTab === 'active'}
              onClick={() => {
                if (activeKpi === 'deleted') onClearKpi();
                setFilters((prev) => ({ ...prev, statusTab: 'active' }));
              }}
              className={cn(
                'flex items-center rounded-md font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
                isTablet ? 'h-[44px] px-3.5 text-sm gap-2' : 'h-8 px-3 text-xs gap-1.5',
                filters.statusTab === 'active'
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              <span>Active</span>
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-mono',
                  filters.statusTab === 'active'
                    ? 'bg-primary/15 text-primary font-bold'
                    : 'text-muted-foreground bg-muted'
                )}
              >
                {statusCounts.active}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={filters.statusTab === 'deleted'}
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  statusTab: 'deleted',
                  viewMode: 'table',
                }));
              }}
              className={cn(
                'flex items-center rounded-md font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
                isTablet ? 'h-[44px] px-3.5 text-sm gap-2' : 'h-8 px-3 text-xs gap-1.5',
                filters.statusTab === 'deleted'
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              <span>Deleted</span>
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-mono',
                  filters.statusTab === 'deleted'
                    ? 'bg-primary/15 text-primary font-bold'
                    : 'text-muted-foreground bg-muted'
                )}
              >
                {statusCounts.deleted}
              </span>
            </button>
          </div>

          {/* View Switcher: Table (default) vs Map (hidden in Deleted view) */}
          {filters.statusTab === 'active' && (
            <div
              role="tablist"
              aria-label="Display mode"
              className="flex items-center gap-1 p-0.5 rounded-lg border border-border bg-muted/40 shrink-0"
            >
              <button
                type="button"
                role="tab"
                aria-selected={filters.viewMode === 'table'}
                onClick={() => setFilters((prev) => ({ ...prev, viewMode: 'table' }))}
                className={cn(
                  'flex items-center gap-1.5 rounded-md font-medium transition-colors cursor-pointer',
                  isTablet ? 'h-[44px] px-3 text-sm' : 'h-8 px-2.5 text-xs',
                  filters.viewMode === 'table'
                    ? 'bg-card text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <TableIcon className="size-3.5" />
                <span>Table</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={filters.viewMode === 'map'}
                onClick={() => setFilters((prev) => ({ ...prev, viewMode: 'map' }))}
                className={cn(
                  'flex items-center gap-1.5 rounded-md font-medium transition-colors cursor-pointer',
                  isTablet ? 'h-[44px] px-3 text-sm' : 'h-8 px-2.5 text-xs',
                  filters.viewMode === 'map'
                    ? 'bg-card text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <MapIcon className="size-3.5" />
                <span>Map</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Controls: Search + Mobile Filters + Views + Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Input */}
          <div className={cn('relative flex-1 sm:flex-initial', isTablet ? 'sm:w-64' : 'sm:w-64 lg:w-72')}>
            <Search
              className={cn(
                'absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none',
                isTablet ? 'size-4' : 'size-3.5'
              )}
            />
            <input
              ref={searchInputRef}
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search identifier or name"
              aria-label="Search identifier or name"
              className={cn(
                'w-full pr-7 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs transition-colors',
                isTablet ? 'h-[44px] pl-9 text-sm' : 'h-8 pl-8 text-xs'
              )}
            />
            {localSearch ? (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  setFilters((prev) => ({ ...prev, search: undefined }));
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 size-5 text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            ) : (
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1 text-[10px] font-mono rounded bg-muted text-muted-foreground border border-border pointer-events-none">
                /
              </kbd>
            )}
          </div>

          {/* Mobile / Tablet Portrait Filters Sheet Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFilterSheetOpen(true)}
            className={cn(
              'gap-1.5 border-border bg-card hover:bg-muted font-medium cursor-pointer',
              isPortrait ? 'flex' : 'md:hidden',
              isTablet ? 'h-[44px] px-3.5 text-sm' : 'h-8 px-2.5 text-xs',
              activeFilterCount > 0 && 'border-primary/50 text-primary bg-primary/5'
            )}
          >
            <Filter className="size-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="size-4.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Saved Views Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'gap-1.5 border-border bg-card hover:bg-muted font-medium cursor-pointer',
                    isTablet ? 'h-[44px] px-3 text-sm' : 'h-8 px-2.5 text-xs'
                  )}
                >
                  <Bookmark className="size-3.5 text-muted-foreground" />
                  <span>Views</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-64 bg-popover border border-border text-xs z-50">
              <DropdownMenuLabel className="text-xs font-semibold px-2 py-1">
                Saved Views
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="flex flex-col gap-0.5 p-1">
                {savedViews.map((sv) => (
                  <div
                    key={sv.id}
                    className="flex items-center justify-between px-2 py-1.5 hover:bg-muted/60 rounded cursor-pointer group"
                    onClick={() => {
                      if (editingViewId !== sv.id) handleApplySavedView(sv);
                    }}
                  >
                    {editingViewId === sv.id ? (
                      <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingViewName}
                          onChange={(e) => setEditingViewName(e.target.value)}
                          className="h-6 px-1.5 text-xs bg-card border border-border rounded flex-1 outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              renameSavedView(sv.id, editingViewName);
                              setEditingViewId(null);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-1.5 text-[10px]"
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
                        <div className="flex items-center gap-1.5 min-w-0">
                          {sv.isDefault && <Star className="size-3 text-amber-500 fill-amber-500 shrink-0" />}
                          <span className="truncate font-medium text-foreground">{sv.name}</span>
                        </div>
                        <div
                          className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setDefaultView(sv.id)}
                            className="p-1 hover:text-amber-500 text-muted-foreground"
                            title="Set as default view"
                          >
                            <Star className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
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
                            onClick={() => deleteSavedView(sv.id)}
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
              <div className="p-1">
                <Popover open={saveViewOpen} onOpenChange={setSaveViewOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-7 text-xs justify-start gap-1.5 text-primary"
                      >
                        <Plus className="size-3" />
                        <span>Save current view</span>
                      </Button>
                    }
                  />
                  <PopoverContent align="end" className="w-64 p-3 bg-popover border border-border shadow-xl z-50 text-xs">
                    <div className="font-semibold text-foreground mb-2">Save current view</div>
                    <input
                      type="text"
                      placeholder="e.g. TPG Missing Location"
                      value={saveViewName}
                      onChange={(e) => setSaveViewName(e.target.value)}
                      className="w-full h-8 px-2 text-xs border border-border rounded mb-3 bg-card text-foreground"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSaveViewOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={!saveViewName.trim()}
                        onClick={() => {
                          saveView(saveViewName.trim(), {
                            ...filters,
                            sortKey,
                            sortDir,
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

          {/* Sort Select */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'gap-1.5 border-border bg-card hover:bg-muted font-medium cursor-pointer',
                    isTablet ? 'h-[44px] px-3 text-sm' : 'h-8 px-2.5 text-xs'
                  )}
                >
                  <ArrowUpDown className="size-3.5 text-muted-foreground" />
                  <span>Sort: {currentSortLabel}</span>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">
                    ({sortDir})
                  </span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-52 bg-popover border border-border text-xs z-50">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Sort Poles By
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {SORT_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.key}
                  onClick={() => {
                    if (sortKey === opt.key) {
                      onSortChange(opt.key, sortDir === 'asc' ? 'desc' : 'asc');
                    } else {
                      onSortChange(opt.key, opt.key === 'identifier' ? 'asc' : 'desc');
                    }
                  }}
                  className="flex items-center justify-between cursor-pointer text-xs"
                >
                  <span>{opt.label}</span>
                  {sortKey === opt.key && (
                    <span className="text-primary font-mono text-[10px] font-bold uppercase">
                      {sortDir}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Row 2: Desktop Filter Chips with Popovers + Results text */}
      <div
        className={cn(
          isPortrait ? 'hidden' : 'hidden md:flex',
          'items-center justify-between gap-2 text-xs'
        )}
      >
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-wrap">
          <span className="text-muted-foreground flex items-center gap-1 shrink-0 font-medium mr-0.5">
            <Filter className="size-3" />
            <span>Filter:</span>
          </span>

          {/* 1. Lifecycle Status Popover */}
          {filters.statusTab === 'active' && (
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className={cn(
                      'rounded-full border font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
                      isTablet ? 'h-[44px] px-3.5 text-sm' : 'h-7 px-2.5 text-xs',
                      filters.lifecycle?.length
                        ? 'bg-primary/10 border-primary text-primary font-semibold'
                        : 'bg-card border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span>
                      Lifecycle{filters.lifecycle?.length ? `: ${filters.lifecycle.join(', ')}` : ''}
                    </span>
                    <ChevronDown className="size-3 opacity-60" />
                  </button>
                }
              />
              <PopoverContent className="w-52 p-2 bg-popover border border-border shadow-lg z-50 text-xs">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border font-semibold">
                  <span>Lifecycle status</span>
                  {filters.lifecycle?.length && (
                    <button
                      type="button"
                      onClick={() => setFilters((p) => ({ ...p, lifecycle: undefined }))}
                      className="text-[10px] text-primary hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {LIFECYCLE_OPTIONS.map((lc) => {
                    const checked = filters.lifecycle?.includes(lc) || false;
                    return (
                      <button
                        key={lc}
                        type="button"
                        onClick={() => toggleLifecycle(lc)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-left"
                      >
                        <Checkbox checked={checked} className="size-3.5 pointer-events-none" />
                        <span>{lc}</span>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* 2. Site Popover (defaults to header site, with All sites option) */}
          <Popover>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  className={cn(
                    'rounded-full border font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
                    isTablet ? 'h-[44px] px-3.5 text-sm' : 'h-7 px-2.5 text-xs',
                    filters.site && filters.site !== 'ALL'
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>Site: {siteLabel}</span>
                  <ChevronDown className="size-3 opacity-60" />
                </button>
              }
            />
            <PopoverContent className="w-60 p-2 bg-popover border border-border shadow-lg z-50 text-xs">
              <div className="pb-1.5 mb-1.5 border-b border-border font-semibold">
                Filter by Site
              </div>
              <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setFilters((p) => ({ ...p, site: 'ALL' }))}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-left"
                >
                  <span>All sites</span>
                  {filters.site === 'ALL' && <Check className="size-3.5 text-primary" />}
                </button>
                {sites.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFilters((p) => ({ ...p, site: s.name }))}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-left"
                  >
                    <span className="truncate">{s.name}</span>
                    {filters.site === s.name && <Check className="size-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* 3. Location Popover (Has location / Missing location) */}
          <Popover>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  className={cn(
                    'rounded-full border font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
                    isTablet ? 'h-[44px] px-3.5 text-sm' : 'h-7 px-2.5 text-xs',
                    filters.locationFilter && filters.locationFilter !== 'all'
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>
                    Location
                    {filters.locationFilter === 'has_location'
                      ? ': Has location'
                      : filters.locationFilter === 'missing_location'
                      ? ': Missing location'
                      : ''}
                  </span>
                  <ChevronDown className="size-3 opacity-60" />
                </button>
              }
            />
            <PopoverContent className="w-48 p-2 bg-popover border border-border shadow-lg z-50 text-xs">
              <div className="pb-1.5 mb-1.5 border-b border-border font-semibold">Location</div>
              {[
                { key: 'all' as const, label: 'All poles' },
                { key: 'has_location' as const, label: 'Has location' },
                { key: 'missing_location' as const, label: 'Missing location' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    onClearKpi();
                    setFilters((p) => ({ ...p, locationFilter: opt.key }));
                  }}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-left"
                >
                  <span>{opt.label}</span>
                  {(filters.locationFilter || 'all') === opt.key && (
                    <Check className="size-3.5 text-primary" />
                  )}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* 4. Protection Popover (values from data) */}
          <Popover>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  className={cn(
                    'rounded-full border font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
                    isTablet ? 'h-[44px] px-3.5 text-sm' : 'h-7 px-2.5 text-xs',
                    filters.protection?.length
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>
                    Protection
                    {filters.protection?.length ? ` (${filters.protection.length})` : ''}
                  </span>
                  <ChevronDown className="size-3 opacity-60" />
                </button>
              }
            />
            <PopoverContent className="w-56 p-2 bg-popover border border-border shadow-lg z-50 text-xs">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border font-semibold">
                <span>Protection</span>
                {filters.protection?.length && (
                  <button
                    type="button"
                    onClick={() => setFilters((p) => ({ ...p, protection: undefined }))}
                    className="text-[10px] text-primary hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
                {availableProtections.map((prot) => {
                  const checked = filters.protection?.includes(prot) || false;
                  return (
                    <button
                      key={prot}
                      type="button"
                      onClick={() => toggleProtection(prot)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-left"
                    >
                      <Checkbox checked={checked} className="size-3.5 pointer-events-none" />
                      <span className="truncate">{prot}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => toggleProtection('__NONE__')}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-left text-muted-foreground"
                >
                  <Checkbox
                    checked={filters.protection?.includes('__NONE__') || false}
                    className="size-3.5 pointer-events-none"
                  />
                  <span>No protection recorded</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {/* 5. Linked device Popover */}
          <Popover>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  className={cn(
                    'rounded-full border font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
                    isTablet ? 'h-[44px] px-3.5 text-sm' : 'h-7 px-2.5 text-xs',
                    filters.linkedDevice && filters.linkedDevice !== 'all'
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>
                    Linked device
                    {filters.linkedDevice === 'with'
                      ? ': With'
                      : filters.linkedDevice === 'without'
                      ? ': Without'
                      : ''}
                  </span>
                  <ChevronDown className="size-3 opacity-60" />
                </button>
              }
            />
            <PopoverContent className="w-48 p-2 bg-popover border border-border shadow-lg z-50 text-xs">
              <div className="pb-1.5 mb-1.5 border-b border-border font-semibold">Linked device</div>
              {[
                { key: 'all' as const, label: 'All poles' },
                { key: 'with' as const, label: 'With linked device' },
                { key: 'without' as const, label: 'Without linked device' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    onClearKpi();
                    setFilters((p) => ({ ...p, linkedDevice: opt.key }));
                  }}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-left"
                >
                  <span>{opt.label}</span>
                  {(filters.linkedDevice || 'all') === opt.key && (
                    <Check className="size-3.5 text-primary" />
                  )}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* 6. Updated Popover */}
          <Popover>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  className={cn(
                    'rounded-full border font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
                    isTablet ? 'h-[44px] px-3.5 text-sm' : 'h-7 px-2.5 text-xs',
                    filters.updatedRange && filters.updatedRange !== 'all'
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>
                    Updated
                    {filters.updatedRange && filters.updatedRange !== 'all'
                      ? `: ${filters.updatedRange}`
                      : ''}
                  </span>
                  <ChevronDown className="size-3 opacity-60" />
                </button>
              }
            />
            <PopoverContent className="w-48 p-2 bg-popover border border-border shadow-lg z-50 text-xs">
              <div className="pb-1.5 mb-1.5 border-b border-border font-semibold">Last updated</div>
              {[
                { key: 'all' as const, label: 'All time' },
                { key: '24h' as const, label: 'Last 24 hours' },
                { key: '7d' as const, label: 'Last 7 days' },
                { key: '30d' as const, label: 'Last 30 days' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setFilters((p) => ({ ...p, updatedRange: opt.key }))}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-left"
                >
                  <span>{opt.label}</span>
                  {(filters.updatedRange || 'all') === opt.key && (
                    <Check className="size-3.5 text-primary" />
                  )}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* 7. Hide test records ONLY if data carries explicit test flag (never guessed) */}
          {hasTestFlag && (
            <label
              className={cn(
                'rounded-full border border-border bg-card flex items-center gap-2 cursor-pointer hover:bg-muted/40 transition-colors shrink-0',
                isTablet ? 'h-[44px] px-3.5' : 'h-7 px-2.5'
              )}
            >
              <Switch
                checked={!!filters.hideTestRecords}
                onCheckedChange={(checked) =>
                  setFilters((p) => ({ ...p, hideTestRecords: checked }))
                }
                className="scale-75 origin-left"
              />
              <span className="text-xs font-medium text-muted-foreground">
                Hide test records
              </span>
            </label>
          )}
        </div>

        <span className="text-xs text-muted-foreground font-mono shrink-0 tabular-nums">
          {filteredCount} {filteredCount === 1 ? 'pole' : 'poles'}
        </span>
      </div>

      {/* Row 3: Active Removable Filter Chips + Clear All */}
      {activeChips.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary font-medium"
            >
              <span className="text-muted-foreground text-[11px]">{chip.label}:</span>
              <span className="font-semibold">{chip.value}</span>
              <button
                type="button"
                onClick={chip.onRemove}
                className="ml-0.5 hover:text-foreground cursor-pointer"
                aria-label={`Remove ${chip.label} filter`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer px-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Tablet Portrait / Mobile Bottom Filter Sheet */}
      <Sheet open={mobileFilterSheetOpen} onOpenChange={setMobileFilterSheetOpen}>
        <SheetContent side="bottom" className="max-h-[82vh] rounded-t-2xl overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="text-base font-bold">Filter Poles</SheetTitle>
            <SheetDescription className="text-xs">
              Refine poles by site, lifecycle, location, protection, or linked hardware.
            </SheetDescription>
          </SheetHeader>
          <div className="p-4 space-y-4 text-xs">
            {/* Site */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground block">Site</label>
              <select
                value={filters.site || defaultSite}
                onChange={(e) => setFilters((p) => ({ ...p, site: e.target.value }))}
                className="w-full h-11 px-3 rounded-lg border border-border bg-card text-foreground text-sm"
              >
                <option value="ALL">All sites</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Lifecycle */}
            {filters.statusTab === 'active' && (
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">Lifecycle status</label>
                <div className="flex flex-wrap gap-2">
                  {LIFECYCLE_OPTIONS.map((lc) => {
                    const active = filters.lifecycle?.includes(lc);
                    return (
                      <button
                        key={lc}
                        type="button"
                        onClick={() => toggleLifecycle(lc)}
                        className={cn(
                          'min-h-[44px] px-3 rounded-lg border text-xs font-medium cursor-pointer',
                          active
                            ? 'bg-primary/15 border-primary text-primary font-semibold'
                            : 'bg-card border-border text-muted-foreground'
                        )}
                      >
                        {lc}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground block">Location</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'all' as const, label: 'All' },
                  { key: 'has_location' as const, label: 'Has location' },
                  { key: 'missing_location' as const, label: 'Missing' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setFilters((p) => ({ ...p, locationFilter: opt.key }))}
                    className={cn(
                      'min-h-[44px] px-2 rounded-lg border text-xs font-medium cursor-pointer',
                      (filters.locationFilter || 'all') === opt.key
                        ? 'bg-primary/15 border-primary text-primary font-semibold'
                        : 'bg-card border-border text-muted-foreground'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Linked Device */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground block">Linked device</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'all' as const, label: 'All' },
                  { key: 'with' as const, label: 'With device' },
                  { key: 'without' as const, label: 'Without' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setFilters((p) => ({ ...p, linkedDevice: opt.key }))}
                    className={cn(
                      'min-h-[44px] px-2 rounded-lg border text-xs font-medium cursor-pointer',
                      (filters.linkedDevice || 'all') === opt.key
                        ? 'bg-primary/15 border-primary text-primary font-semibold'
                        : 'bg-card border-border text-muted-foreground'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Updated */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground block">Last updated</label>
              <select
                value={filters.updatedRange || 'all'}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, updatedRange: e.target.value as any }))
                }
                className="w-full h-11 px-3 rounded-lg border border-border bg-card text-foreground text-sm"
              >
                <option value="all">All time</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>
          </div>
          <SheetFooter className="p-4 border-t border-border flex-row justify-between gap-2">
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="min-h-[44px] flex-1"
            >
              Clear all
            </Button>
            <Button
              onClick={() => setMobileFilterSheetOpen(false)}
              className="min-h-[44px] flex-1 bg-primary text-primary-foreground"
            >
              Apply ({filteredCount} poles)
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

