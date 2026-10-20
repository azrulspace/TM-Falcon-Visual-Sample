import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  ChevronLeft,
  ChevronRight,
  Camera,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FalconEvent } from '@/data/events';

export interface EvidenceStudioCardProps {
  event: FalconEvent;
  onOpenLightbox: (frameIndex: number) => void;
}

export const EvidenceStudioCard: React.FC<EvidenceStudioCardProps> = ({
  event,
  onOpenLightbox,
}) => {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  const frames = event.snapshots && event.snapshots.length > 0 ? event.snapshots : [];
  const currentFrame = frames[currentFrameIndex] || frames[0];

  const handleNext = () => {
    setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
  };

  const handlePrev = () => {
    setCurrentFrameIndex((prev) => (prev - 1 + frames.length) % frames.length);
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  const handleDownload = () => {
    if (!currentFrame) return;
    const a = document.createElement('a');
    a.href = currentFrame;
    a.download = `${event.id}_frame_${currentFrameIndex + 1}.svg`;
    a.click();
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Camera className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Evidence Studio</h2>
          <span className="text-xs text-muted-foreground font-mono">
            Frame {currentFrameIndex + 1} of {frames.length || 1}
          </span>
        </div>

        {/* Studio Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.75}
            className="size-7 p-0 text-muted-foreground hover:text-foreground"
            title="Zoom out"
          >
            <ZoomOut className="size-3.5" />
          </Button>

          <span className="text-xs font-mono text-muted-foreground w-11 text-center select-none">
            {Math.round(zoomLevel * 100)}%
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 2.5}
            className="size-7 p-0 text-muted-foreground hover:text-foreground"
            title="Zoom in"
          >
            <ZoomIn className="size-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetZoom}
            className="size-7 p-0 text-muted-foreground hover:text-foreground"
            title="Reset zoom"
          >
            <Maximize2 className="size-3.5" />
          </Button>

          <div className="w-px h-4 bg-border mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="size-7 p-0 text-muted-foreground hover:text-foreground"
            title="Download frame SVG"
          >
            <Download className="size-3.5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenLightbox(currentFrameIndex)}
            className="h-7 px-2 text-xs gap-1 ml-1 border-border"
            title="Open fullscreen lightbox"
          >
            <Maximize2 className="size-3 text-primary" />
            <span className="hidden sm:inline">Lightbox</span>
          </Button>
        </div>
      </div>

      {/* 2. Main Viewport */}
      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden flex items-center justify-center select-none">
        {currentFrame ? (
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-150 ease-out"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <img
              src={currentFrame}
              alt={`${event.type} frame`}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="text-slate-500 font-mono text-xs">No Snapshot Frame Available</div>
        )}

        {/* Camera tag on top left */}
        <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/70 backdrop-blur-xs text-white text-[11px] font-mono flex items-center gap-1.5 shadow-md">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{event.detection}</span>
        </div>

        {/* Frame Nav Arrows */}
        {frames.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs shadow-md transition-all active:scale-95"
              title="Previous frame"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs shadow-md transition-all active:scale-95"
              title="Next frame"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {/* 3. Filmstrip of Frames (3 frames per event) */}
      {frames.length > 1 && (
        <div className="flex items-center gap-3 p-3 bg-muted/20 border-t border-border overflow-x-auto">
          {frames.map((frame, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentFrameIndex(idx)}
              className={cn(
                'relative aspect-video w-28 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer',
                currentFrameIndex === idx
                  ? 'border-primary ring-2 ring-primary/40'
                  : 'border-border opacity-70 hover:opacity-100'
              )}
            >
              <img src={frame} alt={`Frame ${idx + 1}`} className="w-full h-full object-cover" />
              <span className="absolute bottom-1 right-1 px-1 rounded bg-black/70 text-[9px] font-mono text-white">
                F{idx + 1}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 4. Original Callout Notice */}
      <div className="p-3 bg-muted/40 border-t border-border flex items-start gap-2.5 text-xs text-muted-foreground">
        <ShieldAlert className="size-4 shrink-0 text-amber-500 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-foreground">Operational Safety Policy</span>
          <span>A detection is not proof of damage.</span>
        </div>
      </div>
    </div>
  );
};
