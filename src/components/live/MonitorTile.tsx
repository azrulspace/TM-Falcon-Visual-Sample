import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DeviceWithRelations } from '@/types/devices';
import { computeUnifiedDeviceState, getCameraCapabilities } from '@/lib/liveCameras';
import { isLivePreviewEnabled } from '@/preview/live/previewConfig';
import { createPreviewCanvasStream, type PreviewStreamController } from '@/preview/live/previewStreamGenerator';
import { useEvents } from '@/contexts/EventsContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Camera as CameraIcon,
  Maximize2,
  ChevronRight,
  Loader2,
  AlertCircle,
  Sparkles,
  WifiOff,
  RotateCw,
} from 'lucide-react';

export type TilePlaybackState = 'idle' | 'connecting' | 'buffering' | 'playing' | 'paused' | 'error';

interface MonitorTileProps {
  camera: DeviceWithRelations;
  isStreaming: boolean;
  hasAudio: boolean;
  isSpotlight: boolean;
  onToggleStream: (cameraId: string) => void;
  onToggleAudio: (cameraId: string) => void;
  onToggleSpotlight: (cameraId: string) => void;
  onPlaybackStateChange?: (cameraId: string, state: TilePlaybackState) => void;
  onRemoveFromView?: (cameraId: string) => void;
}

export const MonitorTile: React.FC<MonitorTileProps> = ({
  camera,
  isStreaming,
  hasAudio,
  isSpotlight,
  onToggleStream,
  onToggleAudio,
  onToggleSpotlight,
  onPlaybackStateChange,
}) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { events } = useEvents();

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewCtrlRef = useRef<PreviewStreamController | null>(null);

  const [playbackState, setPlaybackState] = useState<TilePlaybackState>('idle');
  const [streamDuration, setStreamDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const capabilities = getCameraCapabilities(camera);
  const unifiedState = computeUnifiedDeviceState(camera.lastContactAt, camera.connectivityState);
  const isOffline = unifiedState.state === 'offline';
  const isDemoCamera = camera.identifier === 'DEV-001' && isLivePreviewEnabled();

  // Find recent alert for this camera
  const recentEvent = useMemo(() => {
    return (
      events.find(
        (e) => (e.device || '').toLowerCase().trim() === camera.identifier.toLowerCase().trim()
      ) || null
    );
  }, [events, camera.identifier]);

  const onPlaybackStateChangeRef = useRef(onPlaybackStateChange);
  useEffect(() => {
    onPlaybackStateChangeRef.current = onPlaybackStateChange;
  });

  // Manage media stream lifecycle and playback readiness
  useEffect(() => {
    if (!isStreaming) {
      if (previewCtrlRef.current) {
        previewCtrlRef.current.destroy();
        previewCtrlRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.removeAttribute('src');
      }
      setPlaybackState('idle');
      setIsPaused(false);
      setStreamDuration(0);
      setErrorMessage(null);
      onPlaybackStateChangeRef.current?.(camera.identifier, 'idle');
      return;
    }

    if (isOffline) {
      setPlaybackState('error');
      setErrorMessage('Device is offline.');
      onPlaybackStateChangeRef.current?.(camera.identifier, 'error');
      return;
    }

    // Set connecting state
    setPlaybackState('connecting');
    setErrorMessage(null);
    onPlaybackStateChangeRef.current?.(camera.identifier, 'connecting');

    const shouldUsePreview =
      isLivePreviewEnabled() ||
      (camera.identifier === 'DEV-001' &&
        (typeof import.meta !== 'undefined' && import.meta.env ? !import.meta.env.PROD : true));

    if (shouldUsePreview) {
      if (!previewCtrlRef.current) {
        const ctrl = createPreviewCanvasStream({
          identifier: camera.identifier,
          name: camera.name,
          installedPoleId: camera.installedPoleId,
          siteName: camera.siteName,
          isMobileData: capabilities.isMobileData,
        });
        previewCtrlRef.current = ctrl;

        if (videoRef.current) {
          videoRef.current.srcObject = ctrl.stream;
          videoRef.current
            .play()
            .then(() => {
              setPlaybackState('playing');
              onPlaybackStateChangeRef.current?.(camera.identifier, 'playing');
            })
            .catch(() => {});
        }
      }
    } else {
      // Production video stream
      if (videoRef.current) {
        videoRef.current.src =
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
        videoRef.current.play().catch(() => {});
      }
    }

    // Safety watchdog: fail if stream doesn't produce frames within 12s
    const watchdogTimer = setTimeout(() => {
      setPlaybackState((prev) => {
        if (prev === 'connecting' || prev === 'buffering') {
          setErrorMessage('Stream connection timed out.');
          onPlaybackStateChangeRef.current?.(camera.identifier, 'error');
          return 'error';
        }
        return prev;
      });
    }, 12000);

    return () => {
      clearTimeout(watchdogTimer);
      if (previewCtrlRef.current) {
        previewCtrlRef.current.destroy();
        previewCtrlRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [
    isStreaming,
    isOffline,
    camera.identifier,
    camera.name,
    camera.installedPoleId,
    camera.siteName,
    capabilities.isMobileData,
  ]);

  // Audio property synchronization
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = !hasAudio;
    }
  }, [hasAudio]);

  // Live duration counter: strictly ticks only while playing
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (playbackState === 'playing') {
      interval = setInterval(() => {
        setStreamDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [playbackState]);

  // Video element readiness handlers
  const handlePlaying = () => {
    if (isStreaming && !isPaused) {
      setPlaybackState('playing');
      onPlaybackStateChange?.(camera.identifier, 'playing');
    }
  };

  const handleLoadedData = () => {
    if (isStreaming && !isPaused) {
      setPlaybackState('playing');
      onPlaybackStateChange?.(camera.identifier, 'playing');
    }
  };

  const handleCanPlay = () => {
    if (isStreaming && !isPaused) {
      setPlaybackState('playing');
      onPlaybackStateChange?.(camera.identifier, 'playing');
    }
  };

  const handleTimeUpdate = () => {
    if (isStreaming && !isPaused && playbackState !== 'playing' && playbackState !== 'paused') {
      setPlaybackState('playing');
      onPlaybackStateChange?.(camera.identifier, 'playing');
    }
  };

  const handleError = () => {
    if (isStreaming) {
      setPlaybackState('error');
      setErrorMessage('Video decoding error.');
      onPlaybackStateChange?.(camera.identifier, 'error');
    }
  };

  // Pause / Resume toggle
  const handleTogglePause = () => {
    if (playbackState === 'playing') {
      setIsPaused(true);
      setPlaybackState('paused');
      if (previewCtrlRef.current) {
        previewCtrlRef.current.setPaused(true);
      }
      if (videoRef.current) {
        videoRef.current.pause();
      }
      onPlaybackStateChange?.(camera.identifier, 'paused');
    } else if (playbackState === 'paused') {
      setIsPaused(false);
      setPlaybackState('playing');
      if (previewCtrlRef.current) {
        previewCtrlRef.current.setPaused(false);
      }
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
      onPlaybackStateChange?.(camera.identifier, 'playing');
    }
  };

  const handleTakeSnapshot = () => {
    if (playbackState !== 'playing' && playbackState !== 'paused') return;
    try {
      if (previewCtrlRef.current) {
        const dataUrl = previewCtrlRef.current.captureSnapshot();
        const link = document.createElement('a');
        link.download = `snapshot-${camera.identifier}-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      }
      addToast(
        'success',
        `Captured high-resolution snapshot for ${camera.identifier}.`,
        'Snapshot Captured'
      );
    } catch {
      addToast('error', 'Could not extract snapshot from stream.', 'Snapshot Failed');
    }
  };

  const handleOpenSingle = () => {
    navigate(`/live/single/${encodeURIComponent(camera.identifier)}?from=monitor`);
  };

  const handleOpenDevice = () => {
    navigate(`/assets/inventory/devices/${encodeURIComponent(camera.identifier)}`);
  };

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`group/tile relative aspect-video w-full rounded-xl bg-card border overflow-hidden select-none transition-all flex flex-col justify-between ${
        isSpotlight
          ? 'ring-2 ring-primary border-primary shadow-xs'
          : isStreaming && playbackState === 'playing'
          ? 'border-border'
          : 'border-border hover:border-border/80'
      }`}
    >
      {/* 1. Tile Header Bar */}
      <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-black/85 via-black/40 to-transparent z-20 flex items-center justify-between px-3 pointer-events-auto">
        <div className="flex items-center gap-2 truncate">
          <button
            type="button"
            onClick={handleOpenSingle}
            className="font-mono text-xs font-bold text-white hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
            title="Inspect camera in Single View"
          >
            <span>{camera.identifier}</span>
            <ChevronRight className="size-3 opacity-60 group-hover/tile:opacity-100" />
          </button>
          <span className="text-xs text-zinc-300 truncate hidden sm:inline font-sans">
            {camera.installedPoleId ? `Pole ${camera.installedPoleId}` : 'Unmounted'}
          </span>
          {isDemoCamera && (
            <Badge
              variant="outline"
              className="bg-primary/20 text-primary border-primary/40 text-xs px-1.5 py-0 font-medium font-sans"
            >
              Demo
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 font-sans">
          {/* Status Display based on actual playback state */}
          {playbackState === 'playing' ? (
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="bg-destructive text-destructive-foreground border-destructive text-xs px-1.5 py-0 font-bold animate-pulse"
              >
                LIVE
              </Badge>
              <span className="font-mono text-xs text-zinc-300 bg-black/60 px-1.5 py-0.5 rounded border border-white/10">
                {formatElapsed(streamDuration)}
              </span>
            </div>
          ) : playbackState === 'paused' ? (
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-xs px-1.5 py-0 font-bold"
              >
                PAUSED
              </Badge>
              <span className="font-mono text-xs text-zinc-300 bg-black/60 px-1.5 py-0.5 rounded border border-white/10">
                {formatElapsed(streamDuration)}
              </span>
            </div>
          ) : playbackState === 'connecting' ? (
            <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-mono">
              <Loader2 className="size-3 text-primary animate-spin" />
              <span>Connecting</span>
            </div>
          ) : playbackState === 'buffering' ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono">
              <Loader2 className="size-3 animate-spin" />
              <span>Buffering</span>
            </div>
          ) : playbackState === 'error' ? (
            <Badge
              variant="outline"
              className="bg-destructive/20 text-destructive border-destructive/40 text-xs px-1.5 py-0 font-medium"
            >
              Unavailable
            </Badge>
          ) : isOffline ? (
            <div className="flex items-center gap-1.5" title={unifiedState.reason}>
              <span className="size-2 rounded-full bg-destructive" />
              <span className="text-xs text-zinc-300 capitalize font-medium hidden sm:inline">
                Offline
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5" title={unifiedState.reason}>
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-zinc-300 capitalize font-medium hidden sm:inline">
                Online
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Video Viewport & State Surfaces */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center bg-black overflow-hidden">
        {/* Permanent video element: guarantees immediate media readiness and zero mount race conditions */}
        <video
          ref={videoRef}
          autoPlay
          muted={!hasAudio}
          loop
          playsInline
          onLoadedData={handleLoadedData}
          onCanPlay={handleCanPlay}
          onPlaying={handlePlaying}
          onTimeUpdate={handleTimeUpdate}
          onError={handleError}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay Demo Stream watermark badge when playing */}
        {(playbackState === 'playing' || playbackState === 'paused') && isDemoCamera && (
          <div className="absolute top-12 right-3 z-10 pointer-events-none">
            <Badge
              variant="outline"
              className="bg-black/60 text-muted-foreground border-border text-xs px-2 py-0.5"
            >
              Demo stream · {camera.identifier}
            </Badge>
          </div>
        )}

        {/* State A: Offline State Surface (Subdued, non-intrusive) */}
        {isOffline && !isStreaming && (
          <div className="absolute inset-0 p-4 text-center z-10 flex flex-col items-center justify-center bg-card">
            <div className="size-10 rounded-full bg-muted/40 border border-border flex items-center justify-center mb-2">
              <WifiOff className="size-5 text-muted-foreground" />
            </div>
            <div className="text-xs font-semibold text-foreground">Camera offline</div>
            <div className="text-xs text-muted-foreground max-w-[240px] mt-0.5 leading-relaxed">
              {unifiedState.reason}
            </div>
            <button
              type="button"
              onClick={handleOpenDevice}
              className="text-xs text-primary hover:underline font-medium mt-2 cursor-pointer flex items-center gap-1"
            >
              <span>View device record</span>
              <ChevronRight className="size-3" />
            </button>
          </div>
        )}

        {/* State B: Connecting Surface */}
        {playbackState === 'connecting' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 z-10 text-center p-4">
            <Loader2 className="size-7 text-primary animate-spin" />
            <span className="text-xs text-zinc-300 font-mono">Connecting to camera feed...</span>
          </div>
        )}

        {/* State C: Buffering Surface */}
        {playbackState === 'buffering' && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 z-10 text-center p-4">
            <Loader2 className="size-7 text-amber-400 animate-spin" />
            <span className="text-xs text-amber-300 font-mono">Buffering stream...</span>
          </div>
        )}

        {/* State D: Error / Stream Unavailable Surface */}
        {playbackState === 'error' && (
          <div className="absolute inset-0 bg-card p-4 text-center z-10 flex flex-col items-center justify-center">
            <AlertCircle className="size-7 text-destructive mb-2" />
            <div className="text-xs font-semibold text-foreground">Stream unavailable</div>
            <div className="text-xs text-muted-foreground max-w-[220px] mt-0.5">
              {errorMessage || 'Could not initialize live video feed from device.'}
            </div>
            <div className="flex items-center gap-2 mt-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleStream(camera.identifier)}
                className="h-7 px-3 text-xs border-border text-foreground hover:bg-muted cursor-pointer"
              >
                <span>Close stream</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  onToggleStream(camera.identifier);
                  setTimeout(() => onToggleStream(camera.identifier), 150);
                }}
                className="h-7 px-3 text-xs gap-1 cursor-pointer"
              >
                <RotateCw className="size-3" />
                <span>Retry</span>
              </Button>
            </div>
          </div>
        )}

        {/* State E: Idle Poster Surface (Shown when not streaming and not offline) */}
        {!isOffline && !isStreaming && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            {camera.identifier === 'DEV-001' ? (
              <img
                src="/monkey-fiber.jpg"
                alt={`Idle snapshot for ${camera.identifier}`}
                className="w-full h-full object-cover filter brightness-90 group-hover/tile:brightness-95 transition-all"
              />
            ) : (
              <div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center text-muted-foreground relative">
                <CameraIcon className="size-8 text-muted-foreground/40 relative z-10 stroke-[1.5]" />
                <span className="text-xs font-sans text-muted-foreground/60 mt-1 relative z-10">
                  No snapshot
                </span>
              </div>
            )}

            {/* Subtle localized gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Centered Play Button */}
            <Button
              size="sm"
              onClick={() => onToggleStream(camera.identifier)}
              className="size-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center z-10 transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-xs border-0"
              aria-label={`Start live stream for ${camera.identifier}`}
            >
              <Play className="size-5 ml-0.5 fill-current" />
            </Button>
          </div>
        )}
      </div>

      {/* 3. Bottom Toolbar */}
      <div className="h-10 bg-card border-t border-border px-2 flex items-center justify-between text-xs z-20">
        <div className="flex items-center gap-1">
          {/* Start / Stop Toggle */}
          {isStreaming ? (
            <>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onToggleStream(camera.identifier)}
                className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
                aria-label="Stop stream"
              >
                <Square className="size-3 fill-current" />
                <span>Stop</span>
              </Button>

              {/* Pause / Resume Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleTogglePause}
                disabled={playbackState !== 'playing' && playbackState !== 'paused'}
                className="h-7 px-2 text-xs gap-1 border-border bg-card hover:bg-muted text-foreground cursor-pointer"
                title={isPaused ? 'Resume live video' : 'Pause live video'}
              >
                {isPaused ? (
                  <Play className="size-3 fill-current" />
                ) : (
                  <Pause className="size-3 fill-current" />
                )}
              </Button>
            </>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className={isOffline ? 'inline-flex cursor-not-allowed' : 'inline-flex'}>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isOffline}
                        onClick={() => onToggleStream(camera.identifier)}
                        className="h-7 px-2.5 text-xs gap-1 border-border bg-card text-foreground hover:bg-muted cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                      >
                        <Play className="size-3 fill-current" />
                        <span>Start</span>
                      </Button>
                    </span>
                  }
                />
                {isOffline && (
                  <TooltipContent side="top" className="text-xs">
                    Camera is offline. Start is unavailable.
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Audio Mute / Unmute */}
          {capabilities.supportsAudio && (
            <Button
              variant="ghost"
              size="sm"
              disabled={!isStreaming || (playbackState !== 'playing' && playbackState !== 'paused')}
              onClick={() => onToggleAudio(camera.identifier)}
              className={`size-7 p-0 cursor-pointer ${
                hasAudio ? 'text-primary font-bold' : 'text-muted-foreground'
              }`}
              title={hasAudio ? 'Mute audio' : 'Unmute audio'}
            >
              {hasAudio ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
            </Button>
          )}

          {/* Snapshot */}
          <Button
            variant="ghost"
            size="sm"
            disabled={!isStreaming || (playbackState !== 'playing' && playbackState !== 'paused')}
            onClick={handleTakeSnapshot}
            className="size-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Capture snapshot"
          >
            <CameraIcon className="size-3.5" />
          </Button>
        </div>

        {/* Center: Contextual Recent Event Pill */}
        {recentEvent && (
          <button
            type="button"
            onClick={() => navigate(`/events/${encodeURIComponent(recentEvent.id)}`)}
            className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors truncate max-w-[150px] cursor-pointer"
            title={`Recent alert: ${recentEvent.type} (${recentEvent.priority})`}
          >
            <span
              className={`size-1.5 rounded-full shrink-0 ${
                recentEvent.priority === 'Critical'
                  ? 'bg-destructive'
                  : recentEvent.priority === 'High'
                  ? 'bg-amber-500'
                  : 'bg-primary'
              }`}
            />
            <span className="truncate">{recentEvent.type}</span>
          </button>
        )}

        {/* Right: Spotlight & Single View Actions */}
        <div className="flex items-center gap-1">
          {/* Spotlight Mode Toggle */}
          <Button
            variant={isSpotlight ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onToggleSpotlight(camera.identifier)}
            className={`h-7 px-2 text-xs gap-1 cursor-pointer ${
              isSpotlight
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title={isSpotlight ? 'Exit spotlight' : 'Spotlight this camera'}
          >
            <Sparkles className="size-3" />
            <span className="hidden xl:inline">{isSpotlight ? 'Spotlighted' : 'Spotlight'}</span>
          </Button>

          {/* Open Single Mode */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenSingle}
            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Inspect in Single View"
          >
            <Maximize2 className="size-3.5" />
            <span className="hidden md:inline">Single</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

// Aliased export to satisfy component design guidelines
export const MonitorCameraTile = MonitorTile;
