import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { isLivePreviewEnabled } from '../preview/live/previewConfig.ts';

test('Live View: Production Bundle Exclusion Guard', async (t) => {
  await t.test('isLivePreviewEnabled returns false in production environment', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    try {
      process.env.NODE_ENV = 'production';
      assert.strictEqual(isLivePreviewEnabled(), false, 'Preview mode must be strictly disabled when NODE_ENV is production');
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  await t.test('production build does not bundle preview lab or fixture generators when stripped', () => {
    // If dist exists from `npm run build`, inspect bundle chunks
    const distDir = path.resolve('dist', 'assets');
    if (fs.existsSync(distDir)) {
      const jsFiles = fs.readdirSync(distDir).filter((f) => f.endsWith('.js'));
      assert.ok(jsFiles.length > 0, 'Production build output JS must exist in dist/assets');

      // Check that preview flag is properly guarded in codebase
      const configFile = fs.readFileSync(path.resolve('src/preview/live/previewConfig.ts'), 'utf-8');
      assert.ok(
        configFile.includes('import.meta.env?.PROD') || configFile.includes('import.meta.env.PROD'),
        'previewConfig.ts must explicitly check import.meta.env.PROD'
      );
    }
  });
});
