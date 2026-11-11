import type { FalconEvent } from './events.ts';
import { formatAbsoluteMYT } from '../lib/dateTime.ts';

export interface EventFilterState {
  tab?: 'all' | 'new' | 'acknowledged' | 'in_case' | 'resolved';
  search?: string;
  priority?: string[] | string; // array or comma-separated string for multi-select
  status?: string[] | string;   // array or comma-separated string for multi-select
  caseFilter?: 'all' | 'with_case' | 'without_case' | string;
  timeRange?: 'today' | '24h' | '7d' | '30d' | 'custom' | string;
  customTimeStart?: string;
  customTimeEnd?: string;
  source?: string[] | string;
  device?: string;
  asset?: string;
  poleScopeEventIds?: string[];
  capturedBefore?: string; // for Alert history scoped view
  fromEventId?: string;
}

/**
 * Checks whether an event occurred on "Today" (MYT operational day).
 * In mock dataset, index < 122 or timestamp within recent 24h of operational now.
 */
export function isEventToday(event: FalconEvent): boolean {
  const cap = event.captured.toLowerCase();
  if (cap.includes('m ago') || cap.includes('just now')) return true;
  if (cap.includes('h ago')) {
    const hours = parseInt(cap.split('h')[0], 10);
    return !isNaN(hours) && hours < 24;
  }
  if (event.captured.startsWith('2026-10-20')) return true; // EVT-0258 & EVT-0257 operational today
  return false;
}

/**
 * Priority severity rank (lower number = higher severity):
 * Critical (1) > High (2) > Medium (3) > Low (4)
 */
export const PRIORITY_RANK: Record<string, number> = {
  Critical: 1,
  High: 2,
  Medium: 3,
  Low: 4,
};

/**
 * Status sequence rank:
 * New (1) > Acknowledged (2) > In case / Case created (3) > Resolved (4)
 */
export const STATUS_RANK: Record<string, number> = {
  New: 1,
  Acknowledged: 2,
  'In case': 3,
  Resolved: 4,
};

/**
 * Core filter evaluator.
 * Allows ignoring specific filters (e.g. ignoreStatus for faceted tab counts).
 */
export function matchEvent(
  e: FalconEvent,
  filters: EventFilterState,
  options?: { ignoreStatus?: boolean }
): boolean {
  // 1. Scoped context filters (Asset, Device, Pole scope, Captured Before)
  if (filters.asset && e.asset !== filters.asset) return false;
  if (filters.device && e.device !== filters.device) return false;
  if (filters.poleScopeEventIds && !filters.poleScopeEventIds.includes(e.id)) return false;
  if (filters.capturedBefore) {
    if (filters.capturedBefore.startsWith('EVT-')) {
      const targetNum = parseInt(filters.capturedBefore.replace(/\D/g, ''), 10);
      const currNum = parseInt(e.id.replace(/\D/g, ''), 10);
      if (!isNaN(targetNum) && !isNaN(currNum) && currNum >= targetNum) return false;
    } else {
      const targetTime = new Date(filters.capturedBefore).getTime();
      const currTime = new Date(e.captured).getTime();
      if (!isNaN(targetTime) && !isNaN(currTime) && currTime >= targetTime) return false;
    }
  }

  // 2. Status / Tab filter (only if not ignored for faceted status counts)
  if (!options?.ignoreStatus) {
    if (filters.tab && filters.tab !== 'all') {
      if (filters.tab === 'new' && e.state !== 'New') return false;
      if (filters.tab === 'acknowledged' && e.state !== 'Acknowledged') return false;
      if (filters.tab === 'in_case' && e.state !== 'In case') return false;
      if (filters.tab === 'resolved' && e.state !== 'Resolved') return false;
    }

    if (filters.status && filters.status.length > 0) {
      const raw: string[] = Array.isArray(filters.status) ? filters.status : (filters.status as string).split(',');
      const normStatuses = raw.map((s: string) => (s.trim() === 'Case Created' ? 'In case' : s.trim()));
      if (!normStatuses.includes(e.state)) return false;
    }
  }

  // 3. Priority filter (multi-select)
  if (filters.priority && filters.priority.length > 0) {
    const raw: string[] = Array.isArray(filters.priority) ? filters.priority : (filters.priority as string).split(',');
    const norm = raw.map((p: string) => p.trim());
    if (!norm.includes(e.priority)) return false;
  }

  // 4. Case filter
  if (filters.caseFilter && filters.caseFilter !== 'all') {
    if (filters.caseFilter === 'with_case' && !e.caseId) return false;
    if (filters.caseFilter === 'without_case' && e.caseId) return false;
    if (filters.caseFilter.startsWith('CAS-') && e.caseId !== filters.caseFilter) return false;
  }

  // 5. Time Range filter
  if (filters.timeRange) {
    const tr = filters.timeRange.toLowerCase();
    const cap = e.captured.toLowerCase();
    if (tr === 'today') {
      if (!isEventToday(e)) return false;
    } else if (tr === '24h' || tr === 'last 24 hours') {
      if (!cap.includes('m ago') && !cap.includes('h ago') && !cap.includes('just now') && !e.captured.startsWith('2026-10-20')) {
        return false;
      }
    } else if (tr === '7d' || tr === 'last 7 days') {
      if (cap.includes('d ago')) {
        const days = parseInt(cap.split('d')[0], 10);
        if (!isNaN(days) && days > 7) return false;
      }
    } else if (tr === '30d' || tr === 'last 30 days') {
      if (cap.includes('d ago')) {
        const days = parseInt(cap.split('d')[0], 10);
        if (!isNaN(days) && days > 30) return false;
      }
    }
  }

  // 6. Source filter
  if (filters.source && filters.source.length > 0) {
    const raw: string[] = Array.isArray(filters.source) ? filters.source : (filters.source as string).split(',');
    const norm = raw.map((s: string) => s.trim());
    if (!norm.includes(e.source)) return false;
  }

  // 7. Search query
  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    const matchId = e.id.toLowerCase().includes(q);
    const matchType = e.type.toLowerCase().includes(q);
    const matchDevice = e.device?.toLowerCase().includes(q) || false;
    const matchAsset = e.asset.toLowerCase().includes(q);
    const matchRule = e.detection?.toLowerCase().includes(q) || false;
    if (!matchId && !matchType && !matchDevice && !matchAsset && !matchRule) {
      return false;
    }
  }

  return true;
}

/**
 * Filter events using canonical rules
 */
export function filterEvents(events: FalconEvent[], filters: EventFilterState): FalconEvent[] {
  return events.filter((e) => matchEvent(e, filters));
}

/**
 * Faceted Status Tab Counts.
 * Calculates tab counts respecting all active filters EXCEPT the status filter itself.
 * All = New + Acknowledged + Case Created + Resolved
 */
export function getStatusCounts(
  events: FalconEvent[],
  filters: EventFilterState
): {
  all: number;
  new: number;
  acknowledged: number;
  in_case: number;
  resolved: number;
} {
  // Base list filtered by everything except status
  const base = events.filter((e) => matchEvent(e, filters, { ignoreStatus: true }));

  const counts = {
    all: base.length,
    new: base.filter((e) => e.state === 'New').length,
    acknowledged: base.filter((e) => e.state === 'Acknowledged').length,
    in_case: base.filter((e) => e.state === 'In case').length,
    resolved: base.filter((e) => e.state === 'Resolved').length,
  };

  return counts;
}

/**
 * KPI Strip Counts (4 cells matching INBOX_FINAL).
 * Scoped to active context if context filter is applied.
 */
export function getKpiCounts(
  events: FalconEvent[],
  scopedFilters?: EventFilterState
): {
  newUnack: number;
  highAndCritical: number;
  withoutCase: number;
  todayEvents: number;
} {
  // If scoped by context (e.g. Alert history for CBL-005), evaluate on scoped list
  const base = scopedFilters ? filterEvents(events, scopedFilters) : events;

  return {
    newUnack: base.filter((e) => e.state === 'New').length,
    highAndCritical: base.filter((e) => e.priority === 'High' || e.priority === 'Critical').length,
    withoutCase: base.filter((e) => !e.caseId).length,
    todayEvents: base.filter(isEventToday).length,
  };
}

/**
 * Sorts events according to column and direction.
 * Priority sorts by severity rank: Critical (1) > High (2) > Medium (3) > Low (4).
 */
export function sortEvents(
  events: FalconEvent[],
  key: string,
  direction: 'asc' | 'desc'
): FalconEvent[] {
  return [...events].sort((a, b) => {
    let result = 0;

    if (key === 'priority') {
      const rankA = PRIORITY_RANK[a.priority] || 99;
      const rankB = PRIORITY_RANK[b.priority] || 99;
      result = rankA - rankB;
    } else if (key === 'status') {
      const rankA = STATUS_RANK[a.state] || 99;
      const rankB = STATUS_RANK[b.state] || 99;
      result = rankA - rankB;
    } else if (key === 'captured') {
      const numA = parseInt(a.id.replace(/\D/g, ''), 10);
      const numB = parseInt(b.id.replace(/\D/g, ''), 10);
      result = numA - numB; // descending num = newer
    } else {
      const valA = ((a as any)[key] || '').toString().toLowerCase();
      const valB = ((b as any)[key] || '').toString().toLowerCase();
      result = valA.localeCompare(valB);
    }

    return direction === 'asc' ? result : -result;
  });
}

/**
 * Generates standard CSV export adhering to section 3.1:
 * CSV columns: event ID, captured (ISO and MYT), type, source, device, asset, priority, status, case.
 * File name: "events_YYYY-MM-DD_HHMM.csv"
 */
export function exportEventsToCsv(eventsToExport: FalconEvent[]): void {
  const headers = [
    'Event ID',
    'Captured (ISO)',
    'Captured (MYT)',
    'Type',
    'Source',
    'Device',
    'Asset',
    'Priority',
    'Status',
    'Case ID',
  ];

  const rows = eventsToExport.map((e) => {
    const iso = e.captured.startsWith('2026') ? e.captured : `2026-10-20T16:28:00+08:00`;
    const myt = formatAbsoluteMYT(e.captured);
    return [
      e.id,
      `"${iso}"`,
      `"${myt}"`,
      `"${e.type}"`,
      `"${e.source}"`,
      e.device || 'N/A',
      e.asset,
      e.priority,
      e.state === 'In case' ? 'Case Created' : e.state,
      e.caseId || 'None',
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `events_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
