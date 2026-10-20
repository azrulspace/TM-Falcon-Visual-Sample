import React from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Maximize2,
  Check,
  Briefcase,
  XCircle,
  MoreHorizontal,
  Copy,
  Clock,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DeviceChip } from '@/components/common/DeviceChip';
import { AssetChip } from '@/components/common/AssetChip';
import { RelativeTime, formatRelativeTime, formatAbsoluteMYT } from '@/lib/dateTime';
import { useEvents } from '@/contexts/EventsContext';
import { useToast } from '@/contexts/ToastContext';
import { formatId } from '@/lib/utils';
import type { FalconEvent } from '@/data/events';

export interface EventPeekPanelProps {
  event: FalconEvent | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onOpenDetail: (id: string) => void;
  onOpenLightbox: (event: FalconEvent) => void;
  onOpenCreateCase: (id: string) => void;
  onOpenDismiss: (id: string) => void;
  onOpenAssign: (id: string) => void;
}

export const EventPeekPanel: React.FC<EventPeekPanelProps> = ({
  event,
  onClose,
  onNext,
  onPrev,
  hasPrev,
  hasNext,
  onOpenDetail,
  onOpenLightbox,
  onOpenCreateCase,
  onOpenDismiss,
  onOpenAssign,
}) => {
  const { acknowledgeEvent } = useEvents();
  const { addToast } = useToast();

  if (!event) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/events/${event.id}`;
    navigator.clipboard.writeText(url);
    addToast('info', 'Event link copied to clipboard');
  };

  const handleAcknowledge = () => {
    acknowledgeEvent(event.id);
    addToast('success', `Event ${event.id} acknowledged`);
  };

  const thumbnail = event.snapshots?.[0];

  // SLA Calculation
  const isUnack = event.state === 'New';
  const ageStr = formatRelativeTime(event.captured);

  return (
    <aside
      aria-label="Event peek details"
      className="flex flex-col w-full h-full bg-card border-l border-border text-card-foreground select-none overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200"
    >
      {/* 1. Header Row */}
      <div className="flex items-center justify-between p-3.5 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-sm font-bold text-primary">
            {formatId(event.id)}
          </span>
          <PriorityBadge priority={event.priority} size="sm" />
          <StatusBadge status={event.state} size="sm" />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            disabled={!hasPrev}
            className="size-7 p-0 text-muted-foreground hover:text-foreground"
            title="Previous event (K)"
            aria-label="Previous event"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            disabled={!hasNext}
            className="size-7 p-0 text-muted-foreground hover:text-foreground"
            title="Next event (J)"
            aria-label="Next event"
          >
            <ChevronRight className="size-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenDetail(event.id)}
            className="h-7 px-2 text-xs gap-1 ml-1 text-primary border-primary/30 hover:bg-primary/10"
            title="Open full Incident Dossier (Enter)"
          >
            <ExternalLink className="size-3" />
            <span>Open</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="size-7 p-0 text-muted-foreground hover:text-foreground ml-1"
            title="Close peek (Esc)"
            aria-label="Close peek"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* 2. Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-xs">
        {/* Snapshot Evidence with Lightbox Trigger */}
        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-950 border border-border group shrink-0">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={event.type}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-xs">
              No Snapshot
            </div>
          )}

          {/* Lightbox Trigger Button */}
          <button
            type="button"
            onClick={() => onOpenLightbox(event)}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-opacity flex items-center gap-1 text-[11px] font-medium shadow-md"
            title="Expand in full-screen lightbox"
          >
            <Maximize2 className="size-3.5" />
            <span>Expand</span>
          </button>

          {/* Frame & Rule Overlay */}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white/90 text-[10px] font-mono backdrop-blur-xs">
            {event.detection}
          </div>
        </div>

        {/* SLA Status Indicator */}
        <div className="p-3 rounded-lg border border-border bg-muted/40 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className={`size-4 shrink-0 ${isUnack ? 'text-amber-500' : 'text-emerald-500'}`} />
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">
                {isUnack ? 'Triage SLA Pending' : 'Event Acknowledged'}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {isUnack
                  ? `Unacknowledged for ${ageStr} · SLA target: 30m`
                  : `Triage completed · In progress`}
              </span>
            </div>
          </div>
          {isUnack && (
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              URGENT
            </span>
          )}
        </div>

        {/* Key Facts 2-column grid */}
        <div className="flex flex-col gap-2.5">
          <span className="font-semibold text-xs text-foreground uppercase tracking-wider text-[10px]">
            Key Facts
          </span>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-3 rounded-lg border border-border bg-card">
            {/* Type */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-muted-foreground">Activity Type</span>
              <span className="font-medium text-foreground">{event.type}</span>
            </div>

            {/* Source */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-muted-foreground">Source Feed</span>
              <span className="font-medium text-foreground">{event.source}</span>
            </div>

            {/* Captured */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-muted-foreground">Captured</span>
              <RelativeTime date={event.captured} />
            </div>

            {/* Received */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-muted-foreground">Ingested (MYT)</span>
              <span className="font-mono text-[11px] text-foreground" title={formatAbsoluteMYT(event.receivedAt)}>
                {event.receivedAt}
              </span>
            </div>

            {/* Device */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-muted-foreground">Device</span>
              <DeviceChip deviceId={event.device} />
            </div>

            {/* Asset */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-muted-foreground">Affected Asset</span>
              <AssetChip assetId={event.asset} />
            </div>

            {/* Case */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-muted-foreground">Operational Case</span>
              {event.caseId ? (
                <span className="font-mono text-xs font-semibold text-amber-500">
                  {event.caseId}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>

            {/* Assignee */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-muted-foreground">Analyst Owner</span>
              <span className="font-medium text-foreground">
                {event.assignee || 'Unassigned'}
              </span>
            </div>
          </div>
        </div>

        {/* Short Detection Note */}
        <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5 flex items-start gap-2.5 text-muted-foreground">
          <ShieldAlert className="size-4 shrink-0 text-blue-500 mt-0.5" />
          <div className="flex flex-col gap-0.5 text-[11px]">
            <span className="font-medium text-foreground">Observation Notice</span>
            <span>
              A detection is not proof of damage. Verify physical status or live CCTV stream before dispatching line teams.
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sticky Footer Actions */}
      <div className="p-3 border-t border-border bg-muted/30 shrink-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {event.state === 'New' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAcknowledge}
              className="h-8 px-2.5 text-xs gap-1 border-border text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              title="Acknowledge event (E)"
            >
              <Check className="size-3.5" />
              <span>Acknowledge</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => onOpenCreateCase(event.id)}
            className="h-8 px-3 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            title="Create field case (C)"
          >
            <Briefcase className="size-3.5" />
            <span>Create Case</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenDismiss(event.id)}
            className="h-8 px-2 text-xs border-border text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
            title="Dismiss as false positive"
          >
            <XCircle className="size-3.5" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger render={
            <button className="size-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground border border-border">
              <MoreHorizontal className="size-4" />
            </button>
          } />
          <DropdownMenuContent align="end" className="w-48 text-xs">
            <DropdownMenuItem onClick={() => onOpenDetail(event.id)}>
              <ExternalLink className="size-3.5 mr-2" />
              Open full Incident Dossier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenAssign(event.id)}>
              <UserCheck className="size-3.5 mr-2" />
              Assign to analyst
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenLightbox(event)}>
              <Maximize2 className="size-3.5 mr-2" />
              Open evidence studio
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCopyLink}>
              <Copy className="size-3.5 mr-2" />
              Copy event link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};
