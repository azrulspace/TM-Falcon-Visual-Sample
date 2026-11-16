export type ReportCategory =
  | 'Operations'
  | 'Cases'
  | 'Network and devices'
  | 'Risk and planning'
  | 'Assets'
  | 'Review and compliance';

export type ReportAudience =
  | 'Operator'
  | 'Supervisor'
  | 'Executive'
  | 'Planner'
  | 'Administrator'
  | 'Government reviewer';

export type PeriodPreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'custom';

export interface ReportDateRange {
  preset: PeriodPreset;
  startIso: string; // Inclusive start in Asia/Kuala_Lumpur
  endIso: string; // Exclusive end in Asia/Kuala_Lumpur
  label: string; // e.g. "Mon 3 Nov to Sun 9 Nov 2026"
  previousStartIso?: string;
  previousEndIso?: string;
}

export interface ReportParameters {
  reportId?: string;
  periodPreset?: PeriodPreset;
  customStartDate?: string;
  customEndDate?: string;
  dateRange?: ReportDateRange;
  site: string; // specific site or 'All sites'
  compareWithPrevious: boolean;
  includeSimulated?: boolean;
  includeSimulatedEvents?: boolean;
  // Report-specific parameters
  priorityFilter?: string[];
  teamFilter?: string;
  deviceTypeFilter?: string;
  repeatThreshold?: number; // for repeat targets, default 3
  staleThresholdHours?: number; // for stale contact, default 24
}

export interface ReportDelta {
  diff: number;
  percent: number | null;
  direction: 'up' | 'down' | 'flat';
  formattedText: string;
}

export interface ReportKpiItem {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  status?: 'computable now' | 'needs backend' | 'not available';
  missingReason?: string;
  delta?: ReportDelta | null;
  isInverseDelta?: boolean;
  subtext?: string;
}

export interface MetricDefinition {
  id: string;
  label: string;
  description: string;
  formula: string;
  inclusionRules: string;
  unit: string;
  status: 'computable now' | 'needs backend' | 'not available';
  missingFieldReason?: string;
  source: 'Events' | 'Cases' | 'Devices' | 'Poles' | 'Risk' | 'Audit' | 'Vendor' | 'Data quality' | 'Cross-domain';
}

export interface ReportTemplateMeta {
  id: string; // e.g. 'R1', 'R2', ...
  slug: string; // e.g. 'daily-operations'
  name: string;
  purpose: string;
  audience: ReportAudience[];
  category: ReportCategory;
  defaultPeriod: PeriodPreset;
  metricIds: string[];
  scheduleSupported: boolean;
  lastGeneratedAt?: string | null;
  scheduledFrequency?: 'daily' | 'weekly' | 'monthly' | null;
  isQuickReport?: boolean;
  quickReportRank?: number;
}

export interface ReportSnapshot {
  id: string; // e.g. "REP-20261116-0001"
  templateId: string;
  templateName: string;
  parameters: ReportParameters;
  generatedAt: string; // ISO MYT
  generatedBy: string;
  dataFreshnessAt: string;
  dictionaryVersion: string;
  recordCount: number;
  format: 'PDF' | 'CSV' | 'Parameters only';
  sizeBytes?: number;
  status: 'Completed' | 'Parameters only' | 'Failed';
}

export interface ScheduledReportConfig {
  id: string;
  templateId: string;
  reportName: string;
  parametersSummary: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  timeMyt: string; // e.g. "07:00 MYT"
  dayOfWeek?: number; // 1 = Monday
  dayOfMonth?: number;
  nextRunMyt: string;
  recipients: string[];
  format: 'PDF' | 'CSV';
  owner: string;
  isActive: boolean;
  lastRunStatus?: 'Success' | 'Failed' | 'Paused' | 'Pending';
  lastRunAt?: string | null;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO MYT
  actor: string;
  role: string;
  action: string;
  targetType: 'Pole' | 'Device' | 'Cable span' | 'Case' | 'Event' | 'Configuration' | 'Vendor';
  targetId: string;
  details: string;
  fromValue?: string | null;
  toValue?: string | null;
  result: 'Success' | 'Warning' | 'Error';
}
