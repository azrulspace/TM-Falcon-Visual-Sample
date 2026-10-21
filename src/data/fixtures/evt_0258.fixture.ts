import type { EventDetailDTO } from '../../types/eventDetail.ts';

/**
 * Canonical contract fixture built from the real EVT-0258 LIVE_STAGING payload.
 */
export const EVT_0258_FIXTURE: EventDetailDTO = {
  id: 'EVT-0258',
  type: 'Monkey near cable',
  source: 'Edge service',
  priority: 'High',
  state: 'New',
  status: 'New',
  device: 'DEV-004',
  deviceStatus: 'offline',
  asset: 'CBL-005',
  assetType: 'Cable span',
  poles: ['AST_006', 'AST_007'],
  caseId: null,
  captured: '2026-10-20T16:28:00+08:00',
  receivedAt: '2026-10-20T16:28:00+08:00',
  detection: 'CCTV-01-Motion Detection',
  ruleCode: 'CCTV-01-Motion Detection',
  observed: 'Not supplied',
  assignee: null,
  acknowledgedAt: null,
  slaMinutes: 30,
  snapshots: ['/monkey-fiber.jpg'],
  rawJson: {
    vendorCode: '10002',
    rule: 'CCTV-01-Motion Detection',
    ruleId: '2111032826769051648',
    category: 'alarmCategoryVideo',
    subCategory: 'alarmSubCategoryCamera',
    vendorPriority: '1',
    vendorPriorityColor: '#F40B0B',
    state: 1,
    channel: 'CCTV-01',
    channelId: '#ff75f3ca638e4075b45951f65cdd31dc',
    channelType: 'camera',
  },
  timeline: [
    {
      id: 't1-EVT-0258',
      icon: 'received',
      text: 'Telemetry packet received from Edge-DEV-004',
      actor: 'Edge service',
      time: '2026-10-20T16:28:00+08:00',
    },
    {
      id: 't2-EVT-0258',
      icon: 'classified',
      text: 'Rule CCTV-01-Motion Detection matched on channel CCTV-01',
      actor: 'Edge service',
      time: '2026-10-20T16:28:00+08:00',
    },
  ],
  location: {
    lat: 2.90870,
    lng: 101.47260,
    coordinatesText: '2.90870° N, 101.47260° E',
  },
  detectionBox: null,
};
