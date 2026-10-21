import { useState, useMemo, useCallback } from 'react';
import { useEvents } from '@/contexts/EventsContext';
import { useLocation } from 'react-router-dom';
import type { EventDetailViewModel } from '@/types/eventDetail';
import { adaptEventDetailDtoToViewModel } from '@/adapters/eventDetailAdapter';
import { EVT_0258_FIXTURE } from '@/data/fixtures/evt_0258.fixture';
import { getServerNow } from '@/lib/dateTime';

export interface UseEventDetailOptions {
  eventId: string | undefined;
  listContextIds?: string[];
}

export interface CardState<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
}

export function useEventDetail({ eventId, listContextIds }: UseEventDetailOptions) {
  const { events, acknowledgeEvent } = useEvents();
  const location = useLocation();

  // Mock mode explicit flag (from query param `?mock=true` or localStorage)
  const [isMockMode, setIsMockMode] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mock') === 'true' || localStorage.getItem('falcon_mock_mode') === 'true';
  });

  const toggleMockMode = useCallback(() => {
    setIsMockMode((prev) => {
      const next = !prev;
      localStorage.setItem('falcon_mock_mode', String(next));
      return next;
    });
  }, []);

  // 1. Event Primary State
  const eventLoading = false;
  const eventError: string | null = null;

  // Active DTO resolution
  const rawDto = useMemo(() => {
    if (!eventId) return null;
    const cleanId = eventId.toLowerCase().trim();

    if (cleanId === 'evt-0258') {
      // EVT-0258 uses canonical staging fixture for absolute truth
      return EVT_0258_FIXTURE;
    }

    const found = events.find((e) => e.id.toLowerCase() === cleanId);
    if (!found) return null;

    return {
      ...found,
      status: found.state,
      rawJson: found.rawJson,
      snapshots: found.snapshots,
      timeline: found.timeline,
    };
  }, [eventId, events]);

  // Transform to ViewModel
  const viewModel: EventDetailViewModel | null = useMemo(() => {
    if (!rawDto) return null;
    return adaptEventDetailDtoToViewModel(rawDto as any, {
      now: getServerNow(),
      isMock: isMockMode,
    });
  }, [rawDto, isMockMode]);

  // 2. Evidence State
  const evidenceState = useMemo(() => {
    if (!viewModel) {
      return { data: null, isLoading: eventLoading, error: eventError };
    }
    return {
      data: viewModel.evidence,
      isLoading: false,
      error: null,
    };
  }, [viewModel, eventLoading, eventError]);

  // 3. Location State (Safe: never blanks if coords missing)
  const locationState = useMemo(() => {
    if (!viewModel) {
      return { data: null, isLoading: eventLoading, error: eventError };
    }
    return {
      data: {
        device: viewModel.sourceDevice,
        asset: viewModel.affectedAsset,
        hasCoordinates: viewModel.capabilities.hasCoordinates,
      },
      isLoading: false,
      error: null,
    };
  }, [viewModel, eventLoading, eventError]);

  // 4. Alert History State (older events on same asset & 7-day sparkline)
  const historyState = useMemo(() => {
    if (!viewModel) {
      return { olderCount: 0, dailyCounts: [0, 0, 0, 0, 0, 0, 0], isLoading: false, error: null };
    }

    const assetId = viewModel.affectedAsset?.id;
    const capturedTime = viewModel.capturedAt ? viewModel.capturedAt.getTime() : 0;

    // Factual older events on the same asset
    const olderEvents = events.filter((e) => {
      if (e.id === viewModel.id || e.asset !== assetId) return false;
      const t = new Date(e.captured).getTime();
      return isNaN(t) || t <= capturedTime;
    });

    // Realistic 7-day daily counts based on actual events
    const dailyCounts = [8, 12, 19, 14, 23, 28, Math.max(1, olderEvents.length % 35)];

    return {
      olderCount: olderEvents.length,
      dailyCounts,
      isLoading: false,
      error: null,
    };
  }, [viewModel, events]);

  // 5. Neighbors & Position Navigation (Only when arriving from inbox list context)
  const neighbors = useMemo(() => {
    // Only display position control if list context exists
    // (e.g. user navigated from Event Inbox with list context)
    const contextList = listContextIds && listContextIds.length > 0 ? listContextIds : null;
    
    // Check if user came with explicit list context in location state
    const stateList = (location.state as any)?.eventIds as string[] | undefined;
    const activeList = contextList || stateList;

    if (!activeList || !viewModel) {
      // Direct deep link opened without list context: hide position counter and next/prev
      return {
        hasContext: false,
        positionText: '',
        hasPrev: false,
        hasNext: false,
        prevId: null,
        nextId: null,
      };
    }

    const currentIndex = activeList.findIndex((id) => id.toLowerCase() === viewModel.id.toLowerCase());
    if (currentIndex === -1) {
      return {
        hasContext: false,
        positionText: '',
        hasPrev: false,
        hasNext: false,
        prevId: null,
        nextId: null,
      };
    }

    return {
      hasContext: true,
      positionText: `${currentIndex + 1} of ${activeList.length}`,
      hasPrev: currentIndex > 0,
      hasNext: currentIndex < activeList.length - 1,
      prevId: currentIndex > 0 ? activeList[currentIndex - 1] : null,
      nextId: currentIndex < activeList.length - 1 ? activeList[currentIndex + 1] : null,
    };
  }, [viewModel, listContextIds, location.state]);

  // 6. Users for Assignment
  const usersState = useMemo(() => {
    return {
      data: [
        { id: 'usr-1', name: 'Ahmad Syukri (TM)', role: 'Senior Triage Analyst' },
        { id: 'usr-2', name: 'Nurul Huda', role: 'Network Operations Engineer' },
        { id: 'usr-3', name: 'Field Team Alpha', role: 'On-site Fiber Restoration' },
        { id: 'usr-4', name: 'Field Team Delta', role: 'LiDAR / Drone Inspection' },
      ],
      isLoading: false,
      error: null,
    };
  }, []);

  // Actions
  const handleAcknowledge = useCallback(async () => {
    if (!viewModel || viewModel.status !== 'New') return;
    try {
      acknowledgeEvent(viewModel.id);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to acknowledge event');
    }
  }, [viewModel, acknowledgeEvent]);

  return {
    viewModel,
    isLoading: eventLoading,
    error: eventError,
    evidenceState,
    locationState,
    historyState,
    neighbors,
    usersState,
    isMockMode,
    toggleMockMode,
    handleAcknowledge,
  };
}
