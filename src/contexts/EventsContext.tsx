import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { events as initialEventsData, type FalconEvent, type EventTimelineEntry } from '@/data/events';
import { useToast } from './ToastContext';
import { useOverview } from './OverviewContext';

export interface SavedView {
  id: string;
  name: string;
  isDefault?: boolean;
  filters: {
    tab?: 'all' | 'new' | 'acknowledged' | 'in_case' | 'resolved';
    search?: string;
    priority?: string;
    status?: string;
    caseFilter?: string;
    timeRange?: string;
    device?: string;
    asset?: string;
    type?: string;
    source?: string;
    viewMode?: 'table' | 'gallery';
    sortKey?: string;
    sortDir?: 'asc' | 'desc';
  };
}

interface UndoSnapshot {
  events: FalconEvent[];
  description: string;
}

export interface EventsContextType {
  events: FalconEvent[];
  activeEventId: string | null;
  setActiveEventId: (id: string | null) => void;
  activeEvent: FalconEvent | null;
  acknowledgeEvent: (id: string) => void;
  bulkAcknowledge: (ids: string[]) => void;
  createCaseForEvent: (id: string, details?: { title?: string; priority?: string; owner?: string; notes?: string }) => string;
  createCaseForGroup: (type: string, device: string | null, asset: string) => string;
  dismissEvent: (id: string, reason?: string) => void;
  bulkDismiss: (ids: string[], reason?: string) => void;
  assignEvent: (id: string, assignee: string) => void;
  bulkAssign: (ids: string[], assignee: string) => void;
  addTimelineNote: (id: string, note: string, author?: string) => void;
  // Saved Views
  savedViews: SavedView[];
  saveView: (name: string, filters: SavedView['filters']) => void;
  renameSavedView: (id: string, newName: string) => void;
  deleteSavedView: (id: string) => void;
  setDefaultView: (id: string) => void;
  // Undo
  canUndo: boolean;
  undoLastAction: () => void;
  // Live Simulation
  incomingNewEventsCount: number;
  mergeNewEvents: () => void;
  refreshEvents: () => void;
  isRefreshing: boolean;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

const LOCAL_STORAGE_SAVED_VIEWS = 'falcon_events_saved_views';

export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<FalconEvent[]>(initialEventsData);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<UndoSnapshot[]>([]);
  const [incomingNewEventsCount, setIncomingNewEventsCount] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { addToast } = useToast();
  const overview = useOverview();

  // Load saved views from localStorage
  const [savedViews, setSavedViews] = useState<SavedView[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_SAVED_VIEWS);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [
      { id: 'view-critical', name: 'New and critical', isDefault: true, filters: { tab: 'new', priority: 'Critical,High' } },
      { id: 'view-no-case', name: 'Without case', isDefault: false, filters: { tab: 'all', caseFilter: 'without_case' } },
      { id: 'view-today', name: 'Today', isDefault: false, filters: { tab: 'all', timeRange: 'today' } },
    ];
  });

  const saveView = useCallback((name: string, filters: SavedView['filters']) => {
    const newView: SavedView = { id: `view-${Date.now()}`, name, isDefault: false, filters };
    setSavedViews((prev) => {
      const next = [...prev, newView];
      try {
        localStorage.setItem(LOCAL_STORAGE_SAVED_VIEWS, JSON.stringify(next));
      } catch {}
      return next;
    });
    addToast('success', `Saved view "${name}" created.`);
  }, [addToast]);

  const renameSavedView = useCallback((id: string, newName: string) => {
    if (!newName.trim()) return;
    setSavedViews((prev) => {
      const next = prev.map((v) => (v.id === id ? { ...v, name: newName.trim() } : v));
      try {
        localStorage.setItem(LOCAL_STORAGE_SAVED_VIEWS, JSON.stringify(next));
      } catch {}
      return next;
    });
    addToast('success', `Saved view renamed to "${newName}".`);
  }, [addToast]);

  const deleteSavedView = useCallback((id: string) => {
    setSavedViews((prev) => {
      const next = prev.filter((v) => v.id !== id);
      try {
        localStorage.setItem(LOCAL_STORAGE_SAVED_VIEWS, JSON.stringify(next));
      } catch {}
      return next;
    });
    addToast('info', 'Saved view removed.');
  }, [addToast]);

  const setDefaultView = useCallback((id: string) => {
    setSavedViews((prev) => {
      const next = prev.map((v) => ({ ...v, isDefault: v.id === id }));
      try {
        localStorage.setItem(LOCAL_STORAGE_SAVED_VIEWS, JSON.stringify(next));
      } catch {}
      return next;
    });
    addToast('info', 'Default view updated.');
  }, [addToast]);

  const pushUndo = useCallback((description: string, prevEvents: FalconEvent[]) => {
    setUndoStack((prev) => [...prev.slice(-9), { events: prevEvents, description }]);
  }, []);

  const undoLastAction = useCallback(() => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setEvents(last.events);
    setUndoStack((prev) => prev.slice(0, -1));
    addToast('info', `Undid: ${last.description}`);
  }, [undoStack, addToast]);

  const activeEvent = useMemo(() => {
    if (!activeEventId) return null;
    return events.find((e) => e.id === activeEventId) || null;
  }, [events, activeEventId]);

  // Acknowledge single event
  const acknowledgeEvent = useCallback((id: string) => {
    setEvents((prev) => {
      pushUndo(`Acknowledge ${id}`, prev);
      return prev.map((e) => {
        if (e.id === id) {
          const newEntry: EventTimelineEntry = {
            id: `t-ack-${Date.now()}`,
            icon: 'acknowledged',
            text: 'Acknowledged by operator',
            actor: 'Ahmad Syukri',
            time: 'Just now',
          };
          return {
            ...e,
            state: 'Acknowledged',
            status: 'Acknowledged',
            overSla: false,
            timeline: [newEntry, ...(e.timeline || [])],
          };
        }
        return e;
      });
    });
    addToast('success', `${id} acknowledged.`);
  }, [addToast, pushUndo]);

  // Bulk Acknowledge
  const bulkAcknowledge = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setEvents((prev) => {
      pushUndo(`Acknowledge ${ids.length} events`, prev);
      const set = new Set(ids);
      return prev.map((e) => {
        if (set.has(e.id)) {
          const newEntry: EventTimelineEntry = {
            id: `t-ack-${Date.now()}-${e.id}`,
            icon: 'acknowledged',
            text: 'Acknowledged via batch triage',
            actor: 'Ahmad Syukri',
            time: 'Just now',
          };
          return {
            ...e,
            state: 'Acknowledged',
            status: 'Acknowledged',
            overSla: false,
            timeline: [newEntry, ...(e.timeline || [])],
          };
        }
        return e;
      });
    });
    addToast('success', `${ids.length} events acknowledged.`);
  }, [addToast, pushUndo]);

  // Create Case for Single Event
  const createCaseForEvent = useCallback((id: string, details?: { title?: string; priority?: string; owner?: string; notes?: string }) => {
    const caseId = `CAS-${Math.floor(1000 + Math.random() * 9000)}`;
    setEvents((prev) => {
      pushUndo(`Created case ${caseId} for ${id}`, prev);
      return prev.map((e) => {
        if (e.id === id) {
          const newEntry: EventTimelineEntry = {
            id: `t-case-${Date.now()}`,
            icon: 'case',
            text: `Field case ${caseId} created${details?.title ? `: ${details.title}` : ''}`,
            actor: details?.owner || 'Ahmad Syukri',
            time: 'Just now',
          };
          return {
            ...e,
            state: 'In case',
            status: 'In case',
            caseId,
            assignee: details?.owner || 'Field Team Alpha',
            timeline: [newEntry, ...(e.timeline || [])],
          };
        }
        return e;
      });
    });
    addToast('success', `Case ${caseId} created and linked to ${id}.`);
    return caseId;
  }, [addToast, pushUndo]);

  // Create Case from Group
  const createCaseForGroup = useCallback((type: string, device: string | null, asset: string) => {
    const caseId = `CAS-${Math.floor(1000 + Math.random() * 9000)}`;
    let count = 0;
    setEvents((prev) => {
      pushUndo(`Group case ${caseId} for ${type}`, prev);
      return prev.map((e) => {
        if (e.type === type && e.device === device && e.asset === asset) {
          count++;
          const newEntry: EventTimelineEntry = {
            id: `t-case-grp-${Date.now()}-${e.id}`,
            icon: 'case',
            text: `Group incident bundled into case ${caseId}`,
            actor: 'Ahmad Syukri',
            time: 'Just now',
          };
          return {
            ...e,
            state: 'In case',
            status: 'In case',
            caseId,
            assignee: 'Field Team Alpha',
            timeline: [newEntry, ...(e.timeline || [])],
          };
        }
        return e;
      });
    });
    addToast('success', `Created case ${caseId} bundling ${count} group events.`);
    return caseId;
  }, [addToast, pushUndo]);

  // Dismiss / Resolve Event
  const dismissEvent = useCallback((id: string, reason = 'False positive detection') => {
    setEvents((prev) => {
      pushUndo(`Resolved ${id}`, prev);
      return prev.map((e) => {
        if (e.id === id) {
          const newEntry: EventTimelineEntry = {
            id: `t-dsm-${Date.now()}`,
            icon: 'resolved',
            text: `Resolved: ${reason}`,
            actor: 'Ahmad Syukri',
            time: 'Just now',
          };
          return {
            ...e,
            state: 'Resolved',
            status: 'Resolved',
            timeline: [newEntry, ...(e.timeline || [])],
          };
        }
        return e;
      });
    });
    addToast('info', `${id} resolved.`);
  }, [addToast, pushUndo]);

  // Bulk Dismiss / Resolve
  const bulkDismiss = useCallback((ids: string[], reason = 'Batch resolved as false positive') => {
    if (ids.length === 0) return;
    setEvents((prev) => {
      pushUndo(`Resolved ${ids.length} events`, prev);
      const set = new Set(ids);
      return prev.map((e) => {
        if (set.has(e.id)) {
          const newEntry: EventTimelineEntry = {
            id: `t-dsm-b-${Date.now()}-${e.id}`,
            icon: 'resolved',
            text: `Resolved: ${reason}`,
            actor: 'Ahmad Syukri',
            time: 'Just now',
          };
          return {
            ...e,
            state: 'Resolved',
            status: 'Resolved',
            timeline: [newEntry, ...(e.timeline || [])],
          };
        }
        return e;
      });
    });
    addToast('info', `${ids.length} events resolved.`);
  }, [addToast, pushUndo]);

  // Assign Event
  const assignEvent = useCallback((id: string, assignee: string) => {
    setEvents((prev) => {
      pushUndo(`Assigned ${id} to ${assignee}`, prev);
      return prev.map((e) => {
        if (e.id === id) {
          const newEntry: EventTimelineEntry = {
            id: `t-asn-${Date.now()}`,
            icon: 'assigned',
            text: `Assigned to ${assignee}`,
            actor: 'Ahmad Syukri',
            time: 'Just now',
          };
          return {
            ...e,
            state: 'Acknowledged',
            status: 'Acknowledged',
            assignee,
            timeline: [newEntry, ...(e.timeline || [])],
          };
        }
        return e;
      });
    });
    addToast('success', `${id} assigned to ${assignee}.`);
  }, [addToast, pushUndo]);

  // Bulk Assign
  const bulkAssign = useCallback((ids: string[], assignee: string) => {
    if (ids.length === 0) return;
    setEvents((prev) => {
      pushUndo(`Assigned ${ids.length} events to ${assignee}`, prev);
      const set = new Set(ids);
      return prev.map((e) => {
        if (set.has(e.id)) {
          const newEntry: EventTimelineEntry = {
            id: `t-asn-b-${Date.now()}-${e.id}`,
            icon: 'assigned',
            text: `Assigned to ${assignee}`,
            actor: 'Ahmad Syukri',
            time: 'Just now',
          };
          return {
            ...e,
            state: 'Acknowledged',
            status: 'Acknowledged',
            assignee,
            timeline: [newEntry, ...(e.timeline || [])],
          };
        }
        return e;
      });
    });
    addToast('success', `${ids.length} events assigned to ${assignee}.`);
  }, [addToast, pushUndo]);

  // Add timeline note
  const addTimelineNote = useCallback((id: string, note: string, author = 'Ahmad Syukri') => {
    if (!note.trim()) return;
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const newEntry: EventTimelineEntry = {
            id: `t-note-${Date.now()}`,
            icon: 'note',
            text: note.trim(),
            actor: author,
            time: 'Just now',
          };
          return {
            ...e,
            timeline: [newEntry, ...(e.timeline || [])],
          };
        }
        return e;
      })
    );
    addToast('success', 'Note added to incident dossier.');
  }, [addToast]);

  // Merge simulated incoming new events
  const mergeNewEvents = useCallback(() => {
    setIncomingNewEventsCount(0);
    addToast('info', 'Incoming live events merged into inbox.');
  }, [addToast]);

  // Manual refresh with shimmer animation
  const refreshEvents = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      addToast('info', 'Event feed refreshed with latest telemetry.');
    }, 600);
  }, [addToast]);

  // Periodic incoming event simulation when live stream is active
  useEffect(() => {
    if (overview.liveState !== 'live') return;
    const interval = setInterval(() => {
      setIncomingNewEventsCount((c) => (c < 9 ? c + 1 : c));
    }, 45000); // simulate a new event every 45s if live
    return () => clearInterval(interval);
  }, [overview.liveState]);

  return (
    <EventsContext.Provider
      value={{
        events,
        activeEventId,
        setActiveEventId,
        activeEvent,
        acknowledgeEvent,
        bulkAcknowledge,
        createCaseForEvent,
        createCaseForGroup,
        dismissEvent,
        bulkDismiss,
        assignEvent,
        bulkAssign,
        addTimelineNote,
        savedViews,
        saveView,
        renameSavedView,
        deleteSavedView,
        setDefaultView,
        canUndo: undoStack.length > 0,
        undoLastAction,
        incomingNewEventsCount,
        mergeNewEvents,
        refreshEvents,
        isRefreshing,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) throw new Error('useEvents must be used within an EventsProvider');
  return context;
};
