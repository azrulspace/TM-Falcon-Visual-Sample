import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Plus,
  Minus,
  Maximize2,
  Layers,
  HelpCircle,
  AlertTriangle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { cn, formatId } from '@/lib/utils';
import { useUiMode } from '@/hooks/useUiMode';
import type { RiskSegment, RiskPriority } from '@/types/risk';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

export interface RiskMapCardProps {
  segments: RiskSegment[];
  selectedSegmentId: string | null;
  onSelectSegment: (id: string | null) => void;
  onInvestigate?: (segment: RiskSegment) => void;
  onDismiss?: (segment: RiskSegment) => void;
  className?: string;
  renderPopup?: (segment: RiskSegment, onClose: () => void) => React.ReactNode;
}

// Shared Priority Tokens (Section 5.6):
// High: #f97316 (orange), Medium: #f59e0b (amber), Low: #38bdf8 (sky blue).
// Red #ef4444 is strictly reserved for critical/offline states.
export const RISK_PRIORITY_COLORS: Record<RiskPriority, string> = {
  High: '#f97316',
  Medium: '#f59e0b',
  Low: '#38bdf8',
};

export const RISK_PRIORITY_ICONS: Record<RiskPriority, React.ElementType> = {
  High: AlertTriangle,
  Medium: AlertCircle,
  Low: Info,
};

export const RiskMapCard: React.FC<RiskMapCardProps> = ({
  segments,
  selectedSegmentId,
  onSelectSegment,
  className = '',
  renderPopup,
}) => {
  const { isTablet } = useUiMode();
  const [basemap, setBasemap] = useState<'satellite' | 'streets'>('satellite');
  const [scale, setScale] = useState(1.15);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mouseStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Real GIS tile grid calculation matching MapCanvas (z=12, x=3303, y=2030)
  const tiles = useMemo(() => {
    const list: { tx: number; ty: number; x: number; y: number }[] = [];
    const cols = [3298, 3299, 3300, 3301, 3302, 3303, 3304, 3305, 3306, 3307, 3308];
    const rows = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034];

    rows.forEach((ty) => {
      cols.forEach((tx) => {
        const x = (tx - 3303) * 256 + 372;
        const y = (ty - 2030) * 256 + 222;
        list.push({ tx, ty, x, y });
      });
    });
    return list;
  }, []);

  const getTileUrl = (tx: number, ty: number, bm: 'satellite' | 'streets') => {
    if (bm === 'satellite') {
      return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/${ty}/${tx}`;
    }
    return `https://tile.openstreetmap.org/12/${tx}/${ty}.png`;
  };

  const getLabelTileUrl = (tx: number, ty: number, bm: 'satellite' | 'streets') => {
    if (bm === 'satellite') {
      return `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/12/${ty}/${tx}`;
    }
    return null;
  };

  // Fit to visible segments on load or upon manual fit trigger (Section 5.6)
  const fitToSegments = useCallback(() => {
    if (segments.length === 0) return;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    segments.forEach((s) => {
      s.path.forEach(([px, py]) => {
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      });
    });

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    // Center SVG with overlay-aware padding (offset slightly left to accommodate drawer/sheet)
    const targetX = (500 - midX) * 0.7;
    const targetY = (350 - midY) * 0.7;

    setPan({ x: targetX, y: targetY });
    setScale(1.25);
  }, [segments]);

  // Initial fit on load
  useEffect(() => {
    fitToSegments();
  }, [fitToSegments]);

  // Fly to selected segment if selected externally
  useEffect(() => {
    if (!selectedSegmentId) return;
    const seg = segments.find((s) => s.id === selectedSegmentId);
    if (!seg || seg.path.length === 0) return;

    const mid = seg.path[Math.floor(seg.path.length / 2)] || [500, 350];
    const targetX = (450 - mid[0]) * 0.75;
    const targetY = (350 - mid[1]) * 0.75;

    setPan({ x: targetX, y: targetY });
    setScale((s) => Math.max(s, 1.4));
  }, [selectedSegmentId, segments]);

  // Mouse pan and zoom handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    mouseStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -0.12 : 0.12;
    setScale((s) => Math.min(Math.max(s + zoomDelta, 0.85), 2.8));
  };

  // Touch handlers for tablet pinch-to-zoom and pan
  const touchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchInitialDist = useRef<number | null>(null);
  const touchInitialScale = useRef<number>(1);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: t.clientX - pan.x, y: t.clientY - pan.y });
      touchStartPos.current = { x: t.clientX, y: t.clientY };
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      touchInitialDist.current = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchInitialScale.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const t = e.touches[0];
      setPan({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
    } else if (e.touches.length === 2 && touchInitialDist.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const factor = dist / touchInitialDist.current;
      setScale(Math.min(Math.max(touchInitialScale.current * factor, 0.85), 2.8));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchInitialDist.current = null;
  };

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 2.8));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.85));

  // Compute collision-filtered label pills (Section 5.6)
  // Selected and hovered segments are always labeled.
  const visibleLabels = useMemo(() => {
    const placedPositions: { x: number; y: number }[] = [];
    const minDistance = 45; // pixel threshold to avoid overlap

    return segments.filter((s) => {
      const isSelected = s.id === selectedSegmentId;
      const isHovered = s.id === hoveredSegmentId;
      if (isSelected || isHovered) return true;

      // Only show labels when scale allows enough breathing room
      if (scale < 1.05) return false;

      const mid = s.path[Math.floor(s.path.length / 2)] || [500, 350];
      // Check collision with already placed labels
      const hasCollision = placedPositions.some((p) => {
        const dx = (p.x - mid[0]) * scale;
        const dy = (p.y - mid[1]) * scale;
        return Math.sqrt(dx * dx + dy * dy) < minDistance;
      });

      if (!hasCollision) {
        placedPositions.push({ x: mid[0], y: mid[1] });
        return true;
      }
      return false;
    });
  }, [segments, selectedSegmentId, hoveredSegmentId, scale]);

  const selectedSegment = useMemo(() => {
    return segments.find((s) => s.id === selectedSegmentId) || null;
  }, [segments, selectedSegmentId]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
      className={cn(
        'w-full h-full relative overflow-hidden select-none bg-[#08101C] cursor-grab active:cursor-grabbing rounded-xl border border-border/80 shadow-xs',
        className
      )}
    >
      {/* 1. Real GIS Satellite / Street Tile Map Layer */}
      <div
        className="absolute inset-0 pointer-events-none transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: '500px 350px',
        }}
      >
        <div className="relative w-[1000px] h-[700px] pointer-events-none">
          {tiles.map((t) => (
            <React.Fragment key={`${t.tx}-${t.ty}`}>
              <img
                src={getTileUrl(t.tx, t.ty, basemap)}
                alt=""
                className="absolute w-[256px] h-[256px] object-cover pointer-events-none"
                style={{
                  left: `${t.x}px`,
                  top: `${t.y}px`,
                  opacity: basemap === 'satellite' ? 0.92 : 0.85,
                  filter: basemap === 'satellite' ? 'brightness(0.9) contrast(1.08)' : 'invert(90%) hue-rotate(180deg) brightness(0.95)',
                }}
                loading="lazy"
                decoding="async"
              />
              {getLabelTileUrl(t.tx, t.ty, basemap) && (
                <img
                  src={getLabelTileUrl(t.tx, t.ty, basemap)!}
                  alt=""
                  className="absolute w-[256px] h-[256px] object-cover pointer-events-none z-1"
                  style={{
                    left: `${t.x}px`,
                    top: `${t.y}px`,
                    opacity: 0.85,
                  }}
                  loading="lazy"
                  decoding="async"
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 2. SVG Vector Overlay for Segment Lines & End Poles */}
      <svg
        viewBox="0 0 1000 700"
        className="w-full h-full object-cover absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: '500px 350px',
        }}
      >
        <defs>
          <filter id="segment-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Drawn segments (Section 5.6) */}
        {segments.map((s) => {
          const isSelected = selectedSegmentId === s.id;
          const isHovered = hoveredSegmentId === s.id;
          const strokeColor = RISK_PRIORITY_COLORS[s.priority] || '#38bdf8';
          const pointsStr = s.path.map((p) => p.join(',')).join(' ');

          // Non-selected segments dim to 40% when one is selected
          const opacity = selectedSegmentId ? (isSelected ? 1 : 0.4) : isHovered ? 1 : 0.92;

          return (
            <g
              key={s.id}
              className="pointer-events-auto cursor-pointer group"
              onClick={(e) => {
                e.stopPropagation();
                onSelectSegment(isSelected ? null : s.id);
              }}
              onMouseEnter={(e) => {
                setHoveredSegmentId(s.id);
                setTooltipPos({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => {
                setHoveredSegmentId(null);
                setTooltipPos(null);
              }}
            >
              {/* Invisible wide hit target for easy clicking */}
              <polyline
                points={pointsStr}
                fill="none"
                stroke="transparent"
                strokeWidth="24"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Selection Halo / Outer Glow */}
              {isSelected && (
                <polyline
                  points={pointsStr}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.3"
                  filter="url(#segment-glow)"
                />
              )}

              {/* Glowing Line: 5px wide default, 8px when selected */}
              <polyline
                points={pointsStr}
                fill="none"
                stroke={strokeColor}
                strokeWidth={isSelected ? '8' : isHovered ? '7' : '5'}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={opacity}
                filter="url(#segment-glow)"
                className="transition-all duration-150"
              />

              {/* End Poles: small white dots */}
              {s.path.map(([px, py], pIdx) => (
                <circle
                  key={pIdx}
                  cx={px}
                  cy={py}
                  r={isSelected ? 4.5 : 3.5}
                  fill="#ffffff"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                  opacity={opacity}
                />
              ))}
            </g>
          );
        })}

        {/* 3. Decluttered Segment Label Pills (Section 5.6) */}
        {visibleLabels.map((s) => {
          const mid = s.path[Math.floor(s.path.length / 2)] || [500, 350];
          const isSelected = selectedSegmentId === s.id;
          const isHovered = hoveredSegmentId === s.id;
          const strokeColor = RISK_PRIORITY_COLORS[s.priority];

          return (
            <g
              key={`label-${s.id}`}
              transform={`translate(${mid[0]}, ${mid[1]})`}
              className="pointer-events-auto cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSelectSegment(isSelected ? null : s.id);
              }}
            >
              {/* Dark glass pill */}
              <rect
                x="-32"
                y="-12"
                width="64"
                height="24"
                rx="12"
                fill="#0f172a"
                fillOpacity={isSelected || isHovered ? 0.95 : 0.82}
                stroke={isSelected ? strokeColor : isHovered ? '#94a3b8' : '#334155'}
                strokeWidth={isSelected ? 1.8 : 1}
                className="transition-all duration-150 shadow-md"
              />
              {/* Small priority icon indicator */}
              <circle cx="-19" cy="0" r="3" fill={strokeColor} />
              {/* Segment ID */}
              <text
                x="5"
                y="3.5"
                textAnchor="middle"
                fill="#f8fafc"
                fontSize="9.5"
                fontWeight={isSelected ? '700' : '600'}
                fontFamily="ui-monospace, monospace"
                className="pointer-events-none select-none"
              >
                {formatId(s.id)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* 4. Floating Map Hover Tooltip (Section 5.6) */}
      {hoveredSegmentId && tooltipPos && (
        (() => {
          const s = segments.find((x) => x.id === hoveredSegmentId);
          if (!s) return null;
          return (
            <div
              className="fixed pointer-events-none z-50 px-2.5 py-1.5 rounded-lg bg-popover border border-border shadow-xl text-xs flex flex-col gap-1 text-foreground"
              style={{
                left: `${tooltipPos.x + 14}px`,
                top: `${tooltipPos.y + 14}px`,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-primary">{formatId(s.id)}</span>
                <span
                  className="px-1.5 py-0.2 rounded text-[10px] font-semibold"
                  style={{
                    backgroundColor: `${RISK_PRIORITY_COLORS[s.priority]}20`,
                    color: RISK_PRIORITY_COLORS[s.priority],
                  }}
                >
                  {s.priority}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Conf: {s.confidence}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {s.from} to {s.to} ({s.route})
              </div>
              <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[220px]">
                {s.basis}
              </div>
            </div>
          );
        })()
      )}

      {/* 5. Floating Map Controls (Top Right) */}
      <div className="absolute right-3.5 top-3.5 flex flex-col gap-1.5 z-20">
        <div className="flex flex-col rounded-lg bg-card border border-border shadow-md overflow-hidden">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger render={
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className={cn(
                    'flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors border-b border-border/60 cursor-pointer',
                    isTablet ? 'size-11 min-w-[44px] min-h-[44px]' : 'size-8'
                  )}
                  aria-label="Zoom in"
                >
                  <Plus className="size-4" />
                </button>
              } />
              <TooltipContent side="left">Zoom in</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger render={
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className={cn(
                    'flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors border-b border-border/60 cursor-pointer',
                    isTablet ? 'size-11 min-w-[44px] min-h-[44px]' : 'size-8'
                  )}
                  aria-label="Zoom out"
                >
                  <Minus className="size-4" />
                </button>
              } />
              <TooltipContent side="left">Zoom out</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger render={
                <button
                  type="button"
                  onClick={fitToSegments}
                  className={cn(
                    'flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer',
                    isTablet ? 'size-11 min-w-[44px] min-h-[44px]' : 'size-8'
                  )}
                  aria-label="Fit to segments"
                >
                  <Maximize2 className="size-3.5" />
                </button>
              } />
              <TooltipContent side="left">Fit to all segments</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Basemap Switcher & Legend Popover */}
        <div className="flex flex-col rounded-lg bg-card border border-border shadow-md overflow-hidden">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger render={
                <button
                  type="button"
                  onClick={() => setBasemap((b) => (b === 'satellite' ? 'streets' : 'satellite'))}
                  className={cn(
                    'flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors border-b border-border/60 cursor-pointer',
                    isTablet ? 'size-11 min-w-[44px] min-h-[44px]' : 'size-8',
                    basemap === 'streets' && 'text-primary font-bold'
                  )}
                  aria-label={`Switch basemap (current: ${basemap})`}
                >
                  <Layers className="size-4" />
                </button>
              } />
              <TooltipContent side="left">
                Basemap: {basemap === 'satellite' ? 'Satellite' : 'Street'} (click to toggle)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Legend Popover Button (Section 5.6: No persistent open legend box) */}
          <Popover>
            <PopoverTrigger render={
              <button
                type="button"
                className={cn(
                  'flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer',
                  isTablet ? 'size-11 min-w-[44px] min-h-[44px]' : 'size-8'
                )}
                aria-label="Map legend"
              >
                <HelpCircle className="size-4" />
              </button>
            } />
            <PopoverContent
              side="left"
              align="start"
              className="w-56 p-3 bg-popover border border-border shadow-xl z-50 text-xs"
            >
              <div className="font-semibold text-foreground pb-1.5 mb-2 border-b border-border flex items-center justify-between">
                <span>Map Legend</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                  {basemap}
                </span>
              </div>

              {/* Priority Legend */}
              <div className="space-y-1.5 mb-3">
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  Risk Priority
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-1.5 rounded-full bg-[#f97316] shadow-sm" />
                    <span>High</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Urgent</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-1.5 rounded-full bg-[#f59e0b] shadow-sm" />
                    <span>Medium</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Scheduled</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-1.5 rounded-full bg-[#38bdf8] shadow-sm" />
                    <span>Low</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Routine</span>
                </div>
              </div>

              {/* Confidence Meter Legend (Section 5.6 & 5.7: Neutral/Primary tones, NOT red/amber) */}
              <div className="space-y-1.5 pt-2 border-t border-border">
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  Span Confidence (Neutral meter)
                </span>
                <div className="flex items-center justify-between">
                  <span>High</span>
                  <div className="flex gap-1 items-center">
                    <div className="w-2.5 h-1.5 rounded-sm bg-primary" />
                    <div className="w-2.5 h-1.5 rounded-sm bg-primary" />
                    <div className="w-2.5 h-1.5 rounded-sm bg-primary" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Medium</span>
                  <div className="flex gap-1 items-center">
                    <div className="w-2.5 h-1.5 rounded-sm bg-primary" />
                    <div className="w-2.5 h-1.5 rounded-sm bg-primary" />
                    <div className="w-2.5 h-1.5 rounded-sm bg-muted-foreground/30" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Low</span>
                  <div className="flex gap-1 items-center">
                    <div className="w-2.5 h-1.5 rounded-sm bg-primary" />
                    <div className="w-2.5 h-1.5 rounded-sm bg-muted-foreground/30" />
                    <div className="w-2.5 h-1.5 rounded-sm bg-muted-foreground/30" />
                  </div>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-border text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-white border border-slate-700" />
                  <span>End pole markers</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 6. Classification & Attribution Bar (Bottom Right, Section 5.6) */}
      <div className="absolute bottom-2 right-2.5 z-20 flex items-center gap-2 pointer-events-none text-[10px] text-muted-foreground font-mono bg-card px-2 py-0.5 rounded border border-border">
        <span>RESTRICTED // TM INTERNAL USE ONLY</span>
        <span>•</span>
        <span>© Esri, Maxar, OpenStreetMap</span>
      </div>

      {/* 7. Anchored Floating Popup when segment is selected (Section 5.8) */}
      {selectedSegment && renderPopup && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center p-4">
          <div className="pointer-events-auto">
            {renderPopup(selectedSegment, () => onSelectSegment(null))}
          </div>
        </div>
      )}
    </div>
  );
};
