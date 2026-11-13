import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  Pencil,
  MapPin,
  MapPinOff,
  MoreHorizontal,
  Copy,
  Check,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeviceStateBadge } from '@/components/devices/DeviceStateBadge';
import { evaluateDeviceFreshness } from '@/data/deviceSelectors';
import { useToast } from '@/contexts/ToastContext';
import type { DeviceRecord } from '@/types/devices';

export interface DeviceDetailHeaderProps {
  device: DeviceRecord;
  onManageInstallation: () => void;
  onEdit: () => void;
  onViewRawPayload?: () => void;
}

export const DeviceDetailHeader: React.FC<DeviceDetailHeaderProps> = ({
  device,
  onManageInstallation,
  onEdit,
  onViewRawPayload,
}) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const freshness = evaluateDeviceFreshness(device);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleBack = () => {
    const lastUrl = sessionStorage.getItem('last_devices_url');
    navigate(lastUrl || '/assets/devices');
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    addToast('info', `Copied ${label} to clipboard.`);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast('info', 'Device link copied to clipboard.');
  };

  const isUnmounted = !device.installedOnPoleId;

  return (
    <div className="mb-5 select-none space-y-3">
      {/* 1. Breadcrumb + Back */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
          <button
            type="button"
            onClick={() => navigate('/overview')}
            className="hover:text-foreground transition-colors cursor-pointer shrink-0"
          >
            Falcon
          </button>
          <ChevronRight className="size-3 text-muted-foreground shrink-0" />
          <button
            type="button"
            onClick={() => navigate('/assets/devices')}
            className="hover:text-foreground transition-colors cursor-pointer shrink-0"
          >
            Assets and devices
          </button>
          <ChevronRight className="size-3 text-muted-foreground shrink-0" />
          <button
            type="button"
            onClick={handleBack}
            className="hover:text-foreground transition-colors cursor-pointer shrink-0"
          >
            Devices
          </button>
          <ChevronRight className="size-3 text-muted-foreground shrink-0" />
          <span className="font-mono text-foreground font-semibold truncate">
            {device.identifier}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to devices</span>
        </Button>
      </div>

      {/* 2. Main Title Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground">
              {device.identifier}
            </h1>

            {/* Hardware Type Badge */}
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              {device.type}
            </span>

            {/* State Badge with freshness check */}
            <DeviceStateBadge
              state={device.state}
              showWarningChip={freshness.showWarningChip}
            />

            {/* Unmounted Warning Badge */}
            {isUnmounted && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20 inline-flex items-center gap-1">
                <MapPinOff className="size-3" />
                <span>Not installed</span>
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {device.name !== device.identifier ? (
              <span>
                {device.name} <span className="mx-1">·</span> Model: {device.model}
              </span>
            ) : (
              <span>Model: {device.model}</span>
            )}
            <span className="mx-1.5">·</span>
            <span>Serial: <strong className="font-mono text-foreground font-normal">{device.serialNumber}</strong></span>
          </p>
        </div>

        {/* 3. Action Buttons & Overflow */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onManageInstallation}
            className="h-8.5 gap-1.5 text-xs font-medium cursor-pointer"
          >
            <MapPin className="size-3.5 text-primary" />
            <span>Manage installation</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="h-8.5 gap-1.5 text-xs font-medium cursor-pointer"
          >
            <Pencil className="size-3.5 text-muted-foreground" />
            <span>Edit</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8.5 rounded-lg cursor-pointer"
                  title="More actions"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-52 text-xs">
              <DropdownMenuItem
                onClick={() => handleCopy(device.identifier, 'Identifier')}
                className="cursor-pointer gap-2"
              >
                {copiedKey === 'Identifier' ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5 text-muted-foreground" />
                )}
                <span>Copy identifier</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handleCopy(device.serialNumber, 'Serial')}
                className="cursor-pointer gap-2"
              >
                {copiedKey === 'Serial' ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5 text-muted-foreground" />
                )}
                <span>Copy vendor serial</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer gap-2">
                <ExternalLink className="size-3.5 text-muted-foreground" />
                <span>Copy device URL</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={onViewRawPayload || (() => addToast('info', 'Raw telemetry payload displayed in console.'))}
                className="cursor-pointer gap-2"
              >
                <Code2 className="size-3.5 text-muted-foreground" />
                <span>View raw payload</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

