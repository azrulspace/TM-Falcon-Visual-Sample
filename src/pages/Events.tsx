import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  InboxHeader,
  type ColumnVisibility,
} from '@/components/events/InboxHeader';
import { SummaryStrip } from '@/components/events/SummaryStrip';
import {
  InboxToolbar,
  type InboxFilters,
} from '@/components/events/InboxToolbar';
import { EventTableView } from '@/components/events/EventTableView';
import { EventGroupedView } from '@/components/events/EventGroupedView';
import { EventGalleryView } from '@/components/events/EventGalleryView';
import { EventPeekPanel } from '@/components/events/EventPeekPanel';
import { BulkActionBar } from '@/components/events/BulkActionBar';
import { CreateCaseDialog } from '@/components/events/dialogs/CreateCaseDialog';
import { DismissEventDialog } from '@/components/events/dialogs/DismissEventDialog';
import { AssignEventDialog } from '@/components/events/dialogs/AssignEventDialog';
import { KeyboardShortcutsDialog } from '@/components/events/dialogs/KeyboardShortcutsDialog';
import { LightboxModal } from '@/components/events/dialogs/LightboxModal';
import { useEvents } from '@/contexts/EventsContext';
import { useToast } from '@/contexts/ToastContext';
import { useOverview } from '@/contexts/OverviewContext';
import { Bell, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FalconEvent } from '@/data/events';

export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const overview = useOverview();
  const {
    events,
    activeEventId,
    setActiveEventId,
    activeEvent,
    bulkAcknowledge,
    incomingNewEventsCount,
    mergeNewEvents,
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

  // Keep URL search params in sync with filter changes
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

      return next;
    }, { replace: true });
  }, [filters, setSearchParams]);

  // 2. View Mode and Density
  const [viewMode, setViewMode] = useState<'table' | 'grouped' | 'gallery'>('table');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // 3. Column Visibility
  const [columns, setColumns] = useState<ColumnVisibility>({
    event: true,
    captured: true,
    type: true,
    device: true,
    asset: true,
    priority: true,
    status: true,
    case: true,
    source: false,
    actions: true,
  });

  // 4. Quick filter from SummaryStrip
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);

  const handleSelectQuickFilter = (key: string | null) => {
    setActiveQuickFilter(key);
    if (key === 'new') {
      setFilters((f) => ({ ...f, tab: 'new' }));
    } else if (key === 'high_priority') {
      setFilters((f) => ({ ...f, priority: 'High', tab: 'all' }));
    } else if (key === 'without_case') {
      setFilters((f) => ({ ...f, caseFilter: 'no_case', tab: 'all' }));
    } else if (key === null) {
      setFilters((f) => ({ ...f, tab: 'all', priority: undefined, caseFilter: undefined }));
    }
  };

  // 5. Sorting Config
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'captured',
    direction: 'desc',
  });

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  // 6. Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

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

  // 8. Filter Logic
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Tab filter
      if (filters.tab === 'new' && e.state !== 'New') return false;
      if (filters.tab === 'acknowledged' && e.state !== 'Acknowledged') return false;
      if (filters.tab === 'in_case' && e.state !== 'In case') return false;
      if (filters.tab === 'dismissed' && e.state !== 'Dismissed') return false;

      // Filter chips
      if (filters.priority && e.priority !== filters.priority) return false;
      if (filters.status && e.state !== filters.status) return false;
      if (filters.caseFilter === 'with_case' && !e.caseId) return false;
      if (filters.caseFilter === 'no_case' && e.caseId) return false;
      if (filters.device && e.device !== filters.device) return false;
      if (filters.asset && e.asset !== filters.asset) return false;
      if (filters.type && e.type !== filters.type) return false;
      if (filters.source && e.source !== filters.source) return false;

      // Time Range
      if (filters.timeRange) {
        const cap = e.captured.toLowerCase();
        if (filters.timeRange === 'Last 15m' && !cap.includes('m ago') && !cap.includes('just now')) {
          return false;
        }
        if (filters.timeRange === 'Last 1h' && !cap.includes('m ago') && !cap.includes('1h ago') && !cap.includes('just now')) {
          return false;
        }
      }

      // Search query
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchId = e.id.toLowerCase().includes(q);
        const matchType = e.type.toLowerCase().includes(q);
        const matchDevice = e.device?.toLowerCase().includes(q);
        const matchAsset = e.asset.toLowerCase().includes(q);
        const matchRule = e.detection?.toLowerCase().includes(q);
        if (!matchId && !matchType && !matchDevice && !matchAsset && !matchRule) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let valA: any = (a as any)[sortConfig.key] || '';
      let valB: any = (b as any)[sortConfig.key] || '';

      if (sortConfig.key === 'captured') {
        valA = new Date(a.captured).getTime();
        valB = new Date(b.captured).getTime();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [events, filters, sortConfig]);

  // 9. Dialog States
  const [createCaseEventId, setCreateCaseEventId] = useState<string | null>(null);
  const [dismissEventId, setDismissEventId] = useState<string | null>(null);
  const [assignEventId, setAssignEventId] = useState<string | null>(null);
  const [bulkDismissOpen, setBulkDismissOpen] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [lightboxEvent, setLightboxEvent] = useState<FalconEvent | null>(null);

  // 10. Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT';

      // '?' key opens shortcuts guide
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShortcutsOpen((o) => !o);
        return;
      }

      // Escape closes peek panel
      if (e.key === 'Escape') {
        if (activeEventId) {
          setActiveEventId(null);
        }
        return;
      }

      if (isInput) return;

      // J: Next event
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (filteredEvents.length === 0) return;
        if (!activeEventId) {
          setActiveEventId(filteredEvents[0].id);
        } else {
          const idx = filteredEvents.findIndex((ev) => ev.id === activeEventId);
          if (idx < filteredEvents.length - 1) {
            setActiveEventId(filteredEvents[idx + 1].id);
          }
        }
        return;
      }

      // K: Prev event
      if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (filteredEvents.length === 0) return;
        if (!activeEventId) {
          setActiveEventId(filteredEvents[0].id);
        } else {
          const idx = filteredEvents.findIndex((ev) => ev.id === activeEventId);
          if (idx > 0) {
            setActiveEventId(filteredEvents[idx - 1].id);
          }
        }
        return;
      }

      // Enter opens full detail page
      if (e.key === 'Enter') {
        if (activeEventId) {
          navigate(`/events/${activeEventId}`);
        }
        return;
      }

      // E: Acknowledge active event
      if (e.key === 'e' || e.key === 'E') {
        if (activeEvent && activeEvent.state === 'New') {
          e.preventDefault();
          bulkAcknowledge([activeEvent.id]);
          addToast('success', `Event ${activeEvent.id} acknowledged`);
        }
        return;
      }

      // C: Create case for active event
      if (e.key === 'c' || e.key === 'C') {
        if (activeEventId) {
          e.preventDefault();
          setCreateCaseEventId(activeEventId);
        }
        return;
      }

      // 1, 2, 3: View mode toggles
      if (e.key === '1') setViewMode('table');
      if (e.key === '2') setViewMode('grouped');
      if (e.key === '3') setViewMode('gallery');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    filteredEvents,
    activeEventId,
    activeEvent,
    bulkAcknowledge,
    setActiveEventId,
    navigate,
    addToast,
  ]);

  // 11. Bulk Actions
  const handleBulkAcknowledge = () => {
    const ids = Array.from(selectedIds);
    bulkAcknowledge(ids);
    addToast('success', `Acknowledged ${ids.length} selected events`);
    setSelectedIds(new Set());
  };

  const handleBulkExport = () => {
    const selectedEvents = events.filter((e) => selectedIds.has(e.id));
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['ID,Type,Priority,Status,Device,Asset,Captured,Received,Case']
        .concat(
          selectedEvents.map(
            (e) =>
              `${e.id},"${e.type}",${e.priority},${e.state},${e.device || ''},${e.asset},"${e.captured}","${e.receivedAt}",${e.caseId || ''}`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `falcon_events_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', `Exported ${selectedIds.size} events to CSV`);
  };

  const handleSelectAllResults = () => {
    setSelectedIds(new Set(filteredEvents.map((e) => e.id)));
  };

  // Selected event for dialogs
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

  // Peek panel prev/next calculation
  const activeEventIndex = useMemo(() => {
    return filteredEvents.findIndex((e) => e.id === activeEventId);
  }, [filteredEvents, activeEventId]);

  const hasPrevPeek = activeEventIndex > 0;
  const hasNextPeek = activeEventIndex >= 0 && activeEventIndex < filteredEvents.length - 1;

  const handlePrevPeek = () => {
    if (hasPrevPeek) {
      setActiveEventId(filteredEvents[activeEventIndex - 1].id);
    }
  };

  const handleNextPeek = () => {
    if (hasNextPeek) {
      setActiveEventId(filteredEvents[activeEventIndex + 1].id);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased">
      {/* 1. Page Header */}
      <InboxHeader
        filteredEvents={filteredEvents}
        columns={columns}
        setColumns={setColumns}
        density={density}
        setDensity={setDensity}
      />

      {/* 2. Main Body Container (Fluid width, 24px padding, 16px gaps) */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 gap-4 max-w-[1920px] w-full mx-auto">
        {/* Summary Strip (Clickable quick filter cells) */}
        <SummaryStrip
          activeQuickFilter={activeQuickFilter}
          onSelectQuickFilter={handleSelectQuickFilter}
        />

        {/* Live Incoming Events Notification Banner */}
        {incomingNewEventsCount > 0 && overview.liveState === 'live' && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-card border border-border text-foreground shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2.5 text-xs font-medium">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-[#10b981]" />
              </span>
              <Bell className="size-4 text-primary" />
              <span>
                <strong className="text-foreground">{incomingNewEventsCount} new events</strong>{' '}
                <span className="text-muted-foreground">captured from edge cameras.</span>
              </span>
            </div>
            <Button
              size="sm"
              onClick={mergeNewEvents}
              className="h-7 px-3 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
            >
              Show new events
            </Button>
          </div>
        )}

        {/* Toolbar (Quick view tabs, search with '/' shortcut, filter popovers, view mode) */}
        <InboxToolbar
          filters={filters}
          setFilters={setFilters}
          viewMode={viewMode}
          setViewMode={setViewMode}
          filteredCount={filteredEvents.length}
        />

        {/* Content Area with Docked Peek Panel */}
        <div className="flex-1 flex items-start gap-0 relative min-h-[500px]">
          {/* Main List Area: Shrinks when Peek Panel is Open */}
          <div className="flex-1 min-w-0 transition-all duration-200">
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
                  onRowClick={(evt) => setActiveEventId(evt.id)}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  columns={columns}
                  density={density}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  rowsPerPage={rowsPerPage}
                  setRowsPerPage={setRowsPerPage}
                  onOpenAssignDialog={(id) => setAssignEventId(id)}
                  onOpenDismissDialog={(id) => setDismissEventId(id)}
                  onOpenCreateCaseDialog={(id) => setCreateCaseEventId(id)}
                />
              </div>
            ) : viewMode === 'grouped' ? (
              <EventGroupedView
                events={filteredEvents}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onSelectAllPage={handleSelectAllPage}
                activeEventId={activeEventId}
                onRowClick={(evt) => setActiveEventId(evt.id)}
                columns={columns}
                density={density}
                onOpenAssignDialog={(id) => setAssignEventId(id)}
                onOpenDismissDialog={(id) => setDismissEventId(id)}
                onOpenCreateCaseDialog={(id) => setCreateCaseEventId(id)}
              />
            ) : (
              <EventGalleryView
                events={filteredEvents}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                activeEventId={activeEventId}
                onCardClick={(evt) => setActiveEventId(evt.id)}
                onOpenAssignDialog={(id) => setAssignEventId(id)}
                onOpenDismissDialog={(id) => setDismissEventId(id)}
                onOpenCreateCaseDialog={(id) => setCreateCaseEventId(id)}
              />
            )}
          </div>

          {/* Docked Peek Panel (420px wide on desktop) */}
          {activeEvent && (
            <div className="hidden xl:block w-[420px] shrink-0 sticky top-4 max-h-[calc(100vh-140px)] ml-4 rounded-xl overflow-hidden border border-border shadow-lg">
              <EventPeekPanel
                event={activeEvent}
                onClose={() => setActiveEventId(null)}
                onNext={handleNextPeek}
                onPrev={handlePrevPeek}
                hasPrev={hasPrevPeek}
                hasNext={hasNextPeek}
                onOpenDetail={(id) => navigate(`/events/${id}`)}
                onOpenLightbox={(evt) => setLightboxEvent(evt)}
                onOpenCreateCase={(id) => setCreateCaseEventId(id)}
                onOpenDismiss={(id) => setDismissEventId(id)}
                onOpenAssign={(id) => setAssignEventId(id)}
              />
            </div>
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
