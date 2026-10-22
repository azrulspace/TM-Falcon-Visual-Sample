import React, { useState, useEffect } from 'react';
import { CheckCircle2, Save, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useCases } from '@/contexts/CasesContext';
import { formatAbsoluteMYT, parseDate } from '@/lib/dateTime';
import type { CaseWithSourceEvent, CaseClosureData } from '@/types/cases';

export interface CaseClosureTabProps {
  caseData: CaseWithSourceEvent;
}

export const CaseClosureTab: React.FC<CaseClosureTabProps> = ({ caseData }) => {
  const { saveClosure, closeCase, reopenCase } = useCases();

  const isClosed = caseData.status === 'Closed';
  const initialData: CaseClosureData = caseData.closure || {};

  const [rootCause, setRootCause] = useState(initialData.rootCause || '');
  const [resolutionNotes, setResolutionNotes] = useState(initialData.resolutionNotes || '');
  const [followUpRequired, setFollowUpRequired] = useState(initialData.followUpRequired ?? false);
  const [closedBy, setClosedBy] = useState(initialData.closedBy || 'Field Team');
  const [isSaving, setIsSaving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const c = caseData.closure || {};
    setRootCause(c.rootCause || '');
    setResolutionNotes(c.resolutionNotes || '');
    setFollowUpRequired(c.followUpRequired ?? false);
    setClosedBy(c.closedBy || 'Field Team');
  }, [caseData]);

  const isDirty =
    rootCause !== (initialData.rootCause || '') ||
    resolutionNotes !== (initialData.resolutionNotes || '') ||
    followUpRequired !== (initialData.followUpRequired ?? false) ||
    closedBy !== (initialData.closedBy || 'Field Team');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleCompleteAndClose = async () => {
    if (isClosing) return;
    setIsClosing(true);
    try {
      await closeCase(caseData.id, {
        rootCause: rootCause || 'Field verification and repair completed',
        resolutionNotes: resolutionNotes || 'Asset restored to normal operational parameters',
        followUpRequired,
        closedBy,
      });
    } finally {
      setIsClosing(false);
    }
  };

  const handleReset = () => {
    const c = caseData.closure || {};
    setRootCause(c.rootCause || '');
    setResolutionNotes(c.resolutionNotes || '');
    setFollowUpRequired(c.followUpRequired ?? false);
    setClosedBy(c.closedBy || 'Field Team');
  };

  const lastSavedDate = initialData.lastSavedAt ? parseDate(initialData.lastSavedAt) : null;
  const closedDate = initialData.closedAt ? parseDate(initialData.closedAt) : (caseData.closedAt ? parseDate(caseData.closedAt) : null);

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Case Resolution & Closure</h2>
        </div>

        {isClosed && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md font-semibold">
            <Check className="size-3.5" />
            <span>Case Resolved and Closed</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-6 text-xs">
        {/* Helper copy */}
        <p className="text-muted-foreground text-xs leading-relaxed">
          Document the confirmed root cause, corrective maintenance resolution, and whether post-incident monitoring or follow-up inspections are required.
        </p>

        {/* Closed Banner */}
        {isClosed && closedDate && (
          <div className="p-3 rounded-lg bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-semibold text-foreground">Closed by {initialData.closedBy || caseData.assignee || 'Field Team'}</span>
              <span className="text-muted-foreground block text-[11px]">
                Closed on {formatAbsoluteMYT(closedDate)}
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => reopenCase(caseData.id)}
              className="h-7 px-2.5 text-xs gap-1 border-border"
            >
              <RotateCcw className="size-3" />
              <span>Reopen case</span>
            </Button>
          </div>
        )}

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

        {/* 1. Root Cause */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Confirmed Root Cause <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value)}
            disabled={isClosed}
            placeholder="e.g. Wildlife disturbance (monkey troop on cable bracket), hardware wear..."
            className="w-full h-8 px-2.5 rounded-lg border border-border bg-muted/20 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
          />
        </div>

        {/* 2. Resolution Notes */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Resolution Summary & Verification Notes <span className="text-destructive">*</span>
          </label>
          <textarea
            rows={3}
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            disabled={isClosed}
            placeholder="Summary of repair actions, line clearance verified, telemetry confirmed normal..."
            className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 resize-y"
          />
        </div>

        {/* 3. Follow-up Required & Closed By */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
            <div className="space-y-0.5">
              <span className="font-semibold text-foreground block">Follow-up inspection required</span>
              <span className="text-[11px] text-muted-foreground block">
                Schedule a 7-day post-incident physical check
              </span>
            </div>
            <Switch
              checked={followUpRequired}
              onCheckedChange={setFollowUpRequired}
              disabled={isClosed}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Closing Authority / Sign-off
            </label>
            <input
              type="text"
              value={closedBy}
              onChange={(e) => setClosedBy(e.target.value)}
              disabled={isClosed}
              className="w-full h-8 px-2.5 rounded-lg border border-border bg-muted/20 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border">
          <div className="text-[11px] text-muted-foreground">
            {initialData.lastSavedBy && lastSavedDate ? (
              <>
                Last updated by{' '}
                <strong className="text-foreground">{initialData.lastSavedBy}</strong> on{' '}
                {formatAbsoluteMYT(lastSavedDate)}
              </>
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

              <Button
                type="submit"
                size="sm"
                disabled={!isDirty || isSaving}
                className="h-8 px-3 text-xs border border-border bg-card hover:bg-muted text-foreground font-semibold gap-1.5 shadow-xs"
              >
                <Save className="size-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save closure'}</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleCompleteAndClose}
                disabled={isClosing}
                className="h-8 px-3.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5 shadow-xs"
              >
                <Check className="size-3.5" />
                <span>{isClosing ? 'Closing case...' : 'Complete & Close Case'}</span>
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
