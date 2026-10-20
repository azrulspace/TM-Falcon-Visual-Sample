import React, { useState } from 'react';
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

export interface LightboxModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: FalconEvent | null;
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

  if (!event) return null;

  const frames = event.snapshots && event.snapshots.length > 0 ? event.snapshots : [];
  const currentFrame = frames[frameIndex] || frames[0];

  const handleNextFrame = () => {
    setFrameIndex((prev) => (prev + 1) % frames.length);
  };

  const handlePrevFrame = () => {
    setFrameIndex((prev) => (prev - 1 + frames.length) % frames.length);
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  const handleDownload = () => {
    if (!currentFrame) return;
    const a = document.createElement('a');
    a.href = currentFrame;
    a.download = `${event.id}_frame_${frameIndex + 1}.svg`;
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1200px] h-[85vh] p-0 bg-slate-950 text-white border-slate-800 flex flex-col overflow-hidden">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Camera className="size-4 text-primary" />
              <span className="font-mono text-sm font-semibold text-white">
                {formatId(event.id)}
              </span>
            </div>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-300 font-medium">{event.type}</span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-mono text-slate-400">
              Frame {frameIndex + 1} of {frames.length || 1}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.75}
              className="size-8 p-0 text-slate-300 hover:text-white hover:bg-slate-800"
              title="Zoom out"
            >
              <ZoomOut className="size-4" />
            </Button>
            <span className="text-xs font-mono text-slate-400 w-12 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
              className="size-8 p-0 text-slate-300 hover:text-white hover:bg-slate-800"
              title="Zoom in"
            >
              <ZoomIn className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetZoom}
              className="size-8 p-0 text-slate-300 hover:text-white hover:bg-slate-800"
              title="Reset fit"
            >
              <Maximize2 className="size-4" />
            </Button>
            <div className="w-px h-4 bg-slate-800 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="size-8 p-0 text-slate-300 hover:text-white hover:bg-slate-800"
              title="Download snapshot SVG"
            >
              <Download className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="size-8 p-0 text-slate-300 hover:text-white hover:bg-slate-800 ml-2"
              title="Close (Esc)"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Viewport */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-auto p-4 select-none">
          {currentFrame ? (
            <div
              className="transition-transform duration-150 ease-out flex items-center justify-center max-w-full max-h-full"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img
                src={currentFrame}
                alt={`${event.type} frame ${frameIndex + 1}`}
                className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-2xl pointer-events-none"
              />
            </div>
          ) : (
            <span className="text-slate-500 font-mono text-sm">No evidence frame loaded</span>
          )}

          {/* Navigation Arrows */}
          {frames.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevFrame}
                className="absolute left-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                title="Previous frame (Left arrow)"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                onClick={handleNextFrame}
                className="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                title="Next frame (Right arrow)"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}
        </div>

        {/* Filmstrip Footer */}
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
