import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from 'react';
import type {
  DeviceRecord,
  VendorDeviceRecord,
  DeviceSavedView,
  DeviceHardwareType,
} from '@/types/devices';
import { canonicalDevices, canonicalVendorDevices } from '@/data/canonicalDevices';
import { useAppContext } from './AppContext';
import { useToast } from './ToastContext';
import { useEvents } from './EventsContext';
import { getServerNow } from '@/lib/dateTime';
import { initialPoles } from '@/data/poles';

export interface RegisterDeviceInput {
  identifier: string;
  name?: string;
  siteName: string;
  type: DeviceHardwareType;
  manufacturer: string;
  library: string;
  model: string;
  serialNumber: string;
  components?: string[];
  installedOnPoleId?: string | null;
}

export interface EditDeviceInput {
  name: string;
  type: DeviceHardwareType;
  model: string;
  serialNumber: string;
  manufacturer: string;
  library: string;
  components: string[];
}

export interface DevicesContextType {
  devices: DeviceRecord[];
  vendorDevices: VendorDeviceRecord[];
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  recentlyCreatedId: string | null;
  setRecentlyCreatedId: (id: string | null) => void;
  refreshDevices: () => Promise<void>;
  getDeviceById: (identifier: string) => DeviceRecord | undefined;
  isIdentifierUnique: (identifier: string) => boolean;
  registerDevice: (input: RegisterDeviceInput) => Promise<{ ok: boolean; error?: string; device?: DeviceRecord }>;
  editDevice: (identifier: string, patch: EditDeviceInput) => Promise<{ ok: boolean; error?: string; device?: DeviceRecord }>;
  manageInstallation: (identifier: string, poleId: string | null, note?: string) => Promise<{ ok: boolean; error?: string }>;
  updateSettings: (identifier: string, settings: Record<string, any>, reason?: string) => Promise<{ ok: boolean; versionLabel?: string }>;
  remapVendorConflict: (claimedFalconId: string, targetVendorSerial: string, reason: string) => Promise<{ ok: boolean }>;
  savedViews: DeviceSavedView[];
  saveView: (name: string, filters: DeviceSavedView['filters']) => void;
  deleteSavedView: (id: string) => void;
}

const DevicesContext = createContext<DevicesContextType | undefined>(undefined);
const SAVED_VIEWS_KEY = 'falcon_devices_saved_views';

export const DevicesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accountLabel } = useAppContext();
  const { addToast } = useToast();
  const { events } = useEvents();

  const [devicesList, setDevicesList] = useState<DeviceRecord[]>(canonicalDevices);
  const [vendorList, setVendorList] = useState<VendorDeviceRecord[]>(canonicalVendorDevices);
  const [isLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage] = useState<string | null>(null);
  const [recentlyCreatedId, setRecentlyCreatedId] = useState<string | null>(null);

  // Synchronize 30-day event counts from shared events
  const enrichedDevices = useMemo(() => {
    return devicesList.map((dev) => {
      const matchCount = events.filter((e) => {
        if (!e.device) return false;
        const normDev = e.device.toLowerCase().replace(/_/g, '-');
        const normId = dev.identifier.toLowerCase().replace(/_/g, '-');
        return normDev === normId;
      }).length;
      return {
        ...dev,
        events30dCount: matchCount > 0 ? matchCount : dev.events30dCount ?? 0,
      };
    });
  }, [devicesList, events]);

  const refreshDevices = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await new Promise((res) => setTimeout(res, 500));
      addToast('success', 'Device telemetry updated.');
    } finally {
      setIsRefreshing(false);
    }
  }, [addToast]);

  const getDeviceById = useCallback(
    (identifier: string) => {
      const norm = identifier.trim().toLowerCase();
      return enrichedDevices.find(
        (d) =>
          d.identifier.toLowerCase() === norm ||
          d.identifier.toLowerCase().replace(/_/g, '-') === norm.replace(/_/g, '-')
      );
    },
    [enrichedDevices]
  );

  const isIdentifierUnique = useCallback(
    (identifier: string) => {
      const norm = identifier.trim().toLowerCase();
      return !enrichedDevices.some(
        (d) =>
          d.identifier.toLowerCase() === norm ||
          d.identifier.toLowerCase().replace(/_/g, '-') === norm.replace(/_/g, '-')
      );
    },
    [enrichedDevices]
  );

  const registerDevice = useCallback(
    async (input: RegisterDeviceInput) => {
      if (!isIdentifierUnique(input.identifier)) {
        return { ok: false, error: `Device identifier "${input.identifier}" already exists.` };
      }

      let location = null;
      if (input.installedOnPoleId) {
        const pole = initialPoles.find((p) => p.identifier === input.installedOnPoleId);
        if (pole && pole.location) {
          location = { ...pole.location };
        }
      }

      const now = getServerNow();
      const nowIso = now.toISOString();

      const newDevice: DeviceRecord = {
        identifier: input.identifier.trim(),
        name: input.name?.trim() || input.identifier.trim(),
        type: input.type,
        state: 'online',
        lastContact: 'Just now',
        lastContactIso: nowIso,
        manufacturer: input.manufacturer,
        model: input.model,
        serialNumber: input.serialNumber,
        library: input.library,
        vendorDeviceId: input.identifier.trim(),
        softwareVersion: 'V1.0.0',
        components: input.components || [],
        siteId: 'site-tpg',
        siteName: input.siteName,
        installedOnPoleId: input.installedOnPoleId || null,
        location,
        appliedConfigVersion: null,
        configVersions: [],
        connectivityHistory: [
          {
            id: `conn-reg-${Date.now()}`,
            record: 'Connectivity',
            status: 'online',
            from: nowIso,
            to: null,
            durationMinutes: 1,
            recordedBy: 'Telemetry',
            recordedAt: nowIso,
          },
        ],
        timeline: [
          {
            id: `tl-reg-${Date.now()}`,
            kind: 'Registered',
            message: 'Device registered in FALCON',
            actor: accountLabel || 'Admin',
            timestamp: nowIso,
          },
        ],
        installationHistory: input.installedOnPoleId
          ? [
              {
                id: `inst-reg-${Date.now()}`,
                poleId: input.installedOnPoleId,
                from: nowIso,
                to: null,
                installedBy: accountLabel || 'Admin',
                note: 'Mounted at registration',
              },
            ]
          : [],
        healthReports: [],
        events30dCount: 0,
      };

      setDevicesList((prev) => [newDevice, ...prev]);
      setRecentlyCreatedId(newDevice.identifier);

      // Also update vendor list if this matches an unregistered vendor device
      setVendorList((prev) =>
        prev.map((v) =>
          v.serialNumber === input.serialNumber
            ? {
                ...v,
                matchStatus: 'Registered',
                mappedFalconId: newDevice.identifier,
                explanation: `Registered as FALCON device ${newDevice.identifier}.`,
              }
            : v
        )
      );

      addToast('success', `Device ${newDevice.identifier} registered successfully.`);
      return { ok: true, device: newDevice };
    },
    [isIdentifierUnique, accountLabel, addToast]
  );

  const editDevice = useCallback(
    async (identifier: string, patch: EditDeviceInput) => {
      const now = getServerNow().toISOString();
      let updated: DeviceRecord | undefined;

      setDevicesList((prev) =>
        prev.map((d) => {
          if (d.identifier !== identifier) return d;
          updated = {
            ...d,
            name: patch.name,
            type: patch.type,
            model: patch.model,
            serialNumber: patch.serialNumber,
            manufacturer: patch.manufacturer,
            library: patch.library,
            components: patch.components,
            timeline: [
              {
                id: `tl-edit-${Date.now()}`,
                kind: 'Change',
                message: 'Device details updated',
                actor: accountLabel || 'Admin',
                timestamp: now,
              },
              ...d.timeline,
            ],
          };
          return updated;
        })
      );

      if (updated) {
        addToast('success', `Device ${identifier} updated.`);
        return { ok: true, device: updated };
      }
      return { ok: false, error: 'Device not found' };
    },
    [accountLabel, addToast]
  );

  const manageInstallation = useCallback(
    async (identifier: string, poleId: string | null, note?: string) => {
      const now = getServerNow().toISOString();
      let location = null;
      if (poleId) {
        const pole = initialPoles.find((p) => p.identifier === poleId);
        if (pole && pole.location) {
          location = { ...pole.location };
        }
      }

      setDevicesList((prev) =>
        prev.map((d) => {
          if (d.identifier !== identifier) return d;

          const updatedHist = [...d.installationHistory];
          if (updatedHist.length > 0 && updatedHist[0].to === null) {
            updatedHist[0] = { ...updatedHist[0], to: now };
          }
          if (poleId) {
            updatedHist.unshift({
              id: `inst-${Date.now()}`,
              poleId,
              from: now,
              to: null,
              installedBy: accountLabel || 'Admin',
              note: note || 'Field installation update',
            });
          }

          return {
            ...d,
            installedOnPoleId: poleId,
            location,
            installationHistory: updatedHist,
            timeline: [
              {
                id: `tl-inst-${Date.now()}`,
                kind: 'Installed',
                message: poleId ? `Mounted on pole ${poleId}` : 'Uninstalled from pole',
                actor: accountLabel || 'Admin',
                timestamp: now,
              },
              ...d.timeline,
            ],
          };
        })
      );

      addToast('success', poleId ? `Device mounted on ${poleId}.` : 'Device uninstalled.');
      return { ok: true };
    },
    [accountLabel, addToast]
  );

  const updateSettings = useCallback(
    async (identifier: string, settings: Record<string, any>, reason?: string) => {
      const now = getServerNow().toISOString();
      let versionLabel = 'cfg-1';

      setDevicesList((prev) =>
        prev.map((d) => {
          if (d.identifier !== identifier) return d;

          const currentVer = d.configVersions.length + 1;
          versionLabel = `cfg-${currentVer}`;

          const settingResults = Object.keys(settings).map((key) => ({
            settingKey: key,
            status: 'Applied' as const,
            appliedAt: now,
          }));

          const newVersion = {
            versionNumber: currentVer,
            versionLabel,
            appliedAt: now,
            appliedBy: accountLabel || 'Admin',
            reason: reason || 'Configuration updated from dashboard',
            settings: { ...settings },
            results: settingResults,
          };

          return {
            ...d,
            appliedConfigVersion: versionLabel,
            configStatus: 'Applied',
            currentSettings: { ...(d.currentSettings || {}), ...settings },
            configVersions: [newVersion, ...d.configVersions],
            timeline: [
              {
                id: `tl-cfg-${Date.now()}`,
                kind: 'Configuration',
                message: `Applied configuration version ${versionLabel}`,
                actor: accountLabel || 'Admin',
                timestamp: now,
              },
              ...d.timeline,
            ],
          };
        })
      );

      addToast('success', `Configuration ${versionLabel} sent to Edge and applied.`);
      return { ok: true, versionLabel };
    },
    [accountLabel, addToast]
  );

  const remapVendorConflict = useCallback(
    async (claimedFalconId: string, targetVendorSerial: string, reason: string) => {
      const now = getServerNow().toISOString();

      setDevicesList((prev) =>
        prev.map((d) => {
          if (d.identifier !== claimedFalconId) return d;
          return {
            ...d,
            serialNumber: targetVendorSerial,
            vendorDeviceId: targetVendorSerial,
            timeline: [
              {
                id: `tl-remap-${Date.now()}`,
                kind: 'Change',
                message: `Remapped to vendor serial ${targetVendorSerial}: ${reason}`,
                actor: accountLabel || 'Admin',
                timestamp: now,
              },
              ...d.timeline,
            ],
          };
        })
      );

      setVendorList((prev) =>
        prev.map((v) => {
          if (v.serialNumber === targetVendorSerial) {
            return {
              ...v,
              matchStatus: 'Registered',
              mappedFalconId: claimedFalconId,
              explanation: `Conflict resolved: mapped to ${claimedFalconId}.`,
              conflictDetails: undefined,
            };
          }
          return v;
        })
      );

      addToast('success', `Vendor conflict resolved. ${claimedFalconId} mapped to ${targetVendorSerial}.`);
      return { ok: true };
    },
    [accountLabel, addToast]
  );

  // Saved Views
  const [savedViews, setSavedViews] = useState<DeviceSavedView[]>(() => {
    try {
      const stored = localStorage.getItem(SAVED_VIEWS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [
      {
        id: 'devices-view-all',
        name: 'All registered devices',
        isDefault: true,
        filters: { statusTab: 'all', installation: 'all' },
      },
      {
        id: 'devices-view-needs-attention',
        name: 'Offline or stale devices',
        isDefault: false,
        filters: { statusTab: 'all', lastContactRange: 'older_24h' },
      },
      {
        id: 'devices-view-not-installed',
        name: 'Unmounted (not installed)',
        isDefault: false,
        filters: { statusTab: 'all', installation: 'not_installed' },
      },
    ];
  });

  const saveView = useCallback((name: string, filters: DeviceSavedView['filters']) => {
    const newView: DeviceSavedView = {
      id: `dev-view-${Date.now()}`,
      name,
      isDefault: false,
      filters,
    };
    setSavedViews((prev) => {
      const next = [...prev, newView];
      try {
        localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    addToast('success', `View "${name}" saved.`);
  }, [addToast]);

  const deleteSavedView = useCallback((id: string) => {
    setSavedViews((prev) => {
      const next = prev.filter((v) => v.id !== id);
      try {
        localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return (
    <DevicesContext.Provider
      value={{
        devices: enrichedDevices,
        vendorDevices: vendorList,
        isLoading,
        isRefreshing,
        errorMessage,
        recentlyCreatedId,
        setRecentlyCreatedId,
        refreshDevices,
        getDeviceById,
        isIdentifierUnique,
        registerDevice,
        editDevice,
        manageInstallation,
        updateSettings,
        remapVendorConflict,
        savedViews,
        saveView,
        deleteSavedView,
      }}
    >
      {children}
    </DevicesContext.Provider>
  );
};

export const useDevices = (): DevicesContextType => {
  const context = useContext(DevicesContext);
  if (!context) {
    throw new Error('useDevices must be used within a DevicesProvider');
  }
  return context;
};
