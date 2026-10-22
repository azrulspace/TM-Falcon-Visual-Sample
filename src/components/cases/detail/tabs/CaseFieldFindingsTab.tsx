import React, { useState, useEffect } from 'react';
import { Wrench, Save, RotateCcw, Lock, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCases } from '@/contexts/CasesContext';
import { formatAbsoluteMYT, parseDate } from '@/lib/dateTime';
import type { CaseWithSourceEvent, CaseFieldFindingsData } from '@/types/cases';

export interface CaseFieldFindingsTabProps {
  caseData: CaseWithSourceEvent;
}

export const CaseFieldFindingsTab: React.FC<CaseFieldFindingsTabProps> = ({ caseData }) => {
  const { saveFieldFindings } = useCases();

  const isClosed = caseData.status === 'Closed';
  const initialData: CaseFieldFindingsData = caseData.fieldFindings || {};

  const [findingsSummary, setFindingsSummary] = useState(initialData.findingsSummary || '');
  const [equipmentUsed, setEquipmentUsed] = useState(initialData.equipmentUsed || '');
  const [actionTaken, setActionTaken] = useState(initialData.actionTaken || '');
  const [technicianNotes, setTechnicianNotes] = useState(initialData.technicianNotes || '');
  const [recordedBy, setRecordedBy] = useState(initialData.recordedBy || 'Field Team');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const f = caseData.fieldFindings || {};
    setFindingsSummary(f.findingsSummary || '');
    setEquipmentUsed(f.equipmentUsed || '');
    setActionTaken(f.actionTaken || '');
    setTechnicianNotes(f.technicianNotes || '');
    setRecordedBy(f.recordedBy || 'Field Team');
  }, [caseData]);

  const isDirty =
    findingsSummary !== (initialData.findingsSummary || '') ||
    equipmentUsed !== (initialData.equipmentUsed || '') ||
    actionTaken !== (initialData.actionTaken || '') ||
    technicianNotes !== (initialData.technicianNotes || '') ||
    recordedBy !== (initialData.recordedBy || 'Field Team');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isClosed || isSaving) return;

    setIsSaving(true);
    try {
      await saveFieldFindings(caseData.id, {
        findingsSummary,
        equipmentUsed,
        actionTaken,
        technicianNotes,
        recordedBy,
      });
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
    setRecordedBy(f.recordedBy || 'Field Team');
  };

  const lastSavedDate = initialData.lastSavedAt ? parseDate(initialData.lastSavedAt) : null;

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <Wrench className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Field Findings & Actions Taken</h2>
        </div>

        {isClosed && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md">
            <Lock className="size-3" />
            <span>Read-only (Case closed)</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-6 text-xs">
        {/* Helper copy */}
        <p className="text-muted-foreground text-xs leading-relaxed">
          Record physical inspection findings, maintenance equipment used, and corrective restoration actions taken by on-site teams.
        </p>

        {/* Unsaved changes prompt */}
        {isDirty && !isClosed && (
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

        {/* 1. Findings Summary */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Findings Summary <span className="text-destructive">*</span>
          </label>
          <textarea
            rows={2}
            value={findingsSummary}
            onChange={(e) => setFindingsSummary(e.target.value)}
            disabled={isClosed}
            placeholder="e.g. Loose mounting bracket on pole AST-014, frayed fiber shielding..."
            className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 resize-y"
          />
        </div>

        {/* 2. Equipment Used & Recorded By */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Equipment Used
            </label>
            <input
              type="text"
              value={equipmentUsed}
              onChange={(e) => setEquipmentUsed(e.target.value)}
              disabled={isClosed}
              placeholder="e.g. Torque wrench, ladder, safety harness, OTDR tester"
              className="w-full h-8 px-2.5 rounded-lg border border-border bg-muted/20 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Recorded By
            </label>
            <input
              type="text"
              value={recordedBy}
              onChange={(e) => setRecordedBy(e.target.value)}
              disabled={isClosed}
              className="w-full h-8 px-2.5 rounded-lg border border-border bg-muted/20 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
            />
          </div>
        </div>

        {/* 3. Action Taken */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Action Taken
          </label>
          <textarea
            rows={2}
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
            disabled={isClosed}
            placeholder="e.g. Re-tensioned bracket mounting bolts, secured wire harness..."
            className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 resize-y"
          />
        </div>

        {/* 4. Technician Notes */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Technician Notes & Environmental Conditions
          </label>
          <textarea
            rows={2}
            value={technicianNotes}
            onChange={(e) => setTechnicianNotes(e.target.value)}
            disabled={isClosed}
            placeholder="Additional observations, weather conditions, or follow-up recommendations..."
            className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 resize-y"
          />
        </div>

        {/* 5. Photos Section (Section 7.4: only if model supports them) */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Field Attachments & Photos
          </label>
          {initialData.photos && initialData.photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {initialData.photos.map((url, i) => (
                <div key={i} className="aspect-video rounded-lg border border-border overflow-hidden bg-muted">
                  <img src={url} alt={`Field photo ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-dashed border-border text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
              <ImageIcon className="size-4" />
              <span>No attached photos in current field findings record.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border">
          <div className="text-[11px] text-muted-foreground">
            {initialData.lastSavedBy && lastSavedDate ? (
              <>
                Last saved by{' '}
                <strong className="text-foreground">{initialData.lastSavedBy}</strong> on{' '}
                {formatAbsoluteMYT(lastSavedDate)}
              </>
            ) : (
              <span>No field findings recorded yet.</span>
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
                className="h-8 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5 shadow-xs"
              >
                <Save className="size-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save findings'}</span>
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
