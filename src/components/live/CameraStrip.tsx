import React, { useRef, useEffect } from 'react';
import type { DeviceWithRelations } from '@/types/devices';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Camera as CameraIcon,
} from 'lucide-react';
import { computeUnifiedDeviceState } from '@/lib/liveCameras';

interface CameraStripProps {
  cameras: DeviceWithRelations[];
  selectedCameraId: string;
  onSelectCamera: (camera: DeviceWithRelations) => void;
  lastEventTimeByCameraId?: Map<string, string>;
  activeStreamingDeviceId?: string | null;
}

export const CameraStrip: React.FC<CameraStripProps> = ({
  cameras,
  selectedCameraId,
  onSelectCamera,
  lastEventTimeByCameraId = new Map(),
  activeStreamingDeviceId,
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

  // Keyboard navigation for [ and ] shortcuts
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

  // Scroll active item into view smoothly within the horizontal strip container only
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const activeElem = container.querySelector<HTMLElement>(`[data-camera-id="${selectedCameraId}"]`);
    if (activeElem) {
      const elemLeft = activeElem.offsetLeft;
      const elemWidth = activeElem.offsetWidth;
      const containerWidth = container.offsetWidth;
      container.scrollTo({
        left: Math.max(0, elemLeft - containerWidth / 2 + elemWidth / 2),
        behavior: 'smooth',
      });
    }
  }, [selectedCameraId]);

  return (
    <div className="flex flex-col gap-2 pt-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
        <span className="font-semibold text-foreground text-sm">
          Cameras ({cameras.length})
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex <= 0}
            className="size-8 p-0 cursor-pointer border-border"
            aria-label="Previous camera"
            title="Previous camera ([)"
          >
            <ChevronLeft className="size-4 stroke-[1.5]" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentIndex >= cameras.length - 1}
            className="size-8 p-0 cursor-pointer border-border rounded-lg"
            aria-label="Next camera"
            title="Next camera (])"
          >
            <ChevronRight className="size-4 stroke-[1.5]" />
          </Button>
        </div>
      </div>

      {/* Horizontal Scroll Strip with Canvas Edge Fade Gradients */}
      <div className="relative group/strip">
        <div className="pointer-events-none absolute left-0 top-0 bottom-2 w-6 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-6 bg-gradient-to-l from-background to-transparent z-10" />

        <div
          ref={scrollContainerRef}
          role="listbox"
          aria-label="Cameras list"
          className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40"
        >
          {cameras.map((camera) => {
            const isSelected = camera.identifier === selectedCameraId;
            const isStreaming = activeStreamingDeviceId === camera.identifier;
            const unifiedState = computeUnifiedDeviceState(camera.lastContactAt, camera.connectivityState);
            const lastEventLabel =
              lastEventTimeByCameraId.get(camera.identifier.toLowerCase().trim()) || null;

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
                className={`group flex-shrink-0 w-44 rounded-xl border text-left p-2.5 transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                    : 'border-border bg-card hover:bg-muted/40 hover:border-border'
                }`}
              >
                {/* 16:9 Thumbnail Frame */}
                <div className="relative aspect-video w-full rounded-lg bg-muted/40 overflow-hidden mb-2 flex items-center justify-center border border-border/80">
                  {camera.identifier === 'DEV-001' ? (
                    <img
                      src="/monkey-fiber.jpg"
                      alt={`Last event snapshot for ${camera.identifier}`}
                      className="w-full h-full object-cover filter brightness-95 group-hover:brightness-100 transition-all"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center gap-1 text-muted-foreground select-none">
                      <CameraIcon className="size-4 opacity-40 stroke-[1.5]" />
                      <span className="text-xs text-muted-foreground/60 font-sans">No snapshot</span>
                    </div>
                  )}

                  {/* Only a small Live badge while streaming */}
                  {isStreaming && (
                    <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded font-bold animate-pulse">
                      <span className="size-1.5 rounded-full bg-white" />
                      <span>LIVE</span>
                    </div>
                  )}
                </div>

                {/* Caption below image: ID & refined status dot */}
                <div className="flex items-center justify-between gap-1 mb-1 font-sans">
                  <span className={`font-mono text-xs font-semibold truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {camera.identifier}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0" title={unifiedState.reason}>
                    <span
                      className={`size-1.5 rounded-full ${
                        unifiedState.state === 'online'
                          ? 'bg-status-success animate-pulse'
                          : unifiedState.state === 'stale'
                          ? 'bg-status-warning'
                          : 'bg-destructive'
                      }`}
                    />
                    <span className="text-xs text-muted-foreground capitalize">
                      {unifiedState.state}
                    </span>
                  </div>
                </div>

                {/* Pole name */}
                <div className="text-xs text-muted-foreground truncate mb-0.5 font-sans">
                  {camera.installedPoleId ? `Pole ${camera.installedPoleId}` : 'Unmounted'}
                </div>

                {/* Last event relative time in sans */}
                <div className="text-xs text-muted-foreground/70 truncate font-sans">
                  {lastEventLabel ? `Last event ${lastEventLabel}` : 'No events recorded'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
