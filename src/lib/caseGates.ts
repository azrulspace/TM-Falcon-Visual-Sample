import type { FalconCase } from '@/types/cases';

export type TabStateVariant = 'success' | 'warning' | 'muted' | 'neutral' | 'count';

export interface CaseTabStateInfo {
  label: string | null;
  variant: TabStateVariant;
  iconName?: 'check' | 'clock' | 'alert-circle' | 'file-text' | 'check-circle' | 'list';
  ariaLabel: string;
}

export interface ClosureGateItem {
  id: 'verification' | 'findings' | 'closure_fields';
  label: string;
  passed: boolean;
  reasonIfNot: string;
  tabKey: 'verification' | 'field_findings' | 'closure';
}

/**
 * Evaluates whether verification has been formally saved.
 * Must be computed from saved data, never from transient/unsaved form state.
 */
export function isVerificationSaved(caseData: FalconCase): boolean {
  if (!caseData.verification) return false;
  return Boolean(caseData.verification.lastSavedAt || caseData.verification.verifiedAt);
}

/**
 * Evaluates whether field findings have been formally submitted and locked.
 * Draft saves do not satisfy submission.
 */
export function isFindingsSubmitted(caseData: FalconCase): boolean {
  if (!caseData.fieldFindings) return false;
  return Boolean(caseData.fieldFindings.isSubmitted === true || caseData.fieldFindings.submittedAt);
}

/**
 * Evaluates whether field findings has a draft saved.
 */
export function isFindingsDraftSaved(caseData: FalconCase): boolean {
  if (!caseData.fieldFindings || isFindingsSubmitted(caseData)) return false;
  return Boolean(
    caseData.fieldFindings.lastSavedAt ||
    (caseData.fieldFindings.findingsSummary && caseData.fieldFindings.findingsSummary.trim().length > 0) ||
    (caseData.fieldFindings.actionTaken && caseData.fieldFindings.actionTaken.trim().length > 0)
  );
}

/**
 * Evaluates whether the closure form has required fields complete:
 * 1. Confirmed root cause (required)
 * 2. Resolution summary and verification notes (required)
 */
export function isClosureFormComplete(data?: { rootCause?: string; resolutionNotes?: string } | null): boolean {
  if (!data) return false;
  const rootCause = (data.rootCause || '').trim();
  const resolutionNotes = (data.resolutionNotes || '').trim();
  return rootCause.length > 0 && resolutionNotes.length > 0;
}

/**
 * Returns closure prerequisites gate evaluation.
 */
export function getClosureGates(
  caseData: FalconCase,
  closureForm?: { rootCause?: string; resolutionNotes?: string }
): ClosureGateItem[] {
  const verPassed = isVerificationSaved(caseData);
  const finPassed = isFindingsSubmitted(caseData);
  const closurePassed = isClosureFormComplete(closureForm || caseData.closure);

  return [
    {
      id: 'verification',
      label: 'Verification saved',
      passed: verPassed,
      reasonIfNot: 'Verification criteria and notes must be saved on the Verification tab.',
      tabKey: 'verification',
    },
    {
      id: 'findings',
      label: 'Field findings submitted',
      passed: finPassed,
      reasonIfNot: 'Field work findings must be submitted and confirmed on the Field findings tab.',
      tabKey: 'field_findings',
    },
    {
      id: 'closure_fields',
      label: 'Required closure fields complete',
      passed: closurePassed,
      reasonIfNot: 'Confirmed root cause and resolution summary must be provided.',
      tabKey: 'closure',
    },
  ];
}

/**
 * Evaluates whether all closure gates pass.
 */
export function areClosureGatesMet(
  caseData: FalconCase,
  closureForm?: { rootCause?: string; resolutionNotes?: string }
): boolean {
  const gates = getClosureGates(caseData, closureForm);
  return gates.every((g) => g.passed);
}

/**
 * Maps each case detail tab to its truthful state chip information.
 */
export function getCaseTabState(
  tab: 'overview' | 'verification' | 'field_findings' | 'closure' | 'activity',
  caseData: FalconCase
): CaseTabStateInfo {
  switch (tab) {
    case 'overview':
      return {
        label: null,
        variant: 'neutral',
        ariaLabel: 'Overview tab, summary view',
      };

    case 'verification': {
      if (isVerificationSaved(caseData)) {
        const actor = caseData.verification?.verifiedBy || caseData.verification?.lastSavedBy || 'Lead';
        return {
          label: `Verified by ${actor}`,
          variant: 'success',
          iconName: 'check',
          ariaLabel: `Verification complete, verified by ${actor}`,
        };
      }
      return {
        label: 'Not verified',
        variant: 'muted',
        iconName: 'alert-circle',
        ariaLabel: 'Verification pending, not yet verified',
      };
    }

    case 'field_findings': {
      if (isFindingsSubmitted(caseData)) {
        const actor = caseData.fieldFindings?.submittedBy || caseData.fieldFindings?.recordedBy || 'Field Team';
        return {
          label: `Submitted by ${actor}`,
          variant: 'success',
          iconName: 'check',
          ariaLabel: `Field findings submitted by ${actor}`,
        };
      }
      if (isFindingsDraftSaved(caseData)) {
        return {
          label: 'Draft saved',
          variant: 'warning',
          iconName: 'file-text',
          ariaLabel: 'Field findings draft saved',
        };
      }
      return {
        label: 'Not submitted',
        variant: 'muted',
        iconName: 'alert-circle',
        ariaLabel: 'Field findings pending, not yet submitted',
      };
    }

    case 'closure': {
      if (caseData.status === 'Closed') {
        return {
          label: 'Closed',
          variant: 'neutral',
          iconName: 'check-circle',
          ariaLabel: 'Case closed',
        };
      }
      if (areClosureGatesMet(caseData)) {
        return {
          label: 'Ready to close',
          variant: 'success',
          iconName: 'check',
          ariaLabel: 'Case ready to close, all prerequisite gates passed',
        };
      }
      return {
        label: 'Not ready',
        variant: 'muted',
        iconName: 'clock',
        ariaLabel: 'Case not ready to close, prerequisite gates incomplete',
      };
    }

    case 'activity': {
      const count = caseData.activities?.length || 0;
      return {
        label: String(count),
        variant: 'count',
        iconName: 'list',
        ariaLabel: `${count} audit activity entries recorded`,
      };
    }
  }
}
