import React, { useState, useEffect, useRef } from 'react';
import { useOverview } from '@/contexts/OverviewContext';
import { useUiMode } from '@/hooks/useUiMode';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Network } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export const NetworkSummaryRow: React.FC = () => {
  const {
    summaryFilter,
    toggleSummaryFilter,
    eventsCount,
    openCasesCount,
    needingAttentionCount,
    polesCount,
    cableSpansCount,
    devicesCount,
    triggerAssetPulse,
    setActivePanel,
    isShimmering,
  } = useOverview();

  const { resolvedMode, orientation } = useUiMode();
  const isTabletPortrait = resolvedMode === 'tablet' && orientation === 'portrait';

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1200);
  const [networkSheetOpen, setNetworkSheetOpen] = useState(false);
  const [networkPopoverOpen, setNetworkPopoverOpen] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Collapse asset metrics into a single "Network" chip when container width is constrained (< 900px) or on tablet portrait
  const collapseMetrics = isTabletPortrait || containerWidth < 900;
  const totalAssetsCount = polesCount + cableSpansCount + devicesCount; // 238

  return (
    <div
      ref={containerRef}
      className={`w-full h-11 shrink-0 dark:bg-[#0c1017] bg-white border-b dark:border-[#1e2633] border-slate-200 px-6 flex items-center justify-between z-20 select-none overflow-x-auto no-scrollbar transition-colors ${
        isShimmering ? 'opacity-80 animate-pulse' : ''
      }`}
      data-node-id="138:13178"
      data-name="Network summary row"
    >
      {/* Left Group: Events, Open Cases, Devices Needing Attention */}
      <div className="flex items-center gap-6 shrink-0" role="toolbar" aria-label="Summary filter controls">
        {/* 1 Events */}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              type="button"
              onClick={() => toggleSummaryFilter('events')}
              aria-pressed={summaryFilter === 'events'}
              className={`flex items-center gap-2 py-1 px-2.5 rounded-md transition-all cursor-pointer ${
                summaryFilter === 'events'
                  ? 'dark:bg-sky-500/15 bg-sky-500/10 ring-1 ring-sky-500/50 shadow-sm'
                  : 'hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <span className="size-2 rounded-full bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.7)] shrink-0" />
              <span className="text-[14px] font-bold dark:text-[#e2e7ef] text-slate-900 font-sans tabular-nums">
                {eventsCount}
              </span>
              <span className="text-[13px] dark:text-[#a3adbd] text-slate-500 font-normal">
                Events
              </span>
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom" className="text-xs bg-popover text-popover-foreground border border-border p-1.5 rounded shadow-md z-50">
            Latest events per device (click to filter)
          </Tooltip.Content>
        </Tooltip.Root>

        {/* 0 Open cases */}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              type="button"
              onClick={() => toggleSummaryFilter('cases')}
              aria-pressed={summaryFilter === 'cases'}
              className={`flex items-center gap-2 py-1 px-2.5 rounded-md transition-all cursor-pointer ${
                summaryFilter === 'cases'
                  ? 'dark:bg-sky-500/15 bg-sky-500/10 ring-1 ring-sky-500/50 shadow-sm'
                  : 'hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <span className="size-2 rounded-full bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.7)] shrink-0" />
              <span className="text-[14px] font-bold dark:text-[#e2e7ef] text-slate-900 font-sans tabular-nums">
                {openCasesCount}
              </span>
              <span className="text-[13px] dark:text-[#a3adbd] text-slate-500 font-normal">
                Open cases
              </span>
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom" className="text-xs bg-popover text-popover-foreground border border-border p-1.5 rounded shadow-md z-50">
            Active cases not yet closed (click to filter)
          </Tooltip.Content>
        </Tooltip.Root>

        {/* 3 Devices needing attention */}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              type="button"
              onClick={() => toggleSummaryFilter('attention')}
              aria-pressed={summaryFilter === 'attention'}
              className={`flex items-center gap-2 py-1 px-2.5 rounded-md transition-all cursor-pointer ${
                summaryFilter === 'attention'
                  ? 'dark:bg-amber-500/15 bg-amber-500/10 ring-1 ring-amber-500/50 shadow-sm'
                  : 'hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <span className="size-2 rounded-full bg-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.7)] shrink-0" />
              <span
                className={`text-[14px] font-bold font-sans tabular-nums ${
                  summaryFilter === 'attention'
                    ? 'text-amber-500 dark:text-amber-400'
                    : 'dark:text-[#e2e7ef] text-slate-900'
                }`}
              >
                {needingAttentionCount}
              </span>
              <span
                className={`text-[13px] font-normal ${
                  summaryFilter === 'attention'
                    ? 'text-amber-500/90 dark:text-amber-400/90'
                    : 'dark:text-[#a3adbd] text-slate-500'
                }`}
              >
                Devices needing attention
              </span>
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom" className="text-xs bg-popover text-popover-foreground border border-border p-1.5 rounded shadow-md z-50">
            Offline or stale devices needing operational attention (click to filter)
          </Tooltip.Content>
        </Tooltip.Root>
      </div>

      {/* Right Group: Network Assets (Poles, Cable spans, Devices) */}
      {collapseMetrics ? (
        <div className="shrink-0 flex items-center">
          {isTabletPortrait ? (
            <Sheet open={networkSheetOpen} onOpenChange={setNetworkSheetOpen}>
              <SheetTrigger render={
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-1 rounded-lg border dark:border-[#2a323d] border-slate-200 dark:bg-[#151a22] bg-white hover:bg-muted text-xs font-medium cursor-pointer shrink-0 min-h-[36px]"
                  title="View network assets"
                >
                  <Network className="size-4 text-primary shrink-0" />
                  <span className="font-semibold text-foreground">Assets</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-bold">
                    {totalAssetsCount}
                  </span>
                </button>
              } />
              <SheetContent side="bottom" className="p-5 max-w-lg mx-auto rounded-t-2xl">
                <SheetHeader className="mb-4">
                  <SheetTitle className="text-base font-bold flex items-center gap-2">
                    <Network className="size-5 text-primary" />
                    <span>Network Infrastructure</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => { triggerAssetPulse('poles'); setNetworkSheetOpen(false); }}
                    className="p-3 rounded-xl border dark:border-[#2a323d] border-slate-200 dark:bg-[#151a22] bg-slate-50 flex flex-col gap-1 text-left hover:border-primary transition-colors cursor-pointer min-h-[56px]"
                  >
                    <span className="text-lg font-bold font-sans text-foreground">{polesCount}</span>
                    <span className="text-xs text-muted-foreground">Poles</span>
                  </button>
                  <button
                    onClick={() => { triggerAssetPulse('cables'); setNetworkSheetOpen(false); }}
                    className="p-3 rounded-xl border dark:border-[#2a323d] border-slate-200 dark:bg-[#151a22] bg-slate-50 flex flex-col gap-1 text-left hover:border-primary transition-colors cursor-pointer min-h-[56px]"
                  >
                    <span className="text-lg font-bold font-sans text-foreground">{cableSpansCount}</span>
                    <span className="text-xs text-muted-foreground">Cable spans</span>
                  </button>
                  <button
                    onClick={() => { setActivePanel('assets'); setNetworkSheetOpen(false); }}
                    className="p-3 rounded-xl border dark:border-[#2a323d] border-slate-200 dark:bg-[#151a22] bg-slate-50 flex flex-col gap-1 text-left hover:border-primary transition-colors cursor-pointer min-h-[56px]"
                  >
                    <span className="text-lg font-bold font-sans text-foreground">{devicesCount}</span>
                    <span className="text-xs text-muted-foreground">Devices</span>
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Popover open={networkPopoverOpen} onOpenChange={setNetworkPopoverOpen}>
              <PopoverTrigger render={
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-1 rounded-lg border dark:border-[#2a323d] border-slate-200 dark:bg-[#151a22] bg-white hover:bg-muted text-xs font-medium cursor-pointer shrink-0 min-h-[36px]"
                  title="View network assets"
                >
                  <Network className="size-4 text-primary shrink-0" />
                  <span className="font-semibold text-foreground">Assets</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-bold">
                    {totalAssetsCount}
                  </span>
                </button>
              } />
              <PopoverContent align="end" className="w-80 p-3 bg-popover border border-border shadow-xl">
                <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Network className="size-4 text-primary" />
                  <span>Network Infrastructure</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    onClick={() => { triggerAssetPulse('poles'); setNetworkPopoverOpen(false); }}
                    className="p-2.5 rounded-lg border dark:border-[#2a323d] border-slate-200 dark:bg-[#151a22] bg-slate-50 flex flex-col gap-0.5 text-left hover:border-primary transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-bold font-sans text-foreground">{polesCount}</span>
                    <span className="text-[11px] text-muted-foreground">Poles</span>
                  </button>
                  <button
                    onClick={() => { triggerAssetPulse('cables'); setNetworkPopoverOpen(false); }}
                    className="p-2.5 rounded-lg border dark:border-[#2a323d] border-slate-200 dark:bg-[#151a22] bg-slate-50 flex flex-col gap-0.5 text-left hover:border-primary transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-bold font-sans text-foreground">{cableSpansCount}</span>
                    <span className="text-[11px] text-muted-foreground">Cable spans</span>
                  </button>
                  <button
                    onClick={() => { setActivePanel('assets'); setNetworkPopoverOpen(false); }}
                    className="p-2.5 rounded-lg border dark:border-[#2a323d] border-slate-200 dark:bg-[#151a22] bg-slate-50 flex flex-col gap-0.5 text-left hover:border-primary transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-bold font-sans text-foreground">{devicesCount}</span>
                    <span className="text-[11px] text-muted-foreground">Devices</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-7 shrink-0 text-xs">
          {/* 120 Poles */}
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                type="button"
                onClick={() => {
                  triggerAssetPulse('poles');
                  setActivePanel('assets');
                }}
                className="flex items-baseline gap-1.5 cursor-pointer transition-transform hover:scale-105 active:scale-95 leading-tight"
              >
                <span className="text-[14px] font-bold dark:text-[#e2e7ef] text-slate-900 font-sans tabular-nums">
                  {polesCount}
                </span>
                <span className="text-[13px] dark:text-[#a3adbd] text-slate-500 font-normal">
                  Poles
                </span>
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content side="bottom" className="text-xs bg-popover text-popover-foreground border border-border p-1.5 rounded shadow-md z-50">
              Telecom utility poles across network (click to inspect)
            </Tooltip.Content>
          </Tooltip.Root>

          {/* 114 Cable spans */}
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                type="button"
                onClick={() => {
                  triggerAssetPulse('cables');
                  setActivePanel('assets');
                }}
                className="flex items-baseline gap-1.5 cursor-pointer transition-transform hover:scale-105 active:scale-95 leading-tight"
              >
                <span className="text-[14px] font-bold dark:text-[#e2e7ef] text-slate-900 font-sans tabular-nums">
                  {cableSpansCount}
                </span>
                <span className="text-[13px] dark:text-[#a3adbd] text-slate-500 font-normal">
                  Cable spans
                </span>
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content side="bottom" className="text-xs bg-popover text-popover-foreground border border-border p-1.5 rounded shadow-md z-50">
              Distribution and trunk cable spans (click to inspect)
            </Tooltip.Content>
          </Tooltip.Root>

          {/* 4 Devices */}
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                type="button"
                onClick={() => {
                  setActivePanel('assets');
                }}
                className="flex items-baseline gap-1.5 cursor-pointer transition-transform hover:scale-105 active:scale-95 leading-tight"
              >
                <span className="text-[14px] font-bold dark:text-[#e2e7ef] text-slate-900 font-sans tabular-nums">
                  {devicesCount}
                </span>
                <span className="text-[13px] dark:text-[#a3adbd] text-slate-500 font-normal">
                  Devices
                </span>
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content side="bottom" className="text-xs bg-popover text-popover-foreground border border-border p-1.5 rounded shadow-md z-50">
              Active telecom devices in region (click to inspect)
            </Tooltip.Content>
          </Tooltip.Root>
        </div>
      )}
    </div>
  );
};
