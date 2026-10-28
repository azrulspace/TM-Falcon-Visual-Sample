import type { RiskSegment, RiskFilterState, RiskSortKey } from '@/types/risk';
import type { FalconEvent } from '@/data/events';
import { formatId } from '@/lib/utils';

export interface RiskKpiCounts {
  totalToInspect: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  lowConfidence: number;
}

export interface RiskStatusCounts {
  all: number;
  to_inspect: number;
  investigating: number;
  dismissed: number;
}

/**
 * Calculates KPI strip metrics strictly from real segment fields for 'to_inspect' segments (Section 5.3).
 */
export function getRiskKpiCounts(segments: RiskSegment[]): RiskKpiCounts {
  const activeSegments = segments.filter((s) => s.status !== 'dismissed');

  return {
    totalToInspect: activeSegments.filter((s) => s.status === 'to_inspect').length,
    highPriority: activeSegments.filter((s) => s.status === 'to_inspect' && s.priority === 'High').length,
    mediumPriority: activeSegments.filter((s) => s.status === 'to_inspect' && s.priority === 'Medium').length,
    lowPriority: activeSegments.filter((s) => s.status === 'to_inspect' && s.priority === 'Low').length,
    lowConfidence: activeSegments.filter((s) => s.status === 'to_inspect' && s.confidence === 'Low').length,
  };
}

/**
 * Returns tab status counts (Section 5.3 & 5.4).
 */
export function getRiskStatusCounts(segments: RiskSegment[]): RiskStatusCounts {
  return {
    all: segments.length,
    to_inspect: segments.filter((s) => s.status === 'to_inspect').length,
    investigating: segments.filter((s) => s.status === 'investigating').length,
    dismissed: segments.filter((s) => s.status === 'dismissed').length,
  };
}

/**
 * Filters segments according to active criteria.
 */
export function filterRiskSegments(
  segments: RiskSegment[],
  filters: RiskFilterState
): RiskSegment[] {
  return segments.filter((s) => {
    // 1. Status tab filter
    if (filters.tab === 'to_inspect' && s.status !== 'to_inspect') return false;
    if (filters.tab === 'investigating' && s.status !== 'investigating') return false;
    if (filters.tab === 'dismissed' && s.status !== 'dismissed') return false;
    // 'all' includes to_inspect and investigating by default unless dismissed is specifically asked or in all
    // If in default view, dismissed items move out of the default list unless 'dismissed' or 'all' tab is active
    if (!filters.tab || filters.tab === 'to_inspect') {
      if (s.status === 'dismissed') return false;
    }

    // 2. Search query (matches segment ID, end assets, route)
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      const matchId = s.id.toLowerCase().includes(q) || formatId(s.id).toLowerCase().includes(q);
      const matchFrom = s.from.toLowerCase().includes(q) || formatId(s.from).toLowerCase().includes(q);
      const matchTo = s.to.toLowerCase().includes(q) || formatId(s.to).toLowerCase().includes(q);
      const matchRoute = s.route.toLowerCase().includes(q);
      const matchSpan = s.spanId.toLowerCase().includes(q) || formatId(s.spanId).toLowerCase().includes(q);
      if (!matchId && !matchFrom && !matchTo && !matchRoute && !matchSpan) return false;
    }

    // 3. Priority filter
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.includes(s.priority)) return false;
    }

    // 4. Route filter
    if (filters.route && filters.route.length > 0) {
      if (!filters.route.includes(s.route)) return false;
    }

    // 5. Confidence filter
    if (filters.confidence && filters.confidence.length > 0) {
      if (!filters.confidence.includes(s.confidence)) return false;
    }

    // 6. Explicit Status filter (from dropdown)
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(s.status)) return false;
    }

    return true;
  });
}

/**
 * Priority rank weight for sorting: High (3) > Medium (2) > Low (1).
 */
const priorityWeight: Record<string, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

/**
 * Confidence rank weight: High (3) > Medium (2) > Low (1).
 */
const confidenceWeight: Record<string, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

/**
 * Sorts segments based on selected sort key (Section 5.5).
 */
export function sortRiskSegments(
  segments: RiskSegment[],
  sortKey: RiskSortKey
): RiskSegment[] {
  const list = [...segments];

  switch (sortKey) {
    case 'urgent': // Default: Most urgent first based on priority and span confidence
      return list.sort((a, b) => {
        const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        if (pDiff !== 0) return pDiff;
        // If same priority, sort by confidence (High first for actionability)
        const cDiff = (confidenceWeight[b.confidence] || 0) - (confidenceWeight[a.confidence] || 0);
        if (cDiff !== 0) return cDiff;
        return a.id.localeCompare(b.id);
      });

    case 'priority':
      return list.sort((a, b) => {
        const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        return pDiff !== 0 ? pDiff : a.id.localeCompare(b.id);
      });

    case 'confidence':
      return list.sort((a, b) => {
        const cDiff = (confidenceWeight[b.confidence] || 0) - (confidenceWeight[a.confidence] || 0);
        return cDiff !== 0 ? cDiff : a.id.localeCompare(b.id);
      });

    case 'incidents':
      return list.sort((a, b) => {
        const countA = parseInt(a.basis.match(/\d+/)?.[0] || '0', 10);
        const countB = parseInt(b.basis.match(/\d+/)?.[0] || '0', 10);
        return countB - countA;
      });

    case 'last_incident':
      return list.sort((a, b) => {
        const timeA = a.lastIncidentTime ? new Date(a.lastIncidentTime).getTime() : 0;
        const timeB = b.lastIncidentTime ? new Date(b.lastIncidentTime).getTime() : 0;
        return timeB - timeA;
      });

    default:
      return list;
  }
}

/**
 * Helper to count events on a span in events.ts to maintain invariant.
 */
export function getSegmentIncidentCount(
  segment: RiskSegment,
  eventsList: FalconEvent[]
): number {
  const normSpan = formatId(segment.spanId);
  return eventsList.filter((e) => {
    if (!e.asset) return false;
    const normAsset = formatId(e.asset);
    return normAsset === normSpan || normAsset === formatId(segment.from) || normAsset === formatId(segment.to);
  }).length;
}

/**
 * Exports ranked segments to CSV file adhering to Section 5.2.
 */
export function exportRiskSegmentsToCsv(segments: RiskSegment[], filename = 'falcon_risk_segments.csv'): void {
  const headers = [
    'Rank',
    'Segment ID',
    'Span ID',
    'From Pole',
    'To Pole',
    'Route',
    'Priority',
    'Confidence',
    'Basis',
    'Suggested Action',
    'Status',
    'Last Incident',
    'Rule Version',
  ];

  const rows = segments.map((s, idx) => [
    idx + 1,
    s.id,
    s.spanId,
    s.from,
    s.to,
    s.route,
    s.priority,
    s.confidence,
    `"${s.basis.replace(/"/g, '""')}"`,
    s.action,
    s.status,
    s.lastIncidentTime || 'Not supplied',
    s.ruleVersion,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
