import React, { useRef, useEffect, useCallback } from 'react';
import {
  ChevronRight,
  MoreVertical,
  ExternalLink,
  ShieldCheck,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { cn, formatId } from '@/lib/utils';
import { useUiMode } from '@/hooks/useUiMode';
import type { RiskSegment } from '@/types/risk';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { RiskConfidenceMeter } from './RiskConfidenceMeter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

export interface RiskSegmentsColumnProps {
  segments: RiskSegment[];
  selectedSegmentId: string | null;
  onSelectSegment: (id: string) => void;
  onInvestigate: (segment: RiskSegment) => void;
  onDismiss: (segment: RiskSegment) => void;
  onOpenHowRankingWorks?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const RiskSegmentsColumn: React.FC<RiskSegmentsColumnProps> = ({
  segments,
  selectedSegmentId,
  onSelectSegment,
  onInvestigate,
  onDismiss,
  onOpenHowRankingWorks,
  isLoading = false,
  className = '',
}) => {
  const { isTablet } = useUiMode();
  const listContainerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Auto-scroll selected row into view (Section 5.6 & 5.7)
  useEffect(() => {
    if (selectedSegmentId) {
      const el = rowRefs.current.get(selectedSegmentId);
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedSegmentId]);

  // Keyboard navigation through list (Section 5.7: Arrow keys, Enter, Escape)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (segments.length === 0) return;

      const currentIndex = segments.findIndex((s) => s.id === selectedSegmentId);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < segments.length - 1 ? currentIndex + 1 : 0;
        onSelectSegment(segments[nextIndex].id);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : segments.length - 1;
        onSelectSegment(segments[prevIndex].id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        // Clear selection
        if (selectedSegmentId) {
          onSelectSegment('');
        }
      }
    },
    [segments, selectedSegmentId, onSelectSegment]
  );

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        'app_card p-0 flex flex-col h-full overflow-hidden focus:outline-none select-none bg-card border border-border shadow-xs',
        className
      )}
      aria-label="Segments to inspect list"
    >
      {/* 1. Header (Exact copy preserved per Section 5.7) */}
      <div className="p-3.5 border-b border-border/80 bg-muted/20 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground tracking-tight">
              Segments to inspect
            </h2>
            <span className="px-1.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-primary/10 text-primary">
              {segments.length}
            </span>
          </div>

          {onOpenHowRankingWorks && (
            <button
              type="button"
              onClick={onOpenHowRankingWorks}
              className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
              title="How ranking works"
            >
              <Sparkles className="size-3 text-primary" />
              <span>Rule info</span>
            </button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground leading-tight">
          Most urgent first based on priority and span confidence.
        </p>
      </div>

      {/* 2. List Body */}
      <div
        ref={listContainerRef}
        className="flex-1 overflow-y-auto divide-y divide-border/60 focus:outline-none no-scrollbar"
      >
        {isLoading ? (
          // Loading Skeletons
          <div className="p-3 space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className="h-[84px] rounded-lg bg-muted/50 p-3 flex flex-col justify-between"
              >
                <div className="flex justify-between items-center">
                  <div className="h-3 w-32 bg-muted rounded" />
                  <div className="h-4 w-12 bg-muted rounded" />
                </div>
                <div className="h-3 w-48 bg-muted rounded" />
                <div className="flex justify-between items-center">
                  <div className="h-3 w-20 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : segments.length === 0 ? (
          // Empty State (Section 5.7)
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <div className="size-11 rounded-full bg-muted flex items-center justify-center mb-3">
              <CheckCircle2 className="size-5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              No segments need inspection
            </h3>
            <p className="text-xs text-muted-foreground max-w-[240px] mb-3">
              All segments in this view meet safety thresholds or have been dismissed.
            </p>
            {onOpenHowRankingWorks && (
              <button
                type="button"
                onClick={onOpenHowRankingWorks}
                className="text-xs text-primary font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Learn how ranking is computed</span>
                <ChevronRight className="size-3.5" />
              </button>
            )}
          </div>
        ) : (
          // Flat Rows: ~88px height, no filled cards (Section 5.7)
          segments.map((s, index) => {
            const isSelected = selectedSegmentId === s.id;
            const rank = index + 1;

            return (
              <div
                key={s.id}
                ref={(el) => {
                  if (el) rowRefs.current.set(s.id, el);
                  else rowRefs.current.delete(s.id);
                }}
                onClick={() => onSelectSegment(s.id)}
                className={cn(
                  'group relative p-3 transition-colors cursor-pointer text-xs flex flex-col justify-between min-h-[86px]',
                  isSelected
                    ? 'bg-primary/8 border-l-2 border-l-primary text-foreground'
                    : 'hover:bg-muted/40 text-foreground border-l-2 border-l-transparent'
                )}
              >
                {/* Top line: Rank, Segment ID, End Assets, Priority & Route */}
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-[10px] text-muted-foreground/80 font-bold shrink-0">
                      #{rank}
                    </span>
                    <span className="font-mono font-bold text-primary shrink-0">
                      {formatId(s.id)}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-medium text-foreground truncate" title={`${s.from} to ${s.to}`}>
                      {formatId(s.from)} to {formatId(s.to)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <PriorityBadge priority={s.priority} size="sm" />
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-muted text-muted-foreground border border-border/80">
                      {s.route}
                    </span>
                  </div>
                </div>

                {/* Middle line: Basis string */}
                <div className="text-[11px] text-muted-foreground truncate mb-1.5" title={s.basis}>
                  {s.basis}
                </div>

                {/* Bottom line: Confidence meter, Last incident time, Quick Actions & Chevron */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-3">
                    <RiskConfidenceMeter confidence={s.confidence} size="sm" showLabel={true} />

                    {s.lastIncidentTime && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger render={
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                              <Clock className="size-3 text-muted-foreground" />
                              <span>{s.lastIncidentTime.split(',')[1]?.trim() || s.lastIncidentTime}</span>
                            </div>
                          } />
                          <TooltipContent side="top" className="text-xs">
                            Last incident: {s.lastIncidentTime}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>

                  {/* Actions & Chevron */}
                  <div className="flex items-center gap-1">
                    {/* Quick action buttons on hover (Desktop) */}
                    <div className="hidden group-hover:flex items-center gap-1 mr-1 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInvestigate(s);
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-colors cursor-pointer"
                      >
                        Investigate
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDismiss(s);
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>

                    {/* Row Menu (always available) */}
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            'p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer',
                            isTablet ? 'size-9 min-w-[36px] min-h-[36px]' : 'size-6'
                          )}
                          aria-label={`Actions for ${formatId(s.id)}`}
                        >
                          <MoreVertical className="size-3.5" />
                        </button>
                      } />
                      <DropdownMenuContent align="end" className="w-48 bg-popover border border-border text-xs z-50">
                        <DropdownMenuItem
                          onClick={() => onInvestigate(s)}
                          className="flex items-center gap-2 cursor-pointer font-medium text-primary"
                        >
                          <ShieldCheck className="size-3.5" />
                          <span>Investigate segment</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => onDismiss(s)}
                          className="flex items-center gap-2 cursor-pointer text-muted-foreground"
                        >
                          <CheckCircle2 className="size-3.5" />
                          <span>Dismiss from list</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => window.open(`/overview?asset=${s.spanId}`, '_self')}
                          className="flex items-center gap-2 cursor-pointer text-muted-foreground"
                        >
                          <ExternalLink className="size-3.5" />
                          <span>Open asset in Overview</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => window.open(`/events?asset=${s.spanId}`, '_self')}
                          className="flex items-center gap-2 cursor-pointer text-muted-foreground"
                        >
                          <Eye className="size-3.5" />
                          <span>View span events</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <ChevronRight className="size-4 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
