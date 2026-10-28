import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { segments } from '../data/segments';
import { useUiMode } from '@/contexts/UiModeContext';
import { cn, formatId } from '@/lib/utils';
import { RiskPageHeader } from '@/components/risk/RiskPageHeader';
import { RiskKpiStrip, type RiskKpiKey } from '@/components/risk/RiskKpiStrip';
import { RiskToolbar } from '@/components/risk/RiskToolbar';
import { RiskMapCard } from '@/components/risk/RiskMapCard';
import { RiskSegmentsColumn } from '@/components/risk/RiskSegmentsColumn';
import { RiskTableView } from '@/components/risk/RiskTableView';
import { RiskBulkActionBar } from '@/components/risk/RiskBulkActionBar';
import { Layers, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SegmentDetailContent } from '@/components/risk/SegmentDetailContent';
import { SegmentDetailSheet } from '@/components/risk/SegmentDetailSheet';
import { DismissSegmentDialog } from '@/components/risk/DismissSegmentDialog';
import { useToast } from '@/contexts/ToastContext';
import {
  filterRiskSegments,
  sortRiskSegments,
  getRiskStatusCounts,
  exportRiskSegmentsToCsv,
} from '@/data/riskSelectors';
import type {
  RiskFilterState,
  RiskSortKey,
  RiskPriority,
  RiskConfidence,
  SegmentStatus,
  RiskSegment,
} from '@/types/risk';

export default function Risk() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isTablet, orientation } = useUiMode();
  const isPortrait = isTablet && orientation === 'portrait';

  // Read initial states from URL query parameters (Section 5.4)
  const initialTab = (searchParams.get('view')?.toLowerCase() === 'list' ? 'list' : 'map') as
    | 'map'
    | 'list';
  const initialSort = (searchParams.get('sort') || 'urgent') as RiskSortKey;
  const initialKpi = (searchParams.get('kpi') as RiskKpiKey) || null;
  const initialSegment = searchParams.get('segment') || null;

  const { addToast } = useToast();
  const [segmentList, setSegmentList] = useState<RiskSegment[]>(segments);
  const [currentTab, setCurrentTab] = useState<'map' | 'list'>(initialTab);
  const [sortKey, setSortKey] = useState<RiskSortKey>(initialSort);
  const [activeKpi, setActiveKpi] = useState<RiskKpiKey | null>(initialKpi);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(initialSegment);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [segmentsDrawerOpen, setSegmentsDrawerOpen] = useState(false);

  // Pagination for ranked list view
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter state
  const [filters, setFilters] = useState<RiskFilterState>(() => {
    const q = searchParams.get('q') || undefined;
    const p = searchParams.get('priority')?.split(',').filter(Boolean) as RiskPriority[] | undefined;
    const r = searchParams.get('route')?.split(',').filter(Boolean);
    const c = searchParams.get('confidence')?.split(',').filter(Boolean) as RiskConfidence[] | undefined;
    const s = searchParams.get('status')?.split(',').filter(Boolean) as SegmentStatus[] | undefined;
    return {
      tab: 'to_inspect',
      search: q,
      priority: p && p.length > 0 ? p : undefined,
      route: r && r.length > 0 ? r : undefined,
      confidence: c && c.length > 0 ? c : undefined,
      status: s && s.length > 0 ? s : undefined,
    };
  });

  // Extract available routes dynamically from the segments data
  const availableRoutes = useMemo(() => {
    return Array.from(new Set(segmentList.map((s) => s.route))).sort();
  }, [segmentList]);

  // Synchronize URL query params whenever state changes
  useEffect(() => {
    const params: Record<string, string> = {};
    if (currentTab !== 'map') params.view = currentTab;
    if (filters.search) params.q = filters.search;
    if (filters.priority?.length) params.priority = filters.priority.join(',');
    if (filters.route?.length) params.route = filters.route.join(',');
    if (filters.confidence?.length) params.confidence = filters.confidence.join(',');
    if (filters.status?.length) params.status = filters.status.join(',');
    if (sortKey !== 'urgent') params.sort = sortKey;
    if (activeKpi) params.kpi = activeKpi;
    if (selectedSegmentId) params.segment = selectedSegmentId;

    setSearchParams(params, { replace: true });
  }, [currentTab, filters, sortKey, activeKpi, selectedSegmentId, setSearchParams]);

  // Handle KPI Strip Quick Filter click (Section 5.3)
  const handleSelectKpi = useCallback((key: RiskKpiKey | null) => {
    setActiveKpi(key);
    if (!key) {
      setFilters((prev) => ({
        ...prev,
        priority: undefined,
        confidence: undefined,
        status: undefined,
      }));
      return;
    }

    if (key === 'to_inspect') {
      setFilters((prev) => ({
        ...prev,
        priority: undefined,
        confidence: undefined,
        status: ['to_inspect'],
      }));
    } else if (key === 'high_priority') {
      setFilters((prev) => ({
        ...prev,
        priority: ['High'],
      }));
    } else if (key === 'medium_priority') {
      setFilters((prev) => ({
        ...prev,
        priority: ['Medium'],
      }));
    } else if (key === 'low_priority') {
      setFilters((prev) => ({
        ...prev,
        priority: ['Low'],
      }));
    } else if (key === 'low_confidence') {
      setFilters((prev) => ({
        ...prev,
        confidence: ['Low'],
      }));
    }
  }, []);

  const handleClearKpi = useCallback(() => {
    setActiveKpi(null);
  }, []);

  // Filter and sort segments
  const filteredSegments = useMemo(() => {
    return filterRiskSegments(segmentList, filters);
  }, [segmentList, filters]);

  const sortedSegments = useMemo(() => {
    return sortRiskSegments(filteredSegments, sortKey);
  }, [filteredSegments, sortKey]);

  const statusCounts = useMemo(() => {
    return getRiskStatusCounts(segmentList);
  }, [segmentList]);

  // Reset page when filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortKey]);

  // Selection state for Ranked list tab bulk operations (Section 5.10)
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<Set<string>>(new Set());

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedSegmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(
    (select: boolean) => {
      if (!select) {
        setSelectedSegmentIds(new Set());
      } else {
        const start = (currentPage - 1) * itemsPerPage;
        const pageItems = sortedSegments.slice(start, start + itemsPerPage);
        setSelectedSegmentIds((prev) => {
          const next = new Set(prev);
          pageItems.forEach((s) => next.add(s.id));
          return next;
        });
      }
    },
    [currentPage, itemsPerPage, sortedSegments]
  );

  const handleClearSelection = useCallback(() => {
    setSelectedSegmentIds(new Set());
  }, []);

  const handleExportSelected = useCallback(() => {
    const selectedSegments = segmentList.filter((s) => selectedSegmentIds.has(s.id));
    exportRiskSegmentsToCsv(selectedSegments);
    addToast('success', `Exported ${selectedSegments.length} selected risk segments to CSV.`);
  }, [segmentList, selectedSegmentIds, addToast]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      addToast('info', 'Risk ranking updated with latest incident history.', 'Data Refreshed');
    }, 600);
  };

  const handleExport = () => {
    exportRiskSegmentsToCsv(sortedSegments);
    addToast('success', `Exported ${sortedSegments.length} risk segments to CSV.`);
  };

  const [dismissTarget, setDismissTarget] = useState<RiskSegment | null>(null);
  const [dismissDialogOpen, setDismissDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [detailSheetSegment, setDetailSheetSegment] = useState<RiskSegment | null>(null);

  // Investigate action (Section 5.8: Optimistic update with work order creation)
  const handleInvestigate = useCallback(
    (seg: RiskSegment) => {
      setSegmentList((prev) =>
        prev.map((s) => (s.id === seg.id ? { ...s, status: 'investigating' } : s))
      );
      addToast(
        'success',
        `Investigation work item created for ${formatId(seg.id)} (${seg.from} to ${seg.to}).`,
        'Work Item Created'
      );
    },
    [addToast]
  );

  // Open dismiss dialog (Section 5.8)
  const openDismissDialog = useCallback((seg: RiskSegment) => {
    setDismissTarget(seg);
    setDismissDialogOpen(true);
  }, []);

  // Confirm dismiss with reason and optional note
  const handleConfirmDismiss = useCallback(
    (seg: RiskSegment, reason: string, note?: string) => {
      setSegmentList((prev) =>
        prev.map((s) =>
          s.id === seg.id
            ? {
                ...s,
                status: 'dismissed',
                dismissReason: reason,
                dismissNote: note,
                dismissedAt:
                  new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }) + ' MYT',
              }
            : s
        )
      );
      addToast(
        'info',
        `Segment ${formatId(seg.id)} dismissed (${reason}).`,
        'Segment Dismissed'
      );
    },
    [addToast]
  );

  const handleOpenDetailSheet = useCallback((seg: RiskSegment) => {
    setDetailSheetSegment(seg);
    setDetailSheetOpen(true);
  }, []);

  const handleShowOnMap = useCallback((seg: RiskSegment) => {
    setCurrentTab('map');
    setSelectedSegmentId(seg.id);
  }, []);

  return (
    <div className="p-4 sm:p-6 flex flex-col h-full overflow-y-auto">
      {/* 5.2 Page Header */}
      <RiskPageHeader
        filteredSegments={sortedSegments}
        ruleVersion="Rule v1"
        computedAtMYT="10:30 PM MYT"
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />

      {/* 5.3 KPI Strip */}
      <RiskKpiStrip
        segments={segments}
        activeKpi={activeKpi}
        onSelectKpi={handleSelectKpi}
        isLoading={isRefreshing}
      />

      {/* 5.4 View Tabs & 5.5 Shared Toolbar */}
      <RiskToolbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        filters={filters}
        onFilterChange={setFilters}
        sortKey={sortKey}
        onSortChange={setSortKey}
        activeKpi={activeKpi}
        onClearKpi={handleClearKpi}
        availableRoutes={availableRoutes}
        totalSegmentsCount={segments.length}
        filteredCount={sortedSegments.length}
        statusCounts={statusCounts}
      />

      {/* Main Content Areas */}
      <div className={cn('gap-6', isPortrait ? 'flex flex-col' : 'grid grid-cols-1 xl:grid-cols-12')}>
        <div
          className={cn(
            currentTab === 'map'
              ? isPortrait
                ? 'w-full h-[520px]'
                : 'xl:col-span-8 h-[640px]'
              : 'w-full xl:col-span-12 h-auto',
            'app_card p-0 flex flex-col overflow-hidden relative'
          )}
        >
          {currentTab === 'map' ? (
            <div className="relative w-full h-full">
              {/* Tablet / Collapsible Segments Button (Section 7) */}
              <div className="absolute top-3 left-3 z-20 xl:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSegmentsDrawerOpen(true)}
                  className="bg-card/90 dark:bg-card/95 backdrop-blur-md border border-border shadow-md gap-2 h-9 px-3 rounded-xl font-medium text-xs text-foreground cursor-pointer"
                >
                  <Layers className="size-4 text-primary" />
                  <span>Segments</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                    {sortedSegments.length}
                  </span>
                </Button>
              </div>

              <RiskMapCard
                segments={sortedSegments}
                selectedSegmentId={selectedSegmentId}
                onSelectSegment={setSelectedSegmentId}
                onInvestigate={handleInvestigate}
                onDismiss={openDismissDialog}
                renderPopup={(segment, onClose) => (
                  <div className="w-[360px] sm:w-[420px] max-h-[540px] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col">
                    <SegmentDetailContent
                      segment={segment}
                      onClose={onClose}
                      onInvestigate={handleInvestigate}
                      onDismiss={openDismissDialog}
                    />
                  </div>
                )}
              />
            </div>
          ) : (
            <RiskTableView
              segments={sortedSegments}
              selectedSegmentIds={selectedSegmentIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onRowClick={handleOpenDetailSheet}
              onInvestigate={handleInvestigate}
              onDismiss={openDismissDialog}
              onShowOnMap={handleShowOnMap}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              sortKey={sortKey}
              onSortChange={setSortKey}
            />
          )}
        </div>

        {currentTab === 'map' && (
          <div className="hidden xl:block xl:col-span-4 h-[640px] overflow-hidden">
            <RiskSegmentsColumn
              segments={sortedSegments}
              selectedSegmentId={selectedSegmentId}
              onSelectSegment={setSelectedSegmentId}
              onInvestigate={handleInvestigate}
              onDismiss={openDismissDialog}
              isLoading={isRefreshing}
            />
          </div>
        )}
      </div>

      {/* 7. Tablet / Mobile Bottom Drawer for Segments to inspect (Section 7) */}
      <Sheet open={segmentsDrawerOpen} onOpenChange={setSegmentsDrawerOpen}>
        <SheetContent
          side="bottom"
          className="h-[80vh] p-0 rounded-t-3xl border-t border-border bg-card shadow-2xl flex flex-col z-50"
        >
          <div className="p-3 border-b border-border flex items-center justify-between px-4 bg-muted/40">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                Segments to inspect
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                {sortedSegments.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSegmentsDrawerOpen(false)}
              className="size-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden p-2">
            <RiskSegmentsColumn
              segments={sortedSegments}
              selectedSegmentId={selectedSegmentId}
              onSelectSegment={(id) => {
                setSelectedSegmentId(id);
                setSegmentsDrawerOpen(false);
              }}
              onInvestigate={handleInvestigate}
              onDismiss={openDismissDialog}
              isLoading={isRefreshing}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* 5.10 Bulk Actions Bar (when rows are selected on ranked list view) */}
      {currentTab === 'list' && (
        <RiskBulkActionBar
          selectedCount={selectedSegmentIds.size}
          totalCount={sortedSegments.length}
          onExportSelected={handleExportSelected}
          onClear={handleClearSelection}
        />
      )}

      {/* 5.8 Dismiss Segment Dialog with reason flow */}
      <DismissSegmentDialog
        open={dismissDialogOpen}
        onOpenChange={setDismissDialogOpen}
        segment={dismissTarget}
        onConfirm={handleConfirmDismiss}
      />

      {/* 5.8 Segment Detail Right Sheet */}
      <SegmentDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        segment={detailSheetSegment}
        onInvestigate={handleInvestigate}
        onDismiss={openDismissDialog}
        onShowOnMap={handleShowOnMap}
      />
    </div>
  );
}
