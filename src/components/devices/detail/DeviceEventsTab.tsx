import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ResolveConflictSheet } from '@/components/devices/ResolveConflictSheet';
import { useEvents } from '@/contexts/EventsContext';
import { useDevices } from '@/contexts/DevicesContext';
import { formatAbsoluteMYT, formatEventDate } from '@/lib/dateTime';
import type { DeviceRecord } from '@/types/devices';

export interface DeviceEventsTabProps {
  device: DeviceRecord;
}

export const DeviceEventsTab: React.FC<DeviceEventsTabProps> = ({ device }) => {
  const navigate = useNavigate();
  const { events } = useEvents();
  const { vendorDevices } = useDevices();
  const [conflictSheetOpen, setConflictSheetOpen] = useState(false);

  // Check if any vendor device has a conflict claiming this device
  const conflictRecord = useMemo(() => {
    return (
      vendorDevices.find(
        (v) =>
          v.matchStatus === 'Conflict' &&
          v.mappedFalconId?.toLowerCase() === device.identifier.toLowerCase()
      ) || null
    );
  }, [vendorDevices, device.identifier]);

  // Filter events matching device identifier
  const matchedEvents = useMemo(() => {
    const norm = device.identifier.toLowerCase().replace(/_/g, '-');
    return events.filter((e) => {
      if (!e.device) return false;
      const devNorm = e.device.toLowerCase().replace(/_/g, '-');
      return devNorm === norm;
    });
  }, [events, device.identifier]);

  return (
    <div className="space-y-6 select-none">
      {/* 1. Attribution Conflict Warning Banner (if applicable) */}
      {conflictRecord && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-rose-500 block">
                Vendor Attribution Mismatch Notice
              </span>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">{conflictRecord.conflictDetails?.eventsAttributedToVendorSerial || 12} events</strong> were captured by vendor serial <strong className="font-mono text-foreground">{conflictRecord.serialNumber}</strong> claiming this device. They cannot be attributed to {device.identifier} until the mapping conflict is resolved.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => setConflictSheetOpen(true)}
            className="h-8 px-3 gap-1.5 font-semibold shrink-0 cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <AlertTriangle className="size-3.5" />
            <span>Resolve conflict</span>
          </Button>
        </div>
      )}

      {/* 2. Events Inbox Table */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-border/80 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Attributed Events (30 Days)
            </h3>
            <span className="text-[11px] font-mono text-muted-foreground">
              ({matchedEvents.length} events)
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/events?search=${encodeURIComponent(device.identifier)}`)}
            className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
          >
            <span>Open in Events inbox</span>
            <ExternalLink className="size-3" />
          </Button>
        </div>

        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Event ID</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Detection rule</th>
                <th className="py-2.5 px-3">Captured (MYT)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Mounted Pole</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {matchedEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No events captured by {device.identifier} in the recorded period.
                  </td>
                </tr>
              ) : (
                matchedEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold">
                      <button
                        type="button"
                        onClick={() => navigate(`/events/${evt.id}`)}
                        className="text-primary hover:underline cursor-pointer"
                      >
                        {evt.id}
                      </button>
                    </td>

                    <td className="py-2.5 px-3">
                      <PriorityBadge priority={evt.priority} />
                    </td>

                    <td className="py-2.5 px-3 font-medium text-foreground">
                      {evt.type}
                    </td>

                    <td className="py-2.5 px-3 text-muted-foreground font-mono">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <span className="cursor-help">
                              {formatEventDate(evt.captured)}
                            </span>
                          }
                        />
                        <TooltipContent side="top">
                          {formatAbsoluteMYT(evt.captured)}
                        </TooltipContent>
                      </Tooltip>
                    </td>

                    <td className="py-2.5 px-3">
                      <StatusBadge status={evt.status} />
                    </td>

                    <td className="py-2.5 px-3 font-mono text-primary font-semibold">
                      {evt.asset || device.installedOnPoleId || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Conflict Resolution Sheet */}
      <ResolveConflictSheet
        isOpen={conflictSheetOpen}
        onClose={() => setConflictSheetOpen(false)}
        vendorRecord={conflictRecord}
        falconDevice={device}
      />
    </div>
  );
};
