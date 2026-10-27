import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Copy,
  Inbox,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
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
import { CaseStatusBadge } from '@/components/common/CaseStatusBadge';
import { AssigneeCell } from '@/components/common/AssigneeCell';
import { DeviceChip } from '@/components/common/DeviceChip';
import { AssetChip } from '@/components/common/AssetChip';
import { RelativeTime } from '@/components/common/RelativeTime';
import { AssignPopover } from './AssignPopover';
import { useCases } from '@/contexts/CasesContext';
import { useToast } from '@/contexts/ToastContext';
import { useUiMode } from '@/contexts/UiModeContext';
import { cn } from '@/lib/utils';
import { getCaseAge, type CaseSortKey, type SortDirection } from '@/data/caseSelectors';
import { getServerNow } from '@/lib/dateTime';
import type { AssigneeType, CaseWithSourceEvent } from '@/types/cases';

export interface CaseTableViewProps {
  cases: CaseWithSourceEvent[];
  totalFilteredCount: number;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAllPage: (all: boolean, pageIds: string[]) => void;
  sortKey: CaseSortKey;
  sortDir: SortDirection;
  onSort: (key: CaseSortKey) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  rowsPerPage: number;
  setRowsPerPage: (r: number) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

interface SortHeaderProps {
  label: string;
  fieldKey: CaseSortKey;
  className?: string;
  sortKey: CaseSortKey;
  sortDir: SortDirection;
  onSort: (key: CaseSortKey) => void;
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
      onClick={() => onSort(fieldKey)}
      className={cn(
        'text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3 select-none cursor-pointer hover:bg-muted/40 transition-colors group',
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

export const CaseTableView: React.FC<CaseTableViewProps> = ({
  cases,
  totalFilteredCount,
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
  isLoading = false,
  isError = false,
  onRetry,
}) => {
  const navigate = useNavigate();
  const { assignCase } = useCases();
  const { addToast } = useToast();
  const { isTablet, orientation } = useUiMode();
  const isPortrait = isTablet && orientation === 'portrait';
  const now = getServerNow();

  // Active popover state for individual rows
  const [rowAssignId, setRowAssignId] = useState<string | null>(null);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / rowsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * rowsPerPage;
  const pageCases = cases.slice(startIndex, startIndex + rowsPerPage);
  const pageIds = pageCases.map((c) => c.id);

  const isAllPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const isSomePageSelected = pageIds.some((id) => selectedIds.has(id)) && !isAllPageSelected;

  const handleCopyLink = (caseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/cases/${caseId}`;
    navigator.clipboard.writeText(url).then(
      () => addToast('success', `Copied link to ${caseId}`),
      () => addToast('error', 'Failed to copy link')
    );
  };

  const handleRowAssign = async (caseId: string, assignee: string | null, assigneeType: AssigneeType) => {
    await assignCase(caseId, assignee, assigneeType);
    setRowAssignId(null);
  };

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-12 text-center shadow-xs">
        <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="size-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">Failed to load cases</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
          There was an error communicating with the cases endpoint. Please try again.
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="gap-2 text-xs">
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
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 py-2 animate-pulse">
              <div className="size-4 bg-muted rounded" />
              <div className="w-20 h-4 bg-muted rounded" />
              <div className="w-48 h-4 bg-muted rounded" />
              <div className="w-16 h-4 bg-muted rounded" />
              <div className="w-24 h-4 bg-muted rounded" />
              <div className="w-24 h-4 bg-muted rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Inbox className="size-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">No matching cases</h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-4">
            Cases are created from an event with the Create case action. Open an event in the Event inbox to start one.
          </p>
          <Button
            onClick={() => navigate('/events')}
            className="gap-1.5 text-xs font-semibold"
          >
            <span>Go to Event inbox</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Table Container */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {/* Desktop & Tablet Table */}
        <div className={cn("overflow-x-auto", isPortrait ? "hidden" : "block")}>
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted/40 sticky top-0 z-10 border-b border-border text-muted-foreground">
              <tr>
                {/* Checkbox column with 44px hit-area */}
                <th className="w-12 py-2 px-2">
                  <div
                    className="size-11 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isAllPageSelected ? true : isSomePageSelected ? 'indeterminate' : false}
                      onCheckedChange={(checked) => onSelectAllPage(!!checked, pageIds)}
                      aria-label="Select all cases on page"
                    />
                  </div>
                </th>

                {/* Case Column */}
                <SortHeader
                  label="Case"
                  fieldKey="case"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                  className="min-w-[190px]"
                />

                {/* Source event Column */}
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3 min-w-[130px]">
                  Source event
                </th>

                {/* Asset Column (hidden on tablet or <1536px where it merges under Source event) */}
                <th className={cn("text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3 min-w-[100px]", isTablet ? "hidden" : "hidden 2xl:table-cell")}>
                  Asset
                </th>

                {/* Device Column (hidden on tablet or <1536px where it merges under Source event) */}
                <th className={cn("text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3 min-w-[100px]", isTablet ? "hidden" : "hidden 2xl:table-cell")}>
                  Device
                </th>

                {/* Status Column */}
                <SortHeader
                  label="Status"
                  fieldKey="status"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                  className="min-w-[110px]"
                />

                {/* Assignees Column */}
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3 min-w-[140px]">
                  Assignees
                </th>

                {/* Created Column */}
                <SortHeader
                  label="Created"
                  fieldKey="created"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                  className="min-w-[110px]"
                />

                {/* Age Column (hidden on 1024-1279px where relative time tooltip serves it) */}
                <SortHeader
                  label="Age"
                  fieldKey="age"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                  className="hidden xl:table-cell min-w-[90px]"
                />

                {/* Actions Column */}
                <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3 w-24">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border text-xs">
              {pageCases.map((c) => {
                const isSelected = selectedIds.has(c.id);
                const ageInfo = getCaseAge(c, now);
                const isUnassigned = !c.assignee || c.assignee.toLowerCase() === 'unassigned';

                return (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/cases/${c.id}`)}
                    className={cn(
                      'hover:bg-muted/30 cursor-pointer transition-colors group',
                      isTablet ? 'h-16' : 'h-14',
                      isSelected && 'bg-primary/5 hover:bg-primary/10'
                    )}
                  >
                    {/* Checkbox with 44px hit-area */}
                    <td
                      className="py-1 px-1 w-12"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        className="size-11 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
                        onClick={() => onToggleSelect(c.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onToggleSelect(c.id)}
                          aria-label={`Select case ${c.id}`}
                        />
                      </div>
                    </td>

                    {/* Case ID and short title */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col min-w-0 pr-2">
                        <Link
                          to={`/cases/${c.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono text-xs font-semibold text-primary hover:underline shrink-0"
                        >
                          {c.id}
                        </Link>
                        <span className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                          {c.title || c.sourceEvent?.type || 'Incident follow-up'}
                        </span>
                      </div>
                    </td>

                    {/* Source event (with merged Asset & Device at 1280-1439px or tablet) */}
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-1">
                        <Link
                          to={`/events/${c.sourceEventId}`}
                          className="font-mono text-xs text-foreground/85 hover:text-primary hover:underline font-medium"
                        >
                          {c.sourceEventId}
                        </Link>
                        {/* Merged Asset & Device visible on tablet or xl */}
                        <div className={cn("items-center gap-1.5 flex-wrap", isTablet ? "flex" : "hidden xl:flex 2xl:hidden")}>
                          {c.sourceEvent?.asset && (
                            <AssetChip assetId={c.sourceEvent.asset} className="text-[11px] px-1.5 py-0" />
                          )}
                          {c.sourceEvent?.device && (
                            <DeviceChip deviceId={c.sourceEvent.device} className="text-[11px] px-1.5 py-0" />
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Asset (2xl+ only on desktop) */}
                    <td className={cn("py-3 px-3", isTablet ? "hidden" : "hidden 2xl:table-cell")} onClick={(e) => e.stopPropagation()}>
                      {c.sourceEvent?.asset ? (
                        <AssetChip assetId={c.sourceEvent.asset} />
                      ) : (
                        <span className="text-muted-foreground text-[11px]">—</span>
                      )}
                    </td>

                    {/* Device (2xl+ only on desktop) */}
                    <td className={cn("py-3 px-3", isTablet ? "hidden" : "hidden 2xl:table-cell")} onClick={(e) => e.stopPropagation()}>
                      {c.sourceEvent?.device ? (
                        <DeviceChip deviceId={c.sourceEvent.device} />
                      ) : (
                        <span className="text-muted-foreground text-[11px]">—</span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="py-3 px-3">
                      <CaseStatusBadge status={c.status} size="sm" />
                    </td>

                    {/* Assignees */}
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <AssigneeCell
                        assignee={c.assignee}
                        assigneeType={c.assigneeType}
                      />
                    </td>

                    {/* Created (Relative with MYT in tooltip) */}
                    <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                      <RelativeTime date={c.createdAt} showTooltip />
                    </td>

                    {/* Age (Section 6.6: for non closed time since created, for closed time from created to closed) */}
                    <td className="hidden xl:table-cell py-3 px-3 text-muted-foreground tabular-nums whitespace-nowrap">
                      {ageInfo.durationText || '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {/* Quick assign action for unassigned rows */}
                        {isUnassigned && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <AssignPopover
                              currentAssignee={c.assignee}
                              onAssign={(name, type) => handleRowAssign(c.id, name, type)}
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-[11px] gap-1 text-primary hover:bg-primary/10"
                                  title="Quick assign"
                                >
                                  <UserPlus className="size-3.5" />
                                  <span className="hidden sm:inline">Assign</span>
                                </Button>
                              }
                            />
                          </div>
                        )}

                        {/* Row menu (three dots) */}
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "p-0 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground",
                                  isTablet ? "size-11 min-w-[44px] min-h-[44px]" : "size-7"
                                )}
                                aria-label={`Actions for case ${c.id}`}
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-48 bg-popover border border-border shadow-xl z-50 text-xs">
                            <DropdownMenuItem
                              onClick={() => navigate(`/cases/${c.id}`)}
                              className={cn("gap-2 cursor-pointer", isTablet ? "h-12 text-sm" : "h-8 text-xs")}
                            >
                              <ExternalLink className="size-3.5 text-muted-foreground" />
                              <span>View case</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => navigate(`/events/${c.sourceEventId}`)}
                              className={cn("gap-2 cursor-pointer", isTablet ? "h-12 text-sm" : "h-8 text-xs")}
                            >
                              <ExternalLink className="size-3.5 text-muted-foreground" />
                              <span>View source event</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => setRowAssignId(c.id)}
                              className={cn("gap-2 cursor-pointer", isTablet ? "h-12 text-sm" : "h-8 text-xs")}
                            >
                              <UserPlus className="size-3.5 text-muted-foreground" />
                              <span>Assign...</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={(e) => handleCopyLink(c.id, e)}
                              className={cn("gap-2 cursor-pointer", isTablet ? "h-12 text-sm" : "h-8 text-xs")}
                            >
                              <Copy className="size-3.5 text-muted-foreground" />
                              <span>Copy link</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Popover triggered from row menu "Assign..." */}
                        {rowAssignId === c.id && (
                          <AssignPopover
                            open={true}
                            onOpenChange={(open) => !open && setRowAssignId(null)}
                            currentAssignee={c.assignee}
                            onAssign={(name, type) => handleRowAssign(c.id, name, type)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Compact List View (Portrait Tablet mode & Phone viewports) */}
        <div className={cn("divide-y divide-border", isPortrait ? "block" : "block lg:hidden")}>
          {pageCases.map((c) => {
            const isSelected = selectedIds.has(c.id);
            return (
              <div
                key={c.id}
                onClick={() => navigate(`/cases/${c.id}`)}
                className={cn(
                  'p-3.5 sm:px-4 flex items-start gap-3 hover:bg-muted/30 cursor-pointer transition-colors',
                  isSelected && 'bg-primary/5'
                )}
              >
                {/* 44px Checkbox Hit Area */}
                <div
                  className="size-11 min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 -mt-1 cursor-pointer shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(c.id);
                  }}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelect(c.id)}
                    aria-label={`Select case ${c.id}`}
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <Link
                        to={`/cases/${c.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-mono text-xs font-semibold text-primary hover:underline shrink-0"
                      >
                        {c.id}
                      </Link>
                      <CaseStatusBadge status={c.status} size="sm" />
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap mr-1">
                        <RelativeTime date={c.createdAt} showTooltip />
                      </span>

                      {/* Card Overflow Menu with 44px hit-area */}
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "p-0 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground",
                                isTablet ? "size-11 min-w-[44px] min-h-[44px]" : "size-8"
                              )}
                              aria-label={`Actions for case ${c.id}`}
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-48 bg-popover border border-border shadow-xl z-50 text-xs">
                          <DropdownMenuItem
                            onClick={() => navigate(`/cases/${c.id}`)}
                            className={cn("gap-2 cursor-pointer", isTablet ? "h-12 text-sm" : "h-8 text-xs")}
                          >
                            <ExternalLink className="size-3.5 text-muted-foreground" />
                            <span>View case</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => navigate(`/events/${c.sourceEventId}`)}
                            className={cn("gap-2 cursor-pointer", isTablet ? "h-12 text-sm" : "h-8 text-xs")}
                          >
                            <ExternalLink className="size-3.5 text-muted-foreground" />
                            <span>View source event</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => setRowAssignId(c.id)}
                            className={cn("gap-2 cursor-pointer", isTablet ? "h-12 text-sm" : "h-8 text-xs")}
                          >
                            <UserPlus className="size-3.5 text-muted-foreground" />
                            <span>Assign...</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={(e) => handleCopyLink(c.id, e)}
                            className={cn("gap-2 cursor-pointer", isTablet ? "h-12 text-sm" : "h-8 text-xs")}
                          >
                            <Copy className="size-3.5 text-muted-foreground" />
                            <span>Copy link</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <p className="text-xs text-foreground font-medium truncate">
                    {c.title || c.sourceEvent?.type || 'Incident follow-up'}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground pt-0.5">
                    <Link
                      to={`/events/${c.sourceEventId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-mono hover:text-primary hover:underline font-medium bg-muted/60 px-1.5 py-0.5 rounded"
                    >
                      {c.sourceEventId}
                    </Link>
                    {c.sourceEvent?.device && (
                      <DeviceChip deviceId={c.sourceEvent.device} className="text-[11px] px-1.5 py-0" />
                    )}
                    {c.sourceEvent?.asset && (
                      <AssetChip assetId={c.sourceEvent.asset} className="text-[11px] px-1.5 py-0" />
                    )}
                    <AssigneeCell assignee={c.assignee} assigneeType={c.assigneeType} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6.6 Footer: Pagination and counts */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-1 text-xs text-muted-foreground">
        <div>
          Showing{' '}
          <span className="font-semibold text-foreground tabular-nums">
            {totalFilteredCount === 0 ? 0 : startIndex + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-foreground tabular-nums">
            {Math.min(startIndex + rowsPerPage, totalFilteredCount)}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-foreground tabular-nums">
            {totalFilteredCount}
          </span>{' '}
          cases
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Rows per page */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={cn(
                "bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer",
                isTablet ? "h-11 px-2.5 text-sm" : "h-7 text-xs px-1.5"
              )}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Page nav */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] tabular-nums text-muted-foreground mr-1">
              Page {validCurrentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage <= 1}
              className={cn("border-border", isTablet ? "size-11 min-w-[44px] min-h-[44px] p-0" : "size-7 p-0")}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage >= totalPages}
              className={cn("border-border", isTablet ? "size-11 min-w-[44px] min-h-[44px] p-0" : "size-7")}
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
