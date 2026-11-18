import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DeviceWithRelations } from '@/types/devices';
import type { LiveCameraCapabilities } from '@/types/live';
import type { PoleRecord } from '@/types/assets';
import { useLiveStream } from '@/contexts/LiveStreamContext';
import { useEvents } from '@/contexts/EventsContext';
import { useToast } from '@/contexts/ToastContext';
import { formatRelativeTime, formatAbsoluteMYT } from '@/lib/dateTime';
import { computeUnifiedDeviceState } from '@/lib/liveCameras';
import {
  Play,
  RotateCw,
  AlertTriangle,
  Radio,
  ShieldAlert,
  Loader2,
  XCircle,
  WifiOff,
  ChevronDown,
  ChevronRight,
  VideoOff,
  Camera as CameraIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CameraOfflineState } from '@/components/live/CameraOfflineState';

interface LivePlayerProps {
  camera: DeviceWithRelations;
  capabilities: LiveCameraCapabilities;
  installedPole?: PoleRecord | null;
}

export const LivePlayer: React.FC<LivePlayerProps> = ({
  camera,
  capabilities,
}) => {
  const navigate = useNavigate();
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { events } = useEvents();
  const { addToast } = useToast();

  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControlsInFullscreen, setShowControlsInFullscreen] = useState(true);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const fullscreenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    activeStreamingDeviceId,
    streamState,
    failureVariant,
    failureMessage,
    streamStats,
    connectingStep,
    connectionElapsedSeconds,
    isTakingLonger,
    isMuted,
    volume,
    startStream,
    retryStream,
    cancelConnecting,
  } = useLiveStream();

  const isCurrentStreaming = activeStreamingDeviceId === camera.identifier;
  const currentEffectiveState = isCurrentStreaming ? streamState : 'idle';

  const unifiedState = useMemo(() => {
    return computeUnifiedDeviceState(camera.lastContactAt, camera.connectivityState);
  }, [camera.lastContactAt, camera.connectivityState]);

  const isOffline = unifiedState.state === 'offline';
  const isStale = unifiedState.state === 'stale';

  // Last event for this camera to display on caption row
  const lastEvent = useMemo(() => {
    return events.find((e) => (e.device || '').toLowerCase().trim() === camera.identifier.toLowerCase().trim()) || null;
  }, [events, camera.identifier]);

  // Format elapsed time in MM:SS
  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Sync video audio properties
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = volume;
    }
  }, [isMuted, volume]);

  // Handle Fullscreen tracking and auto-hide
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsFullscreen(isFs);
      setShowControlsInFullscreen(true);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handlePointerActivity = () => {
    if (!isFullscreen) return;
    setShowControlsInFullscreen(true);
    if (fullscreenTimerRef.current) clearTimeout(fullscreenTimerRef.current);
    fullscreenTimerRef.current = setTimeout(() => {
      setShowControlsInFullscreen(false);
    }, 3000);
  };

  const handleRefreshStatus = () => {
    setIsRefreshingStatus(true);
    setTimeout(() => {
      setIsRefreshingStatus(false);
      addToast(
        'info',
        `Checked telemetry for ${camera.identifier}. Device remains offline (last contact ${unifiedState.relativeTime}).`,
        'Status Checked'
      );
    }, 600);
  };

  return (
    <div className="flex flex-col w-full">
      <div
        ref={playerContainerRef}
        id="falcon-live-player"
        tabIndex={0}
        onPointerMove={handlePointerActivity}
        onKeyDown={handlePointerActivity}
        aria-label={`Live camera feed for ${camera.identifier}`}
        className="relative w-full aspect-video bg-black overflow-hidden select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {/* Live Badge + Elapsed timer overlay: strictly while Live, positioned in top right */}
        {currentEffectiveState === 'live' && (
          <div
            className={`absolute top-3 right-3 z-20 flex items-center gap-2 pointer-events-none transition-opacity duration-300 ${
              isFullscreen && !showControlsInFullscreen ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <Badge
              variant="outline"
              className="bg-destructive text-destructive-foreground border-destructive text-xs px-2.5 py-0.5 gap-1.5 font-bold animate-pulse"
            >
              <span className="size-2 rounded-full bg-white" />
              LIVE
            </Badge>
            <span className="font-mono text-xs font-semibold text-white bg-black/70 px-2 py-0.5 rounded border border-border">
              {formatElapsed(streamStats.elapsedSeconds)}
            </span>
          </div>
        )}

        {/* STATE 1: IDLE */}
        {currentEffectiveState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-muted">
            {/* Poster background at natural brightness or neutral placeholder */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {camera.identifier === 'DEV-001' ? (
                <img
                  src="/monkey-fiber.jpg"
                  alt="Idle poster frame"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                  <VideoOff className="size-12 opacity-30 stroke-[1.5]" />
                </div>
              )}
            </div>

            {/* Subtle bottom localized gradient behind text without darkening the entire snapshot */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />

            {/* Centered content sitting above snapshot */}
            {isOffline ? (
              <CameraOfflineState
                identifier={camera.identifier}
                lastContactRelative={unifiedState.relativeTime}
                onViewDevice={() => navigate(`/assets/inventory/devices/${encodeURIComponent(camera.identifier)}`)}
                onRefreshStatus={handleRefreshStatus}
                isRefreshing={isRefreshingStatus}
              />
            ) : (
              <div className="relative z-10 flex flex-col items-center max-w-md px-6 py-4 text-center">
                <Button
                  size="lg"
                  onClick={() => startStream(camera.identifier, camera.name)}
                  className="size-16 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-transform hover:scale-105 active:scale-95 mb-3 cursor-pointer border-0 shadow-none"
                  aria-label={`Start live video for ${camera.identifier}`}
                >
                  <Play className="size-7 ml-0.5 fill-current" />
                </Button>

                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Start live video
                </h3>
                <p className="text-xs text-muted-foreground mb-1">
                  Live video is requested from the camera when you press Start.
                </p>

                {isStale && (
                  <p className="text-xs text-status-warning font-medium mt-1">
                    Warning: Camera has not reported recently ({unifiedState.relativeTime}).
                  </p>
                )}

                {capabilities.isMobileData && (
                  <div className="text-xs text-status-warning bg-status-warning-tint border border-status-warning-border px-3 py-1 rounded-full flex items-center gap-1.5 mt-3">
                    <Radio className="size-3.5 shrink-0 stroke-[1.5]" />
                    <span>This camera uses mobile data. Live video adds to its usage.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STATE 2: CONNECTING */}
        {currentEffectiveState === 'connecting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-muted/95">
            <div className="flex flex-col items-center max-w-md space-y-3">
              <Loader2 className="size-8 text-primary animate-spin" />

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Connecting to camera through Edge
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  Elapsed: {connectionElapsedSeconds}s
                </p>
              </div>

              {connectingStep && (
                <div className="text-xs text-foreground bg-popover border border-border px-3 py-1.5 rounded-lg font-mono">
                  {connectingStep}
                </div>
              )}

              {isTakingLonger && (
                <div className="flex flex-col items-center gap-2 pt-2 text-status-warning text-xs">
                  <span>Taking longer than expected...</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelConnecting}
                      className="h-8 text-xs border-border"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => retryStream(camera.identifier)}
                      className="h-8 text-xs bg-primary text-primary-foreground"
                    >
                      <RotateCw className="size-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STATE 3: LIVE VIDEO STREAM */}
        {currentEffectiveState === 'live' && (
          <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
            {/* Simulated Edge RTSP video stream */}
            <video
              ref={videoRef}
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              autoPlay
              loop
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Burned-in camera text simulation (unobstructed) */}
            {camera.identifier === 'DEV-001' && (
              <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between text-yellow-300 font-mono text-xs opacity-90 select-none">
                <div className="flex justify-between items-start">
                  <span>11-18-2026 Wed 13:25:13</span>
                  <span className="border border-yellow-300 px-1 py-0.2 rounded text-xs">
                    [🔋 94%]
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <div className="leading-tight">
                    <div>Data usage pre alarm</div>
                    <div>Data Plan: 1000MB  Data Used: 2GB 692MB</div>
                  </div>
                  <div>KT 001</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STATE 4: RECONNECTING OVERLAY */}
        {currentEffectiveState === 'reconnecting' && (
          <div className="absolute inset-0 z-20 bg-background/70 flex items-center justify-center text-center p-4">
            <div className="flex items-center gap-2 bg-popover text-foreground px-4 py-2 rounded-lg border border-border">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span className="text-xs font-medium">Reconnecting live telemetry stream...</span>
            </div>
          </div>
        )}

        {/* STATE 5: FAILED STATES */}
        {currentEffectiveState === 'failed' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-muted">
            <div className="max-w-md flex flex-col items-center space-y-3">
              {failureVariant === 'camera_offline' ? (
                <>
                  <div className="size-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
                    <WifiOff className="size-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Camera Offline</h3>
                  <p className="text-xs text-muted-foreground">
                    The camera is offline. Last contact {camera.lastContactAt ? formatRelativeTime(camera.lastContactAt) : 'recently'}.
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/assets/inventory/devices/${encodeURIComponent(camera.identifier)}`)}
                      className="h-8 text-xs border-border"
                    >
                      <span>Open device</span>
                      <ChevronRight className="size-3.5 ml-1" />
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger render={
                          <span>
                            <Button
                              size="sm"
                              disabled
                              className="h-8 text-xs opacity-50 cursor-not-allowed"
                            >
                              Retry
                            </Button>
                          </span>
                        } />
                        <TooltipContent side="top" className="text-xs">
                          Retry is disabled because the camera is currently offline.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </>
              ) : failureVariant === 'vendor_unknown' ? (
                <>
                  <div className="size-12 rounded-full bg-status-warning-tint border border-status-warning-border flex items-center justify-center text-status-warning">
                    <AlertTriangle className="size-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Vendor Registration Missing</h3>
                  <p className="text-xs text-muted-foreground">
                    This camera is not registered with the vendor driver in Edge.
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => navigate('/assets/inventory/vendor-discovery')}
                      className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Open Vendor discovery
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/assets/inventory/devices/${encodeURIComponent(camera.identifier)}`)}
                      className="h-8 text-xs border-border"
                    >
                      <span>Open device</span>
                      <ChevronRight className="size-3.5 ml-1" />
                    </Button>
                  </div>
                </>
              ) : failureVariant === 'edge_timeout' ? (
                <>
                  <div className="size-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
                    <XCircle className="size-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Edge Gateway Unreachable</h3>
                  <p className="text-xs text-muted-foreground">
                    Could not reach Edge gateway. Network timed out after 20 seconds.
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => retryStream(camera.identifier)}
                      className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <RotateCw className="size-3 mr-1.5" />
                      Retry connection
                    </Button>
                  </div>
                </>
              ) : failureVariant === 'no_permission' ? (
                <>
                  <div className="size-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
                    <ShieldAlert className="size-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Permission Required</h3>
                  <p className="text-xs text-muted-foreground">
                    You do not have permission to watch live video.
                  </p>
                </>
              ) : failureVariant === 'stream_unsupported' ? (
                <>
                  <div className="size-12 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground">
                    <VideoOff className="size-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Stream Unsupported</h3>
                  <p className="text-xs text-muted-foreground">
                    This camera does not provide live video.
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/assets/inventory/devices/${encodeURIComponent(camera.identifier)}`)}
                      className="h-8 text-xs border-border"
                    >
                      <span>Open device</span>
                      <ChevronRight className="size-3.5 ml-1" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="size-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
                    <AlertTriangle className="size-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Stream Error</h3>
                  <p className="text-xs text-muted-foreground">
                    {failureMessage || 'Could not initialize live video decoder.'}
                  </p>

                  <div className="w-full text-left pt-2">
                    <button
                      type="button"
                      onClick={() => setDetailsExpanded(!detailsExpanded)}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer mx-auto"
                    >
                      {detailsExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                      <span>{detailsExpanded ? 'Hide technical details' : 'Show technical details'}</span>
                    </button>
                    {detailsExpanded && (
                      <div className="mt-2 p-3 bg-popover border border-border rounded-lg text-xs font-mono text-foreground break-all">
                        Error: RTSP_DECODER_INIT_FAILED (code: 504 Gateway Timeout)<br />
                        Device: {camera.identifier} ({camera.model})<br />
                        Timestamp: {formatAbsoluteMYT(new Date())}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => retryStream(camera.identifier)}
                      className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <RotateCw className="size-3 mr-1.5" />
                      Retry
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Caption row under the video: clearly distinguishing historical evidence snapshot from live feed */}
      {currentEffectiveState === 'idle' && (
        <div className="h-10 px-4 border-t border-border bg-muted/20 text-xs text-muted-foreground flex items-center justify-between select-none font-sans">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <CameraIcon className="size-3.5 text-primary shrink-0 stroke-[1.5]" />
              Historical snapshot
            </span>
            {lastEvent?.captured && (
              <>
                <span className="text-border">·</span>
                <span title={formatAbsoluteMYT(lastEvent.captured)}>
                  Captured {formatRelativeTime(lastEvent.captured)}
                </span>
              </>
            )}
          </div>
          {lastEvent?.type && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground hidden sm:inline">Event:</span>
              <span className="font-mono text-xs font-semibold text-foreground px-2 py-0.5 rounded bg-muted/60 border border-border">
                {lastEvent.type}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
