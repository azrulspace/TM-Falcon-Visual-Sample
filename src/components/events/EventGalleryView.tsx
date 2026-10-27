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
  Film,
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
import { useUiMode } from '@/hooks/useUiMode';
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
  const { resolvedMode, orientation } = useUiMode();
  const isTablet = resolvedMode === 'tablet';
  const isTabletPortrait = isTablet && orientation === 'portrait';
  const isTabletLandscape = isTablet && orientation === 'landscape';

  const handleCopyLink = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}/events/${eventId}`;
    navigator.clipboard.writeText(url);
    addToast('info', 'Event link copied to clipboard');
  };

  return (
    <div
      className={cn(
        'grid gap-4',
        isTabletPortrait
          ? 'grid-cols-2'
          : isTabletLandscape
          ? 'grid-cols-3'
          : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
      )}
    >
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
                className={cn(
                  "absolute top-1 left-1 z-10 flex items-center justify-center cursor-pointer",
                  isTablet ? "size-11" : "size-8 p-1"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(evt.id);
                }}
              >
                <div className="p-1 rounded-md bg-black/50 backdrop-blur-xs flex items-center justify-center">
                  <Checkbox
                    checked={isSelected}
                    aria-label={`Select event ${formatId(evt.id)}`}
                    className="border-white/70 data-[state=checked]:bg-primary data-[state=checked]:border-primary pointer-events-none"
                  />
                </div>
              </div>

              {/* Badges on Top Right */}
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                {(evt as any).clipStatus === 'ready' && (
                  <div className="p-1 rounded bg-black/70 backdrop-blur-xs text-emerald-400 border border-emerald-500/30" title="Clip ready">
                    <Film className="size-3 fill-emerald-400/20" />
                  </div>
                )}
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
                <div className="flex items-center gap-1.5">
                  {evt.state === 'New' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => acknowledgeEvent(evt.id)}
                      className={cn(
                        "gap-1 text-emerald-600 dark:text-emerald-400 border-border font-medium cursor-pointer",
                        isTablet ? "h-[44px] px-3 text-xs" : "h-7 px-2 text-[11px]"
                      )}
                      title="Acknowledge event"
                    >
                      <Check className="size-3.5" />
                      <span>Ack</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenCreateCaseDialog(evt.id)}
                    className={cn(
                      "gap-1 text-primary border-border font-medium cursor-pointer",
                      isTablet ? "h-[44px] px-3 text-xs" : "h-7 px-2 text-[11px]"
                    )}
                    title="Create case"
                  >
                    <Briefcase className="size-3.5" />
                    <span>Case</span>
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/events/${evt.id}`)}
                    className={cn(
                      "text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center p-0",
                      isTablet ? "size-11" : "size-7"
                    )}
                    title="Open full event detail"
                  >
                    <ExternalLink className={isTablet ? "size-4" : "size-3.5"} />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <button
                        className={cn(
                          "rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer",
                          isTablet ? "size-11" : "size-7"
                        )}
                        aria-label="More options"
                      >
                        <MoreHorizontal className={isTablet ? "size-5" : "size-4"} />
                      </button>
                    } />
                    <DropdownMenuContent align="end" className="w-48 text-xs z-50">
                      <DropdownMenuItem
                        onClick={() => navigate(`/events/${evt.id}`)}
                        className={cn("cursor-pointer gap-2", isTablet && "min-h-[48px]")}
                      >
                        <ExternalLink className="size-3.5 mr-1" />
                        <span>Open detail page</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onOpenAssignDialog(evt.id)}
                        className={cn("cursor-pointer gap-2", isTablet && "min-h-[48px]")}
                      >
                        <UserCheck className="size-3.5 mr-1" />
                        <span>Assign analyst</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onOpenDismissDialog(evt.id)}
                        className={cn("cursor-pointer gap-2", isTablet && "min-h-[48px]")}
                      >
                        <XCircle className="size-3.5 mr-1" />
                        <span>Dismiss (false positive)</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          addToast(
                            'info',
                            `Requested on-demand clip for ${formatId(evt.id)} from device.`,
                            'Clip requested'
                          );
                        }}
                        className={cn("cursor-pointer gap-2", isTablet && "min-h-[48px]")}
                      >
                        <Film className="size-3.5 mr-1 text-primary" />
                        <span>Request clip</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => handleCopyLink(e, evt.id)}
                        className={cn("cursor-pointer gap-2", isTablet && "min-h-[48px]")}
                      >
                        <Copy className="size-3.5 mr-1" />
                        <span>Copy event link</span>
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
