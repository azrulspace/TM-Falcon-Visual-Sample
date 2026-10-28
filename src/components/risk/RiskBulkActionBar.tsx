import React from 'react';
import {
  Download,
  X,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useUiMode } from '@/hooks/useUiMode';

export interface RiskBulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onExportSelected: () => void;
  onClear: () => void;
}

export const RiskBulkActionBar: React.FC<RiskBulkActionBarProps> = ({
  selectedCount,
  onExportSelected,
  onClear,
}) => {
  const { isTablet } = useUiMode();

  if (selectedCount === 0) return null;

  return (
    <div
      role="region"
      aria-label="Risk segments bulk actions toolbar"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div
        className={`flex flex-wrap items-center gap-2 sm:gap-3 ${
          isTablet ? 'px-4 py-3' : 'px-4 py-2.5'
        } rounded-2xl sm:rounded-full bg-card/95 dark:bg-card/90 backdrop-blur-md border border-border shadow-2xl text-card-foreground`}
      >
        {/* Count indicator */}
        <div className="flex items-center gap-2 pr-2 border-r border-border">
          <span
            className={`flex items-center justify-center ${
              isTablet ? 'size-7 text-xs font-bold' : 'size-6 text-xs font-bold'
            } rounded-full bg-primary text-primary-foreground tabular-nums`}
          >
            {selectedCount}
          </span>
          <span
            className={`${
              isTablet ? 'text-sm font-semibold' : 'text-xs font-semibold'
            } whitespace-nowrap`}
          >
            selected
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Investigate Selected (Disabled per Section 5.10 hard constraint: endpoint does not exist) */}
          <Tooltip>
            <TooltipTrigger
              render={
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className={`${
                      isTablet ? 'h-[44px] px-3.5 text-sm gap-2' : 'h-8 px-2.5 text-xs gap-1.5'
                    } border-border opacity-50 cursor-not-allowed`}
                  >
                    <ShieldAlert className={`${isTablet ? 'size-4' : 'size-3.5'} text-primary`} />
                    <span>Investigate selected</span>
                  </Button>
                </span>
              }
            />
            <TooltipContent>
              Bulk investigation endpoint is not supported yet by the v1 API.
            </TooltipContent>
          </Tooltip>

          {/* Dismiss Selected (Disabled per Section 5.10 hard constraint: endpoint does not exist) */}
          <Tooltip>
            <TooltipTrigger
              render={
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className={`${
                      isTablet ? 'h-[44px] px-3.5 text-sm gap-2' : 'h-8 px-2.5 text-xs gap-1.5'
                    } border-border opacity-50 cursor-not-allowed`}
                  >
                    <CheckCircle2 className={`${isTablet ? 'size-4' : 'size-3.5'} text-muted-foreground`} />
                    <span>Dismiss selected</span>
                  </Button>
                </span>
              }
            />
            <TooltipContent>
              Bulk dismissal endpoint is not supported yet by the v1 API.
            </TooltipContent>
          </Tooltip>

          {/* Export Selected (Backed by local dataset exporter) */}
          <Button
            variant="outline"
            size="sm"
            onClick={onExportSelected}
            className={`${
              isTablet ? 'h-[44px] px-3.5 text-sm gap-2' : 'h-8 px-2.5 text-xs gap-1.5'
            } border-border hover:bg-muted cursor-pointer`}
          >
            <Download className={`${isTablet ? 'size-4' : 'size-3.5'}`} />
            <span>Export selected</span>
          </Button>

          {/* Clear Selection */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className={`${
              isTablet ? 'h-[44px] px-3.5 text-sm gap-2' : 'h-8 px-2 text-xs gap-1'
            } text-muted-foreground hover:text-foreground cursor-pointer`}
          >
            <X className={`${isTablet ? 'size-4' : 'size-3.5'}`} />
            <span>Clear</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
