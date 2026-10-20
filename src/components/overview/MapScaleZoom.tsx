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
    <div className="flex flex-col items-end gap-2 pointer-events-auto select-none">
      {/* Upper row: Scale bar + Zoom container */}
      <div className="flex items-center gap-[14px]">
        {/* Scale bar matching Figma node 132:10695 (194x25) */}
        <div
          className="h-[25px] w-[194px] relative pointer-events-none select-none drop-shadow"
          data-node-id="132:10695"
          data-name="Map scale"
        >
          {/* Labels: 0, midpoint, maxDistance */}
          <div className="absolute top-0 left-0 text-[10px] font-normal text-[#e4ece8] leading-none">
            0
          </div>
          <div className="absolute top-0 left-[80px] text-[10px] font-normal text-[#e4ece8] leading-none">
            {midDistance}
          </div>
          <div className="absolute top-0 left-[165px] text-[10px] font-normal text-[#e4ece8] leading-none">
            {maxDistance} km
          </div>

          {/* Bar & Ticks */}
          <div className="absolute top-[18px] left-0 w-[174px] h-[4px] bg-[#d9e9db]" />
          <div className="absolute top-[14px] left-0 w-px h-[5px] bg-[#d9e9db]" />
          <div className="absolute top-[14px] left-[87px] w-px h-[5px] bg-[#d9e9db]" />
          <div className="absolute top-[14px] left-[173px] w-px h-[5px] bg-[#d9e9db]" />
        </div>

        {/* Zoom controls container matching Figma node 132:10702 (126x60) */}
        <div
          className="flex items-center h-[60px] w-[126px] px-[16px] py-[10px] gap-[16px] rounded-[8px] border dark:border-[#2a323d] border-slate-200/80 dark:bg-[#141b23]/92 bg-white/92 backdrop-blur-md shadow-2xl transition-colors"
          data-node-id="132:10702"
        >
          {/* Zoom In button */}
          <button
            onClick={onZoomIn}
            className="flex flex-col items-center justify-center flex-1 h-[44px] rounded-[3px] text-slate-700 dark:text-[#e2e7ef] hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            aria-label="Zoom In"
            title="Zoom In (+)"
          >
            <ZoomIn className="size-[20px] mb-1 shrink-0" />
            <span className="text-[10px] font-normal leading-none">Zoom In</span>
          </button>

          {/* Zoom Out button (fixing Figma typo from 'Zoom In' to 'Zoom Out') */}
          <button
            onClick={onZoomOut}
            className="flex flex-col items-center justify-center flex-1 h-[44px] rounded-[3px] text-slate-700 dark:text-[#e2e7ef] hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            aria-label="Zoom Out"
            title="Zoom Out (-)"
          >
            <ZoomOut className="size-[20px] mb-1 shrink-0" />
            <span className="text-[10px] font-normal leading-none">Zoom Out</span>
          </button>
        </div>
      </div>

      {/* Attribution line matching Figma node 132:10690 */}
      <div className="flex items-center gap-1.5 text-[11px] text-white/70 drop-shadow pr-1">
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
