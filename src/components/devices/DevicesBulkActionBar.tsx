import React from 'react';
import { X, Download, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUiMode } from '@/hooks/useUiMode';
import { cn } from '@/lib/utils';

export interface DevicesBulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onExportSelected: () => void;
}

export const DevicesBulkActionBar: React.FC<DevicesBulkActionBarProps> = ({
  selectedCount,
  onClearSelection,
  onExportSelected,
}) => {
  const { isTablet } = useUiMode();

  if (selectedCount === 0) return null;

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-40 shadow-xl border border-border bg-card/95 backdrop-blur-md rounded-2xl px-4 py-2.5 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 select-none max-w-[95vw]',
        isTablet ? 'h-14 px-5 text-sm' : 'h-11 text-xs'
      )}
    >
      <div className="flex items-center gap-2 pr-3 border-r border-border">
        <HardDrive className="size-4 text-primary shrink-0" />
        <span className="font-semibold text-foreground">
          {selectedCount} <span className="font-normal text-muted-foreground">selected</span>
        </span>
        <button
          type="button"
          onClick={onClearSelection}
          className="text-muted-foreground hover:text-foreground ml-1 p-0.5 rounded hover:bg-muted cursor-pointer"
          title="Clear row selection"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onExportSelected}
          className={cn(
            'gap-1.5 border-border bg-card hover:bg-muted font-medium cursor-pointer',
            isTablet ? 'h-10 px-3 text-sm' : 'h-7 px-2.5 text-xs'
          )}
          title="Export only selected devices as CSV"
        >
          <Download className="size-3.5 text-muted-foreground" />
          <span>Export selected</span>
        </Button>
      </div>
    </div>
  );
};
