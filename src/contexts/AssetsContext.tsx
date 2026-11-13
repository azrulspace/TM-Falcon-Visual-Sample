import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from 'react';
import type {
  PoleRecord,
  PoleWithRelations,
  CableSpanRecord,
  DeviceSummaryRecord,
  SiteRecord,
  PoleLocation,
  PoleLifecycle,
  PoleSavedView,
  BackendCapabilities,
  PoleTimelineEntry,
} from '@/types/assets';
import type {
  DeviceRecord,
  DeviceWithRelations,
  DeviceSavedView,
  DevicePolicyConfig,
  DeviceTypeCategory,
  DeviceLifecycleState,
  DeviceConfigVersion,
  DeviceConfigSettingResult,
  VendorDiscoveryRecord,
  VendorSyncSummary,
} from '@/types/devices';
import {
  SITES,
  initialPoles,
  initialCableSpans,
  buildJalanBandarLamaPreviewDataset,
  normalizeRelationKey,
} from '@/data/poles';
import {
  INITIAL_DEVICES_REGISTRY,
  INITIAL_VENDOR_DISCOVERY_RECORDS,
  INITIAL_VENDOR_SYNC_SUMMARY,
  buildJalanBandarLamaPreviewDevices,
} from '@/data/devicesRegistry';
import {
  DEFAULT_DEVICE_POLICY_CONFIG,
  PREVIEW_DEVICE_POLICY_CONFIG,
  enrichDeviceWithRelations,
} from '@/data/deviceSelectors';
import { getConfigSchemaForDevice, getChangedConfigKeys, getDefaultConfigValuesForType } from '@/data/deviceConfigSchema';
import { enrichPoleWithRelations } from '@/data/poleSelectors';
import { useEvents } from './EventsContext';
import { useAppContext } from './AppContext';
import { useToast } from './ToastContext';
import { getServerNow } from '@/lib/dateTime';
import {
  getRoleFromAccountLabel,
  getPolePermissions,
  getDevicePermissions,
  DEFAULT_BACKEND_CAPABILITIES,
  PREVIEW_BACKEND_CAPABILITIES,
  type PolePermissions,
  type DevicePermissions,
} from '@/lib/permissions';

export interface RegisterPoleInput {
  identifier: string;
  name: string;
  siteName: string;
  lifecycle?: Exclude<PoleLifecycle, 'Deleted'>;
  location: PoleLocation | null;
  protection?: string | null;
  note?: string | null;
}

export interface EditPoleInput {
  name: string;
  protection: string | null;
  note: string | null;
  lifecycle: Exclude<PoleLifecycle, 'Deleted'>;
}

export interface MutationResult {
  ok: boolean;
  error?: string;
  pole?: PoleRecord;
}

export interface RegisterDeviceInput {
  identifier: string;
  name?: string;
  siteName: string; // 'Unassigned' or specific site name
  type: DeviceTypeCategory;
  manufacturer: string;
  library: string;
  model: string;
  serial: string;
  vendorDeviceId?: string;
  lifecycle?: DeviceLifecycleState;
  components?: string[];
  installedPoleId?: string | null;
}

export interface EditDeviceInput {
  name: string;
  siteName: string;
  type: DeviceTypeCategory;
  manufacturer: string;
  library: string;
  model: string;
  serial: string;
  vendorDeviceId: string;
  lifecycle: DeviceLifecycleState;
  components: string[];
}

export interface ResolveConflictInput {
  mode: 'remap_existing_falcon' | 'register_new_falcon';
  newIdentifier?: string;
  newName?: string;
  reason: string;
}

export interface DeviceMutationResult {
  ok: boolean;
  error?: string;
  device?: DeviceRecord;
}

export interface ConfigMutationResult {
  ok: boolean;
  error?: string;
  version?: DeviceConfigVersion;
}

export interface AssetsContextType {
  sites: SiteRecord[];
  poles: PoleWithRelations[];
  rawPoles: PoleRecord[];
  cableSpans: CableSpanRecord[];
  devices: DeviceSummaryRecord[];
  rawDevices: DeviceRecord[];
  richDevices: DeviceWithRelations[];
  vendorRecords: VendorDiscoveryRecord[];
  vendorSyncSummary: VendorSyncSummary;
  devicePolicyConfig: DevicePolicyConfig;
  capabilities: BackendCapabilities;
  permissions: PolePermissions;
  devicePermissions: DevicePermissions;
  hasTestFlag: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  recentlyCreatedId: string | null;
  setRecentlyCreatedId: (id: string | null) => void;
  recentlyCreatedDeviceId: string | null;
  setRecentlyCreatedDeviceId: (id: string | null) => void;
  refreshAssets: () => Promise<void>;
  retryLoad: () => void;
  getPoleById: (identifier: string) => PoleWithRelations | undefined;
  isIdentifierUnique: (identifier: string) => boolean;
  registerPole: (input: RegisterPoleInput) => Promise<MutationResult>;
  relocatePole: (identifier: string, location: PoleLocation, reason?: string) => Promise<MutationResult>;
  editPole: (identifier: string, patch: EditPoleInput) => Promise<MutationResult>;
  deletePole: (identifier: string, reason: string) => Promise<MutationResult>;
  restorePole: (identifier: string) => Promise<MutationResult>;
  // Devices queries & mutations
  getDeviceById: (identifier: string) => DeviceWithRelations | undefined;
  isDeviceIdentifierUnique: (identifier: string) => boolean;
  registerDevice: (input: RegisterDeviceInput) => Promise<DeviceMutationResult>;
  editDevice: (identifier: string, patch: EditDeviceInput) => Promise<DeviceMutationResult>;
  manageInstallation: (
    identifier: string,
    poleIdentifier: string | null,
    options?: { note?: string; reason?: string; effectiveAt?: string }
  ) => Promise<DeviceMutationResult>;
  sendDeviceConfig: (
    identifier: string,
    draftValues: Record<string, unknown>,
    options?: { note?: string; simulatePartialFailure?: boolean }
  ) => Promise<ConfigMutationResult>;
  retryDeviceConfigSetting: (
    identifier: string,
    versionId: string,
    settingKey: string
  ) => Promise<ConfigMutationResult>;
  rollbackDeviceConfig: (
    identifier: string,
    targetVersionId: string,
    reason: string
  ) => Promise<ConfigMutationResult>;
  runConnectionCheck: (identifier: string) => Promise<DeviceMutationResult>;
  reloadVendorList: () => Promise<void>;
  triggerVendorSync: (library: string) => Promise<MutationResult>;
  resolveVendorConflict: (
    vendorRecordId: string,
    resolution: ResolveConflictInput
  ) => Promise<MutationResult>;
  retireOrDeleteDevice: (
    identifier: string,
    action: 'retire' | 'delete',
    reason: string
  ) => Promise<DeviceMutationResult>;
  // Saved views (Poles + Devices)
  savedViews: PoleSavedView[];
  saveView: (name: string, filters: PoleSavedView['filters']) => void;
  renameSavedView: (id: string, newName: string) => void;
  deleteSavedView: (id: string) => void;
  setDefaultView: (id: string) => void;
  deviceSavedViews: DeviceSavedView[];
  saveDeviceView: (name: string, filters: DeviceSavedView['filters']) => void;
  renameDeviceSavedView: (id: string, newName: string) => void;
  deleteDeviceSavedView: (id: string) => void;
  setDefaultDeviceView: (id: string) => void;
}

const AssetsContext = createContext<AssetsContextType | undefined>(undefined);
const SAVED_VIEWS_KEY = 'falcon_poles_saved_views';
const DEVICE_SAVED_VIEWS_KEY = 'falcon_devices_saved_views';

export const AssetsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accountLabel, previewDataMode } = useAppContext();
  const { events } = useEvents();
  const { addToast } = useToast();

  const [basePoles, setBasePoles] = useState<PoleRecord[]>(initialPoles);
  const [baseSpans] = useState<CableSpanRecord[]>(initialCableSpans);
  const [baseRichDevices, setBaseRichDevices] = useState<DeviceRecord[]>(INITIAL_DEVICES_REGISTRY);
  const [baseVendorRecords, setBaseVendorRecords] = useState<VendorDiscoveryRecord[]>(
    INITIAL_VENDOR_DISCOVERY_RECORDS
  );
  const [vendorSyncSummary, setVendorSyncSummary] = useState<VendorSyncSummary>(
    INITIAL_VENDOR_SYNC_SUMMARY
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentlyCreatedId, setRecentlyCreatedId] = useState<string | null>(null);
  const [recentlyCreatedDeviceId, setRecentlyCreatedDeviceId] = useState<string | null>(null);

  const previewScenario = useMemo(() => buildJalanBandarLamaPreviewDataset(), []);
  const previewDevicesScenario = useMemo(() => buildJalanBandarLamaPreviewDevices(), []);

  const sites = useMemo<SiteRecord[]>(() => {
    return previewDataMode ? [previewScenario.site, ...SITES] : SITES;
  }, [previewDataMode, previewScenario.site]);

  const rawPoles = useMemo<PoleRecord[]>(() => {
    if (!previewDataMode) return basePoles;
    const baseIds = new Set(basePoles.map((p) => p.identifier.toLowerCase()));
    const previewOnly = previewScenario.poles.filter(
      (p) => !baseIds.has(p.identifier.toLowerCase())
    );
    return [...previewOnly, ...basePoles];
  }, [basePoles, previewDataMode, previewScenario.poles]);

  const cableSpans = useMemo<CableSpanRecord[]>(() => {
    return previewDataMode ? [...previewScenario.spans, ...baseSpans] : baseSpans;
  }, [baseSpans, previewDataMode, previewScenario.spans]);

  const rawDevices = useMemo<DeviceRecord[]>(() => {
    if (!previewDataMode) return baseRichDevices;
    const baseIds = new Set(baseRichDevices.map((d) => d.identifier.toLowerCase()));
    const previewOnly = previewDevicesScenario.devices.filter(
      (d) => !baseIds.has(d.identifier.toLowerCase())
    );
    return [...previewOnly, ...baseRichDevices];
  }, [baseRichDevices, previewDataMode, previewDevicesScenario.devices]);

  const vendorRecords = useMemo<VendorDiscoveryRecord[]>(() => {
    if (!previewDataMode) return baseVendorRecords;
    const baseSerials = new Set(baseVendorRecords.map((v) => v.serial.toLowerCase()));
    const previewOnly = previewDevicesScenario.vendorRecords.filter(
      (v) => !baseSerials.has(v.serial.toLowerCase())
    );
    return [...previewOnly, ...baseVendorRecords];
  }, [baseVendorRecords, previewDataMode, previewDevicesScenario.vendorRecords]);

  const devices = useMemo<DeviceSummaryRecord[]>(() => {
    return rawDevices.map((d) => ({
      id: d.identifier,
      name: d.name,
      type: d.type,
      lifecycle: d.lifecycle,
      site: d.siteName || 'Unassigned',
      status: d.connectivityState,
      lastContact: d.lastContactAt || '—',
      asset: d.installedPoleId || '',
      manufacturer: d.manufacturer,
      model: d.model,
      serial: d.serial,
      location: 'Not recorded',
    }));
  }, [rawDevices]);

  const capabilities = previewDataMode
    ? PREVIEW_BACKEND_CAPABILITIES
    : DEFAULT_BACKEND_CAPABILITIES;

  const devicePolicyConfig: DevicePolicyConfig = previewDataMode
    ? PREVIEW_DEVICE_POLICY_CONFIG
    : DEFAULT_DEVICE_POLICY_CONFIG;

  const role = getRoleFromAccountLabel(accountLabel);
  const permissions = useMemo(
    () => getPolePermissions(role, capabilities),
    [role, capabilities]
  );
  const devicePermissions = useMemo(
    () => getDevicePermissions(role, capabilities),
    [role, capabilities]
  );

  const actorName = useMemo(() => {
    if (!accountLabel) return 'Admin';
    return accountLabel.replace(/\s*\(sample\)\s*/i, '').trim() || 'Admin';
  }, [accountLabel]);

  const richDevices = useMemo<DeviceWithRelations[]>(() => {
    const now = getServerNow();
    return rawDevices.map((d) =>
      enrichDeviceWithRelations(
        d,
        rawPoles,
        cableSpans,
        events,
        vendorRecords,
        devicePolicyConfig,
        now
      )
    );
  }, [rawDevices, rawPoles, cableSpans, events, vendorRecords, devicePolicyConfig]);

  const poles = useMemo<PoleWithRelations[]>(() => {
    const now = getServerNow();
    return rawPoles.map((p) =>
      enrichPoleWithRelations(p, devices, cableSpans, events, sites, now)
    );
  }, [rawPoles, devices, cableSpans, events, sites]);

  const hasTestFlag = useMemo(
    () => rawPoles.some((p) => typeof p.isTest === 'boolean') || rawDevices.some((d) => typeof d.isTest === 'boolean'),
    [rawPoles, rawDevices]
  );

  // Saved Views
  const [savedViews, setSavedViews] = useState<PoleSavedView[]>(() => {
    try {
      const stored = localStorage.getItem(SAVED_VIEWS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [
      {
        id: 'poles-view-all-active',
        name: 'All active poles',
        isDefault: true,
        filters: { statusTab: 'active', locationFilter: 'all' },
      },
      {
        id: 'poles-view-missing-loc',
        name: 'Missing coordinates',
        isDefault: false,
        filters: { statusTab: 'active', locationFilter: 'missing_location' },
      },
      {
        id: 'poles-view-with-devices',
        name: 'With mounted devices',
        isDefault: false,
        filters: { statusTab: 'active', linkedDevice: 'with' },
      },
    ];
  });

  const persistViews = (next: PoleSavedView[]) => {
    try {
      localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(next));
    } catch {
      // ignore storage quota
    }
  };

  const saveView = useCallback(
    (name: string, filters: PoleSavedView['filters']) => {
      const nextView: PoleSavedView = {
        id: `pole-view-${Date.now()}`,
        name: name.trim(),
        isDefault: false,
        filters,
      };
      setSavedViews((prev) => {
        const next = [...prev, nextView];
        persistViews(next);
        return next;
      });
      addToast('success', `Saved view "${name.trim()}" created.`);
    },
    [addToast]
  );

  const renameSavedView = useCallback(
    (id: string, newName: string) => {
      if (!newName.trim()) return;
      setSavedViews((prev) => {
        const next = prev.map((v) => (v.id === id ? { ...v, name: newName.trim() } : v));
        persistViews(next);
        return next;
      });
      addToast('success', `Saved view renamed to "${newName.trim()}".`);
    },
    [addToast]
  );

  const deleteSavedView = useCallback(
    (id: string) => {
      setSavedViews((prev) => {
        const next = prev.filter((v) => v.id !== id);
        persistViews(next);
        return next;
      });
      addToast('info', 'Saved view removed.');
    },
    [addToast]
  );

  const setDefaultView = useCallback(
    (id: string) => {
      setSavedViews((prev) => {
        const next = prev.map((v) => ({ ...v, isDefault: v.id === id }));
        persistViews(next);
        return next;
      });
      addToast('info', 'Default view updated.');
    },
    [addToast]
  );

  const refreshAssets = useCallback(async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    await new Promise((r) => setTimeout(r, 250));
    setIsRefreshing(false);
    addToast('info', 'Poles inventory refreshed.');
  }, [addToast]);

  const retryLoad = useCallback(() => {
    setIsLoading(true);
    setErrorMessage(null);
    setTimeout(() => setIsLoading(false), 200);
  }, []);

  const getPoleById = useCallback(
    (identifier: string) => {
      const decoded = decodeURIComponent(identifier);
      return (
        poles.find((p) => p.identifier === decoded) ||
        poles.find((p) => normalizeRelationKey(p.identifier) === normalizeRelationKey(decoded))
      );
    },
    [poles]
  );

  const isIdentifierUnique = useCallback(
    (identifier: string) => {
      const clean = identifier.trim().toLowerCase();
      if (!clean) return false;
      return !rawPoles.some((p) => p.identifier.trim().toLowerCase() === clean);
    },
    [rawPoles]
  );

  const registerPole = useCallback(
    async (input: RegisterPoleInput): Promise<MutationResult> => {
      if (!permissions.canRegister) {
        return { ok: false, error: permissions.registerDisabledReason || 'Permission denied.' };
      }

      const cleanId = input.identifier.trim();
      if (!cleanId) {
        return { ok: false, error: 'Identifier is required.' };
      }
      if (!isIdentifierUnique(cleanId)) {
        return { ok: false, error: `Identifier "${cleanId}" already exists.` };
      }

      const matchedSite = sites.find((s) => s.name === input.siteName);
      if (!matchedSite) {
        return { ok: false, error: 'A valid site is required.' };
      }

      const nowIso = getServerNow().toISOString();
      const lifecycle = input.lifecycle || 'Active';
      const timeline: PoleTimelineEntry[] = [];

      if (input.location) {
        timeline.push({
          id: `tl-${Date.now()}-loc`,
          kind: 'Location',
          message: `Location set to ${input.location.lat.toFixed(6)}, ${input.location.lng.toFixed(6)}`,
          field: 'Location',
          toValue: `${input.location.lat.toFixed(6)}, ${input.location.lng.toFixed(6)}`,
          coordinates: input.location,
          actor: actorName,
          timestamp: nowIso,
        });
      }

      timeline.push({
        id: `tl-${Date.now()}-lc`,
        kind: 'Lifecycle',
        message: `Lifecycle set to ${lifecycle}`,
        field: 'Lifecycle',
        toValue: lifecycle,
        actor: actorName,
        timestamp: nowIso,
      });

      timeline.push({
        id: `tl-${Date.now()}-reg`,
        kind: 'Registered',
        message: 'Pole registered',
        actor: actorName,
        timestamp: nowIso,
      });

      const newPole: PoleRecord = {
        identifier: cleanId,
        name: input.name.trim() || cleanId,
        type: 'Pole',
        lifecycle,
        siteId: matchedSite.id,
        siteName: matchedSite.name,
        location: input.location,
        protection: input.protection?.trim() || null,
        note: input.note?.trim() || null,
        registeredAt: nowIso,
        lastUpdatedAt: nowIso,
        lifecycleStartedAt: nowIso,
        lifecycleHistory: [
          {
            id: `lh-${Date.now()}`,
            status: lifecycle,
            from: nowIso,
            to: null,
            note: null,
            recordedBy: actorName,
            recordedAt: nowIso,
          },
        ],
        timeline,
      };

      setBasePoles((prev) => [newPole, ...prev]);
      setRecentlyCreatedId(cleanId);
      addToast('success', `Pole ${cleanId} registered.`);
      return { ok: true, pole: newPole };
    },
    [permissions, isIdentifierUnique, sites, actorName, addToast]
  );

  const relocatePole = useCallback(
    async (
      identifier: string,
      location: PoleLocation,
      reason?: string
    ): Promise<MutationResult> => {
      if (!permissions.canRelocate) {
        return { ok: false, error: permissions.relocateDisabledReason || 'Permission denied.' };
      }

      const nowIso = getServerNow().toISOString();
      let updatedPole: PoleRecord | undefined;

      setBasePoles((prev) =>
        prev.map((p) => {
          if (p.identifier !== identifier) return p;
          const prevStr = p.location
            ? `${p.location.lat.toFixed(6)}, ${p.location.lng.toFixed(6)}`
            : 'Not recorded';
          const nextStr = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
          const entry: PoleTimelineEntry = {
            id: `tl-${Date.now()}-reloc`,
            kind: 'Location',
            message: reason?.trim()
              ? `Location set to ${nextStr} (${reason.trim()})`
              : `Location set to ${nextStr}`,
            field: 'Location',
            fromValue: prevStr,
            toValue: nextStr,
            coordinates: location,
            actor: actorName,
            timestamp: nowIso,
          };
          updatedPole = {
            ...p,
            location,
            lastUpdatedAt: nowIso,
            timeline: [entry, ...p.timeline],
          };
          return updatedPole;
        })
      );

      if (!updatedPole) {
        return { ok: false, error: `Pole "${identifier}" not found.` };
      }
      addToast('success', `Location updated for ${identifier}.`);
      return { ok: true, pole: updatedPole };
    },
    [permissions, actorName, addToast]
  );

  const editPole = useCallback(
    async (identifier: string, patch: EditPoleInput): Promise<MutationResult> => {
      if (!permissions.canEdit) {
        return { ok: false, error: permissions.editDisabledReason || 'Permission denied.' };
      }

      const nowIso = getServerNow().toISOString();
      let updatedPole: PoleRecord | undefined;

      setBasePoles((prev) =>
        prev.map((p) => {
          if (p.identifier !== identifier) return p;

          const newEntries: PoleTimelineEntry[] = [];
          const nextName = patch.name.trim() || p.identifier;
          const nextProt = patch.protection?.trim() || null;
          const nextNote = patch.note?.trim() || null;

          if (nextName !== p.name) {
            newEntries.push({
              id: `tl-${Date.now()}-name`,
              kind: 'Change',
              message: `Name changed from ${p.name} to ${nextName}`,
              field: 'Name',
              fromValue: p.name,
              toValue: nextName,
              actor: actorName,
              timestamp: nowIso,
            });
          }

          if ((nextProt || 'none') !== (p.protection || 'none')) {
            newEntries.push({
              id: `tl-${Date.now()}-prot`,
              kind: 'Change',
              message: `Protection changed from ${p.protection || 'none'} to ${nextProt || 'none'}`,
              field: 'Protection',
              fromValue: p.protection || 'none',
              toValue: nextProt || 'none',
              actor: actorName,
              timestamp: nowIso,
            });
          }

          if ((nextNote || 'none') !== (p.note || 'none')) {
            newEntries.push({
              id: `tl-${Date.now()}-note`,
              kind: 'Change',
              message: `Note changed from ${p.note || 'none'} to ${nextNote || 'none'}`,
              field: 'Note',
              fromValue: p.note || 'none',
              toValue: nextNote || 'none',
              actor: actorName,
              timestamp: nowIso,
            });
          }

          let nextHistory = p.lifecycleHistory;
          let nextLifecycleStartedAt = p.lifecycleStartedAt;
          if (patch.lifecycle !== p.lifecycle) {
            newEntries.push({
              id: `tl-${Date.now()}-lc`,
              kind: 'Lifecycle',
              message: `Lifecycle changed from ${p.lifecycle} to ${patch.lifecycle}`,
              field: 'Lifecycle',
              fromValue: p.lifecycle,
              toValue: patch.lifecycle,
              actor: actorName,
              timestamp: nowIso,
            });
            nextLifecycleStartedAt = nowIso;
            nextHistory = [
              ...p.lifecycleHistory.map((h) => (h.to === null ? { ...h, to: nowIso } : h)),
              {
                id: `lh-${Date.now()}`,
                status: patch.lifecycle,
                from: nowIso,
                to: null,
                note: null,
                recordedBy: actorName,
                recordedAt: nowIso,
              },
            ];
          }

          updatedPole = {
            ...p,
            name: nextName,
            protection: nextProt,
            note: nextNote,
            lifecycle: patch.lifecycle,
            lifecycleStartedAt: nextLifecycleStartedAt,
            lifecycleHistory: nextHistory,
            lastUpdatedAt: nowIso,
            timeline: [...newEntries, ...p.timeline],
          };
          return updatedPole;
        })
      );

      if (!updatedPole) {
        return { ok: false, error: `Pole "${identifier}" not found.` };
      }
      addToast('success', `Updated pole ${identifier}.`);
      return { ok: true, pole: updatedPole };
    },
    [permissions, actorName, addToast]
  );

  const deletePole = useCallback(
    async (identifier: string, reason: string): Promise<MutationResult> => {
      if (!permissions.canDelete) {
        return { ok: false, error: permissions.deleteDisabledReason || 'Permission denied.' };
      }
      const cleanReason = reason.trim();
      if (!cleanReason) {
        return { ok: false, error: 'Deletion reason is required.' };
      }

      const target = poles.find((p) => p.identifier === identifier);
      if (!target) {
        return { ok: false, error: `Pole "${identifier}" not found.` };
      }

      if (target.linkedDevicesCount > 0 || target.cableSpansCount > 0) {
        return {
          ok: false,
          error: `Cannot delete ${identifier}: detach ${target.linkedDevicesCount} device(s) and ${target.cableSpansCount} cable span(s) first.`,
        };
      }

      const nowIso = getServerNow().toISOString();
      let deletedPole: PoleRecord | undefined;

      setBasePoles((prev) =>
        prev.map((p) => {
          if (p.identifier !== identifier) return p;
          const entry: PoleTimelineEntry = {
            id: `tl-${Date.now()}-del`,
            kind: 'Deleted',
            message: `Pole soft deleted — ${cleanReason}`,
            field: 'Lifecycle',
            fromValue: p.lifecycle,
            toValue: 'Deleted',
            actor: actorName,
            timestamp: nowIso,
          };
          deletedPole = {
            ...p,
            lifecycle: 'Deleted',
            deletedAt: nowIso,
            deletedBy: actorName,
            deleteReason: cleanReason,
            lastUpdatedAt: nowIso,
            lifecycleHistory: [
              ...p.lifecycleHistory.map((h) => (h.to === null ? { ...h, to: nowIso } : h)),
              {
                id: `lh-${Date.now()}-del`,
                status: 'Deleted',
                from: nowIso,
                to: null,
                note: cleanReason,
                recordedBy: actorName,
                recordedAt: nowIso,
              },
            ],
            timeline: [entry, ...p.timeline],
          };
          return deletedPole;
        })
      );

      addToast('success', `Pole ${identifier} moved to Deleted view.`);
      return { ok: true, pole: deletedPole };
    },
    [permissions, poles, actorName, addToast]
  );

  const restorePole = useCallback(
    async (identifier: string): Promise<MutationResult> => {
      if (!permissions.canRestore) {
        return {
          ok: false,
          error: permissions.restoreDisabledReason || 'Not available yet — restore endpoint required',
        };
      }
      const nowIso = getServerNow().toISOString();
      let restored: PoleRecord | undefined;

      setBasePoles((prev) =>
        prev.map((p) => {
          if (p.identifier !== identifier) return p;
          restored = {
            ...p,
            lifecycle: 'Active',
            deletedAt: null,
            deletedBy: null,
            deleteReason: null,
            lastUpdatedAt: nowIso,
            lifecycleStartedAt: nowIso,
            lifecycleHistory: [
              ...p.lifecycleHistory.map((h) => (h.to === null ? { ...h, to: nowIso } : h)),
              {
                id: `lh-${Date.now()}-rest`,
                status: 'Active',
                from: nowIso,
                to: null,
                note: 'Restored from Deleted view',
                recordedBy: actorName,
                recordedAt: nowIso,
              },
            ],
            timeline: [
              {
                id: `tl-${Date.now()}-rest`,
                kind: 'Lifecycle',
                message: 'Pole restored to Active',
                field: 'Lifecycle',
                fromValue: 'Deleted',
                toValue: 'Active',
                actor: actorName,
                timestamp: nowIso,
              },
              ...p.timeline,
            ],
          };
          return restored;
        })
      );

      if (!restored) {
        return { ok: false, error: `Pole "${identifier}" not found.` };
      }
      addToast('success', `Pole ${identifier} restored.`);
      return { ok: true, pole: restored };
    },
    [permissions, actorName, addToast]
  );

  // Device Saved Views
  const [deviceSavedViews, setDeviceSavedViews] = useState<DeviceSavedView[]>(() => {
    try {
      const stored = localStorage.getItem(DEVICE_SAVED_VIEWS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [
      {
        id: 'devices-view-all',
        name: 'All devices',
        isDefault: true,
        filters: { statusTab: 'all' },
      },
      {
        id: 'devices-view-attention',
        name: 'Needs attention',
        isDefault: false,
        filters: { statusTab: 'all', needsAttentionOnly: true },
      },
      {
        id: 'devices-view-not-installed',
        name: 'Not installed',
        isDefault: false,
        filters: { statusTab: 'not_installed' },
      },
      {
        id: 'devices-view-config-issues',
        name: 'Configuration issues',
        isDefault: false,
        filters: { statusTab: 'all', configFilter: 'issues' },
      },
    ];
  });

  const persistDeviceViews = (next: DeviceSavedView[]) => {
    try {
      localStorage.setItem(DEVICE_SAVED_VIEWS_KEY, JSON.stringify(next));
    } catch {
      // ignore quota
    }
  };

  const saveDeviceView = useCallback(
    (name: string, filters: DeviceSavedView['filters']) => {
      const nextView: DeviceSavedView = {
        id: `dev-view-${Date.now()}`,
        name: name.trim(),
        isDefault: false,
        filters,
      };
      setDeviceSavedViews((prev) => {
        const next = [...prev, nextView];
        persistDeviceViews(next);
        return next;
      });
      addToast('success', `Saved view "${name.trim()}" created.`);
    },
    [addToast]
  );

  const renameDeviceSavedView = useCallback(
    (id: string, newName: string) => {
      if (!newName.trim()) return;
      setDeviceSavedViews((prev) => {
        const next = prev.map((v) => (v.id === id ? { ...v, name: newName.trim() } : v));
        persistDeviceViews(next);
        return next;
      });
      addToast('success', `Saved view renamed to "${newName.trim()}".`);
    },
    [addToast]
  );

  const deleteDeviceSavedView = useCallback(
    (id: string) => {
      setDeviceSavedViews((prev) => {
        const next = prev.filter((v) => v.id !== id);
        persistDeviceViews(next);
        return next;
      });
      addToast('info', 'Saved view removed.');
    },
    [addToast]
  );

  const setDefaultDeviceView = useCallback(
    (id: string) => {
      setDeviceSavedViews((prev) => {
        const next = prev.map((v) => ({ ...v, isDefault: v.id === id }));
        persistDeviceViews(next);
        return next;
      });
      addToast('info', 'Default device view updated.');
    },
    [addToast]
  );

  const getDeviceById = useCallback(
    (identifier: string) => {
      const decoded = decodeURIComponent(identifier);
      return (
        richDevices.find((d) => d.identifier === decoded) ||
        richDevices.find((d) => normalizeRelationKey(d.identifier) === normalizeRelationKey(decoded))
      );
    },
    [richDevices]
  );

  const isDeviceIdentifierUnique = useCallback(
    (identifier: string) => {
      const clean = identifier.trim().toLowerCase();
      if (!clean) return false;
      return !rawDevices.some((d) => d.identifier.trim().toLowerCase() === clean);
    },
    [rawDevices]
  );

  const upsertDeviceList = useCallback(
    (updater: (prev: DeviceRecord[]) => DeviceRecord[]) => {
      setBaseRichDevices((prev) => {
        if (!previewDataMode) return updater(prev);
        const existingIds = new Set(prev.map((d) => d.identifier.toLowerCase()));
        const merged = [
          ...prev,
          ...previewDevicesScenario.devices.filter((d) => !existingIds.has(d.identifier.toLowerCase())),
        ];
        return updater(merged);
      });
    },
    [previewDataMode, previewDevicesScenario.devices]
  );

  const registerDevice = useCallback(
    async (input: RegisterDeviceInput): Promise<DeviceMutationResult> => {
      if (!devicePermissions.canRegisterDevice) {
        return { ok: false, error: devicePermissions.registerDisabledReason || 'Permission denied.' };
      }

      const cleanId = input.identifier.trim();
      if (!cleanId) return { ok: false, error: 'Identifier is required.' };
      if (!/^[A-Za-z0-9-]+$/.test(cleanId)) {
        return { ok: false, error: 'Identifier may only contain letters, digits and hyphens.' };
      }
      if (!isDeviceIdentifierUnique(cleanId)) {
        return { ok: false, error: `Identifier "${cleanId}" already exists.` };
      }

      const nowIso = getServerNow().toISOString();
      const matchedSite =
        input.siteName && input.siteName !== 'Unassigned'
          ? sites.find((s) => s.name === input.siteName) || null
          : null;
      const lifecycle = input.lifecycle || 'Active';
      const installedPole = input.installedPoleId?.trim() || null;

      const newDevice: DeviceRecord = {
        identifier: cleanId,
        name: input.name?.trim() || cleanId,
        type: input.type,
        manufacturer: input.manufacturer.trim(),
        library: input.library.trim(),
        model: input.model.trim() || 'Unspecified',
        serial: input.serial.trim() || cleanId,
        vendorDeviceId: (input.vendorDeviceId || input.serial || cleanId).trim(),
        identifierKind: 'Registry',
        siteId: matchedSite ? matchedSite.id : null,
        siteName: matchedSite ? matchedSite.name : null,
        connectivityState: 'online',
        lifecycle,
        installedPoleId: installedPole,
        registeredAt: nowIso,
        lastUpdatedAt: nowIso,
        lastContactAt: nowIso,
        batteryPercent: null,
        temperatureC: null,
        softwareVersion: null,
        connectionCheck: { status: 'Never checked', checkedAt: null, message: null },
        components: input.components?.filter(Boolean) || [],
        configVersion: null,
        configStatus: 'None',
        configReportedAt: null,
        configuration: getDefaultConfigValuesForType(input.type),
        configVersions: [],
        connectivityPeriods: [
          {
            id: `cp-${Date.now()}`,
            state: 'online',
            from: nowIso,
            to: null,
            recordedBy: 'Telemetry',
          },
        ],
        timeline: [
          ...(installedPole
            ? [
                {
                  id: `tl-${Date.now()}-inst`,
                  kind: 'Installed' as const,
                  message: `Installed on pole ${installedPole}`,
                  field: 'Installed on',
                  toValue: installedPole,
                  actor: actorName,
                  timestamp: nowIso,
                },
              ]
            : []),
          {
            id: `tl-${Date.now()}-reg`,
            kind: 'Registered',
            message: 'Device registered in FALCON',
            actor: actorName,
            timestamp: nowIso,
          },
        ],
        installationHistory: installedPole
          ? [
              {
                id: `inst-${Date.now()}`,
                poleIdentifier: installedPole,
                poleName: installedPole,
                siteName: matchedSite?.name || 'Unassigned',
                from: nowIso,
                to: null,
                actor: actorName,
                note: 'Installed upon registration',
              },
            ]
          : [],
        healthReports: [],
      };

      upsertDeviceList((prev) => [newDevice, ...prev]);

      // Link matching vendor discovery entry if serial matches an unregistered device
      if (newDevice.serial) {
        setBaseVendorRecords((prev) =>
          prev.map((vr) =>
            vr.serial.toLowerCase() === newDevice.serial.toLowerCase() &&
            vr.matchStatus === 'Not registered'
              ? {
                  ...vr,
                  matchStatus: 'Registered',
                  matchedFalconId: newDevice.identifier,
                  conflictReason: null,
                }
              : vr
          )
        );
      }

      setRecentlyCreatedDeviceId(cleanId);
      addToast('success', `Device ${cleanId} registered.`);
      return { ok: true, device: newDevice };
    },
    [devicePermissions, isDeviceIdentifierUnique, sites, actorName, upsertDeviceList, addToast]
  );

  const editDevice = useCallback(
    async (identifier: string, patch: EditDeviceInput): Promise<DeviceMutationResult> => {
      if (!devicePermissions.canEditDevice) {
        return { ok: false, error: devicePermissions.editDisabledReason || 'Permission denied.' };
      }

      const nowIso = getServerNow().toISOString();
      let updated: DeviceRecord | undefined;

      upsertDeviceList((prev) =>
        prev.map((d) => {
          if (d.identifier !== identifier) return d;
          const nextSite =
            patch.siteName && patch.siteName !== 'Unassigned'
              ? sites.find((s) => s.name === patch.siteName) || null
              : null;
          const nextSiteName = nextSite ? nextSite.name : null;

          const diffs: DeviceRecord['timeline'] = [];
          if (d.name !== patch.name.trim()) {
            diffs.push({
              id: `tl-${Date.now()}-name`,
              kind: 'Edited',
              message: `Name changed from ${d.name} to ${patch.name.trim()}`,
              field: 'Name',
              fromValue: d.name,
              toValue: patch.name.trim(),
              actor: actorName,
              timestamp: nowIso,
            });
          }
          if ((d.siteName || 'Unassigned') !== (nextSiteName || 'Unassigned')) {
            diffs.push({
              id: `tl-${Date.now()}-site`,
              kind: 'Edited',
              message: `Site changed from ${d.siteName || 'Unassigned'} to ${nextSiteName || 'Unassigned'}`,
              field: 'Site',
              fromValue: d.siteName || 'Unassigned',
              toValue: nextSiteName || 'Unassigned',
              actor: actorName,
              timestamp: nowIso,
            });
          }
          if (d.lifecycle !== patch.lifecycle) {
            diffs.push({
              id: `tl-${Date.now()}-lc`,
              kind: 'Lifecycle',
              message: `Lifecycle changed from ${d.lifecycle} to ${patch.lifecycle}`,
              field: 'Lifecycle',
              fromValue: d.lifecycle,
              toValue: patch.lifecycle,
              actor: actorName,
              timestamp: nowIso,
            });
          }
          if (d.serial !== patch.serial.trim() || d.vendorDeviceId !== patch.vendorDeviceId.trim()) {
            diffs.push({
              id: `tl-${Date.now()}-ser`,
              kind: 'Edited',
              message: `Serial / Vendor mapping updated to ${patch.serial.trim()}`,
              field: 'Serial number',
              fromValue: d.serial,
              toValue: patch.serial.trim(),
              actor: actorName,
              timestamp: nowIso,
            });
          }
          if (diffs.length === 0) {
            diffs.push({
              id: `tl-${Date.now()}-gen`,
              kind: 'Edited',
              message: 'Device hardware metadata updated',
              actor: actorName,
              timestamp: nowIso,
            });
          }

          updated = {
            ...d,
            name: patch.name.trim() || d.identifier,
            siteId: nextSite ? nextSite.id : null,
            siteName: nextSiteName,
            type: patch.type,
            manufacturer: patch.manufacturer.trim(),
            library: patch.library.trim(),
            model: patch.model.trim(),
            serial: patch.serial.trim(),
            vendorDeviceId: patch.vendorDeviceId.trim() || patch.serial.trim(),
            lifecycle: patch.lifecycle,
            components: patch.components,
            lastUpdatedAt: nowIso,
            timeline: [...diffs, ...d.timeline],
          };
          return updated;
        })
      );

      if (!updated) return { ok: false, error: `Device "${identifier}" not found.` };
      addToast('success', `Device ${identifier} updated.`);
      return { ok: true, device: updated };
    },
    [devicePermissions, sites, actorName, upsertDeviceList, addToast]
  );

  const manageInstallation = useCallback(
    async (
      identifier: string,
      poleIdentifier: string | null,
      options?: { note?: string; reason?: string; effectiveAt?: string }
    ): Promise<DeviceMutationResult> => {
      if (!devicePermissions.canManageInstallation) {
        return {
          ok: false,
          error: devicePermissions.manageInstallationDisabledReason || 'Permission denied.',
        };
      }

      const cleanPoleId = poleIdentifier?.trim() || null;
      if (!cleanPoleId && !options?.reason?.trim()) {
        return { ok: false, error: 'A reason is required when uninstalling a device from a pole.' };
      }

      const targetPole = cleanPoleId ? getPoleById(cleanPoleId) : null;
      if (cleanPoleId && !targetPole) {
        return { ok: false, error: `Pole "${cleanPoleId}" not found.` };
      }

      const nowIso = options?.effectiveAt || getServerNow().toISOString();
      let updated: DeviceRecord | undefined;

      upsertDeviceList((prev) =>
        prev.map((d) => {
          if (d.identifier !== identifier) return d;
          const prevPole = d.installedPoleId;
          const closedHistory = d.installationHistory.map((h) =>
            h.to === null
              ? {
                  ...h,
                  to: nowIso,
                  uninstallReason: cleanPoleId ? h.uninstallReason : options?.reason?.trim() || null,
                }
              : h
          );

          const nextHistory = cleanPoleId
            ? [
                {
                  id: `inst-${Date.now()}`,
                  poleIdentifier: targetPole!.identifier,
                  poleName: targetPole!.name,
                  siteName: targetPole!.siteName,
                  from: nowIso,
                  to: null,
                  actor: actorName,
                  note: options?.note?.trim() || null,
                },
                ...closedHistory,
              ]
            : closedHistory;

          const timelineEntry = cleanPoleId
            ? {
                id: `tl-${Date.now()}-inst`,
                kind: 'Installed' as const,
                message: prevPole
                  ? `Moved installation from pole ${prevPole} to ${targetPole!.identifier}`
                  : `Installed on pole ${targetPole!.identifier}`,
                field: 'Installed on',
                fromValue: prevPole,
                toValue: targetPole!.identifier,
                actor: actorName,
                timestamp: nowIso,
              }
            : {
                id: `tl-${Date.now()}-uninst`,
                kind: 'Uninstalled' as const,
                message: `Uninstalled from pole ${prevPole || 'unknown'} — ${options?.reason?.trim()}`,
                field: 'Installed on',
                fromValue: prevPole,
                toValue: 'Not installed',
                actor: actorName,
                timestamp: nowIso,
              };

          updated = {
            ...d,
            installedPoleId: targetPole ? targetPole.identifier : null,
            siteId: targetPole ? targetPole.siteId : d.siteId,
            siteName: targetPole ? targetPole.siteName : d.siteName,
            lastUpdatedAt: nowIso,
            installationHistory: nextHistory,
            timeline: [timelineEntry, ...d.timeline],
          };
          return updated;
        })
      );

      if (!updated) return { ok: false, error: `Device "${identifier}" not found.` };
      addToast(
        'success',
        cleanPoleId
          ? `${identifier} installed on ${targetPole!.identifier}.`
          : `${identifier} uninstalled from pole.`
      );
      return { ok: true, device: updated };
    },
    [devicePermissions, getPoleById, actorName, upsertDeviceList, addToast]
  );

  const sendDeviceConfig = useCallback(
    async (
      identifier: string,
      draftValues: Record<string, unknown>,
      options?: { note?: string; simulatePartialFailure?: boolean }
    ): Promise<ConfigMutationResult> => {
      if (!devicePermissions.canConfigureDevice) {
        return {
          ok: false,
          error: devicePermissions.configureDisabledReason || 'Permission denied.',
        };
      }

      const dev = rawDevices.find((d) => d.identifier === identifier);
      if (!dev) return { ok: false, error: `Device "${identifier}" not found.` };

      const schema = getConfigSchemaForDevice(dev);
      const changes = getChangedConfigKeys(schema, draftValues, dev.configuration);
      if (changes.length === 0) {
        return { ok: false, error: 'No configuration settings changed.' };
      }

      await new Promise((r) => setTimeout(r, 220));

      const nowIso = getServerNow().toISOString();
      const nextNum = dev.configVersions.length + 1;
      const versionLabel = `cfg-${nextNum}`;
      const isOffline = dev.connectivityState === 'offline';

      const results: DeviceConfigSettingResult[] = changes.map((c, idx) => {
        const fails =
          isOffline || (options?.simulatePartialFailure && idx === changes.length - 1);
        return {
          key: c.key,
          label: c.label,
          sentValue: c.toValue,
          previousValue: c.fromValue,
          status: fails ? 'Failed' : 'Applied',
          errorMessage: fails
            ? isOffline
              ? 'Device is Offline — Edge queued or timed out awaiting ACK.'
              : 'Edge rejected value out of hardware ACK window.'
            : undefined,
          reportedAt: fails ? null : nowIso,
        };
      });

      const failedCount = results.filter((r) => r.status === 'Failed').length;
      const versionStatus: DeviceConfigVersion['status'] =
        failedCount === 0
          ? 'Applied'
          : failedCount === results.length
          ? 'Failed'
          : 'Partly applied';

      // Device reported configuration only updates keys that actually succeeded
      const nextReportedConfig = { ...dev.configuration };
      for (const r of results) {
        if (r.status === 'Applied') {
          nextReportedConfig[r.key] = r.sentValue;
        }
      }

      const newVersion: DeviceConfigVersion = {
        id: `${dev.identifier}-${versionLabel}-${Date.now()}`,
        versionLabel,
        createdAt: nowIso,
        createdBy: actorName,
        note: options?.note?.trim() || null,
        status: versionStatus,
        values: { ...dev.configuration, ...draftValues },
        changedKeys: changes.map((c) => c.key),
        results,
      };

      upsertDeviceList((prev) =>
        prev.map((d) =>
          d.identifier === identifier
            ? {
                ...d,
                configVersion: versionLabel,
                configStatus: versionStatus,
                configReportedAt: nowIso,
                configuration: nextReportedConfig,
                lastUpdatedAt: nowIso,
                configVersions: [newVersion, ...d.configVersions],
                timeline: [
                  {
                    id: `tl-${Date.now()}-cfg`,
                    kind: 'Configuration',
                    message: `Configuration ${versionLabel} ${versionStatus.toLowerCase()} (${changes.length} ${
                      changes.length === 1 ? 'setting' : 'settings'
                    })`,
                    field: 'Configuration',
                    fromValue: d.configVersion || 'None',
                    toValue: `${versionLabel} (${versionStatus})`,
                    actor: actorName,
                    timestamp: nowIso,
                  },
                  ...d.timeline,
                ],
              }
            : d
        )
      );

      addToast(
        versionStatus === 'Applied' ? 'success' : versionStatus === 'Partly applied' ? 'info' : 'error',
        versionStatus === 'Applied'
          ? `${versionLabel} applied to ${identifier}.`
          : `${versionLabel} ${versionStatus.toLowerCase()} on ${identifier}.`
      );
      return { ok: true, version: newVersion };
    },
    [devicePermissions, rawDevices, actorName, upsertDeviceList, addToast]
  );

  const retryDeviceConfigSetting = useCallback(
    async (
      identifier: string,
      versionId: string,
      settingKey: string
    ): Promise<ConfigMutationResult> => {
      if (!devicePermissions.canConfigureDevice) {
        return {
          ok: false,
          error: devicePermissions.configureDisabledReason || 'Permission denied.',
        };
      }

      const dev = rawDevices.find((d) => d.identifier === identifier);
      if (!dev) return { ok: false, error: `Device "${identifier}" not found.` };
      if (dev.connectivityState === 'offline') {
        addToast('error', `${identifier} is Offline — cannot apply setting until online.`);
        return { ok: false, error: `${identifier} is currently Offline.` };
      }

      const nowIso = getServerNow().toISOString();
      let updatedVersion: DeviceConfigVersion | undefined;

      upsertDeviceList((prev) =>
        prev.map((d) => {
          if (d.identifier !== identifier) return d;
          const versions = d.configVersions.map((v) => {
            if (v.id !== versionId) return v;
            const results = v.results.map((r) =>
              r.key === settingKey
                ? { ...r, status: 'Applied' as const, errorMessage: undefined, reportedAt: nowIso }
                : r
            );
            const hasFail = results.some((r) => r.status === 'Failed');
            const nextStatus: DeviceConfigVersion['status'] = hasFail ? 'Partly applied' : 'Applied';
            updatedVersion = { ...v, results, status: nextStatus };
            return updatedVersion;
          });

          const targetResult = updatedVersion?.results.find((r) => r.key === settingKey);
          const nextConfig =
            targetResult && targetResult.status === 'Applied'
              ? { ...d.configuration, [settingKey]: targetResult.sentValue }
              : d.configuration;

          const latestStatus = versions[0]?.status || d.configStatus;
          return {
            ...d,
            configuration: nextConfig,
            configStatus: latestStatus,
            configReportedAt: nowIso,
            configVersions: versions,
          };
        })
      );

      addToast('success', `Setting retried and applied on ${identifier}.`);
      return { ok: true, version: updatedVersion };
    },
    [devicePermissions, rawDevices, upsertDeviceList, addToast]
  );

  const rollbackDeviceConfig = useCallback(
    async (
      identifier: string,
      targetVersionId: string,
      reason: string
    ): Promise<ConfigMutationResult> => {
      if (!devicePermissions.canRollbackConfig) {
        return {
          ok: false,
          error: devicePermissions.rollbackDisabledReason || 'Permission denied.',
        };
      }
      if (!reason.trim()) {
        return { ok: false, error: 'A rollback reason is required.' };
      }

      const dev = rawDevices.find((d) => d.identifier === identifier);
      if (!dev) return { ok: false, error: `Device "${identifier}" not found.` };
      const targetVer = dev.configVersions.find((v) => v.id === targetVersionId);
      if (!targetVer) return { ok: false, error: 'Target configuration version not found.' };

      const schema = getConfigSchemaForDevice(dev);
      const changes = getChangedConfigKeys(schema, targetVer.values, dev.configuration);
      const nowIso = getServerNow().toISOString();
      const nextNum = dev.configVersions.length + 1;
      const nextLabel = `cfg-${nextNum}`;

      const results: DeviceConfigSettingResult[] = changes.map((c) => ({
        key: c.key,
        label: c.label,
        sentValue: c.toValue,
        previousValue: c.fromValue,
        status: 'Applied',
        reportedAt: nowIso,
      }));

      const rollbackVersion: DeviceConfigVersion = {
        id: `${dev.identifier}-${nextLabel}-${Date.now()}`,
        versionLabel: nextLabel,
        createdAt: nowIso,
        createdBy: actorName,
        note: `Rollback to ${targetVer.versionLabel}: ${reason.trim()}`,
        rollbackOfVersion: targetVer.versionLabel,
        status: 'Applied',
        values: { ...targetVer.values },
        changedKeys: changes.map((c) => c.key),
        results,
      };

      upsertDeviceList((prev) =>
        prev.map((d) =>
          d.identifier === identifier
            ? {
                ...d,
                configVersion: nextLabel,
                configStatus: 'Applied',
                configReportedAt: nowIso,
                configuration: { ...targetVer.values },
                lastUpdatedAt: nowIso,
                configVersions: [rollbackVersion, ...d.configVersions],
                timeline: [
                  {
                    id: `tl-${Date.now()}-rb`,
                    kind: 'Configuration',
                    message: `Rolled back configuration to ${targetVer.versionLabel} as ${nextLabel} — ${reason.trim()}`,
                    field: 'Configuration',
                    fromValue: d.configVersion,
                    toValue: nextLabel,
                    actor: actorName,
                    timestamp: nowIso,
                  },
                  ...d.timeline,
                ],
              }
            : d
        )
      );

      addToast('success', `Configuration rolled back to ${targetVer.versionLabel} (${nextLabel}).`);
      return { ok: true, version: rollbackVersion };
    },
    [devicePermissions, rawDevices, actorName, upsertDeviceList, addToast]
  );

  const runConnectionCheck = useCallback(
    async (identifier: string): Promise<DeviceMutationResult> => {
      if (!devicePermissions.canRunConnectionCheck) {
        return {
          ok: false,
          error: devicePermissions.connectionCheckDisabledReason || 'Permission denied.',
        };
      }

      await new Promise((r) => setTimeout(r, 250));
      const nowIso = getServerNow().toISOString();
      let checkedDevice: DeviceRecord | undefined;

      upsertDeviceList((prev) =>
        prev.map((d) => {
          if (d.identifier !== identifier) return d;
          const isOffline = d.connectivityState === 'offline';
          checkedDevice = {
            ...d,
            lastContactAt: isOffline ? d.lastContactAt : nowIso,
            connectionCheck: {
              status: isOffline ? 'Fail' : 'Pass',
              checkedAt: nowIso,
              message: isOffline
                ? `Edge ping timed out for ${d.library} (${d.vendorDeviceId})`
                : `Edge reachable via ${d.library} (44 ms)`,
              latencyMs: isOffline ? null : 44,
            },
            timeline: [
              {
                id: `tl-${Date.now()}-chk`,
                kind: 'Connection check',
                message: isOffline
                  ? 'Connection check failed — Edge ping timed out'
                  : 'Connection check passed (44 ms)',
                actor: actorName,
                timestamp: nowIso,
              },
              ...d.timeline,
            ],
          };
          return checkedDevice;
        })
      );

      if (!checkedDevice) return { ok: false, error: `Device "${identifier}" not found.` };
      addToast(
        checkedDevice.connectionCheck.status === 'Pass' ? 'success' : 'error',
        checkedDevice.connectionCheck.message || 'Connection check complete.'
      );
      return { ok: true, device: checkedDevice };
    },
    [devicePermissions, actorName, upsertDeviceList, addToast]
  );

  const reloadVendorList = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 220));
    const nowIso = getServerNow().toISOString();
    setVendorSyncSummary((prev) => ({
      ...prev,
      lastListReloadAt: nowIso,
      totalVendorDevices: vendorRecords.length,
    }));
    setIsRefreshing(false);
    addToast('info', 'Vendor list reloaded from latest cached snapshot.');
  }, [vendorRecords.length, addToast]);

  const triggerVendorSync = useCallback(
    async (library: string): Promise<MutationResult> => {
      if (!devicePermissions.canTriggerVendorSync) {
        return {
          ok: false,
          error: devicePermissions.vendorSyncDisabledReason || 'Edge sync endpoint not available.',
        };
      }
      setIsRefreshing(true);
      await new Promise((r) => setTimeout(r, 350));
      const nowIso = getServerNow().toISOString();
      setVendorSyncSummary((prev) => ({
        ...prev,
        library,
        lastFullSyncAt: nowIso,
        lastListReloadAt: nowIso,
        totalVendorDevices: vendorRecords.length,
      }));
      setIsRefreshing(false);
      addToast('success', `Full Edge sync completed for ${library}.`);
      return { ok: true };
    },
    [devicePermissions, vendorRecords.length, addToast]
  );

  const resolveVendorConflict = useCallback(
    async (vendorRecordId: string, resolution: ResolveConflictInput): Promise<MutationResult> => {
      if (!devicePermissions.canResolveVendorConflict) {
        return {
          ok: false,
          error: devicePermissions.resolveConflictDisabledReason || 'Permission denied.',
        };
      }
      if (!resolution.reason.trim()) {
        return { ok: false, error: 'A resolution reason is required for the audit trail.' };
      }

      const vr = vendorRecords.find((v) => v.id === vendorRecordId);
      if (!vr) return { ok: false, error: 'Vendor discovery record not found.' };

      const nowIso = getServerNow().toISOString();

      if (resolution.mode === 'remap_existing_falcon') {
        const targetId = vr.matchedFalconId;
        if (!targetId) return { ok: false, error: 'No claiming FALCON device identifier found.' };

        upsertDeviceList((prev) =>
          prev.map((d) =>
            d.identifier === targetId
              ? {
                  ...d,
                  serial: vr.serial,
                  vendorDeviceId: vr.serial,
                  lastUpdatedAt: nowIso,
                  timeline: [
                    {
                      id: `tl-${Date.now()}-remap`,
                      kind: 'Conflict resolved',
                      message: `Remapped vendor device from ${d.vendorDeviceId} to ${vr.serial} (${resolution.reason.trim()})`,
                      field: 'Vendor device id',
                      fromValue: d.vendorDeviceId,
                      toValue: vr.serial,
                      actor: actorName,
                      timestamp: nowIso,
                    },
                    ...d.timeline,
                  ],
                }
              : d
          )
        );

        setBaseVendorRecords((prev) =>
          prev.map((item) =>
            item.id === vendorRecordId
              ? { ...item, matchStatus: 'Registered', conflictReason: null }
              : item
          )
        );

        addToast('success', `Conflict resolved: ${targetId} now maps to ${vr.serial}.`);
        return { ok: true };
      }

      // Mode 2: keep existing FALCON mapping untouched, register this vendor serial as a new FALCON device
      const newId = resolution.newIdentifier?.trim();
      if (!newId) return { ok: false, error: 'New FALCON identifier is required.' };
      if (!isDeviceIdentifierUnique(newId)) {
        return { ok: false, error: `Identifier "${newId}" already exists.` };
      }

      const regRes = await registerDevice({
        identifier: newId,
        name: resolution.newName?.trim() || vr.vendorName,
        siteName: 'Teluk Panglima Garang',
        type: 'Camera',
        manufacturer: vr.manufacturer,
        library: vr.library,
        model: vr.model,
        serial: vr.serial,
        vendorDeviceId: vr.serial,
        lifecycle: 'Active',
      });
      if (!regRes.ok) return { ok: false, error: regRes.error };

      setBaseVendorRecords((prev) =>
        prev.map((item) =>
          item.id === vendorRecordId
            ? {
                ...item,
                matchStatus: 'Registered',
                matchedFalconId: newId,
                conflictReason: null,
              }
            : item
        )
      );

      addToast('success', `Conflict resolved: ${vr.serial} registered separately as ${newId}.`);
      return { ok: true };
    },
    [devicePermissions, vendorRecords, actorName, upsertDeviceList, isDeviceIdentifierUnique, registerDevice, addToast]
  );

  const retireOrDeleteDevice = useCallback(
    async (
      identifier: string,
      action: 'retire' | 'delete',
      reason: string
    ): Promise<DeviceMutationResult> => {
      if (!reason.trim()) return { ok: false, error: 'A reason is required.' };

      const nowIso = getServerNow().toISOString();
      if (action === 'delete') {
        if (!devicePermissions.canDeleteDevice) {
          return {
            ok: false,
            error: devicePermissions.deleteDisabledReason || 'Permission denied.',
          };
        }
        upsertDeviceList((prev) => prev.filter((d) => d.identifier !== identifier));
        addToast('success', `Device ${identifier} deleted.`);
        return { ok: true };
      }

      if (!devicePermissions.canEditDevice) {
        return { ok: false, error: devicePermissions.editDisabledReason || 'Permission denied.' };
      }

      let retired: DeviceRecord | undefined;
      upsertDeviceList((prev) =>
        prev.map((d) => {
          if (d.identifier !== identifier) return d;
          retired = {
            ...d,
            lifecycle: 'Retired',
            lastUpdatedAt: nowIso,
            timeline: [
              {
                id: `tl-${Date.now()}-ret`,
                kind: 'Lifecycle',
                message: `Lifecycle changed from ${d.lifecycle} to Retired — ${reason.trim()}`,
                field: 'Lifecycle',
                fromValue: d.lifecycle,
                toValue: 'Retired',
                actor: actorName,
                timestamp: nowIso,
              },
              ...d.timeline,
            ],
          };
          return retired;
        })
      );

      if (!retired) return { ok: false, error: `Device "${identifier}" not found.` };
      addToast('success', `Device ${identifier} retired.`);
      return { ok: true, device: retired };
    },
    [devicePermissions, actorName, upsertDeviceList, addToast]
  );

  return (
    <AssetsContext.Provider
      value={{
        sites,
        poles,
        rawPoles,
        cableSpans,
        devices,
        rawDevices,
        richDevices,
        vendorRecords,
        vendorSyncSummary,
        devicePolicyConfig,
        capabilities,
        permissions,
        devicePermissions,
        hasTestFlag,
        isLoading,
        isRefreshing,
        errorMessage,
        recentlyCreatedId,
        setRecentlyCreatedId,
        recentlyCreatedDeviceId,
        setRecentlyCreatedDeviceId,
        refreshAssets,
        retryLoad,
        getPoleById,
        isIdentifierUnique,
        registerPole,
        relocatePole,
        editPole,
        deletePole,
        restorePole,
        getDeviceById,
        isDeviceIdentifierUnique,
        registerDevice,
        editDevice,
        manageInstallation,
        sendDeviceConfig,
        retryDeviceConfigSetting,
        rollbackDeviceConfig,
        runConnectionCheck,
        reloadVendorList,
        triggerVendorSync,
        resolveVendorConflict,
        retireOrDeleteDevice,
        savedViews,
        saveView,
        renameSavedView,
        deleteSavedView,
        setDefaultView,
        deviceSavedViews,
        saveDeviceView,
        renameDeviceSavedView,
        deleteDeviceSavedView,
        setDefaultDeviceView,
      }}
    >
      {children}
    </AssetsContext.Provider>
  );
};

export const useAssets = () => {
  const ctx = useContext(AssetsContext);
  if (!ctx) throw new Error('useAssets must be used within AssetsProvider');
  return ctx;
};

