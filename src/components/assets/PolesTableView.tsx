import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  ExternalLink,
  Map as MapIcon,
  Navigation,
  Edit2,
  Copy,
  Trash2,
  MapPinOff,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  RotateCcw,
  SearchX,
  Plus,
  SlidersHorizontal,
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
import { StatusBadge } from '@/components/common/StatusBadge';
import { RelativeTime } from '@/components/common/RelativeTime';
import { useToast } from '@/contexts/ToastContext';
import { useUiMode } from '@/hooks/useUiMode';
import { cn } from '@/lib/utils';
import { formatCoordinates } from '@/lib/geo';
import type { PolePermissions } from '@/lib/permissions';
import type { PoleWithRelations, PoleSortKey, PoleSortDir } from '@/types/assets';

export interface PolesTableViewProps {
  poles: PoleWithRelations[];
  totalActiveDatasetCount: number;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAllPage: (all: boolean, pageIds: string[]) => void;
  sortKey: PoleSortKey;
  sortDir: PoleSortDir;
  onSort: (key: PoleSortKey) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  rowsPerPage: number;
  setRowsPerPage: (r: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onRegisterPole: () => void;
  onViewOnMap: (pole: PoleWithRelations) => void;
  onRelocate: (pole: PoleWithRelations) => void;
  onEdit: (pole: PoleWithRelations) => void;
  onDelete: (pole: PoleWithRelations) => void;
  permissions: PolePermissions;
  recentlyCreatedId?: string | null;
  isLoading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
}

interface SortHeaderProps {
  label: string;
  fieldKey: PoleSortKey;
  className?: string;
  sortKey: PoleSortKey;
  sortDir: PoleSortDir;
  onSort: (key: PoleSortKey) => void;
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
        'text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-2 select-none cursor-pointer hover:bg-muted/40 transition-colors group whitespace-nowrap',
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

export const PolesTableView: React.FC<PolesTableViewProps> = ({
  poles,
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
  onRegisterPole,
  onViewOnMap,
  onRelocate,
  onEdit,
  onDelete,
  permissions,
  recentlyCreatedId,
  isLoading = false,
  errorMessage = null,
  onRetry,
}) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isTablet, orientation, viewportWidth } = useUiMode();
  const isPortrait = (isTablet && orientation === 'portrait') || viewportWidth < 768;
  const isCompactDesktop = viewportWidth >= 1024 && viewportWidth < 1280;

  // Column visibility fallback for 1024-1279px (Site, Protection, Cable spans)
  const [showExtraCols, setShowExtraCols] = useState({
    site: false,
    protection: false,
    spans: false,
  });

  const totalCount = poles.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * rowsPerPage;
  const pagePoles = poles.slice(startIndex, startIndex + rowsPerPage);
  const pageIds = pagePoles.map((p) => p.identifier);

  const isAllPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const isSomePageSelected =
    pageIds.some((id) => selectedIds.has(id)) && !isAllPageSelected;

  const handleCopyLocation = (pole: PoleWithRelations, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!pole.location) return;
    const coords = formatCoordinates(pole.location);
    navigator.clipboard.writeText(coords).then(
      () => addToast('success', `Copied coordinates for ${pole.identifier}: ${coords}`),
      () => addToast('error', 'Failed to copy coordinates')
    );
  };

  if (errorMessage) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-12 text-center shadow-xs">
        <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="size-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">Failed to load poles</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
          {errorMessage}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="gap-2 text-xs cursor-pointer">
            <RotateCcw className="size-3.5" />
            <span>Retry</span>
          </Button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-4 py-2.5 animate-pulse">
              <div className="size-4 bg-muted rounded" />
              <div className="w-24 h-4 bg-muted rounded" />
              <div className="w-32 h-4 bg-muted rounded" />
              <div className="w-20 h-4 bg-muted rounded" />
              <div className="flex-1 h-4 bg-muted rounded" />
              <div className="w-16 h-4 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state (no poles at all on this site) vs No match state
  if (totalCount === 0) {
    if (!hasActiveFilters && totalActiveDatasetCount === 0) {
      return (
        <div className="rounded-xl border border-border bg-card shadow-xs p-12 text-center">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <MapPinOff className="size-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">No poles on this site</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
            Register the first utility pole for this site to track coordinates, spans, and devices.
          </p>
          {permissions.canRegister && (
            <Button onClick={onRegisterPole} size="sm" className="gap-1.5 text-xs">
              <Plus className="size-3.5" />
              <span>Register pole</span>
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-border bg-card shadow-xs p-12 text-center">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <SearchX className="size-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          {hasActiveFilters ? 'No poles match these filters' : 'No poles on this site'}
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
          {hasActiveFilters
            ? 'Try adjusting your search query, site selection, or filter chips.'
            : 'No poles are registered under the selected site yet.'}
        </p>
        <div className="flex items-center justify-center gap-2">
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={onClearFilters} className="text-xs cursor-pointer">
              Clear all filters
            </Button>
          )}
          {permissions.canRegister && (
            <Button size="sm" onClick={onRegisterPole} className="gap-1.5 text-xs cursor-pointer">
              <Plus className="size-3.5" />
              <span>Register pole</span>
            </Button>
          )}
        </div>
      </div>
    );
  }

  const renderDeviceStatusDots = (pole: PoleWithRelations) => {
    if (pole.linkedDevicesCount === 0) {
      return <span className="text-muted-foreground font-mono">0</span>;
    }
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-foreground">
              <span>{pole.linkedDevicesCount}</span>
              <span className="inline-flex items-center gap-0.5">
                {pole.linkedDevices.slice(0, 4).map((dev) => {
                  const st = dev.status.toLowerCase();
                  const color =
                    st === 'offline'
                      ? 'bg-status-offline'
                      : st === 'stale'
                      ? 'bg-status-warning'
                      : 'bg-status-online';
                  return <span key={dev.id} className={cn('size-1.5 rounded-full', color)} />;
                })}
              </span>
            </span>
          }
        />
        <TooltipContent className="text-xs">
          {pole.linkedDevices.map((d) => `${d.id} (${d.status})`).join(', ')}
        </TooltipContent>
      </Tooltip>
    );
  };

  const renderRowMenu = (pole: PoleWithRelations) => (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'p-0 text-muted-foreground hover:text-foreground cursor-pointer',
              isTablet ? 'size-11 min-w-[44px] min-h-[44px]' : 'size-8'
            )}
            aria-label={`Actions for pole ${pole.identifier}`}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-52 bg-popover border border-border shadow-xl z-50 text-xs">
        <DropdownMenuItem
          onClick={() => navigate(`/assets/poles/${encodeURIComponent(pole.identifier)}`)}
          className={cn('gap-2 cursor-pointer', isTablet && 'min-h-[44px] text-sm')}
        >
          <ExternalLink className="size-3.5 text-muted-foreground" />
          <span>Open</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={!pole.location}
          onClick={() => pole.location && onViewOnMap(pole)}
          className={cn('gap-2 cursor-pointer', isTablet && 'min-h-[44px] text-sm')}
        >
          <MapIcon className="size-3.5 text-muted-foreground" />
          <span>{pole.location ? 'View on map' : 'View on map (No location)'}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={!permissions.canRelocate}
          onClick={() => onRelocate(pole)}
          className={cn('gap-2 cursor-pointer', isTablet && 'min-h-[44px] text-sm')}
        >
          <Navigation className="size-3.5 text-muted-foreground" />
          <span>{pole.location ? 'Relocate' : 'Add location'}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={!permissions.canEdit}
          onClick={() => onEdit(pole)}
          className={cn('gap-2 cursor-pointer', isTablet && 'min-h-[44px] text-sm')}
        >
          <Edit2 className="size-3.5 text-muted-foreground" />
          <span>Edit</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={!pole.location}
          onClick={(e) => handleCopyLocation(pole, e as any)}
          className={cn('gap-2 cursor-pointer', isTablet && 'min-h-[44px] text-sm')}
        >
          <Copy className="size-3.5 text-muted-foreground" />
          <span>{pole.location ? 'Copy location' : 'Copy location (Not recorded)'}</span>
        </DropdownMenuItem>

        {isCompactDesktop && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-[11px] text-muted-foreground space-y-0.5">
              <div>Site: <span className="text-foreground">{pole.siteName}</span></div>
              <div>Protection: <span className="text-foreground">{pole.protection || 'No protection recorded'}</span></div>
              <div>Cable spans: <span className="font-mono text-foreground">{pole.cableSpansCount}</span></div>
            </div>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          disabled={!permissions.canDelete}
          onClick={() => onDelete(pole)}
          className={cn('gap-2 cursor-pointer text-destructive focus:text-destructive', isTablet && 'min-h-[44px] text-sm')}
        >
          <Trash2 className="size-3.5" />
          <span>
            {permissions.canDelete
              ? 'Delete'
              : `Delete (${permissions.deleteDisabledReason || 'No permission'})`}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const showSiteCol = !isCompactDesktop || showExtraCols.site;
  const showProtectionCol = !isCompactDesktop || showExtraCols.protection;
  const showSpansCol = !isCompactDesktop || showExtraCols.spans;

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden flex flex-col">
      {/* Compact Desktop (1024-1279px) Column Visibility Strip */}
      {isCompactDesktop && !isPortrait && (
        <div className="px-4 py-2 border-b border-border bg-muted flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Compact layout (1024–1279 px): Site, Protection, and Cable spans are accessible in row details or via Columns.
          </span>
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer">
                  <SlidersHorizontal className="size-3" />
                  <span>Columns</span>
                </Button>
              }
            />
            <PopoverContent align="end" className="w-48 p-2 bg-popover border border-border shadow-lg z-50 text-xs">
              <div className="font-semibold pb-1.5 mb-1.5 border-b border-border">Toggle optional columns</div>
              {(
                [
                  { key: 'site', label: 'Site' },
                  { key: 'protection', label: 'Protection' },
                  { key: 'spans', label: 'Cable spans' },
                ] as const
              ).map((col) => (
                <button
                  key={col.key}
                  type="button"
                  onClick={() =>
                    setShowExtraCols((prev) => ({ ...prev, [col.key]: !prev[col.key] }))
                  }
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-left"
                >
                  <Checkbox checked={showExtraCols[col.key]} className="size-3.5 pointer-events-none" />
                  <span>{col.label}</span>
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Portrait Tablet / Mobile Card List Fallback */}
      {isPortrait ? (
        <div className="divide-y divide-border/70 p-3 space-y-2.5">
          {pagePoles.map((pole) => {
            const isSelected = selectedIds.has(pole.identifier);
            const isNew = recentlyCreatedId === pole.identifier;

            return (
              <div
                key={pole.identifier}
                onClick={() => navigate(`/assets/poles/${encodeURIComponent(pole.identifier)}`)}
                className={cn(
                  'p-3.5 rounded-xl border transition-colors cursor-pointer space-y-2.5',
                  isNew
                    ? 'border-primary bg-primary/10'
                    : isSelected
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border bg-card hover:bg-muted/30'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(pole.identifier);
                      }}
                      className="size-11 -m-2 flex items-center justify-center shrink-0"
                    >
                      <Checkbox
                        checked={isSelected}
                        aria-label={`Select pole ${pole.identifier}`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/assets/poles/${encodeURIComponent(pole.identifier)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono text-sm font-bold text-primary hover:underline"
                        >
                          {pole.identifier}
                        </Link>
                        <StatusBadge status={pole.lifecycle} size="sm" />
                      </div>
                      {pole.name !== pole.identifier && (
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {pole.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>{renderRowMenu(pole)}</div>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                  {pole.location ? (
                    <span className="font-mono text-foreground">{formatCoordinates(pole.location)}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRelocate(pole);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-status-warning-tint text-status-warning border border-status-warning-border text-xs font-medium min-h-[32px]"
                    >
                      <MapPinOff className="size-3" />
                      <span>No location</span>
                    </button>
                  )}
                  <div className="flex items-center gap-3 text-muted-foreground font-mono text-xs">
                    <span>
                      {pole.linkedDevicesCount} {pole.linkedDevicesCount === 1 ? 'device' : 'devices'}
                    </span>
                    <span>
                      {pole.cableSpansCount} {pole.cableSpansCount === 1 ? 'span' : 'spans'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Desktop & Landscape Tablet Data Table */
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur-xs border-b border-border">
              <tr>
                <th scope="col" className="w-9 py-2.5 px-2 text-center">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={isAllPageSelected ? true : isSomePageSelected ? 'indeterminate' : false}
                      onCheckedChange={(checked) => onSelectAllPage(Boolean(checked), pageIds)}
                      aria-label="Select all poles on this page"
                    />
                  </div>
                </th>
                <SortHeader
                  label="Identifier"
                  fieldKey="identifier"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
                <th
                  scope="col"
                  className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-2 whitespace-nowrap"
                >
                  Name
                </th>
                {showSiteCol && (
                  <th
                    scope="col"
                    className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-2 whitespace-nowrap"
                  >
                    Site
                  </th>
                )}
                <SortHeader
                  label="Lifecycle"
                  fieldKey="lifecycle"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
                <th
                  scope="col"
                  className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-2 whitespace-nowrap"
                >
                  Location
                </th>
                {showProtectionCol && (
                  <th
                    scope="col"
                    className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-2 whitespace-nowrap"
                  >
                    Protection
                  </th>
                )}
                <th
                  scope="col"
                  className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-2 leading-tight"
                >
                  Linked devices
                </th>
                {showSpansCol && (
                  <th
                    scope="col"
                    className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-2 leading-tight"
                  >
                    Cable spans
                  </th>
                )}
                <th
                  scope="col"
                  className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-2 leading-tight"
                >
                  Events (30d)
                </th>
                <SortHeader
                  label="Updated"
                  fieldKey="lastUpdatedAt"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
                <th
                  scope="col"
                  className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-2 w-12"
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {pagePoles.map((pole) => {
                const isSelected = selectedIds.has(pole.identifier);
                const isHighlighted = recentlyCreatedId === pole.identifier;
                const sameName = pole.name.trim() === pole.identifier.trim();

                return (
                  <tr
                    key={pole.identifier}
                    onClick={() => navigate(`/assets/poles/${encodeURIComponent(pole.identifier)}`)}
                    className={cn(
                      'group transition-colors relative cursor-pointer h-[56px]',
                      isHighlighted
                        ? 'bg-primary/15 hover:bg-primary/20'
                        : isSelected
                        ? 'bg-primary/10 hover:bg-primary/15'
                        : 'hover:bg-muted/40'
                    )}
                  >
                    {/* Checkbox + 2px left selection bar */}
                    <td
                      className="text-center relative py-2 px-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                      )}
                      <div
                        className={cn(
                          'flex items-center justify-center mx-auto cursor-pointer',
                          isTablet ? 'size-11' : 'size-7'
                        )}
                        onClick={() => onToggleSelect(pole.identifier)}
                      >
                        <Checkbox
                          checked={isSelected}
                          aria-label={`Select pole ${pole.identifier}`}
                        />
                      </div>
                    </td>

                    {/* Identifier (verbatim mono link) */}
                    <td className="py-2 px-2 whitespace-nowrap">
                      <Link
                        to={`/assets/poles/${encodeURIComponent(pole.identifier)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-mono font-semibold text-primary hover:underline"
                      >
                        {pole.identifier}
                      </Link>
                    </td>

                    {/* Name (muted when identical to identifier) */}
                    <td className="py-2 px-2 max-w-[140px] truncate">
                      <span
                        title={pole.name}
                        className={
                          sameName ? 'text-muted-foreground/70' : 'text-foreground font-medium'
                        }
                      >
                        {pole.name}
                      </span>
                    </td>

                    {/* Site */}
                    {showSiteCol && (
                      <td className="py-2 px-2 text-muted-foreground max-w-[155px] truncate" title={pole.siteName}>
                        {pole.siteName}
                      </td>
                    )}

                    {/* Lifecycle */}
                    <td className="py-2 px-2 whitespace-nowrap">
                      <StatusBadge status={pole.lifecycle} size="sm" />
                    </td>

                    {/* Location */}
                    <td className="py-2 px-2 whitespace-nowrap">
                      {pole.location ? (
                        <div className="inline-flex items-center gap-1 group/loc">
                          <span className="font-mono text-[11.5px] text-foreground">
                            {formatCoordinates(pole.location)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyLocation(pole, e)}
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
                            title="Copy coordinates"
                            aria-label={`Copy location for ${pole.identifier}`}
                          >
                            <Copy className="size-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRelocate(pole);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-status-warning-tint text-status-warning border border-status-warning-border text-[11px] font-medium hover:brightness-110 cursor-pointer"
                          title="Add location coordinates"
                        >
                          <MapPinOff className="size-3 shrink-0" />
                          <span>No location</span>
                        </button>
                      )}
                    </td>

                    {/* Protection */}
                    {showProtectionCol && (
                      <td className="py-2 px-2 max-w-[150px] truncate">
                        {pole.protection ? (
                          <span className="text-foreground">{pole.protection}</span>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">
                            No protection recorded
                          </span>
                        )}
                      </td>
                    )}

                    {/* Linked devices */}
                    <td className="py-2 px-2 whitespace-nowrap">
                      {renderDeviceStatusDots(pole)}
                    </td>

                    {/* Cable spans */}
                    {showSpansCol && (
                      <td className="py-2 px-2 font-mono text-foreground whitespace-nowrap">
                        {pole.cableSpansCount}
                      </td>
                    )}

                    {/* Events (30d) */}
                    <td className="py-2 px-2 font-mono whitespace-nowrap">
                      {pole.events30dCount > 0 ? (
                        <span className="text-foreground font-semibold">
                          {pole.events30dCount}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>

                    {/* Last updated */}
                    <td className="py-2 px-2 whitespace-nowrap">
                      <RelativeTime date={pole.lastUpdatedAt} />
                    </td>

                    {/* Actions */}
                    <td
                      className="py-2 px-2 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {renderRowMenu(pole)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="p-4 border-t border-border flex items-center justify-between bg-card flex-wrap gap-4 text-xs">
        <div className="text-muted-foreground">
          Showing{' '}
          <span className="font-semibold text-foreground tabular-nums">
            {totalCount === 0 ? 0 : startIndex + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-foreground tabular-nums">
            {Math.min(validPage * rowsPerPage, totalCount)}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-foreground tabular-nums">{totalCount}</span>{' '}
          {totalCount === 1 ? 'pole' : 'poles'}
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Rows per page</span>
            <div className="relative bg-card border border-border rounded-md flex items-center h-8">
              <select
                aria-label="Rows per page"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-full pl-2.5 pr-7 bg-transparent text-xs font-medium text-foreground cursor-pointer outline-none appearance-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <ChevronDown className="absolute right-1.5 size-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={validPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={cn(
                'p-0 flex items-center justify-center rounded-md',
                isTablet ? 'size-11 min-w-[44px] min-h-[44px]' : 'size-8'
              )}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="w-12 text-center font-mono font-medium tabular-nums text-foreground">
              {validPage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={validPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={cn(
                'p-0 flex items-center justify-center rounded-md',
                isTablet ? 'size-11 min-w-[44px] min-h-[44px]' : 'size-8'
              )}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
