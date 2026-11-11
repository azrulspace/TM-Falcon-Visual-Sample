import React from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Cpu,
  Map as MapIcon,
} from 'lucide-react';
import { cn, formatId } from '@/lib/utils';
import type { RiskSegment } from '@/types/risk';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { RiskConfidenceMeter } from './RiskConfidenceMeter';
import { events } from '@/data/events';
import { devices } from '@/data/devices';
import { Button } from '@/components/ui/button';

export interface SegmentDetailContentProps {
  segment: RiskSegment;
  onClose: () => void;
  onInvestigate: (segment: RiskSegment) => void;
  onDismiss: (segment: RiskSegment) => void;
  onShowOnMap?: (segment: RiskSegment) => void;
  isSheet?: boolean;
}

export const SegmentDetailContent: React.FC<SegmentDetailContentProps> = ({
  segment,
  onClose,
  onInvestigate,
  onDismiss,
  onShowOnMap,
  isSheet = false,
}) => {
  // Query matching events from events.ts to preserve single source of truth (Section 5.8 d)
  const normSpan = formatId(segment.spanId);
  const normFrom = formatId(segment.from);
  const normTo = formatId(segment.to);

  const matchedEvents = events.filter((e) => {
    if (!e.asset) return false;
    const a = formatId(e.asset);
    return a === normSpan || a === normFrom || a === normTo;
  });

  const recentEvents = matchedEvents.slice(0, 3);
  // N equals the count used in the basis (same window and same source)
  const basisCount = parseInt(segment.basis.match(/\d+/)?.[0] || String(matchedEvents.length), 10);

  // Context: devices on the segment (Section 5.8 e)
  const relatedDevices = devices.filter((d) => {
    const da = formatId(d.asset);
    return da === normFrom || da === normTo || da === normSpan;
  });

  return (
    <div className="flex flex-col h-full bg-card text-foreground select-none overflow-hidden">
      {/* a. Header: chip "Segment", ID, priority badge, close (Section 5.8 a) */}
      <div className="p-4 border-b border-border/80 flex items-center justify-between gap-3 shrink-0 bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
            Segment
          </span>
          <span className="font-mono font-bold text-sm sm:text-base text-foreground">
            {formatId(segment.id)}
          </span>
          <PriorityBadge priority={segment.priority} size="sm" />
        </div>

        <div className="flex items-center gap-1">
          {isSheet && onShowOnMap && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onShowOnMap(segment)}
              className="h-8 px-2.5 text-xs gap-1.5 border-border"
            >
              <MapIcon className="size-3.5" />
              <span>Show on map</span>
            </Button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close details"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Main Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs no-scrollbar">
        {/* b. Title with the two end assets as links and the route chip (Section 5.8 b) */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              <a
                href={`/assets/poles/${encodeURIComponent(formatId(segment.from))}`}
                className="hover:underline text-primary font-mono"
              >
                {formatId(segment.from)}
              </a>
              <span className="text-muted-foreground mx-1.5 font-sans font-normal">to</span>
              <a
                href={`/assets/poles/${encodeURIComponent(formatId(segment.to))}`}
                className="hover:underline text-primary font-mono"
              >
                {formatId(segment.to)}
              </a>
            </h3>

            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-muted text-muted-foreground border border-border">
              {segment.route}
            </span>
          </div>

          <span className="text-[11px] text-muted-foreground font-mono">
            Cable Span ID: {formatId(segment.spanId)}
          </span>
        </div>

        {/* c. "Why this is ranked here" (Section 5.8 c) */}
        <div className="p-3 rounded-lg border border-border/80 bg-muted/30 space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
            <Sparkles className="size-3.5 text-primary" />
            <span>Why this is ranked here</span>
          </div>

          <div className="text-xs text-foreground/90 leading-relaxed">
            {segment.basis}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Confidence:</span>
              <RiskConfidenceMeter confidence={segment.confidence} size="sm" showLabel={true} />
            </div>

            {segment.lastIncidentTime && (
              <div className="flex items-center gap-1 text-muted-foreground font-mono">
                <Clock className="size-3" />
                <span>Last incident: {segment.lastIncidentTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* d. Recent incidents on this segment (Section 5.8 d) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs text-foreground">
              Recent incidents on this segment ({basisCount})
            </span>
            <a
              href={`/events?asset=${segment.spanId}`}
              className="text-[11px] text-primary hover:underline flex items-center gap-1"
            >
              <span>View all {basisCount} events</span>
              <ExternalLink className="size-3" />
            </a>
          </div>

          {recentEvents.length === 0 ? (
            <div className="p-3 text-center text-muted-foreground border border-dashed border-border rounded-lg text-xs">
              No recent incident history recorded on this span.
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2 rounded-lg border border-border/70 bg-card hover:bg-muted/40 transition-colors flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <a
                      href={`/events/${evt.id}`}
                      className="font-mono font-bold text-primary hover:underline shrink-0"
                    >
                      {formatId(evt.id)}
                    </a>
                    <span className="truncate text-foreground" title={evt.type}>
                      {evt.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {evt.captured}
                    </span>
                    <PriorityBadge priority={evt.priority} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* e. Context: Devices & End Poles (Section 5.8 e) */}
        <div className="space-y-2">
          <span className="font-semibold text-xs text-foreground">Infrastructure Context</span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* End Pole 1 */}
            <div className="p-2 rounded-lg border border-border bg-card flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                <MapPin className="size-3 text-primary" />
                <span>End Pole (From)</span>
              </div>
              <a
                href={`/overview?asset=${segment.from}`}
                className="font-mono font-semibold text-foreground hover:underline"
              >
                {formatId(segment.from)}
              </a>
              <span className="text-[10px] text-emerald-500 font-medium">Pole Active</span>
            </div>

            {/* End Pole 2 */}
            <div className="p-2 rounded-lg border border-border bg-card flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                <MapPin className="size-3 text-primary" />
                <span>End Pole (To)</span>
              </div>
              <a
                href={`/overview?asset=${segment.to}`}
                className="font-mono font-semibold text-foreground hover:underline"
              >
                {formatId(segment.to)}
              </a>
              <span className="text-[10px] text-emerald-500 font-medium">Pole Active</span>
            </div>
          </div>

          {/* Related Devices */}
          {relatedDevices.length > 0 && (
            <div className="mt-1.5 space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium">Connected Devices:</span>
              <div className="flex flex-wrap gap-1.5">
                {relatedDevices.map((d) => (
                  <span
                    key={d.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-[11px] font-mono border border-border"
                  >
                    <Cpu className="size-3 text-muted-foreground" />
                    <span>{d.name}</span>
                    <span
                      className={cn(
                        'size-1.5 rounded-full ml-1',
                        d.status === 'online'
                          ? 'bg-emerald-500'
                          : d.status === 'stale'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      )}
                    />
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* f. Activity: Previous Decisions (Section 5.8 f) */}
        <div className="space-y-1.5">
          <span className="font-semibold text-xs text-foreground">Activity History</span>
          <div className="p-2.5 rounded-lg border border-border bg-muted/20 text-xs space-y-1">
            {segment.status === 'dismissed' ? (
              <div className="text-amber-500 font-medium">
                Dismissed from active inspection queue • Reason: {segment.dismissReason || 'Planner review'}
              </div>
            ) : segment.status === 'investigating' ? (
              <div className="text-primary font-medium">
                Under active field investigation • Work item initiated
              </div>
            ) : (
              <div className="text-muted-foreground">
                No prior planner actions recorded for this ranking cycle.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* g. Footer Actions: Investigate, Dismiss, Open asset (Section 5.8 g) */}
      <div className="p-3.5 border-t border-border/80 bg-muted/15 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 flex-1">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => onInvestigate(segment)}
            className="flex-1 h-9 text-xs font-semibold gap-1.5"
          >
            <ShieldCheck className="size-3.5" />
            <span>Investigate</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onDismiss(segment)}
            className="h-9 px-3 text-xs gap-1.5 border-border"
          >
            <CheckCircle2 className="size-3.5 text-muted-foreground" />
            <span>Dismiss</span>
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => window.open(`/overview?asset=${segment.spanId}`, '_self')}
          className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
          title="Open in Overview"
        >
          <ExternalLink className="size-3.5" />
          <span className="hidden sm:inline">Open asset</span>
        </Button>
      </div>
    </div>
  );
};
