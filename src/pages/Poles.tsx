import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAssets } from '@/contexts/AssetsContext';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { PolesPageHeader } from '@/components/assets/PolesPageHeader';
import { AssetsModuleTabs } from '@/components/assets/AssetsModuleTabs';
import { PolesKpiStrip, type PoleKpiKey } from '@/components/assets/PolesKpiStrip';
import { PolesToolbar } from '@/components/assets/PolesToolbar';
import { PolesTableView } from '@/components/assets/PolesTableView';
import { PolesMapView } from '@/components/assets/PolesMapView';
import { PolesDeletedView } from '@/components/assets/PolesDeletedView';
import { PolesBulkActionBar } from '@/components/assets/PolesBulkActionBar';
import { RegisterPoleDialog } from '@/components/assets/RegisterPoleDialog';
import { RelocatePoleDialog } from '@/components/assets/dialogs/RelocatePoleDialog';
import { EditPoleDialog } from '@/components/assets/dialogs/EditPoleDialog';
import { DeletePoleDialog } from '@/components/assets/dialogs/DeletePoleDialog';
import {
  filterPoles,
  sortPoles,
  getPoleKpiCounts,
  getPoleStatusTabCounts,
  parsePolesUrlState,
  buildPolesSearchParams,
  exportPolesToCsv,
} from '@/data/poleSelectors';
import { getServerNow } from '@/lib/dateTime';
import type {
  PoleFilterState,
  PoleSortKey,
  PoleSortDir,
  PoleWithRelations,
} from '@/types/assets';

export default function Poles() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectedSite } = useAppContext();
  const {
    sites,
    poles,
    cableSpans,
    capabilities,
    permissions,
    hasTestFlag,
    isLoading,
    isRefreshing,
    errorMessage,
    recentlyCreatedId,
    refreshAssets,
    retryLoad,
    restorePole,
  } = useAssets();
  const { addToast } = useToast();

  const initial = useMemo(
    () => parsePolesUrlState(searchParams, selectedSite),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [filters, setFilters] = useState<PoleFilterState>(initial.filters);
  const [sortKey, setSortKey] = useState<PoleSortKey>(initial.sortKey);
  const [sortDir, setSortDir] = useState<PoleSortDir>(initial.sortDir);
  const [currentPage, setCurrentPage] = useState<number>(initial.page);
  const [rowsPerPage, setRowsPerPage] = useState<number>(initial.limit);
  const [selectedPoleId, setSelectedPoleId] = useState<string | null>(initial.selectedPoleId);
  const [activeKpi, setActiveKpi] = useState<PoleKpiKey | null>(
    (initial.activeKpi as PoleKpiKey) || null
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [relocateTargetPole, setRelocateTargetPole] = useState<PoleWithRelations | null>(null);
  const [editTargetPole, setEditTargetPole] = useState<PoleWithRelations | null>(null);
  const [deleteTargetPole, setDeleteTargetPole] = useState<PoleWithRelations | null>(null);

  // Sync site filter when header site dropdown changes
  const prevHeaderSiteRef = useRef(selectedSite);
  useEffect(() => {
    if (prevHeaderSiteRef.current !== selectedSite) {
      prevHeaderSiteRef.current = selectedSite;
      setFilters((prev) => ({ ...prev, site: selectedSite }));
      setCurrentPage(1);
    }
  }, [selectedSite]);

  // Sync state -> URL query string + sessionStorage
  useEffect(() => {
    const params = buildPolesSearchParams({
      filters,
      sortKey,
      sortDir,
      page: currentPage,
      limit: rowsPerPage,
      selectedPoleId,
      activeKpi,
      defaultSite: selectedSite,
    });
    setSearchParams(params, { replace: true });
    const fullUrl =
      window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
    sessionStorage.setItem('last_poles_url', fullUrl);
  }, [
    filters,
    sortKey,
    sortDir,
    currentPage,
    rowsPerPage,
    selectedPoleId,
    activeKpi,
    selectedSite,
    setSearchParams,
  ]);

  const handleSetFilters: React.Dispatch<React.SetStateAction<PoleFilterState>> = useCallback(
    (action) => {
      setFilters(action);
      setCurrentPage(1);
    },
    []
  );

  const handleSortChange = useCallback((key: PoleSortKey, dir?: PoleSortDir) => {
    setSortKey(key);
    setSortDir(dir || 'asc');
    setCurrentPage(1);
  }, []);

  const handleHeaderSort = useCallback(
    (key: PoleSortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir(key === 'lastUpdatedAt' || key === 'registeredAt' ? 'desc' : 'asc');
      }
      setCurrentPage(1);
    },
    [sortKey]
  );

  const handleSelectKpi = useCallback((key: PoleKpiKey | null) => {
    setActiveKpi(key);
    setCurrentPage(1);
    if (!key) {
      setFilters((prev) => ({
        ...prev,
        statusTab: 'active',
        lifecycle: undefined,
        locationFilter: 'all',
        linkedDevice: 'all',
        withEvents30d: false,
      }));
      return;
    }
    if (key === 'active_poles') {
      setFilters((prev) => ({
        ...prev,
        statusTab: 'active',
        lifecycle: ['Active'],
        locationFilter: 'all',
        linkedDevice: 'all',
        withEvents30d: false,
      }));
    } else if (key === 'missing_location') {
      setFilters((prev) => ({
        ...prev,
        statusTab: 'active',
        lifecycle: undefined,
        locationFilter: 'missing_location',
        linkedDevice: 'all',
        withEvents30d: false,
      }));
    } else if (key === 'with_linked_device') {
      setFilters((prev) => ({
        ...prev,
        statusTab: 'active',
        lifecycle: undefined,
        locationFilter: 'all',
        linkedDevice: 'with',
        withEvents30d: false,
      }));
    } else if (key === 'with_events_30d') {
      setFilters((prev) => ({
        ...prev,
        statusTab: 'active',
        lifecycle: undefined,
        locationFilter: 'all',
        linkedDevice: 'all',
        withEvents30d: true,
      }));
    } else if (key === 'deleted') {
      setFilters((prev) => ({
        ...prev,
        statusTab: 'deleted',
        viewMode: 'table',
        lifecycle: undefined,
        locationFilter: 'all',
        linkedDevice: 'all',
        withEvents30d: false,
      }));
    }
  }, []);

  const handleClearKpi = useCallback(() => {
    setActiveKpi(null);
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveKpi(null);
    setFilters((prev) => ({
      ...prev,
      search: undefined,
      lifecycle: undefined,
      site: selectedSite,
      locationFilter: 'all',
      protection: undefined,
      linkedDevice: 'all',
      withEvents30d: false,
      updatedRange: 'all',
      hideTestRecords: false,
    }));
    setCurrentPage(1);
  }, [selectedSite]);

  const kpis = useMemo(
    () => getPoleKpiCounts(poles, filters.site),
    [poles, filters.site]
  );

  const statusCounts = useMemo(
    () =>
      getPoleStatusTabCounts(poles, {
        site: filters.site,
        search: filters.search,
        hideTestRecords: filters.hideTestRecords,
      }),
    [poles, filters.site, filters.search, filters.hideTestRecords]
  );

  const availableProtections = useMemo(() => {
    const set = new Set<string>();
    poles.forEach((p) => {
      if (p.protection && p.protection.trim()) set.add(p.protection.trim());
    });
    return Array.from(set).sort();
  }, [poles]);

  const filteredPoles = useMemo(
    () => filterPoles(poles, filters, getServerNow()),
    [poles, filters]
  );

  const sortedPoles = useMemo(
    () => sortPoles(filteredPoles, sortKey, sortDir),
    [filteredPoles, sortKey, sortDir]
  );

  const activeTotalCount = useMemo(
    () => poles.filter((p) => p.lifecycle !== 'Deleted').length,
    [poles]
  );

  const siteScopedCount = useMemo(() => {
    return poles.filter((p) => {
      if (filters.statusTab === 'deleted' ? p.lifecycle !== 'Deleted' : p.lifecycle === 'Deleted') {
        return false;
      }
      if (filters.site && filters.site !== 'ALL' && p.siteName !== filters.site) return false;
      return true;
    }).length;
  }, [poles, filters.statusTab, filters.site]);

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.lifecycle?.length ||
      (filters.locationFilter && filters.locationFilter !== 'all') ||
      filters.protection?.length ||
      (filters.linkedDevice && filters.linkedDevice !== 'all') ||
      filters.withEvents30d ||
      (filters.updatedRange && filters.updatedRange !== 'all') ||
      filters.hideTestRecords
  );

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAllPage = useCallback((all: boolean, pageIds: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (all) pageIds.forEach((id) => next.add(id));
      else pageIds.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const handleSelectAllResults = useCallback(() => {
    setSelectedIds(new Set(sortedPoles.map((p) => p.identifier)));
    addToast('info', `Selected all ${sortedPoles.length} poles.`);
  }, [sortedPoles, addToast]);

  const handleExport = useCallback(() => {
    if (sortedPoles.length === 0) {
      addToast('info', 'No poles to export for current filter criteria.');
      return;
    }
    const dateStr = new Date().toISOString().split('T')[0];
    exportPolesToCsv(sortedPoles, `falcon_poles_${dateStr}.csv`);
    addToast('success', `Exported ${sortedPoles.length} poles to CSV.`);
  }, [sortedPoles, addToast]);

  const handleExportSelected = useCallback(() => {
    const selectedList = sortedPoles.filter((p) => selectedIds.has(p.identifier));
    if (selectedList.length === 0) return;
    const dateStr = new Date().toISOString().split('T')[0];
    exportPolesToCsv(selectedList, `falcon_poles_selected_${dateStr}.csv`);
    addToast('success', `Exported ${selectedList.length} selected poles to CSV.`);
  }, [sortedPoles, selectedIds, addToast]);

  // Action handlers
  const handleRegisterOpen = useCallback(() => {
    setIsRegisterOpen(true);
  }, []);

  const handleViewOnMap = useCallback((pole: PoleWithRelations) => {
    setSelectedPoleId(pole.identifier);
    setFilters((prev) => ({ ...prev, statusTab: 'active', viewMode: 'map' }));
  }, []);

  const handleRelocateOpen = useCallback((pole: PoleWithRelations) => {
    setRelocateTargetPole(pole);
  }, []);

  const handleEditOpen = useCallback((pole: PoleWithRelations) => {
    setEditTargetPole(pole);
  }, []);

  const handleDeleteOpen = useCallback((pole: PoleWithRelations) => {
    setDeleteTargetPole(pole);
  }, []);

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-16">
      <PolesPageHeader
        isRefreshing={isRefreshing}
        onRefresh={refreshAssets}
        onExport={handleExport}
        exportDisabled={sortedPoles.length === 0}
        onRegisterPole={handleRegisterOpen}
        permissions={permissions}
      />

      <AssetsModuleTabs
        activeTab="poles"
        polesCount={activeTotalCount}
        cableSpansCount={cableSpans.length}
      />

      <PolesKpiStrip
        kpis={kpis}
        activeKpi={activeKpi}
        onSelectKpi={handleSelectKpi}
        showEventsQuery={true}
        isLoading={isLoading}
      />

      <PolesToolbar
        filters={filters}
        setFilters={handleSetFilters}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={handleSortChange}
        statusCounts={statusCounts}
        filteredCount={sortedPoles.length}
        sites={sites}
        availableProtections={availableProtections}
        hasTestFlag={hasTestFlag}
        activeKpi={activeKpi}
        onClearKpi={handleClearKpi}
        defaultSite={selectedSite}
      />

      {filters.statusTab === 'deleted' ? (
        <PolesDeletedView
          poles={sortedPoles}
          capabilities={capabilities}
          permissions={permissions}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearAllFilters}
          onRestore={async (pole) => {
            const res = await restorePole(pole.identifier);
            if (res.ok) {
              addToast('success', `Restored pole ${pole.identifier}.`);
            } else {
              addToast('error', res.error || 'Unable to restore pole.');
            }
          }}
        />
      ) : filters.statusTab === 'active' && filters.viewMode === 'map' ? (
        <PolesMapView
          poles={sortedPoles}
          cableSpans={cableSpans}
          sites={sites}
          activeSiteFilter={filters.site}
          selectedPoleId={selectedPoleId}
          onSelectPole={setSelectedPoleId}
          onRelocate={handleRelocateOpen}
          permissions={permissions}
        />
      ) : (
        <PolesTableView
          poles={sortedPoles}
          totalActiveDatasetCount={siteScopedCount}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAllPage={handleSelectAllPage}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleHeaderSort}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearAllFilters}
          onRegisterPole={handleRegisterOpen}
          onViewOnMap={handleViewOnMap}
          onRelocate={handleRelocateOpen}
          onEdit={handleEditOpen}
          onDelete={handleDeleteOpen}
          permissions={permissions}
          recentlyCreatedId={recentlyCreatedId}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onRetry={retryLoad}
        />
      )}

      <PolesBulkActionBar
        selectedCount={selectedIds.size}
        totalCount={sortedPoles.length}
        isAllResultsSelected={
          sortedPoles.length > 0 && selectedIds.size >= sortedPoles.length
        }
        onSelectAllResults={handleSelectAllResults}
        onExportSelected={handleExportSelected}
        onClear={() => setSelectedIds(new Set())}
        permissions={permissions}
      />

      <RegisterPoleDialog
        open={isRegisterOpen}
        onOpenChange={(next) => {
          setIsRegisterOpen(next);
          if (!next) {
            setCurrentPage(1);
          }
        }}
        onOpenPole={(id) => navigate(`/assets/poles/${encodeURIComponent(id)}`)}
      />

      <RelocatePoleDialog
        pole={relocateTargetPole}
        open={Boolean(relocateTargetPole)}
        onOpenChange={(next) => {
          if (!next) setRelocateTargetPole(null);
        }}
      />

      <EditPoleDialog
        pole={editTargetPole}
        open={Boolean(editTargetPole)}
        onOpenChange={(next) => {
          if (!next) setEditTargetPole(null);
        }}
      />

      <DeletePoleDialog
        pole={deleteTargetPole}
        open={Boolean(deleteTargetPole)}
        onOpenChange={(next) => {
          if (!next) setDeleteTargetPole(null);
        }}
        onViewLinkedDevices={() => {
          if (deleteTargetPole) {
            navigate(`/assets/poles/${encodeURIComponent(deleteTargetPole.identifier)}?tab=devices`);
          }
        }}
        onViewCableSpans={() => {
          if (deleteTargetPole) {
            navigate(`/assets/poles/${encodeURIComponent(deleteTargetPole.identifier)}?tab=spans`);
          }
        }}
        onDeleted={() => {
          setFilters((prev) => ({ ...prev, statusTab: 'deleted', viewMode: 'table' }));
        }}
      />
    </div>
  );
}
