import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateDeviceFreshness,
  computeAvailabilityMetrics,
  getDeviceKpiCounts,
  getDeviceStatusTabCounts,
  parseDevicesUrlState,
  buildDevicesSearchParams,
  exportDevicesToCsv,
} from '../data/deviceSelectors.ts';
import { canonicalDevices, canonicalVendorDevices } from '../data/canonicalDevices.ts';

describe('Devices Redesign: Phase 1 Vocabulary & Invariant Tests', () => {
  it('preserves user identifiers verbatim as stored (never mangled by formatting helpers)', () => {
    const dev1 = canonicalDevices.find((d) => d.identifier === 'DEV-001');
    const speaker = canonicalDevices.find((d) => d.identifier === 'GV0032063');
    const serialDev = canonicalDevices.find((d) => d.identifier === 'GS6306382');

    assert.ok(dev1, 'DEV-001 exists in canonical registry');
    assert.equal(dev1.identifier, 'DEV-001');

    assert.ok(speaker, 'GV0032063 exists in canonical registry');
    assert.equal(speaker.identifier, 'GV0032063');

    assert.ok(serialDev, 'GS6306382 exists in canonical registry');
    assert.equal(serialDev.identifier, 'GS6306382');
  });

  it('disambiguates Connectivity State from Lifecycle: state is strictly online, offline, or stale', () => {
    const validStates = new Set(['online', 'offline', 'stale']);
    for (const d of canonicalDevices) {
      assert.ok(
        validStates.has(d.state),
        `Device ${d.identifier} has invalid connectivity state: ${d.state}`
      );
    }
  });

  it('detects last contact freshness contradiction without altering telemetry state (D4 audit finding)', () => {
    // DEV-002: Marked online, but last contact was Nov 3, 2026 (9 days before Nov 12 reference date)
    const dev2 = canonicalDevices.find((d) => d.identifier === 'DEV-002')!;
    const referenceNow = new Date('2026-11-12T08:00:00+08:00');

    const freshness = evaluateDeviceFreshness(dev2, referenceNow);

    assert.equal(dev2.state, 'online', 'Telemetry state remains online');
    assert.ok(freshness.isStaleContact, 'Last contact is flagged as stale (> 24h)');
    assert.ok(freshness.showWarningChip, 'Warning chip is shown to operator');
    assert.ok(freshness.contradiction, 'Contradiction is truthfully flagged');
    assert.ok(
      freshness.contradictionReason?.includes('Device is marked Online but last contact was'),
      'Contradiction explanation clearly states the data condition'
    );
  });

  it('computes availability metrics strictly from stored periods with basis tooltip (D5)', () => {
    const speaker = canonicalDevices.find((d) => d.identifier === 'GV0032063')!;
    assert.ok(speaker.connectivityHistory.length > 0, 'Speaker has stored connectivity history');

    const metrics = computeAvailabilityMetrics(speaker.connectivityHistory);

    assert.ok(metrics.totalRecordsCount > 10, 'Evaluates dozens of stored cycles');
    assert.ok(metrics.onlinePercent >= 0 && metrics.onlinePercent <= 100);
    assert.ok(metrics.stalePercent >= 0 && metrics.stalePercent <= 100);
    assert.ok(metrics.offlinePercent >= 0 && metrics.offlinePercent <= 100);
    assert.equal(
      metrics.onlinePercent + metrics.stalePercent + metrics.offlinePercent,
      100,
      'Percentages sum to 100%'
    );
    assert.ok(metrics.longestOfflineMinutes >= 25, 'Captures the 25 min recurring offline period');
    assert.ok(metrics.stateChangesCount > 10, 'Counts all historical state transitions');
    assert.ok(metrics.computationBasis.includes('From'), 'Basis tooltip explicitly states provenance');
  });

  it('computes KPI strip and status tab counts accurately from single source of truth', () => {
    const kpis = getDeviceKpiCounts(canonicalDevices);

    assert.equal(kpis.total, canonicalDevices.length);
    assert.equal(kpis.online + kpis.offline + kpis.stale, kpis.total, 'State sum invariant holds');
    assert.equal(kpis.needsAttention, kpis.offline + kpis.stale, 'Needs attention = offline + stale');
    assert.ok(kpis.notInstalled >= 2, 'Uninstalled devices (GS6306382, GV0032063) counted');

    const statusTabs = getDeviceStatusTabCounts(canonicalDevices, {
      statusTab: 'all',
      viewMode: 'table',
    });
    assert.equal(statusTabs.all, kpis.total);
    assert.equal(statusTabs.online, kpis.online);
    assert.equal(statusTabs.offline, kpis.offline);
    assert.equal(statusTabs.stale, kpis.stale);
  });

  it('round-trips URL search params and filter state without data loss', () => {
    const initialParams = new URLSearchParams(
      'tab=online&view=map&q=camera&type=Camera&inst=installed&sort=lastContact&dir=desc&page=2&limit=25'
    );

    const parsed = parseDevicesUrlState(initialParams);
    assert.equal(parsed.filters.statusTab, 'online');
    assert.equal(parsed.filters.viewMode, 'map');
    assert.equal(parsed.filters.search, 'camera');
    assert.deepEqual(parsed.filters.type, ['Camera']);
    assert.equal(parsed.filters.installation, 'installed');
    assert.equal(parsed.sortKey, 'lastContact');
    assert.equal(parsed.sortDir, 'desc');
    assert.equal(parsed.page, 2);
    assert.equal(parsed.limit, 25);

    const serialized = buildDevicesSearchParams({
      filters: parsed.filters,
      sortKey: parsed.sortKey,
      sortDir: parsed.sortDir,
      page: parsed.page,
      limit: parsed.limit,
    });

    assert.equal(serialized.get('tab'), 'online');
    assert.equal(serialized.get('view'), 'map');
    assert.equal(serialized.get('q'), 'camera');
    assert.equal(serialized.get('type'), 'Camera');
    assert.equal(serialized.get('inst'), 'installed');
    assert.equal(serialized.get('sort'), 'lastContact');
    assert.equal(serialized.get('dir'), 'desc');
    assert.equal(serialized.get('page'), '2');
    assert.equal(serialized.get('limit'), '25');
  });

  it('exports devices to RFC 4180 CSV verbatim without altering identifiers', () => {
    const csv = exportDevicesToCsv(canonicalDevices);
    assert.ok(csv.startsWith('"Identifier","Name","Type"'));
    assert.ok(csv.includes('"DEV-001"'));
    assert.ok(csv.includes('"GV0032063"'));
    assert.ok(csv.includes('"GS6306382"'));
  });

  it('verifies Vendor Discovery conflict dataset contract (D11)', () => {
    const conflictRow = canonicalVendorDevices.find((v) => v.matchStatus === 'Conflict');
    assert.ok(conflictRow, 'Conflict record exists in vendor discovery');
    assert.equal(conflictRow.serialNumber, 'GQ7752681');
    assert.equal(conflictRow.mappedFalconId, 'DEV-001');
    assert.ok(conflictRow.conflictDetails, 'Conflict details are populated');
    assert.equal(conflictRow.conflictDetails.currentMappedSerial, 'GQ7752680');
    assert.equal(conflictRow.conflictDetails.claimedFalconId, 'DEV-001');
  });
});
