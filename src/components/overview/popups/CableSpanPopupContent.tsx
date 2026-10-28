import React from 'react';
import {
  Layers,
  MapPin,
  ArrowRight,
  Cpu,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatId } from '@/lib/utils';
import { useOverview } from '@/contexts/OverviewContext';
import type { ResolvedEntity } from '@/lib/selection';
import { devices } from '@/data/devices';

export interface CableSpanPopupContentProps {
  entity: ResolvedEntity;
  onClose: () => void;
}

export const CableSpanPopupContent: React.FC<CableSpanPopupContentProps> = ({
  entity,
  onClose,
}) => {
  const { selectEntity } = useOverview();

  // Parse span number to determine endpoints
  const spanNum = parseInt(entity.id.replace(/\D/g, ''), 10) || 1;
  const startPoleId = `AST-${String(spanNum).padStart(3, '0')}`;
  const endPoleId = `AST-${String(spanNum + 1).padStart(3, '0')}`;
  const lengthKm = (0.8 + (spanNum % 5) * 0.4).toFixed(1);

  // Associated devices
  const spanDevs = devices.filter(
    (d) =>
      d.asset === `AST_${String(spanNum).padStart(3, '0')}` ||
      d.asset === `AST_${String(spanNum + 1).padStart(3, '0')}`
  );

  const eventCount = entity.id === 'CBL-005' ? 117 : entity.id === 'CBL-001' ? 8 : 0;

  return (
    <div className="space-y-3.5" data-testid="cable-span-popup-content">
      {/* 1. Header & Status */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-sky-400 shrink-0" />
          <h3 className="text-sm font-bold text-foreground leading-snug">
            Fibre Route {entity.id}
          </h3>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Single-Mode Aerial Fibre • {lengthKm} km
        </p>
      </div>

      {/* 2. Endpoint Assets Route Strip */}
      <div className="p-2.5 rounded-lg bg-muted/40 border border-border space-y-2 text-xs">
        <span className="text-[10px] text-muted-foreground block font-semibold">
          Span Endpoints
        </span>
        <div className="flex items-center justify-between gap-2">
          {/* Start Pole */}
          <button
            type="button"
            onClick={() => selectEntity('pole', startPoleId, { fly: true })}
            className="flex-1 flex items-center gap-1.5 p-1.5 rounded-md border border-border bg-card hover:border-emerald-500 transition-colors cursor-pointer"
          >
            <MapPin className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-mono text-xs font-semibold text-foreground truncate">
              {startPoleId}
            </span>
          </button>

          <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />

          {/* End Pole */}
          <button
            type="button"
            onClick={() => selectEntity('pole', endPoleId, { fly: true })}
            className="flex-1 flex items-center gap-1.5 p-1.5 rounded-md border border-border bg-card hover:border-emerald-500 transition-colors cursor-pointer"
          >
            <MapPin className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-mono text-xs font-semibold text-foreground truncate">
              {endPoleId}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Devices Along Route */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
          <Cpu className="size-3.5 text-primary" />
          Devices on span
        </span>
        {spanDevs.length > 0 ? (
          <div className="space-y-1">
            {spanDevs.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => selectEntity('device', d.id, { fly: true })}
                className="w-full flex items-center justify-between p-1.5 rounded-lg border border-border bg-muted/30 hover:border-primary/50 text-xs transition-colors cursor-pointer"
              >
                <span className="font-mono font-medium text-foreground">{formatId(d.id)}</span>
                <span className="text-[10px] text-muted-foreground">({d.type})</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-[11px] italic p-1">No devices installed</p>
        )}
      </div>

      {/* 4. Events Recorded */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs">
        <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
          <AlertTriangle className="size-3.5 text-amber-500/80" />
          Recorded incidents
        </span>
        {eventCount > 0 ? (
          <Link
            to={`/events?asset=${entity.id}`}
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
        <Link
          to={`/inventory?asset=${entity.id}`}
          onClick={onClose}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>View route in inventory</span>
          <ExternalLink className="size-3" />
        </Link>
      </div>
    </div>
  );
};
