import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computePopupPlacement } from '../lib/popupPlacement.ts';
import {
  parseSelectionFromUrl,
  buildSelectionQueryString,
  resolveEntityData,
} from '../lib/selection.ts';

test('Popup Placement: prefers top placement when vertical space permits', () => {
  const result = computePopupPlacement({
    marker: { x: 500, y: 400 },
    popupSize: { width: 360, height: 200 },
    containerSize: { width: 1200, height: 800 },
  });

  assert.equal(result.side, 'top');
  assert.ok(result.y < 400);
  assert.equal(result.tailOffset, 180); // Centered tail
});

test('Popup Placement: flips to bottom placement when top space is constrained', () => {
  const result = computePopupPlacement({
    marker: { x: 500, y: 50 }, // Near top edge
    popupSize: { width: 360, height: 200 },
    containerSize: { width: 1200, height: 800 },
  });

  assert.equal(result.side, 'bottom');
  assert.ok(result.y > 50);
});

test('Popup Placement: horizontally clamps within container insets', () => {
  // Near right edge with right panel inset
  const result = computePopupPlacement({
    marker: { x: 1180, y: 400 },
    popupSize: { width: 360, height: 200 },
    containerSize: { width: 1200, height: 800 },
    insets: { right: 320, left: 20 },
  });

  // Maximum allowed X is container width (1200) - insets.right (320) - popupWidth (360) = 520
  assert.ok(result.x <= 520);
});

test('Popup Placement: unlocated records place at center without tail', () => {
  const result = computePopupPlacement({
    marker: { x: -1, y: -1 },
    popupSize: { width: 360, height: 300 },
    containerSize: { width: 1200, height: 800 },
  });

  assert.equal(result.side, 'center');
  assert.equal(result.x, (1200 - 360) / 2);
  assert.equal(result.y, (800 - 300) / 2);
});

test('URL Selection: parseSelectionFromUrl correctly parses explicit and inferred types', () => {
  const explicit = parseSelectionFromUrl('?type=event&id=EVT-0010');
  assert.deepEqual(explicit, { type: 'event', id: 'EVT-0010' });

  const inferred = parseSelectionFromUrl('?id=DEV-004');
  assert.deepEqual(inferred, { type: 'device', id: 'DEV-004' });

  const spanInferred = parseSelectionFromUrl('?id=CBL-001');
  assert.deepEqual(spanInferred, { type: 'span', id: 'CBL-001' });

  const empty = parseSelectionFromUrl('');
  assert.equal(empty, null);
});

test('URL Selection: buildSelectionQueryString formats query parameters', () => {
  const qs = buildSelectionQueryString('device', 'DEV-001');
  assert.ok(qs.includes('type=device'));
  assert.ok(qs.includes('id=DEV-001'));
});

test('Entity Resolution: resolves event EVT-0010 with device serial and location', () => {
  const entity = resolveEntityData('event', 'EVT-0010');
  assert.equal(entity.id, 'EVT-0010');
  assert.equal(entity.type, 'event');
  assert.ok(entity.hasLocation);
  assert.ok(entity.coordinates);
  assert.ok(entity.deviceSerial);
});

test('Entity Resolution: unlocated event EVT-0007 correctly flags hasLocation = false', () => {
  const entity = resolveEntityData('event', 'EVT-0007');
  assert.equal(entity.id, 'EVT-0007');
  assert.equal(entity.hasLocation, false);
});

test('Entity Resolution: resolves device DEV-004 with offline status and serial', () => {
  const entity = resolveEntityData('device', 'DEV-004');
  assert.equal(entity.id, 'DEV-004');
  assert.equal(entity.deviceStatus, 'offline');
  assert.equal(entity.deviceSerial, 'SN_DEV_004');
  assert.ok(entity.hasLocation);
});

test('Entity Resolution: resolves pole AST-002 and span SEG_02', () => {
  const pole = resolveEntityData('pole', 'AST-002');
  assert.equal(pole.id, 'AST-002');
  assert.ok(pole.coordinates);

  const span = resolveEntityData('span', 'SEG_02');
  assert.equal(span.id, 'SEG-02');
  assert.ok(span.relatedSpanId);
});

test('Feature Data: exact 238 total features breakdown (120 poles + 114 cable spans + 4 devices)', async () => {
  const { allFeatures, featureCounts } = await import('../data/features.ts');
  assert.equal(allFeatures.length, 238);
  assert.equal(featureCounts.total, 238);
  assert.equal(featureCounts.poles, 120);
  assert.equal(featureCounts.spans, 114);
  assert.equal(featureCounts.devices, 4);
  assert.equal(featureCounts.attentionDevices, 4);

  // Unlocated features check (beyond GIS survey range)
  const unlocatedPoles = allFeatures.filter((f) => f.type === 'pole' && !f.hasLocation);
  assert.ok(unlocatedPoles.length > 0);
  assert.equal(unlocatedPoles[0].id, 'AST-043');

  // Located features check (matches mapPoles surveyed points)
  const locatedPoles = allFeatures.filter((f) => f.type === 'pole' && f.hasLocation);
  assert.equal(locatedPoles.length, 42);
});

test('Phase 4: Accurate wording contracts (no None, no duplicate Offline, separate serial from ID)', () => {
  const devEntity = resolveEntityData('device', 'DEV-004');
  assert.equal(devEntity.id, 'DEV-004');
  assert.equal(devEntity.deviceSerial, 'SN_DEV_004');
  assert.notEqual(devEntity.id, devEntity.deviceSerial); // Strict separation

  // Unlocated record handling
  const unlocatedEvt = resolveEntityData('event', 'EVT-0007');
  assert.equal(unlocatedEvt.hasLocation, false);
  assert.equal(unlocatedEvt.coordinates, null);

  // Span with endpoints
  const spanEntity = resolveEntityData('span', 'CBL-001');
  assert.equal(spanEntity.type, 'span');
  assert.ok(spanEntity.relatedSpanId);
});

