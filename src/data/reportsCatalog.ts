import type { ReportTemplateMeta } from '../types/reports.ts';

export const REPORT_TEMPLATES: ReportTemplateMeta[] = [
  {
    id: 'R1',
    slug: 'daily-operations',
    name: 'Daily operations',
    purpose: 'What happened on this shift and what must the next shift handle?',
    audience: ['Operator', 'Supervisor'],
    category: 'Operations',
    defaultPeriod: 'today',
    metricIds: [
      'events_total',
      'events_unacknowledged_now',
      'events_overdue_now',
      'cases_opened',
      'devices_by_state_now',
      'devices_online_but_stale_contact',
    ],
    scheduleSupported: true,
    scheduledFrequency: 'daily',
    isQuickReport: true,
    quickReportRank: 1,
  },
  {
    id: 'R2',
    slug: 'weekly-operations',
    name: 'Weekly operations',
    purpose: 'Weekly summary of detection volumes, response times, and network availability.',
    audience: ['Supervisor'],
    category: 'Operations',
    defaultPeriod: 'last_week',
    metricIds: [
      'events_total',
      'events_high_critical_share',
      'time_to_acknowledge',
      'cases_opened',
      'cases_closed',
      'availability_percent',
    ],
    scheduleSupported: true,
    scheduledFrequency: 'weekly',
    isQuickReport: true,
    quickReportRank: 2,
  },
  {
    id: 'R3',
    slug: 'event-incident-analysis',
    name: 'Event and incident analysis',
    purpose: 'Analyze incident clustering, repeat targets, and optical snapshot coverage.',
    audience: ['Supervisor', 'Planner'],
    category: 'Operations',
    defaultPeriod: 'last_30_days',
    metricIds: [
      'events_total',
      'events_by_source',
      'repeat_targets',
      'evidence_snapshot_rate',
      'evidence_clip_ready_rate',
    ],
    scheduleSupported: true,
    scheduledFrequency: 'monthly',
  },
  {
    id: 'R4',
    slug: 'response-sla-performance',
    name: 'Response and SLA performance',
    purpose: 'Evaluate speed of triage, case escalation, and SLA compliance against targets.',
    audience: ['Supervisor', 'Executive'],
    category: 'Cases',
    defaultPeriod: 'last_30_days',
    metricIds: [
      'time_to_acknowledge',
      'time_to_case',
      'time_to_close',
      'sla_compliance',
      'events_unacknowledged_now',
    ],
    scheduleSupported: true,
  },
  {
    id: 'R5',
    slug: 'case-management',
    name: 'Case management',
    purpose: 'Investigate case throughput, status aging funnel, closure root causes, and follow-ups.',
    audience: ['Supervisor'],
    category: 'Cases',
    defaultPeriod: 'last_30_days',
    metricIds: [
      'cases_opened',
      'cases_closed',
      'cases_open_end',
      'time_to_close',
      'cases_with_follow_up',
      'cases_reopened',
    ],
    scheduleSupported: true,
    scheduledFrequency: 'weekly',
  },
  {
    id: 'R6',
    slug: 'device-health-availability',
    name: 'Device health and availability',
    purpose: 'Fleet uptime availability, offline episodes, flapping transitions, and telemetry freshness.',
    audience: ['Supervisor', 'Administrator'],
    category: 'Network and devices',
    defaultPeriod: 'last_7_days',
    metricIds: [
      'devices_total',
      'availability_percent',
      'offline_time_total',
      'state_changes',
      'last_contact_age',
      'devices_not_installed',
    ],
    scheduleSupported: true,
    scheduledFrequency: 'weekly',
  },
  {
    id: 'R7',
    slug: 'asset-inventory-coverage',
    name: 'Asset inventory and coverage',
    purpose: 'Poles, cable spans, camera/speaker equipment rates, and unlocated physical assets.',
    audience: ['Planner'],
    category: 'Assets',
    defaultPeriod: 'last_30_days',
    metricIds: [
      'poles_total',
      'poles_without_location',
      'spans_total',
      'devices_total',
      'installation_coverage',
      'devices_not_installed',
    ],
    scheduleSupported: false,
  },
  {
    id: 'R8',
    slug: 'risk-preventive-work',
    name: 'Risk and preventive work',
    purpose: 'Prioritized risk corridors, repeat incident recurrence, and field inspection decisions.',
    audience: ['Planner', 'Executive'],
    category: 'Risk and planning',
    defaultPeriod: 'last_30_days',
    metricIds: [
      'risk_segments_by_priority',
      'risk_basis',
      'risk_decisions',
      'risk_recurrence',
      'repeat_targets',
    ],
    scheduleSupported: true,
    scheduledFrequency: 'monthly',
  },
  {
    id: 'R9',
    slug: 'evidence-clip-usage',
    name: 'Evidence and clip usage',
    purpose: 'Audit on-demand RTSP video clip extraction requests, failure rates, and storage footprint.',
    audience: ['Administrator'],
    category: 'Review and compliance',
    defaultPeriod: 'last_30_days',
    metricIds: [
      'clip_requests',
      'evidence_clip_ready_rate',
      'evidence_snapshot_rate',
      'events_without_evidence',
    ],
    scheduleSupported: true,
    scheduledFrequency: 'monthly',
  },
  {
    id: 'R10',
    slug: 'executive-summary',
    name: 'Executive summary',
    purpose: 'Unified operations, network health, and governance briefing for executive leadership and government reviewers.',
    audience: ['Executive', 'Government reviewer'],
    category: 'Review and compliance',
    defaultPeriod: 'last_month',
    metricIds: [
      'events_total',
      'events_high_critical_share',
      'cases_closed',
      'time_to_acknowledge',
      'availability_percent',
      'risk_segments_by_priority',
    ],
    scheduleSupported: true,
    scheduledFrequency: 'monthly',
    isQuickReport: true,
    quickReportRank: 3,
  },
  {
    id: 'R11',
    slug: 'audit-log',
    name: 'Audit log',
    purpose: 'Immutable forensic trail of actions, actors, state mutations, and system changes for compliance.',
    audience: ['Administrator'],
    category: 'Review and compliance',
    defaultPeriod: 'last_7_days',
    metricIds: ['audit_entries'],
    scheduleSupported: true,
    scheduledFrequency: 'weekly',
  },
  {
    id: 'R12',
    slug: 'data-quality',
    name: 'Data quality',
    purpose: 'Vendor Edge sync health, unmapped hardware conflicts, stale telemetry, and data trust audit.',
    audience: ['Administrator', 'Supervisor'],
    category: 'Review and compliance',
    defaultPeriod: 'last_30_days',
    metricIds: [
      'vendor_sync_age',
      'vendor_conflicts',
      'devices_online_but_stale_contact',
      'poles_without_location',
      'events_without_evidence',
      'simulated_share',
    ],
    scheduleSupported: true,
    scheduledFrequency: 'weekly',
  },
];

/**
 * Returns recommended template IDs for a given user role.
 * If role is unknown, returns empty list so row is cleanly hidden.
 */
export function getRecommendedReportIdsForRole(role?: string | null): string[] {
  if (!role) return [];
  const r = role.toLowerCase();
  if (r.includes('operator')) {
    return ['R1']; // Daily operations
  }
  if (r.includes('supervisor')) {
    return ['R2', 'R4', 'R5']; // Weekly operations, Response and SLA, Case management
  }
  if (r.includes('executive') || r.includes('government') || r.includes('review')) {
    return ['R10', 'R8']; // Executive summary, Risk and preventive work
  }
  if (r.includes('planner')) {
    return ['R8', 'R7']; // Risk and preventive work, Asset inventory and coverage
  }
  if (r.includes('admin') || r.includes('compliance') || r.includes('system')) {
    return ['R11', 'R12', 'R9', 'R6']; // Audit log, Data quality, Evidence and clip usage, Device health
  }
  return [];
}

export const REPORTS_CATALOG = REPORT_TEMPLATES;

