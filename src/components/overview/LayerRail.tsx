import React, { useState } from 'react';
import {
  Layers,
  MapPin,
  Cable,
  RadioReceiver,
  Video,
  Mountain,
  Satellite,
  Moon,
  Search,
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
  className?: string;
}

export const LayerRail: React.FC<LayerRailProps> = ({
  basemap,
  onBasemapChange,
  layers,
  onToggleLayer,
  onOpenSearch,
  className = '',
}) => {
  const [layersOpen, setLayersOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);

  return (
    <aside
      className={`glass-panel w-[72px] py-2 px-1 flex flex-col items-center gap-1 select-none shadow-2xl border border-border/80 rounded-xl ${className}`}
      aria-label="Map Tools and Layers Rail"
    >
      {/* Quick Search Button at Top */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              onClick={onOpenSearch}
              className="flex flex-col items-center justify-center w-14 h-10 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors group"
              aria-label="Find pole or span"
            >
              <Search className="size-4 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-sans font-medium mt-0.5">Find</span>
            </button>
          }
        />
        <TooltipContent side="right" className="text-xs">
          Find pole or cable span (⌘K)
        </TooltipContent>
      </Tooltip>

      <span className="w-8 h-px bg-border/70 my-0.5" />

      {/* 1. Layers Master Popover Trigger (CEO_REFERENCE) */}
      <Popover open={layersOpen} onOpenChange={setLayersOpen}>
        <PopoverTrigger
          render={
            <button
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all group ${
                layersOpen
                  ? 'bg-brand-solid text-white font-semibold shadow-sm ring-1 ring-brand-solid/40'
                  : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
              }`}
              aria-label="Map layers and overlays"
            >
              <Layers className="size-5 group-hover:scale-105 transition-transform" />
              <span className="text-xs font-sans mt-1">Layers</span>
            </button>
          }
        />
        <PopoverContent side="right" sideOffset={12} className="w-60 glass-panel p-3 text-xs z-50">
          <div className="text-xs font-bold text-foreground mb-2 pb-1.5 border-b border-border">
            Map Overlays & Layers
          </div>
          <div className="space-y-2">
            {[
              { key: 'events', label: 'Incidents & Events' },
              { key: 'devices', label: 'IoT Devices' },
              { key: 'poles', label: 'Utility Poles' },
              { key: 'cableRoutes', label: 'Cable Spans (Fibre/Copper)' },
              { key: 'cctv', label: 'CCTV Feeds' },
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

      {/* 2. Sites Layer Toggle */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              onClick={() => onToggleLayer('sites')}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all group ${
                layers.sites
                  ? 'bg-muted/70 text-foreground font-semibold ring-1 ring-border'
                  : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground opacity-60'
              }`}
              aria-label="Toggle Sites layer"
            >
              <MapPin className="size-5 group-hover:scale-105 transition-transform" />
              <span className="text-xs font-sans mt-1">Sites</span>
            </button>
          }
        />
        <TooltipContent side="right" className="text-xs">
          Toggle Sites & POI labels
        </TooltipContent>
      </Tooltip>

      {/* 3. Cables Layer Toggle */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              onClick={() => onToggleLayer('cableRoutes')}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all group ${
                layers.cableRoutes
                  ? 'bg-muted/70 text-foreground font-semibold ring-1 ring-border'
                  : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground opacity-60'
              }`}
              aria-label="Toggle Cables layer"
            >
              <Cable className="size-5 group-hover:scale-105 transition-transform" />
              <span className="text-xs font-sans mt-1">Cables</span>
            </button>
          }
        />
        <TooltipContent side="right" className="text-xs">
          Toggle Fibre & Copper Spans
        </TooltipContent>
      </Tooltip>

      {/* 4. Devices Layer Toggle */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              onClick={() => onToggleLayer('devices')}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all group ${
                layers.devices
                  ? 'bg-muted/70 text-foreground font-semibold ring-1 ring-border'
                  : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground opacity-60'
              }`}
              aria-label="Toggle Devices layer"
            >
              <RadioReceiver className="size-5 group-hover:scale-105 transition-transform" />
              <span className="text-xs font-sans mt-1">Devices</span>
            </button>
          }
        />
        <TooltipContent side="right" className="text-xs">
          Toggle IoT Sensors & Status Pins
        </TooltipContent>
      </Tooltip>

      {/* 5. CCTV Layer Toggle */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              onClick={() => onToggleLayer('cctv')}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all group ${
                layers.cctv
                  ? 'bg-muted/70 text-foreground font-semibold ring-1 ring-border'
                  : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground opacity-60'
              }`}
              aria-label="Toggle CCTV layer"
            >
              <Video className="size-5 group-hover:scale-105 transition-transform" />
              <span className="text-xs font-sans mt-1">CCTV</span>
            </button>
          }
        />
        <TooltipContent side="right" className="text-xs">
          Toggle Pole Video Feeds
        </TooltipContent>
      </Tooltip>

      {/* Section Divider */}
      <span className="w-8 h-px bg-border/80 my-1" />

      {/* 6. Basemap Selector: Terrain, Satellite, Dark (CEO_REFERENCE) */}
      <div className="flex flex-col items-center gap-1 w-full">
        {/* Terrain */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={() => onBasemapChange('terrain')}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all ${
                  basemap === 'terrain'
                    ? 'bg-brand-solid text-white font-semibold shadow-sm ring-1 ring-brand-solid/40'
                    : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                }`}
                aria-label="Terrain basemap"
              >
                <Mountain className="size-5" />
                <span className="text-xs font-sans mt-1">Terrain</span>
              </button>
            }
          />
          <TooltipContent side="right" className="text-xs">
            Topographic terrain contours
          </TooltipContent>
        </Tooltip>

        {/* Satellite */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={() => onBasemapChange('satellite')}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all ${
                  basemap === 'satellite'
                    ? 'bg-brand-solid text-white font-semibold shadow-sm ring-1 ring-brand-solid/40'
                    : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                }`}
                aria-label="Satellite basemap"
              >
                <Satellite className="size-5" />
                <span className="text-xs font-sans mt-1">Satellite</span>
              </button>
            }
          />
          <TooltipContent side="right" className="text-xs">
            High-resolution satellite imagery
          </TooltipContent>
        </Tooltip>

        {/* Dark (E2: high contrast in both themes) */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={() => onBasemapChange('dark')}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all ${
                  basemap === 'dark'
                    ? 'bg-brand-solid text-white font-semibold shadow-sm ring-1 ring-brand-solid/40'
                    : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                }`}
                aria-label="Dark basemap"
              >
                <Moon className="size-5" />
                <span className="text-xs font-sans mt-1">Dark</span>
              </button>
            }
          />
          <TooltipContent side="right" className="text-xs">
            High-contrast dark vector map
          </TooltipContent>
        </Tooltip>
      </div>

      <span className="w-8 h-px bg-border/80 my-1" />

      {/* 7. Legend Info Button at Bottom (CEO_REFERENCE) */}
      <Popover open={legendOpen} onOpenChange={setLegendOpen}>
        <PopoverTrigger
          render={
            <button
              className={`flex flex-col items-center justify-center w-14 h-10 rounded-lg transition-colors group ${
                legendOpen
                  ? 'bg-brand-solid text-white'
                  : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
              }`}
              aria-label="Map GIS symbology legend"
            >
              <Info className="size-4 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-sans font-medium mt-0.5">Legend</span>
            </button>
          }
        />
        <PopoverContent side="right" sideOffset={12} className="w-64 glass-panel p-3 text-xs z-50">
          <div className="text-xs font-bold text-foreground mb-2 pb-1.5 border-b border-border">
            GIS Symbology Legend
          </div>
          <div className="space-y-2 text-[11px] font-sans">
            <div className="flex items-center gap-2.5">
              <span className="size-2.5 rounded-full bg-status-online" />
              <span className="text-foreground">Online device (Nominal)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="size-2.5 rounded-full bg-destructive" />
              <span className="text-foreground">Offline device (Timeout)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="size-2.5 rounded-full bg-status-stale" />
              <span className="text-foreground">Stale telemetry</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="size-2.5 rounded-xs bg-status-warning rotate-45" />
              <span className="text-foreground">Needs attention</span>
            </div>
            <div className="flex items-center gap-2.5 pt-1 border-t border-border">
              <span className="h-1 w-5 bg-blue-500 rounded" />
              <span className="text-foreground">Fibre cable route</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="h-0.5 w-5 border-t border-dashed border-amber-500" />
              <span className="text-foreground">Copper cable route</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </aside>
  );
};
