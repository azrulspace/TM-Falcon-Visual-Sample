import React from 'react';
import {
  Circle,
  Square,
  CircleDot,
  AlertTriangle,
  Info,
  Check,
  CheckCircle2,
  ClipboardList,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
export { PriorityBadge, PriorityBadge as SeverityBadge } from './PriorityBadge';
export type { PriorityLevel, PriorityLevel as SeverityType } from './PriorityBadge';

export type StatusType =
  | 'new'
  | 'acknowledged'
  | 'in case'
  | 'in_case'
  | 'assigned'
  | 'dismissed'
  | 'resolved'
  | 'closed'
  | 'online'
  | 'offline'
  | 'stale'
  | 'attention'
  | 'warning'
  | 'info'
  | string;

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
  size?: 'sm' | 'default';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className,
  size = 'default',
  showIcon = true,
}) => {
  const norm = (status || '').toLowerCase().trim();

  let styles = 'bg-muted/50 text-foreground border-border';
  let Icon = Circle;
  let text = label || status;

  // Event status mappings as specified in Section 5b
  if (norm === 'new') {
    // New: amber, alert icon
    styles = 'bg-[#f59e0b]/10 text-[#d97706] dark:text-[#f59e0b] border-[#f59e0b]/30';
    Icon = AlertTriangle;
    text = label || 'New';
  } else if (norm === 'acknowledged') {
    // Acknowledged: blue, check icon
    styles = 'bg-blue-500/10 text-blue-600 dark:text-[#60a5fa] border-blue-500/30';
    Icon = Check;
    text = label || 'Acknowledged';
  } else if (norm === 'in case' || norm === 'in_case' || norm === 'assigned') {
    // In case: neutral with a case icon
    styles = 'bg-muted/80 text-foreground border-border';
    Icon = ClipboardList;
    text = label || 'In case';
  } else if (norm === 'dismissed') {
    // Dismissed: grey, x icon
    styles = 'bg-muted/50 text-muted-foreground border-border';
    Icon = X;
    text = label || 'Dismissed';
  } else if (norm === 'resolved' || norm === 'closed') {
    // Resolved: green, check circle icon
    styles = 'bg-[#10b981]/10 text-[#059669] dark:text-[#10b981] border-[#10b981]/30';
    Icon = CheckCircle2;
    text = label || 'Resolved';
  } else if (norm === 'offline' || norm === 'critical' || norm === 'deleted') {
    styles = 'bg-status-offline-tint text-status-offline border-status-offline-border';
    Icon = norm === 'deleted' ? X : Square;
    if (norm === 'deleted') text = label || 'Deleted';
  } else if (norm === 'online' || norm === 'active') {
    styles = 'bg-status-online-tint text-status-online border-status-online-border';
    Icon = Circle;
    if (norm === 'active') text = label || 'Active';
  } else if (norm === 'stale' || norm === 'inactive' || norm === 'retired') {
    styles = 'bg-status-stale-tint text-status-stale border-status-stale-border';
    Icon = CircleDot;
    if (norm === 'inactive') text = label || 'Inactive';
    if (norm === 'retired') text = label || 'Retired';
  } else if (norm === 'warning' || norm === 'attention' || norm === 'maintenance') {
    styles = 'bg-status-warning-tint text-status-warning border-status-warning-border';
    Icon = AlertTriangle;
    if (norm === 'maintenance') text = label || 'Maintenance';
  } else if (norm === 'info' || norm === 'planned') {
    styles = 'bg-status-info-tint text-status-info border-status-info-border';
    Icon = Info;
    if (norm === 'planned') text = label || 'Planned';
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
