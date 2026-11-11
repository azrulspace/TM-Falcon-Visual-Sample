import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { StatusBadge, PriorityBadge } from '@/components/common/StatusBadge';
import { RelativeTime } from '@/components/common/RelativeTime';
import { useEvents } from '@/contexts/EventsContext';
import { getEventsForPole } from '@/data/poleSelectors';
import { formatId } from '@/lib/utils';
import type { PoleWithRelations } from '@/types/assets';
import { cn } from '@/lib/utils';

export interface PoleEventsTabProps {
  pole: PoleWithRelations;
}

/**
 * Events tab for Pole detail: lists events matching this pole directly or via its connected cable spans,
 * with All / On the pole / On its spans filter chips and a "View all in Event inbox" link whose count
 * agrees 100% with the Event inbox filtered view.
 */
export const PoleEventsTab: React.FC<PoleEventsTabProps> = ({ pole }) => {
  const { events } = useEvents();
  const [sourceFilter, setSourceFilter] = useState<'all' | 'pole' | 'spans'>('all');

  const { allEvents, onPoleEvents, onSpanEvents } = useMemo(
    () => getEventsForPole(pole, pole.connectedSpans, pole.linkedDevices, events),
    [pole, events]
  );

  const visibleEvents = useMemo(() => {
    if (sourceFilter === 'pole') return onPoleEvents;
    if (sourceFilter === 'spans') return onSpanEvents;
    return allEvents;
  }, [sourceFilter, allEvents, onPoleEvents, onSpanEvents]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-border">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: 'all' as const, label: 'All', count: allEvents.length },
            { key: 'pole' as const, label: 'On the pole', count: onPoleEvents.length },
            { key: 'spans' as const, label: 'On its spans', count: onSpanEvents.length },
          ].map((item) => {
            const active = sourceFilter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSourceFilter(item.key)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer',
                  active
                    ? 'bg-primary text-primary-foreground border-primary font-semibold'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground'
                )}
              >
                {item.label} ({item.count})
              </button>
            );
          })}
        </div>

        {allEvents.length > 0 && (
          <Link
            to={`/events?pole=${encodeURIComponent(pole.identifier)}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <span>View all in Event inbox ({allEvents.length})</span>
            <ExternalLink className="size-3" />
          </Link>
        )}
      </div>

      {visibleEvents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center space-y-2">
          <div className="size-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto">
            <AlertTriangle className="size-4" />
          </div>
          <p className="text-xs font-semibold text-foreground">
            {allEvents.length === 0
              ? 'No events recorded'
              : 'No events in this filter'}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {allEvents.length === 0
              ? 'Neither this pole nor its connected cable spans have any captured events.'
              : 'Switch to All to see the remaining events for this pole.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted text-muted-foreground border-b border-border">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Event</th>
                <th className="py-2.5 px-3 font-semibold">Priority</th>
                <th className="py-2.5 px-3 font-semibold">Detection</th>
                <th className="py-2.5 px-3 font-semibold">Source</th>
                <th className="py-2.5 px-3 font-semibold">State</th>
                <th className="py-2.5 px-3 font-semibold text-right">Captured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleEvents.map((ev) => {
                const isOnSpan = onSpanEvents.some((s) => s.id === ev.id);
                return (
                  <tr key={ev.id} className="hover:bg-muted/30">
                    <td className="py-2.5 px-3 font-mono font-semibold whitespace-nowrap">
                      <Link
                        to={`/events/${encodeURIComponent(ev.id)}`}
                        className="text-primary hover:underline"
                      >
                        {formatId(ev.id)}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <PriorityBadge priority={ev.priority} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 font-medium text-foreground">
                      {ev.type}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-muted border border-border font-mono text-[11px] text-foreground">
                        {isOnSpan ? `Span: ${ev.asset}` : 'Pole'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge status={ev.state} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap text-muted-foreground">
                      <RelativeTime date={ev.captured} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

