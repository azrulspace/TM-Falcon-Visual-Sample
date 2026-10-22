import React from 'react';
import { Circle, PlayCircle, Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CaseStatus } from '@/types/cases';

export interface CaseStatusBadgeProps {
  status: CaseStatus | string;
  className?: string;
  size?: 'sm' | 'default';
  showIcon?: boolean;
}

export const CaseStatusBadge: React.FC<CaseStatusBadgeProps> = ({
  status,
  className,
  size = 'default',
  showIcon = true,
}) => {
  const norm = (status || '').toLowerCase().trim();

  let styles = 'bg-muted/50 text-foreground border-border';
  let Icon = Circle;
  let text = status;

  if (norm === 'open') {
    // Open: amber, circle icon (AA contrast in light and dark)
    styles = 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30';
    Icon = Circle;
    text = 'Open';
  } else if (norm === 'in progress' || norm === 'in_progress') {
    // In progress: primary blue, progress icon
    styles = 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30';
    Icon = PlayCircle;
    text = 'In progress';
  } else if (norm === 'in review' || norm === 'in_review') {
    // In review: violet token adjusted so contrast passes AA in dark and light
    styles = 'bg-violet-500/10 text-violet-800 dark:text-violet-300 border-violet-500/30';
    Icon = Clock;
    text = 'In review';
  } else if (norm === 'closed') {
    // Closed: neutral grey, check icon
    styles = 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/25';
    Icon = Check;
    text = 'Closed';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[6px] border font-medium select-none whitespace-nowrap transition-colors',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs',
        styles,
        className
      )}
    >
      {showIcon && <Icon className={size === 'sm' ? 'size-2.5 shrink-0' : 'size-3 shrink-0'} />}
      <span>{text}</span>
    </span>
  );
};
