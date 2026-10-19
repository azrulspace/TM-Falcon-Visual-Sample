import React from 'react';
import { RotateCcw } from 'lucide-react';
import { events } from '@/data/events';
import { cases } from '@/data/cases';
import { devices } from '@/data/devices';
import type { KpiFilterType } from './KpiRibbon';

interface KpiStripProps {
  activeFilter: KpiFilterType;
  onFilterChange: (filter: KpiFilterType) => void;
  className?: string;
}

export const KpiStrip: React.FC<KpiStripProps> = ({
  activeFilter,
  onFilterChange,
  className = '',
}) => {
  // Derived operational telemetry metrics
  const totalDevices = devices.length; // 15
  const onlineDevices = devices.filter((d) => d.status === 'online').length; // 11
  const offlineDevices = devices.filter((d) => d.status === 'offline').length; // 2
  const staleDevices = devices.filter((d) => d.status === 'stale').length; // 2
  const attentionDevices = offlineDevices + staleDevices; // 4

  const newEventsCount = events.filter((e) => e.state === 'New').length; // 3
  const criticalCount = events.filter((e) => e.priority === 'High' && e.state !== 'Closed').length; // 2
  const openCasesCount = cases.length; // 1

  return (
    <div
      className={`glass-panel h-[88px] px-3 py-2 flex items-center gap-1 select-none shadow-2xl border border-border/80 rounded-xl overflow-x-auto no-scrollbar w-fit max-w-full ${className}`}
    >
      {/* Group 1: Device Health Telemetry (CEO_REFERENCE) */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Total Devices */}
        <button
          onClick={() => onFilterChange(activeFilter === 'devices_attention' ? null : 'devices_attention')}
          className={`flex flex-col justify-center items-start px-3 py-1.5 rounded-lg transition-all text-left ${
            activeFilter === 'devices_attention'
              ? 'bg-primary/15 ring-1 ring-primary/60 text-foreground'
              : 'hover:bg-muted/40 text-foreground'
          }`}
          title="Filter all device issues"
        >
          <span className="text-xs font-normal text-muted-foreground whitespace-nowrap">
            Total devices
          </span>
          <span className="text-2xl xl:text-[28px] font-semibold text-foreground tracking-tight tabular-nums mt-0.5 leading-none">
            {totalDevices}
          </span>
        </button>

        <span className="h-10 w-px bg-border/70 mx-0.5 shrink-0" />

        {/* Online Devices */}
        <div className="flex flex-col justify-center items-start px-3 py-1.5 text-left shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-status-online shrink-0" />
            <span className="text-xs font-normal text-muted-foreground whitespace-nowrap">
              Online
            </span>
          </div>
          <span className="text-2xl xl:text-[28px] font-semibold text-foreground tracking-tight tabular-nums mt-0.5 leading-none">
            {onlineDevices}
          </span>
        </div>

        <span className="h-10 w-px bg-border/70 mx-0.5 shrink-0" />

        {/* Offline Devices */}
        <button
          onClick={() => onFilterChange(activeFilter === 'devices_attention' ? null : 'devices_attention')}
          className={`flex flex-col justify-center items-start px-3 py-1.5 rounded-lg transition-all text-left shrink-0 ${
            activeFilter === 'devices_attention'
              ? 'bg-destructive/15 ring-1 ring-destructive/60'
              : 'hover:bg-muted/40'
          }`}
          title="Filter offline devices"
        >
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-status-offline shrink-0" />
            <span className="text-xs font-normal text-muted-foreground whitespace-nowrap">
              Offline
            </span>
          </div>
          <span className="text-2xl xl:text-[28px] font-semibold text-foreground tracking-tight tabular-nums mt-0.5 leading-none">
            {offlineDevices}
          </span>
        </button>

        <span className="h-10 w-px bg-border/70 mx-0.5 shrink-0" />

        {/* Stale Devices */}
        <div className="flex flex-col justify-center items-start px-3 py-1.5 text-left shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-status-stale shrink-0" />
            <span className="text-xs font-normal text-muted-foreground whitespace-nowrap">
              Stale
            </span>
          </div>
          <span className="text-2xl xl:text-[28px] font-semibold text-foreground tracking-tight tabular-nums mt-0.5 leading-none">
            {staleDevices}
          </span>
        </div>

        <span className="h-10 w-px bg-border/70 mx-0.5 shrink-0" />

        {/* Need Attention */}
        <button
          onClick={() => onFilterChange(activeFilter === 'devices_attention' ? null : 'devices_attention')}
          className={`flex flex-col justify-center items-start px-3 py-1.5 rounded-lg transition-all text-left shrink-0 ${
            activeFilter === 'devices_attention'
              ? 'bg-status-warning-tint ring-1 ring-status-warning'
              : 'hover:bg-muted/40'
          }`}
          title="Filter devices needing attention"
        >
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-status-warning shrink-0" />
            <span className="text-xs font-normal text-status-warning whitespace-nowrap">
              Need attention
            </span>
          </div>
          <span className="text-2xl xl:text-[28px] font-semibold text-status-warning tracking-tight tabular-nums mt-0.5 leading-none">
            {attentionDevices}
          </span>
        </button>
      </div>

      {/* Primary Section Divider */}
      <span className="h-12 w-[1.5px] bg-border/90 mx-1.5 shrink-0" />

      {/* Group 2: Workload & Triage Metrics (CEO_REFERENCE) */}
      <div className="flex items-center gap-1 shrink-0">
        {/* New Events */}
        <button
          onClick={() => onFilterChange(activeFilter === 'new_events' ? null : 'new_events')}
          className={`flex flex-col justify-center items-start px-3 py-1.5 rounded-lg transition-all text-left shrink-0 ${
            activeFilter === 'new_events'
              ? 'bg-primary/15 ring-1 ring-primary/60'
              : 'hover:bg-muted/40'
          }`}
          title="Filter unacknowledged new events"
        >
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-severity-high shrink-0" />
            <span className="text-xs font-normal text-muted-foreground whitespace-nowrap">
              New events
            </span>
          </div>
          <span className="text-2xl xl:text-[28px] font-semibold text-foreground tracking-tight tabular-nums mt-0.5 leading-none">
            {newEventsCount}
          </span>
        </button>

        <span className="h-10 w-px bg-border/70 mx-0.5 shrink-0" />

        {/* Critical Events */}
        <button
          onClick={() => onFilterChange(activeFilter === 'critical_events' ? null : 'critical_events')}
          className={`flex flex-col justify-center items-start px-3 py-1.5 rounded-lg transition-all text-left shrink-0 ${
            activeFilter === 'critical_events'
              ? 'bg-destructive/15 ring-1 ring-destructive/60'
              : 'hover:bg-muted/40'
          }`}
          title="Filter critical severity events"
        >
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-destructive shrink-0" />
            <span className="text-xs font-normal text-destructive whitespace-nowrap font-medium">
              Critical
            </span>
          </div>
          <span className="text-2xl xl:text-[28px] font-semibold text-destructive tracking-tight tabular-nums mt-0.5 leading-none">
            {criticalCount}
          </span>
        </button>

        <span className="h-10 w-px bg-border/70 mx-0.5 shrink-0" />

        {/* Open Cases */}
        <button
          onClick={() => onFilterChange(activeFilter === 'open_cases' ? null : 'open_cases')}
          className={`flex flex-col justify-center items-start px-3 py-1.5 rounded-lg transition-all text-left shrink-0 ${
            activeFilter === 'open_cases'
              ? 'bg-primary/15 ring-1 ring-primary/60'
              : 'hover:bg-muted/40'
          }`}
          title="Filter active field investigation cases"
        >
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary shrink-0" />
            <span className="text-xs font-normal text-muted-foreground whitespace-nowrap">
              Open cases
            </span>
          </div>
          <span className="text-2xl xl:text-[28px] font-semibold text-foreground tracking-tight tabular-nums mt-0.5 leading-none">
            {openCasesCount}
          </span>
        </button>

        {/* Reset Filter Button */}
        {activeFilter && (
          <button
            onClick={() => onFilterChange(null)}
            className="flex items-center gap-1 ml-1.5 px-2 py-1 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-colors shrink-0"
            title="Clear active filter"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
