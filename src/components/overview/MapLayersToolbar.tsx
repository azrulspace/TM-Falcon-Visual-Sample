import React, { useState } from 'react';
import {
  Info,
  Layers,
  RadioTower,
  Route,
  CircleDot,
  Video,
  Mountain,
  Globe,
  RotateCcw,
  ShieldAlert,
  Milestone,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { LayerVisibility } from './LayerRail';

export interface MapLayersToolbarProps {
  activeLayers: LayerVisibility;
  onToggleLayer: (key: keyof LayerVisibility) => void;
  onResetLayers?: () => void;
  basemap: 'satellite' | 'terrain' | 'dark' | 'streets';
  onBasemapChange: (bm: 'satellite' | 'terrain') => void;
  showLabels?: boolean;
  className?: string;
}

export const MapLayersToolbar: React.FC<MapLayersToolbarProps> = ({
  activeLayers,
  onToggleLayer,
  onResetLayers,
  basemap,
  onBasemapChange,
  showLabels = false,
  className = '',
}) => {
  const [infoPopoverOpen, setInfoPopoverOpen] = useState(false);
  const [layersPopoverOpen, setLayersPopoverOpen] = useState(false);

  return (
    <div
      className={`pointer-events-auto flex items-center h-[42px] px-1 py-1 gap-1 rounded-xl border dark:border-[#2a323d] border-slate-200/90 dark:bg-[#141b23]/95 bg-white/95 backdrop-blur-md shadow-xl transition-colors select-none ${className}`}
      data-testid="map-layers-toolbar"
      data-name="Map layers toolbar"
      role="toolbar"
      aria-label="Map layers and basemap toolbar"
    >
      {/* 1. Info / Legend Button (i) */}
      <Popover open={infoPopoverOpen} onOpenChange={setInfoPopoverOpen}>
        <Tooltip>
          <TooltipTrigger
            render={
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    aria-label="Map legend and symbols"
                    className={`flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                      showLabels ? 'h-[32px] px-2.5 gap-1.5 text-xs font-medium' : 'size-8'
                    } ${
                      infoPopoverOpen
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <Info className="size-4 shrink-0" />
                    {showLabels && <span>Legend</span>}
                  </button>
                }
              />
            }
          />
          <TooltipContent side="top" className="text-xs">
            Map legend &amp; symbols
          </TooltipContent>
        </Tooltip>
        <PopoverContent
          side="top"
          align="start"
          sideOffset={12}
          className="w-72 p-3 bg-popover border border-border shadow-2xl rounded-xl z-50 text-xs"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
            <span className="font-semibold text-foreground">Map Legend &amp; Symbols</span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Infrastructure
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1 bg-[#00d2ff] rounded-full inline-block" />
                  <span className="text-foreground">Fibre route</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-400 inline-block" />
                  <span className="text-foreground">Utility pole</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioTower className="size-3 text-primary shrink-0" />
                  <span className="text-foreground">Relay tower</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Video className="size-3 text-sky-400 shrink-0" />
                  <span className="text-foreground">CCTV camera</span>
                </div>
              </div>
            </div>

            <div className="border-t border-border/60 pt-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Telemetry &amp; Incidents
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-foreground">Online</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-500 inline-block" />
                  <span className="text-foreground">Stale telemetry</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-rose-500 inline-block" />
                  <span className="text-foreground">Offline / Fault</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="size-3 text-amber-500 shrink-0" />
                  <span className="text-foreground">Active event</span>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* 2. Sites Layer Toggle */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={() => onToggleLayer('sites')}
              aria-label="Toggle Sites layer"
              aria-pressed={activeLayers.sites}
              className={`flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                showLabels ? 'h-[32px] px-2.5 gap-1.5 text-xs font-medium' : 'size-8'
              } ${
                activeLayers.sites
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'opacity-45 text-muted-foreground hover:opacity-80 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <RadioTower className="size-3.5 shrink-0" />
              {showLabels && <span>Sites</span>}
            </button>
          }
        />
        <TooltipContent side="top" className="text-xs">
          Sites &amp; exchanges ({activeLayers.sites ? 'Visible' : 'Hidden'})
        </TooltipContent>
      </Tooltip>

      {/* 3. Cables Layer Toggle */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={() => onToggleLayer('cableRoutes')}
              aria-label="Toggle Cable routes layer"
              aria-pressed={activeLayers.cableRoutes}
              className={`flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                showLabels ? 'h-[32px] px-2.5 gap-1.5 text-xs font-medium' : 'size-8'
              } ${
                activeLayers.cableRoutes
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'opacity-45 text-muted-foreground hover:opacity-80 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Route className="size-3.5 shrink-0" />
              {showLabels && <span>Cables</span>}
            </button>
          }
        />
        <TooltipContent side="top" className="text-xs">
          Cable routes ({activeLayers.cableRoutes ? 'Visible' : 'Hidden'})
        </TooltipContent>
      </Tooltip>

      {/* 4. Devices Layer Toggle */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={() => onToggleLayer('devices')}
              aria-label="Toggle Devices layer"
              aria-pressed={activeLayers.devices}
              className={`flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                showLabels ? 'h-[32px] px-2.5 gap-1.5 text-xs font-medium' : 'size-8'
              } ${
                activeLayers.devices
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'opacity-45 text-muted-foreground hover:opacity-80 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <CircleDot className="size-3.5 shrink-0" />
              {showLabels && <span>Devices</span>}
            </button>
          }
        />
        <TooltipContent side="top" className="text-xs">
          Telemetry devices ({activeLayers.devices ? 'Visible' : 'Hidden'})
        </TooltipContent>
      </Tooltip>

      {/* 5. CCTV Layer Toggle */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={() => onToggleLayer('cctv')}
              aria-label="Toggle CCTV cameras"
              aria-pressed={activeLayers.cctv}
              className={`flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                showLabels ? 'h-[32px] px-2.5 gap-1.5 text-xs font-medium' : 'size-8'
              } ${
                activeLayers.cctv
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'opacity-45 text-muted-foreground hover:opacity-80 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Video className="size-3.5 shrink-0" />
              {showLabels && <span>CCTV</span>}
            </button>
          }
        />
        <TooltipContent side="top" className="text-xs">
          CCTV video feeds ({activeLayers.cctv ? 'Visible' : 'Hidden'})
        </TooltipContent>
      </Tooltip>

      {/* 6. Poles Layer Toggle */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={() => onToggleLayer('poles')}
              aria-label="Toggle Utility poles layer"
              aria-pressed={activeLayers.poles}
              className={`flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                showLabels ? 'h-[32px] px-2.5 gap-1.5 text-xs font-medium' : 'size-8'
              } ${
                activeLayers.poles
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'opacity-45 text-muted-foreground hover:opacity-80 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Milestone className="size-3.5 shrink-0" />
              {showLabels && <span>Poles</span>}
            </button>
          }
        />
        <TooltipContent side="top" className="text-xs">
          Utility poles ({activeLayers.poles ? 'Visible' : 'Hidden'})
        </TooltipContent>
      </Tooltip>

      {/* 7. Warnings / Events Layer Toggle */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={() => onToggleLayer('events')}
              aria-label="Toggle Network warnings layer"
              aria-pressed={activeLayers.events}
              className={`flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                showLabels ? 'h-[32px] px-2.5 gap-1.5 text-xs font-medium' : 'size-8'
              } ${
                activeLayers.events
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'opacity-45 text-muted-foreground hover:opacity-80 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <ShieldAlert className="size-3.5 shrink-0" />
              {showLabels && <span>Warnings</span>}
            </button>
          }
        />
        <TooltipContent side="top" className="text-xs">
          Network warnings ({activeLayers.events ? 'Visible' : 'Hidden'})
        </TooltipContent>
      </Tooltip>

      {/* 8. Layers & Basemaps Popover */}
      <Popover open={layersPopoverOpen} onOpenChange={setLayersPopoverOpen}>
        <Tooltip>
          <TooltipTrigger
            render={
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    aria-label="Base map and layer options"
                    className={`flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                      showLabels ? 'h-[32px] px-2.5 gap-1.5 text-xs font-medium' : 'size-8'
                    } ${
                      layersPopoverOpen
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <Layers className="size-4 shrink-0" />
                    {showLabels && <span>Layers</span>}
                  </button>
                }
              />
            }
          />
          <TooltipContent side="top" className="text-xs">
            Base maps &amp; layers
          </TooltipContent>
        </Tooltip>
        <PopoverContent
          side="top"
          align="start"
          sideOffset={12}
          className="w-56 p-3 bg-popover border border-border shadow-2xl rounded-xl z-50 text-xs"
        >
          {/* Basemaps */}
          <div className="space-y-1.5 pb-2.5 mb-2.5 border-b border-border">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Base Map
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onBasemapChange('satellite')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  basemap === 'satellite'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Globe className="size-3.5 shrink-0" />
                <span>Satellite</span>
              </button>
              <button
                type="button"
                onClick={() => onBasemapChange('terrain')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  basemap === 'terrain'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Mountain className="size-3.5 shrink-0" />
                <span>Terrain</span>
              </button>
            </div>
          </div>

          {/* Layer Visibility Checkboxes */}
          <div className="flex items-center justify-between pb-1.5 mb-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Layer Visibility
            </span>
            {onResetLayers && (
              <button
                type="button"
                onClick={onResetLayers}
                className="text-[10px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="size-2.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-foreground hover:text-primary transition-colors">
              <Checkbox
                checked={activeLayers.sites}
                onCheckedChange={() => onToggleLayer('sites')}
              />
              <span>Sites &amp; Exchanges</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-foreground hover:text-primary transition-colors">
              <Checkbox
                checked={activeLayers.cableRoutes}
                onCheckedChange={() => onToggleLayer('cableRoutes')}
              />
              <span>Cable Network (Fibre)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-foreground hover:text-primary transition-colors">
              <Checkbox
                checked={activeLayers.devices}
                onCheckedChange={() => onToggleLayer('devices')}
              />
              <span>IoT Telemetry Devices</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-foreground hover:text-primary transition-colors">
              <Checkbox
                checked={activeLayers.cctv}
                onCheckedChange={() => onToggleLayer('cctv')}
              />
              <span>CCTV Video Feeds</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-foreground hover:text-primary transition-colors">
              <Checkbox
                checked={activeLayers.poles}
                onCheckedChange={() => onToggleLayer('poles')}
              />
              <span>Utility Poles</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-foreground hover:text-primary transition-colors">
              <Checkbox
                checked={activeLayers.events}
                onCheckedChange={() => onToggleLayer('events')}
              />
              <span>Network Warnings</span>
            </label>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
