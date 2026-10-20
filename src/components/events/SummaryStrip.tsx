import React, { useMemo } from 'react';
import { useEvents } from '@/contexts/EventsContext';
import { cn } from '@/lib/utils';
import { AlertCircle, ShieldAlert, FileQuestion, Clock, Activity } from 'lucide-react';

export interface SummaryStripProps {
  activeQuickFilter: string | null;
  onSelectQuickFilter: (key: string | null) => void;
}

export const SummaryStrip: React.FC<SummaryStripProps> = ({
  activeQuickFilter,
  onSelectQuickFilter,
}) => {
  const { events } = useEvents();

  const metrics = useMemo(() => {
    const unacknowledged = events.filter((e) => e.state === 'New');
    const highAndCritical = events.filter((e) => e.priority === 'High' || e.priority === 'Critical');
    const withoutCase = events.filter((e) => !e.caseId);
    
    // Oldest unacknowledged calculation
    let oldestUnackText = '0m';
    let isOverSla = false;
    if (unacknowledged.length > 0) {
      // Find oldest
      oldestUnackText = unacknowledged[unacknowledged.length - 1].unacknowledgedDuration || '3d';
      isOverSla = unacknowledged.some((e) => e.overSla);
    }

    // Events in last 24h
    const last24hCount = events.filter((e) => {
      const cap = e.captured.toLowerCase();
      return cap.includes('m ago') || cap.includes('h ago') || cap.includes('just now');
    }).length;

    return {
      newCount: unacknowledged.length,
      highPriorityCount: highAndCritical.length,
      withoutCaseCount: withoutCase.length,
      oldestUnack: oldestUnackText,
      isOverSla,
      last24hCount,
    };
  }, [events]);

  return (
    <div className="h-[72px] w-full rounded-xl border border-border bg-card shadow-xs grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-border overflow-hidden mb-4 select-none">
      {/* 1. New (not acknowledged) */}
      <button
        onClick={() => onSelectQuickFilter(activeQuickFilter === 'new' ? null : 'new')}
        className={cn(
          'flex flex-col justify-center px-4 h-full text-left transition-colors cursor-pointer group',
          activeQuickFilter === 'new' ? 'bg-amber-500/10 dark:bg-amber-500/15' : 'hover:bg-muted/40'
        )}
      >
        <div className="flex items-center justify-between text-xs text-muted-foreground group-hover:text-foreground">
          <span className="font-medium truncate">New (unacknowledged)</span>
          <AlertCircle className="size-3.5 text-amber-500 shrink-0" />
        </div>
        <div className="text-2xl font-semibold text-foreground tracking-tight tabular-nums mt-0.5">
          {metrics.newCount}
        </div>
      </button>

      {/* 2. High & Critical Priority */}
      <button
        onClick={() => onSelectQuickFilter(activeQuickFilter === 'high_priority' ? null : 'high_priority')}
        className={cn(
          'flex flex-col justify-center px-4 h-full text-left transition-colors cursor-pointer group',
          activeQuickFilter === 'high_priority' ? 'bg-orange-500/10 dark:bg-orange-500/15' : 'hover:bg-muted/40'
        )}
      >
        <div className="flex items-center justify-between text-xs text-muted-foreground group-hover:text-foreground">
          <span className="font-medium truncate">High & Critical priority</span>
          <ShieldAlert className="size-3.5 text-orange-500 shrink-0" />
        </div>
        <div className="text-2xl font-semibold text-foreground tracking-tight tabular-nums mt-0.5">
          {metrics.highPriorityCount}
        </div>
      </button>

      {/* 3. Without Case */}
      <button
        onClick={() => onSelectQuickFilter(activeQuickFilter === 'without_case' ? null : 'without_case')}
        className={cn(
          'flex flex-col justify-center px-4 h-full text-left transition-colors cursor-pointer group',
          activeQuickFilter === 'without_case' ? 'bg-blue-500/10 dark:bg-blue-500/15' : 'hover:bg-muted/40'
        )}
      >
        <div className="flex items-center justify-between text-xs text-muted-foreground group-hover:text-foreground">
          <span className="font-medium truncate">Without case</span>
          <FileQuestion className="size-3.5 text-blue-500 shrink-0" />
        </div>
        <div className="text-2xl font-semibold text-foreground tracking-tight tabular-nums mt-0.5">
          {metrics.withoutCaseCount}
        </div>
      </button>

      {/* 4. Oldest Unacknowledged */}
      <div className="flex flex-col justify-center px-4 h-full text-left">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium truncate">Oldest unacknowledged</span>
          <Clock className={cn('size-3.5 shrink-0', metrics.isOverSla ? 'text-destructive' : 'text-muted-foreground')} />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn('text-2xl font-semibold tracking-tight tabular-nums', metrics.isOverSla ? 'text-destructive' : 'text-foreground')}>
            {metrics.oldestUnack}
          </span>
          {metrics.isOverSla && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-destructive/15 text-destructive border border-destructive/30 uppercase tracking-wider">
              SLA Breached
            </span>
          )}
        </div>
      </div>

      {/* 5. Last 24 Hours Volume + Sparkline */}
      <div className="flex items-center justify-between px-4 h-full col-span-2 sm:col-span-1">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium truncate">Events in 24h</span>
            <Activity className="size-3.5 text-primary shrink-0" />
          </div>
          <div className="text-2xl font-semibold text-foreground tracking-tight tabular-nums mt-0.5">
            {metrics.last24hCount}
          </div>
        </div>

        {/* Small SVG Sparkline */}
        <div className="w-16 h-8 flex items-center justify-end shrink-0">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 60 28">
            <defs>
              <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2f6fed" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#2f6fed" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M 0 24 Q 10 18, 20 20 T 35 10 T 48 14 T 60 4"
              fill="none"
              stroke="#2f6fed"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M 0 24 Q 10 18, 20 20 T 35 10 T 48 14 T 60 4 L 60 28 L 0 28 Z"
              fill="url(#sparklineGrad)"
            />
            <circle cx="60" cy="4" r="2.5" fill="#2f6fed" />
          </svg>
        </div>
      </div>
    </div>
  );
};
