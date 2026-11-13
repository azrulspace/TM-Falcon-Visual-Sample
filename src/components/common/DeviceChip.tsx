import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { devices as fallbackDevices } from '@/data/devices';
import { useAssets } from '@/contexts/AssetsContext';

export interface DeviceChipProps {
  deviceId: string | null | undefined;
  status?: 'online' | 'offline' | 'stale' | string;
  className?: string;
  showDot?: boolean;
}

export const DeviceChip: React.FC<DeviceChipProps> = ({
  deviceId,
  status,
  className,
  showDot = true,
}) => {
  const { getDeviceById, vendorRecords } = useAssets();

  if (!deviceId) return <span className="text-muted-foreground font-mono text-xs">—</span>;

  const richMatch = getDeviceById(deviceId);
  const vendorUnregistered = !richMatch
    ? vendorRecords.find(
        (v) =>
          v.serial.toLowerCase() === deviceId.trim().toLowerCase() &&
          v.matchStatus === 'Not registered'
      )
    : undefined;

  const fallbackMatch = fallbackDevices.find(
    (d) =>
      d.id === deviceId ||
      d.id.replace(/_/g, '-') === deviceId.replace(/_/g, '-')
  );

  const displayId = richMatch?.identifier || deviceId;
  const resolvedStatus =
    status || richMatch?.connectivityState || vendorUnregistered?.vendorState || fallbackMatch?.status || 'offline';
  const normStatus = resolvedStatus.toLowerCase();

  let dotColor = 'bg-[#10b981]';
  if (normStatus === 'offline') dotColor = 'bg-[#ef4444]';
  else if (normStatus === 'stale') dotColor = 'bg-[#f59e0b]';

  const targetUrl = vendorUnregistered
    ? '/assets/inventory/vendor-discovery'
    : `/assets/inventory/devices/${encodeURIComponent(displayId)}`;

  return (
    <Link
      to={targetUrl}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] bg-muted/60 hover:bg-muted border border-border/80 text-foreground hover:text-primary transition-colors font-mono text-xs font-medium cursor-pointer',
        className
      )}
      title={
        vendorUnregistered
          ? `${displayId} — Not registered in FALCON (open Vendor discovery)`
          : richMatch?.vendorConflict
          ? `Device ${displayId} (${normStatus}) · Serial conflict (${richMatch.vendorConflict.serial})`
          : `Device ${displayId} (${normStatus})`
      }
    >
      {showDot && <span className={cn('size-1.5 rounded-full shrink-0', dotColor)} />}
      <span>{displayId}</span>
      {vendorUnregistered && (
        <span className="text-[10px] font-sans text-amber-500 font-semibold">
          Not registered
        </span>
      )}
      {richMatch?.vendorConflict && (
        <AlertTriangle className="size-3 text-red-500 shrink-0" />
      )}
    </Link>
  );
};
