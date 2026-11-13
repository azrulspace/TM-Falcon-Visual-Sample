import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  ExternalLink,
  Sliders,
  Link2,
  Copy,
  Activity,
  Map as MapIcon,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SearchX,
  Plus,
  RotateCcw,
  Clock,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DeviceConfigBadge,
  DeviceConnectivityBadge,
  DeviceLifecycleBadge,
  DeviceTypeBadge,
} from './DeviceStateBadge';
import { getLastContactFreshness } from '@/data/deviceSelectors';
import { useToast } from '@/contexts/ToastContext';
import { useUiMode } from '@/hooks/useUiMode';
import { cn } from '@/lib/utils';
import type { DevicePermissions } from '@/lib/permissions';
import type {
  DevicePolicyConfig,
  DeviceSortDir,
  DeviceSortKey,
  DeviceWithRelations,
} from '@/types/devices';

export interface DevicesTableViewProps {
  devices: DeviceWithRelations[];
  totalDatasetCount: number;
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
  onViewOnMap: (device: DeviceWithRelations) => void;
  onManageInstallation: (device: DeviceWithRelations) => void;
  onRunConnectionCheck: (device: DeviceWithRelations) => void;
  policyConfig: DevicePolicyConfig;
  permissions: DevicePermissions;
  recentlyCreatedDeviceId?: string | null;
  isLoading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
}

const SortHeader: React.FC<{
  label: string;
  fieldKey: DeviceSortKey;
  className?: string;
  sortKey: DeviceSortKey;
  sortDir: DeviceSortDir;
  onSort: (key: DeviceSortKey) => void;
}> = ({ label, fieldKey, className, sortKey, sortDir, onSort }) => {
  const isActive = sortKey === fieldKey;
  return (
    <th
      scope="col"
      onClick={() => onSort(fieldKey)}
      aria-sort={isActive ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn(
        'text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-2.5 select-none cursor-pointer hover:bg-muted/40 transition-colors group whitespace-nowrap',
        isActive && 'text-foreground font-bold',
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <span>{label}</span>
        {isActive ? (
          sortDir === 'asc' ? (
            <ArrowUp className="size-3 text-primary shrink-0" />
          ) : (
            <ArrowDown className="size-3 text-primary shrink-0" />
          )
        ) : (
          <ArrowUpDown className="size-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
        )}
      </div>
    </th>
  );
};

export const DevicesTableView: React.FC<DevicesTableViewProps> = ({
  devices,
  totalDatasetCount,
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
  onRunConnectionCheck,
  policyConfig,
  permissions,
  recentlyCreatedDeviceId,
  isLoading = false,
  errorMessage = null,
  onRetry,
}) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isTablet } = useUiMode();

  const totalFiltered = devices.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * rowsPerPage;
  const pageDevices = devices.slice(startIdx, startIdx + rowsPerPage);
  const pageIds = pageDevices.map((d) => d.identifier);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  const copyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    addToast('info', `${label} copied: ${text}`);
  };

  if (errorMessage) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center space-y-3">
        <AlertTriangle className="size-8 text-red-500 mx-auto" />
        <h3 className="text-sm font-semibold text-foreground">Unable to load devices</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">{errorMessage}</p>
        {onRetry && (
          <Button size="sm" onClick={onRetry} className="gap-1.5 cursor-pointer">
            <RotateCcw className="size-3.5" />
            <span>Retry</span>
          </Button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 space-y-2 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted/50 rounded-md" />
        ))}
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center space-y-3">
        <SearchX className="size-9 text-muted-foreground/60 mx-auto" />
        <h3 className="text-sm font-semibold text-foreground">
          {totalDatasetCount === 0 ? 'No devices registered yet' : 'No devices match these filters'}
        </h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          {totalDatasetCount === 0
            ? 'Register the first camera, speaker, LiDAR sensor, or gateway to monitor its health and configuration.'
            : 'Adjust or clear your active search or filter criteria to inspect all devices.'}
        </p>
        <div className="flex items-center justify-center gap-2 pt-1">
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={onClearFilters} className="cursor-pointer">
              Reset all filters
            </Button>
          )}
          {permissions.canRegisterDevice && (
            <Button
              size="sm"
              onClick={onRegisterDevice}
              className="gap-1.5 bg-primary text-primary-foreground cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Register device</span>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur-xs border-b border-border">
            <tr>
              <th scope="col" className="w-10 py-2.5 pl-4 pr-2">
                <Checkbox
                  checked={allPageSelected}
                  onCheckedChange={(checked) => onSelectAllPage(Boolean(checked), pageIds)}
                  aria-label="Select all devices on this page"
                />
              </th>
              <SortHeader
                label="Device"
                fieldKey="identifier"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortHeader
                label="Type"
                fieldKey="type"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortHeader
                label="State"
                fieldKey="connectivityState"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th
                scope="col"
                className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-2.5 whitespace-nowrap"
              >
                Lifecycle
              </th>
              <SortHeader
                label="Installed on"
                fieldKey="installedPoleId"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortHeader
                label="Last contact"
                fieldKey="lastContactAt"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortHeader
                label="Events, 30 days"
                fieldKey="events30dCount"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortHeader
                label="Configuration"
                fieldKey="configVersion"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th scope="col" className="w-12 py-2.5 pr-4 pl-2 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {pageDevices.map((d) => {
              const isSelected = selectedIds.has(d.identifier);
              const isRecent = recentlyCreatedDeviceId === d.identifier;
              const freshness = getLastContactFreshness(
                d.lastContactAt,
                d.connectivityState,
                policyConfig
              );

              return (
                <tr
                  key={d.identifier}
                  className={cn(
                    'transition-colors hover:bg-muted/35',
                    isTablet ? 'h-16' : 'h-14',
                    isSelected && 'bg-primary/5',
                    isRecent && 'bg-emerald-500/8'
                  )}
                >
                  <td className="py-2.5 pl-4 pr-2 align-middle">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelect(d.identifier)}
                      aria-label={`Select device ${d.identifier}`}
                    />
                  </td>

                  {/* Device primary verbatim ID + secondary model & serial (never repeating ID) */}
                  <td className="py-2.5 px-2.5 align-middle min-w-[200px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        to={`/assets/inventory/devices/${encodeURIComponent(d.identifier)}`}
                        className="font-mono font-semibold text-primary hover:underline text-xs"
                      >
                        {d.identifier}
                      </Link>
                      {d.identifierKind === 'Vendor serial' && (
                        <span
                          title="Identifier matches vendor serial directly rather than a custom registry code."
                          className="text-[10px] px-1.5 py-0.2 rounded border border-border bg-muted/60 text-muted-foreground font-medium"
                        >
                          Vendor serial
                        </span>
                      )}
                      {d.vendorConflict && (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <button
                                type="button"
                                onClick={() => navigate('/assets/inventory/vendor-discovery')}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded bg-red-500/12 text-red-600 dark:text-red-400 border border-red-500/30 cursor-pointer"
                              >
                                <AlertTriangle className="size-2.5" />
                                Conflict
                              </button>
                            }
                          />
                          <TooltipContent className="max-w-xs text-xs">
                            {d.vendorConflict.conflictReason}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <span className="truncate max-w-[140px]" title={d.model}>
                        {d.model}
                      </span>
                      <span>·</span>
                      <span className="font-mono" title={`Vendor serial: ${d.serial}`}>
                        {d.serial}
                      </span>
                      <span>·</span>
                      <span>{d.library}</span>
                    </div>
                  </td>

                  <td className="py-2.5 px-2.5 align-middle">
                    <DeviceTypeBadge type={d.type} />
                  </td>

                  {/* Connectivity State (strictly Online | Offline | Stale) + stale contact warning tooltip */}
                  <td className="py-2.5 px-2.5 align-middle">
                    <div className="flex items-center gap-1.5">
                      <DeviceConnectivityBadge state={d.connectivityState} />
                      {(freshness.isStaleByPolicy || freshness.isOldWhileOnline) && (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <span
                                className={cn(
                                  'inline-flex items-center justify-center rounded-full p-0.5 cursor-help',
                                  freshness.isStaleByPolicy
                                    ? 'text-amber-500'
                                    : 'text-muted-foreground'
                                )}
                              >
                                <Clock className="size-3.5" />
                              </span>
                            }
                          />
                          <TooltipContent className="max-w-xs text-xs leading-relaxed">
                            {freshness.tooltipSummary}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </td>

                  {/* Administrative Lifecycle (separate column, distinct vocabulary) */}
                  <td className="py-2.5 px-2.5 align-middle">
                    <DeviceLifecycleBadge lifecycle={d.lifecycle} />
                  </td>

                  {/* Installed On */}
                  <td className="py-2.5 px-2.5 align-middle min-w-[145px]">
                    {d.installedPoleId ? (
                      <div>
                        <Link
                          to={`/assets/poles/${encodeURIComponent(d.installedPoleId)}`}
                          className="font-mono font-medium text-primary hover:underline"
                        >
                          {d.installedPoleId}
                        </Link>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[155px]">
                          {d.installedPoleSiteName || d.siteName || 'Unassigned'}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          Not installed
                          <span className="block text-[10px]">
                            {d.siteName || 'Unassigned'}
                          </span>
                        </span>
                        {permissions.canManageInstallation && (
                          <button
                            type="button"
                            onClick={() => onManageInstallation(d)}
                            className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                          >
                            Install
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Last Contact */}
                  <td className="py-2.5 px-2.5 align-middle whitespace-nowrap">
                    <div
                      className={cn(
                        'font-medium',
                        freshness.isStaleByPolicy ? 'text-amber-500' : 'text-foreground'
                      )}
                    >
                      {freshness.relative}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {freshness.absoluteMYT}
                    </div>
                  </td>

                  {/* Events, 30 days */}
                  <td className="py-2.5 px-2.5 align-middle">
                    {d.events30dCount > 0 ? (
                      <Link
                        to={`/events?device=${encodeURIComponent(d.identifier)}`}
                        className="inline-flex items-center gap-1 font-mono font-semibold text-foreground hover:text-primary hover:underline tabular-nums"
                        title={`View ${d.events30dCount} events in Event inbox`}
                      >
                        {d.events30dCount}
                      </Link>
                    ) : (
                      <span className="font-mono text-muted-foreground tabular-nums">0</span>
                    )}
                  </td>

                  {/* Configuration */}
                  <td className="py-2.5 px-2.5 align-middle">
                    <DeviceConfigBadge
                      version={d.configVersion}
                      status={d.configStatus}
                      reportedAt={d.configReportedAt}
                    />
                  </td>

                  {/* Overflow Row Actions */}
                  <td className="py-2.5 pr-4 pl-2 align-middle text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Actions for ${d.identifier}`}
                            className="size-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-48 text-xs">
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(`/assets/inventory/devices/${encodeURIComponent(d.identifier)}`)
                          }
                          className="gap-2 cursor-pointer"
                        >
                          <ExternalLink className="size-3.5" />
                          <span>Open device detail</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(
                              `/assets/inventory/devices/${encodeURIComponent(
                                d.identifier
                              )}?tab=configuration`
                            )
                          }
                          className="gap-2 cursor-pointer"
                        >
                          <Sliders className="size-3.5" />
                          <span>Configure settings</span>
                        </DropdownMenuItem>
                        {permissions.canManageInstallation && (
                          <DropdownMenuItem
                            onClick={() => onManageInstallation(d)}
                            className="gap-2 cursor-pointer"
                          >
                            <Link2 className="size-3.5" />
                            <span>
                              {d.isInstalled ? 'Manage installation' : 'Install on a pole'}
                            </span>
                          </DropdownMenuItem>
                        )}
                        {permissions.canRunConnectionCheck && (
                          <DropdownMenuItem
                            onClick={() => onRunConnectionCheck(d)}
                            className="gap-2 cursor-pointer"
                          >
                            <Activity className="size-3.5" />
                            <span>Run connection check</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {d.location && (
                          <DropdownMenuItem
                            onClick={() => onViewOnMap(d)}
                            className="gap-2 cursor-pointer"
                          >
                            <MapIcon className="size-3.5" />
                            <span>View on map</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => copyText(d.identifier, 'Identifier')}
                          className="gap-2 cursor-pointer"
                        >
                          <Copy className="size-3.5" />
                          <span>Copy identifier</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => copyText(d.serial, 'Serial number')}
                          className="gap-2 cursor-pointer"
                        >
                          <Copy className="size-3.5" />
                          <span>Copy serial</span>
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

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 border-t border-border bg-muted/20 text-xs text-muted-foreground">
        <div>
          Showing <span className="font-mono font-semibold text-foreground">{startIdx + 1}</span>–
          <span className="font-mono font-semibold text-foreground">
            {Math.min(startIdx + rowsPerPage, totalFiltered)}
          </span>{' '}
          of <span className="font-mono font-semibold text-foreground">{totalFiltered}</span> devices
        </div>

        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1 border-border bg-card cursor-pointer"
                >
                  <span>{rowsPerPage} / page</span>
                  <ChevronDown className="size-3" />
                </Button>
              }
            />
            <PopoverContent align="end" className="w-28 p-1">
              {[10, 25, 50, 100].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setRowsPerPage(n);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'w-full text-left px-2 py-1 rounded text-xs cursor-pointer',
                    rowsPerPage === n
                      ? 'bg-primary/12 text-primary font-semibold'
                      : 'hover:bg-muted'
                  )}
                >
                  {n} rows
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7 w-7 p-0 border-border bg-card cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <span className="px-2 font-mono text-foreground">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 w-7 p-0 border-border bg-card cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

