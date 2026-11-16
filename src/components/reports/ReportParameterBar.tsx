import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  MapPin,
  GitCompare,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import type { PeriodPreset, ReportParameters } from '@/types/reports';
import { SITES } from '@/data/poles';

export interface ReportParameterBarProps {
  parameters: ReportParameters;
  onParametersChange: (next: Partial<ReportParameters>) => void;
  onResetDefaults?: () => void;
  className?: string;
}

const PERIOD_OPTIONS: { value: PeriodPreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This week (Mon-Sun)' },
  { value: 'last_week', label: 'Last week' },
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom range...' },
];

export const ReportParameterBar: React.FC<ReportParameterBarProps> = ({
  parameters,
  onParametersChange,
  onResetDefaults,
  className = '',
}) => {
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const handlePeriodChange = (val: string) => {
    onParametersChange({ periodPreset: val as PeriodPreset });
  };

  const handleSiteChange = (val: string) => {
    onParametersChange({ site: val });
  };

  const handleCompareChange = (checked: boolean) => {
    onParametersChange({ compareWithPrevious: checked });
  };

  const handleSimulatedChange = (checked: boolean) => {
    onParametersChange({ includeSimulatedEvents: checked });
  };

  return (
    <>
      <div
        className={`sticky top-14 z-20 p-2.5 rounded-xl border border-border bg-background/95 backdrop-blur-md shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs ${className}`}
      >
        {/* Left primary filters (Desktop / Tablet landscape) */}
        <div className="hidden lg:flex items-center gap-2.5 flex-wrap flex-1">
          {/* Period selector */}
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="size-3.5 text-muted-foreground shrink-0" />
            <Select value={parameters.periodPreset} onValueChange={handlePeriodChange}>
              <SelectTrigger className="h-8 text-xs min-w-[170px] bg-background">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Pickers when 'custom' is active */}
          {parameters.periodPreset === 'custom' && (
            <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
              <input
                type="date"
                value={parameters.customStartDate?.slice(0, 10) || ''}
                onChange={(e) =>
                  onParametersChange({
                    customStartDate: e.target.value
                      ? `${e.target.value}T00:00:00+08:00`
                      : undefined,
                  })
                }
                className="h-8 px-2 text-xs rounded-md border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <span className="text-muted-foreground text-[11px]">to</span>
              <input
                type="date"
                value={parameters.customEndDate?.slice(0, 10) || ''}
                onChange={(e) =>
                  onParametersChange({
                    customEndDate: e.target.value
                      ? `${e.target.value}T23:59:59+08:00`
                      : undefined,
                  })
                }
                className="h-8 px-2 text-xs rounded-md border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          )}

          {/* Site Selector */}
          <div className="flex items-center gap-1.5 border-l border-border/60 pl-2.5">
            <MapPin className="size-3.5 text-muted-foreground shrink-0" />
            <Select value={parameters.site || 'All sites'} onValueChange={handleSiteChange}>
              <SelectTrigger className="h-8 text-xs min-w-[180px] bg-background">
                <SelectValue placeholder="All sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All sites" className="text-xs">
                  All sites (Network wide)
                </SelectItem>
                {SITES.map((site) => (
                  <SelectItem key={site.name} value={site.name} className="text-xs">
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Compare toggle */}
          <div className="flex items-center gap-2 border-l border-border/60 pl-2.5 py-0.5">
            <GitCompare className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-[11px] text-muted-foreground font-medium select-none">
              Compare prior period
            </span>
            <Switch
              checked={parameters.compareWithPrevious || false}
              onCheckedChange={handleCompareChange}
              title="Compare metrics with the preceding equivalent time period"
            />
          </div>

          {/* Include simulated events toggle */}
          <div className="flex items-center gap-2 border-l border-border/60 pl-2.5 py-0.5">
            <Sparkles className="size-3.5 text-amber-500 shrink-0" />
            <span className="text-[11px] text-muted-foreground font-medium select-none">
              Include simulation
            </span>
            <Switch
              checked={parameters.includeSimulatedEvents || false}
              onCheckedChange={handleSimulatedChange}
              title="Include test drills and simulated synthetic events"
            />
          </div>
        </div>

        {/* Tablet / Mobile compact trigger */}
        <div className="flex lg:hidden items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-foreground">
              {PERIOD_OPTIONS.find((p) => p.value === parameters.periodPreset)?.label || 'Today'}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{parameters.site || 'All sites'}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileSheetOpen(true)}
            className="gap-1.5 text-xs h-7.5"
          >
            <SlidersHorizontal className="size-3" />
            <span>Parameters</span>
          </Button>
        </div>

        {/* Right side: Reset defaults button */}
        {onResetDefaults && (
          <div className="hidden lg:flex items-center pl-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetDefaults}
              className="h-8 text-[11px] text-muted-foreground hover:text-foreground gap-1 px-2"
              title="Reset parameters to template defaults"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </Button>
          </div>
        )}
      </div>

      {/* Mobile / Tablet Sheet for Parameters */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent side="bottom" className="p-6 max-h-[85vh] overflow-y-auto space-y-5">
          <SheetHeader>
            <SheetTitle className="text-base font-semibold">Report Parameters</SheetTitle>
            <SheetDescription className="text-xs">
              Configure operational timeframe, site jurisdiction, and comparison intervals.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 text-xs">
            {/* Period select */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <CalendarIcon className="size-3.5 text-muted-foreground" />
                <span>Time Period</span>
              </label>
              <Select value={parameters.periodPreset} onValueChange={handlePeriodChange}>
                <SelectTrigger className="h-9 text-xs w-full">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom dates if active */}
            {parameters.periodPreset === 'custom' && (
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/40 rounded-lg border border-border">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">From</label>
                  <input
                    type="date"
                    value={parameters.customStartDate?.slice(0, 10) || ''}
                    onChange={(e) =>
                      onParametersChange({
                        customStartDate: e.target.value
                          ? `${e.target.value}T00:00:00+08:00`
                          : undefined,
                      })
                    }
                    className="h-8 px-2 text-xs w-full rounded-md border border-input bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">To</label>
                  <input
                    type="date"
                    value={parameters.customEndDate?.slice(0, 10) || ''}
                    onChange={(e) =>
                      onParametersChange({
                        customEndDate: e.target.value
                          ? `${e.target.value}T23:59:59+08:00`
                          : undefined,
                      })
                    }
                    className="h-8 px-2 text-xs w-full rounded-md border border-input bg-background"
                  />
                </div>
              </div>
            )}

            {/* Site select */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="size-3.5 text-muted-foreground" />
                <span>Site Jurisdiction</span>
              </label>
              <Select value={parameters.site || 'All sites'} onValueChange={handleSiteChange}>
                <SelectTrigger className="h-9 text-xs w-full">
                  <SelectValue placeholder="All sites" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All sites" className="text-xs">
                    All sites (Network wide)
                  </SelectItem>
                  {SITES.map((site) => (
                    <SelectItem key={site.name} value={site.name} className="text-xs">
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Compare toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
              <div>
                <div className="font-semibold text-foreground">Compare with previous period</div>
                <div className="text-[11px] text-muted-foreground">
                  Displays absolute differences and percentage changes
                </div>
              </div>
              <Switch
                checked={parameters.compareWithPrevious || false}
                onCheckedChange={handleCompareChange}
              />
            </div>

            {/* Simulated events toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
              <div>
                <div className="font-semibold text-foreground flex items-center gap-1">
                  <span>Include simulated events</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 font-bold">
                    DRILL
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Include test scenarios and simulated alarms
                </div>
              </div>
              <Switch
                checked={parameters.includeSimulatedEvents || false}
                onCheckedChange={handleSimulatedChange}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            {onResetDefaults && (
              <Button variant="ghost" size="sm" onClick={onResetDefaults} className="text-xs">
                Reset
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={() => setMobileSheetOpen(false)}
              className="text-xs"
            >
              Apply parameters
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
