import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { devices as initialDevices } from '@/data/devices';
import { formatId } from '@/lib/utils';
import {
  type EntityType,
  type SelectedEntity,
  type ResolvedEntityData,
  resolveEntityData,
  parseSelectionFromUrl,
} from '@/lib/selection';
import type { LayerVisibility } from '@/components/overview/LayerRail';

export type KpiFilter = 'all' | 'online' | 'offline' | 'stale' | 'attention';

export interface OverviewContextType {
  // Device & KPI filters
  kpiFilter: KpiFilter;
  setKpiFilter: (filter: KpiFilter) => void;
  clearKpiFilters: () => void;

  // Selection (Backward compatible + Rich Entity Controller)
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selectedEntity: SelectedEntity | null;
  resolvedEntity: ResolvedEntityData | null;
  selectEntity: (
    type: EntityType,
    id: string | null,
    options?: { fly?: boolean; source?: 'panel' | 'map' | 'url' | 'search'; openPanel?: boolean }
  ) => void;
  clearSelection: () => void;

  // Popup state
  activePopup: {
    type: EntityType;
    id: string;
    unlocated?: boolean;
    data: ResolvedEntityData;
  } | null;
  setActivePopup: (popup: { type: EntityType; id: string; unlocated?: boolean; data: ResolvedEntityData } | null) => void;
  closePopup: () => void;

  // Panel state: 'attention' | 'assets' | null (One at a time, collapsed by default)
  activePanel: 'attention' | 'assets' | null;
  setActivePanel: React.Dispatch<React.SetStateAction<'attention' | 'assets' | null>>;
  togglePanel: (panel: 'attention' | 'assets') => void;

  // Map layers
  activeLayers: LayerVisibility;
  setActiveLayers: React.Dispatch<React.SetStateAction<LayerVisibility>>;
  toggleLayer: (key: keyof LayerVisibility) => void;
  resetLayers: () => void;

  // Notifications/Toasts (e.g. "Devices layer turned on to show DEV-001")
  toastNotification: string | null;
  setToastNotification: (msg: string | null) => void;

  // Fly-to camera signal
  flyToSignal: {
    id: string;
    type: EntityType;
    coordinates: { x: number; y: number } | null;
    timestamp: number;
  } | null;

  // Asset class pulse (Poles, Cable routes, Cameras, Sites)
  activeAssetPulse: string | null;
  triggerAssetPulse: (assetClass: 'poles' | 'cables' | 'cameras' | 'sites') => void;

  // Calculated single source of truth counts
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  staleDevices: number;
  attentionDevices: number;

  // Asset counts
  polesCount: number;
  cablesLengthKm: number;
  camerasCount: number;
  sitesCount: number;
  totalFeaturesCount: number; // 238 = 120 poles + 114 cables + 4 devices

  // Time & Live simulation state
  timeMode: 'Active now' | 'History';
  setTimeMode: (mode: 'Active now' | 'History') => void;
  historyRange: string;
  setHistoryRange: (range: string) => void;
  scrubPercent: number;
  setScrubPercent: (val: number) => void;

  // Live data feed
  liveState: 'live' | 'paused';
  setLiveState: (state: 'live' | 'paused') => void;
  refreshInterval: number; // in seconds
  setRefreshInterval: (seconds: number) => void;
  lastUpdatedTime: string;
  lastFetchTimestamp: number;
  refreshNow: () => void;
  isShimmering: boolean;
}

const OverviewContext = createContext<OverviewContextType | undefined>(undefined);

export const OverviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [kpiFilter, setKpiFilterState] = useState<KpiFilter>('all');
  const [selectedId, setSelectedIdState] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
  const [resolvedEntity, setResolvedEntity] = useState<ResolvedEntityData | null>(null);
  const [activePopup, setActivePopup] = useState<{
    type: EntityType;
    id: string;
    unlocated?: boolean;
    data: ResolvedEntityData;
  } | null>(null);

  // Floating Icon Stack Panel State: Default collapsed (null), remembered in localStorage
  const [activePanel, setActivePanelState] = useState<'attention' | 'assets' | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('falcon_overview_active_panel');
      if (saved === 'attention' || saved === 'assets') {
        // Return null for initial load per prompt: "a first visit starts collapsed"
        // But if explicitly saved and needed:
        return null;
      }
    }
    return null;
  });

  const setActivePanel: React.Dispatch<React.SetStateAction<'attention' | 'assets' | null>> = useCallback(
    (action) => {
      setActivePanelState((prev) => {
        const next = typeof action === 'function' ? action(prev) : action;
        if (typeof window !== 'undefined') {
          if (next) localStorage.setItem('falcon_overview_active_panel', next);
          else localStorage.removeItem('falcon_overview_active_panel');
        }
        return next;
      });
    },
    []
  );

  const togglePanel = useCallback(
    (panel: 'attention' | 'assets') => {
      setActivePanel((current) => (current === panel ? null : panel));
    },
    [setActivePanel]
  );

  // Active layers
  const [activeLayers, setActiveLayers] = useState<LayerVisibility>({
    events: true,
    devices: true,
    poles: true,
    cableRoutes: true,
    cctv: true,
    sites: true,
  });

  const toggleLayer = useCallback((key: keyof LayerVisibility) => {
    setActiveLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const resetLayers = useCallback(() => {
    setActiveLayers({
      events: true,
      devices: true,
      poles: true,
      cableRoutes: true,
      cctv: true,
      sites: true,
    });
  }, []);

  const [toastNotification, setToastNotification] = useState<string | null>(null);
  const [flyToSignal, setFlyToSignal] = useState<{
    id: string;
    type: EntityType;
    coordinates: { x: number; y: number } | null;
    timestamp: number;
  } | null>(null);

  const [activeAssetPulse, setActiveAssetPulse] = useState<string | null>(null);
  const [timeMode, setTimeMode] = useState<'Active now' | 'History'>('Active now');
  const [historyRange, setHistoryRange] = useState<string>('Last 24 hours');
  const [scrubPercent, setScrubPercent] = useState<number>(100);

  const [liveState, setLiveState] = useState<'live' | 'paused'>('live');
  const [refreshInterval, setRefreshInterval] = useState<number>(15);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('5 min ago');
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState<number>(() => Date.now() - 5000);
  const [isShimmering, setIsShimmering] = useState<boolean>(false);

  // Single source of truth counts
  const totalDevices = initialDevices.length; // 15
  const onlineDevices = useMemo(() => initialDevices.filter((d) => d.status.toLowerCase() === 'online').length, []); // 11
  const offlineDevices = useMemo(() => initialDevices.filter((d) => d.status.toLowerCase() === 'offline').length, []); // 2
  const staleDevices = useMemo(() => initialDevices.filter((d) => d.status.toLowerCase() === 'stale').length, []); // 2
  const attentionDevices = offlineDevices + staleDevices; // 4

  // Asset counts matching staging
  const polesCount = 120; // 120 Poles
  const cablesLengthKm = 114; // 114 Cable spans
  const camerasCount = 6;
  const sitesCount = 4;
  const totalFeaturesCount = 238; // 120 poles + 114 cables + 4 devices = 238 Assets & devices

  const setKpiFilter = useCallback((filter: KpiFilter) => {
    setKpiFilterState((prev) => (prev === filter ? 'all' : filter));
  }, []);

  const clearKpiFilters = useCallback(() => {
    setKpiFilterState('all');
  }, []);

  // Shared selectEntity implementation
  const selectEntity = useCallback(
    (
      type: EntityType,
      id: string | null,
      options?: { fly?: boolean; source?: 'panel' | 'map' | 'url' | 'search'; openPanel?: boolean }
    ) => {
      if (!id) {
        setSelectedIdState(null);
        setSelectedEntity(null);
        setResolvedEntity(null);
        setActivePopup(null);
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('type');
          url.searchParams.delete('id');
          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
        }
        return;
      }

      const formattedId = formatId(id);
      const rawId = id.replace(/-/g, '_');
      const resolved = resolveEntityData(type, id);

      setSelectedIdState(rawId);
      setSelectedEntity({ type, id: formattedId, rawId });
      setResolvedEntity(resolved);

      // Check layer visibility: if layer is turned off, turn it on for the session and toast
      if (type === 'device' && !activeLayers.devices) {
        setActiveLayers((prev) => ({ ...prev, devices: true }));
        setToastNotification(`Devices layer turned on to show ${formattedId}`);
      } else if (type === 'event' && !activeLayers.events) {
        setActiveLayers((prev) => ({ ...prev, events: true }));
        setToastNotification(`Events layer turned on to show ${formattedId}`);
      } else if (type === 'pole' && !activeLayers.poles) {
        setActiveLayers((prev) => ({ ...prev, poles: true }));
        setToastNotification(`Poles layer turned on to show ${formattedId}`);
      } else if (type === 'span' && !activeLayers.cableRoutes) {
        setActiveLayers((prev) => ({ ...prev, cableRoutes: true }));
        setToastNotification(`Cables layer turned on to show ${formattedId}`);
      }

      // Update URL deep link
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('type', type);
        url.searchParams.set('id', formattedId);
        window.history.replaceState({}, '', url.pathname + url.search);
      }

      // Emit fly-to signal if item has location and fly option not disabled
      if (resolved.hasLocation && resolved.coordinates && options?.fly !== false) {
        setFlyToSignal({
          id: formattedId,
          type,
          coordinates: { x: resolved.coordinates.x, y: resolved.coordinates.y },
          timestamp: Date.now(),
        });
      }

      // Set active popup (unlocated records open centered card)
      setActivePopup({
        type,
        id: formattedId,
        unlocated: !resolved.hasLocation,
        data: resolved,
      });
    },
    [activeLayers]
  );

  const setSelectedId = useCallback(
    (id: string | null) => {
      if (!id) {
        selectEntity('device', null);
        return;
      }
      let type: EntityType = 'device';
      const upper = id.toUpperCase();
      if (upper.startsWith('EVT')) type = 'event';
      else if (upper.startsWith('AST') || upper.startsWith('POL')) type = 'pole';
      else if (upper.startsWith('CBL')) type = 'span';
      else if (upper.startsWith('CAS')) type = 'case';
      selectEntity(type, id);
    },
    [selectEntity]
  );

  const closePopup = useCallback(() => {
    setActivePopup(null);
    setSelectedIdState(null);
    setSelectedEntity(null);
    setResolvedEntity(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('type');
      url.searchParams.delete('id');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }
  }, []);

  const clearSelection = useCallback(() => {
    closePopup();
  }, [closePopup]);

  // Deep Link handling on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initial = parseSelectionFromUrl(window.location.search);
    if (initial) {
      selectEntity(initial.type, initial.id, { fly: true, source: 'url' });
    }
  }, [selectEntity]);

  const triggerAssetPulse = useCallback((assetClass: 'poles' | 'cables' | 'cameras' | 'sites') => {
    setActiveAssetPulse(assetClass);
    setTimeout(() => {
      setActiveAssetPulse(null);
    }, 1500);
  }, []);

  const refreshNow = useCallback(() => {
    setIsShimmering(true);
    setLastFetchTimestamp(Date.now());
    setLastUpdatedTime('Just now');
    setTimeout(() => setIsShimmering(false), 500);
  }, []);

  const value: OverviewContextType = {
    kpiFilter,
    setKpiFilter,
    clearKpiFilters,
    selectedId,
    setSelectedId,
    selectedEntity,
    resolvedEntity,
    selectEntity,
    clearSelection,
    activePopup,
    setActivePopup,
    closePopup,
    activePanel,
    setActivePanel,
    togglePanel,
    activeLayers,
    setActiveLayers,
    toggleLayer,
    resetLayers,
    toastNotification,
    setToastNotification,
    flyToSignal,
    activeAssetPulse,
    triggerAssetPulse,
    totalDevices,
    onlineDevices,
    offlineDevices,
    staleDevices,
    attentionDevices,
    polesCount,
    cablesLengthKm,
    camerasCount,
    sitesCount,
    totalFeaturesCount,
    timeMode,
    setTimeMode,
    historyRange,
    setHistoryRange,
    scrubPercent,
    setScrubPercent,
    liveState,
    setLiveState,
    refreshInterval,
    setRefreshInterval,
    lastUpdatedTime,
    lastFetchTimestamp,
    refreshNow,
    isShimmering,
  };

  return <OverviewContext.Provider value={value}>{children}</OverviewContext.Provider>;
};

export const useOverview = () => {
  const context = useContext(OverviewContext);
  if (!context) {
    throw new Error('useOverview must be used within an OverviewProvider');
  }
  return context;
};
