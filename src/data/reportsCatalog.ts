import type { ReportTemplateMeta, PeriodPreset, ReportAudience } from '../types/reports.ts';

export interface ConsolidatedReportMeta {
  id: string; // e.g. 'R1', 'R10', ...
  slug: string; // URL slug: 'executive-summary', 'operations', etc.
  name: string; // Plain language name
  purpose: string; // What question the report answers
  group: 'Overview' | 'Operations' | 'Cases' | 'Network' | 'Planning' | 'Review';
  audience: ReportAudience[];
  defaultPeriod: PeriodPreset;
  availablePresets: PeriodPreset[];
  metricIds: string[];
  scheduleSupported: boolean;
  scheduledFrequency?: 'daily' | 'weekly' | 'monthly' | null;
  requiresPermission?: 'audit_log';
}

/**
 * The 8 consolidated reports mandated by the TM Falcon Stakeholder Verdict.
 */
export const CONSOLIDATED_REPORTS: ConsolidatedReportMeta[] = [
  // 1. Overview group
  {
    id: 'R10',
    slug: 'executive-summary',
    name: 'Executive summary',
    purpose: 'How is the network and the response doing?',
    group: 'Overview',
    audience: ['Executive', 'Government reviewer', 'Administrator'],
    defaultPeriod: 'last_30_days',
    availablePresets: ['last_7_days', 'last_30_days', 'last_month', 'custom'],
    metricIds: [
      'events_total',
      'events_high_critical_share',
      'cases_closed',
      'availability_percent',
      'risk_segments_by_priority',
    ],
    scheduleSupported: true,
    scheduledFrequency: 'monthly',
  },

  // 2. Operations group
  {
    id: 'R1',
    slug: 'operations',
    name: 'Operations',
    purpose: 'What happened and what must be handled next?',
    group: 'Operations',
    audience: ['Operator', 'Supervisor'],
    defaultPeriod: 'today',
    availablePresets: ['today', 'yesterday', 'last_week', 'last_month'],
    metricIds: [
      'events_total',
      'events_unacknowledged_now',
      'events_overdue_now',
      'cases_opened',
      'devices_by_state_now',
    ],
    scheduleSupported: true,
    scheduledFrequency: 'daily',
  },

  // 3. Cases group
  {
    id: 'R5',
    slug: 'cases-response',
    name: 'Cases and response',
    purpose: 'Are cases handled and closed in good time?',
    group: 'Cases',
    audience: ['Supervisor'],
    defaultPeriod: 'last_30_days',
    availablePresets: ['last_7_days', 'last_30_days', 'last_month', 'custom'],
    metricIds: [
      'cases_opened',
      'cases_closed',
      'cases_open_end',
      'time_to_close',
      'time_to_acknowledge',
    ],
    scheduleSupported: true,
    scheduledFrequency: 'weekly',
  },

  // 4. Network group
  {
    id: 'R6',
    slug: 'network-health',
    name: 'Network health',
    purpose: 'Are the cameras and speakers working?',
    group: 'Network',
    audience: ['Supervisor', 'Administrator'],
    defaultPeriod: 'last_7_days',
    availablePresets: ['today', 'yesterday', 'last_7_days', 'last_30_days', 'custom'],
    metricIds: [
      'devices_total',
      'availability_percent',
      'offline_time_total',
      'state_changes',
      'devices_online_but_stale_contact',
    ],
    scheduleSupported: true,
    scheduledFrequency: 'weekly',
  },

  // 5. Planning group: Risk
  {
    id: 'R8',
    slug: 'risk-preventive-work',
    name: 'Risk and preventive work',
    purpose: 'Where should we inspect or protect next?',
    group: 'Planning',
    audience: ['Planner', 'Executive'],
    defaultPeriod: 'last_30_days',
    availablePresets: ['last_7_days', 'last_30_days', 'last_month', 'custom'],
    metricIds: [
      'risk_segments_by_priority',
      'risk_basis',
      'risk_decisions',
      'risk_recurrence',
      'load_analysis',
    ],
    scheduleSupported: true,
    scheduledFrequency: 'monthly',
  },

  // 6. Planning group: Assets
  {
    id: 'R7',
    slug: 'assets-coverage',
    name: 'Assets and coverage',
    purpose: 'Do we know what we have and is it covered?',
    group: 'Planning',
    audience: ['Planner'],
    defaultPeriod: 'last_30_days',
    availablePresets: ['today', 'last_7_days', 'last_30_days', 'custom'],
    metricIds: [
      'poles_total',
      'poles_without_location',
      'spans_total',
      'devices_total',
      'devices_not_installed',
    ],
    scheduleSupported: false,
  },

  // 7. Review group: Data quality
  {
    id: 'R12',
    slug: 'data-quality',
    name: 'Data quality',
    purpose: 'Can we trust the numbers?',
    group: 'Review',
    audience: ['Administrator', 'Supervisor'],
    defaultPeriod: 'today',
    availablePresets: ['today', 'yesterday', 'last_7_days', 'last_30_days', 'custom'],
    metricIds: [
      'vendor_sync_age',
      'vendor_conflicts',
      'devices_online_but_stale_contact',
      'poles_without_location',
      'simulated_share',
    ],
    scheduleSupported: true,
    scheduledFrequency: 'weekly',
  },

  // 8. Review group: Audit log
  {
    id: 'R11',
    slug: 'audit-log',
    name: 'Audit log',
    purpose: 'Who did what and when?',
    group: 'Review',
    audience: ['Administrator'],
    defaultPeriod: 'last_7_days',
    availablePresets: ['today', 'last_7_days', 'last_30_days', 'custom'],
    metricIds: ['audit_entries'],
    scheduleSupported: true,
    scheduledFrequency: 'weekly',
    requiresPermission: 'audit_log',
  },
];

/**
 * Mapping table from old templates (R1-R12) to the new 8 consolidated reports.
 */
export const OLD_SLUG_MAP: Record<string, { targetSlug: string; preset?: PeriodPreset }> = {
  // Slug mappings
  'daily-operations': { targetSlug: 'operations', preset: 'today' },
  'weekly-operations': { targetSlug: 'operations', preset: 'last_week' },
  'event-incident-analysis': { targetSlug: 'operations', preset: 'last_month' },
  'response-sla-performance': { targetSlug: 'cases-response' },
  'response-time-sla': { targetSlug: 'cases-response' },
  'case-management': { targetSlug: 'cases-response' },
  'device-health-availability': { targetSlug: 'network-health' },
  'asset-inventory-coverage': { targetSlug: 'assets-coverage' },
  'risk-preventive-work': { targetSlug: 'risk-preventive-work' },
  'evidence-clip-usage': { targetSlug: 'operations' },
  'evidence-clip-performance': { targetSlug: 'operations' },
  'executive-summary': { targetSlug: 'executive-summary' },
  'audit-log': { targetSlug: 'audit-log' },
  'compliance-audit-trail': { targetSlug: 'audit-log' },
  'data-quality': { targetSlug: 'data-quality' },
  'data-trust-health': { targetSlug: 'data-quality' },

  // ID mappings
  r1: { targetSlug: 'operations', preset: 'today' },
  r2: { targetSlug: 'operations', preset: 'last_week' },
  r3: { targetSlug: 'operations', preset: 'last_month' },
  r4: { targetSlug: 'cases-response' },
  r5: { targetSlug: 'cases-response' },
  r6: { targetSlug: 'network-health' },
  r7: { targetSlug: 'assets-coverage' },
  r8: { targetSlug: 'risk-preventive-work' },
  r9: { targetSlug: 'operations' },
  r10: { targetSlug: 'executive-summary' },
  r11: { targetSlug: 'audit-log' },
  r12: { targetSlug: 'data-quality' },
};

/**
 * Resolves a report by its slug or old identifier.
 */
export function getReportBySlug(slugOrId: string): ConsolidatedReportMeta | undefined {
  if (!slugOrId) return undefined;
  const norm = slugOrId.toLowerCase().trim();

  // Direct match on consolidated slugs
  const direct = CONSOLIDATED_REPORTS.find(
    (r) => r.slug.toLowerCase() === norm || r.id.toLowerCase() === norm
  );
  if (direct) return direct;

  // Check old mapping
  const mapped = OLD_SLUG_MAP[norm];
  if (mapped) {
    return CONSOLIDATED_REPORTS.find((r) => r.slug === mapped.targetSlug);
  }

  return undefined;
}

/**
 * Returns default report per Section 4.2:
 * 1. Last opened report from localStorage
 * 2. Role defaults (Operator -> Operations/Today, Supervisor -> Operations/Last week, etc.)
 * 3. Permission fallback
 */
export function getDefaultReportForUser(
  userRole?: string | null,
  canViewAuditLog = false
): { slug: string; preset: PeriodPreset; compareWithPrevious?: boolean } {
  // 1. Check last opened report
  try {
    const saved = localStorage.getItem('falcon_last_report');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.slug) {
        const report = getReportBySlug(parsed.slug);
        if (report) {
          if (report.slug !== 'audit-log' || canViewAuditLog) {
            return {
              slug: report.slug,
              preset: parsed.preset || report.defaultPeriod,
              compareWithPrevious: parsed.compareWithPrevious ?? (report.slug === 'executive-summary'),
            };
          }
        }
      }
    }
  } catch {
    // Ignore fallback
  }

  // 2. Role defaults
  const norm = (userRole || '').toLowerCase();
  if (norm.includes('operator')) {
    return { slug: 'operations', preset: 'today' };
  }
  if (norm.includes('supervisor')) {
    return { slug: 'operations', preset: 'last_week' };
  }
  if (norm.includes('planner')) {
    return { slug: 'risk-preventive-work', preset: 'last_30_days' };
  }
  if (norm.includes('executive') || norm.includes('government') || norm.includes('review')) {
    return { slug: 'executive-summary', preset: 'last_30_days', compareWithPrevious: true };
  }
  if (norm.includes('admin') || norm.includes('system')) {
    return { slug: 'executive-summary', preset: 'last_30_days' };
  }

  // Fallback
  return { slug: 'executive-summary', preset: 'last_30_days', compareWithPrevious: true };
}

/**
 * Stores the last opened report parameters per user in localStorage.
 */
export function saveLastOpenedReport(
  slug: string,
  preset: PeriodPreset,
  site?: string,
  compareWithPrevious?: boolean
) {
  try {
    localStorage.setItem(
      'falcon_last_report',
      JSON.stringify({
        slug,
        preset,
        site,
        compareWithPrevious,
        timestamp: new Date().toISOString(),
      })
    );
  } catch {
    // Ignore fallback
  }
}

/**
 * Compatibility alias for legacy imports
 */
export const REPORT_TEMPLATES: ReportTemplateMeta[] = CONSOLIDATED_REPORTS.map((r) => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  purpose: r.purpose,
  audience: r.audience,
  category: r.group,
  defaultPeriod: r.defaultPeriod,
  metricIds: r.metricIds,
  scheduleSupported: r.scheduleSupported,
  scheduledFrequency: r.scheduledFrequency,
}));

export function getRecommendedReportIdsForRole(userRole?: string | null): string[] {
  const norm = (userRole || '').toLowerCase();
  if (norm.includes('operator')) return ['R1'];
  if (norm.includes('supervisor')) return ['R1', 'R5'];
  if (norm.includes('planner')) return ['R8', 'R7'];
  if (norm.includes('executive') || norm.includes('government') || norm.includes('review')) {
    return ['R10', 'R8'];
  }
  if (norm.includes('admin') || norm.includes('system')) {
    return ['R10', 'R11', 'R12', 'R6'];
  }
  return ['R10'];
}

export const REPORTS_CATALOG = REPORT_TEMPLATES;
