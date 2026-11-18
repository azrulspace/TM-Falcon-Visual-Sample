import React from 'react';
import type { DeviceWithRelations } from '@/types/devices';
import type { LiveCameraCapabilities } from '@/types/live';
import { useLiveStream } from '@/contexts/LiveStreamContext';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Play,
  Square,
  Volume2,
  VolumeX,
  Camera,
  Maximize2,
  PictureInPicture,
  Info,
  Mic,
  MicOff,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LiveControlBarProps {
  camera: DeviceWithRelations;
  capabilities: LiveCameraCapabilities;
}

export const LiveControlBar: React.FC<LiveControlBarProps> = ({
  camera,
  capabilities,
}) => {
  const {
    activeStreamingDeviceId,
    streamState,
    streamStats,
    isMuted,
    isPtzMoving,
    activePtzDirection,
    talkPrecondition,
    isTalkActive,
    isTalkToggleMode,
    startStream,
    stopStream,
    toggleMute,
    startPtz,
    stopPtz,
    startTalk,
    stopTalk,
    toggleTalk,
    takeSnapshot,
  } = useLiveStream();

  const isCurrentStreaming = activeStreamingDeviceId === camera.identifier;
  const isLive = isCurrentStreaming && streamState === 'live';

  // Fullscreen and PiP handlers
  const handleFullscreen = () => {
    const player = document.getElementById('falcon-live-player');
    if (!player) return;
    if (!document.fullscreenElement) {
      player.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handlePiP = async () => {
    const video = document.querySelector<HTMLVideoElement>('#falcon-live-player video');
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      // PiP not supported on this browser
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl bg-card border border-border shadow-xs">
      {/* Left Group: Start/Stop, Mute/Volume, Snapshot */}
      <div className="flex items-center gap-2">
        {/* Primary Start / Stop toggle button */}
        {isLive ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => stopStream('user_stopped')}
            className="h-9 px-4 text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
            aria-label="Stop live stream"
          >
            <Square className="size-3.5 fill-current" />
            <span>Stop</span>
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => startStream(camera.identifier, camera.name)}
            className="h-9 px-4 text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
            aria-label="Start live stream"
          >
            <Play className="size-3.5 fill-current" />
            <span>Start</span>
          </Button>
        )}

        {/* Audio Mute & Volume */}
        {capabilities.supportsAudio && (
          <div className="flex items-center gap-1 pl-1">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMute}
              className="size-9 p-0"
              aria-label={isMuted ? 'Unmute stream audio' : 'Mute stream audio'}
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            >
              {isMuted ? <VolumeX className="size-4 text-muted-foreground" /> : <Volume2 className="size-4 text-foreground" />}
            </Button>
          </div>
        )}

        {/* Snapshot button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const video = document.querySelector<HTMLVideoElement>('#falcon-live-player video');
            takeSnapshot(camera.identifier, video);
          }}
          className="h-9 px-3 text-xs gap-1.5"
          aria-label="Take high resolution snapshot"
          title="Save snapshot image (S)"
        >
          <Camera className="size-3.5" />
          <span className="hidden sm:inline">Snapshot</span>
        </Button>
      </div>

      {/* Center Group: PTZ motor pad & Zoom (only when camera capability permits) */}
      {capabilities.supportsPtz && (
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted/30 border border-border/50">
          <span className="text-[11px] font-semibold text-muted-foreground hidden lg:inline mr-1">
            PTZ
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onPointerDown={() => startPtz('pan_left')}
              onPointerUp={stopPtz}
              onPointerLeave={stopPtz}
              className={`size-8 p-0 ${activePtzDirection === 'pan_left' ? 'bg-primary text-primary-foreground' : ''}`}
              title="Pan left"
              aria-label="Pan camera left"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="flex flex-col gap-1">
              <Button
                variant="outline"
                size="sm"
                onPointerDown={() => startPtz('tilt_up')}
                onPointerUp={stopPtz}
                onPointerLeave={stopPtz}
                className={`size-8 p-0 ${activePtzDirection === 'tilt_up' ? 'bg-primary text-primary-foreground' : ''}`}
                title="Tilt up"
                aria-label="Tilt camera up"
              >
                <ChevronUp className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onPointerDown={() => startPtz('tilt_down')}
                onPointerUp={stopPtz}
                onPointerLeave={stopPtz}
                className={`size-8 p-0 ${activePtzDirection === 'tilt_down' ? 'bg-primary text-primary-foreground' : ''}`}
                title="Tilt down"
                aria-label="Tilt camera down"
              >
                <ChevronDown className="size-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onPointerDown={() => startPtz('pan_right')}
              onPointerUp={stopPtz}
              onPointerLeave={stopPtz}
              className={`size-8 p-0 ${activePtzDirection === 'pan_right' ? 'bg-primary text-primary-foreground' : ''}`}
              title="Pan right"
              aria-label="Pan camera right"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* Zoom In/Out */}
          {capabilities.supportsZoom && (
            <div className="flex items-center gap-1 border-l border-border pl-2 ml-1">
              <Button
                variant="outline"
                size="sm"
                onPointerDown={() => startPtz('zoom_in')}
                onPointerUp={stopPtz}
                onPointerLeave={stopPtz}
                className="size-8 p-0"
                title="Zoom in"
                aria-label="Zoom in"
              >
                <ZoomIn className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onPointerDown={() => startPtz('zoom_out')}
                onPointerUp={stopPtz}
                onPointerLeave={stopPtz}
                className="size-8 p-0"
                title="Zoom out"
                aria-label="Zoom out"
              >
                <ZoomOut className="size-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Right Group: Talk intercom, Stream Info, Fullscreen, PiP */}
      <div className="flex items-center gap-2">
        {/* Talk Intercom Button */}
        {capabilities.supportsTalk && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant={isTalkActive ? 'default' : 'outline'}
                    size="sm"
                    onPointerDown={() => {
                      if (!isTalkToggleMode) startTalk();
                    }}
                    onPointerUp={() => {
                      if (!isTalkToggleMode) stopTalk();
                    }}
                    onPointerLeave={() => {
                      if (!isTalkToggleMode) stopTalk();
                    }}
                    onClick={() => {
                      if (isTalkToggleMode) toggleTalk();
                    }}
                    className={`h-9 px-3 text-xs gap-1.5 transition-all select-none ${
                      isTalkActive
                        ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                        : isPtzMoving
                        ? 'opacity-60 cursor-not-allowed'
                        : ''
                    }`}
                    aria-label="Two-way audio intercom"
                  >
                    {isPtzMoving ? (
                      <MicOff className="size-4 text-amber-500" />
                    ) : isTalkActive ? (
                      <Mic className="size-4 text-white" />
                    ) : (
                      <Mic className="size-4 text-muted-foreground" />
                    )}
                    <span className="hidden md:inline">
                      {isTalkActive ? 'Talking' : 'Talk'}
                    </span>
                  </Button>
                }
              />
              <TooltipContent side="top" className="text-xs max-w-xs">
                {isPtzMoving
                  ? 'The camera mutes the microphone while it moves.'
                  : talkPrecondition === 'blocked_https'
                  ? 'Needs a secure connection (HTTPS) to access microphone.'
                  : talkPrecondition === 'blocked_mic'
                  ? 'Needs microphone access. Click to grant.'
                  : isTalkToggleMode
                  ? 'Click to toggle speech on/off'
                  : 'Hold button to speak'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Stream Info Popover */}
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="size-9 p-0"
                aria-label="Stream telemetry metrics"
                title="Stream telemetry"
              >
                <Info className="size-4" />
              </Button>
            }
          />
          <PopoverContent align="end" className="w-64 p-3 text-xs bg-popover text-popover-foreground border-border shadow-md">
            <h4 className="font-semibold text-foreground mb-2 pb-1 border-b border-border">
              Stream Telemetry
            </h4>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-bold text-foreground uppercase">{streamState}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resolution:</span>
                <span className="text-foreground">{streamStats.resolution}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bitrate:</span>
                <span className="text-foreground">{streamStats.bitrateMbps} Mbps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Latency:</span>
                <span className="text-foreground">{streamStats.latencyMs} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Framerate:</span>
                <span className="text-foreground">{streamStats.fps} fps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Elapsed:</span>
                <span className="text-foreground">{streamStats.elapsedSeconds}s</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border/60">
                <span className="text-muted-foreground">Estimated data:</span>
                <span className="font-bold text-amber-500">
                  {streamStats.estimatedDataMb} MB
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground/70 pt-0.5 text-right italic">
                * Estimated from bitrate and session duration
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Fullscreen Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleFullscreen}
          className="size-9 p-0"
          aria-label="Toggle fullscreen video"
          title="Fullscreen (F)"
        >
          <Maximize2 className="size-4" />
        </Button>

        {/* Picture-in-Picture Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePiP}
          className="size-9 p-0 hidden sm:flex"
          aria-label="Toggle picture in picture"
          title="Picture in Picture"
        >
          <PictureInPicture className="size-4" />
        </Button>
      </div>
    </div>
  );
};
