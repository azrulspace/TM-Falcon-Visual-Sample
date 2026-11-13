import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { devices } from '@/data/devices';

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
  if (!deviceId) return <span className="text-muted-foreground font-mono text-xs">—</span>;

  // Preserves user identifier verbatim as stored
  const displayId = deviceId.trim();
  
  // Single source of truth: if status not explicitly passed, query the shared devices registry
  const matchedDevice = devices.find(
    (d) =>
      d.id.toLowerCase() === displayId.toLowerCase() ||
      d.id.toLowerCase().replace(/_/g, '-') === displayId.toLowerCase().replace(/_/g, '-')
  );
  const resolvedStatus = status || matchedDevice?.status || 'offline';
  const normStatus = resolvedStatus.toLowerCase();

  let dotColor = 'bg-[#10b981]'; // online: green
  if (normStatus === 'offline') dotColor = 'bg-[#ef4444]'; // offline: red
  else if (normStatus === 'stale') dotColor = 'bg-[#94a3b8]'; // stale: gray/slate

  return (
    <Link
      to={`/assets/devices/${displayId}`}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] bg-muted/60 hover:bg-muted border border-border/80 text-foreground hover:text-primary transition-colors font-mono text-xs font-medium cursor-pointer',
        className
      )}
      title={`Device ${displayId} (${normStatus})`}
    >
      {showDot && (
        <span className={cn('size-1.5 rounded-full shrink-0', dotColor)} />
      )}
      <span>{displayId}</span>
    </Link>
  );
};
