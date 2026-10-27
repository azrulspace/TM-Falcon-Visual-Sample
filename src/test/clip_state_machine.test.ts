import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clipReducer,
  getPollingBackoff,
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

test('Clip State Machine: transitions to failed upon ENCOUNTER_ERROR', () => {
  const state: ClipState = { status: 'uploading', progress: 40 };
  const next = clipReducer(state, {
    type: 'ENCOUNTER_ERROR',
    payload: { errorMessage: 'Device radio timeout' },
  });

  assert.equal(next.status, 'failed');
  assert.equal(next.errorMessage, 'Device radio timeout');
});

test('Clip State Machine: transitions to expired upon CLIP_EXPIRED', () => {
  const state: ClipState = { status: 'ready', videoUrl: 'https://example.com/clip.mp4' };
  const next = clipReducer(state, { type: 'CLIP_EXPIRED' });

  assert.equal(next.status, 'expired');
  assert.equal(next.videoUrl, null);
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
