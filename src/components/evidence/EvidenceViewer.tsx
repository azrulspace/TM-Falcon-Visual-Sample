import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Film,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  AlertTriangle,
  Loader2,
  VideoOff,
  Clock,
  Sparkles,
  ZoomIn,
  ZoomOut,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { useClipLifecycle } from '@/hooks/useClipLifecycle';
import {
  getFailureDetails,
  formatClipDuration,
  type ClipStatus,
} from './clipStateMachine';

export interface EvidenceViewerProps {
  eventId: string;
  snapshots?: string[];
  initialClipStatus?: ClipStatus;
  initialVideoUrl?: string;
  durationSeconds?: number;
  deviceSupportsVideo?: boolean;
  deviceIsOnline?: boolean;
  hasPermission?: boolean;
  capturedTimeMYT?: string;
  windowStartTimeMYT?: string;
  windowEndTimeMYT?: string;
  channelName?: string;
  detectionRule?: string;
  className?: string;
  compact?: boolean;
  initialTab?: 'snapshot' | 'clip';
  initialMode?: 'snapshot' | 'clip';
  onOpenLightbox?: (frameIndex: number) => void;
  onWatchLive?: () => void;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
  eventId,
  snapshots = ['/monkey-fiber.jpg'],
  initialClipStatus = 'not_requested',
  initialVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  durationSeconds = 38,
  deviceSupportsVideo = true,
  deviceIsOnline = true,
  hasPermission = true,
  capturedTimeMYT = 'Oct 27, 2026, 10:31 PM MYT',
  windowStartTimeMYT = '10:30:41 PM',
  windowEndTimeMYT = '10:31:19 PM',
  channelName = 'CCTV-01',
  detectionRule = 'CCTV-01-Motion Detection',
  className = '',
  compact = false,
  initialTab = 'snapshot',
  initialMode,
  onOpenLightbox,
  onWatchLive,
}) => {
  const { previewClipStatus } = useAppContext();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'snapshot' | 'clip'>(initialMode || initialTab);
  const activeFrameIndex = 0;

  // Studio Zoom & Pan state (for full variant snapshot)
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Clip state machine & lifecycle hook
  const { clipState, requestClip, retryRequest, applyNewVersion } = useClipLifecycle({
    eventId,
    initialState: {
      status: initialClipStatus,
      videoUrl: initialVideoUrl,
      durationSeconds,
      windowStartTime: windowStartTimeMYT,
      windowEndTime: windowEndTimeMYT,
    },
    deviceIsOnline,
    deviceSupportsVideo,
    hasPermission,
    previewForcedStatus: previewClipStatus,
    onClipReadyToast: () => {
      addToast('success', `Clip is ready for ${eventId}`);
    },
  });

  // Video Player state (LAZY: src assigned ONLY on play)
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const snapshotUrl = snapshots[activeFrameIndex] || snapshots[0] || '/monkey-fiber.jpg';

  // Toggle video playback
  const handlePlayToggle = () => {
    const el = videoRef.current;
    if (!el) return;

    if (!hasPlayedOnce) {
      // Lazy load video stream on first play!
      setHasPlayedOnce(true);
      el.src = clipState.videoUrl || initialVideoUrl;
      el.load();
    }

    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
    }
  };

  const handleVolumeToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSpeedChange = () => {
    const speeds = [1, 1.25, 1.5, 2, 0.5];
    const nextSpeed = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
    setPlaybackRate(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  // Keyboard accessibility for video player
  useEffect(() => {
    if (activeTab !== 'clip' || clipState.status !== 'ready') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if no input/dialog focused
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayToggle();
      } else if (e.code === 'ArrowRight' && videoRef.current) {
        e.preventDefault();
        videoRef.current.currentTime = Math.min(
          videoRef.current.duration || 38,
          videoRef.current.currentTime + 5
        );
      } else if (e.code === 'ArrowLeft' && videoRef.current) {
        e.preventDefault();
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleVolumeToggle();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, clipState.status, isPlaying, hasPlayedOnce]);

  // Download evidence
  const handleDownloadSnapshot = () => {
    const link = document.createElement('a');
    link.href = snapshotUrl;
    link.download = `${eventId}_snapshot.jpg`;
    link.click();
    addToast('info', 'Downloading snapshot image');
  };

  const handleDownloadClip = () => {
    if (!clipState.videoUrl) return;
    const link = document.createElement('a');
    link.href = clipState.videoUrl;
    link.download = `${eventId}_clip.mp4`;
    link.click();
    addToast('info', 'Downloading video clip');
  };

  // Status Badge / Icon for Clip Tab
  const renderClipTabIcon = () => {
    switch (clipState.status) {
      case 'uploading':
        return <Loader2 className="size-3 animate-spin text-primary" />;
      case 'requested':
        return <Clock className="size-3 text-sky-400" />;
      case 'ready':
        return <Play className="size-3 fill-emerald-400 text-emerald-400" />;
      case 'failed':
        return <AlertTriangle className="size-3 text-amber-500" />;
      case 'device_offline':
        return <VideoOff className="size-3 text-slate-400" />;
      default:
        return <Film className="size-3 text-muted-foreground" />;
    }
  };

  // =========================================================================
  // 1. COMPACT VARIANT (FOR OVERVIEW MAP POPUP)
  // =========================================================================
  if (compact) {
    return (
      <div className={`space-y-2 select-none ${className}`} data-testid="evidence-viewer-compact">
        {/* 16:9 Frame with fixed stable height */}
        <div className="relative aspect-video w-full rounded-lg bg-black overflow-hidden border border-border shadow-sm flex items-center justify-center">
          {/* SNAPSHOT VIEW */}
          {activeTab === 'snapshot' && (
            <div className="relative w-full h-full flex items-center justify-center group">
              <img
                src={snapshotUrl}
                alt={`Event ${eventId} snapshot`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => onOpenLightbox && onOpenLightbox(activeFrameIndex)}
              />
            </div>
          )}

          {/* CLIP VIEW */}
          {activeTab === 'clip' && (
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 p-4 text-center">
              {/* NOT REQUESTED */}
              {clipState.status === 'not_requested' && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  {/* Dimmed poster */}
                  <img
                    src={snapshotUrl}
                    alt="Poster preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-xs"
                  />
                  <div className="relative z-10 flex flex-col items-center gap-2 max-w-[240px]">
                    <p className="text-[11px] text-slate-300 leading-snug">
                      The clip is not loaded yet. It is requested from the camera only when needed.
                    </p>
                    <Button
                      size="sm"
                      onClick={requestClip}
                      disabled={!deviceIsOnline || !hasPermission}
                      className="h-7 px-3 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm cursor-pointer"
                    >
                      Request clip
                    </Button>
                  </div>
                </div>
              )}

              {/* REQUESTED */}
              {clipState.status === 'requested' && (
                <div className="flex flex-col items-center gap-2 text-slate-300">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <p className="text-xs font-semibold text-foreground">
                    Request sent. Waiting for the camera.
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Requested by {clipState.requestedBy || 'Operator'}
                  </p>
                </div>
              )}

              {/* UPLOADING */}
              {clipState.status === 'uploading' && (
                <div className="w-full max-w-[260px] flex flex-col items-center gap-2.5 text-slate-300">
                  <Loader2 className="size-5 animate-spin text-primary" />
                  <p className="text-xs font-medium text-foreground">
                    Evidence is still being uploaded.
                  </p>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300 rounded-full"
                      style={{ width: `${clipState.progress || 25}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {clipState.progress ? `${clipState.progress}%` : 'Uploading footage...'}
                  </span>
                  {clipState.takingLongerThanExpected && (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
                      <span>Taking longer than expected</span>
                      <button
                        type="button"
                        onClick={retryRequest}
                        className="underline font-semibold hover:text-amber-300 cursor-pointer"
                      >
                        Check again
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* READY (COMPACT PLAYER) */}
              {clipState.status === 'ready' && (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  <video
                    ref={videoRef}
                    poster={snapshotUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full h-full object-contain"
                    playsInline
                  />
                  {/* Play overlay if not started or paused */}
                  {!isPlaying && (
                    <button
                      type="button"
                      onClick={handlePlayToggle}
                      className="absolute size-10 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 shadow-md backdrop-blur-xs active:scale-95 transition-all cursor-pointer z-10"
                      aria-label="Play video"
                    >
                      <Play className="size-5 fill-white text-white ml-0.5" />
                    </button>
                  )}
                  {/* Bottom bar overlay */}
                  <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-white/90 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                    <span>{formatClipDuration(currentTime)} / {formatClipDuration(clipState.durationSeconds)}</span>
                    <button
                      type="button"
                      onClick={handleFullscreen}
                      className="hover:text-white cursor-pointer"
                    >
                      <Maximize2 className="size-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* FAILED */}
              {clipState.status === 'failed' && (
                <div className="flex flex-col items-center gap-1.5 max-w-[240px]">
                  <AlertTriangle className="size-5 text-amber-500" />
                  <p className="text-xs font-semibold text-foreground">
                    {getFailureDetails(clipState.failureReason).title}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {getFailureDetails(clipState.failureReason).explanation}
                  </p>
                  {getFailureDetails(clipState.failureReason).canRetry && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={retryRequest}
                      className="h-6 px-2.5 text-[11px] mt-1 cursor-pointer"
                    >
                      {getFailureDetails(clipState.failureReason).retryLabel}
                    </Button>
                  )}
                </div>
              )}

              {/* EXPIRED */}
              {clipState.status === 'expired' && (
                <div className="flex flex-col items-center gap-1.5 max-w-[240px]">
                  <Clock className="size-5 text-slate-400" />
                  <p className="text-xs font-semibold text-foreground">
                    This clip is no longer available.
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    The snapshot remains available.
                  </p>
                  {clipState.requestable && (
                    <Button
                      size="sm"
                      onClick={requestClip}
                      className="h-6 px-2.5 text-[11px] mt-1 cursor-pointer"
                    >
                      Request again
                    </Button>
                  )}
                </div>
              )}

              {/* OFFLINE */}
              {clipState.status === 'device_offline' && (
                <div className="flex flex-col items-center gap-1.5 max-w-[240px]">
                  <VideoOff className="size-5 text-slate-400" />
                  <p className="text-xs font-semibold text-foreground">Camera is offline</p>
                  <p className="text-[11px] text-muted-foreground">
                    Clips cannot be requested until the camera reconnects.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Two-Segment Control: Snapshot vs Clip */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-1 p-0.5 rounded-md bg-muted/60 border border-border text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('snapshot')}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                activeTab === 'snapshot'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Camera className="size-3" />
              <span>Snapshot</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('clip')}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                activeTab === 'clip'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {renderClipTabIcon()}
              <span>Clip</span>
              {clipState.status === 'ready' && (
                <span className="text-[10px] font-mono text-emerald-400">
                  {formatClipDuration(clipState.durationSeconds)}
                </span>
              )}
            </button>
          </div>

          {/* Optional Watch Live icon button in compact */}
          {onWatchLive && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={onWatchLive}
                    disabled={!deviceIsOnline}
                    className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-40 cursor-pointer"
                    aria-label="Watch live camera"
                  >
                    <ExternalLink className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent side="top" className="text-xs">
                {deviceIsOnline ? 'Watch live stream' : 'The device is offline'}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. FULL VARIANT (FOR EVENT DETAIL & CASE DETAIL PAGES)
  // =========================================================================
  return (
    <div
      className={`flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden select-none ${className}`}
      data-testid="evidence-viewer-full"
    >
      {/* 1. Header with Channel, Rule Chips and Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2.5">
          <Camera className="size-4 text-primary shrink-0" />
          <h2 className="text-sm font-bold text-foreground">Evidence</h2>
          <span className="px-2 py-0.5 rounded bg-muted text-[11px] font-mono text-muted-foreground border border-border">
            {channelName}
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-muted text-[11px] font-mono text-muted-foreground border border-border truncate max-w-[200px]">
            {detectionRule}
          </span>
          {previewClipStatus && (
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
              <Sparkles className="size-2.5" />
              Preview data ({previewClipStatus})
            </span>
          )}
        </div>

        {/* Toolbar: Zoom In, Zoom Out, Fit, Download, Lightbox */}
        <div className="flex items-center gap-1">
          {activeTab === 'snapshot' && (
            <>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Zoom out"
                aria-label="Zoom out"
              >
                <ZoomOut className="size-3.5" />
              </button>
              <span className="text-[11px] font-mono text-muted-foreground px-1 select-none">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Zoom in"
                aria-label="Zoom in"
              >
                <ZoomIn className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoomLevel(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="px-2 py-1 rounded hover:bg-muted text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Fit
              </button>
              <div className="h-4 w-px bg-border mx-1" />
              <button
                type="button"
                onClick={handleDownloadSnapshot}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Download snapshot"
                aria-label="Download snapshot"
              >
                <Download className="size-3.5" />
              </button>
            </>
          )}

          {activeTab === 'clip' && clipState.status === 'ready' && (
            <>
              <button
                type="button"
                onClick={handleDownloadClip}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Download video clip"
                aria-label="Download video clip"
              >
                <Download className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={handleFullscreen}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Fullscreen"
                aria-label="Fullscreen"
              >
                <Maximize2 className="size-3.5" />
              </button>
            </>
          )}

          {onOpenLightbox && (
            <button
              type="button"
              onClick={() => onOpenLightbox(activeFrameIndex)}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Open lightbox"
              aria-label="Open lightbox"
            >
              <Maximize2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Stage */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* ================= SNAPSHOT TAB ================= */}
        {activeTab === 'snapshot' && (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <img
              src={snapshotUrl}
              alt={`Event ${eventId} evidence snapshot`}
              className="w-full h-full object-contain cursor-zoom-in transition-transform duration-100"
              style={{
                transform: `scale(${zoomLevel}) translate(${pan.x}px, ${pan.y}px)`,
              }}
              onClick={() => onOpenLightbox && onOpenLightbox(activeFrameIndex)}
            />
          </div>
        )}

        {/* ================= CLIP TAB ================= */}
        {activeTab === 'clip' && (
          <div className="relative w-full h-full flex items-center justify-center bg-slate-950 p-6 text-center">
            {/* NOT REQUESTED */}
            {clipState.status === 'not_requested' && (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                {/* Dimmed poster */}
                <img
                  src={snapshotUrl}
                  alt="Poster preview"
                  className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-xs"
                />
                <div className="relative z-10 flex flex-col items-center gap-3 max-w-sm">
                  <Film className="size-8 text-primary/80" />
                  <p className="text-xs sm:text-sm text-slate-200">
                    The clip is not loaded yet. It is requested from the camera only when needed.
                  </p>
                  {clipState.windowStartTime && clipState.windowEndTime && (
                    <p className="text-[11px] font-mono text-muted-foreground">
                      Window: {clipState.windowStartTime} – {clipState.windowEndTime} MYT (~38s)
                    </p>
                  )}
                  <Button
                    onClick={requestClip}
                    disabled={!deviceIsOnline || !hasPermission}
                    className="h-9 px-5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md cursor-pointer mt-1"
                  >
                    Request clip
                  </Button>
                </div>
              </div>
            )}

            {/* REQUESTED */}
            {clipState.status === 'requested' && (
              <div className="flex flex-col items-center gap-3 text-slate-300">
                <Loader2 className="size-8 animate-spin text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Request sent. Waiting for the camera.
                </h3>
                <p className="text-xs text-muted-foreground">
                  Requested by {clipState.requestedBy || 'Operator'}
                </p>
              </div>
            )}

            {/* UPLOADING */}
            {clipState.status === 'uploading' && (
              <div className="w-full max-w-sm flex flex-col items-center gap-3 text-slate-300">
                <Loader2 className="size-7 animate-spin text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Evidence is still being uploaded.
                </h3>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300 rounded-full"
                    style={{ width: `${clipState.progress || 30}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  {clipState.progress ? `${clipState.progress}% uploaded` : 'Packaging stream...'}
                </span>
                {clipState.takingLongerThanExpected && (
                  <div className="flex items-center gap-2 text-xs text-amber-400 mt-1">
                    <span>Taking longer than expected</span>
                    <button
                      type="button"
                      onClick={retryRequest}
                      className="underline font-semibold hover:text-amber-300 cursor-pointer"
                    >
                      Check again
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* READY (FULL VIDEO PLAYER) */}
            {clipState.status === 'ready' && (
              <div className="relative w-full h-full flex items-center justify-center bg-black group/player">
                <video
                  ref={videoRef}
                  poster={snapshotUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={handlePlayToggle}
                  playsInline
                />

                {/* Big Center Play Button when paused */}
                {!isPlaying && (
                  <button
                    type="button"
                    onClick={handlePlayToggle}
                    className="absolute size-14 rounded-full bg-black/75 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 shadow-xl backdrop-blur-xs active:scale-95 transition-all cursor-pointer z-10"
                    aria-label="Play video"
                  >
                    <Play className="size-7 fill-white text-white ml-1" />
                  </button>
                )}

                {/* Non-interrupting Banner if new version available */}
                {clipState.hasNewVersionAvailable && (
                  <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between p-2.5 rounded-lg bg-black/85 border border-primary/40 backdrop-blur-md text-xs text-white shadow-lg animate-in fade-in">
                    <span>A newer version of this clip is available.</span>
                    <Button
                      size="sm"
                      onClick={applyNewVersion}
                      className="h-6 px-2.5 text-[11px] font-semibold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                    >
                      Load new version
                    </Button>
                  </div>
                )}

                {/* Custom Video Controls Bar */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 flex flex-col gap-1.5 opacity-90 group-hover/player:opacity-100 transition-opacity">
                  {/* Seek Bar */}
                  <input
                    type="range"
                    min="0"
                    max={clipState.durationSeconds || 38}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-primary"
                    aria-label="Seek video position"
                  />

                  <div className="flex items-center justify-between text-xs text-white">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handlePlayToggle}
                        className="hover:text-primary transition-colors cursor-pointer"
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 fill-white" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleVolumeToggle}
                        className="hover:text-primary transition-colors cursor-pointer"
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                      </button>
                      <span className="font-mono text-[11px] tabular-nums">
                        {formatClipDuration(currentTime)} / {formatClipDuration(clipState.durationSeconds)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSpeedChange}
                        className="px-1.5 py-0.5 rounded text-[11px] font-mono hover:bg-white/20 transition-colors cursor-pointer"
                        title="Playback speed"
                      >
                        {playbackRate}x
                      </button>
                      <button
                        type="button"
                        onClick={handleFullscreen}
                        className="hover:text-primary transition-colors cursor-pointer"
                        title="Fullscreen"
                        aria-label="Fullscreen"
                      >
                        <Maximize2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FAILED */}
            {clipState.status === 'failed' && (
              <div className="flex flex-col items-center gap-2 max-w-sm">
                <AlertTriangle className="size-8 text-amber-500" />
                <h3 className="text-sm font-semibold text-foreground">
                  {getFailureDetails(clipState.failureReason).title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {getFailureDetails(clipState.failureReason).explanation}
                </p>
                {getFailureDetails(clipState.failureReason).canRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={retryRequest}
                    className="h-8 px-4 text-xs font-semibold mt-2 cursor-pointer"
                  >
                    {getFailureDetails(clipState.failureReason).retryLabel}
                  </Button>
                )}
              </div>
            )}

            {/* EXPIRED */}
            {clipState.status === 'expired' && (
              <div className="flex flex-col items-center gap-2 max-w-sm">
                <Clock className="size-8 text-slate-400" />
                <h3 className="text-sm font-semibold text-foreground">
                  This clip is no longer available.
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The retention period for this recorded footage has elapsed. The snapshot remains available.
                </p>
                {clipState.requestable && (
                  <Button
                    size="sm"
                    onClick={requestClip}
                    className="h-8 px-4 text-xs font-semibold mt-2 cursor-pointer"
                  >
                    Request again
                  </Button>
                )}
              </div>
            )}

            {/* DEVICE OFFLINE */}
            {clipState.status === 'device_offline' && (
              <div className="flex flex-col items-center gap-2 max-w-sm">
                <VideoOff className="size-8 text-slate-400" />
                <h3 className="text-sm font-semibold text-foreground">Camera is offline</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The clip cannot be requested while the camera is disconnected. Try again when it returns online.
                </p>
              </div>
            )}

            {/* NO PERMISSION */}
            {clipState.status === 'no_permission' && (
              <div className="flex flex-col items-center gap-2 max-w-sm">
                <AlertTriangle className="size-8 text-amber-500" />
                <h3 className="text-sm font-semibold text-foreground">Permission required</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You do not have permission to request video recordings from edge cameras.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Caption below stage (Section 6.2) */}
      <div className="px-4 py-2 border-b border-border bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
        {activeTab === 'snapshot' ? (
          <span>Snapshot captured at {capturedTimeMYT}</span>
        ) : (
          <span>
            Clip, from {clipState.windowStartTime || windowStartTimeMYT} to {clipState.windowEndTime || windowEndTimeMYT} in MYT
            {clipState.isPartial && <span className="text-amber-400 ml-1 font-semibold">(Partial clip)</span>}
          </span>
        )}
        {clipState.autoUploaded && (
          <span className="text-[11px] font-mono text-primary font-medium">Uploaded automatically</span>
        )}
      </div>

      {/* 4. Media Tile Strip Below Stage (Section 6.2) */}
      <div className="p-3 bg-muted/20 flex items-center gap-3 overflow-x-auto">
        {/* Tile 1: Snapshot */}
        <button
          type="button"
          onClick={() => setActiveTab('snapshot')}
          className={`flex items-center gap-2.5 p-1.5 rounded-lg border transition-all cursor-pointer ${
            activeTab === 'snapshot'
              ? 'border-primary bg-primary/10 ring-1 ring-primary/40 shadow-xs'
              : 'border-border bg-card hover:bg-muted/60'
          }`}
          aria-label="Select snapshot media"
        >
          <div className="size-11 rounded overflow-hidden bg-slate-900 shrink-0 border border-border">
            <img src={snapshotUrl} alt="Snapshot thumbnail" className="w-full h-full object-cover" />
          </div>
          <div className="text-left pr-2">
            <span className="text-xs font-semibold text-foreground block">Snapshot</span>
            <span className="text-[10px] text-muted-foreground block">Still frame</span>
          </div>
        </button>

        {/* Tile 2: Clip */}
        <button
          type="button"
          onClick={() => setActiveTab('clip')}
          className={`flex items-center gap-2.5 p-1.5 rounded-lg border transition-all cursor-pointer ${
            activeTab === 'clip'
              ? 'border-primary bg-primary/10 ring-1 ring-primary/40 shadow-xs'
              : 'border-border bg-card hover:bg-muted/60'
          }`}
          aria-label="Select clip media"
        >
          <div className="size-11 rounded overflow-hidden bg-slate-900 shrink-0 border border-border flex items-center justify-center text-muted-foreground">
            {clipState.status === 'ready' ? (
              <Play className="size-5 fill-emerald-400 text-emerald-400" />
            ) : clipState.status === 'uploading' ? (
              <Loader2 className="size-5 animate-spin text-primary" />
            ) : clipState.status === 'requested' ? (
              <Clock className="size-5 text-sky-400" />
            ) : clipState.status === 'failed' ? (
              <AlertTriangle className="size-5 text-amber-500" />
            ) : clipState.status === 'device_offline' ? (
              <VideoOff className="size-5 text-slate-400" />
            ) : (
              <Film className="size-5 text-muted-foreground" />
            )}
          </div>
          <div className="text-left pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-foreground">Clip</span>
              {clipState.hasNewVersionAvailable && (
                <span className="size-1.5 rounded-full bg-primary" />
              )}
            </div>
            <span className="text-[10px] text-muted-foreground block font-mono">
              {clipState.status === 'ready'
                ? formatClipDuration(clipState.durationSeconds)
                : clipState.status === 'uploading'
                ? `${clipState.progress || 15}%`
                : clipState.status === 'requested'
                ? 'Waiting'
                : clipState.status === 'failed'
                ? 'Failed'
                : clipState.status === 'expired'
                ? 'Expired'
                : clipState.status === 'device_offline'
                ? 'Offline'
                : 'Not requested'}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
