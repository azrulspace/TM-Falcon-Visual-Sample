import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOverview } from '@/contexts/OverviewContext';
import { useEvents } from '@/contexts/EventsContext';
import { useToast } from '@/contexts/ToastContext';
import type { FalconEvent } from '@/data/events';
import { exportEventsToCsv } from '@/data/eventSelectors';

export interface InboxHeaderProps {
  filteredEvents: FalconEvent[];
}

export const InboxHeader: React.FC<InboxHeaderProps> = ({ filteredEvents }) => {
  const overview = useOverview();
  const { refreshEvents, isRefreshing, incomingNewEventsCount, mergeNewEvents } = useEvents();
  const { addToast } = useToast();

  const [tick, setTick] = useState(0);

  // 15-second heartbeat timer for accurate live age recalculation without full re-render
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Compute live badge status & text adhering strictly to section 3.1
  const { liveStatus, badgeText } = React.useMemo(() => {
    // Suppress unused tick warning while subscribing to heartbeat
    void tick;

    if (overview.liveState === 'paused') {
      return {
        liveStatus: 'paused' as const,
        badgeText: 'Paused • Telemetry paused',
      };
    }

    const intervalSec = overview.refreshInterval || 15;
    const now = Date.now();
    const ageSec = Math.max(0, Math.floor((now - overview.lastFetchTimestamp) / 1000));
    const isStale = ageSec > 2 * intervalSec;

    let ageText = 'just now';
    if (ageSec >= 60) {
      const minutes = Math.floor(ageSec / 60);
      ageText = `${minutes} min ago`;
    } else if (ageSec > 10) {
      ageText = `${ageSec}s ago`;
    }

    if (isStale) {
      return {
        liveStatus: 'stale' as const,
        badgeText: `Stale • Updated ${ageText}`,
      };
    }

    return {
      liveStatus: 'live' as const,
      badgeText: `Live • Updated 5 min ago`,
    };
  }, [overview.liveState, overview.refreshInterval, overview.lastFetchTimestamp, tick]);

  const handleRefresh = useCallback(() => {
    try {
      refreshEvents();
      mergeNewEvents();
      overview.refreshNow();
    } catch {
      addToast('error', 'Failed to refresh event stream. Please retry.');
    }
  }, [refreshEvents, mergeNewEvents, overview, addToast]);

  const handleExport = useCallback(() => {
    if (!filteredEvents || filteredEvents.length === 0) {
      addToast('info', 'No events to export for current filter criteria.');
      return;
    }
    try {
      exportEventsToCsv(filteredEvents);
      addToast('success', `Exported ${filteredEvents.length} events to CSV.`);
    } catch {
      addToast('error', 'Failed to export CSV. Please retry.');
    }
  }, [filteredEvents, addToast]);

  return (
    <div className="flex flex-col gap-2 mb-4 select-none">
      {/* Breadcrumb matching section 3.1 & INBOX_FINAL */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
        <span>Falcon</span>
        <span>/</span>
        <span className="text-foreground font-semibold">Event inbox</span>
      </nav>

      {/* Main Title Row & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Event inbox</h1>
            {/* Live Indicator matching section 3.1 */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/80 border border-border">
              <span className="relative flex size-2">
                {liveStatus === 'live' ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
                    <span className="relative inline-flex rounded-full size-2 bg-[#10b981]" />
                  </>
                ) : liveStatus === 'paused' ? (
                  <span className="relative inline-flex rounded-full size-2 bg-[#ffa114]" />
                ) : (
                  <span className="relative inline-flex rounded-full size-2 bg-[#ef4444]" />
                )}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">
                {badgeText}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Events raised from accepted observations. Open an event to review its evidence and decide whether it needs a case.
          </p>
        </div>

        {/* Right Actions: Refresh and Export ONLY */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Refresh with pending new events badge */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 px-3 text-xs gap-1.5 border-border hover:bg-muted font-medium"
            title="Refresh event stream"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
            <span>Refresh</span>
            {incomingNewEventsCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 tabular-nums">
                {incomingNewEventsCount} new
              </span>
            )}
          </Button>

          {/* Export CSV */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-8 px-3 text-xs gap-1.5 border-border hover:bg-muted font-medium"
            title="Export filtered events as CSV"
          >
            <Download className="size-3.5 text-muted-foreground" />
            <span>Export</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
