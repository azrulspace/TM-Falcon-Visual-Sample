import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  Minus,
  Maximize2,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeviceStateBadge } from '@/components/devices/DeviceStateBadge';
import { MapPopupShell } from '@/components/overview/popups/MapPopupShell';
import { computePopupPlacement, type PlacementResult } from '@/lib/popupPlacement';
import {
  latLngToWorldPx,
  projectLatLngToSvg,
  formatCoordinates,
} from '@/lib/geo';
import { evaluateDeviceFreshness } from '@/data/deviceSelectors';
import { cn } from '@/lib/utils';
import type { DeviceRecord } from '@/types/devices';
import type { PoleLocation } from '@/types/assets';

export interface DeviceMapCanvasProps {
  devices: DeviceRecord[];
  centerPoint: PoleLocation;
  zoomLevel?: number;
  selectedDeviceId?: string | null;
  onSelectDevice?: (identifier: string | null) => void;
  onOpenDevice?: (identifier: string) => void;
  onConfigureDevice?: (identifier: string) => void;
  heightClassName?: string;
  className?: string;
}

interface DeviceCluster {
  id: string;
  x: number;
  y: number;
  devices: DeviceRecord[];
}

function getDeviceMarkerColors(state: string): { fill: string; ring: string } {
  switch (state.toLowerCase()) {
    case 'online':
      return { fill: '#10B981', ring: 'rgba(16, 185, 129, 0.28)' };
    case 'offline':
      return { fill: '#EF4444', ring: 'rgba(239, 68, 68, 0.28)' };
    case 'stale':
      return { fill: '#94A3B8', ring: 'rgba(148, 163, 184, 0.28)' };
    default:
      return { fill: '#3B82F6', ring: 'rgba(59, 130, 246, 0.28)' };
  }
}

export const DeviceMapCanvas: React.FC<DeviceMapCanvasProps> = ({
  devices,
  centerPoint,
  zoomLevel = 15,
  selectedDeviceId = null,
  onSelectDevice,
  onOpenDevice,
  onConfigureDevice,
  heightClassName = 'h-[560px]',
  className,
}) => {
  const [basemap] = useState<'satellite' | 'streets'>('satellite');
  const [scale, setScale] = useState<number>(1.05);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ clientX: 0, clientY: 0, panX: 0, panY: 0 });
  const [hoveredDevice, setHoveredDevice] = useState<DeviceRecord | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 900, height: 560 });

  const containerRef = useRef<HTMLDivElement>(null);
  const mouseStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute 4x4 satellite background tiles
  const tiles = useMemo(() => {
    const cPx = latLngToWorldPx(centerPoint.lat, centerPoint.lng, zoomLevel);
    const centerTileX = Math.floor(cPx.x / 256);
    const centerTileY = Math.floor(cPx.y / 256);
    const originTileLeft = centerTileX * 256;
    const originTileTop = centerTileY * 256;
    const originOffsetX = 500 - (cPx.x - originTileLeft);
    const originOffsetY = 350 - (cPx.y - originTileTop);

    const list: { tx: number; ty: number; x: number; y: number; dist: number }[] = [];
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const tx = centerTileX + dx;
        const ty = centerTileY + dy;
        const x = originOffsetX + dx * 256;
        const y = originOffsetY + dy * 256;
        const dist = Math.hypot(x - 500, y - 350);
        list.push({ tx, ty, x, y, dist });
      }
    }
    list.sort((a, b) => a.dist - b.dist);
    return list;
  }, [centerPoint, zoomLevel]);

  // Project located devices onto canvas
  const projectedDevices = useMemo(() => {
    return devices
      .filter((d) => d.location !== null)
      .map((dev) => {
        const pt = projectLatLngToSvg(dev.location!, centerPoint, zoomLevel);
        return {
          device: dev,
          x: pt.x,
          y: pt.y,
        };
      });
  }, [devices, centerPoint, zoomLevel]);

  // Dynamic clustering for close markers (< 28px)
  const { clusters, singles } = useMemo(() => {
    const clusterRadius = 28 / scale;
    const assigned = new Set<string>();
    const cList: DeviceCluster[] = [];
    const sList: { device: DeviceRecord; x: number; y: number }[] = [];

    for (let i = 0; i < projectedDevices.length; i++) {
      const a = projectedDevices[i];
      if (assigned.has(a.device.identifier)) continue;

      const group: DeviceRecord[] = [a.device];
      let sumX = a.x;
      let sumY = a.y;

      for (let j = i + 1; j < projectedDevices.length; j++) {
        const b = projectedDevices[j];
        if (assigned.has(b.device.identifier)) continue;

        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist <= clusterRadius) {
          group.push(b.device);
          sumX += b.x;
          sumY += b.y;
          assigned.add(b.device.identifier);
        }
      }

      if (group.length > 1) {
        assigned.add(a.device.identifier);
        cList.push({
          id: `cluster-dev-${a.device.identifier}`,
          x: sumX / group.length,
          y: sumY / group.length,
          devices: group,
        });
      } else {
        sList.push(a);
      }
    }

    return { clusters: cList, singles: sList };
  }, [projectedDevices, scale]);

  // Active selected device record
  const selectedDevice = useMemo(() => {
    if (!selectedDeviceId) return null;
    return devices.find((d) => d.identifier === selectedDeviceId) || null;
  }, [devices, selectedDeviceId]);

  // Map popup placement
  const activePopupDevice = hoveredDevice || selectedDevice;
  const activePopupScreenPos = useMemo(() => {
    if (!activePopupDevice || !activePopupDevice.location) return null;
    const pt = projectLatLngToSvg(
      activePopupDevice.location,
      centerPoint,
      zoomLevel
    );
    const canvasCenterX = containerSize.width / 2;
    const canvasCenterY = containerSize.height / 2;
    const screenX = canvasCenterX + pan.x + (pt.x - 500) * scale;
    const screenY = canvasCenterY + pan.y + (pt.y - 350) * scale;
    return { x: screenX, y: screenY };
  }, [activePopupDevice, centerPoint, zoomLevel, containerSize, pan, scale]);

  const popupPlacement: PlacementResult | null = useMemo(() => {
    if (!activePopupScreenPos) return null;
    return computePopupPlacement({
      marker: activePopupScreenPos,
      popupSize: { width: 340, height: 260 },
      containerSize: {
        width: Math.max(containerSize.width, 320),
        height: Math.max(containerSize.height, 240),
      },
      insets: { top: 12, right: 12, bottom: 48, left: 12 },
    });
  }, [activePopupScreenPos, containerSize]);

  // Mouse pan drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    mouseStartPos.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    setDragStart({
      clientX: e.clientX,
      clientY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.clientX;
    const dy = e.clientY - dragStart.clientY;
    setPan({ x: dragStart.panX + dx, y: dragStart.panY + dy });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const totalDist = Math.hypot(
      e.clientX - mouseStartPos.current.x,
      e.clientY - mouseStartPos.current.y
    );
    if (totalDist < 4) {
      // It was a click, not a pan drag
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setScale((prev) => Math.min(Math.max(prev * factor, 0.4), 4));
  };

  const handleZoomIn = () => setScale((prev) => Math.min(prev * 1.25, 4));
  const handleZoomOut = () => setScale((prev) => Math.max(prev * 0.8, 0.4));
  const handleReset = () => {
    setScale(1.05);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden select-none bg-slate-950 rounded-xl',
        heightClassName,
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <svg
        viewBox="0 0 1000 700"
        className="w-full h-full pointer-events-none"
        preserveAspectRatio="xMidYMid slice"
      >
        <g
          transform={`translate(${500 + pan.x}, ${350 + pan.y}) scale(${scale}) translate(-500, -350)`}
        >
          {/* 1. Map Tiles */}
          {basemap === 'satellite' ? (
            <g opacity={0.88}>
              {tiles.map((t) => (
                <image
                  key={`tile-${t.tx}-${t.ty}`}
                  href={`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoomLevel}/${t.ty}/${t.tx}`}
                  x={t.x}
                  y={t.y}
                  width={256}
                  height={256}
                  preserveAspectRatio="none"
                />
              ))}
            </g>
          ) : (
            <rect x="-1000" y="-1000" width="3000" height="3000" fill="#0f172a" />
          )}

          {/* Semi-dark ambient overlay for brand consistency */}
          <rect
            x="-1000"
            y="-1000"
            width="3000"
            height="3000"
            fill="rgba(10, 15, 30, 0.32)"
          />

          {/* 2. Device Clusters */}
          {clusters.map((c) => {
            const hasOffline = c.devices.some((d) => d.state === 'offline');
            const hasStale = c.devices.some((d) => d.state === 'stale');
            const clusterColor = hasOffline ? '#EF4444' : hasStale ? '#94A3B8' : '#10B981';

            return (
              <g
                key={c.id}
                transform={`translate(${c.x}, ${c.y})`}
                className="pointer-events-auto cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setScale((prev) => Math.min(prev * 1.5, 3.5));
                  setPan({
                    x: -(c.x - 500) * scale * 1.5,
                    y: -(c.y - 350) * scale * 1.5,
                  });
                }}
              >
                <circle r={18} fill={clusterColor} fillOpacity={0.25} />
                <circle r={13} fill="#0F172A" stroke={clusterColor} strokeWidth={2.5} />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#F8FAFC"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {c.devices.length}
                </text>
              </g>
            );
          })}

          {/* 3. Single Device Markers */}
          {singles.map(({ device: dev, x, y }) => {
            const isSelected = selectedDeviceId === dev.identifier;
            const colors = getDeviceMarkerColors(dev.state);

            return (
              <g
                key={dev.identifier}
                transform={`translate(${x}, ${y})`}
                className="pointer-events-auto cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectDevice?.(isSelected ? null : dev.identifier);
                }}
                onMouseEnter={() => setHoveredDevice(dev)}
                onMouseLeave={() => setHoveredDevice(null)}
              >
                {/* Glow ring */}
                <circle
                  r={isSelected ? 20 : 14}
                  fill={colors.ring}
                  className="transition-all duration-200"
                />

                {/* Marker body */}
                <circle
                  r={isSelected ? 10 : 8}
                  fill="#0F172A"
                  stroke={colors.fill}
                  strokeWidth={isSelected ? 3 : 2}
                  className="transition-all duration-200 shadow-md"
                />

                {/* Inner dot */}
                <circle r={isSelected ? 4 : 3} fill={colors.fill} />

                {/* Identifier Label */}
                <g transform="translate(0, 16)">
                  <rect
                    x={-(dev.identifier.length * 3.8 + 6)}
                    y={-10}
                    width={dev.identifier.length * 7.6 + 12}
                    height={16}
                    rx={3}
                    fill="rgba(15, 23, 42, 0.85)"
                    stroke={isSelected ? '#3B82F6' : 'rgba(255, 255, 255, 0.15)'}
                    strokeWidth={isSelected ? 1.5 : 0.8}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={isSelected ? '#93C5FD' : '#F1F5F9'}
                    fontSize="9"
                    fontWeight="600"
                    fontFamily="monospace"
                  >
                    {dev.identifier}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {/* 3. Anchored Map Popup */}
      {activePopupDevice && popupPlacement && (
        <MapPopupShell
          side={popupPlacement.side}
          tailOffset={popupPlacement.tailOffset}
          typeChip="Device"
          typeColor="blue"
          id={activePopupDevice.identifier}
          badge={<DeviceStateBadge state={activePopupDevice.state} />}
          title={
            activePopupDevice.name !== activePopupDevice.identifier
              ? activePopupDevice.name
              : undefined
          }
          unlocated={!activePopupDevice.location}
          onClose={() => {
            setHoveredDevice(null);
            onSelectDevice?.(null);
          }}
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
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onConfigureDevice?.(activePopupDevice.identifier)}
                className="h-7 px-2.5 text-[11px] gap-1 cursor-pointer"
              >
                <Sliders className="size-3 text-muted-foreground" />
                <span>Configure</span>
              </Button>
              <Button
                size="sm"
                onClick={() => onOpenDevice?.(activePopupDevice.identifier)}
                className="h-7 px-2.5 text-[11px] gap-1 cursor-pointer bg-primary text-primary-foreground font-semibold"
              >
                <ExternalLink className="size-3" />
                <span>Open device</span>
              </Button>
            </div>
          }
        >
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-muted-foreground block text-[10px]">Type & Model</span>
                <span className="font-medium text-foreground truncate block">
                  {activePopupDevice.type} · {activePopupDevice.model}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px]">Installed on</span>
                <span className="font-mono font-semibold text-primary truncate block">
                  {activePopupDevice.installedOnPoleId || 'Not installed'}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px]">Last contact</span>
                <span className="text-foreground truncate block">
                  {evaluateDeviceFreshness(activePopupDevice).relativeText}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px]">Events (30d)</span>
                <span className="font-mono font-bold text-foreground">
                  {activePopupDevice.events30dCount ?? 0}
                </span>
              </div>
            </div>

            {activePopupDevice.location && (
              <div className="text-[10px] font-mono text-muted-foreground bg-muted/40 px-2 py-1 rounded">
                {formatCoordinates(activePopupDevice.location)}
              </div>
            )}
          </div>
        </MapPopupShell>
      )}

      {/* 4. Zoom & Center Controls */}
      <div className="absolute right-3 top-3 z-20 flex flex-col gap-1 rounded-lg border border-border bg-card/90 backdrop-blur-xs p-0.5 shadow-md">
        <button
          type="button"
          onClick={handleZoomIn}
          className="size-7 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          title="Zoom In"
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="size-7 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          title="Zoom Out"
        >
          <Minus className="size-4" />
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="size-7 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          title="Reset View"
        >
          <Maximize2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
};
