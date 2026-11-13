import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Download, Plus, ChevronRight, Radar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppContext } from '@/contexts/AppContext';
import { useUiMode } from '@/hooks/useUiMode';
import { cn } from '@/lib/utils';
import type { DevicePermissions } from '@/lib/permissions';

export interface DevicesPageHeaderProps {
  title?: string;
  subtitle?: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  onExport: () => void;
  exportDisabled?: boolean;
  onOpenVendorDiscovery: () => void;
  vendorConflictCount: number;
  vendorUnregisteredCount: number;
  onRegisterDevice: () => void;
  permissions: DevicePermissions;
}

export const DevicesPageHeader: React.FC<DevicesPageHeaderProps> = ({
  title = 'Devices',
  subtitle = 'Cameras, speakers, LiDAR sensors, and gateways registered across sites.',
  isRefreshing,
  onRefresh,
  onExport,
  exportDisabled = false,
  onOpenVendorDiscovery,
  vendorConflictCount,
  vendorUnregisteredCount,
  onRegisterDevice,
  permissions,
}) => {
  const { previewDataMode } = useAppContext();
  const { isTablet } = useUiMode();

  return (
    <div className="flex flex-col gap-2 mb-4 select-none">
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
        <span className="text-foreground font-semibold">Devices</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            {previewDataMode && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                Preview data
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{subtitle}</p>
        </div>

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
            title="Refresh devices list"
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
            onClick={onOpenVendorDiscovery}
            className={cn(
              'gap-1.5 border-border bg-card hover:bg-muted font-medium cursor-pointer',
              isTablet ? 'h-11 px-4 text-sm' : 'h-8 px-3 text-xs'
            )}
            title="Inspect vendor discovery matches, conflicts, and unregistered Edge hardware"
          >
            <Radar className="size-3.5 text-primary shrink-0" />
            <span>Vendor discovery</span>
            {vendorConflictCount > 0 && (
              <span
                className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
                title={`${vendorConflictCount} vendor mapping conflict`}
              >
                {vendorConflictCount}
              </span>
            )}
            {vendorConflictCount === 0 && vendorUnregisteredCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-primary/15 text-primary border border-primary/30">
                {vendorUnregisteredCount}
              </span>
            )}
          </Button>

          {permissions.canRegisterDevice ? (
            <Button
              size="sm"
              onClick={onRegisterDevice}
              className={cn(
                'gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer',
                isTablet ? 'h-11 px-4 text-sm' : 'h-8 px-3 text-xs'
              )}
            >
              <Plus className="size-3.5" />
              <span>Register device</span>
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="inline-flex">
                    <Button
                      size="sm"
                      disabled
                      className={cn(
                        'gap-1.5 font-semibold',
                        isTablet ? 'h-11 px-4 text-sm' : 'h-8 px-3 text-xs'
                      )}
                    >
                      <Plus className="size-3.5" />
                      <span>Register device</span>
                    </Button>
                  </span>
                }
              />
              <TooltipContent className="text-xs">
                {permissions.registerDisabledReason || 'Permission required'}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};

