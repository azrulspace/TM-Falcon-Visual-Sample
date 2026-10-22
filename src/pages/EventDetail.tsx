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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check, Briefcase, ArrowLeft, SearchX, Loader2 } from 'lucide-react';
import { OverviewTab } from '@/components/events/detail/OverviewTab';
import { TimelineTab } from '@/components/events/detail/TimelineTab';
import { RelatedEventsTab } from '@/components/events/detail/RelatedEventsTab';
import { RawVendorDataTab } from '@/components/events/detail/RawVendorDataTab';
import { LocationCard } from '@/components/events/detail/LocationCard';
import { KeyFactsCard } from '@/components/events/detail/KeyFactsCard';
import { RelatedSummaryCard } from '@/components/events/detail/RelatedSummaryCard';
import { CaseCard } from '@/components/events/detail/CaseCard';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { events, acknowledgeEvent } = useEvents();
  const { addToast } = useToast();

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
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased pb-20 sm:pb-8">
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

        {/* 2. Responsive 2-Column Grid (Main 8 of 12, Side 4 of 12) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Main Column (8 of 12) */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            {/* Evidence Card */}
            <EvidenceStudioCard
              event={event as any}
              onOpenLightbox={(frameIndex) => {
                setLightboxFrame(frameIndex);
                setLightboxOpen(true);
              }}
            />

            {/* Main Tabs (Detection, Raw Vendor Data, Timeline, Related Events) */}
            <div id="detail-tabs-section">
              <Tabs defaultValue="detection" className="w-full">
                <TabsList className="bg-muted/60 p-1 border border-border rounded-xl">
                  <TabsTrigger value="detection" className="text-xs font-medium">
                    Detection
                  </TabsTrigger>
                  <TabsTrigger value="vendor" className="text-xs font-medium">
                    Raw Vendor Data
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="text-xs font-medium">
                    Timeline ({(event as any).timeline?.length || 2})
                  </TabsTrigger>
                  <TabsTrigger value="related" className="text-xs font-medium">
                    Related Events
                  </TabsTrigger>
                </TabsList>

                {/* Tabs Content */}
                <TabsContent value="detection" className="pt-4">
                  <OverviewTab event={event as any} />
                </TabsContent>

                <TabsContent value="vendor" className="pt-4">
                  <RawVendorDataTab event={event as any} />
                </TabsContent>

                <TabsContent value="timeline" className="pt-4">
                  <TimelineTab event={event as any} />
                </TabsContent>

                <TabsContent value="related" className="pt-4">
                  <RelatedEventsTab event={event as any} />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Side Column (4 of 12) */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            <LocationCard event={event as any} />
            <KeyFactsCard
              event={event as any}
              onOpenCreateCase={() => setCreateCaseOpen(true)}
              onOpenAssign={() => setAssignOpen(true)}
            />
            <RelatedSummaryCard event={event as any} />
            <CaseCard event={event as any} />
          </div>
        </div>
      </main>

      {/* Sticky Bottom Action Bar (<768px mobile) with Action Hierarchy */}
      <div className="fixed bottom-0 inset-x-0 z-30 md:hidden p-3 bg-card/95 backdrop-blur-md border-t border-border flex items-center justify-between gap-2">
        {isUnack ? (
          <>
            {/* Primary Action when New: Acknowledge */}
            <Button
              size="sm"
              disabled={isAcknowledging}
              onClick={handleAcknowledge}
              className="flex-1 h-9 text-xs bg-[#1D4ED8] dark:bg-primary hover:bg-[#1D4ED8]/90 dark:hover:bg-primary/90 text-white font-semibold gap-1.5 shadow-xs cursor-pointer"
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
              className="flex-1 h-9 text-xs border-border hover:bg-muted font-medium text-foreground gap-1.5 cursor-pointer"
            >
              <Briefcase className="size-4" />
              <span>Create Case</span>
            </Button>
          </>
        ) : (
          /* Primary Action when Acknowledged: Create Case */
          <Button
            size="sm"
            onClick={() => setCreateCaseOpen(true)}
            className="flex-1 h-9 text-xs bg-[#1D4ED8] dark:bg-primary hover:bg-[#1D4ED8]/90 dark:hover:bg-primary/90 text-white font-semibold gap-1.5 shadow-xs cursor-pointer"
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
