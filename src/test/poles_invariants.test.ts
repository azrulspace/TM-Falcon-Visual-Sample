import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SITES,
  initialPoles,
  initialCableSpans,
  buildJalanBandarLamaPreviewDataset,
  normalizeRelationKey,
} from '../data/poles.ts';
import { devices } from '../data/devices.ts';
import { events as initialEvents } from '../data/events.ts';
import {
  enrichPoleWithRelations,
  getPoleKpiCounts,
  getPoleStatusTabCounts,
  getEventsForPole,
  filterPoles,
  sortPoles,
  parsePolesUrlState,
  buildPolesSearchParams,
  buildPolesCsvContent,
} from '../data/poleSelectors.ts';
import { filterEvents } from '../data/eventSelectors.ts';
import {
  validateCoordinatePair,
  haversineDistanceMeters,
  formatCoordinates,
} from '../lib/geo.ts';
import {
  getRoleFromAccountLabel,
  getPolePermissions,
  DEFAULT_BACKEND_CAPABILITIES,
  PREVIEW_BACKEND_CAPABILITIES,
} from '../lib/permissions.ts';
import type { PoleFilterState } from '../types/assets.ts';

function getEnrichedPoles() {
  return initialPoles.map((p) =>
    enrichPoleWithRelations(p, devices, initialCableSpans, initialEvents, SITES)
  );
}

describe('Poles Registry & Verbatim Identifiers Invariants', () => {
  it('preserves user-entered underscores and casing verbatim on identifiers', () => {
    const tgp001 = initialPoles.find((p) => p.identifier === 'TGP_P001');
    const testPole = initialPoles.find((p) => p.identifier === 'TEST');
    const testPole2 = initialPoles.find((p) => p.identifier === 'TESTPOLE2');
    const deletedPole = initialPoles.find((p) => p.identifier === 'TGP_P000');

    assert.ok(tgp001, 'TGP_P001 must exist with verbatim underscore');
    assert.ok(testPole, 'TEST must exist verbatim');
    assert.ok(testPole2, 'TESTPOLE2 must exist verbatim');
    assert.equal(testPole2.name, 'Testing Pole 2');
    assert.ok(deletedPole && deletedPole.lifecycle === 'Deleted', 'TGP_P000 soft-deleted');

    // Internal FK helper may normalize for matching, but stored identifiers stay unchanged
    assert.equal(normalizeRelationKey('AST-001'), 'AST_001');
    assert.equal(tgp001.identifier, 'TGP_P001');
  });

  it('keeps unlocated pole TGP_P009 without fabricated coordinates', () => {
    const p009 = initialPoles.find((p) => p.identifier === 'TGP_P009');
    assert.ok(p009);
    assert.equal(p009.location, null);
    assert.equal(formatCoordinates(p009.location), 'Not recorded');
  });

  it('Jalan Bandar Lama preview dataset provides deterministic 20 poles, 10 spans, 10 devices', () => {
    const preview = buildJalanBandarLamaPreviewDataset();
    assert.equal(preview.site.name, 'Jalan Bandar Lama');
    assert.equal(preview.poles.length, 20);
    assert.equal(preview.spans.length, 10);
    assert.equal(preview.devices.length, 10);
    assert.ok(preview.poles.every((p) => p.siteName === 'Jalan Bandar Lama'));
  });
});

describe('Poles KPI Strip, Filter & URL Round-trip Invariants', () => {
  it('computes KPI strip and status tabs from the same site-scoped selectors', () => {
    const enriched = getEnrichedPoles();
    const kpisTpg = getPoleKpiCounts(enriched, 'Teluk Panglima Garang');
    const tabsTpg = getPoleStatusTabCounts(enriched, { site: 'Teluk Panglima Garang' });

    const activeListTpg = filterPoles(enriched, {
      statusTab: 'active',
      viewMode: 'table',
      site: 'Teluk Panglima Garang',
    });
    const deletedListTpg = filterPoles(enriched, {
      statusTab: 'deleted',
      viewMode: 'table',
      site: 'Teluk Panglima Garang',
    });

    assert.equal(tabsTpg.active, activeListTpg.length);
    assert.equal(tabsTpg.deleted, deletedListTpg.length);
    assert.equal(kpisTpg.deleted, deletedListTpg.length);
    assert.equal(
      kpisTpg.missingLocation,
      activeListTpg.filter((p) => !p.location).length
    );
    assert.equal(
      kpisTpg.withLinkedDevice,
      activeListTpg.filter((p) => p.linkedDevicesCount > 0).length
    );
    assert.equal(
      kpisTpg.withEvents30d,
      activeListTpg.filter((p) => p.events30dCount > 0).length
    );
  });

  it('round-trips URL query params and FilterState without losing filters or viewMode', () => {
    const filters: PoleFilterState = {
      statusTab: 'active',
      viewMode: 'map',
      search: 'TGP_P',
      lifecycle: ['Active', 'Maintenance'],
      site: 'ALL',
      locationFilter: 'missing_location',
      protection: ['Test', '__NONE__'],
      linkedDevice: 'with',
      withEvents30d: true,
      updatedRange: '7d',
    };

    const params = buildPolesSearchParams({
      filters,
      sortKey: 'identifier',
      sortDir: 'asc',
      page: 2,
      limit: 50,
      selectedPoleId: 'TGP_P001',
      activeKpi: 'missing_location',
      defaultSite: 'Teluk Panglima Garang',
    });

    const parsed = parsePolesUrlState(params, 'Teluk Panglima Garang');
    assert.equal(parsed.filters.viewMode, 'map');
    assert.equal(parsed.filters.search, 'TGP_P');
    assert.deepEqual(parsed.filters.lifecycle, ['Active', 'Maintenance']);
    assert.equal(parsed.filters.site, 'ALL');
    assert.equal(parsed.filters.locationFilter, 'missing_location');
    assert.deepEqual(parsed.filters.protection, ['Test', '__NONE__']);
    assert.equal(parsed.filters.linkedDevice, 'with');
    assert.equal(parsed.filters.withEvents30d, true);
    assert.equal(parsed.filters.updatedRange, '7d');
    assert.equal(parsed.sortKey, 'identifier');
    assert.equal(parsed.sortDir, 'asc');
    assert.equal(parsed.page, 2);
    assert.equal(parsed.limit, 50);
    assert.equal(parsed.selectedPoleId, 'TGP_P001');
    assert.equal(parsed.activeKpi, 'missing_location');
  });

  it('never leaks deleted poles into active filters and exports CSV verbatim', () => {
    const enriched = getEnrichedPoles();
    const active = filterPoles(enriched, {
      statusTab: 'active',
      viewMode: 'table',
      site: 'ALL',
    });
    assert.ok(active.every((p) => p.lifecycle !== 'Deleted'));

    const sorted = sortPoles(active.slice(0, 3), 'identifier', 'asc');
    assert.equal(sorted.length, 3);

    const tgp = enriched.find((p) => p.identifier === 'TGP_P001')!;
    const csv = buildPolesCsvContent([tgp]);
    assert.ok(csv.includes('"TGP_P001"'));
    assert.ok(csv.includes('Registered,Last Updated'));
  });
});

describe('Pole Detail Events Parity, Geo Validation & RBAC Permissions', () => {
  it('agrees 100% between getEventsForPole and Event inbox poleScopeEventIds filter', () => {
    const enriched = getEnrichedPoles();
    const ast001 = enriched.find((p) => p.identifier === 'AST-001')!;
    const rel = getEventsForPole(
      ast001,
      ast001.connectedSpans,
      ast001.linkedDevices,
      initialEvents
    );
    const inboxMatched = filterEvents(initialEvents, {
      tab: 'all',
      poleScopeEventIds: rel.allEvents.map((e) => e.id),
    });
    assert.equal(inboxMatched.length, rel.allEvents.length);
    assert.equal(inboxMatched.length, ast001.allEventsCount);
  });

  it('validates WGS84 coordinates strictly and computes Haversine distances accurately', () => {
    assert.equal(validateCoordinatePair('', '').valid, true);
    assert.equal(validateCoordinatePair('', '').location, null);
    assert.equal(validateCoordinatePair('2.92', '').valid, false);
    assert.equal(validateCoordinatePair('95', '101').valid, false);
    assert.equal(validateCoordinatePair('2.92', '190').valid, false);

    const ok = validateCoordinatePair('2.922926', '101.457646');
    assert.equal(ok.valid, true);
    assert.deepEqual(ok.location, { lat: 2.922926, lng: 101.457646 });

    const dist = haversineDistanceMeters(
      { lat: 2.92239, lng: 101.45717 },
      { lat: 2.922926, lng: 101.457646 }
    );
    assert.ok(dist > 60 && dist < 100, `Expected ~79m, got ${dist}`);
  });

  it('enforces RBAC roles and truthful backend capabilities', () => {
    assert.equal(getRoleFromAccountLabel('Admin (sample)'), 'Admin');
    assert.equal(getRoleFromAccountLabel('Operator (sample)'), 'Operator');
    assert.equal(getRoleFromAccountLabel('Field Technician'), 'Field');

    const adminPerms = getPolePermissions('Admin', DEFAULT_BACKEND_CAPABILITIES);
    assert.equal(adminPerms.canRegister, true);
    assert.equal(adminPerms.canEdit, true);
    assert.equal(adminPerms.canRelocate, true);
    assert.equal(adminPerms.canDelete, true);
    assert.equal(adminPerms.canBulkDelete, false);
    assert.equal(adminPerms.canRestore, false);
    assert.equal(adminPerms.canLinkDevice, false);

    const operatorPerms = getPolePermissions('Operator', DEFAULT_BACKEND_CAPABILITIES);
    assert.equal(operatorPerms.canEdit, true);
    assert.equal(operatorPerms.canDelete, false);

    const fieldPerms = getPolePermissions('Field', DEFAULT_BACKEND_CAPABILITIES);
    assert.equal(fieldPerms.canRegister, false);
    assert.equal(fieldPerms.canEdit, false);
    assert.equal(fieldPerms.canRelocate, false);
    assert.equal(fieldPerms.canDelete, false);

    const previewAdminPerms = getPolePermissions('Admin', PREVIEW_BACKEND_CAPABILITIES);
    assert.equal(previewAdminPerms.canRestore, true);
  });
});
