import React from 'react';
import { AlertCircle, Briefcase, RadioReceiver, ShieldAlert, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { events } from '@/data/events';
import { cases } from '@/data/cases';
import { devices } from '@/data/devices';

export type KpiFilterType = 'new_events' | 'open_cases' | 'devices_attention' | 'critical_events' | null;

interface KpiRibbonProps {
  activeFilter: KpiFilterType;
  onFilterChange: (filter: KpiFilterType) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const KpiRibbon: React.FC<KpiRibbonProps> = ({
  activeFilter,
  onFilterChange,
  isLoading = false,
  error = null,
  onRetry,
}) => {
  // Real data calculations
  const newEventsCount = events.filter((e) => e.state === 'New').length;
  const unackEventsCount = events.filter((e) => e.state === 'New').length;
  const openEventsCount = events.filter((e) => e.state !== 'Closed').length;

  const openCasesCount = cases.length;

  const offlineDevices = devices.filter((d) => d.status === 'offline').length;
  const staleDevices = devices.filter((d) => d.status === 'stale').length;
  const devicesNeedingAttention = offlineDevices + staleDevices;

  const criticalEventsCount = events.filter((e) => e.priority === 'High' && e.state !== 'Closed').length;

  if (error) {
    return (
      <div className="h-[72px] mb-2.5 rounded-panel border border-destructive/40 bg-destructive/10 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs text-destructive font-medium">
          <AlertTriangle className="size-4" />
          <span>Failed to load telemetry summary: {error}</span>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="h-7 text-xs border-destructive/30">
            <RotateCcw className="size-3 mr-1.5" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-[72px] mb-2.5 rounded-panel border border-border bg-card grid grid-cols-2 lg:grid-cols-4 shrink-0 divide-x divide-border overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-3 flex flex-col justify-between">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-6 w-12 my-1" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  const cells = [
    {
      id: 'new_events' as const,
      label: 'NEW EVENTS',
      value: newEventsCount,
      secondary: `${unackEventsCount} unacknowledged • ${openEventsCount} open`,
      icon: AlertCircle,
      statusColor: 'var(--status-warning)',
      dotColor: 'bg-status-warning',
    },
    {
      id: 'open_cases' as const,
      label: 'OPEN CASES',
      value: openCasesCount,
      secondary: 'Follow-up in progress (Field work)',
      icon: Briefcase,
      statusColor: 'var(--primary)',
      dotColor: 'bg-primary',
    },
    {
      id: 'devices_attention' as const,
      label: 'DEVICES ATTENTION',
      value: devicesNeedingAttention,
      secondary: `${offlineDevices} offline • ${staleDevices} stale telemetry`,
      icon: RadioReceiver,
      statusColor: 'var(--status-offline)',
      dotColor: 'bg-status-offline',
    },
    {
      id: 'critical_events' as const,
      label: 'CRITICAL / HIGH PRIORITY',
      value: criticalEventsCount,
      secondary: 'Requires immediate dispatch',
      icon: ShieldAlert,
      statusColor: 'var(--severity-high)',
      dotColor: 'bg-severity-high',
    },
  ];

  return (
    <div className="h-[72px] mb-2.5 rounded-panel border border-border bg-card shadow-xs flex items-stretch shrink-0 divide-x divide-border overflow-hidden">
      {cells.map((cell) => {
        const isActive = activeFilter === cell.id;
        const Icon = cell.icon;
        return (
          <button
            key={cell.id}
            type="button"
            onClick={() => onFilterChange(isActive ? null : cell.id)}
            className={`flex-1 p-2.5 px-3.5 flex flex-col justify-between text-left transition-colors relative outline-none focus-visible:bg-accent/40 ${
              isActive
                ? 'bg-accent/70'
                : 'hover:bg-muted/50'
            }`}
          >
            {/* Active accent bar */}
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-primary" />
            )}

            {/* Header: Label + Status Dot/Icon */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className={`size-1.5 rounded-full ${cell.dotColor}`} />
                {cell.label}
              </span>
              <Icon className="size-3.5" style={{ color: cell.statusColor }} />
            </div>

            {/* Value + Breakdown */}
            <div className="flex items-baseline justify-between mt-0.5">
              <div className="text-[22px] leading-tight font-semibold text-foreground font-mono tabular-nums">
                {cell.value}
              </div>
              <div className="text-[11px] text-muted-foreground truncate ml-2">
                {cell.secondary}
              </div>
            </div>
          </button>
        );
      })}

      {/* Reset Filter Affordance */}
      {activeFilter && (
        <div className="px-2.5 flex items-center bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFilterChange(null)}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <RotateCcw className="size-3" />
            <span className="hidden xl:inline">Reset</span>
          </Button>
        </div>
      )}
    </div>
  );
};
