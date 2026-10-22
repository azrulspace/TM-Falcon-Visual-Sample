import test from 'node:test';
import assert from 'node:assert/strict';
import { events } from '../data/events.ts';
import { devices } from '../data/devices.ts';
import { formatId } from '../lib/utils.ts';
import { getStatusCounts, getKpiCounts } from '../data/eventSelectors.ts';

test('Event dataset integrity: exactly 258 enterprise events', () => {
  assert.equal(events.length, 258, 'Total event dataset must contain exactly 258 events');

  // Verify all IDs match EVT-XXXX
  for (const evt of events) {
    assert.match(evt.id, /^EVT-\d{4}$/, `Event ID ${evt.id} must be properly formatted`);
    assert.equal(formatId(evt.id), evt.id, 'formatId should preserve clean hyphenated EVT-XXXX format');
  }
});

test('Recurring event cluster invariant: exactly 117 Monkey near cable events on DEV-004 and CBL-005', () => {
  const monkeyGroup = events.filter(
    (e) => e.type === 'Monkey near cable' && e.device === 'DEV-004' && e.asset === 'CBL-005'
  );

  assert.equal(monkeyGroup.length, 117, 'Cluster must contain exactly 117 recurring events');
  
  // Verify latest event is EVT-0258
  assert.equal(monkeyGroup[0].id, 'EVT-0258', 'Latest cluster event must be EVT-0258');

  // Verify status composition covers active triage states
  const newCount = monkeyGroup.filter((e) => e.state === 'New').length;
  const ackCount = monkeyGroup.filter((e) => e.state === 'Acknowledged').length;
  const inCaseCount = monkeyGroup.filter((e) => e.state === 'In case').length;
  const resolvedCount = monkeyGroup.filter((e) => e.state === 'Resolved').length;

  assert.ok(newCount > 0, 'Cluster must contain unacknowledged New events');
  assert.ok(ackCount > 0, 'Cluster must contain Acknowledged events');
  assert.ok(inCaseCount > 0, 'Cluster must contain In case events');
  assert.equal(newCount + ackCount + inCaseCount + resolvedCount, 117, 'Status partition must sum to 117');
});

test('Event state sum invariant: All equals the sum of New, Acknowledged, Case Created, and Resolved', () => {
  const counts = getStatusCounts(events, {});

  assert.equal(counts.new, 83, 'New status tab must have 83 events matching INBOX_FINAL');
  assert.equal(counts.acknowledged, 85, 'Acknowledged status tab must have 85 events matching INBOX_FINAL');
  assert.equal(counts.in_case, 40, 'Case created status tab must have 40 events');
  assert.equal(counts.resolved, 50, 'Resolved status tab must have 50 events');
  
  // Mathematical Invariant: All = Sum(Tabs)
  const tabSum = counts.new + counts.acknowledged + counts.in_case + counts.resolved;
  assert.equal(counts.all, 258, 'All status tab must equal 258');
  assert.equal(tabSum, counts.all, 'Sum of all status tabs must equal All count (258)');
});

test('KPI Strip Invariants matching INBOX_FINAL design numbers', () => {
  const kpis = getKpiCounts(events);

  assert.equal(kpis.newUnack, 83, 'KPI 1 (New unacknowledged) must equal 83');
  assert.equal(kpis.highAndCritical, 172, 'KPI 2 (High & Critical priority) must equal 172');
  assert.equal(kpis.withoutCase, 218, 'KPI 3 (Without case) must equal 218');
  assert.equal(kpis.todayEvents, 122, 'KPI 4 (Today Events) must equal 122');
});

test('Single Source of Truth: DEV-004 status is offline across registries', () => {
  const dev = devices.find((d) => d.id === 'DEV-004' || d.id === 'DEV_004');
  assert.ok(dev, 'DEV-004 must exist in devices registry');
  assert.equal(dev.status, 'offline', 'DEV-004 status in devices registry must be offline');

  const evt258 = events.find((e) => e.id === 'EVT-0258');
  assert.ok(evt258);
  assert.equal(evt258.device, 'DEV-004');
  assert.equal(evt258.priority, 'High', 'EVT-0258 product priority must be High, never derived from vendor data');
});

test('Snapshot integrity: every event has snapshot frames', () => {
  for (const evt of events) {
    assert.ok(Array.isArray(evt.snapshots) && evt.snapshots.length >= 1, `Event ${evt.id} must have snapshot frames`);
    if (evt.id === 'EVT-0258') {
      assert.equal(evt.snapshots[0], '/monkey-fiber.jpg', 'EVT-0258 must use real photo /monkey-fiber.jpg');
    } else {
      assert.ok(evt.snapshots[0].startsWith('data:image/svg+xml'), `Event ${evt.id} snapshot must be valid SVG data URI`);
    }
  }
});

test('Phase 2 Invariant: Faceted Status Tab Counts respect active search filter', () => {
  // Query for 'Monkey' should only facet the 117 Monkey events
  const counts = getStatusCounts(events, { search: 'Monkey' });
  assert.equal(counts.all, 117, 'Faceted search for Monkey must filter base to 117');
  assert.equal(counts.new + counts.acknowledged + counts.in_case + counts.resolved, 117);
});

test('Phase 2 Invariant: Search matches event ID, type, device ID, asset ID, and detection rule', () => {
  const byId = getStatusCounts(events, { search: 'EVT-0258' });
  assert.equal(byId.all, 1, 'Search by ID matches EVT-0258');

  const byDev = getStatusCounts(events, { search: 'DEV-004' });
  assert.equal(byDev.all, 117, 'Search by DEV-004 matches 117 cluster events');

  const byAsset = getStatusCounts(events, { search: 'CBL-005' });
  assert.ok(byAsset.all >= 117, 'Search by CBL-005 matches cable span');

  const byRule = getStatusCounts(events, { search: 'Motion Detection' });
  assert.ok(byRule.all >= 117, 'Search by rule matches motion detection');
});
