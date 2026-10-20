import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { History, ArrowRight, TrendingUp } from 'lucide-react';
import { useEvents } from '@/contexts/EventsContext';
import type { FalconEvent } from '@/data/events';

export interface RelatedSummaryCardProps {
  event: FalconEvent;
}

export const RelatedSummaryCard: React.FC<RelatedSummaryCardProps> = ({ event }) => {
  const { events } = useEvents();

  const spanEvents = useMemo(() => {
    return events.filter((e) => e.asset === event.asset && e.id !== event.id);
  }, [events, event]);

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <History className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Span Alert History</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-foreground tabular-nums">
              {spanEvents.length}
            </span>
            <span className="text-xs text-muted-foreground">
              older events recorded on this span
            </span>
          </div>

          {/* Sparkline */}
          <div className="w-20 h-8 flex items-center justify-center">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 60 24">
              <path
                d="M 0 20 Q 15 22, 25 15 T 45 10 T 60 4"
                fill="none"
                stroke="#2f6fed"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="60" cy="4" r="2" fill="#2f6fed" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
          <TrendingUp className="size-3.5 shrink-0" />
          <span>High recurring activity zone (primate wildlife cluster).</span>
        </div>

        <Link
          to={`/events?asset=${event.asset}`}
          className="text-xs text-primary hover:underline font-medium flex items-center gap-1 pt-1"
        >
          <span>View all {spanEvents.length} events in Event inbox</span>
          <ArrowRight className="size-3" />
        </Link>
      </div>
    </div>
  );
};
