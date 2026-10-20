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
      className={`w-full h-[72px] shrink-0 dark:bg-[#10151c] bg-white border-b dark:border-[#2a323d] border-slate-200 px-6 flex items-center justify-between z-20 select-none overflow-x-auto no-scrollbar transition-colors ${
        isShimmering ? 'opacity-80 animate-pulse' : ''
      }`}
      data-node-id="138:13178"
      data-name="Network summary row"
    >
      {/* Left Group: Device Statuses */}
      <div className="flex items-center gap-5 shrink-0">
        {/* Total devices (value and label horizontal) */}
        <button
          onClick={clearKpiFilters}
          className={`flex items-baseline gap-2 cursor-pointer transition-opacity hover:opacity-100 ${
            kpiFilter === 'all' ? 'opacity-100' : 'opacity-80'
          }`}
          title="Show all devices"
        >
          <span className="text-[22px] font-bold leading-tight font-sans dark:text-[#e2e7ef] text-slate-900 tracking-tight tabular-nums">
            {totalDevices}
          </span>
          <span className="text-[12px] dark:text-[#a3adbd] text-slate-500 font-normal">
            Total devices
          </span>
        </button>

        {/* 1px Vertical divider */}
        <div className="h-[28px] w-px dark:bg-[#2a323d] bg-slate-200 shrink-0 mx-1" />

        {/* Online (green dot, 11 Online) */}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              onClick={() => setKpiFilter('online')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] transition-all cursor-pointer ${
                kpiFilter === 'online'
                  ? 'dark:bg-[#10b981]/15 bg-[#10b981]/10 ring-1 ring-[#10b981]/40'
                  : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <span className="size-[8px] rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.7)] shrink-0" />
              <span className="text-[14px] font-bold dark:text-[#e2e7ef] text-slate-900 tabular-nums">
                {onlineDevices}
              </span>
              <span className="text-[12px] dark:text-[#a3adbd] text-slate-500 font-normal">
                Online
              </span>
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom" className="text-xs bg-popover text-popover-foreground border border-border p-1.5 rounded shadow-md z-50">
            Filter nominal devices reporting heartbeat within 5m
          </Tooltip.Content>
        </Tooltip.Root>

        {/* Offline (red dot, 2 Offline) */}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              onClick={() => setKpiFilter('offline')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] transition-all cursor-pointer ${
                kpiFilter === 'offline'
                  ? 'dark:bg-[#e33f50]/15 bg-[#e33f50]/10 ring-1 ring-[#e33f50]/40'
                  : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <span className="size-[8px] rounded-full bg-[#e33f50] shadow-[0_0_8px_rgba(227,63,80,0.8)] shrink-0 animate-pulse" />
              <span className="text-[14px] font-bold dark:text-[#e2e7ef] text-slate-900 tabular-nums">
                {offlineDevices}
              </span>
              <span className="text-[12px] dark:text-[#a3adbd] text-slate-500 font-normal">
                Offline
              </span>
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom" className="text-xs bg-popover text-popover-foreground border border-border p-1.5 rounded shadow-md z-50">
            Filter devices with loss of power or signal
          </Tooltip.Content>
        </Tooltip.Root>

        {/* Stale (grey dot, 2 Stale) */}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              onClick={() => setKpiFilter('stale')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] transition-all cursor-pointer ${
                kpiFilter === 'stale'
                  ? 'dark:bg-[#a5acb8]/15 bg-[#a5acb8]/10 ring-1 ring-[#a5acb8]/40'
                  : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <span className="size-[8px] rounded-full bg-[#a5acb8] shrink-0" />
              <span className="text-[14px] font-bold dark:text-[#e2e7ef] text-slate-900 tabular-nums">
                {staleDevices}
              </span>
              <span className="text-[12px] dark:text-[#a3adbd] text-slate-500 font-normal">
                Stale
              </span>
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom" className="text-xs bg-popover text-popover-foreground border border-border p-1.5 rounded shadow-md z-50">
            Filter devices with delayed telemetry updates (&gt; 4h)
          </Tooltip.Content>
        </Tooltip.Root>

        {/* Need attention (pill badge with amber border) */}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              onClick={() => setKpiFilter('attention')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer leading-tight ${
                kpiFilter === 'attention'
                  ? 'border-[#ffa114] bg-[#ffa114]/20 shadow-[0_0_12px_rgba(255,161,20,0.3)]'
                  : 'border-[#ffa114]/40 dark:bg-[#ffa114]/10 bg-[#ffa114]/10 hover:border-[#ffa114]/70'
              }`}
            >
              <span className="size-[8px] rounded-full bg-[#ffa114] shrink-0" />
              <span className="text-[13px] font-bold text-[#ffa114] tabular-nums">
                {attentionDevices}
              </span>
              <span className="text-[12px] text-[#ffa114] font-medium">
                Need attention
              </span>
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom" className="text-xs bg-popover text-popover-foreground border border-border p-1.5 rounded shadow-md z-50">
            Active incidents requiring triage (Offline + Stale devices)
          </Tooltip.Content>
        </Tooltip.Root>

        {/* Small "Clear filter" action button while filter is active */}
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
      <div className="flex items-center gap-7 shrink-0 text-xs">
        {/* Poles */}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              onClick={() => triggerAssetPulse('poles')}
              className="flex items-baseline gap-1.5 cursor-pointer transition-transform hover:scale-105 active:scale-95 leading-tight"
            >
              <span className="text-[14px] font-bold dark:text-[#e2e7ef] text-slate-900 font-mono tabular-nums">
                {polesCount}
              </span>
              <span className="text-[12px] dark:text-[#a3adbd] text-slate-500 font-normal">
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
              className="flex items-baseline gap-1.5 cursor-pointer transition-transform hover:scale-105 active:scale-95 leading-tight"
            >
              <span className="text-[14px] font-bold dark:text-[#e2e7ef] text-slate-900 font-mono tabular-nums">
                {cablesLengthKm} km
              </span>
              <span className="text-[12px] dark:text-[#a3adbd] text-slate-500 font-normal">
                Cable routes
              </span>
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom" className="text-xs bg-popover text-popover-foreground border border-border p-1.5 rounded shadow-md z-50">
            Single-mode fibre trunk &amp; distribution spans (click to highlight)
          </Tooltip.Content>
        </Tooltip.Root>

        {/* Cameras */}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              onClick={() => triggerAssetPulse('cameras')}
              className="flex items-baseline gap-1.5 cursor-pointer transition-transform hover:scale-105 active:scale-95 leading-tight"
            >
              <span className="text-[14px] font-bold dark:text-[#e2e7ef] text-slate-900 font-mono tabular-nums">
                {camerasCount}
              </span>
              <span className="text-[12px] dark:text-[#a3adbd] text-slate-500 font-normal">
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
              className="flex items-baseline gap-1.5 cursor-pointer transition-transform hover:scale-105 active:scale-95 leading-tight"
            >
              <span className="text-[14px] font-bold dark:text-[#e2e7ef] text-slate-900 font-mono tabular-nums">
                {sitesCount}
              </span>
              <span className="text-[12px] dark:text-[#a3adbd] text-slate-500 font-normal">
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
