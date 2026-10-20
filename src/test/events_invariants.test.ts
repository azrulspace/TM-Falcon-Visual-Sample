import test from 'node:test';
import assert from 'node:assert/strict';
import { events } from '../data/events.ts';
import { formatId } from '../lib/utils.ts';

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
  const dismissedCount = monkeyGroup.filter((e) => e.state === 'Dismissed').length;

  assert.ok(newCount > 0, 'Cluster must contain unacknowledged New events');
  assert.ok(ackCount > 0, 'Cluster must contain Acknowledged events');
  assert.ok(inCaseCount > 0, 'Cluster must contain In case events');
  assert.equal(newCount + ackCount + inCaseCount + dismissedCount, 117, 'Status partition must sum to 117');
});

test('Event severity invariants: No event priority is ever green or undefined', () => {
  const validPriorities = new Set(['Critical', 'High', 'Medium', 'Low']);
  for (const evt of events) {
    assert.ok(validPriorities.has(evt.priority), `Event ${evt.id} has invalid priority ${evt.priority}`);
  }
});

test('Event state invariants: All events have standard lifecycle state', () => {
  const validStates = new Set(['New', 'Acknowledged', 'In case', 'Dismissed', 'Resolved']);
  for (const evt of events) {
    assert.ok(validStates.has(evt.state), `Event ${evt.id} has invalid state ${evt.state}`);
  }
});

test('Snapshot integrity: every event has procedural SVG frames', () => {
  for (const evt of events) {
    assert.ok(Array.isArray(evt.snapshots) && evt.snapshots.length >= 1, `Event ${evt.id} must have snapshot frames`);
    assert.ok(evt.snapshots[0].startsWith('data:image/svg+xml'), `Event ${evt.id} snapshot must be valid SVG data URI`);
  }
});
