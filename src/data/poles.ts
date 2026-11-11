import type {
  SiteRecord,
  PoleRecord,
  CableSpanRecord,
  DeviceSummaryRecord,
} from '../types/assets.ts';
import { mapPoles } from './map.ts';
import { segments } from './segments.ts';
import { devices } from './devices.ts';

export const SITES: SiteRecord[] = [
  {
    id: 'site-tpg',
    name: 'Teluk Panglima Garang',
    centrePoint: { lat: 2.92239, lng: 101.45717 },
    boundary: null,
  },
  {
    id: 'site-kch-central',
    name: 'Kuching Central',
    centrePoint: { lat: 1.5535, lng: 110.3421 },
    boundary: null,
  },
  {
    id: 'site-kch-north',
    name: 'Kuching North',
    centrePoint: { lat: 1.578, lng: 110.352 },
    boundary: null,
  },
  {
    id: 'site-samarahan',
    name: 'Samarahan',
    centrePoint: { lat: 1.462, lng: 110.428 },
    boundary: null,
  },
  {
    id: 'site-shah-alam',
    name: 'Shah Alam',
    centrePoint: { lat: 3.0733, lng: 101.5185 },
    boundary: null,
  },
  {
    id: 'site-pj',
    name: 'Petaling Jaya',
    centrePoint: { lat: 3.1073, lng: 101.6067 },
    boundary: null,
  },
];

export const JALAN_BANDAR_LAMA_SITE: SiteRecord = {
  id: 'site-jbl',
  name: 'Jalan Bandar Lama',
  centrePoint: { lat: 2.9102, lng: 101.4718 },
  boundary: null,
};

/**
 * Normalizes identifier strictly for internal foreign-key relation matching (AST_002 <-> AST-002).
 * NEVER use this to format or overwrite a pole's displayed identifier.
 */
export function normalizeRelationKey(id: string | null | undefined): string {
  if (!id) return '';
  return id.trim().toUpperCase().replace(/-/g, '_');
}

function parseDeviceLatLng(locStr: string | undefined): { lat: number; lng: number } | null {
  if (!locStr) return null;
  const parts = locStr.split(',').map((p) => Number(p.trim()));
  if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    return { lat: Number(parts[0].toFixed(6)), lng: Number(parts[1].toFixed(6)) };
  }
  return null;
}

// 1. Exact staging poles from Teluk Panglima Garang (Screenshots 1-4)
// Timestamps anchored 4 days before DEFAULT_SERVER_TIME_ISO (2026-10-21T11:15:00+08:00)
const STAGING_TPG_POLES: PoleRecord[] = [
  {
    identifier: 'TEST',
    name: 'TEST',
    type: 'Pole',
    lifecycle: 'Active',
    siteId: 'site-tpg',
    siteName: 'Teluk Panglima Garang',
    location: { lat: 2.922926, lng: 101.457646 },
    protection: 'Test',
    note: 'Test',
    registeredAt: '2026-10-17T10:46:00+08:00',
    lastUpdatedAt: '2026-10-17T10:55:00+08:00',
    lifecycleStartedAt: '2026-10-17T10:46:00+08:00',
    lifecycleHistory: [
      {
        id: 'lh-test-1',
        status: 'Active',
        from: '2026-10-17T10:46:00+08:00',
        to: null,
        note: null,
        recordedBy: 'Admin',
        recordedAt: '2026-10-17T10:46:00+08:00',
      },
    ],
    timeline: [
      {
        id: 'tl-test-6',
        kind: 'Location',
        message: 'Location set to 2.922926, 101.457646',
        field: 'Location',
        fromValue: '2.923409, 101.455958',
        toValue: '2.922926, 101.457646',
        coordinates: { lat: 2.922926, lng: 101.457646 },
        actor: 'Admin',
        timestamp: '2026-10-17T10:55:00+08:00',
      },
      {
        id: 'tl-test-5',
        kind: 'Change',
        message: 'Protection changed from none to Test',
        field: 'Protection',
        fromValue: 'none',
        toValue: 'Test',
        actor: 'Admin',
        timestamp: '2026-10-17T10:55:00+08:00',
      },
      {
        id: 'tl-test-4',
        kind: 'Change',
        message: 'Note changed from none to Test',
        field: 'Note',
        fromValue: 'none',
        toValue: 'Test',
        actor: 'Admin',
        timestamp: '2026-10-17T10:55:00+08:00',
      },
      {
        id: 'tl-test-3',
        kind: 'Location',
        message: 'Location set to 2.923409, 101.455958',
        field: 'Location',
        toValue: '2.923409, 101.455958',
        coordinates: { lat: 2.923409, lng: 101.455958 },
        actor: 'Admin',
        timestamp: '2026-10-17T10:55:00+08:00',
      },
      {
        id: 'tl-test-2',
        kind: 'Lifecycle',
        message: 'Lifecycle set to Active',
        field: 'Lifecycle',
        toValue: 'Active',
        actor: 'Admin',
        timestamp: '2026-10-17T10:46:00+08:00',
      },
      {
        id: 'tl-test-1',
        kind: 'Registered',
        message: 'Pole registered',
        actor: null,
        timestamp: '2026-10-17T10:46:00+08:00',
      },
    ],
  },
  {
    identifier: 'TESTPOLE2',
    name: 'Testing Pole 2',
    type: 'Pole',
    lifecycle: 'Active',
    siteId: 'site-tpg',
    siteName: 'Teluk Panglima Garang',
    location: { lat: 2.922233, lng: 101.455604 },
    protection: null,
    note: null,
    registeredAt: '2026-10-17T10:50:00+08:00',
    lastUpdatedAt: '2026-10-17T11:02:00+08:00',
    lifecycleStartedAt: '2026-10-17T10:50:00+08:00',
    lifecycleHistory: [
      {
        id: 'lh-tp2-1',
        status: 'Active',
        from: '2026-10-17T10:50:00+08:00',
        to: null,
        note: null,
        recordedBy: 'Admin',
        recordedAt: '2026-10-17T10:50:00+08:00',
      },
    ],
    timeline: [
      {
        id: 'tl-tp2-2',
        kind: 'Location',
        message: 'Location set to 2.922233, 101.455604',
        field: 'Location',
        toValue: '2.922233, 101.455604',
        coordinates: { lat: 2.922233, lng: 101.455604 },
        actor: 'Admin',
        timestamp: '2026-10-17T11:02:00+08:00',
      },
      {
        id: 'tl-tp2-1',
        kind: 'Registered',
        message: 'Pole registered',
        actor: 'Admin',
        timestamp: '2026-10-17T10:50:00+08:00',
      },
    ],
  },
  ...[
    { id: 'TGP_P001', lat: 2.921913, lng: 101.463901, prot: 'Surge arrester', daysAgo: 12 },
    { id: 'TGP_P002', lat: 2.921655, lng: 101.466254, prot: 'Surge arrester', daysAgo: 12 },
    { id: 'TGP_P003', lat: 2.921696, lng: 101.466501, prot: 'Lightning rod', daysAgo: 11 },
    { id: 'TGP_P004', lat: 2.923571, lng: 101.445354, prot: null, daysAgo: 10 },
    { id: 'TGP_P005', lat: 2.923604, lng: 101.466503, prot: 'Surge arrester', daysAgo: 10 },
    { id: 'TGP_P006', lat: 2.921388, lng: 101.466235, prot: null, daysAgo: 9 },
    { id: 'TGP_P007', lat: 2.921221, lng: 101.466236, prot: 'Earthing rod', daysAgo: 8 },
    { id: 'TGP_P008', lat: 2.92084, lng: 101.466239, prot: null, daysAgo: 8 },
    { id: 'TGP_P009', lat: null, lng: null, prot: null, daysAgo: 7 },
    { id: 'TGP_P010', lat: 2.923637, lng: 101.468205, prot: 'Surge arrester', daysAgo: 6 },
    { id: 'TGP_P011', lat: 2.923593, lng: 101.467238, prot: null, daysAgo: 5 },
  ].map((item, idx): PoleRecord => {
    const regDate = new Date('2026-10-21T09:00:00+08:00');
    regDate.setDate(regDate.getDate() - item.daysAgo);
    const regIso = regDate.toISOString();
    const updDate = new Date(regDate.getTime() + 35 * 60000);
    const updIso = updDate.toISOString();
    const hasCoords = item.lat !== null && item.lng !== null;
    const loc = hasCoords ? { lat: item.lat!, lng: item.lng! } : null;

    return {
      identifier: item.id,
      name: item.id,
      type: 'Pole',
      lifecycle: idx === 7 ? 'Maintenance' : 'Active',
      siteId: 'site-tpg',
      siteName: 'Teluk Panglima Garang',
      location: loc,
      protection: item.prot,
      note: idx === 8 ? 'Pending GPS survey on Jalan Kebun junction' : null,
      registeredAt: regIso,
      lastUpdatedAt: updIso,
      lifecycleStartedAt: regIso,
      lifecycleHistory: [
        {
          id: `lh-${item.id}-1`,
          status: idx === 7 ? 'Maintenance' : 'Active',
          from: regIso,
          to: null,
          note: idx === 7 ? 'Scheduled cross-arm check' : null,
          recordedBy: 'Admin',
          recordedAt: regIso,
        },
      ],
      timeline: [
        ...(loc
          ? [
              {
                id: `tl-${item.id}-2`,
                kind: 'Location' as const,
                message: `Location set to ${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`,
                field: 'Location',
                toValue: `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`,
                coordinates: loc,
                actor: 'Admin',
                timestamp: updIso,
              },
            ]
          : []),
        {
          id: `tl-${item.id}-1`,
          kind: 'Registered',
          message: 'Pole registered',
          actor: 'Admin',
          timestamp: regIso,
        },
      ],
    };
  }),
  // 1 soft-deleted record for realistic Deleted view inspection
  {
    identifier: 'TGP_P000',
    name: 'Legacy Timber Pole 000',
    type: 'Pole',
    lifecycle: 'Deleted',
    siteId: 'site-tpg',
    siteName: 'Teluk Panglima Garang',
    location: { lat: 2.9211, lng: 101.4549 },
    protection: null,
    note: 'Decommissioned during road widening works.',
    registeredAt: '2026-09-12T08:30:00+08:00',
    lastUpdatedAt: '2026-10-16T09:15:00+08:00',
    lifecycleStartedAt: '2026-09-12T08:30:00+08:00',
    deletedAt: '2026-10-16T09:15:00+08:00',
    deletedBy: 'Admin',
    deleteReason: 'Decommissioned during road widening works',
    lifecycleHistory: [
      {
        id: 'lh-tgp0-1',
        status: 'Active',
        from: '2026-09-12T08:30:00+08:00',
        to: '2026-10-16T09:15:00+08:00',
        note: null,
        recordedBy: 'Admin',
        recordedAt: '2026-09-12T08:30:00+08:00',
      },
      {
        id: 'lh-tgp0-2',
        status: 'Deleted',
        from: '2026-10-16T09:15:00+08:00',
        to: null,
        note: 'Decommissioned during road widening works',
        recordedBy: 'Admin',
        recordedAt: '2026-10-16T09:15:00+08:00',
      },
    ],
    timeline: [
      {
        id: 'tl-tgp0-2',
        kind: 'Deleted',
        message: 'Pole soft deleted — Decommissioned during road widening works',
        actor: 'Admin',
        timestamp: '2026-10-16T09:15:00+08:00',
      },
      {
        id: 'tl-tgp0-1',
        kind: 'Registered',
        message: 'Pole registered',
        actor: 'Admin',
        timestamp: '2026-09-12T08:30:00+08:00',
      },
    ],
  },
];

// 2. Canonical AST-001 .. AST-120 prototype poles synced with features.ts, segments.ts, devices.ts, events.ts
const PROTOTYPE_AST_POLES: PoleRecord[] = Array.from({ length: 120 }, (_, i): PoleRecord => {
  const num = i + 1;
  const identifier = `AST-${String(num).padStart(3, '0')}`;
  const isTpg = i < 60;
  const siteId = isTpg ? 'site-tpg' : 'site-kch-central';
  const siteName = isTpg ? 'Teluk Panglima Garang' : 'Kuching Central';
  const siteCenter = isTpg
    ? { lat: 2.92239, lng: 101.45717 }
    : { lat: 1.5535, lng: 110.3421 };

  const svgPt = i < mapPoles.length ? mapPoles[i] : null;
  const matchedDev = devices.find(
    (d) => normalizeRelationKey(d.asset) === normalizeRelationKey(identifier)
  );
  const devCoords = matchedDev ? parseDeviceLatLng(matchedDev.location) : null;

  let location: { lat: number; lng: number } | null = null;
  if (svgPt) {
    if (devCoords) {
      location = devCoords;
    } else {
      // Deterministic geographic coordinates around site centre for mapped poles
      const dLat = ((500 - svgPt[1]) / 700) * 0.018;
      const dLng = ((svgPt[0] - 500) / 1000) * 0.028;
      location = {
        lat: Number((siteCenter.lat + dLat).toFixed(6)),
        lng: Number((siteCenter.lng + dLng).toFixed(6)),
      };
    }
  }

  const baseDate = new Date('2026-10-01T09:00:00+08:00');
  baseDate.setHours(baseDate.getHours() + i * 3);
  const regIso = baseDate.toISOString();
  const updIso = new Date(baseDate.getTime() + 45 * 60000).toISOString();

  return {
    identifier,
    name: `Distribution Pole ${identifier}`,
    type: 'Pole',
    lifecycle: num % 17 === 0 ? 'Maintenance' : 'Active',
    siteId,
    siteName,
    location,
    canvasPoint: svgPt ? { x: svgPt[0], y: svgPt[1] } : null,
    protection: num % 3 === 0 ? 'Surge arrester' : null,
    note: svgPt ? null : 'Survey pending — no coordinates recorded yet.',
    registeredAt: regIso,
    lastUpdatedAt: updIso,
    lifecycleStartedAt: regIso,
    lifecycleHistory: [
      {
        id: `lh-${identifier}-1`,
        status: num % 17 === 0 ? 'Maintenance' : 'Active',
        from: regIso,
        to: null,
        note: null,
        recordedBy: 'System',
        recordedAt: regIso,
      },
    ],
    timeline: [
      ...(location
        ? [
            {
              id: `tl-${identifier}-2`,
              kind: 'Location' as const,
              message: `Location set to ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
              field: 'Location',
              toValue: `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
              coordinates: location,
              actor: 'System',
              timestamp: updIso,
            },
          ]
        : []),
      {
        id: `tl-${identifier}-1`,
        kind: 'Registered',
        message: 'Pole registered',
        actor: 'System',
        timestamp: regIso,
      },
    ],
  };
});

export const initialPoles: PoleRecord[] = [
  ...STAGING_TPG_POLES,
  ...PROTOTYPE_AST_POLES,
];

// Cable Spans: Staging span TESTCABLESPAN2 + canonical Risk segments CBL-001..CBL-025 + CBL-026..CBL-114
export const initialCableSpans: CableSpanRecord[] = [
  {
    identifier: 'TESTCABLESPAN2',
    name: 'Test Cable Span 1',
    type: 'Cable span',
    lifecycle: 'Active',
    siteId: 'site-tpg',
    siteName: 'Teluk Panglima Garang',
    fromPole: 'TEST',
    toPole: 'TESTPOLE2',
    lengthKm: 0.24,
    route: 'Test Spur',
  },
  ...segments.map((seg): CableSpanRecord => ({
    identifier: seg.spanId,
    name: `Fibre Route Span ${seg.spanId}`,
    type: 'Cable span',
    lifecycle: 'Active',
    siteId: 'site-tpg',
    siteName: 'Teluk Panglima Garang',
    fromPole: seg.from,
    toPole: seg.to,
    lengthKm: 1.2,
    path: seg.path,
    route: seg.route,
  })),
  ...Array.from({ length: 89 }, (_, idx): CableSpanRecord => {
    const num = 26 + idx;
    const id = `CBL-${String(num).padStart(3, '0')}`;
    const fromNum = num;
    const toNum = Math.min(120, num + 1);
    const isTpg = num <= 57;
    return {
      identifier: id,
      name: `Fibre Route Span ${id}`,
      type: 'Cable span',
      lifecycle: num % 12 === 0 ? 'Maintenance' : 'Active',
      siteId: isTpg ? 'site-tpg' : 'site-kch-central',
      siteName: isTpg ? 'Teluk Panglima Garang' : 'Kuching Central',
      fromPole: `AST-${String(fromNum).padStart(3, '0')}`,
      toPole: `AST-${String(toNum).padStart(3, '0')}`,
      lengthKm: Number((0.8 + (num % 5) * 0.4).toFixed(1)),
      route: isTpg ? 'TPG Trunk' : 'Kuching Feeder',
    };
  }),
];

/**
 * Deterministic Preview Mode Scenario: Jalan Bandar Lama
 * Exactly 20 poles, 10 cable spans, and 10 devices with full cross-module agreement.
 */
export function buildJalanBandarLamaPreviewDataset(): {
  site: SiteRecord;
  poles: PoleRecord[];
  spans: CableSpanRecord[];
  devices: DeviceSummaryRecord[];
} {
  const poles: PoleRecord[] = Array.from({ length: 20 }, (_, i): PoleRecord => {
    const num = i + 1;
    const identifier = `JBL_P${String(num).padStart(3, '0')}`;
    const missingLoc = num === 19 || num === 20;
    const lat = Number((2.9082 + (i % 5) * 0.00095).toFixed(6));
    const lng = Number((101.4694 + Math.floor(i / 5) * 0.0012).toFixed(6));
    const loc = missingLoc ? null : { lat, lng };
    const regIso = `2026-10-15T09:${String(num).padStart(2, '0')}:00+08:00`;

    return {
      identifier,
      name: `Jalan Bandar Lama Pole ${String(num).padStart(2, '0')}`,
      type: 'Pole',
      lifecycle: num === 14 ? 'Maintenance' : 'Active',
      siteId: JALAN_BANDAR_LAMA_SITE.id,
      siteName: JALAN_BANDAR_LAMA_SITE.name,
      location: loc,
      protection: num % 2 === 0 ? 'Surge arrester' : null,
      note: missingLoc ? 'GPS verification pending field team survey' : null,
      registeredAt: regIso,
      lastUpdatedAt: '2026-10-20T14:30:00+08:00',
      lifecycleStartedAt: regIso,
      lifecycleHistory: [
        {
          id: `lh-jbl-${num}`,
          status: num === 14 ? 'Maintenance' : 'Active',
          from: regIso,
          to: null,
          recordedBy: 'System',
          recordedAt: regIso,
        },
      ],
      timeline: [
        ...(loc
          ? [
              {
                id: `tl-jbl-loc-${num}`,
                kind: 'Location' as const,
                message: `Location set to ${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`,
                field: 'Location',
                toValue: `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`,
                coordinates: loc,
                actor: 'System',
                timestamp: '2026-10-20T14:30:00+08:00',
              },
            ]
          : []),
        {
          id: `tl-jbl-reg-${num}`,
          kind: 'Registered',
          message: 'Pole registered',
          actor: 'System',
          timestamp: regIso,
        },
      ],
    };
  });

  const spans: CableSpanRecord[] = Array.from({ length: 10 }, (_, i): CableSpanRecord => {
    const num = i + 1;
    const from = `JBL_P${String(num * 2 - 1).padStart(3, '0')}`;
    const to = `JBL_P${String(num * 2).padStart(3, '0')}`;
    return {
      identifier: `CBL-JBL-${String(num).padStart(2, '0')}`,
      name: `Bandar Lama Span ${num}`,
      type: 'Cable span',
      lifecycle: 'Active',
      siteId: JALAN_BANDAR_LAMA_SITE.id,
      siteName: JALAN_BANDAR_LAMA_SITE.name,
      fromPole: from,
      toPole: to,
      lengthKm: Number((0.45 + (i % 4) * 0.15).toFixed(2)),
      route: 'Jalan Bandar Lama Trunk',
    };
  });

  const previewDevices: DeviceSummaryRecord[] = Array.from({ length: 10 }, (_, i): DeviceSummaryRecord => {
    const num = i + 1;
    const pole = poles[i];
    const locStr = pole.location
      ? `${pole.location.lat.toFixed(5)}, ${pole.location.lng.toFixed(5)}`
      : 'Not recorded';
    return {
      id: `DEV-JBL-${String(num).padStart(2, '0')}`,
      name: `JBL Sensor ${num}`,
      type: num % 3 === 0 ? 'LiDAR sensor' : num === 10 ? 'Gateway' : 'Camera',
      lifecycle: 'Active',
      site: JALAN_BANDAR_LAMA_SITE.name,
      status: num === 4 ? 'offline' : num === 7 ? 'stale' : 'online',
      lastContact: '20 Oct, 16:20',
      asset: pole.identifier,
      manufacturer: 'Sample vendor',
      model: 'Pilot camera',
      serial: `SN_JBL_${String(num).padStart(3, '0')}`,
      location: locStr,
    };
  });

  return {
    site: JALAN_BANDAR_LAMA_SITE,
    poles,
    spans,
    devices: previewDevices,
  };
}

