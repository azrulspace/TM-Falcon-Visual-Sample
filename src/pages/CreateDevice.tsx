import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
  ChevronRight,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Radar,
  Cpu,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { useAssets } from '@/contexts/AssetsContext';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DEVICE_TYPE_OPTIONS,
  LIBRARY_OPTIONS_BY_MANUFACTURER,
  MANUFACTURER_OPTIONS,
} from '@/data/devicesRegistry';
import {
  DeviceTypeBadge,
  VendorMatchBadge,
} from '@/components/assets/devices/DeviceStateBadge';
import { cn } from '@/lib/utils';
import type { DeviceLifecycleState, DeviceTypeCategory } from '@/types/devices';

const UNIFIED_CONTROL_CLASS =
  'w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors';

export default function CreateDevice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: editParamId } = useParams<{ id?: string }>();
  const { selectedSite } = useAppContext();
  const {
    sites,
    poles,
    vendorRecords,
    devicePermissions,
    getDeviceById,
    isDeviceIdentifierUnique,
    registerDevice,
    editDevice,
  } = useAssets();

  const existingDevice = useMemo(
    () => (editParamId ? getDeviceById(editParamId) : undefined),
    [editParamId, getDeviceById]
  );
  const isEdit = Boolean(editParamId);

  const prefillSerial = searchParams.get('vendorSerial') || '';
  const matchedPrefillVendor = useMemo(
    () =>
      prefillSerial
        ? vendorRecords.find((v) => v.serial.toLowerCase() === prefillSerial.toLowerCase())
        : undefined,
    [prefillSerial, vendorRecords]
  );

  const defaultSite =
    selectedSite && selectedSite !== 'ALL' && sites.some((s) => s.name === selectedSite)
      ? selectedSite
      : sites[0]?.name || 'Unassigned';

  const [identifier, setIdentifier] = useState(
    existingDevice?.identifier || ''
  );
  const [name, setName] = useState(existingDevice?.name || '');
  const [siteName, setSiteName] = useState(
    existingDevice ? existingDevice.siteName || 'Unassigned' : defaultSite
  );
  const [type, setType] = useState<DeviceTypeCategory | ''>(
    existingDevice?.type || (matchedPrefillVendor?.model.includes('QAZ') ? 'Speaker' : matchedPrefillVendor ? 'Camera' : '')
  );
  const [manufacturer, setManufacturer] = useState<string>(
    existingDevice?.manufacturer || matchedPrefillVendor?.manufacturer || ''
  );
  const [library, setLibrary] = useState<string>(
    existingDevice?.library || matchedPrefillVendor?.library || ''
  );
  const [model, setModel] = useState(
    existingDevice?.model || matchedPrefillVendor?.model || ''
  );
  const [serial, setSerial] = useState(
    existingDevice?.serial || matchedPrefillVendor?.serial || prefillSerial
  );
  const [lifecycle, setLifecycle] = useState<DeviceLifecycleState>(
    existingDevice?.lifecycle || 'Active'
  );
  const [componentsText, setComponentsText] = useState(
    existingDevice?.components.join('\n') || ''
  );
  const [installedPoleId, setInstalledPoleId] = useState<string>(
    existingDevice?.installedPoleId || ''
  );

  const [vendorPickerOpen, setVendorPickerOpen] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [pendingNavTarget, setPendingNavTarget] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const libraryOptions = useMemo(() => {
    if (!manufacturer) return [];
    return LIBRARY_OPTIONS_BY_MANUFACTURER[manufacturer] || [];
  }, [manufacturer]);

  useEffect(() => {
    if (!isEdit && manufacturer && libraryOptions.length > 0 && !libraryOptions.includes(library)) {
      setLibrary(libraryOptions[0]);
    }
  }, [manufacturer, libraryOptions, library, isEdit]);

  const parsedComponents = useMemo(
    () =>
      componentsText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    [componentsText]
  );

  const sitePoles = useMemo(() => {
    const active = poles.filter((p) => p.lifecycle !== 'Deleted');
    if (siteName === 'Unassigned') return active;
    return active.filter((p) => p.siteName === siteName);
  }, [poles, siteName]);

  // Live identifier rules & uniqueness check
  const identifierError = useMemo(() => {
    if (isEdit) return null;
    const trim = identifier.trim();
    if (!trim) return submitAttempted ? 'Identifier is required.' : null;
    if (!/^[A-Za-z0-9-]+$/.test(trim)) {
      return 'Use only letters, digits, and hyphens (e.g. CAM-001 or GV0032063).';
    }
    if (!isDeviceIdentifierUnique(trim)) {
      return `Identifier "${trim}" is already registered in FALCON.`;
    }
    return null;
  }, [identifier, isEdit, submitAttempted, isDeviceIdentifierUnique]);

  // Live serial match against Vendor Discovery
  const vendorSerialMatch = useMemo(() => {
    const clean = serial.trim().toLowerCase();
    if (!clean) return null;
    return vendorRecords.find((v) => v.serial.toLowerCase() === clean) || null;
  }, [serial, vendorRecords]);

  const validationErrors = useMemo(() => {
    const errs: { id: string; message: string }[] = [];
    if (!isEdit) {
      if (!identifier.trim()) errs.push({ id: 'dev-identifier', message: 'Identifier is required.' });
      else if (identifierError) errs.push({ id: 'dev-identifier', message: identifierError });
    }
    if (!type) errs.push({ id: 'dev-type', message: 'Choose a device type.' });
    if (!manufacturer) errs.push({ id: 'dev-manufacturer', message: 'Choose a manufacturer.' });
    if (!library) errs.push({ id: 'dev-library', message: 'Choose a vendor library.' });
    if (!serial.trim()) errs.push({ id: 'dev-serial', message: 'Serial number is required.' });
    return errs;
  }, [isEdit, identifier, identifierError, type, manufacturer, library, serial]);

  const isDirty = useMemo(() => {
    if (isEdit && existingDevice) {
      return (
        name !== existingDevice.name ||
        siteName !== (existingDevice.siteName || 'Unassigned') ||
        type !== existingDevice.type ||
        manufacturer !== existingDevice.manufacturer ||
        library !== existingDevice.library ||
        model !== existingDevice.model ||
        serial !== existingDevice.serial ||
        lifecycle !== existingDevice.lifecycle ||
        componentsText !== existingDevice.components.join('\n')
      );
    }
    return Boolean(
      identifier.trim() ||
        name.trim() ||
        type ||
        manufacturer ||
        model.trim() ||
        serial.trim() ||
        componentsText.trim()
    );
  }, [
    isEdit,
    existingDevice,
    identifier,
    name,
    siteName,
    type,
    manufacturer,
    library,
    model,
    serial,
    lifecycle,
    componentsText,
  ]);

  const requestCancel = (target = '/assets/inventory') => {
    if (isDirty) {
      setPendingNavTarget(target);
      setConfirmLeaveOpen(true);
    } else {
      navigate(target);
    }
  };

  const applyVendorSelection = (vr: (typeof vendorRecords)[number]) => {
    setManufacturer(vr.manufacturer);
    setLibrary(vr.library);
    setModel(vr.model);
    setSerial(vr.serial);
    if (!type) {
      setType(vr.model.includes('QAZ') ? 'Speaker' : 'Camera');
    }
    if (!name.trim()) setName(vr.vendorName);
    setVendorPickerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent, goToInstallStep = false) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setServerError(null);

    if (validationErrors.length > 0) return;

    setSubmitting(true);
    if (isEdit && existingDevice) {
      const res = await editDevice(existingDevice.identifier, {
        name: name.trim() || existingDevice.identifier,
        siteName,
        type: type as DeviceTypeCategory,
        manufacturer,
        library,
        model: model.trim() || 'Unspecified',
        serial: serial.trim(),
        vendorDeviceId: serial.trim(),
        lifecycle,
        components: parsedComponents,
      });
      setSubmitting(false);
      if (!res.ok) {
        setServerError(res.error || 'Failed to update device.');
        return;
      }
      navigate(`/assets/inventory/devices/${encodeURIComponent(existingDevice.identifier)}`);
      return;
    }

    const res = await registerDevice({
      identifier: identifier.trim(),
      name: name.trim() || identifier.trim(),
      siteName,
      type: type as DeviceTypeCategory,
      manufacturer,
      library,
      model: model.trim() || 'Unspecified',
      serial: serial.trim(),
      vendorDeviceId: serial.trim(),
      lifecycle,
      components: parsedComponents,
      installedPoleId: installedPoleId || null,
    });
    setSubmitting(false);

    if (!res.ok || !res.device) {
      setServerError(res.error || 'Failed to register device.');
      return;
    }

    if (goToInstallStep && !res.device.installedPoleId) {
      navigate(
        `/assets/inventory/devices/${encodeURIComponent(res.device.identifier)}?tab=installation`
      );
    } else {
      navigate(`/assets/inventory/devices/${encodeURIComponent(res.device.identifier)}`);
    }
  };

  const filteredVendorChoices = useMemo(() => {
    const q = vendorSearch.trim().toLowerCase();
    return vendorRecords.filter((v) => {
      if (!q) return true;
      return (
        v.serial.toLowerCase().includes(q) ||
        v.vendorName.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q)
      );
    });
  }, [vendorRecords, vendorSearch]);

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Unified Breadcrumb */}
      <nav
        className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium"
        aria-label="Breadcrumb"
      >
        <Link to="/overview" className="hover:text-foreground transition-colors">
          Falcon
        </Link>
        <ChevronRight className="size-3 text-muted-foreground/60" />
        <Link to="/assets/poles" className="hover:text-foreground transition-colors">
          Assets and devices
        </Link>
        <ChevronRight className="size-3 text-muted-foreground/60" />
        <button
          type="button"
          onClick={() => requestCancel('/assets/inventory')}
          className="hover:text-foreground transition-colors cursor-pointer"
        >
          Devices
        </button>
        <ChevronRight className="size-3 text-muted-foreground/60" />
        <span className="text-foreground font-semibold">
          {isEdit ? `Edit ${existingDevice?.identifier || editParamId}` : 'Register device'}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {isEdit ? `Edit ${existingDevice?.identifier || editParamId}` : 'Register device'}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {isEdit
              ? 'Update placement, hardware details, or administrative lifecycle. Identifier cannot change.'
              : 'Create a FALCON device record and link it to Edge vendor hardware.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setVendorPickerOpen(true)}
              className="h-8 px-3 text-xs gap-1.5 border-border bg-card hover:bg-muted cursor-pointer"
            >
              <Radar className="size-3.5 text-primary" />
              <span>Register from vendor list</span>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              requestCancel(
                isEdit && existingDevice
                  ? `/assets/inventory/devices/${encodeURIComponent(existingDevice.identifier)}`
                  : '/assets/inventory'
              )
            }
            className="h-8 px-3 text-xs gap-1.5 border-border bg-card hover:bg-muted cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back</span>
          </Button>
        </div>
      </div>

      {/* Validation Error Summary */}
      {(submitAttempted && validationErrors.length > 0) || serverError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs space-y-1.5"
        >
          <div className="flex items-center gap-2 font-semibold text-red-600 dark:text-red-400">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{serverError || 'Fix the following before saving:'}</span>
          </div>
          {validationErrors.length > 0 && (
            <ul className="list-disc pl-6 space-y-0.5 text-foreground">
              {validationErrors.map((err) => (
                <li key={err.id}>
                  <a
                    href={`#${err.id}`}
                    onClick={(ev) => {
                      ev.preventDefault();
                      document.getElementById(err.id)?.focus();
                    }}
                    className="underline hover:text-primary"
                  >
                    {err.message}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <form
        onSubmit={(e) => handleSubmit(e, false)}
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
      >
        {/* Left Main Form (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* 1. Identity */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Identity</h2>
              <p className="text-xs text-muted-foreground">
                Unique registry identifier used across Overview, Events, Cases, and Poles.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="dev-identifier"
                  className="text-xs font-medium text-foreground flex items-center gap-1.5"
                >
                  <span>Identifier</span>
                  <span className="text-red-500">*</span>
                  {isEdit && <Lock className="size-3 text-muted-foreground" />}
                </label>
                <input
                  id="dev-identifier"
                  type="text"
                  disabled={isEdit}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="CAM-001"
                  className={cn(
                    UNIFIED_CONTROL_CLASS,
                    'font-mono',
                    isEdit && 'opacity-70 cursor-not-allowed bg-muted/60',
                    identifierError && 'border-red-500 focus:ring-red-500/40'
                  )}
                />
                {identifierError ? (
                  <p className="text-[11px] text-red-500 font-medium">{identifierError}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Letters, digits and hyphens. It cannot change later.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="dev-name" className="text-xs font-medium text-foreground block">
                  Name
                </label>
                <input
                  id="dev-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Leave empty to use identifier"
                  className={UNIFIED_CONTROL_CLASS}
                />
                <p className="text-[11px] text-muted-foreground">
                  Human-friendly label; falls back to identifier if left blank.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Placement & Lifecycle */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Placement & lifecycle</h2>
              <p className="text-xs text-muted-foreground">
                Site assignment and optional physical pole mounting.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="dev-site" className="text-xs font-medium text-foreground block">
                  Site
                </label>
                <select
                  id="dev-site"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className={UNIFIED_CONTROL_CLASS}
                >
                  <option value="Unassigned">Unassigned</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="dev-lifecycle" className="text-xs font-medium text-foreground block">
                  Lifecycle
                </label>
                <select
                  id="dev-lifecycle"
                  value={lifecycle}
                  onChange={(e) => setLifecycle(e.target.value as DeviceLifecycleState)}
                  className={UNIFIED_CONTROL_CLASS}
                >
                  <option value="Active">Active</option>
                  <option value="Planned">Planned</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>

              {!isEdit && (
                <div className="space-y-1.5">
                  <label htmlFor="dev-pole" className="text-xs font-medium text-foreground block">
                    Install on pole (optional)
                  </label>
                  <select
                    id="dev-pole"
                    value={installedPoleId}
                    onChange={(e) => setInstalledPoleId(e.target.value)}
                    className={UNIFIED_CONTROL_CLASS}
                  >
                    <option value="">Not installed yet</option>
                    {sitePoles.map((p) => (
                      <option key={p.identifier} value={p.identifier}>
                        {p.identifier} ({p.siteName})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </section>

          {/* 3. Hardware & Vendor Library */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Hardware & vendor driver</h2>
              <p className="text-xs text-muted-foreground">
                Edge integration library and vendor serial binding.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="dev-type" className="text-xs font-medium text-foreground block">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="dev-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as DeviceTypeCategory)}
                  className={UNIFIED_CONTROL_CLASS}
                >
                  <option value="">Choose a type</option>
                  {DEVICE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="dev-manufacturer"
                  className="text-xs font-medium text-foreground block"
                >
                  Manufacturer <span className="text-red-500">*</span>
                </label>
                <select
                  id="dev-manufacturer"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className={UNIFIED_CONTROL_CLASS}
                >
                  <option value="">Choose a manufacturer</option>
                  {MANUFACTURER_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unified control styling for Library matching Manufacturer/Type */}
              <div className="space-y-1.5">
                <label htmlFor="dev-library" className="text-xs font-medium text-foreground block">
                  Library <span className="text-red-500">*</span>
                </label>
                <select
                  id="dev-library"
                  value={library}
                  disabled={!manufacturer}
                  onChange={(e) => setLibrary(e.target.value)}
                  className={cn(
                    UNIFIED_CONTROL_CLASS,
                    !manufacturer && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  <option value="">
                    {manufacturer ? 'Choose a library' : 'Select manufacturer first'}
                  </option>
                  {libraryOptions.map((lib) => (
                    <option key={lib} value={lib}>
                      {lib}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="dev-model" className="text-xs font-medium text-foreground block">
                  Model
                </label>
                <input
                  id="dev-model"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. DS-2CFSP4/4G"
                  className={UNIFIED_CONTROL_CLASS}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="dev-serial" className="text-xs font-medium text-foreground block">
                  Serial number <span className="text-red-500">*</span>
                </label>
                <input
                  id="dev-serial"
                  type="text"
                  value={serial}
                  onChange={(e) => setSerial(e.target.value)}
                  placeholder="e.g. GH8814209"
                  className={cn(UNIFIED_CONTROL_CLASS, 'font-mono')}
                />
                {vendorSerialMatch && (
                  <div
                    className={cn(
                      'mt-1.5 rounded-lg border px-2.5 py-2 text-[11px] flex items-start gap-2',
                      vendorSerialMatch.matchStatus === 'Conflict'
                        ? 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400'
                        : vendorSerialMatch.matchStatus === 'Registered'
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    )}
                  >
                    <Info className="size-3.5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">
                        Vendor discovery match: {vendorSerialMatch.matchStatus}
                      </span>
                      <span className="block opacity-90">
                        {vendorSerialMatch.matchStatus === 'Not registered'
                          ? `Ready to bind "${vendorSerialMatch.vendorName}" to this FALCON record.`
                          : vendorSerialMatch.matchedFalconId
                          ? `Currently linked to ${vendorSerialMatch.matchedFalconId}.`
                          : vendorSerialMatch.conflictReason}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 4. Components */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Components</h2>
                <p className="text-xs text-muted-foreground">
                  One component per line, in order. For example: Camera.
                </p>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                {parsedComponents.length}{' '}
                {parsedComponents.length === 1 ? 'component' : 'components'}
              </span>
            </div>

            <textarea
              id="dev-components"
              rows={3}
              value={componentsText}
              onChange={(e) => setComponentsText(e.target.value)}
              placeholder={'Camera\nSolar MPPT'}
              className="w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </section>
        </div>

        {/* Right Live Summary & Actions Panel (4 cols) */}
        <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Cpu className="size-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Summary preview
                </span>
              </div>
              {type && <DeviceTypeBadge type={type as DeviceTypeCategory} />}
            </div>

            <dl className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Identifier</dt>
                <dd className="font-mono font-semibold text-foreground">
                  {identifier.trim() || '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Site</dt>
                <dd className="font-medium text-foreground">{siteName}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Hardware</dt>
                <dd className="font-medium text-foreground text-right">
                  {manufacturer || '—'} {library ? `· ${library}` : ''}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Serial</dt>
                <dd className="font-mono text-foreground">{serial.trim() || '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Installation</dt>
                <dd className="font-mono text-foreground">
                  {installedPoleId || 'Not installed'}
                </dd>
              </div>
            </dl>

            <div className="pt-3 border-t border-border space-y-2">
              <Button
                type="submit"
                disabled={submitting || !devicePermissions.canRegisterDevice}
                className="w-full h-9 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
              >
                <CheckCircle2 className="size-3.5 mr-1.5" />
                <span>{isEdit ? 'Save changes' : 'Register device'}</span>
              </Button>

              {!isEdit && !installedPoleId && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting || !devicePermissions.canRegisterDevice}
                  onClick={(e) => handleSubmit(e, true)}
                  className="w-full h-9 text-xs font-medium border-border hover:bg-muted cursor-pointer"
                >
                  Register and install on pole →
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                onClick={() => requestCancel()}
                className="w-full h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </div>
        </aside>
      </form>

      {/* Register from Vendor List Picker Dialog */}
      <Dialog open={vendorPickerOpen} onOpenChange={setVendorPickerOpen}>
        <DialogContent className="sm:max-w-xl bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Radar className="size-4 text-primary" />
              <span>Select from vendor discovery list</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Prefill manufacturer, library, model, and serial directly from Edge vendor records.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <input
              type="text"
              value={vendorSearch}
              onChange={(e) => setVendorSearch(e.target.value)}
              placeholder="Filter by serial, vendor name, or model..."
              className={UNIFIED_CONTROL_CLASS}
            />

            <div className="max-h-72 overflow-y-auto divide-y divide-border/60 rounded-lg border border-border">
              {filteredVendorChoices.map((vr) => (
                <div
                  key={vr.id}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {vr.serial}
                      </span>
                      <VendorMatchBadge status={vr.matchStatus} />
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {vr.vendorName} · {vr.model} · {vr.library}
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={vr.matchStatus === 'Not registered' ? 'default' : 'outline'}
                    onClick={() => applyVendorSelection(vr)}
                    className="h-7 px-2.5 text-xs shrink-0 cursor-pointer"
                  >
                    Use details
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Leave Confirmation */}
      <Dialog open={confirmLeaveOpen} onOpenChange={setConfirmLeaveOpen}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-base">Discard unsaved device changes?</DialogTitle>
            <DialogDescription className="text-xs">
              You have unsaved entries in this form. Leaving now will discard them.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmLeaveOpen(false)}
              className="cursor-pointer"
            >
              Keep editing
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => navigate(pendingNavTarget || '/assets/inventory')}
              className="cursor-pointer"
            >
              Discard changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
