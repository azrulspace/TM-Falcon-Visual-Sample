import React from 'react';
import { Circle, Square, CircleDot, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusType = 'online' | 'offline' | 'stale' | 'attention' | 'warning' | 'info' | 'critical' | 'high' | 'medium' | 'low' | 'resolved' | string;
export type SeverityType = 'critical' | 'high' | 'medium' | 'low' | string;

export const StatusBadge: React.FC<{
  status: StatusType;
  label?: string;
  className?: string;
  size?: 'sm' | 'default';
}> = ({ status, label, className, size = 'default' }) => {
  const norm = (status || '').toLowerCase().trim();

  let icon = <Circle className="size-2 fill-current" />;
  let styles = "bg-muted text-foreground border-border";

  if (norm === 'offline' || norm === 'critical') {
    icon = <Square className="size-2 fill-current" />;
    styles = "bg-status-offline-tint text-status-offline border-status-offline-border";
  } else if (norm === 'high') {
    icon = <AlertTriangle className="size-2.5 fill-current" />;
    styles = "bg-severity-high-tint text-severity-high border-severity-high/30";
  } else if (norm === 'medium' || norm === 'need attention' || norm === 'attention' || norm === 'warning') {
    icon = <AlertTriangle className="size-2.5 fill-current" />;
    styles = "bg-status-warning-tint text-status-warning border-status-warning-border";
  } else if (norm === 'stale' || norm === 'unknown') {
    icon = <CircleDot className="size-2.5" />;
    styles = "bg-status-stale-tint text-status-stale border-status-stale-border";
  } else if (norm === 'low' || norm === 'info') {
    icon = <Info className="size-2.5" />;
    styles = "bg-status-info-tint text-status-info border-status-info-border";
  } else if (norm === 'online' || norm === 'resolved') {
    icon = <Circle className="size-2 fill-current" />;
    styles = "bg-status-online-tint text-status-online border-status-online-border";
  }

  const text = label || status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[6px] border font-semibold tracking-wide capitalize",
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        styles,
        className
      )}
    >
      {icon}
      <span>{text}</span>
    </span>
  );
};

export const SeverityBadge: React.FC<{
  severity: SeverityType;
  label?: string;
  className?: string;
  size?: 'sm' | 'default';
}> = ({ severity, label, className, size = 'default' }) => {
  const norm = (severity || '').toLowerCase().trim();

  let styles = "bg-severity-low-tint text-severity-low border-status-info-border";
  let icon = <Info className="size-2.5" />;

  if (norm === 'critical') {
    styles = "bg-severity-critical-tint text-severity-critical border-status-offline-border";
    icon = <ShieldAlert className="size-2.5" />;
  } else if (norm === 'high') {
    styles = "bg-severity-high-tint text-severity-high border-severity-high/30";
    icon = <AlertTriangle className="size-2.5" />;
  } else if (norm === 'medium') {
    styles = "bg-severity-medium-tint text-severity-medium border-status-warning-border";
    icon = <AlertTriangle className="size-2.5" />;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[6px] border font-semibold tracking-wide uppercase",
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]',
        styles,
        className
      )}
    >
      {icon}
      <span>{label || severity}</span>
    </span>
  );
};
