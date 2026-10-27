import React, { useEffect } from 'react';
import { AlertTriangle, Layers } from 'lucide-react';
import { useOverview } from '@/contexts/OverviewContext';
import { useUiMode } from '@/hooks/useUiMode';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { NeedsAttentionPanel } from '@/components/overview/panels/NeedsAttentionPanel';
import { AssetsAndDevicesPanel } from '@/components/overview/panels/AssetsAndDevicesPanel';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';

export interface FloatingIconStackProps {
  className?: string;
  renderAttentionPanel?: () => React.ReactNode;
  renderAssetsPanel?: () => React.ReactNode;
}

export const FloatingIconStack: React.FC<FloatingIconStackProps> = ({
  className = '',
  renderAttentionPanel,
  renderAssetsPanel,
}) => {
  const {
    activePanel,
    setActivePanel,
    togglePanel,
    attentionDevices,
    totalFeaturesCount,
    activePopup,
  } = useOverview();

  const { resolvedMode, orientation } = useUiMode();
  const isTablet = resolvedMode === 'tablet';
  const isTabletPortrait = isTablet && orientation === 'portrait';

  // Escape key handler: closes active panel only if popup is NOT currently active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!activePopup && activePanel) {
          setActivePanel(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePopup, activePanel, setActivePanel]);

  const attentionCount = attentionDevices; // 4
  const assetsCount = totalFeaturesCount; // 238 = 120 poles + 114 cable spans + 4 devices

  const buttonSizeClass = isTablet ? 'size-12' : 'size-10';

  return (
    <>
      <div
        className={`pointer-events-none flex flex-col items-end gap-3 z-30 ${className}`}
        data-testid="floating-icon-stack"
      >
        {/* ================= SLOT 1: Needs Attention ================= */}
        {activePanel === 'attention' && !isTabletPortrait ? (
          <div className="pointer-events-auto w-[320px] max-w-[calc(100vw-32px)] flex flex-col animate-in fade-in-50 zoom-in-95 duration-180 motion-reduce:duration-0 shadow-2xl rounded-xl overflow-hidden border dark:border-[#222b38] border-slate-200 dark:bg-[#141b23]/95 bg-white/95 backdrop-blur-md">
            {renderAttentionPanel ? (
              renderAttentionPanel()
            ) : (
              <NeedsAttentionPanel onClose={() => setActivePanel(null)} />
            )}
          </div>
        ) : (
          /* Collapsed Icon Button 1: Needs attention */
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => togglePanel('attention')}
                  aria-expanded={activePanel === 'attention'}
                  aria-controls="needs-attention-panel"
                  aria-label={`Needs attention (${attentionCount})`}
                  className={`pointer-events-auto relative ${buttonSizeClass} rounded-xl border dark:border-[#2a323d] border-slate-200/90 dark:bg-[#141b23]/90 bg-white/90 backdrop-blur-md shadow-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95 transition-all duration-180 cursor-pointer ${
                    activePanel === 'attention' ? 'ring-2 ring-amber-500/50' : ''
                  }`}
                >
                  <AlertTriangle className={`${isTablet ? 'size-5' : 'size-4'} text-amber-500 dark:text-amber-400`} />
                  {attentionCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#e33f50] text-white text-[10px] font-bold font-mono flex items-center justify-center shadow-md border-2 dark:border-[#141b23] border-white">
                      {attentionCount}
                    </span>
                  )}
                </button>
              }
            />
            <TooltipContent side="left" className="text-xs font-medium">
              Needs attention ({attentionCount})
            </TooltipContent>
          </Tooltip>
        )}

        {/* ================= SLOT 2: Assets and Devices ================= */}
        {activePanel === 'assets' && !isTabletPortrait ? (
          <div className="pointer-events-auto w-[320px] max-w-[calc(100vw-32px)] flex flex-col animate-in fade-in-50 zoom-in-95 duration-180 motion-reduce:duration-0 shadow-2xl rounded-xl overflow-hidden border dark:border-[#222b38] border-slate-200 dark:bg-[#141b23]/95 bg-white/95 backdrop-blur-md">
            {renderAssetsPanel ? (
              renderAssetsPanel()
            ) : (
              <AssetsAndDevicesPanel onClose={() => setActivePanel(null)} />
            )}
          </div>
        ) : (
          /* Collapsed Icon Button 2: Assets and devices */
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => togglePanel('assets')}
                  aria-expanded={activePanel === 'assets'}
                  aria-controls="assets-and-devices-panel"
                  aria-label={`Assets and devices (${assetsCount})`}
                  className={`pointer-events-auto relative ${buttonSizeClass} rounded-xl border dark:border-[#2a323d] border-slate-200/90 dark:bg-[#141b23]/90 bg-white/90 backdrop-blur-md shadow-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95 transition-all duration-180 cursor-pointer ${
                    activePanel === 'assets' ? 'ring-2 ring-primary/50' : ''
                  }`}
                >
                  <Layers className={`${isTablet ? 'size-5' : 'size-4'} text-primary`} />
                  <span className="absolute -top-1.5 -right-2 min-w-[20px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold font-mono flex items-center justify-center shadow-md border-2 dark:border-[#141b23] border-white">
                    {assetsCount}
                  </span>
                </button>
              }
            />
            <TooltipContent side="left" className="text-xs font-medium">
              Assets and devices ({assetsCount})
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Portrait Tablet Drawer Mode for Active Panel */}
      {isTabletPortrait && activePanel === 'attention' && (
        <Sheet open={true} onOpenChange={(open) => { if (!open) setActivePanel(null); }}>
          <SheetContent side="bottom" className="p-0 max-h-[75vh] flex flex-col rounded-t-2xl overflow-hidden border-t dark:border-[#2a323d] border-slate-200 shadow-2xl">
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 mx-auto my-2.5 shrink-0" />
            <div className="flex-1 overflow-y-auto min-h-0">
              {renderAttentionPanel ? (
                renderAttentionPanel()
              ) : (
                <NeedsAttentionPanel onClose={() => setActivePanel(null)} />
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {isTabletPortrait && activePanel === 'assets' && (
        <Sheet open={true} onOpenChange={(open) => { if (!open) setActivePanel(null); }}>
          <SheetContent side="bottom" className="p-0 max-h-[75vh] flex flex-col rounded-t-2xl overflow-hidden border-t dark:border-[#2a323d] border-slate-200 shadow-2xl">
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 mx-auto my-2.5 shrink-0" />
            <div className="flex-1 overflow-y-auto min-h-0">
              {renderAssetsPanel ? (
                renderAssetsPanel()
              ) : (
                <AssetsAndDevicesPanel onClose={() => setActivePanel(null)} />
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};

