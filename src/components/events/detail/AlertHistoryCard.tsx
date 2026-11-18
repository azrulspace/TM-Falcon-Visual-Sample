import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { History, ArrowRight, Cable } from 'lucide-react';
import { useEvents } from '@/contexts/EventsContext';
import { filterEvents } from '@/data/eventSelectors';
import { formatId } from '@/lib/utils';
import type { FalconEvent } from '@/data/events';
import type { EventDetailViewModel } from '@/types/eventDetail';

export interface AlertHistoryCardProps {
  event: FalconEvent | EventDetailViewModel;
}

export const AlertHistoryCard: React.FC<AlertHistoryCardProps> = ({ event }) => {
  const { events } = useEvents();

  const assetId = (event as any).asset || (event as any).affectedAsset?.id || 'CBL-005';
  const poles = (event as any).affectedAsset?.connectingAssets || (event as any).poles || ['AST-006', 'AST-007'];

  // Real count of older events recorded on the same asset span captured before this event
  const olderCount = useMemo(() => {
    return filterEvents(events, {
      asset: assetId,
      capturedBefore: event.id,
    }).length;
  }, [events, assetId, event.id]);

  // V10: "add the 'Event alert history' card only if the older events count exists in the data."
  if (olderCount <= 0) {
    return null;
  }

  const targetInboxUrl = `/events?asset=${assetId}&captured_before=${event.id}&from=${event.id}`;

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden select-none">
      {/* 1. Header: Unified 48px anatomy (V8) */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <History className="size-4 text-primary shrink-0 stroke-[1.5]" />
          <h3 className="text-sm font-semibold text-foreground">Alert history</h3>
        </div>
        <span className="font-mono text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
          {formatId(assetId)}
        </span>
      </div>

      {/* 2. Content (V9: 20px padding, V3: 24px metric count within strict 24/14/12 scale) */}
      <div className="p-5 flex flex-col gap-4 text-xs font-sans">
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
            {olderCount}
          </span>
          <span className="text-xs text-muted-foreground font-sans">
            older events recorded on this span
          </span>
        </div>

        {/* Span Infrastructure Label */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border font-sans">
          <Cable className="size-4 shrink-0 text-primary stroke-[1.5]" />
          <span>
            Infrastructure span <span className="font-mono text-foreground font-medium">{formatId(assetId)}</span> ({formatId(poles[0])} → {formatId(poles[1])}).
          </span>
        </div>

        {/* Deep Link to Scoped Event Inbox */}
        <Link
          to={targetInboxUrl}
          className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1.5 min-h-[32px] pt-1 cursor-pointer group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-xs"
        >
          <span>View all {olderCount} events in Event inbox</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5 stroke-[1.5]" />
        </Link>
      </div>
    </div>
  );
};
