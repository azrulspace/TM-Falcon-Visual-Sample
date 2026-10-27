import { mapPoles, mapMarkers } from './map.ts';
import { devices } from './devices.ts';
import { formatId } from '../lib/utils.ts';

export interface FeatureItem {
  id: string; // Formatted ID e.g. AST-001, CBL-001, DEV-001
  rawId: string;
  type: 'pole' | 'span' | 'device';
  name: string;
  status?: 'active' | 'offline' | 'stale' | 'online' | 'maintenance' | 'planned';
  site: string;
  hasLocation: boolean;
  coordinates?: { x: number; y: number } | null;
  detail?: string;
}

// 1. Poles (120 total)
const poles: FeatureItem[] = Array.from({ length: 120 }, (_, i) => {
  const num = i + 1;
  const id = `AST-${String(num).padStart(3, '0')}`;
  const rawId = `AST_${String(num).padStart(3, '0')}`;
  const poleCoord = i < mapPoles.length ? mapPoles[i] : null;
  // A few poles beyond mapped range lack coordinates (showing "No map location")
  const hasLoc = Boolean(poleCoord);

  return {
    id,
    rawId,
    type: 'pole',
    name: `Distribution Pole ${id}`,
    status: 'active',
    site: i < 60 ? 'Teluk Panglima Garang' : 'Kuching Sector',
    hasLocation: hasLoc,
    coordinates: poleCoord ? { x: poleCoord[0], y: poleCoord[1] } : null,
    detail: poleCoord ? `Coordinates: ${poleCoord[0]}, ${poleCoord[1]}` : 'No coordinates surveyed',
  };
});

// 2. Cable Spans (114 total)
const cableSpans: FeatureItem[] = Array.from({ length: 114 }, (_, i) => {
  const num = i + 1;
  const id = `CBL-${String(num).padStart(3, '0')}`;
  const rawId = `CBL_${String(num).padStart(3, '0')}`;
  // Spans without coordinate endpoints appear with "No map location"
  const hasLoc = num <= 85;

  return {
    id,
    rawId,
    type: 'span',
    name: `Fibre Route Span ${id}`,
    status: num % 12 === 0 ? 'maintenance' : 'active',
    site: num <= 57 ? 'Teluk Panglima Garang Trunk' : 'Kuching Feeder Branch',
    hasLocation: hasLoc,
    coordinates: hasLoc ? { x: 340 + ((i * 17) % 360), y: 380 + ((i * 13) % 240) } : null,
    detail: `Single-Mode Fibre • ${(0.8 + (num % 5) * 0.4).toFixed(1)} km`,
  };
});

// 3. Devices (4 primary devices in the active staging area)
const initialDevs: FeatureItem[] = devices.slice(0, 4).map((d) => {
  const m = mapMarkers.find((mk) => mk.id === d.id);
  return {
    id: formatId(d.id),
    rawId: d.id,
    type: 'device',
    name: d.name || d.id,
    status: d.status as any,
    site: d.site,
    hasLocation: Boolean(m),
    coordinates: m ? { x: m.x, y: m.y } : null,
    detail: `${d.type} • ${d.status.toUpperCase()}`,
  };
});

// Total: 120 poles + 114 cable spans + 4 devices = 238 total features
export const allFeatures: FeatureItem[] = [
  ...initialDevs,
  ...poles,
  ...cableSpans,
];

export const featureCounts = {
  total: allFeatures.length, // 238
  poles: poles.length, // 120
  spans: cableSpans.length, // 114
  devices: initialDevs.length, // 4
  attentionDevices: devices.filter((d) => d.status === 'offline' || d.status === 'stale').length, // 4
};
