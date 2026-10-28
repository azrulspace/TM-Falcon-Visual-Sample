import type { FalconEvent } from '../data/events.ts';

export type CaseStatus = 'Open' | 'In progress' | 'In review' | 'Closed';

export type CasePriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type AssigneeType = 'person' | 'team' | 'unassigned';

export interface CaseActivityEntry {
  id: string;
  type: 'created' | 'assigned' | 'status_change' | 'note' | 'verification' | 'field_work' | 'closure';
  text: string;
  actor: string;
  timestamp: string; // ISO string with offset
  fieldChanges?: { field: string; from: string; to: string }[];
}

export interface CaseVerificationData {
  verifiedBy?: string;
  verifiedAt?: string;
  passCriteria?: boolean;
  checkedItems?: string[];
  notes?: string;
  lastSavedBy?: string;
  lastSavedAt?: string;
}

export interface CaseFieldFindingsData {
  findingsSummary?: string;
  equipmentUsed?: string;
  actionTaken?: string;
  technicianNotes?: string;
  photos?: string[];
  recordedBy?: string;
  recordedAt?: string;
  lastSavedBy?: string;
  lastSavedAt?: string;
  isSubmitted?: boolean;
  submittedBy?: string;
  submittedAt?: string;
}

export interface CaseClosureData {
  rootCause?: string;
  resolutionNotes?: string;
  closedBy?: string;
  closedAt?: string;
  followUpRequired?: boolean;
  lastSavedBy?: string;
  lastSavedAt?: string;
}

export interface FalconCase {
  id: string; // e.g. CAS-0007
  sourceEventId: string; // e.g. EVT-0257
  title: string;
  status: CaseStatus;
  assignee: string | null;
  assigneeType: AssigneeType;
  createdAt: string; // ISO 8601 string in MYT
  lastUpdatedAt: string; // ISO 8601 string in MYT
  closedAt: string | null; // ISO 8601 string in MYT
  verification?: CaseVerificationData;
  fieldFindings?: CaseFieldFindingsData;
  closure?: CaseClosureData;
  activities: CaseActivityEntry[];
}

export interface CaseWithSourceEvent extends FalconCase {
  sourceEvent?: FalconEvent;
}
