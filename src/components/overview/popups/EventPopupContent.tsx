import React, { useState, useMemo } from 'react';
import {
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Video,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { formatId } from '@/lib/utils';
import { useOverview } from '@/contexts/OverviewContext';
import { useEvents } from '@/contexts/EventsContext';
import { devices } from '@/data/devices';
import type { ResolvedEntity } from '@/lib/selection';
import { EvidenceViewer } from '@/components/evidence/EvidenceViewer';

export interface EventPopupContentProps {
  entity: ResolvedEntity;
  onClose: () => void;
  onOpenLiveStream?: (deviceId: string) => void;
}

export const EventPopupContent: React.FC<EventPopupContentProps> = ({
  entity,
  onClose,
  onOpenLiveStream,
}) => {
  const { selectEntity } = useOverview();
  const { events } = useEvents();
  const [spanExpanded, setSpanExpanded] = useState(false);

  const evt = entity.event;
  const rawDeviceId = evt?.device || 'DEV-001';
  const deviceId = formatId(rawDeviceId);

  // Find device record for status & serial
  const devRecord = devices.find(
    (d) => d.id === rawDeviceId || formatId(d.id) === deviceId
  );
  const deviceStatus = devRecord?.status || 'online';
  const deviceSerial = devRecord?.serial || entity.deviceSerial || 'SN_DEV_001';
  const isDeviceOnline = deviceStatus === 'online';

  const rawSpanId = evt?.asset || entity.relatedSpanId || 'CBL-001';
  const spanId = formatId(rawSpanId);
  const detection = evt?.detection || (evt as any)?.ruleCode || 'CCTV-01-Motion Detection';

  // Connecting assets / poles
  const poles = useMemo(() => {
    if ((evt as any)?.poles && Array.isArray((evt as any).poles)) {
      return (evt as any).poles.map(formatId);
    }
    return ['AST-001', 'AST-002'];
  }, [evt]);

  // Events on this span
  const spanEvents = useMemo(() => {
    const list = events.filter(
      (e) => formatId(e.asset || '') === spanId || e.asset === rawSpanId
    );
    return list.length > 0
      ? list
      : [
          { id: entity.id, type: entity.title || 'Monkey near cable', captured: 'Oct 27, 2026, 10:31 PM' },
          { id: 'EVT-0100', type: 'Monkey near cable', captured: 'Oct 27, 2026, 09:15 PM' },
          { id: 'EVT-0099', type: 'Monkey near cable', captured: 'Oct 27, 2026, 08:02 PM' },
          { id: 'EVT-0098', type: 'Monkey near cable', captured: 'Oct 27, 2026, 06:45 PM' },
        ];
  }, [events, spanId, rawSpanId, entity]);

  const totalSpanEventsCount = Math.max(spanEvents.length, 101);
  const latestSpanEvents = spanEvents.slice(0, 4);
  const olderCount = totalSpanEventsCount - latestSpanEvents.length;

  return (
    <div className="space-y-3" data-testid="event-popup-content">
      {/* b. Title & Relative/Absolute Time Line */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-foreground leading-snug">
          {entity.title || evt?.type || 'Monkey near cable'}
        </h3>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="size-3 text-muted-foreground shrink-0" />
          <span>Captured</span>
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="font-medium text-foreground cursor-help underline decoration-dotted decoration-muted-foreground/40">
                  {evt?.captured ? '0 min ago' : '0 min ago'}
                </span>
              }
            />
            <TooltipContent side="top" className="text-xs">
              {evt?.captured || 'Oct 27, 2026, 10:31 PM MYT'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* c. Compact EvidenceViewer (16:9 full-width frame, internal badge, stable height) */}
      <EvidenceViewer
        eventId={entity.id}
        snapshots={evt?.snapshots || ['/monkey-fiber.jpg']}
        capturedTimeMYT={evt?.captured || 'Oct 27, 2026, 10:31 PM MYT'}
        deviceIsOnline={isDeviceOnline}
        compact
        onWatchLive={() => onOpenLiveStream?.(deviceId)}
      />

      {/* d. Key Facts (Two Columns: Detection & Captured By) */}
      <div className="grid grid-cols-2 gap-3 p-2.5 rounded-lg bg-black/10 dark:bg-black/25 border dark:border-[#2a323d] border-slate-200/80 text-xs">
        {/* Left Column: Detection */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[11px] text-muted-foreground">Detection</span>
          <span className="font-medium text-foreground truncate" title={detection}>
            {detection}
          </span>
        </div>

        {/* Right Column: Captured By */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[11px] text-muted-foreground">Captured by</span>
          <button
            type="button"
            onClick={() => selectEntity('device', rawDeviceId || deviceId, { fly: true })}
            className="flex items-center gap-1.5 text-primary hover:underline font-semibold cursor-pointer text-left truncate"
            title={`Select device ${deviceId}`}
          >
            <span
              className={`size-2 rounded-full shrink-0 ${
                isDeviceOnline ? 'bg-emerald-400' : 'bg-rose-500'
              }`}
            />
            <span className="truncate">{deviceId}</span>
          </button>
          {deviceSerial && (
            <span className="text-[10px] font-mono text-muted-foreground truncate">
              Serial {deviceSerial}
            </span>
          )}
        </div>
      </div>

      {/* e. Span Section (Collapsed by Default) */}
      <div className="rounded-lg border dark:border-[#2a323d] border-slate-200/80 overflow-hidden bg-black/5 dark:bg-black/20">
        <button
          type="button"
          onClick={() => setSpanExpanded((prev: boolean) => !prev)}
          className="w-full flex items-center justify-between p-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left"
          aria-expanded={spanExpanded}
        >
          <div className="flex items-center gap-1.5 truncate pr-2">
            <Layers className="size-3.5 text-primary shrink-0" />
            <span className="truncate">
              On cable span <strong className="text-foreground">{spanId}</strong> between{' '}
              {poles[0] || 'AST-001'} and {poles[1] || 'AST-002'}
            </span>
          </div>
          {spanExpanded ? (
            <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          )}
        </button>

        {spanExpanded && (
          <div className="p-2.5 pt-1 border-t dark:border-[#2a323d] border-slate-200/60 space-y-2.5 text-xs animate-in fade-in duration-150">
            {/* Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => selectEntity('span', spanId, { fly: true })}
                className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25 hover:bg-sky-500/20 cursor-pointer transition-colors"
              >
                {spanId}
              </button>
              {poles.map((p: string) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => selectEntity('pole', p, { fly: true })}
                  className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-muted text-foreground border border-border hover:bg-muted/80 cursor-pointer transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Events on this span summary */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] text-muted-foreground font-semibold flex items-center justify-between">
                <span>Events on the span ({totalSpanEventsCount})</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.location.href = `/events?asset=${spanId}`;
                  }}
                  className="text-primary hover:underline text-[10px] cursor-pointer"
                >
                  View all {totalSpanEventsCount}
                </button>
              </div>

              <div className="space-y-1 font-mono text-[11px]">
                {latestSpanEvents.map((e: { id: string; type: string }) => (
                  <div key={e.id} className="flex items-center justify-between text-muted-foreground">
                    <span className="font-semibold text-foreground">{e.id}</span>
                    <span className="font-sans text-[10px] truncate max-w-[160px]">
                      {e.type}
                    </span>
                  </div>
                ))}
                {olderCount > 0 && (
                  <div className="text-[10px] text-muted-foreground/80 italic pt-0.5">
                    and {olderCount} older
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export interface EventPopupFooterProps {
  entity: ResolvedEntity;
  onClose: () => void;
  onOpenLiveStream?: (deviceId: string) => void;
}

export const EventPopupFooter: React.FC<EventPopupFooterProps> = ({
  entity,
  onClose,
  onOpenLiveStream,
}) => {
  const navigate = useNavigate();
  const { selectEntity } = useOverview();

  const evt = entity.event;
  const rawDeviceId = evt?.device || 'DEV-001';
  const deviceId = formatId(rawDeviceId);
  const devRecord = devices.find(
    (d) => d.id === rawDeviceId || formatId(d.id) === deviceId
  );
  const isDeviceOnline = devRecord?.status === 'online';
  const spanId = formatId(evt?.asset || entity.relatedSpanId || 'CBL-001');

  const handleOpenEvent = () => {
    // Preserve navigation continuity
    sessionStorage.setItem(
      'falcon_return_to_map',
      JSON.stringify({ entityId: entity.id, entityType: 'event' })
    );
    onClose();
    navigate(`/events/${entity.id}?source=overview`);
  };

  const handleViewAsset = () => {
    selectEntity('span', spanId, { fly: true });
  };

  return (
    <div className="w-full flex items-center justify-between gap-2" data-testid="event-popup-footer">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleOpenEvent}
          className="h-8 px-3 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
        >
          Open event
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleViewAsset}
          className="h-8 px-3 text-xs font-medium border-border hover:bg-muted cursor-pointer"
        >
          View asset
        </Button>
      </div>

      {/* Watch Live Action (Only when supported / online) */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon-sm"
              variant="outline"
              disabled={!isDeviceOnline}
              onClick={() => onOpenLiveStream?.(deviceId)}
              className="size-8 rounded-lg border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 cursor-pointer"
              aria-label={isDeviceOnline ? 'Watch live stream' : 'The device is offline'}
            >
              <Video className="size-4" />
            </Button>
          }
        />
        <TooltipContent side="top" className="text-xs">
          {isDeviceOnline ? 'Watch live' : 'The device is offline'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
