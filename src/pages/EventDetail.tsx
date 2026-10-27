import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { EventDetailHeader } from '@/components/events/detail/EventDetailHeader';
import { EvidenceStudioCard } from '@/components/events/detail/EvidenceStudioCard';
import { LightboxModal } from '@/components/events/dialogs/LightboxModal';
import { CreateCaseDialog } from '@/components/events/dialogs/CreateCaseDialog';
import { DismissEventDialog } from '@/components/events/dialogs/DismissEventDialog';
import { AssignEventDialog } from '@/components/events/dialogs/AssignEventDialog';
import { ResolveEventDialog } from '@/components/events/dialogs/ResolveEventDialog';
import { VendorDataDialog } from '@/components/events/dialogs/VendorDataDialog';
import { KeyboardShortcutsDialog } from '@/components/events/dialogs/KeyboardShortcutsDialog';
import { useEvents } from '@/contexts/EventsContext';
import { useToast } from '@/contexts/ToastContext';
import { useEventDetail } from '@/hooks/useEventDetail';
import { Button } from '@/components/ui/button';
import { Check, Briefcase, ArrowLeft, SearchX, Loader2 } from 'lucide-react';
import { LocationCard } from '@/components/events/detail/LocationCard';
import { KeyFactsCard } from '@/components/events/detail/KeyFactsCard';
import { DetectionSpecificationCard } from '@/components/events/detail/DetectionSpecificationCard';
import { AlertHistoryCard } from '@/components/events/detail/AlertHistoryCard';

import { useUiMode } from '@/hooks/useUiMode';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { events, acknowledgeEvent } = useEvents();
  const { addToast } = useToast();
  const { isTablet, orientation } = useUiMode();
  const isPortrait = isTablet && orientation === 'portrait';

  // Load canonical ViewModel & neighbors via useEventDetail
  const {
    viewModel,
    neighbors,
    handleAcknowledge: hookAcknowledge,
  } = useEventDetail({
    eventId: id,
    listContextIds: (location.state as any)?.eventIds,
  });

  // Fallback to active store event if viewModel is not ready
  const rawEvent = useMemo(() => {
    if (!id) return null;
    return events.find((e) => e.id.toLowerCase() === id.toLowerCase()) || null;
  }, [events, id]);

  const event = viewModel || rawEvent;

  // Dialog states
  const [createCaseOpen, setCreateCaseOpen] = useState(false);
  const [dismissOpen, setDismissOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [vendorDataOpen, setVendorDataOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxFrame, setLightboxFrame] = useState(0);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  // Position control navigation
  const handlePrev = useCallback(() => {
    if (neighbors.hasPrev && neighbors.prevId) {
      navigate(`/events/${neighbors.prevId}`, { state: location.state });
    }
  }, [neighbors.hasPrev, neighbors.prevId, navigate, location.state]);

  const handleNext = useCallback(() => {
    if (neighbors.hasNext && neighbors.nextId) {
      navigate(`/events/${neighbors.nextId}`, { state: location.state });
    }
  }, [neighbors.hasNext, neighbors.nextId, navigate, location.state]);

  // Optimistic Acknowledge Action
  const handleAcknowledge = useCallback(async () => {
    if (!event || isAcknowledging) return;
    setIsAcknowledging(true);
    try {
      if (hookAcknowledge) {
        await hookAcknowledge();
      } else {
        acknowledgeEvent(event.id);
      }
      addToast('success', `Event ${event.id} acknowledged`);
    } catch (err: any) {
      addToast('error', err?.message || `Failed to acknowledge event ${event.id}`);
    } finally {
      setIsAcknowledging(false);
    }
  }, [event, isAcknowledging, hookAcknowledge, acknowledgeEvent, addToast]);

  // Keyboard navigation: J/K, Enter, Esc, E, C, ?
  // Shortcuts are active only when focus is outside inputs, selects, textareas, and dialogs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        (activeEl as HTMLElement)?.isContentEditable;

      const isDialogOpen = Boolean(
        createCaseOpen ||
        dismissOpen ||
        assignOpen ||
        shortcutsOpen ||
        lightboxOpen ||
        document.querySelector('[role="dialog"]') ||
        activeEl?.closest('[role="dialog"]')
      );

      // '?' opens shortcuts dialog
      if (e.key === '?' && !isInput && !isDialogOpen) {
        e.preventDefault();
        setShortcutsOpen((o) => !o);
        return;
      }

      // Guard: strictly ignore shortcuts when user is in input or dialog
      if (isInput || isDialogOpen) return;

      // J / ArrowRight: Next event in list context
      if (e.key === 'j' || e.key === 'ArrowRight') {
        if (neighbors.hasNext) {
          e.preventDefault();
          handleNext();
        }
        return;
      }

      // K / ArrowLeft: Previous event in list context
      if (e.key === 'k' || e.key === 'ArrowLeft') {
        if (neighbors.hasPrev) {
          e.preventDefault();
          handlePrev();
        }
        return;
      }

      // E: Acknowledge event (only when status is New)
      if (e.key === 'e' || e.key === 'E') {
        const currentStatus = (event as any)?.status || (event as any)?.state;
        if (currentStatus === 'New') {
          e.preventDefault();
          handleAcknowledge();
        }
        return;
      }

      // C: Create operational case
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setCreateCaseOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    event,
    neighbors.hasNext,
    neighbors.hasPrev,
    createCaseOpen,
    dismissOpen,
    assignOpen,
    shortcutsOpen,
    lightboxOpen,
    handleNext,
    handlePrev,
    handleAcknowledge,
  ]);

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center select-none">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <SearchX className="size-8" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-foreground">Event Dossier Not Found</h2>
          <p className="text-xs text-muted-foreground max-w-sm">
            Event ID <span className="font-mono font-semibold">{id}</span> does not exist in the active telemetry store.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/events')}
          className="border-border text-xs gap-1.5"
        >
          <ArrowLeft className="size-3.5" />
          <span>Return to Event Inbox</span>
        </Button>
      </div>
    );
  }

  const isUnack = (event as any).status === 'New' || (event as any).state === 'New';

  return (
    <div className={`flex flex-col min-h-screen bg-background text-foreground antialiased ${isPortrait ? 'pb-24' : 'pb-20 sm:pb-8'}`}>
      <main className="flex-1 flex flex-col p-4 sm:p-6 gap-6 max-w-[1920px] w-full mx-auto">
        {/* 1. Header (Breadcrumb, Title, Stepper, Dynamic SLA, Action Hierarchy) */}
        <EventDetailHeader
          event={event as any}
          isAcknowledging={isAcknowledging}
          onAcknowledge={handleAcknowledge}
          onOpenCreateCase={() => setCreateCaseOpen(true)}
          onOpenAssign={() => setAssignOpen(true)}
          onOpenResolve={() => setResolveOpen(true)}
          onOpenVendorData={() => setVendorDataOpen(true)}
        />

        {/* 2. Responsive Layout */}
        {isPortrait ? (
          /* Portrait Tablet Order: Evidence, Key Facts, Location (collapsible), Detection Spec, Alert History */
          <div className="flex flex-col gap-6">
            <EvidenceStudioCard
              event={event as any}
              onOpenLightbox={(frameIndex) => {
                setLightboxFrame(frameIndex);
                setLightboxOpen(true);
              }}
            />

            <KeyFactsCard
              event={event as any}
              onOpenCreateCase={() => setCreateCaseOpen(true)}
              onOpenAssign={() => setAssignOpen(true)}
            />

            <LocationCard event={event as any} defaultCollapsed={true} />

            <DetectionSpecificationCard event={event as any} />

            <AlertHistoryCard event={event as any} />
          </div>
        ) : (
          /* Landscape & Desktop: 2-Column Grid (~60% and ~40%) */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Main Column (60% on tablet, 66% on desktop) */}
            <div className="md:col-span-7 xl:col-span-8 flex flex-col gap-6">
              <EvidenceStudioCard
                event={event as any}
                onOpenLightbox={(frameIndex) => {
                  setLightboxFrame(frameIndex);
                  setLightboxOpen(true);
                }}
              />
              <DetectionSpecificationCard event={event as any} />
            </div>

            {/* Side Column (40% on tablet, 33% on desktop) */}
            <div className="md:col-span-5 xl:col-span-4 flex flex-col gap-6">
              <LocationCard event={event as any} defaultCollapsed={false} />
              <KeyFactsCard
                event={event as any}
                onOpenCreateCase={() => setCreateCaseOpen(true)}
                onOpenAssign={() => setAssignOpen(true)}
              />
              <AlertHistoryCard event={event as any} />
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Action Bar (<768px mobile or Portrait Tablet) */}
      <div className={`fixed bottom-0 inset-x-0 z-30 ${isPortrait ? 'flex' : 'flex md:hidden'} p-3 bg-card/95 backdrop-blur-md border-t border-border items-center justify-between gap-3 shadow-lg`}>
        {isUnack ? (
          <>
            {/* Primary Action when New: Acknowledge */}
            <Button
              size="sm"
              disabled={isAcknowledging}
              onClick={handleAcknowledge}
              className={`flex-1 ${isTablet ? 'h-[44px] text-sm' : 'h-9 text-xs'} bg-[#1D4ED8] dark:bg-primary hover:bg-[#1D4ED8]/90 dark:hover:bg-primary/90 text-white font-semibold gap-2 shadow-xs cursor-pointer`}
            >
              {isAcknowledging ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              <span>{isAcknowledging ? 'Acknowledging...' : 'Acknowledge'}</span>
            </Button>

            {/* Secondary Action when New: Create Case */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateCaseOpen(true)}
              className={`flex-1 ${isTablet ? 'h-[44px] text-sm' : 'h-9 text-xs'} border-border hover:bg-muted font-medium text-foreground gap-2 cursor-pointer`}
            >
              <Briefcase className="size-4 text-amber-500" />
              <span>Create Case</span>
            </Button>
          </>
        ) : (
          /* Primary Action when Acknowledged: Create Case */
          <Button
            size="sm"
            onClick={() => setCreateCaseOpen(true)}
            className={`flex-1 ${isTablet ? 'h-[44px] text-sm' : 'h-9 text-xs'} bg-[#1D4ED8] dark:bg-primary hover:bg-[#1D4ED8]/90 dark:hover:bg-primary/90 text-white font-semibold gap-2 shadow-xs cursor-pointer`}
          >
            <Briefcase className="size-4" />
            <span>Create Case</span>
          </Button>
        )}
      </div>

      {/* Action Dialogs */}
      <CreateCaseDialog
        open={createCaseOpen}
        onOpenChange={setCreateCaseOpen}
        event={event as any}
      />

      <DismissEventDialog
        open={dismissOpen}
        onOpenChange={setDismissOpen}
        event={event as any}
      />

      <AssignEventDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        event={event as any}
      />

      <ResolveEventDialog
        open={resolveOpen}
        onOpenChange={setResolveOpen}
        event={event as any}
      />

      <VendorDataDialog
        open={vendorDataOpen}
        onOpenChange={setVendorDataOpen}
        event={event as any}
      />

      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />

      <LightboxModal
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        event={event as any}
        initialFrameIndex={lightboxFrame}
      />
    </div>
  );
}
