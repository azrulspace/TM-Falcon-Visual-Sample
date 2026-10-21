import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptEventDetailDtoToViewModel } from '../adapters/eventDetailAdapter.ts';
import { EVT_0258_FIXTURE } from '../data/fixtures/evt_0258.fixture.ts';

test('Event Detail Adapter: EVT-0258 fixture matches LIVE_STAGING contract', () => {
  const vm = adaptEventDetailDtoToViewModel(EVT_0258_FIXTURE, {
    now: '2026-10-21T08:37:00+08:00',
  });

  // 1. Identity & Type
  assert.equal(vm.id, 'EVT-0258');
  assert.equal(vm.formattedId, 'EVT-0258');
  assert.equal(vm.type, 'Monkey near cable');
  assert.equal(vm.source, 'Edge service');

  // 2. Priority & Status (A1)
  assert.equal(vm.priority, 'High', 'Product priority must be High, never Critical or derived from vendor data');
  assert.equal(vm.status, 'New');

  // 3. Timestamps & SLA (B1, B2)
  assert.equal(vm.capturedDisplay, 'Oct 20, 2026, 4:28 PM');
  assert.equal(vm.receivedDisplay, 'Oct 20, 2026, 4:28 PM');
  assert.equal(vm.capturedRelative, '16h 9m ago');
  assert.ok(vm.sla !== null);
  assert.equal(vm.sla.status, 'overdue');
  assert.equal(vm.sla.targetMinutes, 30);
  assert.equal(vm.sla.overdueMinutes, 939);

  // 4. Evidence (A2)
  assert.equal(vm.evidence.primarySnapshot, '/monkey-fiber.jpg');
  assert.equal(vm.evidence.snapshots.length, 1);
  assert.equal(vm.evidence.detectionRegion, null, 'No synthetic box for EVT-0258');
  assert.equal(vm.evidence.confidence, null, 'No invented confidence value');
  assert.equal(vm.capabilities.hasMultipleFrames, false, 'Frame strip must be hidden for single frame');
  assert.equal(vm.capabilities.hasDetectionBox, false);

  // 5. Vendor Data Parity (C8)
  assert.equal(vm.vendorData.vendorCode, '10002');
  assert.equal(vm.vendorData.rule, 'CCTV-01-Motion Detection');
  assert.equal(vm.vendorData.ruleId, '2111032826769051648');
  assert.equal(vm.vendorData.category, 'alarmCategoryVideo');
  assert.equal(vm.vendorData.subCategory, 'alarmSubCategoryCamera');
  assert.equal(vm.vendorData.vendorPriority, '1');
  assert.equal(vm.vendorData.vendorPriorityColor, '#F40B0B');
  assert.equal(vm.vendorData.state, '1');
  assert.equal(vm.vendorData.channel, 'CCTV-01');
  assert.equal(vm.vendorData.channelId, '#ff75f3ca638e4075b45951f65cdd31dc');
  assert.equal(vm.vendorData.channelType, 'camera');

  // 6. Facts & Notes (A5, A6)
  assert.equal(vm.detectionRule, 'CCTV-01-Motion Detection');
  assert.equal(vm.observed, 'Not supplied');
  assert.equal(vm.policyNote, 'A detection is not proof of damage.');
  assert.equal(vm.sourceDevice?.id, 'DEV-004');
  assert.equal(vm.affectedAsset?.id, 'CBL-005');

  // 7. Actions & Capabilities (C1)
  assert.equal(vm.capabilities.canAcknowledge, true);
  assert.equal(vm.capabilities.canCreateCase, true);
  assert.equal(vm.capabilities.canExport, false, 'Export disabled until backend endpoint exists');
});

test('Event Detail Phase 4: Stepper and Action hierarchy transition when event is acknowledged', () => {
  const acknowledgedDto = {
    ...EVT_0258_FIXTURE,
    status: 'Acknowledged' as const,
    state: 'Acknowledged' as const,
    acknowledgedAt: '2026-10-20T16:40:00+08:00', // 12m after captured
  };

  const vm = adaptEventDetailDtoToViewModel(acknowledgedDto, {
    now: '2026-10-21T08:37:00+08:00',
  });

  assert.equal(vm.status, 'Acknowledged');
  assert.equal(vm.capabilities.canAcknowledge, false, 'Acknowledge must not be available once acknowledged');
  assert.equal(vm.capabilities.canCreateCase, true);
  assert.ok(vm.sla !== null);
  assert.equal(vm.sla.status, 'acknowledged');
  assert.equal(vm.sla.elapsedMinutes, 12);
  assert.equal(vm.sla.text, 'Acknowledged in 12m');
});
