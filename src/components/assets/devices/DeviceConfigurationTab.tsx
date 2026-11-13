import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  Info,
  RotateCcw,
  Send,
  Sliders,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAssets } from '@/contexts/AssetsContext';
import {
  getChangedConfigKeys,
  getConfigSchemaForDevice,
  isConfigFieldActive,
} from '@/data/deviceConfigSchema';
import { formatAbsoluteMYT } from '@/lib/dateTime';
import { cn } from '@/lib/utils';
import type { DeviceWithRelations } from '@/types/devices';
import type { DevicePermissions } from '@/lib/permissions';

export interface DeviceConfigurationTabProps {
  device: DeviceWithRelations;
  permissions: DevicePermissions;
  onOpenVersionHistory: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export const DeviceConfigurationTab: React.FC<DeviceConfigurationTabProps> = ({
  device,
  permissions,
  onOpenVersionHistory,
  onDirtyChange,
}) => {
  const { sendDeviceConfig, retryDeviceConfigSetting } = useAssets();

  const schema = useMemo(() => getConfigSchemaForDevice(device), [device]);
  const [draftValues, setDraftValues] = useState<Record<string, unknown>>(
    () => ({ ...device.configuration })
  );
  const [sending, setSending] = useState(false);
  const [retryingKey, setRetryingKey] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [changeNote, setChangeNote] = useState('');
  const [simulatePartialFailure, setSimulatePartialFailure] = useState(false);

  // Sync draft when device configuration updates after successful apply/rollback
  useEffect(() => {
    setDraftValues({ ...device.configuration });
  }, [device.identifier, device.configVersion, device.configReportedAt, device.configuration]);

  const changes = useMemo(
    () => getChangedConfigKeys(schema, draftValues, device.configuration),
    [schema, draftValues, device.configuration]
  );

  const isDirty = changes.length > 0;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Validation errors across active numeric fields
  const fieldErrors = useMemo(() => {
    const errs = new Map<string, string>();
    for (const sec of schema) {
      for (const field of sec.fields) {
        if (!isConfigFieldActive(field, draftValues)) continue;
        if (field.control === 'number') {
          const val = draftValues[field.key];
          const num = Number(val);
          if (val === '' || val === null || val === undefined || Number.isNaN(num)) {
            errs.set(field.key, 'Enter a valid number.');
          } else {
            if (field.min !== undefined && num < field.min) {
              errs.set(field.key, `Minimum value is ${field.min}${field.unit ? ` ${field.unit}` : ''}.`);
            } else if (field.max !== undefined && num > field.max) {
              errs.set(field.key, `Maximum value is ${field.max}${field.unit ? ` ${field.unit}` : ''}.`);
            }
          }
        }
      }
    }
    return errs;
  }, [schema, draftValues]);

  const hasValidationErrors = fieldErrors.size > 0;

  const latestVersion = device.configVersions[0] || null;

  const updateField = (key: string, value: unknown) => {
    setDraftValues((prev) => ({ ...prev, [key]: value }));
  };

  const resetField = (key: string) => {
    setDraftValues((prev) => ({ ...prev, [key]: device.configuration[key] }));
  };

  const handleUndoAll = () => {
    setDraftValues({ ...device.configuration });
  };

  const handleConfirmSend = async () => {
    setSending(true);
    const res = await sendDeviceConfig(device.identifier, draftValues, {
      note: changeNote,
      simulatePartialFailure,
    });
    setSending(false);
    if (res.ok) {
      setReviewOpen(false);
      setChangeNote('');
      setSimulatePartialFailure(false);
    }
  };

  const handleRetrySetting = async (versionId: string, settingKey: string) => {
    setRetryingKey(settingKey);
    await retryDeviceConfigSetting(device.identifier, versionId, settingKey);
    setRetryingKey(null);
  };

  const statusTone = sending
    ? 'border-primary/40 bg-primary/8'
    : isDirty
    ? 'border-amber-500/40 bg-amber-500/8'
    : device.configStatus === 'Partly applied' || device.configStatus === 'Failed'
    ? 'border-red-500/40 bg-red-500/8'
    : device.configStatus === 'Applied'
    ? 'border-emerald-500/35 bg-emerald-500/8'
    : 'border-border bg-card';

  return (
    <div className="space-y-4">
      {/* Live Status & Version History Header Banner */}
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'rounded-xl border px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3',
          statusTone
        )}
      >
        <div className="flex items-start gap-2.5 text-xs">
          {sending ? (
            <Clock className="size-4 text-primary shrink-0 mt-0.5 animate-pulse" />
          ) : isDirty ? (
            <Sliders className="size-4 text-amber-500 shrink-0 mt-0.5" />
          ) : device.configStatus === 'Partly applied' || device.configStatus === 'Failed' ? (
            <AlertTriangle className="size-4 text-red-500 shrink-0 mt-0.5" />
          ) : device.configStatus === 'Applied' ? (
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <Info className="size-4 text-primary shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <div className="font-semibold text-foreground">
              {sending
                ? 'Sending configuration changes to Edge...'
                : isDirty
                ? `${changes.length} ${changes.length === 1 ? 'change' : 'changes'} not sent`
                : device.configStatus === 'Applied'
                ? `${device.configVersion} applied on device`
                : device.configStatus === 'Partly applied' || device.configStatus === 'Failed'
                ? `${device.configVersion} ${device.configStatus.toLowerCase()} on Edge`
                : 'No change is being sent'}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {device.configReportedAt ? (
                <>
                  Reported by the device at{' '}
                  <span className="font-mono text-foreground">
                    {formatAbsoluteMYT(device.configReportedAt, { showSeconds: false })}
                  </span>
                  . Edge sends only settings you change.
                </>
              ) : (
                'Showing schema defaults. Change a setting and review before sending to Edge.'
              )}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenVersionHistory}
          className="h-8 px-3 text-xs gap-1.5 border-border bg-card hover:bg-muted shrink-0 cursor-pointer"
        >
          <History className="size-3.5 text-primary" />
          <span>Version history ({device.configVersions.length})</span>
        </Button>
      </div>

      {/* Latest Edge Per-Setting Results (shown when versions exist or failures occurred) */}
      {latestVersion && latestVersion.results.length > 0 && (
        <section className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              Latest Edge delivery ({latestVersion.versionLabel} · {latestVersion.status})
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {formatAbsoluteMYT(latestVersion.createdAt, { showSeconds: false })} by{' '}
              {latestVersion.createdBy}
            </span>
          </div>
          <div className="divide-y divide-border/60">
            {latestVersion.results.map((res) => (
              <div
                key={res.key}
                className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {res.status === 'Applied' ? (
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    ) : res.status === 'Failed' ? (
                      <XCircle className="size-3.5 text-red-500 shrink-0" />
                    ) : (
                      <Clock className="size-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className="font-medium text-foreground">{res.label}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      → {String(res.sentValue)}
                    </span>
                  </div>
                  {res.errorMessage && (
                    <p className="text-[11px] text-red-500 pl-5">{res.errorMessage}</p>
                  )}
                </div>

                {res.status === 'Failed' && permissions.canConfigureDevice && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={retryingKey === res.key}
                    onClick={() => handleRetrySetting(latestVersion.id, res.key)}
                    className="h-7 px-2.5 text-[11px] gap-1 border-red-500/40 text-red-500 hover:bg-red-500/10 self-start sm:self-center cursor-pointer"
                  >
                    <RotateCcw className="size-3" />
                    <span>{retryingKey === res.key ? 'Retrying...' : 'Retry setting'}</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2-Column Schema Sections (D4/D19 spacing: clean grid, zero overlapping floating bar) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        {schema.map((section) => (
          <section
            key={section.id}
            className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4"
          >
            <div className="pb-2 border-b border-border/60">
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {section.fields.map((field) => {
                const active = isConfigFieldActive(field, draftValues);
                const val = draftValues[field.key];
                const reportedVal = device.configuration[field.key];
                const isEdited = String(val ?? '') !== String(reportedVal ?? '');
                const err = fieldErrors.get(field.key);
                const hasWarning =
                  active && field.warningRule && field.warningRule.check(val, draftValues);
                const spanFull = field.control === 'textarea';

                return (
                  <div
                    key={field.key}
                    className={cn('space-y-1.5', spanFull && 'sm:col-span-2')}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor={`cfg-${field.key}`}
                        className={cn(
                          'text-xs font-medium',
                          active ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {field.label}
                      </label>

                      {isEdited && (
                        <button
                          type="button"
                          onClick={() => resetField(field.key)}
                          title={`Reset to reported value (${String(reportedVal ?? '—')})`}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline cursor-pointer"
                        >
                          <RotateCcw className="size-2.5" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>

                    {field.control === 'select' && (
                      <select
                        id={`cfg-${field.key}`}
                        disabled={!active || !permissions.canConfigureDevice}
                        value={String(val ?? '')}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        className={cn(
                          'w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50',
                          (!active || !permissions.canConfigureDevice) &&
                            'opacity-55 cursor-not-allowed bg-muted/40'
                        )}
                      >
                        {field.placeholder && <option value="">{field.placeholder}</option>}
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.control === 'textarea' && (
                      <textarea
                        id={`cfg-${field.key}`}
                        rows={2}
                        disabled={!active || !permissions.canConfigureDevice}
                        value={String(val ?? '')}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className={cn(
                          'w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50',
                          (!active || !permissions.canConfigureDevice) &&
                            'opacity-55 cursor-not-allowed bg-muted/40'
                        )}
                      />
                    )}

                    {field.control === 'toggle' && (
                      <div className="flex items-center justify-between h-9 px-3 rounded-lg border border-border bg-background">
                        <span className="text-xs text-foreground">
                          {Boolean(val) ? 'On' : 'Off'}
                        </span>
                        <Switch
                          id={`cfg-${field.key}`}
                          disabled={!active || !permissions.canConfigureDevice}
                          checked={Boolean(val)}
                          onCheckedChange={(checked) => updateField(field.key, checked)}
                        />
                      </div>
                    )}

                    {field.control === 'number' && (
                      <div className="space-y-1">
                        <div className="flex items-center rounded-lg border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/50">
                          <input
                            id={`cfg-${field.key}`}
                            type="number"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            disabled={!active || !permissions.canConfigureDevice}
                            value={val === undefined || val === null ? '' : String(val)}
                            onChange={(e) => updateField(field.key, e.target.value === '' ? '' : Number(e.target.value))}
                            className={cn(
                              'flex-1 h-9 bg-transparent px-2.5 text-xs font-mono text-foreground focus:outline-none',
                              (!active || !permissions.canConfigureDevice) &&
                                'opacity-55 cursor-not-allowed'
                            )}
                          />
                          {field.unit && (
                            <span className="px-2.5 text-[11px] font-mono text-muted-foreground border-l border-border bg-muted/30 h-9 flex items-center">
                              {field.unit}
                            </span>
                          )}
                        </div>
                        {field.rangeLabel && (
                          <div className="text-[10px] text-muted-foreground font-mono">
                            Allowed: {field.rangeLabel}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dependency explanation, edit diff, warning, or error */}
                    {!active && field.dependsOn && (
                      <p className="text-[11px] text-muted-foreground">{field.dependsOn.reasonText}</p>
                    )}

                    {isEdited && (
                      <p className="text-[11px] text-primary font-medium">
                        Modified (device reports: <span className="font-mono">{String(reportedVal || '—')}</span>)
                      </p>
                    )}

                    {err && <p className="text-[11px] text-red-500 font-medium">{err}</p>}

                    {hasWarning && !err && (
                      <p className="text-[11px] text-amber-500 flex items-center gap-1 font-medium">
                        <AlertTriangle className="size-3 shrink-0" />
                        <span>{field.warningRule!.message}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Clean Anchored Footer Action Bar (never floats over form fields!) */}
      <div className="rounded-xl border border-border bg-card px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="text-xs text-muted-foreground">
          {isDirty ? (
            <span>
              <strong className="font-mono text-foreground">{changes.length}</strong>{' '}
              {changes.length === 1 ? 'setting modified' : 'settings modified'} · Edge applies only modified keys.
            </span>
          ) : (
            <span>No setting changed. Modify any control above to prepare an Edge update.</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!isDirty || sending}
            onClick={handleUndoAll}
            className="h-8 px-3 text-xs gap-1.5 border-border bg-card hover:bg-muted cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span>Undo changes</span>
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!isDirty || hasValidationErrors || !permissions.canConfigureDevice || sending}
            onClick={() => setReviewOpen(true)}
            className="h-8 px-3.5 text-xs gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
          >
            <Send className="size-3.5" />
            <span>
              {isDirty ? `Review & send (${changes.length})` : 'Send to device'}
            </span>
          </Button>
        </div>
      </div>

      {/* Review Changes & Send to Edge Sheet */}
      <Sheet open={reviewOpen} onOpenChange={setReviewOpen}>
        <SheetContent className="sm:max-w-lg bg-card text-card-foreground border-border px-6 py-5 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-base">Review & send configuration</SheetTitle>
            <SheetDescription className="text-xs">
              Edge will push only the {changes.length} modified {changes.length === 1 ? 'setting' : 'settings'} to{' '}
              <span className="font-mono font-semibold text-foreground">{device.identifier}</span>.
            </SheetDescription>
          </SheetHeader>

          <div className="py-4 space-y-4">
            {device.connectivityState === 'offline' && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs flex items-start gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Device is currently Offline.</strong> Edge push will fail or time out until the unit reconnects.
                </div>
              </div>
            )}

            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider text-[10px]">
                    <th className="py-2 px-3 font-semibold">Setting</th>
                    <th className="py-2 px-3 font-semibold">Device value</th>
                    <th className="py-2 px-3 font-semibold">New value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {changes.map((c) => (
                    <tr key={c.key}>
                      <td className="py-2 px-3 font-medium text-foreground">{c.label}</td>
                      <td className="py-2 px-3 font-mono text-muted-foreground line-through">
                        {String(c.fromValue ?? '—')}
                      </td>
                      <td className="py-2 px-3 font-mono font-semibold text-primary">
                        {String(c.toValue ?? '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cfg-note" className="text-xs font-medium text-foreground block">
                Change note (optional)
              </label>
              <textarea
                id="cfg-note"
                rows={2}
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="Reason for adjusting Edge settings..."
                className="w-full rounded-lg border border-border bg-background p-2.5 text-xs"
              />
            </div>

            {changes.length > 1 && (
              <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulatePartialFailure}
                  onChange={(e) => setSimulatePartialFailure(e.target.checked)}
                />
                <span>Simulate Edge ACK timeout on last setting (test partial failure & retry)</span>
              </label>
            )}
          </div>

          <SheetFooter className="gap-2 border-t border-border pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReviewOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={sending}
              onClick={handleConfirmSend}
              className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
            >
              <Send className="size-3.5" />
              <span>{sending ? 'Sending...' : 'Confirm & send to Edge'}</span>
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

