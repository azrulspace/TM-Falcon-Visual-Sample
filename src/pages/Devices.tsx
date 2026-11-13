import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDevices } from '@/contexts/DevicesContext';
import { useAssets } from '@/contexts/AssetsContext';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { DevicesPageHeader } from '@/components/devices/DevicesPageHeader';
import { AssetsModuleTabs } from '@/components/assets/AssetsModuleTabs';
import { DevicesKpiStrip, type DeviceKpiKey } from '@/components/devices/DevicesKpiStrip';
import { DevicesToolbar } from '@/components/devices/DevicesToolbar';
import { DevicesTableView } from '@/components/devices/DevicesTableView';
import { DevicesMapView } from '@/components/devices/DevicesMapView';
import { DevicesBulkActionBar } from '@/components/devices/DevicesBulkActionBar';
import {
  filterDevices,
  sortDevices,
  getDeviceKpiCounts,
  getDeviceStatusTabCounts,
  parseDevicesUrlState,
  buildDevicesSearchParams,
  exportDevicesToCsv,
} from '@/data/deviceSelectors';
import type {
  DeviceFilterState,
  DeviceSortKey,
  DeviceSortDir,
} from '@/types/devices';

export default function Devices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectedSite } = useAppContext();
  const { sites, poles, cableSpans } = useAssets();
  const {
    devices,
    vendorDevices,
    isRefreshing,
    errorMessage,
    recentlyCreatedId,
    refreshDevices,
  } = useDevices();
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
  const [activeKpi, setActiveKpi] = useState<DeviceKpiKey | null>(
    (initial.activeKpi as DeviceKpiKey) || null
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedMapDeviceId, setSelectedMapDeviceId] = useState<string | null>(
    initial.selectedDeviceId || null
  );

  // Count conflicts in vendor devices for the header badge
  const conflictCount = useMemo(() => {
    return vendorDevices.filter((v) => v.matchStatus === 'Conflict').length;
  }, [vendorDevices]);

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
    const params = buildDevicesSearchParams({
      filters,
      sortKey,
      sortDir,
      page: currentPage,
      limit: rowsPerPage,
      selectedDeviceId: selectedMapDeviceId,
      activeKpi,
      defaultSite: selectedSite,
    });
    setSearchParams(params, { replace: true });
    const fullUrl =
      window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
    sessionStorage.setItem('last_devices_url', fullUrl);
  }, [
    filters,
    sortKey,
    sortDir,
    currentPage,
    rowsPerPage,
    selectedMapDeviceId,
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

  const handleSortChange = useCallback((key: DeviceSortKey, dir?: DeviceSortDir) => {
    setSortKey(key);
    setSortDir(dir || 'asc');
    setCurrentPage(1);
  }, []);

  const handleSelectKpi = useCallback((key: DeviceKpiKey | null) => {
    setActiveKpi(key);
    setCurrentPage(1);
    if (!key) {
      setFilters((prev) => ({
        ...prev,
        statusTab: 'all',
        installation: 'all',
        lastContactRange: 'all',
        configStatus: 'all',
      }));
      return;
    }

    if (key === 'total') {
      setFilters((prev) => ({ ...prev, statusTab: 'all' }));
    } else if (key === 'online') {
      setFilters((prev) => ({ ...prev, statusTab: 'online' }));
    } else if (key === 'offline') {
      setFilters((prev) => ({ ...prev, statusTab: 'offline' }));
    } else if (key === 'stale') {
      setFilters((prev) => ({ ...prev, statusTab: 'stale' }));
    } else if (key === 'not_installed') {
      setFilters((prev) => ({ ...prev, installation: 'not_installed' }));
    } else if (key === 'needs_attention') {
      // offline + stale
      setFilters((prev) => ({ ...prev, lastContactRange: 'older_24h' }));
    } else if (key === 'config_issues') {
      setFilters((prev) => ({ ...prev, configStatus: 'failed' }));
    }
  }, []);

  const handleClearKpi = useCallback(() => {
    setActiveKpi(null);
  }, []);

  // Filter and sort devices
  const filteredDevices = useMemo(() => {
    return filterDevices(devices, filters, selectedSite);
  }, [devices, filters, selectedSite]);

  const sortedDevices = useMemo(() => {
    return sortDevices(filteredDevices, sortKey, sortDir);
  }, [filteredDevices, sortKey, sortDir]);

  // Derived KPI & Status Tab counts
  const kpiCounts = useMemo(() => {
    return getDeviceKpiCounts(devices, selectedSite);
  }, [devices, selectedSite]);

  const statusTabCounts = useMemo(() => {
    return getDeviceStatusTabCounts(devices, filters, selectedSite);
  }, [devices, filters, selectedSite]);

  // Selection handlers
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
      if (all) {
        for (const id of pageIds) next.add(id);
      } else {
        for (const id of pageIds) next.delete(id);
      }
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Export handlers
  const handleExportAll = useCallback(() => {
    if (filteredDevices.length === 0) return;
    const csv = exportDevicesToCsv(filteredDevices);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `falcon_devices_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', `Exported ${filteredDevices.length} devices to CSV.`);
  }, [filteredDevices, addToast]);

  const handleExportSelected = useCallback(() => {
    const selectedList = devices.filter((d) => selectedIds.has(d.identifier));
    if (selectedList.length === 0) return;
    const csv = exportDevicesToCsv(selectedList);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `falcon_devices_selected_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', `Exported ${selectedList.length} selected devices to CSV.`);
  }, [devices, selectedIds, addToast]);

  const handleClearFilters = useCallback(() => {
    setFilters({
      statusTab: 'all',
      viewMode: filters.viewMode,
      site: selectedSite,
    });
    setActiveKpi(null);
  }, [filters.viewMode, selectedSite]);

  return (
    <div className="flex flex-col min-h-full pb-20">
      {/* 5.1 Shell and Header */}
      <DevicesPageHeader
        title="Devices"
        subtitle="Cameras and speakers registered on a site."
        moduleBreadcrumbLabel="Devices"
        isRefreshing={isRefreshing}
        onRefresh={refreshDevices}
        onExport={handleExportAll}
        exportDisabled={filteredDevices.length === 0}
        conflictCount={conflictCount}
        onRegisterDevice={() => navigate('/assets/devices/new')}
      />

      {/* Module tab bar (Poles, Cable spans, Devices with counts) */}
      <AssetsModuleTabs
        activeTab="devices"
        polesCount={poles.length}
        cableSpansCount={cableSpans.length}
        devicesCount={devices.length}
      />

      {/* 5.2 KPI Strip */}
      <DevicesKpiStrip
        kpis={kpiCounts}
        activeKpi={activeKpi}
        onSelectKpi={handleSelectKpi}
      />

      {/* 5.3 & 5.4 Tabs & Toolbar */}
      <DevicesToolbar
        filters={filters}
        setFilters={handleSetFilters}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={handleSortChange}
        statusCounts={statusTabCounts}
        filteredCount={filteredDevices.length}
        activeKpi={activeKpi}
        onClearKpi={handleClearKpi}
        defaultSite={selectedSite}
      />

      {/* View router: Table vs Map */}
      {filters.viewMode === 'map' ? (
        <DevicesMapView
          devices={sortedDevices}
          sites={sites}
          activeSiteFilter={filters.site}
          selectedDeviceId={selectedMapDeviceId}
          onSelectDevice={setSelectedMapDeviceId}
          onManageInstallation={(device) => {
            navigate(`/assets/devices/${device.identifier}?action=install`);
          }}
        />
      ) : (
        <DevicesTableView
          devices={sortedDevices}
          totalActiveDatasetCount={devices.length}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAllPage={handleSelectAllPage}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSortChange}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          hasActiveFilters={filteredDevices.length !== devices.length}
          onClearFilters={handleClearFilters}
          onRegisterDevice={() => navigate('/assets/devices/new')}
          onViewOnMap={() => {
            setFilters((prev) => ({ ...prev, viewMode: 'map' }));
          }}
          onManageInstallation={(device) => {
            navigate(`/assets/devices/${device.identifier}?action=install`);
          }}
          onEdit={(device) => {
            navigate(`/assets/devices/${device.identifier}/edit`);
          }}
          recentlyCreatedId={recentlyCreatedId}
          errorMessage={errorMessage}
          onRetry={refreshDevices}
        />
      )}

      {/* 5.5 Bulk Action Bar */}
      <DevicesBulkActionBar
        selectedCount={selectedIds.size}
        onClearSelection={handleClearSelection}
        onExportSelected={handleExportSelected}
      />
    </div>
  );
}
