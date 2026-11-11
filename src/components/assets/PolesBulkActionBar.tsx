import React from 'react';
import { Download, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useUiMode } from '@/hooks/useUiMode';
import { cn } from '@/lib/utils';
import type { PolePermissions } from '@/lib/permissions';

export interface PolesBulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  isAllResultsSelected: boolean;
  onSelectAllResults: () => void;
  onExportSelected: () => void;
  onBulkDelete?: () => void;
  onClear: () => void;
  permissions: PolePermissions;
}

export const PolesBulkActionBar: React.FC<PolesBulkActionBarProps> = ({
  selectedCount,
  totalCount,
  isAllResultsSelected,
  onSelectAllResults,
  onExportSelected,
  onBulkDelete,
  onClear,
  permissions,
}) => {
  const { isTablet } = useUiMode();

  if (selectedCount === 0) return null;

  return (
    <div
      role="region"
      aria-label="Bulk actions toolbar"
      className={cn(
        'fixed left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200',
        isTablet ? 'bottom-8' : 'bottom-6'
      )}
    >
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 sm:gap-3 rounded-full bg-card border border-border shadow-2xl text-card-foreground',
          isTablet ? 'px-5 py-3' : 'px-4 py-2.5'
        )}
      >
        <div className="flex items-center gap-2 pr-2 border-r border-border">
          <span className="flex items-center justify-center size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold tabular-nums">
            {selectedCount}
          </span>
          <span className="text-xs font-semibold whitespace-nowrap">selected</span>

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

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportSelected}
            className={cn(
              'gap-1.5 border-border hover:bg-muted/80 cursor-pointer',
              isTablet ? 'h-11 px-4 text-sm' : 'h-8 px-2.5 text-xs'
            )}
          >
            <Download className="size-3.5 text-muted-foreground" />
            <span>Export selected</span>
          </Button>

          {permissions.canBulkDelete && onBulkDelete ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkDelete}
              className={cn(
                'gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 cursor-pointer',
                isTablet ? 'h-11 px-4 text-sm' : 'h-8 px-2.5 text-xs'
              )}
            >
              <Trash2 className="size-3.5" />
              <span>Delete selected</span>
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="inline-flex">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className={cn(
                        'gap-1.5 border-border opacity-60',
                        isTablet ? 'h-11 px-4 text-sm' : 'h-8 px-2.5 text-xs'
                      )}
                    >
                      <Trash2 className="size-3.5" />
                      <span>Delete selected</span>
                    </Button>
                  </span>
                }
              />
              <TooltipContent className="text-xs">
                {permissions.bulkDeleteDisabledReason || 'Not available yet'}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="pl-1 border-l border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className={cn(
              'p-0 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer',
              isTablet ? 'size-11 min-w-[44px] min-h-[44px]' : 'size-7'
            )}
            aria-label="Clear selection"
            title="Clear selection"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
