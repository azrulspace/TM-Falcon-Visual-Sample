import type {
  DeviceRecord,
  DeviceConnectivityPeriod,
  DeviceConfigVersion,
  DeviceTypeCategory,
  DeviceLifecycleState,
  DeviceConnectivityState,
  VendorDiscoveryRecord,
  VendorSyncSummary,
} from '../types/devices.ts';
import { getDefaultConfigValuesForType } from './deviceConfigSchema.ts';

export const MANUFACTURER_OPTIONS = ['Hikvision', 'Sample vendor'] as const;

export const LIBRARY_OPTIONS_BY_MANUFACTURER: Record<string, string[]> = {
  Hikvision: ['HIK_OpenAPI', 'HIK_ISAPI'],
  'Sample vendor': ['Pilot_Edge_v1'],
};

export const ALL_LIBRARY_OPTIONS = ['HIK_OpenAPI', 'HIK_ISAPI', 'Pilot_Edge_v1'] as const;

export const DEVICE_TYPE_OPTIONS: DeviceTypeCategory[] = [
  'Camera',
  'Speaker',
  'LiDAR sensor',
  'Gateway',
];

export const DEVICE_LIFECYCLE_OPTIONS: DeviceLifecycleState[] = [
  'Active',
  'Planned',
  'Maintenance',
  'Retired',
];

/**
 * Generates deterministic repeating 30-minute connectivity periods (2m Online -> 3m Stale -> 25m Offline)
 * ending at anchorIso for a given number of hours so availability computations are 100% verifiable.
 */
export function buildRepeatingSpeakerPeriods(
  anchorIso = '2026-10-21T11:15:00+08:00',
  hours = 168
): DeviceConnectivityPeriod[] {
  const endMs = new Date(anchorIso).getTime();
  const cycleMs = 30 * 60 * 1000;
  const totalCycles = Math.floor((hours * 60) / 30);
  const periods: DeviceConnectivityPeriod[] = [];

  for (let i = 0; i < totalCycles; i++) {
    const cycleStart = endMs - (totalCycles - i) * cycleMs;
    const tOfflineEnd = cycleStart + 25 * 60 * 1000;
    const tStaleEnd = tOfflineEnd + 3 * 60 * 1000;
    const tOnlineEnd = cycleStart + cycleMs;
    const isLast = i === totalCycles - 1;

    periods.push({
      id: `gv-p-${i}-off`,
      state: 'offline',
      from: new Date(cycleStart).toISOString(),
      to: new Date(tOfflineEnd).toISOString(),
      recordedBy: 'Telemetry',
    });
    periods.push({
      id: `gv-p-${i}-st`,
      state: 'stale',
      from: new Date(tOfflineEnd).toISOString(),
      to: new Date(tStaleEnd).toISOString(),
      recordedBy: 'Telemetry',
    });
    periods.push({
      id: `gv-p-${i}-on`,
      state: 'online',
      from: new Date(tStaleEnd).toISOString(),
      to: isLast ? null : new Date(tOnlineEnd).toISOString(),
      recordedBy: 'Telemetry',
    });
  }

  // Return newest-first for timeline / table display
  return periods.reverse();
}

function makeAppliedCameraVersions(deviceId: string, baseTimeIso: string): DeviceConfigVersion[] {
  const baseValues = getDefaultConfigValuesForType('Camera');
  const v1Values = {
    ...baseValues,
    frame_rate_fps: 15,
    bitrate_kbps: 1536,
  };
  const v2Values = {
    ...baseValues,
    frame_rate_fps: 25,
    bitrate_kbps: 2048,
  };

  const t1 = new Date(new Date(baseTimeIso).getTime() - 48 * 3600 * 1000).toISOString();
  const t2 = new Date(new Date(baseTimeIso).getTime() - 24 * 3600 * 1000).toISOString();

  return [
    {
      id: `${deviceId}-cfg-2`,
      versionLabel: 'cfg-2',
      createdAt: t2,
      createdBy: 'Admin',
      note: 'Raised frame rate to 25 fps for clear encroachment capture.',
      status: 'Applied',
      values: v2Values,
      changedKeys: ['frame_rate_fps', 'bitrate_kbps'],
      results: [
        {
          key: 'frame_rate_fps',
          label: 'Frame rate',
          sentValue: 25,
          previousValue: 15,
          status: 'Applied',
          reportedAt: t2,
        },
        {
          key: 'bitrate_kbps',
          label: 'Max bitrate',
          sentValue: 2048,
          previousValue: 1536,
          status: 'Applied',
          reportedAt: t2,
        },
      ],
    },
    {
      id: `${deviceId}-cfg-1`,
      versionLabel: 'cfg-1',
      createdAt: t1,
      createdBy: 'Admin',
      note: 'Initial provisioning profile',
      status: 'Applied',
      values: v1Values,
      changedKeys: ['stream_resolution', 'frame_rate_fps', 'bitrate_kbps'],
      results: [
        {
          key: 'stream_resolution',
          label: 'Resolution',
          sentValue: '2688x1520',
          status: 'Applied',
          reportedAt: t1,
        },
        {
          key: 'frame_rate_fps',
          label: 'Frame rate',
          sentValue: 15,
          status: 'Applied',
          reportedAt: t1,
        },
        {
          key: 'bitrate_kbps',
          label: 'Max bitrate',
          sentValue: 1536,
          status: 'Applied',
          reportedAt: t1,
        },
      ],
    },
  ];
}

function makeStandardConnectivityPeriods(
  id: string,
  state: DeviceConnectivityState,
  lastContactAt: string,
  registeredAt: string
): DeviceConnectivityPeriod[] {
  return [
    {
      id: `${id}-cp-1`,
      state,
      from: lastContactAt,
      to: null,
      recordedBy: 'Telemetry',
    },
    {
      id: `${id}-cp-0`,
      state: 'online',
      from: registeredAt,
      to: lastContactAt,
      recordedBy: 'Telemetry',
    },
  ];
}

const TPG_POLE_ASSIGNMENTS: Record<string, string> = {
  'DEV-001': 'TGP_P010',
  'DEV-002': 'TGP_P002',
  'DEV-003': 'TGP_P004',
  'DEV-004': 'AST-006',
  'DEV-005': 'TGP_P005',
  'DEV-006': 'TGP_P006',
  'DEV-007': 'TGP_P007',
  'DEV-008': 'TGP_P008',
  'DEV-009': 'TGP_P011',
  'DEV-010': 'TGP_P001',
};

const STAGING_CAMERAS: DeviceRecord[] = [
  {
    identifier: 'DEV-001',
    name: 'DEV-001',
    type: 'Camera',
    manufacturer: 'Hikvision',
    library: 'HIK_OpenAPI',
    model: 'DS-2CFSP4/4G',
    serial: 'SN_DEV_001',
    vendorDeviceId: 'SN_DEV_001',
    identifierKind: 'Registry',
    siteId: 'site-tpg',
    siteName: 'Teluk Panglima Garang',
    connectivityState: 'online',
    lifecycle: 'Active',
    installedPoleId: 'TGP_P010',
    registeredAt: '2026-10-08T09:15:00+08:00',
    lastUpdatedAt: '2026-10-21T06:59:00+08:00',
    lastContactAt: '2026-10-21T06:59:00+08:00',
    batteryPercent: 94,
    temperatureC: 36,
    softwareVersion: 'V5.7.15 build 250412',
    connectionCheck: {
      status: 'Pass',
      checkedAt: '2026-10-21T06:59:00+08:00',
      message: 'Edge reachable via HIK_OpenAPI (42 ms)',
      latencyMs: 42,
    },
    components: ['Camera', 'Solar MPPT'],
    configVersion: null,
    configStatus: 'None',
    configReportedAt: null,
    configuration: getDefaultConfigValuesForType('Camera'),
    configVersions: [],
    connectivityPeriods: makeStandardConnectivityPeriods(
      'DEV-001',
      'online',
      '2026-10-20T06:59:00+08:00',
      '2026-10-08T09:15:00+08:00'
    ),
    timeline: [
      {
        id: 'tl-dev001-2',
        kind: 'Installed',
        message: 'Installed on pole TGP_P010',
        field: 'Installed on',
        fromValue: null,
        toValue: 'TGP_P010',
        actor: 'Admin',
        timestamp: '2026-10-08T09:30:00+08:00',
      },
      {
        id: 'tl-dev001-1',
        kind: 'Registered',
        message: 'Device registered in FALCON',
        actor: 'Admin',
        timestamp: '2026-10-08T09:15:00+08:00',
      },
    ],
    installationHistory: [
      {
        id: 'inst-dev001-1',
        poleIdentifier: 'TGP_P010',
        poleName: 'TGP_P010',
        siteName: 'Teluk Panglima Garang',
        from: '2026-10-08T09:30:00+08:00',
        to: null,
        actor: 'Admin',
        note: 'Initial pole mount at feeder junction',
      },
    ],
    healthReports: [
      {
        id: 'hr-dev001-1',
        reportedAt: '2026-10-21T06:59:00+08:00',
        state: 'online',
        batteryPercent: 94,
        temperatureC: 36,
        signalStrengthDbm: -64,
        softwareVersion: 'V5.7.15 build 250412',
        source: 'Telemetry',
      },
    ],
  },
  // DEV-002, DEV-003, DEV-005..DEV-010: Online with Nov 3 / Oct 12 old last contact (~9d ago before Oct 21 server anchor)
  ...([2, 3, 5, 6, 7, 8, 9, 10] as const).map((num): DeviceRecord => {
    const id = `DEV-${String(num).padStart(3, '0')}`;
    const poleId = TPG_POLE_ASSIGNMENTS[id];
    const oldContactIso = `2026-10-12T15:${String(30 + (num % 3)).padStart(2, '0')}:00+08:00`;
    const regIso = '2026-10-01T10:00:00+08:00';
    const versions = makeAppliedCameraVersions(id, '2026-10-12T15:30:00+08:00');
    return {
      identifier: id,
      name: id,
      type: 'Camera',
      manufacturer: 'Hikvision',
      library: 'HIK_OpenAPI',
      model: 'DS-2CFSP4/4G',
      serial: `SN_DEV_${String(num).padStart(3, '0')}`,
      vendorDeviceId: `SN_DEV_${String(num).padStart(3, '0')}`,
      identifierKind: 'Registry',
      siteId: 'site-tpg',
      siteName: 'Teluk Panglima Garang',
      connectivityState: 'online',
      lifecycle: 'Active',
      installedPoleId: poleId,
      registeredAt: regIso,
      lastUpdatedAt: oldContactIso,
      lastContactAt: oldContactIso,
      batteryPercent: 82 - num,
      temperatureC: 38,
      softwareVersion: 'V5.7.15 build 250412',
      connectionCheck: {
        status: 'Never checked',
        checkedAt: null,
        message: null,
      },
      components: ['Camera'],
      configVersion: 'cfg-2',
      configStatus: 'Applied',
      configReportedAt: versions[0].createdAt,
      configuration: versions[0].values,
      configVersions: versions,
      connectivityPeriods: makeStandardConnectivityPeriods(id, 'online', oldContactIso, regIso),
      timeline: [
        {
          id: `tl-${id}-3`,
          kind: 'Configuration',
          message: 'Configuration cfg-2 applied by Edge',
          field: 'Configuration',
          fromValue: 'cfg-1',
          toValue: 'cfg-2',
          actor: 'Admin',
          timestamp: versions[0].createdAt,
        },
        {
          id: `tl-${id}-2`,
          kind: 'Installed',
          message: `Installed on pole ${poleId}`,
          field: 'Installed on',
          toValue: poleId,
          actor: 'Admin',
          timestamp: regIso,
        },
        {
          id: `tl-${id}-1`,
          kind: 'Registered',
          message: 'Device registered in FALCON',
          actor: 'Admin',
          timestamp: regIso,
        },
      ],
      installationHistory: [
        {
          id: `inst-${id}-1`,
          poleIdentifier: poleId,
          poleName: poleId,
          siteName: 'Teluk Panglima Garang',
          from: regIso,
          to: null,
          actor: 'Admin',
          note: 'Standard pole deployment',
        },
      ],
      healthReports: [
        {
          id: `hr-${id}-1`,
          reportedAt: oldContactIso,
          state: 'online',
          batteryPercent: 82 - num,
          temperatureC: 38,
          signalStrengthDbm: -71,
          softwareVersion: 'V5.7.15 build 250412',
          source: 'Telemetry',
        },
      ],
    };
  }),
];

const DEV_004_LIDAR: DeviceRecord = {
  identifier: 'DEV-004',
  name: 'DEV-004',
  type: 'LiDAR sensor',
  manufacturer: 'Sample vendor',
  library: 'Pilot_Edge_v1',
  model: 'Pilot LiDAR',
  serial: 'SN_DEV_004',
  vendorDeviceId: 'SN_DEV_004',
  identifierKind: 'Registry',
  siteId: 'site-tpg',
  siteName: 'Teluk Panglima Garang',
  // Critical parity: offline on AST-006 (117 events in events.ts)
  connectivityState: 'offline',
  lifecycle: 'Active',
  installedPoleId: 'AST-006',
  registeredAt: '2026-09-25T09:00:00+08:00',
  lastUpdatedAt: '2026-10-03T14:14:00+08:00',
  lastContactAt: '2026-10-03T14:14:00+08:00',
  batteryPercent: 18,
  temperatureC: 41,
  softwareVersion: 'V2.1.4',
  connectionCheck: {
    status: 'Fail',
    checkedAt: '2026-10-20T09:00:00+08:00',
    message: 'Timeout waiting for Edge ping after 5000 ms',
  },
  components: ['LiDAR head', 'RS-485 bridge'],
  configVersion: 'cfg-2',
  configStatus: 'Partly applied',
  configReportedAt: '2026-10-03T14:00:00+08:00',
  configuration: {
    scan_rate_hz: 15,
    encroachment_distance_m: 3.5,
  },
  configVersions: [
    {
      id: 'DEV-004-cfg-2',
      versionLabel: 'cfg-2',
      createdAt: '2026-10-03T14:00:00+08:00',
      createdBy: 'Admin',
      note: 'Adjusted encroachment buffer to 4.5 m (failed on offline link)',
      status: 'Partly applied',
      values: { scan_rate_hz: 15, encroachment_distance_m: 4.5 },
      changedKeys: ['scan_rate_hz', 'encroachment_distance_m'],
      results: [
        {
          key: 'scan_rate_hz',
          label: 'Scan rate',
          sentValue: 15,
          previousValue: 10,
          status: 'Applied',
          reportedAt: '2026-10-03T14:00:00+08:00',
        },
        {
          key: 'encroachment_distance_m',
          label: 'Encroachment alert distance',
          sentValue: 4.5,
          previousValue: 3.5,
          status: 'Failed',
          errorMessage: 'Edge timeout while writing threshold parameter.',
        },
      ],
    },
    {
      id: 'DEV-004-cfg-1',
      versionLabel: 'cfg-1',
      createdAt: '2026-09-26T10:00:00+08:00',
      createdBy: 'Admin',
      note: 'Baseline commissioning profile',
      status: 'Applied',
      values: { scan_rate_hz: 10, encroachment_distance_m: 3.5 },
      changedKeys: ['scan_rate_hz', 'encroachment_distance_m'],
      results: [
        {
          key: 'scan_rate_hz',
          label: 'Scan rate',
          sentValue: 10,
          status: 'Applied',
          reportedAt: '2026-09-26T10:00:00+08:00',
        },
        {
          key: 'encroachment_distance_m',
          label: 'Encroachment alert distance',
          sentValue: 3.5,
          status: 'Applied',
          reportedAt: '2026-09-26T10:00:00+08:00',
        },
      ],
    },
  ],
  connectivityPeriods: makeStandardConnectivityPeriods(
    'DEV-004',
    'offline',
    '2026-10-03T14:14:00+08:00',
    '2026-09-25T09:00:00+08:00'
  ),
  timeline: [
    {
      id: 'tl-dev004-3',
      kind: 'Configuration',
      message: 'Configuration cfg-2 partly applied (Encroachment alert distance failed)',
      field: 'Configuration',
      fromValue: 'cfg-1',
      toValue: 'cfg-2',
      actor: 'Admin',
      timestamp: '2026-10-03T14:00:00+08:00',
    },
    {
      id: 'tl-dev004-2',
      kind: 'Installed',
      message: 'Installed on pole AST-006',
      field: 'Installed on',
      toValue: 'AST-006',
      actor: 'Admin',
      timestamp: '2026-09-25T09:15:00+08:00',
    },
    {
      id: 'tl-dev004-1',
      kind: 'Registered',
      message: 'Device registered in FALCON',
      actor: 'Admin',
      timestamp: '2026-09-25T09:00:00+08:00',
    },
  ],
  installationHistory: [
    {
      id: 'inst-dev004-1',
      poleIdentifier: 'AST-006',
      poleName: 'AST-006',
      siteName: 'Teluk Panglima Garang',
      from: '2026-09-25T09:15:00+08:00',
      to: null,
      actor: 'Admin',
      note: 'Canal bank LiDAR perimeter unit',
    },
  ],
  healthReports: [
    {
      id: 'hr-dev004-1',
      reportedAt: '2026-10-03T14:14:00+08:00',
      state: 'offline',
      batteryPercent: 18,
      temperatureC: 41,
      signalStrengthDbm: -86,
      softwareVersion: 'V2.1.4',
      source: 'Telemetry',
      note: 'Low battery prior to disconnect',
    },
  ],
};

const STAGING_NOT_INSTALLED_DEVICES: DeviceRecord[] = [
  {
    identifier: 'GS6306382',
    name: 'DS-2CFSP4/4G(GS6306382)',
    type: 'Camera',
    manufacturer: 'Hikvision',
    library: 'HIK_OpenAPI',
    model: 'DS-2CFSP4/4G',
    serial: 'GS6306382',
    vendorDeviceId: 'GS6306382',
    identifierKind: 'Vendor serial',
    siteId: 'site-tpg',
    siteName: 'Teluk Panglima Garang',
    connectivityState: 'online',
    lifecycle: 'Active',
    installedPoleId: null,
    registeredAt: '2026-10-18T11:20:00+08:00',
    lastUpdatedAt: '2026-10-20T15:27:00+08:00',
    lastContactAt: '2026-10-20T15:27:00+08:00',
    batteryPercent: 100,
    temperatureC: 33,
    softwareVersion: 'V5.7.15 build 250412',
    connectionCheck: {
      status: 'Pass',
      checkedAt: '2026-10-20T15:27:00+08:00',
      message: 'Reachable via HIK_OpenAPI (51 ms)',
      latencyMs: 51,
    },
    components: ['Camera'],
    configVersion: null,
    configStatus: 'None',
    configReportedAt: null,
    configuration: getDefaultConfigValuesForType('Camera'),
    configVersions: [],
    connectivityPeriods: makeStandardConnectivityPeriods(
      'GS6306382',
      'online',
      '2026-10-20T15:27:00+08:00',
      '2026-10-18T11:20:00+08:00'
    ),
    timeline: [
      {
        id: 'tl-gs630-1',
        kind: 'Registered',
        message: 'Device registered from vendor serial GS6306382',
        actor: 'Admin',
        timestamp: '2026-10-18T11:20:00+08:00',
      },
    ],
    installationHistory: [],
    healthReports: [
      {
        id: 'hr-gs630-1',
        reportedAt: '2026-10-20T15:27:00+08:00',
        state: 'online',
        batteryPercent: 100,
        temperatureC: 33,
        signalStrengthDbm: -61,
        softwareVersion: 'V5.7.15 build 250412',
        source: 'Telemetry',
      },
    ],
  },
  {
    identifier: 'GV0032063',
    name: 'DS-QAZ1307G1T-E(GV0032063)',
    type: 'Speaker',
    manufacturer: 'Hikvision',
    library: 'HIK_OpenAPI',
    model: 'DS-QAZ1307G1T-E',
    serial: 'GV0032063',
    vendorDeviceId: 'GV0032063',
    identifierKind: 'Vendor serial',
    siteId: null,
    siteName: null, // Unassigned
    connectivityState: 'online',
    lifecycle: 'Active',
    installedPoleId: null,
    registeredAt: '2026-10-14T15:33:00+08:00',
    lastUpdatedAt: '2026-10-14T15:33:00+08:00',
    lastContactAt: '2026-10-21T06:59:00+08:00',
    batteryPercent: null,
    temperatureC: null,
    softwareVersion: 'V1.6.5 build 260514',
    connectionCheck: {
      status: 'Never checked',
      checkedAt: null,
      message: null,
    },
    components: [],
    configVersion: null,
    configStatus: 'None',
    configReportedAt: '2026-10-21T06:59:00+08:00',
    configuration: getDefaultConfigValuesForType('Speaker'),
    configVersions: [],
    connectivityPeriods: buildRepeatingSpeakerPeriods('2026-10-21T11:15:00+08:00', 168),
    timeline: [
      {
        id: 'tl-gv003-2',
        kind: 'Vendor sync',
        message: 'Discovered by Edge sync via HIK_OpenAPI',
        actor: 'System',
        timestamp: '2026-10-14T15:34:00+08:00',
      },
      {
        id: 'tl-gv003-1',
        kind: 'Registered',
        message: 'Device registered in FALCON',
        actor: 'Admin',
        timestamp: '2026-10-14T15:33:00+08:00',
      },
    ],
    installationHistory: [],
    healthReports: [
      {
        id: 'hr-gv003-1',
        reportedAt: '2026-10-21T06:59:00+08:00',
        state: 'online',
        batteryPercent: null,
        temperatureC: null,
        softwareVersion: 'V1.6.5 build 260514',
        source: 'Telemetry',
        note: 'Repeating 30-min connectivity cycle detected.',
      },
    ],
  },
];

const REMAINING_FLEET_DEVICES: DeviceRecord[] = [
  {
    identifier: 'DEV-011',
    name: 'DEV-011',
    type: 'Camera',
    manufacturer: 'Sample vendor',
    library: 'Pilot_Edge_v1',
    model: 'Pilot camera',
    serial: 'SN_DEV_011',
    vendorDeviceId: 'SN_DEV_011',
    identifierKind: 'Registry',
    siteId: 'site-kch-central',
    siteName: 'Kuching Central',
    connectivityState: 'offline',
    lifecycle: 'Active',
    installedPoleId: 'AST-070',
    registeredAt: '2026-09-18T10:00:00+08:00',
    lastUpdatedAt: '2026-10-04T08:34:00+08:00',
    lastContactAt: '2026-10-04T08:34:00+08:00',
    batteryPercent: 42,
    temperatureC: 37,
    softwareVersion: 'V1.9.0',
    connectionCheck: { status: 'Fail', checkedAt: '2026-10-19T11:00:00+08:00', message: 'Device unreachable' },
    components: ['Camera'],
    configVersion: 'cfg-1',
    configStatus: 'Applied',
    configReportedAt: '2026-09-19T12:00:00+08:00',
    configuration: getDefaultConfigValuesForType('Camera'),
    configVersions: makeAppliedCameraVersions('DEV-011', '2026-09-20T12:00:00+08:00'),
    connectivityPeriods: makeStandardConnectivityPeriods('DEV-011', 'offline', '2026-10-04T08:34:00+08:00', '2026-09-18T10:00:00+08:00'),
    timeline: [
      { id: 'tl-dev011-1', kind: 'Registered', message: 'Device registered in FALCON', actor: 'Admin', timestamp: '2026-09-18T10:00:00+08:00' },
    ],
    installationHistory: [
      { id: 'inst-dev011-1', poleIdentifier: 'AST-070', poleName: 'AST-070', siteName: 'Kuching Central', from: '2026-09-18T10:15:00+08:00', to: null, actor: 'Admin' },
    ],
    healthReports: [
      { id: 'hr-dev011-1', reportedAt: '2026-10-04T08:34:00+08:00', state: 'offline', batteryPercent: 42, temperatureC: 37, softwareVersion: 'V1.9.0', source: 'Telemetry' },
    ],
  },
  {
    identifier: 'DEV-012',
    name: 'DEV-012',
    type: 'Camera',
    manufacturer: 'Sample vendor',
    library: 'Pilot_Edge_v1',
    model: 'Pilot camera',
    serial: 'SN_DEV_012',
    vendorDeviceId: 'SN_DEV_012',
    identifierKind: 'Registry',
    siteId: 'site-tpg',
    siteName: 'Teluk Panglima Garang',
    connectivityState: 'online',
    lifecycle: 'Active',
    installedPoleId: 'AST-014',
    registeredAt: '2026-09-20T09:00:00+08:00',
    lastUpdatedAt: '2026-10-21T10:20:00+08:00',
    lastContactAt: '2026-10-21T10:20:00+08:00',
    batteryPercent: 89,
    temperatureC: 35,
    softwareVersion: 'V1.9.0',
    connectionCheck: { status: 'Pass', checkedAt: '2026-10-21T10:20:00+08:00', message: 'Pass (38 ms)', latencyMs: 38 },
    components: ['Camera'],
    configVersion: 'cfg-2',
    configStatus: 'Applied',
    configReportedAt: '2026-10-19T12:00:00+08:00',
    configuration: getDefaultConfigValuesForType('Camera'),
    configVersions: makeAppliedCameraVersions('DEV-012', '2026-10-19T12:00:00+08:00'),
    connectivityPeriods: makeStandardConnectivityPeriods('DEV-012', 'online', '2026-10-21T10:20:00+08:00', '2026-09-20T09:00:00+08:00'),
    timeline: [
      { id: 'tl-dev012-1', kind: 'Registered', message: 'Device registered in FALCON', actor: 'Admin', timestamp: '2026-09-20T09:00:00+08:00' },
    ],
    installationHistory: [
      { id: 'inst-dev012-1', poleIdentifier: 'AST-014', poleName: 'AST-014', siteName: 'Teluk Panglima Garang', from: '2026-09-20T09:30:00+08:00', to: null, actor: 'Admin' },
    ],
    healthReports: [
      { id: 'hr-dev012-1', reportedAt: '2026-10-21T10:20:00+08:00', state: 'online', batteryPercent: 89, temperatureC: 35, softwareVersion: 'V1.9.0', source: 'Telemetry' },
    ],
  },
  {
    identifier: 'DEV-013',
    name: 'DEV-013',
    type: 'Camera',
    manufacturer: 'Sample vendor',
    library: 'Pilot_Edge_v1',
    model: 'Pilot camera',
    serial: 'SN_DEV_013',
    vendorDeviceId: 'SN_DEV_013',
    identifierKind: 'Registry',
    siteId: 'site-tpg',
    siteName: 'Teluk Panglima Garang',
    connectivityState: 'stale',
    lifecycle: 'Planned',
    installedPoleId: 'AST-015',
    registeredAt: '2026-10-05T14:17:00+08:00',
    lastUpdatedAt: '2026-10-19T14:17:00+08:00',
    lastContactAt: '2026-10-19T14:17:00+08:00',
    batteryPercent: 75,
    temperatureC: 34,
    softwareVersion: 'V1.9.0',
    connectionCheck: { status: 'Never checked', checkedAt: null, message: null },
    components: ['Camera'],
    configVersion: null,
    configStatus: 'None',
    configReportedAt: null,
    configuration: getDefaultConfigValuesForType('Camera'),
    configVersions: [],
    connectivityPeriods: makeStandardConnectivityPeriods('DEV-013', 'stale', '2026-10-19T14:17:00+08:00', '2026-10-05T14:17:00+08:00'),
    timeline: [
      { id: 'tl-dev013-1', kind: 'Registered', message: 'Device registered in FALCON (Planned commissioning)', actor: 'Admin', timestamp: '2026-10-05T14:17:00+08:00' },
    ],
    installationHistory: [
      { id: 'inst-dev013-1', poleIdentifier: 'AST-015', poleName: 'AST-015', siteName: 'Teluk Panglima Garang', from: '2026-10-05T14:30:00+08:00', to: null, actor: 'Admin' },
    ],
    healthReports: [],
  },
  {
    identifier: 'DEV-014',
    name: 'DEV-014',
    type: 'Gateway',
    manufacturer: 'Sample vendor',
    library: 'Pilot_Edge_v1',
    model: 'Pilot gateway',
    serial: 'SN_DEV_014',
    vendorDeviceId: 'SN_DEV_014',
    identifierKind: 'Registry',
    siteId: 'site-tpg',
    siteName: 'Teluk Panglima Garang',
    connectivityState: 'online',
    lifecycle: 'Active',
    installedPoleId: 'AST-016',
    registeredAt: '2026-09-15T11:00:00+08:00',
    lastUpdatedAt: '2026-10-21T10:45:00+08:00',
    lastContactAt: '2026-10-21T10:45:00+08:00',
    batteryPercent: 98,
    temperatureC: 39,
    softwareVersion: 'V3.2.1',
    connectionCheck: { status: 'Pass', checkedAt: '2026-10-21T10:45:00+08:00', message: 'Pass (29 ms)', latencyMs: 29 },
    components: ['LTE Modem', 'Edge Relay'],
    configVersion: 'cfg-1',
    configStatus: 'Applied',
    configReportedAt: '2026-10-15T09:00:00+08:00',
    configuration: getDefaultConfigValuesForType('Gateway'),
    configVersions: [
      {
        id: 'DEV-014-cfg-1',
        versionLabel: 'cfg-1',
        createdAt: '2026-10-15T09:00:00+08:00',
        createdBy: 'Admin',
        note: 'Default relay heartbeat',
        status: 'Applied',
        values: getDefaultConfigValuesForType('Gateway'),
        changedKeys: ['heartbeat_interval_s', 'cellular_failover'],
        results: [
          { key: 'heartbeat_interval_s', label: 'Heartbeat interval', sentValue: 60, status: 'Applied', reportedAt: '2026-10-15T09:00:00+08:00' },
          { key: 'cellular_failover', label: 'Automatic 4G failover', sentValue: true, status: 'Applied', reportedAt: '2026-10-15T09:00:00+08:00' },
        ],
      },
    ],
    connectivityPeriods: makeStandardConnectivityPeriods('DEV-014', 'online', '2026-10-21T10:45:00+08:00', '2026-09-15T11:00:00+08:00'),
    timeline: [
      { id: 'tl-dev014-1', kind: 'Registered', message: 'Gateway registered in FALCON', actor: 'Admin', timestamp: '2026-09-15T11:00:00+08:00' },
    ],
    installationHistory: [
      { id: 'inst-dev014-1', poleIdentifier: 'AST-016', poleName: 'AST-016', siteName: 'Teluk Panglima Garang', from: '2026-09-15T11:20:00+08:00', to: null, actor: 'Admin' },
    ],
    healthReports: [
      { id: 'hr-dev014-1', reportedAt: '2026-10-21T10:45:00+08:00', state: 'online', batteryPercent: 98, temperatureC: 39, softwareVersion: 'V3.2.1', source: 'Telemetry' },
    ],
  },
  {
    identifier: 'DEV-015',
    name: 'DEV-015',
    type: 'Camera',
    manufacturer: 'Sample vendor',
    library: 'Pilot_Edge_v1',
    model: 'Pilot camera',
    serial: 'SN_DEV_015',
    vendorDeviceId: 'SN_DEV_015',
    identifierKind: 'Registry',
    siteId: 'site-tpg',
    siteName: 'Teluk Panglima Garang',
    connectivityState: 'online',
    lifecycle: 'Retired',
    installedPoleId: 'AST-017',
    registeredAt: '2026-08-12T10:00:00+08:00',
    lastUpdatedAt: '2026-10-16T14:16:00+08:00',
    lastContactAt: '2026-10-16T14:16:00+08:00',
    batteryPercent: 60,
    temperatureC: 35,
    softwareVersion: 'V1.8.0',
    connectionCheck: { status: 'Never checked', checkedAt: null, message: null },
    components: ['Camera'],
    configVersion: null,
    configStatus: 'None',
    configReportedAt: null,
    configuration: getDefaultConfigValuesForType('Camera'),
    configVersions: [],
    connectivityPeriods: makeStandardConnectivityPeriods('DEV-015', 'online', '2026-10-16T14:16:00+08:00', '2026-08-12T10:00:00+08:00'),
    timeline: [
      { id: 'tl-dev015-2', kind: 'Lifecycle', message: 'Lifecycle changed from Active to Retired', field: 'Lifecycle', fromValue: 'Active', toValue: 'Retired', actor: 'Admin', timestamp: '2026-10-16T14:16:00+08:00' },
      { id: 'tl-dev015-1', kind: 'Registered', message: 'Device registered in FALCON', actor: 'Admin', timestamp: '2026-08-12T10:00:00+08:00' },
    ],
    installationHistory: [
      { id: 'inst-dev015-1', poleIdentifier: 'AST-017', poleName: 'AST-017', siteName: 'Teluk Panglima Garang', from: '2026-08-12T10:15:00+08:00', to: null, actor: 'Admin' },
    ],
    healthReports: [],
  },
];

export const INITIAL_DEVICES_REGISTRY: DeviceRecord[] = [
  ...STAGING_CAMERAS.slice(0, 3),
  DEV_004_LIDAR,
  ...STAGING_CAMERAS.slice(3),
  ...STAGING_NOT_INSTALLED_DEVICES,
  ...REMAINING_FLEET_DEVICES,
];

export const INITIAL_VENDOR_DISCOVERY_RECORDS: VendorDiscoveryRecord[] = [
  {
    id: 'vd-gv0032063',
    serial: 'GV0032063',
    vendorName: 'DS-QAZ1307G1T-E(GV0032063)',
    model: 'DS-QAZ1307G1T-E',
    manufacturer: 'Hikvision',
    library: 'HIK_OpenAPI',
    vendorState: 'online',
    matchStatus: 'Registered',
    matchedFalconId: 'GV0032063',
    conflictReason: null,
    lastSeenAt: '2026-10-21T06:59:00+08:00',
  },
  {
    id: 'vd-gq7752681',
    serial: 'GQ7752681',
    vendorName: 'KT-001',
    model: 'DS-2CFSP4/4G',
    manufacturer: 'Hikvision',
    library: 'HIK_OpenAPI',
    vendorState: 'online',
    matchStatus: 'Conflict',
    matchedFalconId: 'DEV-001',
    conflictReason:
      'Vendor serial GQ7752681 claims FALCON device DEV-001, which is currently mapped to vendor device SN_DEV_001. Events from this unit appear under raw serial GQ7752681.',
    lastSeenAt: '2026-10-21T06:59:00+08:00',
    rawSerialEventsCount: 11,
  },
  {
    id: 'vd-gs6306382',
    serial: 'GS6306382',
    vendorName: 'DS-2CFSP4/4G(GS6306382)',
    model: 'DS-2CFSP4/4G',
    manufacturer: 'Hikvision',
    library: 'HIK_OpenAPI',
    vendorState: 'online',
    matchStatus: 'Registered',
    matchedFalconId: 'GS6306382',
    conflictReason: null,
    lastSeenAt: '2026-10-20T15:27:00+08:00',
  },
  {
    id: 'vd-gh8814209',
    serial: 'GH8814209',
    vendorName: 'DS-2CD2387G2H-L(GH8814209)',
    model: 'DS-2CD2387G2H',
    manufacturer: 'Hikvision',
    library: 'HIK_OpenAPI',
    vendorState: 'online',
    matchStatus: 'Not registered',
    matchedFalconId: null,
    conflictReason: null,
    lastSeenAt: '2026-10-21T06:59:00+08:00',
  },
];

export const INITIAL_VENDOR_SYNC_SUMMARY: VendorSyncSummary = {
  library: 'HIK_OpenAPI',
  lastFullSyncAt: '2026-10-21T06:59:00+08:00',
  lastListReloadAt: '2026-10-21T11:15:00+08:00',
  source: 'Complete vendor list from Edge',
  totalVendorDevices: INITIAL_VENDOR_DISCOVERY_RECORDS.length,
};

/**
 * Generates 10 Jalan Bandar Lama preview devices (5 Video + 5 Photo/Sensor) matching the poles preview mode.
 */
export function buildJalanBandarLamaPreviewDevices(): {
  devices: DeviceRecord[];
  vendorRecords: VendorDiscoveryRecord[];
} {
  const devices: DeviceRecord[] = Array.from({ length: 10 }, (_, i): DeviceRecord => {
    const num = i + 1;
    const isPhotoHalf = num > 5;
    const type: DeviceTypeCategory = num === 10 ? 'Gateway' : num % 3 === 0 ? 'LiDAR sensor' : 'Camera';
    const connectivityState: DeviceConnectivityState =
      num === 4 ? 'offline' : num === 7 ? 'stale' : 'online';
    const lastContactAt =
      connectivityState === 'offline'
        ? '2026-10-19T14:20:00+08:00'
        : connectivityState === 'stale'
        ? '2026-10-20T09:10:00+08:00'
        : '2026-10-21T11:05:00+08:00';
    const poleId = `JBL-P${String(num).padStart(2, '0')}`;
    const regIso = '2026-10-10T09:00:00+08:00';
    const model = isPhotoHalf ? 'Pilot photo sensor' : type === 'Gateway' ? 'Pilot gateway' : 'Pilot video camera';

    return {
      identifier: `DEV-JBL-${String(num).padStart(2, '0')}`,
      name: `JBL ${isPhotoHalf ? 'Photo' : 'Video'} Sensor ${num}`,
      type,
      manufacturer: 'Hikvision',
      library: 'HIK_OpenAPI',
      model,
      serial: `SN_JBL_${String(num).padStart(3, '0')}`,
      vendorDeviceId: `SN_JBL_${String(num).padStart(3, '0')}`,
      identifierKind: 'Registry',
      siteId: 'site-jbl',
      siteName: 'Jalan Bandar Lama',
      connectivityState,
      lifecycle: 'Active',
      installedPoleId: num === 9 ? null : poleId, // Leave DEV-JBL-09 Not installed for preview flow testing
      registeredAt: regIso,
      lastUpdatedAt: lastContactAt,
      lastContactAt,
      batteryPercent: 90 - num * 2,
      temperatureC: 35,
      softwareVersion: 'V5.7.15 build 250412',
      connectionCheck: {
        status: connectivityState === 'offline' ? 'Fail' : 'Pass',
        checkedAt: '2026-10-21T11:00:00+08:00',
        message: connectivityState === 'offline' ? 'Unreachable' : 'Reachable via HIK_OpenAPI',
      },
      components: isPhotoHalf ? ['Snapshot camera'] : ['Video stream', 'IR Illuminator'],
      configVersion: 'cfg-1',
      configStatus: 'Applied',
      configReportedAt: '2026-10-18T12:00:00+08:00',
      configuration: getDefaultConfigValuesForType(type),
      configVersions: [],
      connectivityPeriods: makeStandardConnectivityPeriods(
        `DEV-JBL-${num}`,
        connectivityState,
        lastContactAt,
        regIso
      ),
      timeline: [
        {
          id: `tl-jbl-${num}`,
          kind: 'Registered',
          message: 'Preview device registered in FALCON',
          actor: 'Admin',
          timestamp: regIso,
        },
      ],
      installationHistory:
        num === 9
          ? []
          : [
              {
                id: `inst-jbl-${num}`,
                poleIdentifier: poleId,
                poleName: poleId,
                siteName: 'Jalan Bandar Lama',
                from: regIso,
                to: null,
                actor: 'Admin',
              },
            ],
      healthReports: [
        {
          id: `hr-jbl-${num}`,
          reportedAt: lastContactAt,
          state: connectivityState,
          batteryPercent: 90 - num * 2,
          temperatureC: 35,
          softwareVersion: 'V5.7.15 build 250412',
          source: 'Telemetry',
        },
      ],
    };
  });

  const vendorRecords: VendorDiscoveryRecord[] = [
    {
      id: 'vd-jbl-new-1',
      serial: 'JBL8801942',
      vendorName: 'JBL-Cam-Preview(JBL8801942)',
      model: 'DS-2CFSP4/4G',
      manufacturer: 'Hikvision',
      library: 'HIK_OpenAPI',
      vendorState: 'online',
      matchStatus: 'Not registered',
      matchedFalconId: null,
      conflictReason: null,
      lastSeenAt: '2026-10-21T11:10:00+08:00',
    },
  ];

  return { devices, vendorRecords };
}

/**
 * Generates N synthetic devices for unit benchmark tests (500-device scale performance budget).
 */
export function buildSyntheticBenchmarkDevices(count = 500): DeviceRecord[] {
  const types: DeviceTypeCategory[] = ['Camera', 'Speaker', 'LiDAR sensor', 'Gateway'];
  const states: DeviceConnectivityState[] = ['online', 'online', 'online', 'stale', 'offline'];
  return Array.from({ length: count }, (_, i): DeviceRecord => {
    const num = i + 1;
    const id = `BENCH-${String(num).padStart(4, '0')}`;
    const state = states[i % states.length];
    const type = types[i % types.length];
    return {
      identifier: id,
      name: `Benchmark Device ${num}`,
      type,
      manufacturer: i % 2 === 0 ? 'Hikvision' : 'Sample vendor',
      library: i % 2 === 0 ? 'HIK_OpenAPI' : 'Pilot_Edge_v1',
      model: type === 'Speaker' ? 'DS-QAZ1307G1T-E' : 'DS-2CFSP4/4G',
      serial: `SN_BENCH_${String(num).padStart(4, '0')}`,
      vendorDeviceId: `SN_BENCH_${String(num).padStart(4, '0')}`,
      siteId: i % 10 === 0 ? null : 'site-tpg',
      siteName: i % 10 === 0 ? null : 'Teluk Panglima Garang',
      connectivityState: state,
      lifecycle: i % 25 === 0 ? 'Maintenance' : 'Active',
      installedPoleId: i % 7 === 0 ? null : `AST-${String((i % 60) + 1).padStart(3, '0')}`,
      registeredAt: '2026-10-01T08:00:00+08:00',
      lastUpdatedAt: '2026-10-21T06:00:00+08:00',
      lastContactAt: i % 5 === 0 ? '2026-10-12T15:30:00+08:00' : '2026-10-21T10:30:00+08:00',
      batteryPercent: 80,
      temperatureC: 36,
      softwareVersion: 'V5.7.15',
      connectionCheck: { status: 'Never checked', checkedAt: null, message: null },
      components: [type],
      configVersion: i % 3 === 0 ? null : 'cfg-1',
      configStatus: i % 3 === 0 ? 'None' : 'Applied',
      configReportedAt: i % 3 === 0 ? null : '2026-10-15T10:00:00+08:00',
      configuration: getDefaultConfigValuesForType(type),
      configVersions: [],
      connectivityPeriods: [],
      timeline: [],
      installationHistory: [],
      healthReports: [],
    };
  });
}
