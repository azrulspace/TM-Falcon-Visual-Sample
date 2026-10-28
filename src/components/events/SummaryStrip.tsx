import React, { useMemo } from 'react';
import { AlertCircle, ShieldAlert, FileQuestion, Activity } from 'lucide-react';
import { useEvents } from '@/contexts/EventsContext';
import { useUiMode } from '@/hooks/useUiMode';
import { cn } from '@/lib/utils';
import { getKpiCounts } from '@/data/eventSelectors';
import type { FalconEvent } from '@/data/events';

export type QuickFilterKey = 'new' | 'high_priority' | 'without_case' | 'today';

export interface SummaryStripProps {
  eventsOverride?: FalconEvent[];
  activeQuickFilter: QuickFilterKey | null;
  onSelectQuickFilter: (key: QuickFilterKey | null) => void;
}

export const SummaryStrip: React.FC<SummaryStripProps> = ({
  eventsOverride,
  activeQuickFilter,
  onSelectQuickFilter,
}) => {
  const { events: contextEvents } = useEvents();
  const { resolvedMode, orientation } = useUiMode();
  const isTablet = resolvedMode === 'tablet';
  const isPortrait = orientation === 'portrait';
  const isTabletPortrait = isTablet && isPortrait;

  const dataset = eventsOverride || contextEvents;

  // Single source of truth calculation from eventSelectors.ts
  const kpis = useMemo(() => {
    return getKpiCounts(dataset);
  }, [dataset]);

  const cells: {
    key: QuickFilterKey;
    label: string;
    value: number;
    icon: React.ReactNode;
    activeClass: string;
  }[] = [
    {
      key: 'new',
      label: 'New (unacknowledged)',
      value: kpis.newUnack,
      icon: <AlertCircle className="size-4 text-amber-500 shrink-0" />,
      activeClass: 'bg-amber-500/10 ring-1 ring-inset ring-amber-500/50',
    },
    {
      key: 'high_priority',
      label: 'High & Critical priority',
      value: kpis.highAndCritical,
      icon: <ShieldAlert className="size-4 text-orange-500 shrink-0" />,
      activeClass: 'bg-orange-500/10 ring-1 ring-inset ring-orange-500/50',
    },
    {
      key: 'without_case',
      label: 'Without case',
      value: kpis.withoutCase,
      icon: <FileQuestion className="size-4 text-blue-500 shrink-0" />,
      activeClass: 'bg-blue-500/10 ring-1 ring-inset ring-blue-500/50',
    },
    {
      key: 'today',
      label: 'Today Events',
      value: kpis.todayEvents,
      icon: <Activity className="size-4 text-sky-400 shrink-0" />,
      activeClass: 'bg-sky-500/10 ring-1 ring-inset ring-sky-500/50',
    },
  ];

  return (
    <div
      className={cn(
        'w-full rounded-xl border border-border bg-card shadow-xs mb-4 select-none shrink-0 overflow-hidden',
        isTabletPortrait
          ? 'grid grid-cols-2 divide-x divide-y divide-border min-h-[140px]'
          : 'h-[74px] flex overflow-x-auto no-scrollbar lg:grid lg:grid-cols-4 divide-x divide-border'
      )}
    >
      {cells.map((cell) => {
        const isActive = activeQuickFilter === cell.key;
        return (
          <button
            key={cell.key}
            type="button"
            onClick={() => onSelectQuickFilter(isActive ? null : cell.key)}
            className={cn(
              'flex flex-col justify-center px-4 text-left transition-all cursor-pointer group shrink-0 min-h-[56px]',
              isTabletPortrait ? 'py-3 w-full' : 'h-full min-w-[190px] lg:min-w-0 lg:shrink',
              isActive ? cell.activeClass : 'hover:bg-muted/40'
            )}
            title={`Filter by ${cell.label}`}
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
