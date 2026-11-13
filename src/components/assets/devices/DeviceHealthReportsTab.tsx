import React from 'react';
import { Activity, Battery, HeartPulse, Thermometer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeviceConnectivityBadge } from './DeviceStateBadge';
import { formatAbsoluteMYT } from '@/lib/dateTime';
import type { DeviceWithRelations } from '@/types/devices';
import type { DevicePermissions } from '@/lib/permissions';

export interface DeviceHealthReportsTabProps {
  device: DeviceWithRelations;
  permissions: DevicePermissions;
  onRunConnectionCheck: () => void;
}

export const DeviceHealthReportsTab: React.FC<DeviceHealthReportsTabProps> = ({
  device,
  permissions,
  onRunConnectionCheck,
}) => {
  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <HeartPulse className="size-4 text-primary" />
          <h2 className="text-xs font-semibold text-foreground">
            Health reports ({device.healthReports.length})
          </h2>
        </div>

        {permissions.canRunConnectionCheck && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRunConnectionCheck}
            className="h-7 px-2.5 text-xs gap-1.5 border-border bg-card hover:bg-muted cursor-pointer"
          >
            <Activity className="size-3.5 text-primary" />
            <span>Run health check</span>
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-4 font-semibold">Reported at (MYT)</th>
              <th className="py-2.5 px-4 font-semibold">State</th>
              <th className="py-2.5 px-4 font-semibold">Battery</th>
              <th className="py-2.5 px-4 font-semibold">Temperature</th>
              <th className="py-2.5 px-4 font-semibold">Signal</th>
              <th className="py-2.5 px-4 font-semibold">Software</th>
              <th className="py-2.5 px-4 font-semibold">Source & notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {device.healthReports.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-muted-foreground">
                  No telemetry health snapshots recorded yet for this device.
                </td>
              </tr>
            ) : (
              device.healthReports.map((hr) => (
                <tr key={hr.id} className="hover:bg-muted/30">
                  <td className="py-2.5 px-4 font-mono text-foreground whitespace-nowrap">
                    {formatAbsoluteMYT(hr.reportedAt, { showSeconds: false })}
                  </td>
                  <td className="py-2.5 px-4">
                    <DeviceConnectivityBadge state={hr.state} />
                  </td>
                  <td className="py-2.5 px-4 font-mono text-foreground">
                    {hr.batteryPercent !== null ? (
                      <span className="inline-flex items-center gap-1">
                        <Battery className="size-3 text-muted-foreground" />
                        {hr.batteryPercent}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No data</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-foreground">
                    {hr.temperatureC !== null ? (
                      <span className="inline-flex items-center gap-1">
                        <Thermometer className="size-3 text-muted-foreground" />
                        {hr.temperatureC} °C
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No data</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-foreground">
                    {hr.signalStrengthDbm !== undefined && hr.signalStrengthDbm !== null
                      ? `${hr.signalStrengthDbm} dBm`
                      : '—'}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-foreground">
                    {hr.softwareVersion || 'Not reported'}
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground">
                    <span className="font-medium text-foreground">{hr.source}</span>
                    {hr.note ? ` · ${hr.note}` : ''}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

