import test from 'node:test';
import assert from 'node:assert/strict';
import { scanLiveViewTokens } from '../../scripts/check-live-view-tokens.js';

test('Live View Token Guard: Automated Style & Forbidden Pattern Scan', async (t) => {
  const { violations, filesScanned } = scanLiveViewTokens();

  await t.test('scans all active live view pages and components', () => {
    assert.ok(filesScanned >= 10, `Expected at least 10 live view files to be scanned, got ${filesScanned}`);
  });

  await t.test('strictly enforces 0 token violations across all live view files', () => {
    if (violations.length > 0) {
      console.error('Violations found:\n', violations);
    }
    assert.strictEqual(
      violations.length,
      0,
      `Expected 0 token violations in Live View, but found ${violations.length}`
    );
  });
});
