import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Info } from 'lucide-react';
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
  zoomInSignal?: number;
  zoomOutSignal?: number;
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
  zoomInSignal,
  zoomOutSignal,
}) => {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredMarker, setHoveredMarker] = useState<any | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredRoute, setHoveredRoute] = useState<{ id: string; type: string; length: string; status: string } | null>(null);
  const [hoverRoutePos, setHoverRoutePos] = useState<{ x: number; y: number } | null>(null);
  const [, setMouseCoords] = useState<{ lat: number; lon: number }>({
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

  // React to external Zoom In / Zoom Out controls
  useEffect(() => {
    if (zoomInSignal && zoomInSignal > 0) {
      handleZoomIn();
    }
  }, [zoomInSignal, handleZoomIn]);

  useEffect(() => {
    if (zoomOutSignal && zoomOutSignal > 0) {
      handleZoomOut();
    }
  }, [zoomOutSignal, handleZoomOut]);

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

        {/* Geographic Labels & Highway Badges (Figma visual parity) */}
        <g className="geo-labels pointer-events-none select-none">
          {/* AH150 Highway Shield */}
          <g transform="translate(182, 228)">
            <rect x="0" y="0" width="46" height="20" rx="4" fill="#1e40af" stroke="#60a5fa" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))" />
            <text x="23" y="14" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="sans-serif">AH150</text>
          </g>

          {/* Pending */}
          <text x="55" y="390" fill="#cbd5e1" fontSize="13" fontWeight="600" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))">Pending</text>

          {/* Kuching International Airport */}
          <g transform="translate(65, 540)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))">
            <path d="M12 2L10 8L4 10L4 12L10 11L10 16L8 18L8 20L12 19L16 20L16 18L14 16L14 11L20 12L20 10L14 8L12 2Z" fill="#e2e8f0" transform="translate(0, 0) scale(0.8)" />
            <text x="24" y="10" fill="#f1f5f9" fontSize="11" fontWeight="600">Kuching</text>
            <text x="24" y="22" fill="#cbd5e1" fontSize="10" fontWeight="500">International Airport</text>
          </g>

          {/* Satok */}
          <text x="230" y="670" fill="#f8fafc" fontSize="15" fontWeight="600" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))">Satok</text>

          {/* Kuching (Primary City Label) */}
          <text x="318" y="495" fill="#ffffff" fontSize="23" fontWeight="700" letterSpacing="0.5px" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.9))">Kuching</text>

          {/* Sungai Sarawak (Waterway Label) */}
          <text x="540" y="350" fill="#93c5fd" fontSize="13" fontWeight="500" fontStyle="italic" opacity="0.85" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))">Sungai Sarawak</text>

          {/* Telaga Air */}
          <text x="615" y="165" fill="#f1f5f9" fontSize="14" fontWeight="600" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))">Telaga Air</text>

          {/* Batu Lintang */}
          <text x="595" y="630" fill="#f1f5f9" fontSize="14" fontWeight="600" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))">Batu Lintang</text>

          {/* Samarahan */}
          <text x="765" y="700" fill="#f1f5f9" fontSize="14" fontWeight="600" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))">Samarahan</text>
        </g>

        {/* Cable Routes: Blue network (Trunk solid 3px bright blue with soft glow, Branch dashed 2px) */}
        {activeLayers.cableRoutes &&
          mapRoutes.map((route, i) => {
            const isTrunk = i === 1 || i === 3 || i === 4 || i === 6 || i === 8 || i === 9; // Core trunk backbone
            const isSpanSelected = (activeSelectedSpanId === 'CBL_SPN_041' && i === 0) || (selectedId && selectedId.includes(String(i + 1)));
            const routeId = `CBL-KCH-${String(i + 1).padStart(2, '0')}`;
            const isHovered = hoveredRoute?.id === routeId;
            const hasHoveredOther = Boolean(hoveredRoute && hoveredRoute.id !== routeId);

            // Downstream of offline device
            const isDownstreamOffline = (selectedId === 'DEV_004' && i === 9) || (selectedId === 'DEV_011' && i === 1);
            // Stale device segment shimmer
            const isStaleSegment = (selectedId === 'DEV_003' && i === 4) || (selectedId === 'DEV_008' && i === 2);
            // Airport & Satok spur (amber dashed cable span matching Figma)
            const isAirportSpur = i === 11 || i === 12;

            let strokeColor = isAirportSpur ? '#f59e0b' : '#38bdf8';
            let strokeWidth = isTrunk ? '3' : '2';
            let strokeDash = isAirportSpur ? '5 4' : isTrunk ? 'none' : '6 4';

            if (isDownstreamOffline) {
              strokeColor = '#e33f50';
              strokeDash = '4 4';
            } else if (isStaleSegment) {
              strokeColor = '#f59e0b';
            } else if (isSpanSelected || isHovered) {
              strokeColor = '#00d2ff';
              strokeWidth = '4.5';
            }

            return (
              <g
                key={i}
                className="cursor-pointer transition-opacity duration-150"
                style={{ opacity: hasHoveredOther ? 0.55 : 1 }}
                onClick={() => {
                  if (onMarkerClick) onMarkerClick(routeId);
                }}
                onMouseEnter={(e) => {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (rect) {
                    setHoveredRoute({
                      id: routeId,
                      type: isTrunk ? 'Fibre Primary Trunk (24-Core SM)' : 'Fibre Feeder Branch Span',
                      length: `${(2.4 + (i * 0.8) % 3.6).toFixed(1)} km`,
                      status: isDownstreamOffline ? 'Fault • Signal Interrupted' : isStaleSegment ? 'Degraded • Delayed Telemetry' : 'Normal (99.98% SLA)',
                    });
                    setHoverRoutePos({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }
                }}
                onMouseMove={(e) => {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (rect) {
                    setHoverRoutePos({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }
                }}
                onMouseLeave={() => setHoveredRoute(null)}
              >
                {/* Soft outer glow underlay */}
                <polyline
                  points={route.map((p) => p.join(',')).join(' ')}
                  fill="none"
                  stroke={isDownstreamOffline ? '#e33f50' : isSpanSelected || isHovered ? '#00d2ff' : isAirportSpur ? '#f59e0b' : '#38bdf8'}
                  strokeWidth={isSpanSelected || isHovered ? '10' : '6'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={isSpanSelected || isHovered ? 0.85 : 0.35}
                  filter={isSpanSelected || isHovered ? 'url(#selectedSpanGlow)' : 'url(#fibreGlow)'}
                />

                {/* Main route path line */}
                <polyline
                  points={route.map((p) => p.join(',')).join(' ')}
                  fill="none"
                  stroke={isSpanSelected ? '#ffffff' : strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDash}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={timeMode === 'History' ? 0.5 : 0.95}
                />

                {/* Ambient Telemetry Flow (Blue/Amber dashes marching along line, capped at 30 fps) */}
                {timeMode !== 'History' && !isDownstreamOffline && (
                  <polyline
                    points={route.map((p) => p.join(',')).join(' ')}
                    fill="none"
                    stroke={isAirportSpur ? '#fde68a' : '#93c5fd'}
                    strokeWidth={isHovered ? '2.5' : '1.5'}
                    strokeDasharray="6 6"
                    className="data-flow-active pointer-events-none"
                    opacity={isHovered ? 1 : 0.75}
                  />
                )}

                {/* Wide invisible hit target for comfortable hover */}
                <polyline
                  points={route.map((p) => p.join(',')).join(' ')}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="20"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

        {/* Circular network junction markers (22x22 halo, 20px body) */}
        {activeLayers.cableRoutes && [
          [365, 190], [345, 225], [312, 292], [295, 355], [238, 388], [272, 455],
          [442, 462], [578, 358], [742, 442], [652, 572], [615, 610], [422, 552], [178, 482]
        ].map(([nx, ny], idx) => (
          <g key={`junction-node-${idx}`} transform={`translate(${nx}, ${ny})`} className="pointer-events-none">
            <circle r="11" fill="rgba(16, 185, 129, 0.25)" />
            <circle r="8" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
          </g>
        ))}

        {/* Amber warning triangles for network warnings (vegetation / cable sag) */}
        {activeLayers.events && [
          [392, 279], [492, 183], [597, 492]
        ].map(([wx, wy], idx) => (
          <g key={`hazard-warn-${idx}`} transform={`translate(${wx}, ${wy})`} className="cursor-pointer transition-transform hover:scale-125">
            <circle r="11" fill="rgba(245, 158, 11, 0.25)" />
            <polygon points="0,-7 7,5 -7,5" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.8" />
            <text y="3.5" textAnchor="middle" fill="#000000" fontSize="7.5" fontWeight="bold">!</text>
          </g>
        ))}

        {/* 42 Utility Poles (Small white dots with dark outline) */}
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
              opacity="0.95"
            />
          ))}

        {/* 6 CCTV Surveillance Cameras (Dark navy body with thin blue ring and video icon) */}
        {activeLayers.cctv &&
          mapCameras.map((cam) => (
            <g
              key={cam.id}
              transform={`translate(${cam.x}, ${cam.y})`}
              className="cursor-pointer transition-transform hover:scale-125"
              onClick={() => onMarkerClick(cam.id)}
            >
              <title>{cam.name}</title>
              <circle r="11" fill="rgba(56, 189, 248, 0.25)" />
              <circle r="8.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" />
              <path
                d="M -3.5 -2.5 L 1.5 -2.5 L 1.5 2.5 L -3.5 2.5 Z M 1.5 -1 L 4 -2.5 L 4 2.5 L 1.5 1 Z"
                fill="#ffffff"
              />
            </g>
          ))}

        {/* Clustered Event Badges at low zoom */}
        {activeLayers.events &&
          mapClusters.map((c) => {
            const badgeColor =
              c.severity === 'high' ? '#e33f50' : c.severity === 'medium' ? '#f59e0b' : '#1850a0';

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
                  r="13"
                  fill={badgeColor}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.6))"
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

        {/* Devices & Markers (Figma Section 4.10: 81x26 pill for incident devices & DEV-002 warning) */}
        {activeLayers.devices &&
          enrichedMarkers.map((m) => {
            const isSelected = selectedId === m.id || (selectedId === 'EVT_0128' && m.id === 'DEV_002');

            // Incident devices & warning DEV-002 render as pills
            if (m.isOffline || m.isStale || m.id === 'DEV_002') {
              const pillWidth = 84;
              const pillHeight = 26;
              const isOffline = m.isOffline;
              const isWarning = m.id === 'DEV_002';

              return (
                <g
                  key={m.id}
                  transform={`translate(${m.x}, ${m.y})`}
                  className="cursor-pointer transition-all duration-150 hover:scale-110 select-none"
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
                  {/* Selection pulse ring */}
                  {isSelected && (
                    <rect
                      x={-(pillWidth / 2) - 3}
                      y={-(pillHeight / 2) - 3}
                      width={pillWidth + 6}
                      height={pillHeight + 6}
                      rx="16"
                      fill="none"
                      stroke="#00d2ff"
                      strokeWidth="2"
                      className="animate-pulse"
                    />
                  )}

                  {/* Dark translucent background pill matching Figma */}
                  <rect
                    x={-(pillWidth / 2)}
                    y={-(pillHeight / 2)}
                    width={pillWidth}
                    height={pillHeight}
                    rx="13"
                    fill="rgba(20, 27, 35, 0.90)"
                    stroke={isOffline ? 'rgba(247, 128, 139, 0.6)' : isWarning ? 'rgba(245, 158, 11, 0.6)' : 'rgba(203, 208, 216, 0.4)'}
                    strokeWidth="1"
                    filter={isOffline ? 'url(#offlineGlow)' : isWarning ? 'url(#attentionGlow)' : undefined}
                  />

                  {/* Status Circle or Warning Triangle inset 2px on left */}
                  <g transform={`translate(${-(pillWidth / 2) + 12}, 0)`}>
                    {isWarning ? (
                      <>
                        <polygon points="0,-7 7,5 -7,5" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.8" />
                        <text y="3.5" textAnchor="middle" fill="#000000" fontSize="7.5" fontWeight="bold">!</text>
                      </>
                    ) : (
                      <>
                        <circle
                          r="9"
                          fill={isOffline ? '#e33f50' : '#a5acb8'}
                          stroke={isOffline ? '#f7808b' : '#cbd0d8'}
                          strokeWidth="0.8"
                        />
                        <text
                          y="3.5"
                          textAnchor="middle"
                          fill={isOffline ? '#ffffff' : '#424a57'}
                          fontSize="11"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          !
                        </text>
                      </>
                    )}
                  </g>

                  {/* Device ID text in white 12px semibold */}
                  <text
                    x={-(pillWidth / 2) + 26}
                    y="4"
                    fill="#FFFFFF"
                    fontSize="12"
                    fontWeight="600"
                    fontFamily="sans-serif"
                    letterSpacing="0.2px"
                  >
                    {formatId(m.id)}
                  </text>
                </g>
              );
            }

            // Online devices: 22x22 halo with green body and white ring (Section 4.10)
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
                    r="14"
                    fill="none"
                    stroke="#00d2ff"
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                )}
                {/* 22px Halo */}
                <circle
                  r="11"
                  fill="rgba(16, 185, 129, 0.25)"
                />
                {/* 20px / 10px body */}
                <circle
                  r="5"
                  fill="#10b981"
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

      {/* Cable Route Hover Tooltip (Enterprise Polish) */}
      {hoveredRoute && hoverRoutePos && (
        <div
          style={{
            left: `${Math.min(hoverRoutePos.x + 16, (containerSize.width || 1200) - 280)}px`,
            top: `${Math.min(hoverRoutePos.y - 30, (containerSize.height || 700) - 120)}px`,
          }}
          className="absolute z-40 w-64 rounded-lg border border-[#2a323d] bg-[#151a22]/95 p-3 text-white shadow-2xl backdrop-blur-md pointer-events-none animate-in fade-in-50 duration-150 select-none"
        >
          <div className="flex items-center justify-between border-b border-[#2a323d] pb-1.5 mb-2">
            <span className="font-mono text-xs font-bold text-sky-400">{hoveredRoute.id}</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
              ACTIVE
            </span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="text-[11px] text-slate-300 font-medium">{hoveredRoute.type}</div>
            <div className="flex justify-between text-slate-400 text-[11px] pt-1">
              <span>Length:</span>
              <span className="font-mono text-white font-medium">{hoveredRoute.length}</span>
            </div>
            <div className="text-[10.5px] text-emerald-400 pt-0.5 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{hoveredRoute.status}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MapCanvas;
