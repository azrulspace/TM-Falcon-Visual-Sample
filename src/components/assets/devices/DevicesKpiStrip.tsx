import React from 'react';
import {
  Cpu,
  CheckCircle2,
  XCircle,
  Clock,
  Unplug,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiMode } from '@/hooks/useUiMode';
import type { DeviceKpiCounts } from '@/data/deviceSelectors';

export type DeviceKpiKey =
  | 'total'
  | 'online'
  | 'offline'
  | 'stale'
  | 'not_installed'
  | 'needs_attention';

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
      icon: <Cpu className="size-3.5 text-primary shrink-0" />,
      activeClass: 'bg-primary/10 ring-1 ring-inset ring-primary/40',
      hint: 'Show all devices in scope',
    },
    {
      key: 'online',
      label: 'Online',
      value: kpis.online,
      icon: <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />,
      activeClass: 'bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/40',
      hint: 'Filter to Online devices',
    },
    {
      key: 'offline',
      label: 'Offline',
      value: kpis.offline,
      icon: <XCircle className="size-3.5 text-red-500 shrink-0" />,
      activeClass: 'bg-red-500/10 ring-1 ring-inset ring-red-500/40',
      hint: 'Filter to Offline devices',
    },
    {
      key: 'stale',
      label: 'Stale',
      value: kpis.stale,
      icon: <Clock className="size-3.5 text-amber-500 shrink-0" />,
      activeClass: 'bg-amber-500/10 ring-1 ring-inset ring-amber-500/40',
      hint: 'Filter to Stale telemetry devices',
    },
    {
      key: 'not_installed',
      label: 'Not installed',
      value: kpis.notInstalled,
      icon: <Unplug className="size-3.5 text-muted-foreground shrink-0" />,
      activeClass: 'bg-primary/10 ring-1 ring-inset ring-primary/40',
      hint: 'Filter devices not mounted on any pole',
    },
    {
      key: 'needs_attention',
      label: 'Needs attention',
      value: kpis.needsAttention,
      icon: <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />,
      activeClass: 'bg-amber-500/10 ring-1 ring-inset ring-amber-500/40',
      hint: 'Offline, Stale, config errors, or vendor conflicts',
    },
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
                'flex flex-col justify-center p-3 rounded-xl border border-border bg-card shadow-xs text-left transition-all cursor-pointer min-h-[64px] min-w-[144px] shrink-0',
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
    <div className="w-full rounded-xl border border-border bg-card shadow-xs grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-4 select-none overflow-hidden">
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
              'flex flex-col justify-center px-4 py-3 text-left transition-all cursor-pointer group border-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
              isTablet ? 'min-h-[80px]' : 'min-h-[74px]',
              idx > 0 && 'lg:border-l',
              idx % 2 === 1 && 'border-l sm:border-l-0',
              idx >= 2 && 'border-t sm:border-t lg:border-t-0',
              idx % 3 !== 0 && 'sm:border-l',
              isActive ? cell.activeClass : 'hover:bg-muted/40'
            )}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground group-hover:text-foreground">
              <span className="font-normal truncate">{cell.label}</span>
              {cell.icon}
            </div>
            <div className="text-2xl font-bold text-foreground tracking-tight tabular-nums mt-0.5">
              {cell.value}
            </div>
          </button>
        );
      })}
    </div>
  );
};

