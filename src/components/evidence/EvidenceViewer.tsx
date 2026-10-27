import React, { useState, useRef, useEffect, useReducer } from 'react';
import {
  Camera,
  Film,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  AlertTriangle,
  Loader2,
  VideoOff,
  X,
  ZoomIn,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  clipReducer,
  getPollingBackoff,
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
  capturedTimeMYT?: string;
  windowStartTimeMYT?: string;
  windowEndTimeMYT?: string;
  className?: string;
  compact?: boolean;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
  eventId,
  snapshots = [],
  initialClipStatus = 'not_requested',
  initialVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  durationSeconds = 38,
  deviceSupportsVideo = true,
  deviceIsOnline = true,
  capturedTimeMYT = 'Oct 20, 2026, 4:28 PM MYT',
  windowStartTimeMYT = '4:27:41 PM',
  windowEndTimeMYT = '4:28:19 PM',
  className = '',
  compact = false,
}) => {
  // Segmented control: 'snapshot' (default) vs 'clip'
  const [activeTab, setActiveTab] = useState<'snapshot' | 'clip'>('snapshot');
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Simulation mode flag: default true for interactive evaluation per Section 7.2
  const [isSimulatedMode, setIsSimulatedMode] = useState(true);

  // Determine starting state
  const startingStatus: ClipStatus = !deviceSupportsVideo
    ? 'not_supported'
    : !deviceIsOnline
    ? 'offline_or_forbidden'
    : initialClipStatus;

  const [clipState, dispatch] = useReducer(clipReducer, {
    status: startingStatus,
    progress: 0,
    requestedAt: null,
    requestedBy: null,
    videoUrl: initialVideoUrl,
    durationSeconds,
    errorMessage: null,
    windowStartTime: windowStartTimeMYT,
    windowEndTime: windowEndTimeMYT,
  });

  // Player state (LAZY LOADING: src is assigned ONLY on play)
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [pollAttempt, setPollAttempt] = useState(0);

  const snapshotUrl = snapshots[activeFrameIndex] || null;

  // Polling simulation when requested or uploading
  useEffect(() => {
    let timer: any;
    if (clipState.status === 'requested' && isSimulatedMode) {
      const delay = getPollingBackoff(pollAttempt);
      timer = setTimeout(() => {
        dispatch({ type: 'DEVICE_ACKNOWLEDGED', payload: { progress: 15 } });
      }, delay);
    } else if (clipState.status === 'uploading' && isSimulatedMode) {
      timer = setInterval(() => {
        dispatch({
          type: 'UPDATE_PROGRESS',
          payload: { progress: (clipState.progress || 15) + 20 },
        });
      }, 1000);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(timer);
    };
  }, [clipState.status, clipState.progress, pollAttempt, isSimulatedMode]);

  // Transition to ready once progress reaches 100
  useEffect(() => {
    if (clipState.status === 'uploading' && (clipState.progress ?? 0) >= 100) {
      dispatch({ type: 'UPLOAD_COMPLETE' });
    }
  }, [clipState.status, clipState.progress]);

  // Trigger clip request handler
  const handleRequestClip = () => {
    if (!deviceSupportsVideo || !deviceIsOnline) return;
    dispatch({
      type: 'REQUEST_CLIP',
      payload: {
        requestedAt: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        requestedBy: 'Current user',
      },
    });
    setPollAttempt((prev) => prev + 1);
  };

  // Video playback controls
  const handlePlayToggle = () => {
    const el = videoRef.current;
    if (!el) return;

    if (!hasPlayedOnce) {
      // Lazy load video stream on first play
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
    const speeds = [1, 1.5, 2, 0.5];
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

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div
      className={`flex flex-col rounded-xl border dark:border-[#2a323d] border-slate-200 dark:bg-[#141b23]/80 bg-white/80 overflow-hidden shadow-lg select-none ${
        compact ? 'text-xs' : ''
      } ${className}`}
      data-testid="evidence-viewer"
    >
      {/* 1. Header & Segmented Tab Switcher */}
      <div className="flex items-center justify-between px-3 py-2 border-b dark:border-[#2a323d] border-slate-200 dark:bg-black/20 bg-slate-50/50">
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/10 dark:bg-black/30 border dark:border-[#2a323d]/60 border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('snapshot')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'snapshot'
                ? 'bg-white dark:bg-[#202936] text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Camera className="size-3.5" />
            <span>Snapshot</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clip')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'clip'
                ? 'bg-white dark:bg-[#202936] text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Film className="size-3.5" />
            <span>Clip</span>
            {clipState.status === 'ready' ? (
              <span className="size-1.5 rounded-full bg-emerald-400" />
            ) : clipState.status === 'uploading' ? (
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            ) : null}
          </button>
        </div>

        {/* Simulation / Preview Mode Indicator with toggle */}
        {activeTab === 'clip' && (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => setIsSimulatedMode((prev) => !prev)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 cursor-pointer transition-colors ${
                    isSimulatedMode
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20'
                      : 'bg-slate-500/10 text-slate-400 border-slate-500/25 hover:bg-slate-500/20'
                  }`}
                >
                  <Sparkles className="size-2.5" />
                  <span>{isSimulatedMode ? 'Preview data' : 'Live mode'}</span>
                </button>
              }
            />
            <TooltipContent side="left" className="text-xs">
              Click to toggle simulation mode
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* 2. Main Content Area (16:9 Aspect Ratio) */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden group">
        {/* ================= SNAPSHOT TAB ================= */}
        {activeTab === 'snapshot' && (
          <div className="relative w-full h-full flex items-center justify-center">
            {snapshotUrl ? (
              <img
                src={snapshotUrl}
                alt={`Event ${eventId} evidence frame`}
                className="w-full h-full object-cover cursor-zoom-in"
                onClick={() => setIsLightboxOpen(true)}
              />
            ) : (
              <div className="text-center p-6 text-slate-400">
                <Camera className="size-8 mx-auto mb-2 opacity-50" />
                <span className="text-xs font-medium block">Snapshot frame recorded</span>
                <span className="text-[10px] text-slate-500 block">1080p RGB • 30 FPS</span>
              </div>
            )}

            {/* Snapshot Overlay Tag & Multi-frame buttons */}
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-black/75 text-white/90 backdrop-blur-md border border-white/10 flex items-center gap-1">
                <Camera className="size-3" />
                <span>Snapshot</span>
              </span>
              {snapshots.length > 1 && (
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm p-0.5 rounded border border-white/10">
                  {snapshots.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveFrameIndex(idx)}
                      className={`px-1.5 py-0.2 rounded text-[9.5px] font-mono cursor-pointer transition-colors ${
                        activeFrameIndex === idx
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Click to expand button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 text-white/90 hover:bg-black/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Expand snapshot"
            >
              <ZoomIn className="size-4" />
            </button>
          </div>
        )}

        {/* ================= CLIP TAB ================= */}
        {activeTab === 'clip' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* 1. NOT SUPPORTED */}
            {clipState.status === 'not_supported' && (
              <div className="text-center p-6 space-y-2 text-slate-400 max-w-xs">
                <VideoOff className="size-8 mx-auto text-slate-500" />
                <h4 className="text-xs font-bold text-foreground">Video recording not supported</h4>
                <p className="text-[11px] text-muted-foreground">
                  This device model does not feature edge video recording hardware.
                </p>
              </div>
            )}

            {/* 2. OFFLINE OR FORBIDDEN */}
            {clipState.status === 'offline_or_forbidden' && (
              <div className="text-center p-6 space-y-2 text-slate-400 max-w-xs">
                <AlertTriangle className="size-8 mx-auto text-amber-500" />
                <h4 className="text-xs font-bold text-foreground">Device currently offline</h4>
                <p className="text-[11px] text-muted-foreground">
                  The clip cannot be requested while the camera is disconnected.
                </p>
              </div>
            )}

            {/* 3. NOT REQUESTED */}
            {clipState.status === 'not_requested' && (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                {/* Dimmed snapshot background poster */}
                {snapshotUrl && (
                  <img
                    src={snapshotUrl}
                    alt="Poster preview"
                    className="absolute inset-0 w-full h-full object-cover filter blur-[2px] opacity-25"
                  />
                )}
                <div className="relative z-10 text-center p-6 space-y-3 max-w-sm">
                  <Film className="size-8 mx-auto text-primary opacity-80" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-foreground">
                      On-demand clip available
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      The clip is not loaded yet. It is requested from the device only when needed.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleRequestClip}
                    className="h-8 text-xs px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-1.5 cursor-pointer shadow-md"
                  >
                    <Film className="size-3.5" />
                    <span>Request clip</span>
                  </Button>
                </div>
              </div>
            )}

            {/* 4. REQUESTED */}
            {clipState.status === 'requested' && (
              <div className="text-center p-6 space-y-3 text-slate-300 max-w-xs">
                <Loader2 className="size-8 mx-auto text-primary animate-spin" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground">Request sent</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Waiting for the device to prepare video chunks...
                  </p>
                </div>
                {clipState.requestedAt && (
                  <span className="text-[10px] font-mono text-muted-foreground block">
                    Sent at {clipState.requestedAt}
                  </span>
                )}
              </div>
            )}

            {/* 5. UPLOADING */}
            {clipState.status === 'uploading' && (
              <div className="text-center p-6 space-y-3 max-w-xs w-full">
                <Loader2 className="size-7 mx-auto text-primary animate-spin" />
                <div className="space-y-1">
                  {/* Matches staging exact copy: "Evidence is still being uploaded" */}
                  <h4 className="text-xs font-bold text-foreground">
                    Evidence is still being uploaded
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Receiving video package from edge sensor ({clipState.progress || 0}%)
                  </p>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden border border-white/10">
                  <div
                    style={{ width: `${clipState.progress || 10}%` }}
                    className="h-full bg-primary transition-all duration-300"
                  />
                </div>
              </div>
            )}

            {/* 6. READY: Custom Video Player with LAZY byte loading */}
            {clipState.status === 'ready' && (
              <div className="relative w-full h-full flex flex-col justify-end">
                {/* Video element - preload NONE, src assigned ONLY on play */}
                <video
                  ref={videoRef}
                  poster={snapshotUrl || undefined}
                  preload="none"
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full h-full object-cover"
                />

                {/* Big Center Play Overlay (Prior to Playing) */}
                {!isPlaying && (
                  <div
                    onClick={handlePlayToggle}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] cursor-pointer group/play"
                  >
                    <div className="size-14 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-2xl group-hover/play:scale-110 transition-transform">
                      <Play className="size-6 ml-0.5 fill-current" />
                    </div>
                  </div>
                )}

                {/* Bottom Custom Control Bar */}
                <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-1.5 text-white z-20">
                  {/* Timeline Scrubber */}
                  <input
                    type="range"
                    min="0"
                    max={durationSeconds}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 accent-primary bg-white/20 rounded-lg cursor-pointer"
                  />

                  {/* Playback Controls Row */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePlayToggle}
                        className="p-1 hover:text-primary transition-colors cursor-pointer"
                        title={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? (
                          <Pause className="size-4" />
                        ) : (
                          <Play className="size-4 fill-current" />
                        )}
                      </button>

                      {/* Time display: 0:00 of 0:38 */}
                      <span className="font-mono text-[11px] text-white/80">
                        {formatSeconds(currentTime)} of {formatSeconds(durationSeconds)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* Speed button: 1x, 1.5x, 2x */}
                      <button
                        type="button"
                        onClick={handleSpeedChange}
                        className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                        title="Playback speed"
                      >
                        {playbackRate}x
                      </button>

                      {/* Mute toggle */}
                      <button
                        type="button"
                        onClick={handleVolumeToggle}
                        className="p-1 hover:text-primary transition-colors cursor-pointer"
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                      </button>

                      {/* Download */}
                      <button
                        type="button"
                        onClick={() => {
                          if (clipState.videoUrl) window.open(clipState.videoUrl, '_blank');
                        }}
                        className="p-1 hover:text-primary transition-colors cursor-pointer"
                        title="Download clip"
                      >
                        <Download className="size-3.5" />
                      </button>

                      {/* Fullscreen */}
                      <button
                        type="button"
                        onClick={handleFullscreen}
                        className="p-1 hover:text-primary transition-colors cursor-pointer"
                        title="Fullscreen"
                      >
                        <Maximize2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 7. FAILED */}
            {clipState.status === 'failed' && (
              <div className="text-center p-6 space-y-2 text-rose-400 max-w-xs">
                <AlertTriangle className="size-8 mx-auto text-rose-500" />
                <h4 className="text-xs font-bold text-foreground">Upload failed</h4>
                <p className="text-[11px] text-muted-foreground">
                  {clipState.errorMessage || 'Device upload timed out.'}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRequestClip}
                  className="h-7 text-xs border-slate-300 dark:border-[#2a323d] mt-2 cursor-pointer"
                >
                  <RotateCcw className="size-3 mr-1" />
                  <span>Try again</span>
                </Button>
              </div>
            )}

            {/* 8. EXPIRED */}
            {clipState.status === 'expired' && (
              <div className="text-center p-6 space-y-2 text-slate-400 max-w-xs">
                <Clock className="size-8 mx-auto text-slate-500" />
                <h4 className="text-xs font-bold text-foreground">Clip expired</h4>
                <p className="text-[11px] text-muted-foreground">
                  This clip is no longer available (30-day retention limit reached).
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Footer Strip: Clip Window & Metadata */}
      <div className="px-3 py-1.5 border-t dark:border-[#2a323d] border-slate-200 dark:bg-black/15 bg-slate-50/50 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5 truncate">
          <Clock className="size-3 text-muted-foreground/70 shrink-0" />
          <span>
            Window: {windowStartTimeMYT} – {windowEndTimeMYT} MYT
          </span>
        </span>
        <span className="font-mono text-[10px] text-muted-foreground/80 shrink-0">
          ±19s buffer
        </span>
      </div>

      {/* 4. Lightbox Modal */}
      {isLightboxOpen && snapshotUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in-50 duration-150 p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] flex flex-col rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/10 bg-slate-900/90 text-white">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">{eventId} Snapshot</span>
                <span className="text-xs text-slate-400">• {capturedTimeMYT}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Lightbox Image */}
            <div className="p-2 flex items-center justify-center">
              <img
                src={snapshotUrl}
                alt={`Lightbox view for ${eventId}`}
                className="max-h-[75vh] w-auto object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
