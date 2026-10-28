import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Save,
  RotateCcw,
  Lock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useCases } from '@/contexts/CasesContext';
import { formatAbsoluteMYT, parseDate } from '@/lib/dateTime';
import { formatId } from '@/lib/utils';
import { isVerificationSaved } from '@/lib/caseGates';
import { EvidenceViewer } from '@/components/evidence/EvidenceViewer';
import { devices } from '@/data/devices';
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

const SIGNED_IN_USER = 'Ahmad Syukri';
const SIGNED_IN_USER_ROLE = 'Operations Lead';

export const CaseVerificationTab: React.FC<CaseVerificationTabProps> = ({ caseData }) => {
  const { saveVerification } = useCases();

  const isClosed = caseData.status === 'Closed';
  const initialData: CaseVerificationData = caseData.verification || {};
  const isAlreadySaved = isVerificationSaved(caseData);

  // If already saved, start in view mode; otherwise start in edit mode
  const [isEditing, setIsEditing] = useState<boolean>(!isAlreadySaved);

  const [passCriteria, setPassCriteria] = useState<boolean>(
    initialData.passCriteria ?? false
  );
  const [checkedItems, setCheckedItems] = useState<string[]>(initialData.checkedItems || []);
  const [notes, setNotes] = useState<string>(initialData.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when caseData changes
  useEffect(() => {
    const v = caseData.verification || {};
    setPassCriteria(v.passCriteria ?? false);
    setCheckedItems(v.checkedItems || []);
    setNotes(v.notes || '');
    if (!v.lastSavedAt) {
      setIsEditing(true);
    }
  }, [caseData]);

  // Dirty check against initial saved record
  const isDirty =
    passCriteria !== (initialData.passCriteria ?? false) ||
    notes !== (initialData.notes || '') ||
    JSON.stringify([...checkedItems].sort()) !==
      JSON.stringify([...(initialData.checkedItems || [])].sort());

  const handleToggleItem = (item: string) => {
    if (isClosed || (!isEditing && isAlreadySaved)) return;
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
        verifiedBy: SIGNED_IN_USER,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const v = caseData.verification || {};
    setPassCriteria(v.passCriteria ?? false);
    setCheckedItems(v.checkedItems || []);
    setNotes(v.notes || '');
    if (isAlreadySaved) {
      setIsEditing(false);
    }
  };

  const lastSavedDate = initialData.lastSavedAt ? parseDate(initialData.lastSavedAt) : null;

  // Determine save button disabled reason for tooltip
  let disabledReason = '';
  if (isClosed) {
    disabledReason = 'Case is closed. Verification is locked.';
  } else if (!isDirty) {
    disabledReason = 'Nothing to save. No changes made.';
  } else if (isSaving) {
    disabledReason = 'Saving verification...';
  }

  // Source event & device facts
  const event = caseData.sourceEvent;
  const deviceId = event?.device;
  const dev = deviceId
    ? devices.find((d) => d.id === deviceId || d.id === deviceId.replace('-', '_'))
    : null;
  const deviceIsOnline = dev ? dev.status === 'online' : false;

  const snapshots =
    event?.snapshots && event.snapshots.length > 0
      ? event.snapshots
      : [caseData.id === 'CAS-0007' ? '/case-evidence-0007.png' : '/monkey-fiber.jpg'];

  const rawCaptured = event?.captured || caseData.createdAt;
  const capturedMYT = rawCaptured.includes('MYT') ? rawCaptured : `${rawCaptured} MYT`;
  const rawReceived = event?.receivedAt || event?.captured || caseData.createdAt;
  const receivedMYT = rawReceived.includes('MYT') ? rawReceived : `${rawReceived} MYT`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* =========================================================================
          LEFT COLUMN: Compact Evidence Viewer & Detection Facts (Section 7.4)
         ========================================================================= */}
      <div className="lg:col-span-5 space-y-4">
        {/* Compact Evidence Viewer */}
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground">Incident Evidence</h3>
            <span className="text-[11px] font-mono text-muted-foreground">
              {deviceId || 'CCTV-01'}
            </span>
          </div>
          <div className="p-3">
            <EvidenceViewer
              compact={true}
              eventId={caseData.sourceEventId || caseData.id}
              snapshots={snapshots}
              capturedTimeMYT={capturedMYT}
              channelName={deviceId || 'CCTV-01'}
              detectionRule={event?.detection || event?.ruleCode || event?.type || 'Motion Detection'}
              deviceIsOnline={deviceIsOnline}
              deviceSupportsVideo={true}
              cameraTimestampFootnote="Camera timestamp 16:06:22 (1h clock offset from captured time)"
              initialTab="snapshot"
            />
          </div>
        </div>

        {/* Read-Only Detection Facts Card */}
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
            <h3 className="text-xs font-semibold text-foreground">Detection Facts</h3>
            {caseData.sourceEventId && (
              <Link
                to={`/events/${caseData.sourceEventId}`}
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
              >
                <span>{formatId(caseData.sourceEventId)}</span>
                <ExternalLink className="size-3" />
              </Link>
            )}
          </div>

          <dl className="p-4 space-y-3 text-xs">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground font-medium shrink-0">Event Type</dt>
              <dd className="text-foreground font-medium text-right">
                {event?.type || caseData.title || 'Incident follow-up'}
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground font-medium shrink-0">Detection Rule</dt>
              <dd className="font-mono text-[11px] text-foreground text-right break-all">
                {event?.detection || event?.ruleCode || 'CCTV-01-Motion Detection'}
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground font-medium shrink-0">Captured (MYT)</dt>
              <dd className="font-mono text-[11px] text-foreground tabular-nums text-right">
                {capturedMYT}
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground font-medium shrink-0">Received</dt>
              <dd className="font-mono text-[11px] text-foreground tabular-nums text-right">
                {receivedMYT}
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground font-medium shrink-0">Observed</dt>
              <dd className="text-muted-foreground italic text-right">
                {event?.observed || 'Not supplied'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* =========================================================================
          RIGHT COLUMN: Verification Form / Saved State Summary
         ========================================================================= */}
      <div className="lg:col-span-7 space-y-4">
        {/* When already saved and not in edit mode: display Saved Summary Card */}
        {isAlreadySaved && !isEditing ? (
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-500" />
                <h2 className="text-sm font-semibold text-foreground">Verified Record</h2>
              </div>

              {!isClosed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-7 px-2.5 text-xs gap-1.5 border-border hover:bg-muted text-foreground cursor-pointer"
                >
                  <Edit3 className="size-3.5" />
                  <span>Edit verification</span>
                </Button>
              )}
            </div>

            <div className="p-4 sm:p-6 space-y-5 text-xs">
              {/* Pass/Fail Decision Banner */}
              <div
                className={`p-3.5 rounded-lg border flex items-center gap-3 ${
                  initialData.passCriteria
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                }`}
              >
                {initialData.passCriteria ? (
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="size-5 shrink-0 text-rose-500" />
                )}
                <div>
                  <h4 className="font-semibold text-sm">
                    {initialData.passCriteria
                      ? 'Verification criteria passed'
                      : 'Verification criteria rejected / unconfirmed'}
                  </h4>
                  <p className="text-[11px] text-foreground/80 mt-0.5">
                    Confirmed by {initialData.verifiedBy || SIGNED_IN_USER} on{' '}
                    {lastSavedDate ? formatAbsoluteMYT(lastSavedDate) : 'recorded date'}.
                  </p>
                </div>
              </div>

              {/* Checked Items */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Validated Checklist Items
                </h4>
                {initialData.checkedItems && initialData.checkedItems.length > 0 ? (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {initialData.checkedItems.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border text-foreground font-medium"
                      >
                        <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground italic text-xs">
                    No specific checklist items flagged.
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Verification Notes
                </h4>
                <div className="p-3 rounded-lg border border-border bg-muted/20 text-foreground leading-relaxed whitespace-pre-wrap">
                  {initialData.notes || (
                    <span className="text-muted-foreground italic">No notes provided.</span>
                  )}
                </div>
              </div>

              {/* Verified by footer */}
              <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  Verified by{' '}
                  <strong className="text-foreground">{initialData.verifiedBy || SIGNED_IN_USER}</strong>
                </span>
                {lastSavedDate && (
                  <span className="tabular-nums">Saved: {formatAbsoluteMYT(lastSavedDate)}</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Verification Form (when not saved, or user clicked Edit) */
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  {isAlreadySaved ? 'Edit Verification' : 'Incident Verification'}
                </h2>
              </div>

              {isClosed ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md">
                  <Lock className="size-3" />
                  <span>Read-only (Case closed)</span>
                </div>
              ) : isAlreadySaved ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel editing
                </Button>
              ) : null}
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-6 text-xs">
              {/* Helper copy */}
              <p className="text-muted-foreground text-xs leading-relaxed">
                Verify the incident alert telemetry and confirm whether field intervention is
                required before dispatching maintenance teams.
              </p>

              {/* Unsaved changes prompt */}
              {isDirty && !isClosed && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-between text-xs">
                  <span>You have unsaved changes in this verification form.</span>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="hover:underline font-medium cursor-pointer"
                  >
                    Discard
                  </button>
                </div>
              )}

              {/* 1. Pass Criteria Toggle (C14: Manual decision, reflects saved state only) */}
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20">
                <div className="space-y-0.5 pr-4">
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
                  aria-label="Verification criteria passed"
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

              {/* 3. Verified By (C15: Read-only session user) & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Verified By
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

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Verification Notes
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isClosed}
                    placeholder="Enter telemetry validation observations or dispatch recommendations..."
                    className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 resize-y"
                  />
                </div>
              </div>

              {/* Footer: Status message & Save button (C16) */}
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

                    {/* Save button with tooltip explanation if disabled */}
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <span>
                            <Button
                              type="submit"
                              size="sm"
                              disabled={!isDirty || isSaving}
                              className="h-8 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5 shadow-xs cursor-pointer disabled:pointer-events-none"
                            >
                              <Save className="size-3.5" />
                              <span>{isSaving ? 'Saving...' : 'Save verification'}</span>
                            </Button>
                          </span>
                        }
                      />
                      {!isDirty && (
                        <TooltipContent side="top" className="text-xs">
                          {disabledReason}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
