/**
 * On-Demand Clip Lifecycle State Machine (Section 7)
 * Implements the 8 canonical states requested by the developer feedback:
 * not_supported | not_requested | requested | uploading | ready | failed | expired | offline_or_forbidden
 */

export type ClipStatus =
  | 'not_supported'
  | 'not_requested'
  | 'requested'
  | 'uploading'
  | 'ready'
  | 'failed'
  | 'expired'
  | 'offline_or_forbidden';

export interface ClipState {
  status: ClipStatus;
  progress?: number; // 0 to 100 during uploading
  requestedAt?: string | null;
  requestedBy?: string | null;
  videoUrl?: string | null;
  durationSeconds?: number;
  errorMessage?: string | null;
  windowStartTime?: string | null;
  windowEndTime?: string | null;
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
    | 'RESET';
  payload?: Partial<ClipState>;
}

export function clipReducer(state: ClipState, action: ClipTransitionAction): ClipState {
  switch (action.type) {
    case 'INITIALIZE':
      return { ...state, ...action.payload };

    case 'REQUEST_CLIP':
      if (state.status !== 'not_requested' && state.status !== 'failed') return state;
      return {
        ...state,
        status: 'requested',
        requestedAt: action.payload?.requestedAt || new Date().toISOString(),
        requestedBy: action.payload?.requestedBy || 'Current user',
        errorMessage: null,
      };

    case 'DEVICE_ACKNOWLEDGED':
      if (state.status !== 'requested') return state;
      return {
        ...state,
        status: 'uploading',
        progress: action.payload?.progress ?? 5,
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
        videoUrl: action.payload?.videoUrl || state.videoUrl,
        durationSeconds: action.payload?.durationSeconds || 38,
      };

    case 'ENCOUNTER_ERROR':
      return {
        ...state,
        status: 'failed',
        errorMessage: action.payload?.errorMessage || 'Upload timed out or device unreachable',
      };

    case 'CLIP_EXPIRED':
      return {
        ...state,
        status: 'expired',
        videoUrl: null,
      };

    case 'RESET':
      return {
        status: 'not_requested',
        progress: 0,
        requestedAt: null,
        requestedBy: null,
        videoUrl: null,
        errorMessage: null,
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
