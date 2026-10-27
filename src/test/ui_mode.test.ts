import { test } from 'node:test';
import assert from 'node:assert';
import { computeAutoUiMode } from '../lib/uiMode.ts';

test('UI Mode Auto Rule: Phone viewports (< 768px) resolve to desktop regardless of pointer', () => {
  assert.strictEqual(computeAutoUiMode(375, true), 'desktop');
  assert.strictEqual(computeAutoUiMode(414, true), 'desktop');
  assert.strictEqual(computeAutoUiMode(767, true), 'desktop');
  assert.strictEqual(computeAutoUiMode(767, false), 'desktop');
});

test('UI Mode Auto Rule: Viewports between 768px and 1024px resolve to tablet regardless of pointer', () => {
  // 768x1024 portrait tablet
  assert.strictEqual(computeAutoUiMode(768, false), 'tablet');
  assert.strictEqual(computeAutoUiMode(768, true), 'tablet');

  // 820x1180 portrait tablet
  assert.strictEqual(computeAutoUiMode(820, false), 'tablet');
  assert.strictEqual(computeAutoUiMode(820, true), 'tablet');

  // 834x1194 portrait tablet
  assert.strictEqual(computeAutoUiMode(834, false), 'tablet');
  assert.strictEqual(computeAutoUiMode(834, true), 'tablet');

  // 1024x768 landscape tablet
  assert.strictEqual(computeAutoUiMode(1024, false), 'tablet');
  assert.strictEqual(computeAutoUiMode(1024, true), 'tablet');
});

test('UI Mode Auto Rule: Viewports between 768px and 1366px resolve to tablet only when coarse pointer is present', () => {
  // 1133x744 tablet landscape
  assert.strictEqual(computeAutoUiMode(1133, true), 'tablet');
  assert.strictEqual(computeAutoUiMode(1133, false), 'desktop');

  // 1180x820 iPad Air landscape
  assert.strictEqual(computeAutoUiMode(1180, true), 'tablet');
  assert.strictEqual(computeAutoUiMode(1180, false), 'desktop');

  // 1366x1024 iPad Pro landscape
  assert.strictEqual(computeAutoUiMode(1366, true), 'tablet');
  assert.strictEqual(computeAutoUiMode(1366, false), 'desktop');
});

test('UI Mode Auto Rule: Viewports > 1366px resolve to desktop regardless of pointer', () => {
  assert.strictEqual(computeAutoUiMode(1367, true), 'desktop');
  assert.strictEqual(computeAutoUiMode(1440, true), 'desktop');
  assert.strictEqual(computeAutoUiMode(1440, false), 'desktop');
  assert.strictEqual(computeAutoUiMode(1920, false), 'desktop');
});
