import React, { useState } from 'react';
import {
  Layers,
  RadioTower,
  Route,
  CircleDot,
  Video,
  Mountain,
  Globe,
  RotateCcw,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import type { LayerVisibility } from './LayerRail';

interface MapLayersToolbarProps {
  activeLayers: LayerVisibility;
  onToggleLayer: (key: keyof LayerVisibility) => void;
  onResetLayers?: () => void;
  basemap: 'satellite' | 'terrain' | 'dark' | 'streets';
  onBasemapChange: (bm: 'satellite' | 'terrain') => void;
}

export const MapLayersToolbar: React.FC<MapLayersToolbarProps> = ({
  activeLayers,
  onToggleLayer,
  onResetLayers,
  basemap,
  onBasemapChange,
}) => {
  const [layersPopoverOpen, setLayersPopoverOpen] = useState(false);

  return (
    <div
      className="pointer-events-auto flex items-center h-[42px] w-[612px] px-1 py-1 rounded-xl border dark:border-[#2a323d] border-slate-200/90 dark:bg-[#141b23]/95 bg-white/95 backdrop-blur-md shadow-xl transition-colors select-none"
      data-node-id="138:13764"
      data-name="Map layers toolbar"
    >
      {/* 1. Layers tool (Layers icon, opens Popover, active blue) */}
      <Popover open={layersPopoverOpen} onOpenChange={setLayersPopoverOpen}>
        <PopoverTrigger
          render={
            <button
              className={`flex items-center justify-center gap-1.5 w-[84px] h-[32px] rounded-lg transition-all cursor-pointer text-xs font-medium ${
                layersPopoverOpen
                  ? 'bg-[#2563eb] text-white shadow-xs'
                  : 'bg-[#2563eb] text-white shadow-xs hover:bg-[#1d4ed8]'
              }`}
              title="Layer controls"
            >
              <Layers className="size-3.5 shrink-0" />
              <span>Layers</span>
            </button>
          }
        />
        <PopoverContent
          side="top"
          align="start"
          sideOffset={12}
          className="w-56 p-3 bg-popover border border-border shadow-2xl rounded-xl z-50 text-xs"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
            <span className="font-semibold text-foreground">Map Layers</span>
            {onResetLayers && (
              <button
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

      {/* 2. Sites toggle (69px) */}
      <button
        onClick={() => onToggleLayer('sites')}
        className={`flex items-center justify-center gap-1.5 w-[69px] h-[32px] rounded-lg transition-all cursor-pointer text-xs ${
          activeLayers.sites
            ? 'dark:text-[#e2e7ef] text-slate-700 hover:bg-black/5 dark:hover:bg-white/5 font-medium'
            : 'opacity-40 text-muted-foreground hover:opacity-70'
        }`}
        title="Toggle Sites layer"
      >
        <RadioTower className="size-3.5 shrink-0" />
        <span>Sites</span>
      </button>

      {/* 3. Cables toggle (80px) */}
      <button
        onClick={() => onToggleLayer('cableRoutes')}
        className={`flex items-center justify-center gap-1.5 w-[80px] h-[32px] rounded-lg transition-all cursor-pointer text-xs ${
          activeLayers.cableRoutes
            ? 'dark:text-[#e2e7ef] text-slate-700 hover:bg-black/5 dark:hover:bg-white/5 font-medium'
            : 'opacity-40 text-muted-foreground hover:opacity-70'
        }`}
        title="Toggle Cable routes layer"
      >
        <Route className="size-3.5 shrink-0" />
        <span>Cables</span>
      </button>

      {/* 4. Devices toggle (86px) */}
      <button
        onClick={() => onToggleLayer('devices')}
        className={`flex items-center justify-center gap-1.5 w-[86px] h-[32px] rounded-lg transition-all cursor-pointer text-xs ${
          activeLayers.devices
            ? 'dark:text-[#e2e7ef] text-slate-700 hover:bg-black/5 dark:hover:bg-white/5 font-medium'
            : 'opacity-40 text-muted-foreground hover:opacity-70'
        }`}
        title="Toggle Devices layer"
      >
        <CircleDot className="size-3.5 shrink-0" />
        <span>Devices</span>
      </button>

      {/* 5. CCTV toggle (74px) */}
      <button
        onClick={() => onToggleLayer('cctv')}
        className={`flex items-center justify-center gap-1.5 w-[74px] h-[32px] rounded-lg transition-all cursor-pointer text-xs ${
          activeLayers.cctv
            ? 'dark:text-[#e2e7ef] text-slate-700 hover:bg-black/5 dark:hover:bg-white/5 font-medium'
            : 'opacity-40 text-muted-foreground hover:opacity-70'
        }`}
        title="Toggle CCTV cameras"
      >
        <Video className="size-3.5 shrink-0" />
        <span>CCTV</span>
      </button>

      {/* Divider */}
      <div className="w-px h-[20px] dark:bg-[#2a323d] bg-slate-200 mx-1 shrink-0" />

      {/* 6. Terrain Basemap toggle (81px) */}
      <button
        onClick={() => onBasemapChange('terrain')}
        className={`flex items-center justify-center gap-1.5 w-[81px] h-[32px] rounded-lg transition-all cursor-pointer text-xs ${
          basemap === 'terrain'
            ? 'bg-[#2563eb] text-white font-medium shadow-xs'
            : 'dark:text-[#a3adbd] text-slate-600 hover:dark:text-[#e2e7ef] hover:bg-black/5 dark:hover:bg-white/5'
        }`}
        title="Switch to Terrain basemap"
      >
        <Mountain className="size-3.5 shrink-0" />
        <span>Terrain</span>
      </button>

      {/* 7. Satellite Basemap toggle (91px, active default) */}
      <button
        onClick={() => onBasemapChange('satellite')}
        className={`flex items-center justify-center gap-1.5 w-[91px] h-[32px] rounded-lg transition-all cursor-pointer text-xs ${
          basemap === 'satellite'
            ? 'bg-[#2563eb] text-white font-medium shadow-xs'
            : 'dark:text-[#a3adbd] text-slate-600 hover:dark:text-[#e2e7ef] hover:bg-black/5 dark:hover:bg-white/5'
        }`}
        title="Switch to Satellite basemap"
      >
        <Globe className="size-3.5 shrink-0" />
        <span>Satellite</span>
      </button>
    </div>
  );
};
