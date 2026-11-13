import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ArrowLeft,
  Link2,
  Pencil,
  MoreHorizontal,
  Copy,
  ExternalLink,
  Sliders,
  Activity,
  Map as MapIcon,
  AlertTriangle,
  Archive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DeviceConnectivityBadge,
  DeviceLifecycleBadge,
  DeviceTypeBadge,
} from './DeviceStateBadge';
import { formatCoordinates } from '@/lib/geo';
import { useToast } from '@/contexts/ToastContext';
import type { DeviceWithRelations } from '@/types/devices';
import type { DevicePermissions } from '@/lib/permissions';

export type DeviceDetailTabKey =
  | 'overview'
  | 'configuration'
  | 'history'
  | 'installation'
  | 'events'
  | 'health';

export interface DeviceDetailHeaderProps {
  device: DeviceWithRelations;
  permissions: DevicePermissions;
  onSelectTab: (tab: DeviceDetailTabKey) => void;
  onManageInstallation: () => void;
  onEdit: () => void;
  onRunConnectionCheck: () => void;
  onRetireOrDelete?: () => void;
}

export const DeviceDetailHeader: React.FC<DeviceDetailHeaderProps> = ({
  device,
  permissions,
  onSelectTab,
  onManageInstallation,
  onEdit,
  onRunConnectionCheck,
  onRetireOrDelete,
}) => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleBack = () => {
    const lastUrl = sessionStorage.getItem('last_devices_url');
    navigate(lastUrl || '/assets/inventory');
  };

  const copyValue = (val: string, label: string) => {
    navigator.clipboard?.writeText(val);
    addToast('info', `${label} copied: ${val}`);
  };

  return (
    <div className="mb-5 select-none space-y-3">
      {/* Breadcrumb + Back */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav
          className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium min-w-0"
          aria-label="Breadcrumb"
        >
          <button
            type="button"
            onClick={() => navigate('/overview')}
            className="hover:text-foreground transition-colors cursor-pointer shrink-0"
          >
            Falcon
          </button>
          <ChevronRight className="size-3 shrink-0 text-muted-foreground/60" />
          <button
            type="button"
            onClick={() => navigate('/assets/poles')}
            className="hover:text-foreground transition-colors cursor-pointer shrink-0"
          >
            Assets and devices
          </button>
          <ChevronRight className="size-3 shrink-0 text-muted-foreground/60" />
          <button
            type="button"
            onClick={handleBack}
            className="hover:text-foreground transition-colors cursor-pointer shrink-0"
          >
            Devices
          </button>
          <ChevronRight className="size-3 shrink-0 text-muted-foreground/60" />
          <span className="font-mono font-semibold text-foreground truncate">
            {device.identifier}
          </span>
        </nav>

        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="h-8 px-2.5 text-xs gap-1.5 border-border bg-card hover:bg-muted cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to devices</span>
        </Button>
      </div>

      {/* Title Row & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {device.identifier}
            </h1>
            <DeviceTypeBadge type={device.type} size="sm" />
            <DeviceConnectivityBadge state={device.connectivityState} size="sm" />
            <DeviceLifecycleBadge lifecycle={device.lifecycle} />
            {device.vendorConflict && (
              <button
                type="button"
                onClick={() => navigate('/assets/inventory/vendor-discovery')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/12 text-red-600 dark:text-red-400 border border-red-500/30 cursor-pointer hover:bg-red-500/20"
              >
                <AlertTriangle className="size-3" />
                <span>Vendor conflict</span>
              </button>
            )}
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
            <span>{device.manufacturer}</span>
            <span>·</span>
            <span className="text-foreground font-medium">{device.model}</span>
            <span>·</span>
            <span className="font-mono">{device.serial}</span>
            {device.name !== device.identifier && (
              <>
                <span>·</span>
                <span>{device.name}</span>
              </>
            )}
          </p>

          {/* Clickable Summary Relationship Chips */}
          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            {device.installedPoleId ? (
              <button
                type="button"
                onClick={() =>
                  navigate(`/assets/poles/${encodeURIComponent(device.installedPoleId!)}`)
                }
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border border-border bg-card hover:bg-muted text-foreground cursor-pointer transition-colors"
              >
                <span className="text-muted-foreground">Pole:</span>
                <span className="font-mono font-semibold text-primary">
                  {device.installedPoleId}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSelectTab('installation')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 cursor-pointer hover:bg-amber-500/15"
              >
                <span>Not installed on a pole</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onSelectTab('events')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border border-border bg-card hover:bg-muted text-foreground cursor-pointer transition-colors"
            >
              <span className="font-mono font-semibold tabular-nums">{device.allEventsCount}</span>
              <span className="text-muted-foreground">
                {device.allEventsCount === 1 ? 'event' : 'events'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('history')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border border-border bg-card hover:bg-muted text-foreground cursor-pointer transition-colors"
            >
              <span className="font-mono font-semibold tabular-nums">
                {device.connectivityPeriods.length}
              </span>
              <span className="text-muted-foreground">telemetry periods</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('configuration')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border border-border bg-card hover:bg-muted text-foreground cursor-pointer transition-colors"
            >
              <Sliders className="size-3 text-primary" />
              <span className="font-mono">
                {device.configVersion ? `${device.configVersion} (${device.configStatus})` : 'No config sent'}
              </span>
            </button>
          </div>
        </div>

        {/* Primary & Secondary Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {permissions.canManageInstallation && (
            <Button
              variant="outline"
              size="sm"
              onClick={onManageInstallation}
              className="h-8 px-3 text-xs gap-1.5 border-border bg-card hover:bg-muted font-medium cursor-pointer"
            >
              <Link2 className="size-3.5 text-primary" />
              <span>{device.isInstalled ? 'Manage installation' : 'Install on pole'}</span>
            </Button>
          )}

          {permissions.canEditDevice && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="h-8 px-3 text-xs gap-1.5 border-border bg-card hover:bg-muted font-medium cursor-pointer"
            >
              <Pencil className="size-3.5 text-muted-foreground" />
              <span>Edit</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => onSelectTab('configuration')}
            className="h-8 px-3 text-xs gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
          >
            <Sliders className="size-3.5" />
            <span>Configure</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="More device actions"
                  className="h-8 w-8 p-0 border-border bg-card hover:bg-muted cursor-pointer"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-52 text-xs">
              {permissions.canRunConnectionCheck && (
                <DropdownMenuItem onClick={onRunConnectionCheck} className="gap-2 cursor-pointer">
                  <Activity className="size-3.5" />
                  <span>Run connection check</span>
                </DropdownMenuItem>
              )}
              {device.installedPoleId && (
                <DropdownMenuItem
                  onClick={() =>
                    navigate(`/assets/poles/${encodeURIComponent(device.installedPoleId!)}`)
                  }
                  className="gap-2 cursor-pointer"
                >
                  <ExternalLink className="size-3.5" />
                  <span>Open pole {device.installedPoleId}</span>
                </DropdownMenuItem>
              )}
              {device.location && (
                <DropdownMenuItem
                  onClick={() =>
                    navigate(
                      `/assets/inventory?view=map&device=${encodeURIComponent(device.identifier)}`
                    )
                  }
                  className="gap-2 cursor-pointer"
                >
                  <MapIcon className="size-3.5" />
                  <span>View on Devices map</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => copyValue(device.identifier, 'Identifier')}
                className="gap-2 cursor-pointer"
              >
                <Copy className="size-3.5" />
                <span>Copy identifier</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => copyValue(device.serial, 'Serial number')}
                className="gap-2 cursor-pointer"
              >
                <Copy className="size-3.5" />
                <span>Copy serial number</span>
              </DropdownMenuItem>
              {device.location && (
                <DropdownMenuItem
                  onClick={() => copyValue(formatCoordinates(device.location), 'Coordinates')}
                  className="gap-2 cursor-pointer"
                >
                  <Copy className="size-3.5" />
                  <span>Copy coordinates</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => copyValue(window.location.href, 'Device link')}
                className="gap-2 cursor-pointer"
              >
                <Copy className="size-3.5" />
                <span>Copy page link</span>
              </DropdownMenuItem>
              {onRetireOrDelete && (permissions.canEditDevice || permissions.canDeleteDevice) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onRetireOrDelete}
                    className="gap-2 text-red-500 focus:text-red-500 cursor-pointer"
                  >
                    <Archive className="size-3.5" />
                    <span>
                      {permissions.canDeleteDevice ? 'Retire or delete device' : 'Retire device'}
                    </span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

