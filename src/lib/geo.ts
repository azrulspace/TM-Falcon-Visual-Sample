import type { PoleLocation } from '../types/assets.ts';

const EARTH_RADIUS_M = 6371000;

/**
 * Computes great-circle Haversine distance in meters between two WGS84 points.
 */
export function haversineDistanceMeters(a: PoleLocation, b: PoleLocation): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Formats distance cleanly in meters or kilometers.
 */
export function formatDistance(meters: number | null | undefined): string {
  if (meters === null || meters === undefined || Number.isNaN(meters)) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Validates latitude & longitude inputs. Both must be empty (unlocated) or valid WGS84 numbers.
 */
export function validateCoordinatePair(
  latInput: string,
  lngInput: string
): { valid: boolean; location: PoleLocation | null; latError?: string; lngError?: string; summaryError?: string } {
  const latTrim = latInput.trim();
  const lngTrim = lngInput.trim();

  if (!latTrim && !lngTrim) {
    return { valid: true, location: null };
  }

  if (!latTrim || !lngTrim) {
    return {
      valid: false,
      location: null,
      latError: !latTrim ? 'Latitude is required when longitude is entered.' : undefined,
      lngError: !lngTrim ? 'Longitude is required when latitude is entered.' : undefined,
      summaryError: 'Enter both latitude and longitude, or leave both blank.',
    };
  }

  const lat = Number(latTrim);
  const lng = Number(lngTrim);

  let latError: string | undefined;
  let lngError: string | undefined;

  if (Number.isNaN(lat) || lat < -90 || lat > 90) {
    latError = 'Latitude must be a number between -90 and 90.';
  }
  if (Number.isNaN(lng) || lng < -180 || lng > 180) {
    lngError = 'Longitude must be a number between -180 and 180.';
  }

  if (latError || lngError) {
    return {
      valid: false,
      location: null,
      latError,
      lngError,
      summaryError: latError || lngError,
    };
  }

  return {
    valid: true,
    location: {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
    },
  };
}

/**
 * Formats coordinates consistently to 6 decimal places.
 */
export function formatCoordinates(loc: PoleLocation | null | undefined): string {
  if (!loc) return 'Not recorded';
  return `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`;
}

/**
 * Standard Web Mercator projection helpers for 1000x700 SVG map tiles.
 */
export function latLngToWorldPx(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const scale = 256 * Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const clampedSin = Math.max(-0.9999, Math.min(0.9999, sinLat));
  const y = (0.5 - Math.log((1 + clampedSin) / (1 - clampedSin)) / (4 * Math.PI)) * scale;
  return { x, y };
}

export function worldPxToLatLng(worldX: number, worldY: number, zoom: number): PoleLocation {
  const scale = 256 * Math.pow(2, zoom);
  const lng = (worldX / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * worldY) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
  };
}

/**
 * Maps WGS84 lat/lng to SVG (0..1000, 0..700) centered on `center` at `zoom`.
 */
export function projectLatLngToSvg(
  loc: PoleLocation,
  center: PoleLocation,
  zoom = 15
): { x: number; y: number } {
  const cPx = latLngToWorldPx(center.lat, center.lng, zoom);
  const pPx = latLngToWorldPx(loc.lat, loc.lng, zoom);
  return {
    x: 500 + (pPx.x - cPx.x),
    y: 350 + (pPx.y - cPx.y),
  };
}

/**
 * Inverse maps SVG (0..1000, 0..700) back to WGS84 lat/lng centered on `center` at `zoom`.
 */
export function unprojectSvgToLatLng(
  svgX: number,
  svgY: number,
  center: PoleLocation,
  zoom = 15
): PoleLocation {
  const cPx = latLngToWorldPx(center.lat, center.lng, zoom);
  return worldPxToLatLng(cPx.x + (svgX - 500), cPx.y + (svgY - 350), zoom);
}

