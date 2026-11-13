import React from 'react';
import {
  Camera,
  RadioTower,
  Cpu,
  Radar,
  MapPin,
  Battery,
  Clock,
  Shield,
  AlertTriangle,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatId } from '@/lib/utils';
import { useOverview } from '@/contexts/OverviewContext';
import { useAssets } from '@/contexts/AssetsContext';
import type { ResolvedEntity } from '@/lib/selection';
import { devices } from '@/data/devices';
import { formatAbsoluteMYT } from '@/lib/dateTime';

export interface DevicePopupContentProps {
  entity: ResolvedEntity;
  onClose: () => void;
}

export const DevicePopupContent: React.FC<DevicePopupContentProps> = ({ entity, onClose }) => {
  const navigate = useNavigate();
  const { selectEntity } = useOverview();
  const { getDeviceById } = useAssets();

  const richDev = getDeviceById(entity.rawId) || getDeviceById(entity.id);

  // Find underlying device record (prefer live AssetsContext registry)
  const dev =
    devices.find((d) => d.id === entity.rawId || formatId(d.id) === entity.id) ||
    entity.device ||
    null;

  const displayId = richDev?.identifier || entity.id;
  const deviceType = richDev?.type || dev?.type || 'Camera';
  const poleId = richDev?.installedPoleId || (dev?.asset ? formatId(dev.asset) : 'AST-006');
  const serialNumber = richDev?.serial || dev?.serial || entity.deviceSerial || 'SN_DEV_004';
  const siteName = richDev?.siteName || dev?.site || entity.data?.site || 'Teluk Panglima Garang';
  const model = richDev?.model || dev?.model || 'Pilot sensor';
  const manufacturer = richDev?.manufacturer || dev?.manufacturer || 'Sample vendor';

  const lastContactDisplay = richDev?.lastContactAt
    ? formatAbsoluteMYT(richDev.lastContactAt, { showSeconds: false })
    : dev?.lastContact
    ? dev.lastContact
    : 'No contact recorded';
  const batteryDisplay =
    richDev?.batteryPercent !== undefined && richDev?.batteryPercent !== null
      ? `${richDev.batteryPercent}%`
      : (dev as any)?.battery
      ? `${(dev as any).battery}%`
      : 'Not reported';
  const protectionDisplay = (dev as any)?.protection || 'No protection recorded';

  const eventCount =
    richDev !== undefined
      ? richDev.allEventsCount
      : entity.id === 'DEV-004'
      ? 117
      : entity.id === 'DEV-001'
      ? 11
      : 0;

  const renderSemanticIcon = () => {
    const t = deviceType.toLowerCase();
    if (t.includes('lidar')) return <Radar className="size-4 text-primary shrink-0" />;
    if (t.includes('tower')) return <RadioTower className="size-4 text-primary shrink-0" />;
    if (t.includes('gateway')) return <Cpu className="size-4 text-primary shrink-0" />;
    return <Camera className="size-4 text-primary shrink-0" />;
  };

  return (
    <div className="space-y-3.5" data-testid="device-popup-content">
      {/* 1. Device Type & Identification */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {renderSemanticIcon()}
          <h3 className="text-sm font-bold text-foreground leading-snug">
            {entity.name || entity.id}
          </h3>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {manufacturer} • {model}
        </p>
      </div>

      {/* 2. Hardware Identifiers & Telemetry Grid */}
      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border text-xs">
        <div>
          <span className="text-[10px] text-muted-foreground block">Device ID</span>
          <span className="font-mono font-medium text-primary">{entity.id}</span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block">Serial number</span>
          <span className="font-mono text-muted-foreground">{serialNumber}</span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block flex items-center gap-1">
            <Clock className="size-3 text-muted-foreground/70" />
            Last contact
          </span>
          <span className="font-mono text-foreground text-[11px]">{lastContactDisplay}</span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block flex items-center gap-1">
            <Battery className="size-3 text-muted-foreground/70" />
            Battery
          </span>
          <span className="text-muted-foreground text-[11px] italic">{batteryDisplay}</span>
        </div>
      </div>

      {/* 3. Asset & Site Installation Location */}
      <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 space-y-2 text-xs">
        {/* Installed on Pole */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
            <MapPin className="size-3.5 text-muted-foreground/80" />
            Mounted on pole
          </span>
          <button
            type="button"
            onClick={() => selectEntity('pole', poleId, { fly: true })}
            className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
            title={`Select pole ${poleId}`}
          >
            <span>{poleId}</span>
            <Navigation className="size-2.5" />
          </button>
        </div>

        {/* Site Location */}
        <div className="flex items-center justify-between border-t border-border/40 pt-1.5">
          <span className="text-muted-foreground text-[11px]">Site name</span>
          <span className="text-foreground text-[11px] truncate max-w-[180px]">{siteName}</span>
        </div>

        {/* Surge / Physical Protection */}
        <div className="flex items-center justify-between border-t border-border/40 pt-1.5">
          <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
            <Shield className="size-3 text-muted-foreground/70" />
            Protection
          </span>
          <span className="text-muted-foreground text-[11px] italic">{protectionDisplay}</span>
        </div>
      </div>

      {/* 4. Events Captured Summary */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs">
        <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
          <AlertTriangle className="size-3.5 text-amber-500/80" />
          Recorded events
        </span>
        {eventCount > 0 ? (
          <Link
            to={`/events?device=${entity.id}`}
            onClick={onClose}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>{eventCount} captured</span>
            <ExternalLink className="size-3" />
          </Link>
        ) : (
          <span className="text-muted-foreground text-[11px] italic">No events captured</span>
        )}
      </div>

      {/* 5. Footer Actions */}
      <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
        <Button
          size="sm"
          onClick={() => {
            onClose();
            navigate(`/assets/inventory/devices/${encodeURIComponent(displayId)}`);
          }}
          className="h-8 px-3 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <span>View device</span>
          <ExternalLink className="size-3" />
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => selectEntity('pole', poleId, { fly: true })}
          className="h-8 px-3 text-xs font-medium bg-card dark:bg-popover border border-border hover:border-border-strong text-secondary-foreground hover:text-foreground cursor-pointer flex items-center gap-1.5"
        >
          <Navigation className="size-3 text-secondary-foreground" />
          <span>Open pole on map</span>
        </Button>
      </div>
    </div>
  );
};
