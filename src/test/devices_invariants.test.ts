import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_DEVICES_REGISTRY,
  INITIAL_VENDOR_DISCOVERY_RECORDS,
  buildJalanBandarLamaPreviewDevices,
  buildSyntheticBenchmarkDevices,
} from '../data/devicesRegistry.ts';
import {
  DEFAULT_DEVICE_POLICY_CONFIG,
  enrichDeviceWithRelations,
  getDeviceKpiCounts,
  getDeviceStatusTabCounts,
  getEventsForDevice,
  filterDevices,
  sortDevices,
  parseDevicesUrlState,
  buildDevicesSearchParams,
  buildDevicesCsvContent,
} from '../data/deviceSelectors.ts';
import { filterEvents } from '../data/eventSelectors.ts';
import { initialPoles, initialCableSpans } from '../data/poles.ts';
import { events as initialEvents } from '../data/events.ts';
import type { DeviceFilterState } from '../types/devices.ts';

const SERVER_NOW = new Date('2026-10-21T11:15:00+08:00');

function getEnrichedDevices() {
  return INITIAL_DEVICES_REGISTRY.map((d) =>
    enrichDeviceWithRelations(
      d,
      initialPoles,
      initialCableSpans,
      initialEvents,
      INITIAL_VENDOR_DISCOVERY_RECORDS,
      DEFAULT_DEVICE_POLICY_CONFIG,
      SERVER_NOW
    )
  );
}

describe('Phase 10 Devices KPI, Event Parity, URL Sync & Scale Invariants', () => {
  it('computes consistent KPI totals and Status tab sums across All sites and scoped sites', () => {
    const rich = getEnrichedDevices();
    const kpiAll = getDeviceKpiCounts(rich, 'ALL');
    const tabsAll = getDeviceStatusTabCounts(rich, 'ALL');

    assert.equal(kpiAll.total, 17);
    assert.equal(kpiAll.online + kpiAll.offline + kpiAll.stale, kpiAll.total);
    assert.equal(tabsAll.all, kpiAll.total);
    assert.equal(tabsAll.online + tabsAll.offline + tabsAll.stale, tabsAll.all);
    assert.equal(tabsAll.not_installed, 2);

    const tpgKpi = getDeviceKpiCounts(rich, 'Teluk Panglima Garang');
    assert.equal(tpgKpi.online + tpgKpi.offline + tpgKpi.stale, tpgKpi.total);

    const unassignedKpi = getDeviceKpiCounts(rich, 'Unassigned');
    assert.equal(unassignedKpi.total, 1);
  });

  it('agrees 100% between Device Detail event count and Event inbox device filter', () => {
    const rich = getEnrichedDevices();
    for (const dev of rich) {
      const { allEvents } = getEventsForDevice(dev, initialEvents, 30, SERVER_NOW);
      const inboxMatched = filterEvents(initialEvents, { device: dev.identifier });
      assert.equal(
        allEvents.length,
        inboxMatched.length,
        `Event count mismatch for device ${dev.identifier}`
      );
      assert.equal(dev.allEventsCount, inboxMatched.length);
    }
  });

  it('round-trips Devices URL query parameters cleanly without losing filter or map mode state', () => {
    const original: DeviceFilterState = {
      statusTab: 'not_installed',
      viewMode: 'map',
      search: 'GV003',
      types: ['Speaker'],
      manufacturers: ['Hikvision'],
      libraries: ['HIK_OpenAPI'],
      lifecycle: ['Active'],
      site: 'ALL',
      installationFilter: 'not_installed',
      lastContactRange: '7d',
      configFilter: 'none',
      needsAttentionOnly: true,
      hideTestRecords: false,
    };

    const params = buildDevicesSearchParams({
      filters: original,
      sortKey: 'events30dCount',
      sortDir: 'desc',
      page: 2,
      limit: 50,
      selectedDeviceId: 'GV0032063',
      activeKpi: 'not_installed',
      defaultSite: 'Teluk Panglima Garang',
    });

    const parsed = parseDevicesUrlState(params, 'Teluk Panglima Garang');
    assert.equal(parsed.filters.statusTab, 'not_installed');
    assert.equal(parsed.filters.viewMode, 'map');
    assert.equal(parsed.filters.search, 'GV003');
    assert.deepEqual(parsed.filters.types, ['Speaker']);
    assert.deepEqual(parsed.filters.manufacturers, ['Hikvision']);
    assert.deepEqual(parsed.filters.libraries, ['HIK_OpenAPI']);
    assert.equal(parsed.filters.site, 'ALL');
    assert.equal(parsed.filters.needsAttentionOnly, true);
    assert.equal(parsed.sortKey, 'events30dCount');
    assert.equal(parsed.sortDir, 'desc');
    assert.equal(parsed.page, 2);
    assert.equal(parsed.limit, 50);
    assert.equal(parsed.selectedDeviceId, 'GV0032063');
  });

  it('exports CSV rows with verbatim device identifiers and MYT timestamps', () => {
    const rich = getEnrichedDevices();
    const csv = buildDevicesCsvContent(rich);
    assert.ok(csv.includes('DEV-001'));
    assert.ok(csv.includes('GS6306382'));
    assert.ok(csv.includes('GV0032063'));
    assert.ok(csv.includes('MYT'));
  });

  it('syncs Jalan Bandar Lama 10-device preview mode and scales smoothly across 500 devices', () => {
    const preview = buildJalanBandarLamaPreviewDevices();
    assert.equal(preview.devices.length, 10);
    const enrichedPreview = preview.devices.map((d) =>
      enrichDeviceWithRelations(
        d,
        initialPoles,
        initialCableSpans,
        initialEvents,
        preview.vendorRecords,
        DEFAULT_DEVICE_POLICY_CONFIG,
        SERVER_NOW
      )
    );
    const kpiPreview = getDeviceKpiCounts(enrichedPreview, 'Jalan Bandar Lama');
    assert.equal(kpiPreview.total, 10);

    const benchRaw = buildSyntheticBenchmarkDevices(500);
    const t0 = performance.now();
    const enrichedBench = benchRaw.map((d) =>
      enrichDeviceWithRelations(
        d,
        initialPoles,
        initialCableSpans,
        initialEvents,
        [],
        DEFAULT_DEVICE_POLICY_CONFIG,
        SERVER_NOW
      )
    );
    const benchKpi = getDeviceKpiCounts(enrichedBench, 'ALL');
    const filtered = filterDevices(
      enrichedBench,
      { statusTab: 'online', viewMode: 'table', site: 'ALL' },
      SERVER_NOW
    );
    const sorted = sortDevices(filtered, 'identifier', 'asc');
    const elapsedMs = performance.now() - t0;

    assert.equal(benchKpi.total, 500);
    assert.ok(sorted.length > 0);
    assert.ok(elapsedMs < 250, `Expected 500-device enrichment/filter/sort < 250ms, got ${elapsedMs.toFixed(1)}ms`);
  });
});

