import type { FalconCase, CaseStatus, CaseWithSourceEvent } from '../types/cases.ts';
import type { FalconEvent } from './events.ts';
import { parseDate, getServerNow, formatAbsoluteMYT } from '../lib/dateTime.ts';

export interface CaseFilterState {
  tab?: 'all' | 'open' | 'in_progress' | 'in_review' | 'closed';
  search?: string;
  status?: CaseStatus[] | string;
  openOnly?: boolean;
  assignee?: string[] | string;
  timeRange?: 'today' | '24h' | '7d' | '30d' | 'custom' | string;
  customTimeStart?: string;
  customTimeEnd?: string;
  priority?: string[] | string;
  type?: string[] | string;
  asset?: string;
  device?: string;
  sourceEventId?: string;
}

export const CASE_STATUS_WORKFLOW_RANK: Record<CaseStatus, number> = {
  Open: 1,
  'In progress': 2,
  'In review': 3,
  Closed: 4,
};

/**
 * Enriches a FalconCase with its source FalconEvent data.
 */
export function joinCaseWithEvent(c: FalconCase, eventMap: Map<string, FalconEvent>): CaseWithSourceEvent {
  const sourceEvent = eventMap.get(c.sourceEventId);
  return {
    ...c,
    sourceEvent,
  };
}

/**
 * Creates a Map of source events keyed by event ID for O(1) lookup.
 */
export function createEventMap(events: FalconEvent[]): Map<string, FalconEvent> {
  const map = new Map<string, FalconEvent>();
  for (const e of events) {
    map.set(e.id, e);
  }
  return map;
}

/**
 * Formats duration between two timestamps as a human readable string.
 * e.g., "5d 19h", "1d 21h", "3h 15m", "45m"
 */
export function formatDurationBetween(
  startDate: string | number | Date | null | undefined,
  endDate: string | number | Date | null | undefined
): string {
  if (!startDate || !endDate) return '—';
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) return '—';

  const diffMs = Math.max(0, end.getTime() - start.getTime());
  const diffMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(diffMinutes / 1440);
  const hours = Math.floor((diffMinutes % 1440) / 60);
  const minutes = diffMinutes % 60;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

/**
 * Calculates the case age.
 * - Non-closed case: duration from createdAt to now.
 * - Closed case: duration from createdAt to closedAt (if closedAt is available, else null).
 */
export function getCaseAge(
  c: FalconCase,
  nowInput?: Date | null
): {
  durationText: string | null;
  totalMinutes: number;
  isClosed: boolean;
} {
  const now = nowInput ?? getServerNow();
  const created = parseDate(c.createdAt);
  if (!created) {
    return { durationText: null, totalMinutes: 0, isClosed: c.status === 'Closed' };
  }

  if (c.status === 'Closed') {
    if (!c.closedAt) {
      return { durationText: null, totalMinutes: 0, isClosed: true };
    }
    const closed = parseDate(c.closedAt);
    if (!closed) {
      return { durationText: null, totalMinutes: 0, isClosed: true };
    }
    const diffMs = Math.max(0, closed.getTime() - created.getTime());
    const totalMinutes = Math.floor(diffMs / 60000);
    return {
      durationText: formatDurationBetween(created, closed),
      totalMinutes,
      isClosed: true,
    };
  }

  // Non-closed case
  const diffMs = Math.max(0, now.getTime() - created.getTime());
  const totalMinutes = Math.floor(diffMs / 60000);
  return {
    durationText: formatDurationBetween(created, now),
    totalMinutes,
    isClosed: false,
  };
}

/**
 * Core case filter matcher.
 */
export function matchCase(
  c: CaseWithSourceEvent,
  filters: CaseFilterState,
  options?: { ignoreStatus?: boolean }
): boolean {
  // Context filters
  if (filters.asset && c.sourceEvent?.asset !== filters.asset) return false;
  if (filters.device && c.sourceEvent?.device !== filters.device) return false;
  if (filters.sourceEventId && c.sourceEventId !== filters.sourceEventId) return false;

  // Status & tab filters (only if not ignored for faceted status counts)
  if (!options?.ignoreStatus) {
    if (filters.tab && filters.tab !== 'all') {
      const tabNorm = filters.tab.toLowerCase();
      if (tabNorm === 'open' && c.status !== 'Open') return false;
      if (tabNorm === 'in_progress' && c.status !== 'In progress') return false;
      if (tabNorm === 'in_review' && c.status !== 'In review') return false;
      if (tabNorm === 'closed' && c.status !== 'Closed') return false;
    }

    if (filters.openOnly && c.status === 'Closed') return false;

    if (filters.status) {
      const allowed = Array.isArray(filters.status)
        ? filters.status
        : filters.status.split(',').map((s) => s.trim() as CaseStatus);
      if (allowed.length > 0 && !allowed.includes(c.status)) return false;
    }
  }

  // Assignee filter
  if (filters.assignee) {
    const assignees = Array.isArray(filters.assignee)
      ? filters.assignee
      : filters.assignee.split(',').map((s) => s.trim());
    if (assignees.length > 0) {
      const matchesAssignee = assignees.some((target) => {
        if (target.toLowerCase() === 'unassigned') {
          return !c.assignee || c.assigneeType === 'unassigned';
        }
        return c.assignee && c.assignee.toLowerCase().includes(target.toLowerCase());
      });
      if (!matchesAssignee) return false;
    }
  }

  // Priority filter (from source event)
  if (filters.priority) {
    const priorities = Array.isArray(filters.priority)
      ? filters.priority
      : filters.priority.split(',').map((p) => p.trim().toLowerCase());
    if (priorities.length > 0) {
      const evtPriority = (c.sourceEvent?.priority || '').toLowerCase();
      if (!priorities.includes(evtPriority)) return false;
    }
  }

  // Type filter (from source event)
  if (filters.type) {
    const types = Array.isArray(filters.type)
      ? filters.type
      : filters.type.split(',').map((t) => t.trim().toLowerCase());
    if (types.length > 0) {
      const evtType = (c.sourceEvent?.type || '').toLowerCase();
      if (!types.includes(evtType)) return false;
    }
  }

  // Time range filter (Created date in MYT)
  if (filters.timeRange) {
    const createdDate = parseDate(c.createdAt);
    if (!createdDate) return false;
    const now = getServerNow();

    if (filters.timeRange === 'today') {
      // Check MYT calendar date
      const createdMYT = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(createdDate);
      const nowMYT = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(now);
      if (createdMYT !== nowMYT) return false;
    } else if (filters.timeRange === '24h') {
      const diffMs = now.getTime() - createdDate.getTime();
      if (diffMs > 24 * 3600 * 1000 || diffMs < 0) return false;
    } else if (filters.timeRange === '7d') {
      const diffMs = now.getTime() - createdDate.getTime();
      if (diffMs > 7 * 24 * 3600 * 1000 || diffMs < 0) return false;
    } else if (filters.timeRange === '30d') {
      const diffMs = now.getTime() - createdDate.getTime();
      if (diffMs > 30 * 24 * 3600 * 1000 || diffMs < 0) return false;
    } else if (filters.timeRange === 'custom' && (filters.customTimeStart || filters.customTimeEnd)) {
      if (filters.customTimeStart) {
        const start = parseDate(filters.customTimeStart);
        if (start && createdDate.getTime() < start.getTime()) return false;
      }
      if (filters.customTimeEnd) {
        const end = parseDate(filters.customTimeEnd);
        if (end && createdDate.getTime() > end.getTime()) return false;
      }
    }
  }

  // Search filter (debounced 250ms query):
  // case ID, source event ID, asset ID, device ID, assignee name, case title
  if (filters.search && filters.search.trim().length > 0) {
    const q = filters.search.trim().toLowerCase();
    const caseId = c.id.toLowerCase();
    const eventId = c.sourceEventId.toLowerCase();
    const assetId = (c.sourceEvent?.asset || '').toLowerCase();
    const deviceId = (c.sourceEvent?.device || '').toLowerCase();
    const assignee = (c.assignee || 'unassigned').toLowerCase();
    const title = (c.title || '').toLowerCase();
    const type = (c.sourceEvent?.type || '').toLowerCase();

    const matches =
      caseId.includes(q) ||
      eventId.includes(q) ||
      assetId.includes(q) ||
      deviceId.includes(q) ||
      assignee.includes(q) ||
      title.includes(q) ||
      type.includes(q);

    if (!matches) return false;
  }

  return true;
}

/**
 * Filter cases with enriched event data.
 */
export function filterCases(
  cases: FalconCase[],
  filters: CaseFilterState,
  events: FalconEvent[]
): CaseWithSourceEvent[] {
  const eventMap = createEventMap(events);
  const enriched = cases.map((c) => joinCaseWithEvent(c, eventMap));
  return enriched.filter((c) => matchCase(c, filters));
}

export interface CaseStatusCounts {
  all: number;
  open: number;
  in_progress: number;
  in_review: number;
  closed: number;
}

/**
 * Returns faceted counts for status tabs.
 * Invariant (Section 6.4 & 9):
 * All must equal sum of Open + In progress + In review + Closed.
 */
export function getCaseStatusCounts(
  cases: FalconCase[],
  filters: CaseFilterState,
  events: FalconEvent[]
): CaseStatusCounts {
  const eventMap = createEventMap(events);
  const enriched = cases.map((c) => joinCaseWithEvent(c, eventMap));

  let open = 0;
  let in_progress = 0;
  let in_review = 0;
  let closed = 0;

  for (const c of enriched) {
    // Check if case matches all filters EXCEPT status & tab
    if (matchCase(c, filters, { ignoreStatus: true })) {
      switch (c.status) {
        case 'Open':
          open++;
          break;
        case 'In progress':
          in_progress++;
          break;
        case 'In review':
          in_review++;
          break;
        case 'Closed':
          closed++;
          break;
      }
    }
  }

  return {
    all: open + in_progress + in_review + closed,
    open,
    in_progress,
    in_review,
    closed,
  };
}

export interface CaseKpiCounts {
  open: number;
  inProgress: number;
  inReview: number;
  unassigned: number;
  oldestOpenAge: string | null;
  oldestOpenCaseId: string | null;
}

/**
 * Returns KPI strip values computed only from real fields (Section 6.3).
 * Open, In progress, In review, Unassigned (non-closed cases without assignee),
 * and Oldest open (age of oldest non-closed case).
 */
export function getCaseKpiCounts(
  cases: FalconCase[],
  nowInput?: Date | null
): CaseKpiCounts {
  const now = nowInput ?? getServerNow();
  let open = 0;
  let inProgress = 0;
  let inReview = 0;
  let unassigned = 0;

  let oldestCreatedMs = Infinity;
  let oldestCaseId: string | null = null;
  let oldestCaseCreatedAt: string | null = null;

  for (const c of cases) {
    if (c.status === 'Open') open++;
    else if (c.status === 'In progress') inProgress++;
    else if (c.status === 'In review') inReview++;

    // Unassigned: non-closed case without an assignee
    if (c.status !== 'Closed' && (!c.assignee || c.assigneeType === 'unassigned')) {
      unassigned++;
    }

    // Oldest open: non-closed case with smallest createdAt timestamp
    if (c.status !== 'Closed') {
      const parsed = parseDate(c.createdAt);
      if (parsed && parsed.getTime() < oldestCreatedMs) {
        oldestCreatedMs = parsed.getTime();
        oldestCaseId = c.id;
        oldestCaseCreatedAt = c.createdAt;
      }
    }
  }

  const oldestOpenAge = oldestCaseCreatedAt
    ? formatDurationBetween(oldestCaseCreatedAt, now)
    : null;

  return {
    open,
    inProgress,
    inReview,
    unassigned,
    oldestOpenAge,
    oldestOpenCaseId: oldestCaseId,
  };
}

export type CaseSortKey = 'created' | 'case' | 'status' | 'age';
export type SortDirection = 'asc' | 'desc';

/**
 * Sorts cases.
 * Status sorts by workflow rank (Open -> In progress -> In review -> Closed), NOT alphabetical!
 */
export function sortCases(
  items: CaseWithSourceEvent[],
  sortKey: CaseSortKey = 'created',
  direction: SortDirection = 'desc',
  nowInput?: Date | null
): CaseWithSourceEvent[] {
  const now = nowInput ?? getServerNow();
  const sorted = [...items];

  sorted.sort((a, b) => {
    let cmp = 0;

    switch (sortKey) {
      case 'created': {
        const timeA = parseDate(a.createdAt)?.getTime() ?? 0;
        const timeB = parseDate(b.createdAt)?.getTime() ?? 0;
        cmp = timeA - timeB;
        break;
      }

      case 'case': {
        // Alphanumeric case ID comparison e.g. CAS-0007 vs CAS-0006
        cmp = a.id.localeCompare(b.id, undefined, { numeric: true });
        break;
      }

      case 'status': {
        // Workflow sequence order (Section 6.6): Open (1) -> In progress (2) -> In review (3) -> Closed (4)
        const rankA = CASE_STATUS_WORKFLOW_RANK[a.status] || 99;
        const rankB = CASE_STATUS_WORKFLOW_RANK[b.status] || 99;
        cmp = rankA - rankB;
        break;
      }

      case 'age': {
        const ageA = getCaseAge(a, now).totalMinutes;
        const ageB = getCaseAge(b, now).totalMinutes;
        cmp = ageA - ageB;
        break;
      }
    }

    return direction === 'asc' ? cmp : -cmp;
  });

  return sorted;
}

/**
 * Exports filtered cases to CSV string matching specification (Section 6.1):
 * Columns: case ID, source event, asset, device, status, assignees, created (ISO and MYT), age.
 */
export function exportCasesToCsv(
  items: CaseWithSourceEvent[],
  nowInput?: Date | null
): string {
  const now = nowInput ?? getServerNow();
  const headers = [
    'Case ID',
    'Source Event',
    'Asset',
    'Device',
    'Status',
    'Assignees',
    'Created (ISO)',
    'Created (MYT)',
    'Age',
  ];

  const escapeCsv = (val: string | null | undefined): string => {
    if (!val) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = items.map((c) => {
    const age = getCaseAge(c, now).durationText || '—';
    const mytCreated = formatAbsoluteMYT(c.createdAt);
    const assigneeStr = c.assignee || 'Unassigned';

    return [
      escapeCsv(c.id),
      escapeCsv(c.sourceEventId),
      escapeCsv(c.sourceEvent?.asset || '—'),
      escapeCsv(c.sourceEvent?.device || '—'),
      escapeCsv(c.status),
      escapeCsv(assigneeStr),
      escapeCsv(c.createdAt),
      escapeCsv(mytCreated),
      escapeCsv(age),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
