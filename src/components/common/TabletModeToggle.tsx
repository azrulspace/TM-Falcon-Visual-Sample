import React, { useState } from 'react';
import { Tablet, Laptop, Sparkles, Smartphone, Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useUiMode, type UiModeSetting } from '@/hooks/useUiMode';

export const TabletModeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const {
    modeSetting,
    setModeSetting,
    resolvedMode,
    viewportWidth,
    openPreviewFrame,
  } = useUiMode();
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Phones (< 768px) do not show the tablet toggle
  if (viewportWidth < 768) {
    return null;
  }

  const isTabletActive = resolvedMode === 'tablet';

  const options: { id: UiModeSetting; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'auto',
      label: 'Auto',
      icon: <Sparkles className="size-3.5" />,
      desc: 'Automatically switches based on screen width and touch capability.',
    },
    {
      id: 'tablet',
      label: 'Tablet',
      icon: <Tablet className="size-3.5" />,
      desc: 'Forces touch-optimized 44px targets, drawer sheets, and tablet navigation.',
    },
    {
      id: 'desktop',
      label: 'Desktop',
      icon: <Laptop className="size-3.5" />,
      desc: 'Standard desktop density, full tables, and hover-enabled flyouts.',
    },
  ];

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <button
                  type="button"
                  aria-label="Tablet mode"
                  aria-pressed={isTabletActive}
                  className={`size-8 rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
                    isTabletActive
                      ? 'bg-primary/15 text-primary border border-primary/30 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                  } ${className}`}
                >
                  <Tablet className="size-4" />
                  {isTabletActive && (
                    <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary" />
                  )}
                </button>
              }
            />
          }
        />
        <TooltipContent side="bottom" className="text-xs">
          Tablet mode ({modeSetting === 'auto' ? `Auto: ${resolvedMode}` : modeSetting})
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="w-72 p-3 bg-popover border border-border shadow-2xl rounded-xl z-50 text-xs"
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Tablet className="size-3.5 text-primary" />
            <span>UI Mode</span>
          </div>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
            {resolvedMode}
          </span>
        </div>

        {/* Segmented Control Options */}
        <div className="space-y-1">
          {options.map((opt) => {
            const isSelected = modeSetting === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setModeSetting(opt.id)}
                className={`w-full flex flex-col items-start p-2 rounded-lg text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted/60 text-muted-foreground'
                }`}
              >
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-foreground font-semibold">
                    {opt.icon}
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && <Check className="size-3.5 text-primary" />}
                </div>
                <p className="text-[10.5px] text-muted-foreground leading-tight mt-0.5">
                  {opt.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Desktop Screen Review Option: "Preview on this screen" */}
        {viewportWidth > 1366 && (
          <div className="mt-3 pt-2.5 border-t border-border space-y-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Preview on this screen
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setPopoverOpen(false);
                  openPreviewFrame('landscape');
                }}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md border border-border hover:bg-muted text-xs text-foreground font-medium transition-colors cursor-pointer"
                title="Preview inside 1180x820 landscape frame"
              >
                <Tablet className="size-3 rotate-90 text-primary" />
                <span>Landscape</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPopoverOpen(false);
                  openPreviewFrame('portrait');
                }}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md border border-border hover:bg-muted text-xs text-foreground font-medium transition-colors cursor-pointer"
                title="Preview inside 820x1180 portrait frame"
              >
                <Smartphone className="size-3 text-primary" />
                <span>Portrait</span>
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
