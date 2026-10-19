import { useState, useEffect, useCallback } from 'react';
import { ControlRow } from '@/components/overview/ControlRow';
import { KpiRibbon, type KpiFilterType } from '@/components/overview/KpiRibbon';
import { AttentionQueue } from '@/components/overview/AttentionQueue';
import { DetailPanel } from '@/components/overview/DetailPanel';
import { DeviceStatusDrawer } from '@/components/overview/DeviceStatusDrawer';
import { MapCanvas } from '@/components/MapCanvas';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ListFilter } from 'lucide-react';

export default function Overview() {
  const [timeMode, setTimeMode] = useState<string>('Active now');
  const [historyRange, setHistoryRange] = useState<string>('Last 24 hours');
  const [density, setDensity] = useState<'default' | 'compact'>('default');
  const [mapFocus, setMapFocus] = useState<boolean>(false);
  const [activeKpiFilter, setActiveKpiFilter] = useState<KpiFilterType>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Responsive breakpoint tracking
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1440
  );
  const [mobileQueueOpen, setMobileQueueOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard navigation: Escape key clears selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectItem = useCallback((id: string | null, markerId?: string | null) => {
    // If selecting via attention queue or map, marker takes precedence for spatial linkage
    const target = markerId || id;
    setSelectedId(target);
    if (windowWidth < 1024) {
      setMobileQueueOpen(false);
    }
  }, [windowWidth]);

  const isWideScreen = windowWidth >= 1280;
  const isTabletOrDesktop = windowWidth >= 1024;

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden font-sans select-none animate-in fade-in-50 duration-200">
      {/* 8.2 Control Row */}
      <ControlRow
        timeMode={timeMode}
        onTimeModeChange={setTimeMode}
        historyRange={historyRange}
        onHistoryRangeChange={setHistoryRange}
        mapFocus={mapFocus}
        onToggleMapFocus={() => setMapFocus((prev) => !prev)}
        density={density}
        onToggleDensity={() => setDensity((prev) => (prev === 'default' ? 'compact' : 'default'))}
      />

      {/* 8.3 KPI Ribbon */}
      <KpiRibbon
        activeFilter={activeKpiFilter}
        onFilterChange={setActiveKpiFilter}
      />

      {/* 8.4 Main Workspace (Incident Desk 3-Column Triage System) */}
      <div className="flex-1 min-h-0 flex gap-2.5 overflow-hidden relative mb-2">
        {/* Left: Attention Queue (Desktop >= 1024px and not in map focus) */}
        {isTabletOrDesktop && !mapFocus && (
          <div className="w-[340px] xl:w-[360px] 2xl:w-[380px] shrink-0 h-full overflow-hidden transition-all duration-200">
            <AttentionQueue
              selectedId={selectedId}
              onSelectItem={handleSelectItem}
              activeKpiFilter={activeKpiFilter}
              density={density}
            />
          </div>
        )}

        {/* Floating trigger for Queue on small screens (< 1024px) */}
        {!isTabletOrDesktop && !mapFocus && (
          <div className="absolute top-2 left-2 z-20">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileQueueOpen(true)}
              className="h-8 gap-1.5 bg-card/95 backdrop-blur-xs border-border shadow-md text-xs font-semibold"
            >
              <ListFilter className="size-3.5 text-primary" />
              <span>Queue (4)</span>
            </Button>
          </div>
        )}

        {/* Center: Map Canvas (Always flexible, occupies all remaining space) */}
        <div className="flex-1 min-w-0 h-full rounded-panel border border-border overflow-hidden relative bg-card shadow-xs">
          <MapCanvas
            selectedId={selectedId}
            onMarkerClick={(id) => handleSelectItem(id, id)}
            timeMode={timeMode}
            className="w-full h-full"
          />
        </div>

        {/* Right: Detail Panel (Inline on Desktop >= 1280px when an item is selected and not in map focus) */}
        {isWideScreen && !mapFocus && selectedId && (
          <div className="w-[380px] 2xl:w-[400px] shrink-0 h-full overflow-hidden animate-in slide-in-from-right-4 duration-200">
            <DetailPanel
              selectedId={selectedId}
              onClose={() => setSelectedId(null)}
            />
          </div>
        )}
      </div>

      {/* 8.8 Device Status Drawer (Bottom collapsible table) */}
      <div className="shrink-0 z-10">
        <DeviceStatusDrawer
          selectedId={selectedId}
          onSelectDevice={(id) => handleSelectItem(id, id)}
          timeMode={timeMode}
        />
      </div>

      {/* Responsive Sheet Overlay for Detail Panel on screens < 1280px */}
      {!isWideScreen && selectedId && (
        <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
          <SheetContent
            side="right"
            className="p-0 sm:max-w-[420px] w-full border-l border-border bg-card shadow-2xl h-full overflow-hidden"
          >
            <DetailPanel
              selectedId={selectedId}
              onClose={() => setSelectedId(null)}
              isSheet={true}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Responsive Sheet Overlay for Attention Queue on screens < 1024px */}
      {!isTabletOrDesktop && (
        <Sheet open={mobileQueueOpen} onOpenChange={setMobileQueueOpen}>
          <SheetContent
            side="left"
            className="p-0 sm:max-w-[380px] w-full border-r border-border bg-card shadow-2xl h-full overflow-hidden"
          >
            <AttentionQueue
              selectedId={selectedId}
              onSelectItem={handleSelectItem}
              activeKpiFilter={activeKpiFilter}
              density={density}
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
