/**
 * Truthful Date & Time Utilities for FALCON Infrastructure Monitoring.
 * 
 * Enforces single timezone: Asia/Kuala_Lumpur (MYT, UTC+8).
 * Never fabricates values at render time.
 * Enforces non-negative durations.
 */

/**
 * Prototype reference server time matching the application operational state
 * (Wed, 21 Oct 2026 08:37:00 MYT / UTC+8).
 * In production this is adjusted via server time offset or Date header.
 */
export const DEFAULT_SERVER_TIME_ISO = '2026-10-21T08:37:00+08:00';

let serverTimeOffsetMs = 0;
let hasExplicitServerTime = false;

export function setServerTime(serverIsoOrDate: string | Date | number) {
  const serverDate = serverIsoOrDate instanceof Date ? serverIsoOrDate : new Date(serverIsoOrDate);
  if (!isNaN(serverDate.getTime())) {
    serverTimeOffsetMs = serverDate.getTime() - Date.now();
    hasExplicitServerTime = true;
  }
}

/**
 * Returns current server-adjusted Date.
 * If in mock/prototype mode without an active live backend, anchors to DEFAULT_SERVER_TIME_ISO.
 */
export function getServerNow(): Date {
  if (hasExplicitServerTime) {
    return new Date(Date.now() + serverTimeOffsetMs);
  }
  // Prototype default anchor: 21 Oct 2026 08:37:00 MYT
  return new Date(DEFAULT_SERVER_TIME_ISO);
}

/**
 * Parses timestamp string or number into a valid Date object in Asia/Kuala_Lumpur (MYT).
 * Handles ISO-8601 with timezone offsets, standard timestamps, or "Oct 20, 2026, 4:28 PM".
 * Returns null if input is missing or unparseable (NEVER fabricates a Date at render time).
 */
export function parseDate(dateInput: string | number | Date | null | undefined): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  if (typeof dateInput === 'number') {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  }

  const str = String(dateInput).trim();
  if (!str || str === '—' || str.toLowerCase() === 'not supplied') return null;

  // 1. Explicit ISO with timezone (Z or +/-HH:MM)
  if (/[T\s]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})/i.test(str)) {
    const directDate = new Date(str);
    if (!isNaN(directDate.getTime())) {
      return directDate;
    }
  }

  // 2. Parse "Oct 20, 2026, 4:28 PM" or "Oct 20, 2026, 16:28:00" in MYT (+08:00)
  const regex12h = /^([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i;
  const match12h = str.match(regex12h);
  if (match12h) {
    const [, monthStr, day, year, hourStr, minStr, secStr, meridiem] = match12h;
    const months: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const mm = months[monthStr.toLowerCase()];
    if (mm) {
      let hh = parseInt(hourStr, 10);
      if (meridiem) {
        if (meridiem.toUpperCase() === 'PM' && hh < 12) hh += 12;
        if (meridiem.toUpperCase() === 'AM' && hh === 12) hh = 0;
      }
      const iso = `${year}-${mm}-${day.padStart(2, '0')}T${hh.toString().padStart(2, '0')}:${minStr.padStart(2, '0')}:${(secStr || '00').padStart(2, '0')}+08:00`;
      const parsed = new Date(iso);
      if (!isNaN(parsed.getTime())) return parsed;
    }
  }

  // 3. Fallback ISO format without timezone e.g. "2026-10-20 16:28:14" -> treat as MYT (+08:00)
  const regexIsoNoTz = /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})$/;
  const matchIsoNoTz = str.match(regexIsoNoTz);
  if (matchIsoNoTz) {
    const [, year, month, day, hour, min, sec] = matchIsoNoTz;
    const iso = `${year}-${month}-${day}T${hour}:${min}:${sec}+08:00`;
    const parsed = new Date(iso);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // 4. Try generic Date constructor as last resort if valid
  const fallback = new Date(str);
  if (!isNaN(fallback.getTime())) {
    return fallback;
  }

  return null;
}

export interface RelativeTimeCalculation {
  text: string;
  isClockMismatch: boolean;
  isFuture: boolean;
  diffMinutes: number;
  formattedAbsolute: string;
}

/**
 * Computes truthful relative time against server reference time.
 * Enforces non-negative durations. If > 60s in the future, flags clock mismatch.
 */
export function getRelativeTimeCalculation(
  dateInput: string | number | Date | null | undefined,
  nowInput?: string | number | Date | null
): RelativeTimeCalculation {
  if (!dateInput) {
    return {
      text: '—',
      isClockMismatch: false,
      isFuture: false,
      diffMinutes: 0,
      formattedAbsolute: '—',
    };
  }

  const date = parseDate(dateInput);
  if (!date) {
    return {
      text: String(dateInput),
      isClockMismatch: false,
      isFuture: false,
      diffMinutes: 0,
      formattedAbsolute: String(dateInput),
    };
  }

  const now = nowInput ? (parseDate(nowInput) ?? getServerNow()) : getServerNow();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const formattedAbsolute = formatAbsoluteMYT(date);

  // If event is more than 60 seconds in future
  if (diffSeconds < -60) {
    return {
      text: 'Clock mismatch',
      isClockMismatch: true,
      isFuture: true,
      diffMinutes: 0,
      formattedAbsolute,
    };
  }

  // If recent within 60 seconds (or slightly negative up to 60s due to slight jitter)
  if (diffSeconds < 60) {
    return {
      text: 'Just now',
      isClockMismatch: false,
      isFuture: false,
      diffMinutes: 0,
      formattedAbsolute,
    };
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 60) {
    return {
      text: `${diffMinutes}m ago`,
      isClockMismatch: false,
      isFuture: false,
      diffMinutes,
      formattedAbsolute,
    };
  }

  if (diffHours < 24) {
    const remainMin = diffMinutes % 60;
    const text = remainMin > 0 ? `${diffHours}h ${remainMin}m ago` : `${diffHours}h ago`;
    return {
      text,
      isClockMismatch: false,
      isFuture: false,
      diffMinutes,
      formattedAbsolute,
    };
  }

  return {
    text: `${diffDays}d ago`,
    isClockMismatch: false,
    isFuture: false,
    diffMinutes,
    formattedAbsolute,
  };
}

/**
 * Returns string relative time e.g. "16h ago", "12m ago", "Just now", or "Clock mismatch".
 */
export function formatRelativeTime(
  dateInput: string | number | Date | null | undefined,
  nowInput?: string | number | Date | null
): string {
  return getRelativeTimeCalculation(dateInput, nowInput).text;
}

/**
 * Formats absolute date and time in Asia/Kuala_Lumpur (MYT).
 * e.g. "20 Oct 2026, 16:28:00 MYT"
 */
export function formatAbsoluteMYT(
  dateInput: string | number | Date | null | undefined,
  options?: { showSeconds?: boolean }
): string {
  if (!dateInput) return '—';
  const date = parseDate(dateInput);
  if (!date) return '—';

  const parts = new Intl.DateTimeFormat('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: options?.showSeconds !== false ? '2-digit' : undefined,
    hour12: false,
    timeZone: 'Asia/Kuala_Lumpur',
  }).format(date);

  return `${parts} MYT`;
}

/**
 * Standard date display format matching LIVE_STAGING:
 * e.g. "Oct 20, 2026, 4:28 PM"
 */
export function formatEventDate(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '—';
  const date = parseDate(dateInput);
  if (!date) return '—';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kuala_Lumpur',
  }).format(date);
}
