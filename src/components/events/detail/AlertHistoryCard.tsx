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

  const targetInboxUrl = `/events?asset=${assetId}&captured_before=${event.id}&from=${event.id}`;

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* 1. Header with History Icon, "Alert history", and Asset Chip (DETAIL_FINAL) */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <History className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Alert history</h3>
        </div>
        <span className="font-mono text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
          {formatId(assetId)}
        </span>
      </div>

      {/* 2. Content */}
      <div className="p-4 flex flex-col gap-3.5 text-xs">
        <div className="flex flex-col gap-1">
          <span className="text-3xl font-extrabold text-foreground tabular-nums tracking-tight">
            {olderCount}
          </span>
          <span className="text-xs text-muted-foreground">
            older events recorded on this span
          </span>
        </div>

        {/* Span Infrastructure Label */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border">
          <Cable className="size-3.5 shrink-0 text-primary" />
          <span>
            Infrastructure span {formatId(assetId)} ({formatId(poles[0])} → {formatId(poles[1])}).
          </span>
        </div>

        {/* Deep Link to Scoped Event Inbox (Section 4.6 & 6) */}
        <Link
          to={targetInboxUrl}
          className="text-xs text-primary hover:underline font-medium flex items-center gap-1.5 pt-1 cursor-pointer group"
        >
          <span>View all {olderCount} events in Event inbox</span>
          <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
};
