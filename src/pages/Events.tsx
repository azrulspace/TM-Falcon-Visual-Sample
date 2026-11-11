import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { InboxHeader } from '@/components/events/InboxHeader';
import { SummaryStrip, type QuickFilterKey } from '@/components/events/SummaryStrip';
import { InboxToolbar, type InboxFilters } from '@/components/events/InboxToolbar';
import { EventTableView } from '@/components/events/EventTableView';
import { EventGalleryView } from '@/components/events/EventGalleryView';
import { BulkActionBar } from '@/components/events/BulkActionBar';
import { CreateCaseDialog } from '@/components/events/dialogs/CreateCaseDialog';
import { DismissEventDialog } from '@/components/events/dialogs/DismissEventDialog';
import { AssignEventDialog } from '@/components/events/dialogs/AssignEventDialog';
import { KeyboardShortcutsDialog } from '@/components/events/dialogs/KeyboardShortcutsDialog';
import { LightboxModal } from '@/components/events/dialogs/LightboxModal';
import { useEvents } from '@/contexts/EventsContext';
import { useAssets } from '@/contexts/AssetsContext';
import { useToast } from '@/contexts/ToastContext';
import { SearchX, History, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatId } from '@/lib/utils';
import type { FalconEvent } from '@/data/events';
import { filterEvents, sortEvents, exportEventsToCsv, type EventFilterState } from '@/data/eventSelectors';
import { getEventsForPole } from '@/data/poleSelectors';

export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    events,
    activeEventId,
    bulkAcknowledge,
  } = useEvents();
  const { getPoleById } = useAssets();
  const { addToast } = useToast();
  const scopedPoleId = searchParams.get('pole') || undefined;

  // 1. Filter State (synced with URL)
  const [filters, setFilters] = useState<InboxFilters>(() => ({
    tab: (searchParams.get('tab') as InboxFilters['tab']) || 'all',
    search: searchParams.get('q') || '',
    timeRange: searchParams.get('time') || undefined,
    priority: searchParams.get('priority') || undefined,
    status: searchParams.get('status') || undefined,
    caseFilter: searchParams.get('case') || undefined,
    device: searchParams.get('device') || undefined,
    asset: searchParams.get('asset') || undefined,
    type: searchParams.get('type') || undefined,
    source: searchParams.get('source') || undefined,
    capturedBefore: searchParams.get('captured_before') || undefined,
    fromEventId: searchParams.get('from') || undefined,
  }));

  // 2. View Mode (Table and Gallery ONLY)
  const [viewMode, setViewMode] = useState<'table' | 'gallery'>(() => {
    return searchParams.get('view') === 'gallery' ? 'gallery' : 'table';
  });

  // 3. Sorting Config
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>(() => {
    const rawSort = searchParams.get('sort');
    if (rawSort && rawSort.includes(':')) {
      const [key, dir] = rawSort.split(':');
      return { key, direction: dir === 'asc' ? 'asc' : 'desc' };
    }
    return { key: 'captured', direction: 'desc' };
  });

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  // 4. Pagination
  const [currentPage, setCurrentPage] = useState<number>(() => {
    const p = parseInt(searchParams.get('page') || '1', 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });
  const [rowsPerPage, setRowsPerPage] = useState<number>(() => {
    const l = parseInt(searchParams.get('limit') || '50', 10);
    return isNaN(l) || l < 1 ? 50 : l;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Keep URL search params in sync with filter changes & navigation state
  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (filters.tab && filters.tab !== 'all') next.set('tab', filters.tab);
      else next.delete('tab');

      if (filters.search) next.set('q', filters.search);
      else next.delete('q');

      if (filters.timeRange) next.set('time', filters.timeRange);
      else next.delete('time');

      if (filters.priority) next.set('priority', filters.priority);
      else next.delete('priority');

      if (filters.status) next.set('status', filters.status);
      else next.delete('status');

      if (filters.caseFilter) next.set('case', filters.caseFilter);
      else next.delete('case');

      if (filters.device) next.set('device', filters.device);
      else next.delete('device');

      if (filters.asset) next.set('asset', filters.asset);
      else next.delete('asset');

      if (filters.type) next.set('type', filters.type);
      else next.delete('type');

      if (filters.source) next.set('source', filters.source);
      else next.delete('source');

      if (filters.capturedBefore) next.set('captured_before', filters.capturedBefore);
      else next.delete('captured_before');

      if (filters.fromEventId) next.set('from', filters.fromEventId);
      else next.delete('from');

      if (viewMode === 'gallery') next.set('view', 'gallery');
      else next.delete('view');

      if (sortConfig.key !== 'captured' || sortConfig.direction !== 'desc') {
        next.set('sort', `${sortConfig.key}:${sortConfig.direction}`);
      } else {
        next.delete('sort');
      }

      if (currentPage > 1) next.set('page', String(currentPage));
      else next.delete('page');

      if (rowsPerPage !== 50) next.set('limit', String(rowsPerPage));
      else next.delete('limit');

      return next;
    }, { replace: true });
  }, [filters, viewMode, sortConfig, currentPage, rowsPerPage, setSearchParams]);

  // Synchronize state when browser back/forward or external navigation updates searchParams
  useEffect(() => {
    const urlTab = (searchParams.get('tab') as InboxFilters['tab']) || 'all';
    const urlSearch = searchParams.get('q') || '';
    const urlTime = searchParams.get('time') || undefined;
    const urlPriority = searchParams.get('priority') || undefined;
    const urlStatus = searchParams.get('status') || undefined;
    const urlCase = searchParams.get('case') || undefined;
    const urlDevice = searchParams.get('device') || undefined;
    const urlAsset = searchParams.get('asset') || undefined;
    const urlType = searchParams.get('type') || undefined;
    const urlSource = searchParams.get('source') || undefined;
    const urlCapturedBefore = searchParams.get('captured_before') || undefined;
    const urlFromEventId = searchParams.get('from') || undefined;

    setFilters((prev) => {
      if (
        prev.tab === urlTab &&
        prev.search === urlSearch &&
        prev.timeRange === urlTime &&
        prev.priority === urlPriority &&
        prev.status === urlStatus &&
        prev.caseFilter === urlCase &&
        prev.device === urlDevice &&
        prev.asset === urlAsset &&
        prev.type === urlType &&
        prev.source === urlSource &&
        prev.capturedBefore === urlCapturedBefore &&
        prev.fromEventId === urlFromEventId
      ) {
        return prev;
      }
      return {
        tab: urlTab,
        search: urlSearch,
        timeRange: urlTime,
        priority: urlPriority,
        status: urlStatus,
        caseFilter: urlCase,
        device: urlDevice,
        asset: urlAsset,
        type: urlType,
        source: urlSource,
        capturedBefore: urlCapturedBefore,
        fromEventId: urlFromEventId,
      };
    });
  }, [searchParams]);

  // Persist current inbox URL to sessionStorage so detail view back returns to exact state (Section 4.1 & 6)
  useEffect(() => {
    const fullUrl = window.location.pathname + window.location.search;
    sessionStorage.setItem('last_inbox_url', fullUrl);
  }, [searchParams]);

  // 5. Quick filter from SummaryStrip
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilterKey | null>(null);

  // Sync activeQuickFilter with filters
  useEffect(() => {
    if (filters.tab === 'new' && !filters.priority && !filters.caseFilter && !filters.timeRange) {
      setActiveQuickFilter('new');
    } else if ((filters.priority === 'High,Critical' || filters.priority === 'Critical,High') && filters.tab === 'all') {
      setActiveQuickFilter('high_priority');
    } else if (filters.caseFilter === 'without_case' && filters.tab === 'all') {
      setActiveQuickFilter('without_case');
    } else if (filters.timeRange === 'today' && filters.tab === 'all') {
      setActiveQuickFilter('today');
    } else {
      setActiveQuickFilter(null);
    }
  }, [filters]);

  const handleSelectQuickFilter = (key: QuickFilterKey | null) => {
    setActiveQuickFilter(key);
    if (key === 'new') {
      setFilters((f) => ({ ...f, tab: 'new', priority: undefined, caseFilter: undefined, timeRange: undefined }));
    } else if (key === 'high_priority') {
      setFilters((f) => ({ ...f, tab: 'all', priority: 'High,Critical', caseFilter: undefined, timeRange: undefined }));
    } else if (key === 'without_case') {
      setFilters((f) => ({ ...f, tab: 'all', priority: undefined, caseFilter: 'without_case', timeRange: undefined }));
    } else if (key === 'today') {
      setFilters((f) => ({ ...f, tab: 'all', priority: undefined, caseFilter: undefined, timeRange: 'today' }));
    } else if (key === null) {
      setFilters((f) => ({ ...f, tab: 'all', priority: undefined, caseFilter: undefined, timeRange: undefined }));
    }
  };

  // 6. Filter & Sorting via eventSelectors Single Source of Truth
  const poleScopeEventIds = useMemo(() => {
    if (!scopedPoleId) return undefined;
    const poleObj = getPoleById(scopedPoleId);
    if (!poleObj) return [] as string[];
    return getEventsForPole(
      poleObj,
      poleObj.connectedSpans,
      poleObj.linkedDevices,
      events
    ).allEvents.map((ev) => ev.id);
  }, [scopedPoleId, getPoleById, events]);

  const filterState: EventFilterState = useMemo(() => {
    return {
      tab: filters.tab,
      search: filters.search,
      priority: filters.priority ? filters.priority.split(',') : undefined,
      status: filters.status ? filters.status.split(',') : undefined,
      caseFilter: filters.caseFilter,
      timeRange: filters.timeRange,
      device: filters.device,
      asset: filters.asset,
      poleScopeEventIds,
      source: filters.source ? filters.source.split(',') : undefined,
      capturedBefore: filters.capturedBefore || searchParams.get('captured_before') || undefined,
      fromEventId: filters.fromEventId || searchParams.get('from') || undefined,
    };
  }, [filters, poleScopeEventIds, searchParams]);

  // Alert History or Pole Scoped Context Evaluation
  const isContextScoped = Boolean(
    scopedPoleId ||
      ((filters.asset || filters.device) && (filterState.capturedBefore || filterState.fromEventId))
  );
  const contextScopeLabel = scopedPoleId || formatId(filters.asset || filters.device || 'CBL-005');
  const contextFromEventId = filterState.fromEventId || filterState.capturedBefore || null;

  const scopedEventsForKpis = useMemo(() => {
    if (isContextScoped) {
      return filterEvents(events, {
        asset: filters.asset,
        device: filters.device,
        poleScopeEventIds,
        capturedBefore: filterState.capturedBefore,
      });
    }
    return events;
  }, [events, isContextScoped, filters.asset, filters.device, poleScopeEventIds, filterState.capturedBefore]);

  const handleClearContextFilter = () => {
    if (scopedPoleId) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('pole');
        return next;
      });
    }
    setFilters((prev) => {
      const next = { ...prev };
      delete next.asset;
      delete next.device;
      delete next.capturedBefore;
      delete next.fromEventId;
      return next;
    });
  };

  const filteredEvents = useMemo(() => {
    const matched = filterEvents(events, filterState);
    return sortEvents(matched, sortConfig.key, sortConfig.direction);
  }, [events, filterState, sortConfig]);

  // 7. Multi-Row Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllPage = (selectAll: boolean, pageIds: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selectAll) {
        pageIds.forEach((id) => next.add(id));
      } else {
        pageIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleSelectAllResults = () => {
    setSelectedIds(new Set(filteredEvents.map((e) => e.id)));
  };

  // 8. Bulk Operations
  const handleBulkAcknowledge = () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    bulkAcknowledge(ids);
    setSelectedIds(new Set());
  };

  const handleBulkExport = () => {
    if (selectedIds.size === 0) return;
    const selectedList = events.filter((e) => selectedIds.has(e.id));
    exportEventsToCsv(selectedList);
    addToast('success', `Exported ${selectedList.length} selected events.`);
  };

  // 9. Dialog States
  const [createCaseEventId, setCreateCaseEventId] = useState<string | null>(null);
  const [dismissEventId, setDismissEventId] = useState<string | null>(null);
  const [assignEventId, setAssignEventId] = useState<string | null>(null);
  const [bulkDismissOpen, setBulkDismissOpen] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [lightboxEvent, setLightboxEvent] = useState<FalconEvent | null>(null);

  const targetCreateCaseEvent = useMemo(
    () => events.find((e) => e.id === createCaseEventId) || null,
    [events, createCaseEventId]
  );
  const targetDismissEvent = useMemo(
    () => events.find((e) => e.id === dismissEventId) || null,
    [events, dismissEventId]
  );
  const targetAssignEvent = useMemo(
    () => events.find((e) => e.id === assignEventId) || null,
    [events, assignEventId]
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased">
      {/* 1. Page Header (INBOX_FINAL) */}
      <InboxHeader filteredEvents={filteredEvents} />

      {/* 2. Main Body Container (Fluid width, 24px padding, 16px gaps) */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 gap-4 max-w-[1920px] w-full mx-auto">
        {/* Context Banner (Section 6: Alert History Scoped View) */}
        {isContextScoped && (
          <div
            data-testid="context-banner"
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-border bg-card shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <History className="size-3.5" />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {scopedPoleId ? (
                  <>
                    <span className="font-semibold text-foreground">
                      Events for pole <span className="font-mono">{scopedPoleId}</span>:{' '}
                      {filteredEvents.length} events
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      (Includes events directly on this pole, mounted devices, and connected cable spans)
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-foreground">
                      Alert history for {contextScopeLabel}: {filteredEvents.length} events captured before {formatId(contextFromEventId || 'EVT-0258')}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      (Counts are scoped to this {filters.device ? 'device' : 'span'})
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {scopedPoleId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/assets/poles/${encodeURIComponent(scopedPoleId)}`)}
                  className="h-7 px-2.5 text-xs border-border hover:bg-muted text-foreground gap-1.5 cursor-pointer font-medium"
                >
                  <ArrowLeft className="size-3" />
                  <span>Back to {scopedPoleId}</span>
                </Button>
              )}
              {contextFromEventId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/events/${contextFromEventId}`)}
                  className="h-7 px-2.5 text-xs border-border hover:bg-muted text-foreground gap-1.5 cursor-pointer font-medium"
                >
                  <ArrowLeft className="size-3" />
                  <span>Back to {formatId(contextFromEventId)}</span>
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearContextFilter}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Clear filter
              </Button>
            </div>
          </div>
        )}

        {/* Summary Strip (4 KPI cells matching INBOX_FINAL) */}
        <SummaryStrip
          eventsOverride={isContextScoped ? scopedEventsForKpis : undefined}
          activeQuickFilter={activeQuickFilter}
          onSelectQuickFilter={handleSelectQuickFilter}
        />

        {/* Toolbar (Quick view tabs, search with '/' shortcut, filter popovers, view mode) */}
        <InboxToolbar
          filters={filters}
          setFilters={setFilters}
          viewMode={viewMode}
          setViewMode={setViewMode}
          filteredCount={filteredEvents.length}
        />

        {/* Content Area (Table or Gallery) */}
        <div className="flex-1 flex flex-col min-h-[500px]">
          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl border border-dashed border-border bg-card text-center gap-3">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <SearchX className="size-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-semibold text-base text-foreground">
                  No matching events found
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  No telemetry alerts match your current filter selection or search query.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilters({
                    tab: 'all',
                    search: '',
                    timeRange: undefined,
                    priority: undefined,
                    status: undefined,
                    caseFilter: undefined,
                    device: undefined,
                    asset: undefined,
                    type: undefined,
                    source: undefined,
                  })
                }
                className="text-xs border-border mt-2"
              >
                Clear all filters
              </Button>
            </div>
          ) : viewMode === 'table' ? (
            <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
              <EventTableView
                events={filteredEvents}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onSelectAllPage={handleSelectAllPage}
                activeEventId={activeEventId}
                onRowClick={(evt) => navigate(`/events/${evt.id}`)}
                sortConfig={sortConfig}
                onSort={handleSort}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                rowsPerPage={rowsPerPage}
                setRowsPerPage={setRowsPerPage}
                onOpenAssignDialog={(id) => setAssignEventId(id)}
                onOpenDismissDialog={(id) => setDismissEventId(id)}
                onOpenCreateCaseDialog={(id) => setCreateCaseEventId(id)}
                onOpenLightbox={(evt) => setLightboxEvent(evt)}
              />
            </div>
          ) : (
            <EventGalleryView
              events={filteredEvents}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              activeEventId={activeEventId}
              onCardClick={(evt) => navigate(`/events/${evt.id}`)}
              onOpenAssignDialog={(id) => setAssignEventId(id)}
              onOpenDismissDialog={(id) => setDismissEventId(id)}
              onOpenCreateCaseDialog={(id) => setCreateCaseEventId(id)}
            />
          )}
        </div>
      </main>

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        totalCount={filteredEvents.length}
        isAllResultsSelected={selectedIds.size === filteredEvents.length && filteredEvents.length > 0}
        onSelectAllResults={handleSelectAllResults}
        onAcknowledge={handleBulkAcknowledge}
        onAssign={() => setBulkAssignOpen(true)}
        onCreateCase={() => {
          if (selectedIds.size > 0) {
            const firstId = Array.from(selectedIds)[0];
            setCreateCaseEventId(firstId);
          }
        }}
        onDismiss={() => setBulkDismissOpen(true)}
        onExport={handleBulkExport}
        onClear={handleClearSelection}
      />

      {/* Action Dialogs */}
      <CreateCaseDialog
        open={!!createCaseEventId}
        onOpenChange={(open) => !open && setCreateCaseEventId(null)}
        event={targetCreateCaseEvent}
      />

      <DismissEventDialog
        open={!!dismissEventId || bulkDismissOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDismissEventId(null);
            setBulkDismissOpen(false);
          }
        }}
        event={targetDismissEvent}
        bulkIds={bulkDismissOpen ? Array.from(selectedIds) : undefined}
      />

      <AssignEventDialog
        open={!!assignEventId || bulkAssignOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAssignEventId(null);
            setBulkAssignOpen(false);
          }
        }}
        event={targetAssignEvent}
        bulkIds={bulkAssignOpen ? Array.from(selectedIds) : undefined}
      />

      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />

      <LightboxModal
        open={!!lightboxEvent}
        onOpenChange={(open) => !open && setLightboxEvent(null)}
        event={lightboxEvent}
      />
    </div>
  );
}
