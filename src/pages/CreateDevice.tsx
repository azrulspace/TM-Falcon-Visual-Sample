import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Lock,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Plus,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDevices } from '@/contexts/DevicesContext';
import { useAssets } from '@/contexts/AssetsContext';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';
import type { DeviceHardwareType } from '@/types/devices';

const HARDWARE_TYPES: DeviceHardwareType[] = [
  'Camera',
  'Speaker',
  'Sensor',
  'Gateway',
  'LiDAR sensor',
];

const MANUFACTURERS = [
  'Hikvision',
  'Dahua',
  'Axis',
  'Hanwha',
  'Uniview',
  'Other',
];

const LIBRARIES = [
  'HIK_OpenAPI',
  'DAHUA_RPC',
  'AXIS_VAPIX',
  'ONVIF',
  'RTSP_GENERIC',
];

export default function CreateDevice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedSite } = useAppContext();
  const { sites } = useAssets();
  const {
    devices,
    vendorDevices,
    isIdentifierUnique,
    registerDevice,
  } = useDevices();
  const { addToast } = useToast();

  const prefillSerial = searchParams.get('serial');
  const matchedVendorOnLoad = useMemo(() => {
    if (!prefillSerial) return null;
    return vendorDevices.find((v) => v.serialNumber === prefillSerial) || null;
  }, [prefillSerial, vendorDevices]);

  // Form State
  const [identifier, setIdentifier] = useState(
    matchedVendorOnLoad ? matchedVendorOnLoad.serialNumber : ''
  );
  const [name, setName] = useState(
    matchedVendorOnLoad ? matchedVendorOnLoad.vendorName : ''
  );
  const [siteName, setSiteName] = useState(selectedSite || 'Teluk Panglima Garang');
  const [type, setType] = useState<DeviceHardwareType>(
    matchedVendorOnLoad && matchedVendorOnLoad.vendorModel.includes('QAZ')
      ? 'Speaker'
      : 'Camera'
  );
  const [manufacturer, setManufacturer] = useState('Hikvision');
  const [library, setLibrary] = useState('HIK_OpenAPI');
  const [model, setModel] = useState(
    matchedVendorOnLoad ? matchedVendorOnLoad.vendorModel : 'DS-2CFSP4/4G'
  );
  const [serialNumber, setSerialNumber] = useState(
    matchedVendorOnLoad ? matchedVendorOnLoad.serialNumber : ''
  );
  const [componentsText, setComponentsText] = useState(
    matchedVendorOnLoad && matchedVendorOnLoad.vendorModel.includes('QAZ')
      ? 'Speaker'
      : 'Camera'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdDeviceIdentifier, setCreatedDeviceIdentifier] = useState<string | null>(null);
  const [vendorPickerOpen, setVendorPickerOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync site from header if not touched
  useEffect(() => {
    if (selectedSite && selectedSite !== 'ALL') {
      setSiteName(selectedSite);
    }
  }, [selectedSite]);

  // Available unregistered vendor devices
  const unregisteredVendors = useMemo(() => {
    return vendorDevices.filter(
      (v) => v.matchStatus === 'Not registered' || v.matchStatus === 'Conflict'
    );
  }, [vendorDevices]);

  // Live Uniqueness Check
  const isUnique = useMemo(() => {
    if (!identifier.trim()) return true;
    return isIdentifierUnique(identifier.trim());
  }, [identifier, isIdentifierUnique]);

  const existingDevice = useMemo(() => {
    if (!identifier.trim() || isUnique) return null;
    const norm = identifier.trim().toLowerCase();
    return devices.find(
      (d) =>
        d.identifier.toLowerCase() === norm ||
        d.identifier.toLowerCase().replace(/_/g, '-') === norm.replace(/_/g, '-')
    );
  }, [identifier, isUnique, devices]);

  // Handle Vendor Selection
  const handleSelectVendorRecord = (v: typeof vendorDevices[0]) => {
    setSerialNumber(v.serialNumber);
    setModel(v.vendorModel);
    setName(v.vendorName);
    if (!identifier) {
      setIdentifier(v.serialNumber);
    }
    if (v.vendorModel.toLowerCase().includes('qaz') || v.vendorName.toLowerCase().includes('spk')) {
      setType('Speaker');
      setComponentsText('Speaker');
    } else {
      setType('Camera');
      setComponentsText('Camera');
    }
    setManufacturer('Hikvision');
    setLibrary('HIK_OpenAPI');
    setVendorPickerOpen(false);
    addToast('info', `Imported vendor specs for ${v.serialNumber}.`);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      addToast('error', 'Identifier is required.');
      return;
    }
    if (!isUnique) {
      addToast('error', `Identifier "${identifier}" already exists.`);
      return;
    }
    if (!serialNumber.trim()) {
      addToast('error', 'Serial number is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const components = componentsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await registerDevice({
        identifier: identifier.trim().toUpperCase(),
        name: name.trim() || identifier.trim().toUpperCase(),
        type,
        manufacturer,
        model: model.trim(),
        serialNumber: serialNumber.trim(),
        library,
        siteName,
        components: components.length > 0 ? components : [type],
      });

      if (res.ok && res.device) {
        setCreatedDeviceIdentifier(res.device.identifier);
      } else {
        addToast('error', res.error || 'Failed to register device.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySerial = () => {
    if (!serialNumber) return;
    navigator.clipboard.writeText(serialNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Header & Breadcrumb */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => navigate('/assets/devices')}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            Falcon
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => navigate('/assets/devices')}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            Assets and devices
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => navigate('/assets/devices')}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            Devices
          </button>
          <span>/</span>
          <span className="text-foreground font-medium">Register device</span>
        </div>

        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/assets/devices')}
              className="size-8 rounded-lg cursor-pointer"
              title="Back to devices"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Register device
              </h1>
              <p className="text-xs text-muted-foreground">
                Register a new camera, speaker or sensor on a site.
              </p>
            </div>
          </div>

          {unregisteredVendors.length > 0 && !createdDeviceIdentifier && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVendorPickerOpen((v) => !v)}
                className="h-8 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
              >
                <Sparkles className="size-3.5 text-primary" />
                <span>Register from vendor list</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                  {unregisteredVendors.length}
                </span>
              </Button>

              {vendorPickerOpen && (
                <div className="absolute right-0 top-10 z-40 w-80 rounded-xl border border-border bg-card shadow-xl p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-border pb-1.5">
                    <span className="text-xs font-semibold text-foreground">
                      Discovered vendor devices
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Select to populate
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto divide-y divide-border/60">
                    {unregisteredVendors.map((v) => (
                      <button
                        key={v.serialNumber}
                        type="button"
                        onClick={() => handleSelectVendorRecord(v)}
                        className="w-full text-left p-2 rounded-lg hover:bg-muted/60 transition-colors flex flex-col gap-0.5 cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {v.serialNumber}
                          </span>
                          <span
                            className={cn(
                              'px-1.5 py-0.2 rounded text-[10px] font-medium',
                              v.matchStatus === 'Conflict'
                                ? 'bg-rose-500/10 text-rose-500'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {v.matchStatus}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {v.vendorName} · {v.vendorModel}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Success State View */}
      {createdDeviceIdentifier ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center space-y-5 max-w-xl mx-auto shadow-sm">
          <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="size-6" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-foreground">
              Device registered successfully
            </h3>
            <p className="text-xs text-muted-foreground">
              Device <span className="font-mono font-bold text-foreground">{createdDeviceIdentifier}</span> has been created in the registry as unmounted.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-card border border-border text-left space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Identifier:</span>
              <span className="font-mono font-bold text-foreground">{createdDeviceIdentifier}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Site:</span>
              <span className="text-foreground">{siteName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Installation status:</span>
              <span className="text-amber-500 font-medium">Not installed (needs pole mount)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => navigate(`/assets/devices/${createdDeviceIdentifier}?action=install`)}
              className="w-full sm:w-auto h-9 px-4 gap-1.5 font-semibold bg-primary text-primary-foreground cursor-pointer shadow-sm"
            >
              <Plus className="size-4" />
              <span>Install on a pole</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate(`/assets/devices/${createdDeviceIdentifier}`)}
              className="w-full sm:w-auto h-9 px-4 gap-1.5 cursor-pointer"
            >
              <ExternalLink className="size-4 text-muted-foreground" />
              <span>Open device details</span>
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                setCreatedDeviceIdentifier(null);
                setIdentifier('');
                setName('');
                setSerialNumber('');
              }}
              className="w-full sm:w-auto h-9 px-3 text-xs text-muted-foreground cursor-pointer"
            >
              Register another
            </Button>
          </div>
        </div>
      ) : (
        /* 3. Two-Column Form & Live Summary */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Registration Form (8 cols) */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-8 space-y-6 rounded-xl border border-border bg-card p-6 shadow-xs"
          >
            {/* Section 1: Identity */}
            <div className="space-y-4">
              <div className="border-b border-border/80 pb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  1. Identity
                </h2>
                <span className="text-[11px] text-muted-foreground">
                  Primary registry identifiers
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Identifier */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="dev-reg-id"
                      className="text-xs font-semibold text-foreground flex items-center gap-1"
                    >
                      <span>Identifier</span>
                      <span className="text-destructive">*</span>
                      <span
                        className="inline-flex text-muted-foreground ml-1"
                        title="Primary key in FALCON. Once created, it cannot be changed later."
                      >
                        <Lock className="size-3" />
                      </span>
                    </label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      UPPERCASE
                    </span>
                  </div>

                  <input
                    id="dev-reg-id"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
                    placeholder="e.g. CAM-011 or DEV-011"
                    className={cn(
                      'w-full h-9 rounded-md border bg-background px-3 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40',
                      !isUnique ? 'border-amber-500' : 'border-border'
                    )}
                  />

                  {!isUnique && existingDevice && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-500 pt-0.5">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      <span>
                        Identifier already exists (mapped to {existingDevice.model}).
                      </span>
                    </div>
                  )}

                  <p className="text-[11px] text-muted-foreground">
                    Letters, digits, hyphens. It cannot change later.
                  </p>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label
                    htmlFor="dev-reg-name"
                    className="text-xs font-semibold text-foreground"
                  >
                    Name
                  </label>
                  <input
                    id="dev-reg-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. North Gate Camera"
                    className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Leave empty to use the identifier.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Placement */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-border/80 pb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  2. Placement
                </h2>
                <span className="text-[11px] text-muted-foreground">
                  Site assignment
                </span>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="dev-reg-site"
                  className="text-xs font-semibold text-foreground"
                >
                  Site <span className="text-destructive">*</span>
                </label>
                <select
                  id="dev-reg-site"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {sites.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Installation on a specific pole is handled after registration.
                </p>
              </div>
            </div>

            {/* Section 3: Hardware */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-border/80 pb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  3. Hardware & Integration
                </h2>
                <span className="text-[11px] text-muted-foreground">
                  Device specifications
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Type */}
                <div className="space-y-1">
                  <label
                    htmlFor="dev-reg-type"
                    className="text-xs font-semibold text-foreground"
                  >
                    Type <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="dev-reg-type"
                    value={type}
                    onChange={(e) => {
                      const newType = e.target.value as DeviceHardwareType;
                      setType(newType);
                      if (!componentsText.trim() || componentsText === type) {
                        setComponentsText(newType);
                      }
                    }}
                    className="w-full h-9 rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {HARDWARE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Manufacturer */}
                <div className="space-y-1">
                  <label
                    htmlFor="dev-reg-mfg"
                    className="text-xs font-semibold text-foreground"
                  >
                    Manufacturer <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="dev-reg-mfg"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="w-full h-9 rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {MANUFACTURERS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Library */}
                <div className="space-y-1">
                  <label
                    htmlFor="dev-reg-lib"
                    className="text-xs font-semibold text-foreground"
                  >
                    Library <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="dev-reg-lib"
                    value={library}
                    onChange={(e) => setLibrary(e.target.value)}
                    className="w-full h-9 rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {LIBRARIES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Model */}
                <div className="space-y-1">
                  <label
                    htmlFor="dev-reg-model"
                    className="text-xs font-semibold text-foreground"
                  >
                    Model <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="dev-reg-model"
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. DS-2CFSP4/4G"
                    className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* Serial Number */}
                <div className="space-y-1 md:col-span-2">
                  <label
                    htmlFor="dev-reg-serial"
                    className="text-xs font-semibold text-foreground"
                  >
                    Serial number <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="dev-reg-serial"
                      type="text"
                      required
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value.trim())}
                      placeholder="e.g. GS6306382 or GQ7752681"
                      className="w-full h-9 rounded-md border border-border bg-background px-3 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 pr-10"
                    />
                    {serialNumber && (
                      <button
                        type="button"
                        onClick={handleCopySerial}
                        className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Copy serial"
                      >
                        {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Unique hardware serial used for vendor discovery correlation.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4: Components */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-border/80 pb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  4. Components
                </h2>
                <span className="text-[11px] text-muted-foreground">
                  One component per line
                </span>
              </div>

              <div className="space-y-1">
                <textarea
                  id="dev-reg-components"
                  rows={3}
                  value={componentsText}
                  onChange={(e) => setComponentsText(e.target.value)}
                  placeholder="e.g. Camera&#10;Speaker&#10;Night Vision"
                  className="w-full rounded-md border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Lists sub-capabilities reported to the Edge engine.
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/assets/devices')}
                className="h-9 px-4 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !identifier.trim() || !isUnique || !serialNumber.trim()}
                className="h-9 px-5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Registering...' : 'Register device'}
              </Button>
            </div>
          </form>

          {/* Right: Live Summary Preview Panel (4 cols) */}
          <div className="lg:col-span-4 space-y-4 sticky top-6">
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
              <div className="border-b border-border pb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Radio className="size-3.5 text-primary" />
                  <span>Device summary preview</span>
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                  Draft
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                    Identifier
                  </span>
                  <span className="font-mono text-base font-bold text-foreground break-all">
                    {identifier || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                    Name & Type
                  </span>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="font-medium text-foreground truncate">
                      {name || identifier || '—'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                      {type}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                    Site
                  </span>
                  <span className="font-medium text-foreground">{siteName}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      Manufacturer
                    </span>
                    <span className="font-medium text-foreground truncate block">
                      {manufacturer}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      Library
                    </span>
                    <span className="font-mono text-[11px] text-foreground truncate block">
                      {library}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground block">Model</span>
                  <span className="font-medium text-foreground truncate block">
                    {model || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground block">Serial number</span>
                  <span className="font-mono text-[11px] text-foreground truncate block">
                    {serialNumber || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground block mb-1">
                    Components ({componentsText.split('\n').filter(Boolean).length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {componentsText
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((c, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground font-mono"
                        >
                          {c}
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              {/* Next step helper banner */}
              <div className="rounded-lg border border-border/80 bg-muted/30 p-3 text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground block mb-0.5">
                  Next step after registration:
                </span>
                The device is added to the registry as unmounted. You can mount it to a pole at any time from Manage installation.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
