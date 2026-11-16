import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppContext } from '@/contexts/AppContext';
import type { ReportPermissions } from '@/lib/permissions';

export interface ReportsPageHeaderProps {
  title?: string;
  subtitle?: string;
  activeTab?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onNewSchedule?: () => void;
  permissions: ReportPermissions;
}

export const ReportsPageHeader: React.FC<ReportsPageHeaderProps> = ({
  title = 'Reports',
  subtitle = 'Ready made reports for operations, management and review.',
  onRefresh,
  isRefreshing = false,
  onNewSchedule,
  permissions,
}) => {
  const { previewDataMode } = useAppContext();

  return (
    <div className="flex flex-col gap-2 mb-4 select-none">
      {/* Breadcrumb: Falcon / Reports */}
      <nav
        className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium"
        aria-label="Breadcrumb"
      >
        <Link to="/overview" className="hover:text-foreground transition-colors">
          Falcon
        </Link>
        <ChevronRight className="size-3 text-muted-foreground/60" />
        <span className="text-foreground font-semibold">Reports</span>
      </nav>

      {/* Main Title Row & Right Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {previewDataMode && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                Preview data
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{subtitle}</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Refresh Action */}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-8 text-xs border-border bg-card hover:bg-muted cursor-pointer gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}

          {/* Schedule Report Action */}
          {onNewSchedule && (
            <Tooltip>
              <TooltipTrigger render={
                <span className="inline-flex">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!permissions.canScheduleReports}
                    onClick={onNewSchedule}
                    className="h-8 text-xs border-border bg-card hover:bg-muted cursor-pointer gap-1.5"
                  >
                    <Clock className="size-3.5 text-primary" />
                    <span>Schedule report</span>
                  </Button>
                </span>
              } />
              {permissions.scheduleDisabledReason && (
                <TooltipContent side="bottom" className="text-xs max-w-xs">
                  {permissions.scheduleDisabledReason}
                </TooltipContent>
              )}
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};
