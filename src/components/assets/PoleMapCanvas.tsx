import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Plus,
  Minus,
  Maximize2,
  Layers,
  MapPin,
  Navigation,
  Cpu,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { MapPopupShell } from '@/components/overview/popups/MapPopupShell';
import { computePopupPlacement, type PlacementResult } from '@/lib/popupPlacement';
import {
  latLngToWorldPx,
  projectLatLngToSvg,
  unprojectSvgToLatLng,
  formatCoordinates,
} from '@/lib/geo';
import { useToast } from '@/contexts/ToastContext';
import { useUiMode } from '@/hooks/useUiMode';
import { cn } from '@/lib/utils';
import type {
  PoleWithRelations,
  CableSpanRecord,
  PoleLocation,
} from '@/types/assets';

export interface PoleMapCanvasProps {
  poles: PoleWithRelations[];
  cableSpans?: CableSpanRecord[];
  centerPoint: PoleLocation;
  zoomLevel?: number;
  selectedPoleId?: string | null;
  onSelectPole?: (identifier: string | null) => void;
  onOpenPole?: (identifier: string) => void;
  onRelocatePole?: (pole: PoleWithRelations) => void;
  /** Interactive coordinate picker mode (used by Register & Relocate) */
  pickerMode?: boolean;
  pickedLocation?: PoleLocation | null;
  onPickLocation?: (loc: PoleLocation) => void;
  /** Optional static reference marker (e.g., old location during Relocate) */
  referenceLocation?: PoleLocation | null;
  referenceLabel?: string;
  showPopup?: boolean;
  showSiteCentre?: boolean;
  compactControls?: boolean;
  heightClassName?: string;
  className?: string;
}

interface PoleCluster {
  id: string;
  x: number;
  y: number;
  poles: PoleWithRelations[];
}

function getLifecycleMarkerColors(lifecycle: string): { fill: string; ring: string } {
  switch (lifecycle) {
    case 'Active':
      return { fill: '#22C55E', ring: 'rgba(34, 197, 94, 0.28)' };
    case 'Maintenance':
      return { fill: '#F5B301', ring: 'rgba(245, 179, 1, 0.28)' };
    case 'Planned':
      return { fill: '#38BDF8', ring: 'rgba(56, 189, 248, 0.28)' };
    case 'Deleted':
      return { fill: '#EF4444', ring: 'rgba(239, 68, 68, 0.28)' };
    default:
      return { fill: '#94A3B8', ring: 'rgba(148, 163, 184, 0.25)' };
  }
}

export const PoleMapCanvas: React.FC<PoleMapCanvasProps> = ({
  poles,
  cableSpans = [],
  centerPoint,
  zoomLevel = 15,
  selectedPoleId = null,
  onSelectPole,
  onOpenPole,
  onRelocatePole,
  pickerMode = false,
  pickedLocation = null,
  onPickLocation,
  referenceLocation = null,
  referenceLabel = 'Current',
  showPopup = true,
  showSiteCentre = true,
  compactControls = false,
  heightClassName = 'h-[540px]',
  className,
}) => {
  const { addToast } = useToast();
  const { isTablet } = useUiMode();

  const [basemap, setBasemap] = useState<'satellite' | 'streets'>('satellite');
  const [scale, setScale] = useState<number>(1.05);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingPin, setIsDraggingPin] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredPole, setHoveredPole] = useState<PoleWithRelations | null>(null);
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

  // Compute Web Mercator tile grid centered around centerPoint (center-out order so visible tiles load first)
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

  // Project located poles into SVG coordinates
  const locatedPoles = useMemo(() => {
    return poles
      .filter((p) => Boolean(p.location))
      .map((p) => ({
        pole: p,
        pt: projectLatLngToSvg(p.location!, centerPoint, zoomLevel),
      }));
  }, [poles, centerPoint, zoomLevel]);

  const poleCoordMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    locatedPoles.forEach(({ pole, pt }) => {
      map.set(pole.identifier, pt);
    });
    return map;
  }, [locatedPoles]);

  // Fit map to visible located poles
  const fitToPoles = useCallback(() => {
    if (locatedPoles.length === 0) {
      setPan({ x: 0, y: 0 });
      setScale(1.05);
      return;
    }
    if (locatedPoles.length === 1) {
      const { pt } = locatedPoles[0];
      setPan({ x: (500 - pt.x) * 0.75, y: (350 - pt.y) * 0.75 });
      setScale(1.45);
      return;
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    locatedPoles.forEach(({ pt }) => {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    });
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const spanX = Math.max(80, maxX - minX);
    const spanY = Math.max(80, maxY - minY);
    const nextScale = Math.min(2.2, Math.max(0.8, Math.min(680 / spanX, 460 / spanY)));
    setPan({ x: (500 - midX) * 0.75, y: (350 - midY) * 0.75 });
    setScale(Number(nextScale.toFixed(2)));
  }, [locatedPoles]);

  // Fit on initial load or site change
  useEffect(() => {
    fitToPoles();
  }, [centerPoint.lat, centerPoint.lng, fitToPoles]);

  // Center on selected pole when selectedPoleId changes
  useEffect(() => {
    if (!selectedPoleId) return;
    const target = locatedPoles.find((l) => l.pole.identifier === selectedPoleId);
    if (!target) return;
    setPan({ x: (500 - target.pt.x) * 0.75, y: (350 - target.pt.y) * 0.75 });
    setScale((s) => Math.max(s, 1.5));
  }, [selectedPoleId, locatedPoles]);

  // Cluster poles at low zoom (< 1.35) unless only <= 6 poles or pickerMode
  const { clusters, singleMarkers } = useMemo(() => {
    if (scale >= 1.35 || locatedPoles.length <= 6 || pickerMode) {
      return { clusters: [] as PoleCluster[], singleMarkers: locatedPoles };
    }
    const threshold = 32;
    const used = new Set<string>();
    const outClusters: PoleCluster[] = [];
    const outSingles: typeof locatedPoles = [];

    for (let i = 0; i < locatedPoles.length; i++) {
      const curr = locatedPoles[i];
      if (used.has(curr.pole.identifier)) continue;
      // Never hide selected pole inside a cluster
      if (curr.pole.identifier === selectedPoleId) {
        used.add(curr.pole.identifier);
        outSingles.push(curr);
        continue;
      }

      const group = [curr];
      used.add(curr.pole.identifier);

      for (let j = i + 1; j < locatedPoles.length; j++) {
        const cand = locatedPoles[j];
        if (used.has(cand.pole.identifier) || cand.pole.identifier === selectedPoleId) continue;
        const dist = Math.hypot(curr.pt.x - cand.pt.x, curr.pt.y - cand.pt.y);
        if (dist <= threshold) {
          group.push(cand);
          used.add(cand.pole.identifier);
        }
      }

      if (group.length > 1) {
        const avgX = group.reduce((s, g) => s + g.pt.x, 0) / group.length;
        const avgY = group.reduce((s, g) => s + g.pt.y, 0) / group.length;
        outClusters.push({
          id: `cluster-${curr.pole.identifier}`,
          x: avgX,
          y: avgY,
          poles: group.map((g) => g.pole),
        });
      } else {
        outSingles.push(curr);
      }
    }

    return { clusters: outClusters, singleMarkers: outSingles };
  }, [locatedPoles, scale, pickerMode, selectedPoleId]);

  const clientToSvgPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    try {
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const inv = pt.matrixTransform(ctm.inverse());
      return { x: inv.x, y: inv.y };
    } catch {
      return null;
    }
  }, []);

  const svgToScreenPoint = useCallback(
    (svgX: number, svgY: number) => {
      const w = containerSize.width || 900;
      const h = containerSize.height || 540;
      const baseScale = Math.max(w / 1000, h / 700);
      return {
        x: w / 2 + scale * ((svgX - 500) * baseScale + pan.x),
        y: h / 2 + scale * ((svgY - 350) * baseScale + pan.y),
      };
    },
    [containerSize.width, containerSize.height, scale, pan.x, pan.y]
  );

  const selectedPoleObj = useMemo(
    () => (selectedPoleId ? poles.find((p) => p.identifier === selectedPoleId) || null : null),
    [selectedPoleId, poles]
  );

  const popupPlacement: PlacementResult | null = useMemo(() => {
    if (!showPopup || !selectedPoleObj || !selectedPoleObj.location) return null;
    const svgPt = poleCoordMap.get(selectedPoleObj.identifier);
    if (!svgPt) return null;
    const screenPt = svgToScreenPoint(svgPt.x, svgPt.y);
    return computePopupPlacement({
      marker: screenPt || { x: containerSize.width / 2, y: containerSize.height / 2 },
      popupSize: { width: 340, height: 300 },
      containerSize,
      insets: { top: 12, right: 12, bottom: 56, left: 12 },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPopup, selectedPoleObj, poleCoordMap, svgToScreenPoint, containerSize, pan, scale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    mouseStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (pickerMode && isDraggingPin && onPickLocation) {
      const svgPt = clientToSvgPoint(e.clientX, e.clientY);
      if (svgPt) {
        onPickLocation(unprojectSvgToLatLng(svgPt.x, svgPt.y, centerPoint, zoomLevel));
      }
      return;
    }
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDraggingPin) {
      setIsDraggingPin(false);
      return;
    }
    setIsDragging(false);
    const moved = Math.hypot(e.clientX - mouseStartPos.current.x, e.clientY - mouseStartPos.current.y);
    if (moved < 6) {
      if (pickerMode && onPickLocation) {
        const svgPt = clientToSvgPoint(e.clientX, e.clientY);
        if (svgPt) {
          onPickLocation(unprojectSvgToLatLng(svgPt.x, svgPt.y, centerPoint, zoomLevel));
        }
      } else {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'svg' ||
          target.tagName === 'rect' ||
          target.tagName === 'image'
        ) {
          onSelectPole?.(null);
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale((s) => Math.min(Math.max(s + delta, 0.7), 2.8));
  };

  const pickedSvg = pickedLocation
    ? projectLatLngToSvg(pickedLocation, centerPoint, zoomLevel)
    : null;
  const refSvg = referenceLocation
    ? projectLatLngToSvg(referenceLocation, centerPoint, zoomLevel)
    : null;
  const centreSvg = projectLatLngToSvg(centerPoint, centerPoint, zoomLevel);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsDragging(false);
        setIsDraggingPin(false);
      }}
      onWheel={handleWheel}
      className={cn(
        'relative w-full overflow-hidden select-none bg-[#08101C]',
        pickerMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing',
        heightClassName,
        className
      )}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 1000 700"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full object-cover origin-center transition-transform duration-200 ease-out"
        style={{ transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)` }}
        role="img"
        aria-label="Falcon Poles Satellite Map"
      >
        <rect
          x="-2000"
          y="-2000"
          width="5000"
          height="5000"
          fill={basemap === 'satellite' ? '#070f1a' : '#e2e8f0'}
        />

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

        {/* Connected Cable Spans */}
        <g className="pointer-events-none">
          {cableSpans.map((span) => {
            const pA = poleCoordMap.get(span.fromPole);
            const pB = poleCoordMap.get(span.toPole);
            if (!pA || !pB) return null;
            const isHighlighted =
              selectedPoleId === span.fromPole || selectedPoleId === span.toPole;
            return (
              <line
                key={span.identifier}
                x1={pA.x}
                y1={pA.y}
                x2={pB.x}
                y2={pB.y}
                stroke={isHighlighted ? '#38BDF8' : 'rgba(56, 189, 248, 0.6)'}
                strokeWidth={isHighlighted ? 3 : 1.75}
                strokeLinecap="round"
              />
            );
          })}
        </g>

        {/* Clustered Markers at Low Zoom */}
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
              fontSize="11"
              fontWeight="700"
              fontFamily="sans-serif"
            >
              {cl.poles.length}
            </text>
          </g>
        ))}

        {/* Individual Pole Markers */}
        {singleMarkers.map(({ pole, pt }) => {
          const isSelected = selectedPoleId === pole.identifier;
          const colors = getLifecycleMarkerColors(pole.lifecycle);
          return (
            <g
              key={pole.identifier}
              transform={`translate(${pt.x}, ${pt.y})`}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSelectPole?.(pole.identifier);
              }}
              onMouseEnter={(e) => {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                  setHoveredPole(pole);
                  setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                }
              }}
              onMouseLeave={() => setHoveredPole(null)}
            >
              {isSelected && (
                <circle
                  r="14"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="2.5"
                  className="animate-pulse"
                />
              )}
              <circle r={isSelected ? 10 : 8} fill={colors.ring} />
              <circle
                r={isSelected ? 6 : 4.5}
                fill={colors.fill}
                stroke="#FFFFFF"
                strokeWidth="1.5"
                filter="drop-shadow(0 1px 3px rgba(0,0,0,0.6))"
              />
            </g>
          );
        })}

        {/* Reference Marker (Current Location before Relocate) */}
        {refSvg && (
          <g transform={`translate(${refSvg.x}, ${refSvg.y})`} className="pointer-events-none">
            <circle r="8" fill="rgba(148, 163, 184, 0.3)" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="2 2" />
            <circle r="4" fill="#94A3B8" stroke="#FFFFFF" strokeWidth="1.2" />
            <text
              y="-12"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="9"
              fontWeight="600"
              filter="drop-shadow(0 1px 2px rgba(0,0,0,0.9))"
            >
              {referenceLabel}
            </text>
          </g>
        )}

        {/* Line between current & new picked location */}
        {refSvg && pickedSvg && (
          <line
            x1={refSvg.x}
            y1={refSvg.y}
            x2={pickedSvg.x}
            y2={pickedSvg.y}
            stroke="#F5B301"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="pointer-events-none"
          />
        )}

        {/* Interactive Draggable Picked Pin */}
        {pickerMode && pickedSvg && (
          <g
            transform={`translate(${pickedSvg.x}, ${pickedSvg.y})`}
            className="cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDraggingPin(true);
            }}
          >
            <circle r="15" fill="rgba(47, 111, 237, 0.32)" />
            <circle
              r="7.5"
              fill="#2F6FED"
              stroke="#FFFFFF"
              strokeWidth="2"
              filter="drop-shadow(0 2px 5px rgba(0,0,0,0.75))"
            />
          </g>
        )}
      </svg>

      {/* Top-Left Basemap Switcher */}
      {!compactControls && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-lg bg-card border border-border p-1 shadow-md">
          {(['satellite', 'streets'] as const).map((bm) => (
            <button
              key={bm}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setBasemap(bm);
              }}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors cursor-pointer',
                basemap === bm
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {bm}
            </button>
          ))}
        </div>
      )}

      {/* Top-Right Zoom & Fit Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 bg-card border border-border rounded-lg p-1 shadow-md">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setScale((s) => Math.min(s + 0.3, 2.8));
          }}
          className={cn(
            'flex items-center justify-center rounded text-foreground hover:bg-muted transition-colors cursor-pointer',
            isTablet ? 'size-9' : 'size-7'
          )}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <Plus className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setScale((s) => Math.max(s - 0.3, 0.7));
          }}
          className={cn(
            'flex items-center justify-center rounded text-foreground hover:bg-muted transition-colors cursor-pointer',
            isTablet ? 'size-9' : 'size-7'
          )}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <Minus className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fitToPoles();
          }}
          className={cn(
            'flex items-center justify-center rounded text-foreground hover:bg-muted transition-colors cursor-pointer',
            isTablet ? 'size-9' : 'size-7'
          )}
          aria-label="Fit to poles"
          title="Fit to poles"
        >
          <Maximize2 className="size-3.5" />
        </button>
      </div>

      {/* Hover Tooltip */}
      {hoveredPole && hoverPos && (!selectedPoleId || selectedPoleId !== hoveredPole.identifier) && (
        <div
          style={{
            left: `${Math.min(hoverPos.x + 12, Math.max(20, containerSize.width - 210))}px`,
            top: `${Math.max(12, hoverPos.y - 36)}px`,
          }}
          className="absolute z-30 rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-xl pointer-events-none"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-foreground">{hoveredPole.identifier}</span>
            <StatusBadge status={hoveredPole.lifecycle} size="sm" />
          </div>
          <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
            {formatCoordinates(hoveredPole.location)}
          </div>
        </div>
      )}

      {/* Anchored Shared MapPopupShell */}
      {showPopup && selectedPoleObj && popupPlacement && (
        <MapPopupShell
          side={popupPlacement.side}
          tailOffset={popupPlacement.tailOffset}
          typeChip="Pole"
          typeColor="blue"
          id={selectedPoleObj.identifier}
          badge={<StatusBadge status={selectedPoleObj.lifecycle} size="sm" />}
          title={
            selectedPoleObj.name !== selectedPoleObj.identifier
              ? selectedPoleObj.name
              : undefined
          }
          unlocated={!selectedPoleObj.location}
          onClose={() => onSelectPole?.(null)}
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
            <div className="w-full flex items-center justify-between gap-2">
              {onRelocatePole && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRelocatePole(selectedPoleObj)}
                  className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer"
                >
                  <Navigation className="size-3" />
                  <span>{selectedPoleObj.location ? 'Relocate' : 'Add location'}</span>
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => onOpenPole?.(selectedPoleObj.identifier)}
                className="h-8 px-3 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 cursor-pointer ml-auto"
              >
                <span>Open pole</span>
                <ExternalLink className="size-3" />
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted border border-border text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground block">Site</span>
              <span className="text-foreground font-medium truncate block">
                {selectedPoleObj.siteName}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Protection</span>
              <span className="text-foreground text-[11px]">
                {selectedPoleObj.protection || 'No protection recorded'}
              </span>
            </div>
            <div className="col-span-2 border-t border-border/50 pt-1.5 flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] text-muted-foreground block">Coordinates</span>
                <span className="font-mono text-[11px] text-foreground">
                  {formatCoordinates(selectedPoleObj.location)}
                </span>
              </div>
              {selectedPoleObj.location && (
                <button
                  type="button"
                  onClick={() => {
                    const txt = formatCoordinates(selectedPoleObj.location);
                    navigator.clipboard.writeText(txt);
                    addToast('info', `Copied ${txt}`);
                  }}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Copy coordinates"
                >
                  <Copy className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs pt-1">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Cpu className="size-3.5 text-primary" />
              <span>
                <strong className="font-mono text-foreground">
                  {selectedPoleObj.linkedDevicesCount}
                </strong>{' '}
                {selectedPoleObj.linkedDevicesCount === 1 ? 'linked device' : 'linked devices'}
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Layers className="size-3.5 text-sky-400" />
              <span>
                <strong className="font-mono text-foreground">
                  {selectedPoleObj.cableSpansCount}
                </strong>{' '}
                {selectedPoleObj.cableSpansCount === 1 ? 'cable span' : 'cable spans'}
              </span>
            </span>
          </div>
        </MapPopupShell>
      )}

      {/* Attribution Matching Overview & Risk */}
      <div className="absolute bottom-1.5 right-2 z-10 pointer-events-none">
        <span className="text-[9px] text-white/80 bg-black/65 px-1.5 py-0.5 rounded">
          Maxar Technologies, OpenStreetMap contributors | TM FALCON (Internal Use Only)
        </span>
      </div>

      {pickerMode && (
        <div className="absolute bottom-2 left-2 z-10 px-2.5 py-1 rounded-md bg-black/75 border border-white/10 text-[11px] text-white flex items-center gap-1.5 pointer-events-none">
          <MapPin className="size-3 text-primary" />
          <span>Click map or drag pin to set coordinates</span>
        </div>
      )}
    </div>
  );
};
