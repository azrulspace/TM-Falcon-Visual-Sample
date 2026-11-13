import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface ConfigVersionChipProps {
  version: string | null | undefined;
  status?: 'Applied' | 'Pending' | 'Failed';
  className?: string;
  onClick?: () => void;
}

export const ConfigVersionChip: React.FC<ConfigVersionChipProps> = ({
  version,
  status = 'Applied',
  className,
  onClick,
}) => {
  if (!version || version.toLowerCase() === 'none') {
    return (
      <span className={cn('text-xs text-muted-foreground font-mono select-none', className)}>
        None
      </span>
    );
  }

  // Extract version number if format is cfg-2 or cfg 2
  const match = version.match(/cfg[-_\s]*(\d+)/i);
  const versionNum = match ? match[1] : version;
  const label = `cfg-${versionNum}`;
  const tooltipText = `Applied configuration version ${versionNum}`;

  let dotColor = 'bg-emerald-500';
  if (status === 'Pending') dotColor = 'bg-amber-500 animate-pulse';
  if (status === 'Failed') dotColor = 'bg-rose-500';

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={onClick}
            className={cn(
              'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] bg-muted/70 hover:bg-muted border border-border/80 text-foreground text-xs font-mono font-medium transition-colors cursor-pointer select-none',
              className
            )}
          >
            <span className={cn('size-1.5 rounded-full shrink-0', dotColor)} />
            <span>{label}</span>
          </button>
        }
      />
      <TooltipContent side="top" className="text-xs">
        {status === 'Pending'
          ? `Pending Edge sync: ${tooltipText}`
          : status === 'Failed'
          ? `Delivery failed: ${tooltipText}`
          : tooltipText}
      </TooltipContent>
    </Tooltip>
  );
};
