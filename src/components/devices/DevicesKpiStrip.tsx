import React from 'react';
import { HardDrive, CheckCircle2, XCircle, Clock, MapPinOff, AlertTriangle, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiMode } from '@/hooks/useUiMode';
import type { DeviceKpiCounts } from '@/data/deviceSelectors';

export type DeviceKpiKey =
  | 'total'
  | 'online'
  | 'offline'
  | 'stale'
  | 'not_installed'
  | 'needs_attention'
  | 'config_issues';

export interface DevicesKpiStripProps {
  kpis: DeviceKpiCounts;
  activeKpi: DeviceKpiKey | null;
  onSelectKpi: (key: DeviceKpiKey | null) => void;
  isLoading?: boolean;
}

export const DevicesKpiStrip: React.FC<DevicesKpiStripProps> = ({
  kpis,
  activeKpi,
  onSelectKpi,
  isLoading = false,
}) => {
  const { isTablet, orientation } = useUiMode();
  const isPortrait = isTablet && orientation === 'portrait';

  const cells: {
    key: DeviceKpiKey;
    label: string;
    value: number;
    icon: React.ReactNode;
    activeClass: string;
    hint: string;
  }[] = [
    {
      key: 'total',
      label: 'Total devices',
      value: kpis.total,
      icon: <HardDrive className="size-3.5 text-muted-foreground shrink-0" />,
      activeClass: 'bg-muted/80 ring-1 ring-inset ring-foreground/20',
      hint: 'Show all registered devices',
    },
    {
      key: 'online',
      label: 'Online',
      value: kpis.online,
      icon: <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />,
      activeClass: 'bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/30 text-emerald-600 dark:text-emerald-400',
      hint: 'Filter to devices currently Online',
    },
    {
      key: 'offline',
      label: 'Offline',
      value: kpis.offline,
      icon: <XCircle className="size-3.5 text-rose-500 shrink-0" />,
      activeClass: 'bg-rose-500/10 ring-1 ring-inset ring-rose-500/30 text-rose-600 dark:text-rose-400',
      hint: 'Filter to devices currently Offline',
    },
    {
      key: 'stale',
      label: 'Stale',
      value: kpis.stale,
      icon: <Clock className="size-3.5 text-slate-400 shrink-0" />,
      activeClass: 'bg-slate-500/10 ring-1 ring-inset ring-slate-500/30 text-slate-600 dark:text-slate-400',
      hint: 'Filter to devices with Stale telemetry',
    },
    {
      key: 'not_installed',
      label: 'Not installed',
      value: kpis.notInstalled,
      icon: <MapPinOff className="size-3.5 text-amber-500 shrink-0" />,
      activeClass: 'bg-amber-500/10 ring-1 ring-inset ring-amber-500/30 text-amber-600 dark:text-amber-400',
      hint: 'Filter to devices not mounted on a pole',
    },
    {
      key: 'needs_attention',
      label: 'Needs attention',
      value: kpis.needsAttention,
      icon: <AlertTriangle className="size-3.5 text-rose-500 shrink-0" />,
      activeClass: 'bg-rose-500/10 ring-1 ring-inset ring-rose-500/30 text-rose-600 dark:text-rose-400',
      hint: 'Filter to offline or stale devices requiring field check',
    },
    ...(kpis.configIssues > 0
      ? [
          {
            key: 'config_issues' as DeviceKpiKey,
            label: 'Config issues',
            value: kpis.configIssues,
            icon: <Sliders className="size-3.5 text-amber-500 shrink-0" />,
            activeClass: 'bg-amber-500/10 ring-1 ring-inset ring-amber-500/30',
            hint: 'Filter devices with pending or failed configuration delivery',
          },
        ]
      : []),
  ];

  if (isLoading) {
    return (
      <div className="h-[74px] w-full rounded-xl border border-border bg-card shadow-xs grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-border mb-4 animate-pulse">
        {cells.map((c) => (
          <div key={c.key} className="flex flex-col justify-center px-4 h-full">
            <div className="h-3 w-20 bg-muted rounded mb-2" />
            <div className="h-6 w-10 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (isPortrait) {
    return (
      <div className="flex items-stretch gap-2 overflow-x-auto no-scrollbar mb-4 select-none pb-1">
        {cells.map((cell) => {
          const isActive = activeKpi === cell.key;
          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onSelectKpi(isActive ? null : cell.key)}
              aria-pressed={isActive}
              title={cell.hint}
              className={cn(
                'flex flex-col justify-center p-3 rounded-xl border border-border bg-card shadow-xs text-left transition-all cursor-pointer min-h-[64px] min-w-[140px] shrink-0',
                isActive ? cell.activeClass : 'hover:bg-muted/40'
              )}
            >
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="font-medium truncate">{cell.label}</span>
                {cell.icon}
              </div>
              <div className="text-xl font-bold text-foreground tracking-tight tabular-nums mt-1">
                {cell.value}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full rounded-xl border border-border bg-card shadow-xs grid grid-cols-2 sm:grid-cols-3 mb-4 select-none overflow-hidden',
        cells.length === 7 ? 'lg:grid-cols-7' : 'lg:grid-cols-6'
      )}
    >
      {cells.map((cell, idx) => {
        const isActive = activeKpi === cell.key;
        return (
          <button
            key={cell.key}
            type="button"
            onClick={() => onSelectKpi(isActive ? null : cell.key)}
            aria-pressed={isActive}
            title={cell.hint}
            className={cn(
              'flex flex-col justify-center px-4 py-3 text-left transition-all cursor-pointer relative',
              idx > 0 && 'border-t sm:border-t-0 border-l border-border/80',
              isActive
                ? cell.activeClass
                : 'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary'
            )}
          >
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="font-medium truncate">{cell.label}</span>
              {cell.icon}
            </div>
            <div className="text-2xl font-bold text-foreground tracking-tight tabular-nums mt-1">
              {cell.value}
            </div>
          </button>
        );
      })}
    </div>
  );
};
