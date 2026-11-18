import type { DeviceWithRelations } from '../../types/devices.ts';
import type { PoleRecord } from '../../types/assets.ts';
import type { FalconEvent } from '../../data/events.ts';
import { DEFAULT_LIVE_STATE_THRESHOLDS } from '../../lib/liveCameras.ts';
import { getPreviewSessionState } from './previewConfig.ts';

/**
 * Creates dynamic ISO timestamp relative to now.
 * Ensures timestamps tick smoothly without hardcoding static dates.
 */
function makeRelativeDate(minutesAgo: number, baseDate = new Date()): string {
  const d = new Date(baseDate.getTime() - minutesAgo * 60 * 1000);
  return d.toISOString();
}

export interface PreviewCameraSpec {
  identifier: string;
  name: string;
  model: string;
  manufacturer: string;
  library: string;
  defaultMinutesAgo: number;
  components: string[];
  installedPoleId: string;
  siteName: string;
  lat: number;
  lng: number;
  hasAudio: boolean;
  hasTalk: boolean;
  hasPtz: boolean;
  isMobileData: boolean;
  supportsVideo: boolean;
  eventType: string;
  eventMinutesAgo: number;
  eventPriority: 'Critical' | 'High' | 'Medium' | 'Low';
  snapshotUrl?: string | null;
}

export const PREVIEW_CAMERA_SPECS: PreviewCameraSpec[] = [
  // 1. DEV-001: Online. Hero camera with PTZ, Presets, Zoom, Audio, Talk, Mobile Data.
  {
    identifier: 'DEV-001',
    name: 'DEV-001 (PTZ Solar)',
    model: 'DS-2CFSP4/4G',
    manufacturer: 'Hikvision',
    library: 'HIK_OpenAPI',
    defaultMinutesAgo: 2,
    components: ['PTZ', 'Pan', 'Tilt', 'Zoom', 'Presets', 'Speaker', 'Microphone', 'Talk', 'Audio', '4G', 'Solar'],
    installedPoleId: 'TGP_P010',
    siteName: 'Teluk Panglima Garang',
    lat: 2.90958,
    lng: 101.47013,
    hasAudio: true,
    hasTalk: true,
    hasPtz: true,
    isMobileData: true,
    supportsVideo: true,
    eventType: 'Monkey near cable',
    eventMinutesAgo: 20,
    eventPriority: 'Critical',
    snapshotUrl: '/monkey-fiber.jpg',
  },
  // 2. DEV-002: Offline (28d ago).
  {
    identifier: 'DEV-002',
    name: 'DEV-002 (Fixed Audio)',
    model: 'DS-2CD2043G2-I',
    manufacturer: 'Hikvision',
    library: 'HIK_OpenAPI',
    defaultMinutesAgo: 28 * 24 * 60,
    components: ['Fixed', 'Microphone', 'Audio'],
    installedPoleId: 'TGP_P002',
    siteName: 'Teluk Panglima Garang',
    lat: 2.90991,
    lng: 101.47102,
    hasAudio: true,
    hasTalk: false,
    hasPtz: false,
    isMobileData: false,
    supportsVideo: true,
    eventType: 'Vandalism',
    eventMinutesAgo: 28 * 24 * 60 + 60,
    eventPriority: 'High',
    snapshotUrl: null,
  },
  // 3. DEV-003: Offline (28d ago).
  {
    identifier: 'DEV-003',
    name: 'DEV-003 (Substation)',
    model: 'DS-2CD2043G2-I',
    manufacturer: 'Hikvision',
    library: 'HIK_OpenAPI',
    defaultMinutesAgo: 28 * 24 * 60,
    components: ['Fixed'],
    installedPoleId: 'TGP_P004',
    siteName: 'Teluk Panglima Garang',
    lat: 2.91040,
    lng: 101.47190,
    hasAudio: false,
    hasTalk: false,
    hasPtz: false,
    isMobileData: false,
    supportsVideo: true,
    eventType: 'Pole tilt',
    eventMinutesAgo: 28 * 24 * 60 + 90,
    eventPriority: 'Medium',
    snapshotUrl: null,
  },
  // 4. DEV-004: Offline (29d ago).
  {
    identifier: 'DEV-004',
    name: 'DEV-004 (Edge Feeder)',
    model: 'DS-2CD2043G2-I',
    manufacturer: 'Hikvision',
    library: 'Hikvision_Edge_v2',
    defaultMinutesAgo: 29 * 24 * 60,
    components: ['Fixed'],
    installedPoleId: 'AST-006',
    siteName: 'Teluk Panglima Garang',
    lat: 2.90870,
    lng: 101.47260,
    hasAudio: false,
    hasTalk: false,
    hasPtz: false,
    isMobileData: false,
    supportsVideo: true,
    eventType: 'Overheight vehicle',
    eventMinutesAgo: 29 * 24 * 60 + 120,
    eventPriority: 'Critical',
    snapshotUrl: null,
  },
  // 5. DEV-005: Offline (28d ago).
  {
    identifier: 'DEV-005',
    name: 'DEV-005 (Trunk PTZ)',
    model: 'DS-2CFSP4/4G',
    manufacturer: 'Hikvision',
    library: 'HIK_OpenAPI',
    defaultMinutesAgo: 28 * 24 * 60,
    components: ['PTZ', 'Pan', 'Tilt', 'Zoom', '4G', 'Solar'],
    installedPoleId: 'TGP_P005',
    siteName: 'Teluk Panglima Garang',
    lat: 2.91102,
    lng: 101.47310,
    hasAudio: false,
    hasTalk: false,
    hasPtz: true,
    isMobileData: true,
    supportsVideo: true,
    eventType: 'Camera fault',
    eventMinutesAgo: 28 * 24 * 60 + 150,
    eventPriority: 'Low',
    snapshotUrl: null,
  },
  // 6. DEV-006: Offline (28d ago).
  {
    identifier: 'DEV-006',
    name: 'DEV-006 (Legacy)',
    model: 'DS-2CD2043G2-I',
    manufacturer: 'Hikvision',
    library: 'Legacy_Snapshot_Driver',
    defaultMinutesAgo: 28 * 24 * 60,
    components: ['Fixed'],
    installedPoleId: 'TGP_P006',
    siteName: 'Teluk Panglima Garang',
    lat: 2.91160,
    lng: 101.47420,
    hasAudio: false,
    hasTalk: false,
    hasPtz: false,
    isMobileData: false,
    supportsVideo: false,
    eventType: 'Vegetation encroachment',
    eventMinutesAgo: 28 * 24 * 60 + 180,
    eventPriority: 'High',
    snapshotUrl: null,
  },
  // 7. DEV-007: Offline (28d ago).
  {
    identifier: 'DEV-007',
    name: 'DEV-007 (Remote Span)',
    model: 'DS-2CD2043G2-I',
    manufacturer: 'Hikvision',
    library: 'HIK_OpenAPI',
    defaultMinutesAgo: 28 * 24 * 60,
    components: ['Fixed'],
    installedPoleId: 'TGP_P008',
    siteName: 'Teluk Panglima Garang',
    lat: 2.91080,
    lng: 101.47400,
    hasAudio: false,
    hasTalk: false,
    hasPtz: false,
    isMobileData: true,
    supportsVideo: true,
    eventType: 'Wire sag',
    eventMinutesAgo: 28 * 24 * 60 + 200,
    eventPriority: 'Medium',
    snapshotUrl: null,
  },
  // 8. DEV-008: Offline (28d ago).
  {
    identifier: 'DEV-008',
    name: 'DEV-008 (Offline Unit)',
    model: 'DS-2CFSP4/4G',
    manufacturer: 'Hikvision',
    library: 'HIK_OpenAPI',
    defaultMinutesAgo: 28 * 24 * 60,
    components: ['PTZ', '4G'],
    installedPoleId: 'AST-011',
    siteName: 'Teluk Panglima Garang',
    lat: 2.90801,
    lng: 101.47001,
    hasAudio: false,
    hasTalk: false,
    hasPtz: true,
    isMobileData: true,
    supportsVideo: true,
    eventType: 'Vegetation encroachment',
    eventMinutesAgo: 28 * 24 * 60 + 60,
    eventPriority: 'Critical',
    snapshotUrl: null,
  },
  // 9. DEV-009: Offline (28d ago).
  {
    identifier: 'DEV-009',
    name: 'DEV-009 (East Ring)',
    model: 'DS-2CD2043G2-I',
    manufacturer: 'Hikvision',
    library: 'HIK_OpenAPI',
    defaultMinutesAgo: 28 * 24 * 60,
    components: ['Fixed'],
    installedPoleId: 'AST-012',
    siteName: 'Teluk Panglima Garang',
    lat: 2.90833,
    lng: 101.47120,
    hasAudio: false,
    hasTalk: false,
    hasPtz: false,
    isMobileData: false,
    supportsVideo: true,
    eventType: 'Person near pole',
    eventMinutesAgo: 28 * 24 * 60 + 90,
    eventPriority: 'Medium',
    snapshotUrl: null,
  },
  // 10. DEV-010: Offline (28d ago).
  {
    identifier: 'DEV-010',
    name: 'DEV-010 (North Tower)',
    model: 'DS-2CD2043G2-I',
    manufacturer: 'Hikvision',
    library: 'HIK_OpenAPI',
    defaultMinutesAgo: 28 * 24 * 60,
    components: ['Fixed'],
    installedPoleId: 'AST-013',
    siteName: 'Teluk Panglima Garang',
    lat: 2.90770,
    lng: 101.47330,
    hasAudio: false,
    hasTalk: false,
    hasPtz: false,
    isMobileData: false,
    supportsVideo: true,
    eventType: 'Power loss',
    eventMinutesAgo: 28 * 24 * 60 + 120,
    eventPriority: 'Low',
    snapshotUrl: null,
  },
  // 11. DEV-011: Offline (28d ago).
  {
    identifier: 'DEV-011',
    name: 'DEV-011 (Bridge West)',
    model: 'DS-2CD2043G2-I',
    manufacturer: 'Hikvision',
    library: 'HIK_OpenAPI',
    defaultMinutesAgo: 28 * 24 * 60,
    components: ['Fixed'],
    installedPoleId: 'AST-070',
    siteName: 'Teluk Panglima Garang',
    lat: 2.90720,
    lng: 101.47390,
    hasAudio: false,
    hasTalk: false,
    hasPtz: false,
    isMobileData: false,
    supportsVideo: true,
    eventType: 'Cable sag',
    eventMinutesAgo: 28 * 24 * 60 + 140,
    eventPriority: 'Medium',
    snapshotUrl: null,
  },
  // 12. DEV-012: Offline (28d ago).
  {
    identifier: 'DEV-012',
    name: 'DEV-012 (Delta Spur)',
    model: 'DS-2CD2043G2-I',
    manufacturer: 'Hikvision',
    library: 'HIK_OpenAPI',
    defaultMinutesAgo: 28 * 24 * 60,
    components: ['Fixed'],
    installedPoleId: 'AST-014',
    siteName: 'Teluk Panglima Garang',
    lat: 2.90690,
    lng: 101.47410,
    hasAudio: false,
    hasTalk: false,
    hasPtz: false,
    isMobileData: false,
    supportsVideo: true,
    eventType: 'Vegetation encroachment',
    eventMinutesAgo: 28 * 24 * 60 + 180,
    eventPriority: 'High',
    snapshotUrl: null,
  },
  // 13. DEV-013: Offline (28d ago).
  {
    identifier: 'DEV-013',
    name: 'DEV-013 (River Outpost)',
    model: 'DS-2CD2043G2-I',
    manufacturer: 'Hikvision',
    library: 'HIK_OpenAPI',
    defaultMinutesAgo: 28 * 24 * 60,
    components: ['Fixed'],
    installedPoleId: 'AST-015',
    siteName: 'Teluk Panglima Garang',
    lat: 2.90655,
    lng: 101.47430,
    hasAudio: false,
    hasTalk: false,
    hasPtz: false,
    isMobileData: false,
    supportsVideo: true,
    eventType: 'Overheight vehicle',
    eventMinutesAgo: 28 * 24 * 60 + 210,
    eventPriority: 'Medium',
    snapshotUrl: null,
  },
  // 14. DEV-014: Offline (28d ago).
  {
    identifier: 'DEV-014',
    name: 'DEV-014 (South Perimeter)',
    model: 'DS-2CD2043G2-I',
    manufacturer: 'Hikvision',
    library: 'HIK_OpenAPI',
    defaultMinutesAgo: 28 * 24 * 60,
    components: ['Fixed'],
    installedPoleId: 'AST-016',
    siteName: 'Teluk Panglima Garang',
    lat: 2.90630,
    lng: 101.47450,
    hasAudio: false,
    hasTalk: false,
    hasPtz: false,
    isMobileData: false,
    supportsVideo: true,
    eventType: 'Pole tilt',
    eventMinutesAgo: 28 * 24 * 60 + 240,
    eventPriority: 'Medium',
    snapshotUrl: null,
  },
  // 15. DEV-015: Offline (28d ago).
  {
    identifier: 'DEV-015',
    name: 'DEV-015 (Uninstalled Spares)',
    model: 'DS-2CD2043G2-I',
    manufacturer: 'Hikvision',
    library: 'HIK_OpenAPI',
    defaultMinutesAgo: 28 * 24 * 60,
    components: ['Fixed'],
    installedPoleId: 'AST-017',
    siteName: 'Teluk Panglima Garang',
    lat: 2.90600,
    lng: 101.47470,
    hasAudio: false,
    hasTalk: false,
    hasPtz: false,
    isMobileData: false,
    supportsVideo: true,
    eventType: 'Camera fault',
    eventMinutesAgo: 28 * 24 * 60 + 300,
    eventPriority: 'Low',
    snapshotUrl: null,
  },
];

/**
 * Builds realistic DeviceWithRelations array for the 15 preview cameras.
 * Respects thresholds dynamically from liveCameras.ts and applies any Preview Lab overrides.
 */
export function getPreviewCameras(
  _baseDevices: DeviceWithRelations[] = [],
  _poles: PoleRecord[] = [],
  now = new Date()
): DeviceWithRelations[] {
  const session = getPreviewSessionState();

  return PREVIEW_CAMERA_SPECS.map((spec, idx) => {
    // Check if an override is active in the Preview Lab
    const overrideState = session.cameraStateOverrides[spec.identifier];

    let effectiveMinutesAgo = spec.defaultMinutesAgo;
    if (overrideState === 'online') {
      effectiveMinutesAgo = 5;
    } else if (overrideState === 'stale') {
      effectiveMinutesAgo = DEFAULT_LIVE_STATE_THRESHOLDS.staleThresholdMinutes + 15;
    } else if (overrideState === 'offline') {
      effectiveMinutesAgo = DEFAULT_LIVE_STATE_THRESHOLDS.offlineThresholdMinutes + 60;
    }

    const lastContactIso = makeRelativeDate(effectiveMinutesAgo, now);

    // Compute truthful connectivityState
    let state: 'online' | 'stale' | 'offline';
    if (effectiveMinutesAgo >= DEFAULT_LIVE_STATE_THRESHOLDS.offlineThresholdMinutes) {
      state = 'offline';
    } else if (effectiveMinutesAgo >= DEFAULT_LIVE_STATE_THRESHOLDS.staleThresholdMinutes) {
      state = 'stale';
    } else {
      state = 'online';
    }

    // Build associated FalconEvent
    const eventTime = makeRelativeDate(spec.eventMinutesAgo, now);
    const mockEvent: FalconEvent = {
      id: `EVT-PREV-${1000 + idx}`,
      captured: eventTime,
      receivedAt: eventTime,
      type: spec.eventType,
      device: spec.identifier,
      deviceStatus: state as any,
      asset: `CBL-00${(idx % 5) + 1}`,
      assetType: 'Cable span',
      poles: [spec.installedPoleId, 'AST-002'],
      priority: spec.eventPriority,
      state: 'New',
      status: 'New',
      caseId: null,
      source: 'Edge service',
      ruleCode: `RULE-${spec.eventType.toUpperCase().replace(/\s+/g, '-')}`,
      vendorCode: '10002',
      observed: 'Optical detection trigger',
      detection: `${spec.eventType} detection`,
      assignee: 'Ahmad Syukri',
      slaMinutes: spec.eventPriority === 'Critical' ? 15 : 60,
      unacknowledgedDuration: '5m',
      overSla: false,
      snapshots: spec.snapshotUrl ? [spec.snapshotUrl] : [],
      rawJson: {
        vendorCode: '10002',
        ruleCode: `RULE-${spec.eventType.toUpperCase().replace(/\s+/g, '-')}`,
        eventType: spec.eventType,
        device: spec.identifier,
        confidence: 0.94,
      },
      timeline: [
        {
          id: `t1-EVT-PREV-${1000 + idx}`,
          icon: 'received',
          text: `Telemetry packet received from ${spec.identifier}`,
          actor: 'Edge service',
          time: eventTime,
        },
      ],
      location: {
        lat: spec.lat,
        lng: spec.lng,
        coordinatesText: `${spec.lat.toFixed(5)}° N, ${spec.lng.toFixed(5)}° E`,
      },
    };

    return {
      identifier: spec.identifier,
      name: spec.name,
      type: 'Camera',
      manufacturer: spec.manufacturer,
      library: spec.library,
      model: spec.model,
      serial: `SN_${spec.identifier}`,
      vendorDeviceId: `VND_${spec.identifier}`,
      siteId: 'site-tgp',
      siteName: spec.siteName,
      connectivityState: state,
      lifecycle: 'Active',
      installedPoleId: spec.installedPoleId,
      registeredAt: makeRelativeDate(60 * 24 * 180, now),
      lastUpdatedAt: lastContactIso,
      lastContactAt: lastContactIso,
      batteryPercent: spec.isMobileData ? 92 : null,
      temperatureC: 38,
      softwareVersion: 'v2.4.1-edge',
      connectionCheck: {
        status: state === 'offline' ? 'Fail' : 'Pass',
        checkedAt: lastContactIso,
        message: state === 'offline' ? 'Device did not answer keepalive ping' : 'Edge latency normal',
        latencyMs: state === 'offline' ? null : 42,
      },
      components: spec.components,
      configVersion: 'cfg-1',
      configStatus: 'Applied',
      configReportedAt: lastContactIso,
      configuration: {
        fps: 25,
        resolution: '1080p',
        irMode: 'Auto',
        wdr: 'Enabled',
      },
      configVersions: [],
      connectivityPeriods: [
        {
          id: `p-${spec.identifier}-1`,
          state,
          from: makeRelativeDate(effectiveMinutesAgo + 120, now),
          to: null,
          recordedBy: 'Telemetry',
          note: state === 'offline' ? 'Keepalive timeout' : 'Healthy connection',
        },
      ],
      timeline: [],
      installationHistory: [
        {
          id: `inst-${spec.identifier}`,
          poleIdentifier: spec.installedPoleId,
          poleName: `Pole ${spec.installedPoleId}`,
          siteName: spec.siteName,
          from: makeRelativeDate(60 * 24 * 120, now),
          to: null,
          actor: 'Field Operations',
        },
      ],
      healthReports: [],
      installedPoleName: `Pole ${spec.installedPoleId}`,
      installedPoleSiteName: spec.siteName,
      installedPoleLifecycle: 'Active',
      location: {
        lat: spec.lat,
        lng: spec.lng,
      },
      isInstalled: true,
      events30dCount: 4,
      allEventsCount: 12,
      deviceEvents: [mockEvent],
      poleSpans: [],
      vendorConflict: null,
      configIssueCount: 0,
      isStaleByPolicy: state === 'stale',
    };
  });
}
