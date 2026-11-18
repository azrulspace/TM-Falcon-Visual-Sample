import React, { useRef, useEffect } from 'react';
import type { DeviceWithRelations } from '@/types/devices';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraStripProps {
  cameras: DeviceWithRelations[];
  selectedCameraId: string;
  onSelectCamera: (camera: DeviceWithRelations) => void;
}

export const CameraStrip: React.FC<CameraStripProps> = ({
  cameras,
  selectedCameraId,
  onSelectCamera,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentIndex = cameras.findIndex((c) => c.identifier === selectedCameraId);

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectCamera(cameras[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < cameras.length - 1) {
      onSelectCamera(cameras[currentIndex + 1]);
    }
  };

  // Keyboard navigation "[" and "]" and left/right arrows when focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === '[') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ']') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, cameras]);

  // Scroll active item into view smoothly
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const activeElem = scrollContainerRef.current.querySelector<HTMLElement>(`[data-camera-id="${selectedCameraId}"]`);
    if (activeElem) {
      activeElem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedCameraId]);

  return (
    <div className="flex flex-col gap-2 pt-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
        <span className="font-medium text-foreground">
          Camera fleet ({cameras.length})
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground/80 hidden sm:inline">
            Shortcuts: <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono border border-border">[</kbd> prev • <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono border border-border">]</kbd> next
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex <= 0}
            className="size-7 p-0"
            aria-label="Previous camera"
            title="Previous camera ([)"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentIndex >= cameras.length - 1}
            className="size-7 p-0"
            aria-label="Next camera"
            title="Next camera (])"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Horizontal Scroll Strip */}
      <div
        ref={scrollContainerRef}
        role="listbox"
        aria-label="Camera strip listbox"
        className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40"
      >
        {cameras.map((camera) => {
          const isSelected = camera.identifier === selectedCameraId;
          const isOnline = camera.connectivityState === 'online';
          const isStale = camera.connectivityState === 'stale';

          return (
            <div
              key={camera.identifier}
              role="option"
              aria-selected={isSelected}
              data-camera-id={camera.identifier}
              tabIndex={0}
              onClick={() => onSelectCamera(camera)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectCamera(camera);
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  handlePrev();
                } else if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  handleNext();
                }
              }}
              className={`group flex-shrink-0 w-[148px] rounded-lg border text-left p-2 transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border bg-card hover:bg-muted/50 hover:border-border/80'
              }`}
            >
              {/* Thumbnail / Poster frame */}
              <div className="relative aspect-video w-full rounded bg-muted/80 overflow-hidden mb-1.5 flex items-center justify-center border border-border/40">
                <img
                  src="/monkey-fiber.jpg"
                  alt={`Last event snapshot for ${camera.identifier}`}
                  className="w-full h-full object-cover filter brightness-90 group-hover:brightness-100 transition-all"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <span className="absolute bottom-1 left-1.5 text-[9px] font-mono text-zinc-300 drop-shadow-xs">
                  Last event
                </span>
              </div>

              {/* Identifier and State Dot */}
              <div className="flex items-center justify-between gap-1">
                <span className={`font-mono text-xs font-bold truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {camera.identifier}
                </span>
                <span
                  title={camera.connectivityState}
                  className={`size-2 rounded-full shrink-0 ${
                    isOnline
                      ? 'bg-emerald-500'
                      : isStale
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />
              </div>

              <div className="text-[10px] text-muted-foreground truncate">
                {camera.installedPoleId ? `Pole ${camera.installedPoleId}` : 'Unmounted'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
