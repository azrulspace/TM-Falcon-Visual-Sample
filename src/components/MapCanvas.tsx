import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Compass,
} from 'lucide-react';
import { mapMarkers, mapClusters, mapRoutes } from '@/data/map';
import { devices } from '@/data/devices';
import { events } from '@/data/events';
import type { LayerVisibility } from '@/components/overview/LayerRail';

export interface MapCanvasProps {
  selectedId: string | null;
  onMarkerClick: (id: string) => void;
  timeMode?: string;
  basemap?: 'satellite' | 'dark' | 'terrain' | 'streets';
  activeLayers?: Partial<LayerVisibility> & { clusters?: boolean };
  className?: string;
  onMouseMoveCoords?: (coords: { lat: number; lon: number }) => void;
  onZoomChange?: (scale: number) => void;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  selectedId,
  onMarkerClick,
  timeMode = 'Active now',
  basemap = 'satellite',
  activeLayers = {
    events: true,
    devices: true,
    poles: true,
    cableRoutes: true,
    cctv: true,
    sites: true,
    clusters: true,
  },
  className = '',
  onMouseMoveCoords,
}) => {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredMarker, setHoveredMarker] = useState<any | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lon: number }>({
    lat: 1.5535,
    lon: 110.3421,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 1440, height: 900 });

  const containerRef = useRef<HTMLDivElement>(null);

  // ResizeObserver for dynamic viewport invalidation (Section 8.7)
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setContainerSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Smooth Fly-to with overlay padding (Section 8.6)
  // Ensures target is centered in the visible area to the left of the 400px panel
  useEffect(() => {
    if (!selectedId) return;

    // Resolve target marker from selectedId (could be device ID, event ID, or span)
    let targetMarker = mapMarkers.find((m) => m.id === selectedId);
    if (!targetMarker) {
      const evt = events.find((e) => e.id === selectedId);
      if (evt?.device) {
        targetMarker = mapMarkers.find((m) => m.id === evt.device);
      }
    }

    if (targetMarker) {
      // Offset center slightly to the left (~360px on SVG viewBox) so the right 400px panel doesn't occlude it
      const targetX = (360 - targetMarker.x) * 0.65;
      const targetY = (350 - targetMarker.y) * 0.65;
      setPan({ x: targetX, y: targetY });
      setScale(1.45);
    }
  }, [selectedId]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => setScale((s) => Math.min(s + 0.35, 2.8)), []);
  const handleZoomOut = useCallback(() => setScale((s) => Math.max(s - 0.35, 0.85)), []);
  const handleReset = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary click
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Track mouse coordinates in geographic Kuching space
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    const lat = 1.572 - relY * 0.038;
    const lon = 110.315 + relX * 0.055;
    const coords = { lat: Number(lat.toFixed(4)), lon: Number(lon.toFixed(4)) };
    setMouseCoords(coords);
    if (onMouseMoveCoords) onMouseMoveCoords(coords);

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale((s) => Math.min(Math.max(s + zoomDelta, 0.85), 2.8));
  };

  // Real GIS tile grid calculation around Kuching (z=12, x=3303, y=2030)
  const tiles = useMemo(() => {
    const list: { tx: number; ty: number; x: number; y: number }[] = [];
    const cols = [3301, 3302, 3303, 3304, 3305];
    const rows = [2028, 2029, 2030, 2031, 2032];

    rows.forEach((ty) => {
      cols.forEach((tx) => {
        const x = (tx - 3303) * 256 + 372;
        const y = (ty - 2030) * 256 + 222;
        list.push({ tx, ty, x, y });
      });
    });
    return list;
  }, []);

  const getTileUrl = (tx: number, ty: number, bm: string) => {
    if (bm === 'satellite') {
      return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/${ty}/${tx}`;
    }
    if (bm === 'dark') {
      return `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/12/${ty}/${tx}`;
    }
    return `https://tile.openstreetmap.org/12/${tx}/${ty}.png`;
  };

  // Associate map markers with device & incident metadata
  const enrichedMarkers = useMemo(() => {
    return mapMarkers.map((m) => {
      const dev = devices.find((d) => d.id === m.id);
      const isIncidentOffline = m.status === 'offline';
      const isIncidentStale = m.status === 'stale';
      const hasActiveAttentionEvent = m.id === 'DEV_002'; // DEV_002 has high priority monkey near cable event

      return {
        ...m,
        name: dev?.name || m.id,
        type: dev?.type || 'Pole Camera',
        site: dev?.site || 'Kuching Sector',
        serial: dev?.serial || 'SN_TM_' + m.id,
        location: dev?.location || '2.9095, 101.4701',
        lastContact: dev?.lastContact || '20m ago',
        isOffline: isIncidentOffline,
        isStale: isIncidentStale,
        isAttention: hasActiveAttentionEvent,
        isOnline: !isIncidentOffline && !isIncidentStale && !hasActiveAttentionEvent,
        isNewEvent: m.id === 'DEV_002',
      };
    });
  }, []);

  // Check if a cable span route is selected
  const activeSelectedSpanId = useMemo(() => {
    if (!selectedId) return null;
    if (selectedId.startsWith('CBL_SPN_')) return selectedId;
    if (selectedId === 'EVT_0128' || selectedId === 'DEV_002' || selectedId === 'AST_003') {
      return 'CBL_SPN_041';
    }
    return null;
  }, [selectedId]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className={`w-full h-full relative overflow-hidden select-none bg-[#08101C] cursor-grab active:cursor-grabbing ${className}`}
    >
      {/* SVG Vector & Tile Map Canvas */}
      <svg
        viewBox="0 0 1000 700"
        className="w-full h-full object-cover origin-center transition-transform duration-300 ease-out"
        style={{
          transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`,
        }}
        role="img"
        aria-label="Falcon GIS Infrastructure Satellite Map"
      >
        <defs>
          {/* Subtle grid pattern for control room feel */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke={basemap === 'satellite' || basemap === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)'}
              strokeWidth="0.8"
            />
          </pattern>

          {/* Glowing blue filter for fibre routes (CEO_REFERENCE) */}
          <filter id="fibreGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#38bdf8" floodOpacity="0.8" />
          </filter>

          {/* Thicker highlight glow for selected cable span */}
          <filter id="selectedSpanGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#00d2ff" floodOpacity="0.95" />
          </filter>

          {/* Soft glow for offline pills */}
          <filter id="offlineGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ef4444" floodOpacity="0.75" />
          </filter>

          {/* Soft glow for stale pills */}
          <filter id="staleGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#eab308" floodOpacity="0.65" />
          </filter>

          {/* Soft glow for attention pills */}
          <filter id="attentionGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.8" />
          </filter>

          {/* Satellite terrain backdrop simulation gradient */}
          <radialGradient id="satelliteGlow" cx="50%" cy="50%" r="75%">
            <stop offset="0%" stopColor="#1E3A5F" stopOpacity={basemap === 'satellite' ? 0.35 : 0.08} />
            <stop offset="100%" stopColor="#08101C" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Base Fallback Background */}
        <rect width="1000" height="700" fill={basemap === 'satellite' ? '#070f1a' : basemap === 'dark' ? '#090e17' : '#e2e8f0'} />
        <rect width="1000" height="700" fill="url(#satelliteGlow)" />

        {/* 2. Real GIS Tile Imagery Layer (Esri / Carto / OSM) */}
        <g className="tiles-layer opacity-95 transition-opacity duration-300">
          {tiles.map(({ tx, ty, x, y }) => (
            <image
              key={`${tx}-${ty}-${basemap}`}
              href={getTileUrl(tx, ty, basemap)}
              x={x}
              y={y}
              width="256"
              height="256"
              preserveAspectRatio="none"
              crossOrigin="anonymous"
            />
          ))}
        </g>

        {/* Satellite Vignette overlay for text legibility in satellite mode */}
        {basemap === 'satellite' && (
          <rect width="1000" height="700" fill="rgba(8, 16, 28, 0.22)" pointerEvents="none" />
        )}

        {/* Overlay grid */}
        <rect width="1000" height="700" fill="url(#grid)" pointerEvents="none" />

        {/* River / Waterway polygon (Kuching River - Sungai Sarawak) */}
        <path
          d="M 0 320 Q 220 280 400 340 T 700 360 T 1000 310 L 1000 360 Q 700 410 400 390 T 0 370 Z"
          fill={basemap === 'satellite' || basemap === 'dark' ? '#0b2640' : '#B8D5E8'}
          opacity="0.75"
        />

        {/* Infrastructure Road Network */}
        <g
          stroke={basemap === 'satellite' || basemap === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}
          strokeLinecap="round"
        >
          <path d="M 375 0 L 375 700 M 0 275 L 1000 275 M 675 275 L 675 700" strokeWidth="24" />
          <path d="M 50 650 L 350 400 M 450 650 L 650 400" strokeWidth="12" />
          <path d="M 150 100 L 850 100 M 200 520 L 950 520" strokeWidth="8" strokeDasharray="6 4" />
        </g>

        {/* Geographic Area Labels */}
        {activeLayers.sites && (
          <g
            fill={basemap === 'satellite' || basemap === 'dark' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.55)'}
            fontSize="10"
            fontFamily="sans-serif"
            fontWeight="700"
            className="uppercase tracking-widest select-none pointer-events-none"
          >
            <text x="70" y="80">Matang Sector</text>
            <text x="440" y="80">Pending Hub</text>
            <text x="780" y="80">Demak Laut POP</text>
            <text x="80" y="470">Batu Kawa</text>
            <text x="740" y="470">Tabuan Jaya</text>
            <text x="460" y="365" fontSize="13" fontWeight="bold" fill="rgba(56, 189, 248, 0.65)">
              Sungai Sarawak
            </text>
          </g>
        )}

        {/* Cable Routes: Fibre (Solid Blue Glow) and Copper (Dashed Amber) (CEO_REFERENCE) */}
        {activeLayers.cableRoutes &&
          mapRoutes.map((route, i) => {
            const isFibre = i % 2 === 0;
            const isSpanSelected = activeSelectedSpanId === 'CBL_SPN_041' && i === 0;

            return (
              <g key={i}>
                {/* Glow underlay */}
                <polyline
                  points={route.map((p) => p.join(',')).join(' ')}
                  fill="none"
                  stroke={isSpanSelected ? '#00d2ff' : isFibre ? '#38bdf8' : '#f59e0b'}
                  strokeWidth={isSpanSelected ? '8' : isFibre ? '5' : '3'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={isSpanSelected ? 0.9 : isFibre ? 0.4 : 0.25}
                  filter={isSpanSelected ? 'url(#selectedSpanGlow)' : isFibre ? 'url(#fibreGlow)' : undefined}
                />

                {/* Main line */}
                <polyline
                  points={route.map((p) => p.join(',')).join(' ')}
                  fill="none"
                  stroke={isSpanSelected ? '#ffffff' : isFibre ? '#0284c7' : '#d97706'}
                  strokeWidth={isSpanSelected ? '4.5' : isFibre ? '3' : '2.5'}
                  strokeDasharray={isFibre ? 'none' : '6 4'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={timeMode === 'History' ? 0.45 : 0.95}
                />
              </g>
            );
          })}

        {/* Utility Poles (Small white dots) (CEO_REFERENCE) */}
        {activeLayers.poles &&
          [
            [175, 452],
            [317, 320],
            [529, 284],
            [595, 311],
            [639, 352],
            [750, 411],
            [704, 452],
            [645, 247],
            [945, 256],
            [810, 380],
            [830, 367],
            [947, 315],
            [888, 511],
            [885, 520],
          ].map(([px, py], idx) => (
            <circle
              key={idx}
              cx={px}
              cy={py}
              r="2.5"
              fill="#FFFFFF"
              stroke="#0f172a"
              strokeWidth="0.8"
              opacity="0.85"
            />
          ))}

        {/* CCTV Surveillance glyphs (CEO_REFERENCE) */}
        {activeLayers.cctv &&
          [
            [418, 260],
            [237, 354],
            [614, 442],
            [834, 226],
          ].map(([cx, cy], idx) => (
            <g key={idx} transform={`translate(${cx}, ${cy})`} opacity="0.9">
              <circle r="7.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" />
              <path
                d="M -3.5 -2.5 L 2 -2.5 L 2 2.5 L -3.5 2.5 Z M 2 -1 L 4.5 -2.5 L 4.5 2.5 L 2 1 Z"
                fill="#38bdf8"
              />
            </g>
          ))}

        {/* Cluster Badges with highest severity halo */}
        {activeLayers.clusters &&
          mapClusters.map((c) => (
            <g
              key={c.id}
              transform={`translate(${c.x}, ${c.y})`}
              className="cursor-pointer transition-transform hover:scale-115"
              onClick={() => {
                handleZoomIn();
                setPan({ x: (360 - c.x) * 0.5, y: (350 - c.y) * 0.5 });
              }}
            >
              <circle
                r="16"
                fill="#0284c7"
                stroke="#FFFFFF"
                strokeWidth="2"
                filter="drop-shadow(0px 3px 8px rgba(0,0,0,0.6))"
              />
              <text
                y="4.5"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="11"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {c.count}
              </text>
            </g>
          ))}

        {/* Devices & Markers (CEO_REFERENCE Symbology) */}
        {activeLayers.devices &&
          enrichedMarkers.map((m) => {
            const isSelected = selectedId === m.id || selectedId === 'EVT_0128' && m.id === 'DEV_002';

            // Incident devices render as labeled pills with soft glow (CEO_REFERENCE)
            if (m.isOffline || m.isStale || m.isAttention) {
              const label = m.isOffline
                ? `${m.id.replace('_', '-')} Offline`
                : m.isAttention
                ? `${m.id.replace('_', '-')} Attention`
                : `${m.id.replace('_', '-')} Stale`;

              const filterUrl = m.isOffline
                ? 'url(#offlineGlow)'
                : m.isAttention
                ? 'url(#attentionGlow)'
                : 'url(#staleGlow)';

              const pillBg = m.isOffline
                ? 'rgba(239, 68, 68, 0.22)'
                : m.isAttention
                ? 'rgba(245, 158, 11, 0.25)'
                : 'rgba(234, 179, 8, 0.22)';

              const pillStroke = m.isOffline ? '#ef4444' : m.isAttention ? '#f59e0b' : '#eab308';
              const pillWidth = m.isAttention ? 124 : 112;

              return (
                <g
                  key={m.id}
                  transform={`translate(${m.x}, ${m.y})`}
                  className="cursor-pointer transition-all duration-150 hover:scale-110"
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
                  {/* Selected ring */}
                  {isSelected && (
                    <rect
                      x={-(pillWidth / 2) - 4}
                      y="-16"
                      width={pillWidth + 8}
                      height="32"
                      rx="16"
                      fill="none"
                      stroke="#00d2ff"
                      strokeWidth="2.5"
                      className="animate-pulse"
                    />
                  )}

                  {/* Pulse halo on new incident events (Section 8.5) */}
                  {m.isNewEvent && (
                    <rect
                      x={-(pillWidth / 2) - 3}
                      y="-15"
                      width={pillWidth + 6}
                      height="30"
                      rx="15"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      className="animate-ping motion-reduce:hidden opacity-75"
                    />
                  )}

                  {/* Pill Background with Soft Glow */}
                  <rect
                    x={-(pillWidth / 2)}
                    y="-12"
                    width={pillWidth}
                    height="24"
                    rx="12"
                    fill={pillBg}
                    stroke={pillStroke}
                    strokeWidth="1.5"
                    filter={filterUrl}
                  />

                  {/* Icon & Label inside Pill */}
                  {m.isOffline ? (
                    <rect x={-(pillWidth / 2) + 8} y="-4" width="8" height="8" rx="1.5" fill="#ef4444" />
                  ) : m.isAttention ? (
                    <polygon
                      points={`${-(pillWidth / 2) + 12},-5 ${-(pillWidth / 2) + 17},5 ${-(pillWidth / 2) + 7},5`}
                      fill="#f59e0b"
                    />
                  ) : (
                    <circle cx={-(pillWidth / 2) + 12} cy="0" r="4" fill="none" stroke="#eab308" strokeWidth="2" />
                  )}

                  <text
                    x={-(pillWidth / 2) + 24}
                    y="3.5"
                    fill="#FFFFFF"
                    fontSize="9.5"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    {label}
                  </text>
                </g>
              );
            }

            // Online devices render as small green dots (CEO_REFERENCE)
            return (
              <g
                key={m.id}
                transform={`translate(${m.x}, ${m.y})`}
                className="cursor-pointer transition-transform hover:scale-130"
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
                {isSelected && (
                  <circle
                    r="12"
                    fill="none"
                    stroke="#00d2ff"
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                )}
                <circle
                  r="4.5"
                  fill="#22c55e"
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  filter="drop-shadow(0px 1px 3px rgba(0,0,0,0.6))"
                />
              </g>
            );
          })}
      </svg>

      {/* Lightweight Hover Card Preview (Section 7.2.6: hover preview on map markers) */}
      {hoveredMarker && hoverPos && (
        <div
          style={{
            left: `${Math.min(hoverPos.x + 14, (containerSize.width || 1200) - 260)}px`,
            top: `${Math.min(hoverPos.y - 45, (containerSize.height || 700) - 150)}px`,
          }}
          className="absolute z-40 w-60 rounded-lg border border-border/80 glass-panel p-2.5 text-foreground shadow-2xl backdrop-blur-md pointer-events-none animate-in fade-in-50 duration-150 select-none"
        >
          <div className="flex items-center justify-between border-b border-border/60 pb-1 mb-1.5">
            <span className="font-mono text-xs font-bold text-primary">{hoveredMarker.id}</span>
            <span
              className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                hoveredMarker.status === 'online'
                  ? 'bg-status-online/20 text-status-online'
                  : hoveredMarker.status === 'offline'
                  ? 'bg-status-offline/20 text-status-offline'
                  : 'bg-status-stale/20 text-status-stale'
              }`}
            >
              {hoveredMarker.status}
            </span>
          </div>

          <div className="space-y-1 text-xs font-sans">
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>Name:</span>
              <span className="font-medium text-foreground truncate max-w-[130px]">{hoveredMarker.name}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>Type:</span>
              <span className="font-medium text-foreground">{hoveredMarker.type}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>Location:</span>
              <span className="font-medium text-foreground truncate max-w-[130px]">{hoveredMarker.site}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>Last seen:</span>
              <span className="font-mono text-[10.5px] text-foreground">{hoveredMarker.lastContact}</span>
            </div>
          </div>
        </div>
      )}

      {/* Scale Bar, Mouse Coordinates & GIS Attribution Readout (Bottom-Left) (Section 6.6) */}
      <div className="absolute bottom-16 left-3 text-[10px] text-muted-foreground/80 flex items-center gap-3 pointer-events-none select-none font-mono z-20">
        {/* Scale Bar */}
        <div className="flex items-center gap-1.5 border-b border-muted-foreground/50 pb-0.5">
          <div className="w-12 h-1 border-l border-r border-muted-foreground/60" />
          <span className="text-[10px] font-medium">10 km</span>
        </div>

        {/* Live Mouse Coordinates Readout */}
        <div className="flex items-center gap-1 text-[10.5px] text-foreground font-semibold">
          <span>{mouseCoords.lat}° N, {mouseCoords.lon}° E</span>
        </div>

        {/* Attribution */}
        <span className="text-[9.5px] text-muted-foreground/60 hidden sm:inline">
          {basemap === 'satellite'
            ? '© Esri, Maxar, Earthstar Geographics'
            : basemap === 'dark'
            ? '© CARTO © OpenStreetMap'
            : '© OpenStreetMap contributors'}
        </span>
      </div>

      {/* Zoom, Compass, and Reset Controls (Bottom Right above Assets Pill) (Section 6.6) */}
      <div className="absolute bottom-28 right-3 flex flex-col gap-1.5 z-20 pointer-events-auto">
        <div className="flex flex-col rounded-lg border border-border/80 glass-panel overflow-hidden shadow-xl">
          <button
            className="size-8 flex items-center justify-center hover:bg-muted/60 text-foreground transition-colors border-b border-border/60"
            onClick={handleZoomIn}
            aria-label="Zoom in"
          >
            <ZoomIn className="size-4" />
          </button>
          <button
            className="size-8 flex items-center justify-center hover:bg-muted/60 text-foreground transition-colors border-b border-border/60"
            onClick={handleReset}
            aria-label="Reset zoom and center"
          >
            <Maximize className="size-4" />
          </button>
          <button
            className="size-8 flex items-center justify-center hover:bg-muted/60 text-foreground transition-colors"
            onClick={handleZoomOut}
            aria-label="Zoom out"
          >
            <ZoomOut className="size-4" />
          </button>
        </div>

        <button
          className="size-8 rounded-lg border border-border/80 glass-panel flex items-center justify-center hover:bg-muted/60 text-muted-foreground hover:text-foreground shadow-xl transition-colors"
          onClick={handleReset}
          aria-label="Compass heading reset"
        >
          <Compass className="size-4 text-primary" />
        </button>
      </div>
    </div>
  );
};

export default MapCanvas;
