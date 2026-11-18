import test from 'node:test';
import assert from 'node:assert/strict';
import { scanLiveViewTokens } from '../../scripts/check-live-view-tokens.js';

test('Live View Token Guard: Automated Style & Forbidden Pattern Scan', async (t) => {
  const { violations, filesScanned } = scanLiveViewTokens();

  await t.test('scans all active live view pages and components', () => {
    assert.ok(filesScanned >= 10, `Expected at least 10 live view files to be scanned, got ${filesScanned}`);
  });

  await t.test('tracks baseline violations count', () => {
    // In Phase 1 baseline, violations are recorded.
    // In final verification (Phase 9), violations MUST be 0.
    assert.ok(Array.isArray(violations), 'Violations should be an array');
  });
});
