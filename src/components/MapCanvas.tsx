import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Compass,
  Info,
} from 'lucide-react';
import { mapMarkers, mapClusters, mapRoutes, mapPoles, mapCameras } from '@/data/map';
import { devices } from '@/data/devices';
import { events } from '@/data/events';
import { formatId } from '@/lib/utils';
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

  const getLabelTileUrl = (tx: number, ty: number, bm: string) => {
    if (bm === 'satellite') {
      return `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/12/${ty}/${tx}`;
    }
    if (bm === 'dark') {
      return `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/12/${ty}/${tx}`;
    }
    return null;
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

        {/* 2. Real GIS Tile Imagery Layer (Esri World Imagery / Esri Dark Gray / OSM) */}
        <g className="tiles-layer transition-opacity duration-300">
          {tiles.map(({ tx, ty, x, y }) => (
            <image
              key={`base-${tx}-${ty}-${basemap}`}
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

        {/* 3. Real Place Names & Boundaries Reference Tile Layer (Esri Reference Labels) */}
        {basemap !== 'streets' && basemap !== 'terrain' && (
          <g className="labels-layer transition-opacity duration-300 pointer-events-none opacity-90">
            {tiles.map(({ tx, ty, x, y }) => {
              const labelUrl = getLabelTileUrl(tx, ty, basemap);
              if (!labelUrl) return null;
              return (
                <image
                  key={`label-${tx}-${ty}-${basemap}`}
                  href={labelUrl}
                  x={x}
                  y={y}
                  width="256"
                  height="256"
                  preserveAspectRatio="none"
                  crossOrigin="anonymous"
                />
              );
            })}
          </g>
        )}

        {/* Cable Routes: Fibre (Solid Blue Glow) and Copper (Dashed Amber) (B7, CEO_REFERENCE) */}
        {activeLayers.cableRoutes &&
          mapRoutes.map((route, i) => {
            const isFibre = i % 2 === 0;
            const isSpanSelected = activeSelectedSpanId === 'CBL_SPN_041' && i === 0;

            return (
              <g key={i}>
                {/* Soft outer glow underlay (B7: blurred wider stroke at ~35% opacity) */}
                <polyline
                  points={route.map((p) => p.join(',')).join(' ')}
                  fill="none"
                  stroke={isSpanSelected ? '#00d2ff' : isFibre ? '#38bdf8' : '#f59e0b'}
                  strokeWidth={isSpanSelected ? '10' : isFibre ? '6' : '4'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={isSpanSelected ? 0.85 : isFibre ? 0.35 : 0.2}
                  filter={isSpanSelected ? 'url(#selectedSpanGlow)' : isFibre ? 'url(#fibreGlow)' : undefined}
                />

                {/* Main line: 3px solid blue for fibre, 3px dashed amber for copper (B7) */}
                <polyline
                  points={route.map((p) => p.join(',')).join(' ')}
                  fill="none"
                  stroke={isSpanSelected ? '#ffffff' : isFibre ? '#0284c7' : '#d97706'}
                  strokeWidth={isSpanSelected ? '5' : '3'}
                  strokeDasharray={isFibre ? 'none' : '6 4'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={timeMode === 'History' ? 0.45 : 0.95}
                />
              </g>
            );
          })}

        {/* 60+ Utility Poles (Small white dots with dark outline) (B6, B7) */}
        {activeLayers.poles &&
          mapPoles.map(([px, py], idx) => (
            <circle
              key={idx}
              cx={px}
              cy={py}
              r="2.5"
              fill="#FFFFFF"
              stroke="#0f172a"
              strokeWidth="0.8"
              opacity="0.9"
            />
          ))}

        {/* CCTV Surveillance Camera Feeds (B6, B7) */}
        {activeLayers.cctv &&
          mapCameras.map((cam) => (
            <g
              key={cam.id}
              transform={`translate(${cam.x}, ${cam.y})`}
              opacity="0.95"
              className="cursor-pointer transition-transform hover:scale-125"
            >
              <title>{cam.name}</title>
              <circle r="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" />
              <path
                d="M -3.5 -2.5 L 2 -2.5 L 2 2.5 L -3.5 2.5 Z M 2 -1 L 4.5 -2.5 L 4.5 2.5 L 2 1 Z"
                fill="#ffffff"
              />
            </g>
          ))}

        {/* Clustered Event Badges with highest severity halo (B7) */}
        {activeLayers.events &&
          mapClusters.map((c) => {
            const badgeColor =
              c.severity === 'high' ? '#ef4444' : c.severity === 'medium' ? '#f59e0b' : '#0284c7';

            return (
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
                  r="14"
                  fill={badgeColor}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  filter="drop-shadow(0px 3px 8px rgba(0,0,0,0.6))"
                />
                <text
                  y="4"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {c.count}
                </text>
              </g>
            );
          })}

        {/* Devices & Markers (CEO_REFERENCE Symbology: B6) */}
        {activeLayers.devices &&
          enrichedMarkers.map((m) => {
            const isSelected = selectedId === m.id || selectedId === 'EVT_0128' && m.id === 'DEV_002';

            // Incident devices render as compact pills (height 28px, radius 14px, 20px round icon, white ID text, no status word) (B6)
            if (m.isOffline || m.isStale || m.isAttention) {
              const pillWidth = 98;
              const filterUrl = m.isOffline
                ? 'url(#offlineGlow)'
                : m.isAttention
                ? 'url(#attentionGlow)'
                : undefined; // Stale has NO colored glow per B6

              const pillStroke = m.isOffline
                ? 'rgba(239, 68, 68, 0.6)'
                : m.isAttention
                ? 'rgba(245, 158, 11, 0.6)'
                : 'rgba(148, 163, 184, 0.4)';

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
                  {/* Selected pulse ring */}
                  {isSelected && (
                    <rect
                      x={-(pillWidth / 2) - 4}
                      y="-18"
                      width={pillWidth + 8}
                      height="36"
                      rx="18"
                      fill="none"
                      stroke="#00d2ff"
                      strokeWidth="2.5"
                      className="animate-pulse"
                    />
                  )}

                  {/* Incident Pill: Dark glass background, 1px subtle border, height 28px, radius 14px (B6) */}
                  <rect
                    x={-(pillWidth / 2)}
                    y="-14"
                    width={pillWidth}
                    height="28"
                    rx="14"
                    fill="rgba(15, 23, 42, 0.88)"
                    stroke={pillStroke}
                    strokeWidth="1"
                    filter={filterUrl}
                  />

                  {/* 20px Round Status Icon on Left (B6) */}
                  {m.isOffline ? (
                    <g transform={`translate(${-(pillWidth / 2) + 14}, 0)`}>
                      <circle r="9" fill="#ef4444" />
                      <text
                        y="3.5"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        !
                      </text>
                    </g>
                  ) : m.isAttention ? (
                    <g transform={`translate(${-(pillWidth / 2) + 14}, 0)`}>
                      <polygon
                        points="0,-8 8,7 -8,7"
                        fill="#f59e0b"
                      />
                      <text
                        y="4.5"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9.5"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        !
                      </text>
                    </g>
                  ) : (
                    /* Stale: grey circle with exclamation (B6: stale must be grey!) */
                    <g transform={`translate(${-(pillWidth / 2) + 14}, 0)`}>
                      <circle r="9" fill="#64748b" />
                      <text
                        y="3.5"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        !
                      </text>
                    </g>
                  )}

                  {/* White ID text at 13px semibold, NO status word inside pill (B6) */}
                  <text
                    x={-(pillWidth / 2) + 28}
                    y="4.5"
                    fill="#FFFFFF"
                    fontSize="13"
                    fontWeight="600"
                    fontFamily="sans-serif"
                  >
                    {formatId(m.id)}
                  </text>
                </g>
              );
            }

            // Online devices: 10px green dots with a white ring and NO label (B6, CEO_REFERENCE)
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
                  r="5"
                  fill="#22c55e"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
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

      {/* Scale Bar & Mouse Coordinates (Bottom-Left) (B5) */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1 pointer-events-none select-none z-20">
        <div className="flex items-center gap-3">
          {/* 3-tick scale bar (0, 2.5, 5 km) */}
          <div className="flex flex-col gap-0.5">
            <div className="relative w-28 h-2">
              <div className="w-full h-[1.5px] bg-white shadow-sm mt-1" />
              <div className="absolute left-0 top-0 h-2 w-[1.5px] bg-white" />
              <div className="absolute left-1/2 top-0 h-2 w-[1.5px] bg-white" />
              <div className="absolute right-0 top-0 h-2 w-[1.5px] bg-white" />
            </div>
            <div className="flex justify-between w-28 text-[11px] font-sans font-medium text-white/95 drop-shadow">
              <span>0</span>
              <span>2.5</span>
              <span>5 km</span>
            </div>
          </div>

          {/* Quieter Mouse Coordinates */}
          <span className="text-[11px] text-white/70 font-mono ml-2 drop-shadow">
            {mouseCoords.lat}° N, {mouseCoords.lon}° E
          </span>
        </div>
      </div>

      {/* Attribution & Classification Label (Bottom-Right) (B5) */}
      <div className="absolute bottom-3 right-4 flex items-center gap-1.5 text-[10px] text-white/75 font-sans pointer-events-none select-none drop-shadow z-20">
        <span>Maxar Technologies, OpenStreetMap contributors</span>
        <span className="opacity-40">|</span>
        <span className="font-semibold text-white/90">TM FALCON (Internal Use Only)</span>
        <span className="pointer-events-auto cursor-pointer opacity-70 hover:opacity-100 transition-opacity ml-0.5">
          <Info className="size-3" />
        </span>
      </div>

      {/* Vertical Map Controls (Bottom-Right, above assets pill) (B5) */}
      <div className="absolute bottom-16 right-4 flex flex-col gap-1.5 z-20 pointer-events-auto">
        <div className="flex flex-col rounded-lg border border-border/80 glass-panel overflow-hidden shadow-2xl">
          <button
            className="size-8 flex items-center justify-center hover:bg-muted/60 text-foreground transition-colors border-b border-border/60"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <ZoomIn className="size-4" />
          </button>
          <button
            className="size-8 flex items-center justify-center hover:bg-muted/60 text-foreground transition-colors border-b border-border/60"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <ZoomOut className="size-4" />
          </button>
          <button
            className="size-8 flex items-center justify-center hover:bg-muted/60 text-foreground transition-colors border-b border-border/60"
            onClick={handleReset}
            aria-label="Fit to data"
            title="Fit to data"
          >
            <Maximize className="size-4" />
          </button>
          <button
            className="size-8 flex items-center justify-center hover:bg-muted/60 text-primary transition-colors"
            onClick={handleReset}
            aria-label="Compass heading reset"
            title="Reset orientation"
          >
            <Compass className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapCanvas;
