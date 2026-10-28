import React from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  MoreVertical,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  Compass,
} from 'lucide-react';
import { cn, formatId } from '@/lib/utils';
import type { RiskSegment, RiskSortKey } from '@/types/risk';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { RiskConfidenceMeter } from './RiskConfidenceMeter';
import { EmptyState } from '@/components/Shared';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useUiMode } from '@/hooks/useUiMode';

export interface RiskTableViewProps {
  segments: RiskSegment[];
  selectedSegmentIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: (select: boolean) => void;
  onRowClick: (segment: RiskSegment) => void;
  onInvestigate: (segment: RiskSegment) => void;
  onDismiss: (segment: RiskSegment) => void;
  onShowOnMap: (segment: RiskSegment) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (items: number) => void;
  sortKey: RiskSortKey;
  onSortChange: (sort: RiskSortKey) => void;
}

export const RiskTableView: React.FC<RiskTableViewProps> = ({
  segments,
  selectedSegmentIds,
  onToggleSelect,
  onSelectAll,
  onRowClick,
  onInvestigate,
  onDismiss,
  onShowOnMap,
  currentPage,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  sortKey,
  onSortChange,
}) => {
  const { isTablet, orientation } = useUiMode();
  const isPortrait = isTablet && orientation === 'portrait';

  const totalPages = Math.ceil(segments.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedSegments = segments.slice(startIdx, startIdx + itemsPerPage);

  const allVisibleSelected =
    paginatedSegments.length > 0 &&
    paginatedSegments.every((s) => selectedSegmentIds.has(s.id));

  const someVisibleSelected =
    paginatedSegments.some((s) => selectedSegmentIds.has(s.id)) && !allVisibleSelected;

  const handleHeaderCheckboxChange = () => {
    onSelectAll(!allVisibleSelected);
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
      {isPortrait ? (
        <div className="flex-1 overflow-y-auto divide-y divide-border/60 p-3">
          {paginatedSegments.length === 0 ? (
            <div className="py-12 text-center">
              <EmptyState
                icon={Search}
                title="No segments match your filters"
                description="Try clearing search or relaxing priority / confidence filters"
              />
            </div>
          ) : (
            paginatedSegments.map((s, idx) => {
              const isSelected = selectedSegmentIds.has(s.id);
              const rankNum = startIdx + idx + 1;

              return (
                <div
                  key={s.id}
                  onClick={() => onRowClick(s)}
                  className={cn(
                    'p-3.5 rounded-xl mb-2 transition-colors cursor-pointer border border-border/80 flex flex-col gap-2.5',
                    isSelected ? 'bg-primary/5 border-primary/40' : 'bg-card hover:bg-muted/40'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(s.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-border text-primary size-4 cursor-pointer"
                        aria-label={`Select segment ${formatId(s.id)}`}
                      />
                      <span className="font-semibold text-xs text-muted-foreground tabular-nums">
                        #{rankNum}
                      </span>
                      <span className="font-mono font-bold text-sm text-foreground">
                        {formatId(s.id)}
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-muted border border-border/80 text-foreground">
                        {s.route}
                      </span>
                    </div>
                    <PriorityBadge priority={s.priority} size="sm" />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 font-mono">
                      <span>{formatId(s.from)}</span>
                      <span>→</span>
                      <span>{formatId(s.to)}</span>
                    </div>
                    <span>{s.lastIncidentTime || '2h ago'}</span>
                  </div>

                  <div className="text-xs text-muted-foreground truncate">{s.basis}</div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/40">
                    <RiskConfidenceMeter confidence={s.confidence} size="sm" />
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {s.status !== 'dismissed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onInvestigate(s)}
                          className="h-8 px-2.5 text-xs text-primary"
                        >
                          Investigate
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-8 p-0 text-muted-foreground"
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-44 z-50">
                          <DropdownMenuItem onClick={() => onShowOnMap(s)} className="cursor-pointer gap-2">
                            <Compass className="size-4 text-primary" />
                            <span>Show on map</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onRowClick(s)} className="cursor-pointer gap-2">
                            <ExternalLink className="size-4 text-muted-foreground" />
                            <span>View details</span>
                          </DropdownMenuItem>
                          {s.status !== 'dismissed' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onDismiss(s)}
                                className="cursor-pointer gap-2"
                              >
                                <CheckCircle2 className="size-4" />
                                <span>Dismiss segment</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table scroll container */
        <div className="flex-1 overflow-x-auto min-h-[380px]">
          <table className="w-full text-left border-collapse text-sm">
            {/* Sticky Header (Section 5.10) */}
          <thead className="sticky top-0 z-10 bg-card border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
            <tr className="h-11">
              <th className="w-10 px-3 text-center">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someVisibleSelected;
                  }}
                  onChange={handleHeaderCheckboxChange}
                  className="rounded border-border text-primary focus:ring-primary size-4 cursor-pointer align-middle"
                  aria-label="Select all visible segments"
                />
              </th>
              <th className="w-14 px-3 text-center">Rank</th>
              <th className="px-4">Segment / Span</th>
              <th className="px-3">Route</th>
              <th className="px-3">
                <button
                  type="button"
                  onClick={() => onSortChange(sortKey === 'priority' ? 'urgent' : 'priority')}
                  className="flex items-center gap-1 hover:text-foreground cursor-pointer transition-colors"
                >
                  <span>Priority</span>
                  <ArrowUpDown className="size-3" />
                </button>
              </th>
              <th className="px-3">
                <button
                  type="button"
                  onClick={() => onSortChange(sortKey === 'confidence' ? 'urgent' : 'confidence')}
                  className="flex items-center gap-1 hover:text-foreground cursor-pointer transition-colors"
                >
                  <span>Confidence</span>
                  <ArrowUpDown className="size-3" />
                </button>
              </th>
              <th className="px-4">
                <button
                  type="button"
                  onClick={() => onSortChange(sortKey === 'incidents' ? 'urgent' : 'incidents')}
                  className="flex items-center gap-1 hover:text-foreground cursor-pointer transition-colors"
                >
                  <span>Basis</span>
                  <ArrowUpDown className="size-3" />
                </button>
              </th>
              <th className="px-3">
                <button
                  type="button"
                  onClick={() =>
                    onSortChange(sortKey === 'last_incident' ? 'urgent' : 'last_incident')
                  }
                  className="flex items-center gap-1 hover:text-foreground cursor-pointer transition-colors"
                >
                  <span>Last Incident</span>
                  <ArrowUpDown className="size-3" />
                </button>
              </th>
              <th className="px-3">Status</th>
              <th className="w-28 px-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {paginatedSegments.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center">
                  <EmptyState
                    icon={Search}
                    title="No segments match your filters"
                    description="Try clearing search or relaxing priority / confidence filters"
                  />
                </td>
              </tr>
            ) : (
              paginatedSegments.map((s, idx) => {
                const isSelected = selectedSegmentIds.has(s.id);
                const rankNum = startIdx + idx + 1;

                return (
                  <tr
                    key={s.id}
                    onClick={() => onRowClick(s)}
                    className={cn(
                      'h-14 transition-colors cursor-pointer group',
                      isSelected
                        ? 'bg-primary/5 hover:bg-primary/8 dark:bg-primary/10'
                        : 'hover:bg-muted/40'
                    )}
                  >
                    {/* Checkbox */}
                    <td
                      className="px-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(s.id)}
                        className="rounded border-border text-primary focus:ring-primary size-4 cursor-pointer align-middle"
                        aria-label={`Select segment ${formatId(s.id)}`}
                      />
                    </td>

                    {/* Rank */}
                    <td className="px-3 text-center font-semibold text-muted-foreground tabular-nums">
                      #{rankNum}
                    </td>

                    {/* Segment & End assets */}
                    <td className="px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-foreground">
                            {formatId(s.id)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="font-mono">{formatId(s.from)}</span>
                          <span className="text-muted-foreground/60">→</span>
                          <span className="font-mono">{formatId(s.to)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Route */}
                    <td className="px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted border border-border/80 text-foreground">
                        {s.route}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="px-3 whitespace-nowrap">
                      <PriorityBadge priority={s.priority} size="sm" />
                    </td>

                    {/* Confidence Meter (Neutral/Primary tones only) */}
                    <td className="px-3 whitespace-nowrap">
                      <RiskConfidenceMeter confidence={s.confidence} size="sm" />
                    </td>

                    {/* Basis */}
                    <td className="px-4 text-xs text-muted-foreground max-w-[200px] truncate" title={s.basis}>
                      {s.basis}
                    </td>

                    {/* Last Incident relative time with absolute tooltip */}
                    <td className="px-3 whitespace-nowrap">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <span className="text-xs text-foreground cursor-help underline decoration-dotted decoration-muted-foreground/40">
                              {s.lastIncidentTime || '2h ago'}
                            </span>
                          }
                        />
                        <TooltipContent>
                          Incident timestamp: Oct 28, 2026, 08:30 MYT
                        </TooltipContent>
                      </Tooltip>
                    </td>

                    {/* Status */}
                    <td className="px-3 whitespace-nowrap">
                      {s.status === 'investigating' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/30">
                          <ShieldAlert className="size-3" />
                          Investigating
                        </span>
                      ) : s.status === 'dismissed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border line-through">
                          <CheckCircle2 className="size-3" />
                          Dismissed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-foreground border border-border">
                          To inspect
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td
                      className="px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {s.status !== 'dismissed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onInvestigate(s)}
                            className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                            title="Investigate segment"
                          >
                            Investigate
                          </Button>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-7 p-0 text-muted-foreground hover:text-foreground"
                                aria-label={`Actions for segment ${s.id}`}
                              >
                                <MoreVertical className="size-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-44 z-50">
                            <DropdownMenuItem onClick={() => onShowOnMap(s)} className="cursor-pointer gap-2">
                              <Compass className="size-4 text-primary" />
                              <span>Show on map</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onRowClick(s)} className="cursor-pointer gap-2">
                              <ExternalLink className="size-4 text-muted-foreground" />
                              <span>View details</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {s.status !== 'dismissed' ? (
                              <DropdownMenuItem
                                onClick={() => onDismiss(s)}
                                className="cursor-pointer gap-2 text-muted-foreground hover:text-foreground"
                              >
                                <CheckCircle2 className="size-4" />
                                <span>Dismiss segment</span>
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Footer with pagination and rows per page (Section 5.10) */}
      {segments.length > 0 && (
        <div className="p-3 sm:px-4 sm:py-3 border-t border-border flex flex-wrap items-center justify-between gap-3 bg-muted/30">
          <div className="text-xs text-muted-foreground">
            Showing{' '}
            <span className="font-semibold text-foreground">
              {startIdx + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-foreground">
              {Math.min(currentPage * itemsPerPage, segments.length)}
            </span>{' '}
            of <span className="font-semibold text-foreground">{segments.length}</span> segments
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Rows per page</span>
              <div className="relative h-8 bg-card border border-border hover:bg-muted transition-colors rounded-lg flex items-center">
                <select
                  className="h-full pl-2.5 pr-7 bg-transparent text-xs font-semibold text-foreground cursor-pointer outline-none appearance-none"
                  value={itemsPerPage}
                  onChange={(e) => {
                    onItemsPerPageChange(Number(e.target.value));
                    onPageChange(1);
                  }}
                  aria-label="Rows per page"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown className="absolute right-1.5 size-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'p-0 flex items-center justify-center rounded-lg border border-border/60 hover:bg-muted',
                  isTablet ? 'size-10' : 'size-8'
                )}
                disabled={currentPage === 1}
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </Button>

              <div className="text-xs font-medium text-foreground px-2 tabular-nums">
                Page {currentPage} of {totalPages || 1}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'p-0 flex items-center justify-center rounded-lg border border-border/60 hover:bg-muted',
                  isTablet ? 'size-10' : 'size-8'
                )}
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
