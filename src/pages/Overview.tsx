import { useState, useEffect, useCallback } from 'react';
import { MapCanvas } from '@/components/MapCanvas';
import { TimeBar } from '@/components/overview/TimeBar';
import { IncidentsPanel } from '@/components/overview/IncidentsPanel';
import { MapLayersToolbar } from '@/components/overview/MapLayersToolbar';
import { MapScaleZoom } from '@/components/overview/MapScaleZoom';
import { useOverview } from '@/contexts/OverviewContext';
import type { LayerVisibility } from '@/components/overview/LayerRail';

export default function Overview() {
  const {
    selectedId,
    setSelectedId,
    timeMode,
    setTimeMode,
    historyRange,
    setHistoryRange,
    setScrubPercent,
  } = useOverview();

  // Basemap persistence (Default Satellite view per Section 7 of specification)
  const [basemap, setBasemap] = useState<'satellite' | 'terrain' | 'dark' | 'streets'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('falcon_basemap') as any;
      if (saved) return saved;
      return 'satellite';
    }
    return 'satellite';
  });

  const handleBasemapChange = (bm: 'satellite' | 'terrain') => {
    setBasemap(bm);
    if (typeof window !== 'undefined') {
      localStorage.setItem('falcon_basemap', bm);
    }
  };

  // Layer visibility state
  const [activeLayers, setActiveLayers] = useState<LayerVisibility>({
    events: true,
    devices: true,
    poles: true,
    cableRoutes: true,
    cctv: true,
    sites: true,
  });

  const handleToggleLayer = (key: keyof LayerVisibility) => {
    setActiveLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleResetLayers = () => {
    setActiveLayers({
      events: true,
      devices: true,
      poles: true,
      cableRoutes: true,
      cctv: true,
      sites: true,
    });
  };

  // Zoom control signals for MapCanvas
  const [zoomInSignal, setZoomInSignal] = useState<number>(0);
  const [zoomOutSignal, setZoomOutSignal] = useState<number>(0);

  // Handle selecting an item from the incident card, search, or map marker
  const handleSelectItem = useCallback(
    (id: string | null) => {
      // Normalize format DEV-004 <-> DEV_004
      const normalized = id ? id.replace(/-/g, '_') : null;
      setSelectedId(normalized);
    },
    [setSelectedId]
  );

  // Keyboard navigation: Escape key clears selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedId]);

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden select-none font-sans dark:bg-[#0B101B] bg-slate-900 text-foreground transition-colors">
      {/* 1. Map Canvas & Floating Panels Workspace (Fills remaining height: 720px in 1512x946 frame) */}
      <div className="flex-1 w-full relative overflow-hidden">
        <MapCanvas
          selectedId={selectedId}
          onMarkerClick={(id) => handleSelectItem(id)}
          timeMode={timeMode}
          basemap={basemap}
          activeLayers={activeLayers}
          zoomInSignal={zoomInSignal}
          zoomOutSignal={zoomOutSignal}
          className="w-full h-full"
        />

        {/* Floating Overlays Container with 24px margins (Section 4.1) */}
        <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-6">
          {/* Top Row: Right Floating Panel ("Incidents & attention (4)", 279px, expanding to 360px inspector) */}
          <div className="flex justify-end w-full">
            <IncidentsPanel
              selectedId={selectedId}
              onSelectItem={handleSelectItem}
            />
          </div>

          {/* Bottom Row: Left Map Layers Toolbar (444x68) and Right Scale & Zoom (194x25 + 126x60) */}
          <div className="flex items-end justify-between w-full">
            <MapLayersToolbar
              activeLayers={activeLayers}
              onToggleLayer={handleToggleLayer}
              onResetLayers={handleResetLayers}
              basemap={basemap}
              onBasemapChange={handleBasemapChange}
            />

            <MapScaleZoom
              onZoomIn={() => setZoomInSignal((s) => s + 1)}
              onZoomOut={() => setZoomOutSignal((s) => s + 1)}
            />
          </div>
        </div>
      </div>

      {/* 2. Docked Activity Timeline / TimeBar (94px, docked under map per Section 4.12) */}
      <TimeBar
        timeMode={timeMode}
        onTimeModeChange={setTimeMode}
        historyRange={historyRange}
        onHistoryRangeChange={setHistoryRange}
        onScrubTime={setScrubPercent}
      />
    </div>
  );
}
