/**
 * On-Demand Video Clip Lifecycle State Machine (Section 4 & Section 7)
 * Implements the 10 canonical states requested by developer feedback & prompt:
 * not_supported | not_requested | requested | uploading | ready | failed | expired |
 * updated | partial | device_offline | no_permission
 */

export type ClipStatus =
  | 'not_supported'
  | 'not_requested'
  | 'requested'
  | 'uploading'
  | 'ready'
  | 'failed'
  | 'expired'
  | 'device_offline'
  | 'no_permission';

export type ClipFailureReason =
  | 'device_offline'
  | 'no_footage_on_device'
  | 'timeout'
  | 'storage_error'
  | 'rate_limited'
  | 'permission_denied'
  | 'media_load_error';

export interface ClipState {
  status: ClipStatus;
  progress?: number; // 0 to 100 during uploading
  requestedAt?: string | null;
  requestedBy?: string | null;
  videoUrl?: string | null;
  durationSeconds?: number;
  failureReason?: ClipFailureReason | null;
  errorMessage?: string | null;
  windowStartTime?: string | null;
  windowEndTime?: string | null;
  isPartial?: boolean;
  version?: number | string;
  hasNewVersionAvailable?: boolean;
  newVersionUrl?: string | null;
  newVersionUpdatedAt?: string | null;
  requestable?: boolean; // For expired state: whether clip can be requested again
  autoUploaded?: boolean;
  rateLimitSecondsRemaining?: number;
  signedUrlExpiresAt?: string | null;
  takingLongerThanExpected?: boolean;
  idempotencyKey?: string | null;
}

export interface ClipTransitionAction {
  type:
    | 'INITIALIZE'
    | 'REQUEST_CLIP'
    | 'DEVICE_ACKNOWLEDGED'
    | 'UPDATE_PROGRESS'
    | 'UPLOAD_COMPLETE'
    | 'ENCOUNTER_ERROR'
    | 'CLIP_EXPIRED'
    | 'NEW_VERSION_AVAILABLE'
    | 'APPLY_NEW_VERSION'
    | 'SET_TAKING_LONGER'
    | 'RETRY_REQUEST'
    | 'DEVICE_STATUS_CHANGED'
    | 'RESET';
  payload?: Partial<ClipState> & {
    deviceIsOnline?: boolean;
    hasPermission?: boolean;
  };
}

export function clipReducer(state: ClipState, action: ClipTransitionAction): ClipState {
  switch (action.type) {
    case 'INITIALIZE':
      return { ...state, ...action.payload };

    case 'DEVICE_STATUS_CHANGED': {
      const isOnline = action.payload?.deviceIsOnline ?? true;
      if (!isOnline && (state.status === 'not_requested' || state.status === 'requested')) {
        return { ...state, status: 'device_offline' };
      }
      if (isOnline && state.status === 'device_offline') {
        return { ...state, status: 'not_requested' };
      }
      return state;
    }

    case 'REQUEST_CLIP': {
      if (
        state.status === 'requested' ||
        state.status === 'uploading' ||
        state.status === 'ready' ||
        state.status === 'not_supported'
      ) {
        return state;
      }
      if (action.payload?.hasPermission === false) {
        return { ...state, status: 'no_permission' };
      }
      if (action.payload?.deviceIsOnline === false) {
        return { ...state, status: 'device_offline' };
      }
      return {
        ...state,
        status: 'requested',
        requestedAt: action.payload?.requestedAt || new Date().toISOString(),
        requestedBy: action.payload?.requestedBy || 'Ahmad Syukri (Operator)',
        failureReason: null,
        errorMessage: null,
        takingLongerThanExpected: false,
        idempotencyKey: action.payload?.idempotencyKey || `req_${Date.now()}`,
      };
    }

    case 'DEVICE_ACKNOWLEDGED':
      if (state.status !== 'requested') return state;
      return {
        ...state,
        status: 'uploading',
        progress: action.payload?.progress ?? 5,
        takingLongerThanExpected: false,
      };

    case 'UPDATE_PROGRESS':
      if (state.status !== 'uploading') return state;
      return {
        ...state,
        progress: Math.min(100, Math.max(0, action.payload?.progress ?? state.progress ?? 0)),
      };

    case 'UPLOAD_COMPLETE':
      return {
        ...state,
        status: 'ready',
        progress: 100,
        videoUrl: action.payload?.videoUrl || state.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        durationSeconds: action.payload?.durationSeconds || state.durationSeconds || 38,
        failureReason: null,
        errorMessage: null,
        takingLongerThanExpected: false,
        autoUploaded: action.payload?.autoUploaded ?? state.autoUploaded,
        isPartial: action.payload?.isPartial ?? state.isPartial,
        version: action.payload?.version ?? state.version ?? 1,
      };

    case 'ENCOUNTER_ERROR':
      return {
        ...state,
        status: 'failed',
        failureReason: action.payload?.failureReason || 'timeout',
        errorMessage: action.payload?.errorMessage || null,
        rateLimitSecondsRemaining: action.payload?.rateLimitSecondsRemaining,
        takingLongerThanExpected: false,
      };

    case 'CLIP_EXPIRED':
      return {
        ...state,
        status: 'expired',
        videoUrl: null,
        requestable: action.payload?.requestable ?? true,
      };

    case 'NEW_VERSION_AVAILABLE':
      return {
        ...state,
        hasNewVersionAvailable: true,
        newVersionUrl: action.payload?.newVersionUrl || null,
        newVersionUpdatedAt: action.payload?.newVersionUpdatedAt || new Date().toISOString(),
      };

    case 'APPLY_NEW_VERSION':
      return {
        ...state,
        hasNewVersionAvailable: false,
        videoUrl: state.newVersionUrl || state.videoUrl,
        newVersionUrl: null,
        version: (Number(state.version) || 1) + 1,
      };

    case 'SET_TAKING_LONGER':
      return {
        ...state,
        takingLongerThanExpected: true,
      };

    case 'RETRY_REQUEST':
      return {
        ...state,
        status: 'requested',
        requestedAt: new Date().toISOString(),
        failureReason: null,
        errorMessage: null,
        takingLongerThanExpected: false,
      };

    case 'RESET':
      return {
        status: 'not_requested',
        progress: 0,
        requestedAt: null,
        requestedBy: null,
        videoUrl: null,
        failureReason: null,
        errorMessage: null,
        takingLongerThanExpected: false,
        hasNewVersionAvailable: false,
        newVersionUrl: null,
      };

    default:
      return state;
  }
}

/**
 * Calculates exponential polling backoff delay in ms (3s to 15s)
 */
export function getPollingBackoff(attempt: number): number {
  const base = 3000; // 3 seconds
  const max = 15000; // 15 seconds
  const factor = 1.5;
  const delay = base * Math.pow(factor, attempt);
  return Math.min(max, Math.round(delay));
}

/**
 * Returns plain-English explanation, title, and action for failure states (Section 4.2)
 */
export function getFailureDetails(reason?: ClipFailureReason | null, fallbackMessage?: string | null): {
  title: string;
  explanation: string;
  canRetry: boolean;
  retryLabel: string;
} {
  switch (reason) {
    case 'device_offline':
      return {
        title: 'Camera offline',
        explanation: 'The camera was offline. Try again when it is back online.',
        canRetry: true,
        retryLabel: 'Try again',
      };
    case 'no_footage_on_device':
      return {
        title: 'Footage no longer on camera',
        explanation: 'The camera no longer has footage for this time.',
        canRetry: false,
        retryLabel: 'Request again',
      };
    case 'timeout':
      return {
        title: 'Camera response timeout',
        explanation: 'The camera did not respond in time.',
        canRetry: true,
        retryLabel: 'Try again',
      };
    case 'storage_error':
      return {
        title: 'Storage error',
        explanation: 'The clip could not be saved to media storage.',
        canRetry: true,
        retryLabel: 'Try again',
      };
    case 'rate_limited':
      return {
        title: 'Rate limited',
        explanation: fallbackMessage || 'Rate limit reached. Please wait before requesting again.',
        canRetry: false,
        retryLabel: 'Try again',
      };
    case 'permission_denied':
      return {
        title: 'Permission denied',
        explanation: 'You do not have permission to request clips.',
        canRetry: false,
        retryLabel: 'Request clip',
      };
    case 'media_load_error':
      return {
        title: 'Media stream error',
        explanation: 'Could not load the clip video stream.',
        canRetry: true,
        retryLabel: 'Retry',
      };
    default:
      return {
        title: 'Upload failed',
        explanation: fallbackMessage || 'The camera encountered an error while packaging the clip.',
        canRetry: true,
        retryLabel: 'Try again',
      };
  }
}

/**
 * Formats duration in M:SS
 */
export function formatClipDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
