import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Save,
  RotateCcw,
  Check,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Wrench,
  Clock,
  Lock,
  X,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useCases } from '@/contexts/CasesContext';
import { formatAbsoluteMYT, parseDate } from '@/lib/dateTime';
import {
  getClosureGates,
  areClosureGatesMet,
  isClosureFormComplete,
} from '@/lib/caseGates';
import { CANONICAL_ASSIGNEES } from '@/components/cases/AssignPopover';
import type { CaseWithSourceEvent, CaseClosureData } from '@/types/cases';

export interface CaseClosureTabProps {
  caseData: CaseWithSourceEvent;
  onNavigateTab?: (tab: 'overview' | 'verification' | 'field_findings' | 'closure' | 'activity') => void;
}

const AUTHORIZED_AUTHORITIES = CANONICAL_ASSIGNEES.filter((a) => a.id !== 'unassigned');
const DEFAULT_AUTHORITY = 'Ahmad Syukri';

export const CaseClosureTab: React.FC<CaseClosureTabProps> = ({
  caseData,
  onNavigateTab,
}) => {
  const { saveClosure, closeCase, reopenCase } = useCases();

  const isClosed = caseData.status === 'Closed';
  const initialData: CaseClosureData = caseData.closure || {};

  const [rootCause, setRootCause] = useState(initialData.rootCause || '');
  const [resolutionNotes, setResolutionNotes] = useState(initialData.resolutionNotes || '');
  const [followUpRequired] = useState(false); // Disabled per C25
  const [closedBy, setClosedBy] = useState(initialData.closedBy || DEFAULT_AUTHORITY);
  const [isSaving, setIsSaving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    const c = caseData.closure || {};
    setRootCause(c.rootCause || '');
    setResolutionNotes(c.resolutionNotes || '');
    setClosedBy(c.closedBy || DEFAULT_AUTHORITY);
  }, [caseData]);

  // Dirty check
  const isDirty =
    rootCause !== (initialData.rootCause || '') ||
    resolutionNotes !== (initialData.resolutionNotes || '') ||
    closedBy !== (initialData.closedBy || DEFAULT_AUTHORITY);

  // Evaluate closure prerequisites
  const closureFormData = { rootCause, resolutionNotes };
  const gates = getClosureGates(caseData, closureFormData);
  const allGatesPassed = areClosureGatesMet(caseData, closureFormData);
  const isFormComplete = isClosureFormComplete(closureFormData);

  // Handle Save Draft (Secondary outline action)
  const handleSaveDraft = async () => {
    if (isClosed || isSaving) return;
    setIsSaving(true);
    try {
      await saveClosure(caseData.id, {
        rootCause,
        resolutionNotes,
        followUpRequired,
        closedBy,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Complete & Close Case (Confirmed in modal)
  const handleConfirmClose = async () => {
    if (isClosing || !allGatesPassed) return;
    setIsClosing(true);
    try {
      await closeCase(caseData.id, {
        rootCause,
        resolutionNotes,
        followUpRequired,
        closedBy,
      });
      setIsConfirmOpen(false);
    } finally {
      setIsClosing(false);
    }
  };

  const handleReset = () => {
    const c = caseData.closure || {};
    setRootCause(c.rootCause || '');
    setResolutionNotes(c.resolutionNotes || '');
    setClosedBy(c.closedBy || DEFAULT_AUTHORITY);
  };

  const lastSavedDate = initialData.lastSavedAt ? parseDate(initialData.lastSavedAt) : null;
  const closedDate = initialData.closedAt
    ? parseDate(initialData.closedAt)
    : caseData.closedAt
    ? parseDate(caseData.closedAt)
    : null;

  return (
    <div className="space-y-6">
      {/* =========================================================================
          1. GATE LIST AT TOP (C23)
         ========================================================================= */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Case Closure Prerequisites</h2>
          </div>

          {isClosed ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-md font-semibold">
              <Check className="size-3.5" />
              <span>Case closed</span>
            </div>
          ) : allGatesPassed ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-md font-medium">
              <CheckCircle2 className="size-3.5" />
              <span>All prerequisites met</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-md font-medium">
              <AlertTriangle className="size-3.5" />
              <span>Prerequisites pending</span>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5 space-y-3">
          <p className="text-xs text-muted-foreground">
            A case cannot be formally completed and closed until telemetry verification is saved, field findings are submitted, and closure documentation is filled.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {gates.map((gate) => (
              <div
                key={gate.id}
                className={`p-3 rounded-lg border text-xs flex flex-col justify-between transition-colors ${
                  gate.passed
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-border bg-muted/20'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{gate.label}</span>
                    {gate.passed ? (
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Clock className="size-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {gate.passed ? 'Completed and satisfied.' : gate.reasonIfNot}
                  </p>
                </div>

                {!gate.passed && gate.tabKey !== 'closure' && onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab(gate.tabKey)}
                    className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    <span>Go to {gate.tabKey === 'verification' ? 'Verification' : 'Field findings'}</span>
                    <ArrowRight className="size-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. SUMMARY BEFORE CLOSING CARD (C24)
         ========================================================================= */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <h3 className="text-xs font-semibold text-foreground">Summary Before Closing</h3>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {caseData.id} · {caseData.sourceEventId}
          </span>
        </div>

        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Left Summary: Verification Outcome */}
          <div className="p-3.5 rounded-lg border border-border bg-muted/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" />
                <span>Verification Outcome</span>
              </span>
              {caseData.verification?.lastSavedAt ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {caseData.verification.passCriteria ? 'Passed' : 'Unconfirmed'}
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                  Not saved
                </span>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {caseData.verification?.notes || 'No verification notes recorded.'}
            </p>

            <div className="text-[10px] text-muted-foreground pt-1 border-t border-border flex justify-between">
              <span>Verified by: {caseData.verification?.verifiedBy || '—'}</span>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('verification')}
                  className="text-primary hover:underline cursor-pointer"
                >
                  View tab
                </button>
              )}
            </div>
          </div>

          {/* Right Summary: Submitted Findings */}
          <div className="p-3.5 rounded-lg border border-border bg-muted/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Wrench className="size-3.5 text-primary" />
                <span>Field Findings Report</span>
              </span>
              {caseData.fieldFindings?.isSubmitted ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Submitted
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                  Not submitted
                </span>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
              {caseData.fieldFindings?.findingsSummary || 'No field findings recorded.'}
            </p>

            <div className="text-[10px] text-muted-foreground pt-1 border-t border-border flex justify-between">
              <span>Recorded by: {caseData.fieldFindings?.recordedBy || '—'}</span>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('field_findings')}
                  className="text-primary hover:underline cursor-pointer"
                >
                  View tab
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. MAIN CLOSURE FORM / CLOSED RECORD
         ========================================================================= */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              {isClosed ? 'Case Closure Record' : 'Document Resolution'}
            </h2>
          </div>

          {isClosed && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md">
              <Lock className="size-3" />
              <span>Read-only</span>
            </div>
          )}
        </div>

        {/* Closed Banner */}
        {isClosed && closedDate && (
          <div className="p-4 bg-muted/30 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-semibold text-foreground">
                Closed by {initialData.closedBy || caseData.assignee || DEFAULT_AUTHORITY}
              </span>
              <span className="text-muted-foreground block text-[11px] mt-0.5">
                Closed on {formatAbsoluteMYT(closedDate)}
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => reopenCase(caseData.id)}
              className="h-7 px-2.5 text-xs gap-1 border-border text-foreground hover:bg-muted cursor-pointer"
            >
              <RotateCcw className="size-3" />
              <span>Reopen case</span>
            </Button>
          </div>
        )}

        <div className="p-4 sm:p-6 space-y-6 text-xs">
          {/* Unsaved changes prompt */}
          {isDirty && !isClosed && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-between text-xs">
              <span>You have unsaved changes in this closure form.</span>
              <button
                type="button"
                onClick={handleReset}
                className="hover:underline font-medium cursor-pointer"
              >
                Discard
              </button>
            </div>
          )}

          {/* 1. Confirmed Root Cause (Required) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Confirmed Root Cause <span className="text-destructive">*</span>
              </label>
              {!isClosed && (
                <span className="text-[10px] text-muted-foreground">
                  Required to close
                </span>
              )}
            </div>
            <input
              type="text"
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              disabled={isClosed}
              placeholder="State the verified physical or environmental root cause..."
              className="w-full h-8 px-2.5 rounded-lg border border-border bg-muted/20 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
            />
          </div>

          {/* 2. Resolution Summary (Required) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Resolution Summary & Verification Notes <span className="text-destructive">*</span>
              </label>
              {!isClosed && (
                <span className="text-[10px] text-muted-foreground">
                  Required to close
                </span>
              )}
            </div>
            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              disabled={isClosed}
              placeholder="Summary of repair actions taken, cable telemetry restored, and validation performed..."
              className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 resize-y leading-relaxed"
            />
          </div>

          {/* 3. Follow-up Inspection (C25: Disabled with badge) & Closing Authority (C22: Select) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Follow-up Switch (Disabled with "Not available yet" per C25) */}
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20">
              <div className="space-y-0.5 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground block">
                    Follow-up inspection
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono text-muted-foreground bg-muted border border-border">
                    Not available yet
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground block">
                  Automated 7-day post-incident check scheduler
                </span>
              </div>
              <Switch checked={false} disabled={true} aria-label="Follow-up inspection required" />
            </div>

            {/* Closing Authority Select Dropdown (C22: Canonical assignees, no free text) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Closing Authority / Sign-off
              </label>
              {isClosed ? (
                <div className="w-full h-8 px-2.5 rounded-lg border border-border bg-muted/30 text-foreground text-xs flex items-center select-none font-medium">
                  {closedBy}
                </div>
              ) : (
                <select
                  value={closedBy}
                  onChange={(e) => setClosedBy(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {AUTHORIZED_AUTHORITIES.map((opt) => (
                    <option key={opt.id} value={opt.name}>
                      {opt.name} ({opt.role})
                    </option>
                  ))}
                </select>
              )}
              <span className="text-[10px] text-muted-foreground block">
                Authorized personnel certifying incident resolution
              </span>
            </div>
          </div>

          {/* Footer Actions (C26: Secondary Save draft vs Primary Complete & Close Case) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border">
            <div className="text-[11px] text-muted-foreground">
              {isClosed && closedDate ? (
                <span>
                  Case closed by <strong className="text-foreground">{closedBy}</strong> on{' '}
                  {formatAbsoluteMYT(closedDate)}
                </span>
              ) : initialData.lastSavedBy && lastSavedDate ? (
                <span>
                  Draft saved by <strong className="text-foreground">{initialData.lastSavedBy}</strong> on{' '}
                  {formatAbsoluteMYT(lastSavedDate)}
                </span>
              ) : (
                <span>Case not yet formally closed.</span>
              )}
            </div>

            {!isClosed && (
              <div className="flex items-center gap-2">
                {isDirty && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="h-8 px-3 text-xs border-border"
                  >
                    <RotateCcw className="size-3.5 mr-1" />
                    <span>Reset</span>
                  </Button>
                )}

                {/* Save Draft (Secondary outline action) */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
                  disabled={!isDirty || isSaving}
                  className="h-8 px-3 text-xs border-border text-foreground hover:bg-muted font-medium gap-1.5 cursor-pointer disabled:pointer-events-none"
                >
                  <Save className="size-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save draft'}</span>
                </Button>

                {/* Complete & Close Case (Primary filled action, gated on all 3 gates) */}
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setIsConfirmOpen(true)}
                          disabled={!allGatesPassed || isClosing}
                          className="h-8 px-3.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5 shadow-xs cursor-pointer disabled:pointer-events-none"
                        >
                          <Check className="size-3.5" />
                          <span>Complete & Close Case</span>
                        </Button>
                      </span>
                    }
                  />
                  {!allGatesPassed && (
                    <TooltipContent side="top" className="text-xs max-w-xs">
                      {!gates[0].passed
                        ? 'Save verification in the Verification tab first'
                        : !gates[1].passed
                        ? 'Submit field findings in the Field findings tab first'
                        : !isFormComplete
                        ? 'Fill in confirmed root cause and resolution summary'
                        : 'Prerequisites not met'}
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. CLOSURE CONFIRMATION MODAL (C23)
         ========================================================================= */}
      {isConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="closure-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                <h3 id="closure-modal-title" className="text-sm font-semibold text-foreground">
                  Complete and Close Case
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-foreground leading-relaxed">
                Are you sure you want to complete and close <strong className="font-mono">{caseData.id}</strong>?
              </p>
              <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Authority:</span>
                  <span className="font-semibold text-foreground">{closedBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Root cause:</span>
                  <span className="font-semibold text-foreground truncate max-w-[200px]">{rootCause}</span>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-500 flex items-start gap-2.5 text-[11px] leading-relaxed">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <span>
                  This action marks the incident as permanently resolved. Closed cases can only be reopened by authorized operations leads.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-border bg-muted/10">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmOpen(false)}
                className="h-8 px-3 text-xs border-border"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmClose}
                disabled={isClosing}
                className="h-8 px-3.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
              >
                {isClosing ? 'Closing case...' : 'Confirm Closure'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
