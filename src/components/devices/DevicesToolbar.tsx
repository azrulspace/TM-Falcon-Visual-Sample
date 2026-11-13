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
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiMode } from '@/hooks/useUiMode';
import { useDevices } from '@/contexts/DevicesContext';
import { useAssets } from '@/contexts/AssetsContext';
import type {
  DeviceFilterState,
  DeviceHardwareType,
  DeviceSortKey,
  DeviceSortDir,
} from '@/types/devices';
import type { DeviceStatusTabCounts } from '@/data/deviceSelectors';
import type { DeviceKpiKey } from './DevicesKpiStrip';
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
  activeKpi: DeviceKpiKey | null;
  onClearKpi: () => void;
  defaultSite: string;
}

const HARDWARE_TYPES: DeviceHardwareType[] = [
  'Camera',
  'Speaker',
  'Sensor',
  'Gateway',
  'LiDAR sensor',
];

const VENDORS = ['Hikvision', 'Sample vendor'];
const LIBRARIES = ['HIK_OpenAPI', 'Standard_RTSP', 'MQTT_IoT'];

const SORT_OPTIONS: { key: DeviceSortKey; label: string }[] = [
  { key: 'identifier', label: 'Identifier' },
  { key: 'state', label: 'State' },
  { key: 'lastContact', label: 'Last contact' },
  { key: 'events', label: 'Events' },
  { key: 'type', label: 'Type' },
  { key: 'installedOn', label: 'Installed on' },
];

export const DevicesToolbar: React.FC<DevicesToolbarProps> = ({
  filters,
  setFilters,
  sortKey,
  sortDir,
  onSortChange,
  statusCounts,
  filteredCount,
  activeKpi,
  onClearKpi,
  defaultSite,
}) => {
  const { isTablet, orientation } = useUiMode();
  const isPortrait = isTablet && orientation === 'portrait';
  const { savedViews, saveView } = useDevices();
  const { sites } = useAssets();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [mobileFilterSheetOpen, setMobileFilterSheetOpen] = useState(false);
  const [saveViewOpen, setSaveViewOpen] = useState(false);
  const [saveViewName, setSaveViewName] = useState('');

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

  // '/' key shortcut focuses search
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
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const countActiveFilters = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.site && filters.site !== defaultSite && filters.site !== 'ALL') count++;
    if (filters.type && filters.type.length > 0) count += filters.type.length;
    if (filters.vendor && filters.vendor.length > 0) count += filters.vendor.length;
    if (filters.library && filters.library.length > 0) count += filters.library.length;
    if (filters.installation && filters.installation !== 'all') count++;
    if (filters.lastContactRange && filters.lastContactRange !== 'all') count++;
    if (filters.configStatus && filters.configStatus !== 'all') count++;
    return count;
  }, [filters, defaultSite]);

  const handleClearAllFilters = () => {
    setFilters({
      statusTab: filters.statusTab,
      viewMode: filters.viewMode,
      site: defaultSite,
    });
    setLocalSearch('');
    onClearKpi();
  };

  return (
    <div className="flex flex-col gap-3 mb-4 select-none">
      {/* Row 1: Status Tabs (Connectivity state) & View Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
        {/* Status Tabs with Counts */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar -mb-[13px]">
          {(
            [
              { key: 'all', label: 'All', count: statusCounts.all },
              { key: 'online', label: 'Online', count: statusCounts.online },
              { key: 'offline', label: 'Offline', count: statusCounts.offline },
              { key: 'stale', label: 'Stale', count: statusCounts.stale },
            ] as const
          ).map((tab) => {
            const isActive = filters.statusTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setFilters((prev) => ({ ...prev, statusTab: tab.key }));
                  onClearKpi();
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
                  isTablet && 'py-2.5 px-3.5 text-sm min-h-[44px]',
                  isActive
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-mono',
                    isActive
                      ? 'bg-primary/15 text-primary font-bold'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Switch: Table / Map */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, viewMode: 'table' }))}
              aria-pressed={filters.viewMode === 'table'}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer',
                isTablet && 'h-9 px-3 text-sm min-w-[44px] justify-center',
                filters.viewMode === 'table'
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Table view"
            >
              <TableIcon className="size-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, viewMode: 'map' }))}
              aria-pressed={filters.viewMode === 'map'}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer',
                isTablet && 'h-9 px-3 text-sm min-w-[44px] justify-center',
                filters.viewMode === 'map'
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Map view"
            >
              <MapIcon className="size-3.5" />
              <span>Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Search, Filter Popovers, Results count, Sort, Saved Views */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[260px] flex-wrap">
          {/* Search box with / shortcut */}
          <div className="relative min-w-[200px] max-w-[280px] flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search identifier, name, model, serial..."
              className={cn(
                'w-full pl-8 pr-7 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs',
                isTablet ? 'h-11 text-sm' : 'h-8 text-xs'
              )}
            />
            {localSearch ? (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  setFilters((prev) => ({ ...prev, search: undefined }));
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="size-3" />
              </button>
            ) : (
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground/80 bg-muted border border-border/80 rounded pointer-events-none">
                /
              </kbd>
            )}
          </div>

          {/* Desktop Filter Popovers */}
          {!isPortrait && (
            <>
              {/* Type Filter */}
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        'gap-1.5 text-xs h-8 border-border bg-card',
                        filters.type && filters.type.length > 0 && 'border-primary/50 bg-primary/5 font-semibold text-primary'
                      )}
                    >
                      <span>Type</span>
                      {filters.type && filters.type.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/20 text-primary font-mono">
                          {filters.type.length}
                        </span>
                      )}
                      <ChevronDown className="size-3 text-muted-foreground" />
                    </Button>
                  }
                />
                <PopoverContent align="start" className="w-48 p-2">
                  <div className="space-y-1">
                    {HARDWARE_TYPES.map((type) => {
                      const checked = !!filters.type?.includes(type);
                      return (
                        <label
                          key={type}
                          className="flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-muted cursor-pointer"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => {
                              const cur = filters.type || [];
                              const next = c
                                ? [...cur, type]
                                : cur.filter((t) => t !== type);
                              setFilters((prev) => ({
                                ...prev,
                                type: next.length > 0 ? next : undefined,
                              }));
                            }}
                          />
                          <span>{type}</span>
                        </label>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Vendor Filter */}
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        'gap-1.5 text-xs h-8 border-border bg-card',
                        filters.vendor && filters.vendor.length > 0 && 'border-primary/50 bg-primary/5 font-semibold text-primary'
                      )}
                    >
                      <span>Vendor</span>
                      {filters.vendor && filters.vendor.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/20 text-primary font-mono">
                          {filters.vendor.length}
                        </span>
                      )}
                      <ChevronDown className="size-3 text-muted-foreground" />
                    </Button>
                  }
                />
                <PopoverContent align="start" className="w-48 p-2">
                  <div className="space-y-1">
                    {VENDORS.map((v) => {
                      const checked = !!filters.vendor?.includes(v);
                      return (
                        <label
                          key={v}
                          className="flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-muted cursor-pointer"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => {
                              const cur = filters.vendor || [];
                              const next = c ? [...cur, v] : cur.filter((x) => x !== v);
                              setFilters((prev) => ({
                                ...prev,
                                vendor: next.length > 0 ? next : undefined,
                              }));
                            }}
                          />
                          <span>{v}</span>
                        </label>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Library Filter */}
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        'gap-1.5 text-xs h-8 border-border bg-card',
                        filters.library && filters.library.length > 0 && 'border-primary/50 bg-primary/5 font-semibold text-primary'
                      )}
                    >
                      <span>Library</span>
                      {filters.library && filters.library.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/20 text-primary font-mono">
                          {filters.library.length}
                        </span>
                      )}
                      <ChevronDown className="size-3 text-muted-foreground" />
                    </Button>
                  }
                />
                <PopoverContent align="start" className="w-48 p-2">
                  <div className="space-y-1">
                    {LIBRARIES.map((lib) => {
                      const checked = !!filters.library?.includes(lib);
                      return (
                        <label
                          key={lib}
                          className="flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-muted cursor-pointer"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => {
                              const cur = filters.library || [];
                              const next = c ? [...cur, lib] : cur.filter((x) => x !== lib);
                              setFilters((prev) => ({
                                ...prev,
                                library: next.length > 0 ? next : undefined,
                              }));
                            }}
                          />
                          <span>{lib}</span>
                        </label>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Site Filter */}
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        'gap-1.5 text-xs h-8 border-border bg-card',
                        filters.site && filters.site !== defaultSite && filters.site !== 'ALL' && 'border-primary/50 bg-primary/5 font-semibold text-primary'
                      )}
                    >
                      <span>Site</span>
                      {filters.site && filters.site !== 'ALL' && (
                        <span className="text-[11px] font-mono font-medium text-muted-foreground truncate max-w-[100px]">
                          {filters.site}
                        </span>
                      )}
                      <ChevronDown className="size-3 text-muted-foreground" />
                    </Button>
                  }
                />
                <PopoverContent align="start" className="w-56 p-2">
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, site: 'ALL' }))}
                      className={cn(
                        'w-full text-left px-2 py-1.5 text-xs rounded flex items-center justify-between hover:bg-muted cursor-pointer',
                        filters.site === 'ALL' && 'font-bold text-primary bg-primary/10'
                      )}
                    >
                      <span>All sites</span>
                      {filters.site === 'ALL' && <Check className="size-3" />}
                    </button>
                    {sites.map((s) => {
                      const isSelected = filters.site === s.name;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setFilters((prev) => ({ ...prev, site: s.name }))}
                          className={cn(
                            'w-full text-left px-2 py-1.5 text-xs rounded flex items-center justify-between hover:bg-muted cursor-pointer',
                            isSelected && 'font-bold text-primary bg-primary/10'
                          )}
                        >
                          <span className="truncate">{s.name}</span>
                          {isSelected && <Check className="size-3" />}
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Installation Filter (Installed vs Not installed) */}
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        'gap-1.5 text-xs h-8 border-border bg-card',
                        filters.installation && filters.installation !== 'all' && 'border-primary/50 bg-primary/5 font-semibold text-primary'
                      )}
                    >
                      <span>Installation</span>
                      {filters.installation && filters.installation !== 'all' && (
                        <span className="text-[11px] font-medium text-primary">
                          {filters.installation === 'installed' ? 'Installed' : 'Not installed'}
                        </span>
                      )}
                      <ChevronDown className="size-3 text-muted-foreground" />
                    </Button>
                  }
                />
                <PopoverContent align="start" className="w-48 p-2">
                  <div className="space-y-1">
                    {(
                      [
                        { id: 'all', label: 'All' },
                        { id: 'installed', label: 'Installed on pole' },
                        { id: 'not_installed', label: 'Not installed' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, installation: opt.id }))
                        }
                        className={cn(
                          'w-full text-left px-2 py-1.5 text-xs rounded flex items-center justify-between hover:bg-muted cursor-pointer',
                          (filters.installation || 'all') === opt.id && 'font-bold text-primary bg-primary/10'
                        )}
                      >
                        <span>{opt.label}</span>
                        {(filters.installation || 'all') === opt.id && (
                          <Check className="size-3" />
                        )}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Last Contact Filter */}
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        'gap-1.5 text-xs h-8 border-border bg-card',
                        filters.lastContactRange && filters.lastContactRange !== 'all' && 'border-primary/50 bg-primary/5 font-semibold text-primary'
                      )}
                    >
                      <span>Last contact</span>
                      {filters.lastContactRange && filters.lastContactRange !== 'all' && (
                        <span className="text-[11px] font-medium text-primary">
                          {filters.lastContactRange}
                        </span>
                      )}
                      <ChevronDown className="size-3 text-muted-foreground" />
                    </Button>
                  }
                />
                <PopoverContent align="start" className="w-52 p-2">
                  <div className="space-y-1">
                    {(
                      [
                        { id: 'all', label: 'All times' },
                        { id: '1h', label: 'Within 1 hour' },
                        { id: '24h', label: 'Within 24 hours' },
                        { id: 'older_24h', label: 'Older than 24 hours' },
                        { id: 'never', label: 'Never reported' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, lastContactRange: opt.id }))
                        }
                        className={cn(
                          'w-full text-left px-2 py-1.5 text-xs rounded flex items-center justify-between hover:bg-muted cursor-pointer',
                          (filters.lastContactRange || 'all') === opt.id && 'font-bold text-primary bg-primary/10'
                        )}
                      >
                        <span>{opt.label}</span>
                        {(filters.lastContactRange || 'all') === opt.id && (
                          <Check className="size-3" />
                        )}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Configuration Filter */}
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        'gap-1.5 text-xs h-8 border-border bg-card',
                        filters.configStatus && filters.configStatus !== 'all' && 'border-primary/50 bg-primary/5 font-semibold text-primary'
                      )}
                    >
                      <span>Config</span>
                      {filters.configStatus && filters.configStatus !== 'all' && (
                        <span className="text-[11px] font-medium text-primary capitalize">
                          {filters.configStatus}
                        </span>
                      )}
                      <ChevronDown className="size-3 text-muted-foreground" />
                    </Button>
                  }
                />
                <PopoverContent align="start" className="w-48 p-2">
                  <div className="space-y-1">
                    {(
                      [
                        { id: 'all', label: 'All' },
                        { id: 'applied', label: 'Applied' },
                        { id: 'pending', label: 'Pending sync' },
                        { id: 'failed', label: 'Failed' },
                        { id: 'none', label: 'None (unconfigured)' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, configStatus: opt.id }))
                        }
                        className={cn(
                          'w-full text-left px-2 py-1.5 text-xs rounded flex items-center justify-between hover:bg-muted cursor-pointer',
                          (filters.configStatus || 'all') === opt.id && 'font-bold text-primary bg-primary/10'
                        )}
                      >
                        <span>{opt.label}</span>
                        {(filters.configStatus || 'all') === opt.id && (
                          <Check className="size-3" />
                        )}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}

          {/* Tablet Filter Button */}
          {isPortrait && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileFilterSheetOpen(true)}
              className={cn(
                'gap-1.5 h-11 px-4 text-sm font-medium border-border bg-card relative cursor-pointer',
                countActiveFilters > 0 && 'border-primary/50 text-primary font-semibold'
              )}
            >
              <Filter className="size-4" />
              <span>Filters</span>
              {countActiveFilters > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-xs font-mono font-bold bg-primary text-primary-foreground">
                  {countActiveFilters}
                </span>
              )}
            </Button>
          )}
        </div>

        {/* Right Side: Results text, Sort select, Views dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
            <span className="text-foreground font-semibold">{filteredCount}</span> devices
          </span>

          {/* Sort Select */}
          <div className="flex items-center rounded-lg border border-border bg-card h-8">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 h-full text-xs text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none',
                      isTablet && 'h-11 px-3 text-sm'
                    )}
                  >
                    <ArrowUpDown className="size-3" />
                    <span className="font-medium text-foreground">
                      {SORT_OPTIONS.find((s) => s.key === sortKey)?.label}
                    </span>
                    <ChevronDown className="size-3 opacity-60" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                  Sort devices by
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SORT_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.key}
                    onClick={() => onSortChange(opt.key)}
                    className="flex items-center justify-between text-xs cursor-pointer"
                  >
                    <span>{opt.label}</span>
                    {sortKey === opt.key && <Check className="size-3 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              onClick={() => onSortChange(sortKey, sortDir === 'asc' ? 'desc' : 'asc')}
              title={`Sort direction: ${sortDir.toUpperCase()}`}
              className={cn(
                'px-2 border-l border-border h-full flex items-center text-xs font-mono text-muted-foreground hover:text-foreground cursor-pointer',
                isTablet && 'h-11 px-3 text-sm'
              )}
            >
              {sortDir.toUpperCase()}
            </button>
          </div>

          {/* Views Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'gap-1.5 border-border bg-card font-medium cursor-pointer',
                    isTablet ? 'h-11 px-3 text-sm' : 'h-8 px-2.5 text-xs'
                  )}
                  title="Saved view presets"
                >
                  <Bookmark className="size-3 text-muted-foreground" />
                  <span className="hidden sm:inline">Views</span>
                  <ChevronDown className="size-3 opacity-60" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                Saved filter views
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {savedViews.map((v) => (
                <DropdownMenuItem
                  key={v.id}
                  onClick={() => {
                    setFilters((prev) => ({
                      ...prev,
                      ...v.filters,
                    }));
                    if (v.filters.sortKey) {
                      onSortChange(v.filters.sortKey, v.filters.sortDir);
                    }
                  }}
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                  <span className="font-medium">{v.name}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setSaveViewOpen(true)}
                className="text-xs text-primary font-medium cursor-pointer"
              >
                + Save current filters as view
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Row 3: Active Filters & Clear All */}
      {(countActiveFilters > 0 || activeKpi) && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
          <span className="text-muted-foreground font-medium mr-1">Active:</span>

          {activeKpi && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-medium">
              <span>KPI: {activeKpi.replace(/_/g, ' ')}</span>
              <button
                type="button"
                onClick={onClearKpi}
                className="hover:text-foreground p-0.5"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-foreground border border-border">
              <span>Query: "{filters.search}"</span>
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  setFilters((prev) => ({ ...prev, search: undefined }));
                }}
                className="hover:text-primary p-0.5"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {filters.type?.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-foreground border border-border"
            >
              <span>Type: {t}</span>
              <button
                type="button"
                onClick={() => {
                  const next = filters.type?.filter((x) => x !== t);
                  setFilters((prev) => ({
                    ...prev,
                    type: next && next.length > 0 ? next : undefined,
                  }));
                }}
                className="hover:text-primary p-0.5"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}

          {filters.installation && filters.installation !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-foreground border border-border">
              <span>Installation: {filters.installation === 'installed' ? 'Installed' : 'Not installed'}</span>
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, installation: 'all' }))
                }
                className="hover:text-primary p-0.5"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {filters.lastContactRange && filters.lastContactRange !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-foreground border border-border">
              <span>Contact: {filters.lastContactRange}</span>
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, lastContactRange: 'all' }))
                }
                className="hover:text-primary p-0.5"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {filters.configStatus && filters.configStatus !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-foreground border border-border">
              <span>Config: {filters.configStatus}</span>
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, configStatus: 'all' }))
                }
                className="hover:text-primary p-0.5"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleClearAllFilters}
            className="text-primary hover:underline font-semibold ml-2 text-xs cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Save View Simple Dialog */}
      {saveViewOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-lg max-w-sm w-full p-4 space-y-4">
            <h3 className="font-semibold text-sm">Save view preset</h3>
            <input
              type="text"
              placeholder="e.g. My Cameras"
              value={saveViewName}
              onChange={(e) => setSaveViewName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSaveViewOpen(false);
                  setSaveViewName('');
                }}
              >
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
                  setSaveViewOpen(false);
                  setSaveViewName('');
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile/Tablet Filter Sheet */}
      <Sheet open={mobileFilterSheetOpen} onOpenChange={setMobileFilterSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto p-6 rounded-t-2xl">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-base font-semibold">Filter devices</SheetTitle>
            <SheetDescription className="text-xs">
              Refine results by hardware type, vendor, installation, and status.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block">Hardware Type</label>
              <div className="grid grid-cols-2 gap-2">
                {HARDWARE_TYPES.map((t) => (
                  <label key={t} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card text-xs">
                    <Checkbox
                      checked={!!filters.type?.includes(t)}
                      onCheckedChange={(c) => {
                        const cur = filters.type || [];
                        const next = c ? [...cur, t] : cur.filter((x) => x !== t);
                        setFilters((prev) => ({ ...prev, type: next.length > 0 ? next : undefined }));
                      }}
                    />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block">Installation</label>
              <div className="flex gap-2">
                {(['all', 'installed', 'not_installed'] as const).map((inst) => (
                  <button
                    key={inst}
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, installation: inst }))}
                    className={cn(
                      'flex-1 py-2 rounded-lg border text-xs font-medium',
                      (filters.installation || 'all') === inst
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border bg-card text-muted-foreground'
                    )}
                  >
                    {inst === 'all' ? 'All' : inst === 'installed' ? 'Installed' : 'Not installed'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="mt-6 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClearAllFilters}
            >
              Reset
            </Button>
            <Button
              className="flex-1"
              onClick={() => setMobileFilterSheetOpen(false)}
            >
              Show {filteredCount} devices
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};
