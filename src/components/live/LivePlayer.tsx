import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DeviceWithRelations } from '@/types/devices';
import type { LiveCameraCapabilities } from '@/types/live';
import type { PoleRecord } from '@/types/assets';
import { useLiveStream } from '@/contexts/LiveStreamContext';
import { formatRelativeTime } from '@/lib/dateTime';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LivePlayerProps {
  camera: DeviceWithRelations;
  capabilities: LiveCameraCapabilities;
  installedPole: PoleRecord | null;
}

export const LivePlayer: React.FC<LivePlayerProps> = ({
  camera,
  capabilities,
  installedPole,
}) => {
  const navigate = useNavigate();
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // Vendor secondary label (e.g. KT-001)
  const vendorName = camera.vendorDeviceId && camera.vendorDeviceId !== camera.identifier ? camera.vendorDeviceId : null;

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

  return (
    <div
      ref={playerContainerRef}
      id="falcon-live-player"
      tabIndex={0}
      aria-label={`Live camera feed for ${camera.identifier}`}
      className="relative w-full aspect-video rounded-xl bg-zinc-950 border border-border shadow-md overflow-hidden select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {/* Top Corners Overlay: Never covers burned-in camera text (sits in top header band) */}
      <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 flex items-center justify-between px-4 pointer-events-none">
        {/* Top Left: Identifier & Secondary Vendor Name */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-white drop-shadow-md">
            {camera.identifier}
          </span>
          {vendorName && (
            <span className="text-xs text-zinc-300 font-mono drop-shadow-md bg-black/40 px-1.5 py-0.5 rounded border border-white/10">
              {vendorName}
            </span>
          )}
          {installedPole && (
            <span className="text-[11px] text-zinc-400 font-mono drop-shadow-xs hidden sm:inline">
              • Pole {installedPole.identifier}
            </span>
          )}
        </div>

        {/* Top Right: Live Badge + Elapsed time (strictly while Live) */}
        {currentEffectiveState === 'live' && (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-rose-500/90 text-white border-rose-600 text-xs px-2.5 py-0.5 gap-1.5 font-bold shadow-md animate-pulse"
            >
              <span className="size-2 rounded-full bg-white" />
              LIVE
            </Badge>
            <span className="font-mono text-xs font-semibold text-zinc-200 bg-black/60 px-2 py-0.5 rounded border border-white/10">
              {formatElapsed(streamStats.elapsedSeconds)}
            </span>
          </div>
        )}
      </div>

      {/* STATE 1: IDLE */}
      {currentEffectiveState === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-zinc-950">
          {/* Dimmed poster background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
            <img
              src="/monkey-fiber.jpg"
              alt="Idle poster frame"
              className="w-full h-full object-cover filter blur-[2px]"
            />
          </div>

          <div className="relative z-10 flex flex-col items-center max-w-md">
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
            <p className="text-xs text-zinc-300 mb-2">
              Live video is requested from the camera when you press Start.
            </p>

            {capabilities.isMobileData && (
              <div className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 mt-1">
                <Radio className="size-3 shrink-0" />
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
          {/* Video element rendering simulated Edge RTSP/HLS feed */}
          <video
            ref={videoRef}
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            autoPlay
            loop
            playsInline
            className="w-full h-full object-cover"
          />
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
                  <Button
                    size="sm"
                    disabled
                    title="Camera is currently offline"
                    className="h-8 text-xs opacity-50 cursor-not-allowed"
                  >
                    Retry
                  </Button>
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
                    className="h-8 text-xs bg-primary text-primary-foreground"
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
            ) : (
              <>
                <div className="size-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                  <AlertTriangle className="size-6" />
                </div>
                <h3 className="text-base font-bold text-white">Stream Error</h3>
                <p className="text-xs text-zinc-400">
                  {failureMessage || 'Could not initialize live video decoder.'}
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => retryStream(camera.identifier)}
                    className="h-8 text-xs bg-primary text-primary-foreground"
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
