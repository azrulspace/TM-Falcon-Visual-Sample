import React, { useState } from 'react';
import {
  UserPlus,
  Download,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUiMode } from '@/contexts/UiModeContext';
import { cn } from '@/lib/utils';
import { AssignPopover } from './AssignPopover';
import type { AssigneeType } from '@/types/cases';

export interface CaseBulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  isAllResultsSelected: boolean;
  onSelectAllResults: () => void;
  onAssign: (assignee: string | null, assigneeType: AssigneeType) => void;
  onExportSelected: () => void;
  onClear: () => void;
}

export const CaseBulkActionBar: React.FC<CaseBulkActionBarProps> = ({
  selectedCount,
  totalCount,
  isAllResultsSelected,
  onSelectAllResults,
  onAssign,
  onExportSelected,
  onClear,
}) => {
  const { isTablet } = useUiMode();
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div
      role="region"
      aria-label="Bulk actions toolbar"
      className={cn(
        "fixed left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200",
        isTablet ? "bottom-8" : "bottom-6"
      )}
    >
      <div className={cn(
        "flex flex-wrap items-center gap-2 sm:gap-3 rounded-full bg-card/95 dark:bg-card/90 backdrop-blur-md border border-border shadow-2xl text-card-foreground",
        isTablet ? "px-5 py-3" : "px-4 py-2.5"
      )}>
        {/* Count indicator */}
        <div className="flex items-center gap-2 pr-2 border-r border-border">
          <span className="flex items-center justify-center size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold tabular-nums">
            {selectedCount}
          </span>
          <span className="text-xs font-semibold whitespace-nowrap">
            selected
          </span>

          {!isAllResultsSelected && selectedCount < totalCount && (
            <button
              type="button"
              onClick={onSelectAllResults}
              className="text-xs text-primary hover:underline font-medium whitespace-nowrap ml-1 cursor-pointer"
            >
              Select all {totalCount}
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Assign Popover Trigger */}
          <AssignPopover
            open={isAssignOpen}
            onOpenChange={setIsAssignOpen}
            onAssign={(name, type) => {
              onAssign(name, type);
              setIsAssignOpen(false);
            }}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "gap-1.5 border-border hover:bg-primary/10 hover:text-primary cursor-pointer",
                  isTablet ? "h-11 px-4 text-sm" : "h-8 px-2.5 text-xs"
                )}
                title="Assign selected cases"
              >
                <UserPlus className="size-4 text-primary" />
                <span>Assign</span>
              </Button>
            }
          />

          {/* Export Selected Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onExportSelected}
            className={cn(
              "gap-1.5 border-border hover:bg-muted/80 cursor-pointer",
              isTablet ? "h-11 px-4 text-sm" : "h-8 px-2.5 text-xs"
            )}
            title="Export selected cases as CSV"
          >
            <Download className="size-4 text-muted-foreground" />
            <span>Export selected</span>
          </Button>
        </div>

        {/* Clear selection */}
        <div className="pl-1 border-l border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className={cn(
              "p-0 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer",
              isTablet ? "size-11 min-w-[44px] min-h-[44px]" : "size-7"
            )}
            title="Clear selection"
            aria-label="Clear selection"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
