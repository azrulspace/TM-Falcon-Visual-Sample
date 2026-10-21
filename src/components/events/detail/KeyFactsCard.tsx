import React from 'react';
import { DeviceChip } from '@/components/common/DeviceChip';
import { AssetChip } from '@/components/common/AssetChip';
import { formatAbsoluteMYT } from '@/lib/dateTime';
import { RelativeTime } from '@/components/common/RelativeTime';
import { Button } from '@/components/ui/button';
import { UserCheck, Briefcase, Info } from 'lucide-react';
import type { FalconEvent } from '@/data/events';

export interface KeyFactsCardProps {
  event: FalconEvent;
  onOpenCreateCase: () => void;
  onOpenAssign: () => void;
}

export const KeyFactsCard: React.FC<KeyFactsCardProps> = ({
  event,
  onOpenCreateCase,
  onOpenAssign,
}) => {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Info className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Key Operational Facts</h3>
        </div>
      </div>

      {/* Facts List */}
      <div className="p-4 flex flex-col divide-y divide-border text-xs">
        {/* Source Device */}
        <div className="flex items-center justify-between py-2.5">
          <span className="text-muted-foreground">Source Device</span>
          <DeviceChip deviceId={event.device} />
        </div>

        {/* Affected Asset & Span */}
        <div className="flex items-center justify-between py-2.5">
          <span className="text-muted-foreground">Affected Span</span>
          <div className="flex items-center gap-1.5">
            <AssetChip assetId={event.asset} />
            <span className="text-[11px] font-mono text-muted-foreground">
              (P-104 → P-105)
            </span>
          </div>
        </div>

        {/* Case Link */}
        <div className="flex items-center justify-between py-2.5">
          <span className="text-muted-foreground">Operational Case</span>
          {event.caseId ? (
            <span className="font-mono text-xs font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {event.caseId}
            </span>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenCreateCase}
              className="h-6 px-2 text-[11px] gap-1 text-primary border-primary/30 hover:bg-primary/10"
            >
              <Briefcase className="size-3" />
              <span>Create case</span>
            </Button>
          )}
        </div>

        {/* Assignee */}
        <div className="flex items-center justify-between py-2.5">
          <span className="text-muted-foreground">Assigned Analyst</span>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">
              {event.assignee || 'Unassigned'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenAssign}
              className="size-6 p-0 text-muted-foreground hover:text-foreground"
              title="Assign analyst"
            >
              <UserCheck className="size-3" />
            </Button>
          </div>
        </div>

        {/* Captured Timestamp */}
        <div className="flex items-center justify-between py-2.5">
          <span className="text-muted-foreground">Captured</span>
          <RelativeTime date={event.captured} />
        </div>

        {/* Received Timestamp */}
        <div className="flex items-center justify-between py-2.5">
          <span className="text-muted-foreground">Ingested (MYT)</span>
          <span className="font-mono text-[11px] text-foreground" title={formatAbsoluteMYT((event as any).receivedAt)}>
            {(event as any).receivedDisplay || formatAbsoluteMYT((event as any).receivedAt)}
          </span>
        </div>
      </div>
    </div>
  );
};
