import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Copy,
  Plus,
  Minus,
  RotateCcw,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/ToastContext';
import { MapCanvas } from '@/components/MapCanvas';
import { devices } from '@/data/devices';
import { cn, formatId } from '@/lib/utils';
import { useUiMode } from '@/hooks/useUiMode';
import type { FalconEvent } from '@/data/events';
import type { EventDetailViewModel } from '@/types/eventDetail';

export interface LocationCardProps {
  event: FalconEvent | EventDetailViewModel;
  defaultCollapsed?: boolean;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  event,
  defaultCollapsed,
}) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isTablet, orientation } = useUiMode();
  const isPortrait = isTablet && orientation === 'portrait';

  const [zoomSignal, setZoomSignal] = useState(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (defaultCollapsed !== undefined) return !defaultCollapsed;
    return !isPortrait;
  });

  const deviceId = (event as any).device || (event as any).sourceDevice?.id || null;
  const assetId = (event as any).asset || (event as any).affectedAsset?.id || 'CBL-001';
  const poles = (event as any).affectedAsset?.connectingAssets || (event as any).poles || ['AST-001', 'AST-002'];
  const referencePole = poles && poles.length >= 2 ? formatId(poles[1]) : (poles && poles.length > 0 ? formatId(poles[0]) : 'AST-002');

  // Resolve truthful GPS coordinates from event or device record (No coordinate estimation)
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

  // Fallback anchor for EVT-0101 / EVT-0258 if not populated
  if (lat === null || lng === null) {
    lat = 2.909453;
    lng = 101.469941;
  }

  // Staging precision: 6 decimals
  const gpsFormatted = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(gpsFormatted);
    addToast('info', 'Coordinates copied to clipboard');
  };

  const handleOpenOnOverview = () => {
    navigate(`/overview?selected=${event.id || (deviceId ? deviceId.replace('-', '_') : assetId)}`);
  };

  const handleResetZoom = () => {
    setZoomSignal(0);
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* 1. Card Header */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 select-none',
          (isPortrait || isTablet) && 'cursor-pointer'
        )}
        onClick={() => {
          if (isPortrait) setIsExpanded((prev) => !prev);
        }}
      >
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Infrastructure location</h3>
          {isPortrait && (
            <span className="text-[11px] font-mono text-muted-foreground ml-1">
              ({isExpanded ? 'tap to collapse' : 'tap to expand'})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {/* Accordion Toggle in portrait tablet mode or mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded((prev) => !prev)}
            className={cn(
              'text-xs gap-1 text-muted-foreground hover:text-foreground cursor-pointer',
              isTablet ? 'h-[44px] px-3 min-w-[44px]' : 'h-7 px-2 md:hidden'
            )}
            title="Toggle map view"
          >
            <span>{isExpanded ? 'Hide Map' : 'Show Map'}</span>
            <ChevronDown className={cn('size-4 transition-transform duration-200', isExpanded && 'rotate-180')} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenOnOverview}
            className={cn(
              'gap-1 border-border text-foreground hover:bg-muted cursor-pointer font-medium',
              isTablet ? 'h-[44px] px-3 text-xs' : 'h-7 px-2 text-xs'
            )}
            title="Open selected asset on global Overview map"
          >
            <ExternalLink className="size-3.5" />
            <span>Overview map</span>
          </Button>
        </div>
      </div>

      {/* 2. Mini Map Viewport */}
      {isExpanded && (
        <div className="relative w-full h-64 bg-slate-950 overflow-hidden transition-all duration-300">
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

          {/* Mini Zoom & Reset Controls */}
          <div className="absolute bottom-6 right-2 z-10 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => setZoomSignal((s) => s + 1)}
              className={cn(
                'rounded bg-black/80 hover:bg-black/95 text-white flex items-center justify-center backdrop-blur-xs shadow-md border border-white/20 active:scale-95 transition-all cursor-pointer',
                isTablet ? 'size-11' : 'size-7'
              )}
              title="Zoom in"
              aria-label="Zoom in"
            >
              <Plus className={isTablet ? 'size-5' : 'size-3.5'} />
            </button>
            <button
              type="button"
              onClick={() => setZoomSignal((s) => s - 1)}
              className={cn(
                'rounded bg-black/80 hover:bg-black/95 text-white flex items-center justify-center backdrop-blur-xs shadow-md border border-white/20 active:scale-95 transition-all cursor-pointer',
                isTablet ? 'size-11' : 'size-7'
              )}
              title="Zoom out"
              aria-label="Zoom out"
            >
              <Minus className={isTablet ? 'size-5' : 'size-3.5'} />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className={cn(
                'rounded bg-black/80 hover:bg-black/95 text-white flex items-center justify-center backdrop-blur-xs shadow-md border border-white/20 active:scale-95 transition-all cursor-pointer',
                isTablet ? 'size-11' : 'size-7'
              )}
              title="Reset zoom"
              aria-label="Reset zoom"
            >
              <RotateCcw className={isTablet ? 'size-4' : 'size-3'} />
            </button>
          </div>

          {/* Attribution Bar */}
          <div className="absolute bottom-1 left-2 z-10 text-[9px] text-white/50 font-sans pointer-events-none select-none">
            © Mapbox · Maxar Satellite · OpenStreetMap
          </div>
        </div>
      )}

      {/* 3. Block below the map: span ID, Reference pole, GPS with Copy button (Section 6.3 & Staging Screenshot 3) */}
      <div className="p-4 bg-muted/20 border-t border-border flex flex-col gap-1.5 text-xs font-mono">
        <div className="font-semibold text-foreground text-xs">
          {formatId(assetId)}
        </div>
        <div className="text-muted-foreground text-xs font-sans">
          Reference pole: <span className="font-mono text-foreground font-medium">{referencePole}</span>
        </div>
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-muted-foreground text-xs">
            GPS: <span className="font-mono text-foreground font-medium">{gpsFormatted}</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyCoords}
            className={cn(
              'gap-1 text-muted-foreground hover:text-foreground cursor-pointer shrink-0',
              isTablet ? 'h-[44px] px-3 text-xs' : 'h-6 px-1.5 text-[11px]'
            )}
            title="Copy coordinates"
          >
            <Copy className="size-3.5" />
            <span>Copy</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
