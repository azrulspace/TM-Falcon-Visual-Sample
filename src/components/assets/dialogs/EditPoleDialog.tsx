import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, ArrowRight, Check, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAssets } from '@/contexts/AssetsContext';
import { useToast } from '@/contexts/ToastContext';
import type { PoleWithRelations, PoleLifecycle } from '@/types/assets';

export interface EditPoleDialogProps {
  pole: PoleWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EDIT_LIFECYCLE_OPTIONS: Exclude<PoleLifecycle, 'Deleted'>[] = [
  'Active',
  'Maintenance',
  'Planned',
  'Inactive',
];

function usePortraitSheet(): boolean {
  const [useSheet, setUseSheet] = useState(false);
  useEffect(() => {
    const check = () => {
      if (typeof window === 'undefined') return;
      const isNarrow = window.innerWidth < 768;
      const isTabletPortrait = window.innerWidth <= 900 && window.innerHeight > window.innerWidth;
      setUseSheet(isNarrow || isTabletPortrait);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return useSheet;
}

/**
 * Dialog/Sheet for editing pole attributes (Name, Protection, Lifecycle, Note):
 * computes a structured live diff summary, disables Save when unchanged, and guards
 * against accidental loss of unsaved edits on close.
 */
export const EditPoleDialog: React.FC<EditPoleDialogProps> = ({
  pole,
  open,
  onOpenChange,
}) => {
  const { permissions, editPole } = useAssets();
  const { addToast } = useToast();
  const isSheet = usePortraitSheet();

  const [name, setName] = useState('');
  const [lifecycle, setLifecycle] = useState<Exclude<PoleLifecycle, 'Deleted'>>('Active');
  const [protection, setProtection] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && pole) {
      setName(pole.name || pole.identifier);
      setLifecycle(
        pole.lifecycle === 'Deleted'
          ? 'Inactive'
          : (pole.lifecycle as Exclude<PoleLifecycle, 'Deleted'>)
      );
      setProtection(pole.protection || '');
      setNote(pole.note || '');
      setErrorMsg(undefined);
      setConfirmDiscard(false);
      setTimeout(() => nameRef.current?.focus(), 60);
    }
  }, [open, pole]);

  const changes = useMemo(() => {
    if (!pole) return [];
    const list: { field: string; from: string; to: string }[] = [];
    const nextName = name.trim() || pole.identifier;
    if (nextName !== (pole.name || pole.identifier)) {
      list.push({ field: 'Name', from: pole.name || pole.identifier, to: nextName });
    }
    if (lifecycle !== pole.lifecycle) {
      list.push({ field: 'Lifecycle', from: pole.lifecycle, to: lifecycle });
    }
    const nextProt = protection.trim() || null;
    if (nextProt !== (pole.protection || null)) {
      list.push({
        field: 'Protection',
        from: pole.protection || 'none',
        to: nextProt || 'none',
      });
    }
    const nextNote = note.trim() || null;
    if (nextNote !== (pole.note || null)) {
      list.push({
        field: 'Note',
        from: pole.note || 'none',
        to: nextNote || 'none',
      });
    }
    return list;
  }, [pole, name, lifecycle, protection, note]);

  const isDirty = changes.length > 0;

  const handleRequestClose = (nextOpen: boolean) => {
    if (!nextOpen && isDirty && !confirmDiscard && !isSubmitting) {
      setConfirmDiscard(true);
      return;
    }
    setConfirmDiscard(false);
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pole) return;
    if (!permissions.canEdit) {
      setErrorMsg(permissions.editDisabledReason || 'Permission required.');
      return;
    }
    if (!isDirty) return;

    setErrorMsg(undefined);
    setIsSubmitting(true);
    try {
      const res = await editPole(pole.identifier, {
        name: name.trim() || pole.identifier,
        lifecycle,
        protection: protection.trim() || null,
        note: note.trim() || null,
      });
      if (!res.ok) {
        setErrorMsg(res.error || 'Failed to save changes.');
        return;
      }
      addToast('success', `Saved changes to ${pole.identifier}.`, 'Pole updated');
      setConfirmDiscard(false);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!pole) return null;

  const content = (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 space-y-4 text-xs">
      {errorMsg && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive flex items-center gap-2"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {confirmDiscard && (
        <div
          role="alertdialog"
          className="rounded-lg border border-status-warning-border bg-status-warning-tint px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-foreground"
        >
          <span className="font-medium">You have unsaved changes. Discard them?</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setConfirmDiscard(false)}
              className="h-7 px-2.5 text-xs cursor-pointer"
            >
              Keep editing
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => {
                setConfirmDiscard(false);
                onOpenChange(false);
              }}
              className="h-7 px-2.5 text-xs cursor-pointer"
            >
              Discard changes
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3.5 overflow-y-auto pr-1">
        <div>
          <label className="block font-semibold text-foreground mb-1">Identifier</label>
          <div className="h-9 rounded-md border border-border bg-muted px-3 flex items-center font-mono text-muted-foreground">
            {pole.identifier}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="edit-pole-name" className="block font-semibold text-foreground mb-1">
              Name
            </label>
            <input
              ref={nameRef}
              id="edit-pole-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setConfirmDiscard(false);
              }}
              placeholder={pole.identifier}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label htmlFor="edit-pole-lifecycle" className="block font-semibold text-foreground mb-1">
              Lifecycle
            </label>
            <select
              id="edit-pole-lifecycle"
              value={lifecycle}
              onChange={(e) => {
                setLifecycle(e.target.value as Exclude<PoleLifecycle, 'Deleted'>);
                setConfirmDiscard(false);
              }}
              className="w-full h-9 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {EDIT_LIFECYCLE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="edit-pole-protection" className="block font-semibold text-foreground mb-1">
            Protection
          </label>
          <input
            id="edit-pole-protection"
            type="text"
            value={protection}
            onChange={(e) => {
              setProtection(e.target.value);
              setConfirmDiscard(false);
            }}
            placeholder="None recorded"
            className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label htmlFor="edit-pole-note" className="block font-semibold text-foreground mb-1">
            Note
          </label>
          <textarea
            id="edit-pole-note"
            rows={3}
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setConfirmDiscard(false);
            }}
            placeholder="Optional inspection or maintenance note"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </div>

        {/* Live Structured Diff Preview */}
        <div className="rounded-lg border border-border bg-muted p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Pencil className="size-3" />
              <span>Pending changes</span>
            </span>
            <span>{changes.length}</span>
          </div>
          {changes.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No changes made yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {changes.map((c) => (
                <li key={c.field} className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="font-semibold text-foreground">{c.field}:</span>
                  <span className="px-1.5 py-0.5 rounded bg-background text-muted-foreground line-through">
                    {c.from}
                  </span>
                  <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                  <span className="px-1.5 py-0.5 rounded bg-background font-medium text-foreground">
                    {c.to}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="pt-3.5 border-t border-border flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleRequestClose(false)}
          disabled={isSubmitting}
          className="h-9 px-3.5 text-xs cursor-pointer"
        >
          Cancel
        </Button>

        <Tooltip>
          <TooltipTrigger
            render={
              <span className="inline-flex">
                <Button
                  type="submit"
                  disabled={!isDirty || isSubmitting || !permissions.canEdit}
                  className="h-9 px-4 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 cursor-pointer"
                >
                  <Check className="size-3.5" />
                  <span>{isSubmitting ? 'Saving...' : 'Save changes'}</span>
                </Button>
              </span>
            }
          />
          {!isDirty && (
            <TooltipContent className="text-xs bg-popover text-popover-foreground border border-border">
              Edit at least one field to enable Save
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </form>
  );

  if (isSheet) {
    return (
      <Sheet open={open} onOpenChange={handleRequestClose}>
        <SheetContent side="bottom" className="max-h-[92vh] flex flex-col p-4">
          <SheetHeader className="px-0 pt-0 pb-3">
            <SheetTitle>
              Edit pole · <span className="font-mono">{pole.identifier}</span>
            </SheetTitle>
            <SheetDescription>Update display name, lifecycle, protection, or note.</SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleRequestClose}>
      <DialogContent className="sm:max-w-xl max-h-[92vh] flex flex-col p-5 bg-card border border-border">
        <DialogHeader className="pb-3 border-b border-border mb-4">
          <DialogTitle className="text-base font-semibold text-foreground">
            Edit pole · <span className="font-mono">{pole.identifier}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Modify registry attributes and review changes before saving.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
