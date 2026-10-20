import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Copy,
  Plus,
  Minus,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/ToastContext';
import { MapCanvas } from '@/components/MapCanvas';
import type { FalconEvent } from '@/data/events';

export interface LocationCardProps {
  event: FalconEvent;
}

export const LocationCard: React.FC<LocationCardProps> = ({ event }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [zoomSignal, setZoomSignal] = useState(0);

  // Coordinate estimation for the device/span in Kuching telecom grid
  const lat = 1.5534 + ((parseInt(event.id.replace(/\D/g, ''), 10) % 20) * 0.003);
  const lon = 110.3442 + ((parseInt(event.id.replace(/\D/g, ''), 10) % 15) * 0.004);
  const coordText = `${lat.toFixed(5)}° N, ${lon.toFixed(5)}° E`;

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
    addToast('info', 'Coordinates copied to clipboard');
  };

  const handleOpenOnOverview = () => {
    navigate(`/overview?selected=${event.device || event.asset}`);
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* 1. Card Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Infrastructure Location</h3>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenOnOverview}
          className="h-7 px-2 text-xs gap-1 border-border text-primary hover:bg-primary/10"
          title="Open selected asset on global Overview map"
        >
          <ExternalLink className="size-3" />
          <span>Overview Map</span>
        </Button>
      </div>

      {/* 2. Mini Satellite Map Canvas Viewport */}
      <div className="relative h-64 w-full bg-slate-950 overflow-hidden">
        <MapCanvas
          selectedId={event.device ? event.device.replace('-', '_') : null}
          onMarkerClick={() => {}}
          basemap="satellite"
          zoomInSignal={zoomSignal > 0 ? zoomSignal : undefined}
          zoomOutSignal={zoomSignal < 0 ? Math.abs(zoomSignal) : undefined}
          activeLayers={{
            devices: true,
            cableRoutes: true,
            poles: true,
            cctv: true,
            sites: false,
            clusters: false,
          }}
          className="w-full h-full"
        />

        {/* Map Overlay Badge */}
        <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded bg-black/75 backdrop-blur-xs text-white text-[11px] font-mono flex items-center gap-1.5 shadow-md">
          <Layers className="size-3 text-primary" />
          <span>{event.asset} (Span P-104 → P-105)</span>
        </div>

        {/* Mini Zoom Controls */}
        <div className="absolute bottom-2 right-2 z-10 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setZoomSignal((s) => s + 1)}
            className="size-7 rounded bg-black/75 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs shadow-md border border-white/20 active:scale-95"
            title="Zoom in"
          >
            <Plus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomSignal((s) => s - 1)}
            className="size-7 rounded bg-black/75 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs shadow-md border border-white/20 active:scale-95"
            title="Zoom out"
          >
            <Minus className="size-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Footer Coordinates & Details */}
      <div className="p-3 bg-muted/20 border-t border-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <span>GPS:</span>
          <span className="text-foreground font-semibold">{coordText}</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyCoords}
          className="h-6 px-1.5 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
          title="Copy coordinates"
        >
          <Copy className="size-3" />
          <span>Copy</span>
        </Button>
      </div>
    </div>
  );
};
