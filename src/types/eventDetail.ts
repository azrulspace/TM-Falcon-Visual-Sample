/**
 * Types and View Model contracts for the Event Detail domain.
 * Enforces strict data truthfulness: missing values are null, never invented defaults.
 */

import type { SlaComputationResult } from '@/config/slaPolicy';

export interface EventTimelineEntry {
  id: string;
  icon: 'received' | 'classified' | 'acknowledged' | 'case' | 'assigned' | 'note' | 'dismissed' | 'resolved';
  text: string;
  actor: string;
  time: string;
}

export interface VendorDataDTO {
  vendorCode: string;
  rule: string;
  ruleId?: string;
  category?: string;
  subCategory?: string;
  vendorPriority?: string;
  vendorPriorityColor?: string;
  state?: number | string;
  channel?: string;
  channelId?: string;
  channelType?: string;
  sensorPayload?: Record<string, any>;
  [key: string]: any;
}

export interface EventDetailDTO {
  id: string;
  type: string;
  source: 'Edge service' | 'Manual' | 'Partner feed';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  state: 'New' | 'Acknowledged' | 'In case' | 'Assigned' | 'Dismissed' | 'Resolved' | 'Closed';
  status: 'New' | 'Acknowledged' | 'In case' | 'Assigned' | 'Dismissed' | 'Resolved' | 'Closed';
  device: string | null;
  deviceStatus?: 'online' | 'offline' | 'stale';
  asset: string;
  assetType?: string;
  poles?: [string, string];
  caseId: string | null;
  captured: string;
  receivedAt?: string | null;
  observed?: string | null;
  detection: string;
  ruleCode?: string;
  vendorCode?: string;
  assignee: string | null;
  acknowledgedAt?: string | null;
  slaMinutes?: number;
  snapshots: string[];
  rawJson?: VendorDataDTO | Record<string, any>;
  timeline?: EventTimelineEntry[];
  location?: {
    lat: number;
    lng: number;
    coordinatesText?: string;
  } | null;
  // Optional detection bounding box if supplied by API
  detectionBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
    confidence?: number;
  } | null;
}

export interface EventDetailCapabilities {
  hasMultipleFrames: boolean;
  hasDetectionBox: boolean;
  hasCoordinates: boolean;
  hasVendorData: boolean;
  canAcknowledge: boolean;
  canCreateCase: boolean;
  canAssign: boolean;
  canDismiss: boolean;
  canExport: boolean;
}

export interface EventDetailViewModel {
  id: string;
  formattedId: string;
  type: string;
  source: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'New' | 'Acknowledged' | 'In case' | 'Assigned' | 'Dismissed' | 'Resolved' | 'Closed';
  caseId: string | null;
  assignee: string | null;

  // Compatibility fields for subcomponents
  captured?: string;
  device?: string | null;
  asset?: string | null;
  
  // Truthful timestamps
  capturedAt: Date | null;
  capturedDisplay: string;
  capturedRelative: string;
  receivedAt: Date | null;
  receivedDisplay: string | null;
  
  // Detection facts
  detectionRule: string;
  observed: string | null;
  policyNote: string;
  
  // Entity relations
  sourceDevice: {
    id: string;
    name: string;
    status: 'online' | 'offline' | 'stale';
    lat: number | null;
    lng: number | null;
    site?: string;
  } | null;
  
  affectedAsset: {
    id: string;
    name: string;
    type: string;
    connectingAssets: [string, string] | null;
    lat: number | null;
    lng: number | null;
  } | null;

  // Evidence snapshot
  evidence: {
    snapshots: string[];
    primarySnapshot: string;
    cameraChannel: string | null;
    detectionRule: string;
    detectionRegion: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null;
    confidence: number | null;
    downloadFilename: string;
  };

  // Vendor telemetry
  vendorData: {
    vendorCode: string;
    rule: string;
    ruleId: string;
    category: string;
    subCategory: string;
    vendorPriority: string;
    vendorPriorityColor: string;
    state: string;
    channel: string;
    channelId: string;
    channelType: string;
    rawJson: Record<string, any>;
  };

  // Computed SLA
  sla: SlaComputationResult | null;

  // Lifecycle & Timeline
  timeline: EventTimelineEntry[];
  
  // Capabilities
  capabilities: EventDetailCapabilities;

  // Provenance flag
  isMock: boolean;
}
