import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Copy, ExternalLink, Plus, Minus, RotateCcw, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/ToastContext';
import { MapCanvas } from '@/components/MapCanvas';
import { devices } from '@/data/devices';
import { formatId } from '@/lib/utils';
import type { CaseWithSourceEvent } from '@/types/cases';

export interface CaseLocationCardProps {
  caseData: CaseWithSourceEvent;
}

export const CaseLocationCard: React.FC<CaseLocationCardProps> = ({ caseData }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [zoomSignal, setZoomSignal] = useState(0);

  const event = caseData.sourceEvent;
  const deviceId = event?.device || null;
  const assetId = event?.asset || null;

  // Resolve truthful GPS coordinates from devices registry or event
  const deviceRecord = deviceId
    ? devices.find((d) => d.id === deviceId || d.id === deviceId.replace('-', '_'))
    : null;

  let lat: number | null = (event as any)?.location?.lat ?? null;
  let lng: number | null = (event as any)?.location?.lng ?? null;

  if ((lat === null || lng === null) && deviceRecord?.location) {
    const parts = deviceRecord.location.split(',').map((p: string) => parseFloat(p.trim()));
    if (!isNaN(parts[0]) && !isNaN(parts[1])) {
      lat = parts[0];
      lng = parts[1];
    }
  }

  // Section 7.5: "If there are no coordinates, omit the card (do not show an empty map)."
  if (lat === null || lng === null) {
    return null;
  }

  const coordText = `${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`;

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${lat!.toFixed(5)}, ${lng!.toFixed(5)}`);
    addToast('info', 'Coordinates copied to clipboard');
  };

  const handleOpenOnOverview = () => {
    navigate(`/overview?selected=${deviceId ? deviceId.replace('-', '_') : assetId}`);
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* 1. Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Location</h2>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenOnOverview}
          className="h-7 px-2 text-xs gap-1 border-border text-primary hover:bg-primary/10 cursor-pointer"
          title="Open selected asset on global Overview map"
        >
          <span>Overview Map</span>
          <ExternalLink className="size-3" />
        </Button>
      </div>

      {/* 2. Map Canvas Container with satellite imagery */}
      <div className="relative h-[220px] w-full bg-muted/30 overflow-hidden">
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

        {/* Map Overlay Badge: Asset Span */}
        {assetId && (
          <div className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-xs text-white text-[11px] font-mono flex items-center gap-1.5 shadow-md border border-white/10 select-none">
            <Layers className="size-3 text-primary" />
            <span>{formatId(assetId)}</span>
          </div>
        )}

        {/* Map overlay controls */}
        <div className="absolute right-2 top-2 z-10 flex flex-col gap-1 bg-card border border-border rounded-md p-0.5 shadow-md">
          <button
            type="button"
            onClick={() => setZoomSignal((z) => z + 1)}
            className="size-6 flex items-center justify-center rounded text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <Plus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomSignal((z) => z - 1)}
            className="size-6 flex items-center justify-center rounded text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <Minus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomSignal(0)}
            className="size-6 flex items-center justify-center rounded text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            title="Reset map"
            aria-label="Reset map"
          >
            <RotateCcw className="size-3" />
          </button>
        </div>

        {/* Satellite attribution */}
        <div className="absolute bottom-1 right-2 z-10 pointer-events-none">
          <span className="text-[9px] text-white/70 bg-black/50 px-1 rounded backdrop-blur-xs">
            Satellite Imagery
          </span>
        </div>
      </div>

      {/* 3. Coordinates Footer with Copy */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/10 text-xs">
        <div className="flex items-center gap-1.5 font-mono text-muted-foreground text-[11px]">
          <MapPin className="size-3 text-primary shrink-0" />
          <span>{coordText}</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyCoords}
          className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground gap-1"
          title="Copy GPS coordinates"
        >
          <Copy className="size-3" />
          <span>Copy</span>
        </Button>
      </div>
    </div>
  );
};
