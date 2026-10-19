import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Radio } from 'lucide-react';
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
      setLiveClock(`KLT ${datePart} ${timePart}`);
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

  // 24 hour ticks (one tick per hour)
  const hourlyTicks = Array.from({ length: 25 }, (_, i) => ({
    hour: i,
    percent: (i / 24) * 100,
    isMajor: i % 6 === 0,
  }));

  // Event dots along the timeline colored by incident severity (F1)
  const eventDots = [
    { percent: 12, color: 'bg-sky-400', label: 'Telemetry batch' },
    { percent: 28, color: 'bg-sky-400', label: 'Telemetry batch' },
    { percent: 40, color: 'bg-muted-foreground', label: 'DEV-003 Stale' },
    { percent: 54, color: 'bg-sky-400', label: 'Nominal poll' },
    { percent: 68, color: 'bg-sky-400', label: 'Nominal poll' },
    { percent: 78, color: 'bg-status-warning', label: 'EVT-0007 Medium' },
    { percent: 84, color: 'bg-destructive', label: 'DEV-004 Offline' },
    { percent: 90, color: 'bg-destructive', label: 'DEV-011 Offline' },
    { percent: 98, color: 'bg-severity-high', label: 'EVT-0001 High' },
  ];

  return (
    <footer
      className="w-full h-16 px-4 lg:px-6 flex items-center justify-between gap-4 select-none bg-card/95 border-t border-border shadow-md"
      aria-label="Time navigation and live clock"
    >
      {/* Left: Time range label + Segmented switch (Active now / History) (F1) */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-muted-foreground font-medium hidden md:inline">
          Time range
        </span>

        <div className="flex items-center p-0.5 bg-muted/60 border border-border/70 rounded-lg">
          <button
            onClick={() => onTimeModeChange('Active now')}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold transition-all ${
              timeMode === 'Active now'
                ? 'bg-brand-solid text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Radio className="size-3.5" />
            <span>Active now</span>
          </button>
          <button
            onClick={() => onTimeModeChange('History')}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold transition-all ${
              timeMode === 'History'
                ? 'bg-brand-solid text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="size-3.5" />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* Center: Structured 24h Timeline Track with hourly ticks & event dots (F1) */}
      <div className="flex-1 max-w-2xl px-4 flex flex-col justify-center relative">
        <div
          onClick={handleTimelineClick}
          className={`h-9 flex items-center relative cursor-pointer select-none group ${
            timeMode === 'History' ? 'cursor-ew-resize' : 'cursor-default'
          }`}
        >
          {/* Main Horizontal Timeline Bar */}
          <div className="w-full h-0.5 bg-border/90 relative overflow-visible flex items-center">
            {/* Hourly & 6-Hourly Ticks */}
            {hourlyTicks.map((t) => (
              <div
                key={t.hour}
                style={{ left: `${t.percent}%` }}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 ${
                  t.isMajor
                    ? 'w-[1.5px] h-2.5 bg-muted-foreground/60'
                    : 'w-[1px] h-1.5 bg-border'
                }`}
              />
            ))}

            {/* Event Dots colored by severity */}
            {eventDots.map((d, idx) => (
              <span
                key={idx}
                style={{ left: `${d.percent}%` }}
                title={d.label}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-1.5 rounded-full ${d.color} shadow-xs ring-1 ring-background`}
              />
            ))}

            {/* "Now" Marker Line with label above it (F1) */}
            <div
              style={{ left: timeMode === 'History' ? `${scrubberPos}%` : '100%' }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
            >
              <span className="text-[10px] font-sans font-semibold text-primary -translate-y-3.5 select-none">
                {timeMode === 'History' ? `-${Math.round(24 * (1 - scrubberPos / 100))}h` : 'Now'}
              </span>
              <div className="w-0.5 h-5 bg-primary rounded-full shadow-sm" />
            </div>

            {/* Draggable Scrubber Thumb in History Mode */}
            {timeMode === 'History' && (
              <div
                style={{ left: `${scrubberPos}%` }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
              >
                <div className="size-3.5 rounded-full bg-primary border-2 border-white shadow-md cursor-grab active:cursor-grabbing ring-2 ring-primary/40 hover:scale-125 transition-transform" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Range selector + Sans Tabular Clock (F1, H1) */}
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

        {/* Clock in Sans Tabular Figures (CEO_REFERENCE) */}
        <div className="hidden sm:flex items-center font-sans text-xs text-foreground/90 font-medium tabular-nums tracking-normal">
          <span>{liveClock || 'KLT'}</span>
        </div>
      </div>
    </footer>
  );
};
