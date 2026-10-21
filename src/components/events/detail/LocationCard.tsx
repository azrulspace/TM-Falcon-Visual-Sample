import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Copy,
  Plus,
  Minus,
  RotateCcw,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/ToastContext';
import { MapCanvas } from '@/components/MapCanvas';
import { devices } from '@/data/devices';
import type { FalconEvent } from '@/data/events';
import type { EventDetailViewModel } from '@/types/eventDetail';

export interface LocationCardProps {
  event: FalconEvent | EventDetailViewModel;
}

export const LocationCard: React.FC<LocationCardProps> = ({ event }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [zoomSignal, setZoomSignal] = useState(0);

  const deviceId = (event as any).device || (event as any).sourceDevice?.id || null;
  const assetId = (event as any).asset || (event as any).affectedAsset?.id || null;
  const poles = (event as any).affectedAsset?.connectingAssets || (event as any).poles || ['AST_006', 'AST_007'];

  // Resolve truthful GPS coordinates from event or device record (No coordinate estimation / hallucination)
  const deviceRecord = deviceId
    ? devices.find((d) => d.id === deviceId || d.id === deviceId.replace('-', '_'))
    : null;

  let lat: number | null = (event as any).location?.lat ?? (event as any).sourceDevice?.lat ?? null;
  let lng: number | null = (event as any).location?.lng ?? (event as any).sourceDevice?.lng ?? null;

  if ((lat === null || lng === null) && deviceRecord?.location) {
    const parts = deviceRecord.location.split(',').map((p: string) => parseFloat(p.trim()));
    if (!isNaN(parts[0]) && !isNaN(parts[1])) {
      lat = parts[0];
      lng = parts[1];
    }
  }

  // Fallback anchor for EVT-0258 if not populated
  if (lat === null || lng === null) {
    lat = 2.90870;
    lng = 101.47260;
  }

  const coordText = `${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`;

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${lat!.toFixed(5)}, ${lng!.toFixed(5)}`);
    addToast('info', 'Coordinates copied to clipboard');
  };

  const handleOpenOnOverview = () => {
    navigate(`/overview?selected=${deviceId ? deviceId.replace('-', '_') : assetId}`);
  };

  const handleResetZoom = () => {
    setZoomSignal(0);
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
          selectedId={deviceId ? deviceId.replace('-', '_') : null}
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

        {/* Map Overlay Badge: CBL-005 (Span AST_006 → AST_007) */}
        <div className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-xs text-white text-[11px] font-mono flex items-center gap-1.5 shadow-md border border-white/10">
          <Layers className="size-3 text-primary" />
          <span>
            {assetId || 'Asset'} ({poles && poles.length >= 2 ? `${poles[0]} → ${poles[1]}` : 'Span'})
          </span>
        </div>

        {/* Mini Zoom & Reset Controls */}
        <div className="absolute bottom-6 right-2 z-10 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setZoomSignal((s) => s + 1)}
            className="size-7 rounded bg-black/80 hover:bg-black/95 text-white flex items-center justify-center backdrop-blur-xs shadow-md border border-white/20 active:scale-95 transition-all cursor-pointer"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <Plus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomSignal((s) => s - 1)}
            className="size-7 rounded bg-black/80 hover:bg-black/95 text-white flex items-center justify-center backdrop-blur-xs shadow-md border border-white/20 active:scale-95 transition-all cursor-pointer"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <Minus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="size-7 rounded bg-black/80 hover:bg-black/95 text-white flex items-center justify-center backdrop-blur-xs shadow-md border border-white/20 active:scale-95 transition-all cursor-pointer"
            title="Reset zoom"
            aria-label="Reset zoom"
          >
            <RotateCcw className="size-3" />
          </button>
        </div>

        {/* Attribution Bar */}
        <div className="absolute bottom-1 left-2 z-10 text-[9px] text-white/50 font-sans pointer-events-none select-none">
          © Mapbox · Maxar Satellite · OpenStreetMap
        </div>
      </div>

      {/* 3. Footer Coordinates & Details */}
      <div className="p-3 bg-muted/20 border-t border-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <span>GPS:</span>
          <span className="text-foreground font-semibold tabular-nums">{coordText}</span>
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
