import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Search,
  MapPin,
  Cable,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { MapCanvas } from '@/components/MapCanvas';
import { KpiStrip } from '@/components/overview/KpiStrip';
import { LayerRail, type LayerVisibility } from '@/components/overview/LayerRail';
import { AttentionQueue } from '@/components/overview/AttentionQueue';
import { DockedInspector } from '@/components/overview/DockedInspector';
import { AssetsPill } from '@/components/overview/AssetsPill';
import { TimeBar } from '@/components/overview/TimeBar';
import { DeviceStatusDrawer } from '@/components/overview/DeviceStatusDrawer';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { devices } from '@/data/devices';
import { segments } from '@/data/segments';
import type { KpiFilterType } from '@/components/overview/KpiRibbon';

export default function Overview() {
  // Theme & Basemap persistence (Default Satellite in dark theme, Terrain in light theme per Section 8.2)
  const [basemap, setBasemap] = useState<'satellite' | 'dark' | 'terrain' | 'streets'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('falcon_basemap') as any;
      if (saved) return saved;
      const themeVal = localStorage.getItem('ds_theme');
      const isDark =
        themeVal === 'dark' ||
        document.documentElement.classList.contains('dark') ||
        document.documentElement.classList.contains('theme_dark');
      return isDark ? 'satellite' : 'terrain';
    }
    return 'satellite';
  });

  const handleBasemapChange = (bm: 'satellite' | 'dark' | 'terrain' | 'streets') => {
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

  // Time bar state
  const [timeMode, setTimeMode] = useState<string>('Active now');
  const [historyRange, setHistoryRange] = useState<string>('Last 24 hours');

  // Selection & KPI triage filter
  const [activeKpiFilter, setActiveKpiFilter] = useState<KpiFilterType>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Floating Overlays & Drawer state
  const [panelCollapsed, setPanelCollapsed] = useState<boolean>(false);
  const [assetsDrawerOpen, setAssetsDrawerOpen] = useState<boolean>(false);
  const [findDialogOpen, setFindDialogOpen] = useState<boolean>(false);
  const [findQuery, setFindQuery] = useState<string>('');

  // Mobile Drawer Snap Points ('peek' | 'half' | 'full' | 'closed')
  const [mobileDrawerSnap, setMobileDrawerSnap] = useState<'peek' | 'half' | 'full'>('peek');

  // Window viewport width tracking
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1440
  );

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
        setFindDialogOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle selecting an item from the queue, map, or find search
  const handleSelectItem = useCallback((id: string | null, markerId?: string | null) => {
    const target = markerId || id;
    setSelectedId(target);
    if (target && windowWidth < 768) {
      setMobileDrawerSnap('half');
    }
  }, [windowWidth]);

  // Find Pole or Span Search Results
  const findResults = useMemo(() => {
    const q = findQuery.toLowerCase().trim();
    if (!q) return [];
    const poleMatches = devices
      .filter((d) => d.asset.toLowerCase().includes(q) || d.id.toLowerCase().includes(q) || d.name.toLowerCase().includes(q))
      .map((d) => ({ id: d.id, label: `${d.asset} • ${d.name}`, type: 'pole', site: d.site, status: d.status }));
    const spanMatches = segments
      .filter((s) => s.id.toLowerCase().includes(q) || s.route.toLowerCase().includes(q))
      .map((s) => ({ id: s.id, label: `${s.id}: ${s.route} (${s.from} - ${s.to})`, type: 'span', site: s.action, status: s.priority }));
    return [...poleMatches, ...spanMatches].slice(0, 8);
  }, [findQuery]);

  const isDesktop = windowWidth >= 1024;
  const isMobile = windowWidth < 768;

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden select-none font-sans bg-background">
      {/* 1. Full-Bleed Hero Map Canvas (Fills viewport above docked 64px TimeBar) */}
      <div className="flex-1 w-full relative overflow-hidden">
        <MapCanvas
          selectedId={selectedId}
          onMarkerClick={(id) => handleSelectItem(id, id)}
          timeMode={timeMode}
          basemap={basemap}
          activeLayers={activeLayers}
          className="w-full h-full"
        />

        {/* 2. Subtle Edge Gradient Scrims (Ensures text contrast over any imagery) */}
        <div className="scrim-top" />
        <div className="scrim-bottom" />

        {/* 3. Floating Glass Overlays Container (Pointer events pass through to map) */}
        <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4">
          {/* TOP ROW: KPI Strip (Top-Left, 16px margin) */}
          <div className="flex items-start justify-between w-full">
            {/* KPI Strip */}
            <div className={`pointer-events-auto overflow-x-auto no-scrollbar ${
              panelCollapsed ? 'max-w-full' : 'max-w-full lg:max-w-[calc(100%-416px)]'
            }`}>
              <KpiStrip
                activeFilter={activeKpiFilter}
                onFilterChange={setActiveKpiFilter}
              />
            </div>

            {/* Presentation Mode / Clean Map Toggle when Right Panel is Collapsed */}
            {isDesktop && panelCollapsed && (
              <div className="pointer-events-auto animate-in fade-in-50 duration-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPanelCollapsed(false)}
                  className="h-8 gap-1.5 glass-panel text-xs font-semibold shadow-xl border-border/80 hover:bg-card/90"
                >
                  <SlidersHorizontal className="size-3.5 text-primary" />
                  <span>Show incidents (10)</span>
                  <ChevronLeft className="size-3 text-muted-foreground ml-0.5" />
                </Button>
              </div>
            )}
          </div>

          {/* CENTER ROW: Layer Rail (Left, anchored 16px under KPI strip) & Incidents Panel (Right, 380px) */}
          <div className="flex-1 min-h-0 flex items-stretch justify-between my-2 relative">
            {/* Left: Layer Rail anchored 16px under KPI strip (E1) */}
            <div className="self-start pointer-events-auto hidden sm:block pt-1">
              <LayerRail
                basemap={basemap}
                onBasemapChange={handleBasemapChange}
                layers={activeLayers}
                onToggleLayer={handleToggleLayer}
                onOpenSearch={() => setFindDialogOpen(true)}
              />
            </div>

            {/* Right: Floating Incidents Panel (380px Desktop, collapsible, D6) */}
            {isDesktop && (
              <div
                className={`absolute top-0 right-0 bottom-2 w-[380px] pointer-events-auto transition-transform duration-300 ease-in-out ${
                  panelCollapsed ? 'translate-x-[calc(100%+24px)]' : 'translate-x-0'
                }`}
              >
                <div className="relative w-full h-full glass-panel flex flex-col overflow-hidden shadow-2xl border border-border/80 rounded-xl">
                  {/* Collapse / Expand Handle Tab */}
                  <button
                    onClick={() => setPanelCollapsed(!panelCollapsed)}
                    className="absolute -left-7 top-4 z-30 size-7 glass-panel rounded-l-md border-r-0 flex items-center justify-center text-muted-foreground hover:text-foreground shadow-lg transition-colors cursor-pointer"
                    aria-label={panelCollapsed ? 'Expand incidents panel' : 'Collapse incidents panel'}
                    title={panelCollapsed ? 'Expand incidents panel' : 'Collapse incidents panel'}
                  >
                    {panelCollapsed ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
                  </button>

                  {/* Panel Content: Docked Inspector (when selected) OR Attention Queue (when unselected) */}
                  {selectedId ? (
                    <DockedInspector
                      selectedId={selectedId}
                      onBack={() => setSelectedId(null)}
                      onClose={() => setSelectedId(null)}
                      onSelectEntity={(id) => handleSelectItem(id, id)}
                    />
                  ) : (
                    <AttentionQueue
                      selectedId={selectedId}
                      onSelectItem={handleSelectItem}
                      activeKpiFilter={activeKpiFilter}
                      density="default"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM OF MAP: Floating Assets Pill (Bottom-Right, sits cleanly above docked TimeBar) */}
          <div className="flex justify-end pr-1 pointer-events-auto">
            <AssetsPill
              isOpen={assetsDrawerOpen}
              onToggle={() => setAssetsDrawerOpen(!assetsDrawerOpen)}
            />
          </div>
        </div>
      </div>

      {/* 4. Docked 64px Footer TimeBar under map (full width, 64px high, top border, no floating) (F1) */}
      <div className="w-full shrink-0 z-30 pointer-events-auto">
        <TimeBar
          timeMode={timeMode}
          onTimeModeChange={setTimeMode}
          historyRange={historyRange}
          onHistoryRangeChange={setHistoryRange}
        />
      </div>

      {/* 4. Bottom Sheet: Device Status Table (Opened via Assets Pill) */}
      <Sheet open={assetsDrawerOpen} onOpenChange={setAssetsDrawerOpen}>
        <SheetContent
          side="bottom"
          className="h-[48vh] max-h-[620px] p-0 border-t border-border bg-card/95 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden z-50"
        >
          <DeviceStatusDrawer
            selectedId={selectedId}
            onSelectDevice={(id) => {
              handleSelectItem(id, id);
              setAssetsDrawerOpen(false);
            }}
            timeMode={timeMode}
            isSheet={true}
            onClose={() => setAssetsDrawerOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* 5. Mobile & Tablet (< 1024px) Incidents Drawer */}
      {!isDesktop && !isMobile && (
        <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
          <SheetContent
            side="right"
            className="p-0 sm:max-w-[420px] w-full border-l border-border bg-card shadow-2xl h-full overflow-hidden z-50"
          >
            {selectedId ? (
              <DockedInspector
                selectedId={selectedId}
                onBack={() => setSelectedId(null)}
                onClose={() => setSelectedId(null)}
                onSelectEntity={(id) => handleSelectItem(id, id)}
              />
            ) : (
              <AttentionQueue
                selectedId={selectedId}
                onSelectItem={handleSelectItem}
                activeKpiFilter={activeKpiFilter}
                density="default"
              />
            )}
          </SheetContent>
        </Sheet>
      )}

      {/* 6. Mobile Snap Drawer (< 768px): Peek (96px), Half (50%), Full (90%) (Section 9.5) */}
      {isMobile && (
        <div
          className={`fixed inset-x-0 bottom-0 z-40 glass-panel rounded-t-2xl border-t border-border/80 shadow-2xl transition-all duration-300 flex flex-col ${
            mobileDrawerSnap === 'peek'
              ? 'h-24'
              : mobileDrawerSnap === 'half'
              ? 'h-[50vh]'
              : 'h-[90vh]'
          }`}
        >
          {/* Snap Drag Handle Bar */}
          <div
            className="w-full py-2 flex flex-col items-center justify-center cursor-pointer shrink-0"
            onClick={() => {
              setMobileDrawerSnap((s) => (s === 'peek' ? 'half' : s === 'half' ? 'full' : 'peek'));
            }}
          >
            <div className="w-10 h-1.5 rounded-full bg-muted-foreground/40" />
            <div className="flex items-center justify-between w-full px-4 pt-1">
              <span className="text-xs font-bold text-foreground">
                Needs attention (10)
              </span>
              <span className="text-[10px] text-primary font-mono font-semibold">
                {mobileDrawerSnap === 'peek' ? 'Tap to expand' : 'Tap to toggle size'}
              </span>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2">
            {selectedId ? (
              <DockedInspector
                selectedId={selectedId}
                onBack={() => setSelectedId(null)}
                onClose={() => setSelectedId(null)}
                onSelectEntity={(id) => handleSelectItem(id, id)}
              />
            ) : (
              <AttentionQueue
                selectedId={selectedId}
                onSelectItem={handleSelectItem}
                activeKpiFilter={activeKpiFilter}
                density="compact"
              />
            )}
          </div>
        </div>
      )}

      {/* 7. Find Pole or Cable Span Dialog (Triggered from Layer Rail / ⌘K) */}
      <Dialog open={findDialogOpen} onOpenChange={setFindDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 glass-panel border border-border/80 shadow-2xl overflow-hidden z-50">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
            <Search className="size-4 text-primary shrink-0" />
            <input
              type="text"
              placeholder="Search pole (AST_POL_...), cable span (CBL_SPN_...), or device..."
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              className="w-full text-xs bg-transparent outline-none placeholder:text-muted-foreground text-foreground"
              autoFocus
            />
            {findQuery && (
              <button onClick={() => setFindQuery('')} className="text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto p-2 space-y-1">
            {findResults.length > 0 ? (
              findResults.map((res) => (
                <div
                  key={res.id}
                  onClick={() => {
                    handleSelectItem(res.id, res.id);
                    setFindDialogOpen(false);
                  }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {res.type === 'pole' ? (
                      <MapPin className="size-4 text-primary shrink-0" />
                    ) : (
                      <Cable className="size-4 text-sky-400 shrink-0" />
                    )}
                    <span className="font-mono text-xs font-semibold text-foreground">{res.label}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
                    {res.site}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground">
                {findQuery ? 'No matching pole or span found' : 'Type to search infrastructure assets'}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
