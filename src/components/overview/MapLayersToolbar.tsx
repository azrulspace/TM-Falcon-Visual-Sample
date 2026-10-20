import React, { useState } from 'react';
import {
  Globe,
  RadioTower,
  Route,
  Circle,
  Video,
  Mountain,
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

  // Check if all primary layers are active
  const isAllDefaultLayers =
    activeLayers.sites &&
    activeLayers.cableRoutes &&
    activeLayers.devices &&
    activeLayers.cctv;

  return (
    <div
      className="pointer-events-auto flex items-center h-[68px] px-[7px] py-[6px] gap-[4px] rounded-[10px] border dark:border-[#2a323d] border-slate-200/80 dark:bg-[#141b23]/92 bg-white/92 backdrop-blur-md shadow-2xl transition-colors select-none"
      data-node-id="132:10788"
      data-name="Map layers"
    >
      {/* 1. Layers tool (Globe icon, opens Popover) */}
      <Popover open={layersPopoverOpen} onOpenChange={setLayersPopoverOpen}>
        <PopoverTrigger
          render={
            <button
              className={`flex flex-col items-center justify-center w-[54px] h-[55px] rounded-[6px] transition-all cursor-pointer ${
                isAllDefaultLayers
                  ? 'bg-[#1850a0] text-[#e2e7ef] shadow-sm'
                  : 'dark:text-[#a3adbd] text-slate-600 hover:dark:text-[#e2e7ef] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title="Layer controls"
            >
              <Globe className="size-[20px] mb-1 shrink-0" />
              <span className="text-[10px] font-normal leading-none">Layers</span>
            </button>
          }
        />
        <PopoverContent
          side="top"
          align="start"
          sideOffset={14}
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
              <span>Sites & Exchanges</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-foreground hover:text-primary transition-colors">
              <Checkbox
                checked={activeLayers.cableRoutes}
                onCheckedChange={() => onToggleLayer('cableRoutes')}
              />
              <span>Cable Network (Fibre & Copper)</span>
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

      {/* 2. Sites toggle */}
      <button
        onClick={() => onToggleLayer('sites')}
        className={`flex flex-col items-center justify-center w-[54px] h-[55px] rounded-[6px] transition-all cursor-pointer ${
          activeLayers.sites
            ? 'dark:text-[#e2e7ef] text-slate-800 hover:bg-black/5 dark:hover:bg-white/5'
            : 'opacity-40 text-muted-foreground hover:opacity-70'
        }`}
        title="Toggle Sites"
      >
        <RadioTower className="size-[20px] mb-1 shrink-0" />
        <span className="text-[10px] font-normal leading-none">Sites</span>
      </button>

      {/* 3. Cables toggle */}
      <button
        onClick={() => onToggleLayer('cableRoutes')}
        className={`flex flex-col items-center justify-center w-[54px] h-[55px] rounded-[6px] transition-all cursor-pointer ${
          activeLayers.cableRoutes
            ? 'dark:text-[#e2e7ef] text-slate-800 hover:bg-black/5 dark:hover:bg-white/5'
            : 'opacity-40 text-muted-foreground hover:opacity-70'
        }`}
        title="Toggle Cables"
      >
        <Route className="size-[20px] mb-1 shrink-0" />
        <span className="text-[10px] font-normal leading-none">Cables</span>
      </button>

      {/* 4. Devices toggle */}
      <button
        onClick={() => onToggleLayer('devices')}
        className={`flex flex-col items-center justify-center w-[54px] h-[55px] rounded-[6px] transition-all cursor-pointer ${
          activeLayers.devices
            ? 'dark:text-[#e2e7ef] text-slate-800 hover:bg-black/5 dark:hover:bg-white/5'
            : 'opacity-40 text-muted-foreground hover:opacity-70'
        }`}
        title="Toggle Devices"
      >
        <Circle className="size-[20px] mb-1 shrink-0" />
        <span className="text-[10px] font-normal leading-none">Devices</span>
      </button>

      {/* 5. CCTV toggle */}
      <button
        onClick={() => onToggleLayer('cctv')}
        className={`flex flex-col items-center justify-center w-[54px] h-[55px] rounded-[6px] transition-all cursor-pointer ${
          activeLayers.cctv
            ? 'dark:text-[#e2e7ef] text-slate-800 hover:bg-black/5 dark:hover:bg-white/5'
            : 'opacity-40 text-muted-foreground hover:opacity-70'
        }`}
        title="Toggle CCTV"
      >
        <Video className="size-[20px] mb-1 shrink-0" />
        <span className="text-[10px] font-normal leading-none">CCTV</span>
      </button>

      {/* 1px Vertical Tool Divider */}
      <div className="h-[28px] w-px dark:bg-[#2a323d] bg-slate-200 mx-1 shrink-0" />

      {/* 6. Terrain Basemap */}
      <button
        onClick={() => onBasemapChange('terrain')}
        className={`flex flex-col items-center justify-center w-[54px] h-[55px] rounded-[6px] transition-all cursor-pointer ${
          basemap === 'terrain'
            ? 'bg-[#1850a0] text-[#e2e7ef] shadow-sm'
            : 'dark:text-[#a3adbd] text-slate-600 hover:dark:text-[#e2e7ef] hover:bg-black/5 dark:hover:bg-white/5'
        }`}
        title="Terrain Topographic View"
      >
        <Mountain className="size-[20px] mb-1 shrink-0" />
        <span className="text-[10px] font-normal leading-none">Terrain</span>
      </button>

      {/* 7. Satellite Basemap */}
      <button
        onClick={() => onBasemapChange('satellite')}
        className={`flex flex-col items-center justify-center w-[54px] h-[55px] rounded-[6px] transition-all cursor-pointer ${
          basemap === 'satellite'
            ? 'bg-[#173c56] text-[#e2e7ef] shadow-sm'
            : 'dark:text-[#a3adbd] text-slate-600 hover:dark:text-[#e2e7ef] hover:bg-black/5 dark:hover:bg-white/5'
        }`}
        title="Satellite Imagery View"
      >
        {/* Custom Satellite Dish SVG matching Figma node 132:10817 */}
        <svg className="size-[20px] mb-1 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2 L3 12" />
          <path d="M12 7 L17 2 L22 7 L17 12 Z" />
          <path d="M5 16 A 8 8 0 0 0 16 16" />
        </svg>
        <span className="text-[10px] font-normal leading-none">Satellite</span>
      </button>
    </div>
  );
};
