import React from 'react';
import { useOverview } from '@/contexts/OverviewContext';
import * as Tooltip from '@radix-ui/react-tooltip';
import { RotateCcw } from 'lucide-react';

export const NetworkSummaryRow: React.FC = () => {
  const {
    kpiFilter,
    setKpiFilter,
    clearKpiFilters,
    totalDevices,
    onlineDevices,
    offlineDevices,
    staleDevices,
    attentionDevices,
    polesCount,
    cablesLengthKm,
    camerasCount,
    sitesCount,
    triggerAssetPulse,
    isShimmering,
  } = useOverview();

  return (
    <div
      className={`w-full h-[72px] shrink-0 dark:bg-[#10151c] bg-white border-b dark:border-[#2a323d] border-slate-200 px-6 lg:pl-[96px] pr-6 flex items-center justify-between z-20 select-none overflow-x-auto no-scrollbar transition-colors ${
        isShimmering ? 'opacity-80 animate-pulse' : ''
      }`}
      data-node-id="132:10587"
      data-name="Network summary row"
    >
      {/* Left Group: Device Statuses */}
      <div className="flex items-center gap-6 shrink-0">
        {/* Total devices (value about 20px bold above label) */}
        <button
          onClick={clearKpiFilters}
          className={`flex flex-col items-start text-left cursor-pointer transition-opacity hover:opacity-100 ${
            kpiFilter === 'all' ? 'opacity-100' : 'opacity-80'
          }`}
          title="Show all devices"
        >
          <span className="text-[20px] font-bold leading-tight font-sans dark:text-[#e2e7ef] text-slate-900 tracking-tight tabular-nums">
            {totalDevices}
          </span>
          <span className="text-[11px] dark:text-[#a3adbd] text-slate-500 font-normal leading-tight">
            Total devices
          </span>
        </button>

        {/* 1px Vertical divider */}
        <div className="h-[28px] w-px dark:bg-[#2a323d] bg-slate-200 shrink-0" />

        {/* Online (10.5px green dot, value above label) */}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              onClick={() => setKpiFilter('online')}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[6px] transition-all cursor-pointer ${
                kpiFilter === 'online'
                  ? 'dark:bg-[#10b981]/15 bg-[#10b981]/10 ring-1 ring-[#10b981]/40'
                  : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <span className="size-[10px] rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.7)] shrink-0" />
              <div className="flex flex-col items-start text-left leading-tight">
                <span className="text-[14px] font-bold dark:text-[#e2e7ef] text-slate-900 tabular-nums">
                  {onlineDevices}
                </span>
                <span className="text-[11px] dark:text-[#a3adbd] text-slate-500 font-normal">
                  Online
                </span>
              </div>
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom" className="text-xs bg-popover text-popover-foreground border border-border p-1.5 rounded shadow-md z-50">
            Filter nominal devices reporting heartbeat within 5m
          </Tooltip.Content>
        </Tooltip.Root>

        {/* Offline (10.5px red dot, value above label) */}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              onClick={() => setKpiFilter('offline')}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[6px] transition-all cursor-pointer ${
                kpiFilter === 'offline'
                  ? 'dark:bg-[#e33f50]/15 bg-[#e33f50]/10 ring-1 ring-[#e33f50]/40'
                  : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <span className="size-[10px] rounded-full bg-[#e33f50] shadow-[0_0_8px_rgba(227,63,80,0.8)] shrink-0 animate-pulse" />
              <div className="flex flex-col items-start text-left leading-tight">
                <span className="text-[14px] font-bold dark:text-[#e2e7ef] text-slate-900 tabular-nums">
                  {offlineDevices}
                </span>
                <span className="text-[11px] dark:text-[#a3adbd] text-slate-500 font-normal">
                  Offline
                </span>
              </div>
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom" className="text-xs bg-popover text-popover-foreground border border-border p-1.5 rounded shadow-md z-50">
            Filter devices with loss of power or signal
          </Tooltip.Content>
        </Tooltip.Root>

        {/* Stale (10.5px grey dot, value above label) */}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              onClick={() => setKpiFilter('stale')}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[6px] transition-all cursor-pointer ${
                kpiFilter === 'stale'
                  ? 'dark:bg-[#a5acb8]/15 bg-[#a5acb8]/10 ring-1 ring-[#a5acb8]/40'
                  : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <span className="size-[10px] rounded-full bg-[#a5acb8] shrink-0" />
              <div className="flex flex-col items-start text-left leading-tight">
                <span className="text-[14px] font-bold dark:text-[#e2e7ef] text-slate-900 tabular-nums">
                  {staleDevices}
                </span>
                <span className="text-[11px] dark:text-[#a3adbd] text-slate-500 font-normal">
                  Stale
                </span>
              </div>
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom" className="text-xs bg-popover text-popover-foreground border border-border p-1.5 rounded shadow-md z-50">
            Filter devices with delayed telemetry updates (&gt; 4h)
          </Tooltip.Content>
        </Tooltip.Root>

        {/* Need attention (value 4 in amber above legend with amber dot) */}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              onClick={() => setKpiFilter('attention')}
              className={`flex flex-col items-start px-2.5 py-1.5 rounded-[6px] transition-all cursor-pointer leading-tight ${
                kpiFilter === 'attention'
                  ? 'dark:bg-[#ffa114]/15 bg-[#ffa114]/10 ring-1 ring-[#ffa114]/40'
                  : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <span className="text-[14px] font-bold text-[#ffa114] tabular-nums">
                {attentionDevices}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="size-[8px] rounded-full bg-[#ffa114] shrink-0" />
                <span className="text-[11px] text-[#ffa114] font-medium">
                  Need attention
                </span>
              </div>
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom" className="text-xs bg-popover text-popover-foreground border border-border p-1.5 rounded shadow-md z-50">
            Active incidents requiring triage (Offline + Stale devices)
          </Tooltip.Content>
        </Tooltip.Root>

        {/* Small "Clear filters" action button while filter is active */}
        {kpiFilter !== 'all' && (
          <button
            onClick={clearKpiFilters}
            className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 dark:bg-[#1850a0]/20 px-2 py-1 rounded transition-colors"
          >
            <RotateCcw className="size-3" />
            <span>Clear filter</span>
          </button>
        )}
      </div>

      {/* Right Group: Asset Metrics (Poles, Cable routes, Cameras, Sites) */}
      <div className="flex items-center gap-8 shrink-0 dark:text-[#a3adbd] text-slate-500">
        {/* Poles */}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              onClick={() => triggerAssetPulse('poles')}
              className="flex flex-col items-center cursor-pointer transition-transform hover:scale-105 active:scale-95 leading-tight"
            >
              <span className="text-[14px] font-bold dark:text-[#e2e7ef] text-slate-900 font-mono tabular-nums">
                {polesCount}
              </span>
              <span className="text-[11px] dark:text-[#a3adbd] text-slate-500 font-normal">
                Poles
              </span>
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom" className="text-xs bg-popover text-popover-foreground border border-border p-1.5 rounded shadow-md z-50">
            Telecom utility poles across Kuching network (click to highlight)
          </Tooltip.Content>
        </Tooltip.Root>

        {/* Cable routes */}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              onClick={() => triggerAssetPulse('cables')}
              className="flex flex-col items-center cursor-pointer transition-transform hover:scale-105 active:scale-95 leading-tight"
            >
              <span className="text-[14px] font-bold dark:text-[#e2e7ef] text-slate-900 font-mono tabular-nums">
                {cablesLengthKm} km
              </span>
              <span className="text-[11px] dark:text-[#a3adbd] text-slate-500 font-normal">
                Cable routes
              </span>
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom" className="text-xs bg-popover text-popover-foreground border border-border p-1.5 rounded shadow-md z-50">
            Single-mode fibre trunk & distribution spans (click to highlight)
          </Tooltip.Content>
        </Tooltip.Root>

        {/* Cameras */}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              onClick={() => triggerAssetPulse('cameras')}
              className="flex flex-col items-center cursor-pointer transition-transform hover:scale-105 active:scale-95 leading-tight"
            >
              <span className="text-[14px] font-bold dark:text-[#e2e7ef] text-slate-900 font-mono tabular-nums">
                {camerasCount}
              </span>
              <span className="text-[11px] dark:text-[#a3adbd] text-slate-500 font-normal">
                Cameras
              </span>
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom" className="text-xs bg-popover text-popover-foreground border border-border p-1.5 rounded shadow-md z-50">
            Live infrastructure CCTV surveillance feeds (click to highlight)
          </Tooltip.Content>
        </Tooltip.Root>

        {/* Sites */}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              onClick={() => triggerAssetPulse('sites')}
              className="flex flex-col items-center cursor-pointer transition-transform hover:scale-105 active:scale-95 leading-tight"
            >
              <span className="text-[14px] font-bold dark:text-[#e2e7ef] text-slate-900 font-mono tabular-nums">
                {sitesCount}
              </span>
              <span className="text-[11px] dark:text-[#a3adbd] text-slate-500 font-normal">
                Sites
              </span>
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom" className="text-xs bg-popover text-popover-foreground border border-border p-1.5 rounded shadow-md z-50">
            Central telecom exchanges and sub-stations (click to highlight)
          </Tooltip.Content>
        </Tooltip.Root>
      </div>
    </div>
  );
};
