import type { DeviceWithRelations } from '../types/devices.ts';

export interface LiveCameraGroup {
  id: string;
  name: string;
  description?: string;
  cameraIds: string[];
  isSystem?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const STORAGE_KEY_LIVE_GROUPS = 'falcon_live_groups';
export const STORAGE_KEY_ACTIVE_GROUP = 'falcon_live_active_group';
export const STORAGE_KEY_LAST_MODE = 'falcon_live_last_mode';

export const MAX_GROUPS_PER_USER = 20;
export const MAX_CAMERAS_PER_GROUP = 30;

export const DEFAULT_GROUPS: LiveCameraGroup[] = [
  {
    id: 'grp-all',
    name: 'All cameras',
    description: 'System group containing all active cameras in the fleet.',
    cameraIds: ['DEV-001', 'DEV-002', 'DEV-003', 'DEV-004', 'DEV-005', 'DEV-006'],
    isSystem: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'grp-feeder',
    name: 'Feeder Poles Priority',
    description: 'Critical feeder pole cameras along primary fibre trunk lines.',
    cameraIds: ['DEV-001', 'DEV-002', 'DEV-003', 'DEV-004'],
    isSystem: false,
    createdAt: '2026-02-15T08:30:00.000Z',
    updatedAt: '2026-02-15T08:30:00.000Z',
  },
  {
    id: 'grp-substations',
    name: 'Substations & Hubs',
    description: 'Distribution hub nodes and road junctions.',
    cameraIds: ['DEV-001', 'DEV-003', 'DEV-005'],
    isSystem: false,
    createdAt: '2026-03-01T09:00:00.000Z',
    updatedAt: '2026-03-01T09:00:00.000Z',
  },
];

/**
 * Retrieves all camera groups from localStorage, or seeds default groups if none exist.
 */
export function getLiveGroups(allAvailableCameras?: DeviceWithRelations[]): LiveCameraGroup[] {
  if (typeof window === 'undefined') {
    return DEFAULT_GROUPS;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIVE_GROUPS);
    let groups: LiveCameraGroup[] = [];

    if (raw) {
      groups = JSON.parse(raw);
    } else {
      groups = [...DEFAULT_GROUPS];
      localStorage.setItem(STORAGE_KEY_LIVE_GROUPS, JSON.stringify(groups));
    }

    // Ensure the system "All cameras" group includes any newly discovered cameras
    if (allAvailableCameras && allAvailableCameras.length > 0) {
      const allCameraIds = allAvailableCameras.map((c) => c.identifier);
      const systemGroup = groups.find((g) => g.isSystem || g.id === 'grp-all');
      if (systemGroup) {
        systemGroup.cameraIds = Array.from(new Set([...systemGroup.cameraIds, ...allCameraIds]));
      }
    }

    return groups;
  } catch {
    return DEFAULT_GROUPS;
  }
}

/**
 * Retrieves a single camera group by its ID.
 */
export function getLiveGroupById(groupId: string, allAvailableCameras?: DeviceWithRelations[]): LiveCameraGroup | null {
  const groups = getLiveGroups(allAvailableCameras);
  return groups.find((g) => g.id.toLowerCase() === groupId.toLowerCase()) || null;
}

/**
 * Saves or updates a camera group.
 */
export function saveLiveGroup(
  groupData: {
    id?: string;
    name: string;
    description?: string;
    cameraIds: string[];
  },
  allAvailableCameras?: DeviceWithRelations[]
): { success: boolean; group?: LiveCameraGroup; error?: string } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window not available' };
  }

  const trimmedName = groupData.name.trim();
  if (!trimmedName) {
    return { success: false, error: 'Group name is required' };
  }

  if (trimmedName.length > 40) {
    return { success: false, error: 'Group name must be 40 characters or fewer' };
  }

  const cleanCameraIds = Array.from(new Set(groupData.cameraIds)).slice(0, MAX_CAMERAS_PER_GROUP);

  const groups = getLiveGroups(allAvailableCameras);

  if (groupData.id) {
    // Update existing
    const index = groups.findIndex((g) => g.id === groupData.id);
    if (index === -1) {
      return { success: false, error: 'Group not found' };
    }

    const existing = groups[index];
    const updated: LiveCameraGroup = {
      ...existing,
      name: existing.isSystem ? existing.name : trimmedName,
      description: groupData.description?.trim(),
      cameraIds: cleanCameraIds,
      updatedAt: new Date().toISOString(),
    };

    groups[index] = updated;
    localStorage.setItem(STORAGE_KEY_LIVE_GROUPS, JSON.stringify(groups));
    return { success: true, group: updated };
  } else {
    // Create new
    if (groups.length >= MAX_GROUPS_PER_USER) {
      return { success: false, error: `Maximum limit of ${MAX_GROUPS_PER_USER} groups reached.` };
    }

    const newId = `grp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();
    const newGroup: LiveCameraGroup = {
      id: newId,
      name: trimmedName,
      description: groupData.description?.trim(),
      cameraIds: cleanCameraIds,
      isSystem: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    groups.push(newGroup);
    localStorage.setItem(STORAGE_KEY_LIVE_GROUPS, JSON.stringify(groups));
    return { success: true, group: newGroup };
  }
}

/**
 * Deletes a camera group by ID. System groups cannot be deleted.
 */
export function deleteLiveGroup(groupId: string): { success: boolean; deletedGroup?: LiveCameraGroup; error?: string } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window not available' };
  }

  const groups = getLiveGroups();
  const index = groups.findIndex((g) => g.id.toLowerCase() === groupId.toLowerCase());

  if (index === -1) {
    return { success: false, error: 'Group not found' };
  }

  const target = groups[index];
  if (target.isSystem || target.id === 'grp-all') {
    return { success: false, error: 'System groups cannot be deleted' };
  }

  groups.splice(index, 1);
  localStorage.setItem(STORAGE_KEY_LIVE_GROUPS, JSON.stringify(groups));
  return { success: true, deletedGroup: target };
}

/**
 * Restores a deleted group (used by 8-second undo toast).
 */
export function restoreLiveGroup(group: LiveCameraGroup): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const groups = getLiveGroups();
    if (!groups.some((g) => g.id === group.id)) {
      groups.push(group);
      localStorage.setItem(STORAGE_KEY_LIVE_GROUPS, JSON.stringify(groups));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Adds a camera identifier to a group.
 */
export function addCameraToGroup(groupId: string, cameraId: string): { success: boolean; error?: string } {
  const groups = getLiveGroups();
  const group = groups.find((g) => g.id === groupId);
  if (!group) return { success: false, error: 'Group not found' };

  if (group.cameraIds.includes(cameraId)) {
    return { success: true }; // already present
  }

  if (group.cameraIds.length >= MAX_CAMERAS_PER_GROUP) {
    return { success: false, error: `Group already has maximum ${MAX_CAMERAS_PER_GROUP} cameras` };
  }

  group.cameraIds.push(cameraId);
  group.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY_LIVE_GROUPS, JSON.stringify(groups));
  return { success: true };
}

/**
 * Removes a camera identifier from a group.
 */
export function removeCameraFromGroup(groupId: string, cameraId: string): { success: boolean; error?: string } {
  const groups = getLiveGroups();
  const group = groups.find((g) => g.id === groupId);
  if (!group) return { success: false, error: 'Group not found' };

  group.cameraIds = group.cameraIds.filter((id) => id.toLowerCase() !== cameraId.toLowerCase());
  group.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY_LIVE_GROUPS, JSON.stringify(groups));
  return { success: true };
}

/**
 * Gets the active group ID or falls back to 'grp-all'.
 */
export function getActiveGroupId(): string {
  if (typeof window === 'undefined') return 'grp-all';
  return localStorage.getItem(STORAGE_KEY_ACTIVE_GROUP) || 'grp-all';
}

/**
 * Sets the active group ID.
 */
export function setActiveGroupId(groupId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_ACTIVE_GROUP, groupId);
}

/**
 * Gets the last used mode ('single' or 'monitor').
 */
export function getLastLiveMode(): 'single' | 'monitor' {
  if (typeof window === 'undefined') return 'single';
  const mode = localStorage.getItem(STORAGE_KEY_LAST_MODE);
  return mode === 'monitor' ? 'monitor' : 'single';
}

/**
 * Sets the last used mode.
 */
export function setLastLiveMode(mode: 'single' | 'monitor'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_LAST_MODE, mode);
}
