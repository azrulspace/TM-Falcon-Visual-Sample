import React from 'react';
import { cn } from '@/lib/utils';
import type { DeviceConnectivityState } from '@/types/devices';
import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface DeviceStateBadgeProps {
  state: DeviceConnectivityState;
  showIcon?: boolean;
  className?: string;
  showWarningChip?: boolean;
  contradictionReason?: string;
}

export const DeviceStateBadge: React.FC<DeviceStateBadgeProps> = ({
  state,
  showIcon = true,
  className,
  showWarningChip = false,
  contradictionReason,
}) => {
  const norm = state.toLowerCase();

  let bgClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  let dotColor = 'bg-emerald-500';
  let label = 'Online';

  if (norm === 'offline') {
    bgClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    dotColor = 'bg-rose-500';
    label = 'Offline';
  } else if (norm === 'stale') {
    bgClass = 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    dotColor = 'bg-slate-400';
    label = 'Stale';
  }

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span
        role="status"
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none transition-colors',
          bgClass,
          className
        )}
      >
        {showIcon ? (
          <span className={cn('size-1.5 rounded-full shrink-0', dotColor)} />
        ) : null}
        <span>{label}</span>
      </span>

      {showWarningChip && (
        <Tooltip>
          <TooltipTrigger
            render={
              <span
                role="alert"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 cursor-help"
              >
                <AlertTriangle className="size-3 text-amber-500 shrink-0" />
                <span>No recent contact</span>
              </span>
            }
          />
          <TooltipContent side="top" className="max-w-[280px] text-xs">
            {contradictionReason || 'Device has not reported telemetry in over 24 hours.'}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};
