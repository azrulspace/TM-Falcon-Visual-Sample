import type { PoleLocation } from './assets';

export type DeviceConnectivityState = 'online' | 'offline' | 'stale';

export type DeviceHardwareType = 'Camera' | 'Speaker' | 'Sensor' | 'Gateway' | 'LiDAR sensor';

export interface DeviceLifecyclePeriod {
  id: string;
  record: 'Connectivity';
  status: DeviceConnectivityState;
  from: string; // ISO MYT
  to: string | null; // null = Current
  durationMinutes: number;
  note?: string | null;
  recordedBy: string; // e.g. 'Telemetry'
  recordedAt: string; // ISO MYT
}

export type DeviceTimelineKind =
  | 'Registered'
  | 'Installed'
  | 'Configuration'
  | 'Connectivity'
  | 'Change';

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

export interface SettingResult {
  settingKey: string;
  status: 'Applied' | 'Pending' | 'Failed';
  reason?: string;
  appliedAt?: string;
}

export interface ConfigurationVersion {
  versionNumber: number;
  versionLabel: string; // e.g. 'cfg-2'
  appliedAt: string;
  appliedBy: string;
  reason?: string;
  settings: Record<string, any>;
  results: SettingResult[];
}

export type DeviceConfigVersion = ConfigurationVersion;

export interface DeviceRecord {
  /** User-entered or registry identifier, displayed verbatim in mono (never through formatId) */
  identifier: string;
  name: string;
  type: DeviceHardwareType;
  /** Connectivity state from telemetry: strictly 'online', 'offline', or 'stale' */
  state: DeviceConnectivityState;
  /** Stored last contact timestamp (ISO MYT or human string) */
  lastContact: string;
  /** Last contact Date object for accurate math */
  lastContactIso: string;
  
  // Hardware and Vendor Info
  manufacturer: string;
  model: string;
  serialNumber: string; // Vendor serial number
  library: string; // e.g. 'HIK_OpenAPI'
  vendorDeviceId: string;
  softwareVersion?: string;
  batteryLevel?: number | null; // null = 'Not reported'
  temperatureC?: number | null; // null = 'Not reported'
  connectionCheck?: {
    lastCheckedAt: string | null;
    result: string;
  };
  components: string[];

  // Installation & Site Context
  siteId: string;
  siteName: string;
  installedOnPoleId: string | null; // null = 'Not installed'
  installedAt?: string | null;
  installedBy?: string | null;
  location: PoleLocation | null; // Derived strictly from installed pole location

  // Configuration
  appliedConfigVersion: string | null; // e.g. 'cfg-2' or null ('None')
  configStatus?: 'Applied' | 'Pending' | 'Failed';
  currentSettings?: Record<string, any>;
  reportedSettings?: Record<string, any>;
  reportedSettingsTimestamp?: string;
  configVersions: ConfigurationVersion[];

  // Historical Telemetry & Timeline
  connectivityHistory: DeviceLifecyclePeriod[];
  timeline: DeviceTimelineEntry[];
  installationHistory: {
    id: string;
    poleId: string;
    from: string;
    to: string | null;
    installedBy: string;
    note?: string | null;
  }[];

  // Health Reports
  healthReports: {
    id: string;
    title: string;
    date: string;
    result: 'Passed' | 'Warning' | 'Failed';
    summary: string;
  }[];

  // Associated event count (30d)
  events30dCount?: number;
}

export type VendorMatchStatus = 'Registered' | 'Not registered' | 'Conflict';

export interface VendorDeviceRecord {
  serialNumber: string;
  vendorName: string;
  vendorModel: string;
  vendorState: 'Online' | 'Offline at vendor';
  matchStatus: VendorMatchStatus;
  mappedFalconId: string | null;
  explanation: string;
  conflictDetails?: {
    claimedFalconId: string;
    currentMappedSerial: string;
    eventsAttributedToClaimed: number;
    eventsAttributedToVendorSerial: number;
  };
}

export interface DeviceAvailabilityMetrics {
  totalRecordsCount: number;
  onlinePercent: number;
  stalePercent: number;
  offlinePercent: number;
  stateChangesCount: number;
  longestOfflineMinutes: number;
  computationBasis: string;
}

export type DeviceSortKey =
  | 'identifier'
  | 'state'
  | 'lastContact'
  | 'events'
  | 'type'
  | 'installedOn';

export type DeviceSortDir = 'asc' | 'desc';

export interface DeviceFilterState {
  statusTab: 'all' | 'online' | 'offline' | 'stale';
  viewMode: 'table' | 'map';
  search?: string;
  type?: DeviceHardwareType[];
  vendor?: string[];
  library?: string[];
  site?: string;
  installation?: 'all' | 'installed' | 'not_installed';
  lastContactRange?: 'all' | '1h' | '24h' | 'older_24h' | 'never';
  configStatus?: 'all' | 'none' | 'applied' | 'pending' | 'failed';
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
