import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDate,
  formatAbsoluteMYT,
  formatEventDate,
  formatRelativeTime,
  getRelativeTimeCalculation,
} from '../lib/dateTime.ts';
import {
  computeEventSla,
  SLA_POLICIES,
  formatDurationMinutes,
} from '../config/slaPolicy.ts';

test('Time Module: parseDate handles ISO with timezone offset', () => {
  const dateStr = '2026-10-20T16:28:00+08:00';
  const parsed = parseDate(dateStr);
  assert.ok(parsed !== null, 'Should parse ISO string with +08:00 offset');
  assert.equal(parsed.toISOString(), new Date('2026-10-20T08:28:00.000Z').toISOString());
});

test('Time Module: parseDate handles live staging format "Oct 20, 2026, 4:28 PM"', () => {
  const dateStr = 'Oct 20, 2026, 4:28 PM';
  const parsed = parseDate(dateStr);
  assert.ok(parsed !== null, 'Should parse live date format');
  assert.equal(parsed.toISOString(), new Date('2026-10-20T08:28:00.000Z').toISOString());
});

test('Time Module: parseDate returns null for missing or invalid input (never fabricates at render)', () => {
  assert.equal(parseDate(null), null);
  assert.equal(parseDate(undefined), null);
  assert.equal(parseDate(''), null);
  assert.equal(parseDate('Not supplied'), null);
  assert.equal(parseDate('invalid-string'), null);
});

test('Time Module: formatAbsoluteMYT formats in Asia/Kuala_Lumpur with MYT suffix', () => {
  const dateStr = '2026-10-20T16:28:00+08:00';
  const formatted = formatAbsoluteMYT(dateStr);
  assert.ok(formatted.includes('20 Oct 2026'), `Should include date: ${formatted}`);
  assert.ok(formatted.includes('16:28:00'), `Should include 24h time: ${formatted}`);
  assert.ok(formatted.endsWith('MYT'), `Should end with MYT: ${formatted}`);
});

test('Time Module: formatEventDate matches LIVE_STAGING exact display', () => {
  const dateStr = '2026-10-20T16:28:00+08:00';
  const formatted = formatEventDate(dateStr);
  assert.equal(formatted, 'Oct 20, 2026, 4:28 PM');
});

test('Time Module: relative time calculation for EVT-0258 captured Oct 20 4:28 PM at Oct 21 08:37 MYT', () => {
  const captured = '2026-10-20T16:28:00+08:00';
  const now = '2026-10-21T08:37:00+08:00';
  const rel = formatRelativeTime(captured, now);
  assert.equal(rel, '16h 9m ago', 'Should compute exactly 16h 9m elapsed between 16:28 Oct 20 and 08:37 Oct 21');
});

test('Time Module: clock mismatch flagged when timestamp is in future by > 60s', () => {
  const futureDate = '2026-10-21T09:00:00+08:00';
  const now = '2026-10-21T08:37:00+08:00';
  const calc = getRelativeTimeCalculation(futureDate, now);
  assert.equal(calc.isClockMismatch, true);
  assert.equal(calc.text, 'Clock mismatch');
  assert.equal(calc.diffMinutes, 0, 'Future duration should not be negative');
});

test('SLA Policy: Targets match priority tiers', () => {
  assert.equal(SLA_POLICIES.critical.targetMinutes, 15);
  assert.equal(SLA_POLICIES.high.targetMinutes, 30);
  assert.equal(SLA_POLICIES.medium.targetMinutes, 60);
  assert.equal(SLA_POLICIES.low.targetMinutes, 120);
});

test('SLA Policy: Duration formatting helper', () => {
  assert.equal(formatDurationMinutes(15), '15m');
  assert.equal(formatDurationMinutes(30), '30m');
  assert.equal(formatDurationMinutes(60), '1h');
  assert.equal(formatDurationMinutes(969), '16h 9m');
  assert.equal(formatDurationMinutes(939), '15h 39m');
});

test('SLA Policy: computeEventSla calculates overdue status for EVT-0258', () => {
  const captured = '2026-10-20T16:28:00+08:00';
  const now = '2026-10-21T08:37:00+08:00';
  const sla = computeEventSla({
    priority: 'High',
    state: 'New',
    capturedAt: captured,
    now,
  });

  assert.ok(sla !== null, 'SLA result should be computed');
  assert.equal(sla.status, 'overdue');
  assert.equal(sla.targetMinutes, 30);
  assert.equal(sla.elapsedMinutes, 969); // 16h 9m = 969m
  assert.equal(sla.overdueMinutes, 939); // 969 - 30 = 939m
  assert.equal(
    sla.text,
    'Unacknowledged for 16h 9m. Target 30m. Overdue by 15h 39m'
  );
});

test('SLA Policy: computeEventSla handles acknowledged event', () => {
  const captured = '2026-10-20T16:28:00+08:00';
  const acknowledged = '2026-10-20T16:40:00+08:00';
  const sla = computeEventSla({
    priority: 'High',
    state: 'Acknowledged',
    capturedAt: captured,
    acknowledgedAt: acknowledged,
  });

  assert.ok(sla !== null);
  assert.equal(sla.status, 'acknowledged');
  assert.equal(sla.elapsedMinutes, 12);
  assert.equal(sla.text, 'Acknowledged in 12m');
});
