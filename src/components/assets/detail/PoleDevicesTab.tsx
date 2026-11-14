import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Cpu,
  Video,
  Radio,
  Activity,
  ExternalLink,
  Plus,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useEvents } from '@/contexts/EventsContext';
import { normalizeRelationKey } from '@/data/poles';
import { MountDeviceDialog } from './MountDeviceDialog';
import type { PoleWithRelations, BackendCapabilities } from '@/types/assets';

export interface PoleDevicesTabProps {
  pole: PoleWithRelations;
  capabilities: BackendCapabilities;
}

function getDeviceTypeIcon(type: string) {
  const lower = (type || '').toLowerCase();
  if (lower.includes('camera') || lower.includes('cctv')) return <Video className="size-4 text-primary" />;
  if (lower.includes('speaker') || lower.includes('horn') || lower.includes('audio')) {
    return <Radio className="size-4 text-sky-400" />;
  }
  if (lower.includes('lidar') || lower.includes('radar') || lower.includes('antenna')) {
    return <Radio className="size-4 text-status-info" />;
  }
  if (lower.includes('sensor') || lower.includes('vibrat') || lower.includes('weather')) {
    return <Activity className="size-4 text-status-warning" />;
  }
  return <Cpu className="size-4 text-muted-foreground" />;
}

/**
 * Linked devices tab for Pole detail: lists real devices attached to this pole with live status,
 * type icon, last contact, real captured events count from EventsContext, and active mounting actions.
 */
export const PoleDevicesTab: React.FC<PoleDevicesTabProps> = ({
  pole,
}) => {
  const navigate = useNavigate();
  const { events } = useEvents();
  const [mountDialogOpen, setMountDialogOpen] = useState(false);

  const eventCountByDevice = useMemo(() => {
    const map = new Map<string, number>();
    pole.linkedDevices.forEach((dev) => {
      const devKey = normalizeRelationKey(dev.id);
      const cnt = events.filter((e) => normalizeRelationKey(e.device) === devKey).length;
      map.set(dev.id, cnt);
    });
    return map;
  }, [pole.linkedDevices, events]);

  const handleRegisterNew = () => {
    navigate(
      `/assets/inventory/devices/new?poleId=${encodeURIComponent(
        pole.identifier
      )}&site=${encodeURIComponent(pole.siteName)}`
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
        <div className="text-xs text-muted-foreground">
          <strong className="font-semibold text-foreground">{pole.linkedDevicesCount}</strong>{' '}
          {pole.linkedDevicesCount === 1 ? 'device' : 'devices'} mounted on this pole
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="default"
            onClick={() => setMountDialogOpen(true)}
            className="h-8 px-3 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-xs"
          >
            <Link2 className="size-3.5" />
            <span>Mount device</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleRegisterNew}
            className="h-8 px-3 text-xs gap-1.5 border-border hover:bg-muted cursor-pointer"
          >
            <Plus className="size-3.5 text-primary" />
            <span>Register new device</span>
          </Button>
        </div>
      </div>

      {pole.linkedDevices.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center space-y-3">
          <div className="size-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto">
            <Cpu className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground">No devices currently mounted</p>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              No edge camera, speaker, or sensor is currently attached to pole {pole.identifier}.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2.5 pt-1">
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={() => setMountDialogOpen(true)}
              className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-xs"
            >
              <Link2 className="size-3.5" />
              <span>Mount an existing device</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleRegisterNew}
              className="text-xs gap-1.5 border-border hover:bg-muted cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Register new device for this pole</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted text-muted-foreground border-b border-border">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Device ID</th>
                <th className="py-2.5 px-3 font-semibold">Name & Type</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">Last contact</th>
                <th className="py-2.5 px-3 font-semibold text-right">Events</th>
                <th className="py-2.5 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pole.linkedDevices.map((dev) => {
                const evCount = eventCountByDevice.get(dev.id) || 0;
                return (
                  <tr key={dev.id} className="hover:bg-muted/30">
                    <td className="py-2.5 px-3 font-mono font-semibold whitespace-nowrap">
                      <Link
                        to={`/assets/inventory/devices/${encodeURIComponent(dev.id)}`}
                        className="text-primary hover:underline"
                      >
                        {dev.id}
                      </Link>
                      {dev.serial && (
                        <div className="text-[10px] font-normal text-muted-foreground">
                          {dev.serial}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        {getDeviceTypeIcon(dev.type)}
                        <div>
                          <div className="font-medium text-foreground">{dev.name}</div>
                          <div className="text-[11px] text-muted-foreground">{dev.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge status={dev.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                      {dev.lastContact || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      {evCount > 0 ? (
                        <Link
                          to={`/events?device=${encodeURIComponent(dev.id)}`}
                          className="font-mono font-medium text-primary hover:underline"
                        >
                          {evCount}
                        </Link>
                      ) : (
                        <span className="font-mono text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <Link
                        to={`/assets/inventory/devices/${encodeURIComponent(dev.id)}`}
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                      >
                        <span>Details</span>
                        <ExternalLink className="size-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mount Device Dialog */}
      <MountDeviceDialog
        pole={pole}
        open={mountDialogOpen}
        onOpenChange={setMountDialogOpen}
      />
    </div>
  );
};
