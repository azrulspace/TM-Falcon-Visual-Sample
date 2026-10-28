export type RiskPriority = 'High' | 'Medium' | 'Low';
export type RiskConfidence = 'High' | 'Medium' | 'Low';
export type SegmentStatus = 'to_inspect' | 'investigating' | 'dismissed';

export interface RiskSegment {
  id: string; // Canonical hyphenated ID: "SEG-01", "SEG-02", etc.
  spanId: string; // Corresponding cable span ID e.g. "CBL-001"
  route: string; // "Route 01", "Route 02", "Route 03", "Route 04"
  from: string; // Terminal pole A e.g. "AST-001"
  to: string; // Terminal pole B e.g. "AST-002"
  priority: RiskPriority;
  confidence: RiskConfidence;
  basis: string; // e.g. "3 incidents in the last 30 days, rule v1 (sample)"
  action: 'Inspect' | 'Monitor' | 'Protect';
  path: [number, number][]; // SVG map canvas coordinate path
  ruleVersion: string; // "v1"
  windowDays: number; // 30
  computedAt: string; // ISO string e.g. "2026-10-27T22:30:00+08:00"
  status: SegmentStatus;
  investigatedAt?: string;
  investigatedBy?: string;
  workOrderId?: string;
  dismissedAt?: string;
  dismissedBy?: string;
  dismissReason?: string;
  dismissNote?: string;
  lastIncidentTime?: string; // ISO string or formatted timestamp
}

export interface RiskFilterState {
  tab: 'all' | 'to_inspect' | 'investigating' | 'dismissed';
  search?: string;
  priority?: RiskPriority[];
  route?: string[];
  confidence?: RiskConfidence[];
  status?: SegmentStatus[];
}

export type RiskSortKey = 'urgent' | 'priority' | 'confidence' | 'incidents' | 'last_incident';
