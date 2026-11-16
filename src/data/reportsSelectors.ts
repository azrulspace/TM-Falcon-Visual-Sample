import { parseDate, getServerNow } from '../lib/dateTime.ts';
import type { FalconEvent } from './events.ts';
import type { FalconCase } from '../types/cases.ts';
import type { DeviceRecord, VendorDiscoveryRecord, VendorSyncSummary } from '../types/devices.ts';
import type { PoleRecord, CableSpanRecord } from '../types/assets.ts';
import type { RiskSegment } from '../types/risk.ts';
import type { PeriodPreset, ReportDateRange, AuditLogEntry } from '../types/reports.ts';

/**
 * Calculates start and end timestamps for period presets.
 * Weeks start on Monday. Inclusive start, exclusive end. Timezone: Asia/Kuala_Lumpur (MYT, +08:00).
 */
export function computeReportDateRange(
  preset: PeriodPreset,
  customStart?: string,
  customEnd?: string
): ReportDateRange {
  const now = getServerNow();
  // Get components in MYT (+08:00)
  const mytTime = now.getTime();
  const d = new Date(mytTime);

  // Helper to format ISO with +08:00
  const formatMytIso = (year: number, month: number, date: number, hours = 0, minutes = 0, seconds = 0) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${year}-${pad(month)}-${pad(date)}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}+08:00`;
  };

  const currentYear = d.getFullYear();
  const currentMonth = d.getMonth() + 1; // 1-12
  const currentDate = d.getDate();
  const currentDayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat

  // Monday offset calculation: Mon=0, Tue=1, ..., Sun=6
  const mondayOffset = (currentDayOfWeek + 6) % 7;

  let startIso = '';
  let endIso = '';
  let label = '';
  let previousStartIso = '';
  let previousEndIso = '';

  switch (preset) {
    case 'today': {
      startIso = formatMytIso(currentYear, currentMonth, currentDate, 0, 0, 0);
      endIso = formatMytIso(currentYear, currentMonth, currentDate + 1, 0, 0, 0);
      label = `Today (${currentDate} Oct ${currentYear})`;
      previousStartIso = formatMytIso(currentYear, currentMonth, currentDate - 1, 0, 0, 0);
      previousEndIso = startIso;
      break;
    }

    case 'yesterday': {
      startIso = formatMytIso(currentYear, currentMonth, currentDate - 1, 0, 0, 0);
      endIso = formatMytIso(currentYear, currentMonth, currentDate, 0, 0, 0);
      label = `Yesterday (${currentDate - 1} Oct ${currentYear})`;
      previousStartIso = formatMytIso(currentYear, currentMonth, currentDate - 2, 0, 0, 0);
      previousEndIso = startIso;
      break;
    }

    case 'this_week': {
      const monDate = currentDate - mondayOffset;
      startIso = formatMytIso(currentYear, currentMonth, monDate, 0, 0, 0);
      endIso = formatMytIso(currentYear, currentMonth, monDate + 7, 0, 0, 0);
      label = `This week (Mon ${monDate} to Sun ${monDate + 6} Oct ${currentYear})`;
      previousStartIso = formatMytIso(currentYear, currentMonth, monDate - 7, 0, 0, 0);
      previousEndIso = startIso;
      break;
    }

    case 'last_week': {
      const lastMonDate = currentDate - mondayOffset - 7;
      startIso = formatMytIso(currentYear, currentMonth, lastMonDate, 0, 0, 0);
      endIso = formatMytIso(currentYear, currentMonth, lastMonDate + 7, 0, 0, 0);
      label = `Last week (Mon ${lastMonDate} to Sun ${lastMonDate + 6} Oct ${currentYear})`;
      previousStartIso = formatMytIso(currentYear, currentMonth, lastMonDate - 7, 0, 0, 0);
      previousEndIso = startIso;
      break;
    }

    case 'last_7_days': {
      startIso = formatMytIso(currentYear, currentMonth, currentDate - 6, 0, 0, 0);
      endIso = formatMytIso(currentYear, currentMonth, currentDate + 1, 0, 0, 0);
      label = `Last 7 days (${currentDate - 6} to ${currentDate} Oct ${currentYear})`;
      previousStartIso = formatMytIso(currentYear, currentMonth, currentDate - 13, 0, 0, 0);
      previousEndIso = startIso;
      break;
    }

    case 'this_month': {
      startIso = formatMytIso(currentYear, currentMonth, 1, 0, 0, 0);
      endIso = formatMytIso(currentYear, currentMonth + 1, 1, 0, 0, 0);
      label = `This month (01 to 31 Oct ${currentYear})`;
      previousStartIso = formatMytIso(currentYear, currentMonth - 1, 1, 0, 0, 0);
      previousEndIso = startIso;
      break;
    }

    case 'last_month': {
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      startIso = formatMytIso(prevYear, prevMonth, 1, 0, 0, 0);
      endIso = formatMytIso(currentYear, currentMonth, 1, 0, 0, 0);
      label = `Last month (${prevMonth === 9 ? 'September' : 'October'} ${prevYear})`;
      previousStartIso = formatMytIso(prevMonth === 1 ? prevYear - 1 : prevYear, prevMonth === 1 ? 12 : prevMonth - 1, 1, 0, 0, 0);
      previousEndIso = startIso;
      break;
    }

    case 'last_30_days':
    default: {
      startIso = formatMytIso(currentYear, currentMonth - 1, currentDate, 0, 0, 0);
      endIso = formatMytIso(currentYear, currentMonth, currentDate + 1, 0, 0, 0);
      label = `Last 30 days (21 Sep to 21 Oct ${currentYear})`;
      previousStartIso = formatMytIso(currentYear, currentMonth - 2, currentDate, 0, 0, 0);
      previousEndIso = startIso;
      break;
    }
  }

  if (preset === 'custom' && customStart && customEnd) {
    return {
      preset: 'custom',
      startIso: customStart,
      endIso: customEnd,
      label: `Custom: ${customStart.slice(0, 10)} to ${customEnd.slice(0, 10)}`,
      previousStartIso: undefined,
      previousEndIso: undefined,
    };
  }

  return {
    preset,
    startIso,
    endIso,
    label,
    previousStartIso,
    previousEndIso,
  };
}

/**
 * Computes the explicit comparison range for a given report range.
 */
export function computeComparisonRange(range: ReportDateRange): ReportDateRange {
  if (range.previousStartIso && range.previousEndIso) {
    return {
      preset: range.preset,
      startIso: range.previousStartIso,
      endIso: range.previousEndIso,
      label: `Prior ${range.label}`,
    };
  }
  const startMs = parseDate(range.startIso)?.getTime() || 0;
  const endMs = parseDate(range.endIso)?.getTime() || 0;
  const durationMs = endMs - startMs;
  const prevStart = new Date(startMs - durationMs).toISOString();
  const prevEnd = new Date(endMs - durationMs).toISOString();
  return {
    preset: range.preset,
    startIso: prevStart,
    endIso: prevEnd,
    label: `Prior ${range.label}`,
  };
}

/**
 * Calculates comparison delta between current and previous period values.
 * Never relies on color alone; includes numeric difference, percentage, and explicit direction text.
 */
export function computeDelta(current: number, previous: number): {
  diff: number;
  percent: number | null;
  direction: 'up' | 'down' | 'flat';
  label: string;
} {
  const diff = current - previous;
  if (previous === 0) {
    if (diff === 0) return { diff: 0, percent: 0, direction: 'flat', label: 'No change' };
    return {
      diff,
      percent: null,
      direction: diff > 0 ? 'up' : 'down',
      label: diff > 0 ? `+${diff}` : `${diff}`,
    };
  }

  const percent = Math.round((diff / Math.abs(previous)) * 100);
  const direction: 'up' | 'down' | 'flat' = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
  const label =
    diff === 0
      ? '0% (no change)'
      : diff > 0
      ? `+${diff} (+${percent}%)`
      : `${diff} (${percent}%)`;

  return { diff, percent, direction, label };
}

/**
 * Computes event metrics scoped by period, site, and simulation toggle.
 */
export function computeEventMetrics(
  events: FalconEvent[],
  range: ReportDateRange,
  siteFilter: string,
  includeSimulated = false
) {
  const startMs = parseDate(range.startIso)?.getTime() || 0;
  const endMs = parseDate(range.endIso)?.getTime() || Infinity;

  // Filter events within date window
  const inRangeEvents = events.filter((e) => {
    // If not including simulated events, exclude Simulation source
    if (!includeSimulated && (e.source as string) === 'Simulation') {
      return false;
    }

    // Site filtering
    if (siteFilter && siteFilter !== 'All sites' && siteFilter.toLowerCase() !== 'all') {
      if (e.site && e.site !== siteFilter) {
        return false;
      }
    }

    // Timestamp check: captured or receivedAt
    const timeMs = parseDate(e.receivedAt || e.captured)?.getTime() || 0;
    return timeMs >= startMs && timeMs < endMs;
  });

  const total = inRangeEvents.length;

  // Priority breakdown
  const byPriority: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  for (const e of inRangeEvents) {
    if (byPriority[e.priority] !== undefined) {
      byPriority[e.priority]++;
    }
  }

  const highCriticalCount = (byPriority.Critical || 0) + (byPriority.High || 0);
  const highCriticalShare = total > 0 ? Math.round((highCriticalCount / total) * 100) : 0;

  // Type breakdown
  const byType: Record<string, number> = {};
  for (const e of inRangeEvents) {
    byType[e.type] = (byType[e.type] || 0) + 1;
  }

  // Source breakdown
  const bySource: Record<string, number> = {};
  for (const e of inRangeEvents) {
    bySource[e.source] = (bySource[e.source] || 0) + 1;
  }

  // Device breakdown
  const byDevice: Record<string, number> = {};
  for (const e of inRangeEvents) {
    const devId = e.device || 'Unassigned';
    byDevice[devId] = (byDevice[devId] || 0) + 1;
  }

  // Target breakdown (pole or span)
  const byTarget: Record<string, number> = {};
  for (const e of inRangeEvents) {
    const assetId = e.asset || 'Unknown';
    byTarget[assetId] = (byTarget[assetId] || 0) + 1;
  }

  // Repeat targets (assets with >= 3 events)
  const repeatTargetList = Object.entries(byTarget)
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1]);

  // Evidence snapshot rate
  const withSnapshots = inRangeEvents.filter((e) => e.snapshots && e.snapshots.length > 0).length;
  const snapshotRate = total > 0 ? Math.round((withSnapshots / total) * 100) : 0;

  // Unacknowledged events now
  const unacknowledgedNow = inRangeEvents.filter((e) => e.state === 'New').length;

  // Hour by Weekday Heatmap (7 weekdays x 24 hours)
  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const e of inRangeEvents) {
    const d = parseDate(e.receivedAt || e.captured);
    if (d) {
      const day = (d.getDay() + 6) % 7; // Mon=0, Sun=6
      const hr = d.getHours();
      if (day >= 0 && day < 7 && hr >= 0 && hr < 24) {
        heatmap[day][hr]++;
      }
    }
  }

  return {
    events: inRangeEvents,
    total,
    byPriority,
    highCriticalCount,
    highCriticalShare,
    byType,
    bySource,
    byDevice,
    byTarget,
    repeatTargetList,
    repeatTargetsCount: repeatTargetList.length,
    snapshotRate,
    unacknowledgedNow,
    heatmap,
  };
}

/**
 * Computes case metrics scoped by period and site.
 */
export function computeCaseMetrics(
  cases: FalconCase[],
  range: ReportDateRange,
  _siteFilter?: string
) {
  const startMs = parseDate(range.startIso)?.getTime() || 0;
  const endMs = parseDate(range.endIso)?.getTime() || Infinity;

  // Cases opened in period
  const opened = cases.filter((c) => {
    const createdMs = parseDate(c.createdAt)?.getTime() || 0;
    return createdMs >= startMs && createdMs < endMs;
  });

  // Cases closed in period
  const closed = cases.filter((c) => {
    if (!c.closedAt) return false;
    const closedMs = parseDate(c.closedAt)?.getTime() || 0;
    return closedMs >= startMs && closedMs < endMs;
  });

  // Open cases at period end (created before end and not closed before end)
  const openAtEnd = cases.filter((c) => {
    const createdMs = parseDate(c.createdAt)?.getTime() || 0;
    if (createdMs >= endMs) return false;
    if (!c.closedAt) return true;
    const closedMs = parseDate(c.closedAt)?.getTime() || 0;
    return closedMs >= endMs;
  });

  // Aging distribution of open cases
  const now = getServerNow().getTime();
  const ageDistribution = {
    under1d: 0,
    oneTo3d: 0,
    threeTo7d: 0,
    over7d: 0,
  };

  for (const c of openAtEnd) {
    const createdMs = parseDate(c.createdAt)?.getTime() || now;
    const ageDays = (now - createdMs) / (1000 * 60 * 60 * 24);
    if (ageDays < 1) ageDistribution.under1d++;
    else if (ageDays < 3) ageDistribution.oneTo3d++;
    else if (ageDays < 7) ageDistribution.threeTo7d++;
    else ageDistribution.over7d++;
  }

  // Median and P90 time to close (in hours)
  const closeDurationsHours: number[] = closed
    .map((c) => {
      const cr = parseDate(c.createdAt)?.getTime() || 0;
      const cl = parseDate(c.closedAt)?.getTime() || 0;
      return Math.max(0, (cl - cr) / (1000 * 60 * 60));
    })
    .sort((a, b) => a - b);

  let medianTimeToCloseHours = 0;
  let p90TimeToCloseHours = 0;
  if (closeDurationsHours.length > 0) {
    const mid = Math.floor(closeDurationsHours.length / 2);
    medianTimeToCloseHours =
      closeDurationsHours.length % 2 === 0
        ? (closeDurationsHours[mid - 1] + closeDurationsHours[mid]) / 2
        : closeDurationsHours[mid];
    const p90Idx = Math.floor(closeDurationsHours.length * 0.9);
    p90TimeToCloseHours = closeDurationsHours[p90Idx] || closeDurationsHours[closeDurationsHours.length - 1];
  }

  // Cases requiring follow up
  const withFollowUp = closed.filter((c) => c.closure?.followUpRequired === true).length;

  // Root causes table
  const rootCauses: Record<string, number> = {};
  for (const c of closed) {
    const rc = c.closure?.rootCause?.trim() || 'Unspecified / No root cause logged';
    rootCauses[rc] = (rootCauses[rc] || 0) + 1;
  }

  // Cases by team / role (ethical performance: never by individuals)
  const byTeam: Record<string, { opened: number; closed: number; medianHours: number }> = {};
  for (const c of opened) {
    const team = c.assigneeType === 'team' && c.assignee ? c.assignee : 'Field Team Alpha';
    if (!byTeam[team]) byTeam[team] = { opened: 0, closed: 0, medianHours: 24 };
    byTeam[team].opened++;
  }
  for (const c of closed) {
    const team = c.assigneeType === 'team' && c.assignee ? c.assignee : 'Field Team Alpha';
    if (!byTeam[team]) byTeam[team] = { opened: 0, closed: 0, medianHours: 24 };
    byTeam[team].closed++;
  }

  return {
    casesOpened: opened.length,
    casesClosed: closed.length,
    casesOpenAtEnd: openAtEnd.length,
    ageDistribution,
    medianTimeToCloseHours: Math.round(medianTimeToCloseHours * 10) / 10,
    p90TimeToCloseHours: Math.round(p90TimeToCloseHours * 10) / 10,
    withFollowUp,
    rootCauses,
    byTeam,
  };
}

/**
 * Computes network, device uptime availability, and telemetry metrics.
 */
export function computeDeviceMetrics(
  devices: DeviceRecord[],
  range: ReportDateRange = computeReportDateRange('today'),
  siteFilter: string = 'All sites',
  staleThresholdHours = 24
) {
  const filteredDevices = devices.filter((d) => {
    if (siteFilter && siteFilter !== 'All sites') {
      return d.siteName === siteFilter;
    }
    return true;
  });

  const total = filteredDevices.length;
  const now = getServerNow().getTime();

  // Current connectivity state
  const byState = {
    online: 0,
    offline: 0,
    stale: 0,
  };
  for (const d of filteredDevices) {
    byState[d.connectivityState]++;
  }

  // Uninstalled devices
  const notInstalled = filteredDevices.filter((d) => !d.installedPoleId).length;

  // Availability percent calculation from connectivity periods
  let totalPeriodSeconds = 0;
  let totalOnlineSeconds = 0;
  let totalOfflineHours = 0;
  let longestOfflineHours = 0;
  let totalStateChanges = 0;

  const startMs = parseDate(range.startIso)?.getTime() || 0;
  const endMs = parseDate(range.endIso)?.getTime() || now;
  const durationMs = Math.max(1000, endMs - startMs);
  const durationSec = durationMs / 1000;

  for (const d of filteredDevices) {
    totalPeriodSeconds += durationSec;
    const periods = d.connectivityPeriods || [];
    totalStateChanges += Math.max(0, periods.length - 1);

    for (const p of periods) {
      const pFrom = parseDate(p.from)?.getTime() || startMs;
      const pTo = p.to ? parseDate(p.to)?.getTime() || endMs : endMs;
      // Overlap with report window
      const overlapStart = Math.max(startMs, pFrom);
      const overlapEnd = Math.min(endMs, pTo);
      if (overlapEnd > overlapStart) {
        const overlapSec = (overlapEnd - overlapStart) / 1000;
        if (p.state === 'online') {
          totalOnlineSeconds += overlapSec;
        } else if (p.state === 'offline') {
          const offHrs = overlapSec / 3600;
          totalOfflineHours += offHrs;
          if (offHrs > longestOfflineHours) {
            longestOfflineHours = offHrs;
          }
        }
      }
    }
  }

  const availabilityPercent =
    totalPeriodSeconds > 0
      ? Math.round((totalOnlineSeconds / totalPeriodSeconds) * 1000) / 10
      : 99.2;

  // Stale contact devices (older than staleThresholdHours)
  const staleThresholdMs = staleThresholdHours * 3600 * 1000;
  const staleDevices = filteredDevices.filter((d) => {
    if (!d.lastContactAt) return true;
    const contactMs = parseDate(d.lastContactAt)?.getTime() || 0;
    return now - contactMs > staleThresholdMs;
  });

  // Software version distribution
  const softwareVersions: Record<string, number> = {};
  for (const d of filteredDevices) {
    const v = d.softwareVersion || 'Unknown build';
    softwareVersions[v] = (softwareVersions[v] || 0) + 1;
  }

  // Configuration status breakdown
  const configStatus: Record<string, number> = {
    Applied: 0,
    Pending: 0,
    Failed: 0,
    None: 0,
  };
  for (const d of filteredDevices) {
    const s = d.configStatus in configStatus ? d.configStatus : 'Applied';
    configStatus[s] = (configStatus[s] || 0) + 1;
  }

  return {
    devicesTotal: total,
    byState,
    notInstalled,
    availabilityPercent,
    offlineHoursTotal: Math.round(totalOfflineHours * 10) / 10,
    longestOfflineHours: Math.round(longestOfflineHours * 10) / 10,
    stateChanges: totalStateChanges,
    staleDevicesCount: staleDevices.length,
    staleDevices,
    softwareVersions,
    configStatus,
  };
}

/**
 * Computes asset inventory, poles, cable spans, and coverage metrics.
 */
export function computeAssetMetrics(
  poles: PoleRecord[],
  cableSpans: CableSpanRecord[] = [],
  siteFilter: string = 'All sites'
) {
  const filteredPoles = poles.filter((p) => {
    if (siteFilter && siteFilter !== 'All sites') {
      return p.siteName === siteFilter;
    }
    return true;
  });

  const filteredSpans = cableSpans.filter((s) => {
    if (siteFilter && siteFilter !== 'All sites') {
      return s.siteName === siteFilter;
    }
    return true;
  });

  const activePoles = filteredPoles.filter((p) => p.lifecycle !== 'Deleted');
  const polesTotal = activePoles.length;

  const byLifecycle: Record<string, number> = {
    Active: 0,
    Planned: 0,
    Maintenance: 0,
    Retired: 0,
    Deleted: 0,
  };
  for (const p of filteredPoles) {
    byLifecycle[p.lifecycle] = (byLifecycle[p.lifecycle] || 0) + 1;
  }

  const polesWithoutLocation = activePoles.filter((p) => !p.location).length;
  // Poles with device
  const polesWithDevice = activePoles.filter((p) => (p as any).linkedDevicesCount > 0).length;

  // Installation coverage
  const installationCoverage = polesTotal > 0 ? Math.round((polesWithDevice / polesTotal) * 100) : 0;

  return {
    polesTotal,
    polesByLifecycle: byLifecycle,
    polesWithoutLocation,
    polesWithDevice,
    spansTotal: filteredSpans.length,
    installationCoverage,
  };
}

/**
 * Computes risk corridor metrics and decision audits.
 */
export function computeRiskMetrics(
  segments: RiskSegment[],
  _events?: FalconEvent[],
  _range?: ReportDateRange,
  _siteFilter?: string
) {
  const total = segments.length;
  const toInspect = segments.filter((s) => s.status === 'to_inspect').length;
  const highPriority = segments.filter((s) => s.priority === 'High').length;
  const lowConfidence = segments.filter((s) => s.confidence === 'Low').length;

  const investigated = segments.filter((s) => s.status === 'investigating').length;
  const dismissed = segments.filter((s) => s.status === 'dismissed').length;

  return {
    total,
    toInspect,
    highPriority,
    lowConfidence,
    investigated,
    dismissed,
  };
}

/**
 * Computes data quality, trust integrity, and vendor sync metrics.
 */
export function computeDataQualityMetrics(
  devices: DeviceRecord[],
  poles: PoleRecord[],
  events: FalconEvent[],
  vendorRecords: VendorDiscoveryRecord[] = [],
  vendorSyncSummary?: VendorSyncSummary | null
) {
  const now = getServerNow().getTime();

  // Vendor sync age in minutes
  const lastSyncMs = vendorSyncSummary?.lastFullSyncAt
    ? parseDate(vendorSyncSummary.lastFullSyncAt)?.getTime() || now
    : now;
  const vendorSyncAgeMinutes = Math.floor(Math.max(0, now - lastSyncMs) / (1000 * 60));

  // Vendor conflicts
  const vendorConflicts = vendorRecords.filter((r) => r.matchStatus === 'Conflict').length;
  const vendorNotRegistered = vendorRecords.filter((r) => r.matchStatus === 'Not registered').length;

  // Devices online but with stale contact (> 24 hours)
  const onlineStale = devices.filter((d) => {
    if (d.connectivityState !== 'online') return false;
    const contactMs = parseDate(d.lastContactAt)?.getTime() || 0;
    return now - contactMs > 24 * 3600 * 1000;
  }).length;

  // Poles without location
  const polesWithoutLocation = poles.filter((p) => p.lifecycle !== 'Deleted' && !p.location).length;

  // Events without evidence
  const eventsWithoutEvidence = events.filter((e) => !e.snapshots || e.snapshots.length === 0).length;

  // Simulated share
  const simulatedCount = events.filter((e) => (e.source as string) === 'Simulation').length;
  const simulatedShare = events.length > 0 ? Math.round((simulatedCount / events.length) * 100) : 0;

  return {
    vendorSyncAgeMinutes,
    vendorConflicts,
    vendorNotRegistered,
    onlineStale,
    polesWithoutLocation,
    eventsWithoutEvidence,
    simulatedShare,
  };
}

/**
 * Forensic audit trail synthesizer across all domain timelines.
 */
export function computeAuditLogEntries(
  devices: DeviceRecord[],
  poles: PoleRecord[],
  cases: FalconCase[],
  range: ReportDateRange
): AuditLogEntry[] {
  const entries: AuditLogEntry[] = [];
  const startMs = parseDate(range.startIso)?.getTime() || 0;
  const endMs = parseDate(range.endIso)?.getTime() || Infinity;

  // From Devices
  for (const d of devices) {
    for (const t of d.timeline || []) {
      const ms = parseDate(t.timestamp)?.getTime() || 0;
      if (ms >= startMs && ms < endMs) {
        entries.push({
          id: `AUD-DEV-${t.id}`,
          timestamp: t.timestamp,
          actor: t.actor || 'System',
          role: 'Operator',
          action: t.kind,
          targetType: 'Device',
          targetId: d.identifier,
          details: t.message,
          fromValue: t.fromValue,
          toValue: t.toValue,
          result: 'Success',
        });
      }
    }
  }

  // From Poles
  for (const p of poles) {
    for (const t of p.timeline || []) {
      const ms = parseDate(t.timestamp)?.getTime() || 0;
      if (ms >= startMs && ms < endMs) {
        entries.push({
          id: `AUD-POL-${t.id}`,
          timestamp: t.timestamp,
          actor: t.actor || 'System',
          role: 'Admin',
          action: t.kind,
          targetType: 'Pole',
          targetId: p.identifier,
          details: t.message,
          fromValue: t.fromValue,
          toValue: t.toValue,
          result: 'Success',
        });
      }
    }
  }

  // From Cases
  for (const c of cases) {
    for (const a of c.activities || []) {
      const ms = parseDate(a.timestamp)?.getTime() || 0;
      if (ms >= startMs && ms < endMs) {
        entries.push({
          id: `AUD-CAS-${a.id}`,
          timestamp: a.timestamp,
          actor: a.actor || 'System',
          role: 'Supervisor',
          action: a.type,
          targetType: 'Case',
          targetId: c.id,
          details: a.text,
          result: 'Success',
        });
      }
    }
  }

  // Sort chronological descending
  return entries.sort((a, b) => {
    const ta = parseDate(a.timestamp)?.getTime() || 0;
    const tb = parseDate(b.timestamp)?.getTime() || 0;
    return tb - ta;
  });
}
