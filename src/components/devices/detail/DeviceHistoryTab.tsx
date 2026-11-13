import React, { useState, useMemo } from 'react';
import {
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeviceStateBadge } from '@/components/devices/DeviceStateBadge';
import { computeAvailabilityMetrics } from '@/data/deviceSelectors';
import { formatAbsoluteMYT } from '@/lib/dateTime';
import { cn } from '@/lib/utils';
import type { DeviceRecord, DeviceConnectivityState } from '@/types/devices';

export interface DeviceHistoryTabProps {
  device: DeviceRecord;
}

export const DeviceHistoryTab: React.FC<DeviceHistoryTabProps> = ({ device }) => {
  const [historyView, setHistoryView] = useState<'connectivity' | 'timeline'>('connectivity');
  const [statusFilter, setStatusFilter] = useState<'all' | DeviceConnectivityState>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const availability = useMemo(
    () => computeAvailabilityMetrics(device.connectivityHistory),
    [device.connectivityHistory]
  );

  // Filtered Connectivity history
  const filteredConnectivity = useMemo(() => {
    const list = device.connectivityHistory || [];
    if (statusFilter === 'all') return list;
    return list.filter((p) => p.status === statusFilter);
  }, [device.connectivityHistory, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredConnectivity.length / rowsPerPage));
  const paginatedConnectivity = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredConnectivity.slice(start, start + rowsPerPage);
  }, [filteredConnectivity, currentPage, rowsPerPage]);

  return (
    <div className="space-y-6 select-none">
      {/* 1. Availability Summary Strip at Top */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Connectivity & Telemetry History
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              ({device.connectivityHistory?.length || 0} stored intervals)
            </span>
          </div>

          {/* Sub-Switch: Connectivity vs Timeline */}
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => {
                setHistoryView('connectivity');
                setCurrentPage(1);
              }}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
                historyView === 'connectivity'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Connectivity
            </button>
            <button
              type="button"
              onClick={() => setHistoryView('timeline')}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
                historyView === 'timeline'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Timeline ({device.timeline?.length || 0})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
              Current State
            </span>
            <div className="mt-1">
              <DeviceStateBadge state={device.state} />
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
              Recorded Uptime
            </span>
            <span className="font-mono text-lg font-bold text-emerald-500 block mt-0.5">
              {availability.onlinePercent}%
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
              State Changes
            </span>
            <span className="font-mono text-lg font-bold text-foreground block mt-0.5">
              {availability.stateChangesCount}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
              Longest Offline
            </span>
            <span className="font-mono text-lg font-bold text-rose-500 block mt-0.5">
              {availability.longestOfflineMinutes} min
            </span>
          </div>
        </div>
      </div>

      {/* 2. Sub-View: Connectivity Table */}
      {historyView === 'connectivity' && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden space-y-3 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="size-3.5" />
              <span>Filter status:</span>
              {(['all', 'online', 'offline', 'stale'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setStatusFilter(st);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer capitalize',
                    statusFilter === st
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  )}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * rowsPerPage + 1}–
              {Math.min(currentPage * rowsPerPage, filteredConnectivity.length)} of{' '}
              {filteredConnectivity.length} intervals
            </div>
          </div>

          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Record</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">From (MYT)</th>
                  <th className="py-2.5 px-3">To (MYT)</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Note</th>
                  <th className="py-2.5 px-3">Recorded by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {paginatedConnectivity.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground font-sans">
                      No connectivity periods match the filter.
                    </td>
                  </tr>
                ) : (
                  paginatedConnectivity.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-sans text-muted-foreground">
                        Connectivity
                      </td>
                      <td className="py-2.5 px-3">
                        <DeviceStateBadge state={p.status} />
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {formatAbsoluteMYT(p.from)}
                      </td>
                      <td className="py-2.5 px-3 text-foreground">
                        {p.to ? formatAbsoluteMYT(p.to) : <strong className="text-emerald-500 font-sans font-bold">Current</strong>}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-foreground">
                        {p.durationMinutes} min
                      </td>
                      <td className="py-2.5 px-3 font-sans text-muted-foreground">
                        {p.note || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-muted-foreground">
                        {p.recordedBy}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 gap-1 text-xs cursor-pointer"
              >
                <ChevronLeft className="size-3.5" />
                <span>Previous</span>
              </Button>

              <span className="text-xs text-muted-foreground font-mono">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 gap-1 text-xs cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 3. Sub-View: Timeline Feed */}
      {historyView === 'timeline' && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="border-b border-border/80 pb-2">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Administrative & Operational Audit Trail
            </h3>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {(!device.timeline || device.timeline.length === 0) ? (
              <p className="text-xs text-muted-foreground italic">No timeline entries recorded.</p>
            ) : (
              device.timeline.map((entry) => (
                <div key={entry.id} className="relative text-xs space-y-1">
                  {/* Dot */}
                  <div className="absolute -left-6 top-1 size-2.5 rounded-full bg-primary border-2 border-card" />

                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-muted text-foreground">
                      {entry.kind}
                    </span>
                    <span className="font-semibold text-foreground">
                      {entry.message}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                    <span className="flex items-center gap-1">
                      <User className="size-3" />
                      <span>{entry.actor}</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      <span>{formatAbsoluteMYT(entry.timestamp)}</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
