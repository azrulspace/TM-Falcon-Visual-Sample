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
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatId } from '@/lib/utils';
import { useOverview } from '@/contexts/OverviewContext';
import type { ResolvedEntity } from '@/lib/selection';
import { devices } from '@/data/devices';

export interface DevicePopupContentProps {
  entity: ResolvedEntity;
  onClose: () => void;
}

export const DevicePopupContent: React.FC<DevicePopupContentProps> = ({ entity, onClose }) => {
  const { selectEntity } = useOverview();

  // Find underlying device record
  const dev =
    devices.find((d) => d.id === entity.rawId || formatId(d.id) === entity.id) ||
    entity.device ||
    null;

  const deviceType = dev?.type || 'Camera';
  const poleId = dev?.asset ? formatId(dev.asset) : 'AST-006';
  const serialNumber = dev?.serial || entity.deviceSerial || 'SN_DEV_004';
  const siteName = dev?.site || entity.data?.site || 'Teluk Panglima Garang';
  const model = dev?.model || 'Pilot sensor';
  const manufacturer = dev?.manufacturer || 'Sample vendor';

  // Accurate wording logic (STRICT: NO FABRICATIONS)
  const lastContactDisplay = dev?.lastContact ? dev.lastContact : 'No contact recorded';
  const batteryDisplay = (dev as any)?.battery ? `${(dev as any).battery}%` : 'Not reported';
  const protectionDisplay = (dev as any)?.protection || 'No protection recorded';

  // Event counts for this device
  const eventCount = entity.id === 'DEV-004' ? 117 : entity.id === 'DEV-001' ? 8 : 0;

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
      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-black/10 dark:bg-black/25 border dark:border-[#2a323d] border-slate-200/80 text-xs">
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
      <div className="p-2.5 rounded-lg bg-black/5 dark:bg-black/15 border dark:border-[#2a323d]/60 border-slate-200/60 space-y-2 text-xs">
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
        <div className="flex items-center justify-between border-t dark:border-white/5 border-slate-200/40 pt-1.5">
          <span className="text-muted-foreground text-[11px]">Site name</span>
          <span className="text-foreground text-[11px] truncate max-w-[180px]">{siteName}</span>
        </div>

        {/* Surge / Physical Protection */}
        <div className="flex items-center justify-between border-t dark:border-white/5 border-slate-200/40 pt-1.5">
          <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
            <Shield className="size-3 text-muted-foreground/70" />
            Protection
          </span>
          <span className="text-muted-foreground text-[11px] italic">{protectionDisplay}</span>
        </div>
      </div>

      {/* 4. Events Captured Summary */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-black/5 dark:bg-black/15 text-xs">
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
      <div className="pt-2 border-t dark:border-[#2a323d] border-slate-200 flex items-center justify-between gap-2">
        <Link
          to={`/inventory?device=${entity.id}`}
          onClick={onClose}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>View device</span>
          <ExternalLink className="size-3" />
        </Link>

        <Button
          size="sm"
          variant="outline"
          onClick={() => selectEntity('pole', poleId, { fly: true })}
          className="h-7 text-xs px-2.5 gap-1 border-slate-300 dark:border-[#2a323d] cursor-pointer"
        >
          <Navigation className="size-3 text-primary" />
          <span>Open pole on map</span>
        </Button>
      </div>
    </div>
  );
};
