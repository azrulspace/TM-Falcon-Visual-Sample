import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Live View V2.2 Visual Fixes (T1 - T9)', () => {
  const sideColumnSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/live/LiveSideColumn.tsx'),
    'utf-8'
  );
  const playerSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/live/LivePlayer.tsx'),
    'utf-8'
  );
  const mapCanvasSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/MapCanvas.tsx'),
    'utf-8'
  );
  const cameraStripSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/live/CameraStrip.tsx'),
    'utf-8'
  );

  it('T1: LiveSideColumn does not use <Card> wrapper that introduces blue ring outline', () => {
    assert.doesNotMatch(
      sideColumnSource,
      /<Card\b/,
      'LiveSideColumn must not use Card component with ring-1 outline; standard div with border border-border must be used'
    );
  });

  it('T2: MapCanvas wraps internal viewport in <g id="map-viewport-transform"> rather than CSS transforming <svg>', () => {
    assert.match(
      mapCanvasSource,
      /<g\s+id="map-viewport-transform"/,
      'MapCanvas must wrap internal vector layers in <g id="map-viewport-transform"> to prevent exposing blank margins'
    );
    assert.doesNotMatch(
      mapCanvasSource,
      /<svg[^>]*style=\{\{\s*transform:\s*`scale\(/,
      'MapCanvas must not apply CSS transform directly to <svg> DOM element'
    );
  });

  it('T3: LiveSideColumn has no uppercase tracked headers and uses "Vendor and driver" without ampersand', () => {
    assert.doesNotMatch(
      sideColumnSource,
      /DEVICE SPECIFICATION/i,
      'Uppercase tracked header "DEVICE SPECIFICATION" must be removed'
    );
    assert.doesNotMatch(
      sideColumnSource,
      /INSTALLATION & LOCATION/i,
      'Uppercase tracked header "INSTALLATION & LOCATION" must be removed'
    );
    assert.match(
      sideColumnSource,
      /Vendor and driver/,
      'Label must be spelled out as "Vendor and driver"'
    );
  });

  it('T4: LiveSideColumn does not contain redundant Identifier row', () => {
    assert.doesNotMatch(
      sideColumnSource,
      /<span[^>]*>Identifier<\/span>/,
      'Redundant Identifier row (DEV-001) must be removed from Camera details table'
    );
  });

  it('T5: LiveSideColumn flattens Operational status card into single Connectivity row', () => {
    assert.doesNotMatch(
      sideColumnSource,
      /<div[^>]*rounded-lg bg-muted\/30[^>]*>/,
      'Nested Operational status card-in-a-card must be removed'
    );
    assert.match(
      sideColumnSource,
      /<span[^>]*>Connectivity<\/span>/,
      'Connectivity must be a clean row in the specification list'
    );
  });

  it('T7: CameraStrip uses semantic tokens for status dot and contains edge fade gradients', () => {
    assert.match(
      cameraStripSource,
      /bg-status-success/,
      'Online status dot must use semantic token bg-status-success'
    );
    assert.match(
      cameraStripSource,
      /bg-gradient-to-r from-background to-transparent/,
      'CameraStrip must contain left edge fade gradient'
    );
    assert.match(
      cameraStripSource,
      /bg-gradient-to-l from-background to-transparent/,
      'CameraStrip must contain right edge fade gradient'
    );
  });

  it('T8: Poster caption in LivePlayer displays event type as sans link without monospace chip', () => {
    assert.doesNotMatch(
      playerSource,
      /<span className="font-mono text-xs font-semibold text-foreground px-2 py-0\.5 rounded bg-muted\/60 border border-border">\s*\{lastEvent\.type\}\s*<\/span>/,
      'Poster caption must not use monospace chip for event type'
    );
    assert.match(
      playerSource,
      /<button[^>]*onClick=\{[^}]*navigate\(`\/events\/\$\{encodeURIComponent\(lastEvent\.id\)\}`\)[^>]*>[\s\S]*?\{lastEvent\.type\}[\s\S]*?<\/button>/,
      'Poster caption must render event type as interactive sans link to event'
    );
  });

  it('T9: Recent events list renders neutral gray icon tile for non-image events', () => {
    assert.match(
      sideColumnSource,
      /bg-muted\/60 border border-border text-muted-foreground/,
      'Events without snapshot must render neutral gray tile'
    );
  });
});
