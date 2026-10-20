import React from 'react';
import {
  CheckCheck,
  Briefcase,
  UserCheck,
  XCircle,
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
  onAssign: () => void;
  onCreateCase: () => void;
  onDismiss: () => void;
  onExport: () => void;
  onClear: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  totalCount,
  isAllResultsSelected,
  onSelectAllResults,
  onAcknowledge,
  onAssign,
  onCreateCase,
  onDismiss,
  onExport,
  onClear,
}) => {
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
          <Button
            variant="outline"
            size="sm"
            onClick={onAcknowledge}
            className="h-8 px-2.5 text-xs gap-1.5 border-border hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"
            title="Acknowledge selected events"
          >
            <CheckCheck className="size-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Acknowledge</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onAssign}
            className="h-8 px-2.5 text-xs gap-1.5 border-border hover:bg-primary/10 hover:text-primary"
            title="Assign selected events to analyst"
          >
            <UserCheck className="size-3.5 text-primary" />
            <span className="hidden sm:inline">Assign</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onCreateCase}
            className="h-8 px-2.5 text-xs gap-1.5 border-border hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
            title="Bundle selected events into a case"
          >
            <Briefcase className="size-3.5 text-amber-500" />
            <span className="hidden sm:inline">Create case</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onDismiss}
            className="h-8 px-2.5 text-xs gap-1.5 border-border hover:bg-red-500/10 hover:text-red-500"
            title="Dismiss selected as false positive"
          >
            <XCircle className="size-3.5 text-red-500" />
            <span className="hidden sm:inline">Dismiss</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onExport}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            title="Export selected as CSV"
          >
            <Download className="size-3.5" />
          </Button>

          {canUndo && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              className="h-8 px-2 text-xs text-amber-500 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/15"
              title="Undo last action"
            >
              <RotateCcw className="size-3.5 mr-1" />
              <span>Undo</span>
            </Button>
          )}

          <div className="w-px h-4 bg-border mx-1" />

          {/* Clear button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="size-7 p-0 rounded-full text-muted-foreground hover:text-foreground"
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
