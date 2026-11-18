import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getDefaultCameraId,
  filterCamerasOnly,
  getCameraCapabilities,
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
