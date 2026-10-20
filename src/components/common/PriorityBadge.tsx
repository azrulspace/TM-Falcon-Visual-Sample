import React from 'react';
import { ShieldAlert, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low' | string;

export interface PriorityBadgeProps {
  priority?: PriorityLevel;
  severity?: PriorityLevel;
  className?: string;
  size?: 'sm' | 'default';
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  severity,
  className,
  size = 'default',
  showIcon = true,
}) => {
  const norm = (priority || severity || '').toLowerCase().trim();

  let styles = 'bg-[#38bdf8]/10 text-[#0284c7] dark:text-[#38bdf8] border-[#38bdf8]/30';
  let Icon = Info;
  let label = 'Low';

  if (norm === 'critical') {
    styles = 'bg-[#ef4444]/10 text-[#dc2626] dark:text-[#ef4444] border-[#ef4444]/30';
    Icon = ShieldAlert;
    label = 'Critical';
  } else if (norm === 'high') {
    styles = 'bg-[#f97316]/10 text-[#ea580c] dark:text-[#f97316] border-[#f97316]/30';
    Icon = AlertTriangle;
    label = 'High';
  } else if (norm === 'medium') {
    styles = 'bg-[#f59e0b]/10 text-[#d97706] dark:text-[#f59e0b] border-[#f59e0b]/30';
    Icon = AlertTriangle;
    label = 'Medium';
  } else {
    styles = 'bg-[#38bdf8]/10 text-[#0284c7] dark:text-[#38bdf8] border-[#38bdf8]/30';
    Icon = Info;
    label = 'Low';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-[6px] border select-none transition-colors whitespace-nowrap',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs',
        styles,
        className
      )}
    >
      {showIcon && <Icon className={size === 'sm' ? 'size-2.5 shrink-0' : 'size-3 shrink-0'} />}
      <span>{label}</span>
    </span>
  );
};
