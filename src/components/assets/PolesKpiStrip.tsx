import React from 'react';
import { CheckCircle2, MapPinOff, Cpu, AlertTriangle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiMode } from '@/hooks/useUiMode';
import type { PoleKpiCounts } from '@/data/poleSelectors';

export type PoleKpiKey =
  | 'active_poles'
  | 'missing_location'
  | 'with_linked_device'
  | 'with_events_30d'
  | 'deleted';

export interface PolesKpiStripProps {
  kpis: PoleKpiCounts;
  activeKpi: PoleKpiKey | null;
  onSelectKpi: (key: PoleKpiKey | null) => void;
  showEventsQuery?: boolean;
  isLoading?: boolean;
}

export const PolesKpiStrip: React.FC<PolesKpiStripProps> = ({
  kpis,
  activeKpi,
  onSelectKpi,
  showEventsQuery = true,
  isLoading = false,
}) => {
  const { isTablet, orientation } = useUiMode();
  const isPortrait = isTablet && orientation === 'portrait';

  const cells: {
    key: PoleKpiKey;
    label: string;
    value: number;
    icon: React.ReactNode;
    activeClass: string;
    hint: string;
  }[] = [
    {
      key: 'active_poles',
      label: 'Active poles',
      value: kpis.activePoles,
      icon: <CheckCircle2 className="size-3.5 text-status-online shrink-0" />,
      activeClass: 'bg-status-online-tint ring-1 ring-inset ring-status-online-border',
      hint: 'Filter to Active lifecycle poles',
    },
    {
      key: 'missing_location',
      label: 'Missing location',
      value: kpis.missingLocation,
      icon: <MapPinOff className="size-3.5 text-status-warning shrink-0" />,
      activeClass: 'bg-status-warning-tint ring-1 ring-inset ring-status-warning-border',
      hint: 'Filter poles without GPS coordinates',
    },
    {
      key: 'with_linked_device',
      label: 'With linked device',
      value: kpis.withLinkedDevice,
      icon: <Cpu className="size-3.5 text-primary shrink-0" />,
      activeClass: 'bg-primary/10 ring-1 ring-inset ring-primary/50',
      hint: 'Filter poles with mounted hardware',
    },
    ...(showEventsQuery
      ? [
          {
            key: 'with_events_30d' as PoleKpiKey,
            label: 'With events (30d)',
            value: kpis.withEvents30d,
            icon: <AlertTriangle className="size-3.5 text-status-info shrink-0" />,
            activeClass: 'bg-status-info-tint ring-1 ring-inset ring-status-info-border',
            hint: 'Filter poles with events in the last 30 days',
          },
        ]
      : []),
    {
      key: 'deleted',
      label: 'Deleted',
      value: kpis.deleted,
      icon: <Trash2 className="size-3.5 text-status-offline shrink-0" />,
      activeClass: 'bg-status-offline-tint ring-1 ring-inset ring-status-offline-border',
      hint: 'Switch to Deleted poles view',
    },
  ];

  if (isLoading) {
    return (
      <div
        className={cn(
          'h-[74px] w-full rounded-xl border border-border bg-card shadow-xs flex overflow-x-auto no-scrollbar lg:grid divide-x divide-border mb-4 animate-pulse',
          cells.length === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
        )}
      >
        {cells.map((c) => (
          <div key={c.key} className="flex flex-col justify-center px-4 h-full min-w-[160px] lg:min-w-0">
            <div className="h-3 w-24 bg-muted rounded mb-2" />
            <div className="h-6 w-12 bg-muted rounded" />
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
                'flex flex-col justify-center p-3 rounded-xl border border-border bg-card shadow-xs text-left transition-all cursor-pointer min-h-[64px] min-w-[148px] shrink-0',
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
        'w-full rounded-xl border border-border bg-card shadow-xs flex overflow-x-auto no-scrollbar lg:grid divide-x divide-border mb-4 select-none shrink-0',
        cells.length === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4',
        isTablet ? 'h-[80px]' : 'h-[74px]'
      )}
    >
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
              'flex flex-col justify-center px-4 h-full text-left transition-all cursor-pointer group shrink-0 min-w-[160px] lg:min-w-0 lg:shrink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
              isActive ? cell.activeClass : 'hover:bg-muted/40',
              isTablet && 'min-h-[44px]'
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

