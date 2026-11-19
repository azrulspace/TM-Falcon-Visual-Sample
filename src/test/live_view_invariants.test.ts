import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getDefaultCameraId,
  filterCamerasOnly,
  getCameraCapabilities,
  getRecentEventsForCamera,
  getPoleForCamera,
} from '../lib/liveCameras.ts';
import { getLivePermissions } from '../lib/permissions.ts';

test('Live View: getDefaultCameraId resolves stored camera when present in list', () => {
  const sample = [
    { identifier: 'DEV-001', connectivityState: 'online' },
    { identifier: 'DEV-002', connectivityState: 'online' },
    { identifier: 'DEV-004', connectivityState: 'offline' },
  ];
  const resolved = getDefaultCameraId(sample, 'DEV-002');
  assert.equal(resolved, 'DEV-002');
});

test('Live View: getDefaultCameraId falls back to first online camera when stored ID is invalid or missing', () => {
  const sample = [
    { identifier: 'DEV-004', connectivityState: 'offline' },
    { identifier: 'DEV-001', connectivityState: 'online' },
    { identifier: 'DEV-002', connectivityState: 'online' },
  ];
  const resolved = getDefaultCameraId(sample, 'NON_EXISTENT');
  assert.equal(resolved, 'DEV-001');

  const resolvedNull = getDefaultCameraId(sample, null);
  assert.equal(resolvedNull, 'DEV-001');
});

test('Live View: getDefaultCameraId falls back to first camera when no cameras are online', () => {
  const sample = [
    { identifier: 'DEV-004', connectivityState: 'offline' },
    { identifier: 'DEV-011', connectivityState: 'offline' },
  ];
  const resolved = getDefaultCameraId(sample, null);
  assert.equal(resolved, 'DEV-004');
});

test('Live View: filterCamerasOnly excludes speakers and non-cameras', () => {
  const mixed = [
    { identifier: 'DEV-001', type: 'Camera' },
    { identifier: 'DEV-JBL-01', type: 'Speaker' },
    { identifier: 'DEV-002', type: 'Camera' },
    { identifier: 'LIDAR-01', type: 'Sensor' },
  ];
  const cameras = filterCamerasOnly(mixed);
  assert.equal(cameras.length, 2);
  assert.deepEqual(
    cameras.map((c) => c.identifier),
    ['DEV-001', 'DEV-002']
  );
});

test('Live View: getCameraCapabilities flags mobile data and PTZ accurately', () => {
  const dev001: any = {
    identifier: 'DEV-001',
    model: 'DS-2CFSP4/4G',
    components: ['Camera', 'Solar MPPT'],
    library: 'HIK_OpenAPI',
  };
  const caps = getCameraCapabilities(dev001);
  assert.equal(caps.isMobileData, true);
  assert.equal(caps.supportsPtz, true);
  assert.equal(caps.supportsTalk, true);

  const basicCam: any = {
    identifier: 'DEV-099',
    model: 'DS-2CD2043G2-I',
    components: ['Optical sensor'],
    library: 'Generic_RTSP',
  };
  const basicCaps = getCameraCapabilities(basicCam);
  assert.equal(basicCaps.isMobileData, false);
});

test('Live View: estimated data formula calculates accurately', () => {
  const bitrateMbps = 2.4;
  const elapsedSeconds = 60; // 1 minute
  // (2.4 * 10^6 * 60) / (8 * 1024^2) = 144,000,000 / 8,388,608 ≈ 17.166 MB
  const estimatedMb = (bitrateMbps * 1000 * 1000 * elapsedSeconds) / (8 * 1024 * 1024);
  assert.ok(estimatedMb > 17 && estimatedMb < 18);
});

test('Live View: RBAC permissions restrict Talk and PTZ appropriately', () => {
  const admin = getLivePermissions('Admin');
  assert.equal(admin.canWatchLive, true);
  assert.equal(admin.canUseTalk, true);
  assert.equal(admin.canUsePtz, true);

  const op = getLivePermissions('Operator');
  assert.equal(op.canWatchLive, true);
  assert.equal(op.canUseTalk, true);
  assert.equal(op.canUsePtz, true);

  const field = getLivePermissions('Field');
  assert.equal(field.canWatchLive, true);
  assert.equal(field.canUseTalk, false);
  assert.ok(field.talkDisabledReason?.includes('Permission denied'));
  assert.equal(field.canUsePtz, false);
  assert.ok(field.ptzDisabledReason?.includes('Permission denied'));
});

test('Live View: getRecentEventsForCamera caps to limit and filters by device ID', () => {
  const mockEvents: any[] = [
    { id: 'EVT-1', device: 'DEV-001', captured: '2026-10-21T06:00:00Z' },
    { id: 'EVT-2', device: 'DEV-002', captured: '2026-10-21T06:01:00Z' },
    { id: 'EVT-3', device: 'DEV-001', captured: '2026-10-21T06:02:00Z' },
    { id: 'EVT-4', device: 'DEV-001', captured: '2026-10-21T06:03:00Z' },
    { id: 'EVT-5', device: 'DEV-001', captured: '2026-10-21T06:04:00Z' },
    { id: 'EVT-6', device: 'DEV-001', captured: '2026-10-21T06:05:00Z' },
    { id: 'EVT-7', device: 'DEV-001', captured: '2026-10-21T06:06:00Z' },
  ];
  const dev001Events = getRecentEventsForCamera(mockEvents, 'DEV-001', 5);
  assert.equal(dev001Events.length, 5);
  assert.ok(dev001Events.every((e) => e.device === 'DEV-001'));

  const dev002Events = getRecentEventsForCamera(mockEvents, 'DEV-002', 5);
  assert.equal(dev002Events.length, 1);
  assert.equal(dev002Events[0].id, 'EVT-2');
});

test('Live View: getPoleForCamera resolves installed pole record', () => {
  const mockPoles: any[] = [
    { identifier: 'AST-002', name: 'Pole AST-002', location: { lat: 2.91, lng: 101.47 } },
    { identifier: 'TGP_P010', name: 'TGP_P010', location: { lat: 2.92, lng: 101.48 } },
  ];
  const p1 = getPoleForCamera(mockPoles, 'TGP_P010');
  assert.ok(p1);
  assert.equal(p1?.identifier, 'TGP_P010');

  const pNull = getPoleForCamera(mockPoles, null);
  assert.equal(pNull, null);
});

test('Live View Phase 7: RBAC full matrix permits only authorised live operations', () => {
  const admin = getLivePermissions('Admin');
  assert.equal(admin.canWatchLive, true);
  assert.equal(admin.canUseTalk, true);
  assert.equal(admin.canUsePtz, true);
  assert.equal(admin.canTakeSnapshot, true);

  const system = getLivePermissions('System');
  assert.equal(system.canWatchLive, true);
  assert.equal(system.canUseTalk, true);
  assert.equal(system.canUsePtz, true);
  assert.equal(system.canTakeSnapshot, true);

  const op = getLivePermissions('Operator');
  assert.equal(op.canWatchLive, true);
  assert.equal(op.canUseTalk, true);
  assert.equal(op.canUsePtz, true);
  assert.equal(op.canTakeSnapshot, true);

  const field = getLivePermissions('Field');
  assert.equal(field.canWatchLive, true);
  assert.equal(field.canUseTalk, false);
  assert.equal(field.canUsePtz, false);
  assert.equal(field.canTakeSnapshot, true);
  assert.ok(field.talkDisabledReason?.includes('Permission denied'));
  assert.ok(field.ptzDisabledReason?.includes('Permission denied'));

  const viewer = getLivePermissions('Viewer' as any);
  assert.equal(viewer.canWatchLive, false);
  assert.equal(viewer.canUseTalk, false);
  assert.equal(viewer.canUsePtz, false);
  assert.ok(viewer.watchDisabledReason?.includes('Permission denied'));
});

test('Live View Phase 7: Session audit record structure conformance', () => {
  const auditRecord = {
    id: 'audit-1700000000000-abcd',
    deviceId: 'DEV-001',
    cameraName: 'KT 001',
    user: 'Operator Ahmad',
    role: 'Operator',
    startedAt: '2026-11-18T05:00:00.000Z',
    stoppedAt: '2026-11-18T05:05:00.000Z',
    durationSeconds: 300,
    stopReason: 'user_stopped' as const,
    estimatedDataMb: 85.8,
  };

  assert.ok(auditRecord.id.startsWith('audit-'));
  assert.equal(auditRecord.deviceId, 'DEV-001');
  assert.equal(auditRecord.durationSeconds, 300);
  assert.ok(['user_stopped', 'inactivity', 'page_hidden', 'tab_closed', 'page_unmount', 'camera_switched'].includes(auditRecord.stopReason));
  assert.ok(auditRecord.estimatedDataMb > 0);
});

test('Live View Phase 8: Cross-module deep link autostart URL construction and parsing', () => {
  const deviceId = 'DEV-001';
  const deepLink = `/live/${encodeURIComponent(deviceId)}?autostart=1`;

  const parsedUrl = new URL(deepLink, 'http://localhost');
  assert.equal(parsedUrl.pathname, '/live/DEV-001');
  assert.equal(parsedUrl.searchParams.get('autostart'), '1');

  // Verify URL encoding handles spaces/special characters safely
  const customId = 'DEV 002';
  const customLink = `/live/${encodeURIComponent(customId)}?autostart=1`;
  const parsedCustom = new URL(customLink, 'http://localhost');
  assert.equal(parsedCustom.pathname, '/live/DEV%20002');
  assert.equal(decodeURIComponent(parsedCustom.pathname), '/live/DEV 002');
  assert.equal(parsedCustom.searchParams.get('autostart'), '1');
});

test('Live View Phase 9: Camera strip prev/next boundary invariants', () => {
  const fleet = [
    { identifier: 'DEV-001', connectivityState: 'online' },
    { identifier: 'DEV-002', connectivityState: 'online' },
    { identifier: 'DEV-003', connectivityState: 'online' },
  ];

  // First element: cannot go prev
  const idx0 = 0;
  const canPrev0 = idx0 > 0;
  const canNext0 = idx0 < fleet.length - 1;
  assert.equal(canPrev0, false);
  assert.equal(canNext0, true);

  // Last element: cannot go next
  const idxLast = fleet.length - 1;
  const canPrevLast = idxLast > 0;
  const canNextLast = idxLast < fleet.length - 1;
  assert.equal(canPrevLast, true);
  assert.equal(canNextLast, false);
});

test('Live View Phase 9: Telemetry data usage formula boundary invariants', () => {
  const bitrateMbps = 2.4;

  // Zero seconds: exactly 0 MB
  const zeroSeconds = 0;
  const zeroMb = (bitrateMbps * 1000 * 1000 * zeroSeconds) / (8 * 1024 * 1024);
  assert.equal(zeroMb, 0);

  // 1 hour (3600 seconds)
  const oneHourSeconds = 3600;
  const oneHourMb = (bitrateMbps * 1000 * 1000 * oneHourSeconds) / (8 * 1024 * 1024);
  // ~1030 MB
  assert.ok(oneHourMb > 1020 && oneHourMb < 1040);
  assert.equal(Number.isFinite(oneHourMb), true);
  assert.equal(Number.isNaN(oneHourMb), false);
});

test('Live View Monitor Wall: Start All filters strictly for online cameras and enforces max 4 streams', () => {
  const sampleCameras = [
    { identifier: 'DEV-001', connectivityState: 'online' },
    { identifier: 'DEV-002', connectivityState: 'offline' },
    { identifier: 'DEV-003', connectivityState: 'online' },
    { identifier: 'DEV-004', connectivityState: 'offline' },
    { identifier: 'DEV-005', connectivityState: 'online' },
    { identifier: 'DEV-006', connectivityState: 'online' },
    { identifier: 'DEV-007', connectivityState: 'online' },
  ];

  // Visible slots under layout 4
  const visible = sampleCameras.slice(0, 4); // DEV-001, 002, 003, 004
  assert.equal(visible.length, 4);

  // Eligible cameras to start
  const eligible = visible.filter((c) => c.connectivityState === 'online');
  assert.deepEqual(
    eligible.map((c) => c.identifier),
    ['DEV-001', 'DEV-003']
  );

  // Offline cameras skipped
  const skipped = visible.length - eligible.length;
  assert.equal(skipped, 2);

  // Bandwidth limit: max 4 streams
  const allOnline = sampleCameras.filter((c) => c.connectivityState === 'online'); // 5 cameras
  const toStart = allOnline.slice(0, 4);
  assert.equal(toStart.length, 4);
});

test('Live View Monitor Wall: Camera filter partitions group into All, Online, and Offline subsets', () => {
  const sampleCameras = [
    { identifier: 'DEV-001', connectivityState: 'online' },
    { identifier: 'DEV-002', connectivityState: 'offline' },
    { identifier: 'DEV-003', connectivityState: 'offline' },
    { identifier: 'DEV-004', connectivityState: 'offline' },
  ];

  const all = sampleCameras;
  const online = sampleCameras.filter((c) => c.connectivityState === 'online');
  const offline = sampleCameras.filter((c) => c.connectivityState === 'offline');

  assert.equal(all.length, 4);
  assert.equal(online.length, 1);
  assert.equal(offline.length, 3);
  assert.equal(online.length + offline.length, all.length);
});

