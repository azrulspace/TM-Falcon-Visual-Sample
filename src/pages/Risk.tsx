import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StatusBadge, EmptyState } from '../components/Shared';
import { segments } from '../data/segments';
import { Button } from '@/components/ui/button';
import { Search, Plus, Minus, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useUiMode } from '@/contexts/UiModeContext';
import { cn } from '@/lib/utils';
import { RiskPageHeader } from '@/components/risk/RiskPageHeader';
import { RiskKpiStrip, type RiskKpiKey } from '@/components/risk/RiskKpiStrip';
import { RiskToolbar } from '@/components/risk/RiskToolbar';
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

  const [currentTab, setCurrentTab] = useState<'map' | 'list'>(initialTab);
  const [sortKey, setSortKey] = useState<RiskSortKey>(initialSort);
  const [activeKpi, setActiveKpi] = useState<RiskKpiKey | null>(initialKpi);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(initialSegment);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    return Array.from(new Set(segments.map((s) => s.route))).sort();
  }, []);

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
    return filterRiskSegments(segments, filters);
  }, [filters]);

  const sortedSegments = useMemo(() => {
    return sortRiskSegments(filteredSegments, sortKey);
  }, [filteredSegments, sortKey]);

  const statusCounts = useMemo(() => {
    return getRiskStatusCounts(segments);
  }, []);

  // Reset page when filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortKey]);

  // Paginated segments for ranked list view
  const totalPages = Math.ceil(sortedSegments.length / itemsPerPage);
  const paginatedSegments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedSegments.slice(start, start + itemsPerPage);
  }, [sortedSegments, currentPage, itemsPerPage]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleExport = () => {
    exportRiskSegmentsToCsv(sortedSegments);
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'High') return 'var(--bg_error_solid)';
    if (priority === 'Medium') return 'var(--bg_warning_solid)';
    return 'var(--bg_info_solid)';
  };

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
          <div className="flex-1 relative group overflow-auto" style={{ backgroundColor: 'var(--bg_map)' }}>
            {currentTab === 'map' ? (
              <>
                <svg viewBox="0 0 1000 700" className="w-full h-full object-cover min-h-[500px]">
                  {/* Background */}
                  <rect width="1000" height="700" fill="var(--bg_map)" />
                  <path d="M-50 750 Q 200 600 300 750 Z" fill="var(--bg_success_primary)" opacity="0.5" />

                  {/* Blocks */}
                  <rect x="50" y="50" width="300" height="200" rx="20" fill="var(--map_block)" />
                  <rect x="400" y="50" width="550" height="200" rx="20" fill="var(--map_block)" />
                  <rect x="50" y="300" width="300" height="350" rx="20" fill="var(--map_block)" />
                  <rect x="400" y="300" width="250" height="350" rx="20" fill="var(--map_block)" />
                  <rect x="700" y="300" width="250" height="350" rx="20" fill="var(--map_block)" />

                  <path
                    d="M 375 0 L 375 700 M 0 275 L 1000 275 M 675 275 L 675 700"
                    stroke="var(--map_road)"
                    strokeWidth="50"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 50 650 L 350 400 M 450 650 L 650 400"
                    stroke="var(--map_road)"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />

                  {/* Segments */}
                  {sortedSegments.map((s) => {
                    const isSelected = selectedSegmentId === s.id;
                    const midPoint = s.path[Math.floor(s.path.length / 2)] || [500, 350];

                    return (
                      <g key={s.id} onClick={() => setSelectedSegmentId(s.id)} className="cursor-pointer">
                        {isSelected && (
                          <polyline
                            points={s.path.map((p: number[]) => p.join(',')).join(' ')}
                            fill="none"
                            stroke="var(--border_brand)"
                            strokeWidth="16"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.3"
                          />
                        )}
                        <polyline
                          points={s.path.map((p: number[]) => p.join(',')).join(' ')}
                          fill="none"
                          stroke={getPriorityColor(s.priority)}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <g transform={`translate(${midPoint[0]}, ${midPoint[1]})`}>
                          <rect
                            x="-24"
                            y="-10"
                            width="48"
                            height="20"
                            rx="10"
                            fill="var(--bg_primary)"
                            stroke="var(--border_secondary)"
                          />
                          <text
                            y="4"
                            textAnchor="middle"
                            fill="var(--text_primary)"
                            fontSize="10"
                            fontWeight="600"
                          >
                            {s.id}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Map Controls */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col bg-elevated rounded-[8px] shadow-sm border border-secondary overflow-hidden">
                  <button
                    className={cn(
                      'text-secondary hover:bg-secondary hover:text-primary transition-colors border-b border-secondary flex items-center justify-center',
                      isTablet ? 'size-11 min-w-[44px] min-h-[44px]' : 'p-2'
                    )}
                    aria-label="Zoom in"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    className={cn(
                      'text-secondary hover:bg-secondary hover:text-primary transition-colors border-b border-secondary flex items-center justify-center',
                      isTablet ? 'size-11 min-w-[44px] min-h-[44px]' : 'p-2'
                    )}
                    aria-label="Zoom out"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>

                <div className="absolute bottom-4 left-4 bg-elevated border border-secondary rounded-[10px] p-3 shadow-md flex flex-col gap-2 text_xs text-secondary">
                  <div className="font-semibold mb-1">Priority</div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2 rounded-full bg-error-solid"></div> High
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2 rounded-full bg-warning-solid"></div> Medium
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2 rounded-full bg-info-solid"></div> Low
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col h-full">
                <div className="app_table_container flex-1 bg-primary overflow-x-auto">
                  <table className="app_table w-full min-w-[900px]">
                    <thead className="border-b border-secondary">
                      <tr>
                        <th>RANK</th>
                        <th>SEGMENT</th>
                        <th>ROUTE</th>
                        <th>SPAN</th>
                        <th>PRIORITY</th>
                        <th>CONFIDENCE</th>
                        <th>BASIS</th>
                        <th>SUGGESTED ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSegments.length === 0 ? (
                        <tr>
                          <td colSpan={8}>
                            <EmptyState
                              icon={Search}
                              title="No segments found"
                              description="Try adjusting your search or filters"
                            />
                          </td>
                        </tr>
                      ) : (
                        paginatedSegments.map((s, idx) => (
                          <tr key={s.id}>
                            <td className="text-tertiary font-medium">
                              {(currentPage - 1) * itemsPerPage + idx + 1}
                            </td>
                            <td>
                              <span className="font-mono text-brand whitespace-nowrap">{s.id}</span>
                            </td>
                            <td className="whitespace-nowrap">{s.route}</td>
                            <td className="whitespace-nowrap text-tertiary">
                              {s.from} to {s.to}
                            </td>
                            <td>
                              <StatusBadge kind="priority" value={s.priority} />
                            </td>
                            <td>{s.confidence}</td>
                            <td className="text-tertiary">{s.basis}</td>
                            <td>
                              <span className="badge badge_neutral">{s.action}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {sortedSegments.length > 0 && (
                  <div className="p-4 border-t border-secondary flex items-center justify-between bg-primary rounded-b-[16px]">
                    <div className="text_sm text-secondary">
                      Showing{' '}
                      <span className="font-medium text-primary">
                        {(currentPage - 1) * itemsPerPage + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium text-primary">
                        {Math.min(currentPage * itemsPerPage, sortedSegments.length)}
                      </span>{' '}
                      of <span className="font-medium text-primary">{sortedSegments.length}</span> segments
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text_sm text-secondary">
                        Rows per page
                        <div className="relative h-8 bg-transparent border-transparent hover:bg-secondary transition-colors cursor-pointer rounded-[8px] flex items-center">
                          <select
                            className="h-full pl-2 pr-8 bg-transparent font-medium text-primary cursor-pointer outline-none appearance-none"
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                          </select>
                          <ChevronDown className="absolute right-1 w-4 h-4 text-secondary pointer-events-none" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            'p-0 flex items-center justify-center rounded-[8px]',
                            isTablet ? 'size-11 min-w-[44px] min-h-[44px]' : 'w-8 h-8'
                          )}
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div
                          className={cn(
                            'font-medium text-center tabular-nums',
                            isTablet ? 'text-sm w-10' : 'text_sm w-8'
                          )}
                        >
                          {currentPage}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            'p-0 flex items-center justify-center rounded-[8px]',
                            isTablet ? 'size-11 min-w-[44px] min-h-[44px]' : 'w-8 h-8'
                          )}
                          disabled={currentPage === totalPages || totalPages === 0}
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {currentTab === 'map' && (
          <div className="xl:col-span-4 app_card p-0 flex flex-col h-[640px] overflow-hidden">
            <div className="p-4 border-b border-secondary bg-elevated z-10">
              <div className="flex items-center gap-2 mb-1">
                <h5 className="h6">Segments to inspect</h5>
                <span className="badge badge_brand">{sortedSegments.length}</span>
              </div>
              <p className="text_xs text-tertiary">
                Most urgent first based on priority and span confidence.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {sortedSegments.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="No segments found"
                  description="Try adjusting your filters"
                />
              ) : (
                sortedSegments.map((s) => {
                  const isSelected = selectedSegmentId === s.id;
                  const confidenceBars =
                    s.confidence === 'High' ? 3 : s.confidence === 'Medium' ? 2 : 1;

                  return (
                    <div
                      key={s.id}
                      className={`border rounded-xl p-4 cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-brand ring-1 ring-primary/40 bg-secondary'
                          : 'bg-primary border-secondary hover:bg-secondary'
                      }`}
                      onClick={() => setSelectedSegmentId(s.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold uppercase tracking-wider text-[10px] text-tertiary">
                          SEGMENT
                        </span>
                        <span className="font-mono text_xs text-brand">{s.id}</span>
                      </div>
                      <div className="text_sm font-semibold text-primary mb-2">
                        {s.from} to {s.to}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <StatusBadge kind="priority" value={s.priority} />
                        <span className="badge badge_neutral">{s.route}</span>
                      </div>
                      <div className="text_xs text-secondary flex flex-col gap-1">
                        <div>
                          <span className="font-semibold text-primary">Basis:</span> {s.basis}
                        </div>
                        <div className="inline-flex items-center gap-2 mt-0.5">
                          <span className="font-semibold text-primary">Confidence:</span>
                          <span className="text-secondary">{s.confidence}</span>
                          <div className="flex gap-1 items-center">
                            {[1, 2, 3].map((bar) => {
                              const isActive = bar <= confidenceBars;
                              let colorClass = 'bg-slate-200 dark:bg-slate-700';
                              if (isActive) {
                                if (s.confidence === 'High') colorClass = 'bg-emerald-600';
                                else if (s.confidence === 'Medium') colorClass = 'bg-amber-500';
                                else colorClass = 'bg-rose-500';
                              }
                              return (
                                <div
                                  key={bar}
                                  className={`h-[6px] w-[14px] rounded-full transition-colors ${colorClass}`}
                                ></div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 pt-3 border-t border-secondary">
                        <Button
                          variant="secondary"
                          size="sm"
                          className={cn('flex-1', isTablet ? 'h-11 text-sm' : '')}
                        >
                          Investigate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn('flex-1', isTablet ? 'h-11 text-sm' : '')}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
