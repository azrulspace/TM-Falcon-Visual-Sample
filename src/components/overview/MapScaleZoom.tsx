import React, { useEffect } from 'react';
import { ZoomIn, ZoomOut, Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface MapScaleZoomProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  scaleLevel?: number;
}

export const MapScaleZoom: React.FC<MapScaleZoomProps> = ({
  onZoomIn,
  onZoomOut,
  scaleLevel = 1,
}) => {
  // Support +/- keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        onZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        onZoomOut();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onZoomIn, onZoomOut]);

  // Dynamic scale calculation based on zoom level (5km at 1x, 2.5km at 2x)
  const maxDistance = (5 / scaleLevel).toFixed(scaleLevel > 1.5 ? 1 : 0);
  const midDistance = (2.5 / scaleLevel).toFixed(scaleLevel > 1.5 ? 1 : 1);

  return (
    <div className="flex flex-col items-end gap-1.5 pointer-events-auto select-none" data-node-id="138:13833">
      {/* Upper row: 112px Scale bar + 200px Zoom container */}
      <div className="flex items-center gap-4">
        {/* Scale bar matching Figma node 138:13834 (112x25) */}
        <div
          className="h-[25px] w-[112px] relative pointer-events-none select-none drop-shadow"
          data-node-id="138:13834"
          data-name="Map scale"
        >
          {/* Bar & Ticks */}
          <div className="absolute top-[4px] left-0 w-[112px] h-[1.5px] dark:bg-[#d9e9db] bg-slate-800" />
          <div className="absolute top-[0px] left-0 w-[1.5px] h-[8px] dark:bg-[#d9e9db] bg-slate-800" />
          <div className="absolute top-[0px] left-[56px] w-[1.5px] h-[8px] dark:bg-[#d9e9db] bg-slate-800" />
          <div className="absolute top-[0px] right-0 w-[1.5px] h-[8px] dark:bg-[#d9e9db] bg-slate-800" />

          {/* Labels: 0, 2.5, 5 km */}
          <div className="absolute top-[10px] left-0 text-[10px] font-normal dark:text-[#e4ece8] text-slate-800 leading-none">
            0
          </div>
          <div className="absolute top-[10px] left-[46px] -translate-x-1/2 text-[10px] font-normal dark:text-[#e4ece8] text-slate-800 leading-none">
            {midDistance}
          </div>
          <div className="absolute top-[10px] right-0 text-[10px] font-normal dark:text-[#e4ece8] text-slate-800 leading-none">
            {maxDistance} km
          </div>
        </div>

        {/* Zoom controls container matching Figma node 138:13849 (200x42) */}
        <div
          className="flex items-center h-[42px] w-[200px] p-1 rounded-xl border dark:border-[#2a323d] border-slate-200/90 dark:bg-[#141b23]/95 bg-white/95 backdrop-blur-md shadow-xl transition-colors"
          data-node-id="138:13849"
          data-name="Zoom controls"
        >
          {/* Zoom In button (w-[87px] h-[32px]) */}
          <button
            onClick={onZoomIn}
            className="flex items-center justify-center gap-1.5 w-[87px] h-[32px] rounded-lg text-xs font-medium text-slate-700 dark:text-[#e2e7ef] hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            aria-label="Zoom In"
            title="Zoom In (+)"
          >
            <ZoomIn className="size-3.5 shrink-0" />
            <span>Zoom In</span>
          </button>

          {/* 1px divider */}
          <div className="w-px h-[16px] dark:bg-[#2a323d] bg-slate-200 shrink-0" />

          {/* Zoom Out button (w-[98px] h-[32px]) */}
          <button
            onClick={onZoomOut}
            className="flex items-center justify-center gap-1.5 w-[98px] h-[32px] rounded-lg text-xs font-medium text-slate-700 dark:text-[#e2e7ef] hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            aria-label="Zoom Out"
            title="Zoom Out (-)"
          >
            <ZoomOut className="size-3.5 shrink-0" />
            <span>Zoom Out</span>
          </button>
        </div>
      </div>

      {/* Attribution line matching Figma node 138:13613 */}
      <div className="flex items-center gap-1.5 text-[10px] text-white/75 drop-shadow pr-0.5">
        <span>Maxar Technologies, OpenStreetMap contributors | TM FALCON (Internal Use Only)</span>
        <Popover>
          <PopoverTrigger
            render={
              <button
                className="hover:text-white transition-colors cursor-pointer"
                aria-label="Imagery attribution details"
              >
                <Info className="size-[11px]" />
              </button>
            }
          />
          <PopoverContent
            side="top"
            align="end"
            className="w-80 p-3 text-xs bg-popover text-popover-foreground border border-border shadow-2xl rounded-xl z-50 leading-relaxed"
          >
            <div className="font-semibold mb-1 text-foreground">GIS Satellite Imagery Notice</div>
            <p className="text-muted-foreground text-[11px] mb-2">
              High-resolution satellite imagery provided by Maxar Technologies &amp; Esri World Imagery. Boundary and highway vector references courtesy of OpenStreetMap contributors.
            </p>
            <p className="text-[10px] text-muted-foreground/80 border-t border-border pt-1.5">
              Production use of satellite imagery requires a licensed provider and visible attribution under TM Telecom enterprise agreements.
            </p>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
