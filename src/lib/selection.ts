import { formatId } from './utils.ts';
import { events, type FalconEvent } from '../data/events.ts';
import { devices } from '../data/devices.ts';
import { mapMarkers, mapPoles } from '../data/map.ts';
import { segments } from '../data/segments.ts';
import { cases } from '../data/cases.ts';
import type { FalconCase } from '../types/cases.ts';

export type EntityType = 'event' | 'device' | 'pole' | 'span' | 'case';

export interface SelectedEntity {
  type: EntityType;
  id: string; // Formatted ID e.g. DEV-001, EVT-0010
  rawId: string; // Original ID e.g. DEV_001
}

export interface ResolvedEntityData {
  type: EntityType;
  id: string;
  rawId: string;
  title: string;
  subtitle?: string;
  coordinates?: { x: number; y: number; lat?: number; lng?: number } | null;
  hasLocation: boolean;
  event?: FalconEvent | null;
  device?: (typeof devices)[0] | null;
  caseItem?: FalconCase | null;
  pole?: { id: string; x: number; y: number } | null;
  span?: (typeof segments)[0] | null;
  relatedSpanId?: string | null;
  deviceStatus?: 'online' | 'offline' | 'stale';
  deviceSerial?: string | null;
  status?: string;
  name?: string;
  site?: string;
  data?: Record<string, any>;
}

export type ResolvedEntity = ResolvedEntityData;

export function parseSelectionFromUrl(search: string): { type: EntityType; id: string } | null {
  try {
    const params = new URLSearchParams(search);
    const typeParam = params.get('type') || params.get('layer');
    const idParam = params.get('id');

    if (!idParam) return null;

    let type: EntityType = 'device';
    if (typeParam) {
      const lower = typeParam.toLowerCase();
      if (lower.startsWith('event')) type = 'event';
      else if (lower.startsWith('device')) type = 'device';
      else if (lower.startsWith('pole')) type = 'pole';
      else if (lower.startsWith('span') || lower.startsWith('cable')) type = 'span';
      else if (lower.startsWith('case')) type = 'case';
    } else {
      // Inferred from ID prefix
      const idUpper = idParam.toUpperCase();
      if (idUpper.startsWith('EVT')) type = 'event';
      else if (idUpper.startsWith('DEV')) type = 'device';
      else if (idUpper.startsWith('AST') || idUpper.startsWith('POL')) type = 'pole';
      else if (idUpper.startsWith('CBL')) type = 'span';
      else if (idUpper.startsWith('CAS')) type = 'case';
    }

    return { type, id: formatId(idParam) };
  } catch {
    return null;
  }
}

export function buildSelectionQueryString(type: EntityType | null, id: string | null): string {
  if (!id) return '';
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  params.set('type', type || 'device');
  params.set('id', formatId(id));
  return params.toString();
}

/**
 * Resolves full entity details and coordinates across datasets.
 */
export function resolveEntityData(type: EntityType, id: string): ResolvedEntityData {
  const normId = formatId(id);
  const rawId = id.replace(/-/g, '_');

  let coordinates: { x: number; y: number; lat?: number; lng?: number } | null = null;
  let hasLocation = true;
  let title = normId;
  let subtitle: string | undefined;
  let relatedSpanId: string | null = null;

  let eventMatch: FalconEvent | null = null;
  let devMatch: (typeof devices)[0] | null = null;
  let caseMatch: FalconCase | null = null;
  let poleMatch: { id: string; x: number; y: number } | null = null;
  let spanMatch: (typeof segments)[0] | null = null;
  let deviceStatus: 'online' | 'offline' | 'stale' = 'online';
  let deviceSerial: string | null = null;

  switch (type) {
    case 'event': {
      eventMatch = events.find((e) => formatId(e.id) === normId) || null;
      if (eventMatch) {
        title = eventMatch.type;
        subtitle = `Captured ${eventMatch.captured}`;
        relatedSpanId = eventMatch.asset;

        // Resolve device for serial and status
        if (eventMatch.device) {
          const dev = devices.find((d) => formatId(d.id) === formatId(eventMatch!.device!));
          if (dev) {
            devMatch = dev;
            deviceStatus = dev.status as any;
            deviceSerial = dev.serial;
          }
        }

        // Coordinates from event or device marker
        if (eventMatch.location) {
          const m = mapMarkers.find((mk) => formatId(mk.id) === formatId(eventMatch!.device || ''));
          coordinates = {
            x: m?.x || 295,
            y: m?.y || 355,
            lat: eventMatch.location.lat,
            lng: eventMatch.location.lng,
          };
        } else if (eventMatch.device) {
          const m = mapMarkers.find((mk) => formatId(mk.id) === formatId(eventMatch!.device!));
          if (m) {
            coordinates = { x: m.x, y: m.y };
          }
        }

        // Check if explicitly unlocated (e.g. EVT-0007)
        if (eventMatch.id === 'EVT-0007' || normId === 'EVT-0007' || !coordinates) {
          hasLocation = false;
          coordinates = null;
        }
      } else {
        hasLocation = false;
      }
      break;
    }

    case 'device': {
      devMatch = devices.find((d) => formatId(d.id) === normId || d.id === rawId) || null;
      if (devMatch) {
        title = normId;
        subtitle = `${devMatch.type} • ${devMatch.site}`;
        deviceStatus = devMatch.status as any;
        deviceSerial = devMatch.serial;

        const m = mapMarkers.find((mk) => formatId(mk.id) === normId || mk.id === rawId);
        if (m) {
          coordinates = { x: m.x, y: m.y };
        } else if (devMatch.location) {
          const [latStr, lngStr] = devMatch.location.split(',').map((s) => s.trim());
          coordinates = { x: 300, y: 350, lat: parseFloat(latStr), lng: parseFloat(lngStr) };
        }
      } else {
        hasLocation = false;
      }
      break;
    }

    case 'pole': {
      title = normId;
      subtitle = 'Utility Distribution Pole';
      const numMatch = id.match(/\d+/);
      const poleIndex = numMatch ? parseInt(numMatch[0], 10) - 1 : -1;
      if (poleIndex >= 0 && poleIndex < mapPoles.length) {
        const pt = mapPoles[poleIndex];
        poleMatch = { id: normId, x: pt[0], y: pt[1] };
        coordinates = { x: pt[0], y: pt[1] };
      } else {
        // Fallback search in segments
        const seg = segments.find((s) => formatId(s.from) === normId || formatId(s.to) === normId);
        if (seg && seg.path && seg.path.length > 0) {
          const pt = seg.path[0];
          poleMatch = { id: normId, x: pt[0], y: pt[1] };
          coordinates = { x: pt[0], y: pt[1] };
        } else {
          hasLocation = false;
        }
      }
      break;
    }

    case 'span': {
      spanMatch = segments.find((s) => formatId(s.id) === normId || s.id === rawId) || null;
      title = normId;
      subtitle = 'Single-Mode Fibre Span';
      relatedSpanId = normId;
      coordinates = { x: 340, y: 380 };
      break;
    }

    case 'case': {
      caseMatch = cases.find((c) => formatId(c.id) === normId || c.id === rawId) || null;
      if (caseMatch) {
        title = caseMatch.title;
        subtitle = `Case ${normId} • ${caseMatch.status}`;
        if (caseMatch.sourceEventId) {
          const srcEvt = events.find((e) => formatId(e.id) === formatId(caseMatch!.sourceEventId!));
          if (srcEvt && srcEvt.device) {
            const m = mapMarkers.find((mk) => formatId(mk.id) === formatId(srcEvt.device!));
            if (m) coordinates = { x: m.x, y: m.y };
          }
        }
      } else {
        hasLocation = false;
      }
      break;
    }
  }

  return {
    type,
    id: normId,
    rawId,
    title,
    subtitle,
    coordinates,
    hasLocation: Boolean(hasLocation && coordinates),
    event: eventMatch,
    device: devMatch,
    caseItem: caseMatch,
    pole: poleMatch,
    span: spanMatch,
    relatedSpanId,
    deviceStatus,
    deviceSerial,
  };
}
