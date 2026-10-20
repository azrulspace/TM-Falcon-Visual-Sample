import React, { useState, useEffect, useRef } from 'react';
import { Clock, AudioLines, CalendarDays, ChevronDown, RotateCcw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TimeBarProps {
  timeMode: 'Active now' | 'History';
  onTimeModeChange: (mode: 'Active now' | 'History') => void;
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
  const [scrubberPos, setScrubberPos] = useState<number>(75); // ~75% corresponds to the "Now" mark in Figma (x: 629 of 640)
  const [liveClock, setLiveClock] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

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

  const handleTimelineScrub = (clientX: number) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
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

  // Keyboard navigation for scrubber: Left/Right arrows in History mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (timeMode !== 'History') return;
      if (e.key === 'ArrowLeft') {
        setScrubberPos((prev) => Math.max(0, prev - 4));
      } else if (e.key === 'ArrowRight') {
        setScrubberPos((prev) => Math.min(100, prev + 4));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timeMode]);

  // Exact tick positions from Figma node 138:13888 (across 640px axis)
  const ticks = [
    { pos: 26, isMajor: false },
    { pos: 53, isMajor: false },
    { pos: 80, isMajor: true },
    { pos: 106, isMajor: false },
    { pos: 133, isMajor: false },
    { pos: 186, isMajor: false },
    { pos: 213, isMajor: false },
    { pos: 240, isMajor: true },
    { pos: 266, isMajor: false },
    { pos: 293, isMajor: false },
    { pos: 346, isMajor: false },
    { pos: 373, isMajor: false },
    { pos: 400, isMajor: true },
    { pos: 426, isMajor: false },
    { pos: 453, isMajor: false },
    { pos: 506, isMajor: false },
    { pos: 533, isMajor: false },
    { pos: 560, isMajor: true },
    { pos: 586, isMajor: false },
    { pos: 613, isMajor: false },
  ];

  // Event dots across the timeline (white, blue, amber, red) matching Figma 138:13914
  const eventDots = [
    { pos: 74, color: '#38bdf8', label: '07:15 Nominal poll' },
    { pos: 176, color: '#38bdf8', label: '08:14 DEV-003 Last data' },
    { pos: 253, color: '#ffffff', label: '10:31 Heartbeat nominal' },
    { pos: 343, color: '#38bdf8', label: '12:00 Routine check' },
    { pos: 432, color: '#38bdf8', label: '13:45 Sensor sync' },
    { pos: 496, color: '#ffa114', label: '14:40 DEV-011 Power loss' },
    { pos: 535, color: '#ffa114', label: '15:15 DEV-004 Signal loss' },
    { pos: 573, color: '#e33f50', label: '15:45 Incident triage' },
    { pos: 624, color: '#e33f50', label: 'Now: Active incidents' },
  ];

  return (
    <footer
      className="w-full h-[72px] shrink-0 px-6 flex items-center justify-between gap-4 select-none dark:bg-[#10151c] bg-white border-t dark:border-[#2a323d] border-slate-200 z-30 transition-colors"
      data-node-id="138:13866"
      data-name="Footer - Time navigation and live clock"
      aria-label="Time navigation and live clock"
    >
      {/* Left: Time range label + Mode Switch (Active now / History) */}
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-[12px] font-normal dark:text-[#a3adbd] text-slate-500 whitespace-nowrap">
          Time range
        </span>

        <div className="bg-slate-100 dark:bg-[#151a22] border dark:border-[#2a323d] border-slate-200 p-0.5 flex h-[38px] items-center rounded-lg overflow-hidden shrink-0">
          {/* Active now button (109px wide in Figma) */}
          <button
            onClick={() => onTimeModeChange('Active now')}
            className={`flex items-center justify-center gap-1.5 h-[32px] w-[109px] rounded-md text-xs transition-all cursor-pointer ${
              timeMode === 'Active now'
                ? 'bg-[#2563eb] font-semibold text-white shadow-xs'
                : 'text-slate-600 dark:text-[#a3adbd] hover:text-slate-900 dark:hover:text-[#e2e7ef]'
            }`}
          >
            <AudioLines className="size-3.5 shrink-0" />
            <span>Active now</span>
          </button>

          {/* History button (88px wide in Figma) */}
          <button
            onClick={() => onTimeModeChange('History')}
            className={`flex items-center justify-center gap-1.5 h-[32px] w-[88px] rounded-md text-xs transition-all cursor-pointer ${
              timeMode === 'History'
                ? 'bg-[#2563eb] font-semibold text-white shadow-xs'
                : 'text-slate-600 dark:text-[#a3adbd] hover:text-slate-900 dark:hover:text-[#e2e7ef]'
            }`}
          >
            <Clock className="size-3.5 shrink-0" />
            <span>History</span>
          </button>
        </div>

        {/* Back to Live button in History mode */}
        {timeMode === 'History' && (
          <button
            onClick={() => onTimeModeChange('Active now')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-[#2563eb]/20 hover:bg-[#2563eb]/30 text-sky-400 transition-colors"
          >
            <RotateCcw className="size-3" />
            <span>Back to live</span>
          </button>
        )}
      </div>

      {/* Center: Event timeline (672px max-width, 36px high in Figma 138:13887) */}
      <div className="flex-1 flex justify-center max-w-[672px] h-[36px] relative px-4">
        <div
          ref={timelineRef}
          onMouseDown={handleMouseDown}
          className={`w-full h-full relative flex items-center ${
            timeMode === 'History' ? 'cursor-ew-resize' : 'cursor-default'
          }`}
        >
          {/* 1px Timeline horizontal axis */}
          <div className="absolute left-0 right-0 top-[18px] h-[2px] dark:bg-[#2a323d] bg-slate-300 rounded-full" />

          {/* Time ticks from Figma 138:13890 */}
          {ticks.map((t, idx) => (
            <div
              key={idx}
              style={{ left: `${(t.pos / 640) * 100}%` }}
              className={`absolute -translate-x-1/2 dark:bg-[#475569] bg-slate-400 w-px ${
                t.isMajor ? 'h-[10px] top-[14px]' : 'h-[6px] top-[16px]'
              }`}
            />
          ))}

          {/* Event dots from Figma 138:13914 */}
          {eventDots.map((d, idx) => (
            <div
              key={idx}
              title={d.label}
              className="absolute top-[16px] -translate-x-1/2 size-[6px] rounded-full hover:scale-150 transition-transform shadow-xs"
              style={{
                left: `${(d.pos / 640) * 100}%`,
                backgroundColor: d.color,
              }}
            />
          ))}

          {/* "Now" Marker Indicator (x: 629px / 640px = ~98% of active span) */}
          <div
            style={{
              left: timeMode === 'History' ? `${scrubberPos}%` : '75%',
            }}
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10 transition-all duration-75"
          >
            <span className="text-[10px] font-semibold dark:text-slate-400 text-slate-600 leading-none mb-1 select-none">
              {timeMode === 'History' ? `-${Math.round(24 * (1 - scrubberPos / 100))}h` : 'Now'}
            </span>
            <div className="w-[1.5px] h-[16px] bg-[#2563eb] rounded-full shadow-xs" />
          </div>

          {/* Draggable thumb in History mode */}
          {timeMode === 'History' && (
            <div
              style={{ left: `${scrubberPos}%` }}
              className="absolute top-[18px] -translate-y-1/2 -translate-x-1/2 z-20"
            >
              <div className="size-3.5 rounded-full bg-[#2563eb] border-2 border-white shadow-lg ring-2 ring-[#2563eb]/50 cursor-grab active:cursor-grabbing hover:scale-125 transition-transform" />
            </div>
          )}
        </div>
      </div>

      {/* Right: Date Range Selector + Live Clock matching Figma 138:13928 */}
      <div className="flex items-center gap-4 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="border dark:border-[#2a323d] border-slate-200 dark:bg-[#151a22] bg-white flex items-center justify-between h-[32px] w-[144px] px-3 rounded-lg text-xs dark:text-[#e2e7ef] text-slate-800 hover:dark:bg-[#1a232e] hover:bg-slate-50 transition-colors focus-visible:outline-none cursor-pointer">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-3.5 text-slate-400 dark:text-[#a3adbd] shrink-0" />
                  <span className="truncate">{historyRange}</span>
                </div>
                <ChevronDown className="size-3 text-slate-400 dark:text-[#a3adbd] shrink-0" />
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-44 bg-popover border border-border text-xs z-50">
            <DropdownMenuItem onClick={() => onHistoryRangeChange('Last 24 hours')} className="cursor-pointer">
              Last 24 hours
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onHistoryRangeChange('Last 7 days')} className="cursor-pointer">
              Last 7 days
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onHistoryRangeChange('Last 30 days')} className="cursor-pointer">
              Last 30 days
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onHistoryRangeChange('Custom Range')} className="cursor-pointer">
              Custom Range...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-[20px] w-px dark:bg-[#2a323d] bg-slate-200 shrink-0" />

        {/* Live Clock Text */}
        <p className="text-[11px] font-normal dark:text-[#a3adbd] text-slate-500 font-mono tabular-nums whitespace-nowrap">
          {liveClock || 'KLT 20 Oct 2026 07:19:47'}
        </p>
      </div>
    </footer>
  );
};
