import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Check,
  Briefcase,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Camera,
  Film,
  Activity,
  Copy,
  Radio,
  MapPin,
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
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DeviceChip } from '@/components/common/DeviceChip';
import { AssetChip } from '@/components/common/AssetChip';
import { RelativeTime } from '@/components/common/RelativeTime';
import { useEvents } from '@/contexts/EventsContext';
import { useToast } from '@/contexts/ToastContext';
import { cn, formatId } from '@/lib/utils';
import type { FalconEvent } from '@/data/events';
export interface ColumnVisibility {
  event?: boolean;
  captured?: boolean;
  type?: boolean;
  device?: boolean;
  asset?: boolean;
  priority?: boolean;
  status?: boolean;
  case?: boolean;
  source?: boolean;
  actions?: boolean;
}

export const defaultColumnVisibility: ColumnVisibility = {
  event: true,
  captured: true,
  type: true,
  device: true,
  asset: true,
  priority: true,
  status: true,
  case: true,
  source: false,
  actions: true,
};

export interface EventTableViewProps {
  events: FalconEvent[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAllPage: (all: boolean, pageIds: string[]) => void;
  activeEventId: string | null;
  onRowClick: (event: FalconEvent) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  onSort: (key: string) => void;
  columns?: ColumnVisibility;
  density?: 'comfortable' | 'compact';
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  rowsPerPage: number;
  setRowsPerPage: (r: number) => void;
  onOpenAssignDialog: (id: string) => void;
  onOpenDismissDialog: (id: string) => void;
  onOpenCreateCaseDialog: (id: string) => void;
  onOpenLightbox?: (event: FalconEvent) => void;
}


interface SortHeaderProps {
  label: string;
  sortKey: string;
  className?: string;
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  onSort: (key: string) => void;
}

const SortHeader: React.FC<SortHeaderProps> = ({
  label,
  sortKey,
  className,
  sortConfig,
  onSort,
}) => {
  const isActive = sortConfig.key === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={cn(
        'text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3 select-none cursor-pointer hover:bg-muted/40 transition-colors',
        isActive && 'text-foreground font-bold',
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <span>{label}</span>
        {isActive ? (
          sortConfig.direction === 'asc' ? (
            <ArrowUp className="size-3 text-primary" />
          ) : (
            <ArrowDown className="size-3 text-primary" />
          )
        ) : (
          <ArrowUpDown className="size-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </th>
  );
};

export const EventTableView: React.FC<EventTableViewProps> = ({
  events,
  selectedIds,
  onToggleSelect,
  onSelectAllPage,
  activeEventId,
  onRowClick,
  sortConfig,
  onSort,
  columns = defaultColumnVisibility,
  density = 'comfortable',
  currentPage,
  setCurrentPage,
  rowsPerPage,
  setRowsPerPage,
  onOpenAssignDialog: _onOpenAssignDialog,
  onOpenDismissDialog: _onOpenDismissDialog,
  onOpenCreateCaseDialog,
  onOpenLightbox,
}) => {
  const navigate = useNavigate();
  const { acknowledgeEvent } = useEvents();
  const { addToast } = useToast();

  const handleCopyLink = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const url = `${window.location.origin}/events/${id}`;
    navigator.clipboard.writeText(url);
    addToast('success', `Copied link to ${id}`);
  };

  const rowHeightClass = density === 'comfortable' ? 'h-14' : 'h-11';

  // Pagination calculation
  const totalEvents = events.length;
  const totalRows = totalEvents;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedEvents = events.slice(startIndex, startIndex + rowsPerPage);

  const pageIds = paginatedEvents.map((e) => e.id);
  const isAllPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const isSomePageSelected = pageIds.some((id) => selectedIds.has(id)) && !isAllPageSelected;

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden select-none">
      {/* Scrollable Table Container with Sticky Header (Desktop >= 1024px) */}
      <div className="hidden lg:block overflow-x-auto min-h-[340px] max-h-[calc(100vh-320px)] overflow-y-auto">
        <table className="w-full border-collapse text-left text-xs">
          {/* Sticky Header */}
          <thead className="sticky top-0 bg-card/95 backdrop-blur-md border-b border-border z-20 shadow-xs">
            <tr className="border-b border-border">
              {/* Checkbox column (40px) */}
              <th className="w-10 py-2.5 px-3 text-center">
                <Checkbox
                  checked={isAllPageSelected ? true : isSomePageSelected ? 'indeterminate' : false}
                  onCheckedChange={(checked) => onSelectAllPage(checked === true, pageIds)}
                  aria-label="Select all rows on page"
                  className="size-4"
                />
              </th>

              {/* Event (280px) */}
              {columns.event && (
                <SortHeader
                  label="Event"
                  sortKey="id"
                  className="w-[280px] min-w-[260px]"
                  sortConfig={sortConfig}
                  onSort={onSort}
                />
              )}

              {/* Captured (140px) */}
              {columns.captured && (
                <SortHeader
                  label="Captured"
                  sortKey="captured"
                  className="w-[140px]"
                  sortConfig={sortConfig}
                  onSort={onSort}
                />
              )}

              {/* Type / Activity (200px) - hidden on screens below 1280px (Section 8) */}
              {columns.type && (
                <SortHeader
                  label="Type / Activity"
                  sortKey="type"
                  className="w-[200px] hidden xl:table-cell"
                  sortConfig={sortConfig}
                  onSort={onSort}
                />
              )}

              {/* Device (120px) */}
              {columns.device && (
                <th scope="col" className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3 w-[120px]">
                  Device
                </th>
              )}

              {/* Asset (120px) - hidden on screens below 1440px (Section 8) */}
              {columns.asset && (
                <th scope="col" className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3 w-[120px] hidden 2xl:table-cell">
                  Asset
                </th>
              )}

              {/* Priority (110px) */}
              {columns.priority && (
                <SortHeader
                  label="Priority"
                  sortKey="priority"
                  className="w-[110px]"
                  sortConfig={sortConfig}
                  onSort={onSort}
                />
              )}

              {/* Status (130px) */}
              {columns.status && (
                <SortHeader
                  label="Status"
                  sortKey="status"
                  className="w-[130px]"
                  sortConfig={sortConfig}
                  onSort={onSort}
                />
              )}

              {/* Case (110px) */}
              {columns.case && <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3 w-[110px]">Case</th>}

              {/* Optional Source column */}
              {columns.source && <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3 w-[120px]">Source</th>}

              {/* Actions (96px) */}
              {columns.actions && <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3 w-24">Actions</th>}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-border">
            {paginatedEvents.map((event) => {
              const isSelected = selectedIds.has(event.id);
              const isActive = activeEventId === event.id;

              return (
                <tr
                  key={event.id}
                  onClick={() => onRowClick(event)}
                  onDoubleClick={() => navigate(`/events/${event.id}`)}
                  className={cn(
                    'group transition-colors relative cursor-pointer',
                    rowHeightClass,
                    isSelected ? 'bg-primary/10 hover:bg-primary/15' : isActive ? 'bg-muted/80' : 'hover:bg-muted/40'
                  )}
                >
                  {/* Selection Checkbox & 2px accent indicator bar */}
                  <td
                    className="py-2 px-3 text-center relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* 2px accent bar for selected row */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                    )}
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelect(event.id)}
                      aria-label={`Select ${event.id}`}
                      className="size-4"
                    />
                  </td>

                  {/* Event: 56x40 Thumbnail + Mono ID link + type icon (280px) */}
                  {columns.event && (
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-3">
                        {/* 56 by 40 snapshot thumbnail with radius 6 (click opens lightbox preview) */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenLightbox?.(event);
                          }}
                          className="w-14 h-10 rounded-[6px] overflow-hidden bg-slate-900 border border-border/80 shrink-0 relative shadow-2xs group-hover:border-primary/50 transition-colors cursor-zoom-in"
                          title="Click snapshot to preview in lightbox"
                        >
                          <img
                            src={event.snapshots[0]}
                            alt={event.id}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                        </div>

                        {/* ID in mono as link & type icon */}
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/events/${event.id}`);
                              }}
                              className="font-mono text-xs font-semibold text-blue-600 dark:text-[#60a5fa] hover:underline cursor-pointer"
                              title={`Open ${event.id}`}
                            >
                              {formatId(event.id)}
                            </span>
                            <Camera className="size-3 text-muted-foreground shrink-0 opacity-70" />
                          </div>
                          <span className="text-[11px] text-muted-foreground truncate">{event.detection}</span>

                          {/* Merged Type when screen is 1024 to 1279px (Section 8) */}
                          <div className="xl:hidden block mt-0.5">
                            <span className="text-[11px] font-medium text-foreground truncate block">{event.type}</span>
                            <span className="text-[10px] text-muted-foreground/80 flex items-center gap-1">
                              <Activity className="size-2.5" />
                              <span>{event.source}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                  )}

                  {/* Captured Relative Time (140px) */}
                  {columns.captured && (
                    <td className="py-2 px-3 whitespace-nowrap text-muted-foreground">
                      <RelativeTime date={event.captured} />
                    </td>
                  )}

                  {/* Type / Activity with muted source underneath (200px) - hidden on screens below 1280px (Section 8) */}
                  {columns.type && (
                    <td className="py-2 px-3 hidden xl:table-cell">
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium text-foreground truncate">{event.type}</span>
                        <span className="text-[11px] text-muted-foreground/80 flex items-center gap-1 mt-0.5">
                          <Activity className="size-2.5" />
                          <span>{event.source}</span>
                        </span>
                      </div>
                    </td>
                  )}

                  {/* Device (120px) - with merged Asset chip below 1440px (Section 8) */}
                  {columns.device && (
                    <td className="py-2 px-3">
                      <div className="flex flex-col gap-1">
                        <DeviceChip deviceId={event.device} status={event.deviceStatus} />
                        <div className="2xl:hidden block">
                          <AssetChip assetId={event.asset} type={event.assetType} />
                        </div>
                      </div>
                    </td>
                  )}

                  {/* Asset (120px) - hidden on screens below 1440px (Section 8) */}
                  {columns.asset && (
                    <td className="py-2 px-3 hidden 2xl:table-cell">
                      <AssetChip assetId={event.asset} type={event.assetType} />
                    </td>
                  )}

                  {/* Priority (110px) */}
                  {columns.priority && (
                    <td className="py-2 px-3">
                      <PriorityBadge priority={event.priority} size="sm" />
                    </td>
                  )}

                  {/* Status (130px) */}
                  {columns.status && (
                    <td className="py-2 px-3">
                      <StatusBadge status={event.state} size="sm" />
                    </td>
                  )}

                  {/* Case (110px) */}
                  {columns.case && (
                    <td className="py-2 px-3">
                      {event.caseId ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border">
                          <Briefcase className="size-2.5 text-muted-foreground" />
                          <span>{event.caseId}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-mono text-xs">—</span>
                      )}
                    </td>
                  )}

                  {/* Optional Source */}
                  {columns.source && (
                    <td className="py-2 px-3 text-xs text-muted-foreground">
                      {event.source}
                    </td>
                  )}

                  {/* Actions cell (96px) */}
                  {columns.actions && (
                    <td
                      className="py-2 px-3 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {/* Hover quick action: Acknowledge */}
                        {event.state === 'New' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => acknowledgeEvent(event.id)}
                            className="h-7 px-2 text-[11px] font-medium hidden group-hover:inline-flex bg-muted hover:bg-muted/80 text-foreground"
                            title="Acknowledge event"
                          >
                            <Check className="size-3 mr-1 text-emerald-500" />
                            <span>Ack</span>
                          </Button>
                        )}

                        {/* Hover quick action: Create Case */}
                        {!event.caseId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenCreateCaseDialog(event.id)}
                            className="h-7 px-2 text-[11px] font-medium hidden group-hover:inline-flex border-border text-foreground hover:bg-muted"
                            title="Create case"
                          >
                            <span>Case</span>
                          </Button>
                        )}

                        {/* Overflow Menu (Section 3.6: Open event, Acknowledge, Create case, Copy link, Open device, Open asset) */}
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <button
                              type="button"
                              className="size-7 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer focus-visible:outline-none"
                              aria-label="More actions"
                            >
                              <MoreHorizontal className="size-4" />
                            </button>
                          } />
                          <DropdownMenuContent align="end" className="w-48 bg-popover border border-border text-xs z-50">
                            <DropdownMenuItem
                              onClick={() => navigate(`/events/${event.id}`)}
                              className="cursor-pointer gap-2"
                            >
                              <ExternalLink className="size-3.5 text-primary" />
                              <span>Open event</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              disabled={event.state !== 'New'}
                              onClick={() => {
                                if (event.state === 'New') acknowledgeEvent(event.id);
                              }}
                              className={cn(
                                'gap-2',
                                event.state === 'New' ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
                              )}
                              title={event.state !== 'New' ? 'Event already acknowledged' : 'Acknowledge event'}
                            >
                              <Check className="size-3.5 text-emerald-500" />
                              <span>Acknowledge</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              disabled={!!event.caseId}
                              onClick={() => {
                                if (!event.caseId) onOpenCreateCaseDialog(event.id);
                              }}
                              className={cn(
                                'gap-2',
                                !event.caseId ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
                              )}
                              title={event.caseId ? `Case ${event.caseId} already created` : 'Create operational case'}
                            >
                              <Briefcase className="size-3.5 text-amber-500" />
                              <span>Create case</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleCopyLink(event.id)}
                              className="cursor-pointer gap-2"
                            >
                              <Copy className="size-3.5 text-muted-foreground" />
                              <span>Copy link</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => {
                                addToast(
                                  'info',
                                  `Requested on-demand clip for ${formatId(event.id)} from device.`,
                                  'Clip requested'
                                );
                              }}
                              className="cursor-pointer gap-2"
                            >
                              <Film className="size-3.5 text-primary" />
                              <span>Request clip</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {event.device ? (
                              <DropdownMenuItem
                                onClick={() => navigate(`/assets/inventory/devices/${formatId(event.device)}`)}
                                className="cursor-pointer gap-2"
                              >
                                <Radio className="size-3.5 text-blue-500" />
                                <span>Open device</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed gap-2" title="No device associated">
                                <Radio className="size-3.5 text-muted-foreground" />
                                <span>Open device</span>
                              </DropdownMenuItem>
                            )}

                            {event.asset ? (
                              <DropdownMenuItem
                                onClick={() => navigate(`/overview?asset=${event.asset}`)}
                                className="cursor-pointer gap-2"
                              >
                                <MapPin className="size-3.5 text-violet-500" />
                                <span>Open asset</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed gap-2" title="No asset associated">
                                <MapPin className="size-3.5 text-muted-foreground" />
                                <span>Open asset</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Compact Card List for screens below 1024px (Mobile & Tablet Portrait) (Section 8) */}
      <div className="lg:hidden flex flex-col divide-y divide-border min-h-[300px]">
        {paginatedEvents.map((event) => {
          const isSelected = selectedIds.has(event.id);
          const isActive = activeEventId === event.id;

          return (
            <div
              key={event.id}
              onClick={() => onRowClick(event)}
              className={cn(
                'p-3 flex items-start gap-3 transition-colors cursor-pointer relative',
                isSelected ? 'bg-primary/10 hover:bg-primary/15' : isActive ? 'bg-muted/80' : 'hover:bg-muted/40'
              )}
            >
              {/* 2px accent bar for selected item */}
              {isSelected && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />}

              {/* Checkbox */}
              <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect(event.id)}
                  aria-label={`Select ${event.id}`}
                  className="size-4"
                />
              </div>

              {/* Snapshot thumbnail */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLightbox?.(event);
                }}
                className="w-14 h-10 rounded-[6px] overflow-hidden bg-slate-900 border border-border/80 shrink-0 relative cursor-zoom-in mt-0.5"
                title="Click snapshot to preview in lightbox"
              >
                <img
                  src={event.snapshots[0]}
                  alt={event.id}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/events/${event.id}`);
                      }}
                      className="font-mono text-xs font-semibold text-blue-600 dark:text-[#60a5fa] hover:underline"
                    >
                      {formatId(event.id)}
                    </span>
                    <Camera className="size-3 text-muted-foreground shrink-0 opacity-70" />
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    <RelativeTime date={event.captured} />
                  </span>
                </div>

                <div className="text-xs font-medium text-foreground truncate mt-0.5">
                  {event.type}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <PriorityBadge priority={event.priority} size="sm" />
                  <StatusBadge status={event.state} size="sm" />
                  <DeviceChip deviceId={event.device} status={event.deviceStatus} />
                  <AssetChip assetId={event.asset} type={event.assetType} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Table Footer: Showing X to Y of Z, Rows per page, Page Navigation */}
      <div className="p-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-card shrink-0">
        <div className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground tabular-nums">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
          <span className="font-semibold text-foreground tabular-nums">{Math.min(currentPage * rowsPerPage, totalEvents)}</span> of{' '}
          <span className="font-semibold text-foreground tabular-nums">{totalEvents}</span> events
        </div>

        <div className="flex items-center gap-6">
          {/* Rows per page selector */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Rows per page</span>
            <div className="relative h-7 bg-muted/60 border border-border rounded-md flex items-center hover:bg-muted transition-colors">
              <select
                className="h-full pl-2 pr-6 bg-transparent font-medium text-foreground cursor-pointer outline-none appearance-none text-xs"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <ChevronDown className="absolute right-1.5 size-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Page controls */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="size-7 p-0 border-border"
              title="Previous page"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <span className="text-xs font-semibold px-2 tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="size-7 p-0 border-border"
              title="Next page"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
