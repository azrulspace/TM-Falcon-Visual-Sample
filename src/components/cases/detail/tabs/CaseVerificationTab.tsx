import React, { useState, useEffect } from 'react';
import { ShieldCheck, Save, RotateCcw, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useCases } from '@/contexts/CasesContext';
import { formatAbsoluteMYT, parseDate } from '@/lib/dateTime';
import type { CaseWithSourceEvent, CaseVerificationData } from '@/types/cases';

export interface CaseVerificationTabProps {
  caseData: CaseWithSourceEvent;
}

const VERIFICATION_CRITERIA_OPTIONS = [
  'Telemetry validated',
  'Visual inspection confirmed',
  'Camera feed checked',
  'Interference cleared',
];

export const CaseVerificationTab: React.FC<CaseVerificationTabProps> = ({ caseData }) => {
  const { saveVerification } = useCases();

  const isClosed = caseData.status === 'Closed';
  const initialData: CaseVerificationData = caseData.verification || {};

  const [passCriteria, setPassCriteria] = useState<boolean>(initialData.passCriteria ?? true);
  const [checkedItems, setCheckedItems] = useState<string[]>(initialData.checkedItems || []);
  const [notes, setNotes] = useState<string>(initialData.notes || '');
  const [verifiedBy, setVerifiedBy] = useState<string>(initialData.verifiedBy || 'Operations Lead');
  const [isSaving, setIsSaving] = useState(false);

  // Sync when caseData changes
  useEffect(() => {
    const v = caseData.verification || {};
    setPassCriteria(v.passCriteria ?? true);
    setCheckedItems(v.checkedItems || []);
    setNotes(v.notes || '');
    setVerifiedBy(v.verifiedBy || 'Operations Lead');
  }, [caseData]);

  // Dirty check
  const isDirty =
    passCriteria !== (initialData.passCriteria ?? true) ||
    notes !== (initialData.notes || '') ||
    verifiedBy !== (initialData.verifiedBy || 'Operations Lead') ||
    JSON.stringify(checkedItems.sort()) !== JSON.stringify([...(initialData.checkedItems || [])].sort());

  const handleToggleItem = (item: string) => {
    if (isClosed) return;
    setCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isClosed || isSaving) return;

    setIsSaving(true);
    try {
      await saveVerification(caseData.id, {
        passCriteria,
        checkedItems,
        notes,
        verifiedBy,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const v = caseData.verification || {};
    setPassCriteria(v.passCriteria ?? true);
    setCheckedItems(v.checkedItems || []);
    setNotes(v.notes || '');
    setVerifiedBy(v.verifiedBy || 'Operations Lead');
  };

  const lastSavedDate = initialData.lastSavedAt ? parseDate(initialData.lastSavedAt) : null;

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Incident Verification</h2>
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
          Verify the incident alert telemetry and confirm whether field intervention is required before dispatching maintenance teams.
        </p>

        {/* Unsaved changes prompt */}
        {isDirty && !isClosed && (
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-between text-xs">
            <span>You have unsaved changes in this verification form.</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="hover:underline font-medium cursor-pointer"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* 1. Pass Criteria Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground block">
              Verification criteria passed
            </span>
            <span className="text-[11px] text-muted-foreground block">
              Flag whether initial telemetry confirms the reported incident classification
            </span>
          </div>
          <Switch
            checked={passCriteria}
            onCheckedChange={setPassCriteria}
            disabled={isClosed}
          />
        </div>

        {/* 2. Checked Items Checklist */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Verification Checklist
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {VERIFICATION_CRITERIA_OPTIONS.map((item) => {
              const isChecked = checkedItems.includes(item);
              return (
                <label
                  key={item}
                  className="flex items-center gap-2.5 p-2 rounded-lg border border-border bg-muted/10 hover:bg-muted/30 cursor-pointer select-none transition-colors"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => handleToggleItem(item)}
                    disabled={isClosed}
                  />
                  <span className="text-foreground font-medium">{item}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 3. Verified By & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5 sm:col-span-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Verified By
            </label>
            <input
              type="text"
              value={verifiedBy}
              onChange={(e) => setVerifiedBy(e.target.value)}
              disabled={isClosed}
              className="w-full h-8 px-2.5 rounded-lg border border-border bg-muted/20 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Verification Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isClosed}
              placeholder="Enter observations, telemetry validation, or dispatch recommendations..."
              className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 resize-y"
            />
          </div>
        </div>

        {/* Footer: Who saved last and save action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border">
          <div className="text-[11px] text-muted-foreground">
            {initialData.lastSavedBy && lastSavedDate ? (
              <>
                Last saved by{' '}
                <strong className="text-foreground">{initialData.lastSavedBy}</strong> on{' '}
                {formatAbsoluteMYT(lastSavedDate)}
              </>
            ) : (
              <span>Not verified yet.</span>
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
                <span>{isSaving ? 'Saving...' : 'Save verification'}</span>
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
