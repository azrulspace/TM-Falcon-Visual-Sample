import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RefreshCw, Download, Plus, ChevronRight, Compass, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import { useUiMode } from '@/hooks/useUiMode';
import { cn } from '@/lib/utils';

export interface DevicesPageHeaderProps {
  title?: string;
  subtitle?: string;
  moduleBreadcrumbLabel?: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  onExport: () => void;
  exportDisabled?: boolean;
  onRegisterDevice?: () => void;
  conflictCount?: number;
  showRegisterAction?: boolean;
}

export const DevicesPageHeader: React.FC<DevicesPageHeaderProps> = ({
  title = 'Devices',
  subtitle = 'Cameras and speakers registered on a site.',
  moduleBreadcrumbLabel = 'Devices',
  isRefreshing,
  onRefresh,
  onExport,
  exportDisabled = false,
  onRegisterDevice,
  conflictCount = 0,
  showRegisterAction = true,
}) => {
  const navigate = useNavigate();
  const { previewDataMode } = useAppContext();
  const { isTablet } = useUiMode();

  return (
    <div className="flex flex-col gap-2 mb-4 select-none">
      {/* Breadcrumb from navigation config: Falcon / Assets and devices / Devices */}
      <nav
        className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium"
        aria-label="Breadcrumb"
      >
        <Link to="/overview" className="hover:text-foreground transition-colors">
          Falcon
        </Link>
        <ChevronRight className="size-3 text-muted-foreground/60" />
        <Link to="/assets/poles" className="hover:text-foreground transition-colors">
          Assets and devices
        </Link>
        <ChevronRight className="size-3 text-muted-foreground/60" />
        <span className="text-foreground font-semibold">{moduleBreadcrumbLabel}</span>
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

        {/* Right Actions: Refresh, Export, Vendor discovery (with badge), Register device (primary blue) */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              'gap-1.5 border-border bg-card hover:bg-muted font-medium cursor-pointer',
              isTablet ? 'h-11 px-4 text-sm' : 'h-8 px-3 text-xs'
            )}
            title="Refresh devices telemetry"
          >
            <RefreshCw
              className={cn(
                'size-3.5',
                isRefreshing ? 'animate-spin text-primary' : 'text-muted-foreground'
              )}
            />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={exportDisabled}
            className={cn(
              'gap-1.5 border-border bg-card hover:bg-muted font-medium cursor-pointer',
              isTablet ? 'h-11 px-4 text-sm' : 'h-8 px-3 text-xs'
            )}
            title={exportDisabled ? 'No devices match current filter criteria' : 'Export visible devices as CSV'}
          >
            <Download className="size-3.5 text-muted-foreground" />
            <span>Export</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/assets/devices/vendor-discovery')}
            className={cn(
              'gap-1.5 border-border bg-card hover:bg-muted font-medium cursor-pointer relative',
              isTablet ? 'h-11 px-4 text-sm' : 'h-8 px-3 text-xs'
            )}
            title="Inspect devices held by vendor vs FALCON registry"
          >
            <Compass className="size-3.5 text-muted-foreground" />
            <span>Vendor discovery</span>
            {conflictCount > 0 && (
              <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25">
                <AlertCircle className="size-2.5" />
                <span>{conflictCount}</span>
              </span>
            )}
          </Button>

          {showRegisterAction && (
            <Button
              size="sm"
              onClick={onRegisterDevice || (() => navigate('/assets/devices/new'))}
              className={cn(
                'gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer',
                isTablet ? 'h-11 px-4 text-sm' : 'h-8 px-3 text-xs'
              )}
            >
              <Plus className="size-3.5" />
              <span>Register device</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
