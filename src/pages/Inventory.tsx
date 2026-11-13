import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAssets } from '@/contexts/AssetsContext';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { AssetsModuleTabs } from '@/components/assets/AssetsModuleTabs';
import { DevicesPageHeader } from '@/components/assets/devices/DevicesPageHeader';
import { DevicesKpiStrip, type DeviceKpiKey } from '@/components/assets/devices/DevicesKpiStrip';
import { DevicesToolbar } from '@/components/assets/devices/DevicesToolbar';
import { DevicesTableView } from '@/components/assets/devices/DevicesTableView';
import { DevicesMapView } from '@/components/assets/devices/DevicesMapView';
import { DevicesBulkActionBar } from '@/components/assets/devices/DevicesBulkActionBar';
import { ManageInstallationDialog } from '@/components/assets/devices/ManageInstallationDialog';
import {
  filterDevices,
  sortDevices,
  getDeviceKpiCounts,
  getDeviceStatusTabCounts,
  parseDevicesUrlState,
  buildDevicesSearchParams,
  exportDevicesToCsv,
} from '@/data/deviceSelectors';
import { getServerNow } from '@/lib/dateTime';
import type {
  DeviceFilterState,
  DeviceSortDir,
  DeviceSortKey,
  DeviceWithRelations,
} from '@/types/devices';

export default function Inventory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectedSite } = useAppContext();
  const {
    sites,
    poles,
    cableSpans,
    richDevices,
    vendorRecords,
    devicePolicyConfig,
    devicePermissions,
    hasTestFlag,
    isLoading,
    isRefreshing,
    errorMessage,
    recentlyCreatedDeviceId,
    refreshAssets,
    retryLoad,
    runConnectionCheck,
  } = useAssets();
  const { addToast } = useToast();

  const initial = useMemo(
    () => parseDevicesUrlState(searchParams, selectedSite),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [filters, setFilters] = useState<DeviceFilterState>(initial.filters);
  const [sortKey, setSortKey] = useState<DeviceSortKey>(initial.sortKey);
  const [sortDir, setSortDir] = useState<DeviceSortDir>(initial.sortDir);
  const [currentPage, setCurrentPage] = useState<number>(initial.page);
  const [rowsPerPage, setRowsPerPage] = useState<number>(initial.limit);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(initial.selectedDeviceId);
  const [activeKpi, setActiveKpi] = useState<DeviceKpiKey | null>(
    (initial.activeKpi as DeviceKpiKey) || null
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [installTarget, setInstallTarget] = useState<DeviceWithRelations | null>(null);

  // Keep selected site in sync when header dropdown changes
  const prevSiteRef = useRef(selectedSite);
  useEffect(() => {
    if (prevSiteRef.current !== selectedSite) {
      prevSiteRef.current = selectedSite;
      setFilters((p) => ({ ...p, site: selectedSite }));
      setCurrentPage(1);
    }
  }, [selectedSite]);

  // Bidirectional URL sync + session memory
  useEffect(() => {
    const params = buildDevicesSearchParams({
      filters,
      sortKey,
      sortDir,
      page: currentPage,
      limit: rowsPerPage,
      selectedDeviceId,
      activeKpi,
      defaultSite: selectedSite,
    });
    setSearchParams(params, { replace: true });
    const fullUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
    sessionStorage.setItem('last_devices_url', fullUrl);
  }, [
    filters,
    sortKey,
    sortDir,
    currentPage,
    rowsPerPage,
    selectedDeviceId,
    activeKpi,
    selectedSite,
    setSearchParams,
  ]);

  const handleSetFilters: React.Dispatch<React.SetStateAction<DeviceFilterState>> = useCallback(
    (action) => {
      setFilters(action);
      setCurrentPage(1);
    },
    []
  );

  const activePolesCount = useMemo(
    () => poles.filter((p) => p.lifecycle !== 'Deleted').length,
    [poles]
  );

  const availableManufacturers = useMemo(
    () => Array.from(new Set(richDevices.map((d) => d.manufacturer))).sort(),
    [richDevices]
  );

  const availableLibraries = useMemo(
    () => Array.from(new Set(richDevices.map((d) => d.library))).sort(),
    [richDevices]
  );

  const activeSiteScope = filters.site || selectedSite;

  const kpis = useMemo(
    () => getDeviceKpiCounts(richDevices, activeSiteScope),
    [richDevices, activeSiteScope]
  );

  // Status tab counts exclude the status tab itself so all 5 tabs show live reachable totals
  const statusTabCounts = useMemo(() => {
    const now = getServerNow();
    const baseFiltered = filterDevices(
      richDevices,
      { ...filters, statusTab: 'all' },
      now
    );
    return getDeviceStatusTabCounts(baseFiltered);
  }, [richDevices, filters]);

  const filteredDevices = useMemo(() => {
    const now = getServerNow();
    return filterDevices(richDevices, filters, now);
  }, [richDevices, filters]);

  const sortedDevices = useMemo(
    () => sortDevices(filteredDevices, sortKey, sortDir),
    [filteredDevices, sortKey, sortDir]
  );

  const handleSort = useCallback(
    (key: DeviceSortKey, explicitDir?: DeviceSortDir) => {
      if (explicitDir) {
        setSortKey(key);
        setSortDir(explicitDir);
        return;
      }
      if (sortKey === key) {
        setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir(key === 'events30dCount' ? 'desc' : 'asc');
      }
    },
    [sortKey]
  );

  const handleSelectKpi = useCallback(
    (kpi: DeviceKpiKey | null) => {
      setActiveKpi(kpi);
      setCurrentPage(1);
      if (!kpi || kpi === 'total') {
        setFilters((p) => ({
          ...p,
          statusTab: 'all',
          installationFilter: 'all',
          needsAttentionOnly: false,
        }));
        return;
      }
      if (kpi === 'online' || kpi === 'offline' || kpi === 'stale') {
        setFilters((p) => ({
          ...p,
          statusTab: kpi,
          installationFilter: 'all',
          needsAttentionOnly: false,
        }));
      } else if (kpi === 'not_installed') {
        setFilters((p) => ({
          ...p,
          statusTab: 'not_installed',
          installationFilter: 'all',
          needsAttentionOnly: false,
        }));
      } else if (kpi === 'needs_attention') {
        setFilters((p) => ({
          ...p,
          statusTab: 'all',
          installationFilter: 'all',
          needsAttentionOnly: true,
        }));
      }
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setActiveKpi(null);
    setCurrentPage(1);
    setFilters((p) => ({
      statusTab: 'all',
      viewMode: p.viewMode,
      search: '',
      types: [],
      manufacturers: [],
      libraries: [],
      lifecycle: [],
      site: selectedSite,
      installationFilter: 'all',
      lastContactRange: 'all',
      configFilter: 'all',
      needsAttentionOnly: false,
      hideTestRecords: false,
    }));
  }, [selectedSite]);

  const hasActiveFilters = Boolean(
    filters.search?.trim() ||
      filters.statusTab !== 'all' ||
      (filters.types?.length || 0) > 0 ||
      (filters.manufacturers?.length || 0) > 0 ||
      (filters.libraries?.length || 0) > 0 ||
      (filters.lifecycle?.length || 0) > 0 ||
      (filters.installationFilter && filters.installationFilter !== 'all') ||
      (filters.lastContactRange && filters.lastContactRange !== 'all') ||
      (filters.configFilter && filters.configFilter !== 'all') ||
      filters.needsAttentionOnly ||
      filters.hideTestRecords ||
      (filters.site && filters.site !== selectedSite)
  );

  const vendorConflictCount = useMemo(
    () => vendorRecords.filter((v) => v.matchStatus === 'Conflict').length,
    [vendorRecords]
  );
  const vendorUnregisteredCount = useMemo(
    () => vendorRecords.filter((v) => v.matchStatus === 'Not registered').length,
    [vendorRecords]
  );

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllPage = (checked: boolean, pageIds: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        for (const id of pageIds) next.add(id);
      } else {
        for (const id of pageIds) next.delete(id);
      }
      return next;
    });
  };

  const handleSelectAllResults = () => {
    setSelectedIds(new Set(sortedDevices.map((d) => d.identifier)));
  };

  const handleExportAll = () => {
    exportDevicesToCsv(sortedDevices);
    addToast('success', `Exported ${sortedDevices.length} device rows to CSV.`);
  };

  const handleExportSelected = () => {
    const selectedRows = sortedDevices.filter((d) => selectedIds.has(d.identifier));
    exportDevicesToCsv(selectedRows, 'falcon_devices_selected');
    addToast('success', `Exported ${selectedRows.length} selected devices to CSV.`);
  };

  const handleViewOnMap = (device: DeviceWithRelations) => {
    setSelectedDeviceId(device.identifier);
    handleSetFilters((p) => ({ ...p, viewMode: 'map' }));
  };

  const handleManageInstallation = (device: DeviceWithRelations) => {
    setInstallTarget(device);
  };

  return (
    <div className="space-y-4">
      <DevicesPageHeader
        isRefreshing={isRefreshing}
        onRefresh={refreshAssets}
        onExport={handleExportAll}
        exportDisabled={sortedDevices.length === 0}
        onOpenVendorDiscovery={() => navigate('/assets/inventory/vendor-discovery')}
        vendorConflictCount={vendorConflictCount}
        vendorUnregisteredCount={vendorUnregisteredCount}
        onRegisterDevice={() => navigate('/assets/inventory/devices/new')}
        permissions={devicePermissions}
      />

      <AssetsModuleTabs
        activeTab="devices"
        polesCount={activePolesCount}
        cableSpansCount={cableSpans.length}
        devicesCount={richDevices.length}
      />

      <DevicesKpiStrip
        kpis={kpis}
        activeKpi={activeKpi}
        onSelectKpi={handleSelectKpi}
        isLoading={isLoading}
      />

      <DevicesToolbar
        filters={filters}
        setFilters={handleSetFilters}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={handleSort}
        statusCounts={statusTabCounts}
        filteredCount={sortedDevices.length}
        totalCount={kpis.total}
        sites={sites}
        availableManufacturers={availableManufacturers}
        availableLibraries={availableLibraries}
        hasTestFlag={hasTestFlag}
        activeKpi={activeKpi}
        onClearKpi={() => setActiveKpi(null)}
        defaultSite={selectedSite}
      />

      {filters.viewMode === 'map' ? (
        <DevicesMapView
          devices={sortedDevices}
          poles={poles}
          cableSpans={cableSpans}
          sites={sites}
          activeSiteFilter={filters.site}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={setSelectedDeviceId}
          onManageInstallation={handleManageInstallation}
          policyConfig={devicePolicyConfig}
          permissions={devicePermissions}
        />
      ) : (
        <DevicesTableView
          devices={sortedDevices}
          totalDatasetCount={richDevices.length}
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
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          onRegisterDevice={() => navigate('/assets/inventory/devices/new')}
          onViewOnMap={handleViewOnMap}
          onManageInstallation={handleManageInstallation}
          onRunConnectionCheck={(d) => runConnectionCheck(d.identifier)}
          policyConfig={devicePolicyConfig}
          permissions={devicePermissions}
          recentlyCreatedDeviceId={recentlyCreatedDeviceId}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onRetry={retryLoad}
        />
      )}

      <DevicesBulkActionBar
        selectedCount={selectedIds.size}
        totalCount={sortedDevices.length}
        isAllResultsSelected={
          sortedDevices.length > 0 && sortedDevices.every((d) => selectedIds.has(d.identifier))
        }
        onSelectAllResults={handleSelectAllResults}
        onExportSelected={handleExportSelected}
        onClear={() => setSelectedIds(new Set())}
        permissions={devicePermissions}
      />

      <ManageInstallationDialog
        device={installTarget}
        open={Boolean(installTarget)}
        onOpenChange={(open) => {
          if (!open) setInstallTarget(null);
        }}
      />
    </div>
  );
}
