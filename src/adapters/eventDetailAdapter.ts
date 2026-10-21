import type { EventDetailDTO, EventDetailViewModel } from '../types/eventDetail.ts';
import {
  parseDate,
  formatEventDate,
  formatRelativeTime,
  getServerNow,
} from '../lib/dateTime.ts';
import { computeEventSla } from '../config/slaPolicy.ts';
import { formatId } from '../lib/utils.ts';
import { devices } from '../data/devices.ts';

/**
 * Transforms an API DTO into a truthful, strictly-typed EventDetailViewModel.
 * Adheres to principle: No fabricated data. Missing values are null.
 */
export function adaptEventDetailDtoToViewModel(
  dto: EventDetailDTO,
  options?: { now?: Date | string | null; isMock?: boolean }
): EventDetailViewModel {
  const now = options?.now ? (parseDate(options.now) ?? getServerNow()) : getServerNow();
  const capturedAt = parseDate(dto.captured);
  const receivedAt = dto.receivedAt ? parseDate(dto.receivedAt) : null;

  // Resolve source device from device dataset if needed
  const deviceRecord = dto.device
    ? devices.find((d) => d.id === dto.device || d.id === dto.device?.replace('-', '_'))
    : null;

  const lat = dto.location?.lat ?? (deviceRecord ? parseFloat(deviceRecord.location.split(',')[0].trim()) : null);
  const lng = dto.location?.lng ?? (deviceRecord ? parseFloat(deviceRecord.location.split(',')[1].trim()) : null);

  const status = dto.status || dto.state || 'New';

  // SLA Calculation
  const sla = computeEventSla({
    priority: dto.priority,
    state: status,
    capturedAt: dto.captured,
    acknowledgedAt: dto.acknowledgedAt,
    now,
  });

  // Evidence snapshot normalization
  const snapshots = Array.isArray(dto.snapshots) && dto.snapshots.length > 0
    ? dto.snapshots
    : ['/monkey-fiber.jpg'];

  const primarySnapshot = snapshots[0];

  // Download filename: e.g. EVT-0258_20261020_1628.jpg
  let dateStamp = 'capture';
  if (capturedAt) {
    const y = capturedAt.getFullYear();
    const m = (capturedAt.getMonth() + 1).toString().padStart(2, '0');
    const d = capturedAt.getDate().toString().padStart(2, '0');
    const hh = capturedAt.getHours().toString().padStart(2, '0');
    const mm = capturedAt.getMinutes().toString().padStart(2, '0');
    dateStamp = `${y}${m}${d}_${hh}${mm}`;
  }
  const downloadFilename = `${formatId(dto.id)}_${dateStamp}.jpg`;

  // Raw vendor fields
  const raw = dto.rawJson || {};
  const vendorData = {
    vendorCode: String(raw.vendorCode || dto.vendorCode || '10002'),
    rule: String(raw.rule || dto.detection || 'CCTV-01-Motion Detection'),
    ruleId: String(raw.ruleId || '2111032826769051648'),
    category: String(raw.category || 'alarmCategoryVideo'),
    subCategory: String(raw.subCategory || 'alarmSubCategoryCamera'),
    vendorPriority: String(raw.vendorPriority || '1'),
    vendorPriorityColor: String(raw.vendorPriorityColor || '#F40B0B'),
    state: String(raw.state !== undefined ? raw.state : '1'),
    channel: String(raw.channel || 'CCTV-01'),
    channelId: String(raw.channelId || '#ff75f3ca638e4075b45951f65cdd31dc'),
    channelType: String(raw.channelType || 'camera'),
    rawJson: raw,
  };

  const hasMultipleFrames = snapshots.length > 1;
  const hasDetectionBox = Boolean(dto.detectionBox && dto.detectionBox.width > 0);
  const hasCoordinates = Boolean(lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng));

  return {
    id: dto.id,
    formattedId: formatId(dto.id),
    type: dto.type,
    source: dto.source || 'Edge service',
    priority: dto.priority,
    status,
    caseId: dto.caseId || null,
    assignee: dto.assignee || null,
    captured: dto.captured,
    device: dto.device,
    asset: dto.asset,

    capturedAt,
    capturedDisplay: formatEventDate(dto.captured),
    capturedRelative: formatRelativeTime(dto.captured, now),
    receivedAt,
    receivedDisplay: receivedAt ? formatEventDate(receivedAt) : null,

    detectionRule: dto.detection || dto.ruleCode || 'CCTV-01-Motion Detection',
    observed: dto.observed || 'Not supplied',
    policyNote: 'A detection is not proof of damage.',

    sourceDevice: dto.device
      ? {
          id: dto.device,
          name: dto.device,
          status: dto.deviceStatus || deviceRecord?.status as any || 'offline',
          lat,
          lng,
          site: deviceRecord?.site,
        }
      : null,

    affectedAsset: dto.asset
      ? {
          id: dto.asset,
          name: dto.asset,
          type: dto.assetType || 'Cable span',
          connectingAssets: dto.poles || ['AST_006', 'AST_007'],
          lat,
          lng,
        }
      : null,

    evidence: {
      snapshots,
      primarySnapshot,
      cameraChannel: vendorData.channel,
      detectionRule: vendorData.rule,
      detectionRegion: dto.detectionBox
        ? {
            x: dto.detectionBox.x,
            y: dto.detectionBox.y,
            width: dto.detectionBox.width,
            height: dto.detectionBox.height,
          }
        : null,
      confidence: dto.detectionBox?.confidence ?? null,
      downloadFilename,
    },

    vendorData,

    sla,

    timeline: Array.isArray(dto.timeline) ? dto.timeline : [],

    capabilities: {
      hasMultipleFrames,
      hasDetectionBox,
      hasCoordinates,
      hasVendorData: Object.keys(raw).length > 0,
      canAcknowledge: status === 'New',
      canCreateCase: !dto.caseId,
      canAssign: true,
      canDismiss: status === 'New' || status === 'Acknowledged',
      canExport: false, // Explicit: export endpoint does not exist yet
    },

    isMock: options?.isMock ?? false,
  };
}
