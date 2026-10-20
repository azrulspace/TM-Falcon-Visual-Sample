import React from 'react';
import { RefreshCw, Download, Columns } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useOverview } from '@/contexts/OverviewContext';
import { useEvents } from '@/contexts/EventsContext';
import type { FalconEvent } from '@/data/events';

export interface ColumnVisibility {
  event: boolean;
  captured: boolean;
  type: boolean;
  device: boolean;
  asset: boolean;
  priority: boolean;
  status: boolean;
  case: boolean;
  source: boolean;
  actions: boolean;
}

export interface InboxHeaderProps {
  filteredEvents: FalconEvent[];
  columns: ColumnVisibility;
  setColumns: React.Dispatch<React.SetStateAction<ColumnVisibility>>;
  density: 'comfortable' | 'compact';
  setDensity: (d: 'comfortable' | 'compact') => void;
}

export const InboxHeader: React.FC<InboxHeaderProps> = ({
  filteredEvents,
  columns,
  setColumns,
  density,
  setDensity,
}) => {
  const overview = useOverview();
  const { refreshEvents, isRefreshing } = useEvents();

  const handleExportCsv = () => {
    const headers = ['Event ID', 'Captured', 'Type', 'Device', 'Asset', 'Priority', 'Status', 'Case ID', 'Source'];
    const rows = filteredEvents.map((e) => [
      e.id,
      `"${e.captured}"`,
      `"${e.type}"`,
      e.device || 'N/A',
      e.asset,
      e.priority,
      e.state,
      e.caseId || 'None',
      `"${e.source}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `falcon_events_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleColumn = (key: keyof ColumnVisibility) => {
    setColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col gap-2 mb-4 select-none">
      {/* Breadcrumb matching Section 5 */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
        <span>Falcon</span>
        <span>/</span>
        <span className="text-foreground font-semibold">Event inbox</span>
      </nav>

      {/* Main Title Row & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Event inbox</h1>
            {/* Live Indicator matching Overview */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-muted/80 border border-border">
              <span className="relative flex size-2">
                {overview.liveState === 'live' ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
                    <span className="relative inline-flex rounded-full size-2 bg-[#10b981]" />
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full size-2 bg-[#ffa114]" />
                )}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {overview.liveState === 'live' ? `Live • Updated ${overview.lastUpdatedTime}` : 'Telemetry paused'}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Events raised from accepted observations. Open an event to review its evidence and decide whether it needs a case.
          </p>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshEvents}
            disabled={isRefreshing}
            className="h-8 px-2.5 text-xs gap-1.5 border-border hover:bg-muted"
            title="Refresh event stream"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {/* Export CSV */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="h-8 px-2.5 text-xs gap-1.5 border-border hover:bg-muted"
            title="Export filtered events as CSV"
          >
            <Download className="size-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Export</span>
          </Button>

          {/* Column Settings Popover */}
          <Popover>
            <PopoverTrigger render={
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1.5 border-border hover:bg-muted"
                title="Toggle table columns"
              >
                <Columns className="size-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Columns</span>
              </Button>
            } />
            <PopoverContent align="end" className="w-56 p-3 bg-popover border border-border shadow-lg z-50 text-xs">
              <div className="font-semibold text-foreground mb-2 pb-1 border-b border-border">Visible Columns</div>
              <div className="flex flex-col gap-2">
                {[
                  { key: 'captured' as const, label: 'Captured' },
                  { key: 'type' as const, label: 'Type / Activity' },
                  { key: 'device' as const, label: 'Device' },
                  { key: 'asset' as const, label: 'Asset' },
                  { key: 'priority' as const, label: 'Priority' },
                  { key: 'status' as const, label: 'Status' },
                  { key: 'case' as const, label: 'Case' },
                  { key: 'source' as const, label: 'Source' },
                ].map((col) => (
                  <label key={col.key} className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground">
                    <Checkbox
                      checked={columns[col.key]}
                      onCheckedChange={() => toggleColumn(col.key)}
                      className="size-3.5"
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Density Toggle */}
          <div className="flex items-center rounded-md border border-border p-0.5 bg-muted/40">
            <button
              onClick={() => setDensity('comfortable')}
              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                density === 'comfortable' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Comfortable row height (56px)"
            >
              Comfortable
            </button>
            <button
              onClick={() => setDensity('compact')}
              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                density === 'compact' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Compact row height (44px)"
            >
              Compact
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
