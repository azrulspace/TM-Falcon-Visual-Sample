import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
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
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiMode } from '@/hooks/useUiMode';
import { useAssets } from '@/contexts/AssetsContext';
import type {
  DeviceFilterState,
  DeviceLifecycleState,
  DeviceSavedView,
  DeviceSortDir,
  DeviceSortKey,
  DeviceStatusTab,
  DeviceTypeCategory,
} from '@/types/devices';
import type { SiteRecord } from '@/types/assets';
import type { DeviceStatusTabCounts } from '@/data/deviceSelectors';
import type { DeviceKpiKey } from './DevicesKpiStrip';
import { DEVICE_LIFECYCLE_OPTIONS, DEVICE_TYPE_OPTIONS } from '@/data/devicesRegistry';
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

export interface DevicesToolbarProps {
  filters: DeviceFilterState;
  setFilters: React.Dispatch<React.SetStateAction<DeviceFilterState>>;
  sortKey: DeviceSortKey;
  sortDir: DeviceSortDir;
  onSortChange: (key: DeviceSortKey, dir?: DeviceSortDir) => void;
  statusCounts: DeviceStatusTabCounts;
  filteredCount: number;
  totalCount: number;
  sites: SiteRecord[];
  availableManufacturers: string[];
  availableLibraries: string[];
  hasTestFlag: boolean;
  activeKpi: DeviceKpiKey | null;
  onClearKpi: () => void;
  defaultSite: string;
}

const SORT_OPTIONS: { key: DeviceSortKey; label: string }[] = [
  { key: 'identifier', label: 'Identifier' },
  { key: 'connectivityState', label: 'State (Offline first)' },
  { key: 'lastContactAt', label: 'Last contact' },
  { key: 'events30dCount', label: 'Events (30d)' },
  { key: 'installedPoleId', label: 'Installed pole' },
  { key: 'configVersion', label: 'Configuration' },
];

export const DevicesToolbar: React.FC<DevicesToolbarProps> = ({
  filters,
  setFilters,
  sortKey,
  sortDir,
  onSortChange,
  statusCounts,
  filteredCount,
  totalCount,
  sites,
  availableManufacturers,
  availableLibraries,
  hasTestFlag,
  activeKpi,
  onClearKpi,
  defaultSite,
}) => {
  const { isTablet } = useUiMode();
  const {
    deviceSavedViews,
    saveDeviceView,
    renameDeviceSavedView,
    deleteDeviceSavedView,
    setDefaultDeviceView,
  } = useAssets();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [viewsOpen, setViewsOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [editViewName, setEditViewName] = useState('');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable;
      if (e.key === '/' && !inField) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const statusTabs: { key: DeviceStatusTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: statusCounts.all },
    { key: 'online', label: 'Online', count: statusCounts.online },
    { key: 'offline', label: 'Offline', count: statusCounts.offline },
    { key: 'stale', label: 'Stale', count: statusCounts.stale },
    { key: 'not_installed', label: 'Not installed', count: statusCounts.not_installed },
  ];

  const toggleArrayFilter = <T extends string>(
    field: 'types' | 'manufacturers' | 'libraries' | 'lifecycle',
    val: T
  ) => {
    setFilters((prev) => {
      const arr = ((prev[field] as T[] | undefined) || []);
      const exists = arr.includes(val);
      return {
        ...prev,
        [field]: exists ? arr.filter((x) => x !== val) : [...arr, val],
      };
    });
  };

  const applySavedView = (view: DeviceSavedView) => {
    onClearKpi();
    setFilters((prev) => ({
      statusTab: view.filters.statusTab || 'all',
      viewMode: view.filters.viewMode || prev.viewMode,
      search: view.filters.search || '',
      types: view.filters.types || [],
      manufacturers: view.filters.manufacturers || [],
      libraries: view.filters.libraries || [],
      lifecycle: view.filters.lifecycle || [],
      site: view.filters.site ?? prev.site,
      installationFilter: view.filters.installationFilter || 'all',
      lastContactRange: view.filters.lastContactRange || 'all',
      configFilter: view.filters.configFilter || 'all',
      needsAttentionOnly: Boolean(view.filters.needsAttentionOnly),
      hideTestRecords: Boolean(view.filters.hideTestRecords),
    }));
    if (view.filters.sortKey) {
      onSortChange(view.filters.sortKey, view.filters.sortDir || 'asc');
    }
    setViewsOpen(false);
  };

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (filters.site && filters.site !== defaultSite) {
    activeChips.push({
      key: 'site',
      label: `Site: ${filters.site === 'ALL' ? 'All sites' : filters.site}`,
      onRemove: () => setFilters((p) => ({ ...p, site: defaultSite })),
    });
  }
  if (filters.types && filters.types.length > 0) {
    activeChips.push({
      key: 'types',
      label: `Type: ${filters.types.join(', ')}`,
      onRemove: () => setFilters((p) => ({ ...p, types: [] })),
    });
  }
  if (filters.manufacturers && filters.manufacturers.length > 0) {
    activeChips.push({
      key: 'manufacturers',
      label: `Vendor: ${filters.manufacturers.join(', ')}`,
      onRemove: () => setFilters((p) => ({ ...p, manufacturers: [] })),
    });
  }
  if (filters.libraries && filters.libraries.length > 0) {
    activeChips.push({
      key: 'libraries',
      label: `Library: ${filters.libraries.join(', ')}`,
      onRemove: () => setFilters((p) => ({ ...p, libraries: [] })),
    });
  }
  if (filters.installationFilter && filters.installationFilter !== 'all') {
    activeChips.push({
      key: 'installed',
      label: `Installation: ${filters.installationFilter === 'installed' ? 'Installed' : 'Not installed'}`,
      onRemove: () => {
        onClearKpi();
        setFilters((p) => ({ ...p, installationFilter: 'all' }));
      },
    });
  }
  if (filters.lastContactRange && filters.lastContactRange !== 'all') {
    const labelMap: Record<string, string> = {
      '1h': 'Last 1h',
      '24h': 'Last 24h',
      '7d': 'Last 7d',
      older_24h: 'Older than 24h',
    };
    activeChips.push({
      key: 'contact',
      label: `Last contact: ${labelMap[filters.lastContactRange]}`,
      onRemove: () => setFilters((p) => ({ ...p, lastContactRange: 'all' })),
    });
  }
  if (filters.configFilter && filters.configFilter !== 'all') {
    const labelMap: Record<string, string> = {
      applied: 'Applied',
      none: 'None',
      issues: 'Config issues',
    };
    activeChips.push({
      key: 'config',
      label: `Config: ${labelMap[filters.configFilter]}`,
      onRemove: () => setFilters((p) => ({ ...p, configFilter: 'all' })),
    });
  }
  if (filters.lifecycle && filters.lifecycle.length > 0) {
    activeChips.push({
      key: 'lifecycle',
      label: `Lifecycle: ${filters.lifecycle.join(', ')}`,
      onRemove: () => setFilters((p) => ({ ...p, lifecycle: [] })),
    });
  }
  if (filters.needsAttentionOnly) {
    activeChips.push({
      key: 'attention',
      label: 'Needs attention',
      onRemove: () => {
        onClearKpi();
        setFilters((p) => ({ ...p, needsAttentionOnly: false }));
      },
    });
  }

  const handleClearAll = () => {
    onClearKpi();
    setFilters((prev) => ({
      statusTab: 'all',
      viewMode: prev.viewMode,
      search: '',
      types: [],
      manufacturers: [],
      libraries: [],
      lifecycle: [],
      site: defaultSite,
      installationFilter: 'all',
      lastContactRange: 'all',
      configFilter: 'all',
      needsAttentionOnly: false,
      hideTestRecords: false,
    }));
  };

  return (
    <div className="space-y-2.5 mb-3 select-none">
      {/* Row 1: Search, Status Tabs, Views, Sort, View Switcher */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Search box */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={filters.search || ''}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              placeholder="Search ID, name, model, serial... (/)"
              className={cn(
                'w-full rounded-lg border border-border bg-card pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary',
                isTablet ? 'h-10 text-sm' : 'h-8'
              )}
              aria-label="Search devices"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => setFilters((p) => ({ ...p, search: '' }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Status Segmented Tabs */}
          <div
            role="tablist"
            aria-label="Device status filter tabs"
            className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5 overflow-x-auto no-scrollbar max-w-full"
          >
            {statusTabs.map((t) => {
              const active = filters.statusTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    onClearKpi();
                    setFilters((p) => ({ ...p, statusTab: t.key }));
                  }}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-all cursor-pointer',
                    isTablet ? 'h-9 text-sm px-3' : 'h-7',
                    active
                      ? 'bg-card text-foreground shadow-xs font-semibold border border-border/60'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>{t.label}</span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-full font-mono tabular-nums',
                      active ? 'bg-primary/15 text-primary font-bold' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Controls: Views, Sort, Table/Map */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewsOpen(true)}
            className={cn(
              'gap-1.5 border-border bg-card hover:bg-muted font-medium cursor-pointer',
              isTablet ? 'h-10 px-3 text-sm' : 'h-8 px-2.5 text-xs'
            )}
          >
            <Bookmark className="size-3.5 text-primary" />
            <span>Views</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'gap-1.5 border-border bg-card hover:bg-muted font-medium cursor-pointer',
                    isTablet ? 'h-10 px-3 text-sm' : 'h-8 px-2.5 text-xs'
                  )}
                >
                  <ArrowUpDown className="size-3.5 text-muted-foreground" />
                  <span>
                    Sort: {SORT_OPTIONS.find((s) => s.key === sortKey)?.label || 'Identifier'}
                  </span>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-[11px]">Sort devices by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {SORT_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.key}
                  onClick={() => onSortChange(opt.key)}
                  className="text-xs flex items-center justify-between cursor-pointer"
                >
                  <span>{opt.label}</span>
                  {sortKey === opt.key && (
                    <span className="text-[10px] font-mono text-primary font-semibold uppercase">
                      {sortDir}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setFilters((p) => ({ ...p, viewMode: 'table' }))}
              aria-pressed={filters.viewMode === 'table'}
              className={cn(
                'flex items-center gap-1 rounded-md px-2.5 text-xs font-medium cursor-pointer transition-all',
                isTablet ? 'h-9 px-3 text-sm' : 'h-7',
                filters.viewMode === 'table'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <TableIcon className="size-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setFilters((p) => ({ ...p, viewMode: 'map' }))}
              aria-pressed={filters.viewMode === 'map'}
              className={cn(
                'flex items-center gap-1 rounded-md px-2.5 text-xs font-medium cursor-pointer transition-all',
                isTablet ? 'h-9 px-3 text-sm' : 'h-7',
                filters.viewMode === 'map'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <MapIcon className="size-3.5" />
              <span>Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Faceted Filter Controls & Result Count */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Site */}
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-7 px-2.5 text-xs gap-1 border-border bg-card hover:bg-muted cursor-pointer',
                    filters.site && filters.site !== defaultSite && 'border-primary/50 text-primary'
                  )}
                >
                  <span>
                    Site:{' '}
                    {filters.site === 'ALL'
                      ? 'All sites'
                      : filters.site || defaultSite}
                  </span>
                  <ChevronDown className="size-3 opacity-70" />
                </Button>
              }
            />
            <PopoverContent align="start" className="w-56 p-1.5">
              {['ALL', 'Unassigned', ...sites.map((s) => s.name)].map((siteOption) => (
                <button
                  key={siteOption}
                  type="button"
                  onClick={() => setFilters((p) => ({ ...p, site: siteOption }))}
                  className={cn(
                    'w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer',
                    (filters.site || defaultSite) === siteOption
                      ? 'bg-primary/12 text-primary font-semibold'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  <span>{siteOption === 'ALL' ? 'All sites' : siteOption}</span>
                  {(filters.site || defaultSite) === siteOption && <Check className="size-3.5" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Type Multi-Select */}
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-7 px-2.5 text-xs gap-1 border-border bg-card hover:bg-muted cursor-pointer',
                    (filters.types?.length || 0) > 0 && 'border-primary/50 text-primary'
                  )}
                >
                  <span>Type{(filters.types?.length || 0) > 0 ? ` (${filters.types!.length})` : ''}</span>
                  <ChevronDown className="size-3 opacity-70" />
                </Button>
              }
            />
            <PopoverContent align="start" className="w-48 p-2 space-y-1.5">
              {DEVICE_TYPE_OPTIONS.map((t: DeviceTypeCategory) => (
                <label
                  key={t}
                  className="flex items-center gap-2 text-xs text-foreground cursor-pointer py-1 px-1 rounded hover:bg-muted"
                >
                  <Checkbox
                    checked={Boolean(filters.types?.includes(t))}
                    onCheckedChange={() => toggleArrayFilter('types', t)}
                  />
                  <span>{t}</span>
                </label>
              ))}
            </PopoverContent>
          </Popover>

          {/* Vendor & Library Multi-Select */}
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-7 px-2.5 text-xs gap-1 border-border bg-card hover:bg-muted cursor-pointer',
                    ((filters.manufacturers?.length || 0) > 0 || (filters.libraries?.length || 0) > 0) &&
                      'border-primary/50 text-primary'
                  )}
                >
                  <span>Vendor & library</span>
                  <ChevronDown className="size-3 opacity-70" />
                </Button>
              }
            />
            <PopoverContent align="start" className="w-56 p-2.5 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Manufacturer
              </div>
              {availableManufacturers.map((m) => (
                <label
                  key={m}
                  className="flex items-center gap-2 text-xs text-foreground cursor-pointer py-0.5"
                >
                  <Checkbox
                    checked={Boolean(filters.manufacturers?.includes(m))}
                    onCheckedChange={() => toggleArrayFilter('manufacturers', m)}
                  />
                  <span>{m}</span>
                </label>
              ))}
              <div className="border-t border-border pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Library
              </div>
              {availableLibraries.map((lib) => (
                <label
                  key={lib}
                  className="flex items-center gap-2 text-xs font-mono text-foreground cursor-pointer py-0.5"
                >
                  <Checkbox
                    checked={Boolean(filters.libraries?.includes(lib))}
                    onCheckedChange={() => toggleArrayFilter('libraries', lib)}
                  />
                  <span>{lib}</span>
                </label>
              ))}
            </PopoverContent>
          </Popover>

          {/* Last contact range */}
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-7 px-2.5 text-xs gap-1 border-border bg-card hover:bg-muted cursor-pointer',
                    filters.lastContactRange &&
                      filters.lastContactRange !== 'all' &&
                      'border-primary/50 text-primary'
                  )}
                >
                  <span>Last contact</span>
                  <ChevronDown className="size-3 opacity-70" />
                </Button>
              }
            />
            <PopoverContent align="start" className="w-48 p-1.5">
              {[
                { key: 'all', label: 'Any time' },
                { key: '1h', label: 'Within last 1 hour' },
                { key: '24h', label: 'Within last 24 hours' },
                { key: '7d', label: 'Within last 7 days' },
                { key: 'older_24h', label: 'Older than 24 hours' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() =>
                    setFilters((p) => ({
                      ...p,
                      lastContactRange: opt.key as DeviceFilterState['lastContactRange'],
                    }))
                  }
                  className={cn(
                    'w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer',
                    (filters.lastContactRange || 'all') === opt.key
                      ? 'bg-primary/12 text-primary font-semibold'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  <span>{opt.label}</span>
                  {(filters.lastContactRange || 'all') === opt.key && <Check className="size-3.5" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Configuration status */}
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-7 px-2.5 text-xs gap-1 border-border bg-card hover:bg-muted cursor-pointer',
                    filters.configFilter &&
                      filters.configFilter !== 'all' &&
                      'border-primary/50 text-primary'
                  )}
                >
                  <span>Configuration</span>
                  <ChevronDown className="size-3 opacity-70" />
                </Button>
              }
            />
            <PopoverContent align="start" className="w-48 p-1.5">
              {[
                { key: 'all', label: 'All configurations' },
                { key: 'applied', label: 'Applied' },
                { key: 'none', label: 'None pushed' },
                { key: 'issues', label: 'Failed / Partly applied' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() =>
                    setFilters((p) => ({
                      ...p,
                      configFilter: opt.key as DeviceFilterState['configFilter'],
                    }))
                  }
                  className={cn(
                    'w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer',
                    (filters.configFilter || 'all') === opt.key
                      ? 'bg-primary/12 text-primary font-semibold'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  <span>{opt.label}</span>
                  {(filters.configFilter || 'all') === opt.key && <Check className="size-3.5" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Lifecycle */}
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-7 px-2.5 text-xs gap-1 border-border bg-card hover:bg-muted cursor-pointer',
                    (filters.lifecycle?.length || 0) > 0 && 'border-primary/50 text-primary'
                  )}
                >
                  <span>
                    Lifecycle
                    {(filters.lifecycle?.length || 0) > 0 ? ` (${filters.lifecycle!.length})` : ''}
                  </span>
                  <ChevronDown className="size-3 opacity-70" />
                </Button>
              }
            />
            <PopoverContent align="start" className="w-48 p-2 space-y-1.5">
              {DEVICE_LIFECYCLE_OPTIONS.map((lc: DeviceLifecycleState) => (
                <label
                  key={lc}
                  className="flex items-center gap-2 text-xs text-foreground cursor-pointer py-1 px-1 rounded hover:bg-muted"
                >
                  <Checkbox
                    checked={Boolean(filters.lifecycle?.includes(lc))}
                    onCheckedChange={() => toggleArrayFilter('lifecycle', lc)}
                  />
                  <span>{lc}</span>
                </label>
              ))}
            </PopoverContent>
          </Popover>

          {/* Needs attention quick pill */}
          <button
            type="button"
            onClick={() =>
              setFilters((p) => ({ ...p, needsAttentionOnly: !p.needsAttentionOnly }))
            }
            aria-pressed={Boolean(filters.needsAttentionOnly)}
            className={cn(
              'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-xs font-medium cursor-pointer transition-colors',
              filters.needsAttentionOnly
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 font-semibold'
                : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted'
            )}
          >
            <AlertTriangle className="size-3" />
            <span>Needs attention</span>
          </button>

          {hasTestFlag && (
            <label className="inline-flex items-center gap-1.5 px-2 h-7 rounded-md border border-border bg-card text-xs text-muted-foreground cursor-pointer">
              <Switch
                checked={Boolean(filters.hideTestRecords)}
                onCheckedChange={(v) => setFilters((p) => ({ ...p, hideTestRecords: v }))}
              />
              <span>Hide test</span>
            </label>
          )}
        </div>

        {/* Result count */}
        <div className="text-xs text-muted-foreground font-medium whitespace-nowrap">
          {activeKpi ? 'Filtered: ' : ''}
          <span className="font-mono font-semibold text-foreground">{filteredCount}</span> of{' '}
          <span className="font-mono">{totalCount}</span> devices
        </div>
      </div>

      {/* Active Filter Chips */}
      {(activeChips.length > 0 || filters.search || filters.statusTab !== 'all') && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/25"
            >
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={chip.onRemove}
                className="hover:text-foreground cursor-pointer"
                aria-label={`Remove ${chip.label}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[11px] text-muted-foreground hover:text-foreground underline ml-1 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Saved Views Sheet */}
      <Sheet open={viewsOpen} onOpenChange={setViewsOpen}>
        <SheetContent className="sm:max-w-md bg-card text-card-foreground border-border">
          <SheetHeader>
            <SheetTitle>Device saved views</SheetTitle>
            <SheetDescription>
              Switch, save, or set a default device list preset.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              {deviceSavedViews.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
                >
                  {editingViewId === v.id ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        value={editViewName}
                        onChange={(e) => setEditViewName(e.target.value)}
                        className="flex-1 h-7 rounded border border-border bg-background px-2 text-xs"
                      />
                      <Button
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          renameDeviceSavedView(v.id, editViewName);
                          setEditingViewId(null);
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => applySavedView(v)}
                        className="flex-1 text-left text-xs font-semibold text-foreground hover:text-primary cursor-pointer flex items-center gap-2"
                      >
                        <span>{v.name}</span>
                        {v.isDefault && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/15 text-primary font-medium">
                            Default
                          </span>
                        )}
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDefaultDeviceView(v.id)}
                          title="Set as default view"
                          className="p-1 text-muted-foreground hover:text-amber-500 cursor-pointer"
                        >
                          <Star
                            className={cn(
                              'size-3.5',
                              v.isDefault && 'fill-amber-500 text-amber-500'
                            )}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingViewId(v.id);
                            setEditViewName(v.name);
                          }}
                          title="Rename view"
                          className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteDeviceSavedView(v.id)}
                          title="Delete view"
                          className="p-1 text-muted-foreground hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-3 space-y-2">
              <label className="text-xs font-medium text-foreground block">
                Save current filter & sort as new view
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  placeholder="e.g. Offline cameras"
                  className="flex-1 h-8 rounded-md border border-border bg-background px-2.5 text-xs"
                />
                <Button
                  size="sm"
                  disabled={!newViewName.trim()}
                  onClick={() => {
                    saveDeviceView(newViewName, { ...filters, sortKey, sortDir });
                    setNewViewName('');
                  }}
                  className="h-8 gap-1 bg-primary text-primary-foreground cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Save view</span>
                </Button>
              </div>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" size="sm" onClick={() => setViewsOpen(false)}>
              Done
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

