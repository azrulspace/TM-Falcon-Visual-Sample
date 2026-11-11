export type PoleLifecycle =
  | 'Active'
  | 'Inactive'
  | 'Maintenance'
  | 'Planned'
  | 'Retired'
  | 'Deleted';

export interface PoleLocation {
  lat: number;
  lng: number;
}

export interface PoleLifecyclePeriod {
  id: string;
  status: PoleLifecycle;
  from: string; // ISO MYT
  to: string | null; // null = Current
  note?: string | null;
  recordedBy: string;
  recordedAt: string; // ISO MYT
}

export type PoleTimelineKind =
  | 'Location'
  | 'Change'
  | 'Lifecycle'
  | 'Registered'
  | 'Deleted';

export interface PoleTimelineEntry {
  id: string;
  kind: PoleTimelineKind;
  message: string;
  field?: string;
  fromValue?: string | null;
  toValue?: string | null;
  coordinates?: PoleLocation | null;
  actor: string | null;
  timestamp: string; // ISO MYT
}

export interface SiteRecord {
  id: string;
  name: string;
  centrePoint: PoleLocation | null;
  /** Backend gap: boundary GeoJSON is not provided by staging API */
  boundary?: null;
}

export interface PoleRecord {
  /** User-entered identifier, displayed verbatim as stored (never passed through formatId) */
  identifier: string;
  name: string;
  type: 'Pole';
  lifecycle: PoleLifecycle;
  siteId: string;
  siteName: string;
  location: PoleLocation | null;
  /** Optional Overview 1000x700 SVG coordinates for AST-* prototype parity */
  canvasPoint?: { x: number; y: number } | null;
  protection: string | null;
  note: string | null;
  registeredAt: string;
  lastUpdatedAt: string;
  lifecycleStartedAt: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
  deleteReason?: string | null;
  /** Optional backend test flag. Never inferred from identifier. */
  isTest?: boolean;
  lifecycleHistory: PoleLifecyclePeriod[];
  timeline: PoleTimelineEntry[];
}

export interface CableSpanRecord {
  /** User-entered or canonical span identifier displayed verbatim */
  identifier: string;
  name: string;
  type: 'Cable span';
  lifecycle: PoleLifecycle;
  siteId: string;
  siteName: string;
  fromPole: string;
  toPole: string;
  lengthKm?: number | null;
  path?: [number, number][] | null;
  route?: string;
}

export interface DeviceSummaryRecord {
  id: string;
  name: string;
  type: string;
  lifecycle: string;
  site: string;
  status: string;
  lastContact: string;
  asset: string;
  manufacturer: string;
  model: string;
  serial: string;
  location: string;
}

export interface PoleWithRelations extends PoleRecord {
  linkedDevices: DeviceSummaryRecord[];
  linkedDevicesCount: number;
  connectedSpans: CableSpanRecord[];
  cableSpansCount: number;
  events30dCount: number;
  allEventsCount: number;
  siteCentrePoint: PoleLocation | null;
  distanceFromCentreMeters: number | null;
}

export type PoleSortKey = 'identifier' | 'lifecycle' | 'lastUpdatedAt' | 'registeredAt';
export type PoleSortDir = 'asc' | 'desc';

export interface PoleFilterState {
  statusTab: 'active' | 'deleted';
  viewMode: 'table' | 'map';
  search?: string;
  lifecycle?: PoleLifecycle[];
  /** Selected site name, or 'ALL' for All sites */
  site?: string;
  locationFilter?: 'all' | 'has_location' | 'missing_location';
  protection?: string[];
  linkedDevice?: 'all' | 'with' | 'without';
  withEvents30d?: boolean;
  updatedRange?: 'all' | '24h' | '7d' | '30d';
  hideTestRecords?: boolean;
}

export interface PoleSavedView {
  id: string;
  name: string;
  isDefault?: boolean;
  filters: Partial<PoleFilterState> & {
    sortKey?: PoleSortKey;
    sortDir?: PoleSortDir;
  };
}

export interface BackendCapabilities {
  bulkDelete: boolean;
  restore: boolean;
  linkDevice: boolean;
  testFlag: boolean;
  deleteReasonPersisted: boolean;
  relocateReasonPersisted: boolean;
  serverImpactCheck: boolean;
  serverUniquenessCheck: boolean;
  siteBoundary: boolean;
}

