import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCases } from '@/contexts/CasesContext';
import { useEvents } from '@/contexts/EventsContext';
import { CaseQueueHeader } from '@/components/cases/CaseQueueHeader';
import { CaseKpiStrip, type CaseKpiKey } from '@/components/cases/CaseKpiStrip';
import { CaseQueueToolbar } from '@/components/cases/CaseQueueToolbar';
import { CaseStatusBadge } from '@/components/common/CaseStatusBadge';
import { AssigneeCell } from '@/components/common/AssigneeCell';
import { Button } from '@/components/ui/button';
import { ArrowRight, Inbox } from 'lucide-react';
import {
  filterCases,
  getCaseStatusCounts,
  getCaseKpiCounts,
  type CaseFilterState,
} from '@/data/caseSelectors';
import { formatRelativeTime } from '@/lib/dateTime';

export default function Cases() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { cases } = useCases();
  const { events } = useEvents();

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

  // 2. Sync filters to URL query string
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

    setSearchParams(params, { replace: true });
  }, [filters, activeKpi, setSearchParams]);

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

  // Handle KPI strip cell toggle click (Section 6.3)
  const handleSelectKpi = useCallback(
    (key: CaseKpiKey | null) => {
      setActiveKpi(key);

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
      <div className="p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
        {/* 6.1 Page Header */}
        <CaseQueueHeader filteredCases={filteredCases} />

        {/* 6.3 KPI Strip */}
        <CaseKpiStrip
          cases={cases}
          activeKpi={activeKpi}
          onSelectKpi={handleSelectKpi}
        />

        {/* 6.4 Status Tabs, 6.5 Search, 6.2 Helper line */}
        <CaseQueueToolbar
          filters={filters}
          setFilters={setFilters}
          statusCounts={statusCounts}
          totalFilteredCount={filteredCases.length}
        />

        {/* Interim Table Preview (full table with selection/bulk in Phase 4) */}
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          {filteredCases.length === 0 ? (
            /* 6.2 Empty State */
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Inbox className="size-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">No matching cases</h3>
              <p className="text-xs text-muted-foreground max-w-sm mb-4">
                Cases are created from an event with the Create case action. Open an event in the Event inbox to start one.
              </p>
              <Button
                onClick={() => navigate('/events')}
                className="gap-1.5 text-xs font-semibold"
              >
                <span>Go to Event inbox</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredCases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/cases/${c.id}`)}
                  className="p-3.5 sm:px-4 flex items-center justify-between hover:bg-muted/30 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <span className="font-mono text-xs font-semibold text-primary shrink-0 group-hover:underline">
                      {c.id}
                    </span>
                    <span className="text-xs text-foreground font-medium truncate max-w-[280px] sm:max-w-md">
                      {c.title}
                    </span>
                    {c.sourceEvent && (
                      <span className="font-mono text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded shrink-0 hidden md:inline">
                        {c.sourceEventId}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <CaseStatusBadge status={c.status} size="sm" />
                    <AssigneeCell
                      assignee={c.assignee}
                      assigneeType={c.assigneeType}
                      className="hidden sm:inline-flex"
                    />
                    <span className="text-[11px] text-muted-foreground tabular-nums hidden lg:inline">
                      {formatRelativeTime(c.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
