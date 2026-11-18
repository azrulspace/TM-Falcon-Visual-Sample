import React, { useEffect, useState } from 'react';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
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
  Keyboard,
  Compass,
  Bookmark,
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

export const LiveControlBar: React.FC<LiveControlBarProps> = ({
  camera,
  capabilities,
}) => {
  const {
    activeStreamingDeviceId,
    streamState,
    streamStats,
    isMuted,
    volume,
    setVolume,
    isPtzMoving,
    activePtzDirection,
    talkPrecondition,
    isTalkActive,
    isTalkToggleMode,
    setTalkToggleMode,
    startStream,
    stopStream,
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
  const [ptzSpeed, setPtzSpeed] = useState<'1x' | '2x' | '4x'>('1x');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space') {
        const player = document.getElementById('falcon-live-player');
        if (document.activeElement === player || player?.contains(document.activeElement)) {
          e.preventDefault();
          if (isLive) {
            stopStream('user_stopped');
          } else {
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
  }, [isLive, camera.identifier, camera.name, startStream, stopStream, toggleMute, takeSnapshot]);

  // Apply preset
  const handleApplyPreset = (presetId: string) => {
    setActivePreset(presetId);
    startPtz('pan_right');
    setTimeout(() => {
      stopPtz();
    }, 600);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl bg-card border border-border shadow-xs">
      {/* Group 1: Playback Controls (Start/Stop, Audio, Snapshot) */}
      <div className="flex items-center gap-2">
        {/* Secondary Start / Destructive Stop toggle button (Primary Play is inside the video) */}
        {isLive ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => stopStream('user_stopped')}
            className="h-9 px-3.5 text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
            aria-label="Stop live stream"
          >
            <Square className="size-3.5 fill-current" />
            <span>Stop</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => startStream(camera.identifier, camera.name)}
            className="h-9 px-3.5 text-xs font-semibold gap-1.5 border-border hover:bg-muted text-foreground cursor-pointer"
            aria-label="Start live stream"
          >
            <Play className="size-3.5 fill-current" />
            <span>Start</span>
          </Button>
        )}

        {/* Audio Mute & Volume */}
        {capabilities.supportsAudio && (
          <div className="relative flex items-center gap-1 pl-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className={!isLive ? 'inline-flex cursor-not-allowed' : 'inline-flex'}>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!isLive}
                        onClick={toggleMute}
                        onMouseEnter={() => {
                          if (isLive) setShowVolumeSlider(true);
                        }}
                        className="size-9 p-0 cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                        aria-label={isMuted ? 'Unmute stream audio' : 'Mute stream audio'}
                        aria-description={!isLive ? 'Start the video to use these controls' : undefined}
                        title={!isLive ? undefined : isMuted ? 'Unmute (M)' : 'Mute (M)'}
                      >
                        {isMuted ? <VolumeX className="size-4 text-muted-foreground" /> : <Volume2 className="size-4 text-foreground" />}
                      </Button>
                    </span>
                  }
                />
                {!isLive && (
                  <TooltipContent side="top" className="text-xs">
                    Start the video to use these controls
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            {/* Inline mini volume slider on hover */}
            {isLive && showVolumeSlider && (
              <div
                onMouseLeave={() => setShowVolumeSlider(false)}
                className="absolute left-10 z-30 p-2 bg-popover border border-border shadow-md rounded-lg flex items-center gap-2 w-28"
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

        {/* Snapshot button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <span className={!isLive ? 'inline-flex cursor-not-allowed' : 'inline-flex'}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!isLive}
                    onClick={() => {
                      const video = document.querySelector<HTMLVideoElement>('#falcon-live-player video');
                      takeSnapshot(camera.identifier, video);
                    }}
                    className="h-9 px-3 text-xs gap-1.5 cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                    aria-label="Take high resolution snapshot"
                    aria-description={!isLive ? 'Start the video to use these controls' : undefined}
                    title={!isLive ? undefined : 'Save snapshot image (S)'}
                  >
                    <Camera className="size-3.5" />
                    <span className="hidden sm:inline">Snapshot</span>
                  </Button>
                </span>
              }
            />
            {!isLive && (
              <TooltipContent side="top" className="text-xs">
                Start the video to use these controls
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* 1px divider between Group 1 (Playback) and Group 2 (Camera Movement) */}
      {capabilities.supportsPtz && (
        <div className="hidden sm:block h-6 w-px bg-border my-auto" />
      )}

      {/* Group 2: Camera Movement (PTZ, Zoom, Presets - only when supported) */}
      {capabilities.supportsPtz && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <div className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-muted/30 border border-border/50 ${!isLive ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <span className="text-[11px] font-semibold text-muted-foreground hidden lg:inline mr-1">
                    PTZ
                  </span>
                  <div
                    tabIndex={isLive ? 0 : -1}
                    role="group"
                    aria-label="Pan and tilt controls"
                    aria-description={!isLive ? 'Start the video to use these controls' : undefined}
                    onKeyDown={(e) => {
                      if (!isLive) return;
                      if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        startPtz('pan_left');
                      } else if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        startPtz('pan_right');
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        startPtz('tilt_up');
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        startPtz('tilt_down');
                      }
                    }}
                    onKeyUp={isLive ? stopPtz : undefined}
                    className="flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded p-0.5"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!isLive}
                      onPointerDown={() => isLive && startPtz('pan_left')}
                      onPointerUp={stopPtz}
                      onPointerLeave={stopPtz}
                      onPointerCancel={stopPtz}
                      className={`size-8 p-0 cursor-pointer disabled:pointer-events-none ${activePtzDirection === 'pan_left' ? 'bg-primary text-primary-foreground' : ''}`}
                      title={!isLive ? undefined : 'Pan left (ArrowLeft)'}
                      aria-label="Pan camera left"
                      aria-description={!isLive ? 'Start the video to use these controls' : undefined}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!isLive}
                        onPointerDown={() => isLive && startPtz('tilt_up')}
                        onPointerUp={stopPtz}
                        onPointerLeave={stopPtz}
                        onPointerCancel={stopPtz}
                        className={`size-8 p-0 cursor-pointer disabled:pointer-events-none ${activePtzDirection === 'tilt_up' ? 'bg-primary text-primary-foreground' : ''}`}
                        title={!isLive ? undefined : 'Tilt up (ArrowUp)'}
                        aria-label="Tilt camera up"
                        aria-description={!isLive ? 'Start the video to use these controls' : undefined}
                      >
                        <ChevronUp className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!isLive}
                        onPointerDown={() => isLive && startPtz('tilt_down')}
                        onPointerUp={stopPtz}
                        onPointerLeave={stopPtz}
                        onPointerCancel={stopPtz}
                        className={`size-8 p-0 cursor-pointer disabled:pointer-events-none ${activePtzDirection === 'tilt_down' ? 'bg-primary text-primary-foreground' : ''}`}
                        title={!isLive ? undefined : 'Tilt down (ArrowDown)'}
                        aria-label="Tilt camera down"
                        aria-description={!isLive ? 'Start the video to use these controls' : undefined}
                      >
                        <ChevronDown className="size-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!isLive}
                      onPointerDown={() => isLive && startPtz('pan_right')}
                      onPointerUp={stopPtz}
                      onPointerLeave={stopPtz}
                      onPointerCancel={stopPtz}
                      className={`size-8 p-0 cursor-pointer disabled:pointer-events-none ${activePtzDirection === 'pan_right' ? 'bg-primary text-primary-foreground' : ''}`}
                      title={!isLive ? undefined : 'Pan right (ArrowRight)'}
                      aria-label="Pan camera right"
                      aria-description={!isLive ? 'Start the video to use these controls' : undefined}
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
                        disabled={!isLive}
                        onPointerDown={() => isLive && startPtz('zoom_in')}
                        onPointerUp={stopPtz}
                        onPointerLeave={stopPtz}
                        onPointerCancel={stopPtz}
                        className="size-8 p-0 cursor-pointer disabled:pointer-events-none"
                        title={!isLive ? undefined : 'Zoom in'}
                        aria-label="Zoom in"
                        aria-description={!isLive ? 'Start the video to use these controls' : undefined}
                      >
                        <ZoomIn className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!isLive}
                        onPointerDown={() => isLive && startPtz('zoom_out')}
                        onPointerUp={stopPtz}
                        onPointerLeave={stopPtz}
                        onPointerCancel={stopPtz}
                        className="size-8 p-0 cursor-pointer disabled:pointer-events-none"
                        title={!isLive ? undefined : 'Zoom out'}
                        aria-label="Zoom out"
                        aria-description={!isLive ? 'Start the video to use these controls' : undefined}
                      >
                        <ZoomOut className="size-4" />
                      </Button>
                    </div>
                  )}

                  {/* Speed Selector */}
                  <div className="flex items-center gap-0.5 border-l border-border pl-2 ml-1">
                    {(['1x', '2x', '4x'] as const).map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        disabled={!isLive}
                        onClick={() => setPtzSpeed(spd)}
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors disabled:pointer-events-none ${
                          ptzSpeed === spd
                            ? 'bg-primary text-primary-foreground font-bold'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {spd}
                      </button>
                    ))}
                  </div>

                  {/* Presets Popover */}
                  {capabilities.supportsPresets && (
                    <Popover>
                      <PopoverTrigger
                        render={
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!isLive}
                            className="h-8 px-2 text-xs gap-1 ml-1 cursor-pointer disabled:pointer-events-none"
                            aria-label="Camera position presets"
                            aria-description={!isLive ? 'Start the video to use these controls' : undefined}
                            title={!isLive ? undefined : 'Camera presets'}
                          >
                            <Bookmark className="size-3" />
                            <span className="hidden xl:inline text-[11px]">Presets</span>
                          </Button>
                        }
                      />
                      <PopoverContent align="center" className="w-64 p-2 text-xs bg-popover text-popover-foreground border-border shadow-md">
                        <div className="font-semibold text-foreground px-2 py-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                          Saved PTZ Positions
                        </div>
                        <div className="space-y-1 pt-1">
                          {PRESETS.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleApplyPreset(p.id)}
                              className={`w-full flex items-center justify-between p-2 rounded text-left transition-colors cursor-pointer ${
                                activePreset === p.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="text-xs">{p.name}</span>
                                <span className="text-[10px] text-muted-foreground font-mono">{p.angle}</span>
                              </div>
                              {activePreset === p.id && <Check className="size-3 text-primary shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              }
            />
            {!isLive && (
              <TooltipContent side="top" className="text-xs">
                Start the video to use these controls
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Mobile/Tablet Portrait: "Move camera" button opening bottom Sheet */}
      {capabilities.supportsPtz && (
        <div className="sm:hidden">
          <Sheet open={mobileSheetOpen && isLive} onOpenChange={(open) => isLive && setMobileSheetOpen(open)}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className={!isLive ? 'inline-flex cursor-not-allowed' : 'inline-flex'}>
                      <SheetTrigger
                        render={
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!isLive}
                            className="h-9 px-3 text-xs gap-1.5 cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                            aria-description={!isLive ? 'Start the video to use these controls' : undefined}
                          >
                            <Compass className="size-4" />
                            <span>Move camera</span>
                          </Button>
                        }
                      />
                    </span>
                  }
                />
                {!isLive && (
                  <TooltipContent side="top" className="text-xs">
                    Start the video to use these controls
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <SheetContent side="bottom" className="p-4 bg-card border-t border-border rounded-t-2xl">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-sm font-bold flex items-center gap-2">
                  <Compass className="size-4 text-primary" />
                  Pan, Tilt & Zoom Controls
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col items-center gap-4 py-2">
                {/* 56px large touch targets for mobile */}
                <div className="flex flex-col items-center gap-2">
                  <Button
                    size="lg"
                    variant="outline"
                    onPointerDown={() => startPtz('tilt_up')}
                    onPointerUp={stopPtz}
                    onPointerLeave={stopPtz}
                    onPointerCancel={stopPtz}
                    className="size-14 rounded-full p-0 active:bg-primary active:text-primary-foreground"
                    aria-label="Tilt up"
                  >
                    <ChevronUp className="size-6" />
                  </Button>
                  <div className="flex items-center gap-6">
                    <Button
                      size="lg"
                      variant="outline"
                      onPointerDown={() => startPtz('pan_left')}
                      onPointerUp={stopPtz}
                      onPointerLeave={stopPtz}
                      onPointerCancel={stopPtz}
                      className="size-14 rounded-full p-0 active:bg-primary active:text-primary-foreground"
                      aria-label="Pan left"
                    >
                      <ChevronLeft className="size-6" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onPointerDown={() => startPtz('pan_right')}
                      onPointerUp={stopPtz}
                      onPointerLeave={stopPtz}
                      onPointerCancel={stopPtz}
                      className="size-14 rounded-full p-0 active:bg-primary active:text-primary-foreground"
                      aria-label="Pan right"
                    >
                      <ChevronRight className="size-6" />
                    </Button>
                  </div>
                  <Button
                    size="lg"
                    variant="outline"
                    onPointerDown={() => startPtz('tilt_down')}
                    onPointerUp={stopPtz}
                    onPointerLeave={stopPtz}
                    onPointerCancel={stopPtz}
                    className="size-14 rounded-full p-0 active:bg-primary active:text-primary-foreground"
                    aria-label="Tilt down"
                  >
                    <ChevronDown className="size-6" />
                  </Button>
                </div>

                {/* Mobile Zoom In/Out */}
                {capabilities.supportsZoom && (
                  <div className="flex items-center gap-4 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onPointerDown={() => startPtz('zoom_in')}
                      onPointerUp={stopPtz}
                      className="h-10 px-4 text-xs gap-1.5"
                    >
                      <ZoomIn className="size-4" />
                      Zoom In
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onPointerDown={() => startPtz('zoom_out')}
                      onPointerUp={stopPtz}
                      className="h-10 px-4 text-xs gap-1.5"
                    >
                      <ZoomOut className="size-4" />
                      Zoom Out
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* 1px divider between Group 2 and Group 3 (Tools & Telemetry) */}
      <div className="hidden sm:block h-6 w-px bg-border my-auto" />

      {/* Group 3: Tools & Telemetry (Talk, Stream Info, Shortcuts, PiP, Fullscreen) */}
      <div className="flex items-center gap-2">
        {/* Talk Intercom Button with Precondition handling */}
        {capabilities.supportsTalk && (
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className={!isLive ? 'inline-flex cursor-not-allowed' : 'inline-flex'}>
                      <Button
                        variant={isTalkActive ? 'default' : 'outline'}
                        size="sm"
                        disabled={!isLive || isPtzMoving}
                        onPointerDown={() => {
                          if (isLive && !isTalkToggleMode) startTalk();
                        }}
                        onPointerUp={() => {
                          if (isLive && !isTalkToggleMode) stopTalk();
                        }}
                        onPointerLeave={() => {
                          if (isLive && !isTalkToggleMode) stopTalk();
                        }}
                        onPointerCancel={() => {
                          if (isLive && !isTalkToggleMode) stopTalk();
                        }}
                        onClick={() => {
                          if (!isLive) return;
                          if (talkPrecondition === 'blocked_mic') {
                            requestMicPermission();
                          } else if (isTalkToggleMode) {
                            toggleTalk();
                          }
                        }}
                        className={`h-9 px-3 text-xs gap-1.5 transition-all select-none cursor-pointer disabled:pointer-events-none disabled:opacity-50 ${
                          isTalkActive
                            ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                            : isPtzMoving
                            ? 'opacity-60 cursor-not-allowed'
                            : talkPrecondition === 'blocked_mic'
                            ? 'border-amber-500/50 text-amber-500'
                            : ''
                        }`}
                        aria-label="Two-way audio intercom"
                        aria-description={!isLive ? 'Start the video to use these controls' : undefined}
                      >
                        {isPtzMoving ? (
                          <MicOff className="size-4 text-amber-500" />
                        ) : isTalkActive ? (
                          <Mic className="size-4 text-white" />
                        ) : talkPrecondition === 'blocked_mic' ? (
                          <MicOff className="size-4 text-amber-500" />
                        ) : (
                          <Mic className="size-4 text-muted-foreground" />
                        )}
                        <span className="hidden md:inline">
                          {isTalkActive
                            ? 'Talking'
                            : talkPrecondition === 'blocked_mic'
                            ? 'Grant mic'
                            : isTalkToggleMode
                            ? 'Talk (Toggle)'
                            : 'Talk'}
                        </span>
                      </Button>
                    </span>
                  }
                />
                <TooltipContent side="top" className="text-xs max-w-xs">
                  {!isLive
                    ? 'Start the video to use these controls'
                    : isPtzMoving
                    ? 'The camera mutes the microphone while it moves.'
                    : talkPrecondition === 'blocked_https'
                    ? 'Needs a secure connection (HTTPS) to access microphone.'
                    : talkPrecondition === 'blocked_mic'
                    ? 'Needs microphone access. Click to grant.'
                    : isTalkToggleMode
                    ? 'Click to toggle speech on/off'
                    : 'Hold button to speak (or switch to toggle mode)'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Toggle mode selector for accessibility */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      disabled={!isLive}
                      onClick={() => isLive && setTalkToggleMode(!isTalkToggleMode)}
                      className={`size-7 rounded flex items-center justify-center text-[10px] font-mono cursor-pointer border disabled:pointer-events-none disabled:opacity-50 ${
                        isTalkToggleMode
                          ? 'bg-primary/20 text-primary border-primary/40'
                          : 'text-muted-foreground/60 border-transparent hover:bg-muted'
                      }`}
                      title={!isLive ? undefined : isTalkToggleMode ? 'Switch to hold-to-talk mode' : 'Switch to toggle-mode talk for accessibility'}
                    >
                      {isTalkToggleMode ? 'TOG' : 'HOLD'}
                    </button>
                  }
                />
                <TooltipContent side="top" className="text-xs">
                  {!isLive
                    ? 'Start the video to use these controls'
                    : isTalkToggleMode
                    ? 'Mode: Click to start/stop speech'
                    : 'Mode: Hold button to talk'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Stream Info Popover */}
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="size-9 p-0 cursor-pointer"
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
              <div className="pt-2 mt-2 border-t border-border/60 text-[10px] text-muted-foreground/80 leading-normal font-sans">
                Note: Server viewing session audit API is pending backend implementation. Local session duration logged to browser storage.
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Keyboard Shortcuts Help Popover */}
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="size-9 p-0 cursor-pointer hidden sm:flex"
                aria-label="Keyboard shortcuts"
                title="Keyboard shortcuts"
              >
                <Keyboard className="size-4" />
              </Button>
            }
          />
          <PopoverContent align="end" className="w-64 p-3 text-xs bg-popover text-popover-foreground border-border shadow-md">
            <h4 className="font-semibold text-foreground mb-2 pb-1 border-b border-border">
              Keyboard Shortcuts
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Start / Stop stream</span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[11px] border border-border">Space</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Mute / Unmute audio</span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[11px] border border-border">M</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Take snapshot</span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[11px] border border-border">S</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Toggle fullscreen</span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[11px] border border-border">F</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Previous camera</span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[11px] border border-border">[</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Next camera</span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[11px] border border-border">]</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pan & tilt motor</span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[11px] border border-border">Arrows</kbd>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Fullscreen Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleFullscreen}
          className="size-9 p-0 cursor-pointer"
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
          className="size-9 p-0 hidden sm:flex cursor-pointer"
          aria-label="Toggle picture in picture"
          title="Picture in Picture"
        >
          <PictureInPicture className="size-4" />
        </Button>
      </div>
    </div>
  );
};
