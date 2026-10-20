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
  const [scrubberPos, setScrubberPos] = useState<number>(68); // ~68% corresponds to the "Now" mark in Figma (x: 499 of 729)
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

  // Exact tick positions from Figma node 132:10970 (scaled across 729px axis)
  const ticks = [
    { pos: 18, isMajor: true },
    { pos: 44, isMajor: false },
    { pos: 91, isMajor: false },
    { pos: 116, isMajor: true },
    { pos: 141, isMajor: false },
    { pos: 218, isMajor: false },
    { pos: 250, isMajor: true },
    { pos: 277, isMajor: false },
    { pos: 302, isMajor: false },
    { pos: 327, isMajor: true },
    { pos: 356, isMajor: false },
    { pos: 409, isMajor: false },
    { pos: 441, isMajor: true },
    { pos: 477, isMajor: false },
    { pos: 498, isMajor: false },
    { pos: 527, isMajor: true },
    { pos: 555, isMajor: false },
    { pos: 578, isMajor: false },
    { pos: 605, isMajor: true },
    { pos: 631, isMajor: false },
    { pos: 705, isMajor: false },
  ];

  // Exact event dot positions from Figma node 132:10970
  const eventDots = [
    { pos: 42, color: '#6a7685', label: '04:00 Telemetry batch' },
    { pos: 65, color: '#6a7685', label: '05:30 Poll pulse' },
    { pos: 89, color: '#6a7685', label: '07:15 Nominal poll' },
    { pos: 114, color: '#6a7685', label: '08:14 DEV-003 Last data' },
    { pos: 139, color: '#6a7685', label: '09:00 Heartbeat poll' },
    { pos: 164, color: '#6a7685', label: '10:31 DEV-008 Last data' },
    { pos: 216, color: '#38bdf8', label: '11:20 Span verification' },
    { pos: 248, color: '#38bdf8', label: '12:00 Routine check' },
    { pos: 275, color: '#38bdf8', label: '12:45 Sensor calibrate' },
    { pos: 300, color: '#38bdf8', label: '13:10 CCTV buffer sync' },
    { pos: 325, color: '#38bdf8', label: '13:30 Telemetry nominal' },
    { pos: 354, color: '#38bdf8', label: '14:00 Fiber power poll' },
    { pos: 407, color: '#38bdf8', label: '14:40 DEV-011 Power loss' },
    { pos: 439, color: '#38bdf8', label: '15:15 DEV-004 Signal loss' },
    { pos: 475, color: '#38bdf8', label: '15:45 Incident triage desk' },
    { pos: 525, color: '#6a7685', label: '16:00 Predicted clearing' },
    { pos: 553, color: '#6a7685', label: '16:30 Scheduled poll' },
    { pos: 576, color: '#6a7685', label: '17:00 Event review' },
    { pos: 603, color: '#6a7685', label: '18:00 Batch archive' },
    { pos: 629, color: '#6a7685', label: '19:00 Diagnostic run' },
    { pos: 703, color: '#6a7685', label: '21:00 Night baseline' },
  ];

  return (
    <footer
      className="w-full h-[94px] shrink-0 px-6 flex items-center justify-between gap-[18px] select-none dark:bg-[#10151c] bg-white border-t dark:border-[#2a323d] border-slate-200 z-30 transition-colors"
      data-node-id="132:10970"
      data-name="Activity timeline"
      aria-label="Time navigation and live clock"
    >
      {/* Left: Time range label + Segmented switch (Active now / History) */}
      <div className="flex items-center gap-[18px] shrink-0">
        <span className="text-[11px] font-normal dark:text-[#a3adbd] text-slate-500 whitespace-nowrap">
          Time range
        </span>

        <div className="bg-[#202832] border border-[#2a323d] flex h-[35px] items-center rounded-[5px] overflow-hidden shrink-0 w-[226px]">
          {/* Active now button (117px wide) */}
          <button
            onClick={() => onTimeModeChange('Active now')}
            className={`flex items-center justify-center gap-[7px] h-[35px] w-[117px] rounded-[5px] text-[11px] transition-all cursor-pointer ${
              timeMode === 'Active now'
                ? 'bg-[#1850a0] font-semibold text-[#e2e7ef] shadow-sm'
                : 'text-[#a3adbd] hover:text-[#e2e7ef]'
            }`}
          >
            <AudioLines className="size-[13px] shrink-0" />
            <span className="leading-none">Active now</span>
          </button>

          {/* History button (109px wide) */}
          <button
            onClick={() => onTimeModeChange('History')}
            className={`flex items-center justify-center gap-[8px] h-[35px] w-[109px] rounded-[5px] text-[11px] transition-all cursor-pointer ${
              timeMode === 'History'
                ? 'bg-[#1850a0] font-semibold text-[#e2e7ef] shadow-sm'
                : 'text-[#a3adbd] hover:text-[#e2e7ef]'
            }`}
          >
            <Clock className="size-[14px] shrink-0" />
            <span className="leading-none">History</span>
          </button>
        </div>

        {/* Back to Live button in History mode */}
        {timeMode === 'History' && (
          <button
            onClick={() => onTimeModeChange('Active now')}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded bg-[#1850a0]/30 hover:bg-[#1850a0]/50 text-sky-400 transition-colors"
          >
            <RotateCcw className="size-3" />
            <span>Back to live</span>
          </button>
        )}
      </div>

      {/* Center: Event timeline (729px wide, 57px high in Figma 132:10981) */}
      <div className="flex-1 flex justify-center max-w-[729px] h-[57px] relative px-2">
        <div
          ref={timelineRef}
          onMouseDown={handleMouseDown}
          className={`w-full h-full relative flex items-center ${
            timeMode === 'History' ? 'cursor-ew-resize' : 'cursor-default'
          }`}
        >
          {/* 1px Timeline horizontal axis */}
          <div className="absolute left-0 right-0 top-[34px] h-px bg-[#45505d]" />

          {/* Time ticks from Figma */}
          {ticks.map((t, idx) => (
            <div
              key={idx}
              style={{ left: `${(t.pos / 729) * 100}%` }}
              className={`absolute opacity-70 bg-[#6a7685] w-px ${
                t.isMajor ? 'h-[14px] top-[28px]' : 'h-[8px] top-[31px]'
              }`}
            />
          ))}

          {/* Event dots from Figma */}
          {eventDots.map((d, idx) => (
            <div
              key={idx}
              title={d.label}
              className="absolute top-[32px] -translate-x-1/2 size-[4px] rounded-full hover:scale-150 transition-transform"
              style={{
                left: `${(d.pos / 729) * 100}%`,
                backgroundColor: d.color,
              }}
            />
          ))}

          {/* "Now" Marker Indicator (x: 499px / 729px = ~68.4%) */}
          <div
            style={{
              left: timeMode === 'History' ? `${scrubberPos}%` : '68.4%',
            }}
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10 transition-all duration-75"
          >
            <span className="text-[11px] font-semibold text-[#6b9bd3] leading-none mb-1 select-none">
              {timeMode === 'History' ? `-${Math.round(24 * (1 - scrubberPos / 100))}h` : 'Now'}
            </span>
            <div className="size-[7px] rounded-full bg-[#6b9bd3] ring-2 ring-[#10151c]" />
            <div className="w-[2px] h-[28px] bg-[#477fb9] -mt-0.5 rounded-full shadow-xs" />
          </div>

          {/* Draggable thumb in History mode */}
          {timeMode === 'History' && (
            <div
              style={{ left: `${scrubberPos}%` }}
              className="absolute top-[34px] -translate-y-1/2 -translate-x-1/2 z-20"
            >
              <div className="size-4 rounded-full bg-[#1850a0] border-2 border-white shadow-lg ring-2 ring-[#6b9bd3]/50 cursor-grab active:cursor-grabbing hover:scale-125 transition-transform" />
            </div>
          )}
        </div>
      </div>

      {/* Right: Date Range Selector + Live Clock */}
      <div className="flex items-center gap-[18px] shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="border border-[#3a4552] dark:bg-[#151a22] bg-slate-50 flex items-center justify-between h-[36px] w-[156px] px-[12px] rounded-[5px] text-[11px] text-[#a3adbd] hover:text-[#e2e7ef] hover:border-[#4d5b6c] transition-colors focus-visible:outline-none cursor-pointer">
                <div className="flex items-center gap-[8px]">
                  <CalendarDays className="size-[16px] text-[#a3adbd] shrink-0" />
                  <span className="truncate">{historyRange}</span>
                </div>
                <ChevronDown className="size-[12px] text-[#a3adbd] shrink-0" />
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

        {/* Live Clock Text (matching Figma node 132:11035 format with dynamic MYT source) */}
        <p className="text-[10px] font-normal text-[#a3adbd] font-mono tabular-nums whitespace-nowrap">
          {liveClock || 'KLT 14 Nov 2024 16:20:31'}
        </p>
      </div>
    </footer>
  );
};
