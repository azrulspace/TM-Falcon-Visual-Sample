import type {
  PoleRecord,
  PoleWithRelations,
  PoleFilterState,
  PoleSortKey,
  PoleSortDir,
  CableSpanRecord,
  DeviceSummaryRecord,
  SiteRecord,
} from '../types/assets.ts';
import type { FalconEvent } from './events.ts';
import { normalizeRelationKey } from './poles.ts';
import { haversineDistanceMeters, formatCoordinates } from '../lib/geo.ts';
import { parseDate, getServerNow } from '../lib/dateTime.ts';

export interface PoleKpiCounts {
  activePoles: number;
  missingLocation: number;
  withLinkedDevice: number;
  withEvents30d: number;
  deleted: number;
}

export interface PoleStatusTabCounts {
  active: number;
  deleted: number;
}

/**
 * Checks whether an event matches a given pole directly or via its connected cable spans or mounted devices.
 */
export function getEventsForPole(
  pole: PoleRecord,
  connectedSpans: CableSpanRecord[],
  linkedDevices: DeviceSummaryRecord[],
  eventsList: FalconEvent[]
): { allEvents: FalconEvent[]; onPoleEvents: FalconEvent[]; onSpanEvents: FalconEvent[] } {
  const poleKey = normalizeRelationKey(pole.identifier);
  const spanKeys = new Set(connectedSpans.map((s) => normalizeRelationKey(s.identifier)));
  const devKeys = new Set(linkedDevices.map((d) => normalizeRelationKey(d.id)));

  const onPoleEvents: FalconEvent[] = [];
  const onSpanEvents: FalconEvent[] = [];
  const seen = new Set<string>();

  for (const evt of eventsList) {
    const assetKey = normalizeRelationKey(evt.asset);
    const devKey = normalizeRelationKey(evt.device);
    const polesKeys = (evt.poles || []).map((p) => normalizeRelationKey(p));

    const matchesPoleDirect =
      assetKey === poleKey || polesKeys.includes(poleKey) || (devKey !== '' && devKeys.has(devKey));
    const matchesSpan = assetKey !== '' && spanKeys.has(assetKey);

    if (matchesPoleDirect || matchesSpan) {
      if (!seen.has(evt.id)) {
        seen.add(evt.id);
        if (matchesSpan && assetKey !== poleKey) {
          onSpanEvents.push(evt);
        } else {
          onPoleEvents.push(evt);
        }
      }
    }
  }

  return {
    allEvents: [...onPoleEvents, ...onSpanEvents],
    onPoleEvents,
    onSpanEvents,
  };
}

/**
 * Checks whether an event occurred within the last 30 days relative to server now.
 */
export function isEventWithin30Days(evt: FalconEvent, now: Date = getServerNow()): boolean {
  const cap = (evt.captured || '').toLowerCase();
  if (cap.includes('m ago') || cap.includes('h ago') || cap.includes('just now')) return true;
  if (cap.includes('d ago')) {
    const days = parseInt(cap.split('d')[0], 10);
    return !Number.isNaN(days) && days <= 30;
  }
  const parsed = parseDate(evt.captured);
  if (!parsed) return false;
  const diffDays = (now.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 30;
}

/**
 * Joins a pole with its real devices, cable spans, events, and site distance from shared stores.
 */
export function enrichPoleWithRelations(
  pole: PoleRecord,
  devicesList: DeviceSummaryRecord[],
  spansList: CableSpanRecord[],
  eventsList: FalconEvent[],
  sitesList: SiteRecord[],
  now: Date = getServerNow()
): PoleWithRelations {
  const poleKey = normalizeRelationKey(pole.identifier);

  const linkedDevices = devicesList.filter(
    (d) => normalizeRelationKey(d.asset) === poleKey
  );

  const connectedSpans = spansList.filter(
    (s) =>
      normalizeRelationKey(s.fromPole) === poleKey ||
      normalizeRelationKey(s.toPole) === poleKey
  );

  const { allEvents } = getEventsForPole(pole, connectedSpans, linkedDevices, eventsList);
  const events30dCount = allEvents.filter((e) => isEventWithin30Days(e, now)).length;

  const matchedSite = sitesList.find(
    (s) => s.id === pole.siteId || s.name.toLowerCase() === pole.siteName.toLowerCase()
  );
  const siteCentrePoint = matchedSite?.centrePoint ?? null;
  const distanceFromCentreMeters =
    pole.location && siteCentrePoint
      ? haversineDistanceMeters(pole.location, siteCentrePoint)
      : null;

  return {
    ...pole,
    linkedDevices,
    linkedDevicesCount: linkedDevices.length,
    connectedSpans,
    cableSpansCount: connectedSpans.length,
    events30dCount,
    allEventsCount: allEvents.length,
    siteCentrePoint,
    distanceFromCentreMeters,
  };
}

/**
 * Computes KPI strip counts strictly from loaded enriched poles (respecting site scope when set).
 */
export function getPoleKpiCounts(
  poles: PoleWithRelations[],
  siteFilter?: string
): PoleKpiCounts {
  const scoped =
    siteFilter && siteFilter !== 'ALL'
      ? poles.filter((p) => p.siteName === siteFilter)
      : poles;

  const active = scoped.filter((p) => p.lifecycle !== 'Deleted');
  const deleted = scoped.filter((p) => p.lifecycle === 'Deleted');

  return {
    activePoles: active.filter((p) => p.lifecycle === 'Active').length,
    missingLocation: active.filter((p) => !p.location).length,
    withLinkedDevice: active.filter((p) => p.linkedDevicesCount > 0).length,
    withEvents30d: active.filter((p) => p.events30dCount > 0).length,
    deleted: deleted.length,
  };
}

/**
 * Computes status tab counts (Active N, Deleted N) respecting site/search filters.
 */
export function getPoleStatusTabCounts(
  poles: PoleWithRelations[],
  filters: Pick<PoleFilterState, 'site' | 'search' | 'hideTestRecords'>
): PoleStatusTabCounts {
  const base = poles.filter((p) => {
    if (filters.site && filters.site !== 'ALL' && p.siteName !== filters.site) return false;
    if (filters.hideTestRecords && p.isTest === true) return false;
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      const matchId = p.identifier.toLowerCase().includes(q);
      const matchName = p.name.toLowerCase().includes(q);
      if (!matchId && !matchName) return false;
    }
    return true;
  });

  return {
    active: base.filter((p) => p.lifecycle !== 'Deleted').length,
    deleted: base.filter((p) => p.lifecycle === 'Deleted').length,
  };
}

/**
 * Filters enriched poles using the complete Poles toolbar criteria.
 */
export function filterPoles(
  poles: PoleWithRelations[],
  filters: PoleFilterState,
  now: Date = getServerNow()
): PoleWithRelations[] {
  return poles.filter((p) => {
    // 1. Active vs Deleted status tab
    if (filters.statusTab === 'deleted') {
      if (p.lifecycle !== 'Deleted') return false;
    } else {
      if (p.lifecycle === 'Deleted') return false;
    }

    // 2. Site filter
    if (filters.site && filters.site !== 'ALL') {
      if (p.siteName !== filters.site) return false;
    }

    // 3. Search by identifier or name (verbatim)
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      const matchId = p.identifier.toLowerCase().includes(q);
      const matchName = p.name.toLowerCase().includes(q);
      if (!matchId && !matchName) return false;
    }

    // 4. Lifecycle filter (multi-select)
    if (filters.lifecycle && filters.lifecycle.length > 0 && filters.statusTab !== 'deleted') {
      if (!filters.lifecycle.includes(p.lifecycle)) return false;
    }

    // 5. Location filter
    if (filters.locationFilter === 'has_location' && !p.location) return false;
    if (filters.locationFilter === 'missing_location' && p.location) return false;

    // 6. Protection filter
    if (filters.protection && filters.protection.length > 0) {
      const protVal = p.protection && p.protection.trim() ? p.protection : '__NONE__';
      if (!filters.protection.includes(protVal)) return false;
    }

    // 7. Linked device filter
    if (filters.linkedDevice === 'with' && p.linkedDevicesCount === 0) return false;
    if (filters.linkedDevice === 'without' && p.linkedDevicesCount > 0) return false;

    // 8. Events 30d quick filter
    if (filters.withEvents30d && p.events30dCount === 0) return false;

    // 9. Updated range filter
    if (filters.updatedRange && filters.updatedRange !== 'all') {
      const updatedDate = parseDate(p.lastUpdatedAt);
      if (!updatedDate) return false;
      const diffHours = (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60);
      if (filters.updatedRange === '24h' && diffHours > 24) return false;
      if (filters.updatedRange === '7d' && diffHours > 24 * 7) return false;
      if (filters.updatedRange === '30d' && diffHours > 24 * 30) return false;
    }

    // 10. Explicit test record flag filter (only when isTest boolean exists on records)
    if (filters.hideTestRecords && p.isTest === true) return false;

    return true;
  });
}

/**
 * Sorts poles stably according to sortKey and sortDir.
 */
export function sortPoles(
  poles: PoleWithRelations[],
  sortKey: PoleSortKey,
  sortDir: PoleSortDir
): PoleWithRelations[] {
  const dir = sortDir === 'asc' ? 1 : -1;
  return [...poles].sort((a, b) => {
    if (sortKey === 'identifier') {
      return a.identifier.localeCompare(b.identifier, undefined, { numeric: true }) * dir;
    }
    if (sortKey === 'lifecycle') {
      const cmp = a.lifecycle.localeCompare(b.lifecycle);
      return cmp !== 0 ? cmp * dir : a.identifier.localeCompare(b.identifier);
    }
    if (sortKey === 'registeredAt') {
      const ta = parseDate(a.registeredAt)?.getTime() || 0;
      const tb = parseDate(b.registeredAt)?.getTime() || 0;
      return (ta - tb) * dir;
    }
    // lastUpdatedAt
    const ta = parseDate(a.lastUpdatedAt)?.getTime() || 0;
    const tb = parseDate(b.lastUpdatedAt)?.getTime() || 0;
    return (ta - tb) * dir;
  });
}

/**
 * Parses URLSearchParams into PoleFilterState + view/sort/pagination state.
 */
export function parsePolesUrlState(
  searchParams: URLSearchParams,
  defaultSite: string
): {
  filters: PoleFilterState;
  sortKey: PoleSortKey;
  sortDir: PoleSortDir;
  page: number;
  limit: number;
  selectedPoleId: string | null;
  activeKpi: string | null;
} {
  const statusTab = searchParams.get('status_tab') === 'deleted' ? 'deleted' : 'active';
  const viewMode = searchParams.get('view') === 'map' ? 'map' : 'table';
  const search = searchParams.get('q') || undefined;
  const lifecycleRaw = searchParams.get('lifecycle');
  const lifecycle = lifecycleRaw
    ? (lifecycleRaw.split(',').filter(Boolean) as PoleFilterState['lifecycle'])
    : undefined;
  const siteParam = searchParams.get('site');
  const site = siteParam === null ? defaultSite : siteParam;
  const locParam = searchParams.get('location');
  const locationFilter =
    locParam === 'has_location' || locParam === 'missing_location' ? locParam : 'all';
  const protRaw = searchParams.get('protection');
  const protection = protRaw ? protRaw.split(',').filter(Boolean) : undefined;
  const devParam = searchParams.get('linked_device');
  const linkedDevice = devParam === 'with' || devParam === 'without' ? devParam : 'all';
  const withEvents30d = searchParams.get('events_30d') === 'true';
  const updatedParam = searchParams.get('updated');
  const updatedRange =
    updatedParam === '24h' || updatedParam === '7d' || updatedParam === '30d'
      ? updatedParam
      : 'all';
  const hideTestRecords = searchParams.get('hide_test') === 'true';

  const sortParam = searchParams.get('sort');
  const sortKey: PoleSortKey =
    sortParam === 'identifier' || sortParam === 'lifecycle' || sortParam === 'registeredAt'
      ? sortParam
      : 'lastUpdatedAt';
  const dirParam = searchParams.get('dir');
  const sortDir: PoleSortDir =
    dirParam === 'asc' || dirParam === 'desc'
      ? dirParam
      : sortKey === 'identifier' || sortKey === 'lifecycle'
      ? 'asc'
      : 'desc';

  const pageNum = parseInt(searchParams.get('page') || '1', 10);
  const limitNum = parseInt(searchParams.get('limit') || '25', 10);

  return {
    filters: {
      statusTab,
      viewMode,
      search,
      lifecycle,
      site,
      locationFilter,
      protection,
      linkedDevice,
      withEvents30d,
      updatedRange,
      hideTestRecords,
    },
    sortKey,
    sortDir,
    page: Number.isNaN(pageNum) || pageNum < 1 ? 1 : pageNum,
    limit: [10, 25, 50, 100].includes(limitNum) ? limitNum : 25,
    selectedPoleId: searchParams.get('selected') || null,
    activeKpi: searchParams.get('kpi') || null,
  };
}

/**
 * Serializes Poles state cleanly into URLSearchParams.
 */
export function buildPolesSearchParams(state: {
  filters: PoleFilterState;
  sortKey: PoleSortKey;
  sortDir: PoleSortDir;
  page: number;
  limit: number;
  selectedPoleId?: string | null;
  activeKpi?: string | null;
  defaultSite: string;
}): URLSearchParams {
  const params = new URLSearchParams();
  const { filters, sortKey, sortDir, page, limit, selectedPoleId, activeKpi, defaultSite } = state;

  if (filters.statusTab === 'deleted') params.set('status_tab', 'deleted');
  if (filters.viewMode === 'map') params.set('view', 'map');
  if (filters.search) params.set('q', filters.search);
  if (filters.lifecycle?.length) params.set('lifecycle', filters.lifecycle.join(','));
  if (filters.site && filters.site !== defaultSite) params.set('site', filters.site);
  if (filters.locationFilter && filters.locationFilter !== 'all') {
    params.set('location', filters.locationFilter);
  }
  if (filters.protection?.length) params.set('protection', filters.protection.join(','));
  if (filters.linkedDevice && filters.linkedDevice !== 'all') {
    params.set('linked_device', filters.linkedDevice);
  }
  if (filters.withEvents30d) params.set('events_30d', 'true');
  if (filters.updatedRange && filters.updatedRange !== 'all') {
    params.set('updated', filters.updatedRange);
  }
  if (filters.hideTestRecords) params.set('hide_test', 'true');

  if (sortKey !== 'lastUpdatedAt') params.set('sort', sortKey);
  if (sortDir !== 'desc') params.set('dir', sortDir);
  if (page > 1) params.set('page', String(page));
  if (limit !== 25) params.set('limit', String(limit));
  if (selectedPoleId) params.set('selected', selectedPoleId);
  if (activeKpi) params.set('kpi', activeKpi);

  return params;
}

/**
 * Builds CSV export string for poles table or selection.
 */
export function buildPolesCsvContent(poles: PoleWithRelations[]): string {
  const headers = [
    'Identifier',
    'Name',
    'Site',
    'Lifecycle',
    'Location',
    'Protection',
    'Linked Devices',
    'Cable Spans',
    'Events (30d)',
    'Registered',
    'Last Updated',
  ];

  const escapeCsv = (val: string | number | null | undefined) => {
    const str = String(val ?? '');
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = poles.map((p) => [
    escapeCsv(p.identifier),
    escapeCsv(p.name),
    escapeCsv(p.siteName),
    escapeCsv(p.lifecycle),
    escapeCsv(formatCoordinates(p.location)),
    escapeCsv(p.protection || 'No protection recorded'),
    p.linkedDevicesCount,
    p.cableSpansCount,
    p.events30dCount,
    escapeCsv(p.registeredAt),
    escapeCsv(p.lastUpdatedAt),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportPolesToCsv(poles: PoleWithRelations[], filename = 'falcon_poles_export.csv'): void {
  const csvContent = buildPolesCsvContent(poles);
  if (typeof document === 'undefined') return;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

