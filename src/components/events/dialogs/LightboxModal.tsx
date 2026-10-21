import React, { useState, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  ChevronLeft,
  ChevronRight,
  Camera,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatId } from '@/lib/utils';
import type { FalconEvent } from '@/data/events';
import type { EventDetailViewModel } from '@/types/eventDetail';

export interface LightboxModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: FalconEvent | EventDetailViewModel | null;
  initialFrameIndex?: number;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  open,
  onOpenChange,
  event,
  initialFrameIndex = 0,
}) => {
  const [frameIndex, setFrameIndex] = useState(initialFrameIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setFrameIndex(initialFrameIndex);
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  }, [open, initialFrameIndex]);

  // Keyboard navigation (+, -, 0, Esc, Left, Right)
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      } else if (e.key === '=' || e.key === '+') {
        setZoomLevel((z) => Math.min(z + 0.25, 4));
      } else if (e.key === '-' || e.key === '_') {
        setZoomLevel((z) => {
          const next = Math.max(z - 0.25, 1);
          if (next === 1) setPan({ x: 0, y: 0 });
          return next;
        });
      } else if (e.key === '0') {
        setZoomLevel(1);
        setPan({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!event) return null;

  const frames = getFrames(event);
  const currentFrame = frames[frameIndex] || frames[0] || '/monkey-fiber.jpg';

  const handleNextFrame = () => {
    setFrameIndex((prev) => (prev + 1) % frames.length);
  };

  const handlePrevFrame = () => {
    setFrameIndex((prev) => (prev - 1 + frames.length) % frames.length);
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 4));
  const handleZoomOut = () => setZoomLevel((z) => {
    const next = Math.max(z - 0.25, 1);
    if (next === 1) setPan({ x: 0, y: 0 });
    return next;
  });
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomLevel((z) => Math.min(z + 0.2, 4));
    } else {
      setZoomLevel((z) => {
        const next = Math.max(z - 0.2, 1);
        if (next === 1) setPan({ x: 0, y: 0 });
        return next;
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = () => {
    if (!currentFrame) return;
    const a = document.createElement('a');
    a.href = currentFrame;
    a.download = `${formatId(event.id)}_snapshot.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1300px] h-[88vh] p-0 bg-slate-950 text-white border-slate-800 flex flex-col overflow-hidden shadow-2xl">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-900/90 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Camera className="size-4 text-primary" />
              <span className="font-mono text-sm font-semibold text-white">
                {formatId(event.id)}
              </span>
            </div>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-300 font-medium">{event.type}</span>
            {frames.length > 1 && (
              <>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs font-mono text-slate-400">
                  Frame {frameIndex + 1} of {frames.length}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
              className="size-8 p-0 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              title="Zoom out (-)"
            >
              <ZoomOut className="size-4" />
            </Button>
            <span className="text-xs font-mono text-slate-400 w-12 text-center tabular-nums">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 4}
              className="size-8 p-0 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              title="Zoom in (+)"
            >
              <ZoomIn className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetZoom}
              disabled={zoomLevel === 1 && pan.x === 0 && pan.y === 0}
              className="size-8 p-0 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              title="Fit to window (0)"
            >
              <Maximize2 className="size-4" />
            </Button>
            <div className="w-px h-4 bg-slate-800 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="size-8 p-0 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              title="Download snapshot"
            >
              <Download className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="size-8 p-0 text-slate-300 hover:text-white hover:bg-slate-800 ml-2 cursor-pointer"
              title="Close (Esc)"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Viewport */}
        <div
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`relative flex-1 bg-black flex items-center justify-center overflow-hidden p-4 select-none ${
            zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
          }`}
        >
          {currentFrame ? (
            <div
              className="flex items-center justify-center max-w-full max-h-full transition-transform duration-75 ease-out"
              style={{
                transform: `scale(${zoomLevel}) translate(${pan.x / zoomLevel}px, ${pan.y / zoomLevel}px)`,
              }}
            >
              <img
                src={currentFrame}
                alt={`${event.type} full view`}
                className="max-w-full max-h-[75vh] object-contain rounded shadow-2xl pointer-events-none"
              />
            </div>
          ) : (
            <span className="text-slate-500 font-mono text-sm">No evidence frame loaded</span>
          )}

          {/* Navigation Arrows (Only if multiple frames) */}
          {frames.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevFrame}
                className="absolute left-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                title="Previous frame"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                onClick={handleNextFrame}
                className="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                title="Next frame"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}
        </div>

        {/* Filmstrip Footer (Only if multiple frames) */}
        {frames.length > 1 && (
          <div className="flex items-center justify-center gap-3 px-4 py-2.5 bg-slate-900 border-t border-slate-800 shrink-0">
            {frames.map((f, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setFrameIndex(i)}
                className={`relative aspect-video w-24 rounded-md overflow-hidden border-2 transition-all ${
                  frameIndex === i
                    ? 'border-primary ring-2 ring-primary/40'
                    : 'border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={f} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-0.5 right-1 text-[9px] font-mono text-white/90 bg-black/70 px-1 rounded">
                  F{i + 1}
                </span>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

function getFrames(event: FalconEvent | EventDetailViewModel): string[] {
  if ('evidence' in event && event.evidence?.snapshots) {
    return event.evidence.snapshots;
  }
  if ('snapshots' in event && Array.isArray((event as any).snapshots) && (event as any).snapshots.length > 0) {
    return (event as any).snapshots;
  }
  return ['/monkey-fiber.jpg'];
}
