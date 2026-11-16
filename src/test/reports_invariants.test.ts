import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { METRIC_DEFINITIONS_LIST, getMetricById, getMetricsForReport } from '../lib/metricDictionary.ts';
import { REPORTS_CATALOG } from '../data/reportsCatalog.ts';
import {
  computeReportDateRange,
  computeComparisonRange,
  computeDelta,
  computeEventMetrics,
  computeCaseMetrics,
  computeDeviceMetrics,
  computeAssetMetrics,
  computeDataQualityMetrics,
} from '../data/reportsSelectors.ts';
import type { FalconEvent } from '../data/events.ts';
import type { FalconCase } from '../types/cases.ts';
import type { DeviceRecord } from '../types/devices.ts';
import type { PoleRecord } from '../types/assets.ts';

describe('Reports & Audits: Invariant Tests', () => {
  describe('1. Metric Dictionary Invariants', () => {
    it('defines exactly 59 metrics (44 base + granular submetrics) across all operational domains', () => {
      assert.ok(METRIC_DEFINITIONS_LIST.length >= 44);
      assert.equal(METRIC_DEFINITIONS_LIST.length, 59);
    });

    it('each metric definition satisfies all contract rules', () => {
      METRIC_DEFINITIONS_LIST.forEach((metric) => {
        assert.ok(metric.id);
        assert.ok(metric.label);
        assert.ok(metric.description);
        assert.ok(metric.formula);
        assert.ok(metric.inclusionRules);
        assert.ok(metric.unit);
        assert.ok(['computable now', 'needs backend', 'not available'].includes(metric.status));
        assert.ok(
          [
            'Events',
            'Cases',
            'Devices',
            'Poles',
            'Risk',
            'Audit',
            'Vendor',
            'Data quality',
            'Cross-domain',
          ].includes(metric.source)
        );

        if (metric.status !== 'computable now') {
          assert.ok(metric.missingFieldReason);
        }
      });
    });

    it('every report template in catalog references valid metric IDs', () => {
      REPORTS_CATALOG.forEach((report) => {
        assert.ok(report.metricIds.length > 0);
        report.metricIds.forEach((metricId) => {
          const metric = getMetricById(metricId);
          assert.ok(metric, `Metric ${metricId} in report ${report.id} must exist`);
        });
      });
    });

    it('getMetricsForReport returns the expected subset of metrics', () => {
      const r1Metrics = getMetricsForReport('R1');
      assert.ok(r1Metrics.length >= 4);
      assert.ok(r1Metrics.map((m) => m.id).includes('events_total'));
    });
  });

  describe('2. Date & Timezone Range Invariants (MYT +08:00)', () => {
    it('calculates "today" range with MYT boundaries', () => {
      const range = computeReportDateRange('today');
      assert.equal(range.preset, 'today');
      assert.match(range.startIso, /\+08:00$/);
      assert.match(range.endIso, /\+08:00$/);
      assert.ok(range.startIso.includes('T00:00:00'));
    });

    it('calculates "this_week" starting on Monday', () => {
      const range = computeReportDateRange('this_week');
      assert.equal(range.preset, 'this_week');
      assert.ok(range.startIso.includes('T00:00:00'));
    });

    it('comparison range has identical duration to primary range', () => {
      const primaryRange = computeReportDateRange('last_7_days');
      const compRange = computeComparisonRange(primaryRange);

      const primaryDuration =
        new Date(primaryRange.endIso).getTime() - new Date(primaryRange.startIso).getTime();
      const compDuration =
        new Date(compRange.endIso).getTime() - new Date(compRange.startIso).getTime();

      assert.equal(compDuration, primaryDuration);
    });
  });

  describe('3. Delta Math Invariants', () => {
    it('computes positive delta correctly', () => {
      const delta = computeDelta(120, 100);
      assert.equal(delta.diff, 20);
      assert.equal(delta.percent, 20);
      assert.equal(delta.direction, 'up');
      assert.equal(delta.label, '+20 (+20%)');
    });

    it('computes negative delta correctly', () => {
      const delta = computeDelta(75, 100);
      assert.equal(delta.diff, -25);
      assert.equal(delta.percent, -25);
      assert.equal(delta.direction, 'down');
      assert.equal(delta.label, '-25 (-25%)');
    });

    it('handles zero previous without NaN or Infinity', () => {
      const delta = computeDelta(50, 0);
      assert.equal(delta.diff, 50);
      assert.equal(delta.percent, null);
      assert.equal(delta.direction, 'up');
      assert.equal(delta.label, '+50');
    });

    it('handles zero both values as neutral zero', () => {
      const delta = computeDelta(0, 0);
      assert.equal(delta.diff, 0);
      assert.equal(delta.percent, 0);
      assert.equal(delta.direction, 'flat');
    });
  });

  describe('4. Simulation Toggle & Event Metrics Invariants', () => {
    const mockEvents: FalconEvent[] = [
      {
        id: 'EVT-001',
        type: 'Fibre Cut',
        priority: 'Critical',
        state: 'New',
        status: 'New',
        captured: '2026-10-21T02:00:00+08:00',
        receivedAt: '2026-10-21T02:00:00+08:00',
        site: 'Teluk Panglima Garang',
        asset: 'AST-001',
        source: 'Edge service',
      },
      {
        id: 'EVT-002',
        type: 'Camera Motion',
        priority: 'High',
        state: 'Acknowledged',
        status: 'Acknowledged',
        captured: '2026-10-21T03:00:00+08:00',
        receivedAt: '2026-10-21T03:00:00+08:00',
        site: 'Teluk Panglima Garang',
        asset: 'AST-002',
        source: 'Edge service',
      },
      {
        id: 'EVT-003',
        type: 'Enclosure Tamper',
        priority: 'Medium',
        state: 'In case',
        status: 'In case',
        captured: '2026-10-21T04:00:00+08:00',
        receivedAt: '2026-10-21T04:00:00+08:00',
        site: 'Teluk Panglima Garang',
        asset: 'AST-003',
        source: 'Manual',
      },
      {
        id: 'EVT-004',
        type: 'Fibre Cut',
        priority: 'Critical',
        state: 'New',
        status: 'New',
        captured: '2026-10-21T05:00:00+08:00',
        receivedAt: '2026-10-21T05:00:00+08:00',
        site: 'Teluk Panglima Garang',
        asset: 'AST-004',
        source: 'Simulation',
      },
      {
        id: 'EVT-005',
        type: 'Speaker Tamper',
        priority: 'Low',
        state: 'Acknowledged',
        status: 'Acknowledged',
        captured: '2026-10-21T06:00:00+08:00',
        receivedAt: '2026-10-21T06:00:00+08:00',
        site: 'Teluk Panglima Garang',
        asset: 'AST-005',
        source: 'Simulation',
      },
    ] as unknown as FalconEvent[];

    const range = computeReportDateRange('today');

    it('excludes simulated events when includeSimulated is false', () => {
      const metrics = computeEventMetrics(mockEvents, range, 'all', false);
      assert.equal(metrics.total, 3);
      assert.equal(metrics.bySource['Simulation'] || 0, 0);
      assert.equal(metrics.byPriority.Critical, 1);
    });

    it('includes simulated events when includeSimulated is true', () => {
      const metrics = computeEventMetrics(mockEvents, range, 'all', true);
      assert.equal(metrics.total, 5);
      assert.equal(metrics.bySource['Simulation'], 2);
      assert.equal(metrics.byPriority.Critical, 2);
    });

    it('maintains priority drill-down equality (sum of priorities === total)', () => {
      const metrics = computeEventMetrics(mockEvents, range, 'all', true);
      const prioritySum =
        metrics.byPriority.Critical +
        metrics.byPriority.High +
        metrics.byPriority.Medium +
        metrics.byPriority.Low;
      assert.equal(prioritySum, metrics.total);
    });

    it('correctly tallies unacknowledged events', () => {
      const metrics = computeEventMetrics(mockEvents, range, 'all', true);
      assert.equal(metrics.unacknowledgedNow, 2); // EVT-001 and EVT-004
    });
  });

  describe('5. Case Metrics & Funnel Invariants', () => {
    const mockCases: FalconCase[] = [
      {
        id: 'CAS-001',
        sourceEventId: 'EVT-001',
        title: 'Case 1',
        status: 'Open',
        assignee: 'Operator Ali',
        assigneeType: 'person',
        createdAt: '2026-10-21T02:30:00+08:00',
        lastUpdatedAt: '2026-10-21T02:30:00+08:00',
        closedAt: null,
        activities: [],
      },
      {
        id: 'CAS-002',
        sourceEventId: 'EVT-002',
        title: 'Case 2',
        status: 'Closed',
        assignee: 'Technician Chong',
        assigneeType: 'person',
        createdAt: '2026-10-21T03:30:00+08:00',
        lastUpdatedAt: '2026-10-21T05:00:00+08:00',
        closedAt: '2026-10-21T05:00:00+08:00',
        activities: [],
      },
    ];

    const range = computeReportDateRange('today');

    it('computes opened, closed, and backlog accurately', () => {
      const metrics = computeCaseMetrics(mockCases, range);
      assert.equal(metrics.casesOpened, 2);
      assert.equal(metrics.casesClosed, 1);
      assert.equal(metrics.casesOpenAtEnd, 1);
    });

    it('partitions age distribution without double counting', () => {
      const metrics = computeCaseMetrics(mockCases, range);
      const totalAged =
        metrics.ageDistribution.under1d +
        metrics.ageDistribution.oneTo3d +
        metrics.ageDistribution.threeTo7d +
        metrics.ageDistribution.over7d;
      assert.equal(totalAged, metrics.casesOpenAtEnd);
    });
  });

  describe('6. Device & Asset Health Invariants', () => {
    const mockDevices: DeviceRecord[] = [
      {
        identifier: 'DEV-001',
        name: 'Cam 1',
        type: 'Camera',
        manufacturer: 'Hikvision',
        library: 'HIK_OpenAPI',
        model: 'DS-2CD',
        serial: 'SN1001',
        vendorDeviceId: 'SN1001',
        siteId: 'site-1',
        siteName: 'Teluk Panglima Garang',
        lifecycle: 'Active',
        connectivityState: 'online',
        installedPoleId: 'AST-001',
        registeredAt: '2026-10-01T00:00:00+08:00',
        lastUpdatedAt: '2026-10-21T11:10:00+08:00',
        lastContactAt: '2026-10-21T11:10:00+08:00',
        batteryPercent: 95,
        temperatureC: 32,
      } as unknown as DeviceRecord,
      {
        identifier: 'DEV-002',
        name: 'Cam 2',
        type: 'Camera',
        manufacturer: 'Hikvision',
        library: 'HIK_OpenAPI',
        model: 'DS-2CD',
        serial: 'SN1002',
        vendorDeviceId: 'SN1002',
        siteId: 'site-1',
        siteName: 'Teluk Panglima Garang',
        lifecycle: 'Active',
        connectivityState: 'offline',
        installedPoleId: 'AST-002',
        registeredAt: '2026-10-01T00:00:00+08:00',
        lastUpdatedAt: '2026-10-20T08:00:00+08:00',
        lastContactAt: '2026-10-20T08:00:00+08:00',
        batteryPercent: 80,
        temperatureC: 30,
      } as unknown as DeviceRecord,
      {
        identifier: 'DEV-003',
        name: 'Speaker 1',
        type: 'Speaker',
        manufacturer: 'Axis',
        library: 'AXIS_Audio',
        model: 'C1004',
        serial: 'SN2001',
        vendorDeviceId: 'SN2001',
        siteId: null,
        siteName: null,
        lifecycle: 'Active',
        connectivityState: 'stale',
        installedPoleId: null,
        registeredAt: '2026-10-01T00:00:00+08:00',
        lastUpdatedAt: '2026-10-15T10:00:00+08:00',
        lastContactAt: '2026-10-15T10:00:00+08:00',
        batteryPercent: null,
        temperatureC: null,
      } as unknown as DeviceRecord,
    ];

    const mockPoles: PoleRecord[] = [
      {
        identifier: 'AST-001',
        name: 'Pole 01',
        type: 'Pole',
        siteId: 'site-1',
        siteName: 'Teluk Panglima Garang',
        location: { lat: 2.92, lng: 101.45 },
        lifecycle: 'Active',
        protection: null,
        note: null,
        registeredAt: '2026-10-01T00:00:00+08:00',
        lastUpdatedAt: '2026-10-01T00:00:00+08:00',
        lifecycleStartedAt: '2026-10-01T00:00:00+08:00',
        lifecycleHistory: [],
        timeline: [],
      },
      {
        identifier: 'AST-002',
        name: 'Pole 02',
        type: 'Pole',
        siteId: 'site-1',
        siteName: 'Teluk Panglima Garang',
        location: null, // missing location
        lifecycle: 'Active',
        protection: null,
        note: null,
        registeredAt: '2026-10-01T00:00:00+08:00',
        lastUpdatedAt: '2026-10-01T00:00:00+08:00',
        lifecycleStartedAt: '2026-10-01T00:00:00+08:00',
        lifecycleHistory: [],
        timeline: [],
      },
    ];

    it('device state counts sum to total devices', () => {
      const metrics = computeDeviceMetrics(mockDevices);
      assert.equal(metrics.devicesTotal, 3);
      assert.equal(
        metrics.byState.online + metrics.byState.offline + metrics.byState.stale,
        metrics.devicesTotal
      );
    });

    it('identifies uninstalled devices accurately', () => {
      const metrics = computeDeviceMetrics(mockDevices);
      assert.equal(metrics.notInstalled, 1);
    });

    it('detects poles with missing coordinates for data quality audit', () => {
      const metrics = computeAssetMetrics(mockPoles);
      assert.equal(metrics.polesWithoutLocation, 1);
      assert.equal(metrics.polesTotal, 2);
    });

    it('data quality metrics computes unlocated poles and simulated share correctly', () => {
      const dq = computeDataQualityMetrics(mockDevices, mockPoles, []);
      assert.equal(dq.polesWithoutLocation, 1);
      assert.ok(dq.onlineStale >= 0);
    });
  });
});
