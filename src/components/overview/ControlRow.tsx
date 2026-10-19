import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, Rows, AlignJustify } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ControlRowProps {
  timeMode: string;
  onTimeModeChange: (mode: string) => void;
  historyRange: string;
  onHistoryRangeChange: (range: string) => void;
  mapFocus: boolean;
  onToggleMapFocus: () => void;
  density: 'default' | 'compact';
  onToggleDensity: () => void;
}

export const ControlRow: React.FC<ControlRowProps> = ({
  timeMode,
  onTimeModeChange,
  historyRange,
  onHistoryRangeChange,
  mapFocus,
  onToggleMapFocus,
  density,
  onToggleDensity,
}) => {
  return (
    <div className="flex items-center justify-between h-9 px-1 mb-2.5 shrink-0 gap-3">
      {/* Left: Active now / History switch + optional History Range Selector */}
      <div className="flex items-center gap-2">
        <Tabs value={timeMode} onValueChange={onTimeModeChange} className="h-8">
          <TabsList className="h-8 p-0.5 bg-muted/80 border border-border rounded-md">
            <TabsTrigger
              value="Active now"
              className="h-7 px-3 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-sm transition-all"
            >
              Active now
            </TabsTrigger>
            <TabsTrigger
              value="History"
              className="h-7 px-3 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-sm transition-all"
            >
              History
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {timeMode === 'History' && (
          <div className="flex items-center gap-1.5 animate-in fade-in-50 duration-150">
            <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">Range:</span>
            <Select value={historyRange} onValueChange={onHistoryRangeChange}>
              <SelectTrigger className="h-8 w-36 text-xs bg-card border-border">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-24-hours">Last 24 hours</SelectItem>
                <SelectItem value="last-7-days">Last 7 days</SelectItem>
                <SelectItem value="last-30-days">Last 30 days</SelectItem>
                <SelectItem value="custom">Custom window</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Right: Density toggle + Map Focus toggle */}
      <div className="flex items-center gap-1.5">
        {/* Compact density toggle */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleDensity}
                className="h-8 px-2.5 border-border bg-card hover:bg-muted text-xs gap-1.5"
              >
                {density === 'compact' ? (
                  <>
                    <Rows className="size-3.5 text-primary" />
                    <span className="hidden sm:inline">Compact</span>
                  </>
                ) : (
                  <>
                    <AlignJustify className="size-3.5 text-muted-foreground" />
                    <span className="hidden sm:inline">Normal</span>
                  </>
                )}
              </Button>
            }
          />
          <TooltipContent side="bottom" className="text-xs">
            Toggle density ({density === 'compact' ? '28px compact rows' : '36px standard rows'})
          </TooltipContent>
        </Tooltip>

        {/* Map Focus toggle */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant={mapFocus ? "secondary" : "outline"}
                size="sm"
                onClick={onToggleMapFocus}
                className={`h-8 px-2.5 text-xs gap-1.5 border-border ${
                  mapFocus ? "bg-primary text-primary-foreground font-semibold" : "bg-card hover:bg-muted"
                }`}
              >
                {mapFocus ? (
                  <>
                    <Minimize2 className="size-3.5" />
                    <span className="hidden sm:inline">Exit Focus</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="size-3.5" />
                    <span className="hidden sm:inline">Map focus</span>
                  </>
                )}
              </Button>
            }
          />
          <TooltipContent side="bottom" className="text-xs">
            {mapFocus ? "Restore side panels" : "Hide side panels and expand map"}
          </TooltipContent>
        </Tooltip>

      </div>
    </div>
  );
};
