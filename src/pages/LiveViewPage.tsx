import React, { useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAssets } from '@/contexts/AssetsContext';
import { useEvents } from '@/contexts/EventsContext';
import { useLiveStream } from '@/contexts/LiveStreamContext';
import { filterCamerasOnly, getDefaultCameraId, getCameraCapabilities, getRecentEventsForCamera, getPoleForCamera } from '@/lib/liveCameras';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  ExternalLink,
  MapPin,
  Radio,
  Copy,
  ShieldCheck,
  AlertCircle,
  Clock,
  Video,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { CameraSwitcherCombobox } from '@/components/live/CameraSwitcherCombobox';
import { CameraStrip } from '@/components/live/CameraStrip';
import { LivePlayer } from '@/components/live/LivePlayer';
import { LiveControlBar } from '@/components/live/LiveControlBar';
import { LiveSideColumn } from '@/components/live/LiveSideColumn';
import { StillWatchingDialog } from '@/components/live/StillWatchingDialog';

export const LiveViewRedirect: React.FC = () => {
  const { richDevices } = useAssets();
  const navigate = useNavigate();

  useEffect(() => {
    const cameras = filterCamerasOnly(richDevices);
    if (cameras.length > 0) {
      const storedId = localStorage.getItem('falcon_last_live_camera');
      const defaultId = getDefaultCameraId(cameras, storedId);
      navigate(`/live/${encodeURIComponent(defaultId)}`, { replace: true });
    }
  }, [richDevices, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
      <div className="flex items-center gap-2">
        <Video className="size-5 animate-pulse text-primary" />
        <span className="text-sm">Resolving default camera stream...</span>
      </div>
    </div>
  );
};

export const LiveViewPage: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { richDevices, poles } = useAssets();
  const { events } = useEvents();

  const {
    activeStreamingDeviceId,
    streamState,
    startStream,
    isStillWatchingPromptOpen,
    inactivityRemainingSeconds,
    confirmStillWatching,
  } = useLiveStream();

  // All valid cameras (speakers and sensors excluded)
  const cameras = useMemo(() => filterCamerasOnly(richDevices), [richDevices]);

  // Current selected camera record
  const currentCamera = useMemo(() => {
    if (!deviceId) return null;
    const decoded = decodeURIComponent(deviceId).toLowerCase().trim();
    return (
      cameras.find(
        (c) =>
          c.identifier.toLowerCase().trim() === decoded ||
          c.name.toLowerCase().trim() === decoded ||
          (c.vendorDeviceId && c.vendorDeviceId.toLowerCase().trim() === decoded)
      ) || null
    );
  }, [deviceId, cameras]);

  // Capabilities
  const capabilities = useMemo(() => getCameraCapabilities(currentCamera), [currentCamera]);

  // Related pole and recent events
  const installedPole = useMemo(
    () => getPoleForCamera(poles, currentCamera?.installedPoleId),
    [poles, currentCamera?.installedPoleId]
  );
  const recentEvents = useMemo(
    () => (currentCamera ? getRecentEventsForCamera(events, currentCamera.identifier, 5) : []),
    [events, currentCamera]
  );

  // If deviceId in URL is invalid or missing, redirect to default camera
  useEffect(() => {
    if (cameras.length === 0) return;
    if (!currentCamera && deviceId) {
      const storedId = localStorage.getItem('falcon_last_live_camera');
      const fallbackId = getDefaultCameraId(cameras, storedId);
      navigate(`/live/${encodeURIComponent(fallbackId)}`, { replace: true });
    } else if (currentCamera) {
      localStorage.setItem('falcon_last_live_camera', currentCamera.identifier);
    }
  }, [cameras, currentCamera, deviceId, navigate]);

  // Handle deep link autostart intent: ?autostart=1
  useEffect(() => {
    const autostart = searchParams.get('autostart');
    if (autostart === '1' && currentCamera) {
      // Start stream if not already live
      if (activeStreamingDeviceId !== currentCamera.identifier || streamState === 'idle') {
        startStream(currentCamera.identifier, currentCamera.name, true);
      }
    }
  }, [searchParams, currentCamera, activeStreamingDeviceId, streamState, startStream]);

  // Copy link action
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast('info', `Copied direct link for ${currentCamera?.identifier || 'camera'} to clipboard.`, 'Link Copied');
  };

  if (!currentCamera) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <Video className="size-5 animate-pulse text-primary" />
          <span className="text-sm">Loading camera telemetry...</span>
        </div>
      </div>
    );
  }

  const isOnline = currentCamera.connectivityState === 'online';
  const isStale = currentCamera.connectivityState === 'stale';

  return (
    <div className="flex flex-col gap-5 w-full max-w-[1720px] mx-auto pb-10">
      {/* 4.2 Frame Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        {/* Left: Camera Switcher Combobox + One-line Model & Site */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-3">
            <CameraSwitcherCombobox
              currentCamera={currentCamera}
              cameras={cameras}
              onSelectCamera={(cam) => navigate(`/live/${encodeURIComponent(cam.identifier)}`)}
            />
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 pl-0.5 truncate">
            <span>{currentCamera.model || 'Field Camera'}</span>
            <span className="text-border">•</span>
            <span>{currentCamera.siteName || 'Teluk Panglima Garang'}</span>
            {installedPole && (
              <>
                <span className="text-border">•</span>
                <Link
                  to={`/assets/poles/${encodeURIComponent(installedPole.identifier)}`}
                  className="hover:text-primary transition-colors hover:underline inline-flex items-center gap-1"
                >
                  <MapPin className="size-3" />
                  <span>Pole {installedPole.identifier}</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Right: State Badge & Overflow Menu */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {isOnline ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs px-2.5 py-0.5 gap-1.5 font-medium">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </Badge>
          ) : isStale ? (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs px-2.5 py-0.5 gap-1.5 font-medium">
              <Clock className="size-3" />
              Stale
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-xs px-2.5 py-0.5 gap-1.5 font-medium">
              <AlertCircle className="size-3" />
              Offline
            </Badge>
          )}

          {/* Audit indicator */}
          <div className="hidden md:flex items-center gap-1 text-[11px] text-muted-foreground/80 bg-muted/40 px-2 py-1 rounded border border-border/40" title="All viewing sessions are recorded to system audit log">
            <ShieldCheck className="size-3 text-muted-foreground" />
            <span>Viewing logged</span>
          </div>

          {/* Overflow Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" aria-label="Camera actions overflow menu">
                  <MoreVertical className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48 text-xs">
              <DropdownMenuItem onClick={() => navigate(`/assets/inventory/devices/${encodeURIComponent(currentCamera.identifier)}`)}>
                <ExternalLink className="size-3.5 mr-2 text-muted-foreground" />
                Open device
              </DropdownMenuItem>
              {installedPole && (
                <DropdownMenuItem onClick={() => navigate(`/overview?pole=${encodeURIComponent(installedPole.identifier)}`)}>
                  <MapPin className="size-3.5 mr-2 text-muted-foreground" />
                  Open pole on map
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigate(`/events?device=${encodeURIComponent(currentCamera.identifier)}`)}>
                <Radio className="size-3.5 mr-2 text-muted-foreground" />
                Open events
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="size-3.5 mr-2 text-muted-foreground" />
                Copy link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Layout: 8:4 grid from 1280px (xl), single column below */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Main Column (~8 cols) */}
        <div className="xl:col-span-8 flex flex-col gap-4 min-w-0">
          {/* Live Player */}
          <LivePlayer
            camera={currentCamera}
            capabilities={capabilities}
            installedPole={installedPole}
          />

          {/* External Control Bar */}
          <LiveControlBar
            camera={currentCamera}
            capabilities={capabilities}
          />

          {/* Horizontal Camera Strip */}
          <CameraStrip
            cameras={cameras}
            selectedCameraId={currentCamera.identifier}
            onSelectCamera={(cam) => navigate(`/live/${encodeURIComponent(cam.identifier)}`)}
          />
        </div>

        {/* Side Column (~4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-5 min-w-0">
          <LiveSideColumn
            camera={currentCamera}
            installedPole={installedPole}
            recentEvents={recentEvents}
            totalEventsCount={events.filter((e) => (e.device || '').toLowerCase() === currentCamera.identifier.toLowerCase()).length}
          />
        </div>
      </div>

      {/* Inactivity Safety Prompt */}
      <StillWatchingDialog
        open={isStillWatchingPromptOpen}
        remainingSeconds={inactivityRemainingSeconds}
        onConfirm={confirmStillWatching}
      />
    </div>
  );
};
export default LiveViewPage;
