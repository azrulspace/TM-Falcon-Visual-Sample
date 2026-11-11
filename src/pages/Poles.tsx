import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAssets } from '@/contexts/AssetsContext';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { PolesPageHeader } from '@/components/assets/PolesPageHeader';
import { AssetsModuleTabs } from '@/components/assets/AssetsModuleTabs';
import { PolesKpiStrip, type PoleKpiKey } from '@/components/assets/PolesKpiStrip';
import { PolesToolbar } from '@/components/assets/PolesToolbar';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  filterPoles,
  sortPoles,
  getPoleKpiCounts,
  getPoleStatusTabCounts,
  parsePolesUrlState,
  buildPolesSearchParams,
  exportPolesToCsv,
} from '@/data/poleSelectors';
import { formatCoordinates } from '@/lib/geo';
import { getServerNow } from '@/lib/dateTime';
import type { PoleFilterState, PoleSortKey, PoleSortDir } from '@/types/assets';

export default function Poles() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedSite } = useAppContext();
  const {
    sites,
    poles,
    cableSpans,
    permissions,
    hasTestFlag,
    isLoading,
    isRefreshing,
    refreshAssets,
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
  const [rowsPerPage] = useState<number>(initial.limit);
  const [selectedPoleId] = useState<string | null>(initial.selectedPoleId);
  const [activeKpi, setActiveKpi] = useState<PoleKpiKey | null>(
    (initial.activeKpi as PoleKpiKey) || null
  );

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

  const handleSelectKpi = useCallback(
    (key: PoleKpiKey | null) => {
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
    },
    []
  );

  const handleClearKpi = useCallback(() => {
    setActiveKpi(null);
  }, []);

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

  const handleExport = useCallback(() => {
    if (sortedPoles.length === 0) {
      addToast('info', 'No poles to export for current filter criteria.');
      return;
    }
    const dateStr = new Date().toISOString().split('T')[0];
    exportPolesToCsv(sortedPoles, `falcon_poles_${dateStr}.csv`);
    addToast('success', `Exported ${sortedPoles.length} poles to CSV.`);
  }, [sortedPoles, addToast]);

  const handleRegisterPlaceholder = useCallback(() => {
    addToast('info', 'Register pole modal will be connected in Phase 4.');
  }, [addToast]);

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-10">
      <PolesPageHeader
        isRefreshing={isRefreshing}
        onRefresh={refreshAssets}
        onExport={handleExport}
        exportDisabled={sortedPoles.length === 0}
        onRegisterPole={handleRegisterPlaceholder}
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

      {/* Phase 1 content preview container (full Table View in Phase 2, Map View in Phase 3, Deleted View in Phase 8) */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">
            {filters.statusTab === 'deleted'
              ? 'Deleted poles'
              : filters.viewMode === 'map'
              ? 'Poles map view (Phase 3)'
              : 'Poles table view'}
          </span>
          <span className="font-mono text-muted-foreground">
            {sortedPoles.length} matching records
          </span>
        </div>
        <div className="divide-y divide-border">
          {sortedPoles.slice(0, 10).map((p) => (
            <div
              key={p.identifier}
              className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Link
                  to={`/assets/poles/${encodeURIComponent(p.identifier)}`}
                  className="font-mono font-semibold text-primary hover:underline"
                >
                  {p.identifier}
                </Link>
                {p.name !== p.identifier && (
                  <span className="text-muted-foreground truncate">{p.name}</span>
                )}
                <StatusBadge status={p.lifecycle} size="sm" />
              </div>
              <div className="flex items-center gap-4 text-muted-foreground font-mono shrink-0">
                <span>{p.siteName}</span>
                <span>{formatCoordinates(p.location)}</span>
              </div>
            </div>
          ))}
          {sortedPoles.length === 0 && (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No poles match the current filter criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

