import React from 'react';
import {
  AlertCircle,
  Briefcase,
  RotateCcw,
} from 'lucide-react';
import { events } from '@/data/events';
import { cases } from '@/data/cases';
import { devices } from '@/data/devices';
import type { KpiFilterType } from './KpiRibbon';

interface KpiStripProps {
  activeFilter: KpiFilterType;
  onFilterChange: (filter: KpiFilterType) => void;
}

export const KpiStrip: React.FC<KpiStripProps> = ({
  activeFilter,
  onFilterChange,
}) => {
  // Real data calculations
  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.status === 'online').length;
  const offlineDevices = devices.filter((d) => d.status === 'offline').length;
  const staleDevices = devices.filter((d) => d.status === 'stale').length;
  const attentionDevices = offlineDevices + staleDevices;

  const newEventsCount = events.filter((e) => e.state === 'New').length;
  const criticalCount = events.filter((e) => e.priority === 'High' && e.state !== 'Closed').length;
  const openCasesCount = cases.length;

  return (
    <div className="glass-panel px-3 py-1.5 flex items-center gap-3 text-xs select-none shadow-xl border border-border/80">
      {/* Total devices cell */}
      <button
        onClick={() => onFilterChange(activeFilter === 'devices_attention' ? null : 'devices_attention')}
        className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${
          activeFilter === 'devices_attention'
            ? 'bg-primary/20 ring-1 ring-primary text-foreground'
            : 'hover:bg-muted/50 text-foreground'
        }`}
      >
        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
          Total devices
        </span>
        <span className="font-mono text-sm font-bold tabular-nums text-foreground">
          {totalDevices}
        </span>
      </button>

      <span className="h-4 w-px bg-border/80" />

      {/* Status Dot Breakdown (CEO_REFERENCE) */}
      <div className="flex items-center gap-3 font-mono text-xs">
        {/* Online */}
        <div className="flex items-center gap-1.5 text-foreground">
          <span className="size-2 rounded-full bg-status-online" />
          <span className="font-semibold tabular-nums">{onlineDevices}</span>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">Online</span>
        </div>

        {/* Offline */}
        <button
          onClick={() => onFilterChange(activeFilter === 'devices_attention' ? null : 'devices_attention')}
          className="flex items-center gap-1.5 text-foreground hover:opacity-80 transition-opacity"
        >
          <span className="size-2 rounded-full bg-status-offline" />
          <span className="font-semibold tabular-nums">{offlineDevices}</span>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">Offline</span>
        </button>

        {/* Stale */}
        <div className="flex items-center gap-1.5 text-foreground">
          <span className="size-2 rounded-full bg-status-stale" />
          <span className="font-semibold tabular-nums">{staleDevices}</span>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">Stale</span>
        </div>

        {/* Need attention */}
        <button
          onClick={() => onFilterChange(activeFilter === 'devices_attention' ? null : 'devices_attention')}
          className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded transition-all ${
            activeFilter === 'devices_attention' ? 'bg-status-warning-tint ring-1 ring-status-warning' : ''
          }`}
        >
          <span className="size-2 rounded-full bg-status-warning" />
          <span className="font-semibold tabular-nums text-status-warning">{attentionDevices}</span>
          <span className="text-[10px] text-status-warning font-medium hidden md:inline">Attention</span>
        </button>
      </div>

      <span className="h-4 w-px bg-border/80" />

      {/* New Events Metric */}
      <button
        onClick={() => onFilterChange(activeFilter === 'new_events' ? null : 'new_events')}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
          activeFilter === 'new_events'
            ? 'bg-primary/20 ring-1 ring-primary text-foreground'
            : 'hover:bg-muted/50 text-foreground'
        }`}
      >
        <AlertCircle className="size-3.5 text-warning" />
        <span className="font-mono text-xs font-bold tabular-nums text-foreground">{newEventsCount}</span>
        <span className="text-[11px] text-muted-foreground hidden lg:inline">New events</span>
      </button>

      {/* Critical Events Metric */}
      <button
        onClick={() => onFilterChange(activeFilter === 'critical_events' ? null : 'critical_events')}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
          activeFilter === 'critical_events'
            ? 'bg-destructive/20 ring-1 ring-destructive text-foreground'
            : 'hover:bg-muted/50 text-foreground'
        }`}
      >
        <span className="size-2 rounded-full bg-destructive" />
        <span className="font-mono text-xs font-bold tabular-nums text-destructive">{criticalCount}</span>
        <span className="text-[11px] text-muted-foreground hidden lg:inline">Critical</span>
      </button>

      {/* Open Cases */}
      <button
        onClick={() => onFilterChange(activeFilter === 'open_cases' ? null : 'open_cases')}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
          activeFilter === 'open_cases'
            ? 'bg-primary/20 ring-1 ring-primary text-foreground'
            : 'hover:bg-muted/50 text-foreground'
        }`}
      >
        <Briefcase className="size-3.5 text-primary" />
        <span className="font-mono text-xs font-bold tabular-nums text-foreground">{openCasesCount}</span>
        <span className="text-[11px] text-muted-foreground hidden lg:inline">Open cases</span>
      </button>

      {/* Reset filters affordance if active */}
      {activeFilter && (
        <button
          onClick={() => onFilterChange(null)}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-primary hover:bg-primary/10 transition-colors"
        >
          <RotateCcw className="size-2.5" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
};
