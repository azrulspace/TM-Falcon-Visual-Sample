import React from 'react';
import {
  Clock,
  Radio,
  Layers,
  ExternalLink,
  CheckCircle2,
  FolderPlus,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { formatId } from '@/lib/utils';
import { useOverview } from '@/contexts/OverviewContext';
import type { ResolvedEntity } from '@/lib/selection';
import { EvidenceViewer } from '@/components/evidence/EvidenceViewer';

export interface EventPopupContentProps {
  entity: ResolvedEntity;
  onClose: () => void;
  onAcknowledge?: (id: string) => void;
  onCreateCase?: (id: string) => void;
}

export const EventPopupContent: React.FC<EventPopupContentProps> = ({
  entity,
  onClose,
  onAcknowledge,
  onCreateCase,
}) => {
  const { selectEntity } = useOverview();
  const evt = entity.event;

  const deviceId = evt?.device ? formatId(evt.device) : null;
  const rawDeviceId = evt?.device || '';
  const spanId = evt?.asset ? formatId(evt.asset) : entity.relatedSpanId || 'CBL-001';
  const detection = evt?.detection || evt?.ruleCode || 'Wildlife near line';

  return (
    <div className="space-y-3.5" data-testid="event-popup-content">
      {/* 1. Event Type Header & Detection */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-foreground leading-snug">
          {entity.title || evt?.type || 'Wildlife near cable span'}
        </h3>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <ShieldAlert className="size-3 text-primary shrink-0" />
          <span>{detection}</span>
        </p>
      </div>

      {/* 2. Key Metadata Strip (Capture Time, Device, Span) */}
      <div className="p-2.5 rounded-lg bg-black/10 dark:bg-black/25 border dark:border-[#2a323d] border-slate-200/80 space-y-2">
        {/* Captured Time */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
            <Clock className="size-3.5 text-muted-foreground/80" />
            Captured
          </span>
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="font-medium text-foreground cursor-help underline decoration-dotted decoration-muted-foreground/40">
                  {evt?.captured ? `${evt.captured}` : '14m ago'}
                </span>
              }
            />
            <TooltipContent side="top" className="text-xs">
              {evt?.captured || 'Oct 20, 2026, 4:28 PM MYT'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Captured By Device (Clear Separation of Product ID vs Serial) */}
        {deviceId && (
          <div className="flex items-start justify-between text-xs border-t dark:border-white/5 border-slate-200/60 pt-1.5">
            <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] pt-0.5">
              <Radio className="size-3.5 text-muted-foreground/80" />
              Captured by
            </span>
            <div className="text-right">
              <button
                type="button"
                onClick={() => selectEntity('device', rawDeviceId || deviceId, { fly: true })}
                className="font-medium text-primary hover:underline flex items-center gap-1.5 justify-end cursor-pointer"
                title={`Select device ${deviceId}`}
              >
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span>{deviceId}</span>
              </button>
              {entity.deviceSerial && (
                <span className="font-mono text-[10px] text-muted-foreground block">
                  Serial {entity.deviceSerial}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Cable Span */}
        <div className="flex items-center justify-between text-xs border-t dark:border-white/5 border-slate-200/60 pt-1.5">
          <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
            <Layers className="size-3.5 text-muted-foreground/80" />
            Cable span
          </span>
          <button
            type="button"
            onClick={() => selectEntity('span', spanId, { fly: false })}
            className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25 hover:bg-sky-500/20 cursor-pointer transition-colors"
            title={`Select cable span ${spanId}`}
          >
            {spanId}
          </button>
        </div>
      </div>

      {/* 3. Evidence Viewer with On-Demand Clip State Machine */}
      <EvidenceViewer
        eventId={entity.id}
        snapshots={evt?.snapshots || []}
        capturedTimeMYT={evt?.captured || 'Oct 20, 2026, 4:28 PM MYT'}
        compact
      />

      {/* 4. Footer Actions (Open Event, Acknowledge, Create Case) */}
      <div className="pt-2 border-t dark:border-[#2a323d] border-slate-200 flex items-center justify-between gap-2">
        <Link
          to={`/events?event=${entity.id}`}
          onClick={onClose}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Open event</span>
          <ExternalLink className="size-3" />
        </Link>

        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAcknowledge?.(entity.id)}
                  className="h-7 text-xs px-2.5 gap-1 border-slate-300 dark:border-[#2a323d] cursor-pointer"
                >
                  <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Acknowledge</span>
                </Button>
              }
            />
            <TooltipContent side="top" className="text-xs">
              Mark event acknowledged
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onCreateCase?.(entity.id)}
                  className="h-7 text-xs px-2.5 gap-1 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                >
                  <FolderPlus className="size-3" />
                  <span>Create case</span>
                </Button>
              }
            />
            <TooltipContent side="top" className="text-xs">
              Escalate event to a formal case
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
