import React from 'react';
import {
  CheckCheck,
  Briefcase,
  Download,
  X,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEvents } from '@/contexts/EventsContext';
import { useToast } from '@/contexts/ToastContext';

export interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  isAllResultsSelected: boolean;
  onSelectAllResults: () => void;
  onAcknowledge: () => void;
  onAssign?: () => void;
  onCreateCase: () => void;
  onDismiss?: () => void;
  onExport: () => void;
  onClear: () => void;
}

import { useUiMode } from '@/hooks/useUiMode';

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  totalCount,
  isAllResultsSelected,
  onSelectAllResults,
  onAcknowledge,
  onCreateCase,
  onExport,
  onClear,
}) => {
  const { isTablet } = useUiMode();
  const { undoLastAction, canUndo } = useEvents();
  const { addToast } = useToast();

  if (selectedCount === 0) return null;

  const handleUndo = () => {
    undoLastAction();
    addToast('info', 'Bulk action undone successfully');
  };

  return (
    <div
      role="region"
      aria-label="Bulk actions toolbar"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className={`flex flex-wrap items-center gap-2 sm:gap-3 ${isTablet ? 'px-4 py-3' : 'px-4 py-2.5'} rounded-2xl sm:rounded-full bg-card border border-border shadow-2xl text-card-foreground`}>
        {/* Count indicator */}
        <div className="flex items-center gap-2 pr-2 border-r border-border">
          <span className={`flex items-center justify-center ${isTablet ? 'size-7 text-xs font-bold' : 'size-6 text-xs font-bold'} rounded-full bg-primary text-primary-foreground tabular-nums`}>
            {selectedCount}
          </span>
          <span className={`${isTablet ? 'text-sm font-semibold' : 'text-xs font-semibold'} whitespace-nowrap`}>
            selected
          </span>

          {!isAllResultsSelected && selectedCount < totalCount && (
            <button
              type="button"
              onClick={onSelectAllResults}
              className={`${isTablet ? 'text-sm min-h-[44px] flex items-center' : 'text-xs'} text-primary hover:underline font-medium whitespace-nowrap ml-1 cursor-pointer`}
            >
              Select all {totalCount}
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={onAcknowledge}
            className={`${isTablet ? 'h-[44px] px-3.5 text-sm gap-2' : 'h-8 px-2.5 text-xs gap-1.5'} border-border hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer`}
            title="Acknowledge selected events"
          >
            <CheckCheck className={`${isTablet ? 'size-4' : 'size-3.5'} text-emerald-500`} />
            <span>Acknowledge</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onCreateCase}
            className={`${isTablet ? 'h-[44px] px-3.5 text-sm gap-2' : 'h-8 px-2.5 text-xs gap-1.5'} border-border hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer`}
            title="Create case for selected events"
          >
            <Briefcase className={`${isTablet ? 'size-4' : 'size-3.5'} text-amber-500`} />
            <span>Create case</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className={`${isTablet ? 'h-[44px] px-3.5 text-sm gap-2' : 'h-8 px-2.5 text-xs gap-1.5'} border-border text-foreground hover:bg-muted cursor-pointer`}
            title="Export selected as CSV"
          >
            <Download className={`${isTablet ? 'size-4' : 'size-3.5'} text-muted-foreground`} />
            <span>Export selected</span>
          </Button>

          {canUndo && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              className={`${isTablet ? 'h-[44px] px-3 text-sm' : 'h-8 px-2 text-xs'} text-amber-500 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/15`}
              title="Undo last action"
            >
              <RotateCcw className="size-3.5 mr-1" />
              <span>Undo</span>
            </Button>
          )}

          <div className="w-px h-5 bg-border mx-1" />

          {/* Clear button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className={`${isTablet ? 'size-11' : 'size-7'} p-0 rounded-full text-muted-foreground hover:text-foreground cursor-pointer`}
            title="Clear selection"
            aria-label="Clear selection"
          >
            <X className={isTablet ? 'size-5' : 'size-4'} />
          </Button>
        </div>
      </div>
    </div>
  );
};
