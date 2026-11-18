import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DeviceWithRelations } from '@/types/devices';
import { computeUnifiedDeviceState, getCameraCapabilities } from '@/lib/liveCameras';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Square,
  Volume2,
  VolumeX,
  Camera as CameraIcon,
  Maximize,
  ChevronRight,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface MonitorTileProps {
  camera: DeviceWithRelations;
  isStreaming: boolean;
  hasAudio: boolean;
  isSpotlight: boolean;
  onToggleStream: (cameraId: string) => void;
  onToggleAudio: (cameraId: string) => void;
  onToggleSpotlight: (cameraId: string) => void;
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
}) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [streamDuration, setStreamDuration] = useState(0);
  const [connecting, setConnecting] = useState(false);

  const capabilities = getCameraCapabilities(camera);
  const unifiedState = computeUnifiedDeviceState(camera.lastContactAt, camera.connectivityState);

  // Simulated vendor error for DEV-002 (as tested in audit)
  const isVendorUnknown = camera.identifier === 'DEV-002';
  const isOffline = unifiedState.state === 'offline';

  // Handle stream start with connection delay simulation
  useEffect(() => {
    let timer: any;
    if (isStreaming) {
      setConnecting(true);
      timer = setTimeout(() => {
        setConnecting(false);
      }, 700);
    } else {
      setConnecting(false);
      setStreamDuration(0);
    }
    return () => clearTimeout(timer);
  }, [isStreaming]);

  // Duration counter while live
  useEffect(() => {
    let interval: any;
    if (isStreaming && !connecting) {
      interval = setInterval(() => {
        setStreamDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStreaming, connecting]);

  // Sync audio
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = !hasAudio;
    }
  }, [hasAudio]);

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleTakeSnapshot = () => {
    if (!isStreaming) return;
    addToast('success', `Saved high-resolution snapshot for ${camera.identifier}.`, 'Snapshot Saved');
  };

  const handleOpenSingle = () => {
    navigate(`/live/single/${encodeURIComponent(camera.identifier)}?from=monitor`);
  };

  return (
    <div
      className={`group/tile relative aspect-video w-full rounded-xl bg-card border overflow-hidden select-none transition-all flex flex-col justify-between ${
        isSpotlight
          ? 'ring-2 ring-primary border-primary'
          : isStreaming
          ? 'border-border'
          : 'border-border hover:border-border/80'
      }`}
    >
      {/* 1. Top Header Bar inside Tile */}
      <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 flex items-center justify-between px-3 pointer-events-auto">
        <div className="flex items-center gap-2 truncate">
          <button
            type="button"
            onClick={handleOpenSingle}
            className="font-mono text-xs font-bold text-white hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
            title="Open camera in single investigation mode"
          >
            <span>{camera.identifier}</span>
            <ChevronRight className="size-3 opacity-60 group-hover/tile:opacity-100" />
          </button>
          <span className="text-xs text-zinc-300 truncate hidden sm:inline">
            {camera.installedPoleId ? `Pole ${camera.installedPoleId}` : 'Unmounted'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isStreaming && !connecting ? (
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="bg-rose-500/90 text-white border-rose-600 text-xs px-1.5 py-0 font-bold animate-pulse"
              >
                LIVE
              </Badge>
              <span className="font-mono text-xs text-zinc-300 bg-black/60 px-1.5 py-0.5 rounded border border-white/10">
                {formatElapsed(streamDuration)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5" title={unifiedState.reason}>
              <span
                className={`size-2 rounded-full ${
                  unifiedState.state === 'online'
                    ? 'bg-emerald-500'
                    : unifiedState.state === 'stale'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-xs text-zinc-300 capitalize font-medium hidden sm:inline">
                {unifiedState.state}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Video / Poster / Loading / Error Display Area */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center bg-black overflow-hidden">
        {isOffline ? (
          /* Offline state */
          <div className="p-4 text-center z-10 flex flex-col items-center">
            <AlertCircle className="size-8 text-rose-500/80 mb-2" />
            <div className="text-xs font-semibold text-white">Camera offline</div>
            <div className="text-xs text-zinc-400 max-w-[220px] mt-0.5">
              {unifiedState.reason}
            </div>
          </div>
        ) : isVendorUnknown && isStreaming ? (
          /* Vendor unknown error (DEV-002) */
          <div className="p-4 text-center z-10 flex flex-col items-center">
            <AlertCircle className="size-8 text-amber-500/90 mb-2" />
            <div className="text-xs font-semibold text-white">Camera unavailable</div>
            <div className="text-xs text-zinc-400 max-w-[220px] mt-0.5">
              The vendor does not recognize this camera device on Edge.
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleStream(camera.identifier)}
              className="h-7 px-3 text-xs mt-2 text-white border-zinc-700 hover:bg-zinc-800"
            >
              Close stream
            </Button>
          </div>
        ) : connecting ? (
          /* Connecting step */
          <div className="flex flex-col items-center justify-center gap-2 z-10 text-center">
            <Loader2 className="size-7 text-primary animate-spin" />
            <span className="text-xs text-zinc-300 font-mono">Connecting to Edge...</span>
          </div>
        ) : isStreaming ? (
          /* Live Stream */
          <video
            ref={videoRef}
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            autoPlay
            loop
            playsInline
            muted={!hasAudio}
            className="w-full h-full object-cover"
          />
        ) : (
          /* Idle Poster Frame */
          <div className="relative w-full h-full flex items-center justify-center">
            {camera.identifier === 'DEV-001' ? (
              <img
                src="/monkey-fiber.jpg"
                alt={`Idle frame for ${camera.identifier}`}
                className="w-full h-full object-cover opacity-50"
              />
            ) : (
              <div className="w-full h-full bg-muted/40 flex flex-col items-center justify-center text-muted-foreground relative">
                <CameraIcon className="size-8 text-muted-foreground/60 relative z-10" />
                <span className="text-xs font-mono text-muted-foreground mt-1 relative z-10">No snapshot</span>
              </div>
            )}

            {/* Centered Play Button */}
            <Button
              size="sm"
              onClick={() => onToggleStream(camera.identifier)}
              className="size-11 rounded-full bg-primary/90 hover:bg-primary text-primary-foreground flex items-center justify-center z-10 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              aria-label={`Start live stream for ${camera.identifier}`}
            >
              <Play className="size-5 ml-0.5 fill-current" />
            </Button>
          </div>
        )}
      </div>

      {/* 3. Bottom Toolbar */}
      <div className="h-10 bg-card/90 border-t border-border px-2 flex items-center justify-between text-xs z-20">
        <div className="flex items-center gap-1">
          {/* Start / Stop Toggle */}
          {isStreaming ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onToggleStream(camera.identifier)}
              className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
            >
              <Square className="size-3 fill-current" />
              <span>Stop</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={isOffline}
              onClick={() => onToggleStream(camera.identifier)}
              className="h-7 px-2.5 text-xs gap-1 border-border bg-card text-foreground hover:bg-muted cursor-pointer"
            >
              <Play className="size-3 fill-current" />
              <span>Start</span>
            </Button>
          )}

          {/* Audio Mute / Unmute */}
          {capabilities.supportsAudio && (
            <Button
              variant="ghost"
              size="sm"
              disabled={!isStreaming}
              onClick={() => onToggleAudio(camera.identifier)}
              className={`size-7 p-0 cursor-pointer ${
                hasAudio ? 'text-primary font-bold' : 'text-muted-foreground'
              }`}
              title={hasAudio ? 'Mute audio' : 'Unmute audio (only 1 camera can play audio at a time)'}
            >
              {hasAudio ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
            </Button>
          )}

          {/* Snapshot */}
          <Button
            variant="ghost"
            size="sm"
            disabled={!isStreaming}
            onClick={handleTakeSnapshot}
            className="size-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Capture snapshot"
          >
            <CameraIcon className="size-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {/* Spotlight Mode Toggle */}
          <Button
            variant={isSpotlight ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onToggleSpotlight(camera.identifier)}
            className={`h-7 px-2 text-xs gap-1 cursor-pointer ${
              isSpotlight ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
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
            className="size-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Open single investigation view"
          >
            <Maximize className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
