import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MoreHorizontal,
  Check,
  Briefcase,
  ExternalLink,
  Copy,
  UserCheck,
  XCircle,
  Camera,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
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
import { RelativeTime } from '@/components/common/RelativeTime';
import { useEvents } from '@/contexts/EventsContext';
import { useToast } from '@/contexts/ToastContext';
import { cn, formatId } from '@/lib/utils';
import type { FalconEvent } from '@/data/events';

export interface EventGalleryViewProps {
  events: FalconEvent[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  activeEventId: string | null;
  onCardClick: (event: FalconEvent) => void;
  onOpenAssignDialog: (id: string) => void;
  onOpenDismissDialog: (id: string) => void;
  onOpenCreateCaseDialog: (id: string) => void;
}

export const EventGalleryView: React.FC<EventGalleryViewProps> = ({
  events,
  selectedIds,
  onToggleSelect,
  activeEventId,
  onCardClick,
  onOpenAssignDialog,
  onOpenDismissDialog,
  onOpenCreateCaseDialog,
}) => {
  const navigate = useNavigate();
  const { acknowledgeEvent } = useEvents();
  const { addToast } = useToast();

  const handleCopyLink = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}/events/${eventId}`;
    navigator.clipboard.writeText(url);
    addToast('info', 'Event link copied to clipboard');
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {events.map((evt) => {
        const isSelected = selectedIds.has(evt.id);
        const isActive = activeEventId === evt.id;
        const thumbnail = evt.snapshots?.[0];

        return (
          <div
            key={evt.id}
            onClick={() => onCardClick(evt)}
            onDoubleClick={() => navigate(`/events/${evt.id}`)}
            className={cn(
              'group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-all cursor-pointer hover:border-primary/50 hover:shadow-md',
              isActive && 'ring-2 ring-primary border-primary bg-primary/5',
              isSelected && 'border-primary/80 bg-primary/5'
            )}
          >
            {/* 16:9 Snapshot Thumbnail Container */}
            <div className="relative aspect-video w-full bg-slate-950 overflow-hidden flex items-center justify-center">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={evt.type}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-1 text-slate-500">
                  <Camera className="size-6 opacity-40" />
                  <span className="text-[10px] uppercase font-mono">No Frame</span>
                </div>
              )}

              {/* Top gradient overlay */}
              <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />

              {/* Selection Checkbox (Top Left) */}
              <div
                className="absolute top-2 left-2 z-10 p-1 rounded-md bg-black/40 backdrop-blur-xs flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(evt.id);
                }}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect(evt.id)}
                  aria-label={`Select event ${formatId(evt.id)}`}
                  className="border-white/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </div>

              {/* Badges on Top Right */}
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                <PriorityBadge priority={evt.priority} size="sm" />
              </div>

              {/* Bottom camera code tag */}
              <div className="absolute bottom-1.5 left-2 z-10 text-[10px] font-mono text-white/80 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
                {evt.detection?.slice(0, 16) || evt.source}
              </div>

              {/* Status on bottom right */}
              <div className="absolute bottom-1.5 right-2 z-10">
                <StatusBadge status={evt.state} size="sm" />
              </div>
            </div>

            {/* Card Content */}
            <div className="flex flex-col p-3 gap-2 flex-1 justify-between">
              {/* Header: ID + Time */}
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-xs font-semibold text-primary">
                  {formatId(evt.id)}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  <RelativeTime date={evt.captured} />
                </span>
              </div>

              {/* Event Type */}
              <div className="font-medium text-sm text-foreground line-clamp-1" title={evt.type}>
                {evt.type}
              </div>

              {/* Device and Asset Chips */}
              <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <DeviceChip deviceId={evt.device} />
                <AssetChip assetId={evt.asset} />
              </div>

              {/* Card Footer: Quick Actions & Overflow */}
              <div
                className="flex items-center justify-between pt-2 border-t border-border mt-1"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1">
                  {evt.state === 'New' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => acknowledgeEvent(evt.id)}
                      className="h-6 px-1.5 text-[11px] gap-1 text-emerald-600 dark:text-emerald-400 border-border"
                      title="Acknowledge event"
                    >
                      <Check className="size-3" />
                      <span>Ack</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenCreateCaseDialog(evt.id)}
                    className="h-6 px-1.5 text-[11px] gap-1 text-primary border-border"
                    title="Create case"
                  >
                    <Briefcase className="size-3" />
                    <span>Case</span>
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/events/${evt.id}`)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    title="Open full event detail"
                  >
                    <ExternalLink className="size-3" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <button className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="size-3" />
                      </button>
                    } />
                    <DropdownMenuContent align="end" className="w-44 text-xs">
                      <DropdownMenuItem onClick={() => navigate(`/events/${evt.id}`)}>
                        <ExternalLink className="size-3.5 mr-2" />
                        Open detail page
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onOpenAssignDialog(evt.id)}>
                        <UserCheck className="size-3.5 mr-2" />
                        Assign analyst
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onOpenDismissDialog(evt.id)}>
                        <XCircle className="size-3.5 mr-2" />
                        Dismiss (false positive)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => handleCopyLink(e, evt.id)}>
                        <Copy className="size-3.5 mr-2" />
                        Copy event link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
