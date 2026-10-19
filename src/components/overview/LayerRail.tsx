import React, { useState } from 'react';
import {
  Layers,
  Search,
  Moon,
  Satellite,
  Mountain,
  Info,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface LayerVisibility {
  events: boolean;
  devices: boolean;
  poles: boolean;
  cableRoutes: boolean;
  cctv: boolean;
  sites: boolean;
}

interface LayerRailProps {
  basemap: 'satellite' | 'dark' | 'terrain' | 'streets';
  onBasemapChange: (bm: 'satellite' | 'dark' | 'terrain' | 'streets') => void;
  layers: LayerVisibility;
  onToggleLayer: (layerKey: keyof LayerVisibility) => void;
  onOpenSearch: () => void;
}

export const LayerRail: React.FC<LayerRailProps> = ({
  basemap,
  onBasemapChange,
  layers,
  onToggleLayer,
  onOpenSearch,
}) => {
  const [layersOpen, setLayersOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);

  return (
    <div className="glass-panel py-2 px-1 flex flex-col items-center gap-1.5 w-13 select-none shadow-xl border border-border/80">
      {/* 1. Find Pole / Span Trigger */}
      <Tooltip>
        <TooltipTrigger render={
          <button
            onClick={onOpenSearch}
            className="flex flex-col items-center justify-center size-10 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors group"
            aria-label="Find pole or span"
          >
            <Search className="size-4 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-medium mt-0.5">Find</span>
          </button>
        } />
        <TooltipContent side="right" className="text-xs">
          Find pole or cable span (⌘K)
        </TooltipContent>
      </Tooltip>

      <span className="w-6 h-px bg-border/70 my-0.5" />

      {/* 2. Layers Popover */}
      <Popover open={layersOpen} onOpenChange={setLayersOpen}>
        <PopoverTrigger render={
          <button
            className={`flex flex-col items-center justify-center size-10 rounded-lg transition-colors group ${
              layersOpen ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
            }`}
            aria-label="Map layers"
          >
            <Layers className="size-4 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-medium mt-0.5">Layers</span>
          </button>
        } />
        <PopoverContent side="right" sideOffset={12} className="w-56 glass-panel p-3 text-xs z-50">
          <div className="text-xs font-bold text-foreground mb-2 pb-1.5 border-b border-border">
            Map Overlays & Layers
          </div>
          <div className="space-y-2">
            {[
              { key: 'events', label: 'Incidents & Events' },
              { key: 'devices', label: 'IoT Devices' },
              { key: 'poles', label: 'Utility Poles' },
              { key: 'cableRoutes', label: 'Cable Spans (Fibre/Copper)' },
              { key: 'cctv', label: 'CCTV Surveillance' },
              { key: 'sites', label: 'Sites & Cabinets' },
            ].map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors py-0.5"
              >
                <Checkbox
                  checked={layers[key as keyof LayerVisibility]}
                  onCheckedChange={() => onToggleLayer(key as keyof LayerVisibility)}
                  className="size-3.5"
                />
                <span className="text-xs text-foreground font-medium">{label}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <span className="w-6 h-px bg-border/70 my-0.5" />

      {/* 3. Basemap Selector (CEO_REFERENCE: Satellite, Terrain, Dark) */}
      <div className="flex flex-col items-center gap-1">
        {/* Satellite */}
        <Tooltip>
          <TooltipTrigger render={
            <button
              onClick={() => onBasemapChange('satellite')}
              className={`flex flex-col items-center justify-center size-10 rounded-lg transition-all ${
                basemap === 'satellite'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
              }`}
              aria-label="Satellite basemap"
            >
              <Satellite className="size-4" />
              <span className="text-[8.5px] mt-0.5">Satellite</span>
            </button>
          } />
          <TooltipContent side="right" className="text-xs">
            High-resolution satellite imagery
          </TooltipContent>
        </Tooltip>

        {/* Terrain */}
        <Tooltip>
          <TooltipTrigger render={
            <button
              onClick={() => onBasemapChange('terrain')}
              className={`flex flex-col items-center justify-center size-10 rounded-lg transition-all ${
                basemap === 'terrain'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
              }`}
              aria-label="Terrain basemap"
            >
              <Mountain className="size-4" />
              <span className="text-[8.5px] mt-0.5">Terrain</span>
            </button>
          } />
          <TooltipContent side="right" className="text-xs">
            Topographic terrain contours
          </TooltipContent>
        </Tooltip>

        {/* Dark */}
        <Tooltip>
          <TooltipTrigger render={
            <button
              onClick={() => onBasemapChange('dark')}
              className={`flex flex-col items-center justify-center size-10 rounded-lg transition-all ${
                basemap === 'dark'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
              }`}
              aria-label="Dark control room basemap"
            >
              <Moon className="size-4" />
              <span className="text-[8.5px] mt-0.5">Dark</span>
            </button>
          } />
          <TooltipContent side="right" className="text-xs">
            High-contrast dark vector map
          </TooltipContent>
        </Tooltip>
      </div>

      <span className="w-6 h-px bg-border/70 my-0.5" />

      {/* 4. Legend Popover */}
      <Popover open={legendOpen} onOpenChange={setLegendOpen}>
        <PopoverTrigger render={
          <button
            className={`flex flex-col items-center justify-center size-10 rounded-lg transition-colors group ${
              legendOpen ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
            }`}
            aria-label="Map legend"
          >
            <Info className="size-4 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-medium mt-0.5">Legend</span>
          </button>
        } />
        <PopoverContent side="right" sideOffset={12} className="w-64 glass-panel p-3 text-xs z-50">
          <div className="text-xs font-bold text-foreground mb-2 pb-1.5 border-b border-border">
            GIS Symbology Legend
          </div>
          <div className="space-y-2 font-mono text-[11px]">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-status-online" />
              <span className="text-foreground">Online device (Nominal)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-xs bg-status-offline" />
              <span className="text-foreground">Offline device (Timeout)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full border border-status-stale bg-transparent" />
              <span className="text-foreground">Stale telemetry</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rotate-45 bg-status-warning" />
              <span className="text-foreground">Needs attention</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-border">
              <span className="h-1 w-5 bg-blue-500 rounded" />
              <span className="text-foreground font-sans">Fibre route</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-0.5 w-5 border-t border-dashed border-amber-500" />
              <span className="text-foreground font-sans">Copper route</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
