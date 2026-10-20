import React from 'react';
import { Link } from 'react-router-dom';
import { formatId, cn } from '@/lib/utils';

export interface DeviceChipProps {
  deviceId: string | null | undefined;
  status?: 'online' | 'offline' | 'stale' | string;
  className?: string;
  showDot?: boolean;
}

export const DeviceChip: React.FC<DeviceChipProps> = ({
  deviceId,
  status = 'online',
  className,
  showDot = true,
}) => {
  if (!deviceId) return <span className="text-muted-foreground font-mono text-xs">—</span>;

  const formatted = formatId(deviceId);
  const normStatus = (status || 'online').toLowerCase();

  let dotColor = 'bg-[#10b981]'; // online
  if (normStatus === 'offline') dotColor = 'bg-[#ef4444]';
  else if (normStatus === 'stale') dotColor = 'bg-[#94a3b8]';

  return (
    <Link
      to={`/assets/inventory/devices/${formatted}`}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] bg-muted/60 hover:bg-muted border border-border/80 text-foreground hover:text-primary transition-colors font-mono text-xs font-medium cursor-pointer',
        className
      )}
      title={`Device ${formatted} (${normStatus})`}
    >
      {showDot && (
        <span className={cn('size-1.5 rounded-full shrink-0', dotColor)} />
      )}
      <span>{formatted}</span>
    </Link>
  );
};
