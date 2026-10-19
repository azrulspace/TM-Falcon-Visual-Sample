import React, { useState, useMemo, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Compass,
  Layers,
  Search,
  MapPin,
  Check,
  ChevronDown,
  Info,
  Circle,
  Square,
  CircleDot,
  AlertTriangle,
  Cable,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { mapMarkers, mapClusters, mapRoutes } from '@/data/map';
import { devices } from '@/data/devices';
import { segments } from '@/data/segments';

interface MapCanvasProps {
  selectedId: string | null;
  onMarkerClick: (id: string) => void;
  timeMode?: string;
  mode?: string;
  className?: string;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  selectedId,
  onMarkerClick,
  timeMode = 'Active now',
  mode: _mode,
  className = '',
}) => {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [basemap, setBasemap] = useState<'dark' | 'satellite' | 'street' | 'terrain'>('dark');
  const [hoveredMarker, setHoveredMarker] = useState<any | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [legendOpen, setLegendOpen] = useState(true);

  // Active layer visibility
  const [activeLayers, setActiveLayers] = useState({
    devices: true,
    cameras: true,
    poles: true,
    fibreRoutes: true,
    copperRoutes: true,
    clusters: true,
  });

  const [findSearch, setFindSearch] = useState('');
  const [findPopoverOpen, setFindPopoverOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.35, 2.5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.35, 0.85));
  const handleReset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleLayer = (layer: keyof typeof activeLayers) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Associate map markers with device metadata
  const enrichedMarkers = useMemo(() => {
    return mapMarkers.map((m) => {
      const dev = devices.find((d) => d.id === m.id);
      return {
        ...m,
        name: dev?.name || m.id,
        type: dev?.type || 'Pole Camera',
        site: dev?.site || 'Kuching pilot area',
        serial: dev?.serial || 'SN_TM_' + m.id,
        location: dev?.location || '2.9095, 101.4701',
        lastContact: dev?.lastContact || '20m ago',
        isNewEvent: m.id === 'DEV_002', // DEV_002 has new monkey near cable event
      };
    });
  }, []);

  // Filtered poles and spans for Find Popover
  const findResults = useMemo(() => {
    const q = findSearch.toLowerCase().trim();
    if (!q) return [];
    const poleMatches = devices
      .filter((d) => d.asset.toLowerCase().includes(q) || d.id.toLowerCase().includes(q))
      .map((d) => ({ id: d.id, label: `${d.asset} (${d.name})`, type: 'pole', site: d.site }));
    const spanMatches = segments
      .filter((s) => s.id.toLowerCase().includes(q) || s.route.toLowerCase().includes(q))
      .map((s) => ({ id: s.id, label: `${s.id}: ${s.route} (${s.from} - ${s.to})`, type: 'span', site: s.action }));
    return [...poleMatches, ...spanMatches].slice(0, 8);
  }, [findSearch]);

  const handleSelectFind = (id: string) => {
    onMarkerClick(id);
    setFindPopoverOpen(false);
    // Auto center
    const target = mapMarkers.find((m) => m.id === id);
    if (target) {
      setPan({ x: (500 - target.x) * 0.4, y: (350 - target.y) * 0.4 });
      setScale(1.4);
    }
  };

  // Colors based on current basemap
  const basemapBg =
    basemap === 'satellite'
      ? '#08101C'
      : basemap === 'dark'
      ? '#0B1220'
      : basemap === 'street'
      ? '#E9EEF5'
      : '#131B29';

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative rounded-panel border border-border overflow-hidden select-none bg-background ${className}`}
    >
      {/* SVG Vector Map Canvas */}
      <svg
        viewBox="0 0 1000 700"
        className="w-full h-full object-cover origin-center transition-transform duration-300"
        style={{
          transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`,
        }}
        role="img"
        aria-label="Falcon GIS Infrastructure Control Room Map"
      >
        <defs>
          {/* Subtle grid pattern for control room feel */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke={basemap === 'satellite' || basemap === 'dark' ? 'rgba(255, 255, 255, 0.035)' : 'rgba(0, 0, 0, 0.05)'}
              strokeWidth="0.8"
            />
          </pattern>

          {/* Satellite terrain backdrop simulation gradient */}
          <radialGradient id="satelliteGlow" cx="50%" cy="50%" r="75%">
            <stop offset="0%" stopColor="#1E3A5F" stopOpacity={basemap === 'satellite' ? 0.35 : 0.08} />
            <stop offset="100%" stopColor="#08101C" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Base Background */}
        <rect width="1000" height="700" fill={basemapBg} />
        <rect width="1000" height="700" fill="url(#satelliteGlow)" />
        <rect width="1000" height="700" fill="url(#grid)" />

        {/* River / Waterway polygon */}
        <path
          d="M 0 320 Q 220 280 400 340 T 700 360 T 1000 310 L 1000 360 Q 700 410 400 390 T 0 370 Z"
          fill={basemap === 'satellite' || basemap === 'dark' ? '#0E2A47' : '#B8D5E8'}
          opacity="0.8"
        />

        {/* Infrastructure Road Grid */}
        <g
          stroke={basemap === 'satellite' || basemap === 'dark' ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.12)'}
          strokeLinecap="round"
        >
          <path d="M 375 0 L 375 700 M 0 275 L 1000 275 M 675 275 L 675 700" strokeWidth="28" />
          <path d="M 50 650 L 350 400 M 450 650 L 650 400" strokeWidth="14" />
          <path d="M 150 100 L 850 100 M 200 520 L 950 520" strokeWidth="10" strokeDasharray="6 4" />
        </g>

        {/* Geographic labels */}
        <g
          fill={basemap === 'satellite' || basemap === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.45)'}
          fontSize="10"
          fontFamily="sans-serif"
          fontWeight="600"
          className="uppercase tracking-widest select-none"
        >
          <text x="70" y="80">Matang Sector</text>
          <text x="440" y="80">Pending Hub</text>
          <text x="780" y="80">Demak Laut POP</text>
          <text x="80" y="470">Batu Kawa</text>
          <text x="740" y="470">Tabuan Jaya</text>
          <text x="460" y="365" fontSize="13" fontWeight="bold" fill="rgba(56, 189, 248, 0.45)">
            Sungai Sarawak
          </text>
        </g>

        {/* Cable Routes: Fibre (Solid Blue) and Copper (Dashed Amber) */}
        {mapRoutes.map((route, i) => {
          const isFibre = i % 2 === 0;
          if (isFibre && !activeLayers.fibreRoutes) return null;
          if (!isFibre && !activeLayers.copperRoutes) return null;

          return (
            <g key={i}>
              <polyline
                points={route.map((p) => p.join(',')).join(' ')}
                fill="none"
                stroke={isFibre ? 'var(--status-info)' : 'var(--status-warning)'}
                strokeWidth={isFibre ? '3' : '2.5'}
                strokeDasharray={isFibre ? 'none' : '6 4'}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={timeMode === 'History' ? 0.45 : 0.85}
              />
            </g>
          );
        })}

        {/* Markers with Shape + Color Dual Encoding */}
        {activeLayers.devices &&
          enrichedMarkers.map((m) => {
            const isSelected = selectedId === m.id;
            const normStatus = m.status.toLowerCase();

            // Distinct shapes per Section 8.6:
            // Online = Circle
            // Offline = Square
            // Stale = Hollow circle
            // Attention = Triangle
            let fill = 'var(--status-online)';
            let isOffline = normStatus === 'offline';
            let isStale = normStatus === 'stale';

            if (isOffline) fill = 'var(--status-offline)';
            if (isStale) fill = 'var(--status-stale)';

            return (
              <g
                key={m.id}
                transform={`translate(${m.x}, ${m.y})`}
                className="cursor-pointer transition-transform hover:scale-125"
                onClick={() => onMarkerClick(m.id)}
                onMouseEnter={(e) => {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (rect) {
                    setHoveredMarker(m);
                    setHoverPos({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }
                }}
                onMouseLeave={() => setHoveredMarker(null)}
              >
                {/* Selection Ring */}
                {isSelected && (
                  <circle
                    r="20"
                    fill="none"
                    stroke="var(--ring)"
                    strokeWidth="2.5"
                    className="animate-pulse"
                  />
                )}

                {/* Pulse halo on new events (Section 8.6: last 5m pulse, respect reduced motion) */}
                {m.isNewEvent && (
                  <circle
                    r="16"
                    fill="none"
                    stroke="var(--severity-high)"
                    strokeWidth="2"
                    className="animate-ping motion-reduce:hidden opacity-80"
                  />
                )}

                {/* Dual-Encoded Marker Shape */}
                {isOffline ? (
                  // Offline: Solid Square
                  <rect
                    x="-9"
                    y="-9"
                    width="18"
                    height="18"
                    rx="3"
                    fill={fill}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.4))"
                  />
                ) : isStale ? (
                  // Stale: Hollow Ring
                  <circle
                    r="8.5"
                    fill="var(--background)"
                    stroke={fill}
                    strokeWidth="3.5"
                    filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.4))"
                  />
                ) : (
                  // Online: Solid Circle
                  <circle
                    r="9"
                    fill={fill}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.4))"
                  />
                )}

                {/* Device Type Initial or Dot */}
                <text
                  y="3.5"
                  textAnchor="middle"
                  fill={isStale ? fill : '#FFFFFF'}
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {m.id.replace('DEV_', '')}
                </text>
              </g>
            );
          })}

        {/* Cluster Badges with highest severity halo */}
        {activeLayers.clusters &&
          mapClusters.map((c) => (
            <g
              key={c.id}
              transform={`translate(${c.x}, ${c.y})`}
              className="cursor-pointer transition-transform hover:scale-110"
              onClick={() => {
                handleZoomIn();
                setPan({ x: (500 - c.x) * 0.5, y: (350 - c.y) * 0.5 });
              }}
            >
              <circle
                r="16"
                fill="var(--primary)"
                stroke="#FFFFFF"
                strokeWidth="2"
                filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.4))"
              />
              <text
                y="5"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="12"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {c.count}
              </text>
            </g>
          ))}
      </svg>

      {/* Hover Popup Card (Section 8.6: compact popup on hover) */}
      {hoveredMarker && hoverPos && (
        <div
          style={{
            left: `${Math.min(hoverPos.x + 14, 550)}px`,
            top: `${Math.min(hoverPos.y - 45, 450)}px`,
          }}
          className="absolute z-40 w-64 rounded-md border border-border bg-popover/95 p-3 text-popover-foreground shadow-xl backdrop-blur-md pointer-events-none animate-in fade-in-50 duration-150"
        >
          <div className="flex items-center justify-between border-b border-border/60 pb-1.5 mb-2">
            <span className="font-mono text-xs font-bold text-primary">{hoveredMarker.id}</span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize ${
                hoveredMarker.status === 'online'
                  ? 'bg-status-online-tint text-status-online'
                  : hoveredMarker.status === 'offline'
                  ? 'bg-status-offline-tint text-status-offline'
                  : 'bg-status-stale-tint text-status-stale'
              }`}
            >
              {hoveredMarker.status}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Type:</span>
              <span className="font-medium text-foreground">{hoveredMarker.type}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Location:</span>
              <span className="font-medium text-foreground truncate max-w-[120px]">
                {hoveredMarker.site}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Last seen:</span>
              <span className="font-mono text-[11px] text-foreground">{hoveredMarker.lastContact}</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Consolidated Map Toolbar (Top Left) */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
        {/* Find Pole or Span Popover */}
        <Popover open={findPopoverOpen} onOpenChange={setFindPopoverOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 rounded-md bg-card/95 backdrop-blur-sm border-border text-xs gap-1.5 shadow-md hover:bg-card"
              >
                <Search className="size-3.5 text-muted-foreground" />
                <span>Find pole or span</span>
                <ChevronDown className="size-3 text-muted-foreground opacity-60 ml-0.5" />
              </Button>
            }
          />
          <PopoverContent className="w-72 p-2 bg-popover border border-border z-50 shadow-xl" align="start">
            <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-border mb-2">
              <Search className="size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search pole (AST_...), cable (CBL_...)"
                value={findSearch}
                onChange={(e) => setFindSearch(e.target.value)}
                className="w-full text-xs bg-transparent outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {findResults.length > 0 ? (
                findResults.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => handleSelectFind(res.id)}
                    className="flex items-center justify-between p-1.5 rounded hover:bg-accent cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {res.type === 'pole' ? <MapPin className="size-3.5 text-primary shrink-0" /> : <Cable className="size-3.5 text-info shrink-0" />}
                      <span className="font-mono text-xs font-semibold">{res.label}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground truncate">{res.site}</span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  {findSearch ? 'No matching pole or span found' : 'Type to search infrastructure assets'}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Layers & Basemap Popover */}
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 rounded-md bg-card/95 backdrop-blur-sm border-border text-xs gap-1.5 shadow-md hover:bg-card"
              >
                <Layers className="size-3.5 text-muted-foreground" />
                <span>Layers</span>
                <ChevronDown className="size-3 text-muted-foreground opacity-60 ml-0.5" />
              </Button>
            }
          />
          <PopoverContent className="w-64 p-3 bg-popover border border-border z-50 text-xs shadow-xl" align="start">
            {/* Basemap Selection */}
            <div className="mb-3 pb-2.5 border-b border-border">
              <div className="font-semibold text-foreground uppercase tracking-wider text-[10px] text-muted-foreground mb-2">
                Basemap
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'dark', label: 'Dark' },
                  { id: 'satellite', label: 'Satellite' },
                  { id: 'street', label: 'Streets' },
                  { id: 'terrain', label: 'Terrain' },
                ].map((bm) => (
                  <button
                    key={bm.id}
                    type="button"
                    onClick={() => setBasemap(bm.id as any)}
                    className={`h-7 px-2 text-xs rounded border flex items-center justify-between transition-colors ${
                      basemap === bm.id
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border bg-card/60 hover:bg-muted text-foreground'
                    }`}
                  >
                    <span>{bm.label}</span>
                    {basemap === bm.id && <Check className="size-3" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Overlays */}
            <div>
              <div className="font-semibold text-foreground uppercase tracking-wider text-[10px] text-muted-foreground mb-2">
                Overlays
              </div>
              <div className="space-y-2">
                {[
                  { key: 'devices', label: 'Devices' },
                  { key: 'cameras', label: 'Pole Cameras' },
                  { key: 'poles', label: 'Poles & Cabinets' },
                  { key: 'fibreRoutes', label: 'Fibre routes (Blue)' },
                  { key: 'copperRoutes', label: 'Copper routes (Amber)' },
                  { key: 'clusters', label: 'Cluster aggregations' },
                ].map((lyr) => (
                  <label key={lyr.key} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={activeLayers[lyr.key as keyof typeof activeLayers]}
                      onCheckedChange={() => toggleLayer(lyr.key as keyof typeof activeLayers)}
                    />
                    <span className="text-foreground">{lyr.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Collapsible Legend Card (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-20">
        {legendOpen ? (
          <div className="rounded-md border border-border bg-card/95 backdrop-blur-sm p-2.5 text-xs shadow-md space-y-1.5 w-48 animate-in fade-in-50 duration-150">
            <div className="flex items-center justify-between font-bold text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1">
              <span>Map Legend</span>
              <button onClick={() => setLegendOpen(false)} className="hover:text-foreground">
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[11px] text-foreground">
              <div className="flex items-center gap-1.5">
                <Circle className="size-2.5 fill-status-online text-status-online" />
                <span>Online (11)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Square className="size-2.5 fill-status-offline text-status-offline" />
                <span>Offline (2)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CircleDot className="size-2.5 text-status-stale" />
                <span>Stale (2)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="size-2.5 fill-status-warning text-status-warning" />
                <span>Attention (4)</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2 pt-1 border-t border-border/40">
                <div className="w-3.5 h-[2.5px] bg-status-info rounded" />
                <span>Fibre route</span>
                <div className="w-3.5 h-[2px] border-b-2 border-dashed border-status-warning ml-2" />
                <span>Copper</span>
              </div>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLegendOpen(true)}
            className="h-7 px-2 rounded-md bg-card/90 backdrop-blur-sm border-border text-[11px] shadow-md gap-1"
          >
            <Info className="size-3 text-muted-foreground" />
            <span>Legend</span>
          </Button>
        )}
      </div>

      {/* Zoom, Compass, and Reset Controls (Bottom Right) */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1 z-20">
        <div className="flex flex-col rounded-md border border-border bg-card/95 backdrop-blur-sm overflow-hidden shadow-md">
          <button
            className="size-7 flex items-center justify-center hover:bg-muted text-foreground transition-colors border-b border-border/60"
            onClick={handleZoomIn}
            aria-label="Zoom in"
          >
            <ZoomIn className="size-3.5" />
          </button>
          <button
            className="size-7 flex items-center justify-center hover:bg-muted text-foreground transition-colors border-b border-border/60"
            onClick={handleReset}
            aria-label="Reset zoom and center"
          >
            <Maximize className="size-3.5" />
          </button>
          <button
            className="size-7 flex items-center justify-center hover:bg-muted text-foreground transition-colors"
            onClick={handleZoomOut}
            aria-label="Zoom out"
          >
            <ZoomOut className="size-3.5" />
          </button>
        </div>

        <button
          className="size-7 rounded-md border border-border bg-card/95 backdrop-blur-sm flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground shadow-md transition-colors"
          onClick={() => setPan({ x: 0, y: 0 })}
          aria-label="Compass heading"
        >
          <Compass className="size-3.5 text-primary" />
        </button>
      </div>

      {/* Scale bar & Mapbox attribution banner */}
      <div className="absolute bottom-1 right-12 text-[10px] text-muted-foreground/60 flex items-center gap-2 pointer-events-none select-none font-mono">
        <div className="flex items-center gap-1 border-b border-muted-foreground/40 pb-0.5">
          <div className="w-10 h-1 border-l border-r border-muted-foreground/50" />
          <span>10 km</span>
        </div>
        <span>© Mapbox © OpenStreetMap</span>
      </div>
    </div>
  );
};

export default MapCanvas;
