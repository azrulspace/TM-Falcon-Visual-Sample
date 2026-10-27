import { test } from 'node:test';
import assert from 'node:assert';
import {
  formatStagingLiveClock,
  formatTimelineWindowStart,
  formatCaseOpenedDate,
} from '../lib/dateTime.ts';
import { initialCases } from '../data/cases.ts';

test('Staging Live Clock: formats in Asia/Kuala_Lumpur with seconds and lowercase am/pm and MYT', () => {
  const fixedDate = new Date('2026-10-27T14:49:50+08:00');
  const clockStr = formatStagingLiveClock(fixedDate);
  assert.ok(clockStr.includes('Tue, 27 Oct 2026'), `Expected date in clock: ${clockStr}`);
  assert.ok(clockStr.includes('2:49:50 pm'), `Expected 12-hour time with seconds in clock: ${clockStr}`);
  assert.ok(clockStr.endsWith('MYT'), `Expected MYT suffix: ${clockStr}`);
});

test('Timeline Window Start: formats in staging format', () => {
  const windowDate = new Date('2026-10-27T13:49:00+08:00');
  const startStr = formatTimelineWindowStart(windowDate);
  assert.strictEqual(startStr, '27 Oct, 1:49 pm');
});

test('Case Opened Date: formats with weekday, day, month, year, time', () => {
  const caseDate = new Date('2026-10-21T10:11:00+08:00');
  const openedStr = formatCaseOpenedDate(caseDate);
  assert.strictEqual(openedStr, 'Wed, 21 Oct 2026, 10:11 am');
});

test('Active cases timeline logic: 6 active cases partitioned into timeline dots and older chip', () => {
  const activeCases = initialCases.filter((c) => c.status !== 'Closed');
  assert.strictEqual(activeCases.length, 6);

  const ONE_HOUR_MS = 3600000;
  const nowMs = new Date('2026-10-21T11:15:00+08:00').getTime();
  const twelveHoursAgo = nowMs - 12 * ONE_HOUR_MS;

  const recentCases = activeCases.filter((c) => {
    const t = new Date(c.createdAt).getTime();
    return t >= twelveHoursAgo;
  });

  // CAS-0007 opened at 10:11 (within 12 hours)
  assert.strictEqual(recentCases.length, 1);
  assert.strictEqual(recentCases[0].id, 'CAS-0007');

  const olderCases = activeCases.filter((c) => {
    const t = new Date(c.createdAt).getTime();
    return t < twelveHoursAgo;
  });

  // Remaining active cases are older than 12h
  assert.strictEqual(olderCases.length, 5);
});
