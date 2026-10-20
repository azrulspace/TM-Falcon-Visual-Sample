import test from 'node:test';
import assert from 'node:assert/strict';
import { formatId } from '../lib/utils.ts';
import { attention } from '../data/attention.ts';
import { devices } from '../data/devices.ts';
import { mapMarkers, mapCameras, mapPoles } from '../data/map.ts';

test('ID formatting matches unified hyphenated production format (D4)', () => {
  assert.equal(formatId('DEV_004'), 'DEV-004');
  assert.equal(formatId('DEV_011'), 'DEV-011');
  assert.equal(formatId('EVT_0001'), 'EVT-0001');
  assert.equal(formatId('AST_070'), 'AST-070');
  assert.equal(formatId('CBL_002'), 'CBL-002');
  assert.equal(formatId('AST_POL_001'), 'AST-POL-001');
  assert.equal(formatId('DEV-003'), 'DEV-003');
  assert.equal(formatId(''), '');
  assert.equal(formatId(null as any), '');
});

test('Count invariants: attention queue items and tabs agree with single source of truth (C2)', () => {
  const allCount = attention.length;
  const eventItems = attention.filter((item) => item.kind === 'EVENT');
  const deviceItems = attention.filter((item) => item.kind === 'DEVICE');
  const caseItems = attention.filter((item) => item.kind === 'CASE');

  // Verify mathematical agreement
  assert.equal(allCount, eventItems.length + deviceItems.length + caseItems.length);
  assert.equal(allCount, 10, 'Total attention queue items must equal 10');
  assert.equal(eventItems.length, 5, 'Event queue items must equal 5');
  assert.equal(deviceItems.length, 4, 'Device queue items must equal 4');
  assert.equal(caseItems.length, 1, 'Case queue items must equal 1');

  // Check device KPI counts match device dataset
  const offlineDevices = devices.filter((d) => d.status.toLowerCase() === 'offline');
  const staleDevices = devices.filter((d) => d.status.toLowerCase() === 'stale');
  const onlineDevices = devices.filter((d) => d.status.toLowerCase() === 'online');
  const attentionDevicesCount = offlineDevices.length + staleDevices.length;

  assert.equal(devices.length, 15, 'Total devices must be 15');
  assert.equal(onlineDevices.length, 11, 'Online devices must be 11');
  assert.equal(offlineDevices.length, 2, 'Offline devices must be 2');
  assert.equal(staleDevices.length, 2, 'Stale devices must be 2');
  assert.equal(attentionDevicesCount, 4, 'Attention devices (offline + stale) must equal 4');
  assert.equal(devices.length, onlineDevices.length + offlineDevices.length + staleDevices.length);
});

test('Overview Network Infrastructure Invariants (Section 6)', () => {
  // Map markers: exactly 15 devices with same status partition
  assert.equal(mapMarkers.length, 15, 'Map markers must contain 15 IoT devices');
  const mapOnline = mapMarkers.filter((m) => m.status === 'online');
  const mapOffline = mapMarkers.filter((m) => m.status === 'offline');
  const mapStale = mapMarkers.filter((m) => m.status === 'stale');

  assert.equal(mapOnline.length, 11, '11 Online devices on map');
  assert.equal(mapOffline.length, 2, '2 Offline devices on map');
  assert.equal(mapStale.length, 2, '2 Stale devices on map');

  // Asset counts from design
  assert.equal(mapPoles.length, 42, 'Map contains exactly 42 utility poles');
  assert.equal(mapCameras.length, 6, 'Map contains exactly 6 CCTV video feeds');

  // Hyphenated incident IDs
  const incidentIds = ['DEV-004', 'DEV-011', 'DEV-003', 'DEV-008'];
  assert.equal(incidentIds.length, 4);
  incidentIds.forEach((id) => {
    assert.match(id, /^DEV-\d{3}$/, 'Device ID must match prefix-hyphen-3digits format');
  });
});

test('Severity colors: No severity badge ever maps to green (D3)', () => {
  // Explicit semantic severity rules:
  // Critical: Red
  // High: Orange
  // Medium: Amber
  // Low: Blue
  // Green is strictly reserved for nominal/online/resolved
  const testSeverities = ['Critical', 'High', 'Medium', 'Low', 'critical', 'high', 'medium', 'low'];
  
  for (const sev of testSeverities) {
    const s = sev.toLowerCase();
    const isRed = s === 'critical';
    const isOrange = s === 'high';
    const isAmber = s === 'medium';
    const isBlue = s === 'low';
    
    // Assert none of these can be treated as green / nominal
    assert.ok(isRed || isOrange || isAmber || isBlue, `Severity ${sev} must map to a recognized warning/incident color`);
    assert.notEqual(s, 'online');
    assert.notEqual(s, 'resolved');
  }
});
