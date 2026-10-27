import { useReducer, useEffect, useRef, useCallback } from 'react';
import {
  clipReducer,
  getPollingBackoff,
  type ClipState,
  type ClipStatus,
} from '@/components/evidence/clipStateMachine';

export interface UseClipLifecycleOptions {
  eventId: string;
  initialState?: Partial<ClipState>;
  deviceIsOnline?: boolean;
  deviceSupportsVideo?: boolean;
  hasPermission?: boolean;
  previewForcedStatus?: ClipStatus | null;
  onClipReadyToast?: () => void;
}

export function useClipLifecycle({
  eventId,
  initialState,
  deviceIsOnline = true,
  deviceSupportsVideo = true,
  hasPermission = true,
  previewForcedStatus = null,
  onClipReadyToast,
}: UseClipLifecycleOptions) {
  // Determine canonical starting status
  const startingStatus: ClipStatus = !deviceSupportsVideo
    ? 'not_supported'
    : !deviceIsOnline
    ? 'device_offline'
    : !hasPermission
    ? 'no_permission'
    : initialState?.status || 'not_requested';

  const [clipState, dispatch] = useReducer(clipReducer, {
    status: startingStatus,
    progress: initialState?.progress ?? 0,
    requestedAt: initialState?.requestedAt ?? null,
    requestedBy: initialState?.requestedBy ?? null,
    videoUrl: initialState?.videoUrl ?? null,
    durationSeconds: initialState?.durationSeconds ?? 38,
    failureReason: initialState?.failureReason ?? null,
    errorMessage: initialState?.errorMessage ?? null,
    windowStartTime: initialState?.windowStartTime ?? '10:30:41 PM',
    windowEndTime: initialState?.windowEndTime ?? '10:31:19 PM',
    isPartial: initialState?.isPartial ?? false,
    version: initialState?.version ?? 1,
    hasNewVersionAvailable: false,
    requestable: initialState?.requestable ?? true,
    autoUploaded: initialState?.autoUploaded ?? false,
    takingLongerThanExpected: false,
  });

  // Track polling attempt & timer
  const pollAttemptRef = useRef(0);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Sync device online/offline status changes
  useEffect(() => {
    dispatch({
      type: 'DEVICE_STATUS_CHANGED',
      payload: { deviceIsOnline },
    });
  }, [deviceIsOnline]);

  // Handle preview forced status if dev preview flag is active
  useEffect(() => {
    if (previewForcedStatus) {
      if (previewForcedStatus === 'ready') {
        dispatch({
          type: 'UPLOAD_COMPLETE',
          payload: {
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            durationSeconds: 38,
          },
        });
      } else if (previewForcedStatus === 'failed') {
        dispatch({
          type: 'ENCOUNTER_ERROR',
          payload: { failureReason: 'timeout', errorMessage: 'Camera did not respond in time' },
        });
      } else if (previewForcedStatus === 'expired') {
        dispatch({ type: 'CLIP_EXPIRED', payload: { requestable: true } });
      } else if (previewForcedStatus === 'uploading') {
        dispatch({ type: 'INITIALIZE', payload: { status: 'uploading', progress: 45 } });
      } else {
        dispatch({ type: 'INITIALIZE', payload: { status: previewForcedStatus } });
      }
    }
  }, [previewForcedStatus]);

  // Polling with backoff and document visibility handling
  useEffect(() => {
    const isPollingActive = clipState.status === 'requested' || clipState.status === 'uploading';

    if (!isPollingActive) {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      pollAttemptRef.current = 0;
      startTimeRef.current = null;
      return;
    }

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
      // Set 45-second timeout window for "taking longer than expected"
      timeoutTimerRef.current = setTimeout(() => {
        dispatch({ type: 'SET_TAKING_LONGER' });
      }, 45000);
    }

    const executePoll = () => {
      // Pause if tab is hidden
      if (document.visibilityState === 'hidden') {
        return;
      }

      const delay = getPollingBackoff(pollAttemptRef.current);
      pollTimerRef.current = setTimeout(() => {
        // Mock progressive upload transitions
        if (clipState.status === 'requested') {
          dispatch({ type: 'DEVICE_ACKNOWLEDGED', payload: { progress: 15 } });
        } else if (clipState.status === 'uploading') {
          const currentProgress = clipState.progress || 15;
          if (currentProgress < 85) {
            dispatch({ type: 'UPDATE_PROGRESS', payload: { progress: currentProgress + 35 } });
          } else {
            dispatch({
              type: 'UPLOAD_COMPLETE',
              payload: {
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                durationSeconds: 38,
              },
            });
            if (onClipReadyToast) onClipReadyToast();
          }
        }
        pollAttemptRef.current += 1;
      }, delay);
    };

    executePoll();

    // Listen to tab visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab resumed, immediately trigger next poll
        executePoll();
      } else {
        // Tab hidden, clear timer to pause polling
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clipState.status, clipState.progress, onClipReadyToast]);

  const requestClip = useCallback(() => {
    dispatch({
      type: 'REQUEST_CLIP',
      payload: {
        hasPermission,
        deviceIsOnline,
        requestedBy: 'Ahmad Syukri (Operator)',
        requestedAt: new Date().toISOString(),
        idempotencyKey: `req_${eventId}_${Date.now()}`,
      },
    });
  }, [eventId, hasPermission, deviceIsOnline]);

  const retryRequest = useCallback(() => {
    dispatch({ type: 'RETRY_REQUEST' });
  }, []);

  const applyNewVersion = useCallback(() => {
    dispatch({ type: 'APPLY_NEW_VERSION' });
  }, []);

  return {
    clipState,
    dispatch,
    requestClip,
    retryRequest,
    applyNewVersion,
  };
}
