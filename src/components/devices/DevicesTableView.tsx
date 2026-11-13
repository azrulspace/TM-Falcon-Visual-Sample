import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  ExternalLink,
  Map as MapIcon,
  Sliders,
  Wrench,
  Edit2,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  RotateCcw,
  SearchX,
  Plus,
  Camera,
  Volume2,
  Activity,
  Cpu,
  Layers,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DeviceStateBadge } from '@/components/devices/DeviceStateBadge';
import { ConfigVersionChip } from '@/components/devices/ConfigVersionChip';
import { evaluateDeviceFreshness } from '@/data/deviceSelectors';
import { useToast } from '@/contexts/ToastContext';
import { useUiMode } from '@/hooks/useUiMode';
import { cn } from '@/lib/utils';
import type { DeviceRecord, DeviceSortKey, DeviceSortDir, DeviceHardwareType } from '@/types/devices';

export interface DevicesTableViewProps {
  devices: DeviceRecord[];
  totalActiveDatasetCount: number;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAllPage: (all: boolean, pageIds: string[]) => void;
  sortKey: DeviceSortKey;
  sortDir: DeviceSortDir;
  onSort: (key: DeviceSortKey) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  rowsPerPage: number;
  setRowsPerPage: (r: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onRegisterDevice: () => void;
  onViewOnMap: (device: DeviceRecord) => void;
  onManageInstallation: (device: DeviceRecord) => void;
  onEdit: (device: DeviceRecord) => void;
  recentlyCreatedId?: string | null;
  isLoading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
}

const getDeviceTypeIcon = (type: DeviceHardwareType) => {
  switch (type) {
    case 'Camera':
      return <Camera className="size-3.5 text-primary shrink-0" />;
    case 'Speaker':
      return <Volume2 className="size-3.5 text-blue-500 shrink-0" />;
    case 'Sensor':
      return <Activity className="size-3.5 text-amber-500 shrink-0" />;
    case 'Gateway':
      return <Cpu className="size-3.5 text-indigo-500 shrink-0" />;
    case 'LiDAR sensor':
      return <Layers className="size-3.5 text-emerald-500 shrink-0" />;
    default:
      return <Cpu className="size-3.5 text-muted-foreground shrink-0" />;
  }
};

interface SortHeaderProps {
  label: string;
  fieldKey: DeviceSortKey;
  className?: string;
  sortKey: DeviceSortKey;
  sortDir: DeviceSortDir;
  onSort: (key: DeviceSortKey) => void;
}

const SortHeader: React.FC<SortHeaderProps> = ({
  label,
  fieldKey,
  className,
  sortKey,
  sortDir,
  onSort,
}) => {
  const isActive = sortKey === fieldKey;
  return (
    <th
      scope="col"
      onClick={() => onSort(fieldKey)}
      aria-sort={isActive ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn(
        'text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3 select-none cursor-pointer hover:bg-muted/40 transition-colors group whitespace-nowrap',
        isActive && 'text-foreground font-bold',
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <span>{label}</span>
        {isActive ? (
          sortDir === 'asc' ? (
            <ArrowUp className="size-3 text-primary" />
          ) : (
            <ArrowDown className="size-3 text-primary" />
          )
        ) : (
          <ArrowUpDown className="size-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </th>
  );
};

export const DevicesTableView: React.FC<DevicesTableViewProps> = ({
  devices,
  totalActiveDatasetCount,
  selectedIds,
  onToggleSelect,
  onSelectAllPage,
  sortKey,
  sortDir,
  onSort,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  setRowsPerPage,
  hasActiveFilters,
  onClearFilters,
  onRegisterDevice,
  onViewOnMap,
  onManageInstallation,
  onEdit,
  recentlyCreatedId,
  isLoading = false,
  errorMessage = null,
  onRetry,
}) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isTablet } = useUiMode();

  const totalFiltered = devices.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / rowsPerPage));
  const pageIndex = Math.min(currentPage, totalPages);
  const startIdx = (pageIndex - 1) * rowsPerPage;
  const paginatedDevices = devices.slice(startIdx, startIdx + rowsPerPage);
  const pageIds = paginatedDevices.map((d) => d.identifier);

  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id)) && !allPageSelected;

  const handleCopyIdentifier = (identifier: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(identifier);
    addToast('success', `Copied identifier "${identifier}" to clipboard.`);
  };

  // 1. Error state with retry
  if (errorMessage) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-12 text-center select-none">
        <AlertTriangle className="size-10 text-destructive mx-auto mb-3" />
        <h3 className="text-base font-semibold text-foreground mb-1">Failed to load devices</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">{errorMessage}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5 cursor-pointer">
            <RotateCcw className="size-3.5" />
            <span>Retry</span>
          </Button>
        )}
      </div>
    );
  }

  // 2. Loading skeleton state
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs animate-pulse select-none">
        <div className="h-10 bg-muted/40 border-b border-border" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 border-b border-border/60 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-4 bg-muted rounded" />
              <div className="h-4 w-28 bg-muted rounded" />
            </div>
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-5 w-16 bg-muted rounded-full" />
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="size-6 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  // 3. Empty state: no devices in entire system
  if (totalActiveDatasetCount === 0 && !hasActiveFilters) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center select-none">
        <div className="size-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
          <Camera className="size-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">No devices registered</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">
          There are no IoT cameras, speakers, or sensors registered on this site yet.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" onClick={onRegisterDevice} className="gap-1.5 cursor-pointer">
            <Plus className="size-3.5" />
            <span>Register device</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/assets/devices/vendor-discovery')}
            className="cursor-pointer"
          >
            Vendor discovery
          </Button>
        </div>
      </div>
    );
  }

  // 4. No match state for current filters
  if (totalFiltered === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center select-none">
        <SearchX className="size-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-base font-semibold text-foreground mb-1">No matching devices</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">
          No devices match your search query or active filter criteria.
        </p>
        <Button variant="outline" size="sm" onClick={onClearFilters} className="cursor-pointer">
          Clear all filters
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs flex flex-col select-none">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Sticky Header */}
          <thead className="border-b border-border bg-muted/40 sticky top-0 z-10 backdrop-blur-xs">
            <tr>
              <th scope="col" className="w-10 py-2.5 px-3">
                <Checkbox
                  checked={allPageSelected ? true : somePageSelected ? 'indeterminate' : false}
                  onCheckedChange={(checked) => onSelectAllPage(!!checked, pageIds)}
                  aria-label="Select all devices on this page"
                />
              </th>
              <SortHeader label="Device" fieldKey="identifier" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Type" fieldKey="type" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <th scope="col" className="py-2.5 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Vendor & Library
              </th>
              <SortHeader label="State" fieldKey="state" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Installed on" fieldKey="installedOn" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Last contact" fieldKey="lastContact" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Events (30d)" fieldKey="events" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <th scope="col" className="py-2.5 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Config
              </th>
              <th scope="col" className="w-12 py-2.5 px-3 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {paginatedDevices.map((d) => {
              const isSelected = selectedIds.has(d.identifier);
              const isRecent = recentlyCreatedId === d.identifier;
              const freshness = evaluateDeviceFreshness(d);

              // Secondary line: show model or name ONLY when it differs from identifier, never repeat identifier
              const hasDistinctName = d.name && d.name !== d.identifier;
              const secondaryText = hasDistinctName ? d.name : d.model;

              return (
                <tr
                  key={d.identifier}
                  onClick={() => navigate(`/assets/devices/${d.identifier}`)}
                  className={cn(
                    'h-14 hover:bg-muted/30 transition-colors cursor-pointer group',
                    isSelected && 'bg-primary/5',
                    isRecent && 'animate-highlight bg-primary/10'
                  )}
                >
                  {/* Checkbox */}
                  <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelect(d.identifier)}
                      aria-label={`Select device ${d.identifier}`}
                    />
                  </td>

                  {/* Device: Type Icon, Identifier as mono link, second line with model/name */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        {getDeviceTypeIcon(d.type)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <Link
                          to={`/assets/devices/${d.identifier}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono font-bold text-foreground hover:text-primary hover:underline transition-colors truncate text-xs"
                          title={d.identifier}
                        >
                          {d.identifier}
                        </Link>
                        {secondaryText && secondaryText !== d.identifier && (
                          <span className="text-[11px] text-muted-foreground truncate max-w-[200px]" title={secondaryText}>
                            {secondaryText}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-foreground border border-border/80">
                      {d.type}
                    </span>
                  </td>

                  {/* Vendor & Library */}
                  <td className="py-2.5 px-3">
                    <div className="flex flex-col text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground">{d.manufacturer}</span>
                      <span className="font-mono text-muted-foreground/80">{d.library}</span>
                    </div>
                  </td>

                  {/* State badge: single badge (Online/Offline/Stale) with warning chip if stale contact */}
                  <td className="py-2.5 px-3">
                    <DeviceStateBadge
                      state={d.state}
                      showWarningChip={freshness.showWarningChip}
                      contradictionReason={freshness.contradictionReason}
                    />
                  </td>

                  {/* Installed on: pole link or Not installed */}
                  <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                    {d.installedOnPoleId ? (
                      <Link
                        to={`/assets/poles/${d.installedOnPoleId}`}
                        className="font-mono text-xs font-semibold text-primary hover:underline transition-colors"
                      >
                        {d.installedOnPoleId}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs italic">Not installed</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onManageInstallation(d)}
                          className="h-6 px-1.5 text-[11px] font-medium text-primary hover:bg-primary/10 cursor-pointer"
                        >
                          Install
                        </Button>
                      </div>
                    )}
                  </td>

                  {/* Last Contact */}
                  <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <span className="cursor-help hover:text-foreground transition-colors">
                            {freshness.relativeText}
                          </span>
                        }
                      />
                      <TooltipContent side="top" className="text-xs">
                        {freshness.absoluteText}
                      </TooltipContent>
                    </Tooltip>
                  </td>

                  {/* Events (30 days) */}
                  <td className="py-2.5 px-3 font-mono font-medium text-foreground tabular-nums">
                    {d.events30dCount ?? 0}
                  </td>

                  {/* Configuration */}
                  <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                    <ConfigVersionChip
                      version={d.appliedConfigVersion}
                      status={d.configStatus}
                      onClick={() => navigate(`/assets/devices/${d.identifier}?tab=configuration`)}
                    />
                  </td>

                  {/* Actions Menu */}
                  <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <button
                            type="button"
                            className="size-7 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                            title="Device actions menu"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => navigate(`/assets/devices/${d.identifier}`)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <ExternalLink className="size-3.5 text-muted-foreground" />
                          <span>Open device</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => navigate(`/assets/devices/${d.identifier}?tab=configuration`)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Sliders className="size-3.5 text-muted-foreground" />
                          <span>Configure</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => onManageInstallation(d)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Wrench className="size-3.5 text-muted-foreground" />
                          <span>Manage installation</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => onEdit(d)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Edit2 className="size-3.5 text-muted-foreground" />
                          <span>Edit</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => onViewOnMap(d)}
                          disabled={!d.location}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <MapIcon className="size-3.5 text-muted-foreground" />
                          <span>View on map</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={(e) => handleCopyIdentifier(d.identifier, e)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Copy className="size-3.5 text-muted-foreground" />
                          <span>Copy identifier</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer with results count and pagination */}
      <div className="p-3 border-t border-border flex items-center justify-between bg-card flex-wrap gap-3 text-xs text-muted-foreground">
        <div>
          Showing{' '}
          <span className="font-semibold text-foreground">
            {totalFiltered === 0 ? 0 : startIdx + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-foreground">
            {Math.min(startIdx + rowsPerPage, totalFiltered)}
          </span>{' '}
          of <span className="font-semibold text-foreground">{totalFiltered}</span> devices
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <div className="relative">
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={cn(
                  'pl-2 pr-6 py-1 rounded-md border border-border bg-card text-foreground font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary appearance-none',
                  isTablet && 'h-9 px-3 text-sm'
                )}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <ChevronDown className="size-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={pageIndex <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={cn('size-8 p-0 cursor-pointer', isTablet && 'size-11')}
              title="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-2 font-mono font-medium text-foreground">
              {pageIndex} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pageIndex >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={cn('size-8 p-0 cursor-pointer', isTablet && 'size-11')}
              title="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
