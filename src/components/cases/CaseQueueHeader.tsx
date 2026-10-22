import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOverview } from '@/contexts/OverviewContext';
import { useCases } from '@/contexts/CasesContext';
import { useToast } from '@/contexts/ToastContext';
import type { CaseWithSourceEvent } from '@/types/cases';
import { exportCasesToCsv } from '@/data/caseSelectors';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface CaseQueueHeaderProps {
  filteredCases: CaseWithSourceEvent[];
}

export const CaseQueueHeader: React.FC<CaseQueueHeaderProps> = ({ filteredCases }) => {
  const overview = useOverview();
  const { refreshCases, isRefreshing, lastFetchedAt } = useCases();
  const { addToast } = useToast();

  const [tick, setTick] = useState(0);

  // 15-second heartbeat timer for accurate live age recalculation
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Compute live badge status & text adhering strictly to Section 6.1
  const { liveStatus, badgeText } = useMemo(() => {
    void tick;

    if (overview.liveState === 'paused') {
      return {
        liveStatus: 'paused' as const,
        badgeText: 'Paused • Telemetry paused',
      };
    }

    const intervalSec = overview.refreshInterval || 15;
    const now = Date.now();
    const fetchTime = lastFetchedAt.getTime();
    const ageSec = Math.max(0, Math.floor((now - fetchTime) / 1000));
    const isStale = ageSec > 2 * intervalSec;

    let ageText = 'just now';
    if (ageSec >= 60) {
      const minutes = Math.floor(ageSec / 60);
      ageText = `${minutes} min ago`;
    } else if (ageSec > 10) {
      ageText = `${ageSec}s ago`;
    }

    if (isStale) {
      return {
        liveStatus: 'stale' as const,
        badgeText: `Stale • Updated ${ageText}`,
      };
    }

    return {
      liveStatus: 'live' as const,
      badgeText: `Live • Updated just now`,
    };
  }, [overview.liveState, overview.refreshInterval, lastFetchedAt, tick]);

  const handleRefresh = useCallback(async () => {
    try {
      await refreshCases();
    } catch {
      addToast('error', 'Failed to refresh case queue. Please retry.');
    }
  }, [refreshCases, addToast]);

  const handleExport = useCallback(() => {
    if (!filteredCases || filteredCases.length === 0) {
      addToast('info', 'No cases to export for current filter criteria.');
      return;
    }
    try {
      const csvContent = exportCasesToCsv(filteredCases);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `falcon_cases_export_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast('success', `Exported ${filteredCases.length} cases to CSV.`);
    } catch {
      addToast('error', 'Failed to export CSV. Please retry.');
    }
  }, [filteredCases, addToast]);

  const isExportDisabled = !filteredCases || filteredCases.length === 0;

  return (
    <div className="flex flex-col gap-2 mb-4 select-none">
      {/* Breadcrumb matching section 6.1: "Falcon / Cases" */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
        <span>Falcon</span>
        <span>/</span>
        <span className="text-foreground font-semibold">Cases</span>
      </nav>

      {/* Main Title Row & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Cases</h1>
            {/* Live Indicator matching section 6.1 */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/80 border border-border">
              <span className="relative flex size-2">
                {liveStatus === 'live' ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
                    <span className="relative inline-flex rounded-full size-2 bg-[#10b981]" />
                  </>
                ) : liveStatus === 'paused' ? (
                  <span className="relative inline-flex rounded-full size-2 bg-[#ffa114]" />
                ) : (
                  <span className="relative inline-flex rounded-full size-2 bg-[#ef4444]" />
                )}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">
                {badgeText}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Follow-up work raised from events. Open a case to verify, record field findings and decide closure.
          </p>
        </div>

        {/* Right Actions: Refresh and Export */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 px-3 text-xs gap-1.5 border-border hover:bg-muted font-medium"
            title="Refresh case queue"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
            <span>Refresh</span>
          </Button>

          {isExportDisabled ? (
            <Tooltip>
              <TooltipTrigger>
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="h-8 px-3 text-xs gap-1.5 border-border opacity-50 cursor-not-allowed font-medium"
                  >
                    <Download className="size-3.5 text-muted-foreground" />
                    <span>Export</span>
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Not available yet (no cases to export)
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="h-8 px-3 text-xs gap-1.5 border-border hover:bg-muted font-medium"
              title="Export filtered cases as CSV"
            >
              <Download className="size-3.5 text-muted-foreground" />
              <span>Export</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
