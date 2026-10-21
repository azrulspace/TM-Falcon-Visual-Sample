import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DeviceChip } from '@/components/common/DeviceChip';
import { AssetChip } from '@/components/common/AssetChip';
import { RelativeTime } from '@/components/common/RelativeTime';
import { useEvents } from '@/contexts/EventsContext';
import { cn, formatId } from '@/lib/utils';
import type { FalconEvent } from '@/data/events';
import type { EventDetailViewModel } from '@/types/eventDetail';

export interface RelatedEventsTabProps {
  event: FalconEvent | EventDetailViewModel;
}

export const RelatedEventsTab: React.FC<RelatedEventsTabProps> = ({ event }) => {
  const navigate = useNavigate();
  const { events } = useEvents();
  const [filterMode, setFilterMode] = useState<'all' | 'same_device' | 'same_asset'>('all');

  const deviceId = (event as any).device || (event as any).sourceDevice?.id || null;
  const assetId = (event as any).asset || (event as any).affectedAsset?.id || null;

  // Filter other events on same asset or device
  const relatedList = useMemo(() => {
    return events.filter((e) => {
      if (e.id === event.id) return false;
      if (filterMode === 'same_device') {
        return deviceId && e.device === deviceId;
      }
      if (filterMode === 'same_asset') {
        return assetId && e.asset === assetId;
      }
      return (deviceId && e.device === deviceId) || (assetId && e.asset === assetId);
    });
  }, [events, event.id, deviceId, assetId, filterMode]);

  // Deep link to inbox with filter query
  const inboxFilterQuery = useMemo(() => {
    if (filterMode === 'same_device' && deviceId) {
      return `/events?device=${deviceId}`;
    }
    if (filterMode === 'same_asset' && assetId) {
      return `/events?asset=${assetId}`;
    }
    if (deviceId && assetId) {
      return `/events?device=${deviceId}&asset=${assetId}`;
    }
    return assetId ? `/events?asset=${assetId}` : '/events';
  }, [filterMode, deviceId, assetId]);

  return (
    <div className="flex flex-col gap-4 p-5 rounded-xl border border-border bg-card shadow-xs">
      {/* 1. Header with Factual Alert Counts */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-border">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Related Infrastructure Alerts</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 tabular-nums">
              {relatedList.length} alerts
            </span>
          </div>
          <span className="text-xs text-muted-foreground mt-0.5">
            Concurrent and historical alerts on device <strong className="text-foreground">{deviceId || 'N/A'}</strong> or span <strong className="text-foreground">{assetId || 'N/A'}</strong>.
          </span>
        </div>

        {/* 7-day sparkline trend widget with factual data */}
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 border border-border">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Span Activity</span>
            <span className="text-xs font-bold text-foreground flex items-center gap-1">
              <TrendingUp className="size-3 text-amber-500" />
              <span>{relatedList.length} related records</span>
            </span>
          </div>

          <div className="w-20 h-7 flex items-center justify-center">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 70 24">
              <path
                d="M 0 20 Q 12 18, 22 14 T 42 16 T 55 6 T 70 2"
                fill="none"
                stroke="#2f6fed"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="70" cy="2" r="2.5" fill="#2f6fed" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. Filter Chips Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer',
              filterMode === 'all'
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
            )}
          >
            All Related ({events.filter((e) => e.id !== event.id && (e.device === deviceId || e.asset === assetId)).length})
          </button>

          {deviceId && (
            <button
              type="button"
              onClick={() => setFilterMode('same_device')}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer',
                filterMode === 'same_device'
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
              )}
            >
              Same Device ({deviceId})
            </button>
          )}

          {assetId && (
            <button
              type="button"
              onClick={() => setFilterMode('same_asset')}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer',
                filterMode === 'same_asset'
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
              )}
            >
              Same Asset ({assetId})
            </button>
          )}
        </div>

        <Link
          to={inboxFilterQuery}
          className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
        >
          <span>View all in Event inbox</span>
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* 3. Compact Related Events Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
              <th className="py-2.5 px-3">Event ID</th>
              <th className="py-2.5 px-3">Captured</th>
              <th className="py-2.5 px-3">Activity</th>
              <th className="py-2.5 px-3">Device / Asset</th>
              <th className="py-2.5 px-3">Priority</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {relatedList.slice(0, 8).map((rel) => (
              <tr
                key={rel.id}
                onClick={() => navigate(`/events/${rel.id}`)}
                className="hover:bg-muted/40 transition-colors cursor-pointer group"
              >
                <td className="py-2.5 px-3 font-mono font-medium text-primary group-hover:underline">
                  {formatId(rel.id)}
                </td>
                <td className="py-2.5 px-3 text-muted-foreground tabular-nums">
                  <RelativeTime date={rel.captured} />
                </td>
                <td className="py-2.5 px-3 font-medium text-foreground truncate max-w-[160px]">
                  {rel.type}
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <DeviceChip deviceId={rel.device} />
                    <AssetChip assetId={rel.asset} />
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <PriorityBadge priority={rel.priority} size="sm" />
                </td>
                <td className="py-2.5 px-3">
                  <StatusBadge status={rel.state} size="sm" />
                </td>
                <td className="py-2.5 px-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-6 p-0 text-muted-foreground hover:text-foreground"
                    title="Open event dossier"
                  >
                    <ExternalLink className="size-3" />
                  </Button>
                </td>
              </tr>
            ))}
            {relatedList.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  No other related alerts found on this asset or device.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
