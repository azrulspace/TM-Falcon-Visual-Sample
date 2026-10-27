import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clipReducer,
  getPollingBackoff,
  getFailureDetails,
  formatClipDuration,
  type ClipState,
} from '../components/evidence/clipStateMachine.ts';

test('Clip State Machine: initial state is not_requested', () => {
  const initial: ClipState = { status: 'not_requested' };
  assert.equal(initial.status, 'not_requested');
});

test('Clip State Machine: transitions from not_requested to requested upon REQUEST_CLIP', () => {
  const initial: ClipState = { status: 'not_requested' };
  const next = clipReducer(initial, {
    type: 'REQUEST_CLIP',
    payload: { requestedAt: '10:14:00', requestedBy: 'Sarah' },
  });

  assert.equal(next.status, 'requested');
  assert.equal(next.requestedBy, 'Sarah');
  assert.equal(next.errorMessage, null);
  assert.ok(next.idempotencyKey);
});

test('Clip State Machine: REQUEST_CLIP blocked if device is offline', () => {
  const initial: ClipState = { status: 'not_requested' };
  const next = clipReducer(initial, {
    type: 'REQUEST_CLIP',
    payload: { deviceIsOnline: false },
  });

  assert.equal(next.status, 'device_offline');
});

test('Clip State Machine: REQUEST_CLIP blocked if no permission', () => {
  const initial: ClipState = { status: 'not_requested' };
  const next = clipReducer(initial, {
    type: 'REQUEST_CLIP',
    payload: { hasPermission: false },
  });

  assert.equal(next.status, 'no_permission');
});

test('Clip State Machine: DEVICE_STATUS_CHANGED toggles device_offline', () => {
  const onlineState: ClipState = { status: 'not_requested' };
  const offlineNext = clipReducer(onlineState, {
    type: 'DEVICE_STATUS_CHANGED',
    payload: { deviceIsOnline: false },
  });
  assert.equal(offlineNext.status, 'device_offline');

  const restoredNext = clipReducer(offlineNext, {
    type: 'DEVICE_STATUS_CHANGED',
    payload: { deviceIsOnline: true },
  });
  assert.equal(restoredNext.status, 'not_requested');
});

test('Clip State Machine: transitions from requested to uploading upon DEVICE_ACKNOWLEDGED', () => {
  const state: ClipState = { status: 'requested' };
  const next = clipReducer(state, {
    type: 'DEVICE_ACKNOWLEDGED',
    payload: { progress: 10 },
  });

  assert.equal(next.status, 'uploading');
  assert.equal(next.progress, 10);
});

test('Clip State Machine: updates progress while uploading', () => {
  const state: ClipState = { status: 'uploading', progress: 10 };
  const next = clipReducer(state, {
    type: 'UPDATE_PROGRESS',
    payload: { progress: 50 },
  });

  assert.equal(next.status, 'uploading');
  assert.equal(next.progress, 50);
});

test('Clip State Machine: transitions to ready upon UPLOAD_COMPLETE', () => {
  const state: ClipState = { status: 'uploading', progress: 95 };
  const next = clipReducer(state, {
    type: 'UPLOAD_COMPLETE',
    payload: { videoUrl: 'https://example.com/clip.mp4', durationSeconds: 38 },
  });

  assert.equal(next.status, 'ready');
  assert.equal(next.progress, 100);
  assert.equal(next.durationSeconds, 38);
  assert.equal(next.videoUrl, 'https://example.com/clip.mp4');
});

test('Clip State Machine: transitions to failed with failureReason upon ENCOUNTER_ERROR', () => {
  const state: ClipState = { status: 'uploading', progress: 40 };
  const next = clipReducer(state, {
    type: 'ENCOUNTER_ERROR',
    payload: { failureReason: 'timeout', errorMessage: 'Camera did not respond in time' },
  });

  assert.equal(next.status, 'failed');
  assert.equal(next.failureReason, 'timeout');
  assert.equal(next.errorMessage, 'Camera did not respond in time');
});

test('Clip State Machine: transitions to expired upon CLIP_EXPIRED and sets requestable flag', () => {
  const state: ClipState = { status: 'ready', videoUrl: 'https://example.com/clip.mp4' };
  const next = clipReducer(state, { type: 'CLIP_EXPIRED', payload: { requestable: true } });

  assert.equal(next.status, 'expired');
  assert.equal(next.videoUrl, null);
  assert.equal(next.requestable, true);
});

test('Clip State Machine: handles new version available without interrupting active playback', () => {
  const state: ClipState = { status: 'ready', videoUrl: 'https://example.com/clip_v1.mp4', version: 1 };
  const next = clipReducer(state, {
    type: 'NEW_VERSION_AVAILABLE',
    payload: { newVersionUrl: 'https://example.com/clip_v2.mp4' },
  });

  assert.equal(next.status, 'ready');
  assert.equal(next.videoUrl, 'https://example.com/clip_v1.mp4'); // Still v1
  assert.equal(next.hasNewVersionAvailable, true);
  assert.equal(next.newVersionUrl, 'https://example.com/clip_v2.mp4');

  // Apply new version
  const applied = clipReducer(next, { type: 'APPLY_NEW_VERSION' });
  assert.equal(applied.videoUrl, 'https://example.com/clip_v2.mp4');
  assert.equal(applied.hasNewVersionAvailable, false);
  assert.equal(applied.version, 2);
});

test('Clip State Machine: resets to not_requested upon RESET', () => {
  const state: ClipState = { status: 'failed', errorMessage: 'Timeout' };
  const next = clipReducer(state, { type: 'RESET' });

  assert.equal(next.status, 'not_requested');
  assert.equal(next.errorMessage, null);
  assert.equal(next.progress, 0);
});

test('Polling Backoff: computes exponential delay between 3s and 15s', () => {
  const attempt0 = getPollingBackoff(0);
  assert.equal(attempt0, 3000); // 3 seconds base

  const attempt1 = getPollingBackoff(1);
  assert.equal(attempt1, 4500); // 4.5 seconds

  const attempt2 = getPollingBackoff(2);
  assert.equal(attempt2, 6750); // 6.75 seconds

  const attempt10 = getPollingBackoff(10);
  assert.equal(attempt10, 15000); // Capped at 15s max
});

test('Failure Copy: maps failure reasons to clear user copy and actions', () => {
  const offline = getFailureDetails('device_offline');
  assert.equal(offline.title, 'Camera offline');
  assert.ok(offline.explanation.includes('Try again when it is back online'));
  assert.equal(offline.canRetry, true);

  const noFootage = getFailureDetails('no_footage_on_device');
  assert.equal(noFootage.title, 'Footage no longer on camera');
  assert.equal(noFootage.canRetry, false);

  const timeout = getFailureDetails('timeout');
  assert.equal(timeout.title, 'Camera response timeout');
  assert.equal(timeout.canRetry, true);
});

test('Duration Formatter: formats duration in M:SS', () => {
  assert.equal(formatClipDuration(38), '0:38');
  assert.equal(formatClipDuration(75), '1:15');
  assert.equal(formatClipDuration(0), '0:00');
  assert.equal(formatClipDuration(undefined), '0:00');
});
