import type { UserRole } from '@/lib/permissions';
import type { LiveFailureVariant } from '@/types/live';
import type { DeviceConnectivityState } from '@/types/devices';

/**
 * Preview Configuration and Reviewer Session Overrides.
 * Stored strictly in sessionStorage to avoid bleeding into persistent app data.
 */

const STORAGE_KEY_PREVIEW_OVERRIDES = 'falcon_preview_session_overrides';

export interface PreviewSessionState {
  enabled: boolean;
  cameraStateOverrides: Record<string, DeviceConnectivityState>;
  nextStartResult: 'success' | LiveFailureVariant;
  fastTimers: boolean;
  roleOverride: UserRole | null;
  viewingSessionsRecorded: boolean;
  groupsApiAvailable: boolean;
  simulateInsecureHttp: boolean;
}

const DEFAULT_PREVIEW_SESSION_STATE: PreviewSessionState = {
  enabled: true,
  cameraStateOverrides: {},
  nextStartResult: 'success',
  fastTimers: false,
  roleOverride: null,
  viewingSessionsRecorded: true,
  groupsApiAvailable: true,
  simulateInsecureHttp: false,
};

/**
 * Check if the explicit preview/demo mode is active.
 * Excluded or returns false in production environments.
 */
export function isLivePreviewEnabled(): boolean {
  // If in production build, preview is strictly disabled
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD) {
    return false;
  }
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return false;
  }

  if (typeof window === 'undefined') {
    return true;
  }

  // URL overrides: ?demo=online / ?demo=false / ?preview=true / ?preview=false
  const params = new URLSearchParams(window.location.search);
  if (params.get('demo') === 'false' || params.get('demo') === 'off' || params.get('preview') === 'false') {
    return false;
  }
  if (params.get('demo') === 'online' || params.get('demo') === 'true' || params.get('preview') === 'true') {
    return true;
  }

  const session = getPreviewSessionState();
  return session.enabled;
}

/**
 * Toggle preview / demo mode on and off.
 * Dispatches event so all mounted components update immediately.
 */
export function toggleLivePreviewMode(): boolean {
  const current = getPreviewSessionState();
  const nextEnabled = !current.enabled;
  setPreviewSessionState({ enabled: nextEnabled });
  return nextEnabled;
}

export function getPreviewSessionState(): PreviewSessionState {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_PREVIEW_SESSION_STATE };
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_PREVIEW_OVERRIDES);
    if (!raw) return { ...DEFAULT_PREVIEW_SESSION_STATE };
    return {
      ...DEFAULT_PREVIEW_SESSION_STATE,
      ...JSON.parse(raw),
    };
  } catch {
    return { ...DEFAULT_PREVIEW_SESSION_STATE };
  }
}

export function setPreviewSessionState(updater: Partial<PreviewSessionState> | ((prev: PreviewSessionState) => PreviewSessionState)): void {
  if (typeof window === 'undefined') return;

  const current = getPreviewSessionState();
  const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
  try {
    sessionStorage.setItem(STORAGE_KEY_PREVIEW_OVERRIDES, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('falcon-preview-state-changed', { detail: next }));
  } catch {
    // sessionStorage quota or error
  }
}

export function resetPreviewSessionState(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY_PREVIEW_OVERRIDES);
    window.dispatchEvent(new CustomEvent('falcon-preview-state-changed', { detail: DEFAULT_PREVIEW_SESSION_STATE }));
  } catch {
    // ignore
  }
}
