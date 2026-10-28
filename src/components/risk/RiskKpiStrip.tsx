import React, { useMemo } from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, Info, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiMode } from '@/hooks/useUiMode';
import { getRiskKpiCounts } from '@/data/riskSelectors';
import type { RiskSegment } from '@/types/risk';

export type RiskKpiKey =
  | 'to_inspect'
  | 'high_priority'
  | 'medium_priority'
  | 'low_priority'
  | 'low_confidence';

export interface RiskKpiStripProps {
  segments: RiskSegment[];
  activeKpi: RiskKpiKey | null;
  onSelectKpi: (key: RiskKpiKey | null) => void;
  isLoading?: boolean;
}

export const RiskKpiStrip: React.FC<RiskKpiStripProps> = ({
  segments,
  activeKpi,
  onSelectKpi,
  isLoading = false,
}) => {
  const { isTablet, orientation } = useUiMode();
  const isPortrait = isTablet && orientation === 'portrait';

  // Computed strictly from real fields (Section 5.3)
  const kpis = useMemo(() => {
    return getRiskKpiCounts(segments);
  }, [segments]);

  const cells: {
    key: RiskKpiKey;
    label: string;
    value: number;
    sublabel?: string;
    icon: React.ReactNode;
    activeClass: string;
    description: string;
  }[] = [
    {
      key: 'to_inspect',
      label: 'Segments to inspect',
      value: kpis.totalToInspect,
      sublabel: 'Pending review',
      icon: <ShieldAlert className="size-3.5 text-primary shrink-0" />,
      activeClass: 'bg-primary/10 ring-1 ring-inset ring-primary/50',
      description: 'Filter by all segments needing inspection',
    },
    {
      key: 'high_priority',
      label: 'High priority',
      value: kpis.highPriority,
      sublabel: 'Urgent attention',
      icon: <AlertTriangle className="size-3.5 text-red-500 shrink-0" />,
      activeClass: 'bg-red-500/10 ring-1 ring-inset ring-red-500/50',
      description: 'Filter by high priority segments',
    },
    {
      key: 'medium_priority',
      label: 'Medium priority',
      value: kpis.mediumPriority,
      sublabel: 'Scheduled inspection',
      icon: <AlertCircle className="size-3.5 text-amber-500 shrink-0" />,
      activeClass: 'bg-amber-500/10 ring-1 ring-inset ring-amber-500/50',
      description: 'Filter by medium priority segments',
    },
    {
      key: 'low_priority',
      label: 'Low priority',
      value: kpis.lowPriority,
      sublabel: 'Routine maintenance',
      icon: <Info className="size-3.5 text-blue-500 shrink-0" />,
      activeClass: 'bg-blue-500/10 ring-1 ring-inset ring-blue-500/50',
      description: 'Filter by low priority segments',
    },
    {
      key: 'low_confidence',
      label: 'Low confidence',
      value: kpis.lowConfidence,
      sublabel: 'Needs more data',
      // Confidence meter uses neutral tones (never red or amber priority colors)
      icon: <HelpCircle className="size-3.5 text-muted-foreground shrink-0" />,
      activeClass: 'bg-muted/80 ring-1 ring-inset ring-foreground/30',
      description: 'Filter by segments where confidence is low',
    },
  ];

  if (isLoading) {
    return (
      <div className="h-[74px] w-full rounded-xl border border-border bg-card shadow-xs flex overflow-x-auto no-scrollbar lg:grid lg:grid-cols-5 divide-x divide-border mb-4 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col justify-center px-4 h-full min-w-[160px] lg:min-w-0">
            <div className="h-3 w-24 bg-muted rounded mb-2" />
            <div className="h-6 w-12 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (isPortrait) {
    return (
      <div className="grid grid-cols-2 gap-2 mb-4 select-none">
        {cells.map((cell) => {
          const isActive = activeKpi === cell.key;
          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onSelectKpi(isActive ? null : cell.key)}
              className={cn(
                'flex flex-col justify-center p-3 rounded-xl border border-border bg-card shadow-xs text-left transition-all cursor-pointer min-h-[64px]',
                isActive ? cell.activeClass : 'hover:bg-muted/40'
              )}
              title={cell.description}
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium truncate">{cell.label}</span>
                {cell.icon}
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-foreground tracking-tight tabular-nums">
                  {cell.value}
                </span>
                {cell.sublabel && (
                  <span className="text-[10px] text-muted-foreground font-mono truncate">
                    {cell.sublabel}
                  </span>
                )}
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
        'h-[74px] w-full rounded-xl border border-border bg-card shadow-xs flex overflow-x-auto no-scrollbar lg:grid lg:grid-cols-5 divide-x divide-border mb-4 select-none shrink-0',
        isTablet && 'h-[80px]'
      )}
    >
      {cells.map((cell) => {
        const isActive = activeKpi === cell.key;
        return (
          <button
            key={cell.key}
            type="button"
            onClick={() => onSelectKpi(isActive ? null : cell.key)}
            className={cn(
              'flex flex-col justify-center px-4 h-full text-left transition-all cursor-pointer group shrink-0 min-w-[160px] lg:min-w-0 lg:shrink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
              isActive ? cell.activeClass : 'hover:bg-muted/40',
              isTablet && 'min-h-[44px]'
            )}
            title={cell.description}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground group-hover:text-foreground">
              <span className="font-normal truncate">{cell.label}</span>
              {cell.icon}
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
                {cell.value}
              </span>
              {cell.sublabel && (
                <span className="text-[10px] text-muted-foreground font-mono truncate hidden xl:inline">
                  {cell.sublabel}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
