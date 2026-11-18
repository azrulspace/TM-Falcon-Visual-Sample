import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DeviceWithRelations } from '@/types/devices';
import type { LiveCameraCapabilities } from '@/types/live';
import type { PoleRecord } from '@/types/assets';
import { useLiveStream } from '@/contexts/LiveStreamContext';
import { useEvents } from '@/contexts/EventsContext';
import { formatRelativeTime, formatAbsoluteMYT } from '@/lib/dateTime';
import {
  Play,
  RotateCw,
  AlertTriangle,
  Radio,
  ExternalLink,
  ShieldAlert,
  Loader2,
  XCircle,
  WifiOff,
  ChevronDown,
  ChevronRight,
  VideoOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControlsInFullscreen, setShowControlsInFullscreen] = useState(true);
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

  // Last event for this camera to display on idle poster
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

  return (
    <div
      ref={playerContainerRef}
      id="falcon-live-player"
      tabIndex={0}
      onPointerMove={handlePointerActivity}
      onKeyDown={handlePointerActivity}
      aria-label={`Live camera feed for ${camera.identifier}`}
      className="relative w-full aspect-video rounded-xl bg-zinc-950 border border-border shadow-md overflow-hidden select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
            className="bg-rose-500/90 text-white border-rose-600 text-xs px-2.5 py-0.5 gap-1.5 font-bold shadow-md animate-pulse"
          >
            <span className="size-2 rounded-full bg-white" />
            LIVE
          </Badge>
          <span className="font-mono text-xs font-semibold text-white bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded border border-white/10">
            {formatElapsed(streamStats.elapsedSeconds)}
          </span>
        </div>
      )}

      {/* STATE 1: IDLE */}
      {currentEffectiveState === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-zinc-950">
          {/* Dimmed poster background with real snapshot at 50% brightness */}
          <div className="absolute inset-0 opacity-50 pointer-events-none overflow-hidden">
            {camera.identifier === 'DEV-001' ? (
              <img
                src="/monkey-fiber.jpg"
                alt="Idle poster frame"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-zinc-900 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
            )}
          </div>

          <div className="relative z-10 flex flex-col items-center max-w-md p-6 rounded-2xl bg-black/55 backdrop-blur-sm border border-white/10 shadow-2xl">
            <Button
              size="lg"
              onClick={() => startStream(camera.identifier, camera.name)}
              className="size-16 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 mb-4 cursor-pointer"
              aria-label={`Start live streaming for ${camera.identifier}`}
            >
              <Play className="size-8 ml-1 fill-current" />
            </Button>

            <h3 className="text-base font-bold text-white mb-1">
              Start live video
            </h3>
            <p className="text-xs text-zinc-300 mb-1">
              Live video is requested from the camera when you press Start.
            </p>

            {lastEvent && (
              <span className="text-xs text-zinc-400 mb-2">
                Last recorded event: {lastEvent.type} ({formatRelativeTime(lastEvent.captured)})
              </span>
            )}

            {capabilities.isMobileData && (
              <div className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 mt-2">
                <Radio className="size-3.5 shrink-0" />
                <span>This camera uses mobile data. Live video adds to its usage.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STATE 2: CONNECTING */}
      {currentEffectiveState === 'connecting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-zinc-950/95">
          <div className="flex flex-col items-center max-w-md space-y-4">
            <Loader2 className="size-10 text-primary animate-spin" />

            <div>
              <h3 className="text-base font-bold text-white mb-1">
                Connecting to camera through Edge
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Elapsed: {connectionElapsedSeconds}s
              </p>
            </div>

            {connectingStep && (
              <div className="text-xs text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg font-mono">
                {connectingStep}
              </div>
            )}

            {isTakingLonger && (
              <div className="flex flex-col items-center gap-2 pt-2 text-amber-400 text-xs">
                <span>Taking longer than expected...</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelConnecting}
                    className="h-8 text-xs text-zinc-200 border-zinc-700 hover:bg-zinc-800"
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

          {/* Burned-in camera text simulation (matching staging DEV-001) */}
          {camera.identifier === 'DEV-001' && (
            <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between text-yellow-300 font-mono text-[11px] drop-shadow-md z-10 opacity-90 select-none">
              <div className="flex justify-between items-start">
                <span>11-18-2026 Wed 13:25:13</span>
                <span className="border border-yellow-300 px-1 py-0.2 rounded text-[10px]">
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
        <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-xs flex items-center justify-center text-center p-4">
          <div className="flex items-center gap-2 bg-zinc-900/90 text-white px-4 py-2 rounded-lg border border-zinc-700 shadow-xl">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span className="text-xs font-medium">Reconnecting live telemetry stream...</span>
          </div>
        </div>
      )}

      {/* STATE 5: FAILED STATES */}
      {currentEffectiveState === 'failed' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-zinc-950">
          <div className="max-w-md flex flex-col items-center space-y-3">
            {failureVariant === 'camera_offline' ? (
              <>
                <div className="size-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                  <WifiOff className="size-6" />
                </div>
                <h3 className="text-base font-bold text-white">Camera Offline</h3>
                <p className="text-xs text-zinc-400">
                  The camera is offline. Last contact {camera.lastContactAt ? formatRelativeTime(camera.lastContactAt) : 'recently'}.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/assets/inventory/devices/${encodeURIComponent(camera.identifier)}`)}
                    className="h-8 text-xs text-zinc-200 border-zinc-700 hover:bg-zinc-800"
                  >
                    <ExternalLink className="size-3 mr-1.5" />
                    Open device
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <span>
                            <Button
                              size="sm"
                              disabled
                              className="h-8 text-xs opacity-50 cursor-not-allowed"
                            >
                              Retry
                            </Button>
                          </span>
                        }
                      />
                      <TooltipContent side="top" className="text-xs">
                        Retry is disabled because the camera is currently offline.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </>
            ) : failureVariant === 'vendor_unknown' ? (
              <>
                <div className="size-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <AlertTriangle className="size-6" />
                </div>
                <h3 className="text-base font-bold text-white">Vendor Registration Missing</h3>
                <p className="text-xs text-zinc-400">
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
                    className="h-8 text-xs text-zinc-200 border-zinc-700 hover:bg-zinc-800"
                  >
                    Open device
                  </Button>
                </div>
              </>
            ) : failureVariant === 'edge_timeout' ? (
              <>
                <div className="size-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                  <XCircle className="size-6" />
                </div>
                <h3 className="text-base font-bold text-white">Edge Gateway Unreachable</h3>
                <p className="text-xs text-zinc-400">
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
                <div className="size-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                  <ShieldAlert className="size-6" />
                </div>
                <h3 className="text-base font-bold text-white">Permission Required</h3>
                <p className="text-xs text-zinc-400">
                  You do not have permission to watch live video.
                </p>
              </>
            ) : failureVariant === 'stream_unsupported' ? (
              <>
                <div className="size-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
                  <VideoOff className="size-6" />
                </div>
                <h3 className="text-base font-bold text-white">Stream Unsupported</h3>
                <p className="text-xs text-zinc-400">
                  This camera does not provide live video.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/assets/inventory/devices/${encodeURIComponent(camera.identifier)}`)}
                    className="h-8 text-xs text-zinc-200 border-zinc-700 hover:bg-zinc-800"
                  >
                    Open device
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="size-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                  <AlertTriangle className="size-6" />
                </div>
                <h3 className="text-base font-bold text-white">Stream Error</h3>
                <p className="text-xs text-zinc-400">
                  {failureMessage || 'Could not initialize live video decoder.'}
                </p>

                {/* Collapsible Details */}
                <div className="w-full text-left pt-2">
                  <button
                    type="button"
                    onClick={() => setDetailsExpanded(!detailsExpanded)}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer mx-auto"
                  >
                    {detailsExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                    <span>{detailsExpanded ? 'Hide technical details' : 'Show technical details'}</span>
                  </button>
                  {detailsExpanded && (
                    <div className="mt-2 p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-[11px] font-mono text-zinc-300 break-all">
                      Error: RTSP_DECODER_INIT_FAILED (code: 504 Gateway Timeout)
                      Device: {camera.identifier} ({camera.model})
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
  );
};
