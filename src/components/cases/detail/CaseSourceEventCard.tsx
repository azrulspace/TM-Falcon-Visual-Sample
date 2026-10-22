import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ShieldAlert } from 'lucide-react';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { AssetChip } from '@/components/common/AssetChip';
import { DeviceChip } from '@/components/common/DeviceChip';
import { RelativeTime } from '@/components/common/RelativeTime';
import { formatAbsoluteMYT, parseDate } from '@/lib/dateTime';
import type { CaseWithSourceEvent } from '@/types/cases';

export interface CaseSourceEventCardProps {
  caseData: CaseWithSourceEvent;
}

export const CaseSourceEventCard: React.FC<CaseSourceEventCardProps> = ({ caseData }) => {
  const event = caseData.sourceEvent;
  const capturedDate = event?.captured ? parseDate(event.captured) : null;
  const capturedMYT = capturedDate ? formatAbsoluteMYT(capturedDate) : (event?.captured || 'Not available');

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Source event</h2>
        </div>
        <Link
          to={`/events/${caseData.sourceEventId}`}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
        >
          <span>Open event</span>
          <ExternalLink className="size-3" />
        </Link>
      </div>

      {/* Section 7.4: One compact definition list (not boxes inside a card) */}
      <dl className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-xs">
        {/* 1. Event ID with priority and event status badges */}
        <div className="space-y-1">
          <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Event
          </dt>
          <dd className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/events/${caseData.sourceEventId}`}
              className="font-mono text-xs font-semibold text-primary hover:underline"
            >
              {caseData.sourceEventId}
            </Link>
            {event?.priority && (
              <PriorityBadge priority={event.priority} size="sm" />
            )}
            {event?.status && (
              <StatusBadge status={event.status} size="sm" />
            )}
          </dd>
        </div>

        {/* 2. Type */}
        <div className="space-y-1">
          <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Type
          </dt>
          <dd className="text-foreground font-medium">
            {event?.type || caseData.title || 'Incident follow-up'}
          </dd>
        </div>

        {/* 3. Affected asset */}
        <div className="space-y-1">
          <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Affected asset
          </dt>
          <dd>
            {event?.asset ? (
              <AssetChip assetId={event.asset} />
            ) : (
              <span className="text-muted-foreground">Not available</span>
            )}
          </dd>
        </div>

        {/* 4. Device (with live device status dot from shared store) */}
        <div className="space-y-1">
          <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Device
          </dt>
          <dd>
            {event?.device ? (
              <DeviceChip deviceId={event.device} />
            ) : (
              <span className="text-muted-foreground">Not available</span>
            )}
          </dd>
        </div>

        {/* 5. Captured */}
        <div className="space-y-1 sm:col-span-2">
          <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Captured
          </dt>
          <dd className="flex items-center gap-2 flex-wrap text-foreground">
            <span className="tabular-nums font-medium">{capturedMYT}</span>
            {event?.captured && (
              <span className="text-muted-foreground text-[11px]">
                (<RelativeTime date={event.captured} />)
              </span>
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
};
