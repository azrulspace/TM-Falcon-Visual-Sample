import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { devices as initialDevices } from '@/data/devices';

export type KpiFilter = 'all' | 'online' | 'offline' | 'stale' | 'attention';

export interface OverviewContextType {
  // Device & KPI filters
  kpiFilter: KpiFilter;
  setKpiFilter: (filter: KpiFilter) => void;
  clearKpiFilters: () => void;
  
  // Selection
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;

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
  refreshNow: () => void;
  isShimmering: boolean;
}

const OverviewContext = createContext<OverviewContextType | undefined>(undefined);

export const OverviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [kpiFilter, setKpiFilterState] = useState<KpiFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeAssetPulse, setActiveAssetPulse] = useState<string | null>(null);

  const [timeMode, setTimeMode] = useState<'Active now' | 'History'>('Active now');
  const [historyRange, setHistoryRange] = useState<string>('Last 24 hours');
  const [scrubPercent, setScrubPercent] = useState<number>(100);

  const [liveState, setLiveState] = useState<'live' | 'paused'>('live');
  const [refreshInterval, setRefreshInterval] = useState<number>(15);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('Just now');
  const [isShimmering, setIsShimmering] = useState<boolean>(false);

  // Single source of truth counts derived from devices dataset
  const totalDevices = initialDevices.length; // 15
  const onlineDevices = useMemo(() => initialDevices.filter(d => d.status.toLowerCase() === 'online').length, []); // 11
  const offlineDevices = useMemo(() => initialDevices.filter(d => d.status.toLowerCase() === 'offline').length, []); // 2
  const staleDevices = useMemo(() => initialDevices.filter(d => d.status.toLowerCase() === 'stale').length, []); // 2
  const attentionDevices = offlineDevices + staleDevices; // 4

  // Asset counts matching Figma specification
  const polesCount = 42;
  const cablesLengthKm = 18;
  const camerasCount = 6;
  const sitesCount = 12;

  const setKpiFilter = useCallback((filter: KpiFilter) => {
    setKpiFilterState(prev => (prev === filter ? 'all' : filter));
  }, []);

  const clearKpiFilters = useCallback(() => {
    setKpiFilterState('all');
  }, []);

  const triggerAssetPulse = useCallback((assetClass: 'poles' | 'cables' | 'cameras' | 'sites') => {
    setActiveAssetPulse(assetClass);
    setTimeout(() => {
      setActiveAssetPulse(null);
    }, 1500);
  }, []);

  const refreshNow = useCallback(() => {
    setIsShimmering(true);
    setLastUpdatedTime('Just now');
    setTimeout(() => setIsShimmering(false), 500);
  }, []);

  const value: OverviewContextType = {
    kpiFilter,
    setKpiFilter,
    clearKpiFilters,
    selectedId,
    setSelectedId,
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
