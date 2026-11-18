import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeUnifiedDeviceState,
  DEFAULT_LIVE_STATE_THRESHOLDS,
} from '../lib/liveCameras.ts';
import {
  DEFAULT_GROUPS,
  MAX_GROUPS_PER_USER,
  MAX_CAMERAS_PER_GROUP,
} from '../lib/liveGroups.ts';
import { events } from '../data/events.ts';

test('Live View v2: Unified Device State Invariants', async (t) => {
  const baseNow = new Date('2026-11-18T14:30:00.000Z');

  await t.test('evaluates contact < 60m as online', () => {
    const contact20mAgo = new Date(baseNow.getTime() - 20 * 60000).toISOString();
    const result = computeUnifiedDeviceState(contact20mAgo, 'online', DEFAULT_LIVE_STATE_THRESHOLDS, baseNow);
    assert.equal(result.state, 'online');
    assert.match(result.relativeTime, /m ago/);
  });

  await t.test('evaluates contact between 60m and 24h as stale', () => {
    // Exactly 4h 16m ago (like DEV-001 in audit A2)
    const contact4hAgo = new Date(baseNow.getTime() - 256 * 60000).toISOString();
    const result = computeUnifiedDeviceState(contact4hAgo, 'online', DEFAULT_LIVE_STATE_THRESHOLDS, baseNow);
    assert.equal(result.state, 'stale');
    assert.match(result.reason, /Stale:/);
    assert.match(result.relativeTime, /4h/);
  });

  await t.test('evaluates contact > 24h as offline', () => {
    const contact2dAgo = new Date(baseNow.getTime() - 48 * 3600000).toISOString();
    const result = computeUnifiedDeviceState(contact2dAgo, 'online', DEFAULT_LIVE_STATE_THRESHOLDS, baseNow);
    assert.equal(result.state, 'offline');
    assert.match(result.reason, /Offline:/);
  });

  await t.test('hardware fault or marked offline overrides timestamp', () => {
    const recentContact = new Date(baseNow.getTime() - 5 * 60000).toISOString();
    const result = computeUnifiedDeviceState(recentContact, 'offline', DEFAULT_LIVE_STATE_THRESHOLDS, baseNow);
    assert.equal(result.state, 'offline');
    assert.match(result.reason, /Hardware marked offline/);
  });

  await t.test('missing or null timestamp evaluates to offline', () => {
    const resultNull = computeUnifiedDeviceState(null, 'online', DEFAULT_LIVE_STATE_THRESHOLDS, baseNow);
    assert.equal(resultNull.state, 'offline');
    assert.equal(resultNull.relativeTime, 'Never');

    const resultUndefined = computeUnifiedDeviceState(undefined, undefined, DEFAULT_LIVE_STATE_THRESHOLDS, baseNow);
    assert.equal(resultUndefined.state, 'offline');
  });
});

test('Live View v2: Groups Schema & Limit Invariants', async (t) => {
  await t.test('system group grp-all is seeded and protected', () => {
    const allGroup = DEFAULT_GROUPS.find((g) => g.id === 'grp-all');
    assert.ok(allGroup, 'Default grp-all must exist');
    assert.equal(allGroup?.isSystem, true, 'grp-all must be flagged as system group');
    assert.ok(allGroup?.cameraIds.length >= 6, 'grp-all must contain seeded cameras');
  });

  await t.test('limits user groups to maximum 20', () => {
    assert.equal(MAX_GROUPS_PER_USER, 20);
  });

  await t.test('limits cameras per group to maximum 30', () => {
    assert.equal(MAX_CAMERAS_PER_GROUP, 30);
  });
});

test('Live View v2: Events Dataset Integrity & Natural Spread', async (t) => {
  await t.test('DEV-001 has natural priority spread without 5 consecutive Criticals', () => {
    const dev1Events = events.filter(
      (e) => (e.device || '').toLowerCase().trim() === 'dev-001'
    );
    assert.ok(dev1Events.length >= 5, 'DEV-001 must have at least 5 events');

    const top5Priorities = dev1Events.slice(0, 5).map((e) => e.priority);
    // In staging before fix: all 5 were 'Critical' (A1 finding)
    // After fix: ['Critical', 'High', 'Medium', 'Critical', 'Low']
    const allCritical = top5Priorities.every((p) => p === 'Critical');
    assert.equal(allCritical, false, 'DEV-001 recent events must NOT be 100% Critical');
    assert.ok(top5Priorities.includes('High'), 'Spread includes High');
    assert.ok(top5Priorities.includes('Medium'), 'Spread includes Medium');
  });

  await t.test('preserves global invariant of exactly 172 High and Critical priority events', () => {
    const highCriticalCount = events.filter(
      (e) => e.priority === 'High' || e.priority === 'Critical'
    ).length;
    assert.equal(
      highCriticalCount,
      172,
      'Global contract of 172 High+Critical events must remain exact'
    );
  });
});
