import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Minus,
  Maximize2,
  Layers,
  ExternalLink,
  Sliders,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapPopupShell } from '@/components/overview/popups/MapPopupShell';
import { computePopupPlacement, type PlacementResult } from '@/lib/popupPlacement';
import {
  latLngToWorldPx,
  projectLatLngToSvg,
  formatCoordinates,
} from '@/lib/geo';
import { useUiMode } from '@/hooks/useUiMode';
import { cn } from '@/lib/utils';
import { DeviceConnectivityBadge } from './DeviceStateBadge';
import { getLastContactFreshness } from '@/data/deviceSelectors';
import type {
  DeviceConnectivityState,
  DevicePolicyConfig,
  DeviceWithRelations,
} from '@/types/devices';
import type { CableSpanRecord, PoleLocation } from '@/types/assets';

export interface DeviceMapCanvasProps {
  devices: DeviceWithRelations[];
  cableSpans?: CableSpanRecord[];
  poleLocationsById?: Map<string, PoleLocation>;
  centerPoint: PoleLocation;
  zoomLevel?: number;
  selectedDeviceId?: string | null;
  onSelectDevice?: (identifier: string | null) => void;
  onOpenDevice?: (identifier: string) => void;
  onConfigureDevice?: (identifier: string) => void;
  policyConfig?: DevicePolicyConfig;
  showPopup?: boolean;
  showSiteCentre?: boolean;
  compactControls?: boolean;
  heightClassName?: string;
  className?: string;
}

interface DeviceCluster {
  id: string;
  x: number;
  y: number;
  devices: DeviceWithRelations[];
}

function getStateMarkerColors(state: DeviceConnectivityState): { fill: string; ring: string } {
  switch (state) {
    case 'online':
      return { fill: '#22C55E', ring: 'rgba(34, 197, 94, 0.28)' };
    case 'stale':
      return { fill: '#F5B301', ring: 'rgba(245, 179, 1, 0.28)' };
    case 'offline':
    default:
      return { fill: '#EF4444', ring: 'rgba(239, 68, 68, 0.30)' };
  }
}

export const DeviceMapCanvas: React.FC<DeviceMapCanvasProps> = ({
  devices,
  cableSpans = [],
  poleLocationsById,
  centerPoint,
  zoomLevel = 15,
  selectedDeviceId = null,
  onSelectDevice,
  onOpenDevice,
  onConfigureDevice,
  policyConfig,
  showPopup = true,
  showSiteCentre = true,
  compactControls = false,
  heightClassName = 'h-[540px]',
  className,
}) => {
  const { isTablet } = useUiMode();

  const [basemap, setBasemap] = useState<'satellite' | 'streets'>('satellite');
  const [scale, setScale] = useState<number>(1.05);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ clientX: 0, clientY: 0, panX: 0, panY: 0 });
  const [hoveredDevice, setHoveredDevice] = useState<DeviceWithRelations | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 900, height: 540 });

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const mouseStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setContainerSize({ width: r.width, height: r.height });
      }
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const tiles = useMemo(() => {
    const cPx = latLngToWorldPx(centerPoint.lat, centerPoint.lng, zoomLevel);
    const centerTileX = Math.floor(cPx.x / 256);
    const centerTileY = Math.floor(cPx.y / 256);
    const offsetInCenterTileX = cPx.x - centerTileX * 256;
    const offsetInCenterTileY = cPx.y - centerTileY * 256;

    const list: { tx: number; ty: number; x: number; y: number; dist: number }[] = [];
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const tx = centerTileX + dx;
        const ty = centerTileY + dy;
        const x = 500 - offsetInCenterTileX + dx * 256;
        const y = 350 - offsetInCenterTileY + dy * 256;
        list.push({ tx, ty, x, y, dist: dx * dx + dy * dy });
      }
    }
    return list.sort((a, b) => a.dist - b.dist);
  }, [centerPoint.lat, centerPoint.lng, zoomLevel]);

  const getTileUrl = (tx: number, ty: number, bm: 'satellite' | 'streets') => {
    if (bm === 'satellite') {
      return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoomLevel}/${ty}/${tx}`;
    }
    return `https://tile.openstreetmap.org/${zoomLevel}/${tx}/${ty}.png`;
  };

  const locatedDevices = useMemo(() => {
    return devices
      .filter((d) => Boolean(d.location))
      .map((d) => ({
        device: d,
        pt: projectLatLngToSvg(d.location!, centerPoint, zoomLevel),
      }));
  }, [devices, centerPoint, zoomLevel]);

  const deviceCoordMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const item of locatedDevices) {
      map.set(item.device.identifier, item.pt);
    }
    return map;
  }, [locatedDevices]);

  const centreSvg = useMemo(
    () => projectLatLngToSvg(centerPoint, centerPoint, zoomLevel),
    [centerPoint, zoomLevel]
  );

  const fitToDevices = useCallback(() => {
    if (locatedDevices.length === 0) {
      setPan({ x: 0, y: 0 });
      setScale(1.05);
      return;
    }
    if (locatedDevices.length === 1) {
      setPan({ x: 500 - locatedDevices[0].pt.x, y: 350 - locatedDevices[0].pt.y });
      setScale(1.45);
      return;
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const { pt } of locatedDevices) {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }
    const spanX = Math.max(80, maxX - minX + 120);
    const spanY = Math.max(80, maxY - minY + 120);
    const fitScale = Math.max(0.55, Math.min(2.2, Math.min(920 / spanX, 620 / spanY)));
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    setPan({ x: 500 - midX, y: 350 - midY });
    setScale(Number(fitScale.toFixed(2)));
  }, [locatedDevices]);

  useEffect(() => {
    fitToDevices();
  }, [centerPoint.lat, centerPoint.lng, fitToDevices]);

  useEffect(() => {
    if (!selectedDeviceId) return;
    const target = locatedDevices.find((l) => l.device.identifier === selectedDeviceId);
    if (!target) return;
    setPan({ x: 500 - target.pt.x, y: 350 - target.pt.y });
    setScale((s) => Math.max(s, 1.5));
  }, [selectedDeviceId, locatedDevices]);

  const { clusters, singleMarkers } = useMemo(() => {
    if (scale >= 1.35 || locatedDevices.length <= 6) {
      return { clusters: [] as DeviceCluster[], singleMarkers: locatedDevices };
    }
    const threshold = 32;
    const used = new Set<string>();
    const outClusters: DeviceCluster[] = [];
    const outSingles: typeof locatedDevices = [];

    for (let i = 0; i < locatedDevices.length; i++) {
      const curr = locatedDevices[i];
      if (used.has(curr.device.identifier)) continue;
      if (curr.device.identifier === selectedDeviceId) {
        used.add(curr.device.identifier);
        outSingles.push(curr);
        continue;
      }

      const group = [curr];
      used.add(curr.device.identifier);

      for (let j = i + 1; j < locatedDevices.length; j++) {
        const cand = locatedDevices[j];
        if (used.has(cand.device.identifier) || cand.device.identifier === selectedDeviceId) continue;
        const dist = Math.hypot(curr.pt.x - cand.pt.x, curr.pt.y - cand.pt.y);
        if (dist <= threshold) {
          group.push(cand);
          used.add(cand.device.identifier);
        }
      }

      if (group.length > 1) {
        const avgX = group.reduce((s, g) => s + g.pt.x, 0) / group.length;
        const avgY = group.reduce((s, g) => s + g.pt.y, 0) / group.length;
        outClusters.push({
          id: `dev-cluster-${curr.device.identifier}`,
          x: avgX,
          y: avgY,
          devices: group.map((g) => g.device),
        });
      } else {
        outSingles.push(curr);
      }
    }

    return { clusters: outClusters, singleMarkers: outSingles };
  }, [locatedDevices, scale, selectedDeviceId]);

  const svgToScreenPoint = useCallback(
    (svgX: number, svgY: number) => {
      const w = containerSize.width || 900;
      const h = containerSize.height || 540;
      const baseScale = Math.max(w / 1000, h / 700);
      return {
        x: w / 2 + baseScale * scale * (svgX - 500 + pan.x),
        y: h / 2 + baseScale * scale * (svgY - 350 + pan.y),
      };
    },
    [containerSize.width, containerSize.height, scale, pan.x, pan.y]
  );

  const selectedDeviceObj = useMemo(
    () => (selectedDeviceId ? devices.find((d) => d.identifier === selectedDeviceId) || null : null),
    [selectedDeviceId, devices]
  );

  const popupPlacement: PlacementResult | null = useMemo(() => {
    if (!showPopup || !selectedDeviceObj || !selectedDeviceObj.location) return null;
    const svgPt = deviceCoordMap.get(selectedDeviceObj.identifier);
    if (!svgPt) return null;
    const screenPt = svgToScreenPoint(svgPt.x, svgPt.y);
    return computePopupPlacement({
      marker: screenPt || { x: containerSize.width / 2, y: containerSize.height / 2 },
      popupSize: { width: 340, height: 290 },
      containerSize,
      insets: { top: 12, right: 12, bottom: 56, left: 12 },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPopup, selectedDeviceObj, deviceCoordMap, svgToScreenPoint, containerSize, pan, scale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ clientX: e.clientX, clientY: e.clientY, panX: pan.x, panY: pan.y });
    mouseStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const w = containerSize.width || 900;
      const h = containerSize.height || 540;
      const baseScale = Math.max(w / 1000, h / 700);
      const divisor = baseScale * scale || 1;
      setPan({
        x: dragStart.panX + (e.clientX - dragStart.clientX) / divisor,
        y: dragStart.panY + (e.clientY - dragStart.clientY) / divisor,
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const moved = Math.hypot(
      e.clientX - mouseStartPos.current.x,
      e.clientY - mouseStartPos.current.y
    );
    if (moved < 5 && selectedDeviceId) {
      onSelectDevice?.(null);
    }
  };

  const freshness = selectedDeviceObj
    ? getLastContactFreshness(
        selectedDeviceObj.lastContactAt,
        selectedDeviceObj.connectivityState,
        policyConfig
      )
    : null;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full overflow-hidden rounded-lg border border-border bg-slate-950 select-none',
        heightClassName,
        className
      )}
    >
      {/* Controls Top Right */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
        <div className="flex flex-col rounded-lg border border-border bg-card shadow-md overflow-hidden">
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(4.5, Number((s * 1.28).toFixed(2))))}
            title="Zoom in"
            className={cn(
              'flex items-center justify-center text-foreground hover:bg-muted transition-colors border-b border-border cursor-pointer',
              isTablet ? 'size-10' : 'size-8'
            )}
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.45, Number((s / 1.28).toFixed(2))))}
            title="Zoom out"
            className={cn(
              'flex items-center justify-center text-foreground hover:bg-muted transition-colors border-b border-border cursor-pointer',
              isTablet ? 'size-10' : 'size-8'
            )}
          >
            <Minus className="size-4" />
          </button>
          <button
            type="button"
            onClick={fitToDevices}
            title="Fit devices to view"
            className={cn(
              'flex items-center justify-center text-foreground hover:bg-muted transition-colors cursor-pointer',
              isTablet ? 'size-10' : 'size-8'
            )}
          >
            <Maximize2 className="size-3.5" />
          </button>
        </div>

        {!compactControls && (
          <button
            type="button"
            onClick={() => setBasemap((b) => (b === 'satellite' ? 'streets' : 'satellite'))}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card text-foreground shadow-md hover:bg-muted transition-colors cursor-pointer px-2',
              isTablet ? 'h-10 text-xs' : 'h-8 text-[11px]'
            )}
            title="Toggle satellite / street basemap"
          >
            <Layers className="size-3.5 text-primary" />
            <span className="font-medium capitalize">{basemap}</span>
          </button>
        )}
      </div>

      {/* Interactive SVG Map */}
      <svg
        ref={svgRef}
        viewBox="0 0 1000 700"
        preserveAspectRatio="xMidYMid slice"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDragging(false);
          setHoveredDevice(null);
        }}
        className={cn(
          'w-full h-full touch-none',
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        )}
      >
        <defs>
          <pattern id="dev-map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(148, 163, 184, 0.08)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="1000" height="700" fill="#0B1120" />
        <rect width="1000" height="700" fill="url(#dev-map-grid)" />
        <g transform={`translate(500 350) scale(${scale}) translate(${-500 + pan.x} ${-350 + pan.y})`}>
          {/* GIS Tiles */}
          <g>
            {tiles.map(({ tx, ty, x, y }) => (
              <image
                key={`tile-${tx}-${ty}-${basemap}`}
                href={getTileUrl(tx, ty, basemap)}
                x={x}
                y={y}
                width="256"
                height="256"
                preserveAspectRatio="none"
              />
            ))}
          </g>

          {/* Site Centre Point Context */}
          {showSiteCentre && (
            <g transform={`translate(${centreSvg.x}, ${centreSvg.y})`} className="pointer-events-none">
              <circle r="14" fill="rgba(47, 111, 237, 0.12)" stroke="#2F6FED" strokeDasharray="3 3" strokeWidth="1" />
              <circle r="3" fill="#2F6FED" />
            </g>
          )}

          {/* Connected Cable Spans around poles */}
          {poleLocationsById && (
            <g className="pointer-events-none">
              {cableSpans.map((span) => {
                const locA = poleLocationsById.get(span.fromPole);
                const locB = poleLocationsById.get(span.toPole);
                if (!locA || !locB) return null;
                const pA = projectLatLngToSvg(locA, centerPoint, zoomLevel);
                const pB = projectLatLngToSvg(locB, centerPoint, zoomLevel);
                return (
                  <line
                    key={span.identifier}
                    x1={pA.x}
                    y1={pA.y}
                    x2={pB.x}
                    y2={pB.y}
                    stroke="rgba(56, 189, 248, 0.5)"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                );
              })}
            </g>
          )}

          {/* Clustered Markers */}
          {clusters.map((cl) => (
            <g
              key={cl.id}
              transform={`translate(${cl.x}, ${cl.y})`}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setPan({ x: (500 - cl.x) * 0.75, y: (350 - cl.y) * 0.75 });
                setScale(1.6);
              }}
            >
              <circle r="17" fill="rgba(47, 111, 237, 0.28)" />
              <circle
                r="12"
                fill="#2F6FED"
                stroke="#FFFFFF"
                strokeWidth="2"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.6))"
              />
              <text
                y="4"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="10"
                fontWeight="700"
                fontFamily="monospace"
              >
                {cl.devices.length}
              </text>
            </g>
          ))}

          {/* Individual Device Pins */}
          {singleMarkers.map(({ device, pt }) => {
            const colors = getStateMarkerColors(device.connectivityState);
            const isSelected = selectedDeviceId === device.identifier;
            return (
              <g
                key={device.identifier}
                transform={`translate(${pt.x}, ${pt.y})`}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectDevice?.(device.identifier);
                }}
                onMouseEnter={() => {
                  setHoveredDevice(device);
                  setHoverPos(svgToScreenPoint(pt.x, pt.y));
                }}
                onMouseLeave={() => setHoveredDevice(null)}
              >
                <circle
                  r={isSelected ? 16 : 11}
                  fill={isSelected ? 'rgba(47, 111, 237, 0.35)' : colors.ring}
                />
                <circle
                  r={isSelected ? 8 : 6}
                  fill={colors.fill}
                  stroke={isSelected ? '#2F6FED' : '#FFFFFF'}
                  strokeWidth={isSelected ? 2.5 : 1.75}
                />
                {(scale >= 1.35 || isSelected || locatedDevices.length <= 16) && (
                  <g transform="translate(0, -15)" className="pointer-events-none">
                    <rect
                      x={-((device.identifier.length * 6.5 + 10) / 2)}
                      y="-10"
                      width={device.identifier.length * 6.5 + 10}
                      height="16"
                      rx="4"
                      fill="rgba(15, 23, 42, 0.88)"
                      stroke={isSelected ? '#2F6FED' : 'rgba(255,255,255,0.2)'}
                      strokeWidth="1"
                    />
                    <text
                      y="1"
                      textAnchor="middle"
                      fill="#F8FAFC"
                      fontSize="9.5"
                      fontWeight="600"
                      fontFamily="monospace"
                    >
                      {device.identifier}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Hover Tooltip */}
      {hoveredDevice && hoverPos && selectedDeviceId !== hoveredDevice.identifier && (
        <div
          className="absolute z-20 pointer-events-none px-2.5 py-1.5 rounded-md bg-card border border-border shadow-lg text-xs"
          style={{
            left: Math.min(containerSize.width - 180, Math.max(8, hoverPos.x + 12)),
            top: Math.max(8, hoverPos.y - 36),
          }}
        >
          <div className="font-mono font-semibold text-foreground">{hoveredDevice.identifier}</div>
          <div className="text-[11px] text-muted-foreground">
            {hoveredDevice.type} · Pole {hoveredDevice.installedPoleId}
          </div>
        </div>
      )}

      {/* Map Popup Shell */}
      {showPopup && selectedDeviceObj && popupPlacement && (
        <MapPopupShell
          side={popupPlacement.side}
          tailOffset={popupPlacement.tailOffset}
          typeChip={selectedDeviceObj.type}
          typeColor="blue"
          id={selectedDeviceObj.identifier}
          badge={<DeviceConnectivityBadge state={selectedDeviceObj.connectivityState} size="sm" />}
          title={`${selectedDeviceObj.model} · ${selectedDeviceObj.serial}`}
          unlocated={!selectedDeviceObj.location}
          onClose={() => onSelectDevice?.(null)}
          style={
            popupPlacement.side !== 'center'
              ? { left: `${popupPlacement.x}px`, top: `${popupPlacement.y}px` }
              : {
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }
          }
          footerActions={
            <div className="flex items-center justify-between gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onConfigureDevice?.(selectedDeviceObj.identifier)}
                className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer border-border"
              >
                <Sliders className="size-3.5" />
                <span>Configure</span>
              </Button>
              <Button
                size="sm"
                onClick={() => onOpenDevice?.(selectedDeviceObj.identifier)}
                className="h-8 px-3 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 cursor-pointer ml-auto"
              >
                <span>Open device</span>
                <ExternalLink className="size-3" />
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted border border-border text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground block">Installed on</span>
              {selectedDeviceObj.installedPoleId ? (
                <Link
                  to={`/assets/poles/${encodeURIComponent(selectedDeviceObj.installedPoleId)}`}
                  className="font-mono font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <MapPin className="size-3" />
                  <span>{selectedDeviceObj.installedPoleId}</span>
                </Link>
              ) : (
                <span className="text-muted-foreground">Not installed</span>
              )}
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Events, 30 days</span>
              <span className="font-mono font-semibold text-foreground">
                {selectedDeviceObj.events30dCount}
              </span>
            </div>
            <div className="col-span-2 border-t border-border/50 pt-1.5 flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] text-muted-foreground block">Coordinates</span>
                <span className="font-mono text-[11px] text-foreground">
                  {formatCoordinates(selectedDeviceObj.location)}
                </span>
              </div>
              {freshness && (
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block">Last contact</span>
                  <span className="text-[11px] font-medium text-foreground">
                    {freshness.relative}
                  </span>
                </div>
              )}
            </div>
          </div>
        </MapPopupShell>
      )}

      {/* Attribution */}
      <div className="absolute bottom-1.5 right-2 z-10 pointer-events-none">
        <span className="text-[9px] font-medium bg-card text-muted-foreground border border-border px-1.5 py-0.5 rounded shadow-sm">
          Maxar Technologies, OpenStreetMap contributors | TM FALCON (Internal Use Only)
        </span>
      </div>
    </div>
  );
};
