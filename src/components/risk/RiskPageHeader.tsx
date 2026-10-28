import React, { useState } from 'react';
import { Info, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HowRankingWorksSheet } from './HowRankingWorksSheet';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import type { RiskSegment } from '@/types/risk';
import { exportRiskSegmentsToCsv } from '@/data/riskSelectors';
import { useToast } from '@/contexts/ToastContext';

export interface RiskPageHeaderProps {
  filteredSegments: RiskSegment[];
  ruleVersion?: string;
  computedAtMYT?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
}

export const RiskPageHeader: React.FC<RiskPageHeaderProps> = ({
  filteredSegments,
  ruleVersion = 'Rule v1',
  computedAtMYT = '10:30 PM MYT',
  isRefreshing = false,
  onRefresh,
  onExport,
}) => {
  const [infoOpen, setInfoOpen] = useState(false);
  const { addToast } = useToast();

  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }
    if (filteredSegments.length === 0) {
      addToast('info', 'No risk segments to export for current filter criteria.');
      return;
    }
    try {
      exportRiskSegmentsToCsv(filteredSegments);
      addToast('success', `Exported ${filteredSegments.length} risk segments to CSV.`);
    } catch {
      addToast('error', 'Failed to export CSV. Please retry.');
    }
  };

  return (
    <div className="flex flex-col gap-2 mb-4 select-none">
      {/* 1. Breadcrumb navigation from navigation config (Section 5.2) */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium" aria-label="Breadcrumb">
        <span>Falcon</span>
        <span>/</span>
        <span>Risk & preventive</span>
        <span>/</span>
        <span className="text-foreground font-semibold">Risk overview</span>
      </nav>

      {/* 2. Main Title Row, Meta line, and Right Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left: Title + Info + Meta chips */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Risk overview
              </h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        onClick={() => setInfoOpen(true)}
                        className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label="How ranking works"
                      >
                        <Info className="size-4.5" />
                      </button>
                    }
                  />
                  <TooltipContent side="right" className="text-xs">
                    Click to learn how ranking is computed
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Meta chips next to title (Section 5.2) */}
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-muted text-foreground border border-border">
                {ruleVersion}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Computed at {computedAtMYT}
              </span>
              {/* Visible Sample data badge (Section 4 & 5.2) */}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                Sample data
              </span>
            </div>
          </div>

          {/* Subtitle - Exact copy preserved (Section 5.2) */}
          <p className="text-xs text-muted-foreground">
            Where to inspect or protect next, ranked by versioned rules on incident history.
          </p>
        </div>

        {/* Right: Header Actions (Refresh & Export) */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-9 px-3 gap-1.5 text-xs border-border bg-card hover:bg-muted font-medium cursor-pointer"
            aria-label="Refresh risk ranking"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-9 px-3 gap-1.5 text-xs border-border bg-card hover:bg-muted font-medium cursor-pointer"
            aria-label="Export ranked segments to CSV"
          >
            <Download className="size-3.5 text-muted-foreground" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Info Sheet Modal */}
      <HowRankingWorksSheet
        open={infoOpen}
        onOpenChange={setInfoOpen}
        ruleVersion={ruleVersion.replace(/Rule\s*/i, '')}
        computedAt={`Oct 27, 2026, ${computedAtMYT}`}
      />
    </div>
  );
};
