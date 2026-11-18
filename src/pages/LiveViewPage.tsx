import React, { useMemo, useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useAssets } from '@/contexts/AssetsContext';
import { useEvents } from '@/contexts/EventsContext';
import { useLiveStream } from '@/contexts/LiveStreamContext';
import {
  filterCamerasOnly,
  getDefaultCameraId,
  getCameraCapabilities,
  getRecentEventsForCamera,
  getPoleForCamera,
  computeUnifiedDeviceState,
} from '@/lib/liveCameras';
import {
  getLastLiveMode,
  setLastLiveMode,
  getActiveGroupId,
  setActiveGroupId,
} from '@/lib/liveGroups';
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
  MapPin,
  Radio,
  Copy,
  AlertCircle,
  Clock,
  Video,
  LayoutGrid,
  Bookmark,
  HardDrive,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { CameraSwitcherCombobox } from '@/components/live/CameraSwitcherCombobox';
import { CameraStrip } from '@/components/live/CameraStrip';
import { LivePlayer } from '@/components/live/LivePlayer';
import { LiveControlBar } from '@/components/live/LiveControlBar';
import { LiveSideColumn } from '@/components/live/LiveSideColumn';
import { MonitorWall } from '@/components/live/MonitorWall';
import { AddToGroupDialog } from '@/components/live/AddToGroupDialog';
import { GroupManageDialog } from '@/components/live/GroupManageDialog';
import { StillWatchingDialog } from '@/components/live/StillWatchingDialog';

export const LiveViewRedirect: React.FC = () => {
  const { richDevices } = useAssets();
  const navigate = useNavigate();

  useEffect(() => {
    const cameras = filterCamerasOnly(richDevices);
    if (cameras.length > 0) {
      const lastMode = getLastLiveMode();
      if (lastMode === 'monitor') {
        const activeGroupId = getActiveGroupId();
        navigate(`/live/monitor/${encodeURIComponent(activeGroupId)}`, { replace: true });
      } else {
        const storedId = localStorage.getItem('falcon_last_live_camera');
        const defaultId = getDefaultCameraId(cameras, storedId);
        navigate(`/live/single/${encodeURIComponent(defaultId)}`, { replace: true });
      }
    }
  }, [richDevices, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
      <div className="flex items-center gap-2">
        <Video className="size-5 animate-pulse text-primary" />
        <span className="text-sm">Resolving live stream mode...</span>
      </div>
    </div>
  );
};

interface LiveViewPageProps {
  mode?: 'single' | 'monitor';
}

export const LiveViewPage: React.FC<LiveViewPageProps> = ({ mode: explicitMode }) => {
  const { deviceId, groupId } = useParams<{ deviceId?: string; groupId?: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { richDevices, poles } = useAssets();
  const { events } = useEvents();

  const [addToGroupOpen, setAddToGroupOpen] = useState(false);
  const [groupManageOpen, setGroupManageOpen] = useState(false);

  const {
    activeStreamingDeviceId,
    streamState,
    startStream,
    stopStream,
    isStillWatchingPromptOpen,
    inactivityRemainingSeconds,
    confirmStillWatching,
  } = useLiveStream();

  // Infer effective mode from prop or URL
  const effectiveMode: 'single' | 'monitor' = useMemo(() => {
    if (explicitMode) return explicitMode;
    if (location.pathname.startsWith('/live/monitor')) return 'monitor';
    return 'single';
  }, [explicitMode, location.pathname]);

  // All valid cameras (speakers and sensors excluded)
  const cameras = useMemo(() => filterCamerasOnly(richDevices), [richDevices]);

  // Handle legacy route redirect: /live/:deviceId -> /live/single/:deviceId or /live/monitor
  useEffect(() => {
    if (location.pathname.startsWith('/live/') && !location.pathname.startsWith('/live/single') && !location.pathname.startsWith('/live/monitor')) {
      const segment = location.pathname.replace('/live/', '').trim();
      if (segment.toLowerCase() === 'monitor') {
        navigate(`/live/monitor/${encodeURIComponent(getActiveGroupId())}`, { replace: true });
      } else if (segment) {
        navigate(`/live/single/${encodeURIComponent(segment)}`, { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  // Current selected camera record for Single mode
  const currentCamera = useMemo(() => {
    if (effectiveMode !== 'single') return null;
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
  }, [effectiveMode, deviceId, cameras]);

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

  const unifiedState = useMemo(() => {
    return computeUnifiedDeviceState(currentCamera?.lastContactAt, currentCamera?.connectivityState);
  }, [currentCamera?.lastContactAt, currentCamera?.connectivityState]);

  // In Single mode: If deviceId in URL is invalid or missing, redirect to default camera
  useEffect(() => {
    if (effectiveMode !== 'single' || cameras.length === 0) return;
    if (!currentCamera && deviceId) {
      const storedId = localStorage.getItem('falcon_last_live_camera');
      const fallbackId = getDefaultCameraId(cameras, storedId);
      navigate(`/live/single/${encodeURIComponent(fallbackId)}`, { replace: true });
    } else if (currentCamera) {
      localStorage.setItem('falcon_last_live_camera', currentCamera.identifier);
      setLastLiveMode('single');
    }
  }, [effectiveMode, cameras, currentCamera, deviceId, navigate]);

  // In Monitor mode: remember last mode
  useEffect(() => {
    if (effectiveMode === 'monitor') {
      setLastLiveMode('monitor');
      if (groupId) {
        setActiveGroupId(groupId);
      }
    }
  }, [effectiveMode, groupId]);

  // Handle deep link autostart intent: ?autostart=1
  useEffect(() => {
    const autostart = searchParams.get('autostart');
    if (autostart === '1' && currentCamera) {
      if (activeStreamingDeviceId !== currentCamera.identifier || streamState === 'idle') {
        startStream(currentCamera.identifier, currentCamera.name, true);
      }
    }
  }, [searchParams, currentCamera, activeStreamingDeviceId, streamState, startStream]);

  // Mode switcher handler with stream safety stop
  const handleSwitchMode = (targetMode: 'single' | 'monitor') => {
    if (targetMode === effectiveMode) return;

    // Safety: stop running streams before switching mode
    if (streamState === 'live' || streamState === 'connecting') {
      stopStream('user_stopped');
      addToast('info', 'Stopped active live stream before switching mode.', 'Stream Stopped');
    }

    setLastLiveMode(targetMode);
    if (targetMode === 'monitor') {
      const activeGid = getActiveGroupId();
      navigate(`/live/monitor/${encodeURIComponent(activeGid)}`);
    } else {
      const storedId = localStorage.getItem('falcon_last_live_camera') || currentCamera?.identifier || 'DEV-001';
      navigate(`/live/single/${encodeURIComponent(storedId)}`);
    }
  };

  // Copy link action
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast('info', `Copied direct link for ${currentCamera?.identifier || 'camera'} to clipboard.`, 'Link Copied');
  };

  if (effectiveMode === 'single' && !currentCamera) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <Video className="size-5 animate-pulse text-primary" />
          <span className="text-sm">Loading camera telemetry...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full max-w-[1720px] mx-auto pb-10">
      {/* 4.2 Frame Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        {/* Left: Mode Switcher + Title / Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
          {/* Segmented Control for Mode: Single | Monitor */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={() => handleSwitchMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                effectiveMode === 'single'
                  ? 'bg-card text-foreground shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Video className="size-3.5" />
              <span>Single</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('monitor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                effectiveMode === 'monitor'
                  ? 'bg-card text-foreground shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="size-3.5" />
              <span>Monitor</span>
            </button>
          </div>

          {/* Subheader Title & Context for Single Mode */}
          {effectiveMode === 'single' && currentCamera && (
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-3">
                <CameraSwitcherCombobox
                  currentCamera={currentCamera}
                  cameras={cameras}
                  onSelectCamera={(cam) => navigate(`/live/single/${encodeURIComponent(cam.identifier)}`)}
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
                      className="hover:text-primary transition-colors hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <MapPin className="size-3" />
                      <span>Pole {installedPole.identifier}</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Header for Monitor Mode */}
          {effectiveMode === 'monitor' && (
            <div className="flex flex-col gap-0.5 min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Monitor Wall
              </h1>
              <div className="text-xs text-muted-foreground">
                Simultaneous multi-camera grid and group management
              </div>
            </div>
          )}
        </div>

        {/* Right: State Badge & Overflow Menu (in Single Mode) */}
        {effectiveMode === 'single' && currentCamera && (
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {unifiedState.state === 'online' ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs px-2.5 py-0.5 gap-1.5 font-medium" title={unifiedState.reason}>
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </Badge>
            ) : unifiedState.state === 'stale' ? (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs px-2.5 py-0.5 gap-1.5 font-medium" title={unifiedState.reason}>
                <Clock className="size-3" />
                Stale
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-xs px-2.5 py-0.5 gap-1.5 font-medium" title={unifiedState.reason}>
                <AlertCircle className="size-3" />
                Offline
              </Badge>
            )}

            {/* Overflow Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" className="size-9 p-0 cursor-pointer" aria-label="Camera actions overflow menu">
                    <MoreVertical className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-52 text-xs">
                <DropdownMenuItem onClick={() => navigate(`/assets/inventory/devices/${encodeURIComponent(currentCamera.identifier)}`)}>
                  <HardDrive className="size-3.5 mr-2 text-muted-foreground" />
                  Open device record
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
                <DropdownMenuItem onClick={() => setAddToGroupOpen(true)}>
                  <Bookmark className="size-3.5 mr-2 text-primary" />
                  <span>Add to group</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Copy className="size-3.5 mr-2 text-muted-foreground" />
                  Copy link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Main Content: Single Mode vs Monitor Mode */}
      {effectiveMode === 'single' && currentCamera && (
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
              onSelectCamera={(cam) => navigate(`/live/single/${encodeURIComponent(cam.identifier)}`)}
            />
          </div>

          {/* Side Column (~4 cols) */}
          <div className="xl:col-span-4 flex flex-col gap-5 min-w-0 xl:sticky xl:top-6 self-start">
            <LiveSideColumn
              camera={currentCamera}
              installedPole={installedPole}
              recentEvents={recentEvents}
              totalEventsCount={events.filter((e) => (e.device || '').toLowerCase() === currentCamera.identifier.toLowerCase()).length}
            />
          </div>
        </div>
      )}

      {effectiveMode === 'monitor' && (
        <MonitorWall
          currentGroupId={groupId || getActiveGroupId()}
          allCameras={cameras}
          onSelectGroup={(gid) => navigate(`/live/monitor/${encodeURIComponent(gid)}`)}
        />
      )}

      {/* Add to Group Dialog (Single Mode) */}
      {currentCamera && (
        <AddToGroupDialog
          open={addToGroupOpen}
          onOpenChange={setAddToGroupOpen}
          camera={currentCamera}
          onOpenNewGroup={() => setGroupManageOpen(true)}
        />
      )}

      {/* Group Create/Edit Dialog */}
      <GroupManageDialog
        open={groupManageOpen}
        onOpenChange={setGroupManageOpen}
        allCameras={cameras}
        onSaved={(group) => {
          navigate(`/live/monitor/${encodeURIComponent(group.id)}`);
        }}
      />

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

