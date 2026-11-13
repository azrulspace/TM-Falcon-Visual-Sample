import React from 'react';
import { Download, Activity, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useUiMode } from '@/hooks/useUiMode';
import { cn } from '@/lib/utils';
import type { DevicePermissions } from '@/lib/permissions';

export interface DevicesBulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  isAllResultsSelected: boolean;
  onSelectAllResults: () => void;
  onExportSelected: () => void;
  onBulkCheck?: () => void;
  onClear: () => void;
  permissions: DevicePermissions;
}

export const DevicesBulkActionBar: React.FC<DevicesBulkActionBarProps> = ({
  selectedCount,
  totalCount,
  isAllResultsSelected,
  onSelectAllResults,
  onExportSelected,
  onBulkCheck,
  onClear,
  permissions,
}) => {
  const { isTablet } = useUiMode();

  if (selectedCount === 0) return null;

  return (
    <div
      role="region"
      aria-label="Bulk device actions toolbar"
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

          {permissions.canBulkDeviceActions && onBulkCheck ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkCheck}
              className={cn(
                'gap-1.5 border-border hover:bg-muted/80 cursor-pointer',
                isTablet ? 'h-11 px-4 text-sm' : 'h-8 px-2.5 text-xs'
              )}
            >
              <Activity className="size-3.5 text-primary" />
              <span>Run health check</span>
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
                        'gap-1.5 border-border opacity-60 cursor-not-allowed',
                        isTablet ? 'h-11 px-4 text-sm' : 'h-8 px-2.5 text-xs'
                      )}
                    >
                      <Activity className="size-3.5" />
                      <span>Run health check</span>
                    </Button>
                  </span>
                }
              />
              <TooltipContent className="text-xs max-w-xs">
                {permissions.bulkActionsDisabledReason ||
                  'Not available yet — bulk device action endpoint required'}
              </TooltipContent>
            </Tooltip>
          )}

          <button
            type="button"
            onClick={onClear}
            className={cn(
              'ml-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center justify-center',
              isTablet ? 'size-10' : 'size-7'
            )}
            aria-label="Clear selection"
            title="Clear selection"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

