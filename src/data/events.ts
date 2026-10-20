import { generateSnapshotSvg } from './mockEventsGenerator.ts';

export interface EventTimelineEntry {
  id: string;
  icon: 'received' | 'classified' | 'acknowledged' | 'case' | 'assigned' | 'note' | 'dismissed' | 'resolved';
  text: string;
  actor: string;
  time: string;
}

export interface FalconEvent {
  id: string;
  captured: string;
  receivedAt: string;
  type: string;
  device: string | null;
  deviceStatus?: 'online' | 'offline' | 'stale';
  asset: string;
  assetType?: string;
  poles?: [string, string];
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  state: 'New' | 'Acknowledged' | 'In case' | 'Assigned' | 'Dismissed' | 'Resolved' | 'Closed';
  status: 'New' | 'Acknowledged' | 'In case' | 'Assigned' | 'Dismissed' | 'Resolved' | 'Closed';
  caseId: string | null;
  source: 'Edge service' | 'Manual' | 'Partner feed';
  ruleCode: string;
  vendorCode: string;
  observed: string;
  detection: string;
  assignee: string | null;
  slaMinutes: number;
  unacknowledgedDuration: string;
  overSla: boolean;
  snapshots: string[];
  rawJson: Record<string, any>;
  timeline: EventTimelineEntry[];
  location?: {
    lat: number;
    lng: number;
    coordinatesText: string;
  };
}

// Generate the full 258 enterprise mock events
function generateEvents(): FalconEvent[] {
  const result: FalconEvent[] = [];

  // 1. Group A: 117 events of "Monkey near cable" on DEV-004 and CBL-005
  for (let i = 0; i < 117; i++) {
    const num = 258 - i;
    const id = `EVT-${num.toString().padStart(4, '0')}`;
    
    // Minutes ago distribution: latest is 12m ago, spreading back 3 days
    let minutesAgo = 12;
    if (i > 0 && i < 10) minutesAgo = 12 + i * 4; // 12m to 48m
    else if (i >= 10 && i < 30) minutesAgo = 60 + (i - 10) * 15; // 1h to 5h
    else if (i >= 30 && i < 60) minutesAgo = 300 + (i - 30) * 30; // 5h to 20h
    else if (i >= 60 && i < 90) minutesAgo = 1440 + (i - 60) * 45; // 1d to 2d
    else minutesAgo = 2880 + (i - 90) * 60; // 2d to 3d

    let captured = `${minutesAgo}m ago`;
    if (minutesAgo >= 60 && minutesAgo < 1440) {
      captured = `${Math.floor(minutesAgo / 60)}h ${minutesAgo % 60}m ago`;
    } else if (minutesAgo >= 1440) {
      captured = `${Math.floor(minutesAgo / 1440)}d ago`;
    }

    // State distribution: first 42 are New, 45 Acknowledged, 20 In case, 10 Dismissed
    let state: FalconEvent['state'] = 'New';
    let caseId: string | null = null;
    let assignee: string | null = null;
    if (i >= 42 && i < 87) {
      state = 'Acknowledged';
      assignee = 'Ahmad Syukri (TM)';
    } else if (i >= 87 && i < 107) {
      state = 'In case';
      caseId = 'CAS-0001';
      assignee = 'Field Team Alpha';
    } else if (i >= 107) {
      state = 'Dismissed';
    }

    const priority: FalconEvent['priority'] = i % 5 === 0 ? 'Critical' : i % 3 === 0 ? 'Medium' : 'High';
    const overSla = state === 'New' && minutesAgo > 30;

    const timestampStr = `2026-10-20 ${16 - Math.floor(minutesAgo / 60)}:${(60 - (minutesAgo % 60)).toString().padStart(2, '0')}:14`;

    const snapshots = [
      generateSnapshotSvg(id, 'Monkey near cable', 'DEV-004', timestampStr, 1),
      generateSnapshotSvg(id, 'Monkey near cable', 'DEV-004', timestampStr, 2),
      generateSnapshotSvg(id, 'Monkey near cable', 'DEV-004', timestampStr, 3),
    ];

    result.push({
      id,
      captured,
      receivedAt: captured,
      type: 'Monkey near cable',
      device: 'DEV-004',
      deviceStatus: 'offline',
      asset: 'CBL-005',
      assetType: 'Cable span',
      poles: ['AST-POL-012', 'AST-POL-013'],
      priority,
      state,
      status: state,
      caseId,
      source: 'Edge service',
      ruleCode: 'CCTV-01-Motion-Detection-0114002',
      vendorCode: '10002',
      observed: 'Not supplied',
      detection: 'CCTV-01-Motion Detection',
      assignee,
      slaMinutes: 30,
      unacknowledgedDuration: captured,
      overSla,
      snapshots,
      rawJson: {
        vendorCode: '10002',
        rule: 'CCTV-01-Motion Detection',
        confidence: 0.942,
        sensorPayload: { fps: 60, res: '1080p', node: 'Edge-DEV-004' },
      },
      timeline: [
        { id: `t1-${id}`, icon: 'received', text: 'Telemetry packet received at Gateway DEV-004', actor: 'Edge service', time: '12m ago' },
        { id: `t2-${id}`, icon: 'classified', text: 'AI Model v2.4 classified event as Monkey near cable (confidence 94.2%)', actor: 'Inference Engine', time: '11m ago' },
        ...(state === 'Acknowledged' || state === 'In case'
          ? [{ id: `t3-${id}`, icon: 'acknowledged' as const, text: 'Event acknowledged by operator', actor: 'Ahmad Syukri', time: '5m ago' }]
          : []),
        ...(state === 'In case'
          ? [{ id: `t4-${id}`, icon: 'case' as const, text: 'Assigned to field ticket CAS-0001 (Field Team Alpha)', actor: 'Ahmad Syukri', time: '3m ago' }]
          : []),
      ],
      location: {
        lat: 2.90870,
        lng: 101.47260,
        coordinatesText: '2.90870° N, 101.47260° E',
      },
    });
  }

  // 2. The remaining 141 events with diverse types, devices, and assets
  const eventTypes = [
    { type: 'Vegetation encroachment', defaultPriority: 'High', rule: 'LIDAR-TREE-SPAN-04', vendor: '20041' },
    { type: 'Cable sag', defaultPriority: 'Medium', rule: 'OPT-SAG-METRIC-02', vendor: '20015' },
    { type: 'Pole tilt', defaultPriority: 'Critical', rule: 'INCL-ACCEL-TILT-01', vendor: '30009' },
    { type: 'Power loss', defaultPriority: 'Critical', rule: 'UPS-MAINS-FAIL-03', vendor: '40001' },
    { type: 'Camera fault', defaultPriority: 'Low', rule: 'CAM-RTSP-STREAM-DROP', vendor: '50012' },
    { type: 'Vandalism', defaultPriority: 'Critical', rule: 'VIB-TAMPER-SENSOR-09', vendor: '60002' },
    { type: 'Person near pole', defaultPriority: 'Medium', rule: 'CCTV-AI-PERSON-SPAN', vendor: '10008' },
    { type: 'Overheight vehicle', defaultPriority: 'High', rule: 'LIDAR-CLEARANCE-ALERT', vendor: '20088' },
  ];

  const devicesList = [
    { id: 'DEV-001', status: 'online', asset: 'AST-002', lat: 2.90958, lng: 101.47013 },
    { id: 'DEV-002', status: 'online', asset: 'AST-003', lat: 2.90991, lng: 101.47102 },
    { id: 'DEV-003', status: 'stale', asset: 'AST-004', lat: 2.91040, lng: 101.47190 },
    { id: 'DEV-005', status: 'online', asset: 'AST-007', lat: 2.91102, lng: 101.47310 },
    { id: 'DEV-006', status: 'online', asset: 'AST-010', lat: 2.91160, lng: 101.47420 },
    { id: 'DEV-007', status: 'online', asset: 'AST-008', lat: 2.91012, lng: 101.47380 },
    { id: 'DEV-008', status: 'stale', asset: 'AST-011', lat: 2.90801, lng: 101.47001 },
    { id: 'DEV-009', status: 'online', asset: 'AST-012', lat: 2.90833, lng: 101.47120 },
    { id: 'DEV-010', status: 'online', asset: 'AST-013', lat: 2.90770, lng: 101.47330 },
    { id: 'DEV-011', status: 'offline', asset: 'AST-070', lat: 2.90720, lng: 101.47390 },
    { id: 'DEV-012', status: 'online', asset: 'AST-014', lat: 2.90690, lng: 101.47410 },
    { id: 'DEV-014', status: 'online', asset: 'AST-016', lat: 2.90630, lng: 101.47450 },
    { id: null, status: 'online', asset: 'AST-009', lat: 2.91200, lng: 101.47500 },
  ];

  const cableAssets = ['CBL-001', 'CBL-002', 'CBL-003', 'CBL-004', 'CBL-005'];
  const sources: FalconEvent['source'][] = ['Edge service', 'Edge service', 'Edge service', 'Manual', 'Partner feed'];
  const statuses: FalconEvent['state'][] = ['New', 'New', 'Acknowledged', 'Acknowledged', 'In case', 'Dismissed', 'Resolved'];

  const remainingCount = 258 - result.length; // exactly 141
  for (let j = 0; j < remainingCount; j++) {
    const idNum = remainingCount - j;
    const id = `EVT-${idNum.toString().padStart(4, '0')}`;
    const typeObj = eventTypes[j % eventTypes.length];
    const devObj = devicesList[j % devicesList.length];
    const asset = j % 2 === 0 ? cableAssets[j % cableAssets.length] : devObj.asset;
    const source = sources[j % sources.length];
    const state = statuses[j % statuses.length];
    
    // Vary priority slightly around default
    let priority: FalconEvent['priority'] = typeObj.defaultPriority as any;
    if (j % 7 === 0) priority = 'Critical';
    else if (j % 6 === 0) priority = 'Low';

    const caseId = state === 'In case' ? `CAS-${((j % 4) + 1).toString().padStart(4, '0')}` : null;
    const assignee = state === 'In case' ? 'Field Team Beta' : state === 'Acknowledged' ? 'Zulhilmi (Field)' : null;

    const minutesAgo = 18 + j * 23;
    let captured = `${minutesAgo}m ago`;
    if (minutesAgo >= 60 && minutesAgo < 1440) {
      captured = `${Math.floor(minutesAgo / 60)}h ${minutesAgo % 60}m ago`;
    } else if (minutesAgo >= 1440) {
      captured = `${Math.floor(minutesAgo / 1440)}d ago`;
    }

    const timestampStr = `2026-10-20 ${16 - Math.floor(minutesAgo / 60)}:${(60 - (minutesAgo % 60)).toString().padStart(2, '0')}:45`;
    const devId = devObj.id || 'DEV-UNK';

    const snapshots = [
      generateSnapshotSvg(id, typeObj.type, devId, timestampStr, 1),
      generateSnapshotSvg(id, typeObj.type, devId, timestampStr, 2),
      generateSnapshotSvg(id, typeObj.type, devId, timestampStr, 3),
    ];

    result.push({
      id,
      captured,
      receivedAt: captured,
      type: typeObj.type,
      device: devObj.id,
      deviceStatus: devObj.status as any,
      asset,
      assetType: asset.startsWith('CBL') ? 'Cable span' : 'Utility pole',
      poles: ['AST-POL-003', 'AST-POL-004'],
      priority,
      state,
      status: state,
      caseId,
      source,
      ruleCode: typeObj.rule,
      vendorCode: typeObj.vendor,
      observed: j % 3 === 0 ? 'Thermal sensor delta > 14°C' : 'Not supplied',
      detection: `${typeObj.type} detection`,
      assignee,
      slaMinutes: priority === 'Critical' ? 15 : priority === 'High' ? 30 : 60,
      unacknowledgedDuration: captured,
      overSla: state === 'New' && minutesAgo > 30,
      snapshots,
      rawJson: {
        vendorCode: typeObj.vendor,
        ruleCode: typeObj.rule,
        eventType: typeObj.type,
        device: devObj.id,
        confidence: 0.88 + (j % 10) * 0.01,
      },
      timeline: [
        { id: `t1-${id}`, icon: 'received', text: `Detection trigger emitted from ${devObj.id || 'Partner network'}`, actor: source, time: captured },
        { id: `t2-${id}`, icon: 'classified', text: `Rule engine verified ${typeObj.rule}`, actor: 'FALCON Core', time: captured },
        ...(state === 'Acknowledged' || state === 'In case'
          ? [{ id: `t3-${id}`, icon: 'acknowledged' as const, text: 'Acknowledged by operator', actor: 'Ahmad Syukri', time: '1h ago' }]
          : []),
        ...(state === 'In case'
          ? [{ id: `t4-${id}`, icon: 'case' as const, text: `Case ${caseId} dispatched`, actor: 'Ahmad Syukri', time: '30m ago' }]
          : []),
        ...(state === 'Resolved'
          ? [{ id: `t5-${id}`, icon: 'resolved' as const, text: 'Field team verified clearance and resolved incident', actor: 'Field Team Alpha', time: '10m ago' }]
          : []),
      ],
      location: {
        lat: devObj.lat,
        lng: devObj.lng,
        coordinatesText: `${devObj.lat.toFixed(5)}° N, ${devObj.lng.toFixed(5)}° E`,
      },
    });
  }

  return result;
}

export const events: FalconEvent[] = generateEvents();
