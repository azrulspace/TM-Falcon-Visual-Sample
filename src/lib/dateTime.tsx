import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * Parses timestamp string or number into a valid Date object.
 * Handles ISO strings, timestamps, or legacy formats like "05 Oct, 14:25" or "Oct 20, 2026, 4:28 PM".
 */
export function parseDate(dateInput: string | number | Date | null | undefined): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === 'number') return new Date(dateInput);

  // If already parseable by standard Date constructor
  const parsed = new Date(dateInput);
  if (!isNaN(parsed.getTime())) return parsed;

  // Handle format "DD MMM, HH:mm" (e.g. "05 Oct, 14:25")
  const match1 = dateInput.match(/^(\d{1,2})\s+([A-Za-z]{3}),?\s+(\d{1,2}):(\d{2})$/);
  if (match1) {
    const [, day, monthStr, hour, minute] = match1;
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const month = months[monthStr.toLowerCase()] ?? 9;
    const year = 2026; // prototype year
    return new Date(year, month, parseInt(day, 10), parseInt(hour, 10), parseInt(minute, 10));
  }

  // Handle relative strings like "12m ago", "2h ago"
  const relMatch = dateInput.match(/^(\d+)([mhd])\s*ago$/i);
  if (relMatch) {
    const val = parseInt(relMatch[1], 10);
    const unit = relMatch[2].toLowerCase();
    const now = new Date();
    if (unit === 'm') return new Date(now.getTime() - val * 60 * 1000);
    if (unit === 'h') return new Date(now.getTime() - val * 3600 * 1000);
    if (unit === 'd') return new Date(now.getTime() - val * 86400 * 1000);
  }

  return new Date();
}

/**
 * Returns clean relative time e.g. "Just now", "12m ago", "2h ago", "3d ago".
 */
export function formatRelativeTime(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '—';
  
  // If the input is already in a relative format like "12m ago" or "2h 14m ago"
  if (typeof dateInput === 'string' && /^\d+[mhd](\s+\d+m)?\s+ago$/i.test(dateInput.trim())) {
    return dateInput.trim();
  }

  const date = parseDate(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  if (diffMs < 0 || diffMs < 45 * 1000) return 'Just now';
  
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) {
    const remainMin = diffMin % 60;
    return remainMin > 0 ? `${diffHours}h ${remainMin}m ago` : `${diffHours}h ago`;
  }
  if (diffDays < 30) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

/**
 * Formats absolute date and time with Malaysia Timezone (MYT / UTC+8).
 */
export function formatAbsoluteMYT(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '—';
  const date = parseDate(dateInput);
  
  // Format with date-time in MYT
  const formatted = new Intl.DateTimeFormat('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kuala_Lumpur',
  }).format(date);

  return `${formatted} MYT (UTC+8)`;
}

export interface RelativeTimeProps {
  date: string | number | Date | null | undefined;
  className?: string;
  showIcon?: boolean;
}

export const RelativeTime: React.FC<RelativeTimeProps> = ({
  date,
  className,
}) => {
  if (!date) return <span className="text-muted-foreground font-mono text-xs">—</span>;

  const rel = formatRelativeTime(date);
  const abs = formatAbsoluteMYT(date);

  return (
    <Tooltip>
      <TooltipTrigger render={
        <span className={cn('cursor-help underline decoration-dotted decoration-muted-foreground/50 text-foreground tabular-nums select-none', className)}>
          {rel}
        </span>
      } />
      <TooltipContent className="text-xs bg-popover text-popover-foreground border border-border shadow-md px-2.5 py-1 z-50">
        <span>{abs}</span>
      </TooltipContent>
    </Tooltip>
  );
};
