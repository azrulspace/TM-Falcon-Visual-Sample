import type {
  AvailabilitySummary,
  DeviceConnectivityPeriod,
  DeviceConnectivityState,
  DeviceFilterState,
  DeviceLifecycleState,
  DevicePolicyConfig,
  DeviceRecord,
  DeviceSortDir,
  DeviceSortKey,
  DeviceStatusTab,
  DeviceTypeCategory,
  DeviceWithRelations,
  VendorDiscoveryRecord,
} from '../types/devices.ts';
import type { CableSpanRecord, PoleRecord } from '../types/assets.ts';
import type { FalconEvent } from './events.ts';
import { normalizeRelationKey } from './poles.ts';
import { isEventWithin30Days } from './poleSelectors.ts';
import {
  formatAbsoluteMYT,
  formatRelativeTime,
  getServerNow,
  parseDate,
} from '../lib/dateTime.ts';

export function formatDeviceDurationMs(ms: number): string {
  const safeMs = Math.max(0, ms);
  const totalMinutes = Math.round(safeMs / 60000);
  if (totalMinutes < 1) return '< 1m';
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const mins = totalMinutes % 60;
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
}

export const DEFAULT_DEVICE_POLICY_CONFIG: DevicePolicyConfig = {
  // Backend gap: staging server does not currently return an automatic staleness cutoff policy
  staleThresholdHours: null,
  stalePolicyLabel: null,
};

export const PREVIEW_DEVICE_POLICY_CONFIG: DevicePolicyConfig = {
  staleThresholdHours: 48,
  stalePolicyLabel: '48h no-contact threshold',
};

export interface LastContactFreshness {
  relative: string;
  absoluteMYT: string;
  ageHours: number | null;
  isStaleByPolicy: boolean;
  /** Factual age notice when a device is reported Online despite old last contact (>24h) */
  isOldWhileOnline: boolean;
  tooltipSummary: string;
}

export function normalizeConnectivityState(raw: string | null | undefined): DeviceConnectivityState {
  const norm = (raw || '').trim().toLowerCase();
  if (norm === 'offline' || norm === 'disconnected' || norm === 'down') return 'offline';
  if (norm === 'stale' || norm === 'degraded' || norm === 'delayed') return 'stale';
  return 'online';
}

export function normalizeLifecycle(raw: string | null | undefined): DeviceLifecycleState {
  const norm = (raw || '').trim().toLowerCase();
  if (norm === 'planned') return 'Planned';
  if (norm === 'maintenance') return 'Maintenance';
  if (norm === 'retired' || norm === 'inactive') return 'Retired';
  return 'Active';
}

export function formatConnectivityStateLabel(state: DeviceConnectivityState): string {
  if (state === 'offline') return 'Offline';
  if (state === 'stale') return 'Stale';
  return 'Online';
}

export function getLastContactFreshness(
  lastContactAt: string | null | undefined,
  connectivityState: DeviceConnectivityState,
  policyConfig: DevicePolicyConfig = DEFAULT_DEVICE_POLICY_CONFIG,
  now: Date = getServerNow()
): LastContactFreshness {
  if (!lastContactAt) {
    return {
      relative: 'Never',
      absoluteMYT: 'Not recorded',
      ageHours: null,
      isStaleByPolicy: false,
      isOldWhileOnline: false,
      tooltipSummary: 'No contact timestamp recorded.',
    };
  }

  const parsed = parseDate(lastContactAt);
  if (!parsed) {
    return {
      relative: '—',
      absoluteMYT: '—',
      ageHours: null,
      isStaleByPolicy: false,
      isOldWhileOnline: false,
      tooltipSummary: 'Invalid contact timestamp.',
    };
  }

  const diffMs = Math.max(0, now.getTime() - parsed.getTime());
  const ageHours = diffMs / (3600 * 1000);
  const relative = formatRelativeTime(parsed, now);
  const absoluteMYT = formatAbsoluteMYT(parsed, { showSeconds: false });

  const isStaleByPolicy =
    policyConfig.staleThresholdHours !== null &&
    connectivityState === 'online' &&
    ageHours >= policyConfig.staleThresholdHours;

  const isOldWhileOnline = connectivityState === 'online' && ageHours >= 24;

  const tooltipSummary = isStaleByPolicy
    ? `Reported Online, but no contact for ${relative} (exceeds ${policyConfig.stalePolicyLabel || `${policyConfig.staleThresholdHours}h policy`}).`
    : isOldWhileOnline
    ? `State is reported Online by vendor telemetry; last contact was ${relative} (${absoluteMYT}).`
    : `Last contact ${relative} (${absoluteMYT}).`;

  return {
    relative,
    absoluteMYT,
    ageHours,
    isStaleByPolicy,
    isOldWhileOnline,
    tooltipSummary,
  };
}

/**
 * Computes truthful availability breakdown strictly from stored connectivity periods.
 * Never fabricates periods or percentages if no periods intersect the window.
 */
export function computeAvailabilitySummary(
  periods: DeviceConnectivityPeriod[],
  windowHours: number,
  now: Date = getServerNow()
): AvailabilitySummary {
  const windowEndMs = now.getTime();
  const windowStartMs = windowEndMs - windowHours * 3600 * 1000;

  let onlineMs = 0;
  let staleMs = 0;
  let offlineMs = 0;
  let longestOfflineMs = 0;
  let periodsUsedCount = 0;
  let transitionsCount = 0;

  const clipped: { state: DeviceConnectivityState; start: number; end: number }[] = [];

  for (const period of periods) {
    const startParsed = parseDate(period.from);
    if (!startParsed) continue;
    const rawStart = startParsed.getTime();
    const rawEnd = period.to ? parseDate(period.to)?.getTime() ?? windowEndMs : windowEndMs;
    if (rawEnd <= rawStart) continue;

    const overlapStart = Math.max(rawStart, windowStartMs);
    const overlapEnd = Math.min(rawEnd, windowEndMs);
    if (overlapEnd <= overlapStart) continue;

    const dur = Math.max(0, overlapEnd - overlapStart);
    periodsUsedCount += 1;
    clipped.push({ state: period.state, start: overlapStart, end: overlapEnd });

    if (period.state === 'online') onlineMs += dur;
    else if (period.state === 'stale') staleMs += dur;
    else {
      offlineMs += dur;
      if (dur > longestOfflineMs) longestOfflineMs = dur;
    }
  }

  clipped.sort((a, b) => a.start - b.start);
  for (let i = 1; i < clipped.length; i++) {
    if (clipped[i].state !== clipped[i - 1].state) {
      transitionsCount += 1;
    }
  }

  const coveredMs = onlineMs + staleMs + offlineMs;
  if (coveredMs === 0) {
    return {
      windowHours,
      onlinePercent: null,
      stalePercent: null,
      offlinePercent: null,
      onlineMs: 0,
      staleMs: 0,
      offlineMs: 0,
      coveredMs: 0,
      transitionsCount: 0,
      longestOfflineMs: 0,
      periodsUsedCount: 0,
      basisLabel: `No stored connectivity periods in last ${windowHours}h`,
    };
  }

  const pct = (ms: number) => Number(((ms / coveredMs) * 100).toFixed(1));
  const windowLabel = windowHours >= 24 && windowHours % 24 === 0 ? `${windowHours / 24}d` : `${windowHours}h`;

  return {
    windowHours,
    onlinePercent: pct(onlineMs),
    stalePercent: pct(staleMs),
    offlinePercent: pct(offlineMs),
    onlineMs,
    staleMs,
    offlineMs,
    coveredMs,
    transitionsCount,
    longestOfflineMs,
    periodsUsedCount,
    basisLabel: `Computed from ${periodsUsedCount} stored telemetry periods (${formatDeviceDurationMs(coveredMs)} covered across last ${windowLabel})`,
  };
}

export function getEventsForDevice(
  device: Pick<DeviceRecord, 'identifier'>,
  eventsList: FalconEvent[],
  windowDays = 30,
  now: Date = getServerNow()
): { allEvents: FalconEvent[]; recentEvents: FalconEvent[] } {
  const key = normalizeRelationKey(device.identifier);
  const matched = eventsList.filter((evt) => {
    const devKey = normalizeRelationKey(evt.device);
    return devKey !== '' && devKey === key;
  });

  const recentEvents =
    windowDays === 30
      ? matched.filter((evt) => isEventWithin30Days(evt, now))
      : matched.filter((evt) => {
          const parsed = parseDate(evt.captured);
          if (!parsed) return false;
          const cutoffMs = now.getTime() - windowDays * 24 * 3600 * 1000;
          return parsed.getTime() >= cutoffMs;
        });

  return { allEvents: matched, recentEvents };
}

export function enrichDeviceWithRelations(
  device: DeviceRecord,
  polesList: PoleRecord[],
  spansList: CableSpanRecord[],
  eventsList: FalconEvent[],
  vendorRecords: VendorDiscoveryRecord[] = [],
  policyConfig: DevicePolicyConfig = DEFAULT_DEVICE_POLICY_CONFIG,
  now: Date = getServerNow()
): DeviceWithRelations {
  const installedPoleKey = normalizeRelationKey(device.installedPoleId);
  const installedPole = installedPoleKey
    ? polesList.find((p) => normalizeRelationKey(p.identifier) === installedPoleKey && p.lifecycle !== 'Deleted') ||
      polesList.find((p) => normalizeRelationKey(p.identifier) === installedPoleKey) ||
      null
    : null;

  const isInstalled = Boolean(device.installedPoleId && installedPole && installedPole.lifecycle !== 'Deleted');
  const location = installedPole?.location || null;

  const poleSpans = installedPoleKey
    ? spansList.filter(
        (s) =>
          s.lifecycle !== 'Deleted' &&
          (normalizeRelationKey(s.fromPole) === installedPoleKey ||
            normalizeRelationKey(s.toPole) === installedPoleKey)
      )
    : [];

  const { allEvents, recentEvents } = getEventsForDevice(device, eventsList, 30, now);

  const devKey = normalizeRelationKey(device.identifier);
  const vendorConflict =
    vendorRecords.find(
      (vr) =>
        vr.matchStatus === 'Conflict' &&
        (normalizeRelationKey(vr.matchedFalconId) === devKey ||
          normalizeRelationKey(vr.serial) === normalizeRelationKey(device.serial))
    ) || null;

  const latestVersion = device.configVersions[0];
  const configIssueCount = latestVersion
    ? latestVersion.results.filter((r) => r.status === 'Failed' || r.status === 'Pending').length
    : 0;

  const freshness = getLastContactFreshness(
    device.lastContactAt,
    device.connectivityState,
    policyConfig,
    now
  );

  return {
    ...device,
    installedPoleName: installedPole?.name || device.installedPoleId || null,
    installedPoleSiteName: installedPole?.siteName || null,
    installedPoleLifecycle: installedPole?.lifecycle || null,
    location,
    isInstalled,
    events30dCount: recentEvents.length,
    allEventsCount: allEvents.length,
    deviceEvents: allEvents,
    poleSpans,
    vendorConflict,
    configIssueCount,
    isStaleByPolicy: freshness.isStaleByPolicy,
  };
}

export interface DeviceKpiCounts {
  total: number;
  online: number;
  offline: number;
  stale: number;
  notInstalled: number;
  needsAttention: number;
  configIssues: number;
  vendorConflicts: number;
}

export function getDeviceKpiCounts(
  devicesList: DeviceWithRelations[],
  siteFilter?: string
): DeviceKpiCounts {
  const scoped =
    siteFilter && siteFilter !== 'ALL'
      ? devicesList.filter((d) => (d.siteName || 'Unassigned') === siteFilter)
      : devicesList;

  let online = 0;
  let offline = 0;
  let stale = 0;
  let notInstalled = 0;
  let needsAttention = 0;
  let configIssues = 0;
  let vendorConflicts = 0;

  for (const d of scoped) {
    if (d.connectivityState === 'online') online += 1;
    else if (d.connectivityState === 'offline') offline += 1;
    else stale += 1;

    if (!d.isInstalled) notInstalled += 1;
    if (d.configIssueCount > 0 || d.configStatus === 'Failed' || d.configStatus === 'Partly applied') {
      configIssues += 1;
    }
    if (d.vendorConflict) vendorConflicts += 1;

    const attention =
      d.connectivityState === 'offline' ||
      d.connectivityState === 'stale' ||
      d.configIssueCount > 0 ||
      Boolean(d.vendorConflict) ||
      d.isStaleByPolicy;
    if (attention) needsAttention += 1;
  }

  return {
    total: scoped.length,
    online,
    offline,
    stale,
    notInstalled,
    needsAttention,
    configIssues,
    vendorConflicts,
  };
}

export interface DeviceStatusTabCounts {
  all: number;
  online: number;
  offline: number;
  stale: number;
  not_installed: number;
}

export function getDeviceStatusTabCounts(
  devicesList: DeviceWithRelations[],
  siteFilter?: string
): DeviceStatusTabCounts {
  const kpi = getDeviceKpiCounts(devicesList, siteFilter);
  return {
    all: kpi.total,
    online: kpi.online,
    offline: kpi.offline,
    stale: kpi.stale,
    not_installed: kpi.notInstalled,
  };
}

export function filterDevices(
  devicesList: DeviceWithRelations[],
  filters: DeviceFilterState,
  now: Date = getServerNow()
): DeviceWithRelations[] {
  const query = (filters.search || '').trim().toLowerCase();

  return devicesList.filter((d) => {
    if (filters.hideTestRecords && d.isTest) return false;

    if (filters.site && filters.site !== 'ALL') {
      const devSite = d.siteName || 'Unassigned';
      if (devSite !== filters.site) return false;
    }

    if (filters.statusTab === 'online' && d.connectivityState !== 'online') return false;
    if (filters.statusTab === 'offline' && d.connectivityState !== 'offline') return false;
    if (filters.statusTab === 'stale' && d.connectivityState !== 'stale') return false;
    if (filters.statusTab === 'not_installed' && d.isInstalled) return false;

    if (filters.installationFilter === 'installed' && !d.isInstalled) return false;
    if (filters.installationFilter === 'not_installed' && d.isInstalled) return false;

    if (filters.types && filters.types.length > 0 && !filters.types.includes(d.type)) {
      return false;
    }

    if (
      filters.manufacturers &&
      filters.manufacturers.length > 0 &&
      !filters.manufacturers.includes(d.manufacturer)
    ) {
      return false;
    }

    if (
      filters.libraries &&
      filters.libraries.length > 0 &&
      !filters.libraries.includes(d.library)
    ) {
      return false;
    }

    if (filters.lifecycle && filters.lifecycle.length > 0 && !filters.lifecycle.includes(d.lifecycle)) {
      return false;
    }

    if (filters.configFilter && filters.configFilter !== 'all') {
      if (filters.configFilter === 'applied' && d.configStatus !== 'Applied') return false;
      if (filters.configFilter === 'none' && d.configStatus !== 'None') return false;
      if (
        filters.configFilter === 'issues' &&
        d.configIssueCount === 0 &&
        d.configStatus !== 'Failed' &&
        d.configStatus !== 'Partly applied'
      ) {
        return false;
      }
    }

    if (filters.needsAttentionOnly) {
      const attention =
        d.connectivityState === 'offline' ||
        d.connectivityState === 'stale' ||
        d.configIssueCount > 0 ||
        Boolean(d.vendorConflict) ||
        d.isStaleByPolicy;
      if (!attention) return false;
    }

    if (filters.lastContactRange && filters.lastContactRange !== 'all') {
      const parsed = parseDate(d.lastContactAt);
      if (!parsed) {
        if (filters.lastContactRange !== 'older_24h') return false;
      } else {
        const diffH = (now.getTime() - parsed.getTime()) / (3600 * 1000);
        if (filters.lastContactRange === '1h' && diffH > 1) return false;
        if (filters.lastContactRange === '24h' && diffH > 24) return false;
        if (filters.lastContactRange === '7d' && diffH > 24 * 7) return false;
        if (filters.lastContactRange === 'older_24h' && diffH <= 24) return false;
      }
    }

    if (query) {
      const haystack = [
        d.identifier,
        d.name,
        d.model,
        d.serial,
        d.vendorDeviceId,
        d.installedPoleId || '',
        d.siteName || 'Unassigned',
        d.manufacturer,
        d.library,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}

const STATE_SEVERITY_ORDER: Record<DeviceConnectivityState, number> = {
  offline: 0,
  stale: 1,
  online: 2,
};

export function sortDevices(
  devicesList: DeviceWithRelations[],
  sortKey: DeviceSortKey = 'identifier',
  sortDir: DeviceSortDir = 'asc'
): DeviceWithRelations[] {
  const dir = sortDir === 'desc' ? -1 : 1;
  return [...devicesList].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'identifier') {
      cmp = a.identifier.localeCompare(b.identifier, undefined, { numeric: true });
    } else if (sortKey === 'type') {
      cmp = a.type.localeCompare(b.type);
    } else if (sortKey === 'connectivityState') {
      cmp = STATE_SEVERITY_ORDER[a.connectivityState] - STATE_SEVERITY_ORDER[b.connectivityState];
    } else if (sortKey === 'lastContactAt') {
      const ta = parseDate(a.lastContactAt)?.getTime() ?? 0;
      const tb = parseDate(b.lastContactAt)?.getTime() ?? 0;
      cmp = ta - tb;
    } else if (sortKey === 'events30dCount') {
      cmp = a.events30dCount - b.events30dCount;
    } else if (sortKey === 'configVersion') {
      cmp = (a.configVersion || '').localeCompare(b.configVersion || '');
    } else if (sortKey === 'installedPoleId') {
      cmp = (a.installedPoleId || 'zzz').localeCompare(b.installedPoleId || 'zzz');
    }

    if (cmp === 0) {
      cmp = a.identifier.localeCompare(b.identifier, undefined, { numeric: true });
    }
    return cmp * dir;
  });
}

export function parseDevicesUrlState(
  searchParams: URLSearchParams,
  defaultSite: string
): {
  filters: DeviceFilterState;
  sortKey: DeviceSortKey;
  sortDir: DeviceSortDir;
  page: number;
  limit: number;
  selectedDeviceId: string | null;
  activeKpi: string | null;
} {
  const statusParam = searchParams.get('status') as DeviceStatusTab | null;
  const statusTab: DeviceStatusTab =
    statusParam && ['all', 'online', 'offline', 'stale', 'not_installed'].includes(statusParam)
      ? statusParam
      : 'all';

  const viewMode = searchParams.get('view') === 'map' ? 'map' : 'table';
  const search = searchParams.get('q') || '';
  const siteParam = searchParams.get('site');
  const site = siteParam !== null ? siteParam : defaultSite;

  const typesRaw = searchParams.get('type');
  const types = typesRaw
    ? (typesRaw.split(',').filter(Boolean) as DeviceTypeCategory[])
    : [];

  const manufacturers = (searchParams.get('vendor') || '').split(',').filter(Boolean);
  const libraries = (searchParams.get('library') || '').split(',').filter(Boolean);
  const lifecycle = ((searchParams.get('lifecycle') || '').split(',').filter(Boolean) as DeviceLifecycleState[]);

  const installationFilter =
    (searchParams.get('installed') as DeviceFilterState['installationFilter']) || 'all';
  const lastContactRange =
    (searchParams.get('contact') as DeviceFilterState['lastContactRange']) || 'all';
  const configFilter =
    (searchParams.get('config') as DeviceFilterState['configFilter']) || 'all';

  const needsAttentionOnly = searchParams.get('attention') === '1';
  const hideTestRecords = searchParams.get('hideTest') === '1';

  const sortKeyRaw = searchParams.get('sort') as DeviceSortKey | null;
  const validSorts: DeviceSortKey[] = [
    'identifier',
    'type',
    'connectivityState',
    'lastContactAt',
    'events30dCount',
    'configVersion',
    'installedPoleId',
  ];
  const sortKey: DeviceSortKey = sortKeyRaw && validSorts.includes(sortKeyRaw) ? sortKeyRaw : 'identifier';
  const sortDir: DeviceSortDir = searchParams.get('dir') === 'desc' ? 'desc' : 'asc';

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limitRaw = parseInt(searchParams.get('limit') || '25', 10) || 25;
  const limit = [10, 25, 50, 100].includes(limitRaw) ? limitRaw : 25;

  const selectedDeviceId = searchParams.get('device') || null;
  const activeKpi = searchParams.get('kpi') || null;

  return {
    filters: {
      statusTab,
      viewMode,
      search,
      types,
      manufacturers,
      libraries,
      lifecycle,
      site,
      installationFilter,
      lastContactRange,
      configFilter,
      needsAttentionOnly,
      hideTestRecords,
    },
    sortKey,
    sortDir,
    page,
    limit,
    selectedDeviceId,
    activeKpi,
  };
}

export function buildDevicesSearchParams(params: {
  filters: DeviceFilterState;
  sortKey: DeviceSortKey;
  sortDir: DeviceSortDir;
  page: number;
  limit: number;
  selectedDeviceId?: string | null;
  activeKpi?: string | null;
  defaultSite: string;
}): URLSearchParams {
  const sp = new URLSearchParams();
  const { filters, sortKey, sortDir, page, limit, selectedDeviceId, activeKpi, defaultSite } = params;

  if (filters.statusTab && filters.statusTab !== 'all') sp.set('status', filters.statusTab);
  if (filters.viewMode === 'map') sp.set('view', 'map');
  if (filters.search?.trim()) sp.set('q', filters.search.trim());
  if (filters.site && filters.site !== defaultSite) sp.set('site', filters.site);
  if (filters.types && filters.types.length > 0) sp.set('type', filters.types.join(','));
  if (filters.manufacturers && filters.manufacturers.length > 0) {
    sp.set('vendor', filters.manufacturers.join(','));
  }
  if (filters.libraries && filters.libraries.length > 0) sp.set('library', filters.libraries.join(','));
  if (filters.lifecycle && filters.lifecycle.length > 0) sp.set('lifecycle', filters.lifecycle.join(','));
  if (filters.installationFilter && filters.installationFilter !== 'all') {
    sp.set('installed', filters.installationFilter);
  }
  if (filters.lastContactRange && filters.lastContactRange !== 'all') {
    sp.set('contact', filters.lastContactRange);
  }
  if (filters.configFilter && filters.configFilter !== 'all') {
    sp.set('config', filters.configFilter);
  }
  if (filters.needsAttentionOnly) sp.set('attention', '1');
  if (filters.hideTestRecords) sp.set('hideTest', '1');

  if (sortKey !== 'identifier') sp.set('sort', sortKey);
  if (sortDir !== 'asc') sp.set('dir', sortDir);
  if (page > 1) sp.set('page', String(page));
  if (limit !== 25) sp.set('limit', String(limit));
  if (selectedDeviceId) sp.set('device', selectedDeviceId);
  if (activeKpi) sp.set('kpi', activeKpi);

  return sp;
}

export function buildDevicesCsvContent(devicesList: DeviceWithRelations[]): string {
  const escape = (val: string | number | null | undefined) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = [
    'Identifier',
    'Name',
    'Type',
    'Manufacturer',
    'Library',
    'Model',
    'Serial',
    'Site',
    'Lifecycle',
    'State',
    'Installed On',
    'Coordinates',
    'Last Contact (MYT)',
    'Events (30d)',
    'Config Version',
    'Config Status',
  ];

  const rows = devicesList.map((d) =>
    [
      escape(d.identifier),
      escape(d.name),
      escape(d.type),
      escape(d.manufacturer),
      escape(d.library),
      escape(d.model),
      escape(d.serial),
      escape(d.siteName || 'Unassigned'),
      escape(d.lifecycle),
      escape(formatConnectivityStateLabel(d.connectivityState)),
      escape(d.installedPoleId || 'Not installed'),
      escape(d.location ? `${d.location.lat.toFixed(6)}, ${d.location.lng.toFixed(6)}` : 'Not recorded'),
      escape(formatAbsoluteMYT(d.lastContactAt)),
      escape(d.events30dCount),
      escape(d.configVersion || 'None'),
      escape(d.configStatus),
    ].join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export function exportDevicesToCsv(devicesList: DeviceWithRelations[], filenamePrefix = 'falcon_devices') {
  const csv = buildDevicesCsvContent(devicesList);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
