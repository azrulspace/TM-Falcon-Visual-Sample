import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';
import {
  type UiModeSetting,
  type ResolvedUiMode,
  type ScreenOrientation,
  computeAutoUiMode,
  UI_MODE_STORAGE_KEY,
  UI_MODE_AUTO_TOAST_KEY,
} from '@/lib/uiMode';

export type { UiModeSetting, ResolvedUiMode, ScreenOrientation };
export { computeAutoUiMode };

export interface PreviewFrameState {
  isOpen: boolean;
  width: number;
  height: number;
  orientation: ScreenOrientation;
}

export interface UiModeContextValue {
  modeSetting: UiModeSetting;
  setModeSetting: (setting: UiModeSetting) => void;
  resolvedMode: ResolvedUiMode;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: ScreenOrientation;
  isCoarse: boolean;
  viewportWidth: number;
  viewportHeight: number;
  previewFrame: PreviewFrameState | null;
  openPreviewFrame: (orientation: ScreenOrientation) => void;
  closePreviewFrame: () => void;
}

const UiModeContext = createContext<UiModeContextValue | undefined>(undefined);

export const UiModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check URL override for iframe previews (e.g. ?forceUiMode=tablet)
  const urlOverride = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('forceUiMode') as UiModeSetting | null
    : null;

  const [modeSetting, setModeSettingState] = useState<UiModeSetting>(() => {
    if (urlOverride === 'tablet' || urlOverride === 'desktop' || urlOverride === 'auto') {
      return urlOverride;
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(UI_MODE_STORAGE_KEY);
      if (saved === 'tablet' || saved === 'desktop' || saved === 'auto') {
        return saved;
      }
    }
    return 'auto';
  });

  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1440
  );
  const [viewportHeight, setViewportHeight] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerHeight : 900
  );
  const [isCoarse, setIsCoarse] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia('(pointer: coarse)').matches : false
  );

  const [previewFrame, setPreviewFrame] = useState<PreviewFrameState | null>(null);
  const { addToast } = useToast();

  // Listen to viewport resizing and pointer coarse changes
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };

    const coarseQuery = window.matchMedia('(pointer: coarse)');
    const handleCoarseChange = (e: MediaQueryListEvent) => {
      setIsCoarse(e.matches);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    coarseQuery.addEventListener('change', handleCoarseChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      coarseQuery.removeEventListener('change', handleCoarseChange);
    };
  }, []);

  // Compute resolved mode: 'tablet' vs 'desktop'
  const resolvedMode: ResolvedUiMode = useMemoResolvedMode(modeSetting, viewportWidth, isCoarse);
  const orientation: ScreenOrientation = viewportWidth >= viewportHeight ? 'landscape' : 'portrait';

  // Apply data-ui-mode and data-orientation attributes to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-ui-mode', resolvedMode);
    root.setAttribute('data-orientation', orientation);

    return () => {
      // Cleanup attributes if unmounted
    };
  }, [resolvedMode, orientation]);

  // Toast notification when Auto enables tablet mode on first visit
  useEffect(() => {
    if (modeSetting === 'auto' && resolvedMode === 'tablet') {
      const alreadyToasted = localStorage.getItem(UI_MODE_AUTO_TOAST_KEY);
      if (!alreadyToasted) {
        localStorage.setItem(UI_MODE_AUTO_TOAST_KEY, 'true');
        addToast(
          'info',
          'Tablet mode has been automatically enabled for your touch screen.',
          'Tablet mode is on'
        );
      }
    }
  }, [modeSetting, resolvedMode, addToast]);

  const setModeSetting = useCallback((setting: UiModeSetting) => {
    setModeSettingState(setting);
    if (typeof window !== 'undefined') {
      localStorage.setItem(UI_MODE_STORAGE_KEY, setting);
    }
  }, []);

  const openPreviewFrame = useCallback((orient: ScreenOrientation) => {
    if (orient === 'landscape') {
      setPreviewFrame({
        isOpen: true,
        width: 1180,
        height: 820,
        orientation: 'landscape',
      });
    } else {
      setPreviewFrame({
        isOpen: true,
        width: 820,
        height: 1180,
        orientation: 'portrait',
      });
    }
  }, []);

  const closePreviewFrame = useCallback(() => {
    setPreviewFrame(null);
  }, []);

  const isTablet = resolvedMode === 'tablet';
  const isDesktop = resolvedMode === 'desktop';

  return (
    <UiModeContext.Provider
      value={{
        modeSetting,
        setModeSetting,
        resolvedMode,
        isTablet,
        isDesktop,
        orientation,
        isCoarse,
        viewportWidth,
        viewportHeight,
        previewFrame,
        openPreviewFrame,
        closePreviewFrame,
      }}
    >
      {children}
    </UiModeContext.Provider>
  );
};

function useMemoResolvedMode(setting: UiModeSetting, width: number, isCoarse: boolean): ResolvedUiMode {
  if (setting === 'tablet') return 'tablet';
  if (setting === 'desktop') return 'desktop';
  return computeAutoUiMode(width, isCoarse);
}

export function useUiMode(): UiModeContextValue {
  const context = useContext(UiModeContext);
  if (!context) {
    throw new Error('useUiMode must be used within an UiModeProvider');
  }
  return context;
}
