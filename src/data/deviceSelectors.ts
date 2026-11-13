import type {
  DeviceRecord,
  DeviceFilterState,
  DeviceSortKey,
  DeviceSortDir,
  DeviceAvailabilityMetrics,
  DeviceConnectivityState,
} from '../types/devices.ts';
import { parseDate, getServerNow, formatAbsoluteMYT, formatRelativeTime } from '../lib/dateTime.ts';

/**
 * Standard telemetry freshness threshold in minutes (24 hours).
 * If device has not communicated within 24h, it is considered stale/unfresh.
 */
export const TELEMETRY_FRESHNESS_THRESHOLD_MINUTES = 24 * 60; // 1440 min

/**
 * Evaluates last contact freshness and detects data contradictions.
 * Invariant: If a device is marked "online" but has not reported in > 24 hours,
 * a "No recent contact" warning chip is displayed without altering the underlying telemetry state.
 */
export function evaluateDeviceFreshness(
  device: Pick<DeviceRecord, 'state' | 'lastContact' | 'lastContactIso'>,
  now: Date = getServerNow()
): {
  isStaleContact: boolean;
  hoursSinceLastContact: number;
  relativeText: string;
  absoluteText: string;
  showWarningChip: boolean;
  contradiction: boolean;
  contradictionReason?: string;
} {
  const parsed = parseDate(device.lastContactIso || device.lastContact);
  if (!parsed) {
    return {
      isStaleContact: true,
      hoursSinceLastContact: 9999,
      relativeText: device.lastContact || 'Never',
      absoluteText: 'No recorded timestamp',
      showWarningChip: device.state === 'online',
      contradiction: device.state === 'online',
      contradictionReason: 'Device marked Online with no valid telemetry timestamp.',
    };
  }

  const diffMs = Math.max(0, now.getTime() - parsed.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const hoursSinceLastContact = Math.floor(diffMinutes / 60);
  const isStaleContact = diffMinutes > TELEMETRY_FRESHNESS_THRESHOLD_MINUTES;

  const relativeText = formatRelativeTime(parsed, now);
  const absoluteText = formatAbsoluteMYT(parsed);

  const contradiction = device.state === 'online' && isStaleContact;
  const showWarningChip = contradiction;
  const contradictionReason = contradiction
    ? `Data contradiction: Device is marked Online but last contact was ${relativeText} (${absoluteText}).`
    : undefined;

  return {
    isStaleContact,
    hoursSinceLastContact,
    relativeText,
    absoluteText,
    showWarningChip,
    contradiction,
    contradictionReason,
  };
}

/**
 * Computes truthful availability metrics from stored historical connectivity periods.
 * Never invents numbers: calculates directly from interval durations.
 */
export function computeAvailabilityMetrics(
  periods: DeviceRecord['connectivityHistory']
): DeviceAvailabilityMetrics {
  if (!periods || periods.length === 0) {
    return {
      totalRecordsCount: 0,
      onlinePercent: 0,
      stalePercent: 0,
      offlinePercent: 0,
      stateChangesCount: 0,
      longestOfflineMinutes: 0,
      computationBasis: 'From 0 connectivity records',
    };
  }

  let totalMinutes = 0;
  let onlineMinutes = 0;
  let staleMinutes = 0;
  let offlineMinutes = 0;
  let longestOfflineMinutes = 0;
  let stateChanges = 0;

  for (let i = 0; i < periods.length; i++) {
    const p = periods[i];
    const duration = Math.max(0, p.durationMinutes || 0);
    totalMinutes += duration;

    if (p.status === 'online') {
      onlineMinutes += duration;
    } else if (p.status === 'stale') {
      staleMinutes += duration;
    } else if (p.status === 'offline') {
      offlineMinutes += duration;
      if (duration > longestOfflineMinutes) {
        longestOfflineMinutes = duration;
      }
    }

    if (i > 0 && periods[i].status !== periods[i - 1].status) {
      stateChanges++;
    }
  }

  const safeTotal = totalMinutes > 0 ? totalMinutes : 1;
  const onlinePercent = Math.round((onlineMinutes / safeTotal) * 100);
  const stalePercent = Math.round((staleMinutes / safeTotal) * 100);
  const offlinePercent = Math.max(0, 100 - onlinePercent - stalePercent);

  return {
    totalRecordsCount: periods.length,
    onlinePercent,
    stalePercent,
    offlinePercent,
    stateChangesCount: stateChanges,
    longestOfflineMinutes,
    computationBasis: `From ${periods.length} connectivity records (${Math.round(totalMinutes / 60)} hours tracked)`,
  };
}

export interface DeviceKpiCounts {
  total: number;
  online: number;
  offline: number;
  stale: number;
  notInstalled: number;
  needsAttention: number; // offline + stale
  configIssues: number; // pending or failed
}

export interface DeviceStatusTabCounts {
  all: number;
  online: number;
  offline: number;
  stale: number;
}

/**
 * Computes KPI strip counts strictly from real fields.
 */
export function getDeviceKpiCounts(
  devices: DeviceRecord[],
  siteFilter?: string
): DeviceKpiCounts {
  const scoped = !siteFilter || siteFilter === 'ALL'
    ? devices
    : devices.filter((d) => d.siteName === siteFilter || d.siteId === siteFilter);

  let online = 0;
  let offline = 0;
  let stale = 0;
  let notInstalled = 0;
  let configIssues = 0;

  for (const d of scoped) {
    if (d.state === 'online') online++;
    else if (d.state === 'offline') offline++;
    else if (d.state === 'stale') stale++;

    if (!d.installedOnPoleId) notInstalled++;

    if (d.configStatus === 'Failed' || d.configStatus === 'Pending') {
      configIssues++;
    }
  }

  return {
    total: scoped.length,
    online,
    offline,
    stale,
    notInstalled,
    needsAttention: offline + stale,
    configIssues,
  };
}

/**
 * Computes status tab counts matching the active filters (except statusTab itself).
 */
export function getDeviceStatusTabCounts(
  devices: DeviceRecord[],
  filters: DeviceFilterState,
  siteFilter?: string
): DeviceStatusTabCounts {
  const filtered = filterDevices(devices, { ...filters, statusTab: 'all' }, siteFilter);

  let online = 0;
  let offline = 0;
  let stale = 0;

  for (const d of filtered) {
    if (d.state === 'online') online++;
    else if (d.state === 'offline') offline++;
    else if (d.state === 'stale') stale++;
  }

  return {
    all: filtered.length,
    online,
    offline,
    stale,
  };
}

/**
 * Filter devices list with full toolbar and popover support.
 */
export function filterDevices(
  devices: DeviceRecord[],
  filters: DeviceFilterState,
  headerSite?: string
): DeviceRecord[] {
  const effectiveSite = filters.site && filters.site !== 'ALL'
    ? filters.site
    : headerSite && headerSite !== 'ALL'
    ? headerSite
    : undefined;

  return devices.filter((d) => {
    // 1. Status tab
    if (filters.statusTab !== 'all' && d.state !== filters.statusTab) {
      return false;
    }

    // 2. Site
    if (effectiveSite && d.siteName !== effectiveSite && d.siteId !== effectiveSite) {
      return false;
    }

    // 3. Search (identifier, name, model, serial)
    if (filters.search && filters.search.trim().length > 0) {
      const q = filters.search.toLowerCase().trim();
      const matchId = d.identifier.toLowerCase().includes(q);
      const matchName = d.name.toLowerCase().includes(q);
      const matchModel = d.model.toLowerCase().includes(q);
      const matchSerial = (d.serialNumber || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchModel && !matchSerial) {
        return false;
      }
    }

    // 4. Hardware Type
    if (filters.type && filters.type.length > 0) {
      if (!filters.type.includes(d.type)) {
        return false;
      }
    }

    // 5. Vendor / Manufacturer
    if (filters.vendor && filters.vendor.length > 0) {
      if (!filters.vendor.includes(d.manufacturer)) {
        return false;
      }
    }

    // 6. Library
    if (filters.library && filters.library.length > 0) {
      if (!filters.library.includes(d.library)) {
        return false;
      }
    }

    // 7. Installation (Installed vs Not installed)
    if (filters.installation && filters.installation !== 'all') {
      const isInstalled = !!d.installedOnPoleId;
      if (filters.installation === 'installed' && !isInstalled) return false;
      if (filters.installation === 'not_installed' && isInstalled) return false;
    }

    // 8. Last contact range
    if (filters.lastContactRange && filters.lastContactRange !== 'all') {
      const freshness = evaluateDeviceFreshness(d);
      if (filters.lastContactRange === '1h' && freshness.hoursSinceLastContact > 1) return false;
      if (filters.lastContactRange === '24h' && freshness.hoursSinceLastContact > 24) return false;
      if (filters.lastContactRange === 'older_24h' && freshness.hoursSinceLastContact <= 24) return false;
      if (filters.lastContactRange === 'never' && freshness.hoursSinceLastContact < 9990) return false;
    }

    // 9. Configuration status
    if (filters.configStatus && filters.configStatus !== 'all') {
      if (filters.configStatus === 'none' && d.appliedConfigVersion !== null) return false;
      if (filters.configStatus === 'applied' && d.appliedConfigVersion === null) return false;
      if (filters.configStatus === 'pending' && d.configStatus !== 'Pending') return false;
      if (filters.configStatus === 'failed' && d.configStatus !== 'Failed') return false;
    }

    return true;
  });
}

/**
 * Sorts devices cleanly and deterministically.
 */
export function sortDevices(
  devices: DeviceRecord[],
  sortKey: DeviceSortKey = 'identifier',
  sortDir: DeviceSortDir = 'asc'
): DeviceRecord[] {
  const result = [...devices];
  result.sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'identifier':
        cmp = a.identifier.localeCompare(b.identifier, undefined, { numeric: true, sensitivity: 'base' });
        break;
      case 'state': {
        const order: Record<DeviceConnectivityState, number> = { online: 1, stale: 2, offline: 3 };
        cmp = (order[a.state] || 99) - (order[b.state] || 99);
        break;
      }
      case 'lastContact': {
        const dateA = parseDate(a.lastContactIso || a.lastContact)?.getTime() ?? 0;
        const dateB = parseDate(b.lastContactIso || b.lastContact)?.getTime() ?? 0;
        cmp = dateA - dateB;
        break;
      }
      case 'events':
        cmp = (a.events30dCount || 0) - (b.events30dCount || 0);
        break;
      case 'type':
        cmp = a.type.localeCompare(b.type);
        break;
      case 'installedOn':
        cmp = (a.installedOnPoleId || 'ZZZ').localeCompare(b.installedOnPoleId || 'ZZZ');
        break;
      default:
        cmp = 0;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });
  return result;
}

/**
 * Parses URL search params into typed filter and table state.
 */
export function parseDevicesUrlState(
  params: URLSearchParams,
  defaultSite?: string
): {
  filters: DeviceFilterState;
  sortKey: DeviceSortKey;
  sortDir: DeviceSortDir;
  page: number;
  limit: number;
  selectedDeviceId: string | null;
  activeKpi: string | null;
} {
  const statusTab = (params.get('tab') as any) || 'all';
  const viewMode = (params.get('view') as any) === 'map' ? 'map' : 'table';
  const search = params.get('q') || undefined;
  const site = params.get('site') || defaultSite || undefined;
  const sortKey = (params.get('sort') as DeviceSortKey) || 'identifier';
  const sortDir = (params.get('dir') as DeviceSortDir) || 'asc';
  const page = Math.max(1, parseInt(params.get('page') || '1', 10));
  const limit = Math.max(5, parseInt(params.get('limit') || '10', 10));
  const selectedDeviceId = params.get('selected') || null;
  const activeKpi = params.get('kpi') || null;
  const installation = (params.get('inst') as any) || 'all';
  const configStatus = (params.get('cfg') as any) || 'all';

  const type = params.getAll('type') as any;
  const vendor = params.getAll('vendor');
  const library = params.getAll('lib');
  const lastContactRange = (params.get('contact') as any) || 'all';

  return {
    filters: {
      statusTab: ['all', 'online', 'offline', 'stale'].includes(statusTab) ? statusTab : 'all',
      viewMode,
      search,
      site,
      type: type.length > 0 ? type : undefined,
      vendor: vendor.length > 0 ? vendor : undefined,
      library: library.length > 0 ? library : undefined,
      installation,
      lastContactRange,
      configStatus,
    },
    sortKey,
    sortDir,
    page,
    limit,
    selectedDeviceId,
    activeKpi,
  };
}

/**
 * Serializes device filters and state to URL search parameters.
 */
export function buildDevicesSearchParams(params: {
  filters: DeviceFilterState;
  sortKey: DeviceSortKey;
  sortDir: DeviceSortDir;
  page: number;
  limit: number;
  selectedDeviceId?: string | null;
  activeKpi?: string | null;
  defaultSite?: string;
}): URLSearchParams {
  const p = new URLSearchParams();
  const { filters, sortKey, sortDir, page, limit, selectedDeviceId, activeKpi, defaultSite } = params;

  if (filters.statusTab && filters.statusTab !== 'all') p.set('tab', filters.statusTab);
  if (filters.viewMode === 'map') p.set('view', 'map');
  if (filters.search) p.set('q', filters.search);
  if (filters.site && filters.site !== defaultSite && filters.site !== 'ALL') p.set('site', filters.site);

  if (filters.type) {
    for (const t of filters.type) p.append('type', t);
  }
  if (filters.vendor) {
    for (const v of filters.vendor) p.append('vendor', v);
  }
  if (filters.library) {
    for (const l of filters.library) p.append('lib', l);
  }
  if (filters.installation && filters.installation !== 'all') p.set('inst', filters.installation);
  if (filters.lastContactRange && filters.lastContactRange !== 'all') p.set('contact', filters.lastContactRange);
  if (filters.configStatus && filters.configStatus !== 'all') p.set('cfg', filters.configStatus);

  if (sortKey !== 'identifier') p.set('sort', sortKey);
  if (sortDir !== 'asc') p.set('dir', sortDir);
  if (page > 1) p.set('page', String(page));
  if (limit !== 10) p.set('limit', String(limit));
  if (selectedDeviceId) p.set('selected', selectedDeviceId);
  if (activeKpi) p.set('kpi', activeKpi);

  return p;
}

/**
 * Exports filtered devices list verbatim to RFC 4180 CSV.
 */
export function exportDevicesToCsv(devices: DeviceRecord[]): string {
  const headers = [
    'Identifier',
    'Name',
    'Type',
    'Manufacturer',
    'Model',
    'Serial Number',
    'Library',
    'State',
    'Installed On Pole',
    'Site',
    'Last Contact',
    'Events (30d)',
    'Config Version',
  ];

  const escape = (val: any) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = devices.map((d) => [
    escape(d.identifier),
    escape(d.name),
    escape(d.type),
    escape(d.manufacturer),
    escape(d.model),
    escape(d.serialNumber),
    escape(d.library),
    escape(d.state),
    escape(d.installedOnPoleId || 'Not installed'),
    escape(d.siteName),
    escape(d.lastContact),
    escape(d.events30dCount ?? 0),
    escape(d.appliedConfigVersion || 'None'),
  ]);

  return [headers.map(escape).join(','), ...rows.map((r) => r.join(','))].join('\n');
}
