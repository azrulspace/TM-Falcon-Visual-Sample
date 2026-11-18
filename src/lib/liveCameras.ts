import type { DeviceWithRelations } from '@/types/devices';
import type { LiveCameraCapabilities } from '@/types/live';
import type { FalconEvent } from '@/data/events';
import type { PoleRecord } from '@/types/assets';

/**
 * Pure function to resolve default camera ID:
 * 1. Last viewed camera from localStorage (if valid)
 * 2. Otherwise, first camera that is Online
 * 3. Otherwise, first camera in the list
 */
export function getDefaultCameraId(
  cameras: { identifier: string; connectivityState: string }[],
  storedId?: string | null
): string {
  if (storedId && cameras.some((c) => c.identifier === storedId)) {
    return storedId;
  }
  const firstOnline = cameras.find((c) => c.connectivityState === 'online');
  if (firstOnline) return firstOnline.identifier;
  return cameras[0]?.identifier || 'DEV-001';
}

/**
 * Filter camera devices only (exclude standalone speakers and sensors).
 */
export function filterCamerasOnly<T extends { type: string }>(devices: T[]): T[] {
  return devices.filter((d) => d.type === 'Camera');
}

/**
 * Derives camera streaming capabilities from device record.
 */
export function getCameraCapabilities(device: DeviceWithRelations | null | undefined): LiveCameraCapabilities {
  if (!device) {
    return {
      supportsVideo: true,
      supportsAudio: true,
      supportsTalk: false,
      supportsPtz: false,
      supportsPresets: false,
      supportsZoom: false,
      isMobileData: false,
    };
  }

  const comps: string[] = (device.components || []).map((c: string) => c.toLowerCase());
  const model = (device.model || '').toLowerCase();
  const lib = (device.library || '').toLowerCase();

  const is4G = model.includes('4g') || comps.some((c: string) => c.includes('4g') || c.includes('solar'));
  const hasPtz =
    comps.some((c: string) => c.includes('ptz') || c.includes('pan') || c.includes('tilt')) ||
    model.includes('ptz') ||
    device.identifier === 'DEV-001'; // Staging DEV-001 has PTZ demonstrated

  const hasTalk =
    comps.some((c: string) => c.includes('speaker') || c.includes('mic') || c.includes('audio') || c.includes('talk')) ||
    lib.includes('hik') ||
    device.identifier === 'DEV-001';

  return {
    supportsVideo: true,
    supportsAudio: true,
    supportsTalk: hasTalk,
    supportsPtz: hasPtz,
    supportsPresets: hasPtz,
    supportsZoom: hasPtz,
    isMobileData: is4G,
  };
}

/**
 * Filter top 5 recent events from this camera.
 */
export function getRecentEventsForCamera(
  events: FalconEvent[],
  cameraIdentifier: string,
  limit = 5
): FalconEvent[] {
  if (!cameraIdentifier) return [];
  const normalizedId = cameraIdentifier.toLowerCase().trim();
  return events
    .filter((e) => {
      const dev = (e.device || (e as any).sourceDevice?.id || '').toLowerCase().trim();
      return dev === normalizedId;
    })
    .slice(0, limit);
}

/**
 * Resolve installed pole record.
 */
export function getPoleForCamera(
  poles: PoleRecord[],
  installedPoleId: string | null | undefined
): PoleRecord | null {
  if (!installedPoleId) return null;
  const normalized = installedPoleId.toLowerCase().trim();
  return (
    poles.find(
      (p) =>
        p.identifier.toLowerCase().trim() === normalized ||
        (p.name && p.name.toLowerCase().trim() === normalized)
    ) || null
  );
}
