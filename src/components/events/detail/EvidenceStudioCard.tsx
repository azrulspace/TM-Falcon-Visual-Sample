import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  ChevronLeft,
  ChevronRight,
  Camera,
  ScanEye,
  Film,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn, formatId } from '@/lib/utils';
import { useUiMode } from '@/hooks/useUiMode';
import type { FalconEvent } from '@/data/events';
import type { EventDetailViewModel } from '@/types/eventDetail';
import { EvidenceViewer } from '@/components/evidence/EvidenceViewer';

export interface EvidenceStudioCardProps {
  event: FalconEvent | EventDetailViewModel;
  onOpenLightbox: (frameIndex: number) => void;
}

export const EvidenceStudioCard: React.FC<EvidenceStudioCardProps> = ({
  event,
  onOpenLightbox,
}) => {
  const { isTablet } = useUiMode();
  const [activeStudioTab, setActiveStudioTab] = useState<'studio' | 'clip'>('studio');
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showDetectionBox, setShowDetectionBox] = useState(false);

  // Touch gesture state
  const [touchDistance, setTouchDistance] = useState<number | null>(null);
  const [initialZoom, setInitialZoom] = useState(1);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [touchPanStart, setTouchPanStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize snapshots: real snapshot from API
  const frames = useMemoFrames(event);
  const currentFrame = frames[currentFrameIndex] || frames[0] || '/monkey-fiber.jpg';

  // Detection box normalized coordinates (only present if backend supplies it)
  const detectionRegion = (event as any).evidence?.detectionRegion || null;
  const detectionConfidence = (event as any).evidence?.confidence || null;
  const hasDetectionRegion = Boolean(detectionRegion && detectionRegion.width > 0);

  // Download filename: named with the event ID and captured time (Section 4.2)
  const capturedRaw = (event as any).captured || (event as any).capturedAt || 'snapshot';
  const cleanCaptured = String(capturedRaw).replace(/[:]/g, '-').replace(/\.\d+Z?$/, '');
  const downloadFilename = `${formatId(event.id)}_${cleanCaptured}.jpg`;

  const handleNext = () => {
    setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
  };

  const handlePrev = () => {
    setCurrentFrameIndex((prev) => (prev - 1 + frames.length) % frames.length);
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

  // Double click to toggle fit / zoom (Section 4.2)
  const handleToggleFit = () => {
    if (zoomLevel > 1) {
      handleResetZoom();
    } else {
      setZoomLevel(1.75);
    }
  };

  // Wheel zoom
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

  // Drag to pan
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
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Keyboard zoom controls inside evidence card
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';
      if (isInput) return;

      if (e.key === '=' || e.key === '+') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const channelLabel = (event as any).vendorData?.channel || 'CCTV-01';
  const ruleLabel = (event as any).detectionRule || (event as any).detection || 'CCTV-01-Motion Detection';

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* 1. Header Toolbar (Title, Chips, Controls outside the image) */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-border bg-muted/30 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Camera className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Evidence</h2>
          
          {/* Camera Info Chips outside image (D2) */}
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-muted text-muted-foreground border border-border">
            {channelLabel}
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono text-muted-foreground border border-border hidden sm:inline-block">
            {ruleLabel}
          </span>

          {frames.length > 1 && activeStudioTab === 'studio' && (
            <span className="text-xs text-muted-foreground font-mono ml-1">
              Frame {currentFrameIndex + 1} of {frames.length}
            </span>
          )}

          {/* Mode Switcher: Snapshot Studio vs Clip Playback */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/10 dark:bg-black/30 border border-border ml-2">
            <button
              type="button"
              onClick={() => setActiveStudioTab('studio')}
              className={`flex items-center rounded-md font-semibold transition-all cursor-pointer ${
                isTablet ? 'h-[44px] px-3.5 text-sm gap-2' : 'px-2.5 py-1 text-xs gap-1.5'
              } ${
                activeStudioTab === 'studio'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Camera className={isTablet ? 'size-4' : 'size-3.5'} />
              <span>Snapshot Studio</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStudioTab('clip')}
              className={`flex items-center rounded-md font-semibold transition-all cursor-pointer ${
                isTablet ? 'h-[44px] px-3.5 text-sm gap-2' : 'px-2.5 py-1 text-xs gap-1.5'
              } ${
                activeStudioTab === 'clip'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Film className={isTablet ? 'size-4' : 'size-3.5'} />
              <span>Clip Playback</span>
            </button>
          </div>
        </div>

        {/* Toolbar Controls (Visible when in Snapshot Studio mode) */}
        {activeStudioTab === 'studio' && (
          <div className="flex items-center gap-1">
          {/* Optional Detection Box Toggle (only if region exists) */}
          {hasDetectionRegion && (
            <div className={`flex items-center gap-1.5 mr-2 pr-2 border-r border-border ${isTablet ? 'h-[44px]' : ''}`}>
              <ScanEye className={isTablet ? 'size-4 text-muted-foreground' : 'size-3.5 text-muted-foreground'} />
              <span className={`${isTablet ? 'text-xs' : 'text-[11px]'} text-muted-foreground select-none`}>Detection box</span>
              <Switch
                checked={showDetectionBox}
                onCheckedChange={setShowDetectionBox}
                aria-label="Toggle detection box"
              />
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            className={`${isTablet ? 'size-11' : 'size-7'} p-0 text-muted-foreground hover:text-foreground cursor-pointer`}
            title="Zoom out (-)"
          >
            <ZoomOut className={isTablet ? 'size-5' : 'size-3.5'} />
          </Button>

          <span className="text-xs font-mono text-muted-foreground w-11 text-center select-none tabular-nums">
            {Math.round(zoomLevel * 100)}%
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 4}
            className={`${isTablet ? 'size-11' : 'size-7'} p-0 text-muted-foreground hover:text-foreground cursor-pointer`}
            title="Zoom in (+)"
          >
            <ZoomIn className={isTablet ? 'size-5' : 'size-3.5'} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetZoom}
            disabled={zoomLevel === 1 && pan.x === 0 && pan.y === 0}
            className={`${isTablet ? 'size-11' : 'size-7'} p-0 text-muted-foreground hover:text-foreground cursor-pointer`}
            title="Fit to width (0)"
          >
            <Maximize2 className={isTablet ? 'size-5' : 'size-3.5'} />
          </Button>

          <div className="w-px h-5 bg-border mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className={`${isTablet ? 'size-11' : 'size-7'} p-0 text-muted-foreground hover:text-foreground cursor-pointer`}
            title={`Download snapshot (${downloadFilename})`}
          >
            <Download className={isTablet ? 'size-5' : 'size-3.5'} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenLightbox(currentFrameIndex)}
            className={`${isTablet ? 'h-[44px] px-3.5 text-sm gap-1.5' : 'h-7 px-2 text-xs gap-1'} ml-1 border-border cursor-pointer`}
            title="Open fullscreen lightbox"
          >
            <Maximize2 className={isTablet ? 'size-4 text-primary' : 'size-3 text-primary'} />
            <span className="hidden sm:inline">Lightbox</span>
          </Button>
        </div>
        )}
      </div>

      {/* When Clip mode is active, render the shared EvidenceViewer */}
      {activeStudioTab === 'clip' ? (
        <div className="p-4 bg-muted/10">
          <EvidenceViewer
            eventId={event.id}
            snapshots={frames}
            capturedTimeMYT={(event as any).captured || 'Oct 20, 2026, 4:28 PM MYT'}
          />
        </div>
      ) : (
        <>
          {/* 2. Main Viewport: Capped at ~56vh with object-fit contain on card surface (D2) */}
          <div
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleToggleFit}
            onTouchStart={(e) => {
              if (e.touches.length === 2) {
                const dist = Math.hypot(
                  e.touches[0].clientX - e.touches[1].clientX,
                  e.touches[0].clientY - e.touches[1].clientY
                );
                setTouchDistance(dist);
                setInitialZoom(zoomLevel);
              } else if (e.touches.length === 1) {
                const now = Date.now();
                if (now - lastTapTime < 300) {
                  handleToggleFit();
                  setLastTapTime(0);
                } else {
                  setLastTapTime(now);
                }
                if (zoomLevel > 1) {
                  setIsDragging(true);
                  setTouchPanStart({
                    x: e.touches[0].clientX - pan.x,
                    y: e.touches[0].clientY - pan.y,
                  });
                }
              }
            }}
            onTouchMove={(e) => {
              if (e.touches.length === 2 && touchDistance !== null) {
                const newDist = Math.hypot(
                  e.touches[0].clientX - e.touches[1].clientX,
                  e.touches[0].clientY - e.touches[1].clientY
                );
                const factor = newDist / touchDistance;
                const nextZoom = Math.min(Math.max(initialZoom * factor, 1), 4);
                setZoomLevel(nextZoom);
              } else if (e.touches.length === 1 && isDragging && zoomLevel > 1) {
                setPan({
                  x: e.touches[0].clientX - touchPanStart.x,
                  y: e.touches[0].clientY - touchPanStart.y,
                });
              }
            }}
            onTouchEnd={() => {
              setTouchDistance(null);
              setIsDragging(false);
            }}
            className={cn(
              'relative w-full max-h-[56vh] min-h-[320px] bg-black overflow-hidden flex items-center justify-center select-none',
              zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
            )}
            style={{ touchAction: 'none' }}
          >
        <div
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-75 ease-out"
          style={{
            transform: `scale(${zoomLevel}) translate(${pan.x / zoomLevel}px, ${pan.y / zoomLevel}px)`,
          }}
        >
          {/* Truthful Real CCTV Snapshot */}
          <img
            src={currentFrame}
            alt={event.type}
            className="max-w-full max-h-[56vh] object-contain block mx-auto pointer-events-none select-none"
          />

          {/* Real Detection Box (Only rendered if supplied by API and toggled on) */}
          {showDetectionBox && hasDetectionRegion && (
            <div
              className="absolute border-2 border-red-500 bg-red-500/10 pointer-events-none transition-all"
              style={{
                left: `${detectionRegion.x * 100}%`,
                top: `${detectionRegion.y * 100}%`,
                width: `${detectionRegion.width * 100}%`,
                height: `${detectionRegion.height * 100}%`,
              }}
            >
              {detectionConfidence !== null && (
                <span className="absolute -top-5 left-0 px-1 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500 text-white">
                  {(detectionConfidence * 100).toFixed(1)}%
                </span>
              )}
            </div>
          )}
        </div>

        {/* Frame Nav Arrows (Only if multiple frames exist) */}
        {frames.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${isTablet ? 'size-11' : 'size-9'} rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs shadow-md transition-all active:scale-95 cursor-pointer`}
              title="Previous frame"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${isTablet ? 'size-11' : 'size-9'} rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs shadow-md transition-all active:scale-95 cursor-pointer`}
              title="Next frame"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {/* 3. Snapshot Caption Footer (Matches LIVE_STAGING: "Snapshot") */}
      <div className="px-4 py-2 bg-muted/20 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Snapshot</span>
        {frames.length > 1 && (
          <span className="text-[11px] font-mono text-muted-foreground">
            {currentFrameIndex + 1} of {frames.length} frames
          </span>
        )}
      </div>

      {/* 4. Filmstrip of Frames (Only rendered when API returns > 1 snapshot) */}
      {frames.length > 1 && (
        <div className="flex items-center gap-3 p-3 bg-muted/30 border-t border-border overflow-x-auto">
          {frames.map((frame, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentFrameIndex(idx)}
              className={cn(
                'relative aspect-video w-24 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer',
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
        </>
      )}
    </div>
  );
};

export const EvidenceCard = EvidenceStudioCard;

function useMemoFrames(event: FalconEvent | EventDetailViewModel): string[] {
  if ('evidence' in event && event.evidence?.snapshots) {
    return event.evidence.snapshots;
  }
  if ('snapshots' in event && Array.isArray((event as any).snapshots) && (event as any).snapshots.length > 0) {
    return (event as any).snapshots;
  }
  return ['/monkey-fiber.jpg'];
}
