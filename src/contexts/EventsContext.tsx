import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { events as initialEventsData, type FalconEvent, type EventTimelineEntry } from '@/data/events';
import { useToast } from './ToastContext';
import { useOverview } from './OverviewContext';

export interface SavedView {
  id: string;
  name: string;
  filters: {
    search?: string;
    priority?: string;
    status?: string;
    caseFilter?: string;
    timeRange?: string;
    device?: string;
    asset?: string;
    type?: string;
    source?: string;
    density?: 'comfortable' | 'compact';
    viewMode?: 'table' | 'grouped' | 'gallery';
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
  deleteSavedView: (id: string) => void;
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
      { id: 'view-critical', name: 'Critical Unacknowledged', filters: { priority: 'Critical', status: 'New' } },
      { id: 'view-monkeys', name: 'Monkey Detections', filters: { type: 'Monkey near cable' } },
      { id: 'view-no-case', name: 'High Priority without Case', filters: { priority: 'High', caseFilter: 'without_case' } },
    ];
  });

  const saveView = useCallback((name: string, filters: SavedView['filters']) => {
    const newView: SavedView = { id: `view-${Date.now()}`, name, filters };
    setSavedViews((prev) => {
      const next = [...prev, newView];
      try {
        localStorage.setItem(LOCAL_STORAGE_SAVED_VIEWS, JSON.stringify(next));
      } catch {}
      return next;
    });
    addToast('success', `Saved view "${name}" created.`);
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

  // Dismiss Event
  const dismissEvent = useCallback((id: string, reason = 'False positive detection') => {
    setEvents((prev) => {
      pushUndo(`Dismissed ${id}`, prev);
      return prev.map((e) => {
        if (e.id === id) {
          const newEntry: EventTimelineEntry = {
            id: `t-dsm-${Date.now()}`,
            icon: 'dismissed',
            text: `Dismissed: ${reason}`,
            actor: 'Ahmad Syukri',
            time: 'Just now',
          };
          return {
            ...e,
            state: 'Dismissed',
            status: 'Dismissed',
            timeline: [newEntry, ...(e.timeline || [])],
          };
        }
        return e;
      });
    });
    addToast('info', `${id} dismissed.`);
  }, [addToast, pushUndo]);

  // Bulk Dismiss
  const bulkDismiss = useCallback((ids: string[], reason = 'Batch dismissed as false positive') => {
    if (ids.length === 0) return;
    setEvents((prev) => {
      pushUndo(`Dismissed ${ids.length} events`, prev);
      const set = new Set(ids);
      return prev.map((e) => {
        if (set.has(e.id)) {
          const newEntry: EventTimelineEntry = {
            id: `t-dsm-b-${Date.now()}-${e.id}`,
            icon: 'dismissed',
            text: `Dismissed: ${reason}`,
            actor: 'Ahmad Syukri',
            time: 'Just now',
          };
          return {
            ...e,
            state: 'Dismissed',
            status: 'Dismissed',
            timeline: [newEntry, ...(e.timeline || [])],
          };
        }
        return e;
      });
    });
    addToast('info', `${ids.length} events dismissed.`);
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
        deleteSavedView,
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
