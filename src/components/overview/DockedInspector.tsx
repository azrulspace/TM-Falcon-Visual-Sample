import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  X,
  Maximize2,
  ExternalLink,
  Camera,
  Layers,
  Cable,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StatusBadge, SeverityBadge } from '@/components/common/StatusBadge';
import { events } from '@/data/events';
import { devices } from '@/data/devices';
import { attention } from '@/data/attention';
import { cases } from '@/data/cases';
import { segments } from '@/data/segments';

interface DockedInspectorProps {
  selectedId: string;
  onBack: () => void;
  onClose: () => void;
  onSelectEntity?: (id: string) => void;
}

export const DockedInspector: React.FC<DockedInspectorProps> = ({
  selectedId,
  onBack,
  onClose,
  onSelectEntity,
}) => {
  const navigate = useNavigate();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [showAllSpanEvents, setShowAllSpanEvents] = useState(false);

  // Resolve matching entity across events, attention items, devices, cases
  const evt = events.find((e) => e.id === selectedId || e.device === selectedId);
  const att = attention.find((a) => a.id === selectedId || a.marker === selectedId);
  const dev = devices.find((d) => d.id === selectedId || d.asset === selectedId);
  const cas = cases.find((c) => c.id === selectedId);

  const isEvent = selectedId.startsWith('EVT_') || att?.kind === 'EVENT';
  const isCase = selectedId.startsWith('CAS_') || att?.kind === 'CASE';
  const isDevice = !isEvent && !isCase;

  // Resolve linked cable span from segments
  const span = segments.find(
    (s) =>
      s.id === 'CBL_002' ||
      s.from === evt?.asset ||
      s.to === evt?.asset ||
      s.from === dev?.asset ||
      s.to === dev?.asset
  ) || segments[0];

  // Events related to this span
  const relatedSpanEvents = events.filter(
    (e) => e.asset === evt?.asset || e.asset === span.from || e.asset === span.to
  );
  const displaySpanEvents = showAllSpanEvents
    ? relatedSpanEvents
    : relatedSpanEvents.slice(0, 4);

  // Image source: CCTV camera or infrastructure pole photo
  const snapshotUrl =
    'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=800&auto=format&fit=crop&q=80';

  return (
    <div className="flex flex-col h-full bg-card/95 backdrop-blur-md rounded-panel border border-border overflow-hidden select-none animate-in fade-in-50 duration-150">
      {/* 1. Header with Back button, Type chip, Mono ID, Status/Priority Badge, and Close button */}
      <div className="p-3 border-b border-border flex items-center justify-between shrink-0 bg-muted/40">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <ArrowLeft className="size-3.5" />
            <span>Needs attention</span>
          </Button>

          <span className="text-muted-foreground/50">|</span>

          <Badge variant="outline" className="text-[10px] font-mono uppercase bg-muted/60">
            {isEvent ? 'Event' : isCase ? 'Case' : 'Device'}
          </Badge>

          <span className="font-mono text-xs font-bold text-primary truncate">{selectedId}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isEvent && (
            <SeverityBadge severity={evt?.priority || att?.badges[0] || 'High'} size="sm" />
          )}
          {isDevice && (
            <StatusBadge status={dev?.status || 'offline'} size="sm" />
          )}
          {isCase && (
            <Badge variant="secondary" className="text-[10px] font-medium bg-primary/10 text-primary border-primary/20">
              Field Work
            </Badge>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground h-7 w-7"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* 2. Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Title */}
        <div>
          <h4 className="text-sm font-bold text-foreground">
            {isEvent ? (evt?.type || att?.title || 'Monkey near cable') : isCase ? (cas?.title || 'Person near pole') : (dev?.name || 'Infrastructure Device')}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {att?.detail || dev?.site || 'Sarawak Pilot Route • Zone 4'}
          </p>
        </div>

        {/* Key Facts Grid (2 columns) */}
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/80 text-xs font-sans">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-muted-foreground font-medium">State</span>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="size-2 rounded-full bg-status-online" />
              <span className="font-semibold text-foreground">
                {acknowledged ? 'Acknowledged' : evt?.state || att?.badges[1] || 'New'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-muted-foreground font-medium">Captured</span>
            <Tooltip>
              <TooltipTrigger render={
                <span className="font-mono text-xs text-foreground cursor-default">
                  {evt?.captured || '05 Oct, 14:25'} MYT
                </span>
              } />
              <TooltipContent side="top" className="text-xs font-mono">
                Relative: 23m ago • ISO: 2026-10-05T06:25:00Z
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex flex-col gap-0.5 pt-2 border-t border-border/50">
            <span className="text-[11px] text-muted-foreground font-medium">Detection Source</span>
            <span className="font-medium text-foreground text-xs">
              AI Encroachment (98.4%)
            </span>
          </div>

          <div className="flex flex-col gap-0.5 pt-2 border-t border-border/50">
            <span className="text-[11px] text-muted-foreground font-medium">Captured by</span>
            <div
              onClick={() => onSelectEntity && onSelectEntity(evt?.device || 'DEV_002')}
              className="flex items-center gap-1.5 font-mono text-xs text-primary font-semibold cursor-pointer hover:underline"
            >
              <span className="size-1.5 rounded-full bg-status-online" />
              <span>{evt?.device || 'DEV_002'}</span>
            </div>
          </div>
        </div>

        {/* Evidence: Snapshot with Timestamp Overlay and Lightbox Trigger */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Camera className="size-3.5" />
              Snapshot Evidence
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">CCTV-KCH-04</span>
          </div>

          <div className="relative rounded-lg overflow-hidden border border-border group bg-black aspect-video max-h-44">
            <img
              src={snapshotUrl}
              alt="Live pole snapshot"
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />
            {/* Timestamp overlay */}
            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono text-white">
              {evt?.captured || '05 Oct, 14:25:12'} MYT
            </div>

            {/* Expand lightbox trigger */}
            <button
              onClick={() => setLightboxOpen(true)}
              className="absolute bottom-2 right-2 p-1.5 rounded-md bg-black/70 text-white hover:bg-black/90 transition-colors"
              aria-label="Expand image"
            >
              <Maximize2 className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Cable Span & Pole Context */}
        <div className="space-y-2 p-2.5 rounded-lg bg-muted/20 border border-border/70 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Cable className="size-3.5 text-primary" />
              Cable Span
            </span>
            <span className="font-mono text-[11px] font-bold text-primary">{span.id}</span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50 text-[11px]">
            <span className="text-muted-foreground">Between poles:</span>
            <div className="flex items-center gap-1.5">
              <span
                onClick={() => onSelectEntity && onSelectEntity(span.from)}
                className="font-mono px-1.5 py-0.5 rounded bg-muted text-foreground cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors font-medium"
              >
                {span.from}
              </span>
              <span className="text-muted-foreground">to</span>
              <span
                onClick={() => onSelectEntity && onSelectEntity(span.to)}
                className="font-mono px-1.5 py-0.5 rounded bg-muted text-foreground cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors font-medium"
              >
                {span.to}
              </span>
            </div>
          </div>
        </div>

        {/* Events on this span */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Layers className="size-3.5" />
              Events on this span ({relatedSpanEvents.length})
            </span>
          </div>

          <div className="divide-y divide-border/60 rounded-md border border-border/70 bg-card overflow-hidden">
            {displaySpanEvents.map((e) => (
              <div
                key={e.id}
                onClick={() => onSelectEntity && onSelectEntity(e.id)}
                className={`p-2 flex items-center justify-between cursor-pointer transition-colors hover:bg-muted/40 ${
                  e.id === selectedId ? 'bg-primary/10' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs font-bold text-primary">{e.id}</span>
                  <span className="text-xs text-foreground truncate">{e.type}</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                  {e.state}
                </Badge>
              </div>
            ))}
          </div>

          {relatedSpanEvents.length > 4 && (
            <button
              onClick={() => setShowAllSpanEvents(!showAllSpanEvents)}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              {showAllSpanEvents ? (
                <>
                  <ChevronUp className="size-3" /> Show fewer
                </>
              ) : (
                <>
                  <ChevronDown className="size-3" /> and {relatedSpanEvents.length - 4} older events
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 3. Sticky Footer Actions */}
      <div className="p-3 border-t border-border bg-card/90 backdrop-blur-xs flex items-center gap-2 shrink-0">
        <Button
          variant={acknowledged ? 'outline' : 'default'}
          size="sm"
          onClick={() => setAcknowledged(true)}
          className="flex-1 text-xs font-semibold gap-1.5"
        >
          <CheckCircle2 className="size-3.5" />
          <span>{acknowledged ? 'Acknowledged' : 'Acknowledge'}</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(isEvent ? '/events' : isCase ? '/planned/cases' : '/assets/inventory')}
          className="flex-1 text-xs font-medium gap-1.5"
        >
          <ExternalLink className="size-3.5" />
          <span>Open {isEvent ? 'event' : isCase ? 'case' : 'device'}</span>
        </Button>
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-3xl p-2 bg-black/95 border-border">
          <div className="relative">
            <img
              src={snapshotUrl}
              alt="High resolution CCTV evidence"
              className="w-full h-auto rounded object-contain max-h-[80vh]"
            />
            <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-xs px-3 py-1 rounded text-xs font-mono text-white">
              CCTV Snapshot • {evt?.captured || '05 Oct, 14:25:12'} MYT • {span.id}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
