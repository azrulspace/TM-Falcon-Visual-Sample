import React, { useMemo } from 'react';
import { Circle, PlayCircle, Clock, UserX, Hourglass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCaseKpiCounts } from '@/data/caseSelectors';
import type { FalconCase } from '@/types/cases';

export type CaseKpiKey = 'open' | 'in_progress' | 'in_review' | 'unassigned' | 'oldest_open';

export interface CaseKpiStripProps {
  cases: FalconCase[];
  activeKpi: CaseKpiKey | null;
  onSelectKpi: (key: CaseKpiKey | null) => void;
}

export const CaseKpiStrip: React.FC<CaseKpiStripProps> = ({
  cases,
  activeKpi,
  onSelectKpi,
}) => {
  // Computed only from real fields (Section 6.3)
  const kpis = useMemo(() => {
    return getCaseKpiCounts(cases);
  }, [cases]);

  const cells: {
    key: CaseKpiKey;
    label: string;
    value: string | number;
    sublabel?: string;
    icon: React.ReactNode;
    activeClass: string;
  }[] = [
    {
      key: 'open',
      label: 'Open',
      value: kpis.open,
      icon: <Circle className="size-3.5 text-amber-500 shrink-0" />,
      activeClass: 'bg-amber-500/10 ring-1 ring-inset ring-amber-500/50',
    },
    {
      key: 'in_progress',
      label: 'In progress',
      value: kpis.inProgress,
      icon: <PlayCircle className="size-3.5 text-blue-500 shrink-0" />,
      activeClass: 'bg-blue-500/10 ring-1 ring-inset ring-blue-500/50',
    },
    {
      key: 'in_review',
      label: 'In review',
      value: kpis.inReview,
      icon: <Clock className="size-3.5 text-violet-500 shrink-0" />,
      activeClass: 'bg-violet-500/10 ring-1 ring-inset ring-violet-500/50',
    },
    {
      key: 'unassigned',
      label: 'Unassigned',
      value: kpis.unassigned,
      sublabel: 'Non-closed without owner',
      icon: <UserX className="size-3.5 text-slate-400 shrink-0" />,
      activeClass: 'bg-slate-500/10 ring-1 ring-inset ring-slate-500/50',
    },
    {
      key: 'oldest_open',
      label: 'Oldest open',
      value: kpis.oldestOpenAge || '—',
      sublabel: kpis.oldestOpenCaseId ? `Case ${kpis.oldestOpenCaseId}` : undefined,
      icon: <Hourglass className="size-3.5 text-slate-400 shrink-0" />,
      activeClass: 'bg-primary/10 ring-1 ring-inset ring-primary/50',
    },
  ];

  return (
    <div className="h-[74px] w-full rounded-xl border border-border/80 bg-card/60 shadow-xs flex overflow-x-auto no-scrollbar lg:grid lg:grid-cols-5 divide-x divide-border mb-4 select-none shrink-0">
      {cells.map((cell) => {
        const isActive = activeKpi === cell.key;
        return (
          <button
            key={cell.key}
            type="button"
            onClick={() => onSelectKpi(isActive ? null : cell.key)}
            className={cn(
              'flex flex-col justify-center px-4 h-full text-left transition-all cursor-pointer group shrink-0 min-w-[160px] lg:min-w-0 lg:shrink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
              isActive ? cell.activeClass : 'hover:bg-muted/40'
            )}
            title={`Filter by ${cell.label}`}
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
