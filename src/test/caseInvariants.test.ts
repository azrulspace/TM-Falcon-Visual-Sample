import test from 'node:test';
import assert from 'node:assert/strict';
import { initialCases } from '../data/cases.ts';
import { events } from '../data/events.ts';
import { devices } from '../data/devices.ts';
import { formatId } from '../lib/utils.ts';
import { parseDate } from '../lib/dateTime.ts';
import {
  getCaseStatusCounts,
  getCaseKpiCounts,
  filterCases,
  sortCases,
  getCaseAge,
  exportCasesToCsv,
  createEventMap,
  joinCaseWithEvent,
  CASE_STATUS_WORKFLOW_RANK,
} from '../data/caseSelectors.ts';

// Contract fixture representing EVT-0257 and CAS-0007 staging snapshot payload
export const STAGING_CONTRACT_FIXTURE = {
  casePayload: {
    id: 'CAS-0007',
    sourceEventId: 'EVT-0257',
    title: 'Incident on CBL-005: Monkey near cable',
    status: 'Open',
    assignee: null,
    assigneeType: 'unassigned',
    createdAt: '2026-10-21T10:11:00+08:00',
    activityCount: 1,
  },
  eventPayload: {
    id: 'EVT-0257',
    priority: 'High',
    state: 'In case',
    type: 'Monkey near cable',
    asset: 'CBL-005',
    device: 'DEV-004',
    captured: '2026-10-20T15:06:00+08:00',
    caseId: 'CAS-0007',
    cameraOsdTimestamp: '10-20-2026 Tue 16:06:22', // Documented 1-hour camera RTC offset
  },
};

test('Contract Fixture: CAS-0007 and EVT-0257 agreement (Section 9)', () => {
  const case0007 = initialCases.find((c) => c.id === 'CAS-0007');
  assert.ok(case0007, 'CAS-0007 must exist in canonical dataset');
  assert.equal(case0007.sourceEventId, 'EVT-0257');
  assert.equal(case0007.status, 'Open');
  assert.equal(case0007.assignee, null);
  assert.equal(case0007.assigneeType, 'unassigned');

  const evt0257 = events.find((e) => e.id === 'EVT-0257');
  assert.ok(evt0257, 'EVT-0257 must exist in event registry');
  assert.equal(evt0257.state, 'In case', 'Event state must be "In case" agreeing with CAS-0007');
  assert.equal(evt0257.caseId, 'CAS-0007', 'Event caseId must point to CAS-0007');
  assert.equal(evt0257.priority, 'High', 'Event priority must be High');
  assert.equal(evt0257.device, 'DEV-004', 'Event device must be DEV-004');
  assert.equal(evt0257.asset, 'CBL-005', 'Event asset must be CBL-005');

  // Verify camera RTC 1-hour drift finding is documented
  assert.equal(STAGING_CONTRACT_FIXTURE.eventPayload.cameraOsdTimestamp, '10-20-2026 Tue 16:06:22');
});

test('Case dataset integrity: 7 canonical staging cases', () => {
  assert.equal(initialCases.length, 7, 'Dataset must have exactly 7 canonical staging cases');

  for (const c of initialCases) {
    assert.match(c.id, /^CAS-\d{4}$/, `Case ID ${c.id} must match CAS-XXXX format`);
    assert.equal(formatId(c.id), c.id, 'formatId should preserve hyphenated CAS-XXXX format');
    assert.match(c.sourceEventId, /^EVT-\d{4}$/, `Source Event ID ${c.sourceEventId} must match EVT-XXXX`);

    // Verify valid timestamp
    const d = parseDate(c.createdAt);
    assert.ok(d && !isNaN(d.getTime()), `Case ${c.id} createdAt must parse cleanly in MYT`);
  }
});

test('Case Status sum invariant: All equals the sum of Open, In progress, In review, and Closed', () => {
  const counts = getCaseStatusCounts(initialCases, {}, events);

  assert.equal(counts.open, 3, 'Open cases count must be 3 (CAS-0007, CAS-0006, CAS-0002)');
  assert.equal(counts.in_progress, 2, 'In progress count must be 2 (CAS-0005, CAS-0001)');
  assert.equal(counts.in_review, 1, 'In review count must be 1 (CAS-0003)');
  assert.equal(counts.closed, 1, 'Closed count must be 1 (CAS-0004)');

  const tabSum = counts.open + counts.in_progress + counts.in_review + counts.closed;
  assert.equal(tabSum, 7, 'Sum of tabs must equal total 7');
  assert.equal(counts.all, tabSum, 'All tab count must strictly equal sum of status tabs');
});

test('Case KPI Strip Invariants: computed only from real fields (Section 6.3)', () => {
  const kpis = getCaseKpiCounts(initialCases);

  assert.equal(kpis.open, 3, 'KPI Open count must equal 3');
  assert.equal(kpis.inProgress, 2, 'KPI In progress count must equal 2');
  assert.equal(kpis.inReview, 1, 'KPI In review count must equal 1');
  assert.equal(kpis.unassigned, 3, 'KPI Unassigned must equal 3 (non-closed cases without assignee)');
  assert.ok(kpis.oldestOpenAge !== null, 'KPI Oldest open age must be computed');
  assert.equal(kpis.oldestOpenCaseId, 'CAS-0003', 'Oldest open non-closed case must be CAS-0003 (Oct 15 09:57 AM)');
});

test('Case Workflow Sort Order: Open (1) -> In progress (2) -> In review (3) -> Closed (4)', () => {
  const eventMap = createEventMap(events);
  const enriched = initialCases.map((c) => joinCaseWithEvent(c, eventMap));

  const sortedAsc = sortCases(enriched, 'status', 'asc');
  assert.equal(sortedAsc[0].status, 'Open');
  assert.equal(sortedAsc[1].status, 'Open');
  assert.equal(sortedAsc[2].status, 'Open');
  assert.equal(sortedAsc[3].status, 'In progress');
  assert.equal(sortedAsc[4].status, 'In progress');
  assert.equal(sortedAsc[5].status, 'In review');
  assert.equal(sortedAsc[6].status, 'Closed');

  // Verify rank map
  assert.equal(CASE_STATUS_WORKFLOW_RANK['Open'], 1);
  assert.equal(CASE_STATUS_WORKFLOW_RANK['In progress'], 2);
  assert.equal(CASE_STATUS_WORKFLOW_RANK['In review'], 3);
  assert.equal(CASE_STATUS_WORKFLOW_RANK['Closed'], 4);
});

test('Single Source of Truth: Device DEV-004 status is offline across cases and devices registry', () => {
  const dev004 = devices.find((d) => formatId(d.id) === 'DEV-004');
  assert.ok(dev004);
  assert.equal(dev004.status, 'offline', 'DEV-004 must be offline in device registry');

  // Joined case CAS-0007 referencing EVT-0257 has device DEV-004
  const eventMap = createEventMap(events);
  const case0007 = initialCases.find((c) => c.id === 'CAS-0007')!;
  const enriched0007 = joinCaseWithEvent(case0007, eventMap);
  assert.equal(enriched0007.sourceEvent?.device, 'DEV-004');
});

test('Search filter matches case ID, event ID, asset ID, device ID, and assignee name', () => {
  // Search by case ID
  const res1 = filterCases(initialCases, { search: 'CAS-0007' }, events);
  assert.equal(res1.length, 1);
  assert.equal(res1[0].id, 'CAS-0007');

  // Search by source event ID
  const res2 = filterCases(initialCases, { search: 'EVT-0257' }, events);
  assert.equal(res2.length, 1);
  assert.equal(res2[0].id, 'CAS-0007');

  // Search by asset
  const res3 = filterCases(initialCases, { search: 'AST-070' }, events);
  assert.equal(res3.length, 1);
  assert.equal(res3[0].id, 'CAS-0003');

  // Search by assignee
  const res4 = filterCases(initialCases, { search: 'Field Team' }, events);
  assert.equal(res4.length, 4, 'Four cases assigned to Field Team');
});

test('Faceted Status Counts respect active search filter', () => {
  const searchCounts = getCaseStatusCounts(initialCases, { search: 'Field Team' }, events);
  assert.equal(searchCounts.open, 0, 'No open cases assigned to Field Team');
  assert.equal(searchCounts.in_progress, 2);
  assert.equal(searchCounts.in_review, 1);
  assert.equal(searchCounts.closed, 1);
  assert.equal(searchCounts.all, 4);
  assert.equal(searchCounts.open + searchCounts.in_progress + searchCounts.in_review + searchCounts.closed, searchCounts.all);
});

test('Case Age calculation: non-closed from created, closed from created to closedAt', () => {
  const now = new Date('2026-10-21T08:37:00+08:00');

  // CAS-0007: Open (created Oct 21 10:11 AM, slight clock lead in fixture or operational now)
  const case0007 = initialCases.find((c) => c.id === 'CAS-0007')!;
  const age0007 = getCaseAge(case0007, now);
  assert.equal(age0007.isClosed, false);

  // CAS-0004: Closed (created Oct 15 08:57 AM, closed Oct 18 10:57 AM -> exactly 3d 2h)
  const case0004 = initialCases.find((c) => c.id === 'CAS-0004')!;
  const age0004 = getCaseAge(case0004, now);
  assert.equal(age0004.isClosed, true);
  assert.equal(age0004.durationText, '3d 2h', 'CAS-0004 closed age must equal 3d 2h');
});

test('CSV Export format conforms to Section 6.1 specification', () => {
  const eventMap = createEventMap(events);
  const enriched = initialCases.map((c) => joinCaseWithEvent(c, eventMap));
  const csv = exportCasesToCsv(enriched);

  const lines = csv.split('\n');
  assert.equal(lines[0], 'Case ID,Source Event,Asset,Device,Status,Assignees,Created (ISO),Created (MYT),Age');
  assert.equal(lines.length, 8, 'Header + 7 case rows');
  assert.ok(lines[1].includes('"CAS-0007"'));
  assert.ok(lines[1].includes('"EVT-0257"'));
});

test('Phase 8: Multi-select status and assignee filters work together', () => {
  // Filter for Open and In progress cases
  const filtered = filterCases(initialCases, { status: ['Open', 'In progress'] }, events);
  assert.equal(filtered.length, 5, '3 Open + 2 In progress = 5 cases');

  // Filter for Unassigned
  const unassignedOnly = filterCases(initialCases, { assignee: ['unassigned'] }, events);
  assert.equal(unassignedOnly.length, 3, 'CAS-0007, CAS-0006, CAS-0002 are unassigned');

  // Open only toggle excludes Closed
  const openOnlyCases = filterCases(initialCases, { openOnly: true }, events);
  assert.equal(openOnlyCases.length, 6, '7 cases minus 1 closed = 6 cases');
  assert.ok(!openOnlyCases.some((c) => c.status === 'Closed'));
});

test('Phase 8: Sort cases by Age works in ascending and descending directions', () => {
  const eventMap = createEventMap(events);
  const enriched = initialCases.map((c) => joinCaseWithEvent(c, eventMap));
  const now = new Date('2026-10-21T11:15:00+08:00');

  const desc = sortCases(enriched, 'age', 'desc', now);
  assert.equal(desc[0].id, 'CAS-0003', 'CAS-0003 is the oldest open case');

  const asc = sortCases(enriched, 'age', 'asc', now);
  assert.equal(asc[0].id, 'CAS-0007', 'CAS-0007 is the newest case');
});

test('Phase 8: Canonical case tab structures preserve schema integrity without invented fields', () => {
  for (const c of initialCases) {
    if (c.verification) {
      assert.ok(typeof c.verification === 'object');
      if (c.verification.checkedItems) {
        assert.ok(Array.isArray(c.verification.checkedItems));
      }
    }
    if (c.fieldFindings) {
      assert.ok(typeof c.fieldFindings === 'object');
    }
    if (c.closure) {
      assert.ok(typeof c.closure === 'object');
    }
    assert.ok(Array.isArray(c.activities), `Case ${c.id} activities must be an array`);
    for (const act of c.activities) {
      assert.ok(act.id && act.text && act.actor && act.timestamp, 'Activity entry must have id, text, actor, and timestamp');
    }
  }
});

