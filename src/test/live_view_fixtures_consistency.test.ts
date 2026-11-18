import test from 'node:test';
import assert from 'node:assert/strict';
import { getPreviewCameras } from '../preview/live/previewFixtures.ts';
import { DEFAULT_LIVE_STATE_THRESHOLDS, getDefaultCameraId, computeUnifiedDeviceState } from '../lib/liveCameras.ts';
import { getLiveGroups } from '../lib/liveGroups.ts';

test('Preview Fixtures: Consistency & Scenario Invariants', async (t) => {
  const now = new Date();
  const cameras = getPreviewCameras([], [], now);

  await t.test('guarantees exactly 15 cameras with realistic states (DEV-001 Online, DEV-002..DEV-015 Offline)', () => {
    assert.strictEqual(cameras.length, 15);
    const online = cameras.filter((c) => c.connectivityState === 'online');
    const offline = cameras.filter((c) => c.connectivityState === 'offline');

    // 1 Online (DEV-001 demo camera), 14 Offline (DEV-002 through DEV-015, matching 28d offline staging)
    assert.strictEqual(online.length, 1);
    assert.strictEqual(online[0].identifier, 'DEV-001');
    assert.strictEqual(offline.length, 14);
  });

  await t.test('strictly verifies Online, Stale, and Offline threshold rules against shared helper', () => {
    cameras.forEach((cam) => {
      assert.ok(cam.lastContactAt, `Camera ${cam.identifier} must have lastContactAt`);
      const unified = computeUnifiedDeviceState(cam.lastContactAt, undefined, DEFAULT_LIVE_STATE_THRESHOLDS, now);

      assert.strictEqual(
        cam.connectivityState,
        unified.state,
        `Camera ${cam.identifier} state (${cam.connectivityState}) must match unified state (${unified.state})`
      );

      const diffMinutes = Math.floor((now.getTime() - new Date(cam.lastContactAt).getTime()) / 60000);
      if (cam.connectivityState === 'online') {
        assert.ok(
          diffMinutes < DEFAULT_LIVE_STATE_THRESHOLDS.staleThresholdMinutes,
          `Online camera ${cam.identifier} diff ${diffMinutes}m must be < ${DEFAULT_LIVE_STATE_THRESHOLDS.staleThresholdMinutes}m`
        );
      } else if (cam.connectivityState === 'stale') {
        assert.ok(
          diffMinutes >= DEFAULT_LIVE_STATE_THRESHOLDS.staleThresholdMinutes &&
            diffMinutes < DEFAULT_LIVE_STATE_THRESHOLDS.offlineThresholdMinutes,
          `Stale camera ${cam.identifier} diff ${diffMinutes}m must be between 60m and 1440m`
        );
      } else {
        assert.ok(
          diffMinutes >= DEFAULT_LIVE_STATE_THRESHOLDS.offlineThresholdMinutes,
          `Offline camera ${cam.identifier} diff ${diffMinutes}m must be >= ${DEFAULT_LIVE_STATE_THRESHOLDS.offlineThresholdMinutes}m`
        );
      }
    });
  });

  await t.test('offline cameras never have snapshot or event newer than last contact', () => {
    const offlineCameras = cameras.filter((c) => c.connectivityState === 'offline');
    offlineCameras.forEach((cam) => {
      const lastContactMs = new Date(cam.lastContactAt!).getTime();
      cam.deviceEvents.forEach((evt) => {
        const eventMs = new Date(evt.captured).getTime();
        assert.ok(
          eventMs <= lastContactMs,
          `Offline camera ${cam.identifier} event (${evt.captured}) cannot be newer than lastContact (${cam.lastContactAt})`
        );
      });
    });
  });

  await t.test('monkey photo is used only for DEV-001 matching event', () => {
    cameras.forEach((cam) => {
      const hasMonkey = cam.deviceEvents.some((e) => e.snapshots?.includes('/monkey-fiber.jpg'));
      if (cam.identifier === 'DEV-001') {
        assert.ok(hasMonkey, 'DEV-001 must have monkey photo');
      } else {
        assert.strictEqual(hasMonkey, false, `Camera ${cam.identifier} should not use monkey photo`);
      }
    });
  });

  await t.test('default camera rule dynamically selects first Online camera', () => {
    // When no stored ID, returns first online camera (DEV-001)
    const defaultId = getDefaultCameraId(cameras, null);
    assert.strictEqual(defaultId, 'DEV-001');

    // When stored ID exists and matches, returns stored ID
    const storedId = getDefaultCameraId(cameras, 'DEV-005');
    assert.strictEqual(storedId, 'DEV-005');

    // When stored ID is invalid, falls back to first online
    const fallbackId = getDefaultCameraId(cameras, 'DEV-INVALID');
    assert.strictEqual(fallbackId, 'DEV-001');
  });

  await t.test('pre-seeded group "Preview wall" exists with camera references', () => {
    const groups = getLiveGroups(cameras);
    const previewWall = groups.find((g) => g.name === 'Preview wall');
    assert.ok(previewWall, 'Preview wall group must exist');
    assert.strictEqual(previewWall.cameraIds.length, 6);

    // All 6 cameras in Preview wall must exist in fixtures
    previewWall.cameraIds.forEach((id) => {
      const cam = cameras.find((c) => c.identifier === id);
      assert.ok(cam, `Camera ${id} must exist in fixtures`);
    });
  });
});
