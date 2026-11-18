/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useAppContext } from './AppContext';
import { getRoleFromAccountLabel, getLivePermissions, type UserRole } from '@/lib/permissions';
import { formatAbsoluteMYT } from '@/lib/dateTime';
import type {
  LiveStreamState,
  LiveFailureVariant,
  LiveStreamStats,
  PtzDirection,
  TalkPreconditionState,
  LiveSessionAuditRecord,
} from '@/types/live';

interface LiveStreamContextValue {
  activeStreamingDeviceId: string | null;
  streamState: LiveStreamState;
  failureVariant: LiveFailureVariant | null;
  failureMessage: string | null;
  streamStats: LiveStreamStats;
  connectingStep: string | null;
  connectionElapsedSeconds: number;
  isTakingLonger: boolean;
  isMuted: boolean;
  volume: number;
  isPtzMoving: boolean;
  activePtzDirection: PtzDirection | null;
  talkPrecondition: TalkPreconditionState;
  isTalkActive: boolean;
  isTalkToggleMode: boolean;
  isStillWatchingPromptOpen: boolean;
  inactivityRemainingSeconds: number;
  userRole: UserRole;
  startStream: (deviceId: string, cameraName?: string, isAutostart?: boolean) => Promise<void>;
  stopStream: (reason?: LiveSessionAuditRecord['stopReason']) => void;
  retryStream: (deviceId: string) => Promise<void>;
  cancelConnecting: () => void;
  toggleMute: () => void;
  setVolume: (vol: number) => void;
  startPtz: (direction: PtzDirection) => void;
  stopPtz: () => void;
  startTalk: () => void;
  stopTalk: () => void;
  toggleTalk: () => void;
  setTalkToggleMode: (val: boolean) => void;
  requestMicPermission: () => Promise<boolean>;
  confirmStillWatching: () => void;
  takeSnapshot: (deviceId: string, videoElement?: HTMLVideoElement | null) => void;
}

const LiveStreamContext = createContext<LiveStreamContextValue | null>(null);

const DEFAULT_TIMEOUT_SECONDS = 20;
const HIDDEN_PAGE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const INACTIVITY_PROMPT_DURATION_SEC = 30; // 30 seconds
const DEFAULT_BITRATE_MBPS = 2.4;

export const LiveStreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const { accountLabel } = useAppContext();
  const userRole = getRoleFromAccountLabel(accountLabel);
  const permissions = getLivePermissions(userRole);

  const [activeStreamingDeviceId, setActiveStreamingDeviceId] = useState<string | null>(null);
  const [activeCameraName, setActiveCameraName] = useState<string>('');
  const [streamState, setStreamState] = useState<LiveStreamState>('idle');
  const [failureVariant, setFailureVariant] = useState<LiveFailureVariant | null>(null);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);

  // Connecting progression state
  const [connectingStep, setConnectingStep] = useState<string | null>(null);
  const [connectionElapsedSeconds, setConnectionElapsedSeconds] = useState(0);
  const [isTakingLonger, setIsTakingLonger] = useState(false);

  // Stream stats
  const [streamStats, setStreamStats] = useState<LiveStreamStats>({
    resolution: '1920x1080',
    bitrateMbps: DEFAULT_BITRATE_MBPS,
    latencyMs: 120,
    fps: 25,
    elapsedSeconds: 0,
    estimatedDataMb: 0,
  });

  // Audio controls
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(1);

  // PTZ State
  const [isPtzMoving, setIsPtzMoving] = useState(false);
  const [activePtzDirection, setActivePtzDirection] = useState<PtzDirection | null>(null);

  // Talk Intercom State
  const [talkPrecondition, setTalkPrecondition] = useState<TalkPreconditionState>('ready');
  const [isTalkActive, setIsTalkActive] = useState(false);
  const [isTalkToggleMode, setIsTalkToggleMode] = useState(false);

  // Safety Timers: Inactivity prompt
  const [isStillWatchingPromptOpen, setIsStillWatchingPromptOpen] = useState(false);
  const [inactivityRemainingSeconds, setInactivityRemainingSeconds] = useState(INACTIVITY_PROMPT_DURATION_SEC);

  // Refs for tracking active session timers
  const sessionStartTimeRef = useRef<number | null>(null);
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectingStepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hiddenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const promptCountdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Check Talk Preconditions (HTTPS & Microphone)
  const checkTalkPreconditions = useCallback(async (): Promise<TalkPreconditionState> => {
    if (typeof window === 'undefined') return 'ready';
    const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    if (!isHttps) {
      setTalkPrecondition('blocked_https');
      return 'blocked_https';
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setTalkPrecondition('blocked_mic');
      return 'blocked_mic';
    }
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const res = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (res.state === 'denied') {
          setTalkPrecondition('blocked_mic');
          return 'blocked_mic';
        }
      }
    } catch {
      // Permission API optional, continue
    }
    setTalkPrecondition('ready');
    return 'ready';
  }, []);

  useEffect(() => {
    let mounted = true;
    checkTalkPreconditions().then((status) => {
      if (mounted) setTalkPrecondition(status);
    });
    return () => {
      mounted = false;
    };
  }, [checkTalkPreconditions]);

  const requestMicPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setTalkPrecondition('ready');
      addToast(
        'success',
        'You can now use Talk intercom on supported cameras.',
        'Microphone access granted'
      );
      return true;
    } catch {
      setTalkPrecondition('blocked_mic');
      addToast(
        'error',
        'Please enable microphone access in your browser settings.',
        'Microphone access denied'
      );
      return false;
    }
  }, [addToast]);

  // Record Audit Session to localStorage
  const logAuditSession = useCallback(
    (
      deviceId: string,
      cameraName: string,
      startTime: number,
      stopReason: LiveSessionAuditRecord['stopReason'],
      durationSec: number,
      dataMb: number
    ) => {
      try {
        const stored = localStorage.getItem('falcon_live_view_sessions');
        const list: LiveSessionAuditRecord[] = stored ? JSON.parse(stored) : [];
        const record: LiveSessionAuditRecord = {
          id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          deviceId,
          cameraName: cameraName || deviceId,
          user: accountLabel || 'Current User',
          role: userRole,
          startedAt: new Date(startTime).toISOString(),
          stoppedAt: new Date().toISOString(),
          durationSeconds: durationSec,
          stopReason,
          estimatedDataMb: Math.round(dataMb * 10) / 10,
        };
        list.unshift(record);
        // Retain last 50 session audits
        localStorage.setItem('falcon_live_view_sessions', JSON.stringify(list.slice(0, 50)));
      } catch {
        // Safe fallback
      }
    },
    [accountLabel, userRole]
  );

  // Stop Stream internal implementation
  const stopStream = useCallback(
    (reason: LiveSessionAuditRecord['stopReason'] = 'user_stopped') => {
      if (connectingTimerRef.current) clearInterval(connectingTimerRef.current);
      if (connectingStepTimeoutRef.current) clearTimeout(connectingStepTimeoutRef.current);
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (promptCountdownTimerRef.current) clearInterval(promptCountdownTimerRef.current);

      setIsStillWatchingPromptOpen(false);
      setIsTalkActive(false);
      setIsPtzMoving(false);
      setActivePtzDirection(null);
      setIsTakingLonger(false);

      if (activeStreamingDeviceId && sessionStartTimeRef.current) {
        const elapsed = Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
        const estimatedMb = (DEFAULT_BITRATE_MBPS * 1000 * 1000 * elapsed) / (8 * 1024 * 1024);
        logAuditSession(
          activeStreamingDeviceId,
          activeCameraName,
          sessionStartTimeRef.current,
          reason,
          elapsed,
          estimatedMb
        );
      }

      sessionStartTimeRef.current = null;
      setStreamState('idle');
      setActiveStreamingDeviceId(null);

      // Notify other browser tabs
      try {
        broadcastChannelRef.current?.postMessage({
          type: 'STREAM_STOPPED',
          deviceId: activeStreamingDeviceId,
        });
      } catch {
        // BroadcastChannel optional
      }
    },
    [activeStreamingDeviceId, activeCameraName, logAuditSession]
  );

  // Reset inactivity timer on any interaction
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (promptCountdownTimerRef.current) clearInterval(promptCountdownTimerRef.current);
    setIsStillWatchingPromptOpen(false);

    inactivityTimerRef.current = setTimeout(() => {
      setIsStillWatchingPromptOpen(true);
      setInactivityRemainingSeconds(INACTIVITY_PROMPT_DURATION_SEC);

      let remaining = INACTIVITY_PROMPT_DURATION_SEC;
      promptCountdownTimerRef.current = setInterval(() => {
        remaining -= 1;
        setInactivityRemainingSeconds(remaining);
        if (remaining <= 0) {
          if (promptCountdownTimerRef.current) clearInterval(promptCountdownTimerRef.current);
          stopStream('inactivity');
          addToast(
            'info',
            'Live streaming disconnected after 10 minutes without interaction.',
            'Stream stopped due to inactivity'
          );
        }
      }, 1000);
    }, INACTIVITY_TIMEOUT_MS);
  }, [stopStream, addToast]);

  const confirmStillWatching = useCallback(() => {
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  // Start Stream implementation
  const startStream = useCallback(
    async (deviceId: string, cameraName?: string, isAutostart?: boolean) => {
      // Rule 4.7: RBAC permission check
      if (!permissions.canWatchLive) {
        setStreamState('failed');
        setFailureVariant('no_permission');
        setFailureMessage('You do not have permission to watch live video.');
        return;
      }

      // Rule 4.1 & 4.7: Single stream rule
      if (activeStreamingDeviceId && activeStreamingDeviceId !== deviceId) {
        const previousId = activeStreamingDeviceId;
        stopStream('camera_switched');
        addToast('info', `Switched stream to ${deviceId}`, `Stopped ${previousId}`);
      }

      setActiveStreamingDeviceId(deviceId);
      setActiveCameraName(cameraName || deviceId);
      setFailureVariant(null);
      setFailureMessage(null);
      setStreamState('connecting');
      setConnectionElapsedSeconds(0);
      setIsTakingLonger(false);
      setConnectingStep('Connecting to the camera through Edge...');

      // Notify other tabs to stop their streams
      try {
        broadcastChannelRef.current?.postMessage({
          type: 'STREAM_STARTED',
          deviceId,
        });
      } catch {
        // BroadcastChannel optional
      }

      // Start elapsed timer for connecting state
      let elapsed = 0;
      if (connectingTimerRef.current) clearInterval(connectingTimerRef.current);
      connectingTimerRef.current = setInterval(() => {
        elapsed += 1;
        setConnectionElapsedSeconds(elapsed);
        if (elapsed >= DEFAULT_TIMEOUT_SECONDS) {
          setIsTakingLonger(true);
        }
      }, 1000);

      // Staging device simulation & error mapping
      // DEV-004 and DEV-011 are offline
      if (deviceId === 'DEV-004' || deviceId === 'DEV-011') {
        setTimeout(() => {
          if (connectingTimerRef.current) clearInterval(connectingTimerRef.current);
          setStreamState('failed');
          setFailureVariant('camera_offline');
          setFailureMessage('The camera is offline. Last contact Oct 3, 2026, 2:14 PM MYT.');
        }, 800);
        return;
      }

      // DEV-002, DEV-003: Unregistered with vendor (vendor does not know this camera)
      if (deviceId === 'DEV-002' || deviceId === 'DEV-003') {
        setTimeout(() => {
          if (connectingTimerRef.current) clearInterval(connectingTimerRef.current);
          setStreamState('failed');
          setFailureVariant('vendor_unknown');
          setFailureMessage('This camera is not registered with the vendor.');
        }, 1100);
        return;
      }

      // DEV-013: Stale / Edge unreachable
      if (deviceId === 'DEV-013') {
        setTimeout(() => {
          if (connectingTimerRef.current) clearInterval(connectingTimerRef.current);
          setStreamState('failed');
          setFailureVariant('edge_timeout');
          setFailureMessage('Could not reach Edge.');
        }, 1500);
        return;
      }

      // Progressive connection steps for operational transparency
      connectingStepTimeoutRef.current = setTimeout(() => {
        setConnectingStep('Edge reached. Requesting RTSP feed...');

        connectingStepTimeoutRef.current = setTimeout(() => {
          setConnectingStep('Camera answered. Initializing video decoder...');

          connectingStepTimeoutRef.current = setTimeout(() => {
            if (connectingTimerRef.current) clearInterval(connectingTimerRef.current);
            sessionStartTimeRef.current = Date.now();
            setStreamState('live');
            setConnectingStep(null);
            setIsTakingLonger(false);

            if (isAutostart) {
              addToast(
                'info',
                'Started live telemetry via deep link intent.',
                `Streaming ${deviceId}`
              );
            }

            // Start stream telemetry ticker
            let streamElapsed = 0;
            if (streamTimerRef.current) clearInterval(streamTimerRef.current);
            streamTimerRef.current = setInterval(() => {
              streamElapsed += 1;
              const estimatedMb =
                (DEFAULT_BITRATE_MBPS * 1000 * 1000 * streamElapsed) / (8 * 1024 * 1024);
              setStreamStats({
                resolution: '1920x1080',
                bitrateMbps: DEFAULT_BITRATE_MBPS,
                latencyMs: 110 + Math.floor(Math.sin(streamElapsed) * 15),
                fps: 25,
                elapsedSeconds: streamElapsed,
                estimatedDataMb: Math.round(estimatedMb * 10) / 10,
              });
            }, 1000);

            // Arm safety inactivity timer
            resetInactivityTimer();
          }, 400);
        }, 400);
      }, 400);
    },
    [permissions.canWatchLive, activeStreamingDeviceId, stopStream, addToast, resetInactivityTimer]
  );

  const retryStream = useCallback(
    async (deviceId: string) => {
      await startStream(deviceId, activeCameraName, false);
    },
    [startStream, activeCameraName]
  );

  const cancelConnecting = useCallback(() => {
    stopStream('user_stopped');
  }, [stopStream]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(Math.max(0, Math.min(1, vol)));
    if (vol > 0) setIsMuted(false);
  }, []);

  // PTZ Control Actions (Capability & mute rules)
  const startPtz = useCallback(
    (direction: PtzDirection) => {
      if (!permissions.canUsePtz) {
        addToast(
          'error',
          permissions.ptzDisabledReason || 'Permission required to operate PTZ motor.',
          'PTZ Control Denied'
        );
        return;
      }
      setIsPtzMoving(true);
      setActivePtzDirection(direction);
      // Camera mutes its microphone while panning/tilting
      if (isTalkActive) {
        addToast(
          'info',
          'The camera mutes the microphone while it moves.',
          'Microphone Muted'
        );
      }
    },
    [permissions.canUsePtz, permissions.ptzDisabledReason, isTalkActive, addToast]
  );

  const stopPtz = useCallback(() => {
    setIsPtzMoving(false);
    setActivePtzDirection(null);
  }, []);

  // Talk Intercom Actions
  const startTalk = useCallback(async () => {
    if (!permissions.canUseTalk) {
      addToast(
        'error',
        permissions.talkDisabledReason || 'Permission required to transmit audio.',
        'Talk Intercom Denied'
      );
      return;
    }
    const pre = await checkTalkPreconditions();
    if (pre === 'blocked_https') {
      addToast(
        'error',
        'Talk needs a secure connection (HTTPS) to access the microphone.',
        'HTTPS Required'
      );
      return;
    }
    if (pre === 'blocked_mic') {
      const granted = await requestMicPermission();
      if (!granted) return;
    }
    setIsTalkActive(true);
  }, [permissions.canUseTalk, permissions.talkDisabledReason, checkTalkPreconditions, requestMicPermission, addToast]);

  const stopTalk = useCallback(() => {
    setIsTalkActive(false);
  }, []);

  const toggleTalk = useCallback(() => {
    if (isTalkActive) {
      stopTalk();
    } else {
      startTalk();
    }
  }, [isTalkActive, startTalk, stopTalk]);

  // Snapshot Capture Action
  const takeSnapshot = useCallback(
    (deviceId: string, videoElement?: HTMLVideoElement | null) => {
      if (!permissions.canTakeSnapshot) {
        addToast(
          'error',
          permissions.snapshotDisabledReason || 'Permission required to capture snapshots.',
          'Snapshot Denied'
        );
        return;
      }

      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (videoElement && videoElement.videoWidth > 0) {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          } else {
            // Draw placeholder telemetry background
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 36px monospace';
            ctx.fillText(`TM FALCON SNAPSHOT • ${deviceId}`, 80, 120);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '24px monospace';
            ctx.fillText(formatAbsoluteMYT(new Date()), 80, 180);
          }
          const nowStr = formatAbsoluteMYT(new Date())
            .replace(/[, :]/g, '_')
            .replace(/_+/g, '_');
          const filename = `${deviceId}_${nowStr}.png`;
          const a = document.createElement('a');
          a.download = filename;
          a.href = canvas.toDataURL('image/png');
          a.click();

          addToast('success', `Downloaded ${filename}`, 'Snapshot Saved');
        }
      } catch (err) {
        console.error('Snapshot failed', err);
        addToast('error', 'Could not capture frame from video stream.', 'Snapshot Failed');
      }
    },
    [permissions.canTakeSnapshot, permissions.snapshotDisabledReason, addToast]
  );

  // Hidden Page Auto-Stop (2 minutes safety rule)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (streamState === 'live') {
          hiddenTimerRef.current = setTimeout(() => {
            stopStream('page_hidden');
            addToast(
              'info',
              'The live stream stopped because the page was hidden for more than 2 minutes.',
              'Stream paused to save mobile data'
            );
          }, HIDDEN_PAGE_TIMEOUT_MS);
        }
      } else {
        if (hiddenTimerRef.current) {
          clearTimeout(hiddenTimerRef.current);
          hiddenTimerRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (hiddenTimerRef.current) clearTimeout(hiddenTimerRef.current);
    };
  }, [streamState, stopStream, addToast]);

  // Window beforeunload / unmount safety
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (streamState === 'live') {
        stopStream('tab_closed');
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (streamState === 'live') {
        stopStream('page_unmount');
      }
    };
  }, [streamState, stopStream]);

  // Cross-Tab Single Stream Sync via BroadcastChannel
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('falcon_live_stream');
      broadcastChannelRef.current = bc;
      bc.onmessage = (event) => {
        if (event.data?.type === 'STREAM_STARTED') {
          if (activeStreamingDeviceId && activeStreamingDeviceId !== event.data.deviceId) {
            stopStream('camera_switched');
            addToast(
              'info',
              `Viewing switched to ${event.data.deviceId} on another window.`,
              'Stream stopped on this tab'
            );
          }
        }
      };
      return () => {
        bc.close();
      };
    }
  }, [activeStreamingDeviceId, stopStream, addToast]);

  // Activity listeners to reset inactivity timeout
  useEffect(() => {
    if (streamState !== 'live') return;
    const handleUserActivity = () => {
      resetInactivityTimer();
    };
    window.addEventListener('pointermove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    return () => {
      window.removeEventListener('pointermove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
    };
  }, [streamState, resetInactivityTimer]);

  const value = {
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
    isPtzMoving,
    activePtzDirection,
    talkPrecondition,
    isTalkActive,
    isTalkToggleMode,
    isStillWatchingPromptOpen,
    inactivityRemainingSeconds,
    userRole,
    startStream,
    stopStream,
    retryStream,
    cancelConnecting,
    toggleMute,
    setVolume,
    startPtz,
    stopPtz,
    startTalk,
    stopTalk,
    toggleTalk,
    setTalkToggleMode: setIsTalkToggleMode,
    requestMicPermission,
    confirmStillWatching,
    takeSnapshot,
  };

  return <LiveStreamContext.Provider value={value}>{children}</LiveStreamContext.Provider>;
};

export const useLiveStream = (): LiveStreamContextValue => {
  const ctx = useContext(LiveStreamContext);
  if (!ctx) {
    throw new Error('useLiveStream must be used within a LiveStreamProvider');
  }
  return ctx;
};
