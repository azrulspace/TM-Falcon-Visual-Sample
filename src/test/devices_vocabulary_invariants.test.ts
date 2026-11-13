import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_DEVICES_REGISTRY,
  INITIAL_VENDOR_DISCOVERY_RECORDS,
  buildJalanBandarLamaPreviewDevices,
  buildRepeatingSpeakerPeriods,
} from '../data/devicesRegistry.ts';
import {
  DEFAULT_DEVICE_POLICY_CONFIG,
  PREVIEW_DEVICE_POLICY_CONFIG,
  normalizeConnectivityState,
  normalizeLifecycle,
  getLastContactFreshness,
  computeAvailabilitySummary,
  enrichDeviceWithRelations,
} from '../data/deviceSelectors.ts';
import {
  SPEAKER_CONFIG_SECTIONS,
  getDefaultConfigValuesForType,
  isConfigFieldActive,
  getChangedConfigKeys,
} from '../data/deviceConfigSchema.ts';
import {
  getDevicePermissions,
  DEFAULT_BACKEND_CAPABILITIES,
  PREVIEW_BACKEND_CAPABILITIES,
} from '../lib/permissions.ts';
import { initialPoles, initialCableSpans } from '../data/poles.ts';
import { events as initialEvents } from '../data/events.ts';

const SERVER_NOW = new Date('2026-10-21T11:15:00+08:00');

describe('Phase 1 Devices Vocabulary, Freshness & Availability Invariants', () => {
  it('strictly separates Connectivity State from administrative Lifecycle', () => {
    assert.equal(normalizeConnectivityState('Online'), 'online');
    assert.equal(normalizeConnectivityState('offline'), 'offline');
    assert.equal(normalizeConnectivityState('Delayed'), 'stale');
    assert.equal(normalizeLifecycle('Active'), 'Active');
    assert.equal(normalizeLifecycle('Planned'), 'Planned');
    assert.equal(normalizeLifecycle('Maintenance'), 'Maintenance');
    assert.equal(normalizeLifecycle('Retired'), 'Retired');
  });

  it('preserves verbatim staging identifiers, DEV-004 offline parity, and Unassigned site truthfulness', () => {
    const ids = new Set(INITIAL_DEVICES_REGISTRY.map((d) => d.identifier));
    assert.ok(ids.has('DEV-001'));
    assert.ok(ids.has('DEV-004'));
    assert.ok(ids.has('GS6306382'));
    assert.ok(ids.has('GV0032063'));

    const dev004 = INITIAL_DEVICES_REGISTRY.find((d) => d.identifier === 'DEV-004');
    assert.equal(dev004?.connectivityState, 'offline');

    const enrichedDev004 = enrichDeviceWithRelations(
      dev004!,
      initialPoles,
      initialCableSpans,
      initialEvents,
      INITIAL_VENDOR_DISCOVERY_RECORDS,
      DEFAULT_DEVICE_POLICY_CONFIG,
      SERVER_NOW
    );
    assert.equal(enrichedDev004.allEventsCount, 117);
    assert.equal(enrichedDev004.isInstalled, true);
    assert.ok(enrichedDev004.location !== null, 'Installed DEV-004 must resolve pole location');

    const speaker = INITIAL_DEVICES_REGISTRY.find((d) => d.identifier === 'GV0032063');
    const enrichedSpeaker = enrichDeviceWithRelations(
      speaker!,
      initialPoles,
      initialCableSpans,
      initialEvents,
      INITIAL_VENDOR_DISCOVERY_RECORDS,
      DEFAULT_DEVICE_POLICY_CONFIG,
      SERVER_NOW
    );
    assert.equal(enrichedSpeaker.siteName, null);
    assert.equal(enrichedSpeaker.isInstalled, false);
    assert.equal(
      enrichedSpeaker.location,
      null,
      'Unassigned and not-installed device must have null location rather than inheriting a site centre'
    );
  });

  it('does not invent stale thresholds without server policy, but honors explicit policy threshold when present', () => {
    const dev001 = INITIAL_DEVICES_REGISTRY.find((d) => d.identifier === 'DEV-001')!;
    const dev002 = INITIAL_DEVICES_REGISTRY.find((d) => d.identifier === 'DEV-002')!;

    // No server policy -> never auto-marks Stale, while factually surfacing old contact age
    const dev002NoPolicy = getLastContactFreshness(
      dev002.lastContactAt,
      dev002.connectivityState,
      DEFAULT_DEVICE_POLICY_CONFIG,
      SERVER_NOW
    );
    assert.equal(dev002NoPolicy.isStaleByPolicy, false);
    assert.equal(dev002NoPolicy.isOldWhileOnline, true);
    assert.ok((dev002NoPolicy.ageHours || 0) > 200);

    // Explicit 48h server policy -> flags DEV-002 (9d old) while leaving recent DEV-001 clear
    const dev002WithPolicy = getLastContactFreshness(
      dev002.lastContactAt,
      dev002.connectivityState,
      PREVIEW_DEVICE_POLICY_CONFIG,
      SERVER_NOW
    );
    const dev001WithPolicy = getLastContactFreshness(
      dev001.lastContactAt,
      dev001.connectivityState,
      PREVIEW_DEVICE_POLICY_CONFIG,
      SERVER_NOW
    );
    assert.equal(dev002WithPolicy.isStaleByPolicy, true);
    assert.equal(dev001WithPolicy.isStaleByPolicy, false);
  });

  it('computes exact 24h and 7d Availability summaries from repeating 2m/3m/25m periods without negative durations', () => {
    const periods = buildRepeatingSpeakerPeriods('2026-10-21T11:15:00+08:00', 168);
    const sum24h = computeAvailabilitySummary(periods, 24, SERVER_NOW);
    const sum7d = computeAvailabilitySummary(periods, 168, SERVER_NOW);

    assert.equal(sum24h.onlinePercent, 6.7);
    assert.equal(sum24h.stalePercent, 10.0);
    assert.equal(sum24h.offlinePercent, 83.3);
    assert.equal(sum24h.longestOfflineMs, 25 * 60 * 1000);
    assert.ok(sum24h.transitionsCount > 0);
    assert.ok(sum24h.onlineMs >= 0 && sum24h.staleMs >= 0 && sum24h.offlineMs >= 0);

    assert.equal(sum7d.onlinePercent, 6.7);
    assert.equal(sum7d.stalePercent, 10.0);
    assert.equal(sum7d.offlinePercent, 83.3);

    const emptySummary = computeAvailabilitySummary([], 24, SERVER_NOW);
    assert.equal(emptySummary.onlinePercent, null);
    assert.equal(emptySummary.periodsUsedCount, 0);
  });

  it('validates schema-driven config dependencies, Edge-diff isolation, and warnings', () => {
    const defaults = getDefaultConfigValuesForType('Speaker');
    const loudField = SPEAKER_CONFIG_SECTIONS[1].fields.find(
      (f) => f.key === 'loud_sound_sensitivity'
    )!;
    assert.equal(isConfigFieldActive(loudField, defaults), false);
    assert.equal(isConfigFieldActive(loudField, { ...defaults, sudden_loud_sound: true }), true);

    const alarmVolField = SPEAKER_CONFIG_SECTIONS[0].fields.find((f) => f.key === 'alarm_volume')!;
    assert.equal(alarmVolField.warningRule?.check(120, { speaker_volume: 90 }), true);
    assert.equal(alarmVolField.warningRule?.check(80, { speaker_volume: 90 }), false);

    const changed = getChangedConfigKeys(
      SPEAKER_CONFIG_SECTIONS,
      { ...defaults, speaker_volume: 75 },
      defaults
    );
    assert.equal(changed.length, 1);
    assert.equal(changed[0].key, 'speaker_volume');
    assert.equal(changed[0].fromValue, 90);
    assert.equal(changed[0].toValue, 75);
  });

  it('builds Jalan Bandar Lama 10-device preview dataset & enforces device RBAC matrix', () => {
    const preview = buildJalanBandarLamaPreviewDevices();
    assert.equal(preview.devices.length, 10);
    assert.equal(preview.vendorRecords[0].matchStatus, 'Not registered');

    const fieldPerms = getDevicePermissions('Field', DEFAULT_BACKEND_CAPABILITIES);
    assert.equal(fieldPerms.canRegisterDevice, false);
    assert.equal(fieldPerms.canConfigureDevice, false);
    assert.equal(fieldPerms.canTriggerVendorSync, false);

    const adminDefault = getDevicePermissions('Admin', DEFAULT_BACKEND_CAPABILITIES);
    assert.equal(adminDefault.canRegisterDevice, true);
    assert.equal(adminDefault.canResolveVendorConflict, true);
    assert.equal(adminDefault.canTriggerVendorSync, false);
    assert.equal(adminDefault.canDeleteDevice, false);

    const adminPreview = getDevicePermissions('Admin', PREVIEW_BACKEND_CAPABILITIES);
    assert.equal(adminPreview.canTriggerVendorSync, true);
    assert.equal(adminPreview.canDeleteDevice, true);
  });
});

