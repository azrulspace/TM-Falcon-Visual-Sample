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
import { useToast } from '@/contexts/ToastContext';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FalconEvent } from '@/data/events';
import { filterEvents, sortEvents, exportEventsToCsv, type EventFilterState } from '@/data/eventSelectors';

export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    events,
    activeEventId,
    bulkAcknowledge,
  } = useEvents();
  const { addToast } = useToast();

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
      source: filters.source ? filters.source.split(',') : undefined,
      capturedBefore: searchParams.get('captured_before') || undefined,
      fromEventId: searchParams.get('from') || undefined,
    };
  }, [filters, searchParams]);

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
        {/* Summary Strip (4 KPI cells matching INBOX_FINAL) */}
        <SummaryStrip
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
