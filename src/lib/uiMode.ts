export type UiModeSetting = 'auto' | 'tablet' | 'desktop';
export type ResolvedUiMode = 'tablet' | 'desktop';
export type ScreenOrientation = 'landscape' | 'portrait';

export const UI_MODE_STORAGE_KEY = 'falcon_ui_mode';
export const UI_MODE_AUTO_TOAST_KEY = 'falcon_ui_mode_auto_toasted';

/**
 * Computes the resolved UI mode based on viewport width and coarse pointer detection.
 * Spec 3.2:
 * - Auto rule: tablet mode is on when the primary pointer is coarse (touch) and the viewport
 *   width is between 768 and 1366 px, or when the width is between 768 and 1024 px regardless
 *   of the pointer.
 * - Phones (below 768 px) keep the phone rules from earlier responsive specs and do not force tablet mode.
 */
export function computeAutoUiMode(width: number, isCoarse: boolean): ResolvedUiMode {
  // Phones (< 768px) keep phone rules and do not force tablet mode
  if (width < 768) return 'desktop';
  // Between 768 and 1024px regardless of pointer -> tablet
  if (width >= 768 && width <= 1024) return 'tablet';
  // Between 768 and 1366px with coarse pointer -> tablet
  if (width >= 768 && width <= 1366 && isCoarse) return 'tablet';
  // Standard desktop otherwise
  return 'desktop';
}
