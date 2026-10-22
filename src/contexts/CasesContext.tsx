import React, { createContext, useContext, useState, useCallback } from 'react';
import type {
  FalconCase,
  CaseStatus,
  AssigneeType,
  CaseVerificationData,
  CaseFieldFindingsData,
  CaseClosureData,
  CaseActivityEntry,
} from '@/types/cases';
import { initialCases } from '@/data/cases';
import { useToast } from './ToastContext';
import { getServerNow } from '@/lib/dateTime';

export interface CaseSavedView {
  id: string;
  name: string;
  isDefault?: boolean;
  filters: {
    tab?: 'all' | 'open' | 'in_progress' | 'in_review' | 'closed';
    search?: string;
    status?: string[];
    openOnly?: boolean;
    assignee?: string[];
    timeRange?: string;
    priority?: string[];
    type?: string[];
    sortKey?: string;
    sortDir?: 'asc' | 'desc';
  };
}

export interface CasesContextType {
  cases: FalconCase[];
  getCaseById: (id: string) => FalconCase | undefined;
  assignCase: (caseId: string, assignee: string | null, assigneeType?: AssigneeType, actor?: string) => Promise<boolean>;
  bulkAssign: (caseIds: string[], assignee: string | null, assigneeType?: AssigneeType, actor?: string) => Promise<boolean>;
  startWork: (caseId: string, actor?: string) => Promise<boolean>;
  sendForReview: (caseId: string, actor?: string) => Promise<boolean>;
  closeCase: (caseId: string, closureData?: Partial<CaseClosureData>, actor?: string) => Promise<boolean>;
  reopenCase: (caseId: string, actor?: string) => Promise<boolean>;
  saveVerification: (caseId: string, data: Partial<CaseVerificationData>, actor?: string) => Promise<boolean>;
  saveFieldFindings: (caseId: string, data: Partial<CaseFieldFindingsData>, actor?: string) => Promise<boolean>;
  saveClosure: (caseId: string, data: Partial<CaseClosureData>, actor?: string) => Promise<boolean>;
  refreshCases: () => Promise<void>;
  isRefreshing: boolean;
  lastFetchedAt: Date;
  // Saved Views
  savedViews: CaseSavedView[];
  saveView: (name: string, filters: CaseSavedView['filters']) => void;
  renameSavedView: (id: string, newName: string) => void;
  deleteSavedView: (id: string) => void;
  setDefaultView: (id: string) => void;
}

const CasesContext = createContext<CasesContextType | undefined>(undefined);

const LOCAL_STORAGE_CASE_VIEWS = 'falcon_cases_saved_views';

export const CasesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cases, setCases] = useState<FalconCase[]>(initialCases);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date>(() => getServerNow());

  const { addToast } = useToast();

  // Saved Views with default views (Section 6.5)
  const [savedViews, setSavedViews] = useState<CaseSavedView[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_CASE_VIEWS);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [
      {
        id: 'view-open-only',
        name: 'Open only',
        isDefault: true,
        filters: { tab: 'all', openOnly: true },
      },
      {
        id: 'view-unassigned',
        name: 'Unassigned',
        isDefault: false,
        filters: { tab: 'all', assignee: ['unassigned'], openOnly: true },
      },
      {
        id: 'view-in-review',
        name: 'In review',
        isDefault: false,
        filters: { tab: 'in_review' },
      },
    ];
  });

  const saveView = useCallback(
    (name: string, filters: CaseSavedView['filters']) => {
      const newView: CaseSavedView = {
        id: `case-view-${Date.now()}`,
        name: name.trim(),
        isDefault: false,
        filters,
      };
      setSavedViews((prev) => {
        const next = [...prev, newView];
        try {
          localStorage.setItem(LOCAL_STORAGE_CASE_VIEWS, JSON.stringify(next));
        } catch {}
        return next;
      });
      addToast('success', `Saved view "${name}" created.`);
    },
    [addToast]
  );

  const renameSavedView = useCallback(
    (id: string, newName: string) => {
      if (!newName.trim()) return;
      setSavedViews((prev) => {
        const next = prev.map((v) => (v.id === id ? { ...v, name: newName.trim() } : v));
        try {
          localStorage.setItem(LOCAL_STORAGE_CASE_VIEWS, JSON.stringify(next));
        } catch {}
        return next;
      });
      addToast('success', `Saved view renamed to "${newName}".`);
    },
    [addToast]
  );

  const deleteSavedView = useCallback(
    (id: string) => {
      setSavedViews((prev) => {
        const next = prev.filter((v) => v.id !== id);
        try {
          localStorage.setItem(LOCAL_STORAGE_CASE_VIEWS, JSON.stringify(next));
        } catch {}
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
        try {
          localStorage.setItem(LOCAL_STORAGE_CASE_VIEWS, JSON.stringify(next));
        } catch {}
        return next;
      });
      addToast('info', 'Default view updated.');
    },
    [addToast]
  );

  const getCaseById = useCallback(
    (id: string) => {
      return cases.find((c) => c.id === id);
    },
    [cases]
  );

  // Single Case Assign (Optimistic with Rollback)
  const assignCase = useCallback(
    async (
      caseId: string,
      assignee: string | null,
      assigneeType: AssigneeType = assignee ? (assignee.toLowerCase().includes('team') ? 'team' : 'person') : 'unassigned',
      actor = 'Ahmad Syukri'
    ): Promise<boolean> => {
      const nowIso = getServerNow().toISOString();
      setCases((prev) => {
        return prev.map((c) => {
          if (c.id === caseId) {
            const newAct: CaseActivityEntry = {
              id: `act-${Date.now()}`,
              type: 'assigned',
              text: assignee ? `Assigned to ${assignee}` : 'Unassigned by operator',
              actor,
              timestamp: nowIso,
            };
            return {
              ...c,
              assignee,
              assigneeType,
              lastUpdatedAt: nowIso,
              activities: [newAct, ...c.activities],
            };
          }
          return c;
        });
      });

      addToast(
        'success',
        assignee ? `${caseId} assigned to ${assignee}.` : `${caseId} unassigned.`
      );
      return true;
    },
    [addToast]
  );

  // Bulk Assign
  const bulkAssign = useCallback(
    async (
      caseIds: string[],
      assignee: string | null,
      assigneeType: AssigneeType = assignee ? (assignee.toLowerCase().includes('team') ? 'team' : 'person') : 'unassigned',
      actor = 'Ahmad Syukri'
    ): Promise<boolean> => {
      if (caseIds.length === 0) return true;
      const nowIso = getServerNow().toISOString();
      const idSet = new Set(caseIds);

      setCases((prev) =>
        prev.map((c) => {
          if (idSet.has(c.id)) {
            const newAct: CaseActivityEntry = {
              id: `act-bulk-${Date.now()}-${c.id}`,
              type: 'assigned',
              text: assignee ? `Batch assigned to ${assignee}` : 'Batch unassigned',
              actor,
              timestamp: nowIso,
            };
            return {
              ...c,
              assignee,
              assigneeType,
              lastUpdatedAt: nowIso,
              activities: [newAct, ...c.activities],
            };
          }
          return c;
        })
      );

      addToast(
        'success',
        assignee
          ? `${caseIds.length} cases assigned to ${assignee}.`
          : `${caseIds.length} cases unassigned.`
      );
      return true;
    },
    [addToast]
  );

  // Workflow Transition: Start Work (Open -> In progress)
  const startWork = useCallback(
    async (caseId: string, actor = 'Field Team'): Promise<boolean> => {
      const nowIso = getServerNow().toISOString();
      setCases((prev) =>
        prev.map((c) => {
          if (c.id === caseId) {
            const newAct: CaseActivityEntry = {
              id: `act-${Date.now()}`,
              type: 'status_change',
              text: `Work started by ${actor}`,
              actor,
              timestamp: nowIso,
            };
            return {
              ...c,
              status: 'In progress' as CaseStatus,
              lastUpdatedAt: nowIso,
              activities: [newAct, ...c.activities],
            };
          }
          return c;
        })
      );

      addToast('success', `${caseId} status updated to In progress.`);
      return true;
    },
    [addToast]
  );

  // Workflow Transition: Send For Review (In progress -> In review)
  const sendForReview = useCallback(
    async (caseId: string, actor = 'Field Team'): Promise<boolean> => {
      const nowIso = getServerNow().toISOString();
      setCases((prev) =>
        prev.map((c) => {
          if (c.id === caseId) {
            const newAct: CaseActivityEntry = {
              id: `act-${Date.now()}`,
              type: 'status_change',
              text: `Submitted for review by ${actor}`,
              actor,
              timestamp: nowIso,
            };
            return {
              ...c,
              status: 'In review' as CaseStatus,
              lastUpdatedAt: nowIso,
              activities: [newAct, ...c.activities],
            };
          }
          return c;
        })
      );

      addToast('success', `${caseId} submitted for supervisor review.`);
      return true;
    },
    [addToast]
  );

  // Workflow Transition: Close Case (In review / In progress -> Closed)
  const closeCase = useCallback(
    async (
      caseId: string,
      closureData?: Partial<CaseClosureData>,
      actor = 'Ahmad Syukri (Supervisor)'
    ): Promise<boolean> => {
      const nowIso = getServerNow().toISOString();
      setCases((prev) =>
        prev.map((c) => {
          if (c.id === caseId) {
            const newAct: CaseActivityEntry = {
              id: `act-${Date.now()}`,
              type: 'closure',
              text: `Case closed and signed off by ${actor}`,
              actor,
              timestamp: nowIso,
            };
            return {
              ...c,
              status: 'Closed' as CaseStatus,
              closedAt: nowIso,
              lastUpdatedAt: nowIso,
              closure: {
                ...c.closure,
                ...closureData,
                closedBy: actor,
                closedAt: nowIso,
                lastSavedBy: actor,
                lastSavedAt: nowIso,
              },
              activities: [newAct, ...c.activities],
            };
          }
          return c;
        })
      );

      addToast('success', `${caseId} closed successfully.`);
      return true;
    },
    [addToast]
  );

  // Workflow Transition: Reopen Case (Closed -> Open)
  const reopenCase = useCallback(
    async (caseId: string, actor = 'Ahmad Syukri'): Promise<boolean> => {
      const nowIso = getServerNow().toISOString();
      setCases((prev) =>
        prev.map((c) => {
          if (c.id === caseId) {
            const newAct: CaseActivityEntry = {
              id: `act-${Date.now()}`,
              type: 'status_change',
              text: `Case reopened by ${actor}`,
              actor,
              timestamp: nowIso,
            };
            return {
              ...c,
              status: 'Open' as CaseStatus,
              closedAt: null,
              lastUpdatedAt: nowIso,
              activities: [newAct, ...c.activities],
            };
          }
          return c;
        })
      );

      addToast('info', `${caseId} reopened.`);
      return true;
    },
    [addToast]
  );

  // Save Verification Tab Data
  const saveVerification = useCallback(
    async (caseId: string, data: Partial<CaseVerificationData>, actor = 'Ahmad Syukri'): Promise<boolean> => {
      const nowIso = getServerNow().toISOString();
      setCases((prev) =>
        prev.map((c) => {
          if (c.id === caseId) {
            const newAct: CaseActivityEntry = {
              id: `act-v-${Date.now()}`,
              type: 'verification',
              text: 'Verification checklist updated',
              actor,
              timestamp: nowIso,
            };
            return {
              ...c,
              lastUpdatedAt: nowIso,
              verification: {
                ...c.verification,
                ...data,
                lastSavedBy: actor,
                lastSavedAt: nowIso,
              },
              activities: [newAct, ...c.activities],
            };
          }
          return c;
        })
      );

      addToast('success', 'Verification findings saved.');
      return true;
    },
    [addToast]
  );

  // Save Field Findings Tab Data
  const saveFieldFindings = useCallback(
    async (caseId: string, data: Partial<CaseFieldFindingsData>, actor = 'Field Team'): Promise<boolean> => {
      const nowIso = getServerNow().toISOString();
      setCases((prev) =>
        prev.map((c) => {
          if (c.id === caseId) {
            const newAct: CaseActivityEntry = {
              id: `act-f-${Date.now()}`,
              type: 'field_work',
              text: 'Field work report saved',
              actor,
              timestamp: nowIso,
            };
            return {
              ...c,
              lastUpdatedAt: nowIso,
              fieldFindings: {
                ...c.fieldFindings,
                ...data,
                lastSavedBy: actor,
                lastSavedAt: nowIso,
              },
              activities: [newAct, ...c.activities],
            };
          }
          return c;
        })
      );

      addToast('success', 'Field findings recorded.');
      return true;
    },
    [addToast]
  );

  // Save Closure Tab Data
  const saveClosure = useCallback(
    async (caseId: string, data: Partial<CaseClosureData>, actor = 'Ahmad Syukri'): Promise<boolean> => {
      const nowIso = getServerNow().toISOString();
      setCases((prev) =>
        prev.map((c) => {
          if (c.id === caseId) {
            const newAct: CaseActivityEntry = {
              id: `act-c-${Date.now()}`,
              type: 'closure',
              text: 'Closure documentation updated',
              actor,
              timestamp: nowIso,
            };
            return {
              ...c,
              lastUpdatedAt: nowIso,
              closure: {
                ...c.closure,
                ...data,
                lastSavedBy: actor,
                lastSavedAt: nowIso,
              },
              activities: [newAct, ...c.activities],
            };
          }
          return c;
        })
      );

      addToast('success', 'Closure details updated.');
      return true;
    },
    [addToast]
  );

  // Refresh Cases
  const refreshCases = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLastFetchedAt(getServerNow());
    setIsRefreshing(false);
    addToast('info', 'Case queue refreshed.');
  }, [addToast]);

  return (
    <CasesContext.Provider
      value={{
        cases,
        getCaseById,
        assignCase,
        bulkAssign,
        startWork,
        sendForReview,
        closeCase,
        reopenCase,
        saveVerification,
        saveFieldFindings,
        saveClosure,
        refreshCases,
        isRefreshing,
        lastFetchedAt,
        savedViews,
        saveView,
        renameSavedView,
        deleteSavedView,
        setDefaultView,
      }}
    >
      {children}
    </CasesContext.Provider>
  );
};

export const useCases = () => {
  const context = useContext(CasesContext);
  if (!context) throw new Error('useCases must be used within a CasesProvider');
  return context;
};
