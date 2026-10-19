import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { devices } from '@/data/devices';

interface AssetsPillProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export const AssetsPill: React.FC<AssetsPillProps> = ({ isOpen, onToggle, className = '' }) => {
  const total = devices.length; // 15
  const online = devices.filter((d) => d.status === 'online').length; // 11
  const offline = devices.filter((d) => d.status === 'offline').length; // 2
  const stale = devices.filter((d) => d.status === 'stale').length; // 2
  const attention = offline + stale; // 4

  return (
    <button
      onClick={onToggle}
      className={`glass-panel px-3.5 py-1.5 flex items-center gap-2.5 text-xs font-medium cursor-pointer shadow-2xl transition-all border border-border/80 hover:bg-card/90 select-none rounded-lg ${
        isOpen ? 'ring-1 ring-primary bg-card text-foreground' : 'text-foreground'
      } ${className}`}
      aria-label="Toggle assets and devices drawer"
    >
      <div className="flex items-center gap-1.5 text-foreground font-semibold">
        {isOpen ? <ChevronDown className="size-3.5 text-primary" /> : <ChevronUp className="size-3.5 text-primary" />}
        <span>Assets & devices ({total})</span>
      </div>

      <span className="h-3 w-px bg-border/80" />

      {/* Status dots with semantic colors (CEO_REFERENCE: all dots, no diamonds) */}
      <div className="flex items-center gap-2.5 font-sans text-[11px] tabular-nums font-medium">
        <span className="flex items-center gap-1 text-foreground" title="Online devices">
          <span className="size-2 rounded-full bg-status-online" />
          <span>{online}</span>
        </span>

        <span className="flex items-center gap-1 text-foreground" title="Offline devices">
          <span className="size-2 rounded-full bg-status-offline" />
          <span>{offline}</span>
        </span>

        <span className="flex items-center gap-1 text-foreground" title="Stale telemetry devices">
          <span className="size-2 rounded-full bg-status-stale" />
          <span>{stale}</span>
        </span>

        <span className="flex items-center gap-1 text-status-warning" title="Devices needing attention">
          <span className="size-2 rounded-full bg-status-warning" />
          <span>{attention}</span>
        </span>
      </div>
    </button>
  );
};
