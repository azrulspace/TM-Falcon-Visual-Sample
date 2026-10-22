import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCases } from '@/contexts/CasesContext';
import { useEvents } from '@/contexts/EventsContext';
import { useToast } from '@/contexts/ToastContext';
import { CaseQueueHeader } from '@/components/cases/CaseQueueHeader';
import { CaseKpiStrip, type CaseKpiKey } from '@/components/cases/CaseKpiStrip';
import { CaseQueueToolbar } from '@/components/cases/CaseQueueToolbar';
import { CaseTableView } from '@/components/cases/CaseTableView';
import { CaseBulkActionBar } from '@/components/cases/CaseBulkActionBar';
import {
  filterCases,
  sortCases,
  getCaseStatusCounts,
  getCaseKpiCounts,
  exportCasesToCsv,
  type CaseFilterState,
  type CaseSortKey,
  type SortDirection,
} from '@/data/caseSelectors';
import { getServerNow } from '@/lib/dateTime';
import type { AssigneeType } from '@/types/cases';

export default function Cases() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { cases, bulkAssign, isRefreshing, refreshCases } = useCases();
  const { events } = useEvents();
  const { addToast } = useToast();
  const now = getServerNow();

  // 1. Parse Initial Filters from URL (Section 6.5)
  const [filters, setFilters] = useState<CaseFilterState>(() => ({
    tab: (searchParams.get('tab') as CaseFilterState['tab']) || 'all',
    search: searchParams.get('q') || undefined,
    assignee: searchParams.get('assignee') ? searchParams.get('assignee')!.split(',') : undefined,
    openOnly: searchParams.get('open_only') === 'true',
    status: searchParams.get('status') ? (searchParams.get('status')!.split(',') as any) : undefined,
    timeRange: searchParams.get('time') || undefined,
    priority: searchParams.get('priority') ? searchParams.get('priority')!.split(',') : undefined,
    type: searchParams.get('type') ? searchParams.get('type')!.split(',') : undefined,
  }));

  const [activeKpi, setActiveKpi] = useState<CaseKpiKey | null>(() => {
    return (searchParams.get('kpi') as CaseKpiKey) || null;
  });

  // Sorting state (Section 6.6)
  const [sortKey, setSortKey] = useState<CaseSortKey>(() => {
    return (searchParams.get('sort') as CaseSortKey) || 'created';
  });
  const [sortDir, setSortDir] = useState<SortDirection>(() => {
    return (searchParams.get('dir') as SortDirection) || 'desc';
  });

  // Pagination state (Section 6.6)
  const [currentPage, setCurrentPage] = useState<number>(() => {
    const p = parseInt(searchParams.get('page') || '1', 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });
  const [rowsPerPage, setRowsPerPage] = useState<number>(() => {
    const r = parseInt(searchParams.get('limit') || '25', 10);
    return [25, 50, 100].includes(r) ? r : 25;
  });

  // Selection state (Section 6.6)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 2. Sync filters, sort, page, and limit to URL query string
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.tab && filters.tab !== 'all') params.set('tab', filters.tab);
    if (filters.search) params.set('q', filters.search);
    if (filters.openOnly) params.set('open_only', 'true');
    if (filters.assignee) {
      const a = Array.isArray(filters.assignee) ? filters.assignee.join(',') : filters.assignee;
      if (a) params.set('assignee', a);
    }
    if (filters.status) {
      const s = Array.isArray(filters.status) ? filters.status.join(',') : filters.status;
      if (s) params.set('status', s);
    }
    if (filters.timeRange) params.set('time', filters.timeRange);
    if (filters.priority) {
      const p = Array.isArray(filters.priority) ? filters.priority.join(',') : filters.priority;
      if (p) params.set('priority', p);
    }
    if (filters.type) {
      const t = Array.isArray(filters.type) ? filters.type.join(',') : filters.type;
      if (t) params.set('type', t);
    }
    if (activeKpi) params.set('kpi', activeKpi);

    if (sortKey !== 'created') params.set('sort', sortKey);
    if (sortDir !== 'desc') params.set('dir', sortDir);
    if (currentPage > 1) params.set('page', String(currentPage));
    if (rowsPerPage !== 25) params.set('limit', String(rowsPerPage));

    setSearchParams(params, { replace: true });

    // Store in sessionStorage for Case detail back navigation (Section 7.1)
    const fullUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
    sessionStorage.setItem('last_cases_url', fullUrl);
  }, [filters, activeKpi, sortKey, sortDir, currentPage, rowsPerPage, setSearchParams]);

  // Reset page to 1 when filters change
  const handleSetFilters: React.Dispatch<React.SetStateAction<CaseFilterState>> = useCallback(
    (action) => {
      setFilters(action);
      setCurrentPage(1);
    },
    []
  );

  // Faceted Status counts and KPI strip counts computed from real data
  const statusCounts = useMemo(() => {
    return getCaseStatusCounts(cases, filters, events);
  }, [cases, filters, events]);

  const kpis = useMemo(() => {
    return getCaseKpiCounts(cases);
  }, [cases]);

  // Filtered cases with joined events
  const filteredCases = useMemo(() => {
    return filterCases(cases, filters, events);
  }, [cases, filters, events]);

  // Sorted cases
  const sortedCases = useMemo(() => {
    return sortCases(filteredCases, sortKey, sortDir, now);
  }, [filteredCases, sortKey, sortDir, now]);

  // Handle Sort Toggle
  const handleSort = useCallback(
    (key: CaseSortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir(key === 'created' || key === 'age' ? 'desc' : 'asc');
      }
      setCurrentPage(1);
    },
    [sortKey]
  );

  // Handle Selection
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAllPage = useCallback((all: boolean, pageIds: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (all) {
        pageIds.forEach((id) => next.add(id));
      } else {
        pageIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  }, []);

  const handleSelectAllResults = useCallback(() => {
    const allIds = filteredCases.map((c) => c.id);
    setSelectedIds(new Set(allIds));
    addToast('info', `Selected all ${allIds.length} cases`);
  }, [filteredCases, addToast]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Bulk Actions
  const handleBulkAssign = useCallback(
    async (assignee: string | null, assigneeType: AssigneeType) => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;
      const success = await bulkAssign(ids, assignee, assigneeType);
      if (success) {
        setSelectedIds(new Set());
      }
    },
    [selectedIds, bulkAssign]
  );

  const handleBulkExport = useCallback(() => {
    const selectedCases = filteredCases.filter((c) => selectedIds.has(c.id));
    if (selectedCases.length === 0) return;
    const csvContent = exportCasesToCsv(selectedCases, now);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `falcon-cases-selected-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('success', `Exported ${selectedCases.length} selected cases to CSV`);
  }, [filteredCases, selectedIds, now, addToast]);

  // Handle KPI strip cell toggle click (Section 6.3)
  const handleSelectKpi = useCallback(
    (key: CaseKpiKey | null) => {
      setActiveKpi(key);
      setCurrentPage(1);

      if (!key) {
        // Clear matching KPI filter
        setFilters((prev) => ({
          ...prev,
          tab: 'all',
          assignee: undefined,
          search: undefined,
        }));
        return;
      }

      switch (key) {
        case 'open':
          setFilters((prev) => ({
            ...prev,
            tab: 'open',
            assignee: undefined,
          }));
          break;
        case 'in_progress':
          setFilters((prev) => ({
            ...prev,
            tab: 'in_progress',
            assignee: undefined,
          }));
          break;
        case 'in_review':
          setFilters((prev) => ({
            ...prev,
            tab: 'in_review',
            assignee: undefined,
          }));
          break;
        case 'unassigned':
          setFilters((prev) => ({
            ...prev,
            tab: 'all',
            assignee: ['unassigned'],
          }));
          break;
        case 'oldest_open':
          if (kpis.oldestOpenCaseId) {
            setFilters((prev) => ({
              ...prev,
              search: kpis.oldestOpenCaseId!,
            }));
          }
          break;
      }
    },
    [kpis.oldestOpenCaseId]
  );

  return (
    <div className="flex flex-col min-h-full bg-background text-foreground animate-in fade-in duration-200">
      <div className="p-4 sm:p-6 max-w-[1600px] w-full mx-auto space-y-4">
        {/* 6.1 Page Header */}
        <CaseQueueHeader filteredCases={filteredCases} />

        {/* 6.3 KPI Strip */}
        <CaseKpiStrip
          cases={cases}
          activeKpi={activeKpi}
          onSelectKpi={handleSelectKpi}
        />

        {/* 6.4 Status Tabs, 6.5 Search & Filter Chips, 6.2 Helper line */}
        <CaseQueueToolbar
          filters={filters}
          setFilters={handleSetFilters}
          statusCounts={statusCounts}
          totalFilteredCount={filteredCases.length}
        />

        {/* 6.6 Table View */}
        <CaseTableView
          cases={sortedCases}
          totalFilteredCount={filteredCases.length}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAllPage={handleSelectAllPage}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          isLoading={isRefreshing}
          onRetry={refreshCases}
        />

        {/* 6.6 Bulk Action Bar (appears when rows are selected) */}
        <CaseBulkActionBar
          selectedCount={selectedIds.size}
          totalCount={filteredCases.length}
          isAllResultsSelected={selectedIds.size === filteredCases.length && filteredCases.length > 0}
          onSelectAllResults={handleSelectAllResults}
          onAssign={handleBulkAssign}
          onExportSelected={handleBulkExport}
          onClear={handleClearSelection}
        />
      </div>
    </div>
  );
}
