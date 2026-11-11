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

