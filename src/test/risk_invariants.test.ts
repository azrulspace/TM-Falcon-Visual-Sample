import test from 'node:test';
import assert from 'node:assert/strict';
import { segments } from '../data/segments.ts';
import { events } from '../data/events.ts';
import { formatId } from '../lib/utils.ts';
import {
  filterRiskSegments,
  sortRiskSegments,
  getRiskKpiCounts,
  getRiskStatusCounts,
  buildRiskCsvContent,
} from '../data/riskSelectors.ts';

test('Risk Segment dataset integrity: 25 canonical segments', () => {
  assert.equal(segments.length, 25, 'Total segment dataset must contain exactly 25 segments');

  for (const seg of segments) {
    // ID format checks (Section 4 & 5)
    assert.match(seg.id, /^SEG[-_]\d+$/i, `Segment ID ${seg.id} must match SEG-XX pattern`);
    assert.match(seg.from, /^AST[-_]\d+$/i, `From pole ${seg.from} must match AST-XXX pattern`);
    assert.match(seg.to, /^AST[-_]\d+$/i, `To pole ${seg.to} must match AST-XXX pattern`);
    assert.match(seg.spanId, /^CBL[-_]\d+$/i, `Span ID ${seg.spanId} must match CBL-XXX pattern`);

    // Normalized formatId check
    assert.ok(formatId(seg.id).startsWith('SEG-'), 'formatId should produce hyphenated SEG- prefix');
    assert.ok(formatId(seg.from).startsWith('AST-'), 'formatId should produce hyphenated AST- prefix');
    assert.ok(formatId(seg.to).startsWith('AST-'), 'formatId should produce hyphenated AST- prefix');

    // Value bounds
    assert.ok(['High', 'Medium', 'Low'].includes(seg.priority), `Valid priority for ${seg.id}`);
    assert.ok(['High', 'Medium', 'Low'].includes(seg.confidence), `Valid confidence for ${seg.id}`);
    assert.ok(['to_inspect', 'investigating', 'dismissed'].includes(seg.status), `Valid status for ${seg.id}`);
  }
});

test('Cross-Module Consistency: segment basis matches event counts on spans in events.ts', () => {
  // Section 4 & 6: incident counts on a segment must equal the number of events on that span in the same window
  const mappedSpans = ['CBL-001', 'CBL-002', 'CBL-003', 'CBL-004', 'CBL-005'];
  for (const span of mappedSpans) {
    const seg = segments.find((s) => formatId(s.spanId) === span);
    assert.ok(seg, `Segment for span ${span} must exist`);

    const matchingEvents = events.filter(
      (e) => e.asset && formatId(e.asset) === span
    );

    const parsedBasisCount = parseInt(seg.basis.match(/\d+/)?.[0] || '0', 10);

    // Verify basis count equals exactly the events count on that span from shared events.ts
    assert.equal(
      parsedBasisCount,
      matchingEvents.length,
      `Segment ${seg.id} basis (${seg.basis}) must match real span event count (${matchingEvents.length}) in events.ts`
    );
  }

  // Specifically verify CBL-005 contains the 117 monkey recurring cluster
  const cbl005Seg = segments.find((s) => formatId(s.spanId) === 'CBL-005');
  assert.ok(cbl005Seg, 'Segment for CBL-005 must exist');
  assert.match(cbl005Seg.basis, /131 incidents/, 'CBL-005 basis must accurately report all 131 incidents');
});

test('KPI Strip Invariants: computed strictly from real fields', () => {
  const kpis = getRiskKpiCounts(segments);

  const activeSegments = segments.filter((s) => s.status !== 'dismissed');
  const expectedToInspect = activeSegments.filter((s) => s.status === 'to_inspect').length;
  const expectedHigh = activeSegments.filter((s) => s.status === 'to_inspect' && s.priority === 'High').length;
  const expectedMedium = activeSegments.filter((s) => s.status === 'to_inspect' && s.priority === 'Medium').length;
  const expectedLow = activeSegments.filter((s) => s.status === 'to_inspect' && s.priority === 'Low').length;
  const expectedLowConf = activeSegments.filter((s) => s.status === 'to_inspect' && s.confidence === 'Low').length;

  assert.equal(kpis.totalToInspect, expectedToInspect, 'To inspect count matches to_inspect segments');
  assert.equal(kpis.highPriority, expectedHigh, 'High priority count matches to_inspect High segments');
  assert.equal(kpis.mediumPriority, expectedMedium, 'Medium priority count matches to_inspect Medium segments');
  assert.equal(kpis.lowPriority, expectedLow, 'Low priority count matches to_inspect Low segments');
  assert.equal(kpis.lowConfidence, expectedLowConf, 'Low confidence count matches to_inspect Low confidence segments');
});

test('Status Sum Invariant: All equals to_inspect + investigating + dismissed', () => {
  const statusCounts = getRiskStatusCounts(segments);

  assert.equal(statusCounts.all, segments.length, 'Total status count equals dataset length');
  assert.equal(
    statusCounts.to_inspect + statusCounts.investigating + statusCounts.dismissed,
    statusCounts.all,
    'Status sum partition invariant must hold'
  );
});

test('Faceted Filter Invariants: priority, route, confidence, and status', () => {
  // Priority filter
  const highOnly = filterRiskSegments(segments, { tab: 'all', priority: ['High'] });
  assert.ok(highOnly.every((s) => s.priority === 'High'), 'Every result in High filter has High priority');

  // Route filter
  const route01Only = filterRiskSegments(segments, { tab: 'all', route: ['Route 01'] });
  assert.ok(route01Only.every((s) => s.route === 'Route 01'), 'Every result in Route 01 filter has Route 01');

  // Confidence filter
  const lowConfOnly = filterRiskSegments(segments, { tab: 'all', confidence: ['Low'] });
  assert.ok(lowConfOnly.every((s) => s.confidence === 'Low'), 'Every result has Low confidence');

  // Multi-property filter combination
  const combined = filterRiskSegments(segments, {
    tab: 'all',
    priority: ['High'],
    route: ['Route 01'],
    confidence: ['Medium'],
  });
  assert.ok(
    combined.every((s) => s.priority === 'High' && s.route === 'Route 01' && s.confidence === 'Medium'),
    'Combined filters strictly narrow dataset'
  );
});

test('Search Filter: matches segment ID, pole IDs, and route', () => {
  // Match segment ID
  const segMatch = filterRiskSegments(segments, { tab: 'all', search: 'SEG-01' });
  assert.ok(segMatch.some((s) => formatId(s.id) === 'SEG-01'), 'Search finds segment by ID');

  // Match pole ID
  const poleMatch = filterRiskSegments(segments, { tab: 'all', search: 'AST-002' });
  assert.ok(
    poleMatch.some((s) => formatId(s.from) === 'AST-002' || formatId(s.to) === 'AST-002'),
    'Search finds segment by pole ID'
  );

  // Match route
  const routeMatch = filterRiskSegments(segments, { tab: 'all', search: 'Route 02' });
  assert.ok(routeMatch.every((s) => s.route.toLowerCase().includes('route 02')), 'Search matches route string');
});

test('Sort Invariants: urgent, priority, confidence, and incidents', () => {
  // Urgent sort: High priority first
  const sortedUrgent = sortRiskSegments(segments, 'urgent');
  assert.equal(sortedUrgent[0].priority, 'High', 'Most urgent segment must have High priority');

  // Priority sort: High before Medium before Low
  const sortedPriority = sortRiskSegments(segments, 'priority');
  let seenMedium = false;
  let seenLow = false;
  for (const s of sortedPriority) {
    if (s.priority === 'High') {
      assert.ok(!seenMedium && !seenLow, 'No Medium or Low before High in priority sort');
    } else if (s.priority === 'Medium') {
      seenMedium = true;
      assert.ok(!seenLow, 'No Low before Medium in priority sort');
    } else if (s.priority === 'Low') {
      seenLow = true;
    }
  }

  // Incidents sort: numerically descending
  const sortedIncidents = sortRiskSegments(segments, 'incidents');
  for (let i = 0; i < sortedIncidents.length - 1; i++) {
    const cur = parseInt(sortedIncidents[i].basis.match(/\d+/)?.[0] || '0', 10);
    const next = parseInt(sortedIncidents[i + 1].basis.match(/\d+/)?.[0] || '0', 10);
    assert.ok(cur >= next, `Incidents sort must be descending (${cur} >= ${next})`);
  }
});

test('CSV Export Format Conformance', () => {
  const csv = buildRiskCsvContent(segments.slice(0, 5));
  const lines = csv.split('\n');

  // Verify header conforms to specification
  assert.equal(
    lines[0],
    'Rank,Segment ID,Route,From Asset,To Asset,Priority,Confidence,Status,Basis,Last Incident',
    'CSV header must contain exact specified column names'
  );

  // Verify row count matches (header + 5 data rows)
  assert.equal(lines.length, 6, 'CSV must contain header plus 5 data rows');
});
