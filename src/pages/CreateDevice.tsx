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
  Video,
  Volume2,
  Radio,
  MapPin,
  Plus,
  ShieldCheck,
  Layers,
  Zap,
  Check,
  Circle,
  Building2,
  Router,
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
  DEVICE_LIFECYCLE_OPTIONS,
  LIBRARY_OPTIONS_BY_MANUFACTURER,
  MANUFACTURER_OPTIONS,
} from '@/data/devicesRegistry';
import {
  DeviceTypeBadge,
  DeviceLifecycleBadge,
  DeviceConnectivityBadge,
  VendorMatchBadge,
} from '@/components/assets/devices/DeviceStateBadge';
import { cn } from '@/lib/utils';
import type { DeviceLifecycleState, DeviceTypeCategory } from '@/types/devices';

const UNIFIED_CONTROL_CLASS =
  'h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors';

export default function CreateDevice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: editParamId } = useParams<{ id?: string }>();
  const { selectedSite } = useAppContext();
  const {
    sites,
    poles,
    richDevices,
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

  // Filter unmapped vendor hardware detected on Edge
  const unmappedVendorRecords = useMemo(() => {
    return vendorRecords.filter((v) => v.matchStatus === 'Not registered');
  }, [vendorRecords]);

  // Recent devices at selected site for fleet context
  const recentSiteDevices = useMemo(() => {
    const match = richDevices.filter((d) => (siteName === 'Unassigned' ? true : d.siteName === siteName));
    return match.slice(0, 3);
  }, [richDevices, siteName]);

  const validationErrors = useMemo(() => {
    const errs: { id: string; message: string }[] = [];
    if (!isEdit) {
      if (!identifier.trim()) errs.push({ id: 'dev-identifier', message: 'Identifier is required.' });
      else if (identifierError) errs.push({ id: 'dev-identifier', message: identifierError });
    }
    if (!type) errs.push({ id: 'dev-type', message: 'Choose a device category.' });
    if (!manufacturer) errs.push({ id: 'dev-manufacturer', message: 'Choose a manufacturer.' });
    if (!library) errs.push({ id: 'dev-library', message: 'Choose a vendor library.' });
    if (!serial.trim()) errs.push({ id: 'dev-serial', message: 'Serial number is required.' });
    return errs;
  }, [isEdit, identifier, identifierError, type, manufacturer, library, serial]);

  // Standards readiness checks
  const standardsChecklist = useMemo(() => {
    return [
      {
        id: 'id-valid',
        label: 'Unique Registry Identifier',
        done: isEdit || (Boolean(identifier.trim()) && !identifierError),
        detail: isEdit ? 'Permanent identifier' : identifier.trim() || 'Required',
      },
      {
        id: 'type-valid',
        label: 'Hardware Category',
        done: Boolean(type),
        detail: type || 'Unselected',
      },
      {
        id: 'driver-valid',
        label: 'Edge Driver Configuration',
        done: Boolean(manufacturer && library),
        detail: manufacturer && library ? `${manufacturer} · ${library}` : 'Incomplete',
      },
      {
        id: 'serial-valid',
        label: 'Hardware Serial Binding',
        done: Boolean(serial.trim() && vendorSerialMatch?.matchStatus !== 'Conflict'),
        detail: serial.trim() ? (vendorSerialMatch?.matchStatus === 'Conflict' ? 'Conflict!' : serial.trim()) : 'Required',
      },
      {
        id: 'site-valid',
        label: 'Geographic Site Placement',
        done: siteName !== 'Unassigned',
        detail: siteName,
      },
    ];
  }, [isEdit, identifier, identifierError, type, manufacturer, library, serial, vendorSerialMatch, siteName]);

  const allStandardsMet = useMemo(() => {
    return standardsChecklist.every((item) => item.done);
  }, [standardsChecklist]);

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
    if (!identifier.trim() && !isEdit) {
      const pfx = vr.model.includes('QAZ') ? 'SPK-' : 'CAM-';
      const lastDigits = vr.serial.replace(/\D/g, '').slice(-4) || '001';
      setIdentifier(`${pfx}${lastDigits}`);
    }
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
    <div className="space-y-5 max-w-[1360px] mx-auto pb-10">
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {isEdit ? `Edit ${existingDevice?.identifier || editParamId}` : 'Register device'}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {isEdit
              ? 'Update placement, hardware details, or administrative lifecycle. Identifier cannot change.'
              : 'Create a FALCON device record, categorize its role, and link it to Edge vendor hardware.'}
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
              <span>Browse vendor list</span>
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
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        {/* Left Column: Form Sections (7 cols on lg, 7 cols on xl) */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-5">
          {/* 1. Identity Section */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span>1. Device Identity</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Unique registry identifier used across Overview, Events, Cases, and Poles.
                </p>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">Immutable key</span>
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
                    'w-full font-mono',
                    isEdit && 'opacity-70 cursor-not-allowed bg-muted/60',
                    identifierError && 'border-red-500 focus:ring-red-500/40'
                  )}
                />

                {!isEdit && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                      Prefix:
                    </span>
                    {['CAM-', 'SPK-', 'LDR-', 'DEV-'].map((pfx) => (
                      <button
                        key={pfx}
                        type="button"
                        onClick={() => {
                          if (!identifier.trim()) {
                            setIdentifier(pfx);
                          } else {
                            const match = identifier.match(/^[A-Z]+-(.*)$/);
                            if (match) {
                              setIdentifier(`${pfx}${match[1]}`);
                            } else {
                              setIdentifier(`${pfx}${identifier}`);
                            }
                          }
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-medium border border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        {pfx}
                      </button>
                    ))}
                  </div>
                )}

                {identifierError ? (
                  <p className="text-[11px] text-red-500 font-medium">{identifierError}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Letters, digits, and hyphens. Cannot change once registered.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="dev-name" className="text-xs font-medium text-foreground block">
                  Friendly label (optional)
                </label>
                <input
                  id="dev-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Leave empty to use identifier"
                  className={cn(UNIFIED_CONTROL_CLASS, 'w-full')}
                />
                <p className="text-[11px] text-muted-foreground">
                  Human-readable alias; defaults to identifier in tables and maps.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Placement & Lifecycle Section */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div className="border-b border-border/60 pb-3">
              <h2 className="text-sm font-semibold text-foreground">2. Placement & lifecycle</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Site boundary assignment, lifecycle stage, and physical pole mounting.
              </p>
            </div>

            {/* Hug controls: Site and Pole arranged naturally */}
            <div className="flex flex-wrap gap-5 items-start">
              {/* Site Dropdown - Hugs content */}
              <div className="space-y-1.5">
                <label htmlFor="dev-site" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  <span>Site assignment</span>
                </label>
                <div>
                  <select
                    id="dev-site"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className={cn(
                      UNIFIED_CONTROL_CLASS,
                      'w-auto min-w-[210px] max-w-[280px] cursor-pointer'
                    )}
                  >
                    <option value="Unassigned">Unassigned</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-muted-foreground">Operating geographic jurisdiction.</p>
              </div>

              {/* Install on pole (optional) - Hugs content */}
              {!isEdit && (
                <div className="space-y-1.5">
                  <label htmlFor="dev-pole" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Radio className="size-3.5 text-muted-foreground" />
                    <span>Install on pole (optional)</span>
                    <span className="text-[11px] text-muted-foreground/80 font-normal">
                      ({sitePoles.length} available)
                    </span>
                  </label>
                  <div>
                    <select
                      id="dev-pole"
                      value={installedPoleId}
                      onChange={(e) => setInstalledPoleId(e.target.value)}
                      className={cn(
                        UNIFIED_CONTROL_CLASS,
                        'w-auto min-w-[230px] max-w-[320px] cursor-pointer font-mono'
                      )}
                    >
                      <option value="">Not installed yet</option>
                      {sitePoles.map((p) => (
                        <option key={p.identifier} value={p.identifier}>
                          {p.identifier} ({p.siteName})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Can be mounted immediately or deferred.</p>
                </div>
              )}
            </div>

            {/* Lifecycle State - Segmented Tactile Pill Control (100% Hugs Content) */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <label className="text-xs font-medium text-foreground block">
                Lifecycle state
              </label>
              <div className="inline-flex p-1 rounded-lg bg-background border border-border gap-1 flex-wrap w-fit">
                {DEVICE_LIFECYCLE_OPTIONS.map((opt) => {
                  const isSelected = lifecycle === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setLifecycle(opt)}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer select-none',
                        isSelected
                          ? 'bg-card text-foreground shadow-xs border border-border font-semibold ring-1 ring-primary/40'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                    >
                      <span
                        className={cn('size-1.5 rounded-full', {
                          'bg-emerald-500': opt === 'Active',
                          'bg-sky-500': opt === 'Planned',
                          'bg-amber-500': opt === 'Maintenance',
                          'bg-zinc-400': opt === 'Retired',
                        })}
                      />
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Sets baseline administrative lifecycle. Connectivity (Online/Offline) is computed from live Edge telemetry.
              </p>
            </div>
          </section>

          {/* 3. Hardware & Vendor Driver Section */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div className="border-b border-border/60 pb-3">
              <h2 className="text-sm font-semibold text-foreground">3. Hardware & vendor driver</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Functional role category, Edge integration library, and vendor serial number binding.
              </p>
            </div>

            {/* Device Category Selector - Segmented Icon Pills (Hugs Content) */}
            <div className="space-y-2">
              <label id="dev-type" className="text-xs font-medium text-foreground flex items-center gap-1">
                <span>Hardware category</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2 w-fit">
                {DEVICE_TYPE_OPTIONS.map((opt) => {
                  const isSelected = type === opt;
                  const Icon =
                    opt === 'Camera'
                      ? Video
                      : opt === 'Speaker'
                      ? Volume2
                      : opt === 'LiDAR sensor'
                      ? Radio
                      : Cpu;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setType(opt);
                        if (!identifier.trim() && !isEdit) {
                          const pfx =
                            opt === 'Camera'
                              ? 'CAM-'
                              : opt === 'Speaker'
                              ? 'SPK-'
                              : opt === 'LiDAR sensor'
                              ? 'LDR-'
                              : 'DEV-';
                          setIdentifier(pfx);
                        }
                      }}
                      className={cn(
                        'px-3.5 py-2 rounded-lg text-xs font-medium border transition-all flex items-center gap-2 cursor-pointer select-none',
                        isSelected
                          ? 'bg-primary/10 border-primary text-primary font-semibold ring-1 ring-primary/40 shadow-xs'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-muted/30'
                      )}
                    >
                      <Icon className={cn('size-3.5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Determines driver schema, audio/video telemetry channels, and configuration rules.
              </p>
            </div>

            {/* Manufacturer & Library - Paired Hug Controls */}
            <div className="flex flex-wrap gap-4 items-start pt-2 border-t border-border/40">
              <div className="space-y-1.5">
                <label
                  htmlFor="dev-manufacturer"
                  className="text-xs font-medium text-foreground flex items-center gap-1"
                >
                  <Building2 className="size-3.5 text-muted-foreground" />
                  <span>Manufacturer</span>
                  <span className="text-red-500">*</span>
                </label>
                <div>
                  <select
                    id="dev-manufacturer"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className={cn(
                      UNIFIED_CONTROL_CLASS,
                      'w-auto min-w-[190px] max-w-[240px] cursor-pointer'
                    )}
                  >
                    <option value="">Choose manufacturer</option>
                    {MANUFACTURER_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="dev-library"
                  className="text-xs font-medium text-foreground flex items-center gap-1"
                >
                  <Router className="size-3.5 text-muted-foreground" />
                  <span>Edge integration library</span>
                  <span className="text-red-500">*</span>
                </label>
                <div>
                  <select
                    id="dev-library"
                    value={library}
                    disabled={!manufacturer}
                    onChange={(e) => setLibrary(e.target.value)}
                    className={cn(
                      UNIFIED_CONTROL_CLASS,
                      'w-auto min-w-[210px] max-w-[260px] cursor-pointer font-mono',
                      !manufacturer && 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    <option value="">
                      {manufacturer ? 'Choose vendor library' : 'Select manufacturer first'}
                    </option>
                    {libraryOptions.map((lib) => (
                      <option key={lib} value={lib}>
                        {lib}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Model & Serial Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/40">
              <div className="space-y-1.5">
                <label htmlFor="dev-model" className="text-xs font-medium text-foreground block">
                  Hardware model
                </label>
                <input
                  id="dev-model"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. DS-2CFSP4/4G"
                  className={cn(UNIFIED_CONTROL_CLASS, 'w-full')}
                />
                <p className="text-[11px] text-muted-foreground">Vendor device model string.</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="dev-serial" className="text-xs font-medium text-foreground flex items-center gap-1">
                  <span>Serial number</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="dev-serial"
                  type="text"
                  value={serial}
                  onChange={(e) => setSerial(e.target.value)}
                  placeholder="e.g. GH8814209"
                  className={cn(UNIFIED_CONTROL_CLASS, 'w-full font-mono')}
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

          {/* 4. Components Section */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">4. Physical sub-components</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sub-assemblies attached to this unit (one per line).
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
              placeholder={'Camera\nSolar MPPT\nBattery 12V'}
              className="w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />

            {/* Quick add component chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                Quick add:
              </span>
              {[
                'Camera',
                'Speaker horn',
                'Solar MPPT',
                'Battery 12V',
                'PIR sensor',
                '4G LTE Antenna',
              ].map((comp) => (
                <button
                  key={comp}
                  type="button"
                  onClick={() => {
                    const current = componentsText.split('\n').map((l) => l.trim()).filter(Boolean);
                    if (!current.includes(comp)) {
                      setComponentsText(current.length > 0 ? `${componentsText.trim()}\n${comp}` : comp);
                    }
                  }}
                  className="px-2 py-0.5 rounded text-[11px] font-medium border border-border/80 bg-background hover:bg-primary/10 hover:border-primary/40 hover:text-primary text-muted-foreground transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="size-2.5" />
                  <span>{comp}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Purposeful Operational Intelligence & Verification Rail (5 cols) */}
        <aside className="lg:col-span-5 xl:col-span-5 space-y-4 lg:sticky lg:top-20">
          {/* Card 1: Live Summary Preview & Actions */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Cpu className="size-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Summary preview
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {type && <DeviceTypeBadge type={type as DeviceTypeCategory} />}
                <DeviceLifecycleBadge lifecycle={lifecycle} />
              </div>
            </div>

            <dl className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Identifier</dt>
                <dd className="font-mono font-semibold text-foreground">
                  {identifier.trim() || '—'}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-medium text-foreground">
                  {type || 'Unselected'}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Site</dt>
                <dd className="font-medium text-foreground">{siteName}</dd>
              </div>

              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Driver binding</dt>
                <dd className="font-medium text-foreground text-right truncate max-w-[200px]">
                  {manufacturer ? `${manufacturer} (${library || 'driver pending'})` : '—'}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Serial</dt>
                <dd className="font-mono text-foreground flex items-center gap-1.5">
                  <span>{serial.trim() || '—'}</span>
                  {vendorSerialMatch && (
                    <VendorMatchBadge status={vendorSerialMatch.matchStatus} />
                  )}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Mounting</dt>
                <dd className="font-mono text-foreground">
                  {installedPoleId || 'Not installed'}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Components</dt>
                <dd className="text-foreground">
                  {parsedComponents.length > 0
                    ? `${parsedComponents.length} configured`
                    : 'None specified'}
                </dd>
              </div>
            </dl>

            <div className="pt-3 border-t border-border space-y-2">
              <Button
                type="submit"
                disabled={submitting || !devicePermissions.canRegisterDevice}
                className="w-full h-9 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-xs"
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

          {/* Card 2: Discovered on Edge Gateway (Quick-Fill Drawer) */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center">
                  <Radar className="size-4 text-emerald-500" />
                  <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <h3 className="text-xs font-semibold text-foreground">Discovered on Edge Gateway</h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                {unmappedVendorRecords.length} available
              </span>
            </div>

            {unmappedVendorRecords.length > 0 ? (
              <div className="space-y-2.5">
                <p className="text-[11px] text-muted-foreground">
                  Live hardware detected by Edge ready for 1-click registration:
                </p>
                {unmappedVendorRecords.map((vr) => (
                  <div
                    key={vr.id}
                    className="p-3 rounded-lg border border-border/80 bg-background/60 hover:bg-muted/40 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                          <span className="font-mono text-xs font-semibold text-foreground truncate">
                            {vr.serial}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {vr.model} · {vr.manufacturer}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        onClick={() => applyVendorSelection(vr)}
                        className="h-7 px-2.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 cursor-pointer gap-1 shadow-xs"
                      >
                        <Zap className="size-3" />
                        <span>Quick fill</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-3 text-center space-y-1">
                <CheckCircle2 className="size-6 text-emerald-500 mx-auto" />
                <p className="text-xs font-medium text-foreground">All Edge hardware registered</p>
                <p className="text-[11px] text-muted-foreground">
                  All 3 vendor devices detected by Edge Gateway are mapped to registry records.
                </p>
              </div>
            )}
          </div>

          {/* Card 3: FALCON Registry Standards & Live Verification Checklist */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                <h3 className="text-xs font-semibold text-foreground">FALCON Registry Standards</h3>
              </div>
              <span
                className={cn(
                  'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                  allStandardsMet
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-muted text-muted-foreground border-border'
                )}
              >
                {allStandardsMet ? 'Compliant' : 'Draft'}
              </span>
            </div>

            <div className="space-y-2">
              {standardsChecklist.map((check) => (
                <div key={check.id} className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {check.done ? (
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="size-3.5 text-muted-foreground/60 shrink-0" />
                    )}
                    <span className={cn('truncate', check.done ? 'text-foreground' : 'text-muted-foreground')}>
                      {check.label}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground shrink-0 max-w-[140px] truncate text-right">
                    {check.detail}
                  </span>
                </div>
              ))}
            </div>

            {allStandardsMet && (
              <div className="pt-2 border-t border-border/40 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                <Check className="size-3.5 shrink-0" />
                <span>All 5 standards satisfied. Ready to commit to registry.</span>
              </div>
            )}
          </div>

          {/* Card 4: Recent Site Inventory Context */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold text-foreground">Site fleet context</h3>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground truncate max-w-[130px]">
                {siteName}
              </span>
            </div>

            {recentSiteDevices.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  Active devices deployed at this site:
                </p>
                <div className="divide-y divide-border/50 rounded-lg border border-border/80 bg-background/50">
                  {recentSiteDevices.map((dev) => (
                    <div key={dev.identifier} className="p-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-foreground truncate">
                            {dev.identifier}
                          </span>
                          <DeviceTypeBadge type={dev.type} size="xs" />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {dev.installedPoleId ? `Mounted on ${dev.installedPoleId}` : 'Unmounted'}
                        </p>
                      </div>
                      <DeviceConnectivityBadge state={dev.connectivityState} size="xs" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground py-1">
                No active devices registered at this site yet.
              </p>
            )}
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
              className={cn(UNIFIED_CONTROL_CLASS, 'w-full')}
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
