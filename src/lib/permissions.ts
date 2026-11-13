import type { BackendCapabilities } from '../types/assets.ts';

export type UserRole = 'Admin' | 'System' | 'Operator' | 'Field';

export interface PolePermissions {
  role: UserRole;
  canRegister: boolean;
  registerDisabledReason?: string;
  canEdit: boolean;
  editDisabledReason?: string;
  canRelocate: boolean;
  relocateDisabledReason?: string;
  canDelete: boolean;
  deleteDisabledReason?: string;
  canBulkDelete: boolean;
  bulkDeleteDisabledReason?: string;
  canRestore: boolean;
  restoreDisabledReason?: string;
  canLinkDevice: boolean;
  linkDeviceDisabledReason?: string;
}

export interface DevicePermissions {
  role: UserRole;
  canRegisterDevice: boolean;
  registerDisabledReason?: string;
  canEditDevice: boolean;
  editDisabledReason?: string;
  canManageInstallation: boolean;
  manageInstallationDisabledReason?: string;
  canConfigureDevice: boolean;
  configureDisabledReason?: string;
  canRollbackConfig: boolean;
  rollbackDisabledReason?: string;
  canTriggerVendorSync: boolean;
  vendorSyncDisabledReason?: string;
  canResolveVendorConflict: boolean;
  resolveConflictDisabledReason?: string;
  canRunConnectionCheck: boolean;
  connectionCheckDisabledReason?: string;
  canDeleteDevice: boolean;
  deleteDisabledReason?: string;
  canBulkDeviceActions: boolean;
  bulkActionsDisabledReason?: string;
}

export const DEFAULT_BACKEND_CAPABILITIES: BackendCapabilities = {
  bulkDelete: false,
  restore: false,
  linkDevice: false,
  testFlag: false,
  deleteReasonPersisted: false,
  relocateReasonPersisted: false,
  serverImpactCheck: false,
  serverUniquenessCheck: false,
  siteBoundary: false,
  vendorSyncTrigger: false,
  vendorRemap: true,
  connectionCheck: true,
  deviceConfigSend: true,
  configVersionCompare: true,
  deviceDelete: false,
  deviceBulkActions: false,
};

export const PREVIEW_BACKEND_CAPABILITIES: BackendCapabilities = {
  bulkDelete: false,
  restore: true,
  linkDevice: false,
  testFlag: false,
  deleteReasonPersisted: true,
  relocateReasonPersisted: true,
  serverImpactCheck: false,
  serverUniquenessCheck: false,
  siteBoundary: false,
  vendorSyncTrigger: true,
  vendorRemap: true,
  connectionCheck: true,
  deviceConfigSend: true,
  configVersionCompare: true,
  deviceDelete: true,
  deviceBulkActions: true,
};

/**
 * Resolves user role from account label stored in AppContext.
 */
export function getRoleFromAccountLabel(accountLabel: string | null | undefined): UserRole {
  const norm = (accountLabel || '').toLowerCase();
  if (norm.includes('system')) return 'System';
  if (norm.includes('operator')) return 'Operator';
  if (norm.includes('field')) return 'Field';
  return 'Admin';
}

/**
 * Computes RBAC + backend capability permissions for Poles actions.
 */
export function getPolePermissions(
  role: UserRole,
  capabilities: BackendCapabilities = DEFAULT_BACKEND_CAPABILITIES
): PolePermissions {
  const isAdminOrSystem = role === 'Admin' || role === 'System';
  const canMutate = isAdminOrSystem || role === 'Operator';

  return {
    role,
    canRegister: canMutate,
    registerDisabledReason: canMutate
      ? undefined
      : 'Read-only role: Admin, System, or Operator required to register poles.',
    canEdit: canMutate,
    editDisabledReason: canMutate
      ? undefined
      : 'Read-only role: Admin, System, or Operator required to edit poles.',
    canRelocate: canMutate,
    relocateDisabledReason: canMutate
      ? undefined
      : 'Read-only role: Admin, System, or Operator required to relocate poles.',
    canDelete: isAdminOrSystem,
    deleteDisabledReason: isAdminOrSystem
      ? undefined
      : 'Permission required: only Admin or System roles can delete poles.',
    canBulkDelete: capabilities.bulkDelete && isAdminOrSystem,
    bulkDeleteDisabledReason: !capabilities.bulkDelete
      ? 'Not available yet — bulk delete endpoint required'
      : !isAdminOrSystem
      ? 'Only Admin or System roles can bulk delete poles.'
      : undefined,
    canRestore: capabilities.restore && isAdminOrSystem,
    restoreDisabledReason: !capabilities.restore
      ? 'Not available yet — restore endpoint required'
      : !isAdminOrSystem
      ? 'Only Admin or System roles can restore poles.'
      : undefined,
    canLinkDevice: capabilities.linkDevice && canMutate,
    linkDeviceDisabledReason: !capabilities.linkDevice
      ? 'Not available yet — link device endpoint required'
      : !canMutate
      ? 'Permission required to link devices.'
      : undefined,
  };
}

/**
 * Computes RBAC + backend capability permissions for Devices & Vendor discovery actions.
 */
export function getDevicePermissions(
  role: UserRole,
  capabilities: BackendCapabilities = DEFAULT_BACKEND_CAPABILITIES
): DevicePermissions {
  const isAdminOrSystem = role === 'Admin' || role === 'System';
  const canOperate = isAdminOrSystem || role === 'Operator';

  const configEnabled = capabilities.deviceConfigSend !== false;
  const checkEnabled = capabilities.connectionCheck !== false;
  const remapEnabled = capabilities.vendorRemap !== false;
  const vendorSyncEnabled = Boolean(capabilities.vendorSyncTrigger);
  const deleteEnabled = Boolean(capabilities.deviceDelete);
  const bulkEnabled = Boolean(capabilities.deviceBulkActions);

  return {
    role,
    canRegisterDevice: canOperate,
    registerDisabledReason: canOperate
      ? undefined
      : 'Read-only role: Admin, System, or Operator required to register devices.',
    canEditDevice: canOperate,
    editDisabledReason: canOperate
      ? undefined
      : 'Read-only role: Admin, System, or Operator required to edit devices.',
    canManageInstallation: canOperate,
    manageInstallationDisabledReason: canOperate
      ? undefined
      : 'Read-only role: Admin, System, or Operator required to manage installation.',
    canConfigureDevice: configEnabled && canOperate,
    configureDisabledReason: !configEnabled
      ? 'Not available yet — device configuration endpoint required'
      : !canOperate
      ? 'Permission required to send device configuration.'
      : undefined,
    canRollbackConfig: configEnabled && isAdminOrSystem,
    rollbackDisabledReason: !configEnabled
      ? 'Not available yet — rollback configuration endpoint required'
      : !isAdminOrSystem
      ? 'Only Admin or System roles can roll back configuration versions.'
      : undefined,
    canTriggerVendorSync: vendorSyncEnabled && canOperate,
    vendorSyncDisabledReason: !vendorSyncEnabled
      ? 'Not available yet — Edge vendor sync job endpoint required (Reload list reads latest snapshot)'
      : !canOperate
      ? 'Permission required to trigger Edge vendor sync.'
      : undefined,
    canResolveVendorConflict: remapEnabled && isAdminOrSystem,
    resolveConflictDisabledReason: !remapEnabled
      ? 'Not available yet — vendor remapping endpoint required'
      : !isAdminOrSystem
      ? 'Only Admin or System roles can resolve vendor mapping conflicts.'
      : undefined,
    canRunConnectionCheck: checkEnabled && canOperate,
    connectionCheckDisabledReason: !checkEnabled
      ? 'Not available yet — connection check endpoint required'
      : !canOperate
      ? 'Permission required to run connection check.'
      : undefined,
    canDeleteDevice: deleteEnabled && isAdminOrSystem,
    deleteDisabledReason: !deleteEnabled
      ? 'Not available yet — device delete endpoint required (set lifecycle to Retired instead)'
      : !isAdminOrSystem
      ? 'Only Admin or System roles can delete devices.'
      : undefined,
    canBulkDeviceActions: bulkEnabled && isAdminOrSystem,
    bulkActionsDisabledReason: !bulkEnabled
      ? 'Not available yet — bulk device action endpoint required'
      : !isAdminOrSystem
      ? 'Only Admin or System roles can perform bulk device actions.'
      : undefined,
  };
}

