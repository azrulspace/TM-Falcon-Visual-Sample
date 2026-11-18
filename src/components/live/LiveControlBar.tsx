import React, { useEffect, useState } from 'react';
import type { DeviceWithRelations } from '@/types/devices';
import type { LiveCameraCapabilities } from '@/types/live';
import { useLiveStream } from '@/contexts/LiveStreamContext';
import { computeUnifiedDeviceState } from '@/lib/liveCameras';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Play,
  Pause,
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
  Keyboard,
  Compass,
  Check,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LiveControlBarProps {
  camera: DeviceWithRelations;
  capabilities: LiveCameraCapabilities;
}

const PRESETS = [
  { id: 'p1', name: 'Preset 1: Feeder Pole Junction', angle: '0°, Tilt -10°' },
  { id: 'p2', name: 'Preset 2: Fibre Cable Span View', angle: '45°, Tilt -5°' },
  { id: 'p3', name: 'Preset 3: Ground Equipment Pad', angle: '180°, Tilt -40°' },
];

const SPEED_OPTIONS = [
  { label: 'Slow', value: '1x' },
  { label: 'Normal', value: '2x' },
  { label: 'Fast', value: '4x' },
] as const;

export const LiveControlBar: React.FC<LiveControlBarProps> = ({
  camera,
  capabilities,
}) => {
  const {
    activeStreamingDeviceId,
    streamState,
    streamStats,
    isPaused,
    isMuted,
    volume,
    setVolume,
    isPtzMoving,
    activePtzDirection,
    talkPrecondition,
    isTalkActive,
    isTalkToggleMode,
    startStream,
    stopStream,
    togglePlayPause,
    toggleMute,
    startPtz,
    stopPtz,
    startTalk,
    stopTalk,
    toggleTalk,
    requestMicPermission,
    takeSnapshot,
  } = useLiveStream();

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [ptzSpeed, setPtzSpeed] = useState<'1x' | '2x' | '4x'>('2x');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const isCurrentStreaming = activeStreamingDeviceId === camera.identifier;
  const isLive = isCurrentStreaming && streamState === 'live';

  const unifiedState = computeUnifiedDeviceState(camera.lastContactAt, camera.connectivityState);
  const isOffline = unifiedState.state === 'offline';

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space') {
        const player = document.getElementById('falcon-live-player');
        if (document.activeElement === player || player?.contains(document.activeElement)) {
          e.preventDefault();
          if (isLive) {
            togglePlayPause();
          } else if (!isOffline) {
            startStream(camera.identifier, camera.name);
          }
        }
      } else if (e.key === 'm' || e.key === 'M') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          toggleMute();
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          const video = document.querySelector<HTMLVideoElement>('#falcon-live-player video');
          takeSnapshot(camera.identifier, video);
        }
      } else if (e.key === 'f' || e.key === 'F') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          handleFullscreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLive, isOffline, camera.identifier, camera.name, startStream, stopStream, togglePlayPause, toggleMute, takeSnapshot]);

  // Apply preset
  const handleApplyPreset = (presetId: string) => {
    setActivePreset(presetId);
    startPtz('pan_right');
    setTimeout(() => {
      stopPtz();
    }, 600);
  };

  // State A: Idle (Progressive disclosure - 56px single clean row)
  if (!isLive) {
    return (
      <div className="h-14 px-4 bg-card flex items-center justify-between w-full select-none">
        {/* Left: Start button (secondary outline style, disabled if camera is offline) */}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className={isOffline ? 'inline-flex cursor-not-allowed' : 'inline-flex'}>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isOffline}
                      onClick={() => startStream(camera.identifier, camera.name)}
                      className="h-8 px-3 text-xs font-medium gap-1.5 border-border bg-card hover:bg-muted text-foreground cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                      aria-label="Start live stream"
                    >
                      <Play className="size-3.5 fill-current" />
                      <span>Start</span>
                    </Button>
                  </span>
                }
              />
              {isOffline && (
                <TooltipContent side="top" className="text-xs">
                  Camera is offline. Start is unavailable until connectivity is restored.
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Right: Operational status when offline, or prompt when online + Fullscreen */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-normal">
            {isOffline ? 'Camera offline · Controls unavailable' : 'Start the video to use camera controls'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFullscreen}
            className="size-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
            title="Enter fullscreen (F)"
            aria-label="Enter fullscreen"
          >
            <Maximize2 className="size-4 stroke-[1.5]" />
          </Button>
        </div>
      </div>
    );
  }

  // State B: Live (Active 56px control bar with progressive disclosure)
  return (
    <div className="h-14 px-4 bg-card flex items-center justify-between w-full select-none">
      {/* Left Group: Playback Controls (Play/Pause, Stop, Audio, Snapshot) */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={togglePlayPause}
          className="h-8 px-2.5 text-xs font-medium gap-1.5 cursor-pointer border-border bg-card hover:bg-muted text-foreground"
          aria-label={isPaused ? 'Resume live video' : 'Pause live video'}
          title={isPaused ? 'Resume (Space)' : 'Pause (Space)'}
        >
          {isPaused ? (
            <>
              <Play className="size-3 fill-current" />
              <span>Resume</span>
            </>
          ) : (
            <>
              <Pause className="size-3 fill-current" />
              <span>Pause</span>
            </>
          )}
        </Button>

        <Button
          size="sm"
          variant="destructive"
          onClick={() => stopStream('user_stopped')}
          className="h-8 px-3 text-xs font-medium gap-1.5 cursor-pointer"
          aria-label="Stop live stream"
        >
          <Square className="size-3 fill-current" />
          <span>Stop</span>
        </Button>

        {/* Audio Mute & Volume */}
        {capabilities.supportsAudio && (
          <div className="relative flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMute}
              onMouseEnter={() => setShowVolumeSlider(true)}
              className="size-8 p-0 border-border bg-card hover:bg-muted cursor-pointer"
              aria-label={isMuted ? 'Unmute stream audio' : 'Mute stream audio'}
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            >
              {isMuted ? <VolumeX className="size-3.5 text-muted-foreground" /> : <Volume2 className="size-3.5 text-foreground" />}
            </Button>

            {showVolumeSlider && (
              <div
                onMouseLeave={() => setShowVolumeSlider(false)}
                className="absolute left-10 z-30 p-2 bg-popover border border-border shadow-2xl rounded-lg flex items-center gap-2 w-28"
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  aria-label="Stream volume"
                />
              </div>
            )}
          </div>
        )}

        {/* Snapshot */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const video = document.querySelector<HTMLVideoElement>('#falcon-live-player video');
            takeSnapshot(camera.identifier, video);
          }}
          className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer border-border bg-card hover:bg-muted"
          aria-label="Take high resolution snapshot"
          title="Save snapshot image (S)"
        >
          <Camera className="size-3.5" />
          <span className="hidden sm:inline">Snapshot</span>
        </Button>
      </div>

      {/* Middle Group: "Move camera" Popover (PTZ, Zoom, Speed, Presets) and Stream Status */}
      <div className="flex items-center gap-2">
        {capabilities.supportsPtz && (
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs font-medium gap-1.5 border-border bg-card hover:bg-muted text-foreground cursor-pointer"
                  aria-label="Pan and tilt controls"
                >
                  <Compass className="size-3.5 text-primary" />
                  <span>Move camera</span>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </Button>
              }
            />
            <PopoverContent align="center" className="w-72 p-3 text-xs bg-popover text-popover-foreground border-border shadow-2xl rounded-xl">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                <span className="font-semibold text-xs text-foreground">Move camera</span>
                {/* Speed Selector: Slow | Normal | Fast */}
                <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-md border border-border">
                  {SPEED_OPTIONS.map((spd) => (
                    <button
                      key={spd.value}
                      type="button"
                      onClick={() => setPtzSpeed(spd.value)}
                      className={`text-xs px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        ptzSpeed === spd.value
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {spd.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3x3 PTZ Direction Pad */}
              <div className="flex flex-col items-center justify-center gap-1 py-1">
                <Button
                  variant="outline"
                  size="sm"
                  onPointerDown={() => startPtz('tilt_up')}
                  onPointerUp={stopPtz}
                  onPointerLeave={stopPtz}
                  onPointerCancel={stopPtz}
                  className={`size-9 p-0 cursor-pointer ${activePtzDirection === 'tilt_up' ? 'bg-primary text-primary-foreground' : ''}`}
                  title="Tilt up (ArrowUp)"
                  aria-label="Tilt camera up"
                >
                  <ChevronUp className="size-4" />
                </Button>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onPointerDown={() => startPtz('pan_left')}
                    onPointerUp={stopPtz}
                    onPointerLeave={stopPtz}
                    onPointerCancel={stopPtz}
                    className={`size-9 p-0 cursor-pointer ${activePtzDirection === 'pan_left' ? 'bg-primary text-primary-foreground' : ''}`}
                    title="Pan left (ArrowLeft)"
                    aria-label="Pan camera left"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <div className="size-9 rounded-md bg-muted/30 border border-border/40 flex items-center justify-center text-muted-foreground/60">
                    <Compass className="size-4" />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onPointerDown={() => startPtz('pan_right')}
                    onPointerUp={stopPtz}
                    onPointerLeave={stopPtz}
                    onPointerCancel={stopPtz}
                    className={`size-9 p-0 cursor-pointer ${activePtzDirection === 'pan_right' ? 'bg-primary text-primary-foreground' : ''}`}
                    title="Pan right (ArrowRight)"
                    aria-label="Pan camera right"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onPointerDown={() => startPtz('tilt_down')}
                  onPointerUp={stopPtz}
                  onPointerLeave={stopPtz}
                  onPointerCancel={stopPtz}
                  className={`size-9 p-0 cursor-pointer ${activePtzDirection === 'tilt_down' ? 'bg-primary text-primary-foreground' : ''}`}
                  title="Tilt down (ArrowDown)"
                  aria-label="Tilt camera down"
                >
                  <ChevronDown className="size-4" />
                </Button>
              </div>

              {/* Zoom Controls */}
              {capabilities.supportsZoom && (
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">Zoom</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onPointerDown={() => startPtz('zoom_in')}
                      onPointerUp={stopPtz}
                      onPointerLeave={stopPtz}
                      className="h-7 px-2 text-xs gap-1 cursor-pointer"
                      title="Zoom in"
                    >
                      <ZoomIn className="size-3.5" />
                      <span>In</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onPointerDown={() => startPtz('zoom_out')}
                      onPointerUp={stopPtz}
                      onPointerLeave={stopPtz}
                      className="h-7 px-2 text-xs gap-1 cursor-pointer"
                      title="Zoom out"
                    >
                      <ZoomOut className="size-3.5" />
                      <span>Out</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Presets List */}
              {capabilities.supportsPresets && (
                <div className="pt-2 mt-2 border-t border-border">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Presets
                  </div>
                  <div className="space-y-1">
                    {PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleApplyPreset(p.id)}
                        className={`w-full flex items-center justify-between p-1.5 rounded text-left transition-colors cursor-pointer ${
                          activePreset === p.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <span className="text-xs truncate">{p.name}</span>
                        {activePreset === p.id && <Check className="size-3 text-primary shrink-0 ml-1" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}

        {/* Stream status indicator pill */}
        <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 border border-border text-xs font-mono text-muted-foreground select-none">
          <span className={`size-1.5 rounded-full ${isPaused ? 'bg-status-warning' : 'bg-status-success animate-pulse'}`} />
          <span>
            {isPaused ? 'Paused · 1080p' : `${streamStats.resolution.replace('1920x', '') || '1080p'} · ${streamStats.fps} FPS · ${streamStats.bitrateMbps} Mbps`}
          </span>
        </div>
      </div>

      {/* Right Group: Tools & Telemetry (Talk, Stream Info, Shortcuts, PiP, Fullscreen) */}
      <div className="flex items-center gap-1.5">
        {capabilities.supportsTalk && (
          <Button
            variant={isTalkActive ? 'default' : 'outline'}
            size="sm"
            disabled={isPtzMoving}
            onPointerDown={() => !isTalkToggleMode && startTalk()}
            onPointerUp={() => !isTalkToggleMode && stopTalk()}
            onPointerLeave={() => !isTalkToggleMode && stopTalk()}
            onPointerCancel={() => !isTalkToggleMode && stopTalk()}
            onClick={() => {
              if (talkPrecondition === 'blocked_mic') {
                requestMicPermission();
              } else if (isTalkToggleMode) {
                toggleTalk();
              }
            }}
            className={`h-8 px-2.5 text-xs gap-1.5 select-none cursor-pointer ${
              isTalkActive
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                : isPtzMoving
                ? 'opacity-60 cursor-not-allowed'
                : talkPrecondition === 'blocked_mic'
                ? 'border-amber-500/50 text-amber-500'
                : 'border-border bg-card hover:bg-muted text-foreground'
            }`}
            title="Two-way audio intercom"
          >
            {isTalkActive ? <Mic className="size-3.5" /> : <MicOff className="size-3.5 text-muted-foreground" />}
            <span className="hidden md:inline">{isTalkActive ? 'Talking' : 'Talk'}</span>
          </Button>
        )}

        {/* Telemetry info */}
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="ghost" size="sm" className="size-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer" title="Stream telemetry">
                <Info className="size-4" />
              </Button>
            }
          />
          <PopoverContent align="end" className="w-64 p-3 text-xs bg-popover text-popover-foreground border-border shadow-2xl rounded-xl">
            <h4 className="font-semibold text-foreground mb-2 pb-1 border-b border-border">Stream Telemetry</h4>
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Status:</span><span className="font-bold text-foreground uppercase">{streamState}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Resolution:</span><span className="text-foreground">{streamStats.resolution}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Bitrate:</span><span className="text-foreground">{streamStats.bitrateMbps} Mbps</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Latency:</span><span className="text-foreground">{streamStats.latencyMs} ms</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Framerate:</span><span className="text-foreground">{streamStats.fps} fps</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Elapsed:</span><span className="text-foreground">{streamStats.elapsedSeconds}s</span></div>
              <div className="flex justify-between pt-1 border-t border-border/60"><span className="text-muted-foreground">Estimated data:</span><span className="font-bold text-status-warning">{streamStats.estimatedDataMb} MB</span></div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Shortcuts */}
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="ghost" size="sm" className="size-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer hidden sm:flex" title="Keyboard shortcuts">
                <Keyboard className="size-4" />
              </Button>
            }
          />
          <PopoverContent align="end" className="w-64 p-3 text-xs bg-popover text-popover-foreground border-border shadow-2xl rounded-xl">
            <h4 className="font-semibold text-foreground mb-2 pb-1 border-b border-border">Keyboard Shortcuts</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Start / Stop stream</span><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs border border-border">Space</kbd></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Mute / Unmute audio</span><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs border border-border">M</kbd></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Take snapshot</span><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs border border-border">S</kbd></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Toggle fullscreen</span><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs border border-border">F</kbd></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Previous camera</span><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs border border-border">[</kbd></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Next camera</span><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs border border-border">]</kbd></div>
            </div>
          </PopoverContent>
        </Popover>

        {/* PiP */}
        <Button variant="ghost" size="sm" onClick={handlePiP} className="size-8 p-0 text-muted-foreground hover:text-foreground hidden sm:flex cursor-pointer" title="Picture in Picture">
          <PictureInPicture className="size-4" />
        </Button>

        {/* Fullscreen */}
        <Button variant="ghost" size="sm" onClick={handleFullscreen} className="size-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer" title="Fullscreen (F)">
          <Maximize2 className="size-4" />
        </Button>
      </div>
    </div>
  );
};
