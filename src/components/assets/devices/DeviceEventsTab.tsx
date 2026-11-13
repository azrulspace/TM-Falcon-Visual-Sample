import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ExternalLink,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatAbsoluteMYT, parseDate } from '@/lib/dateTime';
import type { DeviceWithRelations } from '@/types/devices';

export interface DeviceEventsTabProps {
  device: DeviceWithRelations;
}

export const DeviceEventsTab: React.FC<DeviceEventsTabProps> = ({ device }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return device.deviceEvents.filter((evt) => {
      if (statusFilter !== 'ALL' && evt.status !== statusFilter) return false;
      if (q) {
        const hay = `${evt.id} ${evt.type} ${evt.asset} ${evt.detection} ${evt.caseId || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [device.deviceEvents, statusFilter, search]);

  return (
    <div className="space-y-4">
      {device.vendorConflict && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/8 p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="size-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-foreground">
                Active vendor serial conflict ({device.vendorConflict.serial}):
              </strong>{' '}
              <span className="text-muted-foreground">
                Events from claiming hardware may appear under raw serial {device.vendorConflict.serial} until resolved in Vendor discovery.
              </span>
            </div>
          </div>
          <Link to="/assets/inventory/vendor-discovery">
            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs shrink-0 cursor-pointer border-red-500/40 text-red-500">
              Resolve in Vendor discovery
            </Button>
          </Link>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-foreground">
              Events ({filteredEvents.length} of {device.allEventsCount})
            </span>
            <select
              aria-label="Filter device events by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-7 rounded-md border border-border bg-card px-2 text-xs text-foreground"
            >
              <option value="ALL">All statuses</option>
              <option value="New">New</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="In case">In case</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-56">
              <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search event ID, rule..."
                className="w-full h-7 rounded-md border border-border bg-background pl-8 pr-6 text-xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            <Link to={`/events?device=${encodeURIComponent(device.identifier)}`}>
              <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1 cursor-pointer">
                <span>Open in Event inbox</span>
                <ExternalLink className="size-3" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4 font-semibold">Event ID</th>
                <th className="py-2.5 px-4 font-semibold">Type & detection</th>
                <th className="py-2.5 px-4 font-semibold">Priority</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Asset</th>
                <th className="py-2.5 px-4 font-semibold">Captured</th>
                <th className="py-2.5 px-4 font-semibold">Case</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground">
                    {device.allEventsCount === 0
                      ? 'No events recorded for this device.'
                      : 'No events match these filters.'}
                  </td>
                </tr>
              ) : (
                filteredEvents.slice(0, 50).map((evt) => {
                  const parsed = parseDate(evt.captured);
                  return (
                    <tr key={evt.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-4 font-mono font-semibold">
                        <Link to={`/events/${evt.id}`} className="text-primary hover:underline">
                          {evt.id}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-foreground">{evt.type}</div>
                        <div className="text-[11px] text-muted-foreground">{evt.detection}</div>
                      </td>
                      <td className="py-2.5 px-4">
                        <StatusBadge status={evt.priority} />
                      </td>
                      <td className="py-2.5 px-4">
                        <StatusBadge status={evt.status} />
                      </td>
                      <td className="py-2.5 px-4 font-mono text-foreground">{evt.asset}</td>
                      <td className="py-2.5 px-4 font-mono text-muted-foreground whitespace-nowrap">
                        {parsed ? formatAbsoluteMYT(parsed, { showSeconds: false }) : evt.captured}
                      </td>
                      <td className="py-2.5 px-4 font-mono">
                        {evt.caseId ? (
                          <Link to={`/cases/${evt.caseId}`} className="text-primary hover:underline">
                            {evt.caseId}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredEvents.length > 50 && (
          <div className="px-4 py-2.5 border-t border-border bg-muted/20 text-xs text-muted-foreground flex items-center justify-between">
            <span>Showing newest 50 of {filteredEvents.length} events</span>
            <Link
              to={`/events?device=${encodeURIComponent(device.identifier)}`}
              className="text-primary hover:underline font-medium"
            >
              View all {filteredEvents.length} in Event inbox →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

