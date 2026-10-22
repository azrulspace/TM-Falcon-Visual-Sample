import React, { useState } from 'react';
import {
  UserPlus,
  Download,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div
      role="region"
      aria-label="Bulk actions toolbar"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-4 py-2.5 rounded-full bg-card/95 dark:bg-card/90 backdrop-blur-md border border-border shadow-2xl text-card-foreground">
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
                className="h-8 px-2.5 text-xs gap-1.5 border-border hover:bg-primary/10 hover:text-primary cursor-pointer"
                title="Assign selected cases"
              >
                <UserPlus className="size-3.5 text-primary" />
                <span>Assign</span>
              </Button>
            }
          />

          {/* Export Selected Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onExportSelected}
            className="h-8 px-2.5 text-xs gap-1.5 border-border hover:bg-muted/80 cursor-pointer"
            title="Export selected cases as CSV"
          >
            <Download className="size-3.5 text-muted-foreground" />
            <span>Export selected</span>
          </Button>
        </div>

        {/* Clear selection */}
        <div className="pl-1 border-l border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="size-7 p-0 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer"
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
