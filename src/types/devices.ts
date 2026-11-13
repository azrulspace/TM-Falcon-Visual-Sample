import type { PoleLocation, CableSpanRecord } from './assets.ts';
import type { FalconEvent } from '../data/events.ts';

/**
 * Connectivity state reported by Edge/vendor telemetry.
 * Strictly separate from administrative Lifecycle and physical Installation.
 */
export type DeviceConnectivityState = 'online' | 'offline' | 'stale';

/**
 * Administrative record lifecycle.
 * Strictly separate from live connectivity state.
 */
export type DeviceLifecycleState = 'Active' | 'Planned' | 'Maintenance' | 'Retired';

export type DeviceTypeCategory = 'Camera' | 'Speaker' | 'LiDAR sensor' | 'Gateway';

export type DeviceConfigStatus =
  | 'None'
  | 'Applied'
  | 'Sending'
  | 'Pending'
  | 'Failed'
  | 'Partly applied';

export type ConfigSettingEdgeResultStatus = 'Applied' | 'Failed' | 'Pending';

export interface DeviceConfigSettingResult {
  key: string;
  label: string;
  sentValue: unknown;
  previousValue?: unknown;
  status: ConfigSettingEdgeResultStatus;
  errorMessage?: string;
  reportedAt?: string | null;
}

export interface DeviceConfigVersion {
  id: string;
  versionLabel: string; // e.g. 'cfg-1', 'cfg-2'
  createdAt: string; // ISO MYT
  createdBy: string;
  note?: string | null;
  rollbackOfVersion?: string | null;
  status: Exclude<DeviceConfigStatus, 'None'>;
  values: Record<string, unknown>;
  changedKeys: string[];
  results: DeviceConfigSettingResult[];
}

export interface DeviceConnectivityPeriod {
  id: string;
  state: DeviceConnectivityState;
  from: string; // ISO MYT
  to: string | null; // null = Current
  recordedBy: string; // e.g. 'Telemetry'
  note?: string | null;
}

export type DeviceTimelineKind =
  | 'Registered'
  | 'Edited'
  | 'Installed'
  | 'Uninstalled'
  | 'Configuration'
  | 'Lifecycle'
  | 'Connection check'
  | 'Vendor sync'
  | 'Conflict resolved';

export interface DeviceTimelineEntry {
  id: string;
  kind: DeviceTimelineKind;
  message: string;
  field?: string;
  fromValue?: string | null;
  toValue?: string | null;
  actor: string | null;
  timestamp: string; // ISO MYT
}

export interface DeviceInstallationRecord {
  id: string;
  poleIdentifier: string;
  poleName?: string | null;
  siteName: string;
  from: string; // ISO MYT
  to: string | null; // null = currently installed
  actor: string;
  note?: string | null;
  uninstallReason?: string | null;
}

export interface DeviceHealthReportRecord {
  id: string;
  reportedAt: string; // ISO MYT
  state: DeviceConnectivityState;
  batteryPercent: number | null;
  temperatureC: number | null;
  signalStrengthDbm?: number | null;
  softwareVersion: string | null;
  source: 'Telemetry' | 'Edge health poll';
  note?: string | null;
}

export interface DeviceConnectionCheckResult {
  status: 'Never checked' | 'Pass' | 'Fail';
  checkedAt: string | null;
  message: string | null;
  latencyMs?: number | null;
}

export interface DeviceRecord {
  /** Verbatim identifier (e.g. "DEV-001", "GS6306382", "GV0032063", "DEV-JBL-01") */
  identifier: string;
  name: string;
  type: DeviceTypeCategory;
  manufacturer: string;
  library: string;
  model: string;
  serial: string;
  /** Vendor-side device ID / serial reported to Edge */
  vendorDeviceId: string;
  /** Optional raw identifier source hint when backend distinguishes serial-named records */
  identifierKind?: 'Registry' | 'Vendor serial';
  siteId: string | null;
  siteName: string | null; // null or 'Unassigned'
  connectivityState: DeviceConnectivityState;
  lifecycle: DeviceLifecycleState;
  installedPoleId: string | null;
  registeredAt: string;
  lastUpdatedAt: string;
  lastContactAt: string | null;
  batteryPercent: number | null;
  temperatureC: number | null;
  softwareVersion: string | null;
  connectionCheck: DeviceConnectionCheckResult;
  components: string[];
  configVersion: string | null; // e.g. 'cfg-2' or null
  configStatus: DeviceConfigStatus;
  configReportedAt: string | null;
  /** Last reported configuration map keyed by schema field key */
  configuration: Record<string, unknown>;
  configVersions: DeviceConfigVersion[];
  connectivityPeriods: DeviceConnectivityPeriod[];
  timeline: DeviceTimelineEntry[];
  installationHistory: DeviceInstallationRecord[];
  healthReports: DeviceHealthReportRecord[];
  /** Explicit test record flag if provided by backend */
  isTest?: boolean;
}

export type VendorMatchStatus = 'Registered' | 'Not registered' | 'Conflict';

export interface VendorDiscoveryRecord {
  id: string;
  serial: string;
  vendorName: string;
  model: string;
  manufacturer: string;
  library: string;
  vendorState: DeviceConnectivityState;
  matchStatus: VendorMatchStatus;
  /** FALCON identifier currently claiming or matching this record */
  matchedFalconId: string | null;
  /** Explicit reason when matchStatus === 'Conflict' */
  conflictReason: string | null;
  lastSeenAt: string;
  /** Number of recent events attributed under raw serial before mapping resolution */
  rawSerialEventsCount?: number;
}

export interface VendorSyncSummary {
  library: string;
  lastFullSyncAt: string;
  lastListReloadAt: string;
  source: string;
  totalVendorDevices: number;
}

export interface DeviceWithRelations extends DeviceRecord {
  /** Resolved installed pole site & WGS84 coordinates */
  installedPoleName: string | null;
  installedPoleSiteName: string | null;
  installedPoleLifecycle: string | null;
  location: PoleLocation | null;
  isInstalled: boolean;
  /** All events matching this device (across full history + 30d window) */
  events30dCount: number;
  allEventsCount: number;
  deviceEvents: FalconEvent[];
  /** Cable spans anchored to the pole this device is installed on */
  poleSpans: CableSpanRecord[];
  /** Active vendor discovery conflict involving this device, if any */
  vendorConflict: VendorDiscoveryRecord | null;
  /** Config failed/pending settings count */
  configIssueCount: number;
  /** Whether this device appears mismatched against explicit staleness policy */
  isStaleByPolicy: boolean;
}

export type DeviceStatusTab = 'all' | 'online' | 'offline' | 'stale' | 'not_installed';

export type DeviceSortKey =
  | 'identifier'
  | 'type'
  | 'connectivityState'
  | 'lastContactAt'
  | 'events30dCount'
  | 'configVersion'
  | 'installedPoleId';

export type DeviceSortDir = 'asc' | 'desc';

export interface DeviceFilterState {
  statusTab: DeviceStatusTab;
  viewMode: 'table' | 'map';
  search?: string;
  types?: DeviceTypeCategory[];
  manufacturers?: string[];
  libraries?: string[];
  site?: string; // 'ALL', 'Unassigned', or specific siteName
  installationFilter?: 'all' | 'installed' | 'not_installed';
  lastContactRange?: 'all' | '1h' | '24h' | '7d' | 'older_24h';
  configFilter?: 'all' | 'applied' | 'none' | 'issues';
  lifecycle?: DeviceLifecycleState[];
  needsAttentionOnly?: boolean;
  hideTestRecords?: boolean;
}

export interface DeviceSavedView {
  id: string;
  name: string;
  isDefault?: boolean;
  filters: Partial<DeviceFilterState> & {
    sortKey?: DeviceSortKey;
    sortDir?: DeviceSortDir;
  };
}

export interface DevicePolicyConfig {
  /** Explicit server-supplied staleness threshold in hours. Null means backend does not supply one. */
  staleThresholdHours: number | null;
  stalePolicyLabel: string | null;
}

export interface AvailabilitySummary {
  windowHours: number;
  onlinePercent: number | null;
  stalePercent: number | null;
  offlinePercent: number | null;
  onlineMs: number;
  staleMs: number;
  offlineMs: number;
  coveredMs: number;
  transitionsCount: number;
  longestOfflineMs: number;
  periodsUsedCount: number;
  basisLabel: string;
}

