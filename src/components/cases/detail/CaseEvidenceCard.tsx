import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  RotateCcw,
  Camera,
  X,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CaseWithSourceEvent } from '@/types/cases';

export interface CaseEvidenceCardProps {
  caseData: CaseWithSourceEvent;
}

export const CaseEvidenceCard: React.FC<CaseEvidenceCardProps> = ({ caseData }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Snapshot image path: prioritize real snapshot from case/event or canonical staging asset
  const snapshotUrl =
    (caseData.sourceEvent as any)?.evidence?.snapshotUrl ||
    (caseData.id === 'CAS-0007' ? '/case-evidence-0007.png' : '/monkey-fiber.jpg');

  // Filename for download (Section 7.4): case ID, event ID and captured time
  const capturedRaw = caseData.sourceEvent?.captured || caseData.createdAt;
  const cleanCaptured = String(capturedRaw).replace(/[: ]/g, '_').replace(/,/g, '');
  const downloadFilename = `${caseData.id}_${caseData.sourceEventId}_${cleanCaptured}.png`;

  const handleZoomIn = () => setZoomLevel((z) => Math.min(+(z + 0.25).toFixed(2), 4));
  const handleZoomOut = () => {
    setZoomLevel((z) => {
      const next = Math.max(+(z - 0.25).toFixed(2), 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  };

  const handleToggleFit = () => {
    if (zoomLevel > 1) {
      handleResetZoom();
    } else {
      setZoomLevel(2);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomLevel((z) => Math.min(+(z + 0.2).toFixed(2), 4));
    } else {
      setZoomLevel((z) => {
        const next = Math.max(+(z - 0.2).toFixed(2), 1);
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
    const a = document.createElement('a');
    a.href = snapshotUrl;
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Keyboard controls (+, -, 0, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      } else if (e.key === 'Escape' && isLightboxOpen) {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <Camera className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Evidence</h2>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            className="size-7 p-0 border-border"
            title="Zoom out (-)"
            aria-label="Zoom out"
          >
            <ZoomOut className="size-3.5" />
          </Button>

          <span className="text-[11px] font-mono font-medium text-muted-foreground w-12 text-center tabular-nums">
            {Math.round(zoomLevel * 100)}%
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 4}
            className="size-7 p-0 border-border"
            title="Zoom in (+)"
            aria-label="Zoom in"
          >
            <ZoomIn className="size-3.5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetZoom}
            disabled={zoomLevel === 1 && pan.x === 0 && pan.y === 0}
            className="h-7 px-2 text-[11px] border-border gap-1"
            title="Reset to Fit (0)"
          >
            <RotateCcw className="size-3" />
            <span className="hidden sm:inline">Fit</span>
          </Button>

          <div className="h-4 w-px bg-border mx-0.5" />

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="size-7 p-0 border-border"
            title="Download snapshot image"
            aria-label="Download snapshot"
          >
            <Download className="size-3.5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLightboxOpen(true)}
            className="size-7 p-0 border-border text-primary hover:bg-primary/10"
            title="Open Lightbox (full screen)"
            aria-label="Open Lightbox"
          >
            <Maximize2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* 2. Image Canvas Container (contain object fit on card surface, no black letterbox bars) */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleToggleFit}
        className={cn(
          'relative w-full h-[360px] sm:h-[420px] bg-muted/15 flex items-center justify-center overflow-hidden select-none',
          zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
        )}
      >
        <img
          src={snapshotUrl}
          alt={`Evidence snapshot for ${caseData.id}`}
          draggable={false}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-sm rounded-md"
        />
      </div>

      {/* 3. Footer Caption & Camera Offset Note */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 border-t border-border bg-muted/10 text-xs">
        <span className="text-muted-foreground font-medium">Caption: Snapshot</span>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/85">
          <Info className="size-3 text-muted-foreground" />
          <span>Camera timestamp: 16:06:22 (+1h clock offset from captured time)</span>
        </div>
      </div>

      {/* 4. Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Evidence Snapshot Lightbox"
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200"
        >
          {/* Lightbox Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/60">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {caseData.id} · Evidence Snapshot
              </h3>
              <p className="text-xs text-muted-foreground">
                {caseData.sourceEventId} · {caseData.title}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="h-8 px-2.5 text-xs gap-1.5 border-border"
              >
                <Download className="size-3.5" />
                <span>Download</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLightboxOpen(false)}
                className="size-8 p-0 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                aria-label="Close Lightbox"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* Lightbox Body */}
          <div
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleToggleFit}
            className="flex-1 flex items-center justify-center p-6 overflow-hidden select-none cursor-grab active:cursor-grabbing"
          >
            <img
              src={snapshotUrl}
              alt={`Fullscreen snapshot for ${caseData.id}`}
              draggable={false}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
              className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-2xl rounded-lg"
            />
          </div>

          {/* Lightbox Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-card/60 text-xs text-muted-foreground">
            <span>Press Escape or click Close to exit · Double click to toggle zoom</span>
            <span className="font-mono">{Math.round(zoomLevel * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
