import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Camera,
  Volume2,
  Radar,
  Router,
  AlertTriangle,
  Sliders,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type {
  DeviceConnectivityState,
  DeviceLifecycleState,
  DeviceTypeCategory,
  DeviceConfigStatus,
  VendorMatchStatus,
} from '@/types/devices';

export const DeviceConnectivityBadge: React.FC<{
  state: DeviceConnectivityState;
  size?: 'xs' | 'sm';
}> = ({ state, size = 'xs' }) => {
  const isOnline = state === 'online';
  const isOffline = state === 'offline';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold border whitespace-nowrap select-none',
        size === 'xs' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs',
        isOnline &&
          'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
        isOffline &&
          'bg-red-500/12 text-red-700 dark:text-red-400 border-red-500/30',
        !isOnline &&
          !isOffline &&
          'bg-amber-500/12 text-amber-700 dark:text-amber-400 border-amber-500/30'
      )}
    >
      {isOnline ? (
        <CheckCircle2 className="size-3 shrink-0" />
      ) : isOffline ? (
        <XCircle className="size-3 shrink-0" />
      ) : (
        <Clock className="size-3 shrink-0" />
      )}
      <span>{isOnline ? 'Online' : isOffline ? 'Offline' : 'Stale'}</span>
    </span>
  );
};

export const DeviceLifecycleBadge: React.FC<{
  lifecycle: DeviceLifecycleState;
}> = ({ lifecycle }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border whitespace-nowrap select-none',
        lifecycle === 'Active' &&
          'bg-primary/10 text-primary border-primary/25',
        lifecycle === 'Planned' &&
          'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25',
        lifecycle === 'Maintenance' &&
          'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
        lifecycle === 'Retired' &&
          'bg-muted text-muted-foreground border-border'
      )}
    >
      {lifecycle}
    </span>
  );
};

export const DeviceTypeBadge: React.FC<{
  type: DeviceTypeCategory;
  size?: 'xs' | 'sm';
}> = ({ type, size = 'xs' }) => {
  const Icon =
    type === 'Speaker'
      ? Volume2
      : type === 'LiDAR sensor'
      ? Radar
      : type === 'Gateway'
      ? Router
      : Camera;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-medium border border-border bg-muted/60 text-foreground whitespace-nowrap select-none',
        size === 'xs' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs'
      )}
    >
      <Icon className="size-3 text-primary shrink-0" />
      <span>{type}</span>
    </span>
  );
};

export const DeviceConfigBadge: React.FC<{
  version: string | null;
  status: DeviceConfigStatus;
  reportedAt?: string | null;
}> = ({ version, status, reportedAt }) => {
  const isIssue = status === 'Failed' || status === 'Partly applied';
  const isApplied = status === 'Applied';
  const isPending = status === 'Sending' || status === 'Pending';

  const explanation =
    status === 'None'
      ? 'No configuration pushed from FALCON yet. Current settings are read directly from device defaults.'
      : status === 'Applied'
      ? `Version ${version} confirmed applied by Edge.${reportedAt ? ` Reported ${reportedAt}.` : ''}`
      : status === 'Partly applied'
      ? `Version ${version} had one or more settings fail on Edge. Open Configuration tab to retry.`
      : status === 'Failed'
      ? `Version ${version} failed to apply on Edge. Open Configuration tab for error details.`
      : `Version ${version || ''} is queued with Edge.`;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono border cursor-help whitespace-nowrap',
              isIssue &&
                'bg-red-500/12 text-red-700 dark:text-red-400 border-red-500/30 font-semibold',
              isApplied &&
                'bg-primary/10 text-primary border-primary/25 font-medium',
              isPending &&
                'bg-amber-500/12 text-amber-700 dark:text-amber-400 border-amber-500/30 font-medium',
              !isIssue &&
                !isApplied &&
                !isPending &&
                'bg-muted/50 text-muted-foreground border-border'
            )}
          >
            {isIssue ? (
              <AlertTriangle className="size-3 shrink-0" />
            ) : (
              <Sliders className="size-3 shrink-0 opacity-75" />
            )}
            <span>{version ? `${version} · ${status}` : 'None'}</span>
          </span>
        }
      />
      <TooltipContent className="max-w-xs text-xs leading-relaxed">
        {explanation}
      </TooltipContent>
    </Tooltip>
  );
};

export const VendorMatchBadge: React.FC<{
  status: VendorMatchStatus;
}> = ({ status }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap select-none',
        status === 'Registered' &&
          'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
        status === 'Not registered' &&
          'bg-primary/12 text-primary border-primary/30',
        status === 'Conflict' &&
          'bg-red-500/12 text-red-700 dark:text-red-400 border-red-500/30'
      )}
    >
      {status === 'Conflict' && <AlertTriangle className="size-3 shrink-0" />}
      <span>{status}</span>
    </span>
  );
};

