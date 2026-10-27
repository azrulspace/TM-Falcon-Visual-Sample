import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Clock,
  AudioLines,
  CalendarDays,
  ChevronDown,
  RotateCcw,
  Check,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useOverview } from '@/contexts/OverviewContext';
import { initialCases } from '@/data/cases';
import type { FalconCase, CaseStatus } from '@/types/cases';
import {
  formatStagingLiveClock,
  formatTimelineWindowStart,
  formatCaseOpenedDate,
  parseDate,
  getServerNow,
} from '@/lib/dateTime';

export interface TimeBarProps {
  timeMode: 'Active now' | 'History';
  onTimeModeChange: (mode: 'Active now' | 'History') => void;
  historyRange: string;
  onHistoryRangeChange: (range: string) => void;
  onScrubTime?: (val: number) => void;
  className?: string;
}

export const TimeBar: React.FC<TimeBarProps> = ({
  timeMode,
  onTimeModeChange,
  historyRange,
  onHistoryRangeChange,
  onScrubTime,
  className = '',
}) => {
  const { selectEntity, liveState, setLiveState, lastUpdatedTime, refreshNow } = useOverview();
  const [now, setNow] = useState<Date>(() => getServerNow());
  const [scrubberPos, setScrubberPos] = useState<number>(75);
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Ticking 1-second clock in Asia/Kuala_Lumpur
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter cases according to active mode
  const activeCases = useMemo(() => {
    return initialCases.filter((c) => {
      if (!c.createdAt) return false;
      const parsed = parseDate(c.createdAt);
      if (!parsed) return false;
      if (timeMode === 'Active now') {
        return c.status !== 'Closed';
      }
      return true; // History mode considers all cases
    });
  }, [timeMode]);

  // Window calculation matching staging
  // 1 hour in ms: 3,600,000
  const ONE_HOUR_MS = 3600000;
  const nowMs = now.getTime();

  // In Active now mode:
  // Window start is at least 1 hour ago or earliest active case within reasonable live scope (e.g. up to 24h)
  const caseTimestamps = useMemo(() => {
    return activeCases.map((c) => parseDate(c.createdAt)?.getTime() || nowMs);
  }, [activeCases, nowMs]);

  // Reasonable live window: default 2 hours before now or up to earliest case within 12 hours
  const liveWindowStart = useMemo(() => {
    const twelveHoursAgo = nowMs - 12 * ONE_HOUR_MS;
    const recentCaseTimestamps = caseTimestamps.filter((t) => t >= twelveHoursAgo);
    if (recentCaseTimestamps.length > 0) {
      return Math.min(nowMs - ONE_HOUR_MS, ...recentCaseTimestamps);
    }
    return nowMs - ONE_HOUR_MS;
  }, [nowMs, caseTimestamps, ONE_HOUR_MS]);

  const windowStart = timeMode === 'History' ? nowMs - 24 * ONE_HOUR_MS : liveWindowStart;
  const windowEnd = nowMs;
  const windowDuration = Math.max(windowEnd - windowStart, 1000);

  // Partition cases into visible on timeline vs older than window start
  const { visibleCases, olderCases } = useMemo(() => {
    const visible: { caseItem: FalconCase; posPercent: number; timeMs: number }[] = [];
    const older: FalconCase[] = [];

    activeCases.forEach((c) => {
      const t = parseDate(c.createdAt)?.getTime();
      if (!t) return;
      if (t < windowStart) {
        older.push(c);
      } else {
        const pct = 2 + 96 * Math.min(Math.max((t - windowStart) / windowDuration, 0), 1);
        visible.push({ caseItem: c, posPercent: pct, timeMs: t });
      }
    });

    return { visibleCases: visible, olderCases: older };
  }, [activeCases, windowStart, windowDuration]);

  // Status badge background color
  const getStatusColor = (status: CaseStatus) => {
    switch (status) {
      case 'Open':
        return 'bg-amber-500 dark:bg-amber-400';
      case 'In progress':
        return 'bg-sky-500 dark:bg-sky-400';
      case 'In review':
        return 'bg-primary';
      case 'Closed':
      default:
        return 'bg-muted-foreground';
    }
  };

  // Scrubber drag handler
  const handleTimelineScrub = (clientX: number) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const percent = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    setScrubberPos(percent);
    if (onScrubTime) onScrubTime(percent);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (timeMode !== 'History') return;
    setIsDragging(true);
    handleTimelineScrub(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleTimelineScrub(e.clientX);
      }
    };
    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Keyboard navigation for scrubber in History mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (timeMode !== 'History') return;
      if (e.key === 'ArrowLeft') {
        setScrubberPos((prev) => Math.max(2, prev - 4));
      } else if (e.key === 'ArrowRight') {
        setScrubberPos((prev) => Math.min(98, prev + 4));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timeMode]);

  // Handle case dot click: select case entity on map
  const handleSelectCase = (caseItem: FalconCase) => {
    selectEntity('case', caseItem.id, { fly: true, source: 'panel' });
  };

  // Center caption text matching staging
  const captionText = useMemo(() => {
    if (timeMode === 'History') {
      const count = activeCases.length;
      return `Cases opened in this period. ${count === 0 ? 'No cases opened in this period.' : `${count} case${count === 1 ? '' : 's'} opened.`}`;
    }
    const count = activeCases.length;
    if (count === 0) {
      return 'Active cases by opening time. No active cases.';
    }
    return `Active cases by opening time. ${count} active case${count === 1 ? '' : 's'}.`;
  }, [timeMode, activeCases.length]);

  return (
    <footer
      className={`w-full h-[56px] shrink-0 px-4 md:px-6 flex items-center justify-between gap-3 select-none dark:bg-[#10151c] bg-white border-t dark:border-[#2a323d] border-slate-200 z-30 transition-colors ${className}`}
      data-testid="docked-time-bar"
      role="region"
      aria-label="Time navigation and live clock"
    >
      {/* ================= LEFT CONTROLS ================= */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Tooltip on "Cases" label */}
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="text-xs font-medium text-muted-foreground select-none cursor-help hover:text-foreground transition-colors">
                Cases
              </span>
            }
          />
          <TooltipContent side="top" className="text-xs">
            The timeline shows active cases by the time they were opened.
          </TooltipContent>
        </Tooltip>

        {/* Mode Segmented Control: Active now vs History */}
        <div className="bg-slate-100 dark:bg-[#151a22] border dark:border-[#2a323d] border-slate-200 p-0.5 flex h-[34px] items-center rounded-lg overflow-hidden shrink-0">
          {/* Active now button */}
          <button
            type="button"
            onClick={() => onTimeModeChange('Active now')}
            aria-pressed={timeMode === 'Active now'}
            className={`flex items-center justify-center gap-1.5 h-[28px] px-3 rounded-md text-xs transition-all cursor-pointer ${
              timeMode === 'Active now'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <AudioLines className="size-3.5 shrink-0" />
            <span>Active now</span>
          </button>

          {/* History button */}
          <button
            type="button"
            onClick={() => onTimeModeChange('History')}
            aria-pressed={timeMode === 'History'}
            className={`flex items-center justify-center gap-1.5 h-[28px] px-3 rounded-md text-xs transition-all cursor-pointer ${
              timeMode === 'History'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="size-3.5 shrink-0" />
            <span>History</span>
          </button>
        </div>

        {/* History mode range dropdown and Back to Live button */}
        {timeMode === 'History' && (
          <div className="flex items-center gap-2 animate-in fade-in-50 duration-150">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="border dark:border-[#2a323d] border-slate-200 dark:bg-[#151a22] bg-white flex items-center justify-between h-[30px] px-2.5 rounded-md text-xs text-foreground hover:bg-muted/50 transition-colors focus-visible:outline-none cursor-pointer">
                    <CalendarDays className="size-3 text-muted-foreground mr-1.5 shrink-0" />
                    <span className="truncate">{historyRange}</span>
                    <ChevronDown className="size-3 text-muted-foreground ml-1.5 shrink-0" />
                  </button>
                }
              />
              <DropdownMenuContent align="start" className="w-40 bg-popover border border-border text-xs z-50">
                {['Last 24 hours', 'Last 7 days', 'Last 30 days', 'Custom Range...'].map((range) => (
                  <DropdownMenuItem
                    key={range}
                    onClick={() => onHistoryRangeChange(range)}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <span>{range}</span>
                    {historyRange === range && <Check className="size-3 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              onClick={() => onTimeModeChange('Active now')}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer"
              title="Return to live real-time state"
            >
              <RotateCcw className="size-3" />
              <span>Back to live</span>
            </button>
          </div>
        )}
      </div>

      {/* ================= CENTER TIMELINE ================= */}
      <div className="flex-1 flex flex-col justify-center max-w-[700px] h-full relative px-2 md:px-4">
        {/* Caption Centered Above Track */}
        <div className="w-full text-center text-[10.5px] text-muted-foreground truncate mb-1">
          {captionText}
        </div>

        {/* Track Line Container */}
        <div
          ref={timelineRef}
          onMouseDown={handleMouseDown}
          className={`w-full h-[20px] relative flex items-center ${
            timeMode === 'History' ? 'cursor-ew-resize' : 'cursor-default'
          }`}
        >
          {/* Base Horizontal Track Axis */}
          <div className="absolute left-[2%] right-[2%] top-1/2 -translate-y-1/2 h-px bg-border/80 dark:bg-border" />

          {/* 25 Small Ticks Across Track */}
          {Array.from({ length: 25 }, (_, idx) => (
            <span
              key={idx}
              style={{ left: `${2 + 96 * (idx / 24)}%` }}
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-px bg-border/80 pointer-events-none ${
                idx === 0 || idx === 12 || idx === 24 ? 'h-2 bg-muted-foreground/60' : 'h-1.5'
              }`}
            />
          ))}

          {/* "N older" chip at far left if active cases exist before window start */}
          {olderCases.length > 0 && timeMode === 'Active now' && (
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className="absolute left-0 -top-1.5 -translate-x-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border border-amber-500/40 cursor-pointer z-20"
                    title={`${olderCases.length} older active cases before timeline start`}
                  >
                    +{olderCases.length} older
                  </button>
                }
              />
              <PopoverContent side="top" align="start" className="w-64 p-2.5 bg-popover border border-border text-xs z-50">
                <span className="font-semibold text-foreground block mb-1">Older Active Cases</span>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {olderCases.map((oc) => (
                    <button
                      key={oc.id}
                      type="button"
                      onClick={() => handleSelectCase(oc)}
                      className="w-full flex items-center justify-between p-1.5 rounded hover:bg-muted text-left cursor-pointer transition-colors"
                    >
                      <span className="font-mono font-medium text-primary">{oc.id}</span>
                      <span className="text-[10px] text-muted-foreground">{oc.title}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Case Dots on Timeline */}
          {visibleCases.map(({ caseItem, posPercent }) => {
            const statusClass = getStatusColor(caseItem.status);
            return (
              <Tooltip key={caseItem.id}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => handleSelectCase(caseItem)}
                      style={{ left: `${posPercent}%` }}
                      aria-label={`${caseItem.id}, ${caseItem.status}, opened ${formatCaseOpenedDate(caseItem.createdAt)}`}
                      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-2.5 rounded-full ring-2 ring-background transition-transform outline-none hover:scale-150 focus-visible:scale-150 cursor-pointer shadow-xs z-10 ${statusClass}`}
                    />
                  }
                />
                <TooltipContent side="top" className="text-xs p-2 max-w-xs space-y-0.5">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span className={`size-1.5 rounded-full ${statusClass}`} />
                    <span>{caseItem.id} · {caseItem.status}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{caseItem.title}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Opened {formatCaseOpenedDate(caseItem.createdAt)}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}

          {/* White "Now" Dot Marker at Right (Active now mode) */}
          {timeMode === 'Active now' && (
            <span
              style={{ left: '98%' }}
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-2.5 rounded-full bg-foreground shadow-xs z-10"
            />
          )}

          {/* Draggable Scrubber Thumb (History mode) */}
          {timeMode === 'History' && (
            <div
              style={{ left: `${scrubberPos}%` }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 pointer-events-auto"
            >
              <div className="size-3.5 rounded-full bg-primary border-2 border-white shadow-lg ring-2 ring-primary/40 cursor-grab active:cursor-grabbing hover:scale-125 transition-transform" />
            </div>
          )}
        </div>

        {/* Labels Under Track: Window Start (Left) & Now (Right) */}
        <div className="flex items-center justify-between w-full px-[2%] text-[9.5px] font-mono text-muted-foreground tabular-nums -mt-0.5">
          <span>{formatTimelineWindowStart(windowStart)}</span>
          <span>{timeMode === 'History' ? `-${Math.round(24 * (1 - scrubberPos / 100))}h` : 'Now'}</span>
        </div>
      </div>

      {/* ================= RIGHT CONTROLS ================= */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Live Pill with Telemetry Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border dark:border-[#2a323d] border-slate-200/90 dark:bg-[#151a22] bg-white hover:bg-muted/50 transition-colors text-xs font-medium cursor-pointer"
                title="Telemetry connection status"
              >
                <span className="relative flex size-2">
                  {liveState === 'live' ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                      <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full size-2 bg-amber-500" />
                  )}
                </span>
                <span className="text-[11px] font-semibold text-foreground">
                  {liveState === 'live' ? 'Live' : 'Paused'}
                </span>
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-56 bg-popover border border-border text-xs z-50">
            <DropdownMenuLabel className="text-xs font-semibold flex items-center justify-between">
              <span>Telemetry Feed</span>
              <span className="text-[10px] font-normal text-muted-foreground">{lastUpdatedTime}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setLiveState('live')}
              className={`cursor-pointer ${liveState === 'live' ? 'text-emerald-500 font-bold' : ''}`}
            >
              <span className="size-2 rounded-full bg-emerald-500 mr-2 inline-block" />
              <span>Live stream active</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setLiveState('paused')}
              className={`cursor-pointer ${liveState === 'paused' ? 'text-amber-500 font-bold' : ''}`}
            >
              <span className="size-2 rounded-full bg-amber-500 mr-2 inline-block" />
              <span>Pause telemetry stream</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={refreshNow} className="cursor-pointer">
              <RotateCcw className="size-3 mr-2" />
              <span>Refresh data now</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-4 w-px bg-border shrink-0" />

        {/* Live Staging Ticking Clock (e.g. "Tue, 27 Oct 2026, 2:49:50 pm MYT") */}
        <p className="text-xs font-mono tabular-nums text-foreground/90 whitespace-nowrap">
          {formatStagingLiveClock(now)}
        </p>
      </div>
    </footer>
  );
};
