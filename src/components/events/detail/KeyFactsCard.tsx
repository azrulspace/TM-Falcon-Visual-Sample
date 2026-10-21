import React from 'react';
import { DeviceChip } from '@/components/common/DeviceChip';
import { AssetChip } from '@/components/common/AssetChip';
import { formatAbsoluteMYT, formatRelativeTime } from '@/lib/dateTime';
import { Button } from '@/components/ui/button';
import { UserCheck, Briefcase, Info } from 'lucide-react';
import type { FalconEvent } from '@/data/events';
import type { EventDetailViewModel } from '@/types/eventDetail';

export interface KeyFactsCardProps {
  event: FalconEvent | EventDetailViewModel;
  onOpenCreateCase: () => void;
  onOpenAssign: () => void;
}

export const KeyFactsCard: React.FC<KeyFactsCardProps> = ({
  event,
  onOpenCreateCase,
  onOpenAssign,
}) => {
  const deviceId = (event as any).device || (event as any).sourceDevice?.id || null;
  const assetId = (event as any).asset || (event as any).affectedAsset?.id || null;
  const poles = (event as any).affectedAsset?.connectingAssets || (event as any).poles || ['AST_006', 'AST_007'];

  const capturedRaw = (event as any).captured || (event as any).capturedAt;
  const capturedAbsolute = formatAbsoluteMYT(capturedRaw);
  const capturedRelative = formatRelativeTime(capturedRaw);

  const receivedRaw = (event as any).receivedAt || (event as any).captured;
  const receivedAbsolute = formatAbsoluteMYT(receivedRaw);
  const receivedRelative = formatRelativeTime(receivedRaw);

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
          <span className="text-muted-foreground font-medium">Source Device</span>
          <DeviceChip deviceId={deviceId} />
        </div>

        {/* Affected Asset & Span */}
        <div className="flex items-center justify-between py-2.5">
          <span className="text-muted-foreground font-medium">Affected Asset</span>
          <div className="flex items-center gap-1.5">
            <AssetChip assetId={assetId} />
            {poles && poles.length >= 2 && (
              <span className="text-[11px] font-mono text-muted-foreground">
                ({poles[0]} → {poles[1]})
              </span>
            )}
          </div>
        </div>

        {/* Operational Case */}
        <div className="flex items-center justify-between py-2.5">
          <span className="text-muted-foreground font-medium">Operational Case</span>
          {event.caseId ? (
            <span className="font-mono text-xs font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {event.caseId}
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground italic">No case</span>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenCreateCase}
                className="h-6 px-2 text-[11px] gap-1 text-primary border-primary/30 hover:bg-primary/10"
              >
                <Briefcase className="size-3" />
                <span>Create case</span>
              </Button>
            </div>
          )}
        </div>

        {/* Assignee */}
        <div className="flex items-center justify-between py-2.5">
          <span className="text-muted-foreground font-medium">Assigned Analyst</span>
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
          <span className="text-muted-foreground font-medium">Captured</span>
          <div className="flex items-center gap-1.5 text-right">
            <span className="font-mono text-[11px] text-foreground" title={capturedAbsolute}>
              {capturedAbsolute}
            </span>
            <span className="text-[11px] text-muted-foreground">({capturedRelative})</span>
          </div>
        </div>

        {/* Ingested Timestamp */}
        <div className="flex items-center justify-between py-2.5">
          <span className="text-muted-foreground font-medium">Ingested</span>
          <div className="flex items-center gap-1.5 text-right">
            <span className="font-mono text-[11px] text-foreground" title={receivedAbsolute}>
              {receivedAbsolute}
            </span>
            <span className="text-[11px] text-muted-foreground">({receivedRelative})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
