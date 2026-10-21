import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import { getRelativeTimeCalculation } from '@/lib/dateTime';

export interface RelativeTimeProps {
  date: string | number | Date | null | undefined;
  now?: string | number | Date | null;
  className?: string;
  showTooltip?: boolean;
}

/**
 * Accessible RelativeTime component with absolute MYT in tooltip
 * and distinct Clock mismatch indicator when future dated.
 */
export const RelativeTime: React.FC<RelativeTimeProps> = ({
  date,
  now,
  className,
  showTooltip = true,
}) => {
  const calc = getRelativeTimeCalculation(date, now);

  if (calc.isClockMismatch) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 cursor-help',
                className
              )}
            >
              <AlertTriangle className="size-3 shrink-0" />
              <span>Clock mismatch</span>
            </span>
          }
        />
        <TooltipContent className="text-xs bg-popover text-foreground border border-border shadow-lg">
          <span>Event timestamp is in the future relative to server time ({calc.formattedAbsolute})</span>
        </TooltipContent>
      </Tooltip>
    );
  }

  const content = (
    <span className={cn('text-xs text-muted-foreground tabular-nums select-none', className)}>
      {calc.text}
    </span>
  );

  if (!showTooltip || calc.formattedAbsolute === '—') {
    return content;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={content} />
      <TooltipContent className="text-xs font-mono bg-popover text-foreground border border-border shadow-lg">
        <span>{calc.formattedAbsolute}</span>
      </TooltipContent>
    </Tooltip>
  );
};
