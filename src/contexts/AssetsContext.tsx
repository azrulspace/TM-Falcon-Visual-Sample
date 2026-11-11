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
import {
  SITES,
  initialPoles,
  initialCableSpans,
  buildJalanBandarLamaPreviewDataset,
  normalizeRelationKey,
} from '@/data/poles';
import { devices as initialDevices } from '@/data/devices';
import { enrichPoleWithRelations } from '@/data/poleSelectors';
import { useEvents } from './EventsContext';
import { useAppContext } from './AppContext';
import { useToast } from './ToastContext';
import { getServerNow } from '@/lib/dateTime';
import {
  getRoleFromAccountLabel,
  getPolePermissions,
  DEFAULT_BACKEND_CAPABILITIES,
  PREVIEW_BACKEND_CAPABILITIES,
  type PolePermissions,
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

export interface AssetsContextType {
  sites: SiteRecord[];
  poles: PoleWithRelations[];
  rawPoles: PoleRecord[];
  cableSpans: CableSpanRecord[];
  devices: DeviceSummaryRecord[];
  capabilities: BackendCapabilities;
  permissions: PolePermissions;
  hasTestFlag: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  recentlyCreatedId: string | null;
  setRecentlyCreatedId: (id: string | null) => void;
  refreshAssets: () => Promise<void>;
  retryLoad: () => void;
  getPoleById: (identifier: string) => PoleWithRelations | undefined;
  isIdentifierUnique: (identifier: string) => boolean;
  registerPole: (input: RegisterPoleInput) => Promise<MutationResult>;
  relocatePole: (identifier: string, location: PoleLocation, reason?: string) => Promise<MutationResult>;
  editPole: (identifier: string, patch: EditPoleInput) => Promise<MutationResult>;
  deletePole: (identifier: string, reason: string) => Promise<MutationResult>;
  restorePole: (identifier: string) => Promise<MutationResult>;
  // Saved views
  savedViews: PoleSavedView[];
  saveView: (name: string, filters: PoleSavedView['filters']) => void;
  renameSavedView: (id: string, newName: string) => void;
  deleteSavedView: (id: string) => void;
  setDefaultView: (id: string) => void;
}

const AssetsContext = createContext<AssetsContextType | undefined>(undefined);
const SAVED_VIEWS_KEY = 'falcon_poles_saved_views';

export const AssetsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accountLabel, previewDataMode } = useAppContext();
  const { events } = useEvents();
  const { addToast } = useToast();

  const [basePoles, setBasePoles] = useState<PoleRecord[]>(initialPoles);
  const [baseSpans] = useState<CableSpanRecord[]>(initialCableSpans);
  const [baseDevices] = useState<DeviceSummaryRecord[]>(initialDevices);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentlyCreatedId, setRecentlyCreatedId] = useState<string | null>(null);

  const previewScenario = useMemo(() => buildJalanBandarLamaPreviewDataset(), []);

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

  const devices = useMemo<DeviceSummaryRecord[]>(() => {
    return previewDataMode ? [...previewScenario.devices, ...baseDevices] : baseDevices;
  }, [baseDevices, previewDataMode, previewScenario.devices]);

  const capabilities = previewDataMode
    ? PREVIEW_BACKEND_CAPABILITIES
    : DEFAULT_BACKEND_CAPABILITIES;

  const role = getRoleFromAccountLabel(accountLabel);
  const permissions = useMemo(
    () => getPolePermissions(role, capabilities),
    [role, capabilities]
  );

  const actorName = useMemo(() => {
    if (!accountLabel) return 'Admin';
    return accountLabel.replace(/\s*\(sample\)\s*/i, '').trim() || 'Admin';
  }, [accountLabel]);

  const poles = useMemo<PoleWithRelations[]>(() => {
    const now = getServerNow();
    return rawPoles.map((p) =>
      enrichPoleWithRelations(p, devices, cableSpans, events, sites, now)
    );
  }, [rawPoles, devices, cableSpans, events, sites]);

  const hasTestFlag = useMemo(
    () => rawPoles.some((p) => typeof p.isTest === 'boolean'),
    [rawPoles]
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

  return (
    <AssetsContext.Provider
      value={{
        sites,
        poles,
        rawPoles,
        cableSpans,
        devices,
        capabilities,
        permissions,
        hasTestFlag,
        isLoading,
        isRefreshing,
        errorMessage,
        recentlyCreatedId,
        setRecentlyCreatedId,
        refreshAssets,
        retryLoad,
        getPoleById,
        isIdentifierUnique,
        registerPole,
        relocatePole,
        editPole,
        deletePole,
        restorePole,
        savedViews,
        saveView,
        renameSavedView,
        deleteSavedView,
        setDefaultView,
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

