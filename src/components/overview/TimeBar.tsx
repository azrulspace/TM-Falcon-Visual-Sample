import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TimeBarProps {
  timeMode: string;
  onTimeModeChange: (mode: string) => void;
  historyRange: string;
  onHistoryRangeChange: (range: string) => void;
  onScrubTime?: (val: number) => void;
}

export const TimeBar: React.FC<TimeBarProps> = ({
  timeMode,
  onTimeModeChange,
  historyRange,
  onHistoryRangeChange,
  onScrubTime,
}) => {
  const [scrubberPos, setScrubberPos] = useState<number>(100); // 0 to 100%
  const [liveClock, setLiveClock] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const timePart = now.toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Kuala_Lumpur',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      setLiveClock(`${datePart} ${timePart} MYT`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timeMode !== 'History') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setScrubberPos(percent);
    if (onScrubTime) onScrubTime(percent);
  };

  // Mock tick marks representing incident telemetry density across the 24h window
  const ticks = [5, 12, 18, 25, 33, 40, 52, 65, 71, 80, 88, 94];

  return (
    <div className="glass-panel h-13 px-4 flex items-center justify-between gap-4 select-none shadow-2xl border border-border/80">
      {/* Left: Time range label + Segmented switch (Active now / History) */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-muted-foreground font-semibold hidden md:inline">
          Time range
        </span>

        <Tabs value={timeMode} onValueChange={onTimeModeChange} className="h-8">
          <TabsList className="h-8 p-0.5 bg-muted/60 border border-border/70 rounded-md">
            <TabsTrigger
              value="Active now"
              className="h-7 px-3 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm transition-all"
            >
              Active now
            </TabsTrigger>
            <TabsTrigger
              value="History"
              className="h-7 px-3 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm transition-all"
            >
              History
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Center: Interactive Event Density Timeline */}
      <div className="flex-1 max-w-2xl px-3 flex flex-col justify-center relative">
        <div
          onClick={handleTimelineClick}
          className={`h-5 flex items-center relative cursor-pointer group ${
            timeMode === 'History' ? 'cursor-ew-resize' : 'cursor-default'
          }`}
        >
          {/* Timeline track */}
          <div className="w-full h-1 bg-border/80 rounded-full relative overflow-visible">
            {/* Density ticks */}
            {ticks.map((t, idx) => (
              <span
                key={idx}
                style={{ left: `${t}%` }}
                className="absolute top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-primary/70 group-hover:bg-primary transition-colors"
              />
            ))}

            {/* Now marker or Draggable scrubber */}
            {timeMode === 'Active now' ? (
              <div
                style={{ left: '100%' }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
              >
                <div className="size-3 rounded-full bg-status-online border-2 border-background shadow-xs ring-2 ring-status-online/30 animate-pulse" />
              </div>
            ) : (
              <div
                style={{ left: `${scrubberPos}%` }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center z-10"
              >
                <div className="size-3.5 rounded-full bg-primary border-2 border-background shadow-md ring-2 ring-primary/40" />
                <span className="absolute -top-6 px-1.5 py-0.5 rounded bg-popover border border-border text-[10px] font-mono text-popover-foreground whitespace-nowrap shadow-sm">
                  -{Math.round(24 * (1 - scrubberPos / 100))}h
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Labels below timeline */}
        <div className="flex justify-between items-center text-[10px] text-muted-foreground/80 font-mono -mt-0.5">
          <span>-24h</span>
          <span className="text-[11px] font-semibold text-primary">
            {timeMode === 'Active now' ? 'Now' : 'Historical Scrubber'}
          </span>
          <span>Present</span>
        </div>
      </div>

      {/* Right: Range selector + Monospaced MYT Clock */}
      <div className="flex items-center gap-3 shrink-0">
        <Select value={historyRange} onValueChange={onHistoryRangeChange}>
          <SelectTrigger className="h-8 w-36 text-xs bg-muted/50 border-border text-foreground font-medium">
            <Calendar className="size-3.5 text-muted-foreground mr-1.5" />
            <SelectValue placeholder="Range" />
          </SelectTrigger>
          <SelectContent className="glass-panel text-xs z-50">
            <SelectItem value="Last 24 hours">Last 24 hours</SelectItem>
            <SelectItem value="Last 7 days">Last 7 days</SelectItem>
            <SelectItem value="Last 30 days">Last 30 days</SelectItem>
            <SelectItem value="Custom">Custom Range...</SelectItem>
          </SelectContent>
        </Select>

        <span className="h-4 w-px bg-border/80 hidden sm:inline" />

        <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-foreground font-medium tabular-nums">
          <Clock className="size-3.5 text-muted-foreground" />
          <span>{liveClock || 'MYT'}</span>
        </div>
      </div>
    </div>
  );
};
