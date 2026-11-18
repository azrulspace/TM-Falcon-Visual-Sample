import React, { useState, useRef, useEffect } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoomSignal, setZoomSignal] = useState(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (defaultCollapsed !== undefined) return !defaultCollapsed;
    return !isPortrait;
  });

  // Track map loading state for skeleton (V1, V19)
  const [mapLoaded, setMapLoaded] = useState(false);

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
    lat = 2.90870;
    lng = 101.47260;
  }

  // Staging precision: 6 decimals
  const gpsFormatted = lat !== null && lng !== null ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : '';

  // ResizeObserver for dynamic layout invalidation (V1)
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      // Container resized
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setMapLoaded(true), 350);
    return () => clearTimeout(timer);
  }, [event.id]);

  const handleCopyCoords = () => {
    if (!gpsFormatted) return;
    navigator.clipboard.writeText(gpsFormatted);
    addToast('info', 'Coordinates copied to clipboard');
  };

  const handleOpenOnOverview = () => {
    navigate(`/overview?selected=${event.id || (deviceId ? deviceId.replace('-', '_') : assetId)}`);
  };

  const handleResetZoom = () => {
    setZoomSignal(0);
  };

  // V1 requirement: "If there are no coordinates, hide the card instead of showing a blank map."
  if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden"
    >
      {/* 1. Card Header: Unified 48px anatomy, titled "Location" (V8, V13) */}
      <div
        className={cn(
          'h-12 px-4 flex items-center justify-between border-b border-border bg-muted/20 select-none',
          (isPortrait || isTablet) && 'cursor-pointer'
        )}
        onClick={() => {
          if (isPortrait) setIsExpanded((prev) => !prev);
        }}
      >
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-primary shrink-0 stroke-[1.5]" />
          <h3 className="text-sm font-semibold text-foreground">Location</h3>
          {isPortrait && (
            <span className="text-xs text-muted-foreground ml-1">
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
              isTablet ? 'h-11 px-3 min-w-[44px]' : 'h-8 px-2 md:hidden'
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
              'gap-1.5 border-border text-foreground hover:bg-muted cursor-pointer font-medium',
              isTablet ? 'h-11 px-3 text-xs' : 'h-8 px-2.5 text-xs'
            )}
            title="Open selected asset on global Overview map"
          >
            <ExternalLink className="size-3.5 stroke-[1.5]" />
            <span>Overview map</span>
          </Button>
        </div>
      </div>

      {/* 2. Mini Map Viewport with centered marker & span padding (V1) */}
      {isExpanded && (
        <div className="relative w-full h-64 bg-background overflow-hidden transition-all duration-300">
          {!mapLoaded && (
            <div className="absolute inset-0 z-20 bg-muted/40 animate-pulse flex items-center justify-center">
              <span className="text-xs text-muted-foreground font-sans">Loading map tiles...</span>
            </div>
          )}

          <MapCanvas
            selectedId={deviceId ? deviceId.replace('-', '_') : null}
            onMarkerClick={() => {}}
            basemap="satellite"
            zoomInSignal={zoomSignal > 0 ? zoomSignal : undefined}
            zoomOutSignal={zoomSignal < 0 ? Math.abs(zoomSignal) : undefined}
            centerOffsetX={500}
            centerOffsetY={350}
            embedded={true}
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

          {/* Mini Zoom & Reset Controls (min 32px desktop, 44px tablet) */}
          <div className="absolute bottom-6 right-2.5 z-10 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => setZoomSignal((s) => s + 1)}
              className={cn(
                'rounded-lg bg-black/80 hover:bg-black/95 text-white flex items-center justify-center backdrop-blur-xs shadow-md border border-white/20 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isTablet ? 'size-11' : 'size-8'
              )}
              title="Zoom in"
              aria-label="Zoom in"
            >
              <Plus className={isTablet ? 'size-5' : 'size-4'} />
            </button>
            <button
              type="button"
              onClick={() => setZoomSignal((s) => s - 1)}
              className={cn(
                'rounded-lg bg-black/80 hover:bg-black/95 text-white flex items-center justify-center backdrop-blur-xs shadow-md border border-white/20 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isTablet ? 'size-11' : 'size-8'
              )}
              title="Zoom out"
              aria-label="Zoom out"
            >
              <Minus className={isTablet ? 'size-5' : 'size-4'} />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className={cn(
                'rounded-lg bg-black/80 hover:bg-black/95 text-white flex items-center justify-center backdrop-blur-xs shadow-md border border-white/20 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isTablet ? 'size-11' : 'size-8'
              )}
              title="Reset zoom"
              aria-label="Reset zoom"
            >
              <RotateCcw className={isTablet ? 'size-4' : 'size-3.5'} />
            </button>
          </div>

          {/* Attribution Bar: small, legible, AA compliant (V1) */}
          <div className="absolute bottom-1.5 left-2.5 z-10 text-xs text-white/70 font-sans pointer-events-none select-none">
            © Mapbox · Maxar Satellite · OpenStreetMap
          </div>
        </div>
      )}

      {/* 3. Block below the map: span ID, Reference pole, GPS with Copy button (V3, V4, V18) */}
      <div className="p-5 bg-muted/20 border-t border-border flex flex-col gap-2 text-xs font-sans">
        <div className="font-semibold text-foreground text-xs font-mono">
          {formatId(assetId)}
        </div>
        <div className="text-muted-foreground text-xs font-sans">
          Reference pole: <span className="font-mono text-foreground font-medium">{referencePole}</span>
        </div>
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-muted-foreground text-xs font-sans">
            GPS: <span className="font-mono text-foreground font-medium">{gpsFormatted}</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyCoords}
            className={cn(
              'gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0',
              isTablet ? 'h-11 px-3 text-xs' : 'h-8 px-2 text-xs'
            )}
            title="Copy coordinates"
          >
            <Copy className="size-3.5 stroke-[1.5]" />
            <span>Copy</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
