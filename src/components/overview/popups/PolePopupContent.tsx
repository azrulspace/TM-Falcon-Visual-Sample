import React from 'react';
import {
  MapPin,
  Layers,
  Camera,
  Cpu,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatId } from '@/lib/utils';
import { useOverview } from '@/contexts/OverviewContext';
import type { ResolvedEntity } from '@/lib/selection';
import { devices } from '@/data/devices';

export interface PolePopupContentProps {
  entity: ResolvedEntity;
  onClose: () => void;
}

export const PolePopupContent: React.FC<PolePopupContentProps> = ({ entity, onClose }) => {
  const { selectEntity } = useOverview();

  // Find installed devices mounted on this pole
  const installedDevs = devices.filter(
    (d) => d.asset === entity.rawId || formatId(d.asset) === entity.id
  );

  const site = entity.data?.site || 'Teluk Panglima Garang';
  const protection = (entity.data as any)?.protection || 'No protection recorded';
  const coords = entity.coordinates;

  // Connected spans for this pole (e.g. AST-002 -> CBL-001, CBL-002)
  const poleNum = parseInt(entity.id.replace(/\D/g, ''), 10) || 1;
  const connectedSpans = [
    `CBL-${String(Math.max(1, poleNum - 1)).padStart(3, '0')}`,
    `CBL-${String(poleNum).padStart(3, '0')}`,
  ];

  return (
    <div className="space-y-3.5" data-testid="pole-popup-content">
      {/* 1. Pole Classification */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-emerald-400 shrink-0" />
          <h3 className="text-sm font-bold text-foreground leading-snug">
            Distribution Pole {entity.id}
          </h3>
        </div>
        <p className="text-[11px] text-muted-foreground">{site}</p>
      </div>

      {/* 2. Location & Infrastructure Details */}
      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-black/10 dark:bg-black/25 border dark:border-[#2a323d] border-slate-200/80 text-xs">
        <div>
          <span className="text-[10px] text-muted-foreground block">Asset ID</span>
          <span className="font-mono font-medium text-emerald-400">{entity.id}</span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block">Surge protection</span>
          <span className="text-muted-foreground text-[11px] italic">{protection}</span>
        </div>
        <div className="col-span-2 border-t dark:border-white/5 border-slate-200/40 pt-1.5">
          <span className="text-[10px] text-muted-foreground block">Coordinates</span>
          {coords ? (
            <span className="font-mono text-muted-foreground text-[11px]">
              X: {coords.x.toFixed(1)}, Y: {coords.y.toFixed(1)}
            </span>
          ) : (
            <span className="text-muted-foreground text-[11px] italic">
              No coordinates surveyed
            </span>
          )}
        </div>
      </div>

      {/* 3. Connected Cable Spans */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
          <Layers className="size-3.5 text-sky-400" />
          Connected cable spans
        </span>
        <div className="flex flex-wrap gap-1.5">
          {connectedSpans.map((span) => (
            <button
              key={span}
              type="button"
              onClick={() => selectEntity('span', span, { fly: false })}
              className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25 hover:bg-sky-500/20 cursor-pointer transition-colors"
            >
              {span}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Installed Devices */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
          <Cpu className="size-3.5 text-primary" />
          Installed devices
        </span>
        {installedDevs.length > 0 ? (
          <div className="space-y-1">
            {installedDevs.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => selectEntity('device', d.id, { fly: true })}
                className="w-full flex items-center justify-between p-1.5 rounded-lg border dark:border-[#2a323d] border-slate-200/60 dark:bg-black/15 bg-slate-50/50 hover:border-primary/50 text-xs transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Camera className="size-3 text-primary shrink-0" />
                  <span className="font-mono font-medium text-foreground">{formatId(d.id)}</span>
                  <span className="text-[10px] text-muted-foreground">({d.type})</span>
                </div>
                <span
                  className={`text-[9.5px] font-semibold uppercase px-1.5 py-0.2 rounded font-mono ${
                    d.status === 'offline'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : d.status === 'stale'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {d.status}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-[11px] italic p-1">No devices installed</p>
        )}
      </div>

      {/* 5. Footer Actions */}
      <div className="pt-2 border-t dark:border-[#2a323d] border-slate-200 flex items-center justify-between gap-2">
        <Link
          to={`/inventory?asset=${entity.id}`}
          onClick={onClose}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>View asset in inventory</span>
          <ExternalLink className="size-3" />
        </Link>
      </div>
    </div>
  );
};
