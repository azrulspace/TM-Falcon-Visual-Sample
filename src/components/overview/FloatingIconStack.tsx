import React, { useEffect } from 'react';
import { AlertTriangle, Layers, ChevronUp } from 'lucide-react';
import { useOverview } from '@/contexts/OverviewContext';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { IncidentsPanel } from '@/components/overview/IncidentsPanel';

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
    selectedId,
    selectEntity,
  } = useOverview();

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

  return (
    <div
      className={`pointer-events-none flex flex-col items-end gap-3 z-30 ${className}`}
      data-testid="floating-icon-stack"
    >
      {/* ================= SLOT 1: Needs Attention ================= */}
      {activePanel === 'attention' ? (
        <div className="pointer-events-auto w-[300px] flex flex-col animate-in fade-in-50 zoom-in-95 duration-180 motion-reduce:duration-0 shadow-2xl rounded-xl overflow-hidden border dark:border-[#222b38] border-slate-200 dark:bg-[#141b23]/95 bg-white/95 backdrop-blur-md">
          {renderAttentionPanel ? (
            renderAttentionPanel()
          ) : (
            <div className="flex flex-col max-h-[calc(100vh-240px)]">
              {/* Header with collapse chevron */}
              <div className="flex items-center justify-between h-[42px] px-3.5 border-b dark:border-[#222b38] border-slate-200 shrink-0 bg-slate-50/50 dark:bg-black/20">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground tracking-tight">
                    Needs attention
                  </span>
                  {attentionCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-[#e33f50] text-white">
                      {attentionCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setActivePanel(null)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  aria-label="Collapse Needs attention panel"
                  title="Collapse panel"
                >
                  <ChevronUp className="size-4" />
                </button>
              </div>

              {/* Incidents / Attention List */}
              <div className="flex-1 overflow-y-auto no-scrollbar">
                <IncidentsPanel
                  selectedId={selectedId}
                  onSelectItem={(id) => {
                    selectEntity('device', id, { fly: true, source: 'panel' });
                  }}
                />
              </div>
            </div>
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
                aria-expanded={false}
                aria-controls="needs-attention-panel"
                aria-label={`Needs attention (${attentionCount})`}
                className="pointer-events-auto relative size-10 rounded-xl border dark:border-[#2a323d] border-slate-200/90 dark:bg-[#141b23]/90 bg-white/90 backdrop-blur-md shadow-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95 transition-all duration-180 cursor-pointer"
              >
                <AlertTriangle className="size-4 text-amber-500 dark:text-amber-400" />
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
      {activePanel === 'assets' ? (
        <div className="pointer-events-auto w-[300px] flex flex-col animate-in fade-in-50 zoom-in-95 duration-180 motion-reduce:duration-0 shadow-2xl rounded-xl overflow-hidden border dark:border-[#222b38] border-slate-200 dark:bg-[#141b23]/95 bg-white/95 backdrop-blur-md">
          {renderAssetsPanel ? (
            renderAssetsPanel()
          ) : (
            <div className="flex flex-col max-h-[calc(100vh-240px)]">
              {/* Header with collapse chevron */}
              <div className="flex items-center justify-between h-[42px] px-3.5 border-b dark:border-[#222b38] border-slate-200 shrink-0 bg-slate-50/50 dark:bg-black/20">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground tracking-tight">
                    Assets and devices
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-primary text-primary-foreground">
                    {assetsCount}
                  </span>
                </div>
                <button
                  onClick={() => setActivePanel(null)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  aria-label="Collapse Assets and devices panel"
                  title="Collapse panel"
                >
                  <ChevronUp className="size-4" />
                </button>
              </div>

              {/* Placeholder until Phase 3 virtualized list */}
              <div className="p-4 text-xs text-muted-foreground space-y-2">
                <p>120 Poles • 114 Cable spans • 4 Devices</p>
                <p className="text-[11px] text-muted-foreground/80">
                  Records without coordinates appear here only.
                </p>
              </div>
            </div>
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
                aria-expanded={false}
                aria-controls="assets-and-devices-panel"
                aria-label={`Assets and devices (${assetsCount})`}
                className="pointer-events-auto relative size-10 rounded-xl border dark:border-[#2a323d] border-slate-200/90 dark:bg-[#141b23]/90 bg-white/90 backdrop-blur-md shadow-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95 transition-all duration-180 cursor-pointer"
              >
                <Layers className="size-4 text-primary" />
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
  );
};
