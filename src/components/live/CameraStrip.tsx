import React, { useRef, useEffect, useMemo } from 'react';
import type { DeviceWithRelations } from '@/types/devices';
import { useEvents } from '@/contexts/EventsContext';
import { formatRelativeTime } from '@/lib/dateTime';
import { computeUnifiedDeviceState } from '@/lib/liveCameras';
import { ChevronLeft, ChevronRight, Camera as CameraIcon } from 'lucide-react';
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
  const { events } = useEvents();

  // Precompute last event time per camera identifier
  const lastEventTimeByCameraId = useMemo(() => {
    const map = new Map<string, string>();
    events.forEach((e) => {
      const devId = (e.device || '').toLowerCase().trim();
      if (devId && !map.has(devId) && e.captured) {
        map.set(devId, formatRelativeTime(e.captured));
      }
    });
    return map;
  }, [events]);

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

  // Keyboard navigation "[" and "]" globally when not typing
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
          Camera fleet ({cameras.length})
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex <= 0}
            className="size-8 p-0 cursor-pointer"
            aria-label="Previous camera"
            title="Previous camera ([)"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentIndex >= cameras.length - 1}
            className="size-8 p-0 cursor-pointer"
            aria-label="Next camera"
            title="Next camera (])"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Horizontal Scroll Strip with Edge Fade Gradients */}
      <div className="relative group/strip">
        <div className="pointer-events-none absolute left-0 top-0 bottom-2 w-6 bg-gradient-to-r from-card to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-6 bg-gradient-to-l from-card to-transparent z-10" />

        <div
          ref={scrollContainerRef}
          role="listbox"
          aria-label="Camera fleet strip"
          className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40"
        >
          {cameras.map((camera) => {
            const isSelected = camera.identifier === selectedCameraId;
            const unifiedState = computeUnifiedDeviceState(camera.lastContactAt, camera.connectivityState);
            const lastEventLabel =
              lastEventTimeByCameraId.get(camera.identifier.toLowerCase().trim()) || 'None';

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
                className={`group flex-shrink-0 w-44 rounded-xl border text-left p-2.5 transition-all cursor-pointer select-none focus-visible:outline-none ${
                  isSelected
                    ? 'ring-2 ring-primary border-primary bg-primary/10 shadow-xs'
                    : 'border-border bg-card hover:bg-muted/60 hover:border-border'
                }`}
              >
                {/* 16:9 Thumbnail Frame */}
                <div className="relative aspect-video w-full rounded-lg bg-zinc-900 overflow-hidden mb-2 flex items-center justify-center border border-border">
                  {camera.identifier === 'DEV-001' ? (
                    <img
                      src="/monkey-fiber.jpg"
                      alt={`Last event snapshot for ${camera.identifier}`}
                      className="w-full h-full object-cover filter brightness-90 group-hover:brightness-100 transition-all"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center text-zinc-500 relative">
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:12px_12px]" />
                      <CameraIcon className="size-5 text-zinc-500/80 relative z-10" />
                      <span className="text-xs font-mono text-zinc-400 mt-1 relative z-10">Standby</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <span className="absolute bottom-1 left-1.5 text-xs font-mono text-zinc-300 drop-shadow-xs truncate max-w-[90%]">
                    Last: {lastEventLabel}
                  </span>
                </div>

                {/* Caption below image: ID, State, Pole */}
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className={`font-mono text-xs font-bold truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {camera.identifier}
                  </span>
                  <div className="flex items-center gap-1.5" title={unifiedState.reason}>
                    <span
                      className={`size-2 rounded-full shrink-0 ${
                        unifiedState.state === 'online'
                          ? 'bg-emerald-500'
                          : unifiedState.state === 'stale'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                    <span className="text-xs text-muted-foreground capitalize font-medium">
                      {unifiedState.state}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground truncate">
                  {camera.installedPoleId ? `Pole ${camera.installedPoleId}` : 'Unmounted'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
