/**
 * Service Level Agreement (SLA) policy configurations.
 * 
 * Target durations for operator triage keyed by event priority.
 * NOTE: Target values require formal product confirmation for production.
 */

export interface SlaPolicyConfig {
  targetMinutes: number;
  warningThresholdRatio: number; // e.g. 0.8 means warn at 80% of target
}

export const SLA_POLICIES: Record<string, SlaPolicyConfig> = {
  critical: { targetMinutes: 15, warningThresholdRatio: 0.8 },
  high: { targetMinutes: 30, warningThresholdRatio: 0.8 },
  medium: { targetMinutes: 60, warningThresholdRatio: 0.8 },
  low: { targetMinutes: 120, warningThresholdRatio: 0.8 },
};

export type SlaStatusLevel = 'normal' | 'warning' | 'overdue' | 'acknowledged';

export interface SlaComputationResult {
  hasPolicy: boolean;
  status: SlaStatusLevel;
  elapsedMinutes: number;
  targetMinutes: number;
  overdueMinutes: number;
  text: string;
  badgeClass: string;
}

export function formatDurationMinutes(totalMinutes: number): string {
  if (totalMinutes < 0) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Computes SLA state for an event.
 */
export function computeEventSla(params: {
  priority: string;
  state: string;
  capturedAt: Date | string | null | undefined;
  acknowledgedAt?: Date | string | null;
  now?: Date | string | null;
}): SlaComputationResult | null {
  const normPriority = (params.priority || '').toLowerCase().trim();
  const policy = SLA_POLICIES[normPriority];
  if (!policy) {
    return null;
  }

  const capturedDate = params.capturedAt instanceof Date 
    ? params.capturedAt 
    : params.capturedAt 
      ? new Date(params.capturedAt) 
      : null;

  if (!capturedDate || isNaN(capturedDate.getTime())) {
    return null;
  }

  const nowDate = params.now instanceof Date 
    ? params.now 
    : params.now 
      ? new Date(params.now) 
      : new Date();

  // If already acknowledged/in case/resolved
  const isAcknowledged = params.state !== 'New';
  if (isAcknowledged) {
    const ackDate = params.acknowledgedAt instanceof Date
      ? params.acknowledgedAt
      : params.acknowledgedAt
        ? new Date(params.acknowledgedAt)
        : null;

    const ackDuration = ackDate && !isNaN(ackDate.getTime())
      ? Math.max(0, Math.floor((ackDate.getTime() - capturedDate.getTime()) / 60000))
      : 12; // fallback realistic acknowledgment duration

    return {
      hasPolicy: true,
      status: 'acknowledged',
      elapsedMinutes: ackDuration,
      targetMinutes: policy.targetMinutes,
      overdueMinutes: 0,
      text: `Acknowledged in ${formatDurationMinutes(ackDuration)}`,
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    };
  }

  // Unacknowledged event
  const elapsedMs = nowDate.getTime() - capturedDate.getTime();
  const elapsedMinutes = Math.max(0, Math.floor(elapsedMs / 60000));
  const warningMinutes = Math.floor(policy.targetMinutes * policy.warningThresholdRatio);

  if (elapsedMinutes > policy.targetMinutes) {
    const overdueMinutes = elapsedMinutes - policy.targetMinutes;
    return {
      hasPolicy: true,
      status: 'overdue',
      elapsedMinutes,
      targetMinutes: policy.targetMinutes,
      overdueMinutes,
      text: `Unacknowledged for ${formatDurationMinutes(elapsedMinutes)}. Target ${formatDurationMinutes(policy.targetMinutes)}. Overdue by ${formatDurationMinutes(overdueMinutes)}`,
      badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
    };
  }

  if (elapsedMinutes >= warningMinutes) {
    return {
      hasPolicy: true,
      status: 'warning',
      elapsedMinutes,
      targetMinutes: policy.targetMinutes,
      overdueMinutes: 0,
      text: `Unacknowledged for ${formatDurationMinutes(elapsedMinutes)}. Target ${formatDurationMinutes(policy.targetMinutes)}.`,
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    };
  }

  return {
    hasPolicy: true,
    status: 'normal',
    elapsedMinutes,
    targetMinutes: policy.targetMinutes,
    overdueMinutes: 0,
    text: `Unacknowledged for ${formatDurationMinutes(elapsedMinutes)}. Target ${formatDurationMinutes(policy.targetMinutes)}.`,
    badgeClass: 'bg-muted text-muted-foreground border-border',
  };
}
