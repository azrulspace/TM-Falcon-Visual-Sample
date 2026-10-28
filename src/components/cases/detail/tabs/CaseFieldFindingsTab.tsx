import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Save,
  RotateCcw,
  Lock,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Paperclip,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useCases } from '@/contexts/CasesContext';
import { formatAbsoluteMYT, parseDate } from '@/lib/dateTime';
import { isFindingsSubmitted, isFindingsDraftSaved } from '@/lib/caseGates';
import type { CaseWithSourceEvent, CaseFieldFindingsData } from '@/types/cases';

export interface CaseFieldFindingsTabProps {
  caseData: CaseWithSourceEvent;
}

const SIGNED_IN_USER = 'Ahmad Syukri';
const SIGNED_IN_USER_ROLE = 'Operations Lead';

export const CaseFieldFindingsTab: React.FC<CaseFieldFindingsTabProps> = ({ caseData }) => {
  const { saveFieldFindings } = useCases();

  const isClosed = caseData.status === 'Closed';
  const initialData: CaseFieldFindingsData = caseData.fieldFindings || {};
  const isSubmitted = isFindingsSubmitted(caseData);
  const isDraftSaved = isFindingsDraftSaved(caseData);
  const isLocked = isClosed || isSubmitted;

  const [findingsSummary, setFindingsSummary] = useState(initialData.findingsSummary || '');
  const [equipmentUsed, setEquipmentUsed] = useState(initialData.equipmentUsed || '');
  const [actionTaken, setActionTaken] = useState(initialData.actionTaken || '');
  const [technicianNotes, setTechnicianNotes] = useState(initialData.technicianNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);

  useEffect(() => {
    const f = caseData.fieldFindings || {};
    setFindingsSummary(f.findingsSummary || '');
    setEquipmentUsed(f.equipmentUsed || '');
    setActionTaken(f.actionTaken || '');
    setTechnicianNotes(f.technicianNotes || '');
  }, [caseData]);

  // Dirty check
  const isDirty =
    findingsSummary !== (initialData.findingsSummary || '') ||
    equipmentUsed !== (initialData.equipmentUsed || '') ||
    actionTaken !== (initialData.actionTaken || '') ||
    technicianNotes !== (initialData.technicianNotes || '');

  const canSubmit = findingsSummary.trim().length > 0;

  // Handle Save Draft (Secondary action)
  const handleSaveDraft = async () => {
    if (isLocked || isSaving) return;
    setIsSaving(true);
    try {
      await saveFieldFindings(
        caseData.id,
        {
          findingsSummary,
          equipmentUsed,
          actionTaken,
          technicianNotes,
          recordedBy: SIGNED_IN_USER,
          isSubmitted: false,
        },
        SIGNED_IN_USER
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Submit Findings (Primary action with confirm modal)
  const handleConfirmSubmit = async () => {
    if (isLocked || isSaving || !canSubmit) return;
    setIsSaving(true);
    try {
      const nowIso = new Date().toISOString();
      await saveFieldFindings(
        caseData.id,
        {
          findingsSummary,
          equipmentUsed,
          actionTaken,
          technicianNotes,
          recordedBy: SIGNED_IN_USER,
          isSubmitted: true,
          submittedBy: SIGNED_IN_USER,
          submittedAt: nowIso,
        },
        SIGNED_IN_USER
      );
      setIsSubmitConfirmOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const f = caseData.fieldFindings || {};
    setFindingsSummary(f.findingsSummary || '');
    setEquipmentUsed(f.equipmentUsed || '');
    setActionTaken(f.actionTaken || '');
    setTechnicianNotes(f.technicianNotes || '');
  };

  const lastSavedDate = initialData.lastSavedAt ? parseDate(initialData.lastSavedAt) : null;
  const submittedDate = initialData.submittedAt ? parseDate(initialData.submittedAt) : null;

  return (
    <div className="space-y-6">
      {/* 1. Status & Verification Context Summary Card */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Wrench className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Field Work & Findings</h2>
          </div>

          {/* Submission Status Chip */}
          <div className="flex items-center gap-2">
            {isClosed ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
                <Lock className="size-3" />
                <span>Case closed (read-only)</span>
              </span>
            ) : isSubmitted ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="size-3.5 text-emerald-400" />
                <span>
                  Submitted by {initialData.submittedBy || SIGNED_IN_USER} on{' '}
                  {submittedDate ? formatAbsoluteMYT(submittedDate) : 'recorded date'}
                </span>
              </span>
            ) : isDraftSaved ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Clock className="size-3.5 text-amber-400" />
                <span>
                  Draft saved {lastSavedDate ? formatAbsoluteMYT(lastSavedDate) : ''}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
                <AlertCircle className="size-3.5" />
                <span>Not submitted</span>
              </span>
            )}
          </div>
        </div>

        {/* Read-Only Verification Outcome Context */}
        {caseData.verification?.lastSavedAt && (
          <div className="p-4 bg-muted/10 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start sm:items-center gap-2.5">
              <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="text-muted-foreground">Verification outcome: </span>
                <span className="font-semibold text-foreground">
                  {caseData.verification.passCriteria
                    ? 'Verification criteria passed'
                    : 'Verification criteria unconfirmed'}
                </span>
                {caseData.verification.notes && (
                  <span className="text-muted-foreground ml-1.5 truncate max-w-md inline-block align-bottom">
                    — {caseData.verification.notes}
                  </span>
                )}
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
              Verified by {caseData.verification.verifiedBy || SIGNED_IN_USER}
            </span>
          </div>
        )}

        {/* Submission Lock Notice */}
        {isSubmitted && !isClosed && (
          <div className="p-3 bg-emerald-500/5 border-b border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2 px-4">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
            <span>
              Field findings were formally submitted and locked. To record subsequent findings, create an activity log entry or reopen the case.
            </span>
          </div>
        )}

        {/* 2. Main Form */}
        <div className="p-4 sm:p-6 space-y-6 text-xs">
          <p className="text-muted-foreground leading-relaxed">
            Record physical on-site inspection findings, maintenance equipment utilized, and
            restoration actions taken by technical field crews.
          </p>

          {/* Unsaved changes prompt */}
          {isDirty && !isLocked && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-between text-xs">
              <span>You have unsaved changes in this field findings form.</span>
              <button
                type="button"
                onClick={handleReset}
                className="hover:underline font-medium cursor-pointer"
              >
                Discard
              </button>
            </div>
          )}

          {/* Findings Summary (Required) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Findings Summary <span className="text-destructive">*</span>
              </label>
              {!isLocked && (
                <span className="text-[10px] text-muted-foreground">
                  Required for submission
                </span>
              )}
            </div>
            <textarea
              rows={3}
              value={findingsSummary}
              onChange={(e) => setFindingsSummary(e.target.value)}
              disabled={isLocked}
              placeholder="Describe physical condition of cable, mounting brackets, poles, or equipment observed on site..."
              className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 resize-y leading-relaxed"
            />
          </div>

          {/* Equipment Used & Recorded By */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Equipment Used
              </label>
              <input
                type="text"
                value={equipmentUsed}
                onChange={(e) => setEquipmentUsed(e.target.value)}
                disabled={isLocked}
                placeholder="e.g. Optical time-domain reflectometer, safety harness, torque wrench..."
                className="w-full h-8 px-2.5 rounded-lg border border-border bg-muted/20 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Recorded By
              </label>
              <div className="w-full h-8 px-2.5 rounded-lg border border-border bg-muted/30 text-foreground text-xs flex items-center justify-between select-none">
                <span className="font-medium truncate">{SIGNED_IN_USER}</span>
                <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                  {SIGNED_IN_USER_ROLE}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground block">
                Session operator (read-only)
              </span>
            </div>
          </div>

          {/* Action Taken */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Action Taken
            </label>
            <textarea
              rows={2}
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              disabled={isLocked}
              placeholder="Describe maintenance actions performed, repairs made, or component replacements..."
              className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 resize-y leading-relaxed"
            />
          </div>

          {/* Technician Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Technician Notes & Environmental Conditions
            </label>
            <textarea
              rows={2}
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              disabled={isLocked}
              placeholder="Weather conditions, line clearance observations, or notes for subsequent inspections..."
              className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 resize-y leading-relaxed"
            />
          </div>

          {/* Attachments Area (C20: Single informative line, no drop zone) */}
          <div className="space-y-2 pt-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Attachments & Photos
            </label>
            <div className="p-3 rounded-lg border border-border bg-muted/10 text-muted-foreground text-xs flex items-center gap-2">
              <Paperclip className="size-4 text-muted-foreground shrink-0" />
              <span>Attachments are not available yet.</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border">
            <div className="text-[11px] text-muted-foreground">
              {isSubmitted && submittedDate ? (
                <span>
                  Submitted by{' '}
                  <strong className="text-foreground">
                    {initialData.submittedBy || SIGNED_IN_USER}
                  </strong>{' '}
                  on {formatAbsoluteMYT(submittedDate)}
                </span>
              ) : initialData.lastSavedBy && lastSavedDate ? (
                <span>
                  Draft saved by{' '}
                  <strong className="text-foreground">{initialData.lastSavedBy}</strong> on{' '}
                  {formatAbsoluteMYT(lastSavedDate)}
                </span>
              ) : (
                <span>No field findings submitted yet.</span>
              )}
            </div>

            {!isLocked && (
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

                {/* Submit Findings (Primary filled blue action) */}
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setIsSubmitConfirmOpen(true)}
                          disabled={!canSubmit || isSaving}
                          className="h-8 px-3.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5 shadow-xs cursor-pointer disabled:pointer-events-none"
                        >
                          <Send className="size-3.5" />
                          <span>Submit findings</span>
                        </Button>
                      </span>
                    }
                  />
                  {!canSubmit && (
                    <TooltipContent side="top" className="text-xs">
                      Findings summary is required before submission
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Submit Confirmation Modal Dialog */}
      {isSubmitConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <Send className="size-4 text-primary" />
                <h3 id="submit-modal-title" className="text-sm font-semibold text-foreground">
                  Submit Field Findings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSubmitConfirmOpen(false)}
                className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-foreground leading-relaxed">
                Submitting will formally lock these field findings into the permanent case record
                and notify operations engineering.
              </p>
              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-500 flex items-start gap-2.5 text-[11px] leading-relaxed">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>
                  Once submitted, the findings summary and actions taken will become read-only and
                  cannot be edited directly.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-border bg-muted/10">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSubmitConfirmOpen(false)}
                className="h-8 px-3 text-xs border-border"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmSubmit}
                disabled={isSaving}
                className="h-8 px-3.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
              >
                {isSaving ? 'Submitting...' : 'Confirm and submit'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
