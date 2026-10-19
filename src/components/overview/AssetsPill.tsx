import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { devices } from '@/data/devices';

interface AssetsPillProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const AssetsPill: React.FC<AssetsPillProps> = ({ isOpen, onToggle }) => {
  const total = devices.length;
  const online = devices.filter((d) => d.status === 'online').length;
  const offline = devices.filter((d) => d.status === 'offline').length;
  const stale = devices.filter((d) => d.status === 'stale').length;
  const attention = offline + stale;

  return (
    <button
      onClick={onToggle}
      className={`glass-panel px-3.5 py-1.5 flex items-center gap-2.5 text-xs font-medium cursor-pointer shadow-xl transition-all border border-border/80 hover:bg-card/90 select-none ${
        isOpen ? 'ring-1 ring-primary bg-card text-foreground' : 'text-foreground'
      }`}
      aria-label="Toggle assets and devices drawer"
    >
      <div className="flex items-center gap-1.5 text-foreground font-semibold">
        {isOpen ? <ChevronDown className="size-3.5 text-primary" /> : <ChevronUp className="size-3.5 text-primary" />}
        <span>Assets & devices ({total})</span>
      </div>

      <span className="h-3 w-px bg-border/80" />

      {/* Status dots */}
      <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums">
        <span className="flex items-center gap-1 text-status-online">
          <span className="size-2 rounded-full bg-status-online" />
          <span>{online}</span>
        </span>

        <span className="flex items-center gap-1 text-status-offline">
          <span className="size-2 rounded-full bg-status-offline" />
          <span>{offline}</span>
        </span>

        <span className="flex items-center gap-1 text-status-stale">
          <span className="size-2 rounded-full bg-status-stale" />
          <span>{stale}</span>
        </span>

        <span className="flex items-center gap-1 text-status-warning">
          <span className="size-2 rotate-45 bg-status-warning" />
          <span>{attention}</span>
        </span>
      </div>
    </button>
  );
};
